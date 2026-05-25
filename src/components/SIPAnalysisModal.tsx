import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, TrendingUp, TrendingDown, Target, Shield, Loader2, BarChart3, Activity, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { Investment } from '../types';
import { generateSIPPortfolioAnalysis } from '../services/analysisService';
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ASSET_COLORS } from '../constants';

interface SIPAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  sipInvestments: Investment[];
}

const SIPAnalysisModal: React.FC<SIPAnalysisModalProps> = ({ isOpen, onClose, sipInvestments }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    if (isOpen && sipInvestments.length > 0) {
      handleGenerateAnalysis();
    }
  }, [isOpen]);

  const handleGenerateAnalysis = async () => {
    setLoading(true);
    try {
      const result = await generateSIPPortfolioAnalysis(sipInvestments);
      setAnalysis(result);
    } catch (error) {
      console.error("Failed to generate SIP analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const totalMonthlySIP = sipInvestments.reduce((sum, inv) => sum + (inv.sipAmount || 0), 0);
  const totalInvested = sipInvestments.reduce((sum, inv) => sum + inv.investedValue, 0);
  const totalCurrentValue = sipInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const overallGain = totalCurrentValue - totalInvested;
  const overallReturn = totalInvested > 0 ? (overallGain / totalInvested) * 100 : 0;

  // Asset Allocation Data
  const assetDataMap = sipInvestments.reduce((acc, inv) => {
    acc[inv.category] = (acc[inv.category] || 0) + inv.currentValue;
    return acc;
  }, {} as Record<string, number>);
  const assetChartData = Object.entries(assetDataMap).map(([name, value]) => ({ name, value }));

  // Sub-category Data
  const subCatDataMap = sipInvestments.reduce((acc, inv) => {
    acc[inv.subCategory] = (acc[inv.subCategory] || 0) + inv.currentValue;
    return acc;
  }, {} as Record<string, number>);
  const subCatChartData = Object.entries(subCatDataMap).map(([name, value]) => ({ name, value }));

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Add More': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Hold': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Exit': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white">
                <RefreshCw size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Consolidated SIP Analysis</h2>
                <p className="text-sm text-slate-500">Analysis of {sipInvestments.length} Active SIPs • {formatCurrency(totalMonthlySIP)} Monthly</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 size={48} className="text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Analyzing SIP portfolio performance & allocation...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-10">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly SIP</p>
                    <p className="text-2xl font-black text-indigo-600">{formatCurrency(totalMonthlySIP)}</p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Invested</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(totalInvested)}</p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Value</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(totalCurrentValue)}</p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Returns</p>
                    <div className={`flex items-center gap-1 text-2xl font-black ${overallGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {overallGain >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {overallReturn !== null && !isNaN(overallReturn) ? overallReturn.toFixed(1) : '0.0'}%
                    </div>
                  </div>
                </div>

                {/* Recommendation Card */}
                <div className={`p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-8 ${getRecommendationColor(analysis.recommendation)}`}>
                  <div className="text-center md:text-left flex-1">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                      <Sparkles size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Consolidated Recommendation</span>
                    </div>
                    <h3 className="text-4xl font-black mb-3">{analysis.recommendation}</h3>
                    <div className="prose prose-slate prose-sm max-w-none opacity-90 leading-relaxed">
                      <ReactMarkdown>{analysis.summary}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Breakup Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <PieChartIcon size={20} className="text-indigo-600" />
                      <h4 className="font-bold text-slate-900">Asset Allocation</h4>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {assetChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name as keyof typeof ASSET_COLORS] || '#cbd5e1'} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 prose prose-slate prose-sm max-w-none text-slate-500 leading-relaxed">
                      <ReactMarkdown>{analysis.assetAllocationAnalysis}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <BarChart3 size={20} className="text-emerald-600" />
                      <h4 className="font-bold text-slate-900">Sub-Category Breakup</h4>
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subCatChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                          <RechartsTooltip formatter={(val: number) => formatCurrency(val)} />
                          <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 prose prose-slate prose-sm max-w-none text-slate-500 leading-relaxed">
                      <ReactMarkdown>{analysis.subCategoryAnalysis}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Benchmark Comparison */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Target size={20} className="text-indigo-600" />
                    <h4 className="font-bold text-slate-900">Benchmark Performance Comparison</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Benchmark Index</th>
                          <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Portfolio Return</th>
                          <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Index Return</th>
                          <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Alpha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {analysis.benchmarkComparison?.map((comp: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-4 font-bold text-slate-900">{comp.indexName}</td>
                            <td className="py-4 text-right font-bold text-slate-600">{comp.portfolioReturn !== null && !isNaN(comp.portfolioReturn) ? comp.portfolioReturn.toFixed(2) : '0.00'}%</td>
                            <td className="py-4 text-right font-bold text-slate-600">{comp.indexReturn !== null && !isNaN(comp.indexReturn) ? comp.indexReturn.toFixed(2) : '0.00'}%</td>
                            <td className={`py-4 text-right font-black ${comp.alpha >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {comp.alpha >= 0 ? '+' : ''}{comp.alpha !== null && !isNaN(comp.alpha) ? comp.alpha.toFixed(2) : '0.00'}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Individual Fund Recommendations */}
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-600" />
                    Fund-wise Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.fundRecommendations?.map((rec: any, idx: number) => (
                      <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-bold text-slate-900">{rec.fundName}</h5>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            rec.action === 'Add More' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            rec.action === 'Hold' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {rec.action}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{rec.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk & Return Analysis */}
                <div className="p-8 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <Shield size={20} />
                    <h4 className="font-bold">Risk & Return Analysis</h4>
                  </div>
                  <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed">
                    <ReactMarkdown>{analysis.riskReturnAnalysis}</ReactMarkdown>
                  </div>
                </div>

                {/* Detailed Insights */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-600" />
                    Detailed Insights
                  </h4>
                  <div className="prose prose-slate prose-sm max-w-none bg-slate-50 p-8 rounded-3xl border border-slate-100">
                    <ReactMarkdown>{analysis.details}</ReactMarkdown>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                    Last Updated: {new Date(analysis.lastGenerated).toLocaleString()}
                  </p>
                  <button 
                    onClick={handleGenerateAnalysis}
                    className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline"
                  >
                    <RefreshCw size={16} />
                    Refresh Analysis
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
            >
              Close Analysis
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SIPAnalysisModal;
