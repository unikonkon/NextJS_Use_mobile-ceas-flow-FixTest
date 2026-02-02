// prompts/financialAnalysisPrompt.ts
// คือรายการ รายงานเต็ม (JSON แบบละเอียด)
export const createFinancialAnalysisPrompt = (financialData: string) => {
    return `คุณคือที่ปรึกษาการเงินส่วนบุคคลมืออาชีพ (Certified Financial Planner)
วิเคราะห์ข้อมูลการเงินต่อไปนี้อย่างละเอียดและให้คำแนะนำที่ปฏิบัติได้จริง

## ข้อมูลการเงิน:
${financialData}

ตอบในรูปแบบ JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON:
{
  "summary": {
    "healthScore": "ดี|ปานกลาง|ต้องปรับปรุง",
    "healthDescription": "string (อธิบายสุขภาพการเงินโดยรวม 1-2 ประโยค)",
    "totalIncome": number,
    "totalExpense": number,
    "balance": number,
    "savingRate": number,
    "incomeExpenseRatio": number,
    "rule503020": {
      "needs": { "ideal": 50, "actual": number, "amount": number, "status": "ดี|เกิน|ต่ำ" },
      "wants": { "ideal": 30, "actual": number, "amount": number, "status": "ดี|เกิน|ต่ำ" },
      "savings": { "ideal": 20, "actual": number, "amount": number, "status": "ดี|เกิน|ต่ำ" }
    }
  },
  "savingsAndInvestment": {
    "currentSavingRate": number,
    "recommendedSavingRate": number,
    "monthlySaving": number,
    "monthlyInvestment": number,
    "emergencyFundTarget": number,
    "emergencyFundMonths": number,
    "investmentTypes": [
      { "name": "string", "allocation": number, "reason": "string" }
    ]
  },
  "expensesToReduce": [
    {
      "rank": number,
      "category": "string",
      "amount": number,
      "percent": number,
      "targetReduction": number,
      "monthlySavings": number,
      "suggestion": "string"
    }
  ],
  "goodExpenses": [
    {
      "category": "string",
      "amount": number,
      "percent": number,
      "reason": "string"
    }
  ],
  "needExtraIncome": {
    "required": boolean,
    "suggestedAmount": number,
    "reason": "string",
    "suggestions": ["string"]
  },
  "actionPlan3Months": {
    "month1": [
      { "action": "string", "target": "string" }
    ],
    "month2": [
      { "action": "string", "target": "string" }
    ],
    "month3": [
      { "action": "string", "target": "string" }
    ]
  },
  "warnings": [
    { "level": "high|medium|low", "message": "string", "suggestion": "string" }
  ],
  "overallScore": number,
  "topRecommendation": "string"
}`;
};
