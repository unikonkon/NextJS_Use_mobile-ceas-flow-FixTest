// prompts/financialAnalysisPromptCompact.ts
// คือรายการ สรุปย่อ
export const createCompactFinancialPrompt = (financialData: string) => {
    return `วิเคราะห์การเงินส่วนบุคคล:
  
  ${financialData}
  
  ตอบเป็นภาษาไทย วิเคราะห์:
  1. สุขภาพการเงิน (เทียบกฎ 50/30/20)
  2. อัตราการออมปัจจุบัน vs ที่ควรเป็น
  3. เงินที่ควรออม/ลงทุนต่อเดือน
  4. Top 5 หมวดที่ควรลด + เงินที่ประหยัดได้
  5. ต้องหารายได้เสริมไหม? (ใช่/ไม่ + เหตุผล)
  6. แผนปฏิบัติ 3 ข้อ
  
  ให้คำแนะนำ specific ตัวเลขชัดเจน`;
  };