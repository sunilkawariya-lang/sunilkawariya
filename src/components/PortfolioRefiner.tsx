
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Target, 
  TrendingUp, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Info
} from 'lucide-react';
import { PortfolioState, AssetCategory } from '../types';
import { getCompositionRefinement } from '../services/geminiService';
import { formatLakhs } from '../utils/finance';
import { ASSET_COLORS } from '../constants';
import { toast } from 'sonner';

interface PortfolioRefinerProps {
  portfolio: PortfolioState;
}

const PortfolioRefiner: React.FC<PortfolioRefinerProps> = ({ portfolio }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refinementData, setRefinementData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  const fetchRefinement = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await getCompositionRefinement(portfolio);
      if (data) {
        setRefinementData(data);
        toast.success('Portfolio optimization plan generated');
      } else {
        setError('Failed to generate refinement plan. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during AI analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCategory = (category: string) => {
    setIsExpanded(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Brain className="text-wealth-navy" size={32} />
            Composition Refinement Engine
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Aligning your portfolio with institutional risk benchmarks</p>
        </div>
        <button 
          onClick={fetchRefinement}
          disabled={isAnalyzing}
          className="px-6 py-3 bg-wealth-navy text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <RefreshCw size={20} className="animate-spin text-wealth-gold" />
          ) : (
            <Sparkles size={20} className="text-wealth-gold" />
          )}
          {refinementData ? 'Re-Analyze Portfolio' : 'Fetch AI Refinement'}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!refinementData && !isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center shadow-sm"
          >
            <div className="w-20 h-20 bg-wealth-navy/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="text-wealth-navy" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Ready to Optimize Your Wealth?</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium leading-relaxed">
              Our AI engine will analyze your current {portfolio.investments.length} holdings against your {portfolio.riskProfile?.type || 'Moderate'} risk profile to suggest the ideal asset composition.
            </p>
            <button 
              onClick={fetchRefinement}
              className="px-10 py-5 bg-wealth-navy text-white rounded-3xl font-black text-sm tracking-widest uppercase hover:scale-105 transition-all shadow-2xl shadow-indigo-100"
            >
              Start Refinement Analysis
            </button>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-16 rounded-[2.5rem] border border-slate-100 flex flex-col items-center gap-6"
          >
            <div className="relative">
              <div className="p-8 bg-wealth-navy rounded-[2rem]">
                <Brain size={48} className="text-wealth-gold animate-pulse" />
              </div>
              <div className="absolute -inset-4 border-2 border-dashed border-wealth-navy/20 rounded-[2.5rem] animate-spin-slow" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Portfolio DNA</h3>
              <p className="text-slate-500 text-sm font-medium">Fetching real-time market data to ground suggestions...</p>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 bg-wealth-gold rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}

        {refinementData && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {/* Executive Score & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-wealth-navy rounded-[2.5rem] p-8 text-white flex flex-col justify-between shadow-2xl shadow-slate-200">
                <div>
                  <h3 className="text-wealth-gold/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Refinement Alignment Score</h3>
                  <div className="relative flex items-center justify-center">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <motion.circle 
                        cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent"
                        strokeDasharray={440}
                        initial={{ strokeDashoffset: 440 }}
                        animate={{ strokeDashoffset: 440 - (440 * refinementData.refinementScore) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="text-wealth-gold"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black">{refinementData.refinementScore}</span>
                      <span className="text-[10px] font-bold text-wealth-gold uppercase tracking-widest">/ 100</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-xs font-medium text-slate-400">Your portfolio is {refinementData.refinementScore}% aligned with the ideal strategy for a {portfolio.riskProfile?.type} investor.</p>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Zap size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Executive Refinement Summary</h3>
                  </div>
                  <p className="text-slate-600 font-medium leading-relaxed">
                    {refinementData.executiveSummary}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {refinementData.strategicDirectives.map((directive: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <CheckCircle2 size={16} className="text-wealth-navy" />
                      <span className="text-xs font-bold text-slate-700">{directive}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Target vs Current Allocation */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Target size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Allocation Drift Analysis</h3>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-slate-100 rounded-full" /> CURRENT
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-wealth-navy rounded-full" /> TARGET
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {refinementData.targetAllocation.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">{item.category}</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                        Math.abs(item.gap) > 10 ? 'bg-rose-50 text-rose-600' : 
                        Math.abs(item.gap) > 5 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {item.gap > 0 ? `+${item.gap}% Over` : `${item.gap}% Under`}
                      </span>
                    </div>
                    <div className="h-6 bg-slate-50 rounded-full overflow-hidden relative border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.current}%` }}
                        className="absolute inset-y-0 left-0 bg-slate-200/50"
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.target}%` }}
                        style={{ backgroundColor: ASSET_COLORS[item.category as AssetCategory] || '#64748b' }}
                        className="absolute inset-y-0 left-0 opacity-20"
                      />
                      <div 
                        className="absolute inset-y-1 w-1 bg-wealth-navy rounded-full z-10 shadow-sm"
                        style={{ left: `calc(${item.target}% - 2px)` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-4 text-[10px] font-black">
                        <span>{item.current}% Actual</span>
                        <span>{item.target}% Goal</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Execution Plan */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <TrendingUp className="text-wealth-navy" size={24} />
                Strategic Rebalancing Directive
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                {refinementData.actionPlan.map((action: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-6 rounded-3xl border flex flex-col md:flex-row md:items-center gap-6 transition-all hover:translate-x-1 ${
                      action.action === 'Sell' ? 'bg-rose-50/30 border-rose-100 hover:border-rose-200' :
                      action.action === 'Buy' ? 'bg-emerald-50/30 border-emerald-100 hover:border-emerald-200' :
                      'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-[2rem] flex flex-col items-center justify-center shrink-0 shadow-sm ${
                      action.action === 'Sell' ? 'bg-rose-600 text-white' :
                      action.action === 'Buy' ? 'bg-emerald-600 text-white' :
                      'bg-slate-800 text-white'
                    }`}>
                      <span className="text-[10px] font-black uppercase">{action.action}</span>
                      <ArrowRight size={18} className={action.action === 'Sell' ? 'rotate-90' : action.action === 'Buy' ? '-rotate-90' : ''} />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 uppercase tracking-tight">{action.category}</h4>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">• Priority Action</span>
                      </div>
                      <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-2xl">{action.reasoning}</p>
                    </div>

                    <div className="text-left md:text-right px-6 border-l border-slate-200/60 shrink-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recommended Move</p>
                      <p className={`text-xl font-black ${
                        action.action === 'Sell' ? 'text-rose-600' :
                        action.action === 'Buy' ? 'text-emerald-600' :
                        'text-slate-800'
                      }`}>
                        ₹ {action.amount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">Estimated value</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Disclaimer & Context */}
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
              <Info className="text-slate-400 shrink-0 mt-1" size={20} />
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-slate-800">Calculation Logic</h5>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Refinement suggestions are generated based on a combination of your user-defined Risk Profile, current market valuation (derived from Real-time Gemini search), and standard institutional diversification benchmarks. These are for informational purposes only and not direct financial advice.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioRefiner;
