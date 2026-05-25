
import React, { useState, useMemo } from 'react';
import { X, ArrowRight, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Info, PieChart, Sparkles, Activity, Landmark, LineChart, Globe, Zap, BarChart3, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioState, Investment, AssetCategory, MarketScenarioAnalysis } from '../types';
import { TARGET_ALLOCATIONS, formatCurrency, ASSET_COLORS } from '../constants';
import { useFirebase } from '../contexts/FirebaseContext';
import { generateMarketScenarioAnalysis } from '../services/analysisService';
import { toast } from 'sonner';

interface RebalancingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RebalanceAction {
  category: AssetCategory;
  type: 'Buy' | 'Sell';
  amount: number;
  percentageChange: number;
}

export const RebalancingModal: React.FC<RebalancingModalProps> = ({ isOpen, onClose }) => {
  const { portfolio, updateInvestment, addTransaction } = useFirebase();
  const [isApplying, setIsApplying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'rebalance' | 'market'>('rebalance');
  const [marketAnalysis, setMarketAnalysis] = useState<MarketScenarioAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize custom targets from risk profile defaults
  const [customTargets, setCustomTargets] = useState<Record<string, number>>(() => {
    const riskType = portfolio.riskProfile.type;
    return { ...(TARGET_ALLOCATIONS[riskType] || TARGET_ALLOCATIONS['Moderate']) };
  });

  React.useEffect(() => {
    if (isOpen && !marketAnalysis) {
      handleFetchMarketAnalysis();
    }
  }, [isOpen]);

  const handleFetchMarketAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await generateMarketScenarioAnalysis(portfolio);
      setMarketAnalysis(analysis);
    } catch (error) {
      console.error('Failed to fetch market analysis:', error);
      toast.error('Market analysis is temporarily unavailable.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimizeWithAI = () => {
    if (!marketAnalysis) return;
    
    toast.info('Optimizing targets based on AI market analysis...', { duration: 3000 });
    
    // Simple heuristic: if AI says Overweight a sector/class, bump it slightly.
    // In a real app, this would be a more precise mapping from AI.
    const newTargets = { ...customTargets };
    
    // Example logic: Adjust Equity/Debt/Gold based on sentiment
    if (marketAnalysis.marketSentiment.equity.toLowerCase().includes('bullish') || marketAnalysis.marketSentiment.overall.toLowerCase().includes('growth')) {
      newTargets['Equity'] = (newTargets['Equity'] || 0) + 5;
      newTargets['Debt'] = Math.max(0, (newTargets['Debt'] || 0) - 5);
    } else if (marketAnalysis.marketSentiment.equity.toLowerCase().includes('bearish')) {
      newTargets['Equity'] = Math.max(0, (newTargets['Equity'] || 0) - 5);
      newTargets['Gold'] = (newTargets['Gold'] || 0) + 5;
    }

    // Normalize back to 100%
    const currentTotal = Object.values(newTargets).reduce((a, b) => a + b, 0);
    Object.keys(newTargets).forEach(key => {
      newTargets[key] = Math.round((newTargets[key] / currentTotal) * 100);
    });
    
    // Fix rounding errors
    const finalTotal = Object.values(newTargets).reduce((a, b) => a + b, 0);
    if (finalTotal !== 100) {
      newTargets['Equity'] += (100 - finalTotal);
    }

    setCustomTargets(newTargets);
    setIsCustomizing(true);
    toast.success('Targets optimized for current Indian market conditions!');
  };

  const rebalancingData = useMemo(() => {
    const totalValue = portfolio.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const targets = customTargets;

    const currentAllocation: Record<string, number> = {};
    const currentValues: Record<string, number> = {};

    portfolio.investments.forEach(inv => {
      currentValues[inv.category] = (currentValues[inv.category] || 0) + inv.currentValue;
    });

    Object.keys(currentValues).forEach(cat => {
      currentAllocation[cat] = (currentValues[cat] / totalValue) * 100;
    });

    const actions: RebalanceAction[] = [];
    // Use all categories that have either a target or a current value
    const allCategories = Array.from(new Set([...Object.keys(targets), ...Object.keys(currentValues)]));

    allCategories.forEach(cat => {
      const targetPct = targets[cat] || 0;
      const currentPct = currentAllocation[cat] || 0;
      const targetValue = (targetPct / 100) * totalValue;
      const currentValue = currentValues[cat] || 0;
      const diff = targetValue - currentValue;

      if (Math.abs(diff) > 1000) { // Only suggest if diff > ₹1000
        actions.push({
          category: cat as AssetCategory,
          type: diff > 0 ? 'Buy' : 'Sell',
          amount: Math.abs(diff),
          percentageChange: Math.abs(targetPct - currentPct)
        });
      }
    });

    return {
      totalValue,
      targets,
      currentAllocation,
      currentValues,
      actions: actions.sort((a, b) => b.amount - a.amount)
    };
  }, [portfolio, customTargets]);

  const totalTargetPct = Object.values(customTargets).reduce((sum, val) => sum + val, 0);

  const handleTargetChange = (category: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomTargets(prev => ({
      ...prev,
      [category]: numValue
    }));
  };

  const resetToDefault = () => {
    const riskType = portfolio.riskProfile.type;
    setCustomTargets({ ...(TARGET_ALLOCATIONS[riskType] || TARGET_ALLOCATIONS['Moderate']) });
    setIsCustomizing(false);
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      // For each action, we update the investments in that category
      for (const action of rebalancingData.actions) {
        const categoryInvestments = portfolio.investments.filter(inv => inv.category === action.category);
        const categoryTotal = rebalancingData.currentValues[action.category] || 0;

        if (categoryTotal === 0 && action.type === 'Buy') {
          // If category is empty, we can't proportionally buy. 
          // In a real app, we'd ask which specific asset to buy.
          // For this demo, we'll skip or pick the first one if any exist in the system.
          continue;
        }

        for (const inv of categoryInvestments) {
          const proportion = inv.currentValue / categoryTotal;
          const changeAmount = action.amount * proportion;
          const newValue = action.type === 'Buy' ? inv.currentValue + changeAmount : inv.currentValue - changeAmount;

          await updateInvestment({
            ...inv,
            currentValue: newValue,
            lastUpdated: new Date().toISOString()
          });

          // Add a transaction record
          await addTransaction({
            memberId: inv.memberId,
            investmentId: inv.id,
            investmentName: inv.name,
            type: action.type,
            date: new Date().toISOString(),
            quantity: 0, // Simplified
            price: 0,    // Simplified
            amount: changeAmount,
            category: inv.category
          });
        }
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to apply rebalancing:', error);
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-wealth-navy/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-wealth-gold/10 text-wealth-gold rounded-2xl">
              <PieChart size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-wealth-navy tracking-tight">Portfolio Optimizer</h3>
              <p className="text-sm text-slate-500 font-medium">Market-aware rebalancing for {portfolio.riskProfile.type} profile.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveTab('rebalance')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rebalance' 
                    ? 'bg-white text-wealth-navy shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Rebalance
              </button>
              <button
                onClick={() => setActiveTab('market')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'market' 
                    ? 'bg-white text-wealth-navy shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Market Context
                {isAnalyzing && <RefreshCcw size={12} className="animate-spin text-indigo-500" />}
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {isSuccess ? (
            <div className="py-20 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
                <CheckCircle2 size={48} />
              </div>
              <h3 className="text-3xl font-bold text-wealth-navy tracking-tight">Portfolio Rebalanced</h3>
              <p className="text-slate-500 max-w-md mx-auto font-medium">Your asset allocation has been successfully optimized according to your strategic risk profile.</p>
            </div>
          ) : activeTab === 'market' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {isAnalyzing ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" size={32} />
                  </div>
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-wealth-navy">Architecting Market Intelligence...</h4>
                    <p className="text-sm text-slate-500 mt-1">Analyzing Indian economic indicators & global sentiments.</p>
                  </div>
                </div>
              ) : marketAnalysis ? (
                <div className="space-y-10">
                  {/* Market Overview Hero */}
                  <div className="bg-wealth-navy p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full -mr-32 -mt-32" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-300 border border-white/10">
                          Primary Market Scenario
                        </div>
                        <div className="text-[10px] text-white/40 font-bold">
                          Probability: {marketAnalysis.probability}%
                        </div>
                      </div>
                      <h3 className="text-3xl font-black mb-4 tracking-tight">{marketAnalysis.scenarioName}</h3>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                        {marketAnalysis.marketSentiment.overall}
                      </p>
                    </div>
                  </div>

                  {/* Economic Indicators */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Activity size={16} className="text-emerald-500" />
                      Indian Economic Vitals
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {marketAnalysis.economicIndicators.map((indicator, idx) => (
                        <div key={idx} className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{indicator.indicator}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-black text-wealth-navy">{indicator.currentValue}</span>
                            <div className={`p-1.5 rounded-lg ${
                              indicator.impact === 'Positive' ? 'bg-emerald-50 text-emerald-600' :
                              indicator.impact === 'Negative' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {indicator.trend === 'Rising' ? <TrendingUp size={14} /> : indicator.trend === 'Falling' ? <TrendingDown size={14} /> : <Activity size={14} />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sentiment Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                      <h4 className="text-sm font-bold text-wealth-navy mb-8 flex items-center gap-2">
                        <Landmark size={18} className="text-indigo-500" />
                        Asset Class Sentiments
                      </h4>
                      <div className="space-y-6">
                        {[
                          { name: 'Equity', val: marketAnalysis.marketSentiment.equity, color: 'bg-indigo-500' },
                          { name: 'Debt', val: marketAnalysis.marketSentiment.debt, color: 'bg-emerald-500' },
                          { name: 'Gold', val: marketAnalysis.marketSentiment.gold, color: 'bg-wealth-gold' },
                          { name: 'Real Estate', val: marketAnalysis.marketSentiment.realEstate, color: 'bg-slate-700' }
                        ].map(item => (
                          <div key={item.name} className="flex gap-4">
                            <div className={`w-1 h-12 rounded-full ${item.color} shrink-0`} />
                            <div>
                              <p className="text-xs font-black text-wealth-navy uppercase tracking-widest mb-1">{item.name}</p>
                              <p className="text-xs text-slate-500 leading-relaxed">{item.val}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                      <h4 className="text-sm font-bold text-wealth-navy mb-8 flex items-center gap-2">
                        <LineChart size={18} className="text-wealth-gold" />
                        Sector Specific Outlook
                      </h4>
                      <div className="space-y-4">
                        {marketAnalysis.sectorOutlook.map((sector, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-wealth-gold/30 transition-all">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-black text-wealth-navy uppercase tracking-wider">{sector.sector}</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                sector.rating === 'Overweight' ? 'bg-emerald-100 text-emerald-700' :
                                sector.rating === 'Underweight' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {sector.rating}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed italic">{sector.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden">
                    <Sparkles className="absolute top-4 right-4 text-indigo-200" size={48} />
                    <div className="relative z-10 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-indigo-900">AI Rebalancing Strategic Actions</h4>
                          <p className="text-xs text-indigo-700 font-medium tracking-tight">Derived from current market state & your goals</p>
                        </div>
                        <button 
                          onClick={handleOptimizeWithAI}
                          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2"
                        >
                          <Zap size={14} className="text-wealth-gold fill-wealth-gold" />
                          Optimize Targets with AI
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {marketAnalysis.rebalancingRecommendations.map((rec, idx) => (
                          <div key={idx} className="p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-white flex gap-4">
                            <div className={`p-2 rounded-xl h-fit ${
                              rec.priority === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
                            }`}>
                              {rec.priority === 'High' ? <Zap size={16} /> : <Activity size={16} />}
                            </div>
                            <div>
                              <p className="text-xs font-black text-indigo-900 mb-1">{rec.action}</p>
                              <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">{rec.rationale}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center">
                  <p className="text-slate-400 italic">No market analysis data available. Please refresh.</p>
                  <button 
                    onClick={handleFetchMarketAnalysis}
                    className="mt-4 px-6 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Fetch Analysis
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Target Allocation Customization */}
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <PieChart size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-wealth-navy">Target Allocation</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Define your ideal asset mix for rebalancing.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCustomizing && (
                      <button 
                        onClick={resetToDefault}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider px-3 py-1 hover:bg-white rounded-lg transition-all"
                      >
                        Reset to Default
                      </button>
                    )}
                    <button 
                      onClick={() => setIsCustomizing(!isCustomizing)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        isCustomizing 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {isCustomizing ? 'Save Targets' : 'Customize Targets'}
                    </button>
                  </div>
                </div>

                {isCustomizing && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    {['Equity', 'Debt', 'Gold', 'Cash', 'Alternative', 'Real Estate'].map(cat => (
                      <div key={cat} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{cat}</label>
                        <div className="relative">
                          <input 
                            type="number"
                            value={customTargets[cat] || 0}
                            onChange={(e) => handleTargetChange(cat, e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all pr-8"
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${Math.abs(totalTargetPct - 100) < 0.1 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className={`text-xs font-bold ${Math.abs(totalTargetPct - 100) < 0.1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Total: {totalTargetPct.toFixed(1)}%
                    </span>
                  </div>
                  {Math.abs(totalTargetPct - 100) > 0.1 && (
                    <div className="flex items-center gap-1.5 text-rose-600">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-tight">Allocation must equal 100%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Allocation Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Current Allocation
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(rebalancingData.currentAllocation).map(([cat, pct]) => (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-wealth-navy">{cat}</span>
                          <span className="text-slate-500">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className="h-full" 
                            style={{ backgroundColor: ASSET_COLORS[cat] || '#cbd5e1' }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-wealth-gold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-wealth-gold" />
                    Target Allocation {isCustomizing ? '(Custom)' : `(${portfolio.riskProfile.type})`}
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(rebalancingData.targets).map(([cat, pct]) => (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-wealth-navy">{cat}</span>
                          <span className="text-slate-500">{pct}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            className="h-full opacity-60" 
                            style={{ backgroundColor: ASSET_COLORS[cat] || '#cbd5e1' }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-wealth-gold" />
                  Recommended Rebalancing Actions
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {rebalancingData.actions.map((action, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-wealth-gold/20 transition-all group"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-2xl ${
                          action.type === 'Buy' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {action.type === 'Buy' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-wealth-navy">{action.type} {action.category}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              action.type === 'Buy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {action.type === 'Buy' ? '+' : '-'}{action.percentageChange.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Adjusting to reach target {rebalancingData.targets[action.category]}% allocation.
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-wealth-navy">{formatCurrency(action.amount)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rebalance Amount</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl flex items-start gap-4">
                <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-blue-900">Tax & Exit Load Consideration</p>
                  <p className="text-xs text-blue-700/80 leading-relaxed font-medium">
                    Applying these changes will simulate selling over-allocated assets and buying under-allocated ones. 
                    In a real portfolio, consider Capital Gains Tax (LTCG/STCG) and exit loads on mutual funds before executing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSuccess && (
          <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Review Later
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying || rebalancingData.actions.length === 0 || Math.abs(totalTargetPct - 100) > 0.1}
              className="flex-2 px-8 py-4 bg-wealth-navy text-white font-bold rounded-2xl hover:bg-wealth-navy/90 transition-all shadow-xl shadow-wealth-navy/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isApplying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Optimizing Portfolio...
                </>
              ) : (
                <>
                  <TrendingUp size={20} className="text-wealth-gold" />
                  Apply Rebalancing Actions
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
