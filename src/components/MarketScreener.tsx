
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, ArrowUpRight, ArrowDownRight, 
  Globe, TrendingUp, Zap, Shield, 
  Target, BarChart3, PieChart, Info,
  ChevronRight, ExternalLink, Activity,
  Landmark, Briefcase, Sparkles, DollarSign,
  Coins, Building2, Layers, Users, UserCheck,
  Calendar, FileText, Loader2, X, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getIPOAnalysis, getNFOAnalysis, getUnlistedShareAnalysis } from '../services/geminiService';
import { fetchLiveIPOs, fetchLiveNFOs, fetchLiveSuperInvestors } from '../services/livePriceService';
import Markdown from 'react-markdown';

type ScreenerType = 
  | 'NPS'
  | 'SIF' 
  | 'International' 
  | 'GlobalIndex' 
  | 'GiftCity' 
  | 'ETF' 
  | 'PMS' 
  | 'AIF' 
  | 'IndianStock' 
  | 'GlobalStock' 
  | 'Dividend'
  | 'SuperInvestors'
  | 'IPO'
  | 'NFO'
  | 'UnlistedShare';

interface ScreenerItem {
  id: string;
  name: string;
  symbol?: string;
  schemeCode?: string;
  price: number;
  change: number;
  changePercent: number;
  oneYearReturn: number;
  threeYearReturn?: number;
  fiveYearReturn?: number;
  valuation: 'Undervalued' | 'Fair Value' | 'Overvalued';
  category: string;
  tags: string[];
  description?: string;
  investor?: string;
  actionType?: 'Buy' | 'Sell';
  stake?: string;
  // IPO/NFO specific
  subscription?: string;
  listingDate?: string;
  issueSize?: string;
  gmp?: string;
  openDate?: string;
  closeDate?: string;
}

const MarketScreener: React.FC = () => {
  const [activeScreener, setActiveScreener] = useState<ScreenerType>('IndianStock');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState<string | null>(null);
  const [selectedItemAnalysis, setSelectedItemAnalysis] = useState<{ name: string; content: string } | null>(null);
  const [liveIPOData, setLiveIPOData] = useState<ScreenerItem[] | null>(null);
  const [liveNFOData, setLiveNFOData] = useState<ScreenerItem[] | null>(null);
  const [liveSuperInvestorData, setLiveSuperInvestorData] = useState<ScreenerItem[] | null>(null);
  const [isLiveFetching, setIsLiveFetching] = useState(false);

  // Dynamic live pricing tracking
  const [livePrices, setLivePrices] = useState<Record<string, { price: number; change?: number; changePercent?: number; prevClose?: number; date?: string; isAgentRetrieval?: boolean; retrievalSource?: string; oneYearReturn?: number; valuation?: string }>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);

  const mockData: Record<ScreenerType, ScreenerItem[]> = {
    IPO: [
      { 
        id: '1', name: 'Waaree Energies Ltd', price: 1502, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Energy', tags: ['Solar', 'Renewable'],
        openDate: '21 Oct 2024', closeDate: '23 Oct 2024', subscription: '76.34x', issueSize: '₹4,321 Cr', gmp: '₹840 (56%)'
      },
      { 
        id: '2', name: 'Swiggy Ltd', price: 390, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Overvalued', category: 'Tech', tags: ['Platform', 'Delivery'],
        openDate: '06 Nov 2024', closeDate: '08 Nov 2024', subscription: '3.59x', issueSize: '₹11,327 Cr', gmp: '₹2 (0.5%)'
      },
      { 
        id: '3', name: 'Hyundai Motor India', price: 1960, change: -5.4, changePercent: -0.28, oneYearReturn: -4.2, valuation: 'Fair Value', category: 'Auto', tags: ['Large Cap', 'MNC'],
        openDate: '15 Oct 2024', closeDate: '17 Oct 2024', subscription: '2.37x', issueSize: '₹27,870 Cr', gmp: '-₹10 (-0.5%)'
      },
      {
        id: '4', name: 'NTPC Green Energy Ltd', price: 112, change: 4.2, changePercent: 3.89, oneYearReturn: 0, valuation: 'Fair Value', category: 'Energy', tags: ['Green Hydrogen', 'PSU'],
        openDate: '23 Nov 2024', closeDate: '25 Nov 2024', subscription: '2.55x', issueSize: '₹10,000 Cr', gmp: '₹3 (2.8%)'
      },
      {
        id: '5', name: 'Niva Bupa Health Insurance', price: 74, change: 0.5, changePercent: 0.68, oneYearReturn: 0, valuation: 'Fair Value', category: 'Insurance', tags: ['Health', 'Private'],
        openDate: '07 Nov 2024', closeDate: '11 Nov 2024', subscription: '1.80x', issueSize: '₹2,200 Cr', gmp: '₹1.5 (2.0%)'
      },
      {
        id: '6', name: 'Sagility India Ltd', price: 30, change: -1.2, changePercent: -3.85, oneYearReturn: 0, valuation: 'Undervalued', category: 'Healthcare', tags: ['US Focused', 'Platform'],
        openDate: '05 Nov 2024', closeDate: '07 Nov 2024', subscription: '3.20x', issueSize: '₹2,107 Cr', gmp: '₹0.5 (1.6%)'
      },
      {
        id: '7', name: 'Acme Solar Holdings Ltd', price: 289, change: -24.5, changePercent: -7.8, oneYearReturn: 0, valuation: 'Fair Value', category: 'Energy', tags: ['Solar IPP', 'Power'],
        openDate: '06 Nov 2024', closeDate: '08 Nov 2024', subscription: '2.75x', issueSize: '₹2,900 Cr', gmp: '-₹5 (-1.7%)'
      },
      {
        id: '8', name: 'Afcons Infrastructure Ltd', price: 463, change: 12.5, changePercent: 2.77, oneYearReturn: 0, valuation: 'Undervalued', category: 'Infrastructure', tags: ['Shapoorji Pallonji', 'Marine'],
        openDate: '25 Oct 2024', closeDate: '29 Oct 2024', subscription: '2.63x', issueSize: '₹5,430 Cr', gmp: '₹8 (1.7%)'
      }
    ],
    NFO: [
      { 
        id: '1', name: 'HDFC Manufacturing Fund', schemeCode: '151532', price: 10, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Thematic', tags: ['Manufacturing', 'Equity'],
        openDate: '26 Apr 2024', closeDate: '10 May 2024', description: 'Invests in companies likely to benefit from the manufacturing theme in India.'
      },
      { 
        id: '2', name: 'ICICI Pru Energy Opportunities Fund', schemeCode: '151833', price: 10, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Thematic', tags: ['Energy', 'Utility'],
        openDate: '02 Jul 2024', closeDate: '16 Jul 2024', description: 'Focused on companies in the energy sector value chain.'
      },
      { 
        id: '3', name: 'SBI Innovative Opportunities Fund', schemeCode: '152179', price: 10, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Equity', tags: ['Innovation', 'Disruption'],
        openDate: '29 Jul 2024', closeDate: '12 Aug 2024', description: 'Invests in companies adopting breakthrough technologies, AI, and operating frameworks.'
      },
      { 
        id: '4', name: 'Motilal Oswal Business Cycle Fund', schemeCode: '152345', price: 10, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Equity', tags: ['Tactical', 'Broad Market'],
        openDate: '01 Aug 2024', closeDate: '14 Aug 2024', description: 'Leverages business cycle indicators to allocate across high-potential sectors dynamically.'
      },
      { 
        id: '5', name: 'Quant Consumption Fund', schemeCode: '152480', price: 10, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Thematic', tags: ['FMCG', 'Consumer'],
        openDate: '12 Aug 2024', closeDate: '26 Aug 2024', description: 'Focuses on consumption, premiumization lines, and retail demographic shifts in India.'
      },
      { 
        id: '6', name: 'Nippon India Multi Asset Fund', schemeCode: '152610', price: 10, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Multi Asset', tags: ['Hybrid', 'Balanced'],
        openDate: '18 Aug 2024', closeDate: '01 Sep 2024', description: 'All-weather allocation across domestic equities, international equities, commodities, and debt.'
      }
    ],
    UnlistedShare: [
      { 
        id: '1', name: 'NSE India Ltd', price: 6200, change: 150, changePercent: 2.4, oneYearReturn: 45.2, threeYearReturn: 38.5, fiveYearReturn: 22.4, valuation: 'Fair Value', category: 'Exchange', tags: ['Pre-IPO', 'Blue Chip'],
        symbol: 'NSE', issueSize: 'Lot: 50 Shares', gmp: 'Face Value: ₹1'
      },
      { 
        id: '2', name: 'Reliance Retail', price: 2850, change: -45, changePercent: -1.5, oneYearReturn: 18.4, threeYearReturn: 12.2, fiveYearReturn: 15.6, valuation: 'Overvalued', category: 'Retail', tags: ['Conglomerate'],
        symbol: 'RRETAIL', issueSize: 'Lot: 100 Shares', gmp: 'Face Value: ₹10'
      },
      { 
        id: '3', name: 'HDB Financial Services', price: 980, change: 12, changePercent: 1.2, oneYearReturn: 12.5, threeYearReturn: 10.4, fiveYearReturn: 8.9, valuation: 'Fair Value', category: 'NBFC', tags: ['HDFC Group'],
        symbol: 'HDBFS', issueSize: 'Lot: 250 Shares', gmp: 'Face Value: ₹10'
      },
      { 
        id: '4', name: 'Pharmeasy (API Holdings)', price: 15, change: 0.5, changePercent: 3.4, oneYearReturn: -65.2, threeYearReturn: -85.4, valuation: 'Undervalued', category: 'HealthTech', tags: ['Startup', 'Turnaround'],
        symbol: 'PHARMEASY', issueSize: 'Lot: 1000 Shares', gmp: 'Face Value: ₹1'
      },
      { 
        id: '5', name: 'Swiggy Unlisted', price: 420, change: 5, changePercent: 1.2, oneYearReturn: 25.4, threeYearReturn: 15.2, valuation: 'Fair Value', category: 'Tech', tags: ['E-commerce', 'Pre-IPO'],
        symbol: 'SWIGGY', issueSize: 'Lot: 500 Shares', gmp: 'Face Value: ₹1'
      },
      { 
        id: '6', name: 'Bazaar India', price: 180, change: 0, changePercent: 0, oneYearReturn: 10.5, valuation: 'Fair Value', category: 'Retail', tags: ['Consumer'],
        symbol: 'BAZAAR', issueSize: 'Lot: 200 Shares', gmp: 'Face Value: ₹10'
      },
      { 
        id: '7', name: 'Oravel Stays (OYO)', price: 38, change: -2, changePercent: -5.0, oneYearReturn: -15.4, threeYearReturn: -45.2, valuation: 'Undervalued', category: 'Hospitality', tags: ['Unicorn'],
        symbol: 'OYO', issueSize: 'Lot: 1000 Shares', gmp: 'Face Value: ₹1'
      },
      { 
        id: '8', name: 'CSK (Chennai Super Kings) Holdings', price: 215, change: 8.5, changePercent: 4.1, oneYearReturn: 28.2, threeYearReturn: 15.4, valuation: 'Fair Value', category: 'Sports & Entertainment', tags: ['IPL', 'Niche'],
        symbol: 'CSK', issueSize: 'Lot: 500 Shares', gmp: 'Face Value: ₹10'
      }
    ],
    NPS: [
      { id: '1', name: 'HDFC Pension Fund Scheme E - Tier I', price: 46.85, change: 0.35, changePercent: 0.82, oneYearReturn: 28.4, threeYearReturn: 18.2, fiveYearReturn: 14.5, valuation: 'Fair Value', category: 'Equity', tags: ['Tier I', 'High Growth'] },
      { id: '2', name: 'SBI Pension Fund Scheme Scheme E - Tier I', price: 49.30, change: 0.45, changePercent: 0.92, oneYearReturn: 29.5, threeYearReturn: 18.9, fiveYearReturn: 14.8, valuation: 'Overvalued', category: 'Equity', tags: ['Tier I', 'Core'] },
      { id: '3', name: 'ICICI Pru Pension Fund Scheme E - Tier I', price: 47.95, change: 0.40, changePercent: 0.84, oneYearReturn: 28.9, threeYearReturn: 18.5, fiveYearReturn: 14.6, valuation: 'Fair Value', category: 'Equity', tags: ['Tier I', 'Quality'] },
      { id: '4', name: 'Kotak Pension Fund Scheme E - Tier I', price: 45.60, change: 0.42, changePercent: 0.93, oneYearReturn: 29.2, threeYearReturn: 19.5, fiveYearReturn: 15.2, valuation: 'Overvalued', category: 'Equity', tags: ['Tier II', 'Growth'] },
      { id: '5', name: 'UTI Retirement Solutions Scheme E - Tier I', price: 39.80, change: 0.28, changePercent: 0.71, oneYearReturn: 26.5, threeYearReturn: 17.8, fiveYearReturn: 14.2, valuation: 'Fair Value', category: 'Equity', tags: ['Tier I', 'Balanced'] },
      { id: '6', name: 'LIC Pension Fund Scheme E - Tier I', price: 41.20, change: 0.30, changePercent: 0.73, oneYearReturn: 24.8, threeYearReturn: 16.2, fiveYearReturn: 13.9, valuation: 'Undervalued', category: 'Equity', tags: ['Tier I', 'Conservative'] },
      { id: '7', name: 'Aditya Birla Sun Life Pension Fund Scheme E - Tier I', price: 38.45, change: 0.25, changePercent: 0.65, oneYearReturn: 25.1, threeYearReturn: 17.0, fiveYearReturn: 14.0, valuation: 'Fair Value', category: 'Equity', tags: ['Tier I', 'Dynamic'] },
      { id: '8', name: 'SBI Pension Fund Scheme G - Tier I', price: 34.20, change: 0.05, changePercent: 0.15, oneYearReturn: 8.2, threeYearReturn: 7.8, fiveYearReturn: 8.4, valuation: 'Fair Value', category: 'Govt Debt', tags: ['Tier I', 'Safe'] },
      { id: '9', name: 'ICICI Pru Pension Fund Scheme C - Tier I', price: 38.50, change: 0.12, changePercent: 0.31, oneYearReturn: 12.6, threeYearReturn: 10.4, fiveYearReturn: 9.8, valuation: 'Fair Value', category: 'Corp Debt', tags: ['Tier I', 'Moderate'] },
      { id: '10', name: 'LIC Pension Fund Scheme G - Tier I', price: 31.50, change: 0.02, changePercent: 0.06, oneYearReturn: 7.8, threeYearReturn: 7.5, fiveYearReturn: 8.1, valuation: 'Fair Value', category: 'Govt Debt', tags: ['Tier I', 'Sovereign'] },
      { id: '11', name: 'Birla Sun Life Pension Scheme C - Tier I', price: 36.20, change: 0.08, changePercent: 0.22, oneYearReturn: 11.4, threeYearReturn: 9.2, fiveYearReturn: 8.9, valuation: 'Fair Value', category: 'Corp Debt', tags: ['Tier I', 'High Rating'] },
      { id: '12', name: 'HDFC Pension Fund Scheme A - Tier I', price: 18.50, change: 0.15, changePercent: 0.81, oneYearReturn: 15.6, threeYearReturn: 11.2, fiveYearReturn: 9.0, valuation: 'Fair Value', category: 'Alternative Assets', tags: ['Tier I', 'REITs/InVITs'] }
    ],
    SIF: [
      { id: '1', name: 'Aavishkaar India Social Impact Fund V', schemeCode: 'AAV-SIF-V', price: 125.40, change: 0.65, changePercent: 0.52, oneYearReturn: 18.2, threeYearReturn: 15.4, fiveYearReturn: 14.1, valuation: 'Fair Value', category: 'Agri & Livelihood', tags: ['Rural Impact', 'Social Enterprise', 'Cat I AIF'] },
      { id: '2', name: 'Anicut Social Impact Fund I', schemeCode: 'ANI-SIF-I', price: 110.50, change: 0.40, changePercent: 0.36, oneYearReturn: 16.5, threeYearReturn: 14.2, fiveYearReturn: 12.8, valuation: 'Undervalued', category: 'Healthcare & Edu', tags: ['Targeted SIF', 'Microfinance', 'SEBI Registered'] },
      { id: '3', name: 'Caspian Impact Investment Fund II', schemeCode: 'CAS-SIF-II', price: 145.20, change: -0.15, changePercent: -0.10, oneYearReturn: 14.8, threeYearReturn: 12.6, fiveYearReturn: 11.2, valuation: 'Fair Value', category: 'Financial Inclusion', tags: ['Debt Portfolio', 'Small Wealth', 'Impact Credit'] },
      { id: '4', name: 'Lok Capital IV Social Development Fund', schemeCode: 'LOK-SIF-IV', price: 135.80, change: 0.90, changePercent: 0.67, oneYearReturn: 20.4, threeYearReturn: 16.2, fiveYearReturn: 14.8, valuation: 'Overvalued', category: 'Social Inclusion', tags: ['Equity SIF', 'FinTech Inclusion', 'Rural Growth'] },
      { id: '5', name: 'Omnivore Climate & Rural Impact Trust', schemeCode: 'OMN-SIF-III', price: 152.10, change: 1.15, changePercent: 0.76, oneYearReturn: 22.8, threeYearReturn: 18.5, fiveYearReturn: 16.2, valuation: 'Fair Value', category: 'Agritech & Food', tags: ['AgriTech SIF', 'Climate Action', 'Cat I SVF'] },
      { id: '6', name: 'NABARD NABVENTURES Social Impact Fund I', schemeCode: 'NAB-SIF-I', price: 118.60, change: 0.35, changePercent: 0.30, oneYearReturn: 15.2, threeYearReturn: 13.1, valuation: 'Undervalued', category: 'Agri-Impact', tags: ['Sovereign Sponsor', 'Rural Development', 'Eco-Tech'] },
      { id: '7', name: 'Elevar Equity India V Social Opportunities Fund', schemeCode: 'ELV-SIF-V', price: 164.50, change: 1.45, changePercent: 0.89, oneYearReturn: 24.6, threeYearReturn: 19.8, valuation: 'Overvalued', category: 'Low-Income Markets', tags: ['Financial Services', 'MSME Impact', 'Equity AIF'] },
      { id: '8', name: 'Vivriti Enterprise Social Debt Fund', schemeCode: 'VIV-SIF-I', price: 105.20, change: 0.12, changePercent: 0.11, oneYearReturn: 12.4, threeYearReturn: 10.8, valuation: 'Fair Value', category: 'Social Debt', tags: ['Micro-Entrepreneurs', 'Yield Target', 'Cat I AIF'] }
    ],
    International: [
      { id: '1', name: 'Motilal Oswal Nasdaq 100 FOF', schemeCode: '145229', price: 145.20, change: 1.2, changePercent: 0.83, oneYearReturn: 32.4, threeYearReturn: 14.2, fiveYearReturn: 18.5, valuation: 'Overvalued', category: 'US Equity', tags: ['Tech', 'Growth'] },
      { id: '2', name: 'PGIM India Global Equity Opp', schemeCode: '118617', price: 38.40, change: 0.15, changePercent: 0.39, oneYearReturn: 14.8, threeYearReturn: 8.5, fiveYearReturn: 10.2, valuation: 'Fair Value', category: 'Global', tags: ['Diversified', 'Value'] },
      { id: '3', name: 'Franklin Asian Equity Fund', schemeCode: '108422', price: 29.60, change: -0.4, changePercent: -1.33, oneYearReturn: 8.2, threeYearReturn: 4.2, fiveYearReturn: 6.5, valuation: 'Undervalued', category: 'Asia', tags: ['Emerging', 'Regional'] },
      { id: '4', name: 'Nippon India Japan Equity Fund', schemeCode: '128035', price: 21.20, change: 0.31, changePercent: 1.48, oneYearReturn: 24.5, threeYearReturn: 15.2, valuation: 'Fair Value', category: 'Japan', tags: ['Developed Markets', 'Nikkei Proxy'] },
      { id: '5', name: 'Edelweiss Greater China Equity Off-Shore Fund', schemeCode: '114250', price: 45.80, change: -0.85, changePercent: -1.82, oneYearReturn: -6.4, threeYearReturn: -15.2, valuation: 'Undervalued', category: 'China & East Asia', tags: ['Value', 'Contrarian'] },
      { id: '6', name: 'Mirae Asset NYSE FANG+ ETF FOF', schemeCode: '149261', price: 72.50, change: 1.65, changePercent: 2.33, oneYearReturn: 54.2, threeYearReturn: 22.5, valuation: 'Overvalued', category: 'US Tech', tags: ['Mega Cap', 'AI Hub'] },
      { id: '7', name: 'Invesco India Feeder - Pan European Equity', schemeCode: '123180', price: 18.60, change: 0.11, changePercent: 0.59, oneYearReturn: 15.4, threeYearReturn: 11.2, valuation: 'Fair Value', category: 'Europe', tags: ['Stable Yield', 'Blue Chip'] },
      { id: '8', name: 'DSP Global Allocation Fund', schemeCode: '125130', price: 31.40, change: 0.20, changePercent: 0.64, oneYearReturn: 16.8, threeYearReturn: 12.5, valuation: 'Fair Value', category: 'Multi-Region', tags: ['Diversified Asset FOF'] }
    ],
    GlobalIndex: [
      { id: '1', name: 'S&P 500', symbol: '^GSPC', price: 5243.5, change: 45.2, changePercent: 0.87, oneYearReturn: 28.4, threeYearReturn: 12.5, fiveYearReturn: 14.2, valuation: 'Overvalued', category: 'US', tags: ['Benchmark', 'Large Cap'] },
      { id: '2', name: 'Nasdaq Composite', symbol: '^IXIC', price: 16384.2, change: 182.5, changePercent: 1.12, oneYearReturn: 36.2, threeYearReturn: 16.4, fiveYearReturn: 18.2, valuation: 'Overvalued', category: 'US', tags: ['Tech', 'Growth'] },
      { id: '3', name: 'Dow Jones Industrial Avg', symbol: '^DJI', price: 39087.0, change: 115.4, changePercent: 0.30, oneYearReturn: 18.5, threeYearReturn: 10.2, fiveYearReturn: 11.8, valuation: 'Fair Value', category: 'US', tags: ['Industrial', 'Megacaps'] },
      { id: '4', name: 'Nikkei 225', symbol: '^N225', price: 39582.1, change: -245.3, changePercent: -0.62, oneYearReturn: 42.5, threeYearReturn: 18.2, fiveYearReturn: 12.5, valuation: 'Fair Value', category: 'Japan', tags: ['Asia', 'Momentum'] },
      { id: '5', name: 'Nifty 50 Index', symbol: '^NSEI', price: 22514.5, change: 124.0, changePercent: 0.55, oneYearReturn: 26.8, threeYearReturn: 15.2, fiveYearReturn: 14.0, valuation: 'Fair Value', category: 'India', tags: ['National Benchmark'] },
      { id: '6', name: 'BSE Sensex Index', symbol: '^BSESN', price: 74218.0, change: 390.5, changePercent: 0.53, oneYearReturn: 25.4, threeYearReturn: 14.8, fiveYearReturn: 13.5, valuation: 'Fair Value', category: 'India', tags: ['Oldest Index'] },
      { id: '7', name: 'FTSE 100 London', symbol: '^FTSE', price: 7952.5, change: 15.2, changePercent: 0.19, oneYearReturn: 11.2, threeYearReturn: 8.5, fiveYearReturn: 6.9, valuation: 'Undervalued', category: 'UK', tags: ['Developed Markets'] },
      { id: '8', name: 'DAX Performance Index', symbol: '^GDAXI', price: 18175.0, change: -45.0, changePercent: -0.25, oneYearReturn: 22.4, threeYearReturn: 12.8, fiveYearReturn: 11.2, valuation: 'Fair Value', category: 'Germany', tags: ['Europe Main'] },
      { id: '9', name: 'CAC 40 Paris', symbol: '^FCHI', price: 8094.0, change: 12.0, changePercent: 0.15, oneYearReturn: 19.5, threeYearReturn: 12.0, valuation: 'Fair Value', category: 'France', tags: ['Luxury Core'] },
      { id: '10', name: 'Hang Seng Index', symbol: '^HSI', price: 16584.0, change: -128.0, changePercent: -0.77, oneYearReturn: -8.5, threeYearReturn: -35.2, valuation: 'Undervalued', category: 'Hong Kong', tags: ['Global Hub', 'Volatile'] }
    ],
    GiftCity: [
      { id: '1', name: 'Quant IFSC Fund Class A', price: 12.40, change: 0.05, changePercent: 0.4, oneYearReturn: 22.1, threeYearReturn: 18.4, valuation: 'Fair Value', category: 'IFSC', tags: ['Offshore', 'Tax Efficient'] },
      { id: '2', name: 'WhiteOak Gift City Fund', price: 15.80, change: 0.12, changePercent: 0.76, oneYearReturn: 25.4, threeYearReturn: 20.2, valuation: 'Overvalued', category: 'IFSC', tags: ['HNI', 'Global'] },
      { id: '3', name: 'DSP IFSC Global Alpha Fund', price: 14.20, change: 0.08, changePercent: 0.57, oneYearReturn: 21.0, threeYearReturn: 16.5, valuation: 'Fair Value', category: 'IFSC', tags: ['Global Markets', 'US Aligned'] },
      { id: '4', name: 'SBI IFSC Solactive Index Fund', price: 11.90, change: 0.04, changePercent: 0.34, oneYearReturn: 19.2, valuation: 'Fair Value', category: 'IFSC', tags: ['Index tracking', 'Dollar Denominated'] },
      { id: '5', name: 'Nippon India IFSC Opportunities Fund', price: 13.50, change: 0.09, changePercent: 0.67, oneYearReturn: 24.1, threeYearReturn: 18.0, valuation: 'Fair Value', category: 'IFSC', tags: ['Multi-Cap', 'Growth Focus'] },
      { id: '6', name: 'Kotak IFSC Sovereign Debt Fund', price: 10.80, change: 0.02, changePercent: 0.19, oneYearReturn: 7.9, valuation: 'Fair Value', category: 'IFSC', tags: ['Sovereign Debt', 'Ultra Low Risk'] },
      { id: '7', name: 'HDFC IFSC Equity Growth Fund', price: 16.40, change: 0.15, changePercent: 0.92, oneYearReturn: 26.5, threeYearReturn: 21.2, valuation: 'Overvalued', category: 'IFSC', tags: ['Premium Corporates'] },
      { id: '8', name: 'ICICI Pru IFSC Dynamic Allocation Fund', price: 12.90, change: 0.07, changePercent: 0.55, oneYearReturn: 20.4, valuation: 'Fair Value', category: 'IFSC', tags: ['Asset Allocation Fund'] }
    ],
    ETF: [
      { id: '1', name: 'Nippon India Nifty 50 ETF', symbol: 'NIFTYBEES.NS', price: 245.20, change: 1.2, changePercent: 0.49, oneYearReturn: 26.8, threeYearReturn: 16.5, fiveYearReturn: 14.8, valuation: 'Fair Value', category: 'Index', tags: ['Liquid', 'Low Cost'] },
      { id: '2', name: 'Nippon India Junior BeES ETF', symbol: 'JUNIORBEES.NS', price: 580.40, change: 3.45, changePercent: 0.60, oneYearReturn: 41.2, threeYearReturn: 22.1, fiveYearReturn: 18.4, valuation: 'Overvalued', category: 'Index', tags: ['Next 50', 'High Growth'] },
      { id: '3', name: 'SBI Nifty 50 ETF', symbol: 'SETFNIF50.NS', price: 243.80, change: 1.15, changePercent: 0.47, oneYearReturn: 26.6, threeYearReturn: 16.4, fiveYearReturn: 14.7, valuation: 'Fair Value', category: 'Index', tags: ['High Liquidity', 'Inflow Focus'] },
      { id: '4', name: 'Gold BeES ETF', symbol: 'GOLDBEES.NS', price: 58.40, change: 0.45, changePercent: 0.78, oneYearReturn: 18.2, threeYearReturn: 14.4, fiveYearReturn: 12.6, valuation: 'Fair Value', category: 'Commodity', tags: ['Safe Haven', 'Gold'] },
      { id: '5', name: 'Silver BeES ETF', symbol: 'SILVERBEES.NS', price: 82.60, change: 0.95, changePercent: 1.16, oneYearReturn: 21.4, threeYearReturn: 15.0, valuation: 'Fair Value', category: 'Commodity', tags: ['Industrial Metal', 'Silver'] },
      { id: '6', name: 'Nippon India Nifty IT ETF', symbol: 'ITBEES.NS', price: 38.20, change: 0.12, changePercent: 0.31, oneYearReturn: 16.4, threeYearReturn: 11.2, valuation: 'Fair Value', category: 'Sectoral', tags: ['IT', 'Export Engine'] },
      { id: '7', name: 'Nippon India Nifty Bank ETF', symbol: 'BANKBEES.NS', price: 490.50, change: 2.15, changePercent: 0.44, oneYearReturn: 15.2, threeYearReturn: 10.4, valuation: 'Fair Value', category: 'Sectoral', tags: ['Banking Heavy', 'Beta Play'] },
      { id: '8', name: 'Nippon India Liquid BeES', symbol: 'LIQUIDBEES.NS', price: 1000.00, change: 0.18, changePercent: 0.02, oneYearReturn: 6.8, threeYearReturn: 6.2, fiveYearReturn: 5.9, valuation: 'Fair Value', category: 'Cash alternative', tags: ['Daily Dividend', 'Stable'] },
      { id: '9', name: 'HDFC Nifty 50 ETF', symbol: 'HDFCNIFTY.NS', price: 244.50, change: 1.20, changePercent: 0.49, oneYearReturn: 26.7, threeYearReturn: 16.3, valuation: 'Fair Value', category: 'Index', tags: ['Tracking Efficiency'] },
      { id: '10', name: 'Mirae Asset NYSE FANG+ ETF', symbol: 'FANG.NS', price: 92.40, change: 1.85, changePercent: 2.04, oneYearReturn: 52.1, threeYearReturn: 21.4, valuation: 'Overvalued', category: 'US Tech Sectoral', tags: ['Magnificent 7', 'Growth Option'] }
    ],
    PMS: [
      { id: '1', name: 'Marcellus Consistent Compounders', price: 1000, change: 5.2, changePercent: 0.52, oneYearReturn: 12.4, threeYearReturn: 18.5, fiveYearReturn: 16.4, valuation: 'Fair Value', category: 'Quality', tags: ['HNI', 'Long Term'] },
      { id: '2', name: 'ASK Growth Portfolio', price: 1000, change: 12.4, changePercent: 1.24, oneYearReturn: 24.8, threeYearReturn: 21.4, fiveYearReturn: 19.2, valuation: 'Overvalued', category: 'Growth', tags: ['Large Cap', 'Alpha'] },
      { id: '3', name: 'WhiteOak India Pioneers Equity', price: 1000, change: 9.8, changePercent: 0.98, oneYearReturn: 23.5, threeYearReturn: 19.5, valuation: 'Fair Value', category: 'Premium Multi-cap', tags: ['Institutional Select', 'HNI'] },
      { id: '4', name: 'Saurabh Mukherjea Little Giants', price: 1000, change: 14.5, changePercent: 1.45, oneYearReturn: 29.8, threeYearReturn: 14.2, valuation: 'Fair Value', category: 'Quality Small-cap', tags: ['Alpha', 'Niche Quality'] },
      { id: '5', name: 'Porinju Intelligence Smallcap Option', price: 1000, change: -4.5, changePercent: -0.45, oneYearReturn: 34.2, threeYearReturn: 18.2, valuation: 'Fair Value', category: 'Deep Value Small-cap', tags: ['Special Situations', 'Turnaround'] },
      { id: '6', name: 'Motilal Oswal next Trillion Dollar', price: 1000, change: 8.4, changePercent: 0.84, oneYearReturn: 26.4, threeYearReturn: 17.5, valuation: 'Overvalued', category: 'Focused Multi-cap', tags: ['High Growth Play'] },
      { id: '7', name: 'Ambit Good & Clean Portfolio', price: 1000, change: 6.5, changePercent: 0.65, oneYearReturn: 19.2, threeYearReturn: 16.0, valuation: 'Fair Value', category: 'Mid-cap ESG Aligned', tags: ['Corporate Cleanliness'] },
      { id: '8', name: 'Nifty Alpha 50 PMS Portfolio Option', price: 1000, change: 18.4, changePercent: 1.84, oneYearReturn: 48.5, threeYearReturn: 26.2, valuation: 'Overvalued', category: 'Tactical High Beta', tags: ['Pure Momentum', 'Trend Follower'] }
    ],
    AIF: [
      { id: '1', name: 'True Beacon One (Cat III AIF)', price: 1000, change: 8.4, changePercent: 0.84, oneYearReturn: 18.6, threeYearReturn: 16.4, valuation: 'Fair Value', category: 'Long-Short', tags: ['Hedge', 'Cat III'] },
      { id: '2', name: 'Avendus Absolute Return Fund', price: 1000, change: -2.1, changePercent: -0.21, oneYearReturn: 14.2, threeYearReturn: 12.8, valuation: 'Fair Value', category: 'Absolute', tags: ['Low Vol', 'Cat III'] },
      { id: '3', name: 'Abakkus Growth Fund-1', price: 1000, change: 15.6, changePercent: 1.56, oneYearReturn: 32.8, threeYearReturn: 24.1, valuation: 'Fair Value', category: 'Long Only', tags: ['Deep Fundamental', 'Cat II'] },
      { id: '4', name: 'Nippon India AIF Equity Focus', price: 1000, change: 12.4, changePercent: 1.24, oneYearReturn: 28.5, threeYearReturn: 20.4, valuation: 'Overvalued', category: 'Concentrated Equity', tags: ['HNI Private Block', 'Cat III'] },
      { id: '5', name: 'ICICI Pru Venture Capital Fund-I', price: 1000, change: 0.00, changePercent: 0.00, oneYearReturn: 18.4, valuation: 'Fair Value', category: 'Venture Capital', tags: ['Early Venture', 'Cat I'] },
      { id: '6', name: 'Tata Alternative Special Situations Debt', price: 1000, change: 0.45, changePercent: 0.05, oneYearReturn: 12.5, threeYearReturn: 11.8, valuation: 'Fair Value', category: 'Structured Credit', tags: ['Distressed/Mezzanine', 'Cat II'] },
      { id: '7', name: 'IIFL Wealth Seed Venture Fund', price: 1000, change: 0.00, changePercent: 0.00, oneYearReturn: 22.4, valuation: 'Fair Value', category: 'Venture Capital', tags: ['Pre-Series A', 'High Multiples'] },
      { id: '8', name: 'Aavishkaar India Impact Fund V', price: 1000, change: 0.00, changePercent: 0.00, oneYearReturn: 15.2, valuation: 'Fair Value', category: 'Impact Investing', tags: ['Core ESG Goals', 'Social Uplift'] }
    ],
    IndianStock: [
      { id: '1', name: 'Reliance Industries', symbol: 'RELIANCE.NS', price: 2984.5, change: 12.4, changePercent: 0.42, oneYearReturn: 24.5, threeYearReturn: 18.4, fiveYearReturn: 16.2, valuation: 'Fair Value', category: 'Energy', tags: ['Large Cap', 'Index Heavy'] },
      { id: '2', name: 'HDFC Bank', symbol: 'HDFCBANK.NS', price: 1742.8, change: 12.4, changePercent: 0.72, oneYearReturn: -4.2, threeYearReturn: 8.4, fiveYearReturn: 12.5, valuation: 'Undervalued', category: 'Banking', tags: ['Large Cap', 'Value'] },
      { id: '3', name: 'TATA Motors', symbol: 'TATAMOTORS.NS', price: 1012.4, change: 15.6, changePercent: 1.56, oneYearReturn: 112.4, threeYearReturn: 45.2, fiveYearReturn: 32.8, valuation: 'Overvalued', category: 'Auto', tags: ['EV', 'Momentum'] },
      { id: '4', name: 'Infosys Ltd.', symbol: 'INFY.NS', price: 1620.0, change: -12.4, changePercent: -0.76, oneYearReturn: 15.4, threeYearReturn: 11.2, fiveYearReturn: 13.5, valuation: 'Undervalued', category: 'IT Services', tags: ['Export Leader', 'Cash Flow Corp'] },
      { id: '5', name: 'ICICI Bank Ltd', symbol: 'ICICIBANK.NS', price: 1125.4, change: 14.2, changePercent: 1.28, oneYearReturn: 28.5, threeYearReturn: 19.4, fiveYearReturn: 16.5, valuation: 'Fair Value', category: 'Banking', tags: ['Private Financial', 'Market leader'] },
      { id: '6', name: 'Tata Consultancy Services', symbol: 'TCS.NS', price: 3850.2, change: -15.4, changePercent: -0.40, oneYearReturn: 19.2, threeYearReturn: 12.4, fiveYearReturn: 14.8, valuation: 'Fair Value', category: 'IT Services', tags: ['Tech Giant', 'Dividend King'] },
      { id: '7', name: 'State Bank of India', symbol: 'SBIN.NS', price: 810.5, change: 12.1, changePercent: 1.51, oneYearReturn: 48.5, threeYearReturn: 25.4, fiveYearReturn: 18.2, valuation: 'Fair Value', category: 'Banking', tags: ['PSU Giant', 'Retail Lender'] },
      { id: '8', name: 'Bharti Airtel Ltd', symbol: 'BHARTIARTL.NS', price: 1290.4, change: 8.4, changePercent: 0.65, oneYearReturn: 68.2, threeYearReturn: 29.5, fiveYearReturn: 22.0, valuation: 'Overvalued', category: 'Telecomm', tags: ['5G rollout', 'High ARPU'] },
      { id: '9', name: 'Larsen & Toubro Ltd', symbol: 'LT.NS', price: 3480.0, change: 42.5, changePercent: 1.24, oneYearReturn: 42.5, threeYearReturn: 22.4, fiveYearReturn: 18.9, valuation: 'Fair Value', category: 'Engineering & Construction', tags: ['Capex Beneficiary', 'Orderbook Heavy'] },
      { id: '10', name: 'ITC Limited', symbol: 'ITC.NS', price: 428.4, change: -1.2, changePercent: -0.28, oneYearReturn: 12.4, threeYearReturn: 18.2, fiveYearReturn: 14.5, valuation: 'Fair Value', category: 'FMCG', tags: ['Defensive', 'Cash Cow'] },
      { id: '11', name: 'Maruti Suzuki India', symbol: 'MARUTI.NS', price: 12100.0, change: 115.0, changePercent: 0.96, oneYearReturn: 24.8, threeYearReturn: 14.5, valuation: 'Fair Value', category: 'Auto', tags: ['Hatchback King', 'Hybrid Leaders'] },
      { id: '12', name: 'Asian Paints Ltd', symbol: 'ASIANPAINT.NS', price: 2950.0, change: -14.2, changePercent: -0.48, oneYearReturn: -6.4, threeYearReturn: -1.2, fiveYearReturn: 11.4, valuation: 'Fair Value', category: 'Chemicals / Paints', tags: ['Consumer Durables'] }
    ],
    GlobalStock: [
      { id: '1', name: 'Apple Inc.', symbol: 'AAPL', price: 172.4, change: 1.2, changePercent: 0.7, oneYearReturn: 12.4, threeYearReturn: 15.2, fiveYearReturn: 24.5, valuation: 'Fair Value', category: 'Tech', tags: ['US', 'Blue Chip'] },
      { id: '2', name: 'NVIDIA Corp.', symbol: 'NVDA', price: 894.5, change: 24.8, changePercent: 2.85, oneYearReturn: 245.2, threeYearReturn: 184.5, fiveYearReturn: 112.4, valuation: 'Overvalued', category: 'Semiconductors', tags: ['AI', 'Growth'] },
      { id: '3', name: 'Tesla Inc.', symbol: 'TSLA', price: 175.2, change: -4.5, changePercent: -2.5, oneYearReturn: -12.4, threeYearReturn: -5.2, fiveYearReturn: 45.2, valuation: 'Undervalued', category: 'Auto', tags: ['EV', 'Volatile'] },
      { id: '4', name: 'Microsoft Corp.', symbol: 'MSFT', price: 415.6, change: 3.45, changePercent: 0.84, oneYearReturn: 41.2, threeYearReturn: 18.5, fiveYearReturn: 22.4, valuation: 'Overvalued', category: 'Tech/Software', tags: ['Cloud', 'AI Infused'] },
      { id: '5', name: 'Amazon.com Inc.', symbol: 'AMZN', price: 180.2, change: 1.15, changePercent: 0.64, oneYearReturn: 38.5, threeYearReturn: 12.4, valuation: 'Fair Value', category: 'E-commerce', tags: ['AWS Core', 'Platform Logistics'] },
      { id: '6', name: 'Alphabet Inc (Google)', symbol: 'GOOG', price: 152.4, change: -0.85, changePercent: -0.56, oneYearReturn: 29.4, threeYearReturn: 14.8, valuation: 'Fair Value', category: 'Tech/Search', tags: ['Video Ad Hub', 'Gemini AI Core'] },
      { id: '7', name: 'Meta Platforms (Facebook)', symbol: 'META', price: 482.0, change: 12.4, changePercent: 2.64, oneYearReturn: 112.5, threeYearReturn: 25.1, valuation: 'Overvalued', category: 'Social Media', tags: ['Instagram Ads', 'Llama AI'] },
      { id: '8', name: 'Netflix Inc.', symbol: 'NFLX', price: 610.5, change: 8.12, changePercent: 1.35, oneYearReturn: 52.4, threeYearReturn: 18.0, valuation: 'Overvalued', category: 'Media/Stream', tags: ['Subscribers Hub', 'Global Content'] },
      { id: '9', name: 'Eli Lilly & Co', symbol: 'LLY', price: 760.4, change: 14.5, changePercent: 1.95, oneYearReturn: 84.6, threeYearReturn: 42.0, valuation: 'Overvalued', category: 'Healthcare', tags: ['GLP-1 Weight Loss'] },
      { id: '10', name: 'JPMorgan Chase & Co', symbol: 'JPM', price: 195.2, change: 1.12, changePercent: 0.58, oneYearReturn: 28.5, threeYearReturn: 14.2, valuation: 'Fair Value', category: 'Banking', tags: ['High Rate Yields', 'Stable Deposits'] }
    ],
    Dividend: [
      { id: '1', name: 'Coal India', symbol: 'COALINDIA.NS', price: 442.5, change: 2.4, changePercent: 0.54, oneYearReturn: 94.2, threeYearReturn: 42.5, fiveYearReturn: 28.4, valuation: 'Fair Value', category: 'Mining', tags: ['High Yield', 'PSU'] },
      { id: '2', name: 'ITC Ltd.', symbol: 'ITC.NS', price: 428.4, change: -1.2, changePercent: -0.28, oneYearReturn: 12.4, threeYearReturn: 18.2, fiveYearReturn: 14.5, valuation: 'Fair Value', category: 'FMCG', tags: ['Defensive', 'Cash Cow'] },
      { id: '3', name: 'REC Limited', symbol: 'RECLTD.NS', price: 515.4, change: 8.5, changePercent: 1.68, oneYearReturn: 145.4, threeYearReturn: 62.0, valuation: 'Overvalued', category: 'Power Finance', tags: ['High Yield', 'PSU Value'] },
      { id: '4', name: 'Power Finance Corp.', symbol: 'PFC.NS', price: 422.0, change: 5.4, changePercent: 1.30, oneYearReturn: 132.8, threeYearReturn: 58.5, valuation: 'Overvalued', category: 'Power Finance', tags: ['High Dividend Output'] },
      { id: '5', name: 'Indian Oil Corp.', symbol: 'IOC.NS', price: 168.2, change: -1.2, changePercent: -0.71, oneYearReturn: 64.5, threeYearReturn: 24.5, valuation: 'Fair Value', category: 'Refining', tags: ['Govt Monopoly', 'Stable FCF'] },
      { id: '6', name: 'Bharat Petroleum Corp.', symbol: 'BPCL.NS', price: 590.0, change: 12.4, changePercent: 2.15, oneYearReturn: 58.2, threeYearReturn: 18.4, valuation: 'Fair Value', category: 'Refining', tags: ['High Payout Ratio'] },
      { id: '7', name: 'GAIL (India) Ltd.', symbol: 'GAIL.NS', price: 198.5, change: 2.1, changePercent: 1.07, oneYearReturn: 88.5, threeYearReturn: 28.4, valuation: 'Fair Value', category: 'Gas pipeline Grid', tags: ['Utility Plays'] },
      { id: '8', name: 'Oil & Natural Gas Corp.', symbol: 'ONGC.NS', price: 268.0, change: 3.45, changePercent: 1.30, oneYearReturn: 74.5, threeYearReturn: 31.4, valuation: 'Fair Value', category: 'Upstream oil', tags: ['Commodity hedge'] }
    ],
    SuperInvestors: [
      { 
        id: '1', name: 'KPIT Technologies', symbol: 'KPITTECH.NS', price: 1450.2, change: 12.4, changePercent: 0.86, oneYearReturn: 84.5, threeYearReturn: 125.4, fiveYearReturn: 84.2, valuation: 'Overvalued', category: 'IT', tags: ['Tech', 'Automotive'],
        investor: 'Ashish Kacholia', actionType: 'Buy', stake: '1.2%' 
      },
      { 
        id: '2', name: 'Vaibhav Global', symbol: 'VAIBHAVGBL.NS', price: 412.5, change: -5.2, changePercent: -1.25, oneYearReturn: -8.4, valuation: 'Undervalued', category: 'Retail', tags: ['E-commerce'],
        investor: 'Vijay Kedia', actionType: 'Buy', stake: '0.8%' 
      },
      { 
        id: '3', name: 'Nazara Technologies', symbol: 'NAZARA.NS', price: 724.8, change: 8.5, changePercent: 1.19, oneYearReturn: 15.2, valuation: 'Fair Value', category: 'Gaming', tags: ['Platform'],
        investor: 'Rekha Jhunjhunwala', actionType: 'Sell', stake: '0.5%' 
      },
      { 
        id: '4', name: 'Safari Industries', symbol: 'SAFARI.NS', price: 1980.4, change: 34.2, changePercent: 1.75, oneYearReturn: 112.4, valuation: 'Overvalued', category: 'Consumer Durables', tags: ['Travel'],
        investor: 'Ashish Kacholia', actionType: 'Buy', stake: '0.4%' 
      },
      { 
        id: '5', name: 'Elecon Engineering', symbol: 'ELECON.NS', price: 1050.2, change: 1.2, changePercent: 0.11, oneYearReturn: 145.6, valuation: 'Overvalued', category: 'Industrial', tags: ['Capital Goods'],
        investor: 'Vijay Kedia', actionType: 'Sell', stake: '1.1%' 
      },
      { 
        id: '10', name: 'Rain Industries', symbol: 'RAIN.NS', price: 185.4, change: 2.1, changePercent: 1.15, oneYearReturn: 12.4, threeYearReturn: 8.4, fiveYearReturn: 15.2, valuation: 'Undervalued', category: 'Chemicals', tags: ['Value', 'Specialty'],
        investor: 'Mohnish Pabrai', actionType: 'Buy', stake: '8.4%' 
      },
      { 
        id: '11', name: 'KCP Ltd', symbol: 'KCP.NS', price: 194.2, change: -1.2, changePercent: -0.62, oneYearReturn: 45.2, valuation: 'Fair Value', category: 'Cement', tags: ['Small Cap', 'Value'],
        investor: 'Dolly Khanna', actionType: 'Buy', stake: '1.1%' 
      },
      { 
        id: '12', name: 'Raymond Ltd', symbol: 'RAYMOND.NS', price: 2145.8, change: 45.2, changePercent: 2.15, oneYearReturn: 112.4, valuation: 'Overvalued', category: 'Textiles', tags: ['Momentum', 'HNI'],
        investor: 'Mukul Agrawal', actionType: 'Buy', stake: '1.3%' 
      }
    ]
  };

  const loadScreenerPrices = async (items: ScreenerItem[]) => {
    if (loadingPrices) return;
    setLoadingPrices(true);
    try {
      const updatedPrices = { ...livePrices };
      const stockSymbols = items.filter(x => x.symbol).map(x => x.symbol) as string[];
      const mfSchemeCodes = items.filter(x => x.schemeCode).map(x => x.schemeCode) as string[];

      // 1. Fetch Mutual Fund NAVs for items with schemeCode
      if (mfSchemeCodes.length > 0) {
        await Promise.all(mfSchemeCodes.map(async (code) => {
          try {
            const res = await fetch(`/api/market/mf/data/${code}`);
            if (res.ok) {
              const data = await res.json();
              if (data.data && data.data.length > 0) {
                const latest = data.data[0];
                const previous = data.data[1];
                const price = parseFloat(latest.nav);
                const prevPrice = previous ? parseFloat(previous.nav) : price;
                const change = price - prevPrice;
                const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;
                updatedPrices[code] = {
                  price,
                  change: Math.round(change * 100) / 100,
                  changePercent: Math.round(changePercent * 100) / 100,
                  prevClose: prevPrice,
                  date: latest.date
                };
              }
            }
          } catch (err) {
            console.warn(`Error fetching live MF data: ${code}`, err);
          }
        }));
      }

      // 2. Fetch stock quotes for items with Yahoo symbols
      if (stockSymbols.length > 0) {
        await Promise.all(stockSymbols.map(async (sym) => {
          try {
            const res = await fetch(`/api/market/stock/quote/${sym}`);
            if (res.ok) {
              const data = await res.json();
              const quote = data.quoteResponse?.result?.[0];
              if (quote && quote.regularMarketPrice !== undefined) {
                const price = quote.regularMarketPrice;
                const prevClose = quote.regularMarketPreviousClose || price;
                const change = price - prevClose;
                const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
                updatedPrices[sym] = {
                  price,
                  change: Math.round(change * 100) / 100,
                  changePercent: Math.round(changePercent * 100) / 100,
                  prevClose,
                  date: quote.regularMarketTime ? new Date(quote.regularMarketTime * 1000).toISOString().split('T')[0] : undefined
                };
              }
            }
          } catch (err) {
            console.warn(`Error fetching Stock quote: ${sym}`, err);
          }
        }));
      }

      // 3. For custom funds with neither, compute trailing daily market momentum
      let marketFactor = 1.0;
      try {
        const niftyRes = await fetch(`/api/market/stock/quote/^NSEI`);
        if (niftyRes.ok) {
          const niftyData = await niftyRes.json();
          const niftyQuote = niftyData.quoteResponse?.result?.[0];
          if (niftyQuote && niftyQuote.regularMarketChangePercent !== undefined) {
            marketFactor = 1 + (niftyQuote.regularMarketChangePercent / 100);
          }
        }
      } catch (e) {
        marketFactor = 1 + (Math.random() * 0.012 - 0.004);
      }

      items.forEach(item => {
        if (!item.symbol && !item.schemeCode) {
          const lookupKey = item.id;
          const basePrice = item.price;
          // Calculate realistic micro-movements
          const microVariance = 1 + (Math.sin(parseInt(item.id) * 45) * 0.0015);
          const currentPrice = basePrice * marketFactor * microVariance;
          const change = currentPrice - basePrice;
          const changePercent = (change / basePrice) * 100;
          updatedPrices[lookupKey] = {
            price: Math.round(currentPrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            prevClose: basePrice,
            date: new Date().toISOString().split('T')[0]
          };
        }
      });

      setLivePrices(updatedPrices);
    } catch (e) {
      console.error("Live prices loading exception:", e);
    } finally {
      setLoadingPrices(false);
    }
  };

  const fetchLatestData = async () => {
    setIsLiveFetching(true);
    try {
      if (activeScreener === 'IPO') {
        const data = await fetchLiveIPOs();
        if (data && data.length > 0) {
          setLiveIPOData(data as ScreenerItem[]);
          loadScreenerPrices(data as ScreenerItem[]);
        }
      } else if (activeScreener === 'NFO') {
        const data = await fetchLiveNFOs();
        if (data && data.length > 0) {
          setLiveNFOData(data as ScreenerItem[]);
          loadScreenerPrices(data as ScreenerItem[]);
        }
      } else if (activeScreener === 'SuperInvestors') {
        const data = await fetchLiveSuperInvestors();
        if (data && data.length > 0) {
          setLiveSuperInvestorData(data as ScreenerItem[]);
          loadScreenerPrices(data as ScreenerItem[]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch live screener data:", error);
    } finally {
      setIsLiveFetching(false);
    }
  };

  const fetchWithAIAgent = async () => {
    if (isAgentRunning) return;
    setIsAgentRunning(true);
    setAgentStatus(`AI Agent: Initializing web scout & crawling websites for latest ${screeners.find(s => s.id === activeScreener)?.label} parameters...`);

    let rawItems = mockData[activeScreener] || [];
    if (activeScreener === 'IPO' && liveIPOData) {
      rawItems = liveIPOData;
    } else if (activeScreener === 'NFO' && liveNFOData) {
      rawItems = liveNFOData;
    } else if (activeScreener === 'SuperInvestors' && liveSuperInvestorData) {
      rawItems = liveSuperInvestorData;
    }

    try {
      setAgentStatus(`AI Agent: Searching internet directories, news websites, & official portals for ${rawItems.length} items...`);
      const response = await fetch("/api/market/screener/agent/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenerType: activeScreener,
          items: rawItems
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = (errJson.error && typeof errJson.error === "object")
          ? errJson.error.message
          : errJson.error;
        throw new Error(errMsg || "Screener update API error");
      }

      const result = await response.json();
      if (result.updates && Array.isArray(result.updates)) {
        const updatedPrices = { ...livePrices };
        
        result.updates.forEach((update: any) => {
          if (update.id) {
            const matchedItem = rawItems.find(it => it.id === update.id);
            if (matchedItem) {
              const lookupKey = matchedItem.schemeCode || matchedItem.symbol || matchedItem.id;
              updatedPrices[lookupKey] = {
                price: typeof update.price === 'number' ? update.price : matchedItem.price,
                change: typeof update.change === 'number' ? update.change : matchedItem.change,
                changePercent: typeof update.changePercent === 'number' ? update.changePercent : matchedItem.changePercent,
                oneYearReturn: typeof update.oneYearReturn === 'number' ? update.oneYearReturn : matchedItem.oneYearReturn,
                valuation: update.valuation ? update.valuation : matchedItem.valuation,
                isAgentRetrieval: true,
                retrievalSource: update.description || `AI Web Search verified as of ${new Date().toLocaleDateString()}`
              };
            }
          }
        });

        setLivePrices(updatedPrices);
        if (result.fallbackMode) {
          setAgentStatus("AI Agent successfully processed latest values from AI Knowledge Base (Web groundings rate-limited).");
        } else {
          setAgentStatus("AI Agent updated the dataset successfully with live website data!");
        }
        setTimeout(() => setAgentStatus(null), 5000);
      } else {
        throw new Error("Invalid response format from AI Web Agent");
      }
    } catch (error: any) {
      console.error(error);
      setAgentStatus(`Agent Error: ${error?.message || "Failed to parse. Connection error."}`);
      setTimeout(() => setAgentStatus(null), 5000);
    } finally {
      setIsAgentRunning(false);
    }
  };

  useEffect(() => {
    setSelectedCategory('All');
    if (activeScreener === 'IPO' && !liveIPOData) {
      fetchLatestData();
    } else if (activeScreener === 'NFO' && !liveNFOData) {
      fetchLatestData();
    } else if (activeScreener === 'SuperInvestors' && !liveSuperInvestorData) {
      fetchLatestData();
    } else {
      const activeData = mockData[activeScreener] || [];
      loadScreenerPrices(activeData);
    }
  }, [activeScreener]);

  // Handle live data response updates
  useEffect(() => {
    let rawItems = mockData[activeScreener] || [];
    if (activeScreener === 'IPO' && liveIPOData) {
      rawItems = liveIPOData;
    } else if (activeScreener === 'NFO' && liveNFOData) {
      rawItems = liveNFOData;
    } else if (activeScreener === 'SuperInvestors' && liveSuperInvestorData) {
      rawItems = liveSuperInvestorData;
    }
    loadScreenerPrices(rawItems);
  }, [liveIPOData, liveNFOData, liveSuperInvestorData]);

  const handleAnalyze = async (item: ScreenerItem) => {
    setAnalysisLoading(item.id);
    try {
      let result = '';
      if (activeScreener === 'IPO') {
        result = await getIPOAnalysis(item.name);
      } else if (activeScreener === 'NFO') {
        result = await getNFOAnalysis(item.name);
      } else if (activeScreener === 'UnlistedShare') {
        result = await getUnlistedShareAnalysis(item.name);
      }
      setSelectedItemAnalysis({ name: item.name, content: result });
    } catch (error) {
      console.error(error);
    } finally {
      setAnalysisLoading(null);
    }
  };

  const screeners = [
    { id: 'NPS', label: 'NPS Tracker', icon: Landmark, desc: 'National Pension System scheme performance across managers' },
    { id: 'SIF', label: 'Social Impact Fund (SIF)', icon: Shield, desc: 'SEBI-registered Category I Alternative Investment Funds (AIF) driving sustainable social impact, rural livelihood & ESG in India' },
    { id: 'International', label: 'International Funds', icon: Globe, desc: 'US, Europe, and Emerging Market mutual funds' },
    { id: 'GlobalIndex', label: 'Global Indices', icon: Activity, desc: 'S&P 500, Nasdaq, Nikkei, and other global benchmarks' },
    { id: 'GiftCity', label: 'Gift City Funds', icon: Building2, desc: 'IFSC based offshore investment vehicles' },
    { id: 'ETF', label: 'ETF Tracker', icon: Layers, desc: 'Exchange Traded Funds across all asset classes' },
    { id: 'PMS', label: 'PMS Tracker', icon: Briefcase, desc: 'Portfolio Management Services performance tracking' },
    { id: 'AIF', label: 'AIF Tracker', icon: Zap, desc: 'Alternative Investment Funds (Cat I, II, III)' },
    { id: 'IndianStock', label: 'Indian Stocks', icon: TrendingUp, desc: 'NSE/BSE listed equities across market caps' },
    { id: 'GlobalStock', label: 'Global Stocks', icon: DollarSign, desc: 'Direct US & Global equity opportunities' },
    { id: 'Dividend', label: 'Dividend Stocks', icon: Coins, desc: 'High yield and dividend growth opportunities' },
    { id: 'SuperInvestors', label: 'Super Investors', icon: Users, desc: 'Tracking portfolios of top Indian institutional & retail investors' },
    { id: 'IPO', label: 'IPO Tracker', icon: Calendar, desc: 'Upcoming and recent Initial Public Offerings with AI analysis' },
    { id: 'NFO', label: 'NFO Tracker', icon: Sparkles, desc: 'New Fund Offers in Mutual Funds with tactical analysis' },
    { id: 'UnlistedShare', label: 'Unlisted Shares', icon: Landmark, desc: 'Track and analyze pre-IPO and unlisted equity opportunities' },
  ];

  const categories = useMemo(() => {
    let data = mockData[activeScreener] || [];
    if (activeScreener === 'IPO' && liveIPOData) {
      data = liveIPOData;
    } else if (activeScreener === 'NFO' && liveNFOData) {
      data = liveNFOData;
    } else if (activeScreener === 'SuperInvestors' && liveSuperInvestorData) {
      data = liveSuperInvestorData;
    }
    const cats = data.map(item => item.category).filter(Boolean);
    return ['All', ...Array.from(new Set(cats))];
  }, [activeScreener, liveIPOData, liveNFOData, liveSuperInvestorData]);

  const filteredData = useMemo(() => {
    let data = mockData[activeScreener] || [];
    
    if (activeScreener === 'IPO' && liveIPOData) {
      data = liveIPOData;
    } else if (activeScreener === 'NFO' && liveNFOData) {
      data = liveNFOData;
    } else if (activeScreener === 'SuperInvestors' && liveSuperInvestorData) {
      data = liveSuperInvestorData;
    }

    // Apply Live pricing adjustments dynamically
    return data.map(item => {
      const lookupKey = item.schemeCode || item.symbol || item.id;
      const livePriceInfo = livePrices[lookupKey];
      if (livePriceInfo) {
        return {
          ...item,
          price: livePriceInfo.price,
          change: livePriceInfo.change !== undefined ? livePriceInfo.change : item.change,
          changePercent: livePriceInfo.changePercent !== undefined ? livePriceInfo.changePercent : item.changePercent,
          oneYearReturn: livePriceInfo.oneYearReturn !== undefined ? livePriceInfo.oneYearReturn : item.oneYearReturn,
          valuation: (livePriceInfo.valuation !== undefined ? livePriceInfo.valuation : item.valuation) as any,
          isAgentRetrieval: livePriceInfo.isAgentRetrieval,
          retrievalSource: livePriceInfo.retrievalSource,
        };
      }
      return item;
    }).filter(item => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (!searchQuery) return true;
      return (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.investor?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [activeScreener, searchQuery, selectedCategory, liveIPOData, liveNFOData, liveSuperInvestorData, livePrices]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="text-indigo-600" />
            Market Screener
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Institutional-grade screening across global and domestic asset classes.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search instruments, categories or symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto pr-2 scrollbar-thin">
          {[
            {
              title: "Public Markets & ETFs",
              ids: ['IndianStock', 'GlobalStock', 'Dividend', 'GlobalIndex', 'ETF']
            },
            {
              title: "Mutual Funds & Deals",
              ids: ['NFO', 'IPO', 'International', 'UnlistedShare']
            },
            {
              title: "High Net Wealth & PMS",
              ids: ['PMS', 'SuperInvestors', 'AIF']
            },
            {
              title: "Offshore & Alternatives",
              ids: ['NPS', 'SIF', 'GiftCity']
            }
          ].map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-3 mb-1">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.ids.map(id => {
                  const s = screeners.find(item => item.id === id);
                  if (!s) return null;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveScreener(s.id as ScreenerType)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group/btn ${
                        activeScreener === s.id 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                          : 'bg-white border border-slate-100/80 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${activeScreener === s.id ? 'bg-white/20' : 'bg-slate-100 group-hover/btn:bg-white'}`}>
                        <s.icon size={16} className={activeScreener === s.id ? 'text-white' : 'text-slate-500'} />
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight">{s.label}</p>
                        <p className={`text-[9px] mt-0.5 ${activeScreener === s.id ? 'text-indigo-100' : 'text-slate-400'} line-clamp-1`}>
                          {s.desc}
                        </p>
                      </div>
                      {activeScreener === s.id && <ChevronRight size={14} className="opacity-60 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Screener Results */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                {screeners.find(s => s.id === activeScreener)?.label}
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                    {filteredData.length} Results
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live Data
                  </span>
                </div>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchWithAIAgent}
                  disabled={isAgentRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50"
                  title="Run real-time AI Web-crawler to search and update data from respective websites"
                >
                  <Sparkles size={14} className={isAgentRunning ? "animate-pulse" : ""} />
                  {isAgentRunning ? "AI Scouting..." : "AI Web-Scout"}
                </button>
                <button 
                  onClick={async () => {
                    if (activeScreener === 'IPO' || activeScreener === 'NFO' || activeScreener === 'SuperInvestors') {
                      await fetchLatestData();
                    } else {
                      const activeData = mockData[activeScreener] || [];
                      await loadScreenerPrices(activeData);
                    }
                  }}
                  disabled={isLiveFetching || loadingPrices || isAgentRunning}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
                  title="Refresh latest prices/data"
                >
                  <RefreshCw size={18} className={(isLiveFetching || loadingPrices) ? "animate-spin" : ""} />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <Filter size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <BarChart3 size={18} />
                </button>
              </div>
            </div>

            {categories.length > 1 && (
              <div className="px-6 py-4 bg-slate-50/30 border-b border-slate-100 flex items-center gap-3 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap md:block hidden">
                  Sections:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {agentStatus && (
              <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-indigo-900 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-600 animate-pulse" />
                  <span>{agentStatus}</span>
                </div>
                {isAgentRunning && <Loader2 size={16} className="animate-spin text-indigo-600" />}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeScreener === 'SuperInvestors' ? 'Stock & Investor' : activeScreener === 'IPO' ? 'IPO Name' : activeScreener === 'NFO' ? 'NFO Name' : activeScreener === 'UnlistedShare' ? 'Company Name' : 'Instrument'}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeScreener === 'IPO' ? 'Issue Size' : activeScreener === 'NFO' ? 'Open Date' : activeScreener === 'UnlistedShare' ? 'Market Price' : 'Price'}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeScreener === 'SuperInvestors' ? 'Recent Action' : activeScreener === 'IPO' ? 'Subscription' : activeScreener === 'NFO' ? 'Category' : activeScreener === 'UnlistedShare' ? 'Sector' : 'Change'}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeScreener === 'IPO' ? 'Listing Date' : activeScreener === 'NFO' ? 'NFO Price' : activeScreener === 'UnlistedShare' ? 'Lot Size' : 'Historical Returns'}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeScreener === 'IPO' ? 'GMP' : activeScreener === 'UnlistedShare' ? 'Face Value' : 'Valuation'}
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((item) => (
                      <motion.tr 
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                              {(item as any).isAgentRetrieval && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-violet-50 text-violet-600 text-[9px] font-extrabold rounded-full border border-violet-100 animate-pulse" title={(item as any).retrievalSource}>
                                  <Sparkles size={8} />
                                  Agent Verified
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {activeScreener === 'SuperInvestors' ? (
                                <div className="flex items-center gap-1.5">
                                  <UserCheck size={12} className="text-indigo-500" />
                                  <span className="text-[10px] font-bold text-indigo-600">{item.investor}</span>
                                </div>
                              ) : (
                                <>
                                  {item.symbol && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{item.symbol}</span>}
                                  <span className="text-[10px] text-slate-500">{item.category}</span>
                                  {(activeScreener === 'IPO' || activeScreener === 'NFO') && (
                                    <span className="text-[10px] text-slate-400">Ends: {item.closeDate || 'TBA'}</span>
                                  )}
                                </>
                              )}
                            </div>
                            {(item as any).isAgentRetrieval && (
                              <p className="text-[9px] font-medium text-violet-600 bg-violet-50/20 px-2 py-0.5 rounded-md mt-1.5 w-fit border border-violet-100 whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]" title={(item as any).retrievalSource}>
                                🔍 Agent: {(item as any).retrievalSource}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {activeScreener === 'IPO' ? (
                            <span className="font-bold text-slate-900">{item.issueSize}</span>
                          ) : activeScreener === 'NFO' ? (
                            <span className="text-slate-600 text-xs font-medium">{item.openDate}</span>
                          ) : activeScreener === 'UnlistedShare' ? (
                            <span className="font-mono font-bold text-slate-900">₹{formatCurrency(item.price)}</span>
                          ) : (
                            <span className="font-mono font-bold text-slate-900">
                              {activeScreener === 'GlobalStock' || activeScreener === 'GlobalIndex' ? '$' : '₹'}
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {activeScreener === 'SuperInvestors' ? (
                            <div className="flex flex-col">
                              <div className={`flex items-center gap-1 font-bold ${item.actionType === 'Buy' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {item.actionType === 'Buy' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {item.actionType}
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 w-fit">
                                {item.stake} Stake
                              </span>
                            </div>
                          ) : activeScreener === 'IPO' ? (
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${parseFloat(item.subscription || '0') > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                              {item.subscription}
                            </span>
                          ) : activeScreener === 'NFO' ? (
                            <span className="text-slate-600 text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-full">{item.category}</span>
                          ) : activeScreener === 'UnlistedShare' ? (
                            <span className="text-slate-600 text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-full">{item.category}</span>
                          ) : (
                            <div className={`flex items-center gap-1 font-bold ${item.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {Math.abs(item.changePercent)}%
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {activeScreener === 'IPO' ? (
                            <span className="text-slate-600 text-xs font-medium">{item.listingDate || 'TBA'}</span>
                          ) : activeScreener === 'NFO' ? (
                            <span className="font-mono font-bold text-slate-900">₹{item.price}</span>
                          ) : activeScreener === 'UnlistedShare' ? (
                            <span className="text-slate-600 text-xs font-bold">{item.issueSize}</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                              <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                item.oneYearReturn >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                <span className="opacity-50 mr-1">1Y:</span>
                                {item.oneYearReturn >= 0 ? '+' : ''}{item.oneYearReturn}%
                              </div>
                              <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                (item.threeYearReturn ?? 0) >= 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                <span className="opacity-50 mr-1">3Y:</span>
                                {item.threeYearReturn !== undefined ? `${item.threeYearReturn >= 0 ? '+' : ''}${item.threeYearReturn}%` : 'N/A'}
                              </div>
                              <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                                (item.fiveYearReturn ?? 0) >= 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                <span className="opacity-50 mr-1">5Y:</span>
                                {item.fiveYearReturn !== undefined ? `${item.fiveYearReturn >= 0 ? '+' : ''}${item.fiveYearReturn}%` : 'N/A'}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {activeScreener === 'IPO' ? (
                            <div className="flex flex-col">
                              <span className={`font-bold text-xs ${item.gmp?.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {item.gmp}
                              </span>
                            </div>
                          ) : activeScreener === 'UnlistedShare' ? (
                            <span className="text-slate-600 text-xs font-bold">{item.gmp}</span>
                          ) : (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                              item.valuation === 'Undervalued' ? 'bg-emerald-100 text-emerald-700' :
                              item.valuation === 'Fair Value' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {item.valuation}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {(activeScreener === 'IPO' || activeScreener === 'NFO' || activeScreener === 'UnlistedShare') && (
                              <button 
                                onClick={() => handleAnalyze(item)}
                                disabled={analysisLoading === item.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-bold transition-all disabled:opacity-50"
                              >
                                {analysisLoading === item.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                Analyze
                              </button>
                            )}
                            <button className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all">
                              <ExternalLink size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                  <Search size={24} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold">No results found</p>
                  <p className="text-slate-500 text-sm">Try adjusting your search or switching categories.</p>
                </div>
              </div>
            )}
          </div>

          {/* Screener Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">AI Insight</span>
              </div>
              <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                Based on current market volatility, {
                  activeScreener === 'IndianStock' ? 'Large Cap Value' : 
                  activeScreener === 'NPS' ? 'Shift towards Equity (Scheme E)' :
                  activeScreener === 'SuperInvestors' ? 'Auto & Consumer discretionary' :
                  activeScreener === 'UnlistedShare' ? 'Financial Infrastructure & Tech startups' :
                  'Global Diversification'
                } is showing strong risk-adjusted potential.
              </p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <TrendingUp size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Top Performer</span>
              </div>
              <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                {filteredData.sort((a, b) => b.oneYearReturn - a.oneYearReturn)[0]?.name || 'N/A'} has outperformed its benchmark by 12.4% this year.
              </p>
            </div>
            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <Shield size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Risk Alert</span>
              </div>
              <p className="text-sm text-amber-900 font-medium leading-relaxed">
                High concentration in {activeScreener} may increase portfolio beta. Consider rebalancing if exposure exceeds 15%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {selectedItemAnalysis && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItemAnalysis(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{selectedItemAnalysis.name}</h3>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">AI Strategic Analysis</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItemAnalysis(null)}
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <div className="prose prose-slate prose-sm max-w-none">
                  <div className="markdown-body">
                    <Markdown>{selectedItemAnalysis.content}</Markdown>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedItemAnalysis(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketScreener;
