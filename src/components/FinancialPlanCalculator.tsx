import React, { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from "recharts";
import { 
  Target, 
  TrendingUp, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Info,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateDetailedFinancialPlan } from "../services/analysisService";
import { downloadFinancialPlanExcel } from "../services/exportService";
import { generateFinancialPlanPDF } from "../services/pdfService";
import DetailedFinancialPlanView from "./DetailedFinancialPlanView";
import { PortfolioState, FinancialPlan } from "../types";
import { toast } from "sonner";
import ExportButtons from "./ExportButtons";
import { handleDownloadCalculatorReport } from "../utils/exportUtils";

const fmt = (v: number) => {
  if (v >= 1e7) return `₹${(v/1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v/1e5).toFixed(2)} Lacs`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
};

const fmtShort = (v: number) => v >= 1e7 ? `${(v/1e7).toFixed(1)}Cr` : v >= 1e5 ? `${(v/1e5).toFixed(1)} Lacs` : Math.round(v).toLocaleString("en-IN");

const GOAL_TYPES = ["Retirement", "Education", "Purchase", "Vacation", "Marriage", "Business", "Custom"];
const GOAL_ICONS: Record<string, string> = { Retirement: "☂", Education: "🎓", Purchase: "🏠", Vacation: "✈", Marriage: "💍", Business: "💼", Custom: "⭐" };
const GOAL_COLORS: Record<string, string> = { Retirement: "#D4AF37", Education: "#059669", Purchase: "#1E293B", Vacation: "#D97706", Marriage: "#DB2777", Business: "#7C3AED", Custom: "#64748B" };
const ALLOC_PRESETS = [
  { label: "All in", eq: 100 }, { label: "Aggressive", eq: 80 }, { label: "Grow", eq: 60 }, { label: "Regular", eq: 40 }, { label: "Safe", eq: 20 }, { label: "Capital protection", eq: 0 }
];

const defaultProfile = {
  age: 35,
  savings: 4000000,
  equityRet: 12,
  debtRet: 7,
  inflation: 6,
  lifeExp: 90,
  retireAge: 60,
  monthlyExpenses: 50000,
  riskProfile: "Moderate"
};

const defaultGoals = [
  { id: 1, type: "Retirement", name: "Retirement", monthly: 40000, targetYear: 25, inflation: 6, allocation: 100, lumpsum: 500000, stepUp: 10 },
  { id: 2, type: "Purchase", name: "Purchase", cost: 7500000, targetYear: 10, inflation: 5, allocation: 60, lumpsum: 2000000, stepUp: 5 },
  { id: 3, type: "Vacation", name: "Holidays", cost: 200000, targetYear: 5, inflation: 5, allocation: 40, lumpsum: 500000, recurring: true, recurringYears: 30, stepUp: 5 },
  { id: 4, type: "Education", name: "Education", cost: 3500000, targetYear: 14, inflation: 7, allocation: 60, lumpsum: 1000000, stepUp: 10 },
];

function blendedReturn(eq: number, eqRet: number, debtRet: number) {
  return (eq * eqRet + (100 - eq) * debtRet) / 100;
}

function calcSIP(corpus: number, lumpsum: number, rAnnual: number, years: number, stepUp: number) {
  const rm = rAnnual / 100 / 12;
  const nm = years * 12;
  const grownLumpsum = lumpsum * Math.pow(1 + rm, nm);
  const target = Math.max(0, corpus - grownLumpsum);
  if (target <= 0) return 0;

  let low = 0;
  let high = target;
  let resultSip = 0;

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    let currentVal = 0;
    let currentSip = mid;
    for (let yr = 0; yr < years; yr++) {
      for (let m = 0; m < 12; m++) {
        currentVal = (currentVal + currentSip) * (1 + rm);
      }
      currentSip *= (1 + stepUp / 100);
    }
    if (currentVal < target) {
      low = mid;
      resultSip = mid;
    } else {
      high = mid;
    }
  }
  return resultSip;
}

function retirementCorpus(monthly: number, curAge: number, retireAge: number, lifeExp: number, inflation: number, postReturn: number) {
  const yearsToRetire = retireAge - curAge;
  const expAtRetire = monthly * Math.pow(1 + inflation / 100, yearsToRetire);
  const n = (lifeExp - retireAge) * 12;
  const rm = postReturn / 100 / 12;
  const im = inflation / 100 / 12;
  const rr = (1 + rm) / (1 + im) - 1;
  if (rr <= 0) return expAtRetire * n;
  return expAtRetire * (1 - Math.pow(1 + rr, -n)) / rr;
}

function goalCorpus(g: any, profile: any) {
  if (g.type === "Retirement") {
    return retirementCorpus(g.monthly, profile.age, profile.age + g.targetYear, profile.lifeExp, g.inflation, 7.5);
  }
  const base = g.type === "Vacation" && g.recurring
    ? g.cost * (g.recurringYears || 1) * Math.pow(1 + g.inflation / 100, g.targetYear)
    : g.cost * Math.pow(1 + g.inflation / 100, g.targetYear);
  return base;
}

function buildChartData(g: any, profile: any, corpus: number, sip: number) {
  const r = blendedReturn(g.allocation, profile.equityRet, profile.debtRet) / 100 / 12;
  const retireAge = profile.age + g.targetYear;
  const data = [];
  let val = g.lumpsum;
  let currentSip = sip;

  for (let yr = profile.age; yr <= profile.lifeExp; yr++) {
    data.push({
      age: yr,
      portfolio: Math.round(val / 1e5) / 10,
      sip: yr < retireAge ? Math.round(currentSip) : 0
    });

    if (yr < retireAge) {
      for (let m = 0; m < 12; m++) {
        val = (val + currentSip) * (1 + r);
      }
      currentSip *= (1 + (g.stepUp || 0) / 100);
    } else if (g.type === "Retirement") {
      const monthlyAtRetire = g.monthly * Math.pow(1 + g.inflation / 100, g.targetYear);
      const drawdown = monthlyAtRetire * Math.pow(1 + g.inflation / 100, yr - retireAge);
      for (let m = 0; m < 12; m++) {
        val = Math.max(0, (val - drawdown) * (1 + 7.5 / 100 / 12));
      }
    }
  }
  return data;
}

const PremiumInput = ({ label, value, onChange, prefix, suffix, type = "number", step }: any) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-4 text-slate-400 font-bold text-sm">{prefix}</span>}
      <input
        type={type}
        value={value ?? (type === "number" ? 0 : "")}
        step={step || 1}
        onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-12' : ''} text-wealth-navy font-bold text-sm focus:ring-2 focus:ring-wealth-gold/20 focus:border-wealth-gold outline-none transition-all`}
      />
      {suffix && <span className="absolute right-4 text-slate-400 font-bold text-sm">{suffix}</span>}
    </div>
  </div>
);

export const FinancialPlanCalculator: React.FC<{ portfolio?: PortfolioState }> = ({ portfolio }) => {
  const [profile, setProfile] = useState(defaultProfile);
  const [goals, setGoals] = useState(defaultGoals);
  const [activeGoalId, setActiveGoalId] = useState(1);
  const [editingProfile, setEditingProfile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<FinancialPlan | null>(null);

  const handleGenerateReport = async () => {
    if (!portfolio) {
      toast.error("Portfolio data missing");
      return;
    }
    setIsAnalyzing(true);
    try {
      const plan = await generateDetailedFinancialPlan(portfolio);
      setGeneratedPlan(plan);
      toast.success("Financial roadmap generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate roadmap");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportExcel = () => {
    if (!generatedPlan) {
      toast.error("Generate roadmap first to export");
      return;
    }
    downloadFinancialPlanExcel(generatedPlan);
  };

  const handleExportPDF = async () => {
    if (!generatedPlan) {
      toast.error("Generate roadmap first to export");
      return;
    }
    try {
      const doc = generateFinancialPlanPDF(generatedPlan, portfolio);
      doc.save(`Wealth_Roadmap_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const setP = (k: string, v: any) => setProfile(p => ({ ...p, [k]: v }));
  const setG = (id: number, k: string, v: any) => setGoals(gs => gs.map(g => g.id === id ? { ...g, [k]: v } : g));

  const calcs = useMemo(() => {
    return goals.map(g => {
      const corpus = goalCorpus(g, profile);
      const r = blendedReturn(g.allocation, profile.equityRet, profile.debtRet);
      const sip = Math.max(0, calcSIP(corpus, g.lumpsum, r, g.targetYear, g.stepUp || 0));
      const chart = buildChartData(g, profile, corpus, sip);
      return { id: g.id, corpus, sip, chart, r };
    });
  }, [goals, profile]);

  const totalSIP = calcs.reduce((a, c) => a + c.sip, 0);
  const totalLumpsum = goals.reduce((a, g) => a + g.lumpsum, 0);
  const unallocated = Math.max(0, profile.savings - totalLumpsum);

  const insights = useMemo(() => {
    const list = [];
    const efNeeded = profile.monthlyExpenses * 6;
    if (profile.savings < efNeeded) {
      list.push({ type: "warning", icon: <AlertCircle size={16} />, text: `Emergency Fund Gap: You need ₹${fmt(efNeeded)} but have ₹${fmt(profile.savings)}. Prioritize this before aggressive goal funding.` });
    } else {
      list.push({ type: "success", icon: <ShieldCheck size={16} />, text: "Emergency Fund Secured: Your liquid savings cover 6+ months of expenses." });
    }

    if (totalSIP > profile.monthlyExpenses * 0.5) {
      list.push({ type: "warning", icon: <Zap size={16} />, text: "High Savings Rate: Your required SIP is >50% of expenses. Ensure this is sustainable or extend goal timelines." });
    }

    const equityExposure = goals.reduce((acc, g) => acc + (g.allocation * g.lumpsum), 0) / (totalLumpsum || 1);
    if (profile.riskProfile === "Conservative" && equityExposure > 40) {
      list.push({ type: "info", icon: <Info size={16} />, text: "Allocation Mismatch: Your equity exposure is high for a Conservative profile. Consider shifting to Debt for capital protection." });
    }

    return list;
  }, [profile, totalSIP, totalLumpsum, goals]);

  const activeGoal = goals.find(g => g.id === activeGoalId) || goals[0];
  const activeCalc = calcs.find(c => c.id === activeGoalId) || calcs[0];
  const goalColor = GOAL_COLORS[activeGoal?.type] || "#D4AF37";

  const addGoal = () => {
    const id = Date.now();
    const ng = { id, type: "Custom", name: "New Goal", cost: 500000, targetYear: 5, inflation: 5, allocation: 60, lumpsum: 0, stepUp: 10 };
    setGoals(g => [...g, ng]);
    setActiveGoalId(id);
  };

  const removeGoal = (id: number) => {
    const remaining = goals.filter(g => g.id !== id);
    setGoals(remaining);
    if (activeGoalId === id && remaining.length > 0) setActiveGoalId(remaining[0].id);
  };

  const retireYr = profile.age + (activeGoal?.targetYear || 25);
  const chartData = activeCalc?.chart || [];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Roadmap Actions Header */}
      <div className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest">Precision Roadmap Analysis</h3>
            <p className="text-[10px] text-slate-400 font-medium">AI-Synthesized Strategic Financial Directive</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!generatedPlan ? (
            <button
              onClick={handleGenerateReport}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {isAnalyzing ? 'Analyzing Portfolio...' : 'Generate AI Roadmap'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGeneratedPlan(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-700"
              >
                Reset Planner
              </button>
              <ExportButtons 
                title="Strategic Wealth Roadmap"
                onDownload={handleDownloadCalculatorReport}
                inputs={[
                  ['Investor Age', profile.age.toString()],
                  ['Retirement Age', profile.retireAge.toString()],
                  ['Current Savings', fmt(profile.savings)],
                  ['Risk Profile', profile.riskProfile]
                ]}
                results={[
                  ['Total Goals', goals.length.toString()],
                  ['Net Worth', fmt(generatedPlan.netWorthAnalysis.netWorth)],
                  ['Savings Rate', `${generatedPlan.cashFlowAnalysis.savingsRate}%`]
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {generatedPlan ? (
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          <DetailedFinancialPlanView 
            plan={generatedPlan} 
            portfolio={portfolio!} 
            onDownloadPDF={handleExportPDF}
            onDownloadExcel={handleExportExcel}
          />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Sidebar: Profile & Goals */}
          <div className="w-full lg:w-80 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-8 border-b border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Investor Profile</h3>
                <button 
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="text-wealth-gold hover:text-wealth-gold/80 transition-colors"
                >
                  {editingProfile ? <CheckCircle2 size={18} /> : <Edit3 size={18} />}
                </button>
              </div>

              <AnimatePresence mode="wait">
                {editingProfile ? (
                  <motion.div 
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <PremiumInput label="Current Age" value={profile.age} onChange={(v: any) => setP("age", v)} />
                    <PremiumInput label="Monthly Expenses" prefix="₹" value={profile.monthlyExpenses} onChange={(v: any) => setP("monthlyExpenses", v)} />
                    <PremiumInput label="Total Savings" prefix="₹" value={profile.savings} onChange={(v: any) => setP("savings", v)} />
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Profile</label>
                      <select 
                        value={profile.riskProfile || "Moderate"} 
                        onChange={e => setP("riskProfile", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-wealth-navy font-bold text-sm outline-none"
                      >
                        <option>Conservative</option>
                        <option>Moderate</option>
                        <option>Aggressive</option>
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        <span className="text-wealth-navy font-bold">{profile.age} year old</span> investor with a <span className="text-wealth-navy font-bold">{profile.riskProfile}</span> risk appetite.
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Monthly Spend</p>
                          <p className="text-sm font-bold text-wealth-navy">{fmt(profile.monthlyExpenses)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Liquid Wealth</p>
                          <p className="text-sm font-bold text-wealth-navy">{fmt(profile.savings)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Strategic Goals</h3>
                <button onClick={addGoal} className="p-1.5 bg-wealth-gold/10 text-wealth-gold rounded-lg hover:bg-wealth-gold/20 transition-all">
                  <Plus size={16} />
                </button>
              </div>
              {goals.map(g => {
                const c = calcs.find(x => x.id === g.id);
                const active = g.id === activeGoalId;
                const col = GOAL_COLORS[g.type] || "#64748B";
                return (
                  <button
                    key={g.id}
                    onClick={() => setActiveGoalId(g.id)}
                    className={`w-full text-left p-5 rounded-2xl transition-all border ${
                      active ? 'bg-white border-wealth-gold shadow-lg shadow-wealth-gold/5' : 'bg-transparent border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-slate-100" style={{ color: col }}>
                        {GOAL_ICONS[g.type] || "⭐"}
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold uppercase tracking-tight ${active ? 'text-wealth-navy' : 'text-slate-600'}`}>
                          {g.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {g.type === "Retirement" ? `Retire at ${profile.age + g.targetYear}` : `In ${g.targetYear} years`}
                        </p>
                      </div>
                    </div>
                    {c && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Required SIP</span>
                        <span className="text-sm font-black text-wealth-navy">{fmt(c.sip)}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content: Goal Editor & Chart */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Summary */}
            <div className="bg-wealth-navy p-8 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-wealth-gold/5 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-wealth-gold uppercase tracking-[0.3em] mb-2">Consolidated Wealth Roadmap</p>
                <div className="flex items-baseline gap-4">
                  <h2 className="text-4xl font-black tracking-tighter">₹{totalSIP.toLocaleString('en-IN')}</h2>
                  <span className="text-slate-400 font-bold">Total Monthly SIP</span>
                </div>
              </div>
              <div className="relative z-10 text-right">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unallocated Surplus</p>
                  <p className="text-xl font-bold text-emerald-400">{fmt(unallocated)}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Goal Configuration */}
                <div className="xl:col-span-4 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-wealth-navy tracking-tight flex items-center gap-3">
                      <Target size={24} className="text-wealth-gold" />
                      Goal Configuration
                    </h3>
                    <button onClick={() => removeGoal(activeGoal.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <PremiumInput label="Goal Name" type="text" value={activeGoal.name} onChange={(v: any) => setG(activeGoal.id, "name", v)} />
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Goal Category</label>
                      <select 
                        value={activeGoal.type || "Custom"} 
                        onChange={e => setG(activeGoal.id, "type", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-wealth-navy font-bold text-sm outline-none"
                      >
                        {GOAL_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>

                    {activeGoal.type === "Retirement" ? (
                      <div className="grid grid-cols-2 gap-4">
                        <PremiumInput label="Monthly Spend" prefix="₹" value={(activeGoal as any).monthly} onChange={(v: any) => setG(activeGoal.id, "monthly", v)} />
                        <PremiumInput label="Retire Age" suffix="yrs" value={profile.age + activeGoal.targetYear} onChange={(v: any) => setG(activeGoal.id, "targetYear", Math.max(1, v - profile.age))} />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <PremiumInput label="Cost Today" prefix="₹" value={(activeGoal as any).cost} onChange={(v: any) => setG(activeGoal.id, "cost", v)} />
                        <PremiumInput label="Horizon" suffix="yrs" value={activeGoal.targetYear} onChange={(v: any) => setG(activeGoal.id, "targetYear", Math.max(1, v))} />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Allocation Strategy</label>
                        <span className="text-xs font-bold text-wealth-gold">{activeGoal.allocation}% Equity</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {ALLOC_PRESETS.map(p => (
                          <button 
                            key={p.label} 
                            onClick={() => setG(activeGoal.id, "allocation", p.eq)} 
                            className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all ${
                              activeGoal.allocation === p.eq ? 'bg-wealth-navy border-wealth-navy text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-wealth-gold'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <PremiumInput label="Initial Lumpsum" prefix="₹" value={activeGoal.lumpsum} onChange={(v: any) => setG(activeGoal.id, "lumpsum", Math.max(0, Math.min(v, profile.savings)))} />
                      <PremiumInput label="SIP Step-up" suffix="%" value={(activeGoal as any).stepUp} onChange={(v: any) => setG(activeGoal.id, "stepUp", v)} />
                    </div>
                  </div>
                </div>

                {/* Projection Chart & Insights */}
                <div className="xl:col-span-8 space-y-10">
                  <div className="premium-card p-8">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-xl font-bold text-wealth-navy tracking-tight uppercase">Wealth Projection</h3>
                        <p className="text-sm text-slate-400 font-medium">Trajectory for {activeGoal.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Corpus</p>
                        <p className="text-2xl font-black text-wealth-navy">{fmt(activeCalc?.corpus || 0)}</p>
                      </div>
                    </div>

                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={goalColor} stopOpacity={0.1}/>
                              <stop offset="95%" stopColor={goalColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                          <YAxis hide />
                          <Tooltip 
                            formatter={(v, n) => n === "portfolio" ? `₹${fmtShort(v as number * 100000)}` : `₹${(v as number).toLocaleString("en-IN")}/mo`}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                          />
                          <ReferenceLine x={retireYr} stroke="#E2E8F0" strokeDasharray="5 5" label={{ value: "Target Date", position: 'top', fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} />
                          <Area 
                            type="monotone" 
                            dataKey="portfolio" 
                            stroke={goalColor} 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorPortfolio)" 
                            name="portfolio"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="sip" 
                            stroke={goalColor} 
                            strokeWidth={2} 
                            strokeDasharray="6 4" 
                            dot={false} 
                            name="sip" 
                            opacity={0.3} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-8 flex flex-wrap justify-center gap-8">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-1 bg-wealth-gold rounded-full" style={{ backgroundColor: goalColor }} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Portfolio Value</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-0.5 border-t-2 border-dashed border-slate-300" style={{ borderColor: goalColor, opacity: 0.4 }} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly SIP Commitment</span>
                      </div>
                    </div>
                  </div>

                  {/* Strategic Insights */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-wealth-navy tracking-tight flex items-center gap-3">
                      <ShieldCheck size={24} className="text-wealth-emerald" />
                      Strategic Advisory
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.map((insight, idx) => (
                        <div 
                          key={idx} 
                          className={`p-6 rounded-3xl border flex gap-4 items-start transition-all hover:shadow-lg ${
                            insight.type === "warning" ? 'bg-rose-50 border-rose-100 text-rose-900' : 
                            insight.type === "success" ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 
                            'bg-blue-50 border-blue-100 text-blue-900'
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${
                            insight.type === "warning" ? 'bg-rose-500 text-white' : 
                            insight.type === "success" ? 'bg-emerald-500 text-white' : 
                            'bg-blue-500 text-white'
                          }`}>
                            {insight.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold leading-relaxed">{insight.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
