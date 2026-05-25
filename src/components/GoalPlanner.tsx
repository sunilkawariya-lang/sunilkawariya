
import React, { useState, useMemo } from 'react';
import { PortfolioState, Goal } from '../types';
import { 
  Target, Calendar, ArrowRight, Plus, Flag, Edit2, Trash2, ArrowUpDown, Info, Check,
  GraduationCap, Home, Car, Plane, Heart, Briefcase, HelpCircle, ChevronDown, ChevronUp,
  Sparkles, RefreshCw, TrendingUp, Shield, Gauge, Activity
} from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { formatLakhs } from '../utils/finance';
import { formatCurrency } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { generateGoalAnalysis } from '../services/analysisService';
import ReactMarkdown from 'react-markdown';

import { Toaster, toast } from 'sonner';

interface GoalPlannerProps {
  portfolio: PortfolioState;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioState>>;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Retirement': Briefcase,
  'Home': Home,
  'Education': GraduationCap,
  'Vehicle': Car,
  'Travel': Plane,
  'Marriage': Heart,
  'Business': Briefcase,
  'Other': HelpCircle
};

const CATEGORY_IMAGES: Record<string, string> = {
  'Retirement': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80',
  'Home': 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80',
  'Education': 'https://images.unsplash.com/photo-1523050853063-bd8012fec0c8?auto=format&fit=crop&q=80',
  'Vehicle': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80',
  'Travel': 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80',
  'Marriage': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80',
  'Business': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80',
  'Other': 'https://images.unsplash.com/photo-1454165833744-96e93e279644?auto=format&fit=crop&q=80'
};

const GoalPlanner: React.FC<GoalPlannerProps> = ({ portfolio, setPortfolio }) => {
  const { addGoal, updateGoal, deleteGoal, updateInvestment } = useFirebase();
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'progress'>('priority');
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [analyzingGoalId, setAnalyzingGoalId] = useState<string | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'maker' | 'mapper'>('status');
  const [makerCategory, setMakerCategory] = useState<string>('Retirement');
  const [mappingInvestmentId, setMappingInvestmentId] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    name: '',
    targetAmount: 0,
    currentAmount: 1000000,
    targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 25)).toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    priority: 'High',
    inflationAdjusted: true,
    expectedInflation: 6,
    expectedReturn: 12,
    monthlyContribution: 0,
    category: 'Retirement',
    memberId: portfolio.selectedMemberId === 'family' ? 'm1' : portfolio.selectedMemberId,
    // Retirement specific
    retirementAge: 60,
    currentAge: 35,
    lifeExpectancy: 85,
    annualExpenses: 600000,
    returnAfterRetirement: 8,
  });

  const calculateRetirementCorpus = useMemo(() => {
    if (makerCategory !== 'Retirement') return formData.targetAmount;
    
    // We allow scenarios by showing the corpus for the current settings
    const yearsToRetire = Math.max(1, (formData.retirementAge || 60) - (formData.currentAge || 35));
    const yearsInRetirement = Math.max(1, (formData.lifeExpectancy || 85) - (formData.retirementAge || 60));
    const infl = (formData.expectedInflation || 6) / 100;
    const rPost = (formData.returnAfterRetirement || 8) / 100;
    
    const annualExpenseAtRetirement = (formData.annualExpenses || 600000) * Math.pow(1 + infl, yearsToRetire);
    const realReturnInRetirement = (1 + rPost) / (1 + infl) - 1;
    
    let corpus = 0;
    if (Math.abs(realReturnInRetirement) < 0.0001) {
      corpus = annualExpenseAtRetirement * yearsInRetirement;
    } else {
      corpus = annualExpenseAtRetirement * (1 - Math.pow(1 + realReturnInRetirement, -yearsInRetirement)) / realReturnInRetirement;
    }
    return Math.round(corpus);
  }, [makerCategory, formData]);

  const handleSaveGoal = async () => {
    const targetAmt = makerCategory === 'Retirement' ? calculateRetirementCorpus : formData.targetAmount;
    
    if (!formData.name) {
      toast.error('Please enter a name for your strategic goal');
      return;
    }
    if (!targetAmt || targetAmt <= 0) {
      toast.error('Target amount must be greater than zero. check your inputs.');
      return;
    }
    
    const newGoal = {
      ...formData,
      targetAmount: targetAmt,
      memberId: formData.memberId === 'self' ? 'm1' : (formData.memberId || (portfolio.selectedMemberId === 'family' ? 'm1' : portfolio.selectedMemberId))
    } as Goal;

    try {
      if (formData.id) {
        await updateGoal(newGoal);
        toast.success(`Updates published: ${formData.name}`);
      } else {
        newGoal.id = Math.random().toString(36).substr(2, 9);
        await addGoal(newGoal);
        toast.success(`Published strategic goal: ${formData.name}`);
      }
      
      // Clear form after publish to avoid stale data
      setFormData({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 25)).toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        priority: 'High',
        inflationAdjusted: true,
        expectedInflation: 6,
        expectedReturn: 12,
        monthlyContribution: 0,
        category: 'Retirement',
        memberId: portfolio.selectedMemberId === 'family' ? 'm1' : portfolio.selectedMemberId,
        retirementAge: 60,
        currentAge: 35,
        lifeExpectancy: 85,
        annualExpenses: 600000,
        returnAfterRetirement: 8,
      });
      setMakerCategory('Retirement');
      setActiveTab('status');
    } catch (err) {
      console.error("Save Error:", err);
      toast.error("Critical failure publishing goal updates. Please try again.");
    }
  };

  const editInMaker = (goal: Goal) => {
    setFormData(goal);
    setMakerCategory(goal.category as any);
    setActiveTab('maker');
  };

  const TABS = [
    { id: 'maker', label: 'Goal Maker', icon: Plus },
    { id: 'mapper', label: 'Map Asset', icon: ArrowRight },
    { id: 'status', label: 'Goal Status', icon: Activity },
  ] as const;

  const handleGenerateAnalysis = async (goal: Goal) => {
    setAnalyzingGoalId(goal.id);
    try {
      const analysisData = await generateGoalAnalysis(goal, portfolio);
      
      const updatedGoal = {
        ...goal,
        analysis: {
          ...analysisData,
          lastGenerated: new Date().toISOString()
        }
      };

      await updateGoal(updatedGoal);
      setExpandedAnalysis(goal.id);
      toast.success('AI Strategic Analysis refreshed');
    } catch (error) {
      console.error("Failed to generate goal analysis:", error);
      toast.error('Strategic Analysis failed. Check Gemini API Quota.');
    } finally {
      setAnalyzingGoalId(null);
    }
  };

  const monthlyIncome = useMemo(() => 
    portfolio.incomes.filter(inc => inc.frequency === 'Monthly').reduce((sum, inc) => sum + inc.amount, 0),
  [portfolio.incomes]);

  const calculateEffectiveCurrentAmount = (goalId: string) => {
    const goal = portfolio.goals.find(g => g.id === goalId);
    if (!goal) return 0;
    
    const mappedValueFromInvestments = portfolio.investments.reduce((sum, inv) => {
      const mapping = inv.goalMappings?.find(m => m.goalId === goalId);
      if (!mapping) return sum;
      return sum + (inv.currentValue * mapping.percentage / 100);
    }, 0);

    return (goal.currentAmount || 0) + mappedValueFromInvestments;
  };

  const sortedGoals = useMemo(() => {
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    
    const goalsWithEffective = portfolio.goals.map(g => ({
      ...g,
      effectiveAmount: calculateEffectiveCurrentAmount(g.id)
    }));

    return goalsWithEffective.sort((a, b) => {
      if (sortBy === 'priority') {
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        if (weightB !== weightA) return weightB - weightA;
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }
      if (sortBy === 'date') {
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
      }
      if (sortBy === 'progress') {
        const progressA = a.effectiveAmount / a.targetAmount;
        const progressB = b.effectiveAmount / b.targetAmount;
        return progressB - progressA;
      }
      return 0;
    });
  }, [portfolio.goals, portfolio.investments, sortBy]);

  const handleDeleteGoal = async (id: string) => {
    setGoalToDelete(id);
  };

  const confirmDelete = async () => {
    if (goalToDelete) {
      await deleteGoal(goalToDelete);
      setGoalToDelete(null);
    }
  };

  const openEditModal = (goal: Goal) => {
    (window as any).openGoalModal?.(goal);
  };

  const openAddModal = () => {
    (window as any).openGoalModal?.();
  };
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-10">
      <Toaster position="top-right" richColors />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-serif text-4xl font-medium text-slate-900 tracking-tight">Financial Objectives</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Design, Map, and Monitor your wealth journey</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'maker' ? (
          <motion.div
            key="maker"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(CATEGORY_ICONS).map(([cat, Icon]) => (
                <button
                  key={cat}
                  onClick={() => {
                    setMakerCategory(cat);
                    setFormData(prev => ({ ...prev, category: cat as any, name: `${cat} Plan` }));
                  }}
                  className={`premium-card p-6 flex flex-col items-center gap-2 border-2 transition-all group ${
                    makerCategory === cat ? 'border-indigo-500 ring-4 ring-indigo-50 shadow-xl scale-105' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-inner ${
                    makerCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                  }`}>
                    <Icon size={28} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    makerCategory === cat ? 'text-indigo-600' : 'text-slate-500'
                  }`}>{cat}</span>
                </button>
              ))}
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                      <Plus size={20} />
                    </div>
                    <h3 className="text-serif text-2xl font-medium text-slate-900">Current Goal Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-full">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Goal For :</label>
                      <select 
                        value={makerCategory}
                        onChange={(e) => {
                          setMakerCategory(e.target.value);
                          setFormData(prev => ({ ...prev, category: e.target.value as any }));
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.keys(CATEGORY_ICONS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <div className="col-span-full">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Name :</label>
                      <input 
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Dream Home Fund"
                      />
                    </div>

                    {makerCategory === 'Retirement' ? (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Age :</label>
                          <input 
                            type="number"
                            value={formData.currentAge || ''}
                            onChange={(e) => {
                              const age = Number(e.target.value);
                              setFormData(prev => ({ 
                                ...prev, 
                                currentAge: age,
                                targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + (prev.retirementAge - age))).toISOString().split('T')[0]
                              }));
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Retirement Age :</label>
                          <input 
                            type="number"
                            value={formData.retirementAge || ''}
                            onChange={(e) => {
                              const rAge = Number(e.target.value);
                              setFormData(prev => ({ 
                                ...prev, 
                                retirementAge: rAge,
                                targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + (rAge - prev.currentAge))).toISOString().split('T')[0]
                              }));
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Annual Expenses Today (₹) :</label>
                          <input 
                            type="number"
                            value={formData.annualExpenses || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, annualExpenses: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Life Expectancy :</label>
                          <input 
                            type="number"
                            value={formData.lifeExpectancy || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, lifeExpectancy: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Savings (₹) :</label>
                          <input 
                            type="number"
                            value={formData.currentAmount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Return Pre-Retire (%) :</label>
                          <input 
                            type="number"
                            value={formData.expectedReturn || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, expectedReturn: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Return Post-Retire (%) :</label>
                          <input 
                            type="number"
                            value={formData.returnAfterRetirement || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, returnAfterRetirement: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inflation (%) :</label>
                          <input 
                            type="number"
                            value={formData.expectedInflation || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, expectedInflation: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div className="col-span-full p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center">
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2">Calculated Required Corpus</p>
                          <p className="text-4xl font-black text-indigo-600">{formatCurrency(calculateRetirementCorpus)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Date :</label>
                          <input 
                            type="date"
                            value={formData.startDate || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Amount (₹) :</label>
                          <input 
                            type="number"
                            value={formData.targetAmount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Required Corpus"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Date :</label>
                          <input 
                            type="date"
                            value={formData.targetDate || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Savings (₹) :</label>
                          <input 
                            type="number"
                            value={formData.currentAmount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expected Return (%) :</label>
                          <input 
                            type="number"
                            value={formData.expectedReturn || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, expectedReturn: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inflation Rate (%) :</label>
                          <input 
                            type="number"
                            value={formData.expectedInflation || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, expectedInflation: Number(e.target.value) }))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={handleSaveGoal}
                      className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                    >
                      {formData.id ? 'Publish Updates' : 'Publish Strategic Goal'}
                    </button>
                    <button 
                      onClick={() => setActiveTab('status')}
                      className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <div className="sticky top-8">
                    <div className="rounded-[32px] overflow-hidden shadow-2xl relative group">
                      <img 
                        src={CATEGORY_IMAGES[makerCategory || 'General']} 
                        alt={makerCategory}
                        className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-8">
                        <h4 className="text-serif text-3xl text-white font-medium mb-2">{makerCategory} Planning</h4>
                        <p className="text-white/70 text-sm leading-relaxed">Secure your future with personalized strategic benchmarks and automated tracking.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'mapper' ? (
          <motion.div
            key="mapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Asset Selection */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Step 1: Select Unmapped Asset</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {portfolio.investments.map(inv => {
                  const mappedPercent = (inv.goalMappings || []).reduce((sum, m) => sum + m.percentage, 0);
                  const isFullyMapped = mappedPercent >= 100;
                  
                  return (
                    <button
                      key={inv.id}
                      onClick={() => setMappingInvestmentId(inv.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                        mappingInvestmentId === inv.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                          : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest ${mappingInvestmentId === inv.id ? 'text-slate-400' : 'text-slate-400'}`}>
                          {inv.category} / {inv.subCategory}
                        </span>
                        <span className="text-[10px] font-black">{formatCurrency(inv.currentValue)}</span>
                      </div>
                      <h4 className="text-sm font-bold truncate">{inv.name}</h4>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="h-1.5 flex-1 bg-slate-200/20 rounded-full mr-3 overflow-hidden">
                          <div className={`h-full bg-indigo-500 transition-all`} style={{ width: `${mappedPercent}%` }} />
                        </div>
                        <span className="text-[9px] font-black">{mappedPercent}% Mapped</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goal Target */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Step 2: Assign to Strategic Objective</h3>
              
              {!mappingInvestmentId ? (
                <div className="h-[400px] bg-slate-50 rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <ArrowRight size={32} className="text-slate-300" />
                  <p className="text-slate-500 font-medium text-sm">Select an asset from the left to begin strategic mapping</p>
                </div>
              ) : (
                <MapperPanel 
                  inv={portfolio.investments.find(i => i.id === mappingInvestmentId)!} 
                  portfolio={portfolio}
                  updateInvestment={updateInvestment}
                  calculateEffectiveCurrentAmount={calculateEffectiveCurrentAmount}
                />
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-serif text-2xl font-medium text-slate-900">Live Strategic Status</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                  <ArrowUpDown size={14} />
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent outline-none cursor-pointer text-slate-600"
                  >
                    <option value="priority">Priority Matrix</option>
                    <option value="date">Timeline Chronology</option>
                    <option value="progress">Achievement Velocity</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Consolidated Goal Summary Table */}
            {sortedGoals.length > 0 && (
              <div className="premium-card overflow-hidden mb-10 border-indigo-100/50 shadow-xl shadow-indigo-50/50">
                <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                      <TrendingUp size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Consolidated Goal Sheet</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Macro-view of all strategic objectives</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Goal</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Goal Date</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Years Left</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Future Value Req.</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Completion (%)</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Current Value</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Running SIP</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Projected Value</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Shortfall/Surplus</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Lumpsum Invest</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Add SIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {sortedGoals.map(goal => {
                        const now = new Date();
                        const targetDate = new Date(goal.targetDate);
                        const monthsLeft = Math.max(0, differenceInMonths(targetDate, now));
                        const yearsLeft = monthsLeft / 12;
                        
                        const monthlyRate = (goal.expectedReturn || 12) / 12 / 100;
                        
                        let inflationAdjustedTarget = 0;
                        if (goal.multiYearFunding && goal.multiYearFunding.length > 0) {
                          const startYear = targetDate.getFullYear();
                          inflationAdjustedTarget = goal.multiYearFunding.reduce((sum, item) => {
                            const yearsFromStart = item.year - startYear;
                            const yearsFromToday = yearsFromStart + yearsLeft;
                            const adjustedAmount = item.amount * Math.pow(1 + (goal.expectedInflation || 6) / 100, yearsFromToday);
                            return sum + (adjustedAmount / Math.pow(1 + (goal.expectedReturn || 12) / 100, yearsFromStart));
                          }, 0);
                        } else {
                          inflationAdjustedTarget = goal.inflationAdjusted 
                            ? goal.targetAmount * Math.pow(1 + (goal.expectedInflation || 6) / 100, yearsLeft)
                            : goal.targetAmount;
                        }

                        const currentVal = calculateEffectiveCurrentAmount(goal.id);
                        const progress = (currentVal / inflationAdjustedTarget) * 100;

                        // Calculate mapped SIPs for this goal
                        const mappedSIPAmount = portfolio.investments
                          .filter(inv => inv.isSIP && inv.sipAmount && inv.goalMappings?.some(m => m.goalId === goal.id))
                          .reduce((sum, inv) => {
                            const mapping = inv.goalMappings?.find(m => m.goalId === goal.id);
                            return sum + (inv.sipAmount! * (mapping?.percentage || 0) / 100);
                          }, 0);

                        const fvCurrent = currentVal * Math.pow(1 + monthlyRate, monthsLeft);
                        const fvContributions = (goal.monthlyContribution || 0) * 
                          (monthlyRate > 0 
                            ? (Math.pow(1 + monthlyRate, monthsLeft) - 1) / monthlyRate 
                            : monthsLeft);
                        const totalForecast = fvCurrent + fvContributions;
                        const shortfall = inflationAdjustedTarget - totalForecast;

                        let recommendedMonthly = 0;
                        let requiredLumpsum = 0;
                        if (monthsLeft > 0 && shortfall > 0) {
                          if (monthlyRate > 0) {
                            recommendedMonthly = (shortfall * monthlyRate) / (Math.pow(1 + monthlyRate, monthsLeft) - 1);
                          } else {
                            recommendedMonthly = shortfall / monthsLeft;
                          }
                          requiredLumpsum = shortfall / Math.pow(1 + monthlyRate, monthsLeft);
                        }

                        return (
                          <tr key={goal.id} className="hover:bg-slate-50/50 transition-colors group/row">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  goal.priority === 'High' ? 'bg-rose-50 text-rose-600' : 
                                  goal.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                  {React.createElement(CATEGORY_ICONS[goal.category || 'Other'] || Target, { size: 14 })}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-900 truncate max-w-[150px] font-sans">{goal.name}</span>
                                  <button 
                                    onClick={() => editInMaker(goal)}
                                    className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 opacity-0 group-hover/row:opacity-100 transition-opacity text-left mt-1 flex items-center gap-1"
                                  >
                                    <Edit2 size={10} />
                                    Edit Plan
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-600">{format(targetDate, 'MMM yyyy')}</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900 text-center">{yearsLeft.toFixed(1)}</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">{formatLakhs(inflationAdjustedTarget)}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-black text-indigo-600">{progress.toFixed(1)}%</span>
                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, progress)}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">{formatLakhs(currentVal)}</td>
                            <td className="px-6 py-4 text-xs font-black text-emerald-600 text-right">₹{mappedSIPAmount.toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">{formatLakhs(totalForecast)}</td>
                            <td className={`px-6 py-4 text-xs font-black text-right ${shortfall > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {shortfall > 0 ? '-' : '+'}{formatLakhs(Math.abs(shortfall))}
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-slate-900 text-right">{formatLakhs(requiredLumpsum)}</td>
                            <td className="px-6 py-4 text-xs font-black text-indigo-600 text-right">{formatLakhs(recommendedMonthly)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {sortedGoals.length === 0 ? (
                <div className="col-span-full premium-card p-20 flex flex-col items-center justify-center text-center space-y-6 border-dashed">
                  <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 shadow-inner">
                    <Target size={48} />
                  </div>
                  <div>
                    <h3 className="text-serif text-2xl font-medium text-slate-900">No Strategic Objectives Defined</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mt-2 text-sm">Begin your journey by defining the milestones that will shape your financial legacy.</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('maker')}
                    className="premium-button-primary px-8 py-3.5 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Go to Goal Maker</span>
                  </button>
                </div>
              ) : sortedGoals.map((goal) => {
          const now = new Date();
          const targetDate = new Date(goal.targetDate);
          const startDate = goal.startDate ? new Date(goal.startDate) : new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30 * 6);
          
          const monthsLeft = differenceInMonths(targetDate, now);
          const totalMonths = differenceInMonths(targetDate, startDate);
          const monthsPassed = differenceInMonths(now, startDate);
          
          const timeProgress = totalMonths > 0 ? (monthsPassed / totalMonths) * 100 : 0;
          const yearsLeft = Math.max(0, monthsLeft / 12);
          
          let inflationAdjustedTarget = 0;
          if (goal.multiYearFunding && goal.multiYearFunding.length > 0) {
            const startYear = targetDate.getFullYear();
            inflationAdjustedTarget = goal.multiYearFunding.reduce((sum, item) => {
              const yearsFromStart = item.year - startYear;
              const yearsFromToday = yearsFromStart + yearsLeft;
              const adjustedAmount = item.amount * Math.pow(1 + (goal.expectedInflation || 6) / 100, yearsFromToday);
              return sum + (adjustedAmount / Math.pow(1 + (goal.expectedReturn || 12) / 100, yearsFromStart));
            }, 0);
          } else {
            inflationAdjustedTarget = goal.inflationAdjusted 
              ? goal.targetAmount * Math.pow(1 + (goal.expectedInflation || 6) / 100, yearsLeft)
              : goal.targetAmount;
          }

          const progress = (goal.effectiveAmount / inflationAdjustedTarget) * 100;
          const monthlyRate = (goal.expectedReturn || 12) / 12 / 100;
          let recommendedMonthly = 0;
          let requiredLumpsum = 0;
          
          if (monthsLeft > 0) {
            const fvOfCurrent = goal.effectiveAmount * Math.pow(1 + monthlyRate, monthsLeft);
            const shortfallToCover = inflationAdjustedTarget - fvOfCurrent;
            
            if (shortfallToCover > 0) {
              if (monthlyRate > 0) {
                recommendedMonthly = (shortfallToCover * monthlyRate) / (Math.pow(1 + monthlyRate, monthsLeft) - 1);
              } else {
                recommendedMonthly = shortfallToCover / monthsLeft;
              }
              requiredLumpsum = shortfallToCover / Math.pow(1 + monthlyRate, monthsLeft);
            }
          }

          const pmt = goal.monthlyContribution || 0;
          let estimatedMonthsToGoal: number | null = null;

          if (goal.effectiveAmount >= inflationAdjustedTarget) {
            estimatedMonthsToGoal = 0;
          } else if (pmt > 0 || (goal.effectiveAmount > 0 && monthlyRate > 0)) {
            if (monthlyRate > 0) {
              const numerator = inflationAdjustedTarget + (pmt / monthlyRate);
              const denominator = goal.effectiveAmount + (pmt / monthlyRate);
              if (numerator > 0 && denominator > 0) {
                estimatedMonthsToGoal = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
              }
            } else if (pmt > 0) {
              estimatedMonthsToGoal = (inflationAdjustedTarget - goal.currentAmount) / pmt;
            }
          }

          const formatEstimatedTime = (months: number | null) => {
            if (months === null || months === Infinity) return 'Infinite Horizon';
            if (months === 0) return 'Goal Secured';
            const years = Math.floor(months / 12);
            const remainingMonths = Math.ceil(months % 12);
            let result = '';
            if (years > 0) result += `${years}y `;
            if (remainingMonths > 0) result += `${remainingMonths}m`;
            return result.trim() || '< 1m';
          };

          const fvCurrent = goal.currentAmount * Math.pow(1 + monthlyRate, monthsLeft);
          const fvContributions = (goal.monthlyContribution || 0) * 
            (monthlyRate > 0 
              ? (Math.pow(1 + monthlyRate, monthsLeft) - 1) / monthlyRate 
              : monthsLeft);
          const totalForecast = fvCurrent + fvContributions;
          const shortfall = inflationAdjustedTarget - totalForecast;
          
          let status: 'On Track' | 'Needs Attention' | 'At Risk' = 'On Track';
          let statusColor: 'emerald' | 'amber' | 'rose' = 'emerald';
          
          if (progress < timeProgress - 15 || (estimatedMonthsToGoal !== null && estimatedMonthsToGoal > monthsLeft + 3)) {
            status = 'At Risk';
            statusColor = 'rose';
          } else if (progress < timeProgress || (estimatedMonthsToGoal !== null && estimatedMonthsToGoal > monthsLeft)) {
            status = 'Needs Attention';
            statusColor = 'amber';
          }

          const statusStyles = {
            emerald: { bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', hoverBg: 'hover:bg-emerald-100', darkText: 'text-emerald-700' },
            amber: { bg: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', hoverBg: 'hover:bg-amber-100', darkText: 'text-amber-700' },
            rose: { bg: 'bg-rose-500', lightBg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hoverBg: 'hover:bg-rose-100', darkText: 'text-rose-700' }
          }[statusColor];

          const priorityColor = goal.priority === 'High' ? 'bg-rose-500' : 
                               goal.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500';

          const CategoryIcon = CATEGORY_ICONS[goal.category || 'Other'] || Target;

          // Calculate mapped SIPs for this goal
          const mappedSIPs = portfolio.investments.filter(inv => 
            inv.isSIP && inv.sipAmount && inv.goalMappings?.some(m => m.goalId === goal.id)
          );
          const totalMappedSIPAmount = mappedSIPs.reduce((sum, inv) => {
            const mapping = inv.goalMappings?.find(m => m.goalId === goal.id);
            return sum + (inv.sipAmount! * (mapping?.percentage || 0) / 100);
          }, 0);

          return (
            <div key={goal.id} className="premium-card p-8 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: priorityColor }} />
              
              <div className="absolute top-6 right-6 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(goal)}
                  className="p-2 text-slate-400 hover:text-wealth-navy rounded-lg hover:bg-slate-50 transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${
                    goal.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                    goal.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    <CategoryIcon size={28} />
                  </div>
                  <div>
                    <h3 className="text-serif text-2xl font-medium text-slate-900 flex items-center gap-2">
                      <CategoryIcon size={24} className="text-slate-400 shrink-0" />
                      {goal.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        <Calendar size={12} />
                        {format(targetDate, 'MMM yyyy')}
                      </div>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                        goal.priority === 'High' ? 'text-rose-600' : 
                        goal.priority === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        <Flag size={12} />
                        {goal.priority}
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusStyles.lightBg} ${statusStyles.text} border ${statusStyles.border}`}>
                  {status}
                </div>
              </div>

              {/* Mapped Investments */}
              {mappedSIPs.length > 0 && (
                <div className="mb-6">
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-2">
                        <Target size={12} />
                        Mapped SIP Contributions
                      </p>
                      <p className="text-[10px] font-black text-emerald-700 tracking-tight">
                        Total: ₹{totalMappedSIPAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {mappedSIPs.map(inv => {
                        const mapping = inv.goalMappings?.find(m => m.goalId === goal.id);
                        const allocatedAmount = (inv.sipAmount! * (mapping?.percentage || 0) / 100);
                        return (
                          <div key={inv.id} className="flex items-center justify-between text-xs bg-white/60 p-2 rounded-lg border border-white/80">
                            <span className="text-slate-600 font-bold truncate max-w-[200px]">{inv.name}</span>
                            <span className="font-black text-emerald-700">₹{allocatedAmount.toLocaleString('en-IN')} <span className="text-[9px] text-emerald-500 ml-1">({mapping?.percentage}%)</span></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Capital Deployed</p>
                    <p className="text-2xl font-black text-slate-900">{formatLakhs(goal.effectiveAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">
                      {goal.inflationAdjusted ? 'Inflation-Adj. Target' : 'Strategic Target'}
                    </p>
                    <p className="text-lg font-bold text-slate-700">{formatLakhs(inflationAdjustedTarget)}</p>
                    {goal.inflationAdjusted && (
                      <p className="text-[9px] text-wealth-emerald font-black uppercase tracking-widest mt-0.5">Real-Value Protected</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-1000 ${priorityColor} opacity-10`}
                      style={{ width: `${Math.min(100, (totalForecast / inflationAdjustedTarget) * 100)}%` }}
                    />
                    <div 
                      className={`h-full transition-all duration-1000 ${priorityColor} relative z-10 shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900/30 z-20"
                      style={{ left: `${Math.min(100, timeProgress)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${priorityColor}`} />
                      <span>{progress.toFixed(1)}% Achievement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900/20" />
                      <span>{timeProgress.toFixed(1)}% Timeline</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Achievement</p>
                    <p className="text-sm font-black text-slate-900">{progress.toFixed(1)}%</p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-center">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Velocity</p>
                    <p className={`text-sm font-black ${estimatedMonthsToGoal !== null && estimatedMonthsToGoal > monthsLeft ? 'text-rose-600' : 'text-slate-900'}`}>
                      {formatEstimatedTime(estimatedMonthsToGoal)}
                    </p>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 text-right">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Horizon</p>
                    <p className="text-sm font-black text-slate-900">{monthsLeft}m</p>
                  </div>
                </div>

                {/* Forecast & Strategy */}
                <div className={`p-5 rounded-2xl border ${statusStyles.border} ${statusStyles.lightBg} space-y-4`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Projected Terminal Value</p>
                      <p className="text-xl font-black text-slate-900">{formatLakhs(totalForecast)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">
                        {shortfall > 0 ? 'Strategic Shortfall' : 'Strategic Surplus'}
                      </p>
                      <p className={`text-base font-black ${shortfall > 0 ? 'text-rose-600' : 'text-wealth-emerald'}`}>
                        {shortfall > 0 ? '-' : '+'}{formatLakhs(Math.abs(shortfall))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold bg-white/60 p-3 rounded-xl border border-white/80">
                    <Info size={14} className="shrink-0 text-wealth-navy" />
                    <span className="leading-relaxed">
                      At <span className="text-wealth-navy">{goal.expectedReturn || 12}%</span> CAGR, your current trajectory secures 
                      <span className="font-black text-wealth-navy mx-1">
                        {((totalForecast / inflationAdjustedTarget) * 100).toFixed(1)}%
                      </span> 
                      of the objective.
                    </span>
                  </div>
                </div>

                {/* Multi-Year Funding Schedule */}
                {goal.multiYearFunding && goal.multiYearFunding.length > 0 && (
                  <div className="pt-2">
                    <button 
                      onClick={() => setExpandedSchedule(expandedSchedule === goal.id ? null : goal.id)}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar size={14} className="text-wealth-navy" />
                        Funding Schedule ({goal.multiYearFunding.length} Years)
                      </span>
                      {expandedSchedule === goal.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    
                    <AnimatePresence>
                      {expandedSchedule === goal.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-1 p-3 bg-slate-50/30 rounded-xl border border-slate-100">
                            <div className="grid grid-cols-2 px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              <span>Fiscal Year</span>
                              <span className="text-right">Allocation</span>
                            </div>
                            {goal.multiYearFunding.sort((a, b) => a.year - b.year).map((item, idx) => (
                              <div key={idx} className="grid grid-cols-2 px-3 py-2 text-xs border-t border-slate-100 first:border-0">
                                <span className="font-bold text-slate-600">{item.year}</span>
                                <span className="text-right font-black text-slate-900">{formatLakhs(item.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Required Monthly Deployment</p>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <p className={`text-xl font-black ${statusStyles.text}`}>{formatLakhs(recommendedMonthly)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">/ {formatLakhs(goal.monthlyContribution || 0)} Planned</p>
                      </div>
                      {totalMappedSIPAmount > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                            ₹{totalMappedSIPAmount.toLocaleString('en-IN')} Mapped from SIPs
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Lumpsum Capital Required</p>
                    <p className="text-xl font-black text-slate-900">{formatLakhs(requiredLumpsum)}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="space-y-2">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Strategic Health</p>
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((i) => (
                          <div 
                            key={i} 
                            className={`w-5 h-1.5 rounded-full transition-all duration-500 ${
                              status === 'On Track' ? 'bg-wealth-emerald shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                              status === 'Needs Attention' ? (i <= 2 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-slate-100') :
                              (i === 1 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' : 'bg-slate-100')
                            }`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleGenerateAnalysis(goal)}
                      disabled={analyzingGoalId === goal.id}
                      className="px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {analyzingGoalId === goal.id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      {goal.analysis ? 'Refresh Analysis' : 'Strategic Recommendation'}
                    </button>
                    <button className="premium-button-primary px-6 py-2.5 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest">Deploy Capital</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                {/* AI Strategic Recommendation Display */}
                <AnimatePresence>
                  {goal.analysis && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-6 pt-6 border-t border-slate-100 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="text-indigo-600" size={18} />
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Strategic Recommendation</h4>
                        </div>
                        <button 
                          onClick={() => setExpandedAnalysis(expandedAnalysis === goal.id ? null : goal.id)}
                          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                          {expandedAnalysis === goal.id ? 'Collapse' : 'View Details'}
                        </button>
                      </div>

                      <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-100">
                            <TrendingUp size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Core Recommendation</p>
                            <p className="text-sm font-bold text-slate-900 leading-relaxed">{goal.analysis.recommendation}</p>
                          </div>
                        </div>

                        {expandedAnalysis === goal.id && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6 pt-4 border-t border-indigo-100"
                          >
                            {/* Rationale */}
                            <div className="space-y-2">
                              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Strategic Rationale</p>
                              <div className="text-xs text-slate-600 leading-relaxed prose prose-slate max-w-none">
                                <ReactMarkdown>{goal.analysis.rationale}</ReactMarkdown>
                              </div>
                            </div>

                            {/* Risk & Performance Ratios */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <Gauge size={14} className="text-indigo-600" />
                                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Performance Ratios</p>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                  <div>
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Sharpe</p>
                                    <p className="text-xs font-black text-slate-900">{goal.analysis.performanceRatios.sharpe?.toFixed(2) || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Sortino</p>
                                    <p className="text-xs font-black text-slate-900">{goal.analysis.performanceRatios.sortino?.toFixed(2) || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Alpha</p>
                                    <p className="text-xs font-black text-emerald-600">+{goal.analysis.performanceRatios.alpha?.toFixed(2) || '0'}%</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Beta</p>
                                    <p className="text-xs font-black text-slate-900">{goal.analysis.performanceRatios.beta?.toFixed(2) || '1.0'}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <Shield size={14} className="text-rose-600" />
                                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Risk Metrics</p>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2">
                                  <div>
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Volatility</p>
                                    <p className="text-xs font-black text-slate-900">{goal.analysis.riskMetrics.standardDeviation?.toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Max DD</p>
                                    <p className="text-xs font-black text-rose-600">-{goal.analysis.riskMetrics.maxDrawdown?.toFixed(1)}%</p>
                                  </div>
                                  <div className="col-span-2">
                                    <p className="text-[8px] text-slate-400 uppercase font-bold">Value at Risk (95%)</p>
                                    <p className="text-xs font-black text-slate-900">₹{((goal.analysis.riskMetrics.valueAtRisk || 0) * goal.currentAmount / 100).toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Market Context */}
                            <div className="bg-white p-5 rounded-xl border border-indigo-50 shadow-sm space-y-4">
                              <div className="flex items-center gap-2">
                                <Activity size={14} className="text-indigo-600" />
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Market Valuation Factors</p>
                              </div>
                              <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-50">
                                <div>
                                  <p className="text-[8px] text-slate-400 uppercase font-bold">Market PE</p>
                                  <p className="text-xs font-black text-slate-900">{goal.analysis.marketContext.peRatio || '22.5'}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-slate-400 uppercase font-bold">Market PB</p>
                                  <p className="text-xs font-black text-slate-900">{goal.analysis.marketContext.pbRatio || '3.8'}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-slate-400 uppercase font-bold">Div. Yield</p>
                                  <p className="text-xs font-black text-slate-900">{goal.analysis.marketContext.dividendYield || '1.2'}%</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-slate-400 uppercase font-bold">10Y Yield</p>
                                  <p className="text-xs font-black text-indigo-600">{goal.analysis.marketContext.bondYield || '7.1'}%</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mb-1">Valuation Outlook</p>
                                  <p className="text-[11px] text-slate-600 leading-relaxed">{goal.analysis.marketContext.marketValuation}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mb-1">India Situation</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">{goal.analysis.marketContext.indiaSituation}</p>
                                  </div>
                                  <div>
                                    <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mb-1">Global Situation</p>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">{goal.analysis.marketContext.globalSituation}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Quant & Qual Factors */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Quantitative Factors</p>
                                <ul className="space-y-1.5">
                                  {goal.analysis.quantitativeFactors.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                                      <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Qualitative Factors</p>
                                <ul className="space-y-1.5">
                                  {goal.analysis.qualitativeFactors.map((f, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                                      <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                      {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Relative Asset Performance Context */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-3">Relative Asset Performance Context</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {portfolio.investments.slice(0, 4).map((inv, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 text-[10px]">
                                    <span className="font-bold text-slate-600 truncate max-w-[120px]">{inv.name}</span>
                                    <div className="flex gap-3">
                                      <span className="text-slate-400">1Y: <span className={inv.return1Y && inv.return1Y > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{inv.return1Y || '0'}%</span></span>
                                      <span className="text-slate-400">3Y: <span className={inv.return3Y && inv.return3Y > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{inv.return3Y || '0'}%</span></span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between text-[8px] text-slate-400 font-black uppercase tracking-widest">
                              <span>AI Analysis Engine v2.5</span>
                              <span>Last Updated: {new Date(goal.analysis.lastGenerated).toLocaleString('en-IN')}</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
            </div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Delete Goal?</h3>
              <p className="text-slate-500 mt-2">Are you sure you want to delete this goal? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setGoalToDelete(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalPlanner;

const MapperPanel: React.FC<{
  inv: any;
  portfolio: PortfolioState;
  updateInvestment: any;
  calculateEffectiveCurrentAmount: (goalId: string) => number;
}> = ({ inv, portfolio, updateInvestment, calculateEffectiveCurrentAmount }) => {
  const currentTotalMapped = (inv.goalMappings || []).reduce((sum: number, m: any) => sum + m.percentage, 0);

  const handleUpdateMapping = async (goalId: string, val: number) => {
    const otherMappings = inv.goalMappings?.filter((m: any) => m.goalId !== goalId) || [];
    const newMappings = val > 0 
      ? [...otherMappings, { goalId, percentage: val }]
      : otherMappings;

    const tempTotal = newMappings.reduce((s: number, m: any) => s + m.percentage, 0);
    if (tempTotal > 100) return;
    
    await updateInvestment({ ...inv, goalMappings: newMappings });
  };

  const CATEGORY_ICONS: Record<string, any> = {
    'Retirement': GraduationCap,
    'Home': Home,
    'Education': GraduationCap,
    'Vehicle': Car,
    'Travel': Plane,
    'Marriage': Heart,
    'Business': Briefcase,
    'Other': HelpCircle
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {portfolio.goals.map(goal => {
        const existingMapping = inv.goalMappings?.find((m: any) => m.goalId === goal.id);
        const currentMappingPercent = existingMapping?.percentage || 0;
        const availablePercent = 100 - currentTotalMapped + currentMappingPercent;
        const isMapped = currentMappingPercent > 0;

        return (
          <div key={goal.id} className="premium-card p-6 flex flex-col justify-between border-slate-50 hover:border-indigo-100 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMapped ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                    {React.createElement(CATEGORY_ICONS[goal.category || 'Other'] || Target, { size: 20 })}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{goal.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(goal.targetAmount)} Target
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleUpdateMapping(goal.id, isMapped ? 0 : Math.min(100, availablePercent))}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                    isMapped 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'bg-white border-slate-200 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                  }`}
                  title={isMapped ? "Remove mapping" : "Map available balance"}
                >
                  <Check size={14} className={isMapped ? 'stroke-[4px]' : 'stroke-[2px]'} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min="0"
                    max={availablePercent}
                    value={existingMapping?.percentage || 0}
                    onChange={(e) => handleUpdateMapping(goal.id, parseInt(e.target.value))}
                    className="flex-1 accent-indigo-600 h-1.5 cursor-pointer"
                  />
                  <span className="text-lg font-black text-indigo-600 min-w-[50px] text-right">{existingMapping?.percentage || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-slate-400 font-medium">Cap: {availablePercent}%</p>
                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest text-right">
                    ₹{((inv.currentValue * (existingMapping?.percentage || 0)) / 100).toLocaleString('en-IN')} Value
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">Effective Progress</div>
                <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: `${Math.min(100, (calculateEffectiveCurrentAmount(goal.id) / goal.targetAmount) * 100)}%` }} 
                  />
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="text-sm font-black text-slate-900">
                  {((calculateEffectiveCurrentAmount(goal.id) / goal.targetAmount) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
