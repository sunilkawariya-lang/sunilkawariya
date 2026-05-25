
import React, { useState, useMemo } from 'react';
import { Shield, Users, User, ArrowRight, CheckCircle2, Star, Info, Zap, Building2, Heart, ShieldCheck, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuoteParameter {
  type: 'individual' | 'family';
  planType: 'Health' | 'Term';
  age: number;
  gender: 'Male' | 'Female';
  smoker: boolean;
  sumAssured: number;
  familyMembers?: {
    spouse: boolean;
    children: number;
    parents: boolean;
  };
}

interface CompanyQuote {
  company: string;
  logo: string;
  planName: string;
  premium: number;
  rating: number;
  features: string[];
  claimSettlementRatio: string;
  hospitalNetwork?: string;
}

const COMPANIES = [
  { name: 'HDFC ERGO', color: 'text-blue-600', bg: 'bg-blue-50' },
  { name: 'Star Health', color: 'text-rose-600', bg: 'bg-rose-50' },
  { name: 'ICICI Lombard', color: 'text-orange-600', bg: 'bg-orange-50' },
  { name: 'Max Life', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { name: 'Niva Bupa', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { name: 'Care Health', color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

const InsuranceQuotes: React.FC = () => {
  const [params, setParams] = useState<QuoteParameter>({
    type: 'individual',
    planType: 'Health',
    age: 30,
    gender: 'Male',
    smoker: false,
    sumAssured: 500000,
    familyMembers: {
      spouse: false,
      children: 0,
      parents: false
    }
  });

  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const getQuotes = useMemo(() => {
    if (!showResult) return [];

    // Simulated logic to generate quotes based on params
    const baseMultiplier = params.planType === 'Health' ? 0.02 : 0.001;
    const ageFactor = 1 + (params.age - 18) * 0.05;
    const smokerFactor = params.smoker ? 1.5 : 1;
    
    let familyFactor = 1;
    if (params.type === 'family' && params.familyMembers) {
      if (params.familyMembers.spouse) familyFactor += 0.8;
      familyFactor += params.familyMembers.children * 0.4;
      if (params.familyMembers.parents) familyFactor += 1.5;
    }

    return COMPANIES.slice(0, 4).map((company, index) => {
      const premium = (params.sumAssured * baseMultiplier * ageFactor * smokerFactor * familyFactor * (0.9 + index * 0.1)) / 12;
      
      return {
        company: company.name,
        logo: company.bg,
        planName: `${company.name} ${params.planType} ${params.type === 'family' ? 'Family First' : 'Elite'}`,
        premium: Math.round(premium),
        rating: 4.5 - index * 0.2,
        claimSettlementRatio: `${95 + index}%`,
        hospitalNetwork: params.planType === 'Health' ? `${5000 + index * 1000}+` : undefined,
        features: params.planType === 'Health' 
          ? ['No Room Rent Limit', 'Pre-existing Cover after 2yrs', 'Restoration Benefit', 'Global Cover']
          : ['Critical Illness Rider', 'Waiver of Premium', 'Accidental Death Benefit', 'Terminal Illness Cover']
      };
    });
  }, [params, showResult]);

  const handleSearch = () => {
    setIsSearching(true);
    setShowResult(false);
    setTimeout(() => {
      setIsSearching(false);
      setShowResult(true);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Instant Insurance Quotes</h3>
              <p className="text-sm text-slate-500 font-medium">Compare plans from India's top insurers in seconds.</p>
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => { setParams({...params, planType: 'Health'}); setShowResult(false); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${params.planType === 'Health' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Health
            </button>
            <button 
              onClick={() => { setParams({...params, planType: 'Term'}); setShowResult(false); }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${params.planType === 'Term' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Term Life
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Inputs Column */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Coverage Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setParams({...params, type: 'individual'})}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${params.type === 'individual' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                >
                  <User size={18} />
                  <span className="text-sm font-bold">Individual</span>
                </button>
                <button 
                  onClick={() => setParams({...params, type: 'family'})}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${params.type === 'family' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                >
                  <Users size={18} />
                  <span className="text-sm font-bold">Family</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Eldest Member Age</label>
                <input 
                  type="number"
                  value={params.age}
                  onChange={(e) => setParams({...params, age: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block text-center">Sum Insured</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
                  value={params.sumAssured}
                  onChange={(e) => setParams({...params, sumAssured: Number(e.target.value)})}
                >
                  <option value={500000}>5 Lakhs</option>
                  <option value={1000000}>10 Lakhs</option>
                  <option value={2500000}>25 Lakhs</option>
                  <option value={5000000}>50 Lakhs</option>
                  <option value={10000000}>1 Crore</option>
                </select>
              </div>
            </div>

            {params.type === 'family' && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Family Members to Cover</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Spouse</span>
                    <input 
                      type="checkbox"
                      checked={params.familyMembers?.spouse}
                      onChange={(e) => setParams({...params, familyMembers: {...params.familyMembers!, spouse: e.target.checked}})}
                      className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Children</span>
                    <select 
                       value={params.familyMembers?.children}
                       onChange={(e) => setParams({...params, familyMembers: {...params.familyMembers!, children: Number(e.target.value)}})}
                       className="bg-white border border-slate-200 rounded-lg text-xs font-bold px-2 py-1 outline-none"
                    >
                      <option value={0}>None</option>
                      <option value={1}>1 Child</option>
                      <option value={2}>2 Children</option>
                      <option value={3}>3 Children</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Parents</span>
                    <input 
                      type="checkbox"
                      checked={params.familyMembers?.parents}
                      onChange={(e) => setParams({...params, familyMembers: {...params.familyMembers!, parents: e.target.checked}})}
                      className="w-5 h-5 rounded-lg border-slate-200 text-emerald-600 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSearching ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating Quotes...
                </>
              ) : (
                <>
                  Get Live Quotes
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {showResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Matched Plans for You</h4>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Showing top 4 results</span>
                  </div>
                  {getQuotes.map((quote, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${quote.logo}`}>
                              <Building2 size={24} className="text-slate-700" />
                            </div>
                            <div>
                              <h5 className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{quote.planName}</h5>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star size={12} className="text-amber-400 fill-amber-400" />
                                  <span className="text-[10px] font-bold text-slate-500">{quote.rating} Rating</span>
                                </div>
                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-500">{quote.claimSettlementRatio} Claim Ratio</span>
                                {quote.hospitalNetwork && (
                                  <>
                                    <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <span className="text-[10px] font-bold text-slate-500">{quote.hospitalNetwork} Hospitals</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {quote.features.map((feature, fidx) => (
                              <div key={fidx} className="flex items-center gap-2 bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100/50">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                <span className="text-[10px] font-bold text-slate-600">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="lg:text-right space-y-3 lg:border-l border-slate-100 lg:pl-10">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Premium</p>
                            <h4 className="text-3xl font-black text-slate-900">{formatCurrency(quote.premium)}</h4>
                            <p className="text-[10px] font-bold text-slate-400">Incl. GST @ 18%</p>
                          </div>
                          <button className="w-full lg:min-w-[140px] bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-[0.15em] hover:bg-emerald-700 transition-all shadow-sm">
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-start gap-4">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                      <Info size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-900 mb-1">Advisor's Insight</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        These are simulated quotes. Final premiums depend on medical outcomes and exact pincodes. 
                        We recommend {params.planType === 'Health' ? 'Comprehensive' : 'Term'} plans with {params.planType === 'Health' ? 'No Room Rent limits' : 'Critical Illness riders'} for your profile.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isSearching ? (
                <div className="h-full flex flex-col items-center justify-center p-12 space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-slate-100 rounded-full" />
                    <div className="w-24 h-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
                    <Shield className="absolute inset-0 m-auto text-emerald-500 animate-pulse" size={32} />
                  </div>
                  <div className="text-center space-y-2">
                    <h5 className="font-black text-slate-900 text-lg">Curating Best Plans</h5>
                    <p className="text-sm text-slate-400">Comparing 25+ insurers based on your parameters...</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-200 border-dashed rounded-[3rem] space-y-6">
                  <div className="p-6 bg-white rounded-full shadow-inner">
                    <Activity className="text-slate-300" size={48} />
                  </div>
                  <div className="text-center max-w-sm">
                    <h5 className="font-black text-slate-900 text-lg mb-2">Quote Engine Ready</h5>
                    <p className="text-sm text-slate-400">Set your parameters on the left and click "Get Live Quotes" to compare the best protection plans for your family.</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    {['Paperless Process', 'Instant Issuance', 'Expert Assistance', 'Claim Support'].map(t => (
                      <span key={t} className="text-[10px] font-bold px-3 py-1 bg-white text-slate-400 rounded-full border border-slate-200">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const Loader2: React.FC<{className?: string, size?: number}> = ({className, size=24}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`lucide lucide-loader-2 ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default InsuranceQuotes;
