
import { Investment, Goal, Expense, TaxProfile, PortfolioState, IPSPolicy } from './types';

export const DEFAULT_IPS_POLICY: IPSPolicy = {
  memberId: 'm1',
  scopeAndPurpose: {
    context: 'The assets are primarily generated from professional income and strategic investments over the last decade. The objective is to build a sustainable corpus for long-term goals while maintaining current lifestyle.',
    investor: 'Individual investor (Self) with a focus on long-term wealth creation and capital preservation.',
    structure: 'Self-managed with guidance from AI-driven advisory tools and periodic review with a certified financial planner.'
  },
  governance: {
    responsibilities: 'The investor is responsible for final investment decisions and execution. The advisory tools provide data-driven insights and recommendations.',
    reviewProcess: 'The Investment Policy Statement (IPS) will be reviewed annually or upon significant life events (e.g., job change, marriage, inheritance).',
    reportingRequirements: 'Monthly portfolio performance reports and quarterly asset allocation reviews.'
  },
  objectives: {
    investmentObjective: 'To achieve a real rate of return (inflation-adjusted) of 4-6% per annum over a 15-20 year horizon.',
    returnRequirements: 'Targeting a combined portfolio return of 12-14% CAGR, considering the current Indian market context and inflation of 6%.',
    riskTolerance: 'Moderate to Aggressive. Willing to accept short-term volatility (up to 20-25% drawdown) for long-term capital appreciation.',
    investmentPhilosophy: 'Core-Satellite approach. Core portfolio in low-cost index funds and high-quality debt. Satellite portfolio in high-growth stocks and tactical opportunities.',
    constraints: {
      liquidity: 'Maintain an emergency fund equivalent to 6 months of expenses. High liquidity for short-term goals (within 2 years).',
      tax: 'Optimize for Indian tax laws (80C, 80D, LTCG/STCG on equity and debt). Utilize tax-efficient instruments like PPF, NPS, and ELSS.',
      legal: 'Ensure all investments have clear nominees. Maintain a registered Will and a digital asset vault for estate transition.',
      timeHorizon: 'Long-term horizon of 20+ years for retirement, with intermediate goals at 3, 5, and 10 years.',
      uniqueCircumstances: 'Focus on diversifying away from sector-specific concentration (e.g., IT/Tech) if professional income is from the same sector.'
    }
  },
  assetAllocationPolicy: {
    targetEquity: 60,
    targetDebt: 30,
    targetGold: 5,
    targetCash: 5,
    rebalancingThresholds: '+/- 5% deviation from target allocation in any major asset class.',
    permittedAssetClasses: ['Domestic Equity', 'International Equity', 'Government Bonds', 'Corporate Debt', 'Gold ETFs/SGBs', 'Liquid Funds'],
    prohibitedAssetClasses: ['Unregulated crypto assets', 'Highly leveraged derivatives', 'Unlisted private equity without due diligence']
  },
  riskManagement: {
    performanceMeasurement: 'Performance will be measured against a blended benchmark (e.g., Nifty 50 for Equity, Nifty 10-yr Benchmark G-Sec for Debt).',
    benchmarks: '60% Nifty 50 + 30% Nifty 10yr G-Sec + 10% Gold/Cash',
    rebalancingPolicy: 'Rebalance the portfolio if the actual asset allocation deviates by more than 5% from the target allocation.'
  },
  lastUpdated: new Date().toISOString()
};

export const INDIAN_TAX_SLABS_NEW_2024 = [
  { limit: 300000, rate: 0 },
  { limit: 700000, rate: 0.05 },
  { limit: 1000000, rate: 0.10 },
  { limit: 1200000, rate: 0.15 },
  { limit: 1500000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

export const INDIAN_TAX_SLABS_OLD_2024 = [
  { limit: 250000, rate: 0 },
  { limit: 500000, rate: 0.05 },
  { limit: 1000000, rate: 0.20 },
  { limit: Infinity, rate: 0.30 },
];

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

export const ASSET_COLORS: Record<string, string> = {
  Equity: '#10b981', // Emerald 500
  Debt: '#6366f1',   // Indigo 500
  Gold: '#f59e0b',   // Amber 500
  Hybrid: '#ec4899', // Pink 500
  Alternative: '#f97316', // Orange 500
  Cash: '#94a3b8',   // Slate 400
  'Real Estate': '#8b5cf6', // Violet 500
  ESOP: '#f43f5e',          // Rose 500
  PMS: '#0ea5e9',           // Sky 500
  AIF: '#8b5cf6',           // Violet 500
  Bonds: '#6366f1',         // Indigo 500
  'Fixed Deposit': '#94a3b8', // Slate 400
  Debenture: '#64748b',      // Slate 500
  PF: '#ca8a04',            // Yellow 600
  PPF: '#eab308',           // Yellow 500
  NPS: '#f97316',           // Orange 500
  'International Fund': '#dc2626', // Red 600
  'Global Stock': '#ef4444', // Red 500
};

export const TARGET_ALLOCATIONS: Record<string, Record<string, number>> = {
  Conservative: {
    Equity: 20,
    Debt: 70,
    Gold: 5,
    Cash: 5
  },
  Moderate: {
    Equity: 50,
    Debt: 40,
    Gold: 5,
    Cash: 5
  },
  Aggressive: {
    Equity: 70,
    Debt: 20,
    Gold: 5,
    Cash: 5
  },
  'Very Aggressive': {
    Equity: 85,
    Debt: 5,
    Gold: 5,
    Cash: 5
  },
  'Not Assessed': {
    Equity: 50,
    Debt: 40,
    Gold: 5,
    Cash: 5
  }
};

export const DEFAULT_PORTFOLIO: PortfolioState = {
  familyMembers: [
    { id: 'm1', name: 'Self', relationship: 'Self', isDependent: false, age: 35, occupation: 'Software Engineer' },
    { id: 'm2', name: 'Spouse', relationship: 'Spouse', isDependent: false, age: 32, occupation: 'Architect' }
  ],
  selectedMemberId: 'family',
  investments: [
    {
      id: '1',
      memberId: 'm1',
      name: 'Reliance Industries',
      category: 'Equity',
      subCategory: 'Equity Stocks',
      currentValue: 320000,
      investedValue: 180000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      symbol: 'RELIANCE.NS',
      quantity: 100,
      price: 3200,
      return1Y: 12.5,
      return3Y: 45.2,
      return5Y: 88.4,
      isSIP: true,
      sipAmount: 5000,
      sipNextDate: '2026-04-05',
      analysis: {
        recommendation: 'Hold',
        summary: 'Strong fundamentals with diversified revenue streams, but currently trading near resistance levels.',
        fundamentalScore: 85,
        technicalScore: 65,
        exitLevel: 2800,
        details: '### Fundamental Analysis\nReliance Industries continues to dominate the Indian market with its strong presence in O2C, Retail, and Digital Services (Jio). The company has a healthy ROE of 12% and is actively reducing its net debt.\n\n### Technical Analysis\nThe stock is currently in a consolidation phase. RSI is at 58, indicating neutral momentum. Strong support is seen at ₹2300, while resistance is at ₹2650.\n\n### Recommendation\n**HOLD** for long-term growth. Consider adding more on dips below ₹2350. Target exit level for short-term traders is ₹2800.',
        lastGenerated: new Date().toISOString(),
        analysisDataDate: 'May 2026'
      }
    },
    {
      id: '3',
      memberId: 'm1',
      name: 'SBI Small Cap Fund',
      category: 'Equity',
      subCategory: 'Equity Mutual Funds',
      currentValue: 145600,
      investedValue: 75000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      schemeCode: '125497',
      quantity: 800,
      price: 182,
      fundHouse: 'SBI Mutual Fund',
      return1Y: 32.4,
      return3Y: 98.6,
      return5Y: 152.1,
      isSIP: true,
      sipAmount: 2000,
      sipNextDate: '2026-05-10',
    },
    {
      id: '4',
      memberId: 'm1',
      name: 'HDFC Bank',
      category: 'Equity',
      subCategory: 'Equity Stocks',
      currentValue: 258000,
      investedValue: 150000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      symbol: 'HDFCBANK.NS',
      quantity: 120,
      price: 2150,
      return1Y: 12.5,
      return3Y: 38.2,
      return5Y: 72.8,
    },
    {
      id: 'inv-m2-1',
      memberId: 'm2',
      name: 'ICICI Prudential Bluechip',
      category: 'Equity',
      subCategory: 'Equity Mutual Funds',
      currentValue: 246000,
      investedValue: 120000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      schemeCode: '100350',
      quantity: 1200,
      price: 205,
      fundHouse: 'ICICI Prudential Mutual Fund',
      return1Y: 18.6,
      return3Y: 52.4,
      return5Y: 98.2,
      isSIP: true,
      sipAmount: 10000,
      sipNextDate: '2026-05-15',
      swpAmount: 5000,
      swpFrequency: 'Monthly',
      swpNextDate: '2026-06-01'
    },
    {
      id: 'inv-m2-2',
      memberId: 'm2',
      name: 'Fixed Deposit - SBI',
      category: 'Debt',
      subCategory: 'Fixed Deposits',
      currentValue: 205600,
      investedValue: 200000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      maturityDate: '2026-06-20',
      maturityAmount: 215000,
      return1Y: 7.2,
      return3Y: 23.4,
      return5Y: 0,
    },
    {
      id: '5',
      memberId: 'm1',
      name: 'PPF',
      category: 'Debt',
      subCategory: 'Government Schemes',
      currentValue: 312500,
      investedValue: 250000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      return1Y: 7.1,
      return3Y: 22.8,
      return5Y: 40.9,
      isSIP: true,
      sipAmount: 10000,
      sipNextDate: '2026-05-01',
    },
    {
      id: '6',
      memberId: 'm1',
      name: 'Axis Midcap Fund',
      category: 'Equity',
      subCategory: 'Equity Mutual Funds',
      currentValue: 192000,
      investedValue: 100000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      schemeCode: '120503',
      quantity: 1500,
      price: 128,
      fundHouse: 'Axis Mutual Fund',
      return1Y: 22.4,
      return3Y: 68.9,
      return5Y: 118.2,
      isSIP: true,
      sipAmount: 5000,
      sipNextDate: '2026-05-15',
    },
    {
      id: 'pms-1',
      memberId: 'm1',
      name: 'ASK Growth Portfolio',
      category: 'Equity',
      subCategory: 'PMS',
      currentValue: 5500000,
      investedValue: 4500000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      return1Y: 22.5,
    },
    {
      id: 'aif-1',
      memberId: 'm1',
      name: 'True Beacon One',
      category: 'Alternative',
      subCategory: 'AIF',
      currentValue: 12000000,
      investedValue: 10000000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      return1Y: 18.2,
    },
    {
      id: 'bond-1',
      memberId: 'm1',
      name: 'NHAI Tax Free Bonds',
      category: 'Debt',
      subCategory: 'Bonds',
      currentValue: 525000,
      investedValue: 500000,
      lastUpdated: new Date().toISOString(),
      source: 'Default',
      return1Y: 6.5,
    },
  ],
  wallet: {
    balance: 500,
    currency: 'INR',
    lastUpdated: new Date().toISOString()
  },
  walletTransactions: [],
  goals: [
    { id: 'g1', memberId: 'm1', name: 'Retirement', targetAmount: 50000000, currentAmount: 1100000, targetDate: '2045-12-31', priority: 'High' },
    { id: 'g2', memberId: 'm1', name: 'Home Downpayment', targetAmount: 2000000, currentAmount: 500000, targetDate: '2027-06-30', priority: 'Medium' },
  ],
  expenses: [
    { id: 'e1', memberId: 'm1', category: 'Rent', amount: 25000, date: new Date().toISOString(), isRecurring: true },
    { id: 'e2', memberId: 'm1', category: 'Groceries', amount: 10000, date: new Date().toISOString(), isRecurring: true },
  ],
  bankAccounts: [
    {
      id: 'b1',
      memberId: 'm1',
      accountHolderName: 'Self',
      bankName: 'HDFC Bank',
      lastFourDigits: '1234',
      balance: 150000,
      accountType: 'Savings',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'b2',
      memberId: 'm1',
      accountHolderName: 'Self',
      bankName: 'ICICI Bank',
      lastFourDigits: '5678',
      balance: 75000,
      accountType: 'Salary',
      lastUpdated: new Date().toISOString()
    }
  ],
  bankTransactions: [],
  creditCards: [],
  creditCardTransactions: [],
  incomes: [
    { id: 'i1', memberId: 'm1', source: 'Salary', amount: 150000, date: new Date().toISOString(), isRecurring: true, frequency: 'Monthly' },
    { id: 'i2', memberId: 'm1', source: 'Bonus', amount: 200000, date: '2024-03-15', isRecurring: false, frequency: 'One-time' },
    { id: 'i3', memberId: 'm1', source: 'Rental', amount: 15000, date: new Date().toISOString(), isRecurring: true, frequency: 'Monthly' },
    { id: 'i4', memberId: 'm1', source: 'Investment', amount: 5000, date: new Date().toISOString(), isRecurring: true, frequency: 'Monthly' },
  ],
  taxProfiles: [{
    memberId: 'm1',
    annualIncome: 1800000,
    basicSalary: 720000,
    actualHRA: 360000,
    rentPaid: 300000,
    cityType: 'Metro',
    investments80C: 150000,
    nps80CCD: 50000,
    npsEmployer80CCD2: 0,
    medicalInsurance80D: 25000,
    standardDeduction: 50000,
    otherDeductions: [],
    capitalGains: [],
    totalTaxPayable: 240000,
  }],
  riskProfiles: [{
    memberId: 'm1',
    type: 'Moderate',
    score: 55,
    lastAssessed: new Date().toISOString(),
  }],
  emergencyFunds: [{
    memberId: 'm1',
    targetMonths: 6,
    currentAmount: 150000,
    monthlyExpense: 35000,
  }],
  estatePlannings: [{
    memberId: 'm1',
    willStatus: 'Not Started',
    nomineesUpdated: false,
    insuranceCover: 10000000,
    digitalAssetsVault: false,
    nominees: [
      { id: 'n1', name: 'Spouse', relationship: 'Spouse', share: 50 },
      { id: 'n2', name: 'Child 1', relationship: 'Child', share: 50 }
    ]
  }],
  ipsPolicies: [DEFAULT_IPS_POLICY],
  insurances: [
    {
      id: 'ins-1',
      memberId: 'm1',
      name: 'HDFC Term Plan',
      type: 'Term',
      provider: 'HDFC Life',
      sumAssured: 10000000,
      premium: 12000,
      premiumFrequency: 'Yearly',
      startDate: '2022-01-15',
      expiryDate: '2052-01-15',
      nominee: 'Spouse',
      status: 'Active',
      benefits: [
        'High Sum Assured at Low Premium',
        'Tax Benefits under Section 80C',
        'Critical Illness Rider Included',
        'Accidental Death Benefit Rider'
      ]
    },
    {
      id: 'ins-2',
      memberId: 'm1',
      name: 'Star Health Optima',
      type: 'Health',
      provider: 'Star Health',
      sumAssured: 1000000,
      premium: 18000,
      premiumFrequency: 'Yearly',
      startDate: '2023-05-10',
      expiryDate: '2026-05-10',
      nominee: 'Spouse',
      status: 'Active',
      benefits: [
        'Cashless Hospitalization at Network Hospitals',
        'No Claim Bonus (NCB) up to 100%',
        'Restoration of Sum Insured',
        'Annual Health Check-ups'
      ]
    },
    {
      id: 'ins-3',
      memberId: 'm1',
      name: 'LIC New Endowment',
      type: 'Endowment',
      provider: 'LIC',
      sumAssured: 500000,
      premium: 25000,
      premiumFrequency: 'Yearly',
      startDate: '2018-03-20',
      expiryDate: '2038-03-20',
      nominee: 'Parents',
      status: 'Active',
      maturityDate: '2038-03-20',
      maturityAmount: 1200000,
      benefits: [
        'Guaranteed Maturity Benefit',
        'Participation in Profits (Bonus)',
        'Loan Facility Available',
        'Life Cover throughout Policy Term'
      ],
      cashflows: [
        { date: '2028-03-20', amount: 50000, description: 'Survival Benefit' },
        { date: '2033-03-20', amount: 50000, description: 'Survival Benefit' }
      ]
    }
  ],
  marketIndices: [
    { 
      name: 'Nifty 50', 
      value: 25500, 
      prevClose: 25270, 
      change: 230, 
      changePercent: 0.91, 
      lastUpdated: new Date().toISOString(),
      analysis: {
        summary: 'Nifty 50 is showing strong bullish momentum in 2026, breaking new all-time highs. The structural growth of the Indian economy remains the primary driver.',
        valuation: 'Fair Value',
        peRatio: 23.5,
        pbRatio: 4.1,
        dividendYield: 1.1,
        technicalTrend: 'Bullish',
        keyLevels: { support: 25000, resistance: 26000 }
      }
    },
    { 
      name: 'Sensex', 
      value: 84000, 
      prevClose: 83250, 
      change: 750, 
      changePercent: 0.9, 
      lastUpdated: new Date().toISOString(),
      analysis: {
        summary: 'Sensex has crossed 84,000 as large-cap financial and infrastructure stocks lead the rally.',
        valuation: 'Fair Value',
        peRatio: 24.8,
        pbRatio: 4.2,
        dividendYield: 1.0,
        technicalTrend: 'Bullish',
        keyLevels: { support: 83000, resistance: 85000 }
      }
    },
    { 
      name: 'Nasdaq 100', 
      value: 21000, 
      prevClose: 20850, 
      change: 150, 
      changePercent: 0.72, 
      lastUpdated: new Date().toISOString(),
      analysis: {
        summary: 'The Nasdaq 100 is fueled by the second wave of AI implementation across enterprise software and biotech.',
        valuation: 'Overvalued',
        peRatio: 34.2,
        pbRatio: 8.1,
        dividendYield: 0.7,
        technicalTrend: 'Bullish',
        keyLevels: { support: 20500, resistance: 21500 }
      }
    },
    { 
      name: 'Dow Jones', 
      value: 44000, 
      prevClose: 43850, 
      change: 150, 
      changePercent: 0.34, 
      lastUpdated: new Date().toISOString(),
      analysis: {
        summary: 'Dow Jones is showing steady growth as industrial and financial sectors remain resilient in the 2026 economic landscape.',
        valuation: 'Fair Value',
        peRatio: 22.2,
        pbRatio: 4.8,
        dividendYield: 1.8,
        technicalTrend: 'Neutral',
        keyLevels: { support: 43500, resistance: 44500 }
      }
    },
    { 
      name: 'Gold (24K)', 
      value: 78000, 
      prevClose: 77850, 
      change: 150, 
      changePercent: 0.19, 
      lastUpdated: new Date().toISOString(),
      analysis: {
        summary: 'Gold remains a hedge against global uncertainty, trading at record levels in INR terms.',
        valuation: 'Overvalued',
        technicalTrend: 'Bullish',
        keyLevels: { support: 76000, resistance: 80000 }
      }
    },
    { 
      name: 'Silver', 
      value: 95000, 
      prevClose: 94200, 
      change: 800, 
      changePercent: 0.85, 
      lastUpdated: new Date().toISOString(),
      analysis: {
        summary: 'Silver prices are supported by strong industrial demand from the EV and Solar sectors.',
        valuation: 'Fair Value',
        technicalTrend: 'Neutral',
        keyLevels: { support: 92000, resistance: 98000 }
      }
    },
  ],
  transactions: [
    { id: 't1', memberId: 'm1', investmentId: '1', investmentName: 'HDFC Bank Ltd', type: 'Buy', date: '2023-04-15', quantity: 50, price: 1550, amount: 77500, category: 'Equity' },
    { id: 't2', memberId: 'm1', investmentId: '2', investmentName: 'Nifty 50 Index Fund', type: 'Buy', date: '2023-05-10', quantity: 1000, price: 120, amount: 120000, category: 'Equity' },
    { id: 't3', memberId: 'm1', investmentId: '3', investmentName: 'Axis Midcap Fund', type: 'Buy', date: '2023-06-20', quantity: 800, price: 65, amount: 52000, category: 'Equity' },
    { id: 't4', memberId: 'm1', investmentId: '1', investmentName: 'HDFC Bank Ltd', type: 'Dividend', date: '2023-08-15', quantity: 0, price: 0, amount: 1200, category: 'Equity' },
    { id: 't5', memberId: 'm1', investmentId: '4', investmentName: 'Sovereign Gold Bond', type: 'Buy', date: '2023-09-05', quantity: 20, price: 5800, amount: 116000, category: 'Gold' },
    { id: 't6', memberId: 'm1', investmentId: '2', investmentName: 'Nifty 50 Index Fund', type: 'Buy', date: '2023-10-10', quantity: 500, price: 125, amount: 62500, category: 'Equity' },
    { id: 't7', memberId: 'm1', investmentId: '1', investmentName: 'HDFC Bank Ltd', type: 'Sell', date: '2024-01-15', quantity: 20, price: 1680, amount: 33600, category: 'Equity' },
  ],
  historicalSnapshots: [
    { date: '2023-04-01', totalValue: 500000, investedValue: 500000, categoryValues: { Equity: 200000, Debt: 200000, Gold: 50000, 'Real Estate': 0, Cash: 50000, Hybrid: 0, Alternative: 0, ESOP: 0 } },
    { date: '2023-07-01', totalValue: 545000, investedValue: 530000, categoryValues: { Equity: 240000, Debt: 205000, Gold: 52000, 'Real Estate': 0, Cash: 48000, Hybrid: 0, Alternative: 0, ESOP: 0 } },
    { date: '2023-10-01', totalValue: 612000, investedValue: 585000, categoryValues: { Equity: 290000, Debt: 210000, Gold: 65000, 'Real Estate': 0, Cash: 47000, Hybrid: 0, Alternative: 0, ESOP: 0 } },
    { date: '2024-01-01', totalValue: 685000, investedValue: 620000, categoryValues: { Equity: 340000, Debt: 215000, Gold: 85000, 'Real Estate': 0, Cash: 45000, Hybrid: 0, Alternative: 0, ESOP: 0 } },
    { date: '2026-03-31', totalValue: 1285000, investedValue: 1050000, categoryValues: { Equity: 750000, Debt: 420000, Gold: 105000, 'Real Estate': 0, Cash: 10000, Hybrid: 0, Alternative: 0, ESOP: 0 } },
    { date: '2026-04-01', totalValue: 1305000, investedValue: 1075000, categoryValues: { Equity: 770000, Debt: 425000, Gold: 105000, 'Real Estate': 0, Cash: 5000, Hybrid: 0, Alternative: 0, ESOP: 0 } },
  ],
  liabilities: [
    {
      id: 'l1',
      memberId: 'm1',
      name: 'HDFC Home Loan',
      type: 'Home Loan',
      totalAmount: 5000000,
      outstandingAmount: 4200000,
      interestRate: 8.5,
      emi: 45000,
      startDate: '2021-01-01',
      endDate: '2041-01-01',
      lender: 'HDFC Bank'
    }
  ],
  // Singular fields for the current/filtered view
  taxProfile: {
    memberId: 'm1',
    annualIncome: 1800000,
    basicSalary: 720000,
    actualHRA: 360000,
    rentPaid: 300000,
    cityType: 'Metro',
    investments80C: 150000,
    nps80CCD: 50000,
    npsEmployer80CCD2: 0,
    medicalInsurance80D: 25000,
    standardDeduction: 50000,
    otherDeductions: [],
    capitalGains: [],
    totalTaxPayable: 240000,
  },
  riskProfile: {
    memberId: 'm1',
    type: 'Moderate',
    score: 55,
    lastAssessed: new Date().toISOString(),
  },
  emergencyFund: {
    memberId: 'm1',
    targetMonths: 6,
    currentAmount: 150000,
    monthlyExpense: 35000,
  },
  estatePlanning: {
    memberId: 'm1',
    willStatus: 'Not Started',
    nomineesUpdated: false,
    insuranceCover: 10000000,
    digitalAssetsVault: false,
    nominees: [
      { id: 'n1', name: 'Spouse', relationship: 'Spouse', share: 50 },
      { id: 'n2', name: 'Child 1', relationship: 'Child', share: 50 }
    ]
  },
  ipsPolicy: DEFAULT_IPS_POLICY,
  safeDocuments: [],
  meetingDiscussions: [
    {
      id: 'd1',
      date: '2026-05-09',
      title: 'Wealth Strategy Session',
      summary: 'Points Discussed:\n1. The final Comprehensive Financial Plan Explained.\n2. PMS may be considered next year as per market conditions.\n3. Gross professional income projections for the upcoming fiscal.\n4. Tax efficiency through Budget 2024-25 provisions.',
      actionItems: [
        'Update Market Prices: Sync latest market values for direct equity holdings.',
        'Health Insurance review: Evaluate family floater quotations from Niva Bupa & Care.',
        'Surplus Deployment: Allocate surplus funds to Emergency fund and Debt buckets.'
      ],
      attendees: ['Sunil Kawariya', 'Priya Kawariya', 'Strategy Advisor'],
      nextMeetingDate: '2027-05-09'
    }
  ],
  userActivities: [
    { id: 'act-1', userId: 'm1', userName: 'Sunil Kawariya', action: 'Login', timestamp: '2026-04-14 09:15', ipAddress: '192.168.1.1', device: 'Desktop / Chrome' },
    { id: 'act-2', userId: 'm1', userName: 'Sunil Kawariya', action: 'Import CAS PDF', timestamp: '2026-04-14 09:32', ipAddress: '192.168.1.1', device: 'Desktop / Chrome' },
    { id: 'act-3', userId: 'm2', userName: 'Priya Kawariya', action: 'Login', timestamp: '2026-04-14 08:45', ipAddress: '192.168.1.5', device: 'Mobile / Safari' },
    { id: 'act-4', userId: 'm1', userName: 'Sunil Kawariya', action: 'Update Risk Profile', timestamp: '2026-04-13 18:20', ipAddress: '192.168.1.1', device: 'Desktop / Chrome' },
  ],
  securityLogs: [
    { id: 'log-1', level: 'Critical', event: 'Unauthorized Access Attempt', source: 'IP 103.45.21.12 (Russia)', timestamp: '2026-04-14 02:10', status: 'Resolved' },
    { id: 'log-2', level: 'Warning', event: 'Multiple Failed Logins', source: 'User: test_admin', timestamp: '2026-04-13 22:45', status: 'Investigating' },
    { id: 'log-3', level: 'Info', event: 'System Backup Completed', source: 'Auto-Backup Service', timestamp: '2026-04-14 00:00', status: 'Resolved' },
  ],
  complianceChecks: [
    { id: 'comp-1', category: 'SEBI', title: 'Investment Advisor Compliance', status: 'Compliant', lastChecked: '2026-04-01', nextReview: '2026-05-01', description: 'Verification of risk profiling and suitability assessment logic as per SEBI IA regulations.' },
    { id: 'comp-2', category: 'Data Privacy', title: 'GDPR / DPDP Compliance', status: 'Compliant', lastChecked: '2026-03-15', nextReview: '2026-06-15', description: 'Audit of data encryption at rest and in transit, and user consent management.' },
    { id: 'comp-3', category: 'KYC', title: 'Client Onboarding Audit', status: 'Pending Review', lastChecked: '2026-04-10', nextReview: '2026-04-20', description: 'Periodic review of client KYC documents and verification status.' },
    { id: 'comp-4', category: 'Tax', title: 'GST & TDS Filing', status: 'Compliant', lastChecked: '2026-04-05', nextReview: '2026-05-05', description: 'Verification of tax deduction and filing status for organizational expenses.' },
  ],
  lastMarketRefresh: new Date().toISOString(),
  profileCompleted: false,
};
