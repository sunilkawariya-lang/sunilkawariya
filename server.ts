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
      const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      const data = await response.json();
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
      const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Stock History error:", error);
      res.status(500).json({ error: "Failed to fetch stock history" });
    }
  });

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
