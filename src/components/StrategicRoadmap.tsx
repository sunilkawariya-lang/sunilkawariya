
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map, 
  Target, 
  ArrowRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Wallet, 
  ShieldCheck, 
  TrendingUp, 
  Clock,
  Briefcase,
  AlertCircle,
  FileText,
  Download,
  Activity,
  Zap,
  Info,
  Calendar,
  Lock,
  MessageSquare,
  ShoppingBag,
  Landmark,
  BookOpen
} from 'lucide-react';
import { PortfolioState, FinancialPlan, FamilyMember, AssetCategory, RiskProfileType } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { generateDetailedFinancialPlan } from '../services/analysisService';
import DetailedFinancialPlanView from './DetailedFinancialPlanView';
import { toast } from 'sonner';
import { generateFinancialPlanPDF } from '../services/pdfService';
import * as XLSX from 'xlsx';

interface StrategicRoadmapProps {
  portfolio: PortfolioState;
}

type RoadmapStep = 'intro' | 'family' | 'vitals' | 'risk' | 'protection' | 'goals' | 'generate';

const StrategicRoadmap: React.FC<StrategicRoadmapProps> = ({ portfolio }) => {
  const { 
    updateFinancialPlan, 
    updateRiskProfile, 
    updateEmergencyFund, 
    updateFamilyMember,
    updateIncome,
    addIncome,
    updateExpense,
    addExpense,
    updateEstatePlanning,
    addGoal,
    updateGoal
  } = useFirebase();
  const [currentStep, setCurrentStep] = useState<RoadmapStep>('intro');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<FinancialPlan | undefined>(portfolio.financialPlan);

  // Local state for questionnaire - initialized from portfolio
  const [formData, setFormData] = useState({
    familyMembers: portfolio.familyMembers.map(m => ({
      ...m,
      panSuffix: '', // Added for PDF compliance
      kycStatus: 'Verified' as any
    })),
    monthlyIncome: portfolio.incomes.reduce((sum, i) => sum + i.amount, 0),
    monthlyExpenses: portfolio.expenses.reduce((sum, e) => sum + e.amount, 0),
    riskTolerance: portfolio.riskProfile?.score || 50,
    emergencyFundTarget: portfolio.emergencyFund?.targetMonths || 6,
    hasWill: portfolio.estatePlanning?.willStatus === 'Registered' || portfolio.estatePlanning?.willStatus === 'Drafted',
    mainGoal: portfolio.goals[0]?.name || 'Wealth Creation'
  });

  // Steps configuration
  const steps: { id: RoadmapStep; title: string; subtitle: string }[] = [
    { id: 'intro', title: 'Start Your Journey', subtitle: 'Strategic Wealth Roadmap' },
    { id: 'family', title: 'Family Nucleus', subtitle: 'Verify names, ages and KYC status' },
    { id: 'vitals', title: 'Financial Vitals', subtitle: 'Income and expenses validation' },
    { id: 'risk', title: 'Risk Resilience', subtitle: 'Define your volatility comfort' },
    { id: 'protection', title: 'Safety Net', subtitle: 'Insurance and contingency planning' },
    { id: 'goals', title: 'Priority Goals', subtitle: 'Milestones to achieve' },
    { id: 'generate', title: 'Generate Plan', subtitle: 'AI Engine Architecting' }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const generatePlan = async () => {
    setIsGenerating(true);
    try {
      // 1. Sync data back to app state before generating
      const riskType: RiskProfileType = 
        formData.riskTolerance < 30 ? 'Conservative' :
        formData.riskTolerance < 60 ? 'Moderate' :
        formData.riskTolerance < 85 ? 'Aggressive' : 'Very Aggressive';
      
      const memberId = portfolio.selectedMemberId === 'family' ? 'm1' : portfolio.selectedMemberId;

      // Sync risk profile
      await updateRiskProfile({
        memberId,
        type: riskType,
        score: formData.riskTolerance,
        lastAssessed: new Date().toISOString()
      });

      // Sync emergency fund
      await updateEmergencyFund({
        memberId,
        targetMonths: formData.emergencyFundTarget,
        currentAmount: portfolio.emergencyFund?.currentAmount || 0,
        monthlyExpense: formData.monthlyExpenses
      });

      // Sync family members (KYC, PAN suffix, retirement age)
      for (const member of formData.familyMembers) {
        await updateFamilyMember(member);
      }

      // Sync incomes if changed (simplified - updating first found income)
      if (formData.monthlyIncome > 0) {
        if (portfolio.incomes.length > 0) {
          if (formData.monthlyIncome !== portfolio.incomes.reduce((a, b) => a + b.amount, 0)) {
            await updateIncome({ ...portfolio.incomes[0], amount: formData.monthlyIncome });
          }
        } else {
          await addIncome({
            memberId,
            source: 'Salary',
            amount: formData.monthlyIncome,
            frequency: 'Monthly',
            category: 'Primary'
          });
        }
      }

      // Sync expenses if changed
      if (formData.monthlyExpenses > 0) {
        if (portfolio.expenses.length > 0) {
          if (formData.monthlyExpenses !== portfolio.expenses.reduce((a, b) => a + b.amount, 0)) {
            await updateExpense({ ...portfolio.expenses[0], amount: formData.monthlyExpenses });
          }
        } else {
          await addExpense({
            memberId,
            category: 'Living Expenses',
            amount: formData.monthlyExpenses,
            frequency: 'Monthly',
            isEssential: true
          });
        }
      }

      // Sync estate planning (will status)
      await updateEstatePlanning({
        ...portfolio.estatePlanning,
        memberId,
        willStatus: formData.hasWill ? 'Registered' : 'Not Started'
      });

      // Sync the main goal
      const existingGoal = portfolio.goals.find(g => g.name === formData.mainGoal);
      if (!existingGoal) {
        await addGoal({
          memberId,
          name: formData.mainGoal,
          targetAmount: 0,
          currentAmount: 0,
          targetDate: new Date(new Date().getFullYear() + 10, 0, 1).toISOString().split('T')[0],
          priority: 'High',
          category: formData.mainGoal === 'Child Higher Education' ? 'Education' : 
                    formData.mainGoal === 'Retirement Corpus' ? 'Retirement' : 
                    formData.mainGoal === 'Startup/Business Capital' ? 'Briefcase' : 'Other'
        });
      }

      // Construct a fresh portfolio object for the AI generation to avoid stale state issues
      const freshIncomes = formData.monthlyIncome > 0 
        ? (portfolio.incomes.length > 0 
            ? [{ ...portfolio.incomes[0], amount: formData.monthlyIncome }, ...portfolio.incomes.slice(1)]
            : [{ memberId, source: 'Salary', amount: formData.monthlyIncome, frequency: 'Monthly', category: 'Primary' }])
        : portfolio.incomes;

      const freshExpenses = formData.monthlyExpenses > 0
        ? (portfolio.expenses.length > 0 
            ? [{ ...portfolio.expenses[0], amount: formData.monthlyExpenses }, ...portfolio.expenses.slice(1)]
            : [{ memberId, category: 'Living Expenses', amount: formData.monthlyExpenses, frequency: 'Monthly', isEssential: true }])
        : portfolio.expenses;

      const freshPortfolio: PortfolioState = {
        ...portfolio,
        riskProfile: {
          ...portfolio.riskProfile,
          [memberId]: {
            type: riskType,
            score: formData.riskTolerance,
            lastAssessed: new Date().toISOString()
          }
        },
        emergencyFund: {
          ...portfolio.emergencyFund,
          targetMonths: formData.emergencyFundTarget,
          monthlyExpense: formData.monthlyExpenses
        },
        familyMembers: formData.familyMembers,
        estatePlanning: {
          ...portfolio.estatePlanning,
          willStatus: formData.hasWill ? 'Registered' : 'Not Started'
        },
        incomes: freshIncomes as any,
        expenses: freshExpenses as any
      };

      // Generate the plan using the fresh snapshot
      const plan = await generateDetailedFinancialPlan(freshPortfolio);
      setGeneratedPlan(plan);
      await updateFinancialPlan(plan);
      setCurrentStep('intro'); // Add this to show the plan immediately
      toast.success('Your strategic roadmap has been generated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate roadmap. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedPlan) return;
    try {
      const doc = generateFinancialPlanPDF(generatedPlan, portfolio);
      const filename = `Strategic_Wealth_Roadmap_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF.');
    }
  };

  const downloadExcel = () => {
    if (!generatedPlan) return;
    try {
      const { netWorthAnalysis, cashFlowAnalysis, goalGapAnalysis } = generatedPlan;
      
      const wb = XLSX.utils.book_new();
      
      // Net Worth Sheet
      const nwData = [
        ['Category', 'Invested', 'Current', 'Allocation %'],
        ...netWorthAnalysis.detailedAssetTable.map(a => [a.name, a.invested, a.current, a.allocation])
      ];
      const nwSheet = XLSX.utils.aoa_to_sheet(nwData);
      XLSX.utils.book_append_sheet(wb, nwSheet, 'Net Worth');
      
      // Goals Sheet
      const goalsData = [
        ['Goal', 'Target', 'Current', 'Gap', 'Status', 'Years Left'],
        ...goalGapAnalysis.map(g => [g.goalName, g.targetAmount, g.currentAmount, g.gap, g.status, g.yearsRemaining])
      ];
      const goalsSheet = XLSX.utils.aoa_to_sheet(goalsData);
      XLSX.utils.book_append_sheet(wb, goalsSheet, 'Goals');
      
      XLSX.writeFile(wb, `Strategic_Wealth_Roadmap_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel downloaded successfully!');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel.');
    }
  };

  if (generatedPlan && currentStep === 'intro') {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Map className="text-wealth-navy" size={32} />
              Strategic Wealth Roadmap
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Your personalized long-term financial architecture</p>
          </div>
          <button 
            onClick={() => {
              setGeneratedPlan(undefined);
              setCurrentStep('family');
            }}
            className="px-6 py-3 bg-wealth-navy text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Sparkles size={20} className="text-wealth-gold" />
            Recalibrate Roadmap
          </button>
        </div>

        <DetailedFinancialPlanView 
          plan={generatedPlan} 
          portfolio={portfolio} 
          onDownloadPDF={downloadPDF}
          onDownloadExcel={downloadExcel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 bg-wealth-paper/30">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        {currentStep !== 'intro' && (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Step {currentStepIndex} of {steps.length - 1}
              </span>
              <span className="text-sm font-bold text-wealth-navy">{steps[currentStepIndex].title}</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-wealth-navy"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentStep === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="inline-block p-4 bg-wealth-navy rounded-3xl shadow-2xl shadow-indigo-200 mb-4">
                <Map size={48} className="text-wealth-gold" />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Strategic Wealth Roadmap</h1>
              <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto">
                Move beyond simple tracking. Construct a institutional-grade financial plan that evolves with your life goals and market conditions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
                {[
                  { icon: Target, title: 'Goal Precision', desc: 'Bridge the gap between your current assets and target corpus.' },
                  { icon: ShieldCheck, title: 'Risk Guard', desc: 'Optimize your allocation based on your personal volatility tolerance.' },
                  { icon: Activity, title: 'Live Sync', desc: 'Your plan refreshes as your investments and incomes change.' },
                  { icon: Sparkles, title: 'AI Insights', desc: 'Institutional strategies tailored for your specific family context.' }
                ].map((feature, i) => (
                  <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <feature.icon className="text-wealth-navy mb-2" size={20} />
                    <h3 className="font-bold text-slate-800 text-sm">{feature.title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto mt-8">
                <button 
                  onClick={handleNext}
                  className="flex-1 px-10 py-5 bg-wealth-navy text-white rounded-3xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-indigo-200 group"
                >
                  Construct Roadmap
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json,.html';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        toast.success(`Importing data from ${file.name}...`);
                        // Logic to parse file would go here
                      }
                    };
                    input.click();
                  }}
                  className="px-10 py-5 bg-white text-wealth-navy border-2 border-wealth-navy/10 rounded-3xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-lg"
                >
                  <Download size={18} className="rotate-180" />
                  Import from File
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'family' && (
            <motion.div 
              key="family"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Family Nucleus</h2>
                <p className="text-slate-500 text-sm font-medium">Verify profiles and compliance vitals.</p>
              </div>

              <div className="space-y-6 max-h-[400px] overflow-y-auto px-2 custom-scrollbar">
                {formData.familyMembers.map((member, idx) => (
                  <div key={member.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{member.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{member.relationship}</p>
                        </div>
                      </div>
                      <select 
                        value={member.kycStatus || 'Not Verified'}
                        onChange={(e) => {
                          const newMembers = [...formData.familyMembers];
                          newMembers[idx] = { ...newMembers[idx], kycStatus: e.target.value as any };
                          setFormData({ ...formData, familyMembers: newMembers });
                        }}
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border transition-colors ${
                          member.kycStatus === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}
                      >
                        <option value="Verified">Verified</option>
                        <option value="Not Verified">Not Verified</option>
                        <option value="In Progress">In Progress</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PAN Suffix</label>
                        <input 
                          type="text"
                          maxLength={5}
                          value={member.panSuffix || ''}
                          placeholder="e.g., FKSPS"
                          onChange={(e) => {
                            const newMembers = [...formData.familyMembers];
                            newMembers[idx] = { ...newMembers[idx], panSuffix: e.target.value.toUpperCase() };
                            setFormData({ ...formData, familyMembers: newMembers });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Retirement Age</label>
                        <input 
                          type="number"
                          value={member.retirementAge || 60}
                          onChange={(e) => {
                            const newMembers = [...formData.familyMembers];
                            newMembers[idx] = { ...newMembers[idx], retirementAge: parseInt(e.target.value) };
                            setFormData({ ...formData, familyMembers: newMembers });
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold flex items-center justify-center gap-2 hover:text-wealth-navy transition-colors">
                  <ChevronLeft size={18} /> BACK
                </button>
                <button onClick={handleNext} className="flex-[2] py-4 bg-wealth-navy text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  CONTINUE
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'vitals' && (
            <motion.div 
              key="vitals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Vitals</h2>
                <p className="text-slate-500 text-sm font-medium">Current cash flow dynamics (Monthly).</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Monthly Household Income</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number"
                      value={formData.monthlyIncome}
                      onChange={(e) => setFormData({...formData, monthlyIncome: parseInt(e.target.value) || 0})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wealth-navy/5 focus:border-wealth-navy font-bold text-slate-900"
                      placeholder="e.g., 2,50,000"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Monthly Essential Expenses</label>
                  <div className="relative">
                    <ShoppingBag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number"
                      value={formData.monthlyExpenses}
                      onChange={(e) => setFormData({...formData, monthlyExpenses: parseInt(e.target.value) || 0})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-wealth-navy/5 focus:border-wealth-navy font-bold text-slate-900"
                      placeholder="e.g., 85,000"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Potential Monthly Surplus</p>
                    <p className="text-lg font-black text-emerald-900">₹ {(formData.monthlyIncome - formData.monthlyExpenses).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Savings Rate</p>
                    <p className="text-lg font-black text-emerald-900">
                      {formData.monthlyIncome > 0 ? Math.round(((formData.monthlyIncome - formData.monthlyExpenses)/formData.monthlyIncome)*100) : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold flex items-center justify-center gap-2 hover:text-wealth-navy transition-colors">
                  <ChevronLeft size={18} /> BACK
                </button>
                <button onClick={handleNext} className="flex-[2] py-4 bg-wealth-navy text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  CONTINUE
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'risk' && (
            <motion.div 
              key="risk"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Risk Resilience</h2>
                <p className="text-slate-500 text-sm font-medium">How would you react to a 20% market drop?</p>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span>Ultra Conservative</span>
                    <span>Aggressive Growth</span>
                  </div>
                  <div className="relative pt-1">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={formData.riskTolerance}
                      onChange={(e) => setFormData({...formData, riskTolerance: parseInt(e.target.value) || 0})}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-wealth-navy"
                    />
                    <div 
                      className="absolute top-[-24px] px-2 py-1 bg-wealth-navy text-white text-[10px] font-bold rounded-lg transition-all"
                      style={{ left: `calc(${formData.riskTolerance}% - 20px)` }}
                    >
                      {formData.riskTolerance}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { val: 20, label: 'Capital Preservation', desc: 'Heavy protection, very low appetite for volatility.', color: 'slate' },
                    { val: 50, label: 'Balanced Growth', desc: 'Combination of stability and moderate equity exposure.', color: 'indigo' },
                    { val: 85, label: 'Wealth Maximizer', desc: 'Focus on long-term alpha, high comfort with volatility.', color: 'wealth-navy' }
                  ].map((preset, i) => (
                    <button 
                      key={i}
                      onClick={() => setFormData({...formData, riskTolerance: preset.val})}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        Math.abs(formData.riskTolerance - preset.val) <= 15
                          ? 'border-wealth-navy bg-wealth-navy/5' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <h4 className="font-bold text-sm text-slate-800">{preset.label}</h4>
                      <p className="text-xs text-slate-500">{preset.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold flex items-center justify-center gap-2 hover:text-wealth-navy transition-colors">
                  <ChevronLeft size={18} /> BACK
                </button>
                <button onClick={handleNext} className="flex-[2] py-4 bg-wealth-navy text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  CONTINUE
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'protection' && (
            <motion.div 
              key="protection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Safety Net</h2>
                <p className="text-slate-500 text-sm font-medium">Resilience checks for market and life shocks.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Fund Target (Months of Expense)</label>
                  <div className="flex items-center gap-4">
                    {[3, 6, 9, 12, 18].map(m => (
                      <button 
                        key={m}
                        onClick={() => setFormData({...formData, emergencyFundTarget: m})}
                        className={`flex-1 py-3 rounded-2xl font-bold text-xs border transition-all ${
                          formData.emergencyFundTarget === m 
                            ? 'bg-wealth-navy text-white border-wealth-navy shadow-md' 
                            : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        {m}M
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock size={18} className="text-wealth-navy" />
                      <span className="text-sm font-bold text-slate-800">Estate Transition Plan</span>
                    </div>
                    <button 
                      onClick={() => setFormData({...formData, hasWill: !formData.hasWill})}
                      className={`relative w-12 h-6 rounded-full transition-colors ${formData.hasWill ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.hasWill ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Do you have a legally drafted will or clear nomination structure for all digital and physical assets?
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                  <ShieldCheck className="text-indigo-600 shrink-0" size={24} />
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Health Coverage</h4>
                    <p className="text-[10px] text-indigo-700 font-medium leading-tight">We will analyze your existing {portfolio.insurances.length} policies for any protection gaps.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold flex items-center justify-center gap-2 hover:text-wealth-navy transition-colors">
                  <ChevronLeft size={18} /> BACK
                </button>
                <button onClick={handleNext} className="flex-[2] py-4 bg-wealth-navy text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  CONTINUE
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'goals' && (
            <motion.div 
              key="goals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Priority Goals</h2>
                <p className="text-slate-500 text-sm font-medium">What is the single most important target for the next 10 years?</p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Landmark, title: 'Retirement Corpus', desc: 'Secure an inflation-proof monthly annuity.' },
                  { icon: Briefcase, title: 'Startup/Business Capital', desc: 'Funding specific entrepreneurial ventures.' },
                  { icon: BookOpen, title: 'Child Higher Education', desc: 'International standard educational corpus.' },
                  { icon: Zap, title: 'Financial Independence (FIRE)', desc: 'Reaching a stage where work is optional.' }
                ].map((goal, i) => (
                  <button 
                    key={i}
                    onClick={() => setFormData({...formData, mainGoal: goal.title})}
                    className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-all group ${
                      formData.mainGoal === goal.title
                        ? 'border-wealth-navy bg-wealth-navy/5 ring-4 ring-wealth-navy/5' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-colors ${formData.mainGoal === goal.title ? 'bg-wealth-navy text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                      <goal.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{goal.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{goal.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={handleBack} className="flex-1 py-4 text-slate-400 font-bold flex items-center justify-center gap-2 hover:text-wealth-navy transition-colors">
                  <ChevronLeft size={18} /> BACK
                </button>
                <button onClick={handleNext} className="flex-[2] py-4 bg-wealth-navy text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                  CONTINUE
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 'generate' && (
            <motion.div 
              key="generate"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-8"
            >
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 bg-wealth-navy/10 rounded-[2.5rem] animate-pulse" />
                <div className="absolute inset-4 bg-wealth-navy rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-200">
                  <Sparkles size={40} className="text-wealth-gold" />
                </div>
                <motion.div 
                  className="absolute inset-0 border-2 border-dashed border-wealth-navy/20 rounded-[2.5rem]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ready to Architect</h2>
                <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  We've gathered the core intelligence for your family roadmap. Now let's build the plan.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm max-w-sm mx-auto text-left space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700">Consolidated {portfolio.investments.length} Assets</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700">Mapped {portfolio.goals.length} Life Milestones</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700">Analysis of {formData.riskTolerance}% Risk Profile</span>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-sm mx-auto pt-4 font-bold text-xs uppercase tracking-widest">
                <button 
                  disabled={isGenerating}
                  onClick={generatePlan}
                  className="w-full py-5 bg-wealth-navy text-white rounded-3xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-indigo-300/50 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap size={20} className="text-wealth-gold" />
                      </motion.div>
                      ARCHITECTING...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className="text-wealth-gold" />
                      GENERATE STRATEGIC ROADMAP
                    </>
                  )}
                </button>
                <button onClick={handleBack} disabled={isGenerating} className="py-2 text-slate-400 hover:text-wealth-navy transition-colors">
                  REVISE INPUTS
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-30">
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-wealth-navy/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-wealth-gold/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};

export default StrategicRoadmap;
