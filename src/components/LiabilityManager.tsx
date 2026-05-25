
import React, { useState, useMemo } from 'react';
import { 
  Landmark, Plus, Trash2, Edit2, AlertCircle, 
  TrendingDown, Calendar, IndianRupee, PieChart,
  ArrowRight, Info, ShieldAlert, Zap, TrendingUp,
  Clock, CheckCircle2, BarChart3, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { PortfolioState, Liability } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import LiabilityModal from './LiabilityModal';
import { useFirebase } from '../contexts/FirebaseContext';
import { differenceInMonths, parseISO, addMonths, format } from 'date-fns';

interface LiabilityManagerProps {
  portfolio: PortfolioState;
}

const LiabilityManager: React.FC<LiabilityManagerProps> = ({ portfolio }) => {
  const { addLiability, updateLiability, deleteLiability } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [analyzingLiabilityId, setAnalyzingLiabilityId] = useState<string | null>(null);
  const [extraEMI, setExtraEMI] = useState<number>(0);
  const [oneTimePrepayment, setOneTimePrepayment] = useState<number>(0);
  const [showAmortizationTable, setShowAmortizationTable] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const selectedLiability = useMemo(() => 
    portfolio.liabilities.find(l => l.id === analyzingLiabilityId) || null,
  [portfolio.liabilities, analyzingLiabilityId]);

  const amortizationData = useMemo(() => {
    if (!selectedLiability) return null;

    const { outstandingAmount, interestRate, emi } = selectedLiability;
    const monthlyRate = interestRate / 12 / 100;
    
    // Standard Schedule
    let standardBalance = outstandingAmount;
    let standardTotalInterest = 0;
    let standardMonths = 0;
    const standardSchedule = [];

    while (standardBalance > 0 && standardMonths < 600) { // Cap at 50 years
      const interest = standardBalance * monthlyRate;
      const principal = Math.min(standardBalance, emi - interest);
      standardTotalInterest += interest;
      standardBalance -= principal;
      standardMonths++;
      if (standardMonths % 12 === 0 || standardBalance <= 0) {
        standardSchedule.push({
          month: standardMonths,
          balance: Math.max(0, standardBalance),
          interest: standardTotalInterest,
          type: 'Standard'
        });
      }
    }

    // Accelerated Schedule
    let acceleratedBalance = outstandingAmount - oneTimePrepayment;
    let acceleratedTotalInterest = 0;
    let acceleratedTotalPrincipal = 0;
    let acceleratedMonths = 0;
    const acceleratedSchedule = [];
    const fullSchedule = [];
    const totalEMI = emi + extraEMI;

    while (acceleratedBalance > 0 && acceleratedMonths < 600) {
      const interest = acceleratedBalance * monthlyRate;
      const principal = Math.min(acceleratedBalance, totalEMI - interest);
      acceleratedTotalInterest += interest;
      acceleratedTotalPrincipal += principal;
      acceleratedBalance -= principal;
      acceleratedMonths++;
      
      if (acceleratedMonths % 12 === 0 || acceleratedBalance <= 0) {
        const point = {
          month: acceleratedMonths,
          year: Math.ceil(acceleratedMonths / 12),
          balance: Math.max(0, acceleratedBalance),
          interestPaid: acceleratedTotalInterest,
          principalPaid: acceleratedTotalPrincipal,
          type: 'Accelerated'
        };
        acceleratedSchedule.push(point);
        fullSchedule.push(point);
      }
    }

    // Combine for Chart
    const chartData = [];
    const maxMonths = Math.max(standardMonths, acceleratedMonths);
    for (let i = 0; i <= maxMonths; i += 12) {
      const sPoint = standardSchedule.find(p => p.month >= i) || { balance: 0 };
      const aPoint = acceleratedSchedule.find(p => p.month >= i) || { balance: 0 };
      chartData.push({
        year: Math.floor(i / 12),
        standardBalance: sPoint.balance,
        acceleratedBalance: aPoint.balance
      });
    }

    return {
      standardMonths,
      standardTotalInterest,
      acceleratedMonths,
      acceleratedTotalInterest,
      interestSaved: standardTotalInterest - acceleratedTotalInterest,
      timeSaved: standardMonths - acceleratedMonths,
      chartData,
      fullSchedule
    };
  }, [selectedLiability, extraEMI, oneTimePrepayment]);

  const totalOutstanding = useMemo(() => 
    portfolio.liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0),
  [portfolio.liabilities]);

  const totalMonthlyEMI = useMemo(() => 
    portfolio.liabilities.reduce((sum, l) => sum + l.emi, 0),
  [portfolio.liabilities]);

  const monthlyIncome = useMemo(() => 
    portfolio.incomes.filter(inc => inc.frequency === 'Monthly').reduce((sum, inc) => sum + inc.amount, 0),
  [portfolio.incomes]);

  const dtiRatio = monthlyIncome > 0 ? (totalMonthlyEMI / monthlyIncome) * 100 : 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleSave = async (liability: Liability) => {
    if (editingLiability) {
      await updateLiability(liability);
    } else {
      await addLiability(liability);
    }
    setEditingLiability(null);
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteLiability(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Debt Manager</h2>
          <p className="text-slate-500">Track and optimize your loans and liabilities</p>
        </div>
        <button 
          onClick={() => {
            setEditingLiability(null);
            setIsModalOpen(true);
          }}
          className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Liability
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <Landmark size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(totalOutstanding)}</h3>
          <p className="text-xs text-slate-400 mt-2">Across {portfolio.liabilities.length} active loans</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Monthly EMI</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{formatCurrency(totalMonthlyEMI)}</h3>
          <p className="text-xs text-slate-400 mt-2">Total monthly debt commitment</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <PieChart size={20} />
            </div>
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">DTI Ratio</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{dtiRatio.toFixed(1)}%</h3>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${dtiRatio <= 35 ? 'bg-emerald-500' : dtiRatio <= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
              style={{ width: `${Math.min(100, (dtiRatio / 50) * 100)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Debt Insights */}
      {dtiRatio > 40 && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-start gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h4 className="font-bold text-rose-900">High Debt-to-Income Warning</h4>
            <p className="text-sm text-rose-700 mt-1">
              Your DTI ratio is {dtiRatio.toFixed(1)}%, which is above the recommended 35-40% threshold. 
              This may impact your ability to save for long-term goals or handle financial emergencies. 
              Consider prepaying high-interest loans first.
            </p>
          </div>
        </div>
      )}

      {/* Liabilities List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Active Liabilities</h3>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">On Track</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Loan Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Outstanding</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Interest / EMI</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {portfolio.liabilities.map((liability) => {
                  const progress = ((liability.totalAmount - liability.outstandingAmount) / liability.totalAmount) * 100;
                  return (
                    <motion.tr 
                      key={liability.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                            <Landmark size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{liability.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{liability.type} • {liability.lender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-bold text-slate-900">{formatCurrency(liability.outstandingAmount)}</p>
                        <p className="text-xs text-slate-400 font-medium">of {formatCurrency(liability.totalAmount)}</p>
                      </td>
                      <td className="px-6 py-6">
                        <p className="font-bold text-slate-900">{formatCurrency(liability.emi)}/mo</p>
                        <p className="text-xs text-rose-600 font-bold">{liability.interestRate}% Interest</p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                            <span>Paid</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setAnalyzingLiabilityId(analyzingLiabilityId === liability.id ? null : liability.id)}
                            className={`p-2 rounded-lg transition-all ${
                              analyzingLiabilityId === liability.id 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            }`}
                            title="Scenario Analysis"
                          >
                            <BarChart3 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingLiability(liability);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(liability.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {portfolio.liabilities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 text-slate-300 rounded-full">
                        <Landmark size={48} />
                      </div>
                      <p className="text-slate-500 font-medium">No active liabilities found. You're debt-free!</p>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-rose-600 font-bold text-sm hover:underline"
                      >
                        Add your first loan
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Analysis Section */}
      <AnimatePresence>
        {selectedLiability && amortizationData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100 bg-amber-50/30">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Zap size={24} className="text-amber-500" />
                      Debt Reduction Scenario: {selectedLiability.name}
                    </h3>
                    <p className="text-slate-500 text-sm">Simulate how extra payments can save you time and money</p>
                  </div>
                  <button 
                    onClick={() => setAnalyzingLiabilityId(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Extra Monthly EMI</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="number"
                          value={extraEMI || ''}
                          onChange={(e) => setExtraEMI(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">One-time Prepayment (Now)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="number"
                          value={oneTimePrepayment || ''}
                          onChange={(e) => setOneTimePrepayment(Number(e.target.value))}
                          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Interest Saved</p>
                      <h4 className="text-2xl font-black text-emerald-700">{formatCurrency(amortizationData.interestSaved)}</h4>
                      <p className="text-xs text-emerald-600/70 mt-1">Over loan tenure</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Time Saved</p>
                      <h4 className="text-2xl font-black text-blue-700">
                        {Math.floor(amortizationData.timeSaved / 12)}y {amortizationData.timeSaved % 12}m
                      </h4>
                      <p className="text-xs text-blue-600/70 mt-1">Earlier closure</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-bold text-slate-900">Loan Amortization Projection</h4>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                      <span className="text-xs font-bold text-slate-500">Standard Plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-slate-500">Accelerated Plan</span>
                    </div>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={amortizationData.chartData}>
                      <defs>
                        <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAccelerated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="year" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        label={{ value: 'Years', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}
                      />
                      <YAxis 
                        hide 
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="standardBalance" 
                        stroke="#94a3b8" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorStandard)" 
                        name="Standard Balance"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="acceleratedBalance" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorAccelerated)" 
                        name="Accelerated Balance"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Standard Plan Summary</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Interest Payable</span>
                        <span className="font-bold text-slate-900">{formatCurrency(amortizationData.standardTotalInterest)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Remaining Tenure</span>
                        <span className="font-bold text-slate-900">
                          {Math.floor(amortizationData.standardMonths / 12)}y {amortizationData.standardMonths % 12}m
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h5 className="text-sm font-bold text-amber-600 uppercase tracking-widest">Accelerated Plan Summary</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total Interest Payable</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(amortizationData.acceleratedTotalInterest)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">New Tenure</span>
                        <span className="font-bold text-blue-600">
                          {Math.floor(amortizationData.acceleratedMonths / 12)}y {amortizationData.acceleratedMonths % 12}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amortization Table Toggle */}
                <div className="mt-12 pt-8 border-t border-slate-100">
                  <button 
                    onClick={() => setShowAmortizationTable(!showAmortizationTable)}
                    className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                  >
                    <div className="p-1.5 bg-slate-100 rounded-lg">
                      {showAmortizationTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    {showAmortizationTable ? 'Hide' : 'Show'} Detailed Amortization Table
                  </button>

                  <AnimatePresence>
                    {showAmortizationTable && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-6"
                      >
                        <div className="overflow-x-auto rounded-2xl border border-slate-100">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Principal Paid</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interest Paid</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {amortizationData.fullSchedule.map((row) => (
                                <tr key={row.month} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-700">Year {row.year}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-medium text-slate-600">{formatCurrency(row.principalPaid)}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-medium text-rose-500">{formatCurrency(row.interestPaid)}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(row.balance)}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LiabilityModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLiability(null);
        }}
        onSave={handleSave}
        initialData={editingLiability}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Delete Liability?</h3>
              <p className="text-slate-500 mt-2">Are you sure you want to delete this liability? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
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

export default LiabilityManager;
