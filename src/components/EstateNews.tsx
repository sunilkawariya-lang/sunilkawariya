
import React, { useState, useEffect } from 'react';
import { Newspaper, Sparkles, Loader2, ExternalLink, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { isCooldownActive, setCooldown, isQuotaExceededError, isMonthlyCapError, callAIWithRetry } from '../lib/quotaManager';
import { handleError, ErrorType, safeParse } from '../lib/errorHandler';

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  date: string;
  url: string;
  category: string;
}

const EstateNews: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackNews: NewsItem[] = [
    {
      title: "Supreme Court Clarifies Coparcenary Rights of Daughters",
      summary: "Recent rulings emphasize that daughters have equal rights in ancestral property regardless of when the father passed away, simplifying HUF successions.",
      source: "Legal Times",
      date: "March 2024",
      url: "#",
      category: "Legal"
    },
    {
      title: "New Digital Will Framework Proposed",
      summary: "Authorities are considering a legal framework for digital wills to simplify the process for tech-savvy investors and reduce physical documentation.",
      source: "Financial Express",
      date: "Feb 2024",
      url: "#",
      category: "Technology"
    },
    {
      title: "HUF Tax Benefits Under Scrutiny",
      summary: "Tax experts discuss potential changes in HUF tax treatment in upcoming budgets, advising families to review their current structures.",
      source: "Economic Times",
      date: "March 2024",
      url: "#",
      category: "Tax"
    },
    {
      title: "Estate Planning for NRIs: Key Considerations",
      summary: "New guidelines for NRIs inheriting property in India aim to streamline the process and clarify tax implications for cross-border successions.",
      source: "LiveMint",
      date: "Jan 2024",
      url: "#",
      category: "Succession"
    }
  ];

  const fetchNews = async () => {
    if (isCooldownActive()) {
      setNews(fallbackNews);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `
        As a financial news curator, provide 4 recent and relevant news summaries related to Estate Planning, Wills, Trusts, and HUFs in India.
        For each news item, provide:
        1. Title (Concise and engaging)
        2. Summary (2-3 sentences explaining the impact)
        3. Source (e.g., Economic Times, LiveMint, etc.)
        4. Date (Recent, e.g., March 2024 or similar)
        5. Category (e.g., Legal, Tax, Succession)
        
        Format the response as a JSON array of objects.
      `;

      const response = await callAIWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                source: { type: Type.STRING },
                date: { type: Type.STRING },
                category: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["title", "summary", "source", "date", "category"]
            }
          }
        }
      }));

      let jsonStr = response.text?.trim() || '[]';
      
      // Robust JSON extraction
      const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // Clean potential markdown blocks
      jsonStr = jsonStr
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '')
        .trim();

      const result = safeParse(jsonStr, []);
      
      if (Array.isArray(result) && result.length > 0) {
        setNews(result);
      } else {
        setNews(fallbackNews);
      }
    } catch (error: any) {
      if (isQuotaExceededError(error)) {
        setCooldown(isMonthlyCapError(error));
      }
      handleError(error, { type: ErrorType.API, title: 'Estate News Error', silent: true });
      // Fallback news
      setNews(fallbackNews);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm">
            <Newspaper size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Estate Planning News</h3>
            <p className="text-slate-500 text-sm">AI-curated updates on laws and regulations.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchNews()}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all disabled:opacity-50"
            title="Refresh News"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles size={12} />
            AI Curated
          </div>
        </div>
      </div>

      <div className="p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-slate-500 text-sm font-medium">Curating latest estate news...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {item.date}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-3">
                  {item.summary}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold text-slate-400 italic">Source: {item.source}</span>
                  <button className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors">
                    <ExternalLink size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
        <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2">
          View All News
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default EstateNews;
