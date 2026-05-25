import { GoogleGenAI, Type } from "@google/genai";
import { handleError, ErrorType, safeStringify, safeParse } from "../lib/errorHandler";
import { getCooldownTimeLeft, isCooldownActive, setCooldown, isQuotaExceededError, isMonthlyCapError, sleep, callAIWithRetry } from "../lib/quotaManager";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getChatResponse = async (message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  if (isCooldownActive()) {
    const timeLeft = getCooldownTimeLeft();
    return `AI Analysis is currently in cooldown due to rate limits. Please try again in about ${timeLeft > 60 ? Math.ceil(timeLeft / 60) + ' minutes' : timeLeft + ' seconds'}.`;
  }
  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: "You are a Wealth Architect AI assistant for the 'Wealth Architect' application. Your goal is to help users with financial queries, explain app features, and solve any issues they might have. Be professional, premium, and helpful. Use your search tools to provide real-time accurate information when relevant.",
        tools: [{ googleSearch: {} }]
      },
    }));

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Chat Error' });
    return "I'm experiencing some technical difficulties. Please try again later.";
  }
};

export const getFinancialAdvice = async (portfolio: any, message: string) => {
  if (isCooldownActive()) {
    const timeLeft = getCooldownTimeLeft();
    return `AI Advisor is currently in cooldown. Re-activating in ${timeLeft > 60 ? Math.ceil(timeLeft / 60) + 'm' : timeLeft + 's'}.`;
  }
  try {
    const safeInvestments = portfolio?.investments || [];
    const safeGoals = portfolio?.goals || [];

    const minimalPortfolio = {
      investments: safeInvestments.map((inv: any) => ({
        name: inv.name,
        category: inv.category,
        currentValue: inv.currentValue,
        investedValue: inv.investedValue,
        price: inv.price,
        navDate: inv.navDate
      })),
      goals: safeGoals,
      riskProfile: portfolio?.riskProfile,
      summary: {
        totalValue: safeInvestments.reduce((sum: number, i: any) => sum + (i.currentValue || 0), 0)
      }
    };

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Portfolio Data: ${safeStringify(minimalPortfolio)}\n\nUser Query: ${message}`,
      config: {
        systemInstruction: "You are an expert financial advisor for Indian markets. Analyze the user's portfolio and provide strategic advice. Use real-time market data via Google Search to ground your advice in current reality. Keep advice professional, data-centric and actionable.",
        tools: [{ googleSearch: {} }]
      }
    }));
    return response.text;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'AI Advisor Error' });
    return "Failed to get advice.";
  }
};

export const getRebalancingAdvice = async (portfolio: any) => {
  return getFinancialAdvice(portfolio, "Suggest a rebalancing plan for my portfolio.");
};

export const getTopMarketRecommendations = async (portfolio: any) => {
  return getFinancialAdvice(portfolio, "Provide a comprehensive Market Strategy & Asset Allocation recommendation.");
};

export const getRiskBasedRebalancing = async (portfolio: any) => {
  return getFinancialAdvice(portfolio, "Analyze my current asset allocation against my risk profile and suggest rebalancing steps.");
};

export const getSIPRebalancingAdvice = async (portfolio: any) => {
  return getFinancialAdvice(portfolio, "Analyze my current SIP investments and suggest rebalancing.");
};

export const parseInvestmentFile = async (content: string, mimeType?: string) => {
  if (isCooldownActive()) {
    const timeLeft = getCooldownTimeLeft();
    handleError(new Error(`AI Analysis is currently in cooldown. Please wait ${timeLeft > 60 ? Math.ceil(timeLeft / 60) + ' minutes' : timeLeft + ' seconds'}.`), { type: ErrorType.API, title: 'Quota Limited', silent: false });
    return [];
  }
  try {
    const isBase64 = mimeType === 'application/pdf';
    const parts: any[] = [];

    if (isBase64) {
      parts.push({
        inlineData: {
          data: content,
          mimeType: 'application/pdf'
        }
      });
      parts.push({ text: "Analyze this Consolidated Account Statement (CAS), NSDL CAS, or investment report. Extract all investment holdings into a structured JSON array. Include Mutual Funds, Stocks (Equities), Bonds, and other assets. For NSDL CAS, look for the 'Statement of Holdings' section. Identify the category (Equity, Debt, Gold, etc.) and sub-category (Large Cap, Mid Cap, Liquid, etc.) accurately. IMPORTANT: If an asset is a Mutual Fund, ensure the sub-category includes the words 'Mutual Fund' and try to identify the Fund House (AMC). Identify the investor's name if present as 'investorName'." });
    } else {
      parts.push({ text: `Analyze this investment data (MIME: ${mimeType}):\n\n${content}\n\nExtract all investment holdings into a structured JSON array. Identify the category (Equity, Debt, Gold, etc.) and sub-category (Large Cap, Liquid, etc.) accurately. IMPORTANT: If an asset is a Mutual Fund, ensure the sub-category includes the words 'Mutual Fund' and try to identify the Fund House (AMC). Identify the investor's name if present as 'investorName'.` });
    }

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Full name of the investment/scheme" },
              category: { type: Type.STRING, description: "Equity, Debt, Gold, Hybrid, Alternative, Cash, Real Estate, or ESOP" },
              subCategory: { type: Type.STRING, description: "Detailed category like Large Cap, Mid Cap, PPF, SGB, etc." },
              currentValue: { type: Type.NUMBER, description: "Current market value of the holding" },
              investedValue: { type: Type.NUMBER, description: "Total amount invested / cost basis. If not explicitly found in the document, use the current market value as a fallback." },
              quantity: { type: Type.NUMBER, description: "Number of units or shares held" },
              price: { type: Type.NUMBER, description: "Current market price per unit" },
              buyPrice: { type: Type.NUMBER, description: "Average purchase price per unit" },
              folioNumber: { type: Type.STRING, description: "Folio number or account number if available" },
              symbol: { type: Type.STRING, description: "Stock symbol or ticker if available" },
              schemeCode: { type: Type.STRING, description: "Mutual fund scheme code if available" },
              fundHouse: { type: Type.STRING, description: "Name of the AMC or Fund House (e.g., HDFC Mutual Fund, SBI Mutual Fund)" },
              navDate: { type: Type.STRING, description: "The date of the NAV or price if available in the document, in YYYY-MM-DD format" },
              investorName: { type: Type.STRING, description: "Name of the investor or primary account holder if explicitly found on the document header or text" },
              needsClarification: { type: Type.BOOLEAN, description: "Set to true if data is ambiguous" },
              clarificationMessage: { type: Type.STRING, description: "Reason for clarification if needed" }
            },
            required: ["name", "category", "currentValue"]
          }
        }
      }
    }));
    return safeParse(response.text);
  } catch (error: any) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    const errorMessage = error?.message || "";
    if (errorMessage.includes("no pages") || errorMessage.includes("INVALID_ARGUMENT")) {
      handleError(new Error("The PDF document could not be read. This usually happens if the file is password-protected or empty. Please upload a version without a password."), { type: ErrorType.API, title: 'PDF Parsing Error' });
    } else {
      handleError(error, { type: ErrorType.API, title: 'File Parsing Error' });
    }
    return [];
  }
};

export const parseTransactionFile = async (content: string, mimeType?: string) => {
  if (isCooldownActive()) {
    handleError(new Error("AI Analysis is currently in cooldown due to rate limits. Please try again later."), { type: ErrorType.API, title: 'Quota Limited', silent: false });
    return [];
  }
  try {
    const isBase64 = mimeType === 'application/pdf';
    const parts: any[] = [];

    if (isBase64) {
      parts.push({
        inlineData: {
          data: content,
          mimeType: 'application/pdf'
        }
      });
      parts.push({ text: "Analyze this transaction statement (including NSDL CAS transaction summary). Extract all buy, sell, dividend, and interest transactions into a structured JSON array. Ensure dates are in YYYY-MM-DD format. Identify the investor's name if present as 'investorName'." });
    } else {
      parts.push({ text: `Analyze this transaction data (MIME: ${mimeType}):\n\n${content}\n\nExtract all buy, sell, dividend, and interest transactions into a structured JSON array. Ensure dates are in YYYY-MM-DD format. Identify the investor's name if present as 'investorName'.` });
    }

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Transaction date in YYYY-MM-DD format" },
              investmentName: { type: Type.STRING, description: "Name of the asset or security" },
              type: { type: Type.STRING, description: "Buy, Sell, Dividend, or Interest" },
              quantity: { type: Type.NUMBER, description: "Number of units or shares" },
              price: { type: Type.NUMBER, description: "Price per unit" },
              amount: { type: Type.NUMBER, description: "Total transaction value" },
              category: { type: Type.STRING, description: "Equity, Debt, Gold, etc." },
              description: { type: Type.STRING, description: "Original transaction description" },
              investorName: { type: Type.STRING, description: "Name of the investor or account holder if found on the document" },
              needsClarification: { type: Type.BOOLEAN },
              clarificationMessage: { type: Type.STRING }
            },
            required: ["date", "investmentName", "type", "amount"]
          }
        }
      }
    }));
    return safeParse(response.text);
  } catch (error: any) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    const errorMessage = error?.message || "";
    if (errorMessage.includes("no pages") || errorMessage.includes("INVALID_ARGUMENT")) {
      handleError(new Error("The PDF document could not be read. This usually happens if the file is password-protected or empty. Please upload a version without a password."), { type: ErrorType.API, title: 'PDF Parsing Error' });
    } else {
      handleError(error, { type: ErrorType.API, title: 'File Parsing Error' });
    }
    return [];
  }
};

export const getFinanceNews = async (force = false) => {
  if (isCooldownActive() && !force) return [];
  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Get the latest financial news relevant to an Indian investor, including stock market trends, policy changes, and significant global news affecting India. Return a JSON array of news items.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              url: { type: Type.STRING },
              category: { type: Type.STRING },
              date: { type: Type.STRING }
            }
          }
        }
      }
    }));
    return safeParse(response.text);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'News Fetching Error', silent: true });
    return [];
  }
};

export const getCachedNews = () => [];

let insightsCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_STALENESS_LIMIT = 30 * 60 * 1000; // 30 minutes

export const getPortfolioInsights = async (portfolio: any) => {
  if (isCooldownActive()) return null;
  
  const cacheKey = portfolio?.selectedMemberId || 'default';
  const cached = insightsCache[cacheKey];
  
  if (cached && Date.now() - cached.timestamp < CACHE_STALENESS_LIMIT) {
    return cached.data;
  }
  
  try {
    const safeInvestments = portfolio?.investments || [];
    const safeGoals = portfolio?.goals || [];

    // Only send essential data to the AI to reduce token usage and improve reliability
    // Trim excessively long investment lists if necessary, but prioritize diversity
    const sortedInvestments = [...safeInvestments].sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
    const topInvestments = sortedInvestments.slice(0, 40); // Send top 40 holdings to stay within limits

    const minimalPortfolio = {
      investments: topInvestments.map((inv: any) => ({
        name: inv.name,
        category: inv.category,
        subCategory: inv.subCategory,
        currentValue: inv.currentValue,
        investedValue: inv.investedValue,
        sector: inv.sector || 'Unknown',
        fundHouse: inv.fundHouse,
        symbol: inv.symbol
      })),
      goals: safeGoals.map((g: any) => ({
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate
      })),
      riskProfile: portfolio?.riskProfile || { type: 'Moderate' },
      summary: {
        totalValue: safeInvestments.reduce((sum: number, i: any) => sum + (i.currentValue || 0), 0),
        totalInvested: safeInvestments.reduce((sum: number, i: any) => sum + (i.investedValue || 0), 0),
        holdingCount: safeInvestments.length
      }
    };

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `Act as a Senior Wealth Strategist. Analyze this Indian investor's portfolio: ${safeStringify(minimalPortfolio)}. 
      Total Holdings: ${minimalPortfolio.summary.holdingCount}. Note: I have provided details for the top 40 holdings.
      
      Tasks:
      1. Provide a high-level global and Indian macro context.
      2. Identity 3-5 specific actionable insights (e.g., concentration risk, tax harvesting opportunities, sector rotation).
      3. Suggest asset allocation adjustments based on their ${minimalPortfolio.riskProfile.type} risk profile.
      4. Highlight 2-3 recent news events that directly impact their sectors or specific symbols.
      5. Identify critical vulnerabilities (e.g., lack of international exposure, high expense ratios, overlapping funds).

      You MUST respond with a valid JSON object matching the specified schema exactly. Do not include any text outside the JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            marketSummary: { type: Type.STRING, description: "A high-level global macro context summary" },
            actionableInsights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  parameter: { type: Type.STRING },
                  insight: { type: Type.STRING, description: "Clear strategic insight" },
                  action: { type: Type.STRING, description: "Recommended execution step" },
                  impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["parameter", "insight", "action", "impact"]
              }
            },
            assetAllocationSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  current: { type: Type.STRING },
                  suggested: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["category", "current", "suggested", "reason"]
              }
            },
            newsUpdates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impactOnPortfolio: { type: Type.STRING },
                  actionRequired: { type: Type.STRING }
                },
                required: ["title", "impactOnPortfolio", "actionRequired"]
              }
            },
            vulnerabilities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  risk: { type: Type.STRING },
                  severity: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  description: { type: Type.STRING },
                  remediation: { type: Type.STRING }
                },
                required: ["risk", "severity", "description", "remediation"]
              }
            }
          },
          required: ["marketSummary", "actionableInsights", "assetAllocationSuggestions", "newsUpdates", "vulnerabilities"]
        }
      }
    }));

    if (!response.text) {
      console.warn("Gemini returned empty text for portfolio insights.");
      return null;
    }
    
    let cleanedText = response.text.trim();
    // Remove potential markdown blocks if the model ignored responseMimeType
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    const data = safeParse(cleanedText);
    
    // Save to cache
    insightsCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
    
    return data;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Portfolio Insights Error' });
    return null;
  }
};

export const getCompositionRefinement = async (portfolio: any) => {
  if (isCooldownActive()) {
    const timeLeft = getCooldownTimeLeft();
    handleError(new Error(`Composition AI is cooling down. Ready in ${timeLeft}s.`), { type: ErrorType.API, title: 'Quota Limited', silent: false });
    return null;
  }
  try {
    const safeInvestments = portfolio?.investments || [];
    const minimalPortfolio = {
      investments: safeInvestments.map((inv: any) => ({
        name: inv.name,
        category: inv.category,
        subCategory: inv.subCategory,
        currentValue: inv.currentValue,
        investedValue: inv.investedValue,
        sector: inv.sector
      })),
      riskProfile: portfolio?.riskProfile,
    };

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a detailed portfolio composition refinement analysis: ${safeStringify(minimalPortfolio)}. 
      Compare against target allocations for their ${minimalPortfolio.riskProfile?.type || 'Moderate'} risk profile. 
      Suggest specific asset class movements (Buy/Sell) and provide a 'Refinement Score'.
      Ground suggestions in current Indian market conditions using Google Search.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinementScore: { type: Type.NUMBER, description: "0-100 score of how aligned the current portfolio is with the ideal composition" },
            executiveSummary: { type: Type.STRING },
            targetAllocation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  current: { type: Type.NUMBER, description: "Current percentage" },
                  target: { type: Type.NUMBER, description: "Target percentage" },
                  gap: { type: Type.NUMBER, description: "Percentage gap" }
                },
                required: ["category", "current", "target", "gap"]
              }
            },
            actionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  action: { type: Type.STRING, enum: ["Buy", "Sell", "Hold"] },
                  amount: { type: Type.NUMBER, description: "Suggested amount in INR to move" },
                  reasoning: { type: Type.STRING }
                },
                required: ["category", "action", "amount", "reasoning"]
              }
            },
            strategicDirectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["refinementScore", "executiveSummary", "targetAllocation", "actionPlan", "strategicDirectives"]
        }
      }
    }));
    return safeParse(response.text);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Composition Refinement Error' });
    return null;
  }
};

export const parseTaxDocument = async (content: string, mimeType?: string, docType?: string) => {
  if (isCooldownActive()) return null;
  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this ${docType} (MIME: ${mimeType}) and extract tax-relevant data as a JSON object.`,
      config: { responseMimeType: "application/json" }
    }));
    return safeParse(response.text);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Tax Document Parsing Error' });
    return null;
  }
};

export const getIPOAnalysis = async (ipoName: string) => {
  if (isCooldownActive()) return "Analysis unavailable due to rate limits.";
  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a detailed investment analysis for the IPO: ${ipoName}. Include company overview, key strengths, risks, valuation analysis, recent news, anchor investor data, and a 'Subscribe' or 'Avoid' recommendation for different investor profiles. Format as Markdown.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a senior equity research analyst specializing in Indian IPOs. Provide objective, data-driven analysis using live search data.",
      }
    }));
    return response.text;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'IPO Analysis Error' });
    return "Failed to get IPO analysis.";
  }
};

export const getUnlistedShareAnalysis = async (companyName: string) => {
  if (isCooldownActive()) return "Analysis unavailable due to rate limits.";
  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a detailed investment analysis for the unlisted company: ${companyName}. Include business model, market position, recent transaction unit prices in the grey market, latest valuation metrics (P/E, P/S), key investors, revenue/profit trends, and IPO timeline if available. Also include risks associated with unlisted shares liquidity. Format as Markdown.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a senior analyst specializing in pre-IPO and unlisted market equity. Provide comprehensive and data-backed analysis using live search data.",
      }
    }));
    return response.text;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Unlisted Share Analysis Error' });
    return "Failed to get unlisted share analysis.";
  }
};

export const getNFOAnalysis = async (nfoName: string) => {
  if (isCooldownActive()) return "Analysis unavailable due to rate limits.";
  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a detailed investment analysis for the New Fund Offer (NFO): ${nfoName}. Include fund objective, investment strategy, fund manager profile, peer comparison, recent fund house performance, and whether it adds value to an existing portfolio. Format as Markdown.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a senior mutual fund analyst. Provide objective and detailed analysis for new fund offerings using real-time search data.",
      }
    }));
    return response.text;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'NFO Analysis Error' });
    return "Failed to get NFO analysis.";
  }
};

export const getCalculatorRecommendation = async (calculatorType: string, inputs: any, results: any) => {
  if (isCooldownActive()) {
    const timeLeft = getCooldownTimeLeft();
    return `AI Analysis is currently in cooldown. Re-activating in ${timeLeft > 60 ? Math.ceil(timeLeft / 60) + 'm' : timeLeft + 's'}.`;
  }
  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Calculator Type: ${calculatorType}\nInputs: ${safeStringify(inputs)}\nResults: ${safeStringify(results)}`,
      config: {
        systemInstruction: "You are a Senior Financial Strategist. Analyze the provided calculator inputs and results. Provide 3-4 highly specific, actionable, and data-driven insights/recommendations for the user. Focus on tax efficiency, wealth maximization, or risk mitigation based on the calculator context. Keep it professional, concise (max 200 words), and prioritize the most impactful advice. Use points/bullets for readability.",
      }
    }));
    return response.text;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'AI Recommendation Error' });
    return "Failed to generate AI analysis.";
  }
};

export const getTaxInsights = async (force: boolean = false) => {
  if (isCooldownActive() && !force) return [];
  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Get the latest Indian tax insights, budget 2024-25 updates, recent CBDT circulars, and tax-saving strategies. Return a JSON array of insight items.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              category: { type: Type.STRING },
              date: { type: Type.STRING },
              url: { type: Type.STRING },
              impact: { type: Type.STRING }
            },
            required: ["title", "summary", "category", "date"]
          }
        }
      }
    }));
    return safeParse(response.text);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Tax Insights Error', silent: true });
    return [];
  }
};
