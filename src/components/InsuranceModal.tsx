
import React, { useState, useEffect } from 'react';
import { X, Shield, Calendar, IndianRupee, User, Building2, FileText, RefreshCw, TrendingUp } from 'lucide-react';
import { InsurancePolicy, InsuranceType, FamilyMember } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface InsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: InsurancePolicy) => void;
  editingPolicy: InsurancePolicy | null;
  familyMembers: FamilyMember[];
}

const InsuranceModal: React.FC<InsuranceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPolicy,
  familyMembers
}) => {
  const [formData, setFormData] = useState<Partial<InsurancePolicy>>({
    name: '',
    provider: '',
    type: 'Term',
    sumAssured: 0,
    premium: 0,
    premiumFrequency: 'Yearly',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nominee: '',
    status: 'Active',
    memberId: familyMembers[0]?.id || ''
  });

  const [newCfDesc, setNewCfDesc] = useState('');
  const [newCfYear, setNewCfYear] = useState(5);
  const [newCfAmount, setNewCfAmount] = useState<number>(0);
  const [newCfCustomDate, setNewCfCustomDate] = useState('');
  const [newCfUseCustomDate, setNewCfUseCustomDate] = useState(false);
  const [newCfMode, setNewCfMode] = useState<'single' | 'multiple'>('single');
  const [newCfMultiYears, setNewCfMultiYears] = useState('');
  const [cfError, setCfError] = useState('');

  const handlePolicyTermChange = (term: number) => {
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    if (!isNaN(start.getTime())) {
      const endYear = start.getFullYear() + term;
      const end = new Date(start);
      end.setFullYear(endYear);
      const endStr = end.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        policyTerm: term,
        expiryDate: endStr,
        maturityDate: prev.maturityDate || endStr
      }));
    } else {
      setFormData(prev => ({ ...prev, policyTerm: term }));
    }
  };

  const autoGenerateMoneyBackCashflows = () => {
    const term = formData.policyTerm || 15;
    const sum = formData.sumAssured || 500000;
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    if (isNaN(start.getTime())) return;

    const generated: { description: string; amount: number; date: string }[] = [];
    
    // Typically Money Back payouts are every 5 years for policy terms like 15, 20, 25
    const interval = 5;
    for (let yr = interval; yr < term; yr += interval) {
      const pDate = new Date(start);
      pDate.setFullYear(start.getFullYear() + yr);
      
      generated.push({
        description: `${yr}th Year Moneyback Survival Benefit (20%)`,
        amount: Math.round(sum * 0.2),
        date: pDate.toISOString().split('T')[0]
      });
    }

    setFormData(prev => ({
      ...prev,
      cashflows: generated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }));
  };

  const addCashflow = () => {
    if (!newCfDesc || !newCfAmount) {
      setCfError('Please fill description and amount.');
      return;
    }
    setCfError('');

    const newCashflows: { description: string; amount: number; date: string }[] = [];
    const start = formData.startDate ? new Date(formData.startDate) : new Date();
    const baseDate = !isNaN(start.getTime()) ? start : new Date();

    if (newCfMode === 'single') {
      let targetDate = '';
      if (newCfUseCustomDate && newCfCustomDate) {
        targetDate = newCfCustomDate;
      } else {
        const payoutDate = new Date(baseDate);
        payoutDate.setFullYear(baseDate.getFullYear() + newCfYear);
        targetDate = payoutDate.toISOString().split('T')[0];
      }
      
      newCashflows.push({
        description: newCfDesc,
        amount: newCfAmount,
        date: targetDate
      });
    } else {
      // Parse multi-years (e.g. 5,10,15)
      const parsedYears = newCfMultiYears
        .split(',')
        .map(y => parseInt(y.trim()))
        .filter(y => !isNaN(y) && y > 0 && y <= (formData.policyTerm || 100));

      if (parsedYears.length === 0) {
        setCfError('Please specify valid years (e.g. 5, 10, 15)');
        return;
      }

      parsedYears.forEach(y => {
        const payoutDate = new Date(baseDate);
        payoutDate.setFullYear(baseDate.getFullYear() + y);
        const dateStr = payoutDate.toISOString().split('T')[0];

        // Ensure descriptions look beautiful
        const lowerDesc = newCfDesc.toLowerCase();
        let desc = newCfDesc;
        if (!lowerDesc.includes('year') && !lowerDesc.includes('yr')) {
          desc = `${y}th Year ${newCfDesc}`;
        } else {
          desc = `${newCfDesc} (Year ${y})`;
        }

        newCashflows.push({
          description: desc,
          amount: newCfAmount,
          date: dateStr
        });
      });
    }

    setFormData(prev => ({
      ...prev,
      cashflows: [...(prev.cashflows || []), ...newCashflows].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }));

    // Reset fields
    setNewCfDesc('');
    setNewCfAmount(0);
    setNewCfCustomDate('');
    setNewCfUseCustomDate(false);
    setNewCfMultiYears('');
    setCfError('');
  };

  const removeCashflow = (index: number) => {
    setFormData(prev => {
      const updated = [...(prev.cashflows || [])];
      updated.splice(index, 1);
      return { ...prev, cashflows: updated };
    });
  };

  useEffect(() => {
    if (formData.type === 'Endowment' || formData.type === 'MoneyBack') {
      if (formData.policyTerm === undefined) {
        setFormData(prev => ({
          ...prev,
          policyTerm: 15,
          premiumPayingTerm: 10,
          maturityAmount: prev.sumAssured || 500000,
          bonusAmount: 0,
          cashflows: prev.cashflows || []
        }));
      }
    }
  }, [formData.type]);

  useEffect(() => {
    if (editingPolicy) {
      setFormData(editingPolicy);
    } else {
      setFormData({
        name: '',
        provider: '',
        type: 'Term',
        sumAssured: 0,
        premium: 0,
        premiumFrequency: 'Yearly',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nominee: '',
        status: 'Active',
        memberId: familyMembers[0]?.id || ''
      });
    }
  }, [editingPolicy, familyMembers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editingPolicy?.id || Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString()
    } as InsurancePolicy);
    onClose();
  };

  const insuranceTypes: InsuranceType[] = ['Term', 'Health', 'Motor', 'ULIP', 'Endowment', 'MoneyBack', 'Critical Illness'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-wealth-emerald/10 text-wealth-emerald rounded-xl">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingPolicy ? 'Edit Policy' : 'Add New Insurance'}
                </h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Insurance Portfolio Management</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Family Member
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  required
                >
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name} ({member.relationship})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} /> Policy Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  placeholder="e.g. HDFC Life Click 2 Protect"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={12} /> Provider
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  placeholder="e.g. HDFC Life, ICICI Prudential"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Policy Type
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as InsuranceType })}
                  required
                >
                  {insuranceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <IndianRupee size={12} /> Sum Assured
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.sumAssured}
                  onChange={(e) => setFormData({ ...formData, sumAssured: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <IndianRupee size={12} /> Premium Amount
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.premium}
                  onChange={(e) => setFormData({ ...formData, premium: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw size={12} /> Premium Frequency
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.premiumFrequency}
                  onChange={(e) => setFormData({ ...formData, premiumFrequency: e.target.value as any })}
                  required
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw size={12} /> Policy Status
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Lapsed">Lapsed</option>
                  <option value="Matured">Matured</option>
                  <option value="Surrendered">Surrendered</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Nominee
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  placeholder="e.g. Spouse Name"
                  value={formData.nominee}
                  onChange={(e) => setFormData({ ...formData, nominee: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Expiry Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {(formData.type === 'Endowment' || formData.type === 'MoneyBack') && (
              <div className="p-6 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl space-y-5">
                <h3 className="text-xs font-black text-indigo-800 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={14} /> Savings Payout & Cash Flow Config ({formData.type})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Policy Term */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Policy Term (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold"
                      value={formData.policyTerm || ''}
                      placeholder="e.g. 15"
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        handlePolicyTermChange(val);
                      }}
                      required
                    />
                  </div>

                  {/* Premium Paying Term */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Premium Paying Term (Years)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={formData.policyTerm}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold"
                      value={formData.premiumPayingTerm || ''}
                      placeholder="e.g. 10"
                      onChange={(e) => setFormData({ ...formData, premiumPayingTerm: Number(e.target.value) })}
                      required
                    />
                  </div>

                  {/* Basic Maturity Amount */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Basic Maturity Amount (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold"
                      value={formData.maturityAmount || ''}
                      placeholder="e.g. 1000000"
                      onChange={(e) => setFormData({ ...formData, maturityAmount: Number(e.target.value) })}
                    />
                  </div>

                  {/* Expected Cumulative Bonus */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Expected Total Bonus (₹)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold"
                      value={formData.bonusAmount || ''}
                      placeholder="e.g. 450000"
                      onChange={(e) => setFormData({ ...formData, bonusAmount: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {/* Survival Benefits Cashflow List */}
                <div className="space-y-3 pt-3 border-t border-slate-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Survival Cashflow Payouts
                      </h4>
                      <p className="text-[9px] text-slate-400">Add periodic survival benefits (excluding final maturity & bonuses)</p>
                    </div>
                    {formData.type === 'MoneyBack' && (
                      <button
                        type="button"
                        onClick={autoGenerateMoneyBackCashflows}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-all"
                      >
                        Auto-Generate (20% every 5Y)
                      </button>
                    )}
                  </div>

                  {/* Cashflow list */}
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {formData.cashflows && formData.cashflows.length > 0 ? (
                      formData.cashflows.map((cf, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100 hover:border-slate-200 shadow-sm transition-all text-xs">
                          <span className="font-semibold text-slate-600 min-w-[120px] truncate">{cf.description}</span>
                          <span className="text-slate-500 font-mono ml-auto">{cf.date}</span>
                          <span className="font-bold text-indigo-600 ml-4">₹{cf.amount.toLocaleString('en-IN')}</span>
                          <button
                            type="button"
                            onClick={() => removeCashflow(index)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-all font-bold ml-2"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 text-[10px] py-4 bg-white/50 border border-dashed border-slate-200 rounded-xl">No periodic payouts added. Add survival benefits below if applicable.</p>
                    )}
                  </div>

                  {/* Add Cashflow Interactive Bar with mode select */}
                  <div className="space-y-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4 text-xs border-b border-slate-100 pb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Plan Entry Mode:</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setNewCfMode('single'); setCfError(''); }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${newCfMode === 'single' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          Single Year
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewCfMode('multiple'); setCfError(''); }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${newCfMode === 'multiple' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          Multiple Years Together
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        className="flex-1 min-w-[124px] px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        placeholder={newCfMode === 'single' ? "e.g. 5th Year Moneyback" : "e.g. Survival Benefit"}
                        value={newCfDesc}
                        onChange={(e) => setNewCfDesc(e.target.value)}
                      />
                      
                      {newCfMode === 'single' ? (
                        <>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Year</span>
                            <select
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                              value={newCfYear}
                              onChange={(e) => {
                                setNewCfYear(Number(e.target.value));
                                setNewCfUseCustomDate(false);
                              }}
                            >
                              {Array.from({ length: formData.policyTerm || 30 }, (_, i) => i + 1).map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Date</span>
                            <input
                              type="date"
                              className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold"
                              value={newCfCustomDate}
                              onChange={(e) => {
                                setNewCfCustomDate(e.target.value);
                                setNewCfUseCustomDate(true);
                              }}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex-[1.5] min-w-[180px] flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Years (e.g. 5,10,15)</span>
                          <input
                            type="text"
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                            placeholder="5, 10, 15, 20"
                            value={newCfMultiYears}
                            onChange={(e) => setNewCfMultiYears(e.target.value)}
                          />
                        </div>
                      )}

                      <input
                        type="number"
                        className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        placeholder="Amount (₹)"
                        value={newCfAmount || ''}
                        onChange={(e) => setNewCfAmount(Number(e.target.value))}
                      />
                      <button
                        type="button"
                        onClick={addCashflow}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all shrink-0"
                      >
                        Add
                      </button>
                    </div>

                    {cfError && (
                      <p className="text-[10px] text-rose-500 font-bold mt-1 bg-rose-50/50 px-2 py-1 rounded-md border border-rose-100/50">{cfError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] px-6 py-4 bg-wealth-emerald text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all"
              >
                {editingPolicy ? 'Update Policy' : 'Save Policy'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InsuranceModal;
