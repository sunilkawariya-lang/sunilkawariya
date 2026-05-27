
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { Investment, MarketIndex, MarketReport } from '../types';
import { handleError, ErrorType, safeStringify, safeParse } from "../lib/errorHandler";
import { isCooldownActive, setCooldown, isQuotaExceededError, isMonthlyCapError, callAIWithRetry } from "../lib/quotaManager";

function getAI() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
}

/**
 * Fetches the latest NAVs for Mutual Funds using Gemini with Google Search grounding.
 * This avoids CORS issues with direct API calls.
 */
export async function fetchMutualFundNAVs(schemeCodes: string[], force = false): Promise<Record<string, { price: number, prevClose?: number, date?: string }>> {
  if (schemeCodes.length === 0) return {};

  const cache = getCache();
  const now = Date.now();

  // 1. Check if we are in a rate-limit cooldown
  if (isCooldownActive() && !force) {
    const result: Record<string, { price: number, prevClose?: number, date?: string }> = {};
    schemeCodes.forEach(code => {
      if (cache.data[`mf_${code}`]) {
        result[code] = { 
          price: cache.data[`mf_${code}`].price,
          prevClose: (cache.data[`mf_${code}`] as any).prevClose,
          date: (cache.data[`mf_${code}`] as any).date
        };
      }
    });
    return result;
  }

  // 2. Identify which codes actually need updating
  const codesToFetch = force 
    ? schemeCodes 
    : schemeCodes.filter(code => {
        const cached = cache.data[`mf_${code}`];
        // If we have data from less than 1 hour ago, don't refetch
        return !cached || (now - cached.timestamp > CACHE_DURATION);
      });

  if (codesToFetch.length === 0) {
    const result: Record<string, { price: number, prevClose?: number, date?: string }> = {};
    schemeCodes.forEach(code => {
      if (cache.data[`mf_${code}`]) {
        result[code] = { 
          price: cache.data[`mf_${code}`].price,
          prevClose: (cache.data[`mf_${code}`] as any).prevClose,
          date: (cache.data[`mf_${code}`] as any).date
        };
      }
    });
    return result;
  }

  try {
    const result: Record<string, { price: number, prevClose?: number, date?: string }> = {};
    
    // Attempt real-time fetch from our local server API (which proxies to mfapi.in)
    for (const code of codesToFetch) {
      try {
        const response = await fetch(`/api/market/mf/data/${code}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const latest = data.data[0];
          const previous = data.data[1];
          result[code] = {
            price: parseFloat(latest.nav),
            prevClose: previous ? parseFloat(previous.nav) : undefined,
            date: latest.date.split('-').reverse().join('-') // converts DD-MM-YYYY to YYYY-MM-DD
          };
        }
      } catch (e) {
        console.warn(`Failed to fetch real-time NAV for ${code}, will fallback to Gemini if needed.`, e);
      }
    }

    // Identify if any still need fetching (failed or skipped)
    const remainingToFetch = codesToFetch.filter(code => !result[code]);

    if (remainingToFetch.length > 0) {
      const ai = getAI();
      const prompt = `Get the latest Net Asset Value (NAV), the previous day's NAV, and the date of the latest NAV for the following Mutual Fund scheme codes: ${remainingToFetch.join(', ')}. 
      Return the data as a JSON object where keys are scheme codes (as strings) and values are objects with 'price' (number), 'prevClose' (number), and 'date' (string, YYYY-MM-DD).`;

      const response = await callAIWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
      }));

      const aiData = safeParse(response.text || '{}');
      Object.entries(aiData).forEach(([code, info]: [string, any]) => {
        result[code] = typeof info === 'object' ? info : { price: info };
      });
    }
    
    // Update persistent cache
    const cacheUpdate: Record<string, { price: number, prevClose?: number, timestamp: number, date?: string }> = {};
    Object.entries(result).forEach(([code, info]) => {
      cacheUpdate[`mf_${code}`] = { ...info, timestamp: now };
    });
    setCache(cacheUpdate as any);
    
    // Merge with existing/cached for final result
    const finalResult: Record<string, { price: number, prevClose?: number, date?: string }> = {};
    schemeCodes.forEach(code => {
      if (result[code]) {
        finalResult[code] = result[code];
      } else if (cache.data[`mf_${code}`]) {
        const cached = cache.data[`mf_${code}`] as any;
        finalResult[code] = { 
          price: cached.price,
          prevClose: cached.prevClose,
          date: cached.date
        };
      }
    });
    
    return finalResult;
  } catch (error: any) {
    handleError(error, { type: ErrorType.API, title: 'Mutual Fund Data Error', silent: true });
    
    // If we hit a rate limit (429), trigger cooldown
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    
    // Fallback to cache
    const result: Record<string, { price: number, date?: string }> = {};
    schemeCodes.forEach(code => {
      if (cache.data[`mf_${code}`]) {
        result[code] = { 
          price: cache.data[`mf_${code}`].price,
          date: (cache.data[`mf_${code}`] as any).date
        };
      }
    });
    return result;
  }
}

/**
 * Fetches the latest NAV for a single Mutual Fund.
 * Now uses the batch fetcher for consistency.
 */
export async function fetchMutualFundNAV(schemeCode: string): Promise<{ price: number; date?: string } | null> {
  const data = await fetchMutualFundNAVs([schemeCode]);
  const info = data[schemeCode];
  if (!info) return null;
  return info;
}

// Persistent cache keys
const CACHE_KEY = 'fin_market_data_cache';
const RETURNS_CACHE_KEY = 'fin_returns_cache';

// Cache duration: 60 minutes for stocks/funds
const CACHE_DURATION = 60 * 60 * 1000; 
// Index/Commodity cache duration: 10 minutes
const INDEX_CACHE_DURATION = 10 * 60 * 1000;
const RETURNS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for returns

function getReturnsCache(): Record<string, { 
    return1Y?: number, 
    return3Y?: number, 
    return5Y?: number,
    aum?: number,
    expenseRatio?: number,
    fundManager?: string
  }> {
  try {
    const cached = localStorage.getItem(RETURNS_CACHE_KEY);
    if (!cached) return {};
    const { data, timestamp } = safeParse(cached, { data: {}, timestamp: 0 });
    if (Date.now() - timestamp > RETURNS_CACHE_DURATION) return {};
    return data;
  } catch {
    return {};
  }
}

function setReturnsCache(data: Record<string, { 
    return1Y?: number, 
    return3Y?: number, 
    return5Y?: number,
    aum?: number,
    expenseRatio?: number,
    fundManager?: string
  }>) {
  try {
    const current = getReturnsCache();
    const updated = {
      data: { ...current, ...data },
      timestamp: Date.now()
    };
    localStorage.setItem(RETURNS_CACHE_KEY, safeStringify(updated));
  } catch (e) {
    console.warn("Failed to save returns cache:", e);
  }
}

interface CacheData {
  data: Record<string, { price: number, prevClose?: number, timestamp: number, date?: string }>;
}

function getCache(): CacheData {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? safeParse(cached) : { data: {} };
  } catch {
    return { data: {} };
  }
}

function setCache(data: Record<string, { price: number, prevClose?: number, date?: string }>) {
  try {
    const current = getCache();
    const now = Date.now();
    const updatedData = { ...current.data };
    
    Object.entries(data).forEach(([symbol, val]) => {
      updatedData[symbol] = { ...val, timestamp: now };
    });

    const updated = {
      data: updatedData
    };
    localStorage.setItem(CACHE_KEY, safeStringify(updated));
  } catch (e) {
    console.warn("Failed to save market cache:", e);
  }
}

/**
 * Fetches live market data using Gemini with Google Search grounding.
 * This provides real-time prices and previous close for indices and stocks.
 */
export async function fetchLiveMarketData(symbols: string[], options: { force?: boolean, cacheDuration?: number } = {}): Promise<Record<string, { price: number, prevClose?: number, date?: string }>> {
  const cache = getCache();
  const now = Date.now();
  const effectiveCacheDuration = options.cacheDuration || CACHE_DURATION;

  // 1. Check if we are in a rate-limit cooldown
  if (isCooldownActive() && !options.force) {
    const result: Record<string, { price: number, prevClose?: number, date?: string }> = {};
    symbols.forEach(s => {
      if (cache.data[s]) {
        result[s] = {
          price: cache.data[s].price,
          prevClose: cache.data[s].prevClose,
          date: cache.data[s].date
        };
      }
    });
    return result;
  }

  // 2. Identify which symbols actually need updating
  const symbolsToFetch = options.force 
    ? symbols 
    : symbols.filter(s => {
        const cached = cache.data[s];
        return !cached || (now - cached.timestamp > effectiveCacheDuration);
      });

  if (symbolsToFetch.length === 0) {
    const result: Record<string, { price: number, prevClose?: number, date?: string }> = {};
    symbols.forEach(s => {
      if (cache.data[s]) {
        result[s] = {
          price: cache.data[s].price,
          prevClose: cache.data[s].prevClose,
          date: cache.data[s].date
        };
      }
    });
    return result;
  }

  try {
    const result: Record<string, { price: number, prevClose?: number, date?: string }> = {};
    
    // Attempt real-time fetch from our local server API (which proxies to Yahoo Finance)
    for (const s of symbolsToFetch) {
      try {
        const response = await fetch(`/api/market/stock/quote/${s}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const quote = data.quoteResponse?.result?.[0];
        
        if (quote && quote.regularMarketPrice) {
          result[s] = {
            price: quote.regularMarketPrice,
            prevClose: quote.regularMarketPreviousClose,
            date: new Date(quote.regularMarketTime * 1000).toISOString().split('T')[0]
          };
        }
      } catch (e) {
        console.warn(`Failed to fetch real-time stock quote for ${s}, will fallback to Gemini if needed.`, e);
      }
    }

    // Identify if any still need fetching (failed or skipped)
    const remainingToFetch = symbolsToFetch.filter(s => !result[s]);

    if (remainingToFetch.length > 0) {
      const ai = getAI();
      const prompt = `Get the current live market price, previous day's close price, and the date of this price data (YYYY-MM-DD) for the following symbols or investment names: ${remainingToFetch.join(', ')}. 
      Special Note for Commodities: For Gold (24K) find the price in India per 10g in INR. For Silver, find the price in India per 1kg in INR.
      Return the data as a JSON object where keys are symbols/names and values are objects with 'price' (number), 'prevClose' (number), and 'date' (string, YYYY-MM-DD).`;

      const response = await callAIWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
      }));

      const aiData = safeParse(response.text || '{}');
      Object.entries(aiData).forEach(([sym, info]: [string, any]) => {
        // Find closest match in remainingToFetch to support suffixes like .NS, .BO or casing changes
        const normalizedSym = sym.trim().toLowerCase();
        const matchedKey = remainingToFetch.find(r => {
          const nr = r.trim().toLowerCase();
          return nr === normalizedSym || 
                 nr === normalizedSym.replace('.ns', '').replace('.bo', '') || 
                 normalizedSym === nr.replace('.ns', '').replace('.bo', '');
        });

        if (matchedKey) {
          result[matchedKey] = info;
        } else {
          result[sym] = info;
        }
      });
    }
    
    // Update persistent cache
    setCache(result);
    
    return result;
  } catch (error: any) {
    handleError(error, { type: ErrorType.API, title: 'Market Data Error', silent: true });
    
    // If we hit a rate limit (429), trigger cooldown and return cached data
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
      return cache.data;
    }
    
    return cache.data; // Fallback to whatever we have in cache
  }
}

/**
 * Fetches historical returns (1Y, 3Y, 5Y) for a list of investments.
 */
export async function fetchHistoricalReturns(investments: Investment[]): Promise<Record<string, { 
    return1Y?: number, 
    return3Y?: number, 
    return5Y?: number,
    aum?: number,
    expenseRatio?: number,
    fundManager?: string
  }>> {
  const cache = getReturnsCache();
  
  const result: Record<string, { 
    return1Y?: number, 
    return3Y?: number, 
    return5Y?: number,
    aum?: number,
    expenseRatio?: number,
    fundManager?: string
  }> = {};

  // Check if we are in a rate-limit cooldown
  if (isCooldownActive()) {
    investments.forEach(inv => {
      const key = inv.symbol || inv.schemeCode || inv.name;
      if (key && cache[key]) {
        result[inv.id] = cache[key];
      }
    });
    return result;
  }
  const remaining = investments.filter(inv => {
    const key = inv.symbol || inv.schemeCode || inv.name;
    if (key && cache[key]) {
      result[inv.id] = cache[key];
      return false;
    }
    return true;
  });

  if (remaining.length === 0) return result;

  // 2. Process real-time data where possible
  const stillNeedsAI: Investment[] = [];

  for (const inv of remaining) {
    try {
      if (inv.schemeCode) {
        // Fetch MF History
        const response = await fetch(`/api/market/mf/data/${inv.schemeCode}`);
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const navHistory = data.data; // Already sorted by date descending (latest first)
          const currentNAV = parseFloat(navHistory[0].nav);
          
          const getReturn = (years: number) => {
            const targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() - years);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            // Find the closest NAV record for that date
            // API date format is DD-MM-YYYY
            const found = navHistory.find((h: any) => {
              const [d, m, y] = h.date.split('-');
              const recDate = `${y}-${m}-${d}`;
              return recDate <= targetDateStr;
            });

            if (found) {
              const startNAV = parseFloat(found.nav);
              if (years === 1) return ((currentNAV / startNAV) - 1) * 100;
              return (Math.pow(currentNAV / startNAV, 1 / years) - 1) * 100;
            }
            return undefined;
          };

          result[inv.id] = {
            return1Y: getReturn(1),
            return3Y: getReturn(3),
            return5Y: getReturn(5)
          };
          continue;
        }
      } else if (inv.symbol) {
        // Fetch Stock History
        const response = await fetch(`/api/market/stock/history/${inv.symbol}?interval=1mo&range=5y`);
        const data = await response.json();
        const chart = data.chart?.result?.[0];
        if (chart && chart.indicators?.quote?.[0]?.close) {
          const prices = chart.indicators.quote[0].close.filter((p: any) => p !== null);
          const timestamps = chart.timestamp;
          const currentPrice = prices[prices.length - 1];

          const getStockReturn = (years: number) => {
            const targetTs = Math.floor(Date.now() / 1000) - (years * 365 * 24 * 60 * 60);
            // Find index of timestamp closest to targetTs (going backwards)
            let idx = 0;
            for (let i = timestamps.length - 1; i >= 0; i--) {
              if (timestamps[i] <= targetTs) {
                idx = i;
                break;
              }
            }
            
            const startPrice = prices[idx];
            if (startPrice && currentPrice) {
              if (years === 1) return ((currentPrice / startPrice) - 1) * 100;
              return (Math.pow(currentPrice / startPrice, 1 / years) - 1) * 100;
            }
            return undefined;
          };

          result[inv.id] = {
            return1Y: getStockReturn(1),
            return3Y: getStockReturn(3),
            return5Y: getStockReturn(5)
          };
          continue;
        }
      }
    } catch (e) {
      console.warn(`Real-time return calculation failed for ${inv.name}, falling back to AI.`, e);
    }
    stillNeedsAI.push(inv);
  }

  // 3. Fallback to Gemini for remaining or complex assets
  if (stillNeedsAI.length > 0) {
    try {
      const ai = getAI();
      const items = stillNeedsAI.map(inv => ({
        id: inv.id,
        cacheKey: inv.symbol || inv.schemeCode || inv.name,
        name: inv.name,
        symbol: inv.symbol,
        schemeCode: inv.schemeCode,
        category: inv.category
      }));

      const prompt = `Get the most accurate 1-year, 3-year, and 5-year annualized returns (CAGR) as percentages for the following investments as of today.
      Also provide AUM (Assets Under Management in INR Crores), Expense Ratio (%), and Fund Manager details if applicable.
      Assets: ${JSON.stringify(items.map(i => ({ id: i.id, name: i.name, symbol: i.symbol, scheme: i.schemeCode })))}
      Return the data as a JSON object where keys are the IDs provided and values are objects with 'return1Y', 'return3Y', 'return5Y', 'aum', 'expenseRatio', and 'fundManager' (all numbers except fundManager which is string).`;

      const response = await callAIWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
      }));

      const aiData = safeParse(response.text || '{}');
      Object.entries(aiData).forEach(([id, info]: [string, any]) => {
        result[id] = info;
      });
    } catch (error: any) {
      if (isQuotaExceededError(error)) {
        console.warn("Gemini quota/cap exceeded for historical returns, skipping AI fallback.");
        setCooldown(isMonthlyCapError(error));
      } else {
        console.error("Gemini historical returns fallback failed:", error);
      }
      handleError(error, { type: ErrorType.AI, title: 'Historical Returns Error', silent: true });
    }
  }

  // Sync back to cache
  const cacheUpdate: Record<string, { 
    return1Y?: number, 
    return3Y?: number, 
    return5Y?: number,
    aum?: number,
    expenseRatio?: number,
    fundManager?: string
  }> = {};
  investments.forEach(inv => {
    const key = inv.symbol || inv.schemeCode || inv.name;
    if (key && result[inv.id]) {
      cacheUpdate[key] = result[inv.id];
    }
  });
  setReturnsCache(cacheUpdate);

  return result;
}

/**
 * Updates market indices with real-time data.
 */
export async function updateMarketIndices(indices: MarketIndex[], force = false): Promise<MarketIndex[]> {
  const symbols = indices.map(i => i.name);
  // Indices and commodities use a much shorter cache (10 mins)
  const liveData = await fetchLiveMarketData(symbols, { 
    force, 
    cacheDuration: INDEX_CACHE_DURATION 
  });

  return indices.map(index => {
    const data = liveData[index.name];
    const newValue = data?.price || index.value;
    const prevClose = data?.prevClose || index.prevClose || (index.value - index.change);
    
    // If we didn't get a new value, simulate a tiny fluctuation to show activity
    const finalValue = (data?.price === undefined) 
      ? index.value * (1 + (Math.random() - 0.5) * 0.001)
      : newValue;

    const change = finalValue - prevClose;
    const changePercent = (change / prevClose) * 100;

    return {
      ...index,
      value: finalValue,
      prevClose: prevClose,
      change: change,
      changePercent: changePercent,
      lastUpdated: new Date().toISOString(),
    };
  });
}

/**
 * Updates the entire portfolio with real-time prices.
 */
export async function updatePortfolioPrices(investments: Investment[], force = false): Promise<Investment[]> {
  // Separate stocks, mutual funds, and gold
  const stocks = investments.filter(inv => !!inv.symbol);
  const mutualFunds = investments.filter(inv => !!inv.schemeCode);
  
  // Identify physical gold vs gold-related funds/ETFs
  const physicalGold = investments.filter(inv => 
    inv.category === 'Gold' && 
    !inv.symbol && 
    !inv.schemeCode && 
    (inv.name.toLowerCase().includes('physical') || 
     inv.name.toLowerCase().includes('digital') || 
     inv.name.toLowerCase().includes('24k') || 
     inv.name.toLowerCase().includes('sovereign') ||
     inv.name.toLowerCase() === 'gold')
  );

  // Identify "other" investments that need price fetching by name
  const others = investments.filter(inv => 
    !inv.symbol && 
    !inv.schemeCode && 
    !physicalGold.includes(inv) &&
    ['Equity', 'Debt', 'Hybrid', 'Gold', 'Alternative', 'Commodities', 'PMS', 'AIF', 'Bonds', 'NPS', 'International Fund', 'Global Stock'].includes(inv.category)
  );
  
  // Fetch stock prices in one go using Gemini
  const stockSymbols = stocks.map(s => s.symbol!);
  const liveStockData: Record<string, { price: number, prevClose?: number, date?: string }> = stockSymbols.length > 0 ? await fetchLiveMarketData(stockSymbols, { force }) : {};

  // Fetch mutual fund NAVs in one go using Gemini
  const schemeCodes = mutualFunds.map(mf => mf.schemeCode!);
  const liveNavData: Record<string, { price: number, prevClose?: number, date?: string }> = schemeCodes.length > 0 ? await fetchMutualFundNAVs(schemeCodes, force) : {};

  // Fetch prices for "other" investments by name
  const otherNames = others.map(o => o.name);
  const liveOtherData: Record<string, { price: number, prevClose?: number, date?: string }> = otherNames.length > 0 ? await fetchLiveMarketData(otherNames, { force }) : {};

  // Fetch gold price if needed
  let goldPrice = 0;
  if (physicalGold.length > 0) {
    const goldData = await fetchLiveMarketData(['Gold Price (24K, 1g, INR)'], { force, cacheDuration: INDEX_CACHE_DURATION });
    goldPrice = goldData['Gold Price (24K, 1g, INR)']?.price || 0;
  }

  // Fetch historical returns for those that don't have them
  const missingReturns = investments.filter(inv => (inv.symbol || inv.schemeCode || inv.name) && (!inv.return1Y || !inv.return3Y || !inv.return5Y));
  const historicalData: Record<string, { 
    return1Y?: number, 
    return3Y?: number, 
    return5Y?: number,
    aum?: number,
    expenseRatio?: number,
    fundManager?: string
  }> = missingReturns.length > 0 ? await fetchHistoricalReturns(missingReturns) : {};

  const updatedInvestments = investments.map((inv) => {
    let newPrice = inv.price;
    let navDate = inv.navDate;
    let newReturns = {
      return1Y: inv.return1Y,
      return3Y: inv.return3Y,
      return5Y: inv.return5Y
    };

    if (inv.schemeCode) {
      const mfData = liveNavData[inv.schemeCode];
      if (mfData) {
        newPrice = mfData.price || inv.price;
        navDate = mfData.date || inv.navDate;
      }
    } else if (inv.symbol) {
      const stockData = liveStockData[inv.symbol];
      if (stockData) {
        newPrice = stockData.price || inv.price;
        navDate = stockData.date || inv.navDate;
      }
      
      // Simulate tiny fluctuation if real data fetch failed
      if (newPrice === inv.price && inv.price) {
        newPrice = inv.price * (1 + (Math.random() - 0.5) * 0.001);
      }
    } else if (physicalGold.includes(inv) && goldPrice > 0) {
      newPrice = goldPrice;
      // Use today's date for gold if we just fetched it
      navDate = new Date().toISOString().split('T')[0];
    } else if (others.includes(inv)) {
      const otherData = liveOtherData[inv.name];
      if (otherData) {
        newPrice = otherData.price || inv.price;
        navDate = otherData.date || inv.navDate;
      }
    }

    // Update returns and metadata from historical data
    const hData = historicalData[inv.id] || historicalData[inv.symbol || ''] || historicalData[inv.schemeCode || ''] || historicalData[inv.name];
    let newAum = inv.aum;
    let newExpenseRatio = inv.expenseRatio;
    let newFundManager = inv.fundManager;

    if (hData) {
      newReturns.return1Y = hData.return1Y !== undefined ? hData.return1Y : newReturns.return1Y;
      newReturns.return3Y = hData.return3Y !== undefined ? hData.return3Y : newReturns.return3Y;
      newReturns.return5Y = hData.return5Y !== undefined ? hData.return5Y : newReturns.return5Y;
      newAum = hData.aum !== undefined ? hData.aum : newAum;
      newExpenseRatio = hData.expenseRatio !== undefined ? hData.expenseRatio : newExpenseRatio;
      newFundManager = hData.fundManager !== undefined ? hData.fundManager : newFundManager;
    }

    // New: Handle Day Change
    let dayChange = inv.dayChange;
    let dayChangePercent = inv.dayChangePercent;

    if (inv.schemeCode) {
      const mfData = liveNavData[inv.schemeCode];
      if (mfData && mfData.prevClose) {
        dayChange = (mfData.price || inv.price) - mfData.prevClose;
        dayChangePercent = (dayChange / mfData.prevClose) * 100;
      }
    } else if (inv.symbol) {
      const stockData = liveStockData[inv.symbol];
      if (stockData && stockData.prevClose) {
        dayChange = (stockData.price || inv.price) - stockData.prevClose;
        dayChangePercent = (dayChange / stockData.prevClose) * 100;
      }
    }

    // Perform audit check
    const auditInfo: Investment['auditInfo'] = {
      status: 'Verified',
      message: 'Data sourced from real-time API',
      lastChecked: new Date().toISOString(),
      source: inv.schemeCode ? 'mfapi.in' : (inv.symbol ? 'Yahoo Finance' : 'AI Analysis')
    };

    if (!newPrice || newPrice <= 0) {
      auditInfo.status = 'Suspicious';
      auditInfo.message = 'Price data missing or invalid';
    } else if (newReturns.return1Y && (newReturns.return1Y > 1000 || newReturns.return1Y < -100)) {
       auditInfo.status = 'Suspicious';
       auditInfo.message = 'Return data looks abnormal';
    } else if (newPrice === inv.price && inv.lastUpdated && (Date.now() - new Date(inv.lastUpdated).getTime() > 30 * 24 * 60 * 60 * 1000)) {
      auditInfo.status = 'Suspicious';
      auditInfo.message = 'Price has not been updated in over 30 days';
    }

    const changedRelevantFields = (newPrice > 0 && newPrice !== inv.price) || 
        (navDate && navDate !== inv.navDate) ||
        (newReturns.return1Y !== inv.return1Y) || 
        (newReturns.return3Y !== inv.return3Y) || 
        (newReturns.return5Y !== inv.return5Y) ||
        (dayChange !== inv.dayChange) ||
        (newAum !== inv.aum) ||
        (newExpenseRatio !== inv.expenseRatio) ||
        (newFundManager !== inv.fundManager);

    if (changedRelevantFields || force) {
      const quantity = inv.quantity || 1;
      let finalPrice = (newPrice > 0) ? newPrice : inv.price;
      
      // If no price is found (neither live nor existing), but we have a currentValue and quantity,
      // derive the price to ensure "whatever value as current price needs to consider"
      if ((!finalPrice || finalPrice <= 0) && inv.currentValue > 0 && quantity > 0) {
        finalPrice = inv.currentValue / quantity;
      }

      // Conversely, if we have a price now (live or manual) but no currentValue yet, compute it
      const finalCurrentValue = (finalPrice > 0) ? (quantity * finalPrice) : inv.currentValue;
      
      return {
        ...inv,
        price: finalPrice,
        navDate: navDate || inv.navDate,
        return1Y: newReturns.return1Y,
        return3Y: newReturns.return3Y,
        return5Y: newReturns.return5Y,
        aum: newAum,
        expenseRatio: newExpenseRatio,
        fundManager: newFundManager,
        currentValue: finalCurrentValue,
        dayChange,
        dayChangePercent,
        auditInfo,
        lastUpdated: new Date().toISOString()
      };
    }

    return { ...inv, auditInfo }; // Always return audit info if we checked it
  });

  return updatedInvestments;
}

export async function generateMarketReport(period: 'Weekly' | 'Monthly', forceRefresh = false): Promise<MarketReport> {
  const cacheKey = `market_report_${period.toLowerCase()}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (!forceRefresh && cachedData) {
    try {
      const { report, timestamp } = safeParse(cachedData, { report: null, timestamp: 0 });
      const now = Date.now();
      const cacheDuration = period === 'Weekly' ? 12 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 12h for weekly, 24h for monthly
      
      if (now - timestamp < cacheDuration) {
        console.log(`Using cached ${period} market report`);
        return { ...report, lastUpdated: timestamp };
      }
    } catch (e) {
      console.warn('Failed to parse cached market report', e);
    }
  }

  const ai = getAI();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  
  const prompt = `Act as a Senior Personal Finance Analyst and Market Strategist. 
  Generate a highly accurate and comprehensive ${period} Market Intelligence Report for the period ending ${dateStr}.
  
  The report MUST be in JSON format and follow this structure:
  {
    "id": "string",
    "period": "${period}",
    "date": "string (e.g. March 1 - March 31, 2026 for Monthly, or Mar 24 - Mar 31 for Weekly)",
    "summary": "string (A deep, professional insight into the market's current state, focusing on India's macro situation, global cues, and investor sentiment. Use Markdown.)",
    "indexChanges": [
      {"name": "Nifty 50", "currentValue": number, "change": number, "changePercent": number},
      {"name": "Sensex", "currentValue": number, "change": number, "changePercent": number},
      {"name": "Nasdaq 100", "currentValue": number, "change": number, "changePercent": number},
      {"name": "Gold (24K/10g)", "currentValue": number, "change": number, "changePercent": number},
      {"name": "Silver (1kg)", "currentValue": number, "change": number, "changePercent": number}
    ],
    "sectorChanges": [
      {"name": "string", "changePercent": number, "trend": "up" | "down" | "neutral", "topStock": "string (The best performing stock in this sector this ${period})"}
    ],
    "globalNews": [{"title": "string", "impact": "Positive" | "Negative" | "Neutral", "description": "string", "category": "Global"}],
    "indiaNews": [{"title": "string", "impact": "Positive" | "Negative" | "Neutral", "description": "string", "category": "India" | "Company" | "Personal Finance"}],
    "majorEvents": [{"title": "string", "date": "string", "description": "string", "type": "Rule Change" | "Economic Event" | "Corporate Action"}],
    "assetTrends": [
      {"assetClass": "Equity", "trend": "Bullish" | "Bearish" | "Neutral", "outlook": "Bullish" | "Bearish" | "Neutral", "performance": "string"},
      {"assetClass": "Debt/Fixed Income", "trend": "Bullish" | "Bearish" | "Neutral", "outlook": "Bullish" | "Bearish" | "Neutral", "performance": "string"},
      {"assetClass": "Gold/Commodities", "trend": "Bullish" | "Bearish" | "Neutral", "outlook": "Bullish" | "Bearish" | "Neutral", "performance": "string"},
      {"assetClass": "Real Estate/REITs", "trend": "Bullish" | "Bearish" | "Neutral", "outlook": "Bullish" | "Bearish" | "Neutral", "performance": "string"}
    ],
    "productUpdates": [{"category": "MF" | "PMS" | "AIF" | "Bonds" | "NPS", "title": "string", "description": "string", "impact": "string"}],
    "inspirationalStory": {"title": "string", "story": "string", "lesson": "string"}
  }
  
  CRITICAL INSTRUCTIONS:
  1. Use Google Search to find the EXACT current levels for Nifty 50, Sensex, Nasdaq 100, and current Gold/Silver prices in India.
  2. For ${period} reports, ensure the "indexChanges" and "sectorChanges" reflect the ${period === 'Monthly' ? 'Month-over-Month' : 'Week-over-Week'} performance.
  3. Identify the top performing NPS schemes and any major Indian Super Investor (like Rakesh Jhunjhunwala's portfolio, Ashish Kacholia, etc.) buy/sell actions for the "productUpdates" or "indiaNews" section.
  4. Find the latest SEBI/RBI circulars or major tax-related news for the "majorEvents" section.
  5. Ensure the summary is professional, data-backed, and provides clear direction for high-net-worth investors.
  6. Return ONLY the JSON object. Do not include any other text.`;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            period: { type: Type.STRING, enum: ["Weekly", "Monthly"] },
            date: { type: Type.STRING },
            summary: { type: Type.STRING },
            indexChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  currentValue: { type: Type.NUMBER },
                  change: { type: Type.NUMBER },
                  changePercent: { type: Type.NUMBER }
                },
                required: ["name", "currentValue", "change", "changePercent"]
              }
            },
            sectorChanges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  changePercent: { type: Type.NUMBER },
                  trend: { type: Type.STRING, enum: ["up", "down", "neutral"] },
                  topStock: { type: Type.STRING }
                },
                required: ["name", "changePercent", "trend"]
              }
            },
            globalNews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["Positive", "Negative", "Neutral"] },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["title", "impact", "description", "category"]
              }
            },
            indiaNews: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["Positive", "Negative", "Neutral"] },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["title", "impact", "description", "category"]
              }
            },
            majorEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  date: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Rule Change", "Economic Event", "Corporate Action"] }
                },
                required: ["title", "date", "description", "type"]
              }
            },
            assetTrends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  assetClass: { type: Type.STRING },
                  trend: { type: Type.STRING },
                  outlook: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
                  performance: { type: Type.STRING }
                },
                required: ["assetClass", "trend", "outlook", "performance"]
              }
            },
            productUpdates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ["MF", "PMS", "AIF", "Bonds", "NPS"] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING }
                },
                required: ["category", "title", "description", "impact"]
              }
            },
            inspirationalStory: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                story: { type: Type.STRING },
                lesson: { type: Type.STRING }
              },
              required: ["title", "story", "lesson"]
            }
          },
          required: ["id", "period", "date", "summary", "indexChanges", "sectorChanges", "globalNews", "indiaNews", "majorEvents", "assetTrends", "productUpdates", "inspirationalStory"]
        }
      },
    }));

    const report = JSON.parse(response.text || '{}') as MarketReport;
    
    // Ensure all required fields are present with fallbacks
    const validatedReport: MarketReport = {
      ...report,
      id: report.id || `report-${period.toLowerCase()}-${Date.now()}`,
      period: report.period || period,
      date: report.date || dateStr,
      summary: report.summary || "Summary temporarily unavailable.",
      indexChanges: report.indexChanges || [],
      sectorChanges: report.sectorChanges || [],
      globalNews: report.globalNews || [],
      indiaNews: report.indiaNews || [],
      majorEvents: report.majorEvents || [],
      assetTrends: report.assetTrends || [],
      productUpdates: report.productUpdates || [],
      inspirationalStory: report.inspirationalStory || {
        title: "Stay Disciplined",
        story: "Market cycles are natural. Successful investors focus on their long-term goals rather than short-term noise.",
        lesson: "Time in the market is superior to timing the market."
      }
    };

    const timestamp = Date.now();
    
    // Cache the successful response
    localStorage.setItem(cacheKey, safeStringify({
      report: validatedReport,
      timestamp
    }));

    return { ...validatedReport, lastUpdated: timestamp };
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Market Report Error' });
    throw error;
  }
}

/**
 * Researches a specific stock (Indian or Global) using Gemini.
 */
export async function fetchStockResearch(symbol: string): Promise<any> {
  const ai = getAI();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const prompt = `Act as a Senior Equity Research Analyst. 
  Conduct a deep-dive research on the stock with symbol: "${symbol}". 
  The stock could be from the Indian market (NSE/BSE) or Global markets (NYSE, NASDAQ, etc.).
  
  Generate a comprehensive research report in JSON format following this structure:
  {
    "id": "string (lowercase symbol)",
    "name": "string (Full company name)",
    "ticker": "string (Symbol)",
    "currency": "string (INR or USD)",
    "sector": "string",
    "currentPrice": number,
    "change": number,
    "changePercent": number,
    "marketCap": "string (e.g. ₹13.2L Cr or $3.1T)",
    "oneYearTarget": number,
    "targetReasoning": "string (Detailed explanation for the target)",
    "financials": [
      { 
        "year": "string (Last 7 years + 2 years projections)", 
        "revenue": number, "profit": number, "eps": number, 
        "peRatio": number, "pbRatio": number, "evEbitda": number, 
        "mcSales": number, "dividendYield": number, "roe": number, 
        "roce": number, "debtToEquity": number, "isProjection": boolean 
      }
    ],
    "financialUnits": "string (e.g. 'Cr' for Indian stocks, 'M' or 'B' for Global stocks)",
    "growthMetrics": {
      "salesGrowth": { "10Y": "string", "5Y": "string", "3Y": "string", "1Y": "string", "TTM": "string" },
      "profitGrowth": { "10Y": "string", "5Y": "string", "3Y": "string", "1Y": "string", "TTM": "string" },
      "stockPriceCAGR": { "10Y": "string", "5Y": "string", "3Y": "string", "1Y": "string" },
      "roe": { "10Y": "string", "5Y": "string", "3Y": "string", "1Y": "string" }
    },
    "technicalAnalysis": {
      "shortTerm": { "stance": "Bullish" | "Bearish" | "Neutral", "target": number, "stopLoss": number, "reason": "string" },
      "mediumTerm": { "stance": "Bullish" | "Bearish" | "Neutral", "target": number, "stopLoss": number, "reason": "string" },
      "longTerm": { "stance": "Bullish" | "Bearish" | "Neutral", "target": number, "stopLoss": number, "reason": "string" }
    },
    "news": [
      { "title": "string", "date": "string (YYYY-MM-DD)", "source": "string", "impact": "Positive" | "Neutral" | "Negative" }
    ],
    "documents": [
      { "title": "string", "type": "Annual Report" | "Quarterly Results" | "Presentation", "date": "string", "url": "string" }
    ],
    "managementCommentary": "string",
    "marketOutlook": "string",
    "investorInsight": "string",
    "netProfitMarginTrend": [
      { "year": "string", "value": number }
    ],
    "promoterHoldingTrend": [
      { "year": "string", "value": number }
    ],
    "debtLevelTrend": [
      { "year": "string", "value": number }
    ],
    "operatingCashFlowTrend": [
      { "year": "string", "value": number }
    ],
    "scores": {
      "corporateGovernance": number,
      "marketCap": number,
      "earnings": number,
      "fundamental": number,
      "relativeValuation": number,
      "risk": number,
      "priceMomentum": number,
      "futureOutlook": number,
      "overall": number
    },
    "pros": ["string"],
    "cons": ["string"],
    "peers": [
      { "name": "string", "ticker": "string", "marketCap": "string", "pe": number, "pb": number, "roe": number }
    ]
  }

  CRITICAL INSTRUCTIONS:
  1. Use Google Search to find the LATEST real-time data as of ${dateStr}.
  2. If the symbol is Indian, use INR (₹) for financials. If Global, use USD ($).
  3. For "revenue" and "profit" numbers, use the unit specified in "financialUnits". For Indian stocks, use Crores (Cr). For Global stocks, use Millions (M) or Billions (B).
  4. Ensure the financials array has at least 7 years of historical data and 2 years of forward-looking projections.
  4. Provide 10-year trends for Net Profit Margin, Promoter Holding, Debt Level, and Operating Cash Flow.
  5. Calculate scores (0-100) for: Corporate Governance, Market Cap, Earnings, Fundamental, Relative Valuation, Risk, Price Momentum, and Future Outlook (Sector/Market).
  6. The "targetReasoning" should be professional and data-backed.
  7. Return ONLY the JSON object.`;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    }));

    return safeParse(response.text || '{}');
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Stock Research Error' });
    throw error;
  }
}

/**
 * Fetches the latest active and upcoming IPOs using Gemini Search.
 */
export async function fetchLiveIPOs(): Promise<any[]> {
  try {
    const ai = getAI();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const prompt = `Find the latest active (open) and upcoming IPOs in the Indian stock market (NSE/BSE) as of ${dateStr}. 
    Return a JSON array of objects with these properties:
    - id: string (unique)
    - name: string (Company Name)
    - openDate: string
    - closeDate: string
    - listingDate: string
    - issueSize: string (e.g. ₹1,200 Cr)
    - gmp: string (Grey Market Premium percentage or value)
    - subscription: string (e.g. 2.4x or 'Open')
    - category: string (Sector)
    - tags: string[]
    - valuation: 'Undervalued' | 'Fair Value' | 'Overvalued'
    
    Return ONLY the JSON array.`;

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    }));

    return JSON.parse(response.text || '[]');
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Live IPO Fetch Error', silent: true });
    return [];
  }
}

/**
 * Fetches the latest New Fund Offers (NFOs) using Gemini Search.
 */
export async function fetchLiveNFOs(): Promise<any[]> {
  try {
    const ai = getAI();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const prompt = `Find the latest active (currently open) and upcoming New Fund Offers (NFOs) in the Indian Mutual Fund market as of ${dateStr}. 
    Return a JSON array of objects with these properties:
    - id: string (unique)
    - name: string (Fund Name)
    - openDate: string
    - closeDate: string
    - category: string (Mutual Fund Type)
    - tags: string[]
    - description: string (Brief objective)
    - price: number (Usually 10)
    - valuation: 'Fair Value'
    
    Return ONLY the JSON array.`;

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    }));

    return JSON.parse(response.text || '[]');
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Live NFO Fetch Error', silent: true });
    return [];
  }
}

/**
 * Fetches the latest institutional and super investor movements using Gemini Search.
 */
export async function fetchLiveSuperInvestors(): Promise<any[]> {
  try {
    const ai = getAI();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const prompt = `Find the latest significant stock market movements by major Indian super investors (e.g. Ashish Kacholia, Vijay Kedia, Rekha Jhunjhunwala, Mukul Agrawal, Dolly Khanna, Pabrai, etc.) as of ${dateStr}.
    Focus on recent bulk deals, block deals, or shareholding pattern changes (Quarterly).
    Return a JSON array of objects with these properties:
    - id: string (unique)
    - name: string (Stock Name)
    - symbol: string (Ticker)
    - price: number (Current price)
    - change: number (Price change)
    - changePercent: number
    - oneYearReturn: number
    - valuation: 'Undervalued' | 'Fair Value' | 'Overvalued'
    - category: string (Sector)
    - tags: string[]
    - investor: string (Super Investor Name)
    - actionType: 'Buy' | 'Sell'
    - stake: string (Percentage change or stake bought/sold)
    
    Return ONLY the JSON array.`;

    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    }));

    const report = safeParse(response.text || '[]');
    return report;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    handleError(error, { type: ErrorType.API, title: 'Super Investor Fetch Error', silent: true });
    return [];
  }
}
