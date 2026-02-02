// prompts/financialAnalysisPromptStructured.ts
// คือรายการ วิเคราะห์เชิงลึก
export const createStructuredFinancialPrompt = (financialData: string) => {
    return `วิเคราะห์ข้อมูลการเงินและตอบเป็น JSON เท่านั้น:
  
  ${financialData}
  
  ตอบในรูปแบบ JSON:
  {
    "summary": {
      "healthScore": "ดี|ปานกลาง|ต้องปรับปรุง",
      "totalIncome": number,
      "totalExpense": number,
      "savingRate": number,
      "rule503020": {
        "needs": { "ideal": 50, "actual": number },
        "wants": { "ideal": 30, "actual": number },
        "savings": { "ideal": 20, "actual": number }
      }
    },
    "recommendations": {
      "monthlySaving": number,
      "monthlyInvestment": number,
      "emergencyFundTarget": number,
      "investmentTypes": ["string"]
    },
    "expensesToReduce": [
      { "category": "string", "amount": number, "percent": number, "targetReduction": number }
    ],
    "needExtraIncome": {
      "required": boolean,
      "suggestedAmount": number,
      "reason": "string"
    },
    "actionPlan": ["string"],
    "warnings": ["string"]
  }`;
  };