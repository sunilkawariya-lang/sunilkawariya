
import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Search, Filter, Clock, ArrowRight, 
  Bookmark, Share2, Sparkles, TrendingUp, 
  ShieldCheck, Globe, Calculator, Landmark,
  GraduationCap, CreditCard, ScrollText, Briefcase,
  UserCheck, PlayCircle, Newspaper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type MediaCategory = 
  | 'All'
  | 'Personal Finance' 
  | 'Retirement Planning' 
  | 'Kids Education' 
  | 'Banking & Credit' 
  | 'EPFO & NPS' 
  | 'Global Investing' 
  | 'Tax & Estate' 
  | 'ESOPs' 
  | 'Investment Lessons';

interface Article {
  id: string;
  title: string;
  category: MediaCategory;
  summary: string;
  author: string;
  readTime: string;
  date: string;
  image: string;
  isPremium?: boolean;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Psychology of Money: Why We Save and Spend',
    category: 'Personal Finance',
    summary: 'Understanding the behavioral aspects of finance is more important than knowing the math. Explore how emotions drive our financial destiny.',
    author: 'Morgan Housel',
    readTime: '8 min',
    date: 'Oct 12, 2025',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    isPremium: false
  },
  {
    id: '2',
    title: 'Retiring at 45: The FIRE Movement in India',
    category: 'Retirement Planning',
    summary: 'A comprehensive guide on achieving Financial Independence and Retiring Early in the Indian context, considering inflation and healthcare.',
    author: 'Radhika Gupta',
    readTime: '12 min',
    date: 'Nov 05, 2025',
    image: 'https://images.unsplash.com/photo-1473186578172-c141e6798ee4?w=800&q=80',
    isPremium: true
  },
  {
    id: '3',
    title: 'Funding the Ivy League: Planning for Overseas Education',
    category: 'Kids Education',
    summary: 'How to build a corpus for your child\'s international education while managing currency risk and rising tuition costs.',
    author: 'Nilesh Shah',
    readTime: '10 min',
    date: 'Dec 15, 2025',
    image: 'https://images.unsplash.com/photo-1523050335102-c32509087440?w=800&q=80',
    isPremium: true
  },
  {
    id: '4',
    title: 'Maximizing Credit Card Rewards: The Ultimate Guide',
    category: 'Banking & Credit',
    summary: 'Learn how to stack rewards, use air miles, and choose the right cards for your lifestyle to save lakhs every year.',
    author: 'Pavan Kumar',
    readTime: '7 min',
    date: 'Jan 10, 2026',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
    isPremium: false
  },
  {
    id: '5',
    title: 'EPF vs VPF vs NPS: Which One Wins for You?',
    category: 'EPFO & NPS',
    summary: 'A detailed comparison of India\'s most popular retirement schemes to help you optimize your long-term savings.',
    author: 'Saurabh Mukherjea',
    readTime: '9 min',
    date: 'Feb 14, 2026',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    isPremium: false
  },
  {
    id: '6',
    title: 'Investing in the S&P 500 from India: A Step-by-Step Guide',
    category: 'Global Investing',
    summary: 'Diversify your portfolio geographically. Understand LRS limits, tax implications, and the best platforms for US investing.',
    author: 'Ankur Warikoo',
    readTime: '11 min',
    date: 'Mar 02, 2026',
    image: 'https://images.unsplash.com/photo-1611974717484-7da8c1746b62?w=800&q=80',
    isPremium: true
  },
  {
    id: '7',
    title: 'Will vs Trust: Protecting Your Legacy in India',
    category: 'Tax & Estate',
    summary: 'Everything you need to know about estate planning to ensure your wealth reaches your loved ones without legal hurdles.',
    author: 'Zia Mody',
    readTime: '15 min',
    date: 'Mar 20, 2026',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
    isPremium: true
  },
  {
    id: '8',
    title: 'The ESOP Goldmine: How to Handle Your Startup Equity',
    category: 'ESOPs',
    summary: 'From vesting to exercise and taxation, learn how to turn your paper wealth into real-world financial freedom.',
    author: 'Kunal Shah',
    readTime: '8 min',
    date: 'Apr 01, 2026',
    image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80',
    isPremium: true
  },
  {
    id: '9',
    title: 'Investment Lessons from Charlie Munger',
    category: 'Investment Lessons',
    summary: 'Timeless wisdom on mental models, multi-disciplinary thinking, and the art of sitting on your hands.',
    author: 'Warren Buffett',
    readTime: '14 min',
    date: 'Apr 05, 2026',
    image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
    isPremium: false
  }
];

const MediaSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: MediaCategory[] = [
    'All', 'Personal Finance', 'Retirement Planning', 'Kids Education', 
    'Banking & Credit', 'EPFO & NPS', 'Global Investing', 
    'Tax & Estate', 'ESOPs', 'Investment Lessons'
  ];

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter(article => {
      const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            article.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BookOpen className="text-indigo-600" />
            Wealth Media Center
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Curated insights, lessons, and guides from the world's best financial minds.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search articles, authors or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Article (only when 'All' is selected) */}
      {selectedCategory === 'All' && !searchQuery && (
        <div className="relative h-[400px] rounded-[3rem] overflow-hidden group cursor-pointer shadow-2xl">
          <img 
            src={ARTICLES[8].image} 
            alt="Featured" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-10 lg:p-12 space-y-4 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-wealth-gold text-wealth-navy text-[10px] font-bold rounded-full uppercase tracking-widest">
                Featured Lesson
              </span>
              <span className="text-white/60 text-xs font-medium flex items-center gap-2">
                <Clock size={14} />
                {ARTICLES[8].readTime} read
              </span>
            </div>
            <h3 className="text-4xl font-bold text-white leading-tight">
              {ARTICLES[8].title}
            </h3>
            <p className="text-slate-300 text-lg line-clamp-2">
              {ARTICLES[8].summary}
            </p>
            <button className="flex items-center gap-2 text-wealth-gold font-bold hover:gap-3 transition-all">
              Read Full Article
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                {article.isPremium && (
                  <div className="absolute top-4 left-4 bg-wealth-navy/80 backdrop-blur-md text-wealth-gold text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-wealth-gold/30">
                    <Sparkles size={12} />
                    PREMIUM
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
              </div>

              <div className="p-8 flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-3 text-slate-400">
                    <button className="hover:text-indigo-600 transition-colors"><Bookmark size={16} /></button>
                    <button className="hover:text-indigo-600 transition-colors"><Share2 size={16} /></button>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  {article.title}
                </h4>

                <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed flex-1">
                  {article.summary}
                </p>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                      {article.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{article.author}</p>
                      <p className="text-[10px] text-slate-400">{article.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Clock size={12} />
                    {article.readTime}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredArticles.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Newspaper size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">No articles found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Try adjusting your search or category filters to find what you're looking for.</p>
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="space-y-4 max-w-xl">
            <h3 className="text-3xl font-bold">Get the Weekly Wealth Digest</h3>
            <p className="text-slate-400">
              Join 50,000+ investors who receive our curated financial insights every Sunday morning. No spam, just pure value.
            </p>
          </div>
          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[300px]"
            />
            <button className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
              Subscribe Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaSection;
