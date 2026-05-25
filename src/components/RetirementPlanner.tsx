
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Save, 
  ChevronRight, 
  Info,
  AlertCircle,
  IndianRupee,
  Calendar,
  Zap,
  Table as TableIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { PortfolioState, FamilyMember, RetirementBucket } from '../types';

interface Scenario {
  id: string;
  name: string;
  retirementAge: number;
  lifeExpectancy: number;
  monthlyExpenses: number;
  inflation: number;
  preRetirementReturn: number;
  postRetirementReturn: number;
  volatility: number; // Standard deviation for Monte Carlo
  startingSavings?: number; // Optional override for current savings
}

interface RetirementPlannerProps {
  portfolio: PortfolioState;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioState>>;
  updateInvestment?: (investment: any) => Promise<void>;
}

const RetirementPlanner: React.FC<RetirementPlannerProps> = ({ portfolio, setPortfolio, updateInvestment }) => {
  // Get current age from primary member (Self)
  const primaryMember = portfolio.familyMembers.find(m => m.relationship === 'Self') || portfolio.familyMembers[0];
  const defaultCurrentAge = primaryMember?.age || 30;

  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: 'base',
      name: 'Base Scenario',
      retirementAge: 55,
      lifeExpectancy: 85,
      monthlyExpenses: 50000,
      inflation: 6,
      preRetirementReturn: 12,
      postRetirementReturn: 8,
      volatility: 15
    },
    {
      id: 'early',
      name: 'Early Retirement',
      retirementAge: 45,
      lifeExpectancy: 85,
      monthlyExpenses: 50000,
      inflation: 6,
      preRetirementReturn: 12,
      postRetirementReturn: 8,
      volatility: 15
    }
  ]);

  const [activeScenarioId, setActiveScenarioId] = useState<string>('base');
  const [isMonteCarloEnabled, setIsMonteCarloEnabled] = useState(false);
  const [activeView, setActiveView] = useState<'projection' | 'buckets' | 'comparison'>('projection');
  const [swpView, setSwpView] = useState<'summary' | 'schedule'>('summary');

  // SWP Calculator State
  const [swpCorpus, setSwpCorpus] = useState<number>(0);
  const [swpReturn, setSwpReturn] = useState<number>(8);
  const [swpYears, setSwpYears] = useState<number>(25);
  const [swpMode, setSwpMode] = useState<'optimal' | 'custom'>('optimal');
  const [swpCustomAmount, setSwpCustomAmount] = useState<number>(0);
  const [swpYearlyIncrease, setSwpYearlyIncrease] = useState<number>(0);

  const activeScenario = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId) || scenarios[0], 
    [scenarios, activeScenarioId]
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const calculateRetirement = (scenario: Scenario) => {
    const yearsToRetirement = Math.max(0, scenario.retirementAge - defaultCurrentAge);
    const yearsInRetirement = Math.max(0, scenario.lifeExpectancy - scenario.retirementAge);
    
    // Future monthly expense at retirement
    const futureMonthlyExpense = scenario.monthlyExpenses * Math.pow(1 + scenario.inflation / 100, yearsToRetirement);
    const futureAnnualExpense = futureMonthlyExpense * 12;
    
    // Real rate of return post-retirement
    const realRate = ((1 + scenario.postRetirementReturn / 100) / (1 + scenario.inflation / 100)) - 1;
    
    // Corpus required (Present Value of Annuity)
    // Formula: P = A * [(1 - (1+r)^-n) / r]
    const corpus = realRate === 0 
      ? futureAnnualExpense * yearsInRetirement 
      : futureAnnualExpense * ((1 - Math.pow(1 + realRate, -yearsInRetirement)) / realRate);
    
    return {
      yearsToRetirement,
      yearsInRetirement,
      futureMonthlyExpense,
      futureAnnualExpense,
      corpus,
      realRate
    };
  };

  const results = useMemo(() => calculateRetirement(activeScenario), [activeScenario, defaultCurrentAge]);

  // Update SWP corpus when results change
  useEffect(() => {
    if (results.corpus > 0 && swpCorpus === 0) {
      setSwpCorpus(Math.round(results.corpus));
      setSwpYears(results.yearsInRetirement);
    }
  }, [results.corpus, results.yearsInRetirement]);

  // Current Savings Calculation
  const currentSavings = useMemo(() => {
    return portfolio.investments.reduce((sum, inv) => sum + inv.currentValue, 0) + 
           portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [portfolio.investments, portfolio.bankAccounts]);

  // Projected Corpus at Retirement
  const projectedCorpus = useMemo(() => {
    const r = activeScenario.preRetirementReturn / 100;
    const t = results.yearsToRetirement;
    const initialFunds = activeScenario.startingSavings !== undefined ? activeScenario.startingSavings : currentSavings;
    return initialFunds * Math.pow(1 + r, t);
  }, [currentSavings, activeScenario.preRetirementReturn, activeScenario.startingSavings, results.yearsToRetirement]);

  const gap = Math.max(0, results.corpus - projectedCorpus);

  // Monte Carlo Simulation Logic
  const monteCarloResults = useMemo(() => {
    if (!isMonteCarloEnabled) return null;

    const iterations = 500;
    const preR = activeScenario.preRetirementReturn / 100;
    const postR = activeScenario.postRetirementReturn / 100;
    const vol = activeScenario.volatility / 100;
    const infl = activeScenario.inflation / 100;
    const yearsToRetire = results.yearsToRetirement;
    const yearsInRetire = results.yearsInRetirement;
    const totalYears = yearsToRetire + yearsInRetire;

    // Helper for normal distribution (Box-Muller)
    const randomNormal = () => {
      let u = 0, v = 0;
      while(u === 0) u = Math.random();
      while(v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    const allPaths: number[][] = [];
    let successCount = 0;
    const initialFunds = activeScenario.startingSavings !== undefined ? activeScenario.startingSavings : currentSavings;

    for (let i = 0; i < iterations; i++) {
      let currentVal = initialFunds;
      let expense = activeScenario.monthlyExpenses * 12;
      const path: number[] = [currentVal];

      // Accumulation
      for (let y = 1; y <= yearsToRetire; y++) {
        const annualReturn = preR + vol * randomNormal();
        currentVal = currentVal * (1 + annualReturn);
        path.push(currentVal);
      }

      // Retirement
      let retirementExpense = expense * Math.pow(1 + infl, yearsToRetire);
      let failed = false;
      for (let y = 1; y <= yearsInRetire; y++) {
        const annualReturn = postR + vol * randomNormal();
        currentVal = (currentVal - retirementExpense) * (1 + annualReturn);
        if (currentVal < 0) {
          currentVal = 0;
          failed = true;
        }
        path.push(currentVal);
        retirementExpense = retirementExpense * (1 + infl);
      }

      if (!failed) successCount++;
      allPaths.push(path);
    }

    // Calculate percentiles for each year
    const percentiles = [];
    for (let y = 0; y <= totalYears; y++) {
      const valuesAtYear = allPaths.map(p => p[y]).sort((a, b) => a - b);
      percentiles.push({
        age: defaultCurrentAge + y,
        p10: valuesAtYear[Math.floor(iterations * 0.1)],
        p50: valuesAtYear[Math.floor(iterations * 0.5)],
        p90: valuesAtYear[Math.floor(iterations * 0.9)],
      });
    }

    return {
      successRate: (successCount / iterations) * 100,
      percentiles
    };
  }, [isMonteCarloEnabled, activeScenario, currentSavings, results, defaultCurrentAge]);

  // SWP Calculation
  const swpResults = useMemo(() => {
    const monthlyRate = swpReturn / 12 / 100;
    const totalMonths = swpYears * 12;
    const annualRate = swpReturn / 100;
    const growthRate = swpYearlyIncrease / 100;
    
    let initialMonthlyWithdrawal = 0;

    if (swpMode === 'optimal') {
      // If there's a yearly increase, we need a different formula for "optimal"
      // This is the Present Value of a Growing Annuity formula (adjusted for monthly/yearly)
      // For simplicity, we'll use a numerical approach or a standard growing annuity formula
      if (swpYearlyIncrease === 0) {
        if (monthlyRate === 0) {
          initialMonthlyWithdrawal = swpCorpus / totalMonths;
        } else {
          initialMonthlyWithdrawal = swpCorpus * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }
      } else {
        // Growing Annuity Formula: PV = C * [1 - ((1+g)/(1+r))^n] / (r - g)
        // Here r is annual return, g is annual growth, n is years
        const r = annualRate;
        const g = growthRate;
        const n = swpYears;
        
        if (r === g) {
          initialMonthlyWithdrawal = (swpCorpus / n) / 12;
        } else {
          const annualWithdrawal = swpCorpus * (r - g) / (1 - Math.pow((1 + g) / (1 + r), n));
          initialMonthlyWithdrawal = annualWithdrawal / 12;
        }
      }
    } else {
      initialMonthlyWithdrawal = swpCustomAmount;
    }

    // Generate yearly schedule
    const yearlySchedule = [];
    let currentBalance = swpCorpus;
    let currentMonthlyWithdrawal = initialMonthlyWithdrawal;
    let totalWithdrawn = 0;
    let isExhausted = false;
    let exhaustionYear = null;

    for (let year = 1; year <= swpYears; year++) {
      let interestEarned = 0;
      let actualWithdrawalThisYear = 0;
      
      // Calculate interest monthly
      for (let month = 1; month <= 12; month++) {
        const monthlyInterest = currentBalance * monthlyRate;
        interestEarned += monthlyInterest;
        
        const withdrawal = Math.min(currentBalance + monthlyInterest, currentMonthlyWithdrawal);
        actualWithdrawalThisYear += withdrawal;
        currentBalance = currentBalance + monthlyInterest - withdrawal;

        if (currentBalance <= 0 && !isExhausted && withdrawal < currentMonthlyWithdrawal) {
          isExhausted = true;
          exhaustionYear = year;
        }
      }

      totalWithdrawn += actualWithdrawalThisYear;

      // Determine source of funding based on year
      let source = 'Long-term Bucket';
      if (year <= 3) source = 'Short-term Bucket';
      else if (year <= 7) source = 'Medium-term Bucket';

      yearlySchedule.push({
        year,
        age: activeScenario.retirementAge + year,
        withdrawal: actualWithdrawalThisYear,
        interest: interestEarned,
        endBalance: Math.max(0, currentBalance),
        source
      });

      // Apply yearly increase for next year
      currentMonthlyWithdrawal = currentMonthlyWithdrawal * (1 + growthRate);
    }

    return {
      monthlyWithdrawal: initialMonthlyWithdrawal,
      totalWithdrawn,
      totalInterest: totalWithdrawn - swpCorpus,
      yearlySchedule,
      isExhausted,
      exhaustionYear
    };
  }, [swpCorpus, swpReturn, swpYears, swpMode, swpCustomAmount, swpYearlyIncrease, activeScenario.retirementAge]);

  // Chart Data: Corpus over time
  const chartData = useMemo(() => {
    if (isMonteCarloEnabled && monteCarloResults) {
      return monteCarloResults.percentiles;
    }

    const data = [];
    const preR = activeScenario.preRetirementReturn / 100;
    const postR = activeScenario.postRetirementReturn / 100;
    const infl = activeScenario.inflation / 100;
    
    const initialFunds = activeScenario.startingSavings !== undefined ? activeScenario.startingSavings : currentSavings;
    let currentVal = initialFunds;
    let expense = activeScenario.monthlyExpenses * 12;

    // Accumulation Phase
    for (let age = defaultCurrentAge; age <= activeScenario.retirementAge; age++) {
      data.push({
        age,
        value: currentVal,
        phase: 'Accumulation'
      });
      currentVal = currentVal * (1 + preR);
    }

    // Retirement Phase
    let retirementVal = currentVal;
    let retirementExpense = expense * Math.pow(1 + infl, activeScenario.retirementAge - defaultCurrentAge);

    for (let age = activeScenario.retirementAge + 1; age <= activeScenario.lifeExpectancy; age++) {
      retirementVal = (retirementVal - retirementExpense) * (1 + postR);
      data.push({
        age,
        value: Math.max(0, retirementVal),
        phase: 'Retirement'
      });
      retirementExpense = retirementExpense * (1 + infl);
    }

    return data;
  }, [currentSavings, activeScenario, defaultCurrentAge]);

  const handleUpdateScenario = (updates: Partial<Scenario>) => {
    setScenarios(prev => prev.map(s => s.id === activeScenarioId ? { ...s, ...updates } : s));
  };

  const handleUpdateInvestmentBucket = async (investmentId: string, bucket: RetirementBucket) => {
    const investment = portfolio.investments.find(i => i.id === investmentId);
    if (investment) {
      const updatedInvestment = { ...investment, retirementBucket: bucket };
      
      // Update local state
      setPortfolio(prev => ({
        ...prev,
        investments: prev.investments.map(i => i.id === investmentId ? updatedInvestment : i)
      }));

      // Persist to Firebase
      if (updateInvestment) {
        try {
          await updateInvestment(updatedInvestment);
        } catch (error) {
          console.error("Failed to update investment bucket:", error);
        }
      }
    }
  };

  const bucketData = useMemo(() => {
    const buckets = {
      'Short-term': { value: 0, investments: [] as any[] },
      'Medium-term': { value: 0, investments: [] as any[] },
      'Long-term': { value: 0, investments: [] as any[] },
      'None': { value: 0, investments: [] as any[] }
    };

    portfolio.investments.forEach(inv => {
      const bucket = inv.retirementBucket || 'None';
      buckets[bucket].value += inv.currentValue;
      buckets[bucket].investments.push(inv);
    });

    return [
      { name: 'Short-term', value: buckets['Short-term'].value, color: '#10b981', description: '0-3 years (Cash, Liquid, FDs)', target: results.futureAnnualExpense * 3 },
      { name: 'Medium-term', value: buckets['Medium-term'].value, color: '#3b82f6', description: '3-7 years (Debt, Hybrid)', target: results.futureAnnualExpense * 4 },
      { name: 'Long-term', value: buckets['Long-term'].value, color: '#8b5cf6', description: '7+ years (Equity, Real Estate)', target: results.corpus - (results.futureAnnualExpense * 7) }
    ];
  }, [portfolio.investments, results]);

  const handleAddScenario = () => {
    const newId = `scenario-${Date.now()}`;
    const newScenario: Scenario = {
      ...activeScenario,
      id: newId,
      name: `Scenario ${scenarios.length + 1}`
    };
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newId);
  };

  const handleDeleteScenario = (id: string) => {
    if (scenarios.length === 1) return;
    const newScenarios = scenarios.filter(s => s.id !== id);
    setScenarios(newScenarios);
    if (activeScenarioId === id) {
      setActiveScenarioId(newScenarios[0].id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Retirement Planner</h2>
          <p className="text-slate-500">Design your golden years with multi-scenario analysis</p>
        </div>
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setActiveView('projection')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'projection' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Projection
              </button>
              <button
                onClick={() => setActiveView('buckets')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'buckets' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Bucket Strategy
              </button>
              <button
                onClick={() => setActiveView('comparison')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeView === 'comparison' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Comparison
              </button>
            </div>
            <button 
              onClick={handleAddScenario}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Plus size={18} />
              New Scenario
            </button>
          </div>
      </div>

      {/* Scenario Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {scenarios.map((s) => (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => setActiveScenarioId(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeScenarioId === s.id 
                  ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' 
                  : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              {s.name}
            </button>
            {scenarios.length > 1 && (
              <button 
                onClick={() => handleDeleteScenario(s.id)}
                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Target size={20} />
                </div>
                <h3 className="font-bold text-slate-900">Scenario Parameters</h3>
              </div>
              <button
                onClick={() => setIsMonteCarloEnabled(!isMonteCarloEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  isMonteCarloEnabled 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Zap size={12} />
                MONTE CARLO
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Scenario Name</label>
                <input 
                  type="text"
                  value={activeScenario.name}
                  onChange={(e) => handleUpdateScenario({ name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Retirement Age</label>
                  <input 
                    type="number"
                    value={activeScenario.retirementAge}
                    onChange={(e) => handleUpdateScenario({ retirementAge: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Life Expectancy</label>
                  <input 
                    type="number"
                    value={activeScenario.lifeExpectancy}
                    onChange={(e) => handleUpdateScenario({ lifeExpectancy: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Monthly Expenses (Today)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number"
                    value={activeScenario.monthlyExpenses}
                    onChange={(e) => handleUpdateScenario({ monthlyExpenses: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Annual: {formatCurrency(activeScenario.monthlyExpenses * 12)}</span>
                  <button 
                    onClick={() => {
                      const annual = activeScenario.monthlyExpenses * 12;
                      const newAnnual = prompt("Enter Annual Expenses:", annual.toString());
                      if (newAnnual) handleUpdateScenario({ monthlyExpenses: Math.round(Number(newAnnual) / 12) });
                    }}
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    Edit Annual
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Starting Savings (Override)</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number"
                    placeholder={`Current: ${formatCurrency(currentSavings)}`}
                    value={activeScenario.startingSavings === undefined ? '' : activeScenario.startingSavings}
                    onChange={(e) => handleUpdateScenario({ startingSavings: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Inflation Rate (%)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="0" max="15" step="0.5"
                    value={activeScenario.inflation}
                    onChange={(e) => handleUpdateScenario({ inflation: Number(e.target.value) })}
                    className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <span className="text-sm font-bold text-slate-700 min-w-[40px]">{activeScenario.inflation}%</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Returns</h4>
                  {isMonteCarloEnabled && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">VOLATILITY:</span>
                      <span className="text-[10px] font-bold text-purple-600">{activeScenario.volatility}%</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Pre-Retirement (%)</label>
                    <input 
                      type="number"
                      value={activeScenario.preRetirementReturn}
                      onChange={(e) => handleUpdateScenario({ preRetirementReturn: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Post-Retirement (%)</label>
                    <input 
                      type="number"
                      value={activeScenario.postRetirementReturn}
                      onChange={(e) => handleUpdateScenario({ postRetirementReturn: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>
                {isMonteCarloEnabled && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Return Volatility (Std Dev %)</label>
                    <input 
                      type="range" min="0" max="30" step="1"
                      value={activeScenario.volatility}
                      onChange={(e) => handleUpdateScenario({ volatility: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Zap size={20} />
                </div>
                <h3 className="font-bold">Quick Insight</h3>
              </div>
              {isMonteCarloEnabled && monteCarloResults && (
                <div className="px-2 py-1 bg-purple-500/30 rounded-lg text-[10px] font-bold border border-white/20">
                  PROBABILITY: {monteCarloResults.successRate.toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-emerald-50 text-sm leading-relaxed">
              Based on your current age of <span className="font-bold text-white">{defaultCurrentAge}</span>, you have <span className="font-bold text-white">{results.yearsToRetirement} years</span> to build your corpus.
            </p>
            <div className="pt-4 border-t border-white/20">
              <div className="flex justify-between items-end">
                <span className="text-xs text-emerald-100 uppercase font-bold tracking-wider">Required Corpus</span>
                <span className="text-2xl font-black">{formatCurrency(results.corpus)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {activeView === 'projection' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Future Monthly Expense</p>
                  <h4 className="text-xl font-bold text-slate-900">{formatCurrency(results.futureMonthlyExpense)}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">At age {activeScenario.retirementAge}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Savings</p>
                  <h4 className="text-xl font-bold text-slate-900">{formatCurrency(currentSavings)}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Investments + Bank Balance</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Retirement Gap</p>
                  <h4 className={`text-xl font-bold ${gap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {gap > 0 ? formatCurrency(gap) : 'Fully Funded'}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Corpus vs Projected Savings</p>
                </div>
              </div>

              {/* Expense Sensitivity Analysis */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />
                    How Expenses Affect Your Required Corpus
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    Annual Projections
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[0.8, 1.0, 1.2, 1.5].map((multiplier) => {
                    const testScenario = { ...activeScenario, monthlyExpenses: Math.round(activeScenario.monthlyExpenses * multiplier) };
                    const testResults = calculateRetirement(testScenario);
                    return (
                      <div key={multiplier} className={`p-4 rounded-2xl border transition-all ${multiplier === 1 ? 'bg-emerald-50 border-emerald-100 ring-4 ring-emerald-500/5' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {multiplier === 1 ? 'Current' : `${multiplier}x Expenses`}
                        </p>
                        <p className="text-[10px] text-slate-500 mb-2 truncate" title={formatCurrency(testScenario.monthlyExpenses * 12)}>
                          {formatCurrency(testScenario.monthlyExpenses * 12)}/yr
                        </p>
                        <p className={`text-sm font-bold ${multiplier === 1 ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {formatCurrency(testResults.corpus)}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1">Target Corpus</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                      <LineChartIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {isMonteCarloEnabled ? 'Monte Carlo Simulation' : 'Wealth Projection'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {isMonteCarloEnabled 
                          ? 'Probability-based outcomes across 500 market scenarios' 
                          : 'Corpus accumulation and depletion over your lifetime'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {isMonteCarloEnabled ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Best (90th)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Median (50th)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Worst (10th)</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Accumulation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-500" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Retirement</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isMonteCarloEnabled ? "#3b82f6" : "#10b981"} stopOpacity={0.1}/>
                          <stop offset="95%" stopColor={isMonteCarloEnabled ? "#3b82f6" : "#10b981"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="age" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                        tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: number) => [formatCurrency(val), 'Corpus']}
                        labelFormatter={(label) => `Age: ${label}`}
                      />
                      {isMonteCarloEnabled ? (
                        <>
                          <Area 
                            type="monotone" 
                            dataKey="p90" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fillOpacity={0}
                            strokeDasharray="5 5"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="p50" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="p10" 
                            stroke="#f43f5e" 
                            strokeWidth={2}
                            fillOpacity={0}
                            strokeDasharray="5 5"
                          />
                        </>
                      ) : (
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorValue)" 
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : activeView === 'buckets' ? (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                    <PieChartIcon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Bucket Strategy Visualization</h3>
                    <p className="text-xs text-slate-500">Managing your retirement corpus for different time horizons</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {bucketData.map((bucket) => (
                    <div key={bucket.name} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: bucket.color }}>{bucket.name}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bucket.color }} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-slate-900">{formatCurrency(bucket.value)}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">{bucket.description}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-slate-400">TARGET</span>
                          <span className="text-slate-900">{formatCurrency(bucket.target)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (bucket.value / bucket.target) * 100)}%` }}
                            className="h-full"
                            style={{ backgroundColor: bucket.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-6">Map Investments to Buckets</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Investment</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Value</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Retirement Bucket</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {portfolio.investments.map((inv) => (
                        <tr key={inv.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <p className="text-sm font-bold text-slate-800">{inv.name}</p>
                            <p className="text-[10px] text-slate-500">{inv.subCategory}</p>
                          </td>
                          <td className="py-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                              {inv.category}
                            </span>
                          </td>
                          <td className="py-4">
                            <p className="text-sm font-bold text-slate-900">{formatCurrency(inv.currentValue)}</p>
                          </td>
                          <td className="py-4">
                            <select 
                              value={inv.retirementBucket || 'None'}
                              onChange={(e) => handleUpdateInvestmentBucket(inv.id, e.target.value as RetirementBucket)}
                              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            >
                              <option value="None">Not Mapped</option>
                              <option value="Short-term">Short-term</option>
                              <option value="Medium-term">Medium-term</option>
                              <option value="Long-term">Long-term</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <BarChartIcon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Scenario Comparison Table</h3>
                  <p className="text-xs text-slate-500">Analyze the impact of different variables side-by-side</p>
                </div>
              </div>

              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 sticky left-0 z-10">Metric</th>
                    {scenarios.map(s => (
                      <th key={s.id} className="px-4 py-4 text-xs font-bold text-slate-900 uppercase tracking-widest text-center">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 bg-slate-50/50 sticky left-0 z-10">Retirement Age</td>
                    {scenarios.map(s => (
                      <td key={s.id} className="px-4 py-4 text-sm text-center font-bold text-slate-900">{s.retirementAge}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 bg-slate-50/50 sticky left-0 z-10">Life Expectancy</td>
                    {scenarios.map(s => (
                      <td key={s.id} className="px-4 py-4 text-sm text-center font-bold text-slate-900">{s.lifeExpectancy}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 bg-slate-50/50 sticky left-0 z-10">Annual Expenses (Today)</td>
                    {scenarios.map(s => (
                      <td key={s.id} className="px-4 py-4 text-sm text-center font-bold text-slate-900">{formatCurrency(s.monthlyExpenses * 12)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 bg-slate-50/50 sticky left-0 z-10">Starting Savings</td>
                    {scenarios.map(s => (
                      <td key={s.id} className="px-4 py-4 text-sm text-center font-bold text-slate-900">
                        {formatCurrency(s.startingSavings !== undefined ? s.startingSavings : currentSavings)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-emerald-50/30">
                    <td className="px-4 py-4 text-sm font-bold text-emerald-900 bg-emerald-50/50 sticky left-0 z-10">Required Corpus</td>
                    {scenarios.map(s => {
                      const sResults = calculateRetirement(s);
                      return (
                        <td key={s.id} className="px-4 py-4 text-sm text-center font-black text-emerald-600">
                          {formatCurrency(sResults.corpus)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 bg-slate-50/50 sticky left-0 z-10">Inflation Rate</td>
                    {scenarios.map(s => (
                      <td key={s.id} className="px-4 py-4 text-sm text-center font-bold text-slate-900">{s.inflation}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 bg-slate-50/50 sticky left-0 z-10">Return (Pre-Retire)</td>
                    {scenarios.map(s => (
                      <td key={s.id} className="px-4 py-4 text-sm text-center font-bold text-slate-900">{s.preRetirementReturn}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 bg-slate-50/50 sticky left-0 z-10">Return (Post-Retire)</td>
                    {scenarios.map(s => (
                      <td key={s.id} className="px-4 py-4 text-sm text-center font-bold text-slate-900">{s.postRetirementReturn}%</td>
                    ))}
                  </tr>
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 bg-slate-50 sticky left-0 z-10">Retirement Gap</td>
                    {scenarios.map(s => {
                      const sResults = calculateRetirement(s);
                      const sInitial = s.startingSavings !== undefined ? s.startingSavings : currentSavings;
                      const sProjected = sInitial * Math.pow(1 + s.preRetirementReturn / 100, sResults.yearsToRetirement);
                      const sGap = Math.max(0, sResults.corpus - sProjected);
                      return (
                        <td key={s.id} className={`px-4 py-4 text-sm text-center font-black ${sGap > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {sGap > 0 ? formatCurrency(sGap) : 'Fully Funded'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="px-4 py-4 text-sm font-bold text-slate-600 bg-slate-50/50 sticky left-0 z-10">Monthly SIP to Bridge Gap</td>
                    {scenarios.map(s => {
                      const sResults = calculateRetirement(s);
                      const sInitial = s.startingSavings !== undefined ? s.startingSavings : currentSavings;
                      const sProjected = sInitial * Math.pow(1 + s.preRetirementReturn / 100, sResults.yearsToRetirement);
                      const sGap = Math.max(0, sResults.corpus - sProjected);
                      
                      if (sGap <= 0 || sResults.yearsToRetirement <= 0) return <td key={s.id} className="px-4 py-4 text-sm text-center text-slate-400">—</td>;
                      
                      const r = s.preRetirementReturn / 100 / 12;
                      const n = sResults.yearsToRetirement * 12;
                      // SIP Formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
                      // P = FV / [((1 + r)^n - 1) / r * (1 + r)]
                      const sip = sGap / (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
                      return (
                        <td key={s.id} className="px-4 py-4 text-sm text-center font-bold text-indigo-600">
                          {formatCurrency(sip)}/mo
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-blue-500" />
                Scenario Comparison
              </h3>
              <div className="space-y-3">
                {scenarios.map(s => {
                  const sResults = calculateRetirement(s);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-500">Retire at {s.retirementAge}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(sResults.corpus)}</p>
                        <p className="text-[10px] text-slate-500">Required</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                Planning Tips
              </h3>
              <ul className="space-y-3">
                <li className="flex gap-3 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  Increasing retirement age by 2 years can reduce required corpus by ~15%.
                </li>
                <li className="flex gap-3 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  A 1% higher pre-retirement return can bridge a significant gap.
                </li>
                <li className="flex gap-3 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  Consider health insurance separately to protect this corpus.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* SWP Calculator Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Systematic Withdrawal Plan (SWP) Calculator</h3>
              <p className="text-xs text-slate-500">Calculate optimal monthly withdrawals to sustain your retirement corpus</p>
            </div>
          </div>
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setSwpView('summary')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                swpView === 'summary' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setSwpView('schedule')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                swpView === 'schedule' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Yearly Schedule
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Withdrawal Mode</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSwpMode('optimal')}
                    className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                      swpMode === 'optimal' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    OPTIMAL
                  </button>
                  <button
                    onClick={() => setSwpMode('custom')}
                    className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                      swpMode === 'custom' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    CUSTOM
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Initial Corpus</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number"
                    value={swpCorpus}
                    onChange={(e) => setSwpCorpus(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              {swpMode === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Monthly Withdrawal</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number"
                      value={swpCustomAmount}
                      onChange={(e) => setSwpCustomAmount(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Yearly Increase (%)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="0" max="15" step="0.5"
                    value={swpYearlyIncrease}
                    onChange={(e) => setSwpYearlyIncrease(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <span className="text-sm font-bold text-slate-700 min-w-[40px]">{swpYearlyIncrease}%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Annual Return (%)</label>
                <input 
                  type="number"
                  value={swpReturn}
                  onChange={(e) => setSwpReturn(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Withdrawal Period (Years)</label>
                <input 
                  type="number"
                  value={swpYears}
                  onChange={(e) => setSwpYears(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {swpView === 'summary' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-purple-600 p-6 rounded-3xl text-white shadow-lg shadow-purple-100">
                    <p className="text-[10px] font-bold text-purple-100 uppercase tracking-widest mb-1">
                      {swpMode === 'optimal' ? 'Optimal' : 'Initial'} Monthly Withdrawal
                    </p>
                    <h4 className="text-2xl font-black">{formatCurrency(swpResults.monthlyWithdrawal)}</h4>
                    <p className="text-[10px] text-purple-200 mt-1">
                      {swpResults.isExhausted 
                        ? `Exhausts in ${swpResults.exhaustionYear} years` 
                        : `Sustainable for ${swpYears} years`}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Withdrawn</p>
                    <h4 className="text-xl font-bold text-slate-900">{formatCurrency(swpResults.totalWithdrawn)}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Principal + Interest</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Interest Earned</p>
                    <h4 className="text-xl font-bold text-emerald-600">{formatCurrency(swpResults.totalInterest)}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">During withdrawal phase</p>
                  </div>
                </div>

                {swpResults.isExhausted && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-4 mb-8">
                    <div className="p-2 bg-rose-100 rounded-xl text-rose-600 h-fit">
                      <AlertCircle size={18} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-rose-900">Corpus Exhaustion Warning</p>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        Your corpus will be fully exhausted in year <span className="font-bold">{swpResults.exhaustionYear}</span> at age <span className="font-bold">{activeScenario.retirementAge + (swpResults.exhaustionYear || 0)}</span>. 
                        Consider reducing the initial withdrawal amount or the yearly increase to make it last longer.
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-4">
                  <div className="p-2 bg-amber-100 rounded-xl text-amber-600 h-fit">
                    <Info size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-900">How SWP works</p>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      A Systematic Withdrawal Plan allows you to withdraw a fixed amount from your investment regularly. 
                      The "Optimal" amount calculated above ensures your entire corpus is utilized exactly over the chosen period, 
                      assuming a constant rate of return. This is ideal for planning a steady income stream during retirement.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-8">
                {/* SWP Chart */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold text-slate-900">Yearly Cashflow & Corpus Depletion</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Corpus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Withdrawal</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={swpResults.yearlySchedule}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="year" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                          label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                          tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          formatter={(val: number) => [formatCurrency(val)]}
                        />
                        <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, paddingBottom: '20px' }} />
                        <Bar dataKey="endBalance" name="Remaining Corpus" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="withdrawal" name="Annual Withdrawal" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* SWP Table */}
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Year</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Age</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Withdrawal</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Interest Earned</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">End Balance</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Source of Funding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {swpResults.yearlySchedule.map((row) => (
                          <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-slate-600">{row.year}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-500">{row.age}</td>
                            <td className="px-6 py-4 text-sm font-bold text-emerald-600">{formatCurrency(row.withdrawal)}</td>
                            <td className="px-6 py-4 text-sm font-medium text-blue-600">{formatCurrency(row.interest)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(row.endBalance)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                row.source === 'Short-term Bucket' ? 'bg-emerald-50 text-emerald-600' :
                                row.source === 'Medium-term Bucket' ? 'bg-blue-50 text-blue-600' :
                                'bg-purple-50 text-purple-600'
                              }`}>
                                {row.source}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RetirementPlanner;
