
import React, { useState, useMemo, useEffect } from 'react';
import { Investment, PortfolioState, InvestmentAnalysis } from '../types';
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, 
  Info, Sparkles, RefreshCw, BarChart3, Shield, 
  Globe, IndianRupee, Search, Filter, ChevronDown, 
  ChevronUp, ArrowUpRight, ArrowDownRight, Target,
  Play, Loader2, ExternalLink, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatLakhs } from '../utils/finance';
import { useFirebase } from '../contexts/FirebaseContext';
import { generateInvestmentAnalysis } from '../services/analysisService';
import { isQuotaExceededError } from '../lib/quotaManager';
import { updatePortfolioPrices } from '../services/livePriceService';
import { toast } from 'sonner';

interface InvestmentPerformanceProps {
  portfolio: PortfolioState;
}

const InvestmentPerformance: React.FC<InvestmentPerformanceProps> = ({ portfolio }) => {
  const { updateInvestment } = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Green' | 'Yellow' | 'Red'>('All');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

  const investments = portfolio.investments;

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setShowApiKeyPrompt(false);
      toast.success("API Key selected. Retrying analysis...");
    } else {
      toast.error("API Key selection is not available in this environment.");
    }
  };

  const categorizedInvestments = useMemo(() => {
    return investments.map(inv => {
      const analysis = inv.analysis;
      let status: 'Green' | 'Yellow' | 'Red' = 'Yellow'; // Default

      if (analysis?.status) {
        status = analysis.status;
      } else if (inv.return1Y !== undefined) {
        // Simple heuristic if no deep analysis exists
        if (inv.return1Y > 15) status = 'Green';
        else if (inv.return1Y < 5) status = 'Red';
      }

      return { ...inv, calculatedStatus: status };
    });
  }, [investments]);

  const filteredInvestments = categorizedInvestments.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || inv.calculatedStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => {
    const green = categorizedInvestments.filter(i => i.calculatedStatus === 'Green').length;
    const yellow = categorizedInvestments.filter(i => i.calculatedStatus === 'Yellow').length;
    const red = categorizedInvestments.filter(i => i.calculatedStatus === 'Red').length;
    return { green, yellow, red, total: categorizedInvestments.length };
  }, [categorizedInvestments]);

  const handleDeepAnalysis = async (inv: Investment) => {
    setAnalyzingId(inv.id);
    try {
      const analysisData = await generateInvestmentAnalysis(inv);
      
      await updateInvestment({
        ...inv,
        analysis: analysisData
      });
      
      if (!isBulkAnalyzing) {
        toast.success(`Analysis completed for ${inv.name}`);
      }
    } catch (error) {
      console.error("Deep analysis failed:", error);
      if (isQuotaExceededError(error)) {
        setShowApiKeyPrompt(true);
        toast.error("API Quota Exceeded. Please select your own API key to continue.", {
          duration: 10000,
          action: {
            label: "Select Key",
            onClick: handleOpenSelectKey
          }
        });
      } else if (!isBulkAnalyzing) {
        toast.error(`Failed to analyze ${inv.name}`);
      }
    } finally {
      if (!isBulkAnalyzing) {
        setAnalyzingId(null);
      }
    }
  };

  const handleAnalyzeAll = async () => {
    const pending = investments.filter(inv => !inv.analysis || !inv.analysis.rollingAlpha3Y);
    if (pending.length === 0) {
      toast.info("All investments already have deep analysis.");
      return;
    }

    setIsBulkAnalyzing(true);
    setBulkProgress({ current: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      const inv = pending[i];
      setAnalyzingId(inv.id);
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
      await handleDeepAnalysis(inv);
      // Small delay to avoid aggressive rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsBulkAnalyzing(false);
    setAnalyzingId(null);
    toast.success("Bulk analysis completed successfully!");
  };

  const handleRefreshReturns = async () => {
    setIsRefreshing(true);
    try {
      const updated = await updatePortfolioPrices(investments);
      for (const inv of updated) {
        const original = investments.find(i => i.id === inv.id);
        if (original && (original.price !== inv.price || original.return1Y !== inv.return1Y)) {
          await updateInvestment(inv);
        }
      }
      toast.success("Returns and prices refreshed successfully!");
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Failed to refresh market data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
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
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-rose-900">API Quota Exceeded</h3>
                  <p className="text-sm text-rose-600 font-medium">
                    The shared API key has reached its limit. Select your own paid API key to continue with deep analysis.
                  </p>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-rose-500 underline hover:text-rose-700 mt-1 inline-block"
                  >
                    Learn about Gemini API billing
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowApiKeyPrompt(false)}
                  className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleOpenSelectKey}
                  className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2"
                >
                  <Shield size={18} />
                  Select API Key
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="text-emerald-500" size={20} />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full">Healthy</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.green}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Green Assets</p>
        </div>
        <div className="premium-card p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full">Watchlist</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.yellow}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Yellow Assets</p>
        </div>
        <div className="premium-card p-6 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="text-rose-500" size={20} />
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full">Critical</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.red}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Red Assets</p>
        </div>
        <div className="premium-card p-6 bg-wealth-navy text-white">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="text-wealth-gold" size={20} />
            <span className="text-[10px] font-black text-wealth-gold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded-full">AI Insights</span>
          </div>
          <p className="text-sm font-medium text-slate-300">
            {stats.red > 0 ? `Action required on ${stats.red} underperforming assets.` : "Portfolio is showing strong strategic alignment."}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by asset name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {(['All', 'Green', 'Yellow', 'Red'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                  filterStatus === status
                    ? 'bg-wealth-navy text-white border-wealth-navy shadow-md'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-wealth-navy'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleRefreshReturns}
            disabled={isRefreshing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Returns'}
          </button>
          <button
            onClick={handleAnalyzeAll}
            disabled={isBulkAnalyzing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-wealth-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-wealth-navy/20 disabled:opacity-50"
          >
            {isBulkAnalyzing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} className="fill-current" />
            )}
            {isBulkAnalyzing ? `Analyzing (${bulkProgress.current}/${bulkProgress.total})` : 'Analyze All Assets'}
          </button>
        </div>
      </div>

      {/* Performance Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[25%]">Asset & Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[18%]">Rolling Returns (3Y/5Y)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[18%]">Rolling Alpha (3Y/5Y)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[12%]">Risk Level</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[15%]">Capture Ratio (U/D)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[12%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="text-slate-300" size={32} />
                      <p className="text-slate-500 font-medium">No investments found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredInvestments.every(inv => !inv.analysis) ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                      <Sparkles className="text-wealth-gold" size={32} />
                      <h4 className="text-lg font-bold text-wealth-navy">Deep Analysis Required</h4>
                      <p className="text-sm text-slate-500">
                        Rolling returns, risk metrics, and capture ratios are generated using AI research. 
                        Click "Analyze All Assets" above to populate these parameters.
                      </p>
                      <button 
                        onClick={handleAnalyzeAll}
                        className="mt-2 px-6 py-2 bg-wealth-navy text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                      >
                        Analyze All Now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredInvestments.map((inv) => {
                const analysis = inv.analysis;
                const status = inv.calculatedStatus;
                const isAnalyzing = analyzingId === inv.id;

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-12 rounded-full ${
                          status === 'Green' ? 'bg-emerald-500' : 
                          status === 'Yellow' ? 'bg-amber-500' : 
                          'bg-rose-500'
                        }`} />
                        <div>
                          <p className="text-serif text-base font-medium text-slate-900">{inv.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{inv.subCategory}</span>
                            {analysis?.lastGenerated && (
                              <span className={`text-[8px] font-bold italic inline-flex items-center gap-1 ${
                                inv.lastUpdated && new Date(inv.lastUpdated).getTime() > new Date(analysis.lastGenerated).getTime() + 1000
                                  ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse font-extrabold'
                                  : 'text-slate-300'
                              }`}>
                                {inv.lastUpdated && new Date(inv.lastUpdated).getTime() > new Date(analysis.lastGenerated).getTime() + 1000
                                  ? 'Outdated (Refresh Needed)'
                                  : `Analyzed ${new Date(analysis.lastGenerated).toLocaleDateString()}`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">3Y Rolling</p>
                            <div className="flex flex-col">
                              <p className={`text-xs font-black ${analysis?.rollingReturn3Y !== undefined && analysis.indexRollingReturn3Y !== undefined && analysis.rollingReturn3Y > analysis.indexRollingReturn3Y ? 'text-emerald-600' : 'text-slate-600'}`}>
                                {analysis?.rollingReturn3Y !== undefined ? `${analysis.rollingReturn3Y}%` : (inv.return3Y !== undefined ? `${inv.return3Y}%` : 'N/A')}
                              </p>
                              {analysis?.indexRollingReturn3Y !== undefined && (
                                <p className="text-[9px] text-slate-400 font-medium">Idx: {analysis.indexRollingReturn3Y}%</p>
                              )}
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">5Y Rolling</p>
                            <div className="flex flex-col">
                              <p className={`text-xs font-black ${analysis?.rollingReturn5Y !== undefined && analysis.indexRollingReturn5Y !== undefined && analysis.rollingReturn5Y > analysis.indexRollingReturn5Y ? 'text-emerald-600' : 'text-slate-600'}`}>
                                {analysis?.rollingReturn5Y !== undefined ? `${analysis.rollingReturn5Y}%` : (inv.return5Y !== undefined ? `${inv.return5Y}%` : 'N/A')}
                              </p>
                              {analysis?.indexRollingReturn5Y !== undefined && (
                                <p className="text-[9px] text-slate-400 font-medium">Idx: {analysis.indexRollingReturn5Y}%</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {analysis?.indexComparison && (
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1">vs {analysis.indexComparison[0]?.indexName}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">3Y Alpha</p>
                            {(() => {
                              const alpha = analysis?.rollingAlpha3Y !== undefined ? analysis.rollingAlpha3Y : 
                                (analysis?.rollingReturn3Y !== undefined && analysis?.indexRollingReturn3Y !== undefined ? 
                                  parseFloat((analysis.rollingReturn3Y - analysis.indexRollingReturn3Y).toFixed(2)) : undefined);
                              return (
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${alpha !== undefined && alpha > 0 ? 'bg-emerald-50 text-emerald-600' : alpha !== undefined && alpha < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                  {alpha !== undefined && alpha > 0 && <ArrowUpRight size={10} />}
                                  {alpha !== undefined && alpha < 0 && <ArrowDownRight size={10} />}
                                  <span className="text-xs font-black">
                                    {alpha !== undefined ? `${alpha > 0 ? '+' : ''}${alpha}%` : 'N/A'}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mb-0.5">5Y Alpha</p>
                            {(() => {
                              const alpha = analysis?.rollingAlpha5Y !== undefined ? analysis.rollingAlpha5Y : 
                                (analysis?.rollingReturn5Y !== undefined && analysis?.indexRollingReturn5Y !== undefined ? 
                                  parseFloat((analysis.rollingReturn5Y - analysis.indexRollingReturn5Y).toFixed(2)) : undefined);
                              return (
                                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${alpha !== undefined && alpha > 0 ? 'bg-emerald-50 text-emerald-600' : alpha !== undefined && alpha < 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                  {alpha !== undefined && alpha > 0 && <ArrowUpRight size={10} />}
                                  {alpha !== undefined && alpha < 0 && <ArrowDownRight size={10} />}
                                  <span className="text-xs font-black">
                                    {alpha !== undefined ? `${alpha > 0 ? '+' : ''}${alpha}%` : 'N/A'}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          analysis?.riskLevel3Y === 'Low' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          analysis?.riskLevel3Y === 'Moderate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          analysis?.riskLevel3Y === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {analysis?.riskLevel3Y || 'N/A'}
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1">3Y Risk Level</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-600" title="Upside Capture">{analysis?.upsideCaptureRatio !== undefined ? analysis.upsideCaptureRatio : '-'}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-xs font-black text-rose-600" title="Downside Capture">{analysis?.downsideCaptureRatio !== undefined ? analysis.downsideCaptureRatio : '-'}</span>
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Capture Ratios</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDeepAnalysis(inv)}
                          disabled={analyzingId !== null}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                            analyzingId === inv.id 
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                              : analyzingId !== null
                                ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                : 'bg-white text-wealth-navy border-slate-200 hover:bg-wealth-navy hover:text-white hover:border-wealth-navy'
                          }`}
                          title="Refresh Deep Analysis"
                        >
                          {analyzingId === inv.id ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Sparkles size={14} className="text-wealth-gold" />
                          )}
                          {analyzingId === inv.id ? '...' : 'Analyze'}
                        </button>
                        <button
                          onClick={() => setSelectedInvestment(inv)}
                          className="p-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                          title="View Full Details"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Outlook Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="premium-card p-8 bg-emerald-50/30 border-emerald-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <IndianRupee size={20} />
            </div>
            <h3 className="font-bold text-wealth-navy">India Market Outlook</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {filteredInvestments.find(i => i.analysis?.marketOutlookIndia)?.analysis?.marketOutlookIndia || 
            "The Indian market remains resilient with strong domestic inflows. Focus on manufacturing, banking, and infrastructure sectors as structural growth drivers. Valuation remains fair to slightly premium."}
          </p>
        </div>
        <div className="premium-card p-8 bg-blue-50/30 border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Globe size={20} />
            </div>
            <h3 className="font-bold text-wealth-navy">Global Market Outlook</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {filteredInvestments.find(i => i.analysis?.marketOutlookGlobal)?.analysis?.marketOutlookGlobal || 
            "Global markets are navigating interest rate pivots and geopolitical shifts. US Tech remains a dominant force, while emerging markets offer diversification opportunities. Monitor inflation data closely."}
          </p>
        </div>
      </div>

      {/* Analysis Details Drawer (Conditional) */}
      <AnimatePresence>
        {analyzingId && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-50 bg-wealth-navy text-white p-6 rounded-3xl shadow-2xl border border-white/10 max-w-md w-full"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl">
                <RefreshCw size={24} className="animate-spin text-wealth-gold" />
              </div>
              <div>
                <h4 className="font-bold text-lg">AI Deep Analysis in Progress</h4>
                <p className="text-xs text-slate-400">Researching rolling returns, risk metrics, and market outlook for your asset...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Investment Details Modal */}
      <AnimatePresence>
        {selectedInvestment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedInvestment.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">
                        {selectedInvestment.category}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">•</span>
                      <span className="text-slate-500 text-xs font-medium">{selectedInvestment.subCategory}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInvestment(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {selectedInvestment.analysis ? (
                  <div className="space-y-8">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">3Y Rolling Return</p>
                        <p className="text-lg font-black text-slate-900">{selectedInvestment.analysis.rollingReturn3Y}%</p>
                        <p className="text-[10px] text-slate-500 mt-1">vs {selectedInvestment.analysis.indexRollingReturn3Y}% Index</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">3Y Rolling Alpha</p>
                        <p className={`text-lg font-black ${selectedInvestment.analysis.rollingAlpha3Y > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {selectedInvestment.analysis.rollingAlpha3Y > 0 ? '+' : ''}{selectedInvestment.analysis.rollingAlpha3Y}%
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Excess Return</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Risk Level</p>
                        <div className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 ${
                          selectedInvestment.analysis.riskLevel3Y === 'Low' ? 'bg-emerald-100 text-emerald-700' :
                          selectedInvestment.analysis.riskLevel3Y === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {selectedInvestment.analysis.riskLevel3Y}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Capture Ratio</p>
                        <p className="text-lg font-black text-slate-900">
                          <span className="text-emerald-600">{selectedInvestment.analysis.upsideCaptureRatio}</span>
                          <span className="text-slate-300 mx-1">/</span>
                          <span className="text-rose-600">{selectedInvestment.analysis.downsideCaptureRatio}</span>
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">Upside / Downside</p>
                      </div>
                    </div>

                    {/* Detailed Report */}
                    <div className="prose prose-slate max-w-none">
                      <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                        <Info size={18} className="text-indigo-600" />
                        Deep Analysis Report
                      </h3>
                      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {selectedInvestment.analysis.details}
                      </div>
                    </div>

                    {/* Fund Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Shield size={16} className="text-indigo-600" />
                          Fund House & Manager
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pedigree</p>
                            <p className="text-sm text-slate-700">{selectedInvestment.analysis.fundHousePedigree}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manager Profile</p>
                            <p className="text-sm text-slate-700">{selectedInvestment.analysis.fundManagerProfile}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Target size={16} className="text-indigo-600" />
                          Market Outlook
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">India View</p>
                            <p className="text-sm text-slate-700">{selectedInvestment.analysis.marketOutlookIndia}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global View</p>
                            <p className="text-sm text-slate-700">{selectedInvestment.analysis.marketOutlookGlobal}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <Sparkles size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Deep Analysis Yet</h3>
                    <p className="text-slate-500 max-w-md mb-8">
                      Run a deep analysis to get rolling returns, alpha, risk metrics, and a comprehensive market outlook for this investment.
                    </p>
                    <button
                      onClick={() => {
                        handleDeepAnalysis(selectedInvestment);
                        setSelectedInvestment(null);
                      }}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      <Sparkles size={18} />
                      Start Analysis
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setSelectedInvestment(null)}
                  className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestmentPerformance;
