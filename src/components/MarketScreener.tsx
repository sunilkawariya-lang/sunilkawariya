
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
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState<string | null>(null);
  const [selectedItemAnalysis, setSelectedItemAnalysis] = useState<{ name: string; content: string } | null>(null);
  const [liveIPOData, setLiveIPOData] = useState<ScreenerItem[] | null>(null);
  const [liveNFOData, setLiveNFOData] = useState<ScreenerItem[] | null>(null);
  const [liveSuperInvestorData, setLiveSuperInvestorData] = useState<ScreenerItem[] | null>(null);
  const [isLiveFetching, setIsLiveFetching] = useState(false);

  const fetchLatestData = async () => {
    setIsLiveFetching(true);
    try {
      if (activeScreener === 'IPO') {
        const data = await fetchLiveIPOs();
        if (data && data.length > 0) setLiveIPOData(data as ScreenerItem[]);
      } else if (activeScreener === 'NFO') {
        const data = await fetchLiveNFOs();
        if (data && data.length > 0) setLiveNFOData(data as ScreenerItem[]);
      } else if (activeScreener === 'SuperInvestors') {
        const data = await fetchLiveSuperInvestors();
        if (data && data.length > 0) setLiveSuperInvestorData(data as ScreenerItem[]);
      }
    } catch (error) {
      console.error("Failed to fetch live screener data:", error);
    } finally {
      setIsLiveFetching(false);
    }
  };

  useEffect(() => {
    if (activeScreener === 'IPO' && !liveIPOData) {
      fetchLatestData();
    } else if (activeScreener === 'NFO' && !liveNFOData) {
      fetchLatestData();
    } else if (activeScreener === 'SuperInvestors' && !liveSuperInvestorData) {
      fetchLatestData();
    }
  }, [activeScreener]);

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
    { id: 'SIF', label: 'SIF Tracker', icon: Shield, desc: 'Social Impact Funds & ESG focused investments' },
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
    ],
    NFO: [
      { 
        id: '1', name: 'HDFC Manufacturing Fund', price: 10, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Thematic', tags: ['Manufacturing', 'Equity'],
        openDate: '26 Apr 2024', closeDate: '10 May 2024', description: 'Invests in companies likely to benefit from the manufacturing theme in India.'
      },
      { 
        id: '2', name: 'ICICI Pru Energy Opportunities', price: 10, change: 0, changePercent: 0, oneYearReturn: 0, valuation: 'Fair Value', category: 'Thematic', tags: ['Energy', 'Utility'],
        openDate: '02 Jul 2024', closeDate: '16 Jul 2024', description: 'Focused on companies in the energy sector value chain.'
      },
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
      }
    ],
    NPS: [
      { id: '1', name: 'HDFC Pension Fund Scheme E - Tier I', price: 42.8, change: 0.35, changePercent: 0.82, oneYearReturn: 28.4, threeYearReturn: 18.2, fiveYearReturn: 14.5, valuation: 'Fair Value', category: 'Equity', tags: ['Tier I', 'High Growth'] },
      { id: '2', name: 'SBI Pension Fund Scheme G - Tier I', price: 34.2, change: 0.05, changePercent: 0.15, oneYearReturn: 8.2, threeYearReturn: 7.8, fiveYearReturn: 8.4, valuation: 'Fair Value', category: 'Govt Debt', tags: ['Tier I', 'Safe'] },
      { id: '3', name: 'ICICI Pru Pension Fund Scheme C - Tier I', price: 38.5, change: 0.12, changePercent: 0.31, oneYearReturn: 12.6, threeYearReturn: 10.4, fiveYearReturn: 9.8, valuation: 'Fair Value', category: 'Corp Debt', tags: ['Tier I', 'Moderate'] },
      { id: '4', name: 'Kotak Pension Fund Scheme E - Tier II', price: 45.6, change: 0.42, changePercent: 0.93, oneYearReturn: 29.2, threeYearReturn: 19.5, fiveYearReturn: 15.2, valuation: 'Overvalued', category: 'Equity', tags: ['Tier II', 'Growth'] },
      { id: '5', name: 'LIC Pension Fund Scheme G - Tier I', price: 31.5, change: 0.02, changePercent: 0.06, oneYearReturn: 7.8, threeYearReturn: 7.5, fiveYearReturn: 8.1, valuation: 'Fair Value', category: 'Govt Debt', tags: ['Tier I', 'Conservative'] },
      { id: '6', name: 'UTI Retirement Solutions Scheme E - Tier I', price: 39.8, change: 0.28, changePercent: 0.71, oneYearReturn: 26.5, threeYearReturn: 17.8, fiveYearReturn: 14.2, valuation: 'Fair Value', category: 'Equity', tags: ['Tier I', 'Balanced'] },
      { id: '7', name: 'Birla Sun Life Pension Scheme C - Tier I', price: 36.2, change: 0.08, changePercent: 0.22, oneYearReturn: 11.4, threeYearReturn: 9.2, fiveYearReturn: 8.9, valuation: 'Fair Value', category: 'Corp Debt', tags: ['Tier I', 'Quality'] },
    ],
    SIF: [
      { id: '1', name: 'SBI ESG Exclusion Fund', price: 34.5, change: 0.2, changePercent: 0.58, oneYearReturn: 18.4, threeYearReturn: 15.2, fiveYearReturn: 12.4, valuation: 'Fair Value', category: 'ESG', tags: ['Sustainable', 'Equity'] },
      { id: '2', name: 'ICICI Pru ESG Fund', price: 28.1, change: -0.15, changePercent: -0.53, oneYearReturn: 16.2, threeYearReturn: 14.8, fiveYearReturn: 11.8, valuation: 'Undervalued', category: 'ESG', tags: ['Impact', 'Large Cap'] },
      { id: '3', name: 'Axis ESG Equity Fund', price: 42.8, change: 0.45, changePercent: 1.06, oneYearReturn: 21.5, threeYearReturn: 16.4, fiveYearReturn: 13.2, valuation: 'Overvalued', category: 'ESG', tags: ['Growth', 'Thematic'] },
    ],
    International: [
      { id: '1', name: 'Motilal Oswal Nasdaq 100', price: 145.2, change: 1.2, changePercent: 0.83, oneYearReturn: 32.4, threeYearReturn: 14.2, fiveYearReturn: 18.5, valuation: 'Overvalued', category: 'US Equity', tags: ['Tech', 'Growth'] },
      { id: '2', name: 'PGIM India Global Equity', price: 38.4, change: 0.15, changePercent: 0.39, oneYearReturn: 14.8, threeYearReturn: 8.5, fiveYearReturn: 10.2, valuation: 'Fair Value', category: 'Global', tags: ['Diversified', 'Value'] },
      { id: '3', name: 'Franklin Asian Equity', price: 29.6, change: -0.4, changePercent: -1.33, oneYearReturn: 8.2, threeYearReturn: 4.2, fiveYearReturn: 6.5, valuation: 'Undervalued', category: 'Asia', tags: ['Emerging', 'Regional'] },
    ],
    GlobalIndex: [
      { id: '1', name: 'S&P 500', price: 5243.5, change: 45.2, changePercent: 0.87, oneYearReturn: 28.4, threeYearReturn: 12.5, fiveYearReturn: 14.2, valuation: 'Overvalued', category: 'US', tags: ['Benchmark', 'Large Cap'] },
      { id: '2', name: 'Nasdaq Composite', price: 16384.2, change: 182.5, changePercent: 1.12, oneYearReturn: 36.2, threeYearReturn: 16.4, fiveYearReturn: 18.2, valuation: 'Overvalued', category: 'US', tags: ['Tech', 'Growth'] },
      { id: '3', name: 'Nikkei 225', price: 39582.1, change: -245.3, changePercent: -0.62, oneYearReturn: 42.5, threeYearReturn: 18.2, fiveYearReturn: 12.5, valuation: 'Fair Value', category: 'Japan', tags: ['Asia', 'Momentum'] },
    ],
    GiftCity: [
      { id: '1', name: 'Quant IFSC Fund', price: 12.4, change: 0.05, changePercent: 0.4, oneYearReturn: 22.1, threeYearReturn: 18.4, valuation: 'Fair Value', category: 'IFSC', tags: ['Offshore', 'Tax Efficient'] },
      { id: '2', name: 'WhiteOak Gift City Fund', price: 15.8, change: 0.12, changePercent: 0.76, oneYearReturn: 25.4, threeYearReturn: 20.2, valuation: 'Overvalued', category: 'IFSC', tags: ['HNI', 'Global'] },
    ],
    ETF: [
      { id: '1', name: 'Nippon India Nifty 50 ETF', price: 234.5, change: 1.2, changePercent: 0.51, oneYearReturn: 26.8, threeYearReturn: 16.5, fiveYearReturn: 14.8, valuation: 'Fair Value', category: 'Index', tags: ['Liquid', 'Low Cost'] },
      { id: '2', name: 'Gold BeES', price: 58.4, change: 0.45, changePercent: 0.78, oneYearReturn: 18.2, threeYearReturn: 14.4, fiveYearReturn: 12.6, valuation: 'Fair Value', category: 'Commodity', tags: ['Safe Haven', 'Gold'] },
      { id: '3', name: 'CPSE ETF', price: 84.2, change: -0.8, changePercent: -0.94, oneYearReturn: 84.5, threeYearReturn: 45.2, fiveYearReturn: 32.4, valuation: 'Overvalued', category: 'Thematic', tags: ['PSU', 'Dividend'] },
    ],
    PMS: [
      { id: '1', name: 'Marcellus Consistent Compounders', price: 1000, change: 5.2, changePercent: 0.52, oneYearReturn: 12.4, threeYearReturn: 18.5, fiveYearReturn: 16.4, valuation: 'Fair Value', category: 'Quality', tags: ['HNI', 'Long Term'] },
      { id: '2', name: 'ASK Growth Portfolio', price: 1000, change: 12.4, changePercent: 1.24, oneYearReturn: 24.8, threeYearReturn: 21.4, fiveYearReturn: 19.2, valuation: 'Overvalued', category: 'Growth', tags: ['Large Cap', 'Alpha'] },
    ],
    AIF: [
      { id: '1', name: 'True Beacon One', price: 1000, change: 8.4, changePercent: 0.84, oneYearReturn: 18.6, threeYearReturn: 16.4, valuation: 'Fair Value', category: 'Long-Short', tags: ['Hedge', 'Cat III'] },
      { id: '2', name: 'Avendus Absolute Return', price: 1000, change: -2.1, changePercent: -0.21, oneYearReturn: 14.2, threeYearReturn: 12.8, valuation: 'Fair Value', category: 'Absolute', tags: ['Low Vol', 'Cat III'] },
    ],
    IndianStock: [
      { id: '1', name: 'Reliance Industries', symbol: 'RELIANCE', price: 2984.5, change: 12.4, changePercent: 0.42, oneYearReturn: 24.5, threeYearReturn: 18.4, fiveYearReturn: 16.2, valuation: 'Fair Value', category: 'Energy', tags: ['Large Cap', 'Index Heavy'] },
      { id: '2', name: 'HDFC Bank', symbol: 'HDFCBANK', price: 1742.8, change: 12.4, changePercent: 0.72, oneYearReturn: -4.2, threeYearReturn: 8.4, fiveYearReturn: 12.5, valuation: 'Undervalued', category: 'Banking', tags: ['Large Cap', 'Value'] },
      { id: '3', name: 'TATA Motors', symbol: 'TATAMOTORS', price: 1012.4, change: 15.6, changePercent: 1.56, oneYearReturn: 112.4, threeYearReturn: 45.2, fiveYearReturn: 32.8, valuation: 'Overvalued', category: 'Auto', tags: ['EV', 'Momentum'] },
    ],
    GlobalStock: [
      { id: '1', name: 'Apple Inc.', symbol: 'AAPL', price: 172.4, change: 1.2, changePercent: 0.7, oneYearReturn: 12.4, threeYearReturn: 15.2, fiveYearReturn: 24.5, valuation: 'Fair Value', category: 'Tech', tags: ['US', 'Blue Chip'] },
      { id: '2', name: 'NVIDIA Corp.', symbol: 'NVDA', price: 894.5, change: 24.8, changePercent: 2.85, oneYearReturn: 245.2, threeYearReturn: 184.5, fiveYearReturn: 112.4, valuation: 'Overvalued', category: 'Semiconductors', tags: ['AI', 'Growth'] },
      { id: '3', name: 'Tesla Inc.', symbol: 'TSLA', price: 175.2, change: -4.5, changePercent: -2.5, oneYearReturn: -12.4, threeYearReturn: -5.2, fiveYearReturn: 45.2, valuation: 'Undervalued', category: 'Auto', tags: ['EV', 'Volatile'] },
    ],
    Dividend: [
      { id: '1', name: 'Coal India', symbol: 'COALINDIA', price: 442.5, change: 2.4, changePercent: 0.54, oneYearReturn: 94.2, threeYearReturn: 42.5, fiveYearReturn: 28.4, valuation: 'Fair Value', category: 'Mining', tags: ['High Yield', 'PSU'] },
      { id: '2', name: 'ITC Ltd.', symbol: 'ITC', price: 428.4, change: -1.2, changePercent: -0.28, oneYearReturn: 12.4, threeYearReturn: 18.2, fiveYearReturn: 14.5, valuation: 'Fair Value', category: 'FMCG', tags: ['Defensive', 'Cash Cow'] },
    ],
    SuperInvestors: [
      { 
        id: '1', name: 'KPIT Technologies', symbol: 'KPITTECH', price: 1450.2, change: 12.4, changePercent: 0.86, oneYearReturn: 84.5, threeYearReturn: 125.4, fiveYearReturn: 84.2, valuation: 'Overvalued', category: 'IT', tags: ['Tech', 'Automotive'],
        investor: 'Ashish Kacholia', actionType: 'Buy', stake: '1.2%' 
      },
      { 
        id: '10', name: 'Mohnish Pabrai', symbol: 'Rain Industries', price: 185.4, change: 2.1, changePercent: 1.15, oneYearReturn: 12.4, threeYearReturn: 8.4, fiveYearReturn: 15.2, valuation: 'Undervalued', category: 'Chemicals', tags: ['Value', 'Specialty'],
        investor: 'Mohnish Pabrai', actionType: 'Buy', stake: '8.4%' 
      },
      { 
        id: '11', name: 'Dolly Khanna', symbol: 'KCP Ltd', price: 194.2, change: -1.2, changePercent: -0.62, oneYearReturn: 45.2, valuation: 'Fair Value', category: 'Cement', tags: ['Small Cap', 'Value'],
        investor: 'Dolly Khanna', actionType: 'Buy', stake: '1.1%' 
      },
      { 
        id: '12', name: 'Mukul Agrawal', symbol: 'Raymond Ltd', price: 2145.8, change: 45.2, changePercent: 2.15, oneYearReturn: 112.4, valuation: 'Overvalued', category: 'Textiles', tags: ['Momentum', 'HNI'],
        investor: 'Mukul Agrawal', actionType: 'Buy', stake: '1.3%' 
      },
      { 
        id: '2', name: 'Vaibhav Global', symbol: 'VAIBHAVGBL', price: 412.5, change: -5.2, changePercent: -1.25, oneYearReturn: -8.4, valuation: 'Undervalued', category: 'Retail', tags: ['E-commerce'],
        investor: 'Vijay Kedia', actionType: 'Buy', stake: '0.8%' 
      },
      { 
        id: '3', name: 'Nazara Technologies', symbol: 'NAZARA', price: 724.8, change: 8.5, changePercent: 1.19, oneYearReturn: 15.2, valuation: 'Fair Value', category: 'Gaming', tags: ['Platform'],
        investor: 'Rekha Jhunjhunwala', actionType: 'Sell', stake: '0.5%' 
      },
      { 
        id: '4', name: 'Safari Industries', symbol: 'SAFARI', price: 1980.4, change: 34.2, changePercent: 1.75, oneYearReturn: 112.4, valuation: 'Overvalued', category: 'Consumer Durables', tags: ['Travel'],
        investor: 'Ashish Kacholia', actionType: 'Buy', stake: '0.4%' 
      },
      { 
        id: '5', name: 'Elecon Engineering', symbol: 'ELECON', price: 1050.2, change: 1.2, changePercent: 0.11, oneYearReturn: 145.6, valuation: 'Overvalued', category: 'Industrial', tags: ['Capital Goods'],
        investor: 'Vijay Kedia', actionType: 'Sell', stake: '1.1%' 
      },
    ]
  };

  const filteredData = useMemo(() => {
    let data = mockData[activeScreener] || [];
    
    // Override with live data for specific categories if available
    if (activeScreener === 'IPO' && liveIPOData) {
      data = liveIPOData;
    } else if (activeScreener === 'NFO' && liveNFOData) {
      data = liveNFOData;
    } else if (activeScreener === 'SuperInvestors' && liveSuperInvestorData) {
      data = liveSuperInvestorData;
    }

    if (!searchQuery) return data;
    return data.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.investor?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeScreener, searchQuery, liveIPOData, liveNFOData, liveSuperInvestorData]);

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
        <div className="lg:col-span-1 space-y-2">
          {screeners.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScreener(s.id as ScreenerType)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                activeScreener === s.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl ${activeScreener === s.id ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-white'}`}>
                <s.icon size={18} className={activeScreener === s.id ? 'text-white' : 'text-slate-500'} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold">{s.label}</p>
                <p className={`text-[10px] ${activeScreener === s.id ? 'text-indigo-100' : 'text-slate-400'} line-clamp-1`}>
                  {s.desc}
                </p>
              </div>
              {activeScreener === s.id && <ChevronRight size={16} className="ml-auto opacity-60" />}
            </button>
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
                  {(activeScreener === 'IPO' || activeScreener === 'NFO' || activeScreener === 'SuperInvestors') && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Live Data
                    </span>
                  )}
                </div>
              </h3>
              <div className="flex items-center gap-2">
                {(activeScreener === 'IPO' || activeScreener === 'NFO' || activeScreener === 'SuperInvestors') && (
                  <button 
                    onClick={fetchLatestData}
                    disabled={isLiveFetching}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50"
                    title="Refresh latest deals"
                  >
                    <RefreshCw size={18} className={isLiveFetching ? "animate-spin" : ""} />
                  </button>
                )}
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <Filter size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  <BarChart3 size={18} />
                </button>
              </div>
            </div>

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
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</span>
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
