
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { isCooldownActive, setCooldown, isQuotaExceededError, isMonthlyCapError, callAIWithRetry } from "../lib/quotaManager";
import { handleError, ErrorType, safeStringify, safeParse } from "../lib/errorHandler";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface SearchResult {
  name: string;
  symbol?: string;
  schemeCode?: string;
  currency?: string; // 'INR' or 'USD'
  category: 'Equity' | 'Hybrid' | 'Debt' | 'Gold' | 'Alternative' | 'Real Estate' | 'Cash';
  subCategory: string;
  sector?: string;
  fundHouse?: string;
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
}

// Persistent cache for search results
const SEARCH_CACHE_KEY = 'fin_search_cache';
const SEARCH_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getSearchCache(): Record<string, SearchResult[]> {
  try {
    const cached = localStorage.getItem(SEARCH_CACHE_KEY);
    if (!cached) return {};
    const { data, timestamp } = safeParse(cached, { data: {}, timestamp: 0 });
    if (Date.now() - timestamp > SEARCH_CACHE_DURATION) return {};
    return data;
  } catch {
    return {};
  }
}

function setSearchCache(query: string, results: SearchResult[]) {
  try {
    const cache = getSearchCache();
    cache[query.toLowerCase()] = results;
    localStorage.setItem(SEARCH_CACHE_KEY, safeStringify({ data: cache, timestamp: Date.now() }));
  } catch (e) {
    console.warn("Failed to save search cache:", e);
  }
}

/**
 * Searches for stocks or mutual funds based on a query string.
 */
export async function searchInvestments(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 3) return [];

  const cache = getSearchCache();
  if (cache[query.toLowerCase()]) {
    return cache[query.toLowerCase()];
  }

  if (isCooldownActive()) {
    return [];
  }

  // Hardcoded fallbacks
  if (query.toLowerCase().includes('suzlon')) {
    return [{
      name: 'Suzlon Energy Ltd',
      symbol: 'SUZLON.NS',
      category: 'Equity',
      subCategory: 'Mid Cap',
      sector: 'Renewable Energy'
    }];
  }

  try {
    const results: SearchResult[] = [];
    
    // 1. Try Mutual Fund Search (Free API)
    try {
      const mfResponse = await fetch(`/api/market/mf/search?q=${encodeURIComponent(query)}`);
      if (mfResponse.ok) {
        const mfData = await mfResponse.json();
        if (Array.isArray(mfData)) {
          mfData.slice(0, 5).forEach((item: any) => {
            results.push({
              name: item.schemeName,
              schemeCode: item.schemeCode.toString(),
              category: 'Equity', // Default, but better than nothing
              subCategory: 'Mutual Fund',
              currency: 'INR'
            });
          });
        }
      }
    } catch (e) {
      console.warn("MF Search API failed, will fallback to Gemini", e);
    }

    // 2. Try Stock Search (Yahoo Finance - Free)
    try {
      const stockResponse = await fetch(`/api/market/stock/search?q=${encodeURIComponent(query)}`);
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        if (stockData.quotes && Array.isArray(stockData.quotes)) {
          stockData.quotes.slice(0, 5).forEach((item: any) => {
            const isIndian = item.symbol?.endsWith('.NS') || item.symbol?.endsWith('.BO') || item.exchDisp === 'NSE' || item.exchDisp === 'BSE';
            results.push({
              name: item.shortname || item.longname || item.symbol,
              symbol: item.symbol,
              currency: isIndian ? 'INR' : 'USD',
              category: 'Equity',
              subCategory: item.typeDisp === 'Equity' ? 'Stock' : (item.typeDisp || 'Security'),
              sector: item.exchDisp || 'Equity Markets'
            });
          });
        }
      }
    } catch (e) {
      console.warn("Stock Search API failed, will fallback to Gemini", e);
    }

    // 3. Fallback to Gemini for structured categorization and if APIs returned nothing
    if (results.length === 0 || results.length < 3) {
      const prompt = `Search for Indian stocks (NSE/BSE), Global stocks (NYSE/NASDAQ), or Mutual Funds matching the query: "${query}".
      Return a list of up to 5 most relevant results.
      
      Instructions:
      1. For Indian stocks, include the NSE symbol (e.g., RELIANCE.NS) and currency 'INR'.
      2. For Global stocks, include the ticker symbol (e.g., AAPL) and currency 'USD'.
      3. For mutual funds, include the AMFI scheme code (e.g., 120503) and the Fund House (AMC) name (e.g., 'HDFC Mutual Fund', 'SBI Mutual Fund') and currency 'INR'.
      4. Categorize them as 'Equity', 'Hybrid', 'Debt', 'Gold', 'Alternative', 'Real Estate', or 'Cash'.
      5. Provide a specific sub-category (e.g., 'Equity Stocks', 'Equity Mutual Funds', 'Debt Mutual Funds', 'Fixed Deposits', 'SGB', 'REIT', 'InvIT', 'International Equity').
      6. Provide the sector for stocks (e.g., 'IT', 'Banking', 'Pharma', 'FMCG').
      7. Do NOT fetch returns or performance data for this search. Focus only on identifying the asset.`;

      const response = await callAIWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                symbol: { type: Type.STRING },
                schemeCode: { type: Type.STRING },
                currency: { type: Type.STRING, enum: ['INR', 'USD'] },
                category: { type: Type.STRING, enum: ['Equity', 'Hybrid', 'Debt', 'Gold', 'Alternative', 'Real Estate', 'Cash'] },
                subCategory: { type: Type.STRING },
                sector: { type: Type.STRING },
                fundHouse: { type: Type.STRING },
              },
              required: ['name', 'category', 'subCategory', 'currency'],
            },
          },
        },
      }));

      const aiResults = safeParse(response.text || '[]');
      // Merge with existing results, avoiding duplicates
      aiResults.forEach((ar: any) => {
        const exists = results.some(r => r.symbol === ar.symbol || r.schemeCode === ar.schemeCode);
        if (!exists) results.push(ar);
      });
    }

    setSearchCache(query, results);
    return results;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Search Error', silent: true });
    return [];
  }
}
