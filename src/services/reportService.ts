import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { PortfolioState } from "../types";
import { isQuotaExceededError, isMonthlyCapError, setCooldown, callAIWithRetry } from "../lib/quotaManager";

let ai: any = null;

const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY as string) });
  }
  return ai;
};

export interface AIAnalysisReport {
  marketOutlook: string;
  valuationAnalysis: string;
  liquiditySentiment: string;
  portfolioProjection: string;
  recommendations: string;
  auditSummary: string;
  timestamp: string;
}

export const generateAIDetailedAnalysis = async (portfolio: PortfolioState): Promise<AIAnalysisReport> => {
  const ai = getAI();
  
  // Prepare a compact version of the portfolio for the AI
  const compactPortfolio = {
    totalValue: portfolio.investments.reduce((sum, inv) => sum + inv.currentValue, 0),
    assetClasses: portfolio.investments.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + inv.currentValue;
      return acc;
    }, {} as Record<string, number>),
    investments: portfolio.investments.map(inv => ({
      name: inv.name,
      category: inv.category,
      currentValue: inv.currentValue,
      returns: { '1Y': inv.return1Y, '3Y': inv.return3Y, '5Y': inv.return5Y },
      audit: inv.auditInfo?.status || 'Unverified'
    })).slice(0, 50), // Limit to avoid token limit issues
    goals: portfolio.goals.map(g => ({ name: g.name, target: g.targetAmount, current: g.currentAmount }))
  };

  const prompt = `You are a Senior Wealth Architect at a global private wealth management firm. 
  Based on the following portfolio data, generate a comprehensive analysis report using best global practices.
  
  Portfolio Data:
  ${JSON.stringify(compactPortfolio, null, 2)}
  
  Current Market Data:
  Date: ${new Date().toLocaleDateString()}
  
  Please provide the report in JSON format with the following keys:
  1. "marketOutlook": Analysis of currently global and regional market scenarios and outlook for the next 12-24 months.
  2. "valuationAnalysis": Assessment of the portfolio's current valuation versus historical norms.
  3. "liquiditySentiment": Evaluation of asset liquidity and overall investor sentiment towards these asset classes.
  4. "portfolioProjection": Future value projections based on earnings expectations (conservative and aggressive scenarios).
  5. "recommendations": Specific strategic actions (rebalancing, sector shifts, etc.).
  6. "auditSummary": A summary of the data validation status based on the 'audit' field provided for assets.
  
  Ensure the tone is professional, institutional-grade, and avoids generic advice. Use specific market themes if applicable (e.g., AI growth, interest rate cycles, geopolitical shifts).`;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    })) as any;

    const report = JSON.parse(response.text || '{}');
    return {
      ...report,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("AI Report Generation Error:", error);
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    throw error;
  }
};
