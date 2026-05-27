/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Target, 
  Calculator, 
  Sparkles, 
  TrendingUp,
  TrendingDown,
  Menu,
  X,
  ChevronRight,
  IndianRupee,
  LogOut,
  LogIn,
  RefreshCw, 
  Zap,
  Landmark,
  ShoppingBag,
  Briefcase,
  Brain,
  CreditCard,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_PORTFOLIO } from './constants';
import { PortfolioState, FamilyMember } from './types';
import Dashboard from './components/Dashboard';
import PortfolioTracker from './components/PortfolioTracker';
import GoalPlanner from './components/GoalPlanner';
import TaxPlanner from './components/TaxPlanner';
import AIAdvisor from './components/AIAdvisor';
import PortfolioInsight from './components/PortfolioInsight';
import InvestmentImportModal from './components/InvestmentImportModal';
import NewsSection from './components/NewsSection';
import RiskAssessmentModal from './components/RiskAssessmentModal';
import EstatePlanning from './components/EstatePlanning';
import IPSPolicy from './components/IPSPolicy';
import EmergencyFundModal from './components/EmergencyFundModal';
import InsuranceManager from './components/InsuranceManager';
import PortfolioSummary from './components/PortfolioSummary';
import Reports from './components/Reports';
import SavingsPlanner from './components/SavingsPlanner';
import RetirementPlanner from './components/RetirementPlanner';
import WelcomeModal from './components/WelcomeModal';
import ErrorBoundary from './components/ErrorBoundary';
import MemberSelector from './components/MemberSelector';
import FamilyMemberModal from './components/FamilyMemberModal';
import BankAccountManager from './components/BankAccountManager';
import { updatePortfolioPrices, updateMarketIndices } from './services/livePriceService';
import { Newspaper, ShieldCheck, ScrollText, Shield, Activity, ChevronLeft, ChevronRight as ChevronRightIcon, PieChart as PieChartIcon, FileText, MessageSquare, UserCheck, BookOpen } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import LiabilityManager from './components/LiabilityManager';
import FinancialCalculators from './components/FinancialCalculators';
import SafeVault from './components/SafeVault';
import MeetingDiscussions from './components/MeetingDiscussions';
import PortfolioRefiner from './components/PortfolioRefiner';
import WalletComponent from './components/Wallet';
import { RebalancingModal } from './components/RebalancingModal';
import InvestmentModal from './components/InvestmentModal';
import InvestmentBaskets from './components/InvestmentBaskets';
import ConsultancySection from './components/ConsultancySection';
import MediaSection from './components/MediaSection';
import FinanceIntelligence from './components/FinanceIntelligence';
import WealthServices from './components/WealthServices';
import QuickPayments from './components/QuickPayments';
import Backoffice from './components/Backoffice';
import ChatBot from './components/ChatBot';
import StrategicRoadmap from './components/StrategicRoadmap';
import GoalModal from './components/GoalModal';
import { useFirebase } from './contexts/FirebaseContext';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import GoogleVerification from './components/GoogleVerification';
import PMSBasketLogo from './components/PMSBasketLogo';

type Tab = 'dashboard' | 'portfolio' | 'goals' | 'tax' | 'ai' | 'portfolio-insight' | 'portfolio-refinement' | 'wallet' | 'news' | 'estate' | 'insurance' | 'summary' | 'reports' | 'financial-plan' | 'savings' | 'liability' | 'calculators' | 'retirement' | 'ips' | 'bank-accounts' | 'vault' | 'discussions' | 'investment-baskets' | 'consultancy' | 'media' | 'finance-intelligence' | 'wealth-services' | 'quick-payments' | 'backoffice' | 'privacy-policy' | 'terms-of-service' | 'google-verification';

export default function App() {
  const { 
    user, loading, portfolio, setPortfolio, login, logout,
    updateRiskProfile, updateEmergencyFund, addInvestment, updateInvestment, deleteInvestment,
    addGoal, updateGoal, deleteGoal, addInsurance, updateInsurance, deleteInsurance,
    updateEstatePlanning,
    addTransaction, addBankAccount, addSnapshot,
    localDataToMigrate, migrateLocalData, dismissMigration,
    setSelectedMemberId, addFamilyMember, updateFamilyMember, persistMarketIndices, updateLastRefresh
  } = useFirebase();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const portfolioRef = React.useRef(portfolio);
  
  // Keep ref in sync with state
  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isRebalancingModalOpen, setIsRebalancingModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [prefilledInvestment, setPrefilledInvestment] = useState<any>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | undefined>(undefined);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [currentIndexPage, setCurrentIndexPage] = useState(0);
  const [unauthLegalTab, setUnauthLegalTab] = useState<'privacy' | 'terms' | null>(null);

  // Filtered Portfolio based on selected member
  const filteredPortfolio = useMemo(() => {
    const memberId = portfolio.selectedMemberId;
    
    if (memberId === 'family') {
      // For family view, we aggregate or pick primary member's profiles
      return {
        ...portfolio,
        // Investments, goals, etc. are already lists, so we use them as is for consolidated view
        // For single-object profiles, we aggregate or pick the first one
        taxProfile: {
          ...(portfolio.taxProfiles[0] || DEFAULT_PORTFOLIO.taxProfile),
          totalTaxPayable: portfolio.taxProfiles.reduce((sum, p) => sum + (p?.totalTaxPayable || 0), 0),
          investments80C: portfolio.taxProfiles.reduce((sum, p) => sum + (p?.investments80C || 0), 0),
          medicalInsurance80D: portfolio.taxProfiles.reduce((sum, p) => sum + (p?.medicalInsurance80D || 0), 0),
          otherDeductions: portfolio.taxProfiles.flatMap(p => p?.otherDeductions || []),
          capitalGains: portfolio.taxProfiles.flatMap(p => p?.capitalGains || []),
        },
        riskProfile: portfolio.riskProfiles[0] || DEFAULT_PORTFOLIO.riskProfile, 
        emergencyFund: {
          ...(portfolio.emergencyFunds[0] || DEFAULT_PORTFOLIO.emergencyFund),
          currentAmount: portfolio.emergencyFunds.reduce((sum, f) => sum + (f.currentAmount || 0), 0),
          monthlyExpense: portfolio.emergencyFunds.reduce((sum, f) => sum + (f.monthlyExpense || 0), 0),
        },
        estatePlanning: portfolio.estatePlannings[0] || DEFAULT_PORTFOLIO.estatePlanning,
        ipsPolicy: portfolio.ipsPolicies[0] || DEFAULT_PORTFOLIO.ipsPolicy,
        financialPlan: portfolio.financialPlans?.['family'] || portfolio.financialPlan,
      };
    }

    return {
      ...portfolio,
      investments: portfolio.investments.filter(i => i.memberId === memberId),
      goals: portfolio.goals.filter(g => g.memberId === memberId),
      expenses: portfolio.expenses.filter(e => e.memberId === memberId),
      incomes: portfolio.incomes.filter(i => i.memberId === memberId),
      transactions: portfolio.transactions.filter(t => t.memberId === memberId),
      insurances: portfolio.insurances.filter(i => i.memberId === memberId),
      liabilities: portfolio.liabilities.filter(l => l.memberId === memberId),
      bankAccounts: portfolio.bankAccounts.filter(b => b.memberId === memberId),
      // For single-object profiles, we find the one for the member or return a default
      taxProfile: portfolio.taxProfiles.find(p => p.memberId === memberId) || portfolio.taxProfiles[0] || DEFAULT_PORTFOLIO.taxProfile,
      riskProfile: portfolio.riskProfiles.find(p => p.memberId === memberId) || portfolio.riskProfiles[0] || DEFAULT_PORTFOLIO.riskProfile,
      emergencyFund: portfolio.emergencyFunds.find(f => f.memberId === memberId) || portfolio.emergencyFunds[0] || DEFAULT_PORTFOLIO.emergencyFund,
      estatePlanning: portfolio.estatePlannings.find(p => p.memberId === memberId) || portfolio.estatePlannings[0] || DEFAULT_PORTFOLIO.estatePlanning,
      ipsPolicy: portfolio.ipsPolicies.find(p => p.memberId === memberId) || portfolio.ipsPolicies[0] || DEFAULT_PORTFOLIO.ipsPolicy,
      financialPlan: portfolio.financialPlans?.[memberId] || (memberId === 'm1' ? portfolio.financialPlan : undefined),
    };
  }, [portfolio]);

  // Auto-Snapshot Logic
  useEffect(() => {
    if (!user || loading) return;

    const checkAndTakeSnapshot = async () => {
      const today = new Date().toISOString().split('T')[0];
      const hasTodaySnapshot = portfolio.historicalSnapshots.some(s => s.date === today);
      
      if (!hasTodaySnapshot && portfolio.investments.length > 0) {
        const totalValue = portfolio.investments.reduce((sum, i) => sum + i.currentValue, 0);
        const investedValue = portfolio.investments.reduce((sum, i) => sum + i.investedValue, 0);
        
        const categoryValues: Record<string, number> = {};
        portfolio.investments.forEach(inv => {
          categoryValues[inv.category] = (categoryValues[inv.category] || 0) + inv.currentValue;
        });

        await addSnapshot({
          date: today,
          totalValue,
          investedValue,
          categoryValues
        });
        console.log("Auto-snapshot taken for", today);
      }
    };

    checkAndTakeSnapshot();
  }, [user, loading, portfolio.historicalSnapshots.length, portfolio.investments.length, addSnapshot]);

  // Live Price Polling
  const pollPrices = async (force = false) => {
    if (isLiveUpdating) return;
    setIsLiveUpdating(true);
    try {
      const currentPortfolio = portfolioRef.current;
      
      // If it's a new day, we automatically force a refresh to satisfy "daily update" requirement
      const today = new Date().toISOString().split('T')[0];
      const lastRefreshDay = currentPortfolio.lastMarketRefresh?.split('T')[0];
      const finalForce = force || (lastRefreshDay !== today);

      const [updatedInvestments, updatedIndices] = await Promise.all([
        updatePortfolioPrices(currentPortfolio.investments, finalForce),
        updateMarketIndices(currentPortfolio.marketIndices, finalForce)
      ]);
      
      const refreshTimestamp = new Date().toISOString();
      
      // Update each investment in Firebase if forced or if there's a change and user is logged in
      if (user && (finalForce || updatedInvestments.some(inv => {
        const original = currentPortfolio.investments.find(i => i.id === inv.id);
        return original && (original.price !== inv.price);
      }))) {
        await Promise.all(updatedInvestments.map(async (inv) => {
          const original = currentPortfolio.investments.find(i => i.id === inv.id);
          if (original && (original.price !== inv.price || original.return1Y !== inv.return1Y)) {
            await updateInvestment(inv);
          }
        }));
        await persistMarketIndices(updatedIndices);
        await updateLastRefresh(refreshTimestamp);
      }

      setPortfolio(prev => {
        const updatedMap = new Map(updatedInvestments.map(inv => [inv.id, inv]));
        const mergedInvestments = prev.investments.map(inv => {
          const updated = updatedMap.get(inv.id);
          return updated ? { ...inv, ...updated } : inv;
        });
        
        return {
          ...prev,
          investments: mergedInvestments,
          marketIndices: updatedIndices,
          lastMarketRefresh: finalForce ? refreshTimestamp : prev.lastMarketRefresh
        };
      });

      if (force) {
        toast.success('Market data refreshed successfully');
      } else if (finalForce) {
        console.log("Daily market data auto-refresh completed");
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes("503") || errorMessage.includes("demand") || errorMessage.includes("UNAVAILABLE")) {
        toast.error('Market data provider is under high load. Retrying in background...');
      } else {
        console.error("Failed to update live prices:", error);
      }
    } finally {
      setTimeout(() => setIsLiveUpdating(false), 1000);
    }
  };

  useEffect(() => {
    if (loading) return;
    
    const interval = setInterval(() => pollPrices(false), 900000); 
    pollPrices(); 
    return () => clearInterval(interval);
  }, [loading, user]);

  // Expose manual refresh to window
  React.useEffect(() => {
    (window as any).refreshMarketData = pollPrices;
    return () => { delete (window as any).refreshMarketData; };
  }, []);

  // Auto-rotate market indices in header
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndexPage(prev => (prev + 1) % portfolio.marketIndices.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [portfolio.marketIndices.length]);

  // Expose modal triggers to window for access from other components
  React.useEffect(() => {
    (window as any).openCASModal = () => setIsImportModalOpen(true);
    (window as any).openRiskModal = () => setIsRiskModalOpen(true);
    (window as any).openEmergencyModal = () => setIsEmergencyModalOpen(true);
    (window as any).openRebalancingModal = () => setIsRebalancingModalOpen(true);
    (window as any).openInvestmentModal = (data?: any) => {
      setPrefilledInvestment(data || null);
      setIsInvestmentModalOpen(true);
    };
    (window as any).openGoalModal = (data?: any) => {
      setEditingGoal(data || null);
      setIsGoalModalOpen(true);
    };
    (window as any).setActiveTab = (tab: Tab) => setActiveTab(tab);
    return () => { 
      delete (window as any).openCASModal; 
      delete (window as any).openRiskModal;
      delete (window as any).openEmergencyModal;
      delete (window as any).openRebalancingModal;
      delete (window as any).openInvestmentModal;
      delete (window as any).openGoalModal;
      delete (window as any).setActiveTab;
    };
  }, []);

  // Support direct hash routing for Google Verification crawlers of Privacy Policy and Terms
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/privacy-policy') {
        if (user) {
          setActiveTab('privacy-policy');
        } else {
          setUnauthLegalTab('privacy');
        }
      } else if (hash === '#/terms-of-service') {
        if (user) {
          setActiveTab('terms-of-service');
        } else {
          setUnauthLegalTab('terms');
        }
      } else if (hash === '#/google-verification') {
        if (user) {
          setActiveTab('google-verification');
        }
      }
    };

    // Check on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const handleImportInvestments = async (newInvestments: any[], clearExisting?: boolean) => {
    try {
      setIsLiveUpdating(true);
      if (clearExisting) {
        // Delete all existing investments
        await Promise.all(portfolio.investments.map(inv => deleteInvestment(inv.id)));
      }
      
      // Batch add investments
      await Promise.all(newInvestments.map(inv => addInvestment(inv)));
      
      // Briefly wait and refresh prices for new items
      setTimeout(() => pollPrices(true), 1500);
      toast.success(`Successfully imported ${newInvestments.length} investments`);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import some investments");
    } finally {
      setIsLiveUpdating(false);
    }
  };

  const handleImportTransactions = async (newTransactions: any[]) => {
    await Promise.all(newTransactions.map(tx => addTransaction(tx)));
  };

  const handleImportBankAccounts = async (newAccounts: any[]) => {
    await Promise.all(newAccounts.map(acc => addBankAccount(acc)));
  };

  const handleImportInsurance = async (newPolicies: any[]) => {
    await Promise.all(newPolicies.map(ins => addInsurance(ins)));
  };

  const handleSaveRiskProfile = async (profile: any) => {
    await updateRiskProfile(profile);
  };

  const handleSaveGoal = async (goal: any) => {
    const exists = portfolio.goals.find(g => g.id === goal.id);
    const goalLabel = goal.name || 'Strategic Goal';
    try {
      if (exists) {
        await updateGoal(goal);
        toast.success(`Strategic goal "${goalLabel}" has been successfully updated!`);
      } else {
        await addGoal(goal);
        toast.success(`Strategic goal "${goalLabel}" has been successfully published!`);
      }
    } catch (err: any) {
      toast.error(`Failed to publish strategic goal: ${err.message || err || 'Unknown error'}`);
    }
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  const handleSaveEmergencyFund = async (fund: any) => {
    await updateEmergencyFund(fund);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading your wealth dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-wealth-navy flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-wealth-emerald/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-wealth-gold/10 rounded-full blur-[120px]" />
        
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative z-10">
          {/* Left Side: Benefits */}
          <div className="p-12 lg:p-16 bg-gradient-to-br from-white/10 to-transparent border-r border-white/5 hidden lg:block">
            <div className="flex items-center gap-3 mb-12">
              <PMSBasketLogo iconOnly size={42} />
              <span className="font-bold text-2xl tracking-tight text-white">
                PMS <span className="text-wealth-gold font-light">Basket</span>
              </span>
            </div>

            <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
              Elevate Your Wealth with <br />
              <span className="text-wealth-gold">Institutional Grade</span> Management
            </h2>

            <div className="space-y-8">
              {[
                { icon: UserCheck, title: "Advisor Involved", desc: "Expert human-led guidance for your complex wealth journey." },
                { icon: Target, title: "Goal-Based Investing", desc: "Every fund selected is mapped to your specific life milestones." },
                { icon: PieChartIcon, title: "Portfolio Planning", desc: "Bespoke asset allocation strategies tailored to your risk profile." },
                { icon: Activity, title: "Ongoing Monitoring", desc: "24/7 tracking of your global assets with real-time alerts." },
                { icon: RefreshCw, title: "Regular Rebalancing", desc: "Automated triggers to keep your strategy on track during market shifts." },
                { icon: ShieldCheck, title: "Behavioral Guidance", desc: "Logic-driven support to prevent emotional decisions during volatility." }
              ].map((benefit, i) => (
                <motion.div 
                  key={benefit.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/10 text-wealth-gold">
                    <benefit.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm mb-1">{benefit.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Side: Login Action */}
          <div className="p-12 lg:p-16 flex flex-col justify-center items-center text-center">
            <div className="lg:hidden flex items-center gap-3 mb-12">
              <PMSBasketLogo iconOnly size={42} />
              <span className="font-bold text-2xl tracking-tight text-white">
                PMS <span className="text-wealth-gold font-light">Basket</span>
              </span>
            </div>

            <PMSBasketLogo size={130} className="mb-8 select-none" />
            
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 mb-12 leading-relaxed text-sm font-medium max-w-xs">
              Securely access your private vault and manage your global wealth portfolio.
            </p>
            
            <button 
              onClick={login}
              className="w-full max-w-sm bg-white text-wealth-navy py-5 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group"
            >
              <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
              Access Private Vault
            </button>

            <div className="mt-12 pt-8 border-t border-white/5 w-full max-w-xs">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-wealth-navy bg-slate-800 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Trusted by 500+ HNI Families</p>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-4">
                Institutional Grade Security • 256-bit Encryption
              </p>
              
              <div className="flex justify-center items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-4 border-t border-white/5">
                <a 
                  href="#/privacy-policy"
                  onClick={() => setUnauthLegalTab('privacy')}
                  className="hover:text-wealth-gold hover:underline transition-colors cursor-pointer"
                >
                  Privacy Policy
                </a>
                <span className="text-slate-600 font-normal select-none">•</span>
                <a 
                  href="#/terms-of-service"
                  onClick={() => setUnauthLegalTab('terms')}
                  className="hover:text-wealth-gold hover:underline transition-colors cursor-pointer"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal/Disclosure Overlay Modals for Public Homepage Access */}
        {unauthLegalTab && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {unauthLegalTab === 'privacy' ? 'Privacy Policy Disclosure' : 'Terms of Service Agreement'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Official regulatory document for member trust & safety</p>
                </div>
                <button 
                  onClick={() => setUnauthLegalTab(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar">
                {unauthLegalTab === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                <button 
                  onClick={() => setUnauthLegalTab(null)}
                  className="px-6 py-2.5 bg-wealth-navy hover:bg-wealth-navy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Close & Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  const navSections = [
    {
      title: 'Command Center',
      items: [
        { id: 'dashboard', label: 'Wealth Pulse', icon: LayoutDashboard },
        { id: 'goals', label: 'Strategic Goals', icon: Target },
        { id: 'reports', label: 'Executive Reports', icon: FileText },
        { id: 'financial-plan', label: 'Wealth Roadmap', icon: Sparkles },
      ]
    },
    {
      title: 'Asset Management',
      items: [
        { id: 'portfolio', label: 'Investment Vault', icon: Wallet },
        { id: 'investment-baskets', label: 'Investment Baskets', icon: ShoppingBag },
        { id: 'bank-accounts', label: 'Bank Accounts', icon: Landmark },
        { id: 'summary', label: 'Asset Allocation', icon: PieChartIcon },
        { id: 'insurance', label: 'Risk Protection', icon: Shield },
        { id: 'liability', label: 'Debt Optimization', icon: Landmark },
      ]
    },
    {
      title: 'Strategic Planning',
      items: [
        { id: 'ips', label: 'IPS Policy', icon: Shield },
        { id: 'retirement', label: 'Legacy Planning', icon: TrendingUp },
        { id: 'savings', label: 'Capital Allocation', icon: IndianRupee },
        { id: 'tax', label: 'Tax Optimization', icon: Calculator },
        { id: 'estate', label: 'Estate & Wills', icon: ScrollText },
      ]
    },
    {
      title: 'Wealth Solutions',
      items: [
        { id: 'wealth-services', label: 'Investment Services', icon: Briefcase },
        { id: 'investment-baskets', label: 'Investment Baskets', icon: ShoppingBag },
        { id: 'quick-payments', label: 'Payment Portal', icon: CreditCard },
      ]
    },
    {
      title: 'Governance',
      items: [
        { id: 'vault', label: 'Safe Vault', icon: ShieldCheck },
        { id: 'discussions', label: 'Meetings', icon: MessageSquare },
      ]
    },
    {
      title: 'Expert Advisory',
      items: [
        { id: 'consultancy', label: 'Expert Consultancy', icon: UserCheck },
        { id: 'media', label: 'Wealth Media', icon: BookOpen },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { id: 'ai', label: 'RH AI Advisor', icon: Sparkles },
        { 
          id: 'wallet', 
          label: 'RH Wallet', 
          icon: Wallet,
          badge: '10% Bonus'
        },
        { id: 'portfolio-refinement', label: 'Composition Refiner', icon: Brain },
        { id: 'portfolio-insight', label: 'Alpha Insights', icon: TrendingUp },
        { id: 'finance-intelligence', label: 'Wealth Academy', icon: Brain },
        { id: 'calculators', label: 'Precision Tools', icon: Calculator },
        { id: 'news', label: 'Global Markets', icon: Newspaper },
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'backoffice', label: 'Master Backoffice', icon: Shield },
        { id: 'google-verification', label: 'Google Verification', icon: ShieldCheck },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard portfolio={filteredPortfolio} isRefreshing={isLiveUpdating} onRefresh={() => pollPrices(true)} />;
      case 'summary': return <PortfolioSummary portfolio={filteredPortfolio} />;
      case 'investment-baskets': return <InvestmentBaskets portfolio={filteredPortfolio} />;
      case 'reports': return <Reports portfolio={filteredPortfolio} />;
      case 'financial-plan': return <StrategicRoadmap portfolio={filteredPortfolio} />;
      case 'savings': return <SavingsPlanner portfolio={filteredPortfolio} setPortfolio={setPortfolio} />;
      case 'portfolio': return <PortfolioTracker portfolio={filteredPortfolio} setPortfolio={setPortfolio} isRefreshing={isLiveUpdating} onRefresh={() => pollPrices(true)} />;
      case 'goals': return <GoalPlanner portfolio={filteredPortfolio} setPortfolio={setPortfolio} />;
      case 'tax': return <TaxPlanner portfolio={filteredPortfolio} setPortfolio={setPortfolio} />;
      case 'liability': return <LiabilityManager portfolio={filteredPortfolio} />;
      case 'bank-accounts': return <BankAccountManager />;
      case 'insurance': return <InsuranceManager portfolio={filteredPortfolio} setPortfolio={setPortfolio} />;
      case 'estate': return <EstatePlanning portfolio={filteredPortfolio} setPortfolio={setPortfolio} />;
      case 'ips': return <IPSPolicy />;
      case 'vault': return <SafeVault />;
      case 'discussions': return <MeetingDiscussions />;
      case 'retirement': return <RetirementPlanner portfolio={filteredPortfolio} setPortfolio={setPortfolio} updateInvestment={updateInvestment} />;
      case 'news': return <NewsSection portfolio={filteredPortfolio} />;
      case 'ai': return <AIAdvisor portfolio={filteredPortfolio} />;
      case 'portfolio-insight': return <PortfolioInsight portfolio={filteredPortfolio} />;
      case 'portfolio-refinement': return <PortfolioRefiner portfolio={filteredPortfolio} />;
      case 'wallet': return <WalletComponent />;
      case 'finance-intelligence': return <FinanceIntelligence />;
      case 'wealth-services': return <WealthServices />;
      case 'quick-payments': return <QuickPayments />;
      case 'calculators': return <FinancialCalculators portfolio={filteredPortfolio} />;
      case 'consultancy': return <ConsultancySection />;
      case 'media': return <MediaSection />;
      case 'privacy-policy': return <PrivacyPolicy />;
      case 'terms-of-service': return <TermsOfService />;
      case 'google-verification': return <GoogleVerification />;
      case 'backoffice':
        return (
          <Backoffice 
            activities={portfolio.userActivities || []}
            securityLogs={portfolio.securityLogs || []}
            complianceChecks={portfolio.complianceChecks || []}
          />
        );
      default: return <Dashboard portfolio={filteredPortfolio} />;
    }
  };

  return (
    <div className="min-h-screen bg-wealth-paper text-wealth-ink font-sans flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-20'
        } bg-white border-r border-slate-200/60 transition-all duration-500 flex flex-col sticky top-0 h-screen z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        <div className={`p-6 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-3">
            <PMSBasketLogo iconOnly size={38} className="shrink-0" />
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold text-xl tracking-tight text-slate-800 whitespace-nowrap flex items-center"
              >
                PMS <span className="text-[#3E8043] ml-1 font-black">Basket</span>
              </motion.span>
            )}
          </div>
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-wealth-navy"
            >
              <X size={20} />
            </button>
          )}
          {!isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="absolute -right-3 top-8 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-400 hover:text-wealth-navy hover:scale-110 transition-all z-30"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        <nav className={`flex-1 ${isSidebarOpen ? 'px-6' : 'px-3'} space-y-8 mt-4 overflow-y-auto custom-scrollbar`}>
          {navSections.map((section) => (
            <div key={section.title} className="space-y-3">
              {isSidebarOpen ? (
                <h3 className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                  {section.title}
                </h3>
              ) : (
                <div className="h-px bg-slate-100 mx-2" />
              )}
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    title={!isSidebarOpen ? item.label : ''}
                    className={`w-full flex items-center transition-all duration-300 group relative ${
                      isSidebarOpen ? 'gap-4 px-4 py-3 rounded-2xl' : 'justify-center p-3 rounded-xl'
                    } ${
                      activeTab === item.id 
                        ? 'bg-wealth-navy text-white font-semibold shadow-xl shadow-slate-200 translate-x-1' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-wealth-navy hover:translate-x-1'
                    }`}
                  >
                    <item.icon 
                      size={20} 
                      className={`${activeTab === item.id ? 'text-wealth-gold' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all'}`} 
                    />
                    {isSidebarOpen && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm tracking-tight whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {isSidebarOpen && (item as any).badge && activeTab !== item.id && (
                      <span className="ml-auto text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-wealth-gold text-wealth-navy rounded-lg group-hover:scale-105 transition-transform shadow-sm">
                        {(item as any).badge}
                      </span>
                    )}
                    {activeTab === item.id && isSidebarOpen && (
                      <motion.div layoutId="active-pill" className="ml-auto">
                        <ChevronRight size={16} className="text-wealth-gold" />
                      </motion.div>
                    )}
                    {!isSidebarOpen && activeTab === item.id && (
                      <div className="absolute left-0 w-1 h-6 bg-wealth-gold rounded-r-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {isSidebarOpen && (
          <div className="px-6 py-2 border-t border-slate-100 flex items-center justify-center gap-2.5 text-[10.5px] font-semibold text-slate-400 shrink-0">
            <button 
              onClick={() => setActiveTab('privacy-policy')} 
              className={`hover:text-slate-800 transition-colors ${activeTab === 'privacy-policy' ? 'text-indigo-600' : ''}`}
            >
              Privacy Policy
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => setActiveTab('terms-of-service')} 
              className={`hover:text-slate-800 transition-colors ${activeTab === 'terms-of-service' ? 'text-indigo-600' : ''}`}
            >
              Terms of Service
            </button>
          </div>
        )}

        <div className="p-6">
          <div className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-xl bg-wealth-navy flex items-center justify-center text-wealth-gold font-bold text-sm shadow-inner">
              {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-bold truncate text-wealth-navy">{user.displayName || 'User'}</p>
                <p className="text-[10px] text-wealth-gold font-bold uppercase tracking-widest">Private Member</p>
              </div>
            )}
            {isSidebarOpen && (
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-wealth-paper">
        <header className="glass-header h-20 px-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-wealth-navy tracking-tight">
              {navSections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <div className="h-8 w-px bg-slate-200/60" />
            <MemberSelector 
              members={portfolio.familyMembers}
              selectedId={portfolio.selectedMemberId}
              onSelect={setSelectedMemberId}
              onAddMember={() => { setEditingMember(undefined); setIsFamilyModalOpen(true); }}
              onEditMember={(member) => { setEditingMember(member); setIsFamilyModalOpen(true); }}
            />
          </div>
          <div className="flex items-center gap-6">
            {isLiveUpdating && (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                REAL-TIME SYNC
              </div>
            )}
            
            {portfolio.lastMarketRefresh && (
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-bold border border-slate-100">
                <Clock size={12} />
                LATEST NAV: {new Date(portfolio.lastMarketRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            
            <div className="flex items-center gap-3 bg-white border border-slate-200/60 rounded-2xl px-3 py-1.5 shadow-sm">
              <button 
                onClick={() => setCurrentIndexPage(prev => (prev - 1 + portfolio.marketIndices.length) % portfolio.marketIndices.length)}
                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-3 px-2 min-w-[200px] justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {portfolio.marketIndices[currentIndexPage].name}
                </span>
                <span className="text-sm font-mono font-bold text-wealth-navy">
                  {portfolio.marketIndices[currentIndexPage].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[11px] font-bold flex items-center gap-1 ${
                  portfolio.marketIndices[currentIndexPage].change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {portfolio.marketIndices[currentIndexPage].change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {portfolio.marketIndices[currentIndexPage].changePercent.toFixed(2)}%
                </span>
              </div>

              <button 
                onClick={() => setCurrentIndexPage(prev => (prev + 1) % portfolio.marketIndices.length)}
                className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
              >
                <ChevronRightIcon size={16} />
              </button>

              <div className="w-px h-4 bg-slate-200 mx-1" />

              <button 
                onClick={() => pollPrices(true)}
                disabled={isLiveUpdating}
                className={`p-1.5 rounded-lg transition-all ${isLiveUpdating ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
                title="Sync All Market Data"
              >
                <RefreshCw size={14} className={isLiveUpdating ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <button className="p-2.5 bg-wealth-navy text-wealth-gold rounded-xl shadow-lg shadow-slate-200 hover:scale-105 transition-transform">
              <Sparkles size={20} />
            </button>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {/* Data Migration Banner */}
          {user && localDataToMigrate && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top duration-500 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <RefreshCw size={20} className="animate-spin-slow" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900">Sync your local data</h4>
                  <p className="text-sm text-amber-700">We found investment details you added while logged out. Would you like to sync them to your account?</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={migrateLocalData}
                  className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <Zap size={18} />
                  Sync Now
                </button>
                <button 
                  onClick={dismissMigration}
                  className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                  title="Dismiss"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary>
                {renderContent()}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Toaster position="top-right" richColors />
      <InvestmentImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={handleImportInvestments}
        onImportTransactions={handleImportTransactions}
        onImportBankAccounts={handleImportBankAccounts}
        onImportInsurance={handleImportInsurance}
        selectedMemberId={portfolio.selectedMemberId}
        familyMembers={portfolio.familyMembers}
      />

      <RiskAssessmentModal 
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        onSave={handleSaveRiskProfile}
      />

      <EmergencyFundModal 
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onSave={handleSaveEmergencyFund}
        initialData={filteredPortfolio.emergencyFund}
      />

      <FamilyMemberModal
        isOpen={isFamilyModalOpen}
        onClose={() => { setIsFamilyModalOpen(false); setEditingMember(undefined); }}
        onSave={editingMember ? updateFamilyMember : addFamilyMember}
        initialData={editingMember}
      />

      <RebalancingModal 
        isOpen={isRebalancingModalOpen}
        onClose={() => setIsRebalancingModalOpen(false)}
      />

      <InvestmentModal 
        isOpen={isInvestmentModalOpen}
        onClose={() => {
          setIsInvestmentModalOpen(false);
          setPrefilledInvestment(null);
        }}
        onSave={async (inv) => {
          await addInvestment(inv);
          setIsInvestmentModalOpen(false);
          setPrefilledInvestment(null);
        }}
        initialData={prefilledInvestment}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        initialData={editingGoal}
      />
      <ChatBot />
    </div>
  );
}
