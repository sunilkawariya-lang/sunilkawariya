
import React, { useState, useEffect, useMemo } from 'react';
import { getFinanceNews, getCachedNews } from '../services/geminiService';
import { Newspaper, ExternalLink, RefreshCw, TrendingUp, TrendingDown, Minus, Clock, Calendar, Quote, Play, Video, Info, ArrowRight, Sparkles, BarChart3, Briefcase, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioState } from '../types';
import MarketReports from './MarketReports';
import StockResearch from './StockResearch';
import MarketScreener from './MarketScreener';

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  category: string;
  impact: 'Positive' | 'Neutral' | 'Negative';
  url?: string;
}

interface NewsSectionProps {
  portfolio: PortfolioState;
}

const NewsSection: React.FC<NewsSectionProps> = ({ portfolio }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeView, setActiveView] = useState<'Daily' | 'Reports' | 'StockResearch' | 'Screener'>('Daily');

  const riskProfile = portfolio.riskProfile?.type || 'Moderate';

  const suitabilityQuotes = useMemo(() => {
    const allQuotes = [
      {
        text: "The stock market is a device for transferring money from the impatient to the patient.",
        author: "Warren Buffett",
        suitability: ['Conservative', 'Moderate', 'Aggressive', 'Very Aggressive'],
        tag: "Patience"
      },
      {
        text: "Emotional discipline is the key to successful investing. You don't need to be a genius, you just need to be rational.",
        author: "Ramesh Damani",
        suitability: ['Moderate', 'Aggressive'],
        tag: "Discipline"
      },
      {
        text: "Invest in a business any fool can run, because someday a fool will.",
        author: "Warren Buffett",
        suitability: ['Conservative', 'Moderate'],
        tag: "Quality"
      },
      {
        text: "The market always gives you a second chance. You just need to have the conviction to wait for it.",
        author: "Rakesh Jhunjhunwala",
        suitability: ['Aggressive', 'Very Aggressive'],
        tag: "Conviction"
      },
      {
        text: "In investing, what is comfortable is rarely profitable.",
        author: "Robert Arnott",
        suitability: ['Aggressive', 'Very Aggressive'],
        tag: "Growth"
      },
      {
        text: "The four most dangerous words in investing are: 'this time it's different.'",
        author: "Sir John Templeton",
        suitability: ['Moderate', 'Aggressive'],
        tag: "Caution"
      },
      {
        text: "Value investing is about buying a dollar for 50 cents. It requires patience and a margin of safety.",
        author: "Parag Parikh",
        suitability: ['Conservative', 'Moderate'],
        tag: "Value"
      },
      {
        text: "Risk comes from not knowing what you're doing.",
        author: "Warren Buffett",
        suitability: ['Conservative', 'Moderate'],
        tag: "Knowledge"
      },
      {
        text: "India is in a structural bull run. The next decade belongs to the Indian economy.",
        author: "Nilesh Shah",
        suitability: ['Moderate', 'Aggressive', 'Very Aggressive'],
        tag: "India Growth"
      },
      {
        text: "The best way to measure your investing success is not by whether you're beating the market but by whether you've put in place a financial plan and a behavioral discipline that are likely to get you where you want to go.",
        author: "Benjamin Graham",
        suitability: ['Conservative', 'Moderate'],
        tag: "Planning"
      }
    ];

    return allQuotes.filter(q => q.suitability.includes(riskProfile));
  }, [riskProfile]);

  const financeVideos = [
    {
      title: "Rakesh Jhunjhunwala: The Big Bull's Legacy",
      description: "Insights into the investment philosophy of India's most legendary investor and his approach to long-term wealth.",
      thumbnail: "https://images.unsplash.com/photo-1611974717484-7da8c1746b62?w=800&q=80",
      duration: "18:45",
      url: "https://www.youtube.com/results?search_query=rakesh+jhunjhunwala+investment+philosophy",
      category: "Legendary Investors"
    },
    {
      title: "Warren Buffett: Value Investing Masterclass",
      description: "Timeless wisdom from the Oracle of Omaha on identifying moat businesses and the power of compounding.",
      thumbnail: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
      duration: "25:20",
      url: "https://www.youtube.com/results?search_query=warren+buffett+investment+strategy",
      category: "Global Wisdom"
    },
    {
      title: "Ramesh Damani: Identifying Multibaggers",
      description: "Learn how one of India's most respected investors identifies high-growth stocks early in their cycle.",
      thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
      duration: "14:10",
      url: "https://www.youtube.com/results?search_query=ramesh+damani+multibagger+stocks",
      category: "Stock Picking"
    },
    {
      title: "Nilesh Shah: The India Opportunity",
      description: "Managing Director of Kotak AMC discusses the structural growth story of India and market valuations.",
      thumbnail: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
      duration: "22:30",
      url: "https://www.youtube.com/results?search_query=nilesh+shah+market+outlook",
      category: "Market Outlook"
    },
    {
      title: "S. Naren: Contrarian Investing Secrets",
      description: "ICICI Prudential's CIO explains why buying when others are fearful is the key to superior returns.",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bbbda5366392?w=800&q=80",
      duration: "16:15",
      url: "https://www.youtube.com/results?search_query=s+naren+contrarian+investing",
      category: "Strategy"
    },
    {
      title: "Parag Parikh: Behavioral Finance & Value",
      description: "Understanding the late Parag Parikh's focus on investor psychology and classic value investing principles.",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      duration: "19:50",
      url: "https://www.youtube.com/results?search_query=parag+parikh+value+investing",
      category: "Psychology"
    }
  ];

  const fetchNews = async (force = false) => {
    if (force) setIsLoading(true);
    const data = await getFinanceNews(force);
    if (data && data.length > 0) {
      setNews(data);
    } else if (!news.length) {
      // Fallback mock data if API fails or returns empty AND we have no cached news
      setNews([
        {
          title: "RBI Keeps Repo Rate Unchanged at 6.5%",
          summary: "The Reserve Bank of India's Monetary Policy Committee has decided to maintain the status quo on interest rates for the seventh consecutive time.",
          source: "Economic Times",
          category: "Policy",
          impact: "Neutral"
        },
        {
          title: "SEBI Mandates T+0 Settlement for Select Stocks",
          summary: "Market regulator SEBI has introduced beta version of T+0 settlement cycle for 25 stocks, aiming for same-day settlement of trades.",
          source: "Moneycontrol",
          category: "Market",
          impact: "Positive"
        },
        {
          title: "New Tax Regime: Standard Deduction Increased to ₹75,000",
          summary: "The Finance Ministry has proposed increasing the standard deduction for salaried employees under the new tax regime to provide more relief.",
          source: "LiveMint",
          category: "Tax",
          impact: "Positive"
        },
        {
          title: "ET Wealth: Best Mutual Funds to Invest in 2026",
          summary: "ET Wealth's annual study reveals the top-performing equity and debt mutual funds based on risk-adjusted returns and consistency.",
          source: "ET Wealth",
          category: "Market",
          impact: "Positive"
        }
      ]);
    }
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    const cached = getCachedNews();
    if (cached && cached.length > 0) {
      setNews(cached);
      setIsLoading(false);
      // Still fetch in background to refresh if needed
      fetchNews(false);
    } else {
      fetchNews(true);
    }
  }, []);

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'Positive': return <TrendingUp className="text-emerald-500" size={16} />;
      case 'Negative': return <TrendingDown className="text-rose-500" size={16} />;
      default: return <Minus className="text-slate-400" size={16} />;
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('tax')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    if (cat.includes('market')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (cat.includes('policy')) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            onClick={() => setActiveView('Daily')}
            className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeView === 'Daily' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Newspaper size={16} />
            Daily News
          </button>
          <button
            onClick={() => setActiveView('Reports')}
            className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeView === 'Reports' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart3 size={16} />
            Market Reports
          </button>
          <button
            onClick={() => setActiveView('StockResearch')}
            className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeView === 'StockResearch' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase size={16} />
            Stock Research
          </button>
          <button
            onClick={() => setActiveView('Screener')}
            className={`px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeView === 'Screener' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Target size={16} />
            Screener
          </button>
        </div>

        {activeView === 'Daily' && (
          <button 
            onClick={() => fetchNews(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh News
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'Daily' ? (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Newspaper className="text-emerald-600" />
                  Finance Daily
                </h2>
                <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                  <Clock size={14} />
                  Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-slate-50 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-50 rounded w-5/6 mb-6" />
                    <div className="flex justify-between">
                      <div className="h-6 bg-slate-100 rounded w-20" />
                      <div className="h-6 bg-slate-100 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {news.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        {getImpactIcon(item.impact)}
                        {item.impact} Impact
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                      {item.summary}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar size={12} />
                        <span>Today</span>
                        <span className="mx-1">•</span>
                        <span className="font-medium text-slate-500">{item.source}</span>
                      </div>
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-xs font-bold"
                        >
                          Read More
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -ml-32 -mb-32" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-[0.2em]">
                    <Sparkles size={14} />
                    Suitability-Based Wisdom
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">Market Quotes for your <span className="text-emerald-400">{riskProfile}</span> Profile</h3>
                  <p className="text-slate-400 text-sm max-w-md">
                    Curated financial wisdom tailored to your risk appetite and investment philosophy.
                  </p>
                </div>

                <div className="flex-1 w-full grid grid-cols-1 gap-4">
                  {suitabilityQuotes.slice(0, 2).map((quote, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.2 }}
                      className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl group hover:bg-white/10 transition-all"
                    >
                      <Quote className="text-emerald-500/40 mb-3" size={20} />
                      <p className="text-sm italic text-slate-200 leading-relaxed mb-4">
                        "{quote.text}"
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">— {quote.author}</span>
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {quote.tag}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Video className="text-indigo-600" />
                  Investor Education & Market Insights
                </h3>
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-1">
                  View All Videos
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {financeVideos.map((video, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 shadow-xl group-hover:scale-110 transition-transform">
                          <Play size={20} fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {video.duration}
                      </div>
                      <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {video.category}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className="font-bold text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                        {video.description}
                      </p>
                      <a 
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto flex items-center gap-2 text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:gap-3 transition-all"
                      >
                        Watch Now
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Stay ahead of the curve</h3>
                  <p className="text-slate-400 text-sm max-w-md">
                    Our AI monitors thousands of financial data points daily to bring you only the news that impacts your personal wealth.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Market Sentiment</p>
                    <p className="text-emerald-400 font-bold">Bullish</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeView === 'Reports' ? (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <MarketReports />
          </motion.div>
        ) : activeView === 'StockResearch' ? (
          <motion.div
            key="stock-research"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <StockResearch />
          </motion.div>
        ) : (
          <motion.div
            key="screener"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <MarketScreener />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsSection;
