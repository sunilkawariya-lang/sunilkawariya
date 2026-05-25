
import React, { useState } from 'react';
import { 
  UserCheck, Calendar, Clock, CreditCard, 
  ChevronRight, ArrowRight, Star, ShieldCheck, 
  Globe, TrendingUp, Zap, Target, 
  Calculator, ScrollText, Landmark, Briefcase,
  Sparkles, DollarSign, Building2, Heart,
  AlertCircle, CheckCircle2, Search, Filter, Layers,
  X, Play, MessageSquare, RefreshCw, Video, Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getCachedAccessToken, loginWithGoogle } from '../firebase';
import { createGoogleMeetSpace } from '../services/meetService';

type Category = 'Wealth Strategy' | 'Global & HNI' | 'Tax & Compliance' | 'Retirement & Legacy' | 'Life Transitions' | 'Protection & Credit' | 'Specialized Assets';

interface ConsultancyTopic {
  id: string;
  title: string;
  category: Category;
  description: string;
  price: number;
  duration: string;
  icon: any;
  features: string[];
}

const TOPICS: ConsultancyTopic[] = [
  // Wealth Strategy
  {
    id: 'portfolio-review',
    title: 'Comprehensive Portfolio Review',
    category: 'Wealth Strategy',
    description: 'Deep dive into your existing investments across all asset classes with risk-adjusted performance analysis.',
    price: 4999,
    duration: '60 mins',
    icon: TrendingUp,
    features: ['Performance Audit', 'Risk Assessment', 'Cost Analysis', 'Actionable Recommendations']
  },
  {
    id: 'asset-allocation',
    title: 'Strategic Asset Allocation',
    category: 'Wealth Strategy',
    description: 'Customized asset allocation strategy based on your risk profile and long-term financial goals.',
    price: 3499,
    duration: '45 mins',
    icon: Target,
    features: ['Model Portfolio', 'Diversification Strategy', 'Rebalancing Rules']
  },
  {
    id: 'rebalance-portfolio',
    title: 'Portfolio Rebalancing',
    category: 'Wealth Strategy',
    description: 'Tactical advice on rebalancing your portfolio to align with target allocations and market conditions.',
    price: 2499,
    duration: '30 mins',
    icon: Zap,
    features: ['Buy/Sell Triggers', 'Tax-efficient Rebalancing', 'Exit Strategies']
  },
  // Global & HNI
  {
    id: 'global-investment',
    title: 'Global Investment Strategy',
    category: 'Global & HNI',
    description: 'Expert guidance on investing outside India, LRS regulations, and global asset selection.',
    price: 7499,
    duration: '60 mins',
    icon: Globe,
    features: ['US Equity Access', 'LRS Compliance', 'Global ETF Selection', 'Currency Risk Management']
  },
  {
    id: 'gift-city',
    title: 'Invest in GIFT City',
    category: 'Global & HNI',
    description: 'Navigate the opportunities in India\'s first IFSC for offshore investments and tax benefits.',
    price: 5999,
    duration: '45 mins',
    icon: Building2,
    features: ['IFSC Fund Selection', 'Tax Advantages', 'Repatriation Rules']
  },
  {
    id: 'rsu-diversification',
    title: 'RSU & ESOP Diversification',
    category: 'Global & HNI',
    description: 'Strategic plan to manage and diversify concentrated stock positions from employee stock grants.',
    price: 6499,
    duration: '60 mins',
    icon: DollarSign,
    features: ['Tax Optimization', 'Vesting Schedule Analysis', 'Concentration Risk Mitigation']
  },
  {
    id: 'nri-assistance',
    title: 'Assistance for NRIs',
    category: 'Global & HNI',
    description: 'Specialized financial planning for NRIs including NRE/NRO management and repatriation.',
    price: 5499,
    duration: '60 mins',
    icon: Landmark,
    features: ['PIS Account Setup', 'DTAA Benefits', 'FEMA Compliance']
  },
  // Tax & Compliance
  {
    id: 'tax-planning',
    title: 'Advanced Tax Planning',
    category: 'Tax & Compliance',
    description: 'Optimize your tax liability through legal deductions, exemptions, and strategic investments.',
    price: 2999,
    duration: '45 mins',
    icon: Calculator,
    features: ['Section 80C/D Optimization', 'Capital Gains Planning', 'New vs Old Regime Analysis']
  },
  {
    id: 'schedule-fa',
    title: 'Schedule FA Filing Assistance',
    category: 'Tax & Compliance',
    description: 'Expert help in disclosing foreign assets (Schedule FA) in your Indian Income Tax Return.',
    price: 4499,
    duration: '45 mins',
    icon: ShieldCheck,
    features: ['Asset Valuation', 'Disclosure Compliance', 'Penalty Avoidance']
  },
  // Retirement & Legacy
  {
    id: 'estate-planning',
    title: 'Estate & Succession Planning',
    category: 'Retirement & Legacy',
    description: 'Ensure smooth transfer of wealth to the next generation through Wills, Trusts, and Nominations.',
    price: 8999,
    duration: '90 mins',
    icon: ScrollText,
    features: ['Will Drafting Guidance', 'Trust Structure Analysis', 'Inheritance Tax Optimization']
  },
  {
    id: 'nps-epf-vpf',
    title: 'Retirement Schemes (NPS/EPF)',
    category: 'Retirement & Legacy',
    description: 'Optimize your contributions to government retirement schemes for maximum corpus and tax benefits.',
    price: 1999,
    duration: '30 mins',
    icon: Landmark,
    features: ['NPS Tier I/II Strategy', 'VPF vs PPF', 'Withdrawal Rules']
  },
  // Life Transitions
  {
    id: 'job-transition',
    title: 'Career Transition Planning',
    category: 'Life Transitions',
    description: 'Financial roadmap for changing jobs, starting a business, or managing a period of unemployment.',
    price: 3999,
    duration: '60 mins',
    icon: Briefcase,
    features: ['Emergency Fund Sizing', 'Health Insurance Portability', 'Severance Management']
  },
  {
    id: 'moving-abroad',
    title: 'Moving Abroad Financial Prep',
    category: 'Life Transitions',
    description: 'Complete financial checklist before relocating to a new country.',
    price: 5999,
    duration: '60 mins',
    icon: Globe,
    features: ['Asset Liquidation/Retention', 'Tax Residency Status', 'Bank Account Conversion']
  },
  {
    id: 'divorce-settlement',
    title: 'Divorce Financial Planning',
    category: 'Life Transitions',
    description: 'Neutral financial analysis for asset division and post-divorce financial stability.',
    price: 9999,
    duration: '90 mins',
    icon: Heart,
    features: ['Asset Valuation', 'Alimony Analysis', 'Child Future Planning']
  },
  // Protection & Credit
  {
    id: 'insurance-audit',
    title: 'Insurance Portfolio Audit',
    category: 'Protection & Credit',
    description: 'Unbiased review of your life and health insurance to ensure adequate coverage without over-insuring.',
    price: 2499,
    duration: '45 mins',
    icon: ShieldCheck,
    features: ['Gap Analysis', 'Policy Comparison', 'Claim Process Guidance']
  },
  {
    id: 'pms-aif-etf',
    title: 'PMS, AIF & ETF Strategy',
    category: 'Specialized Assets',
    description: 'Expert selection and monitoring of high-ticket investment vehicles like PMS, AIFs, and specialized ETFs.',
    price: 4999,
    duration: '60 mins',
    icon: Layers,
    features: ['Due Diligence', 'Performance Comparison', 'Fee Structure Analysis']
  },
  {
    id: 'credit-card-optimization',
    title: 'Credit Card & Reward Strategy',
    category: 'Protection & Credit',
    description: 'Maximize your reward points, air miles, and lifestyle benefits through a curated credit card portfolio.',
    price: 1499,
    duration: '30 mins',
    icon: CreditCard,
    features: ['Card Selection', 'Reward Maximization', 'Fee Waiver Strategies']
  },
  {
    id: 'property-sell-plan',
    title: 'Real Estate Liquidation Plan',
    category: 'Life Transitions',
    description: 'Financial and tax planning for selling property, including capital gains reinvestment strategies.',
    price: 4499,
    duration: '45 mins',
    icon: Building2,
    features: ['Capital Gains Calculation', 'Section 54/54EC Advice', 'Reinvestment Options']
  },
  {
    id: 'home-loan-assistance',
    title: 'Home Loan & Mortgage Help',
    category: 'Protection & Credit',
    description: 'End-to-end assistance for home loan selection, balance transfer, and interest rate negotiation.',
    price: 2499,
    duration: '45 mins',
    icon: Landmark,
    features: ['Bank Comparison', 'Eligibility Check', 'Documentation Support']
  }
];

const ConsultancySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<ConsultancyTopic | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<'details' | 'schedule' | 'payment' | 'success'>('details');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [generatedMeetLink, setGeneratedMeetLink] = useState('');
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const categories: Category[] = [
    'Wealth Strategy', 'Global & HNI', 'Tax & Compliance', 
    'Retirement & Legacy', 'Life Transitions', 'Protection & Credit',
    'Specialized Assets'
  ];

  const filteredTopics = TOPICS.filter(topic => {
    const matchesCategory = selectedCategory === 'All' || topic.category === selectedCategory;
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBookNow = (topic: ConsultancyTopic) => {
    setSelectedTopic(topic);
    setBookingStep('details');
  };

  const handleConfirmBooking = () => {
    if (!bookingDate || !bookingTime) {
      toast.error("Please select a date and time for your session.");
      return;
    }
    setBookingStep('payment');
  };

  const handlePaymentSuccess = async () => {
    setIsCreatingMeet(true);
    let meetLink = "https://meet.google.com/abc-defg-hij"; // Default fallback
    
    try {
      const meetSpace = await createGoogleMeetSpace();
      meetLink = meetSpace.meetingLink;
      toast.success("Successfully generated your dynamic Google Meet room!");
    } catch (err: any) {
      console.warn("Could not create actual Google Meet space:", err);
      if (err.message === 'AUTH_REQUIRED' || err.message === 'AUTH_EXPIRED') {
        toast.error("Google account not linked or session expired. Booking with fallback video meeting link.");
      } else {
        toast.error(`Could not generate Google Meet link: ${err.message}. Fallback link has been generated.`);
      }
    } finally {
      setGeneratedMeetLink(meetLink);
      setIsCreatingMeet(false);
      setBookingStep('success');
      toast.success("Consultancy session booked successfully!");
    }
  };

  const handleConnectGoogleMeet = async () => {
    setIsConnectingGoogle(true);
    try {
      await loginWithGoogle();
      toast.success("Google account successfully connected with Google Meet permissions!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to authorize Google Meet scope.");
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const renderBookingModal = () => {
    if (!selectedTopic) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                <selectedTopic.icon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedTopic.title}</h2>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{selectedTopic.category}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedTopic(null)}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400"
            >
              <Zap size={20} className="rotate-45" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {bookingStep === 'details' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900">What's included in this session?</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTopic.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-sm text-slate-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" alt="Advisor" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Consultation with Senior Advisor</p>
                      <p className="text-xs text-slate-500">15+ Years of Experience in {selectedTopic.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Duration</p>
                    <p className="text-sm font-bold text-indigo-600">{selectedTopic.duration}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Consultancy Fee</p>
                    <p className="text-2xl font-bold text-slate-900">₹{selectedTopic.price.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => setBookingStep('schedule')}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                    Schedule Session
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 'schedule' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-600" />
                      Select Date
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(days => {
                        const date = new Date();
                        date.setDate(date.getDate() + days + 1);
                        const isSelected = bookingDate === date.toISOString().split('T')[0];
                        return (
                          <button
                            key={days}
                            onClick={() => setBookingDate(date.toISOString().split('T')[0])}
                            className={`p-3 rounded-2xl border transition-all text-center ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                            }`}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                              {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                            </p>
                            <p className="text-lg font-bold">{date.getDate()}</p>
                            <p className="text-[10px] font-medium">{date.toLocaleDateString('en-IN', { month: 'short' })}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Clock size={18} className="text-indigo-600" />
                      Select Time Slot (IST)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM'].map(time => {
                        const isSelected = bookingTime === time;
                        return (
                          <button
                            key={time}
                            onClick={() => setBookingTime(time)}
                            className={`p-3 rounded-2xl border transition-all font-bold text-sm ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setBookingStep('details')}
                    className="text-slate-500 font-bold text-sm hover:text-slate-700"
                  >
                    Back to Details
                  </button>
                  <button 
                    onClick={handleConfirmBooking}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                  >
                    Proceed to Payment
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {bookingStep === 'payment' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Booking Summary</p>
                      <h4 className="text-xl font-bold">{selectedTopic.title}</h4>
                    </div>
                    <div className="bg-white/10 p-2 rounded-xl">
                      <CreditCard size={20} className="text-indigo-400" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Date & Time</p>
                      <p className="text-sm font-bold">{new Date(bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {bookingTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total Amount</p>
                      <p className="text-xl font-bold text-emerald-400">₹{selectedTopic.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Google Meet Connection Status */}
                <div className="p-5 bg-indigo-50/80 rounded-3xl border border-indigo-100 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                  <div className="flex gap-3 items-start text-center sm:text-left">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl mt-0.5 shrink-0 mx-auto sm:mx-0">
                      <Video size={18} />
                    </div>
                    <div className="space-y-0.5">
                      <h5 className="text-sm font-bold text-slate-900">Google Meet Integration</h5>
                      <p className="text-[11.5px] text-slate-500 leading-relaxed">
                        {getCachedAccessToken() 
                          ? "Authorized! A dynamic premium video meeting workspace will be generated automatically." 
                          : "Connect your Google account to auto-generate an interactive live Meet space."}
                      </p>
                    </div>
                  </div>
                  {getCachedAccessToken() ? (
                    <div className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl whitespace-nowrap self-center">
                      Connected ✓
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGoogleMeet}
                      disabled={isConnectingGoogle}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 whitespace-nowrap self-center"
                    >
                      {isConnectingGoogle ? 'Linking...' : 'Link Account'}
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-700">Select Payment Method</p>
                  <div className="space-y-3">
                    {['UPI (GPay, PhonePe, Paytm)', 'Net Banking', 'Credit / Debit Card'].map((method, i) => (
                      <button 
                        key={i}
                        className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
                      >
                        <span className="font-bold text-slate-700">{method}</span>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button 
                    onClick={handlePaymentSuccess}
                    disabled={isCreatingMeet}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    {isCreatingMeet ? (
                      <>
                        <RefreshCw size={18} className="animate-spin text-white" />
                        Generating Live Google Meet Space...
                      </>
                    ) : (
                      `Pay ₹${selectedTopic.price.toLocaleString()} & Confirm Booking`
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-4 font-medium">
                    Secure 256-bit encrypted payment. 100% money-back guarantee if not satisfied.
                  </p>
                </div>
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    Your session for <strong>{selectedTopic.title}</strong> has been scheduled.
                  </p>
                </div>
                
                <div className="w-full bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Date:</span>
                    <span className="font-bold text-slate-900">{new Date(bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Time:</span>
                    <span className="font-bold text-slate-900">{bookingTime} (IST)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Meeting Link:</span>
                    <a 
                      href={generatedMeetLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
                    >
                      <Video size={14} className="text-indigo-500 shrink-0 animate-pulse" />
                      {generatedMeetLink.replace('https://', '')}
                    </a>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="bg-wealth-navy rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-wealth-gold/10 blur-[120px] rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-wealth-emerald/10 blur-[100px] rounded-full -ml-32 -mb-32" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-wealth-gold/20 border border-wealth-gold/30 rounded-full text-wealth-gold text-xs font-bold uppercase tracking-widest">
              <UserCheck size={14} />
              Expert Advisory
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Personalized Guidance from <span className="text-wealth-gold">Top Financial Minds</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
              Book one-on-one Expert Consultancy sessions with senior advisors for complex financial decisions, tax optimization, and global wealth management.
            </p>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Star className="text-wealth-gold fill-wealth-gold" size={18} />
                <span className="font-bold">4.9/5</span>
                <span className="text-slate-500 text-sm">User Rating</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-wealth-emerald" size={18} />
                <span className="font-bold">100%</span>
                <span className="text-slate-500 text-sm">Unbiased Advice</span>
              </div>
            </div>
            <div className="pt-4">
              <button 
                onClick={() => setIsMembershipModalOpen(true)}
                className="px-8 py-4 bg-wealth-gold text-wealth-navy font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-wealth-gold/20 flex items-center gap-3 group"
              >
                <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                Join RH Wealth Elite Membership
              </button>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="space-y-4 mt-8">
              <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] space-y-2">
                <Globe className="text-wealth-gold" size={24} />
                <h4 className="font-bold">Global Reach</h4>
                <p className="text-xs text-slate-400">Invest outside India with expert LRS guidance.</p>
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] space-y-2">
                <Calculator className="text-wealth-emerald" size={24} />
                <h4 className="font-bold">Tax Alpha</h4>
                <p className="text-xs text-slate-400">Advanced strategies to optimize your net take-home.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] space-y-2">
                <ShieldCheck className="text-indigo-400" size={24} />
                <h4 className="font-bold">Legacy Protection</h4>
                <p className="text-xs text-slate-400">Smooth wealth transfer and estate planning.</p>
              </div>
              <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] space-y-2">
                <Zap className="text-amber-400" size={24} />
                <h4 className="font-bold">Life Transitions</h4>
                <p className="text-xs text-slate-400">Navigate job changes, business starts & more.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === 'All' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Topics
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredTopics.map((topic, idx) => (
            <motion.div
              key={topic.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col"
            >
              <div className="p-8 flex-1 space-y-6">
                <div className="flex items-start justify-between">
                  <div className={`p-4 rounded-2xl bg-slate-50 text-slate-900 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500`}>
                    <topic.icon size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fee</p>
                    <p className="text-lg font-bold text-slate-900">₹{topic.price.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {topic.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {topic.features.slice(0, 2).map((f, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      {f}
                    </span>
                  ))}
                  {topic.features.length > 2 && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      +{topic.features.length - 2} More
                    </span>
                  )}
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 rounded-b-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Clock size={14} />
                  {topic.duration}
                </div>
                <button 
                  onClick={() => handleBookNow(topic)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 font-bold rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex items-center gap-2"
                >
                  Book Session
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredTopics.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Search size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">No matching topics found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Try a different search term or browse by category to find the right advisory session.</p>
          </div>
        </div>
      )}

      {/* Trust Banner */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-4">
          <h3 className="text-2xl font-bold text-slate-900">Why book a consultancy session?</h3>
          <p className="text-slate-500 leading-relaxed">
            While AI provides great data, complex financial decisions often require human empathy, deep regulatory knowledge, and nuanced understanding of your unique family situation.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <span className="text-sm font-bold text-slate-700">Conflict-Free</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <UserCheck size={18} />
              </div>
              <span className="text-sm font-bold text-slate-700">Expert Vetted</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-72 bg-slate-900 rounded-3xl p-8 text-white space-y-6">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Next Available Slot</p>
            <p className="text-xl font-bold">Today, 4:30 PM</p>
          </div>
          <button className="w-full py-3 bg-wealth-gold text-wealth-navy font-bold rounded-xl hover:bg-wealth-gold/90 transition-all">
            Quick Connect
          </button>
        </div>
      </div>

      {renderBookingModal()}
      
      {/* Membership Modal */}
      <AnimatePresence>
        {isMembershipModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh]"
            >
              {/* Left Side: Benefits */}
              <div className="lg:w-1/2 bg-wealth-navy p-10 lg:p-12 text-white relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-wealth-gold/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                
                <div className="relative z-10 space-y-8 flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-wealth-gold/20 border border-wealth-gold/30 rounded-full text-wealth-gold text-[10px] font-bold uppercase tracking-[0.2em]">
                    <Sparkles size={12} />
                    Elite Membership
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">RH Wealth <span className="text-wealth-gold">Elite</span></h2>
                    <p className="text-slate-400 text-sm">The ultimate financial companion for HNI families.</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: UserCheck, text: "Free Expert Calls on Demand" },
                      { icon: ScrollText, text: "Premium Articles & Monthly Magazine" },
                      { icon: Play, text: "Lifetime Masterclass & Webinar Access" },
                      { icon: MessageSquare, text: "Private Community Discussions" },
                      { icon: Target, text: "Free Investment & Goal Planning" },
                      { icon: ShieldCheck, text: "Free Estate & Portfolio Advisory" }
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-wealth-gold group-hover:scale-110 transition-transform">
                          <benefit.icon size={18} />
                        </div>
                        <span className="text-sm font-medium text-slate-200">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-wealth-navy overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i+20}`} alt="Member" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Joined by 200+ Elite Families</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Pricing */}
              <div className="lg:w-1/2 p-10 lg:p-12 flex flex-col">
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={() => setIsMembershipModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 space-y-8">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Choose Your Plan</h3>
                    <p className="text-slate-500 text-sm">Start with 1 month free access today.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Monthly Plan */}
                    <button className="w-full p-6 rounded-3xl border-2 border-slate-100 hover:border-indigo-600 transition-all text-left group relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Plan</p>
                          <h4 className="text-2xl font-bold text-slate-900">₹1,000<span className="text-sm text-slate-400 font-medium">/mo</span></h4>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-3 font-medium flex items-center gap-2">
                        <RefreshCw size={12} className="text-indigo-500" />
                        Auto-debit enabled
                      </p>
                    </button>

                    {/* Yearly Plan */}
                    <button className="w-full p-6 rounded-3xl border-2 border-indigo-600 bg-indigo-50/30 transition-all text-left group relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-4 py-1 rounded-bl-2xl uppercase tracking-widest">
                        Best Value
                      </div>
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Yearly Plan</p>
                          <h4 className="text-2xl font-bold text-slate-900">₹10,000<span className="text-sm text-slate-400 font-medium">/yr</span></h4>
                          <p className="text-[10px] text-emerald-600 font-bold mt-1">SAVE ₹2,000 PER YEAR</p>
                        </div>
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Special Launch Offer</p>
                      <p className="text-[10px] text-emerald-700 font-medium">Get your first month completely FREE. No commitment.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  <button 
                    onClick={() => {
                      toast.success("Welcome to RH Wealth Elite!");
                      setIsMembershipModalOpen(false);
                    }}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Start 1 Month Free Trial
                  </button>
                  <p className="text-[10px] text-slate-400 text-center font-medium">
                    By joining, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConsultancySection;
