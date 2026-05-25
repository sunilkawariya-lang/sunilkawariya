
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, Info, Gauge, Target, Shield } from 'lucide-react';
import { MarketIndex } from '../types';

import ReactMarkdown from 'react-markdown';

interface MarketAnalysisModalProps {
  index: MarketIndex | null;
  onClose: () => void;
}

const MarketAnalysisModal: React.FC<MarketAnalysisModalProps> = ({ index, onClose }) => {
  if (!index) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {index.name} {index.name.includes('Gold') ? '(10g)' : index.name.includes('Silver') ? '(1kg)' : ''} Analysis
              </h2>
              <p className="text-sm text-slate-500">Market Valuation & Technical Outlook</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* Current Price & Change */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Value</p>
                <h3 className="text-3xl font-bold text-slate-900">
                  {index.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </h3>
                <div className={`flex items-center gap-1 text-sm font-bold mt-1 ${index.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {index.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {index.change >= 0 ? '+' : ''}{index.change.toLocaleString()} ({index.changePercent.toFixed(2)}%)
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valuation Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    index.analysis?.valuation === 'Undervalued' ? 'bg-emerald-100 text-emerald-700' :
                    index.analysis?.valuation === 'Fair Value' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {index.analysis?.valuation || 'N/A'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">Based on historical P/E and P/B averages</p>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Info size={18} className="text-indigo-500" />
                Market Summary
              </h4>
              <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
                <ReactMarkdown>
                  {index.analysis?.summary || 'Detailed analysis for this index is currently being updated. Please check back shortly.'}
                </ReactMarkdown>
              </div>
            </div>

            {/* Key Ratios & Technicals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Gauge size={18} className="text-emerald-500" />
                  Valuation Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-500 font-medium">P/E Ratio</span>
                    <span className="font-bold text-slate-900">{index.analysis?.peRatio || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-500 font-medium">P/B Ratio</span>
                    <span className="font-bold text-slate-900">{index.analysis?.pbRatio || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-500 font-medium">Dividend Yield</span>
                    <span className="font-bold text-slate-900">{index.analysis?.dividendYield ? `${index.analysis.dividendYield}%` : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Target size={18} className="text-rose-500" />
                  Technical Outlook
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-500 font-medium">Trend</span>
                    <span className={`font-bold ${
                      index.analysis?.technicalTrend === 'Bullish' ? 'text-emerald-600' :
                      index.analysis?.technicalTrend === 'Bearish' ? 'text-rose-600' : 'text-slate-600'
                    }`}>
                      {index.analysis?.technicalTrend || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-500 font-medium">Support Level</span>
                    <span className="font-bold text-slate-900">{index.analysis?.keyLevels?.support.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-500 font-medium">Resistance Level</span>
                    <span className="font-bold text-slate-900">{index.analysis?.keyLevels?.resistance.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Warning */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <Shield className="text-amber-500 shrink-0" size={20} />
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Disclaimer:</strong> Market analysis is based on historical data and current trends. It does not constitute financial advice. Past performance is not indicative of future results.
              </p>
            </div>
          </div>

          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close Analysis
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MarketAnalysisModal;
