import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, TrendingUp, TrendingDown, Target, Shield, AlertTriangle, Loader2, ArrowUpRight, BarChart3, Activity, Edit2, Calendar, RefreshCw, IndianRupee, Globe, Landmark, BarChart2, Download } from 'lucide-react';
import { Investment, InvestmentAnalysis } from '../types';
import { generateInvestmentAnalysis } from '../services/analysisService';
import { generateInvestmentAnalysisPDF } from '../services/pdfService';
import { isQuotaExceededError, setBypassNextCooldown, getCooldownTimeLeft } from '../lib/quotaManager';
import ReactMarkdown from 'react-markdown';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
  onUpdateAnalysis: (investmentId: string, analysis: InvestmentAnalysis) => void;
  onEdit?: (investment: Investment) => void;
}

const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, investment, onUpdateAnalysis, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

  const isPMS = investment ? (investment.category === 'PMS' || investment.name.toLowerCase().includes('pms')) : false;
  const verifiedSources = isPMS 
    ? 'APMI / PMS Bazaar / Fund House' 
    : 'AMFI / Value Research / Morningstar / Fund House';

  const handleOpenSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setShowApiKeyPrompt(false);
      handleGenerateAnalysis();
    }
  };

  useEffect(() => {
    if (isOpen && investment) {
      if (investment.analysis) {
        setAnalysis(investment.analysis);
      } else {
        handleGenerateAnalysis();
      }
    }
  }, [isOpen, investment]);

  const handleGenerateAnalysis = async (force = false) => {
    if (!investment) return;
    if (force) {
      setBypassNextCooldown();
    }
    setLoading(true);
    try {
      const result = await generateInvestmentAnalysis(investment);
      setAnalysis(result);
      onUpdateAnalysis(investment.id, result);
    } catch (error) {
      console.error("Failed to generate analysis:", error);
      if (isQuotaExceededError(error)) {
        setShowApiKeyPrompt(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!analysis || !investment) return;
    try {
      const doc = generateInvestmentAnalysisPDF(investment, analysis);
      const safeName = investment.name.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`AI_Analysis_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (!isOpen || !investment) return null;

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Buy': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Hold': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Exit': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const currencySymbol = investment.currency === 'USD' || analysis?.currency === 'USD' ? '$' : '₹';
  const currencyCode = investment.currency === 'USD' || analysis?.currency === 'USD' ? 'USD' : 'INR';
  const locale = investment.currency === 'USD' || analysis?.currency === 'USD' ? 'en-US' : 'en-IN';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: currencyCode, 
      maximumFractionDigits: 0 
    }).format(val);

  const isCooldown = analysis?.summary?.includes('cooldown');
  const isStale = !!(
    investment && 
    investment.analysis && 
    investment.analysis.lastGenerated && 
    investment.lastUpdated && 
    new Date(investment.lastUpdated).getTime() > new Date(investment.analysis.lastGenerated).getTime() + 1000
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">AI Investment Analysis</h2>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="text-sm text-slate-500">{investment.name} • {investment.category}</span>
                  {analysis?.analysisDataDate && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Calendar size={10} />
                      As of: {analysis.analysisDataDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* API Key Prompt Banner */}
            <AnimatePresence>
              {showApiKeyPrompt && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-rose-900">API Quota Exceeded</h3>
                        <p className="text-[10px] text-rose-600 font-medium">
                          Shared key limit reached. Select your own key to continue.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleOpenSelectKey}
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2"
                    >
                      Select API Key
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 size={48} className="text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Analyzing market data & fundamentals...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-8">
                {/* Stale Warning Banner */}
                {isStale && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100/80 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-900">Investment Data Modified</h4>
                        <p className="text-[11px] text-amber-700 font-medium leading-relaxed mt-0.5">
                          Since this AI report was last processed, the mutual fund details (e.g. current value, quantity, or returns) have been modified. This report is out of date.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleGenerateAnalysis(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 hover:scale-102 active:scale-98 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-amber-600/10 shrink-0 uppercase tracking-wider select-none whitespace-nowrap"
                    >
                      Refresh AI Report
                    </button>
                  </motion.div>
                )}

                {/* Recommendation Card */}
                <div className={`p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center gap-6 ${getRecommendationColor(analysis.recommendation)}`}>
                  <div className="text-center md:text-left flex-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Recommendation</span>
                    <h3 className="text-4xl font-black">{analysis.recommendation}</h3>
                    <div className="mt-2 text-sm font-medium opacity-80">
                      <ReactMarkdown>{analysis.summary}</ReactMarkdown>
                    </div>
                    {isCooldown && (
                      <button 
                        onClick={() => handleGenerateAnalysis(true)}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto md:mx-0"
                      >
                        <RefreshCw size={14} />
                        Force Retry Now
                      </button>
                    )}
                  </div>
                  
                  <div className="flex gap-4">
                    {analysis.exitLevel && (
                      <div className="bg-white/50 px-4 py-3 rounded-xl border border-current/10 text-center min-w-[100px]">
                        <p className="text-[10px] font-bold uppercase opacity-60">Exit Level</p>
                        <p className="text-lg font-black">{formatCurrency(analysis.exitLevel)}</p>
                      </div>
                    )}
                    {(analysis.fundamentalScore || analysis.technicalScore) && (
                      <div className="bg-white/50 px-4 py-3 rounded-xl border border-current/10 text-center min-w-[100px]">
                        <p className="text-[10px] font-bold uppercase opacity-60">AI Score</p>
                        <p className="text-lg font-black">
                          {Math.round(((analysis.fundamentalScore || 0) + (analysis.technicalScore || 0)) / (analysis.fundamentalScore && analysis.technicalScore ? 2 : 1))}/100
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.fundamentalScore !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-3 text-slate-600">
                        <BarChart3 size={18} />
                        <span className="text-sm font-bold">Fundamental Strength</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${analysis.fundamentalScore}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500 font-medium">{analysis.fundamentalScore}/100 based on financials & growth</p>
                    </div>
                  )}
                  {analysis.technicalScore !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-3 text-slate-600">
                        <Activity size={18} />
                        <span className="text-sm font-bold">Technical Momentum</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${analysis.technicalScore}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500 font-medium">{analysis.technicalScore}/100 based on price action & volume</p>
                    </div>
                  )}
                  {analysis.riskRatio && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <Shield size={18} />
                        <span className="text-sm font-bold">Risk Metrics</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{analysis.riskRatio}</p>
                    </div>
                  )}
                  {analysis.returnRatio && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <TrendingUp size={18} />
                        <span className="text-sm font-bold">Return Ratios</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{analysis.returnRatio}</p>
                    </div>
                  )}
                  {analysis.rollingReturn3Y !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <Activity size={18} />
                        <span className="text-sm font-bold">3Y Rolling Return</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-lg font-bold text-slate-900">{analysis.rollingReturn3Y}%</p>
                        {analysis.indexRollingReturn3Y !== undefined && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">vs {analysis.indexRollingReturn3Y}% Index</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(() => {
                    const alpha = analysis?.rollingAlpha3Y !== undefined ? analysis.rollingAlpha3Y : 
                      (analysis?.rollingReturn3Y !== undefined && analysis?.indexRollingReturn3Y !== undefined ? 
                        parseFloat((analysis.rollingReturn3Y - analysis.indexRollingReturn3Y).toFixed(2)) : undefined);
                    if (alpha === undefined) return null;
                    return (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-1 text-slate-600">
                          <TrendingUp size={18} />
                          <span className="text-sm font-bold">3Y Alpha</span>
                        </div>
                        <p className={`text-lg font-bold ${alpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {alpha > 0 ? '+' : ''}{alpha}%
                        </p>
                      </div>
                    );
                  })()}
                  {analysis.rollingReturn5Y !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <Activity size={18} />
                        <span className="text-sm font-bold">5Y Rolling Return</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-lg font-bold text-slate-900">{analysis.rollingReturn5Y}%</p>
                        {analysis.indexRollingReturn5Y !== undefined && (
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">vs {analysis.indexRollingReturn5Y}% Index</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(() => {
                    const alpha = analysis?.rollingAlpha5Y !== undefined ? analysis.rollingAlpha5Y : 
                      (analysis?.rollingReturn5Y !== undefined && analysis?.indexRollingReturn5Y !== undefined ? 
                        parseFloat((analysis.rollingReturn5Y - analysis.indexRollingReturn5Y).toFixed(2)) : undefined);
                    if (alpha === undefined) return null;
                    return (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-1 text-slate-600">
                          <TrendingUp size={18} />
                          <span className="text-sm font-bold">5Y Alpha</span>
                        </div>
                        <p className={`text-lg font-bold ${alpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {alpha > 0 ? '+' : ''}{alpha}%
                        </p>
                      </div>
                    );
                  })()}
                  {analysis.riskLevel3Y && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <Shield size={18} />
                        <span className="text-sm font-bold">3Y Risk Level</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        analysis.riskLevel3Y === 'Low' ? 'text-emerald-600' :
                        analysis.riskLevel3Y === 'Moderate' ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>{analysis.riskLevel3Y}</p>
                    </div>
                  )}
                  {analysis.turnoverRatio !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <RefreshCw size={18} />
                        <span className="text-sm font-bold">Turnover Ratio</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{analysis.turnoverRatio}%</p>
                    </div>
                  )}
                  {analysis.upsideCaptureRatio !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <ArrowUpRight size={18} />
                        <span className="text-sm font-bold">Upside Capture</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">{analysis.upsideCaptureRatio}%</p>
                    </div>
                  )}
                  {analysis.downsideCaptureRatio !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <TrendingDown size={18} />
                        <span className="text-sm font-bold">Downside Capture</span>
                      </div>
                      <p className="text-lg font-bold text-rose-600">{analysis.downsideCaptureRatio}%</p>
                    </div>
                  )}
                  {analysis.aum !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <Landmark size={18} />
                        <span className="text-sm font-bold">AUM</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(analysis.aum)} Cr</p>
                    </div>
                  )}
                  {analysis.portfolioTurnoverRatio !== undefined && (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 mb-1 text-slate-600">
                        <RefreshCw size={18} />
                        <span className="text-sm font-bold">Portfolio Turnover</span>
                      </div>
                      <p className="text-lg font-bold text-slate-900">{analysis.portfolioTurnoverRatio}%</p>
                    </div>
                  )}
                </div>

                {/* Point to Point Returns Section */}
                {analysis.pointToPointReturns && analysis.pointToPointReturns.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp size={20} className="text-indigo-600" />
                      Point to Point Returns vs Index
                    </h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/50 border-b border-slate-200">
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Period</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Fund Return</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Index Return</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Alpha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysis.pointToPointReturns.map((ret, idx) => {
                            const alpha = ret.fundReturn - ret.indexReturn;
                            return (
                              <tr key={idx} className="hover:bg-white transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">{ret.period}</td>
                                <td className="px-4 py-3 font-bold text-slate-900 text-right">{ret.fundReturn.toFixed(2)}%</td>
                                <td className="px-4 py-3 font-bold text-slate-600 text-right">{ret.indexReturn.toFixed(2)}%</td>
                                <td className={`px-4 py-3 font-black text-right ${alpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {alpha >= 0 ? '+' : ''}{alpha.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Rolling Returns Section */}
                {analysis.rollingReturns && analysis.rollingReturns.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <RefreshCw size={20} className="text-indigo-600" />
                      Rolling Returns vs Index
                    </h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/50 border-b border-slate-200">
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Period</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Fund Rolling Return</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Index Rolling Return</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Rolling Alpha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysis.rollingReturns.map((ret, idx) => {
                            const alpha = ret.fundReturn - ret.indexReturn;
                            return (
                              <tr key={idx} className="hover:bg-white transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">{ret.period}</td>
                                <td className="px-4 py-3 font-bold text-slate-900 text-right">{ret.fundReturn.toFixed(2)}%</td>
                                <td className="px-4 py-3 font-bold text-slate-600 text-right">{ret.indexReturn.toFixed(2)}%</td>
                                <td className={`px-4 py-3 font-black text-right ${alpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {alpha >= 0 ? '+' : ''}{alpha.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Risk Adjusted Ratios Section */}
                {analysis.riskAdjustedRatios && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Shield size={20} className="text-indigo-600" />
                      Risk Adjusted Ratios (vs Category)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Sharpe Ratio</span>
                          <span className="text-sm font-black text-slate-900">{analysis.riskAdjustedRatios.sharpeRatio?.toFixed(2) || '-'}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${Math.min((analysis.riskAdjustedRatios.sharpeRatio || 0) * 30, 100)}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400 font-medium">Category Avg: {analysis.riskAdjustedRatios.categoryAvgSharpeRatio?.toFixed(2) || '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Sortino Ratio</span>
                          <span className="text-sm font-black text-slate-900">{analysis.riskAdjustedRatios.sortinoRatio?.toFixed(2) || '-'}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${Math.min((analysis.riskAdjustedRatios.sortinoRatio || 0) * 30, 100)}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400 font-medium">Category Avg: {analysis.riskAdjustedRatios.categoryAvgSortinoRatio?.toFixed(2) || '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Standard Deviation</span>
                          <span className="text-sm font-black text-slate-900">{analysis.riskAdjustedRatios.standardDeviation?.toFixed(2) || '-'}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${Math.min((analysis.riskAdjustedRatios.standardDeviation || 0) * 4, 100)}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400 font-medium">Category Avg: {analysis.riskAdjustedRatios.categoryAvgStandardDeviation?.toFixed(2) || '-'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Information Ratio</span>
                          <span className="text-sm font-black text-slate-900">{analysis.riskAdjustedRatios.informationRatio?.toFixed(2) || '-'}</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.min((analysis.riskAdjustedRatios.informationRatio || 0) * 50, 100)}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400 font-medium">Category Avg: {analysis.riskAdjustedRatios.categoryAvgInformationRatio?.toFixed(2) || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Cap Allocation Section */}
                {analysis.marketCapAllocation && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 size={20} className="text-indigo-600" />
                      Market Cap Allocation
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Large Cap</p>
                        <p className="text-xl font-black text-indigo-600">{analysis.marketCapAllocation.largeCap}%</p>
                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${analysis.marketCapAllocation.largeCap}%` }} />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mid Cap</p>
                        <p className="text-xl font-black text-emerald-600">{analysis.marketCapAllocation.midCap}%</p>
                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${analysis.marketCapAllocation.midCap}%` }} />
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Small Cap</p>
                        <p className="text-xl font-black text-amber-600">{analysis.marketCapAllocation.smallCap}%</p>
                        <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${analysis.marketCapAllocation.smallCap}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Fund Manager & Thesis Section */}
                {(analysis.fundManagerDetails || analysis.investmentThesis) && (
                  <div className="space-y-6">
                    {analysis.fundManagerDetails && (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                          <Activity size={20} className="text-indigo-600" />
                          Fund Manager: {analysis.fundManagerDetails.name}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Experience & Style</p>
                            <p className="text-sm text-slate-700 font-medium">{analysis.fundManagerDetails.experience}</p>
                            <p className="mt-2 text-sm text-slate-600 italic">Style: {analysis.fundManagerDetails.style}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Track Record</p>
                            <p className="text-sm text-slate-600 leading-relaxed">{analysis.fundManagerDetails.trackRecord}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {analysis.investmentThesis && (
                      <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <h4 className="text-sm font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Target size={16} />
                          Investment Thesis & Holdings Analysis
                        </h4>
                        <div className="text-sm text-slate-600 leading-relaxed prose prose-slate prose-sm max-w-none">
                          <ReactMarkdown>{analysis.investmentThesis}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rank within Category Section */}
                {analysis.rankWithinCategory && analysis.rankWithinCategory.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Activity size={20} className="text-indigo-600" />
                      Category Ranking History
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {analysis.rankWithinCategory.map((rank, idx) => (
                        <div key={idx} className="flex-1 min-w-[100px] p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{rank.year}</p>
                          <p className="text-lg font-black text-slate-900">{rank.rank}<span className="text-xs text-slate-400 font-normal">/{rank.totalFunds}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fund Specific Info */}
                {(analysis.fundHousePedigree || analysis.fundManagerProfile) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.fundHousePedigree && (
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-2 mb-2 text-indigo-600">
                          <Shield size={18} />
                          <span className="text-sm font-bold">Fund House Pedigree</span>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed">
                          <ReactMarkdown>{analysis.fundHousePedigree}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {analysis.fundManagerProfile && (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-2 text-emerald-600">
                          <Activity size={18} />
                          <span className="text-sm font-bold">Fund Manager Profile</span>
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed">
                          <ReactMarkdown>{analysis.fundManagerProfile}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SIP Performance Section */}
                {investment.isSIP && analysis.sipPerformance && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <RefreshCw size={20} className="text-indigo-600" />
                      SIP Performance Analysis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Total Invested</p>
                        <p className="text-xl font-black text-indigo-900">{formatCurrency(analysis.sipPerformance.totalInvested)}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Current Value</p>
                        <p className="text-xl font-black text-emerald-900">{formatCurrency(analysis.sipPerformance.currentValue)}</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">SIP XIRR</p>
                        <p className="text-xl font-black text-amber-900">{analysis.sipPerformance.xirr.toFixed(2)}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 text-center italic">
                      SIP Duration: {analysis.sipPerformance.sipDuration}
                    </p>
                  </div>
                )}

                {/* Index Comparison Section */}
                {analysis.indexComparison && analysis.indexComparison.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Target size={20} className="text-indigo-600" />
                      Benchmark Comparison
                    </h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/50 border-bottom border-slate-200">
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Benchmark Index</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Fund Return</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Index Return</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Alpha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysis.indexComparison.map((comp, idx) => {
                            const alpha = comp.investmentReturn - comp.indexReturn;
                            return (
                              <tr key={idx} className="hover:bg-white transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">
                                  {comp.indexName} <span className="text-[10px] text-slate-400 font-normal">({comp.period})</span>
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-900 text-right">
                                  {comp.investmentReturn.toFixed(2)}%
                                </td>
                                <td className="px-4 py-3 font-bold text-slate-600 text-right">
                                  {comp.indexReturn.toFixed(2)}%
                                </td>
                                <td className={`px-4 py-3 font-black text-right ${alpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {alpha >= 0 ? '+' : ''}{alpha.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Historical Performance Section */}
                {(investment.return1Y !== undefined || investment.return3Y !== undefined || investment.return5Y !== undefined) && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 size={20} className="text-indigo-600" />
                      Historical Performance
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">1Y Return</p>
                        <p className={`text-xl font-black ${investment.return1Y && investment.return1Y >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {investment.return1Y !== undefined ? `${investment.return1Y.toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">3Y Return</p>
                        <p className={`text-xl font-black ${investment.return3Y && investment.return3Y >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {investment.return3Y !== undefined ? `${investment.return3Y.toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">5Y Return</p>
                        <p className={`text-xl font-black ${investment.return5Y && investment.return5Y >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {investment.return5Y !== undefined ? `${investment.return5Y.toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchase History Section */}
                {investment?.purchases && investment.purchases.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Calendar size={20} className="text-emerald-600" />
                      Purchase History
                    </h4>
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/50 border-bottom border-slate-200">
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Qty</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Price</th>
                            <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {investment.purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p) => (
                            <tr key={p.id} className="hover:bg-white transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-600">
                                {new Date(p.date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900 text-right">{p.quantity.toLocaleString()}</td>
                              <td className="px-4 py-3 font-bold text-slate-900 text-right">{formatCurrency(p.price)}</td>
                              <td className="px-4 py-3 font-bold text-emerald-600 text-right">{formatCurrency(p.quantity * p.price)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100/30 font-bold">
                          <tr>
                            <td className="px-4 py-3 text-slate-500">Total</td>
                            <td className="px-4 py-3 text-right text-slate-900">{investment.quantity?.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-slate-400">Avg: {formatCurrency(investment.buyPrice || 0)}</td>
                            <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(investment.investedValue)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Holdings Analysis */}
          {analysis.sectorAllocation && analysis.sectorAllocation.length > 0 && (
            <div className="premium-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <BarChart2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-wealth-navy">Sector Allocation</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.sectorAllocation} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="sector" 
                        type="category" 
                        width={100} 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${value}%`}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="percentage" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {analysis.sectorAllocation.slice(0, 6).map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-bold text-slate-700">{s.sector}</span>
                      <span className="text-sm font-black text-amber-600">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {analysis.topHoldings && analysis.topHoldings.length > 0 && (
            <div className="premium-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <TrendingUp size={20} />
                </div>
                <h3 className="text-lg font-bold text-wealth-navy">Top 10 Holdings</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.topHoldings.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-bold text-wealth-navy">{h.name}</span>
                    </div>
                    <span className="text-sm font-black text-indigo-600">{h.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysis.marketOutlookIndia && (
                    <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <h4 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <IndianRupee size={16} />
                        India Market Outlook
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{analysis.marketOutlookIndia}</p>
                    </div>
                  )}
                  {analysis.marketOutlookGlobal && (
                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <h4 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Globe size={16} />
                        Global Market Outlook
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{analysis.marketOutlookGlobal}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ArrowUpRight size={20} className="text-indigo-600" />
                    Detailed Insights
                  </h4>
                  <div className="prose prose-slate prose-sm max-w-none bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <ReactMarkdown>{analysis.details}</ReactMarkdown>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                      Report Generated: {new Date(analysis.lastGenerated).toLocaleString()}
                    </p>
                    {analysis.analysisDataDate && (
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Verified Data As Of: {analysis.analysisDataDate} ({verifiedSources})
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleGenerateAnalysis(true)}
                    className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
                  >
                    <RefreshCw size={16} />
                    Refresh / Fetch Latest Data
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500">Something went wrong. Please try again.</p>
                <button onClick={() => handleGenerateAnalysis()} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">
                  Retry Analysis
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div className="flex gap-3">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(investment);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={18} />
                  Edit Investment
                </button>
              )}
              {analysis && (
                <button
                  onClick={handleDownloadPDF}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  Download PDF Report
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Close Analysis
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AnalysisModal;
