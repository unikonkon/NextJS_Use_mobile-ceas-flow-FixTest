import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createFinancialAnalysisPrompt } from "../prompts/financialAnalysisPrompt";
import { createStructuredFinancialPrompt } from "../prompts/financialAnalysisPromptStructured";

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const AI_DAILY_LIMIT = Math.max(1, parseInt(process.env.AI_DAILY_LIMIT ?? "2", 10) || 2);
const NEXT_PUBLIC_AI_DAILY_LIMIT = Math.max(
  1,
  parseInt(process.env.NEXT_PUBLIC_AI_DAILY_LIMIT ?? "2", 10) || 2
);

if (!API_KEY) {
  console.warn("Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export type PromptType = "structured" | "full";

const promptBuilders: Record<PromptType, (data: string) => string> = {
  structured: createStructuredFinancialPrompt,
  full: createFinancialAnalysisPrompt,
};

// In-memory rate limit: key = client IP, value = { date: YYYY-MM-DD, count: number }
const rateLimitStore = new Map<string, { date: string; count: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function checkRateLimit(ip: string): boolean {
  const today = getTodayKey();
  const entry = rateLimitStore.get(ip);
  if (!entry || entry.date !== today) return true;
  return entry.count < AI_DAILY_LIMIT;
}

function incrementRateLimit(ip: string): number {
  const today = getTodayKey();
  const entry = rateLimitStore.get(ip);
  if (!entry) {
    rateLimitStore.set(ip, { date: today, count: 1 });
    return AI_DAILY_LIMIT - 1;
  }
  if (entry.date !== today) {
    rateLimitStore.set(ip, { date: today, count: 1 });
    return AI_DAILY_LIMIT - 1;
  }
  entry.count += 1;
  return AI_DAILY_LIMIT - entry.count;
}

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  if (AI_DAILY_LIMIT !== NEXT_PUBLIC_AI_DAILY_LIMIT) {
    return NextResponse.json(
      {
        error:
          "ค่า api ใช้งานไม่ได้",
      },
      { status: 503 }
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: "ถึงจำนวนครั้งสูงสุดต่อวันแล้ว กรุณาลองใหม่พรุ่งนี้",
        limit: AI_DAILY_LIMIT,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { financialData, promptType } = body as {
      financialData: string;
      promptType?: string;
    };

    if (!financialData) {
      return NextResponse.json(
        { error: "financialData is required" },
        { status: 400 }
      );
    }

    if (promptType !== "structured" && promptType !== "full") {
      return NextResponse.json(
        { error: "promptType must be 'structured' or 'full'" },
        { status: 400 }
      );
    }

    const remaining = incrementRateLimit(ip);

    const buildPrompt = promptBuilders[promptType];
    const prompt = buildPrompt(financialData);

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          type: promptType,
          data: parsed,
          remaining,
        });
      }
    } catch {
      // JSON parse failed
    }

    return NextResponse.json({ type: "text", data: text, remaining });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
