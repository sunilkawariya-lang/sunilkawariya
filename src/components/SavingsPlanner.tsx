
import React, { useState, useMemo } from 'react';
import { 
  IndianRupee, Plus, Trash2, Save, TrendingUp, TrendingDown, 
  PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Info,
  PlusCircle, MinusCircle, Calculator, Wallet, Receipt,
  User, BarChart3
} from 'lucide-react';
import { PortfolioState, Income, Expense } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';

interface SavingsPlannerProps {
  portfolio: PortfolioState;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioState>>;
}

const SavingsPlanner: React.FC<SavingsPlannerProps> = ({ portfolio, setPortfolio }) => {
  const { addIncome, deleteIncome, addExpense, deleteExpense, updateEmergencyFund, selectedMemberId, familyMembers } = useFirebase();
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  
  const [newIncome, setNewIncome] = useState<Partial<Income>>({
    source: '',
    amount: 0,
    frequency: 'Monthly',
    isRecurring: true,
    memberId: selectedMemberId === 'family' ? (familyMembers[0]?.id || 'primary') : selectedMemberId
  });

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: '',
    amount: 0,
    isRecurring: true,
    memberId: selectedMemberId === 'family' ? (familyMembers[0]?.id || 'primary') : selectedMemberId
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const monthlyIncome = useMemo(() => 
    portfolio.incomes
      .filter(inc => inc.frequency === 'Monthly')
      .reduce((sum, inc) => sum + inc.amount, 0),
  [portfolio.incomes]);

  const nonMonthlyIncomes = useMemo(() => 
    portfolio.incomes.filter(inc => inc.frequency !== 'Monthly'),
  [portfolio.incomes]);

  const monthlyTax = useMemo(() => {
    return portfolio.taxProfile.totalTaxPayable / 12;
  }, [portfolio.taxProfile]);

  const monthlyExpenses = useMemo(() => 
    portfolio.expenses.reduce((sum, exp) => sum + exp.amount, 0),
  [portfolio.expenses]);

  const monthlySavings = monthlyIncome - monthlyTax - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  const pieData = useMemo(() => {
    const data = [
      { name: 'Expenses', value: Math.max(0, monthlyExpenses), color: '#f59e0b' }, // amber-500
      { name: 'Tax', value: Math.max(0, monthlyTax), color: '#f43f5e' }, // rose-500
      { name: 'Savings', value: Math.max(0, monthlySavings), color: '#6366f1' }, // indigo-500
    ].filter(item => item.value > 0);
    return data;
  }, [monthlyExpenses, monthlyTax, monthlySavings]);

  const barData = useMemo(() => [
    { name: 'Income', amount: monthlyIncome, color: '#10b981' },
    { name: 'Expenses', amount: monthlyExpenses, color: '#f59e0b' },
    { name: 'Tax', amount: monthlyTax, color: '#f43f5e' },
    { name: 'Savings', amount: Math.max(0, monthlySavings), color: '#6366f1' }
  ], [monthlyIncome, monthlyExpenses, monthlyTax, monthlySavings]);

  const handleAddIncome = async () => {
    if (!newIncome.source || !newIncome.amount) return;
    
    const income: Income = {
      id: Math.random().toString(36).substr(2, 9),
      source: newIncome.source as string,
      amount: Number(newIncome.amount),
      frequency: newIncome.frequency as any,
      isRecurring: newIncome.isRecurring as boolean,
      date: new Date().toISOString(),
      memberId: newIncome.memberId || (selectedMemberId === 'family' ? 'primary' : selectedMemberId)
    };

    await addIncome(income);
    
    setIsAddingIncome(false);
    setNewIncome({ 
      source: '', 
      amount: 0, 
      frequency: 'Monthly', 
      isRecurring: true,
      memberId: selectedMemberId === 'family' ? (familyMembers[0]?.id || 'primary') : selectedMemberId
    });
  };

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount) return;
    
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      category: newExpense.category as string,
      amount: Number(newExpense.amount),
      isRecurring: newExpense.isRecurring as boolean,
      date: new Date().toISOString(),
      memberId: newExpense.memberId || (selectedMemberId === 'family' ? 'primary' : selectedMemberId)
    };

    await addExpense(expense);
    
    setIsAddingExpense(false);
    setNewExpense({ 
      category: '', 
      amount: 0, 
      isRecurring: true,
      memberId: selectedMemberId === 'family' ? (familyMembers[0]?.id || 'primary') : selectedMemberId
    });
  };

  const handleDeleteIncome = async (id: string) => {
    await deleteIncome(id);
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id);
  };

  const handleUpdateTax = (val: string) => {
    const amount = Number(val);
    setPortfolio(prev => ({
      ...prev,
      taxProfile: { ...prev.taxProfile, totalTaxPayable: amount * 12 }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
            <IndianRupee size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Monthly Savings Planner</h2>
            <p className="text-sm text-slate-500">Manage your cash flow and optimize your savings</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Savings</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(monthlySavings)}</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Savings Rate</p>
            <p className="text-xl font-bold text-indigo-600">{savingsRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Visual Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Allocation Pie Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <PieIcon size={20} className="text-indigo-500" />
              Monthly Allocation
            </h3>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              % of Total Income
            </div>
          </div>
          <div className="h-[300px] w-full">
            {monthlyIncome > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => {
                      const percentage = ((entry.payload.value / monthlyIncome) * 100).toFixed(1);
                      return <span className="text-xs font-bold text-slate-600">{value} ({percentage}%)</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <PieIcon size={48} strokeWidth={1} />
                <p className="text-sm font-medium">Add income to see allocation</p>
              </div>
            )}
          </div>
        </div>

        {/* Cash Flow Bar Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-500" />
              Income vs Outflow
            </h3>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Monthly Cash Flow
            </div>
          </div>
          <div className="h-[300px] w-full">
            {monthlyIncome > 0 || monthlyExpenses > 0 || monthlyTax > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={48}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="amount" 
                      position="top" 
                      formatter={(v: number) => v > 0 ? formatCurrency(v) : ''} 
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#475569' }} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <BarChart3 size={48} strokeWidth={1} />
                <p className="text-sm font-medium">Add data to see cash flow</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Income & Tax */}
        <div className="lg:col-span-2 space-y-8">
          {/* Income Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle size={20} className="text-emerald-500" />
                Income Sources
              </h3>
              <button 
                onClick={() => setIsAddingIncome(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
              >
                <Plus size={16} />
                Add Income
              </button>
            </div>

            <div className="space-y-4">
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Monthly Sources</p>
                <div className="space-y-3">
                  {portfolio.incomes.filter(inc => inc.frequency === 'Monthly').map((inc) => (
                    <div key={inc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                          {inc.source[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{inc.source}</p>
                          <p className="text-xs text-slate-500">{inc.isRecurring ? 'Recurring' : 'One-time'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="font-bold text-slate-900">{formatCurrency(inc.amount)}</p>
                        <button 
                          onClick={() => handleDeleteIncome(inc.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {nonMonthlyIncomes.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Other Incomes (Excluded from Monthly)</p>
                  <div className="space-y-3">
                    {nonMonthlyIncomes.map((inc) => (
                      <div key={inc.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                            {inc.source[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-400">{inc.source}</p>
                            <p className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">
                              {inc.frequency}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <p className="font-bold text-slate-400">{formatCurrency(inc.amount)}</p>
                          <button 
                            onClick={() => handleDeleteIncome(inc.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {isAddingIncome && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">Source Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Salary, Rental"
                          value={newIncome.source}
                          onChange={(e) => setNewIncome(prev => ({ ...prev, source: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">Monthly Amount</label>
                        <input 
                          type="number" 
                          placeholder="₹ 0"
                          value={newIncome.amount || ''}
                          onChange={(e) => setNewIncome(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          className="w-full px-4 py-2.5 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                    </div>
                    {selectedMemberId === 'family' && (
                      <div>
                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">Income Earner</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                          <select
                            value={newIncome.memberId}
                            onChange={(e) => setNewIncome(prev => ({ ...prev, memberId: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none"
                          >
                            {familyMembers.map(member => (
                              <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4">
                        <select 
                          value={newIncome.frequency}
                          onChange={(e) => setNewIncome(prev => ({ ...prev, frequency: e.target.value as any }))}
                          className="px-3 py-2 bg-white border-none rounded-xl text-xs font-bold text-slate-600 outline-none"
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Half-Yearly">Half-Yearly</option>
                          <option value="Yearly">Yearly</option>
                          <option value="One-time">One-time</option>
                        </select>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={newIncome.isRecurring}
                            onChange={(e) => setNewIncome(prev => ({ ...prev, isRecurring: e.target.checked }))}
                            className="w-4 h-4 rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-bold text-slate-600">Recurring</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsAddingIncome(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleAddIncome}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all"
                        >
                          Save Income
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Tax Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calculator size={20} className="text-rose-500" />
                Tax Deductions (Monthly)
              </h3>
            </div>
            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-rose-700">Estimated Monthly TDS / Tax</p>
                <p className="text-xs text-rose-600/70 leading-relaxed">
                  Enter the average amount deducted from your income for taxes every month. This helps in calculating your true net savings.
                </p>
              </div>
              <div className="w-full md:w-64">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-rose-400">₹</span>
                  <input 
                    type="number" 
                    value={monthlyTax}
                    onChange={(e) => handleUpdateTax(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white border-none rounded-2xl text-lg font-bold text-rose-600 focus:ring-2 focus:ring-rose-500/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Expenses */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MinusCircle size={20} className="text-amber-500" />
                Monthly Expenses
              </h3>
              <button 
                onClick={() => setIsAddingExpense(true)}
                className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {isAddingExpense && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3"
                  >
                    <input 
                      type="text" 
                      placeholder="Category (e.g. Rent)"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border-none rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                    <input 
                      type="number" 
                      placeholder="Amount"
                      value={newExpense.amount || ''}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white border-none rounded-lg text-xs focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                    {selectedMemberId === 'family' && (
                      <div className="relative">
                        <User className="absolute left-2 top-1/2 -translate-y-1/2 text-amber-400" size={12} />
                        <select
                          value={newExpense.memberId}
                          onChange={(e) => setNewExpense(prev => ({ ...prev, memberId: e.target.value }))}
                          className="w-full pl-7 pr-3 py-2 bg-white border-none rounded-lg text-[10px] focus:ring-2 focus:ring-amber-500/20 outline-none appearance-none font-bold text-slate-600"
                        >
                          {familyMembers.map(member => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsAddingExpense(false)} className="text-[10px] font-bold text-slate-500">Cancel</button>
                      <button onClick={handleAddExpense} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold">Add</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {portfolio.expenses.map((exp) => (
                <div key={exp.id} className="group relative">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-600">{exp.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(exp.amount)}</span>
                      <button 
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500" 
                      style={{ width: `${(exp.amount / monthlyExpenses) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-6 mt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">Total Expenses</span>
                  <span className="text-lg font-bold text-rose-600">{formatCurrency(monthlyExpenses)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-6">
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Receipt size={20} className="text-emerald-400" />
              Savings Summary
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Monthly Income</span>
                <span className="font-bold">{formatCurrency(monthlyIncome)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Monthly Tax</span>
                <span className="font-bold text-rose-400">-{formatCurrency(monthlyTax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total Monthly Expenses</span>
                <span className="font-bold text-amber-400">-{formatCurrency(monthlyExpenses)}</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-white font-bold">Net Monthly Savings</span>
                <span className="text-2xl font-bold text-emerald-400">{formatCurrency(monthlySavings)}</span>
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-3">
              <Info className="text-emerald-400 shrink-0" size={18} />
              <p className="text-[10px] text-slate-300 leading-relaxed">
                You are saving <span className="text-emerald-400 font-bold">{savingsRate.toFixed(1)}%</span> of your income. 
                Financial experts suggest a minimum savings rate of 20% for long-term wealth creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsPlanner;
