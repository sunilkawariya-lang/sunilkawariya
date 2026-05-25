
import React, { useState } from 'react';
import { 
  Building2, 
  Landmark, 
  ShieldCheck, 
  TrendingUp, 
  Briefcase, 
  Globe, 
  HeartPulse, 
  Baby, 
  PieChart, 
  Zap, 
  Search,
  ChevronRight,
  ExternalLink,
  Info,
  ArrowRight,
  Gem,
  Coins,
  Stethoscope,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  description: string;
  features: string[];
  suitability: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  returnProfile: string;
  detailedOptions?: {
    label: string;
    value: string;
    subtext?: string;
  }[];
}

const SERVICES: ServiceItem[] = [
  {
    id: 'real-estate',
    title: 'Real Estate Projects',
    category: 'Physical Assets',
    icon: Building2,
    description: 'Bespoke real estate opportunities based on your specific geographical and yield requirements.',
    features: ['Project-based analysis', 'Due diligence support', 'Yield optimization', 'Commercial & Residential'],
    suitability: 'Long-term wealth creation with physical asset preference.',
    riskLevel: 'Moderate',
    returnProfile: 'Rental Yield + Capital Appreciation',
    detailedOptions: [
      { label: 'Project Alpha - Mumbai', value: '7.2% Yield', subtext: 'Commercial Grade A Office Space' },
      { label: 'Project Zenith - Bangalore', value: '12% IRR', subtext: 'Premium Residential Development' },
      { label: 'Project Oasis - Dubai', value: '8.5% Net Yield', subtext: 'Luxury Holiday Apartments' }
    ]
  },
  {
    id: 'fd-options',
    title: 'Fixed Deposit Options',
    category: 'Debt & Cash',
    icon: Landmark,
    description: 'Curated list of high-yield corporate and bank FDs with varying tenures.',
    features: ['Bank FDs', 'Corporate FDs', 'Flexible tenures', 'Senior citizen benefits'],
    suitability: 'Capital preservation and regular income.',
    riskLevel: 'Low',
    returnProfile: 'Fixed Interest',
    detailedOptions: [
      { label: 'HDFC Bank', value: '7.25% p.a.', subtext: '3 Year Tenure | AAA Rated' },
      { label: 'Bajaj Finance', value: '8.10% p.a.', subtext: '44 Months | FAAA Rated' },
      { label: 'ICICI Bank', value: '7.10% p.a.', subtext: '15 Months | AAA Rated' }
    ]
  },
  {
    id: 'bonds',
    title: 'Bonds & Debentures',
    category: 'Debt & Cash',
    icon: FileText,
    description: 'Government and high-rated corporate bonds for stable, predictable returns.',
    features: ['RBI Bonds', 'Sovereign Gold Bonds', 'Tax-free Bonds', 'Corporate NCDs'],
    suitability: 'Stable income with higher returns than FDs.',
    riskLevel: 'Low',
    returnProfile: 'Coupon Payments',
    detailedOptions: [
      { label: 'Sovereign Gold Bond', value: '2.5% + Gold Appr.', subtext: 'Govt. Backed | 8 Year Tenure' },
      { label: 'NHAI Tax-Free Bonds', value: '5.25% Tax-Free', subtext: 'AAA Rated | Semi-annual Payout' },
      { label: 'RBI Floating Rate', value: '8.05% (Variable)', subtext: 'Govt. Backed | 7 Year Tenure' }
    ]
  },
  {
    id: 'guaranteed-income',
    title: 'Guaranteed Income Plans',
    category: 'Insurance & Savings',
    icon: ShieldCheck,
    description: 'Insurance-cum-investment plans offering guaranteed payouts over a fixed period.',
    features: ['Tax-free maturity', 'Life cover included', 'Guaranteed returns', 'Flexible payout options'],
    suitability: 'Meeting specific future cash flow needs.',
    riskLevel: 'Low',
    returnProfile: 'Guaranteed Payouts'
  },
  {
    id: 'stocks',
    title: 'Direct Stocks',
    category: 'Equity',
    icon: TrendingUp,
    description: 'Direct equity investment strategies for long-term capital growth.',
    features: ['Blue-chip focus', 'Growth stocks', 'Dividend yielders', 'Small-cap opportunities'],
    suitability: 'High-growth seekers with market risk tolerance.',
    riskLevel: 'High',
    returnProfile: 'Dividends + Capital Gains'
  },
  {
    id: 'nps',
    title: 'National Pension System',
    category: 'Retirement',
    icon: Clock,
    description: 'Government-backed retirement savings scheme with tax benefits.',
    features: ['Tier I & II accounts', 'Tax deduction under 80CCD', 'Low cost', 'Market-linked returns'],
    suitability: 'Retirement corpus building with tax efficiency.',
    riskLevel: 'Moderate',
    returnProfile: 'Market-linked Corpus'
  },
  {
    id: 'health-insurance',
    title: 'Health Insurance',
    category: 'Protection',
    icon: HeartPulse,
    description: 'Comprehensive health covers for you and your family, including specialized critical illness plans.',
    features: ['Cashless treatment', 'Global coverage options', 'No-claim bonus', 'OPD coverage'],
    suitability: 'Protecting wealth from medical emergencies.',
    riskLevel: 'Low',
    returnProfile: 'Risk Mitigation'
  },
  {
    id: 'term-insurance',
    title: 'Term Insurance',
    category: 'Protection',
    icon: ShieldCheck,
    description: 'Pure life protection plans ensuring your family\'s financial security in your absence.',
    features: ['High sum assured', 'Low premiums', 'Critical illness riders', 'Accidental death benefit'],
    suitability: 'Income replacement for dependents.',
    riskLevel: 'Low',
    returnProfile: 'Financial Security'
  },
  {
    id: 'sip',
    title: 'SIP (Systematic Investment Plan)',
    category: 'Mutual Funds',
    icon: Zap,
    description: 'Disciplined monthly investments in mutual funds to leverage rupee cost averaging.',
    features: ['Equity SIPs', 'Debt SIPs', 'Hybrid SIPs', 'Goal-mapped SIPs'],
    suitability: 'Long-term wealth building through small regular amounts.',
    riskLevel: 'Moderate',
    returnProfile: 'Compounded Growth'
  },
  {
    id: 'loan-options',
    title: 'Loan Options',
    category: 'Liabilities',
    icon: Landmark,
    description: 'Strategic borrowing solutions including home loans, LAP, and business financing.',
    features: ['Home Loans', 'Loan Against Property', 'Business Loans', 'Balance Transfer'],
    suitability: 'Asset acquisition or business expansion.',
    riskLevel: 'Moderate',
    returnProfile: 'Leveraged Growth'
  },
  {
    id: 'pms',
    title: 'PMS (Portfolio Management Services)',
    category: 'Elite Investing',
    icon: Briefcase,
    description: 'Professional management of your equity portfolio with personalized strategies.',
    features: ['Concentrated portfolios', 'Direct stock ownership', 'Professional managers', 'Customized reporting'],
    suitability: 'HNIs seeking alpha through active management.',
    riskLevel: 'High',
    returnProfile: 'Active Alpha Generation'
  },
  {
    id: 'aif',
    title: 'AIF (Alternative Investment Funds)',
    category: 'Elite Investing',
    icon: Gem,
    description: 'Private equity, venture capital, and hedge fund opportunities for sophisticated investors.',
    features: ['Category I, II, III AIFs', 'Unlisted equity', 'Real estate funds', 'Long-short strategies'],
    suitability: 'Diversification into non-traditional assets.',
    riskLevel: 'Very High',
    returnProfile: 'High Alpha / Absolute Returns'
  },
  {
    id: 'etf',
    title: 'ETF (Exchange Traded Funds)',
    category: 'Equity',
    icon: PieChart,
    description: 'Low-cost index-tracking funds traded on the stock exchange.',
    features: ['Nifty 50 ETFs', 'Gold ETFs', 'International ETFs', 'Sectoral ETFs'],
    suitability: 'Cost-effective market exposure.',
    riskLevel: 'Moderate',
    returnProfile: 'Index Returns'
  },
  {
    id: 'mf',
    title: 'Mutual Funds',
    category: 'Mutual Funds',
    icon: Coins,
    description: 'Professionally managed pooled investments across equity, debt, and hybrid categories.',
    features: ['Large/Mid/Small cap', 'Index funds', 'Liquid funds', 'ELSS (Tax saving)'],
    suitability: 'Diversified exposure for all investor types.',
    riskLevel: 'Moderate',
    returnProfile: 'Diversified Growth',
    detailedOptions: [
      { label: 'Large Cap Index', value: '14.2% (3Y)', subtext: 'Low Cost | Market Tracking' },
      { label: 'Mid Cap Growth', value: '22.5% (3Y)', subtext: 'High Alpha | Active Management' },
      { label: 'Liquid Fund', value: '6.8% (1Y)', subtext: 'High Liquidity | Low Risk' }
    ]
  },
  {
    id: 'stock-basket',
    title: 'Stock Baskets / Smallcases',
    category: 'Equity',
    icon: TrendingUp,
    description: 'Thematic and strategy-based baskets of stocks for targeted exposure.',
    features: ['Thematic baskets', 'Momentum strategies', 'Dividend baskets', 'Sectoral focus'],
    suitability: 'Thematic investing with direct stock ownership.',
    riskLevel: 'High',
    returnProfile: 'Strategy-linked Returns'
  },
  {
    id: 'ulips',
    title: 'ULIPs (Unit Linked Insurance Plans)',
    category: 'Insurance & Savings',
    icon: ShieldCheck,
    description: 'Hybrid product offering life insurance and market-linked investment benefits.',
    features: ['Tax-free switching', '80C benefits', 'Life cover', 'Maturity benefits'],
    suitability: 'Long-term goal funding with insurance cover.',
    riskLevel: 'Moderate',
    returnProfile: 'Market-linked + Protection'
  },
  {
    id: 'child-plan',
    title: 'Child Plans',
    category: 'Goal Based',
    icon: Baby,
    description: 'Specialized investment plans designed to secure your child\'s education and future milestones.',
    features: ['Waiver of premium', 'Targeted maturity', 'Education focus', 'Flexible payouts'],
    suitability: 'Securing children\'s future milestones.',
    riskLevel: 'Moderate',
    returnProfile: 'Goal-secured Payouts'
  },
  {
    id: 'retirement-plans',
    title: 'Retirement Plans',
    category: 'Retirement',
    icon: Clock,
    description: 'Comprehensive strategies to ensure a steady income stream during your golden years.',
    features: ['Annuity plans', 'Pension funds', 'Deferred payout options', 'Inflation protection'],
    suitability: 'Ensuring post-retirement lifestyle.',
    riskLevel: 'Moderate',
    returnProfile: 'Regular Pension'
  },
  {
    id: 'ipo',
    title: 'IPO (Initial Public Offering)',
    category: 'Equity',
    icon: Zap,
    description: 'Opportunities to invest in companies as they go public on the stock exchange.',
    features: ['Mainboard IPOs', 'SME IPOs', 'Listing gain potential', 'Long-term growth'],
    suitability: 'Seeking early-stage public market growth.',
    riskLevel: 'High',
    returnProfile: 'Listing Gains + Growth'
  },
  {
    id: 'pre-ipo',
    title: 'Pre-IPO (Unlisted Shares)',
    category: 'Elite Investing',
    icon: Gem,
    description: 'Investment in late-stage startups and companies before they list on the stock exchange.',
    features: ['Unlisted equity', 'High growth potential', 'Early entry', 'Strategic allocation'],
    suitability: 'High-risk investors seeking pre-listing alpha.',
    riskLevel: 'Very High',
    returnProfile: 'Pre-listing Appreciation'
  },
  {
    id: 'global-investment',
    title: 'Global Investments',
    category: 'Equity',
    icon: Globe,
    description: 'Diversify your portfolio across international markets like the US, Europe, and Asia.',
    features: ['US Stocks', 'Global ETFs', 'LRS compliance', 'Currency diversification'],
    suitability: 'Geographical diversification and dollar-hedging.',
    riskLevel: 'High',
    returnProfile: 'Global Growth + Currency Gain'
  }
];

const CATEGORIES = Array.from(new Set(SERVICES.map(s => s.category)));

const WealthServices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showInquiryOptions, setShowInquiryOptions] = useState(false);
  const [showDetailedOptions, setShowDetailedOptions] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  const filteredServices = SERVICES.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-serif text-4xl font-medium text-slate-900 tracking-tight">Wealth Services Directory</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Comprehensive investment & protection solutions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search services..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-wealth-navy/10 outline-none w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
            selectedCategory === 'All' 
              ? 'bg-wealth-navy text-white border-wealth-navy shadow-lg shadow-slate-200' 
              : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
          }`}
        >
          All Solutions
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedCategory === cat 
                ? 'bg-wealth-navy text-white border-wealth-navy shadow-lg shadow-slate-200' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredServices.map((service) => (
            <motion.div
              layout
              key={service.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="premium-card group hover:border-wealth-navy/30 transition-all cursor-pointer overflow-hidden"
              onClick={() => setSelectedService(service)}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100 group-hover:bg-wealth-navy group-hover:text-wealth-gold transition-all">
                    <service.icon size={24} />
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                    service.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    service.riskLevel === 'Moderate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {service.riskLevel} Risk
                  </div>
                </div>
                
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{service.category}</p>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-wealth-navy transition-colors">{service.title}</h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <TrendingUp size={12} className="text-emerald-500" />
                    {service.returnProfile}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-wealth-navy group-hover:text-white transition-all">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="relative h-48 bg-wealth-navy overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-wealth-navy to-slate-900" />
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-wealth-gold/10 rounded-full blur-3xl" />
                
                <button 
                  onClick={() => {
                    setSelectedService(null);
                    setShowInquiryOptions(false);
                    setShowDetailedOptions(false);
                    setInquirySuccess(false);
                  }}
                  className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                >
                  <ChevronRight className="rotate-90" size={20} />
                </button>

                <div className="absolute bottom-8 left-8 flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-wealth-navy shadow-xl">
                    <selectedService.icon size={40} />
                  </div>
                  <div className="text-white">
                    <p className="text-[10px] font-black uppercase tracking-widest text-wealth-gold mb-1">{selectedService.category}</p>
                    <h3 className="text-3xl font-bold tracking-tight">{selectedService.title}</h3>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {!showInquiryOptions && !showDetailedOptions ? (
                    <motion.div 
                      key="details"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Service Overview</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {selectedService.description}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Key Features</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedService.features.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <CheckCircle2 className="text-emerald-500" size={16} />
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4">
                          <div className="flex items-center gap-2 text-indigo-900">
                            <Info size={18} />
                            <h4 className="text-xs font-black uppercase tracking-widest">Strategic Fit</h4>
                          </div>
                          <p className="text-xs text-indigo-800 leading-relaxed">
                            {selectedService.suitability}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Risk Profile</p>
                            <p className={`text-sm font-black ${
                              selectedService.riskLevel === 'Low' ? 'text-emerald-600' :
                              selectedService.riskLevel === 'Moderate' ? 'text-amber-600' : 'text-rose-600'
                            }`}>{selectedService.riskLevel}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Return Potential</p>
                            <p className="text-sm font-black text-slate-900">{selectedService.returnProfile}</p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3">
                          {selectedService.detailedOptions && (
                            <button 
                              onClick={() => setShowDetailedOptions(true)}
                              className="w-full py-4 bg-white border-2 border-wealth-navy text-wealth-navy rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                            >
                              <span className="text-xs font-black uppercase tracking-widest">View Current Options</span>
                              <Search size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => setShowInquiryOptions(true)}
                            className="w-full py-4 bg-wealth-navy text-white rounded-2xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200"
                          >
                            <span className="text-xs font-black uppercase tracking-widest">Inquire for Details</span>
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : showDetailedOptions ? (
                    <motion.div 
                      key="detailed-options"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Available Investment Options</h4>
                        <button 
                          onClick={() => setShowDetailedOptions(false)}
                          className="text-[10px] font-black text-wealth-navy uppercase tracking-widest hover:underline"
                        >
                          Back to Overview
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {selectedService.detailedOptions?.map((opt, i) => (
                          <div 
                            key={i}
                            className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-wealth-navy/20 transition-all"
                          >
                            <div className="space-y-1">
                              <h5 className="font-bold text-slate-900">{opt.label}</h5>
                              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{opt.subtext}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-wealth-navy">{opt.value}</p>
                              <button 
                                onClick={() => {
                                  setShowDetailedOptions(false);
                                  setShowInquiryOptions(true);
                                }}
                                className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline mt-1"
                              >
                                Select Option
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                          <Info size={20} />
                        </div>
                        <p className="text-xs text-indigo-900 leading-relaxed">
                          These are indicative options based on current market availability. Final terms may vary based on investment size and timing.
                        </p>
                      </div>
                    </motion.div>
                  ) : inquirySuccess ? (
                    <motion.div 
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center space-y-6"
                    >
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={40} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-slate-900">Inquiry Received</h4>
                        <p className="text-slate-500 mt-2">A dedicated wealth architect will contact you shortly with detailed options for {selectedService.title}.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedService(null);
                          setShowInquiryOptions(false);
                          setInquirySuccess(false);
                        }}
                        className="px-8 py-3 bg-wealth-navy text-white rounded-xl font-bold text-xs uppercase tracking-widest"
                      >
                        Close
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="options"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Inquiry Type</h4>
                        <button 
                          onClick={() => setShowInquiryOptions(false)}
                          className="text-[10px] font-black text-wealth-navy uppercase tracking-widest hover:underline"
                        >
                          Back to Overview
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { title: 'Speak to Advisor', desc: 'Schedule a 15-min discovery call with a specialist.', icon: HeartPulse },
                          { title: 'Download Factsheet', desc: 'Get detailed performance data and fee structure PDF.', icon: FileText },
                          { title: 'Check Eligibility', desc: 'See if you meet the minimum criteria for this investment.', icon: ShieldCheck },
                          { title: 'Get Custom Quote', desc: 'Receive a personalized projection based on your capital.', icon: Zap }
                        ].map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => setInquirySuccess(true)}
                            className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-wealth-navy/30 hover:shadow-xl hover:shadow-slate-200 transition-all text-left space-y-3 group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white text-slate-400 group-hover:bg-wealth-navy group-hover:text-wealth-gold flex items-center justify-center transition-all shadow-sm">
                              <opt.icon size={20} />
                            </div>
                            <h5 className="font-bold text-slate-900">{opt.title}</h5>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{opt.desc}</p>
                          </button>
                        ))}
                      </div>

                      <div className="p-6 bg-slate-900 rounded-3xl text-white flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                            <Gem className="text-wealth-gold" size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Priority Support</p>
                            <p className="text-[10px] text-slate-400">Elite members get instant callback.</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-wealth-gold text-wealth-navy rounded-xl text-[10px] font-black uppercase tracking-widest">
                          Upgrade
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WealthServices;
