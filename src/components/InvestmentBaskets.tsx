
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, TrendingUp, Shield, Zap, 
  Globe, Leaf, Briefcase, ArrowRight,
  Info, PieChart as PieIcon, Activity,
  CheckCircle2, Star, X, Target,
  BarChart3, Layers
} from 'lucide-react';
import { PortfolioState } from '../types';
import { formatLakhs } from '../utils/finance';

interface BasketHolding {
  name: string;
  weight: number;
  type: string;
}

interface Basket {
  id: string;
  name: string;
  description: string;
  risk: 'Low' | 'Medium' | 'High' | 'Very High';
  expectedReturn: string;
  minInvestment: number;
  icon: React.ElementType;
  color: string;
  tags: string[];
  allocation: { category: string; percentage: number }[];
  holdings: BasketHolding[];
  strategy: string;
}

const BASKETS: Basket[] = [
  {
    id: 'passive-index-master',
    name: 'Passive Index Master',
    description: 'A low-cost, high-efficiency basket tracking major market indices through Index Funds and ETFs.',
    risk: 'High',
    expectedReturn: '12-15% p.a.',
    minInvestment: 50000,
    icon: Zap,
    color: 'indigo',
    tags: ['Index Funds', 'ETF', 'Low Cost'],
    allocation: [
      { category: 'Equity', percentage: 90 },
      { category: 'Cash', percentage: 10 }
    ],
    strategy: 'Captures broad market returns by investing in Nifty 50, Nifty Next 50, and Midcap 150 index instruments.',
    holdings: [
      { name: 'Nifty 50 Index Fund', weight: 40, type: 'Large Cap' },
      { name: 'Nifty Next 50 ETF', weight: 25, type: 'Large Cap' },
      { name: 'Midcap 150 Index Fund', weight: 20, type: 'Mid Cap' },
      { name: 'Smallcap 250 ETF', weight: 10, type: 'Small Cap' },
      { name: 'Liquid Fund', weight: 5, type: 'Cash' }
    ]
  },
  {
    id: 'yield-maximizer',
    name: 'Yield Maximizer',
    description: 'Focuses on consistent income through high-quality Bonds, Government Schemes, and Debt Mutual Funds.',
    risk: 'Low',
    expectedReturn: '7-9% p.a.',
    minInvestment: 100000,
    icon: Shield,
    color: 'blue',
    tags: ['Bonds', 'Debt MF', 'Govt Schemes'],
    allocation: [
      { category: 'Debt', percentage: 85 },
      { category: 'Cash', percentage: 15 }
    ],
    strategy: 'Prioritizes capital safety and regular yields using AAA-rated corporate bonds and sovereign-backed instruments.',
    holdings: [
      { name: 'Corporate Bond Fund', weight: 30, type: 'Debt MF' },
      { name: 'Sovereign Gold Bonds', weight: 20, type: 'Govt Scheme' },
      { name: 'Banking & PSU Debt Fund', weight: 20, type: 'Debt MF' },
      { name: 'Gilt Fund (Long Term)', weight: 20, type: 'Govt Securities' },
      { name: 'Liquid ETF', weight: 10, type: 'Cash' }
    ]
  },
  {
    id: 'alternative-alpha',
    name: 'Alternative Alpha',
    description: 'Sophisticated exposure to PMS, AIF, REITs, and InvITs for non-linear returns and diversification.',
    risk: 'Very High',
    expectedReturn: '15-20% p.a.',
    minInvestment: 2500000,
    icon: Layers,
    color: 'emerald',
    tags: ['PMS', 'AIF', 'REIT/InvIT'],
    allocation: [
      { category: 'Alternative', percentage: 70 },
      { category: 'Equity', percentage: 20 },
      { category: 'Cash', percentage: 10 }
    ],
    strategy: 'Targets alpha through specialized portfolio management services and high-yield real estate/infrastructure trusts.',
    holdings: [
      { name: 'Equity PMS (Multi-Cap)', weight: 35, type: 'PMS' },
      { name: 'Category II AIF', weight: 25, type: 'AIF' },
      { name: 'Embassy Office Parks REIT', weight: 15, type: 'REIT' },
      { name: 'IndiGrid InvIT', weight: 15, type: 'InvIT' },
      { name: 'Arbitrage Fund', weight: 10, type: 'Hybrid' }
    ]
  },
  {
    id: 'global-diversifier',
    name: 'Global Diversifier',
    description: 'International exposure through Global Mutual Funds and US-focused ETFs to hedge against local currency risk.',
    risk: 'High',
    expectedReturn: '11-14% p.a.',
    minInvestment: 100000,
    icon: Globe,
    color: 'indigo',
    tags: ['Global Funds', 'US Tech', 'International'],
    allocation: [
      { category: 'Equity', percentage: 100 }
    ],
    strategy: 'Invests in the world\'s largest companies through feeder funds and international ETFs.',
    holdings: [
      { name: 'US Total Market Index Fund', weight: 40, type: 'Global Fund' },
      { name: 'Nasdaq 100 ETF', weight: 30, type: 'Global ETF' },
      { name: 'Emerging Markets Fund', weight: 15, type: 'Global Fund' },
      { name: 'Europe Opportunity Fund', weight: 15, type: 'Global Fund' }
    ]
  },
  {
    id: 'precious-metals',
    name: 'Precious Metals Shield',
    description: 'A dedicated hedge against inflation and market volatility through Gold and Silver ETFs.',
    risk: 'Medium',
    expectedReturn: '8-12% p.a.',
    minInvestment: 25000,
    icon: Activity,
    color: 'amber',
    tags: ['Gold ETF', 'Silver ETF', 'Commodity'],
    allocation: [
      { category: 'Gold', percentage: 70 },
      { category: 'Alternative', percentage: 30 }
    ],
    strategy: 'Maintains a balanced exposure to precious metals to provide stability during equity market downturns.',
    holdings: [
      { name: 'Gold ETF (Physical Gold)', weight: 50, type: 'Commodity' },
      { name: 'Silver ETF', weight: 30, type: 'Commodity' },
      { name: 'Sovereign Gold Bonds', weight: 20, type: 'Govt Scheme' }
    ]
  },
  {
    id: 'retirement-foundation',
    name: 'Retirement Foundation',
    description: 'A comprehensive multi-asset basket including Insurance-linked savings and long-term Govt schemes.',
    risk: 'Medium',
    expectedReturn: '10-12% p.a.',
    minInvestment: 500000,
    icon: Briefcase,
    color: 'slate',
    tags: ['Insurance', 'Multi-Asset', 'Retirement'],
    allocation: [
      { category: 'Equity', percentage: 50 },
      { category: 'Debt', percentage: 30 },
      { category: 'Gold', percentage: 10 },
      { category: 'Cash', percentage: 10 }
    ],
    strategy: 'Combines the growth of equity MFs with the stability of PPF, NPS, and guaranteed insurance plans.',
    holdings: [
      { name: 'Flexi Cap Mutual Fund', weight: 30, type: 'Equity MF' },
      { name: 'National Pension System (NPS)', weight: 20, type: 'Retirement' },
      { name: 'Public Provident Fund (PPF)', weight: 20, type: 'Govt Scheme' },
      { name: 'Guaranteed Income Plan', weight: 20, type: 'Insurance' },
      { name: 'Liquid Fund', weight: 10, type: 'Cash' }
    ]
  }
];

interface InvestmentBasketsProps {
  portfolio: PortfolioState;
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' },
};

const InvestmentBaskets: React.FC<InvestmentBasketsProps> = ({ portfolio }) => {
  const [selectedBasket, setSelectedBasket] = useState<Basket | null>(null);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            <ShoppingBag size={14} />
            Curated Investment Baskets
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
            Strategic <span className="text-indigo-600">Baskets</span>
          </h2>
          <p className="text-slate-500 max-w-2xl font-medium">
            Expertly curated collections of assets designed to achieve specific financial objectives. 
            These baskets exclude individual stocks to minimize tracking overhead, focusing on diversified instruments like MF, PMS, AIF, and REITs.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg. Basket Return</p>
              <p className="text-lg font-black text-slate-900">14.2% p.a.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Baskets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BASKETS.map((basket, index) => {
          const colors = COLOR_MAP[basket.color] || COLOR_MAP.slate;
          return (
            <motion.div
              key={basket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="p-8 pb-0">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 ${colors.bg} ${colors.text} rounded-3xl group-hover:scale-110 transition-transform duration-500`}>
                    <basket.icon size={28} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      basket.risk === 'Low' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      basket.risk === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {basket.risk} Risk
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={12} fill="currentColor" />
                      <Star size={12} fill="currentColor" />
                      <Star size={12} fill="currentColor" />
                      <Star size={12} fill="currentColor" />
                      <Star size={12} fill="currentColor" className="opacity-30" />
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {basket.name}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium mb-6 line-clamp-2">
                  {basket.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {basket.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100 uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats Section */}
              <div className="px-8 py-6 bg-slate-50/50 border-y border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Expected Return</p>
                  <p className="text-lg font-black text-emerald-600">{basket.expectedReturn}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Min. Investment</p>
                  <p className="text-lg font-black text-slate-900">{formatLakhs(basket.minInvestment)}</p>
                </div>
              </div>

              {/* Allocation Section */}
              <div className="p-8 pt-6 flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <PieIcon size={12} />
                    Asset Allocation
                  </p>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mb-4">
                  {basket.allocation.map((item, i) => (
                    <div 
                      key={item.category}
                      style={{ width: `${item.percentage}%` }}
                      className={`${
                        item.category === 'Equity' ? 'bg-indigo-500' :
                        item.category === 'Debt' ? 'bg-blue-400' :
                        item.category === 'Gold' ? 'bg-amber-400' :
                        'bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {basket.allocation.map(item => (
                    <div key={item.category} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        item.category === 'Equity' ? 'bg-indigo-500' :
                        item.category === 'Debt' ? 'bg-blue-400' :
                        item.category === 'Gold' ? 'bg-amber-400' :
                        'bg-slate-400'
                      }`} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                        {item.category} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Section */}
              <div className="p-8 pt-0 mt-auto">
                <button 
                  onClick={() => setSelectedBasket(basket)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all group/btn shadow-lg shadow-slate-900/10 hover:shadow-indigo-500/20"
                >
                  Explore Basket
                  <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Basket Detail Modal */}
      <AnimatePresence>
        {selectedBasket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBasket(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-10 border-b border-slate-100 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                  <div className={`p-5 ${COLOR_MAP[selectedBasket.color]?.bg} ${COLOR_MAP[selectedBasket.color]?.text} rounded-[2rem]`}>
                    <selectedBasket.icon size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedBasket.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        selectedBasket.risk === 'Low' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        selectedBasket.risk === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {selectedBasket.risk} Risk
                      </span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star size={12} fill="currentColor" />
                        <Star size={12} fill="currentColor" />
                        <Star size={12} fill="currentColor" />
                        <Star size={12} fill="currentColor" />
                        <Star size={12} fill="currentColor" className="opacity-30" />
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedBasket(null)}
                  className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-grow overflow-y-auto p-8 md:p-10 space-y-10">
                {/* Strategy Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                    <Target size={14} />
                    Investment Strategy
                  </div>
                  <p className="text-lg text-slate-600 leading-relaxed font-medium">
                    {selectedBasket.strategy}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Target Return</p>
                    <p className="text-2xl font-black text-emerald-600">{selectedBasket.expectedReturn}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Min. Investment</p>
                    <p className="text-2xl font-black text-slate-900">{formatLakhs(selectedBasket.minInvestment)}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Rebalancing</p>
                    <p className="text-2xl font-black text-indigo-600">Quarterly</p>
                  </div>
                </div>

                {/* Allocation & Holdings */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Allocation Chart */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                      <BarChart3 size={14} />
                      Asset Allocation
                    </div>
                    <div className="space-y-4">
                      {selectedBasket.allocation.map(item => (
                        <div key={item.category} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                            <span className="text-slate-500">{item.category}</span>
                            <span className="text-slate-900">{item.percentage}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full ${
                                item.category === 'Equity' ? 'bg-indigo-500' :
                                item.category === 'Debt' ? 'bg-blue-400' :
                                item.category === 'Gold' ? 'bg-amber-400' :
                                'bg-slate-400'
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Holdings */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest">
                      <Layers size={14} />
                      Top Holdings
                    </div>
                    <div className="space-y-3">
                      {selectedBasket.holdings.map((holding, i) => (
                        <div key={holding.name} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{holding.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{holding.type}</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-slate-700">{holding.weight}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3 text-slate-500">
                  <Info size={18} />
                  <p className="text-xs font-medium">Investments are subject to market risks. Read all scheme related documents carefully.</p>
                </div>
                <button className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                  Invest Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Why Baskets Section */}
      <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-black tracking-tighter">Why Invest in Baskets?</h3>
            <p className="text-indigo-100 font-medium leading-relaxed">
              Investment baskets offer a disciplined approach to wealth creation by bundling high-quality assets 
              that share a common theme or objective. They simplify diversification and professional management.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                'Professional Curation',
                'Instant Diversification',
                'Thematic Exposure',
                'Easy Rebalancing',
                'Transparent Holdings',
                'Goal-Based Approach'
              ].map(feature => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-indigo-300" />
                  <span className="text-sm font-bold">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white text-indigo-600 rounded-2xl">
                <Info size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Expert Insight</p>
                <p className="text-lg font-bold">Strategic Allocation</p>
              </div>
            </div>
            <p className="text-sm text-indigo-50 leading-relaxed italic">
              "Baskets allow investors to move away from individual stock picking and focus on professionally managed instruments 
              that drive long-term value. It's about building a robust architecture for your wealth without the burden of daily tracking."
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <div className="w-10 h-10 rounded-full bg-indigo-400 flex items-center justify-center font-bold">PB</div>
              <div>
                <p className="text-sm font-bold">PMS Basket Research</p>
                <p className="text-xs text-indigo-300">Investment Strategy Team</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentBaskets;
