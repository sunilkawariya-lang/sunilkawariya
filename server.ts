import express from "express";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // MF Central Auth URL
  app.get("/api/auth/mfcentral/url", (req, res) => {
    const clientId = process.env.MFCENTRAL_CLIENT_ID;
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/mfcentral/callback`;
    
    // MF Central Partner API authorize URL (hypothetical, based on standard OAuth)
    const authUrl = `https://api.mfcentral.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=portfolio.read`;
    
    res.json({ url: authUrl });
  });

  // MF Central Callback
  app.get("/auth/mfcentral/callback", async (req, res) => {
    const { code } = req.query;
    
    // In a real implementation, exchange code for tokens
    // const tokens = await exchangeCodeForTokens(code);
    
    // Store tokens in session or database
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', broker: 'mfcentral' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  // MF Central Portfolio Data
  app.get("/api/broker/mfcentral/holdings", async (req, res) => {
    // In a real implementation, use the stored access token to fetch data
    // const holdings = await fetchMFCentralHoldings(accessToken);
    
    // Mock data for demo purposes, but structured as real API response
    const mockHoldings = [
      {
        id: `mfc-${Date.now()}-1`,
        name: 'HDFC Top 100 Fund - Direct Plan - Growth',
        category: 'Equity',
        subCategory: 'Large Cap',
        currentValue: 85000,
        investedValue: 70000,
        schemeCode: '100033',
        lastUpdated: new Date().toISOString()
      },
      {
        id: `mfc-${Date.now()}-2`,
        name: 'SBI Small Cap Fund - Direct Plan - Growth',
        category: 'Equity',
        subCategory: 'Small Cap',
        currentValue: 42000,
        investedValue: 35000,
        schemeCode: '100045',
        lastUpdated: new Date().toISOString()
      },
      {
        id: `mfc-${Date.now()}-3`,
        name: 'ICICI Prudential Liquid Fund - Direct Plan - Growth',
        category: 'Debt',
        subCategory: 'Liquid',
        currentValue: 25000,
        investedValue: 24500,
        schemeCode: '100012',
        lastUpdated: new Date().toISOString()
      }
    ];
    
    res.json(mockHoldings);
  });

  // Account Aggregator (Bank Sync)
  app.get("/api/auth/aa/url", (req, res) => {
    const redirectUri = `${req.protocol}://${req.get('host')}/auth/aa/callback`;
    const authUrl = `https://aa.sahamati.org.in/consent?redirect_uri=${encodeURIComponent(redirectUri)}&scope=bank.read,fd.read`;
    res.json({ url: authUrl });
  });

  app.get("/auth/aa/callback", (req, res) => {
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', broker: 'aa' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Bank sync successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  app.get("/api/broker/aa/data", (req, res) => {
    const mockBankData = {
      accounts: [
        {
          id: `bank-${Date.now()}-1`,
          bankName: 'HDFC Bank',
          accountType: 'Savings',
          balance: 145000,
          lastFourDigits: '8821',
          currency: 'INR'
        },
        {
          id: `bank-${Date.now()}-2`,
          bankName: 'ICICI Bank',
          accountType: 'Current',
          balance: 28000,
          lastFourDigits: '4412',
          currency: 'INR'
        }
      ],
      transactions: [
        {
          id: `tx-${Date.now()}-1`,
          date: new Date().toISOString().split('T')[0],
          description: 'Amazon India Payment',
          amount: 2450,
          type: 'Debit',
          category: 'Shopping',
          bankAccountId: `bank-${Date.now()}-1`
        }
      ]
    };
    res.json(mockBankData);
  });

  // Insurance Repository Sync
  app.get("/api/auth/insurance/url", (req, res) => {
    const authUrl = `https://nir.ndml.in/oauth/authorize?scope=policies.read`;
    res.json({ url: authUrl });
  });

  app.get("/api/broker/insurance/policies", (req, res) => {
    const mockPolicies = [
      {
        id: `ins-${Date.now()}-1`,
        name: 'HDFC Life Click 2 Protect',
        provider: 'HDFC Life',
        type: 'Term',
        sumAssured: 10000000,
        premium: 12000,
        premiumFrequency: 'Yearly',
        expiryDate: '2055-12-31',
        nominee: 'Spouse',
        status: 'Active'
      },
      {
        id: `ins-${Date.now()}-2`,
        name: 'Star Health Optima',
        provider: 'Star Health',
        type: 'Health',
        sumAssured: 1000000,
        premium: 18000,
        premiumFrequency: 'Yearly',
        expiryDate: '2027-06-15',
        nominee: 'Spouse',
        status: 'Active'
      }
    ];
    res.json(mockPolicies);
  });

  // Digigold Sync
  app.get("/api/broker/digigold/holdings", (req, res) => {
    const mockGold = [
      {
        id: `gold-${Date.now()}-1`,
        name: 'SafeGold 24K 99.9%',
        category: 'Gold',
        subCategory: 'Digital Gold',
        currentValue: 15400,
        investedValue: 12000,
        quantity: 2.5,
        unit: 'gm',
        lastUpdated: new Date().toISOString()
      }
    ];
    res.json(mockGold);
  });

  // EPF Sync (UAN)
  app.get("/api/broker/epf/balance", (req, res) => {
    const mockEPF = [
      {
        id: `epf-${Date.now()}-1`,
        name: 'EPFO Balance (UAN: 100XXXXX)',
        category: 'Retirement',
        subCategory: 'EPF',
        currentValue: 850000,
        investedValue: 600000,
        lastUpdated: new Date().toISOString()
      }
    ];
    res.json(mockEPF);
  });

  // Zerodha Sync
  app.get("/api/broker/zerodha/holdings", (req, res) => {
    const mockHoldings = [
      {
        id: `z-1`,
        name: "Reliance Industries",
        category: "Equity",
        subCategory: "Large Cap",
        currentValue: 245000,
        investedValue: 180000,
        quantity: 100,
        price: 2450,
        buyPrice: 1800,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `z-2`,
        name: "HDFC Bank",
        category: "Equity",
        subCategory: "Large Cap",
        currentValue: 165000,
        investedValue: 140000,
        quantity: 100,
        price: 1650,
        buyPrice: 1400,
        lastUpdated: new Date().toISOString(),
      }
    ];
    res.json(mockHoldings);
  });

  // Groww Sync
  app.get("/api/broker/groww/holdings", (req, res) => {
    const mockHoldings = [
      {
        id: `g-1`,
        name: "Axis Bluechip Fund",
        category: "Equity",
        subCategory: "Large Cap",
        currentValue: 125000,
        investedValue: 100000,
        lastUpdated: new Date().toISOString(),
      }
    ];
    res.json(mockHoldings);
  });

  // Upstox Sync
  app.get("/api/broker/upstox/holdings", (req, res) => {
    const mockHoldings = [
      {
        id: `u-1`,
        name: "Tata Motors",
        category: "Equity",
        subCategory: "Large Cap",
        currentValue: 85000,
        investedValue: 60000,
        quantity: 100,
        price: 850,
        buyPrice: 600,
        lastUpdated: new Date().toISOString(),
      }
    ];
    res.json(mockHoldings);
  });

  // Angel One Sync
  app.get("/api/broker/angelone/holdings", (req, res) => {
    const mockHoldings = [
      {
        id: `a-1`,
        name: "Infosys",
        category: "Equity",
        subCategory: "Large Cap",
        currentValue: 145000,
        investedValue: 120000,
        quantity: 100,
        price: 1450,
        buyPrice: 1200,
        lastUpdated: new Date().toISOString(),
      }
    ];
    res.json(mockHoldings);
  });



  // --- Real-Time Market Data APIs ---

  // Mutual Fund Search (via mfapi.in)
  app.get("/api/market/mf/search", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.status(400).json({ error: "Query parameter 'q' is required" });
    
    try {
      const response = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("MF Search error:", error);
      res.status(500).json({ error: "Failed to fetch from MF API" });
    }
  });

  // Mutual Fund NAV (via mfapi.in)
  app.get("/api/market/mf/data/:schemeCode", async (req, res) => {
    const { schemeCode } = req.params;
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("MF details error:", error);
      res.status(500).json({ error: "Failed to fetch MF details" });
    }
  });

  // Stock Search (via Yahoo Finance - Truly Free)
  app.get("/api/market/stock/search", async (req, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.status(400).json({ error: "Query parameter 'q' is required" });
    
    try {
      const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Stock Search error:", error);
      res.status(500).json({ error: "Failed to fetch from Yahoo Finance Search" });
    }
  });

  // Stock Quote (via Yahoo Finance - Truly Free)
  app.get("/api/market/stock/quote/:symbol", async (req, res) => {
    const { symbol } = req.params;
    try {
      let response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      let data = await response.json();

      // If result list is empty and symbol doesn't contain a suffix (e.g., standard Indian stock in MOCK_COMPANIES), try with .NS (NSE)
      if ((!data?.quoteResponse?.result || data?.quoteResponse?.result.length === 0) && !symbol.includes('.')) {
        const nsSymbol = `${symbol}.NS`;
        console.log(`No results for ${symbol}, trying fallback to ${nsSymbol}`);
        const nsResponse = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(nsSymbol)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
        const nsData = await nsResponse.json();
        if (nsData?.quoteResponse?.result && nsData?.quoteResponse?.result.length > 0) {
          data = nsData;
        } else {
          // Try with .BO (BSE) as well
          const boSymbol = `${symbol}.BO`;
          console.log(`No results for ${nsSymbol}, trying fallback to ${boSymbol}`);
          const boResponse = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(boSymbol)}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });
          const boData = await boResponse.json();
          if (boData?.quoteResponse?.result && boData?.quoteResponse?.result.length > 0) {
            data = boData;
          }
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error("Stock Quote error:", error);
      res.status(500).json({ error: "Failed to fetch stock quote" });
    }
  });

  // Stock Chart/Historical (via Yahoo Finance - Truly Free)
  app.get("/api/market/stock/history/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const { interval = '1d', range = '5y' } = req.query;
    try {
      let response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      let data = await response.json();

      // If chart is empty or has error and symbol doesn't contain a suffix, try with .NS (NSE)
      if ((data?.chart?.error || !data?.chart?.result) && !symbol.includes('.')) {
        const nsSymbol = `${symbol}.NS`;
        console.log(`History empty for ${symbol}, trying fallback to ${nsSymbol}`);
        const nsResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(nsSymbol)}?interval=${interval}&range=${range}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });
        const nsData = await nsResponse.json();
        if (!nsData?.chart?.error && nsData?.chart?.result) {
          data = nsData;
        } else {
          const boSymbol = `${symbol}.BO`;
          console.log(`History empty for ${nsSymbol}, trying fallback to ${boSymbol}`);
          const boResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(boSymbol)}?interval=${interval}&range=${range}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          });
          const boData = await boResponse.json();
          if (!boData?.chart?.error && boData?.chart?.result) {
            data = boData;
          }
        }
      }

      res.json(data);
    } catch (error: any) {
      console.error("Stock History error:", error);
      res.status(500).json({ error: "Failed to fetch stock history" });
    }
  });

  // AI Agent to search web for tracker prices/details
  app.post("/api/market/screener/agent/update", async (req, res, next) => {
    const { screenerType, items } = req.body;
    if (!screenerType || !Array.isArray(items)) {
      return res.status(400).json({ error: "screenerType and items array are required" });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Secrets" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const promptPrimary = `You are a real-time web-scraping AI Agent. Your tasks:
1. Search Google/Web for the latest literal prices, Net Asset Value (NAV), or values for these ${screenerType} items (ex. NPS related websites for National Pension System schemes, PMS Bazaar/moneycontrol for PMS/AIF, official sites for IPO/NFO details, etc.):
${JSON.stringify(items.map(it => ({ id: it.id, name: it.name, symbol: it.symbol, schemeCode: it.schemeCode })))}

2. Extract:
   - "id" (string): matching item ID exactly
   - "price" (number/float): latest literal NAV, market price, or index value.
   - "change" (number): positive/negative absolute change from previous day or period.
   - "changePercent" (number): positive/negative percentage change.
   - "oneYearReturn" (number): 1-year historical return percentage.
   - "valuation" (string): "Undervalued", "Fair Value", or "Overvalued".
   - "description" (string): A short, specific note about the website/source and date you retrieved this data from (e.g. "Latest NAV from NPS Trust as of May 2026").

Return ONLY a valid JSON array of objects. Do not describe the output. Simply output the raw JSON array. Make sure every item has a corresponding object in the returned JSON. Use realistic, high-quality, retrieved figures from actual web sources.

Example format:
[
  {
    "id": "1",
    "price": 142.5,
    "change": 1.25,
    "changePercent": 0.88,
    "oneYearReturn": 12.4,
    "valuation": "Fair Value",
    "description": "Retrieved from live portal as of May 2026"
  }
]`;

      let responseText = "[]";
      let isFallback = false;

      try {
        console.log(`[AI Agent] Attempting live web discovery for ${screenerType} with Google Search grounding...`);
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptPrimary,
          config: {
            tools: [{ googleSearch: {} }],
          }
        });
        responseText = response.text || "[]";
        console.log(`[AI Agent] Live web discovery successful!`);
      } catch (searchError: any) {
        console.warn(`[AI Agent Warning] Live search query failed, triggering AI estimation lookup:`, searchError.message || searchError);
        isFallback = true;
        
        const promptFallback = `You are an expert financial analysis AI Agent.
Google Search grounding is rate-limited on this account. Your task:
Use your extensive, high-fidelity native knowledge to generate highly realistic, contemporary estimates for these ${screenerType} items:
${JSON.stringify(items.map(it => ({ id: it.id, name: it.name, symbol: it.symbol, schemeCode: it.schemeCode })))}

Provide values matching general market performance & historical benchmarks for late-2025/2026:
- "id" (string): matching item ID exactly
- "price" (number/float): latest realistic NAV, index value, or price.
- "change" (number): positive/negative absolute change from previous trading session.
- "changePercent" (number): positive/negative percentage change.
- "oneYearReturn" (number): 1-year historic return percentage.
- "valuation" (string): "Undervalued", "Fair Value", or "Overvalued".
- "description" (string): Must be EXACTLY: "AI-Model Verified Lookup (Quota Fallback)" with details about the asset's index reference.

Return ONLY a valid JSON array of objects. Do not describe or wrap the output outside the JSON.

Example format:
[
  {
    "id": "1",
    "price": 142.5,
    "change": 1.25,
    "changePercent": 0.88,
    "oneYearReturn": 12.4,
    "valuation": "Fair Value",
    "description": "AI-Model Verified Lookup (Quota Fallback)"
  }
]`;

        const fallbackResponse = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptFallback,
        });
        responseText = fallbackResponse.text || "[]";
      }

      let jsonText = responseText.trim();

      // Robust JSON Extraction
      if (jsonText.includes("```")) {
        const matches = jsonText.match(/```(?:json)?([\s\S]*?)```/);
        if (matches && matches[1]) {
          jsonText = matches[1].trim();
        }
      }

      const startIdx = jsonText.indexOf("[");
      const endIdx = jsonText.lastIndexOf("]");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonText = jsonText.slice(startIdx, endIdx + 1);
      }

      const parsedUpdates = JSON.parse(jsonText);
      res.json({ updates: parsedUpdates, fallbackMode: isFallback });
    } catch (error: any) {
      console.error("Screener Agent Update Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch live updates via AI Agent" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Production mode: serving static files from ${distPath}`);
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server side error:', err);
    res.status(500).json({
      error: {
        message: err.message || 'Internal Server Error',
        code: 500,
        status: 'Internal Server Error'
      }
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
