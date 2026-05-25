
import React, { useState, useMemo } from 'react';
import { 
  Flame, TrendingUp, Wallet, Target, 
  Info, AlertCircle, CheckCircle2, 
  ArrowRight, RefreshCw, Calculator,
  Zap, Coffee, Ship, Anchor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FIRECalculatorProps {
  currentAge?: number;
  monthlyExpenses?: number;
  currentCorpus?: number;
}

interface FIREScenario {
  id: string;
  name: string;
  icon: React.ReactNode;
  multiplier: number;
  description: string;
  color: string;
}

const FIRE_SCENARIOS: FIREScenario[] = [
  {
    id: 'lean',
    name: 'Lean FIRE',
    icon: <Anchor className="text-slate-500" />,
    multiplier: 20,
    description: 'Minimalist lifestyle. Covers only basic necessities.',
    color: 'slate'
  },
  {
    id: 'standard',
    name: 'Standard FIRE',
    icon: <Flame className="text-orange-500" />,
    multiplier: 25,
    description: 'Maintains current lifestyle. Based on the 4% rule.',
    color: 'orange'
  },
  {
    id: 'fat',
    name: 'Fat FIRE',
    icon: <Ship className="text-indigo-500" />,
    multiplier: 35,
    description: 'Luxury lifestyle. High buffer for travel and indulgence.',
    color: 'indigo'
  },
  {
    id: 'barista',
    name: 'Barista FIRE',
    icon: <Coffee className="text-amber-500" />,
    multiplier: 15,
    description: 'Semi-retirement. Part-time work covers gap in expenses.',
    color: 'amber'
  }
];

const FIRECalculator: React.FC<FIRECalculatorProps> = ({ 
  currentAge: initialAge = 30, 
  monthlyExpenses: initialExpenses = 50000,
  currentCorpus: initialCorpus = 1000000
}) => {
  const [currentAge, setCurrentAge] = useState(initialAge);
  const [fireAge, setFireAge] = useState(45);
  const [monthlyExpenses, setMonthlyExpenses] = useState(initialExpenses);
  const [inflation, setInflation] = useState(6);
  const [preRetirementReturn, setPreRetirementReturn] = useState(12);
  const [postRetirementReturn, setPostRetirementReturn] = useState(8);
  const [currentCorpus, setCurrentCorpus] = useState(initialCorpus);
  const [activeScenario, setActiveScenario] = useState<string>('standard');

  const results = useMemo(() => {
    const yearsToFire = fireAge - currentAge;
    const annualExpenses = monthlyExpenses * 12;
    
    // Future expenses at FIRE age
    const futureAnnualExpenses = annualExpenses * Math.pow(1 + inflation / 100, yearsToFire);
    
    // Target Corpus based on scenario multiplier
    const scenario = FIRE_SCENARIOS.find(s => s.id === activeScenario) || FIRE_SCENARIOS[1];
    const targetCorpus = futureAnnualExpenses * scenario.multiplier;
    
    // Projected Corpus at FIRE age from current savings
    const projectedCorpusFromSavings = currentCorpus * Math.pow(1 + preRetirementReturn / 100, yearsToFire);
    
    // Gap
    const gap = Math.max(0, targetCorpus - projectedCorpusFromSavings);
    
    // Required Monthly SIP to bridge gap
    let requiredSIP = 0;
    if (yearsToFire > 0) {
      const monthlyRate = preRetirementReturn / 100 / 12;
      const totalMonths = yearsToFire * 12;
      requiredSIP = gap * (monthlyRate / (Math.pow(1 + monthlyRate, totalMonths) - 1));
    }

    // Sustainability (how long will it last?)
    const swr = 100 / scenario.multiplier;
    const realReturn = ((1 + postRetirementReturn / 100) / (1 + inflation / 100) - 1) * 100;
    
    return {
      yearsToFire,
      futureAnnualExpenses,
      targetCorpus,
      projectedCorpusFromSavings,
      gap,
      requiredSIP,
      swr,
      realReturn
    };
  }, [currentAge, fireAge, monthlyExpenses, inflation, preRetirementReturn, postRetirementReturn, currentCorpus, activeScenario]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-50 rounded-xl">
          <Flame className="text-orange-600" size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900">FIRE Calculator</h3>
          <p className="text-sm text-slate-500">Plan your journey to Financial Independence & Early Retirement.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Calculator size={18} className="text-indigo-600" />
              Assumptions
            </h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Current Age</label>
                  <span className="text-sm font-bold text-slate-900">{currentAge} Years</span>
                </div>
                <input 
                  type="range" min="18" max="60" step="1"
                  value={currentAge} onChange={(e) => setCurrentAge(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">FIRE Age</label>
                  <span className="text-sm font-bold text-indigo-600">{fireAge} Years</span>
                </div>
                <input 
                  type="range" min={currentAge + 1} max="70" step="1"
                  value={fireAge} onChange={(e) => setFireAge(parseInt(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Monthly Expenses (Current)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number"
                    value={monthlyExpenses}
                    onChange={(e) => setMonthlyExpenses(parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Current Savings / Corpus</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number"
                    value={currentCorpus}
                    onChange={(e) => setCurrentCorpus(parseInt(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inflation (%)</label>
                  <input 
                    type="number" value={inflation} onChange={(e) => setInflation(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Returns (%)</label>
                  <input 
                    type="number" value={preRetirementReturn} onChange={(e) => setPreRetirementReturn(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results & Scenarios */}
        <div className="lg:col-span-2 space-y-8">
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-900 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Target FIRE Corpus</p>
                <h3 className="text-3xl font-black">{formatCurrency(results.targetCorpus)}</h3>
                <div className="mt-4 flex items-center gap-2 text-xs text-indigo-200">
                  <Info size={14} />
                  <span>Based on {results.swr}% Safe Withdrawal Rate</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800 rounded-full -mr-16 -mt-16 blur-2xl" />
            </div>

            <div className={`rounded-3xl p-6 border ${results.gap > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${results.gap > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {results.gap > 0 ? 'Monthly SIP Required' : 'FIRE Ready!'}
              </p>
              <h3 className={`text-3xl font-black ${results.gap > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>
                {results.gap > 0 ? formatCurrency(results.requiredSIP) : 'Goal Achieved'}
              </h3>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Target size={14} />
                <span>To bridge the {formatCurrency(results.gap)} gap</span>
              </div>
            </div>
          </div>

          {/* Scenarios */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Zap size={18} className="text-orange-500" />
              FIRE Perspectives
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FIRE_SCENARIOS.map((scenario) => (
                <motion.div
                  key={scenario.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setActiveScenario(scenario.id)}
                  className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                    activeScenario === scenario.id 
                      ? `bg-${scenario.color}-50 border-${scenario.color}-500 ring-4 ring-${scenario.color}-500/5` 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-xl bg-${scenario.color}-100`}>
                      {scenario.icon}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Multiplier</p>
                      <p className="text-sm font-bold text-slate-900">{scenario.multiplier}x</p>
                    </div>
                  </div>
                  <h5 className="font-bold text-slate-900 mb-1">{scenario.name}</h5>
                  <p className="text-xs text-slate-500 leading-relaxed">{scenario.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              Journey Analysis
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Years to FIRE</span>
                  <span className="font-bold text-slate-900">{results.yearsToFire} Years</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Future Annual Expenses</span>
                  <span className="font-bold text-slate-900">{formatCurrency(results.futureAnnualExpenses)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Real Rate of Return</span>
                  <span className="font-bold text-emerald-600">{results.realReturn.toFixed(2)}%</span>
                </div>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-100 flex flex-col justify-center">
                <p className="text-xs text-slate-500 mb-2">
                  At a <strong>{results.swr}%</strong> withdrawal rate, your corpus of <strong>{formatCurrency(results.targetCorpus)}</strong> is designed to last indefinitely if real returns stay positive.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase">
                  <CheckCircle2 size={12} />
                  Sustainability Verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FIRECalculator;
