
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart, 
  FileText, Newspaper, Globe, Landmark, 
  ArrowUpRight, ArrowDownRight, Info, Search,
  Calendar, Clock, Download, ExternalLink,
  ChevronRight, Activity, Zap, ShieldCheck,
  Target, Briefcase, BookOpen, Quote, Sparkles,
  ShieldAlert, Plus, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, Legend, Cell
} from 'recharts';
import { fetchStockResearch, fetchLiveMarketData } from '../services/livePriceService';

interface FinancialMetric {
  year: string;
  revenue: number;
  profit: number;
  eps: number;
  peRatio: number;
  pbRatio: number;
  evEbitda: number;
  mcSales: number;
  dividendYield: number;
  roe: number;
  roce: number;
  debtToEquity: number;
  isProjection?: boolean;
}

interface GrowthMetrics {
  salesGrowth: { '10Y'?: string; '5Y': string; '3Y': string; '1Y'?: string; 'TTM': string };
  profitGrowth: { '10Y': string; '5Y': string; '3Y': string; '1Y'?: string; 'TTM': string };
  stockPriceCAGR: { '10Y': string; '5Y': string; '3Y': string; '1Y': string };
  roe: { '10Y'?: string; '5Y'?: string; '3Y'?: string; '1Y': string };
}

interface CompanyResearch {
  id: string;
  name: string;
  ticker: string;
  currency?: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: string;
  oneYearTarget: number;
  targetReasoning: string;
  financials: FinancialMetric[];
  growthMetrics: GrowthMetrics;
  technicalAnalysis: {
    shortTerm: { stance: 'Bullish' | 'Bearish' | 'Neutral'; target: number; stopLoss: number; reason: string };
    mediumTerm: { stance: 'Bullish' | 'Bearish' | 'Neutral'; target: number; stopLoss: number; reason: string };
    longTerm: { stance: 'Bullish' | 'Bearish' | 'Neutral'; target: number; stopLoss: number; reason: string };
  };
  news: { title: string; date: string; source: string; impact: 'Positive' | 'Neutral' | 'Negative' }[];
  documents: { title: string; type: 'Annual Report' | 'Quarterly Results' | 'Presentation'; date: string; url: string }[];
  managementCommentary: string;
  marketOutlook: string;
  investorInsight: string;
  netProfitMarginTrend?: { year: string; value: number }[];
  promoterHoldingTrend?: { year: string; value: number }[];
  debtLevelTrend?: { year: string; value: number }[];
  operatingCashFlowTrend?: { year: string; value: number }[];
  scores?: {
    corporateGovernance: number;
    marketCap: number;
    earnings: number;
    fundamental: number;
    relativeValuation: number;
    risk: number;
    priceMomentum: number;
    futureOutlook: number;
    overall: number;
  };
  pros: string[];
  cons: string[];
  peers: { name: string; ticker: string; marketCap: string; pe: number; pb: number; roe: number }[];
  isEsop?: boolean;
}

const MOCK_COMPANIES: CompanyResearch[] = [
  {
    id: 'hdfc',
    name: 'HDFC Bank Ltd',
    ticker: 'HDFCBANK',
    sector: 'Banking & Financial Services',
    currentPrice: 1742.80,
    change: 12.40,
    changePercent: 0.72,
    marketCap: '₹11.8L Cr',
    oneYearTarget: 2150,
    targetReasoning: 'Combined fundamental strength post-merger and technical breakout from a 2-year consolidation base.',
    isEsop: true,
    financials: [
      { year: '2017', revenue: 81602, profit: 14550, eps: 28.4, peRatio: 24.5, pbRatio: 4.2, evEbitda: 18.5, mcSales: 4.5, dividendYield: 0.8, roe: 17.9, roce: 12.5, debtToEquity: 0.85 },
      { year: '2018', revenue: 95468, profit: 17487, eps: 33.7, peRatio: 26.2, pbRatio: 4.5, evEbitda: 19.2, mcSales: 4.8, dividendYield: 0.9, roe: 18.2, roce: 12.8, debtToEquity: 0.82 },
      { year: '2019', revenue: 116598, profit: 21078, eps: 38.9, peRatio: 28.1, pbRatio: 4.8, evEbitda: 20.5, mcSales: 5.2, dividendYield: 1.0, roe: 18.5, roce: 13.2, debtToEquity: 0.80 },
      { year: '2020', revenue: 138073, profit: 26257, eps: 48.0, peRatio: 22.4, pbRatio: 3.8, evEbitda: 16.8, mcSales: 4.2, dividendYield: 1.2, roe: 18.9, roce: 13.5, debtToEquity: 0.78 },
      { year: '2021', revenue: 146063, profit: 31116, eps: 56.6, peRatio: 25.8, pbRatio: 4.2, evEbitda: 18.5, mcSales: 4.5, dividendYield: 1.1, roe: 16.6, roce: 11.8, debtToEquity: 0.75 },
      { year: '2022', revenue: 157263, profit: 36961, eps: 66.7, peRatio: 21.5, pbRatio: 3.5, evEbitda: 15.2, mcSales: 3.8, dividendYield: 1.3, roe: 16.8, roce: 12.1, debtToEquity: 0.72 },
      { year: '2023', revenue: 192800, profit: 44108, eps: 79.2, peRatio: 19.8, pbRatio: 3.2, evEbitda: 14.5, mcSales: 3.5, dividendYield: 1.5, roe: 17.2, roce: 12.5, debtToEquity: 0.70 },
      { year: '2024', revenue: 235000, profit: 60811, eps: 80.1, peRatio: 18.5, pbRatio: 2.8, evEbitda: 13.2, mcSales: 3.2, dividendYield: 1.6, roe: 15.5, roce: 11.2, debtToEquity: 0.88 },
      { year: '2025', revenue: 285000, profit: 72500, eps: 95.4, peRatio: 17.2, pbRatio: 2.5, evEbitda: 12.5, mcSales: 2.8, dividendYield: 1.8, roe: 16.2, roce: 11.8, debtToEquity: 0.85 },
      { year: '2026 (P)', revenue: 335000, profit: 85000, eps: 112.0, peRatio: 15.5, pbRatio: 2.2, evEbitda: 11.2, mcSales: 2.5, dividendYield: 2.0, roe: 17.5, roce: 12.5, debtToEquity: 0.82, isProjection: true },
      { year: '2027 (P)', revenue: 395000, profit: 102000, eps: 134.5, peRatio: 13.0, pbRatio: 1.8, evEbitda: 9.5, mcSales: 2.2, dividendYield: 2.2, roe: 18.2, roce: 13.2, debtToEquity: 0.80, isProjection: true },
    ],
    technicalAnalysis: {
      shortTerm: { 
        stance: 'Bullish', 
        target: 1820, 
        stopLoss: 1680, 
        reason: 'Stock has formed a strong base near 1700 levels. RSI is trending upwards from oversold zone.' 
      },
      mediumTerm: { 
        stance: 'Neutral', 
        target: 1950, 
        stopLoss: 1620, 
        reason: 'Consolidating within a broad range of 1600-1800. Moving averages are converging.' 
      },
      longTerm: { 
        stance: 'Bullish', 
        target: 2400, 
        stopLoss: 1500, 
        reason: 'Structural growth story intact post-merger. Valuation at historical lows relative to earnings growth.' 
      },
    },
    news: [
      { title: 'HDFC Bank Q3 Net Profit Rises 33% YoY to ₹16,372 Crore', date: '2026-01-15', source: 'Economic Times', impact: 'Positive' },
      { title: 'RBI Approves Appointment of New Executive Director', date: '2026-02-10', source: 'Moneycontrol', impact: 'Neutral' },
      { title: 'HDFC Bank Plans to Raise ₹50,000 Crore via Infrastructure Bonds', date: '2026-03-05', source: 'LiveMint', impact: 'Positive' },
    ],
    documents: [
      { title: 'Annual Report FY 2024-25', type: 'Annual Report', date: '2025-06-20', url: '#' },
      { title: 'Q3 FY26 Investor Presentation', type: 'Presentation', date: '2026-01-15', url: '#' },
      { title: 'Quarterly Results - Dec 2025', type: 'Quarterly Results', date: '2026-01-15', url: '#' },
    ],
    managementCommentary: "Management remains confident about credit growth of 18-20% over the next 3 years. Focus is on deposit mobilization and synergy benefits from the HDFC merger. NIMs are expected to stabilize at 3.5-3.7% range.",
    marketOutlook: "The Indian banking sector is in a sweet spot with clean balance sheets and robust credit demand. HDFC Bank, as a market leader, is well-positioned to capture incremental market share as the economy grows at 7%+",
    investorInsight: "From an investor perspective, HDFC Bank offers a rare combination of growth and safety. Current valuations (PE of 18x) are significantly below 10-year average (26x), providing a strong margin of safety for long-term investors.",
    pros: ["Consistent 20% profit growth", "Strong asset quality", "Market leadership", "High ROE"],
    cons: ["Merger integration risks", "Slowing deposit growth", "Regulatory changes"],
    peers: [
      { name: "ICICI Bank", ticker: "ICICIBANK", marketCap: "₹7.5L Cr", pe: 18.5, pb: 3.2, roe: 17.5 },
      { name: "Axis Bank", ticker: "AXISBANK", marketCap: "₹3.2L Cr", pe: 14.2, pb: 2.1, roe: 15.8 },
      { name: "Kotak Bank", ticker: "KOTAKBANK", marketCap: "₹3.5L Cr", pe: 22.5, pb: 3.5, roe: 14.2 }
    ],
    growthMetrics: {
      salesGrowth: { '10Y': '18%', '5Y': '16%', '3Y': '15%', '1Y': '14%', 'TTM': '14%' },
      profitGrowth: { '10Y': '20%', '5Y': '18%', '3Y': '17%', '1Y': '16%', 'TTM': '16%' },
      stockPriceCAGR: { '10Y': '15%', '5Y': '12%', '3Y': '10%', '1Y': '8%' },
      roe: { '10Y': '18%', '5Y': '17%', '3Y': '16%', '1Y': '15.5%' }
    },
    netProfitMarginTrend: [
      { year: '2017', value: 17.8 }, { year: '2018', value: 18.3 }, { year: '2019', value: 18.1 }, 
      { year: '2020', value: 19.0 }, { year: '2021', value: 21.3 }, { year: '2022', value: 23.5 }, 
      { year: '2023', value: 22.9 }, { year: '2024', value: 25.8 }, { year: '2025', value: 25.4 }, 
      { year: '2026', value: 25.3 }
    ],
    promoterHoldingTrend: [
      { year: '2017', value: 26.4 }, { year: '2018', value: 26.4 }, { year: '2019', value: 26.2 }, 
      { year: '2020', value: 26.1 }, { year: '2021', value: 25.9 }, { year: '2022', value: 25.8 }, 
      { year: '2023', value: 25.6 }, { year: '2024', value: 0 }, { year: '2025', value: 0 }, 
      { year: '2026', value: 0 }
    ],
    debtLevelTrend: [
      { year: '2017', value: 0.85 }, { year: '2018', value: 0.82 }, { year: '2019', value: 0.80 }, 
      { year: '2020', value: 0.78 }, { year: '2021', value: 0.75 }, { year: '2022', value: 0.72 }, 
      { year: '2023', value: 0.70 }, { year: '2024', value: 0.88 }, { year: '2025', value: 0.85 }, 
      { year: '2026', value: 0.82 }
    ],
    operatingCashFlowTrend: [
      { year: '2017', value: 45000 }, { year: '2018', value: 52000 }, { year: '2019', value: 61000 }, 
      { year: '2020', value: 75000 }, { year: '2021', value: 82000 }, { year: '2022', value: 95000 }, 
      { year: '2023', value: 110000 }, { year: '2024', value: 135000 }, { year: '2025', value: 155000 }, 
      { year: '2026', value: 185000 }
    ],
    scores: {
      corporateGovernance: 95,
      marketCap: 98,
      earnings: 88,
      fundamental: 92,
      relativeValuation: 75,
      risk: 85,
      priceMomentum: 65,
      futureOutlook: 90,
      overall: 86
    }
  },
  {
    id: 'reliance',
    name: 'Reliance Industries Ltd',
    ticker: 'RELIANCE',
    sector: 'Conglomerate',
    currentPrice: 2985.40,
    change: -15.20,
    changePercent: -0.51,
    marketCap: '₹20.2L Cr',
    oneYearTarget: 3600,
    targetReasoning: 'Demerger of Jio and Retail segments to unlock massive value; New Energy business reaching critical milestones.',
    isEsop: true,
    financials: [
      { year: '2017', revenue: 305382, profit: 29901, eps: 101.2, peRatio: 15.4, pbRatio: 1.8, evEbitda: 12.5, mcSales: 1.2, dividendYield: 0.5, roe: 11.5, roce: 9.8, debtToEquity: 0.65 },
      { year: '2018', revenue: 391677, profit: 36075, eps: 121.5, peRatio: 18.2, pbRatio: 2.1, evEbitda: 13.8, mcSales: 1.5, dividendYield: 0.6, roe: 12.8, roce: 10.5, debtToEquity: 0.72 },
      { year: '2019', revenue: 569209, profit: 39588, eps: 133.4, peRatio: 22.5, pbRatio: 2.5, evEbitda: 15.2, mcSales: 1.8, dividendYield: 0.7, roe: 13.2, roce: 11.2, debtToEquity: 0.78 },
      { year: '2020', revenue: 596743, profit: 39354, eps: 132.6, peRatio: 14.8, pbRatio: 1.5, evEbitda: 10.8, mcSales: 1.2, dividendYield: 0.8, roe: 10.5, roce: 8.5, debtToEquity: 0.85 },
      { year: '2021', revenue: 466924, profit: 49128, eps: 165.8, peRatio: 28.5, pbRatio: 2.8, evEbitda: 18.5, mcSales: 2.2, dividendYield: 0.9, roe: 12.2, roce: 10.2, debtToEquity: 0.45 },
      { year: '2022', revenue: 699962, profit: 60705, eps: 204.8, peRatio: 25.2, pbRatio: 2.5, evEbitda: 16.2, mcSales: 1.8, dividendYield: 1.0, roe: 14.5, roce: 12.1, debtToEquity: 0.42 },
      { year: '2023', revenue: 879441, profit: 66702, eps: 225.1, peRatio: 24.1, pbRatio: 2.2, evEbitda: 15.5, mcSales: 1.5, dividendYield: 1.1, roe: 15.2, roce: 12.8, debtToEquity: 0.38 },
      { year: '2024', revenue: 950000, profit: 75000, eps: 253.4, peRatio: 22.5, pbRatio: 2.0, evEbitda: 14.2, mcSales: 1.2, dividendYield: 1.2, roe: 15.8, roce: 13.5, debtToEquity: 0.35 },
      { year: '2025', revenue: 1050000, profit: 88000, eps: 297.2, peRatio: 20.2, pbRatio: 1.8, evEbitda: 12.5, mcSales: 1.0, dividendYield: 1.3, roe: 16.5, roce: 14.2, debtToEquity: 0.32 },
      { year: '2026 (P)', revenue: 1200000, profit: 105000, eps: 354.5, peRatio: 18.5, pbRatio: 1.5, evEbitda: 11.2, mcSales: 0.8, dividendYield: 1.4, roe: 17.2, roce: 15.5, debtToEquity: 0.30, isProjection: true },
      { year: '2027 (P)', revenue: 1400000, profit: 128000, eps: 432.2, peRatio: 16.2, pbRatio: 1.2, evEbitda: 9.5, mcSales: 0.6, dividendYield: 1.5, roe: 18.5, roce: 16.8, debtToEquity: 0.28, isProjection: true },
    ],
    technicalAnalysis: {
      shortTerm: { 
        stance: 'Bearish', 
        target: 2850, 
        stopLoss: 3050, 
        reason: 'Facing resistance at 3000 psychological level. MACD showing bearish crossover.' 
      },
      mediumTerm: { 
        stance: 'Bullish', 
        target: 3250, 
        stopLoss: 2750, 
        reason: 'Forming a cup and handle pattern on weekly charts. Sustained volume growth.' 
      },
      longTerm: { 
        stance: 'Bullish', 
        target: 4500, 
        stopLoss: 2400, 
        reason: 'Value unlocking from Retail and Jio demergers. New Energy business to drive next leg of growth.' 
      },
    },
    news: [
      { title: 'Reliance Jio Adds 5 Million Subscribers in February', date: '2026-03-12', source: 'Business Standard', impact: 'Positive' },
      { title: 'Reliance Retail Acquires Majority Stake in Global Fashion Brand', date: '2026-02-25', source: 'CNBC TV18', impact: 'Positive' },
      { title: 'Crude Oil Volatility Impacts O2C Margins', date: '2026-03-20', source: 'Reuters', impact: 'Negative' },
    ],
    documents: [
      { title: 'Annual Report FY 2024-25', type: 'Annual Report', date: '2025-07-15', url: '#' },
      { title: 'Q3 FY26 Earnings Presentation', type: 'Presentation', date: '2026-01-20', url: '#' },
      { title: 'Sustainability Report 2025', type: 'Presentation', date: '2025-08-10', url: '#' },
    ],
    managementCommentary: "Focus is on scaling the New Energy ecosystem and achieving Net Zero by 2035. Retail and Digital services are now contributing over 50% to EBITDA. Capex cycle is peaking, leading to improved free cash flows.",
    marketOutlook: "Conglomerates with strong digital and consumer presence are favored in the current high-growth Indian economy. Reliance's pivot from O2C to Consumer/Green Energy is a structural positive.",
    investorInsight: "Reliance is no longer just an oil play; it's a proxy for the Indian consumer and digital economy. Investors should look at the sum-of-the-parts (SOTP) valuation which suggests significant upside from current levels.",
    pros: ["Diversified revenue streams", "Jio's digital dominance", "Retail segment growth", "New Energy pivot"],
    cons: ["High capital expenditure", "O2C cyclicality", "Complexity of conglomerate structure"],
    peers: [
      { name: "Tata Group", ticker: "TATA", marketCap: "₹25L Cr", pe: 22.5, pb: 3.5, roe: 14.2 },
      { name: "Adani Ent", ticker: "ADANIENT", marketCap: "₹4.5L Cr", pe: 85.2, pb: 8.5, roe: 10.5 }
    ],
    growthMetrics: {
      salesGrowth: { '10Y': '15%', '5Y': '18%', '3Y': '22%', '1Y': '24%', 'TTM': '25%' },
      profitGrowth: { '10Y': '12%', '5Y': '15%', '3Y': '18%', '1Y': '19%', 'TTM': '20%' },
      stockPriceCAGR: { '10Y': '18%', '5Y': '22%', '3Y': '25%', '1Y': '30%' },
      roe: { '10Y': '12%', '5Y': '13%', '3Y': '14%', '1Y': '15.8%' }
    },
    scores: {
      corporateGovernance: 88,
      marketCap: 99,
      earnings: 82,
      fundamental: 85,
      relativeValuation: 70,
      risk: 75,
      priceMomentum: 80,
      futureOutlook: 95,
      overall: 84
    }
  },
  {
    id: 'tcs',
    name: 'Tata Consultancy Services',
    ticker: 'TCS',
    sector: 'Information Technology',
    currentPrice: 4120.75,
    change: 45.30,
    changePercent: 1.11,
    marketCap: '₹15.1L Cr',
    oneYearTarget: 4800,
    targetReasoning: 'Strong deal pipeline in AI and Cloud transformation; historical premium valuation justified by consistent 20%+ ROE.',
    isEsop: false,
    financials: [
      { year: '2017', revenue: 117966, profit: 26289, eps: 134.2, peRatio: 18.5, pbRatio: 5.2, evEbitda: 14.2, mcSales: 4.2, dividendYield: 1.5, roe: 32.5, roce: 28.5, debtToEquity: 0.02 },
      { year: '2018', revenue: 123104, profit: 25826, eps: 135.1, peRatio: 22.4, pbRatio: 6.5, evEbitda: 16.8, mcSales: 4.8, dividendYield: 1.6, roe: 30.1, roce: 26.2, debtToEquity: 0.01 },
      { year: '2019', revenue: 146463, profit: 31472, eps: 167.8, peRatio: 24.5, pbRatio: 7.2, evEbitda: 18.5, mcSales: 5.2, dividendYield: 1.8, roe: 35.2, roce: 30.5, debtToEquity: 0.01 },
      { year: '2020', revenue: 156949, profit: 32340, eps: 172.4, peRatio: 21.2, pbRatio: 5.8, evEbitda: 15.2, mcSales: 4.5, dividendYield: 2.0, roe: 37.5, roce: 32.8, debtToEquity: 0.02 },
      { year: '2021', revenue: 164177, profit: 32430, eps: 175.2, peRatio: 32.5, pbRatio: 8.5, evEbitda: 22.5, mcSales: 6.2, dividendYield: 2.2, roe: 38.2, roce: 34.2, debtToEquity: 0.01 },
      { year: '2022', revenue: 191754, profit: 38327, eps: 204.5, peRatio: 30.1, pbRatio: 7.8, evEbitda: 20.2, mcSales: 5.8, dividendYield: 2.5, roe: 42.5, roce: 38.5, debtToEquity: 0.01 },
      { year: '2023', revenue: 225458, profit: 42147, eps: 228.4, peRatio: 28.5, pbRatio: 7.2, evEbitda: 18.8, mcSales: 5.2, dividendYield: 2.8, roe: 45.1, roce: 40.2, debtToEquity: 0.01 },
      { year: '2024', revenue: 245000, profit: 48000, eps: 262.5, peRatio: 26.2, pbRatio: 6.8, evEbitda: 17.5, mcSales: 4.8, dividendYield: 3.0, roe: 46.5, roce: 42.5, debtToEquity: 0.01 },
      { year: '2025', revenue: 275000, profit: 55000, eps: 301.2, peRatio: 24.8, pbRatio: 6.2, evEbitda: 16.2, mcSales: 4.2, dividendYield: 3.2, roe: 48.2, roce: 44.2, debtToEquity: 0.01 },
      { year: '2026 (P)', revenue: 310000, profit: 65000, eps: 355.4, peRatio: 22.5, pbRatio: 5.5, evEbitda: 14.5, mcSales: 3.8, dividendYield: 3.5, roe: 50.1, roce: 46.5, debtToEquity: 0.01, isProjection: true },
      { year: '2027 (P)', revenue: 355000, profit: 78000, eps: 425.8, peRatio: 20.1, pbRatio: 4.8, evEbitda: 12.8, mcSales: 3.2, dividendYield: 3.8, roe: 52.5, roce: 48.2, debtToEquity: 0.01, isProjection: true },
    ],
    technicalAnalysis: {
      shortTerm: { stance: 'Bullish', target: 4350, stopLoss: 3980, reason: 'Breakout from inverted head and shoulders pattern.' },
      mediumTerm: { stance: 'Bullish', target: 4600, stopLoss: 3800, reason: 'Trading above all major long-term moving averages.' },
      longTerm: { stance: 'Bullish', target: 5500, stopLoss: 3500, reason: 'Dominant market position in global IT services.' },
    },
    news: [
      { title: 'TCS Wins $2 Billion Mega Deal from UK Retailer', date: '2026-03-01', source: 'Reuters', impact: 'Positive' },
      { title: 'TCS Announces 100% Variable Pay for Employees', date: '2026-02-15', source: 'ET Now', impact: 'Positive' },
    ],
    documents: [
      { title: 'Annual Report FY 2024-25', type: 'Annual Report', date: '2025-06-10', url: '#' },
      { title: 'Q3 FY26 Results Presentation', type: 'Presentation', date: '2026-01-12', url: '#' },
    ],
    managementCommentary: "We are seeing strong traction in Generative AI projects. Our order book is at an all-time high. Margin expansion remains a priority through operational excellence.",
    marketOutlook: "Global IT spending is expected to grow at 8% CAGR. Indian IT firms are gaining share due to cost-efficiency and talent pool.",
    investorInsight: "TCS is a compounding machine. Its high dividend payout and buyback history make it an ideal core holding for conservative equity investors.",
    pros: ["Market leader in IT services", "Exceptional ROE/ROCE", "Debt-free balance sheet", "Strong deal pipeline"],
    cons: ["Global macro headwinds", "High talent costs", "Currency volatility"],
    peers: [
      { name: "Infosys", ticker: "INFY", marketCap: "₹6.7L Cr", pe: 24.5, pb: 5.8, roe: 32.5 },
      { name: "Wipro", ticker: "WIPRO", marketCap: "₹2.5L Cr", pe: 18.2, pb: 2.5, roe: 15.8 },
      { name: "HCL Tech", ticker: "HCLTECH", marketCap: "₹3.8L Cr", pe: 20.5, pb: 3.2, roe: 22.5 }
    ],
    growthMetrics: {
      salesGrowth: { '10Y': '12%', '5Y': '10%', '3Y': '12%', '1Y': '11%', 'TTM': '11%' },
      profitGrowth: { '10Y': '10%', '5Y': '12%', '3Y': '11%', '1Y': '12%', 'TTM': '13%' },
      stockPriceCAGR: { '10Y': '15%', '5Y': '18%', '3Y': '22%', '1Y': '25%' },
      roe: { '10Y': '35%', '5Y': '38%', '3Y': '42%', '1Y': '46.5%' }
    },
    scores: {
      corporateGovernance: 98,
      marketCap: 97,
      earnings: 92,
      fundamental: 96,
      relativeValuation: 65,
      risk: 90,
      priceMomentum: 75,
      futureOutlook: 88,
      overall: 88
    }
  },
  {
    id: 'infosys',
    name: 'Infosys Ltd',
    ticker: 'INFY',
    sector: 'Information Technology',
    currentPrice: 1620.40,
    change: -5.60,
    changePercent: -0.34,
    marketCap: '₹6.7L Cr',
    oneYearTarget: 1950,
    targetReasoning: 'Strong guidance on digital transformation and cloud services; attractive valuation compared to historical averages.',
    isEsop: true,
    financials: [
      { year: '2017', revenue: 68484, profit: 14353, eps: 62.8, peRatio: 15.2, pbRatio: 3.8, evEbitda: 10.5, mcSales: 3.2, dividendYield: 1.8, roe: 22.5, roce: 18.5, debtToEquity: 0.01 },
      { year: '2018', revenue: 70522, profit: 16029, eps: 70.1, peRatio: 16.5, pbRatio: 4.2, evEbitda: 11.8, mcSales: 3.5, dividendYield: 2.0, roe: 23.2, roce: 19.2, debtToEquity: 0.01 },
      { year: '2019', revenue: 82675, profit: 15404, eps: 67.4, peRatio: 18.2, pbRatio: 4.8, evEbitda: 12.5, mcSales: 3.8, dividendYield: 2.2, roe: 24.5, roce: 20.5, debtToEquity: 0.01 },
      { year: '2020', revenue: 90791, profit: 16594, eps: 72.6, peRatio: 14.5, pbRatio: 3.5, evEbitda: 9.8, mcSales: 3.2, dividendYield: 2.5, roe: 25.2, roce: 21.2, debtToEquity: 0.01 },
      { year: '2021', revenue: 100472, profit: 19351, eps: 84.5, peRatio: 25.4, pbRatio: 5.8, evEbitda: 15.2, mcSales: 4.5, dividendYield: 2.8, roe: 27.1, roce: 22.8, debtToEquity: 0.01 },
      { year: '2022', revenue: 121641, profit: 22110, eps: 96.6, peRatio: 22.1, pbRatio: 5.2, evEbitda: 13.8, mcSales: 4.2, dividendYield: 3.0, roe: 29.2, roce: 24.5, debtToEquity: 0.01 },
      { year: '2023', revenue: 146767, profit: 24095, eps: 105.4, peRatio: 20.5, pbRatio: 4.8, evEbitda: 12.5, mcSales: 3.8, dividendYield: 3.2, roe: 31.5, roce: 26.8, debtToEquity: 0.01 },
      { year: '2024', revenue: 160000, profit: 28000, eps: 122.5, peRatio: 18.2, pbRatio: 4.2, evEbitda: 11.2, mcSales: 3.5, dividendYield: 3.5, roe: 32.5, roce: 28.2, debtToEquity: 0.01 },
      { year: '2025', revenue: 185000, profit: 34000, eps: 148.8, peRatio: 16.5, pbRatio: 3.8, evEbitda: 10.5, mcSales: 3.2, dividendYield: 3.8, roe: 34.2, roce: 30.5, debtToEquity: 0.01 },
      { year: '2026 (P)', revenue: 215000, profit: 42000, eps: 183.8, peRatio: 14.2, pbRatio: 3.2, evEbitda: 9.2, mcSales: 2.8, dividendYield: 4.0, roe: 36.5, roce: 32.8, debtToEquity: 0.01, isProjection: true },
      { year: '2027 (P)', revenue: 255000, profit: 52000, eps: 227.5, peRatio: 12.5, pbRatio: 2.8, evEbitda: 8.5, mcSales: 2.5, dividendYield: 4.2, roe: 38.2, roce: 34.5, debtToEquity: 0.01, isProjection: true },
    ],
    technicalAnalysis: {
      shortTerm: { stance: 'Neutral', target: 1700, stopLoss: 1580, reason: 'Consolidating in a tight range with low volume.' },
      mediumTerm: { stance: 'Bullish', target: 1850, stopLoss: 1500, reason: 'Forming a double bottom on the daily chart.' },
      longTerm: { stance: 'Bullish', target: 2200, stopLoss: 1400, reason: 'Solid dividend yield and strong cash flow generation.' },
    },
    news: [
      { title: 'Infosys Expands Strategic Collaboration with Microsoft', date: '2026-03-05', source: 'LiveMint', impact: 'Positive' },
      { title: 'Infosys Q3 Results: Profit Beats Estimates', date: '2026-01-12', source: 'Economic Times', impact: 'Positive' },
    ],
    documents: [
      { title: 'Annual Report FY 2024-25', type: 'Annual Report', date: '2025-06-15', url: '#' },
      { title: 'Q3 FY26 Earnings Presentation', type: 'Presentation', date: '2026-01-12', url: '#' },
    ],
    managementCommentary: "We are seeing a resurgence in discretionary spending among our large clients. Our focus on AI-first offerings is differentiating us in the market.",
    marketOutlook: "The shift towards digital and cloud is a multi-year trend. Infosys is well-positioned to capture this growth.",
    investorInsight: "Infosys offers a high margin of safety at current valuations. It remains a top pick in the IT sector for value-conscious investors.",
    pros: ["Strong digital transformation focus", "High free cash flow generation", "Attractive valuation", "Solid dividend yield"],
    cons: ["Management transition risks", "Competitive pricing pressure", "Slowdown in discretionary spend"],
    peers: [
      { name: "TCS", ticker: "TCS", marketCap: "₹15.1L Cr", pe: 28.5, pb: 7.2, roe: 45.1 },
      { name: "Wipro", ticker: "WIPRO", marketCap: "₹2.5L Cr", pe: 18.2, pb: 2.5, roe: 15.8 },
      { name: "HCL Tech", ticker: "HCLTECH", marketCap: "₹3.8L Cr", pe: 20.5, pb: 3.2, roe: 22.5 }
    ],
    growthMetrics: {
      salesGrowth: { '10Y': '11%', '5Y': '12%', '3Y': '14%', '1Y': '13%', 'TTM': '13%' },
      profitGrowth: { '10Y': '9%', '5Y': '11%', '3Y': '13%', '1Y': '12%', 'TTM': '12%' },
      stockPriceCAGR: { '10Y': '14%', '5Y': '16%', '3Y': '18%', '1Y': '20%' },
      roe: { '10Y': '24%', '5Y': '26%', '3Y': '29%', '1Y': '32.5%' }
    },
    scores: {
      corporateGovernance: 96,
      marketCap: 92,
      earnings: 85,
      fundamental: 88,
      relativeValuation: 82,
      risk: 88,
      priceMomentum: 70,
      futureOutlook: 85,
      overall: 85
    }
  },
  {
    id: 'suzlon',
    name: 'Suzlon Energy Ltd',
    ticker: 'SUZLON',
    sector: 'Renewable Energy',
    currentPrice: 42.50,
    change: 1.25,
    changePercent: 3.03,
    marketCap: '₹58K Cr',
    oneYearTarget: 65,
    targetReasoning: 'Strong order book in wind energy and debt-free status driving fundamental re-rating; technical breakout above 40 levels.',
    isEsop: true,
    financials: [
      { year: '2017', revenue: 12692, profit: 839, eps: 1.6, peRatio: 12.5, pbRatio: 1.5, evEbitda: 10.2, mcSales: 0.8, dividendYield: 0, roe: 8.5, roce: 6.2, debtToEquity: 4.50 },
      { year: '2018', revenue: 8085, profit: -384, eps: -0.7, peRatio: 0, pbRatio: 1.2, evEbitda: 0, mcSales: 0.6, dividendYield: 0, roe: -5.2, roce: -2.1, debtToEquity: 5.20 },
      { year: '2019', revenue: 4978, profit: -1537, eps: -2.9, peRatio: 0, pbRatio: 0.8, evEbitda: 0, mcSales: 0.4, dividendYield: 0, roe: -12.5, roce: -8.5, debtToEquity: 8.50 },
      { year: '2020', revenue: 2973, profit: -2692, eps: -5.1, peRatio: 0, pbRatio: 0.5, evEbitda: 0, mcSales: 0.3, dividendYield: 0, roe: -25.4, roce: -15.2, debtToEquity: 12.40 },
      { year: '2021', revenue: 3346, profit: -104, eps: -0.2, peRatio: 0, pbRatio: 0.6, evEbitda: 0, mcSales: 0.5, dividendYield: 0, roe: -2.1, roce: 1.2, debtToEquity: 6.50 },
      { year: '2022', revenue: 4350, profit: -166, eps: -0.3, peRatio: 0, pbRatio: 1.1, evEbitda: 15.2, mcSales: 1.2, dividendYield: 0, roe: -3.5, roce: 2.5, debtToEquity: 3.20 },
      { year: '2023', revenue: 5971, profit: 2887, eps: 2.2, peRatio: 15.4, pbRatio: 2.5, evEbitda: 12.5, mcSales: 2.5, dividendYield: 0, roe: 12.5, roce: 10.8, debtToEquity: 0.15 },
      { year: '2024', revenue: 7500, profit: 1200, eps: 0.9, peRatio: 45.2, pbRatio: 4.8, evEbitda: 22.5, mcSales: 4.2, dividendYield: 0, roe: 15.8, roce: 14.2, debtToEquity: 0.05 },
      { year: '2025', revenue: 10500, profit: 1800, eps: 1.4, peRatio: 30.5, pbRatio: 3.5, evEbitda: 18.2, mcSales: 3.5, dividendYield: 0, roe: 18.2, roce: 16.5, debtToEquity: 0.02 },
      { year: '2026 (P)', revenue: 14500, profit: 2800, eps: 2.1, peRatio: 20.2, pbRatio: 2.8, evEbitda: 12.5, mcSales: 2.8, dividendYield: 0.5, roe: 22.5, roce: 19.8, debtToEquity: 0.01, isProjection: true },
      { year: '2027 (P)', revenue: 19500, profit: 4200, eps: 3.2, peRatio: 13.5, pbRatio: 2.2, evEbitda: 9.2, mcSales: 2.2, dividendYield: 1.0, roe: 25.8, roce: 22.5, debtToEquity: 0.01, isProjection: true },
    ],
    technicalAnalysis: {
      shortTerm: { stance: 'Bullish', target: 48, stopLoss: 38, reason: 'Breakout from a bullish flag pattern on daily charts.' },
      mediumTerm: { stance: 'Bullish', target: 55, stopLoss: 35, reason: 'Trading above 50 and 200 day moving averages with high volumes.' },
      longTerm: { stance: 'Bullish', target: 85, stopLoss: 25, reason: 'Multi-year breakout on monthly charts; structural turnaround.' },
    },
    news: [
      { title: 'Suzlon Bags 225 MW Wind Power Project from Leading PSU', date: '2026-03-25', source: 'Moneycontrol', impact: 'Positive' },
      { title: 'Suzlon Becomes Debt-Free After Successful QIP', date: '2026-02-10', source: 'Economic Times', impact: 'Positive' },
    ],
    documents: [
      { title: 'Annual Report FY 2024-25', type: 'Annual Report', date: '2025-07-05', url: '#' },
      { title: 'Investor Presentation Q3 FY26', type: 'Presentation', date: '2026-01-25', url: '#' },
    ],
    managementCommentary: "Our focus is on execution of the 3.1 GW order book. We are seeing strong demand for our 3 MW series turbines. The balance sheet is now robust for the next phase of growth.",
    marketOutlook: "India's target of 500 GW non-fossil fuel capacity by 2030 is a massive opportunity for wind energy players.",
    investorInsight: "Suzlon is a classic turnaround story. With debt issues behind it and a leadership position in a growing sector, it offers high growth potential for risk-tolerant investors.",
    pros: ["Debt-free balance sheet", "Strong 3.1 GW order book", "Market leader in wind energy", "Turnaround in profitability"],
    cons: ["Historical execution issues", "Regulatory changes in wind policy", "High competition from global players"],
    peers: [
      { name: "Inox Wind", ticker: "INOXWIND", marketCap: "₹18K Cr", pe: 55.2, pb: 6.5, roe: 10.2 },
      { name: "GE Vernova", ticker: "GEV", marketCap: "₹85K Cr", pe: 42.5, pb: 5.2, roe: 12.8 },
      { name: "Siemens Gamesa", ticker: "SGREN", marketCap: "₹45K Cr", pe: 38.2, pb: 4.8, roe: 11.5 }
    ],
    growthMetrics: {
      salesGrowth: { '10Y': '', '5Y': '30%', '3Y': '18%', '1Y': '55%', 'TTM': '62%' },
      profitGrowth: { '10Y': '8%', '5Y': '23%', '3Y': '195%', '1Y': '165%', 'TTM': '176%' },
      stockPriceCAGR: { '10Y': '12%', '5Y': '54%', '3Y': '71%', '1Y': '-29%' },
      roe: { '10Y': '5%', '5Y': '12%', '3Y': '15.5%', '1Y': '41%' }
    },
    scores: {
      corporateGovernance: 65,
      marketCap: 70,
      earnings: 75,
      fundamental: 60,
      relativeValuation: 55,
      risk: 40,
      priceMomentum: 92,
      futureOutlook: 95,
      overall: 68
    }
  }
];

const GrowthCard: React.FC<{ title: string; data: Record<string, string | undefined> }> = ({ title, data }) => (
  <div className="premium-card p-6">
    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h5>
    <div className="space-y-3">
      {Object.entries(data).map(([label, value]) => {
        let displayLabel = label;
        if (label === 'LastYear') displayLabel = 'Last Year';
        else if (label === 'TTM') displayLabel = 'TTM';
        else if (label === '1Y') displayLabel = '1 Year';
        else displayLabel = label.replace(/([0-9]+)Y/, '$1 Years');

        return (
          <div key={label} className="flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">{displayLabel}:</span>
            <span className="text-sm font-bold text-wealth-navy">{value || '-'}</span>
          </div>
        );
      })}
    </div>
  </div>
);

const ScoreCard: React.FC<{ label: string; score: number; color?: string }> = ({ label, score, color = 'bg-wealth-gold' }) => (
  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-wealth-navy">{score}/100</span>
    </div>
    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

const TrendChart: React.FC<{ title: string; data: { year: string; value: number }[]; color: string; unit?: string }> = ({ title, data, color, unit = '' }) => (
  <div className="premium-card p-6">
    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{title}</h5>
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#64748b' }} />
          <RechartsTooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color${title.replace(/\s/g, '')})`} name={title} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const StockResearch: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyResearch[]>(MOCK_COMPANIES);
  const [selectedCompanyId, setSelectedCompanyId] = useState(MOCK_COMPANIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'Financials' | 'Technical' | 'News' | 'Insights'>('Financials');

  const syncPrices = async (force = false) => {
    setIsSyncing(true);
    try {
      const tickers = companies.map(c => c.ticker);
      const liveData = await fetchLiveMarketData(tickers, { force });
      
      setCompanies(prev => prev.map(c => {
        const live = liveData[c.ticker];
        if (!live) return c;
        return {
          ...c,
          currentPrice: live.price,
          change: live.prevClose ? live.price - live.prevClose : c.change,
          changePercent: live.prevClose ? ((live.price - live.prevClose) / live.prevClose) * 100 : c.changePercent,
        };
      }));
    } catch (error) {
      console.error("Failed to sync prices in research:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncPrices(); // Initial sync on component mount
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, companies]);

  const company = useMemo(() => 
    companies.find(c => c.id === selectedCompanyId) || companies[0]
  , [selectedCompanyId, companies]);

  const isGlobal = useMemo(() => {
    if (company.currency) return company.currency === 'USD';
    return company.marketCap.includes('$') || company.currentPrice > 100000 || !company.marketCap.includes('₹');
  }, [company]);

  const currencySymbol = isGlobal ? '$' : '₹';
  const financialUnits = (company as any).financialUnits || (isGlobal ? 'M' : 'Cr');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(isGlobal ? 'en-US' : 'en-IN', { 
      style: 'currency', 
      currency: isGlobal ? 'USD' : 'INR', 
      maximumFractionDigits: 0 
    }).format(val);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const result = await fetchStockResearch(searchQuery);
      if (result && result.name) {
        // Add to companies list if not already there
        setCompanies(prev => {
          const exists = prev.find(c => c.id === result.id || c.ticker === result.ticker);
          if (exists) return prev;
          return [result, ...prev];
        });
        setSelectedCompanyId(result.id);
        setSearchQuery(''); // Clear search after success
      }
    } catch (error) {
      console.error("Research failed:", error);
      alert("Failed to research this stock. Please try a valid ticker symbol (e.g., AAPL, RELIANCE, MSFT).");
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-select first result if current selection is filtered out
  useEffect(() => {
    if (filteredCompanies.length > 0 && !filteredCompanies.find(c => c.id === selectedCompanyId)) {
      setSelectedCompanyId(filteredCompanies[0].id);
    }
  }, [filteredCompanies, selectedCompanyId]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Search/Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-wealth-navy rounded-2xl flex items-center justify-center text-wealth-gold shadow-xl">
            <BarChart3 size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-wealth-navy tracking-tight">{company.name}</h2>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                {company.ticker}
              </span>
              {company.isEsop && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                  ESOP Stock
                </span>
              )}
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <Landmark size={14} className="text-wealth-gold" />
              {company.sector} • {company.marketCap} Market Cap
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {company.scores && (
            <div className="text-center px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Research Score</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-wealth-navy">{company.scores.overall}</span>
                <span className="text-xs font-bold text-slate-400">/100</span>
              </div>
            </div>
          )}

          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Price</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-bold text-wealth-navy">{currencySymbol}{company.currentPrice.toLocaleString()}</span>
              <div className="flex flex-col">
                <span className={`flex items-center gap-1 font-bold ${company.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {company.change >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  {Math.abs(company.changePercent).toFixed(2)}%
                </span>
                <button 
                  onClick={() => syncPrices(true)}
                  disabled={isSyncing}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-wealth-gold transition-colors justify-end"
                >
                  <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Sync Price"}
                </button>
              </div>
            </div>
          </div>

          <div className="h-12 w-px bg-slate-100 hidden lg:block" />

          <div className="flex flex-col gap-2 min-w-[320px]">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Search any stock (e.g. AAPL, RELIANCE)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 focus:border-wealth-gold outline-none"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-wealth-navy text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-wealth-gold" />}
                Research
              </button>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none appearance-none cursor-pointer"
              >
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.ticker})</option>
                  ))
                ) : (
                  <option disabled>No companies found</option>
                )}
              </select>
              <button
                onClick={() => {
                  (window as any).openInvestmentModal?.({
                    name: company.name,
                    symbol: company.ticker.includes('.') ? company.ticker : `${company.ticker}${isGlobal ? '' : '.NS'}`,
                    category: 'Equity',
                    subCategory: isGlobal ? 'Global Equity' : 'Mid Cap',
                    sector: company.sector,
                    price: company.currentPrice
                  });
                }}
                className="px-4 py-2 bg-wealth-gold text-wealth-navy rounded-xl text-xs font-bold hover:bg-wealth-gold/90 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={14} />
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Year Target Highlight */}
      <div className="bg-gradient-to-r from-wealth-navy to-slate-800 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-wealth-gold/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-wealth-gold/20 border border-wealth-gold/30 rounded-full text-wealth-gold text-xs font-bold uppercase tracking-widest">
              <Target size={14} />
              1-Year Research Target
            </div>
            <h3 className="text-4xl font-bold tracking-tight">
              Projected Target: <span className="text-wealth-gold">{currencySymbol}{company.oneYearTarget.toLocaleString()}</span>
            </h3>
            <p className="text-slate-300 text-lg leading-relaxed font-medium max-w-2xl">
              {company.targetReasoning}
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fundamental: Strong Buy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Technical: Bullish</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] text-center min-w-[200px]">
            {company.scores && (
              <div className="mb-6 pb-6 border-b border-white/10">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Research Score</p>
                <p className="text-4xl font-black text-wealth-gold">{company.scores.overall}<span className="text-lg text-white/40">/100</span></p>
              </div>
            )}
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Potential Upside</p>
            <p className="text-5xl font-bold text-emerald-400">
              +{Math.round(((company.oneYearTarget - company.currentPrice) / company.currentPrice) * 100)}%
            </p>
            <div className="mt-6 pt-6 border-t border-white/10">
              <button className="w-full py-3 bg-wealth-gold text-wealth-navy rounded-xl text-xs font-bold hover:bg-amber-400 transition-all shadow-lg">
                View Full Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        {(['Financials', 'Technical', 'News', 'Insights'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === tab 
                ? 'bg-white text-wealth-navy shadow-md' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'Financials' && <BarChart3 size={16} />}
            {tab === 'Technical' && <Activity size={16} />}
            {tab === 'News' && <Newspaper size={16} />}
            {tab === 'Insights' && <Sparkles size={16} />}
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'Financials' && (
          <motion.div
            key="financials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Growth Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="premium-card p-8">
                <h4 className="text-lg font-bold text-wealth-navy mb-8 flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  Revenue & Profit Growth (10Y + Projections)
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={company.financials}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F172A" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#B45309" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#B45309" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#0F172A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name={`Revenue (${financialUnits})`} />
                      <Area type="monotone" dataKey="profit" stroke="#B45309" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name={`Net Profit (${financialUnits})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="premium-card p-8">
                <h4 className="text-lg font-bold text-wealth-navy mb-8 flex items-center gap-2">
                  <PieChart className="text-wealth-gold" size={20} />
                  Efficiency Ratios (ROE, ROCE & Debt/Equity)
                </h4>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={company.financials}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="top" height={36}/>
                      <Line yAxisId="left" type="monotone" dataKey="roe" stroke="#065F46" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="ROE (%)" />
                      <Line yAxisId="left" type="monotone" dataKey="roce" stroke="#0891B2" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="ROCE (%)" />
                      <Line yAxisId="right" type="monotone" dataKey="debtToEquity" stroke="#991B1B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Debt/Equity" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Valuation Trends Section */}
            <div className="premium-card p-8">
              <h4 className="text-lg font-bold text-wealth-navy mb-8 flex items-center gap-2">
                <Target className="text-wealth-gold" size={20} />
                Valuation Trends (10-Year Analysis)
              </h4>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={company.financials}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Line type="monotone" dataKey="peRatio" stroke="#0F172A" strokeWidth={2} dot={{ r: 3 }} name="P/E Ratio" />
                    <Line type="monotone" dataKey="pbRatio" stroke="#B45309" strokeWidth={2} dot={{ r: 3 }} name="P/B Ratio" />
                    <Line type="monotone" dataKey="evEbitda" stroke="#065F46" strokeWidth={2} dot={{ r: 3 }} name="EV/EBITDA" />
                    <Line type="monotone" dataKey="mcSales" stroke="#991B1B" strokeWidth={2} dot={{ r: 3 }} name="M.Cap/Sales" />
                    <Line type="monotone" dataKey="dividendYield" stroke="#0891B2" strokeWidth={2} dot={{ r: 3 }} name="Div. Yield (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growth Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GrowthCard title="Compounded Sales Growth" data={company.growthMetrics.salesGrowth} />
              <GrowthCard title="Compounded Profit Growth" data={company.growthMetrics.profitGrowth} />
              <GrowthCard title="Stock Price CAGR" data={company.growthMetrics.stockPriceCAGR} />
              <GrowthCard title="Return on Equity" data={company.growthMetrics.roe} />
            </div>

            {/* Pros & Cons and Peer Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 premium-card p-8">
                <h4 className="text-lg font-bold text-wealth-navy mb-8 flex items-center gap-2">
                  <ShieldCheck className="text-emerald-500" size={20} />
                  Pros & Cons Analysis
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                      <Plus size={16} />
                      Strengths (Pros)
                    </h5>
                    <ul className="space-y-3">
                      {company.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-rose-600 flex items-center gap-2">
                      <ShieldAlert size={16} />
                      Risks (Cons)
                    </h5>
                    <ul className="space-y-3">
                      {company.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="premium-card p-8">
                <h4 className="text-lg font-bold text-wealth-navy mb-8 flex items-center gap-2">
                  <Activity className="text-wealth-gold" size={20} />
                  Peer Comparison
                </h4>
                <div className="space-y-6">
                  {company.peers.map((peer, index) => (
                    <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-wealth-navy">{peer.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{peer.ticker}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">P/E Ratio</p>
                          <p className="text-sm font-bold text-wealth-navy">{peer.pe}x</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">P/B Ratio</p>
                          <p className="text-sm font-bold text-wealth-navy">{peer.pb}x</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ROE (%)</p>
                          <p className="text-sm font-bold text-wealth-navy">{peer.roe}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">M.Cap</p>
                          <p className="text-sm font-bold text-wealth-navy">{peer.marketCap}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial Table */}
            <div className="premium-card overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-lg font-bold text-wealth-navy">10-Year Financial & Ratio Analysis</h4>
                <button className="text-wealth-gold hover:text-amber-600 text-sm font-bold flex items-center gap-2">
                  <Download size={16} />
                  Export Data
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue ({financialUnits})</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Profit ({financialUnits})</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">EPS ({currencySymbol})</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">P/E</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">P/B</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">EV/EBITDA</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">MC/Sales</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Div. Yield</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROE (%)</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROCE (%)</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">D/E</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {company.financials.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${row.isProjection ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${row.isProjection ? 'text-wealth-gold' : 'text-wealth-navy'}`}>
                            {row.year}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{row.revenue.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.profit.toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.eps}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.peRatio}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.pbRatio}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.evEbitda}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.mcSales}</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.dividendYield}%</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.roe}%</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.roce}%</td>
                        <td className="px-6 py-4 font-mono text-xs">{row.debtToEquity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'Technical' && (
          <motion.div
            key="technical"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {(['shortTerm', 'mediumTerm', 'longTerm'] as const).map((term) => {
                const data = company.technicalAnalysis[term];
                const label = term === 'shortTerm' ? 'Short Term (1-3M)' : term === 'mediumTerm' ? 'Medium Term (6-12M)' : 'Long Term (1-3Y)';
                
                return (
                  <div key={term} className="premium-card p-8 relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-2 h-full ${
                      data.stance === 'Bullish' ? 'bg-emerald-500' : data.stance === 'Bearish' ? 'bg-rose-500' : 'bg-slate-300'
                    }`} />
                    
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{label}</p>
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        data.stance === 'Bullish' ? 'bg-emerald-50 text-emerald-600' : data.stance === 'Bearish' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {data.stance} Stance
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</p>
                        <p className="text-xl font-bold text-wealth-navy">{currencySymbol}{data.target}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-6 italic">
                      "{data.reason}"
                    </p>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stop Loss</p>
                        <p className="font-bold text-rose-600">{currencySymbol}{data.stopLoss}</p>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-wealth-gold transition-colors">
                        <Zap size={20} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="premium-card p-8">
              <div className="flex items-center justify-between mb-10">
                <h4 className="text-lg font-bold text-wealth-navy flex items-center gap-2">
                  <Activity className="text-wealth-gold" size={20} />
                  Technical Chart & Analysis Tools
                </h4>
                <div className="flex items-center gap-2">
                  {['1D', '1W', '1M', '1Y', '5Y'].map(p => (
                    <button key={p} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      p === '1Y' ? 'bg-wealth-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-[400px] bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                   <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={company.financials}>
                      <Line type="monotone" dataKey="peRatio" stroke="#0F172A" strokeWidth={1} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center space-y-4 relative z-10">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-wealth-gold mx-auto">
                    <Activity size={32} />
                  </div>
                  <div>
                    <p className="text-wealth-navy font-bold">Interactive Charting Interface</p>
                    <p className="text-slate-500 text-xs">Real-time technical tools (RSI, MACD, Bollinger Bands) are active in the full terminal.</p>
                  </div>
                  <button className="px-6 py-2 bg-wealth-navy text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg">
                    Launch Advanced Terminal
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'News' && (
          <motion.div
            key="news"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-lg font-bold text-wealth-navy flex items-center gap-2">
                <Newspaper className="text-wealth-gold" size={20} />
                Latest Corporate Developments
              </h4>
              <div className="space-y-4">
                {company.news.map((item, idx) => (
                  <div key={idx} className="premium-card p-6 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                        item.impact === 'Positive' ? 'bg-emerald-50 text-emerald-600' : item.impact === 'Negative' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {item.impact} Impact
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                    </div>
                    <h5 className="font-bold text-wealth-navy mb-2 group-hover:text-wealth-gold transition-colors">{item.title}</h5>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.source}</span>
                      <button className="text-wealth-gold hover:text-amber-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                        Read Full Story
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-bold text-wealth-navy flex items-center gap-2">
                <FileText className="text-wealth-gold" size={20} />
                Official Documents
              </h4>
              <div className="space-y-4">
                {company.documents.map((doc, idx) => (
                  <div key={idx} className="premium-card p-6 flex items-center gap-4 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      doc.type === 'Annual Report' ? 'bg-indigo-50 text-indigo-600' : doc.type === 'Quarterly Results' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <FileText size={24} />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold text-wealth-navy group-hover:text-wealth-gold transition-colors">{doc.title}</h5>
                      <p className="text-[10px] text-slate-400 font-medium">{doc.date} • {doc.type}</p>
                    </div>
                    <Download size={18} className="text-slate-300 group-hover:text-wealth-gold transition-colors" />
                  </div>
                ))}
              </div>

              <div className="bg-wealth-navy rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl -mr-16 -mt-16" />
                <h5 className="font-bold mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-wealth-gold" />
                  Investor Relations
                </h5>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Access the official investor portal for direct management communication and regulatory filings.
                </p>
                <button className="w-full py-3 bg-white/10 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                  Visit Portal
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'Insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="premium-card p-10 space-y-6">
                <div className="flex items-center gap-3 text-wealth-gold">
                  <Quote size={32} className="opacity-50" />
                  <h4 className="text-xl font-bold text-wealth-navy">Management Commentary</h4>
                </div>
                <p className="text-lg text-slate-600 leading-relaxed italic font-medium">
                  "{company.managementCommentary}"
                </p>
                <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-wealth-navy">Executive Leadership Team</p>
                    <p className="text-xs text-slate-400">Strategic Vision 2026-2030</p>
                  </div>
                </div>
              </div>

              <div className="premium-card p-10 space-y-6">
                <div className="flex items-center gap-3 text-wealth-gold">
                  <Globe size={32} className="opacity-50" />
                  <h4 className="text-xl font-bold text-wealth-navy">Market & Industry Outlook</h4>
                </div>
                <p className="text-lg text-slate-600 leading-relaxed font-medium">
                  {company.marketOutlook}
                </p>
                <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Industry Growth</p>
                    <p className="text-lg font-bold text-emerald-600">12-15%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Market Share</p>
                    <p className="text-lg font-bold text-wealth-navy">24.5%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Outlook</p>
                    <p className="text-lg font-bold text-emerald-600">Bullish</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Scoring & 10-Year Trends */}
            {company.scores && (
              <div className="space-y-8">
                <div className="premium-card p-8">
                  <h4 className="text-lg font-bold text-wealth-navy mb-8 flex items-center gap-2">
                    <ShieldCheck className="text-wealth-gold" size={20} />
                    Comprehensive Research Scorecard
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ScoreCard label="Corporate Governance" score={company.scores.corporateGovernance} color="bg-indigo-500" />
                    <ScoreCard label="Market Cap Strength" score={company.scores.marketCap} color="bg-blue-500" />
                    <ScoreCard label="Earnings Quality" score={company.scores.earnings} color="bg-emerald-500" />
                    <ScoreCard label="Fundamental Strength" score={company.scores.fundamental} color="bg-teal-500" />
                    <ScoreCard label="Relative Valuation" score={company.scores.relativeValuation} color="bg-amber-500" />
                    <ScoreCard label="Risk Assessment" score={company.scores.risk} color="bg-rose-500" />
                    <ScoreCard label="Price Momentum" score={company.scores.priceMomentum} color="bg-purple-500" />
                    <ScoreCard label="Future Outlook" score={company.scores.futureOutlook} color="bg-wealth-gold" />
                  </div>
                  <div className="mt-8 p-6 bg-wealth-navy rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Overall Research Score</p>
                      <p className="text-3xl font-black text-white">{company.scores.overall}/100</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Verdict</p>
                      <p className="text-xl font-bold text-wealth-gold">
                        {company.scores.overall >= 80 ? 'Strong Buy' : company.scores.overall >= 60 ? 'Accumulate' : 'Neutral'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {company.netProfitMarginTrend && (
                    <TrendChart title="Net Profit Margin Trend (10Y)" data={company.netProfitMarginTrend} color="#10b981" />
                  )}
                  {company.promoterHoldingTrend && (
                    <TrendChart title="Promoter Holding Trend (10Y)" data={company.promoterHoldingTrend} color="#3b82f6" />
                  )}
                  {company.debtLevelTrend && (
                    <TrendChart title="Debt Level Trend (D/E) (10Y)" data={company.debtLevelTrend} color="#ef4444" />
                  )}
                  {company.operatingCashFlowTrend && (
                    <TrendChart title="Operating Cash Flow Trend (10Y)" data={company.operatingCashFlowTrend} color="#f59e0b" />
                  )}
                </div>
              </div>
            )}

            <div className="bg-wealth-navy rounded-[3rem] p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[50%] h-full bg-white/5 skew-x-[-20deg] translate-x-1/2" />
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-wealth-gold/20 border border-wealth-gold/30 rounded-full text-wealth-gold text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck size={14} />
                    Investor Decision Matrix
                  </div>
                  <h3 className="text-4xl font-bold tracking-tight">The RH Wealth Perspective</h3>
                  <p className="text-slate-300 text-xl leading-relaxed font-medium">
                    {company.investorInsight}
                  </p>
                </div>
                
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] space-y-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                      <Target size={24} />
                    </div>
                    <h5 className="font-bold text-lg">Key Catalyst</h5>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Post-merger synergies and digital transformation initiatives to drive operational efficiency.
                    </p>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] space-y-4">
                    <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400">
                      <ShieldAlert size={24} />
                    </div>
                    <h5 className="font-bold text-lg">Primary Risk</h5>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Macroeconomic slowdown impacting credit demand and interest rate volatility affecting NIMs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyst Footer */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-200 flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-slate-50 shadow-lg shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" 
            alt="Analyst" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-lg font-bold text-wealth-navy">Equity Research Note</h4>
          <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
            "Our analysis suggests that {company.name} remains a core portfolio holding for long-term wealth creation. The current market scenario favors quality businesses with strong pricing power and clean balance sheets. We recommend a staggered accumulation approach during market dips."
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">— Institutional Equity Research Team</p>
        </div>
      </div>
    </div>
  );
};

export default StockResearch;
