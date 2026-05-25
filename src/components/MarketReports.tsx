
import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, ArrowRight, 
  Globe, Landmark, ShieldAlert, Zap, 
  Briefcase, BookOpen, Calendar, ChevronRight,
  BarChart3, PieChart, Info, Sparkles, Quote,
  RefreshCw, AlertCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { MarketReport, MarketIndexChange, SectorChange, AssetClassTrend, ProductUpdate, MarketNews, MarketEvent } from '../types';
import { generateMarketReport } from '../services/livePriceService';

const MarketReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (period: 'Weekly' | 'Monthly', forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateMarketReport(period, forceRefresh);
      if (!data || !data.date || !data.summary) {
        throw new Error(`The ${period.toLowerCase()} report generated was incomplete.`);
      }
      setReport(data);
    } catch (err) {
      console.error(`Failed to fetch ${period} report:`, err);
      setError(`Failed to generate ${period.toLowerCase()} report. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  const getTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'up':
      case 'bullish': return <TrendingUp className="text-emerald-500" size={16} />;
      case 'down':
      case 'bearish': return <TrendingDown className="text-rose-500" size={16} />;
      default: return <Minus className="text-slate-400" size={16} />;
    }
  };

  const getOutlookColor = (outlook: string) => {
    switch (outlook.toLowerCase()) {
      case 'bullish': return 'text-emerald-600 bg-emerald-50';
      case 'bearish': return 'text-rose-600 bg-rose-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getProductTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'MF': return 'bg-indigo-100 text-indigo-700';
      case 'PMS': return 'bg-amber-100 text-amber-700';
      case 'AIF': return 'bg-purple-100 text-purple-700';
      case 'BONDS': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'positive': return 'text-emerald-600';
      case 'negative': return 'text-rose-600';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-emerald-600" />
            Market Insights & Reports
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Comprehensive analysis of global and domestic markets by our personal finance experts.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {report?.lastUpdated && (
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</span>
              <span className="text-xs text-slate-500">{new Date(report.lastUpdated).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
            </div>
          )}
          <button 
            onClick={() => fetchReport(activeTab, true)}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
            title="Refresh Report"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
            {(['Weekly', 'Monthly'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                disabled={loading}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                } disabled:opacity-50`}
              >
                {tab} Report
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200"
          >
            <Loader2 className="text-emerald-500 animate-spin" size={48} />
            <div className="text-center">
              <p className="text-slate-900 font-bold">Generating {activeTab} Report...</p>
              <p className="text-slate-500 text-sm">Our AI analyst is scanning global markets for the latest insights.</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-rose-50/50 rounded-[2.5rem] border border-dashed border-rose-200 p-8"
          >
            <AlertCircle className="text-rose-500" size={48} />
            <div className="text-center">
              <p className="text-rose-900 font-bold">Analysis Interrupted</p>
              <p className="text-rose-600 text-sm max-w-md mx-auto">{error}</p>
            </div>
            <button 
              onClick={() => fetchReport(activeTab)}
              className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all"
            >
              Retry Analysis
            </button>
          </motion.div>
        ) : report ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Summary Card */}
            <div className="bg-emerald-600 rounded-[2rem] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-emerald-100 font-bold text-[10px] uppercase tracking-widest">
                  <Calendar size={14} />
                  {report.date}
                </div>
                <div className="text-3xl font-bold leading-tight max-w-2xl prose prose-invert">
                  <ReactMarkdown>{report.summary}</ReactMarkdown>
                </div>
                <div className="flex items-center gap-2 text-emerald-100/80 text-sm italic">
                  <Quote size={14} className="opacity-50" />
                  "The best time to invest was yesterday. The next best time is today."
                </div>
              </div>
            </div>

            {/* Data Source Disclaimer */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-3">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Data Source:</strong> This report is generated in real-time using AI grounded with Google Search. 
                While we strive for 100% accuracy, market data can fluctuate rapidly. Please verify critical index levels with official exchanges before making investment decisions.
              </p>
            </div>

            {/* Market Snapshot: Indices & Sectors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Indices */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Globe className="text-indigo-600" size={20} />
                  Global & Domestic Indices
                </h4>
                <div className="space-y-4">
                  {report.indexChanges && report.indexChanges.length > 0 ? (
                    report.indexChanges.map((index, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{index.name}</span>
                          <span className="text-xs text-slate-500">{index.currentValue.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center justify-end gap-1 font-bold ${index.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {index.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {Math.abs(index.changePercent)}%
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {index.change >= 0 ? '+' : ''}{index.change.toLocaleString()} pts
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                      No index data available for this period.
                    </div>
                  )}
                </div>
              </div>

              {/* Sectors */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <PieChart className="text-amber-600" size={20} />
                  Sectoral Performance
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {report.sectorChanges && report.sectorChanges.length > 0 ? (
                    report.sectorChanges.map((sector, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-700">{sector.name}</span>
                          {getTrendIcon(sector.trend)}
                        </div>
                        <div className={`text-lg font-bold ${sector.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent}%
                        </div>
                        {sector.topStock && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Top: {sector.topStock}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-slate-400 text-sm italic">
                      No sector data available for this period.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* News & Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Global & India News */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Landmark className="text-blue-600" size={20} />
                    Market Headlines
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Perspectives</p>
                      {report.globalNews && report.globalNews.length > 0 ? (
                        report.globalNews.map((news, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${news.impact === 'Positive' ? 'bg-emerald-400' : news.impact === 'Negative' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-800 leading-snug">{news.title}</p>
                              <p className="text-xs text-slate-500 leading-relaxed">{news.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No global news available.</p>
                      )}
                    </div>
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">India & Personal Finance</p>
                      {report.indiaNews && report.indiaNews.length > 0 ? (
                        report.indiaNews.map((news, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${news.impact === 'Positive' ? 'bg-emerald-400' : news.impact === 'Negative' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-800 leading-snug">{news.title}</p>
                                <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase tracking-wider">{news.category}</span>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">{news.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No domestic news available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rules & Events */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldAlert className="text-rose-600" size={20} />
                    Regulatory & Major Events
                  </h4>
                  <div className="space-y-4">
                    {report.majorEvents && report.majorEvents.length > 0 ? (
                      report.majorEvents.map((event, idx) => (
                        <div key={idx} className={`flex gap-3 p-4 rounded-2xl border ${event.type === 'Rule Change' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                          {event.type === 'Rule Change' ? <Zap className="text-rose-500 shrink-0" size={18} /> : <Calendar className="text-indigo-500 shrink-0" size={18} />}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-bold ${event.type === 'Rule Change' ? 'text-rose-900' : 'text-slate-900'}`}>{event.title}</p>
                              <span className="text-[10px] font-bold text-slate-400">{event.date}</span>
                            </div>
                            <p className={`text-xs ${event.type === 'Rule Change' ? 'text-rose-700' : 'text-slate-600'} leading-relaxed`}>{event.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-sm italic">
                        No major regulatory events found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Class Trends */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h4 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={24} />
                Asset Class Trends & Outlook
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {report.assetTrends && report.assetTrends.length > 0 ? (
                  report.assetTrends.map((asset, idx) => (
                    <div key={idx} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{asset.assetClass}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getOutlookColor(asset.outlook)}`}>
                          {asset.outlook}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {asset.performance}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                        Trend: {asset.trend}
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-8 text-slate-400 text-sm italic">
                    No asset class trend data available.
                  </div>
                )}
              </div>
            </div>

            {/* Product Updates */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="text-indigo-600" size={24} />
                Investment Product Updates
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(report.productUpdates ?? []).map((product, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm ${getProductTypeColor(product.category)}`}>
                      {product.category}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900">{product.title}</h5>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.impact}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspirational Story */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    <BookOpen size={14} />
                    Investor Stories
                  </div>
                  <h3 className="text-4xl font-bold tracking-tight">
                    {report.inspirationalStory?.title}
                  </h3>
                  <p className="text-slate-300 text-lg leading-relaxed italic">
                    "{report.inspirationalStory?.story}"
                  </p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3 text-emerald-400">
                    <Sparkles size={24} />
                    <span className="font-bold uppercase tracking-widest text-sm">The Key Lesson</span>
                  </div>
                  <p className="text-xl font-medium text-white leading-relaxed">
                    {report.inspirationalStory?.lesson}
                  </p>
                  <div className="pt-6 border-t border-white/10">
                    <button className="flex items-center gap-2 text-emerald-400 font-bold hover:gap-3 transition-all">
                      Learn more about compounding
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Analyst Footer */}
      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" 
            alt="Analyst" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-lg font-bold text-slate-900">Analyst's Note</h4>
          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
            "While short-term volatility is a feature of the markets, the long-term structural growth story of India remains intact. Focus on your asset allocation and stay disciplined with your SIPs. Remember, time in the market is more important than timing the market."
          </p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">— Senior Personal Finance Analyst</p>
        </div>
      </div>
    </div>
  );
};

export default MarketReports;
