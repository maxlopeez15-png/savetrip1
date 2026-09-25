export type InvestmentPlan = {
  id: string;
  name: string;
  illustrativeAnnualReturn: number;
  riskLevel: string;
  horizon: string;
  minimumContribution: number;
  fees: string;
  description: string;
  recommendedFor: string;
  accent: string;
};

export const INVESTMENT_PLANS: InvestmentPlan[] = [
  { id: "conservative", name: "Conservative", illustrativeAnnualReturn: 6, riskLevel: "Low", horizon: "1–3 years", minimumContribution: 500, fees: "No fee configured", description: "A lower-volatility allocation designed for steadier progress.", recommendedFor: "Users prioritizing lower volatility.", accent: "mint" },
  { id: "balanced", name: "Balanced", illustrativeAnnualReturn: 8, riskLevel: "Moderate", horizon: "3–7 years", minimumContribution: 500, fees: "No fee configured", description: "A factual middle-ground comparison between growth and volatility.", recommendedFor: "Users seeking a balance between growth and volatility.", accent: "blue" },
  { id: "growth", name: "Growth", illustrativeAnnualReturn: 10, riskLevel: "Moderate-High", horizon: "7–12 years", minimumContribution: 1000, fees: "No fee configured", description: "A longer-horizon option with more room for fluctuation.", recommendedFor: "Users with a longer investment horizon.", accent: "coral" },
  { id: "aggressive", name: "Aggressive", illustrativeAnnualReturn: 12, riskLevel: "High", horizon: "12+ years", minimumContribution: 1000, fees: "No fee configured", description: "A higher-volatility comparison for users comfortable with fluctuations.", recommendedFor: "Users comfortable with greater fluctuations.", accent: "gold" },
];

export const getInvestmentPlan = (id?: string) => INVESTMENT_PLANS.find((plan) => plan.id === id) ?? INVESTMENT_PLANS[1];

export const projectPlanValue = (current: number, monthly: number, months: number, annualReturn: number) => {
  const monthlyRate = annualReturn / 100 / 12;
  if (!monthlyRate) return current + monthly * months;
  return current * Math.pow(1 + monthlyRate, months) + monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
};
