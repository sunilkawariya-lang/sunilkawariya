
import React, { useState, useRef, useEffect } from 'react';
import { PortfolioState } from '../types';
import { getFinancialAdvice, getRebalancingAdvice, getTopMarketRecommendations, getRiskBasedRebalancing, getSIPRebalancingAdvice } from '../services/geminiService';
import { Sparkles, Send, Bot, User, Loader2, RefreshCw, TrendingUp, Shield, ScrollText, ArrowUpRight, BarChart3, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useFirebase } from '../contexts/FirebaseContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAdvisorProps {
  portfolio: PortfolioState;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ portfolio }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm RH AI, your personal financial assistant. I can help you analyze your portfolio, suggest rebalancing strategies, or answer any tax-related questions. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideMessage?: string) => {
    const messageToSend = overrideMessage || input.trim();
    if (!messageToSend || isLoading) return;

    if (!overrideMessage) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsLoading(true);

    const response = await getFinancialAdvice(portfolio, messageToSend);
    setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  const handleRebalance = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: "Suggest a rebalancing plan for my portfolio." }]);
    const response = await getRebalancingAdvice(portfolio);
    setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  const handleRiskBasedRebalance = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: `Analyze my current asset allocation against my ${portfolio.riskProfile.type} risk profile and suggest rebalancing steps.` }]);
    const response = await getRiskBasedRebalancing(portfolio);
    setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  const handleMarketStrategy = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: "Provide a comprehensive Market Strategy & Asset Allocation recommendation." }]);
    const response = await getTopMarketRecommendations(portfolio);
    setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  const handleSIPAnalysis = async () => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: "Analyze my current SIP investments and suggest rebalancing based on my risk profile and market conditions." }]);
    const response = await getSIPRebalancingAdvice(portfolio);
    setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Chat Area */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-wealth-navy rounded-2xl flex items-center justify-center text-white shadow-lg shadow-wealth-navy/20">
                <Bot size={28} />
              </div>
              <div>
                <h3 className="text-serif text-xl font-medium text-slate-900">RH Private Concierge</h3>
                <p className="text-[10px] text-wealth-emerald font-black uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-wealth-emerald rounded-full animate-pulse" />
                  Strategic Intelligence Active
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-full">
              <Shield size={12} className="text-amber-600" />
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">End-to-End Encrypted</span>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-95"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-wealth-navy'
                  }`}>
                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={`p-5 rounded-2xl leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none text-sm font-medium' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 text-serif text-base'
                  }`}>
                    <div className="markdown-body prose prose-slate prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-wealth-navy flex items-center justify-center shadow-sm">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                  <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-wealth-navy/30 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-wealth-navy/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-wealth-navy/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative"
            >
              <input 
                type="text" 
                placeholder="Inquire about your strategy, tax leakage, or market intelligence..."
                className="w-full pl-6 pr-14 py-4.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wealth-navy/10 focus:bg-white transition-all text-sm font-medium placeholder:text-slate-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3 bg-wealth-navy text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-wealth-navy transition-all shadow-lg shadow-wealth-navy/20"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6 overflow-y-auto pr-1">
          <div className="premium-card p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500" />
              Strategic Inquiries
            </h4>
            <div className="space-y-2.5">
              {[
                { label: 'SIP Velocity Analysis', icon: Zap, color: 'text-cyan-600', bg: 'bg-cyan-50', action: handleSIPAnalysis },
                { label: 'Market Alpha Strategy', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50', action: handleMarketStrategy },
                { label: 'Portfolio Rebalancing', icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50', action: handleRebalance },
                { label: 'Risk Exposure Audit', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50', action: handleRiskBasedRebalance },
                { label: 'Tax Saving Strategy', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', action: () => handleSend("How can I save more tax this year?") },
                { label: 'Estate Planning Guide', icon: ScrollText, color: 'text-violet-600', bg: 'bg-violet-50', action: () => handleSend("How can I start my estate planning and what documents do I need for a Will in India?") },
              ].map((item, idx) => (
                <button 
                  key={idx}
                  onClick={item.action}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl ${item.bg} ${item.color} text-[11px] font-black uppercase tracking-widest hover:brightness-95 transition-all text-left border border-transparent hover:border-current/10`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="premium-card p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <TrendingUp size={14} className="text-wealth-emerald" />
              Alpha Alerts
            </h4>
            <div className="space-y-3">
              <button 
                onClick={handleMarketStrategy}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-wealth-navy text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-wealth-navy/20"
              >
                <span>Generate Alpha Report</span>
                <Sparkles size={16} className="text-amber-400" />
              </button>
              
              <div className="pt-2 space-y-2.5">
                {portfolio.investments.filter(inv => inv.analysis?.recommendation === 'Buy' || inv.analysis?.recommendation === 'Exit').length > 0 ? (
                  portfolio.investments
                    .filter(inv => inv.analysis?.recommendation === 'Buy' || inv.analysis?.recommendation === 'Exit')
                    .slice(0, 3)
                    .map(inv => (
                      <div key={inv.id} className={`p-3.5 rounded-xl border flex items-center justify-between group transition-all ${
                        inv.analysis?.recommendation === 'Buy' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'
                      }`}>
                        <div>
                          <p className="text-serif text-sm font-medium text-slate-900 truncate max-w-[120px]">{inv.name}</p>
                          <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                            inv.analysis?.recommendation === 'Buy' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {inv.analysis?.recommendation} Signal
                          </p>
                        </div>
                        <button 
                          onClick={() => handleSend(`Tell me more about why I should ${inv.analysis?.recommendation.toLowerCase()} ${inv.name}.`)}
                          className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 group-hover:scale-110 transition-transform"
                        >
                          <ArrowUpRight size={14} className={inv.analysis?.recommendation === 'Buy' ? 'text-emerald-600' : 'text-rose-600'} />
                        </button>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">No high-conviction alerts detected. Run Alpha Strategy for macro insights.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-wealth-navy p-6 rounded-3xl text-white shadow-xl shadow-wealth-navy/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-serif text-lg font-medium">Market Pulse</h4>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Live Terminal Data</p>
              </div>
              <div className="w-2 h-2 bg-wealth-emerald rounded-full animate-pulse" />
            </div>
            <div className="space-y-5">
              {portfolio.marketIndices.map((index, idx) => (
                <div key={idx} className="flex justify-between items-center group">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest group-hover:text-white transition-colors">{index.name}</span>
                  <div className="text-right">
                    <p className="text-sm font-mono font-medium">{index.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    <p className={`text-[10px] font-black ${index.change >= 0 ? 'text-wealth-emerald' : 'text-rose-400'}`}>
                      {index.change >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
