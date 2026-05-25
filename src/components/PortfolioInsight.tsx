
import React, { useState, useEffect } from 'react';
import { PortfolioState } from '../types';
import { getPortfolioInsights } from '../services/geminiService';
import { isQuotaExceededError } from '../lib/quotaManager';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  Globe, 
  BarChart2, 
  Zap,
  RefreshCw,
  Newspaper,
  CheckCircle2,
  Info,
  Calculator,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { FinancialPlanCalculator } from './FinancialPlanCalculator';
import MutualFundAnalytics from './MutualFundAnalytics';
import PortfolioPerformance from './PortfolioPerformance';
import ErrorBoundary from './ErrorBoundary';

interface PortfolioInsightProps {
  portfolio: PortfolioState;
}

interface ActionableInsight {
  parameter: string;
  insight: string;
  action: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface AssetAllocationSuggestion {
  category: string;
  current: string;
  suggested: string;
  reason: string;
}

interface NewsUpdate {
  title: string;
  impactOnPortfolio: string;
  actionRequired: string;
}

interface Vulnerability {
  risk: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  remediation: string;
}

interface InsightData {
  marketSummary: string;
  actionableInsights: ActionableInsight[];
  assetAllocationSuggestions: AssetAllocationSuggestion[];
  newsUpdates: NewsUpdate[];
  vulnerabilities: Vulnerability[];
}

const PortfolioInsight: React.FC<PortfolioInsightProps> = ({ portfolio }) => {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setShowApiKeyPrompt(false);
      fetchInsights();
    }
  };

  const fetchInsights = async () => {
    if (portfolio.investments.length === 0) {
      setError("Please add some investments to your vault first to generate strategic intelligence.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPortfolioInsights(portfolio);
      if (data) {
        setInsights(data);
      } else {
        setError("AI Strategist is temporarily occupied with a market spike. Please reconnect in a few minutes.");
      }
    } catch (err: any) {
      const errorMessage = typeof err === 'string' ? err : err?.message || "";
      if (isQuotaExceededError(err)) {
        setShowApiKeyPrompt(true);
        setError("Intelligence limit reached. Provide your own API key for dedicated strategic computing power.");
      } else if (errorMessage.includes("503") || errorMessage.includes("demand") || errorMessage.includes("UNAVAILABLE")) {
        setError("The AI model is experiencing high demand due to market volatility. Re-attempting connection is recommended in 2-3 minutes.");
      } else {
        setError("The intelligence feed was interrupted by a network fluctuation. Please try again.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [portfolio.selectedMemberId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-wealth-gold/20 border-t-wealth-gold rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="text-wealth-gold animate-pulse" size={24} />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-wealth-navy tracking-tight">Synthesizing Strategic Intelligence</h3>
          <p className="text-sm text-slate-500 font-medium mt-2">Evaluating global macros, sector fundamentals, and risk vectors...</p>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="premium-card p-16 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-100">
          <AlertCircle size={40} />
        </div>
        <h3 className="text-2xl font-bold text-wealth-navy tracking-tight">Intelligence Feed Interrupted</h3>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">{error || "We couldn't generate insights right now."}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={fetchInsights}
            className="premium-button-primary flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Reconnect Intelligence
          </button>
          {showApiKeyPrompt && (
            <button 
              onClick={handleOpenSelectKey}
              className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2"
            >
              Select API Key
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-fade-in">
      {/* API Key Prompt Banner */}
      <AnimatePresence>
        {showApiKeyPrompt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-900">API Quota Exceeded</h3>
                  <p className="text-sm text-rose-600 font-medium">
                    The shared API key has reached its limit. Select your own paid API key to continue.
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenSelectKey}
                className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2"
              >
                Select API Key
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-wealth-navy rounded-2xl text-wealth-gold shadow-xl">
            <Sparkles size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-wealth-navy tracking-tight">Executive Strategy Report</h2>
              <div className="px-3 py-1 bg-wealth-gold/10 text-wealth-gold rounded-full text-[10px] font-bold uppercase tracking-widest border border-wealth-gold/20">
                {portfolio.riskProfile.type} Risk Profile
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">AI-driven alpha generation and structural optimization.</p>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {/* Strategic Intelligence Section */}
        <div className="space-y-10">
          {/* Market Summary Header */}
          <div className="wealth-gradient rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-wealth-navy/20">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Globe size={240} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-wealth-gold/20 p-2.5 rounded-xl border border-wealth-gold/30">
                  <Sparkles className="text-wealth-gold" size={24} />
                </div>
                <span className="text-wealth-gold text-[11px] font-bold uppercase tracking-[0.3em]">Global Macro Context</span>
              </div>
              <div className="text-3xl md:text-4xl font-bold tracking-tight max-w-4xl leading-tight">
                <ReactMarkdown>{insights.marketSummary}</ReactMarkdown>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
                  <BarChart2 size={14} className="text-blue-400" />
                  Technical Alpha
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
                  <Zap size={14} className="text-amber-400" />
                  Fundamental Resilience
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/10">
                  <Globe size={14} className="text-indigo-400" />
                  Global Diversification
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Actionable Insights Section */}
            <div className="lg:col-span-2 space-y-12">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-wealth-navy tracking-tight flex items-center gap-3">
                    <Zap size={24} className="text-wealth-gold" />
                    Strategic Directives
                  </h3>
                  <button 
                    onClick={fetchInsights}
                    className="p-2.5 text-slate-400 hover:text-wealth-emerald hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {insights.actionableInsights?.map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="premium-card p-8 group hover:border-wealth-gold/30"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                          {item.parameter}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 ${
                          item.impact === 'High' ? 'bg-rose-50 text-rose-600' : 
                          item.impact === 'Medium' ? 'bg-amber-50 text-amber-600' : 
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            item.impact === 'High' ? 'bg-rose-500' : 
                            item.impact === 'Medium' ? 'bg-amber-500' : 
                            'bg-emerald-500'
                          }`} />
                          {item.impact} Impact
                        </div>
                      </div>
                      <div className="text-xl font-bold text-wealth-navy mb-4 leading-snug">
                        <ReactMarkdown>{item.insight}</ReactMarkdown>
                      </div>
                      <div className="bg-wealth-paper border border-slate-100 rounded-2xl p-6 flex items-start gap-4 group-hover:bg-wealth-paper/50 transition-colors">
                        <div className="p-2 bg-wealth-emerald text-white rounded-lg shadow-lg shadow-wealth-emerald/20">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recommended Execution</p>
                          <div className="text-base text-wealth-navy font-bold">
                            <ReactMarkdown>{item.action}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Vulnerability Assessment Section */}
              {insights.vulnerabilities && insights.vulnerabilities.length > 0 && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-wealth-navy tracking-tight flex items-center gap-3">
                    <ShieldCheck size={24} className="text-rose-500" />
                    Vulnerability Assessment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.vulnerabilities.map((v, idx) => (
                      <div key={idx} className="premium-card p-8 border-t-4 border-t-rose-500 bg-rose-50/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-lg font-bold text-wealth-navy">
                            <ReactMarkdown>{v.risk}</ReactMarkdown>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                            v.severity === 'High' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {v.severity}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mb-6 leading-relaxed">
                          <ReactMarkdown>{v.description}</ReactMarkdown>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-rose-100">
                          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Remediation Strategy</p>
                          <div className="text-sm text-wealth-navy font-bold">
                            <ReactMarkdown>{v.remediation}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* News Updates Section */}
              <div className="space-y-6 pt-6">
                <h3 className="text-2xl font-bold text-wealth-navy tracking-tight flex items-center gap-3">
                  <Newspaper size={24} className="text-wealth-gold" />
                  Market Intelligence
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {insights.newsUpdates?.map((news, idx) => (
                    <div key={idx} className="premium-card p-8 hover:bg-slate-50/50 transition-colors">
                      <div className="text-lg font-bold text-wealth-navy mb-4">
                        <ReactMarkdown>{news.title}</ReactMarkdown>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio Exposure</p>
                          <div className="text-sm text-slate-600 leading-relaxed">
                            <ReactMarkdown>{news.impactOnPortfolio}</ReactMarkdown>
                          </div>
                        </div>
                        <div className="space-y-2 border-l border-slate-100 pl-8">
                          <p className="text-[10px] font-bold text-wealth-emerald uppercase tracking-widest">Strategic Response</p>
                          <div className="text-sm text-wealth-navy font-bold leading-relaxed">
                            <ReactMarkdown>{news.actionRequired}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Asset Allocation Sidebar */}
            <div className="space-y-8">
              <div className="premium-card p-8 sticky top-24">
                <h3 className="text-xl font-bold text-wealth-navy mb-8 flex items-center gap-3">
                  <PieChart size={22} className="text-wealth-gold" />
                  Allocation Alpha
                </h3>

                <div className="space-y-8">
                  {insights.assetAllocationSuggestions?.map((suggestion, idx) => (
                    <div key={idx} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-wealth-navy">{suggestion.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current: {suggestion.current}</span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-wealth-emerald bg-wealth-emerald/10 px-2 py-0.5 rounded-full border border-wealth-emerald/20">
                            <ArrowUpRight size={12} />
                            {suggestion.suggested}
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-slate-300 transition-all duration-1000" 
                          style={{ width: suggestion.current.includes('%') ? suggestion.current : `${suggestion.current}%` }} 
                        />
                        <div 
                          className="h-full bg-wealth-emerald transition-all duration-1000" 
                          style={{ 
                            width: `calc(${suggestion.suggested.includes('%') ? suggestion.suggested : `${suggestion.suggested}%`} - ${suggestion.current.includes('%') ? suggestion.current : `${suggestion.current}%`})` 
                          }} 
                        />
                      </div>
                      
                      <div className="flex items-start gap-3 bg-wealth-paper p-4 rounded-2xl border border-slate-100">
                        <Info size={16} className="text-wealth-gold shrink-0 mt-0.5" />
                        <div className="text-[11px] text-slate-500 leading-relaxed font-medium italic">
                          <ReactMarkdown>{suggestion.reason}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 p-8 bg-wealth-navy rounded-[2rem] text-white text-center shadow-2xl shadow-wealth-navy/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-wealth-gold/10 rounded-full blur-2xl -mr-12 -mt-12" />
                  <p className="text-[10px] font-bold text-wealth-gold uppercase tracking-[0.2em] mb-2">Portfolio Stance</p>
                  <p className="text-xl font-bold mb-6">Strategic Rebalancing</p>
                  <button 
                    onClick={() => (window as any).openRebalancingModal?.()}
                    className="w-full py-3 bg-wealth-gold text-white rounded-xl text-sm font-bold hover:bg-wealth-gold/90 transition-all shadow-lg shadow-wealth-gold/20"
                  >
                    Execute Rebalancing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integrated MF Alpha & Performance Sections */}
        <div className="space-y-20 pt-10 border-t border-slate-100">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm">
                <PieChart size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-wealth-navy tracking-tight">Mutual Fund Alpha Analytics</h3>
                <p className="text-sm text-slate-500 font-medium">Deep-dive into risk-adjusted returns and fund quality scores.</p>
              </div>
            </div>
            <div className="premium-card overflow-hidden">
              <MutualFundAnalytics portfolio={portfolio} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-wealth-navy tracking-tight">Portfolio Performance Audit</h3>
                <p className="text-sm text-slate-500 font-medium">Holistic performance benchmarking and attribution analysis.</p>
              </div>
            </div>
            <div className="premium-card overflow-hidden">
              <ErrorBoundary>
                <PortfolioPerformance portfolio={portfolio} />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioInsight;
