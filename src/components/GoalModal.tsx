
import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, User, Plus, Trash2, GraduationCap, Home, Car, Plane, Heart, Briefcase, HelpCircle, Info, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { formatLakhs } from '../utils/finance';
import { differenceInMonths } from 'date-fns';

const CATEGORIES = [
  { id: 'Education', icon: GraduationCap, label: 'Education' },
  { id: 'Retirement', icon: Briefcase, label: 'Retirement' },
  { id: 'Marriage', icon: Heart, label: 'Marriage' },
  { id: 'Home', icon: Home, label: 'Home' },
  { id: 'Car', icon: Car, label: 'Car' },
  { id: 'Vacation', icon: Plane, label: 'Vacation' },
  { id: 'Other', icon: HelpCircle, label: 'Other' },
] as const;

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
  initialData?: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { portfolio } = useFirebase();
  const [formData, setFormData] = useState<Partial<Goal>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    priority: 'Medium',
    inflationAdjusted: false,
    expectedInflation: 6,
    expectedReturn: 12,
    monthlyContribution: 0,
    category: 'Other',
    multiYearFunding: [],
    memberId: portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId,
  });

  const [multiYearMode, setMultiYearMode] = useState(false);

  const calculations = useMemo(() => {
    const now = new Date();
    const targetDate = new Date(formData.targetDate || '');
    const monthsLeft = differenceInMonths(targetDate, now);
    const yearsLeft = Math.max(0, monthsLeft / 12);
    
    let inflationAdjustedTarget = 0;
    if (multiYearMode && formData.multiYearFunding && formData.multiYearFunding.length > 0) {
      const startYear = targetDate.getFullYear();
      inflationAdjustedTarget = formData.multiYearFunding.reduce((sum, item) => {
        const yearsFromStart = item.year - startYear;
        const yearsFromToday = yearsFromStart + yearsLeft;
        const adjustedAmount = item.amount * Math.pow(1 + (formData.expectedInflation || 6) / 100, yearsFromToday);
        return sum + (adjustedAmount / Math.pow(1 + (formData.expectedReturn || 12) / 100, yearsFromStart));
      }, 0);
    } else {
      inflationAdjustedTarget = formData.inflationAdjusted 
        ? (formData.targetAmount || 0) * Math.pow(1 + (formData.expectedInflation || 6) / 100, yearsLeft)
        : (formData.targetAmount || 0);
    }

    const monthlyRate = (formData.expectedReturn || 12) / 12 / 100;
    let recommendedMonthly = 0;
    let requiredLumpsum = 0;
    
    if (monthsLeft > 0) {
      const fvOfCurrent = (formData.currentAmount || 0) * Math.pow(1 + monthlyRate, monthsLeft);
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

    return {
      inflationAdjustedTarget,
      recommendedMonthly,
      requiredLumpsum,
      monthsLeft
    };
  }, [formData, multiYearMode]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        inflationAdjusted: initialData.inflationAdjusted || false,
        expectedInflation: initialData.expectedInflation || 6,
        expectedReturn: initialData.expectedReturn || 12,
        monthlyContribution: initialData.monthlyContribution || 0,
        category: initialData.category || 'Other',
        multiYearFunding: initialData.multiYearFunding || []
      });
      setMultiYearMode(!!initialData.multiYearFunding?.length);
    } else {
      setFormData({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        priority: 'Medium',
        inflationAdjusted: false,
        expectedInflation: 6,
        expectedReturn: 12,
        monthlyContribution: 0,
        category: 'Other',
        multiYearFunding: [],
        memberId: portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId,
      });
      setMultiYearMode(false);
    }
  }, [initialData, isOpen, portfolio.selectedMemberId, portfolio.familyMembers]);

  if (!isOpen) return null;

  const handleAddYear = () => {
    const lastYear = formData.multiYearFunding?.length 
      ? Math.max(...formData.multiYearFunding.map(f => f.year))
      : new Date(formData.targetDate || '').getFullYear();
    
    setFormData({
      ...formData,
      multiYearFunding: [
        ...(formData.multiYearFunding || []),
        { year: lastYear + 1, amount: 0 }
      ]
    });
  };

  const handleRemoveYear = (index: number) => {
    setFormData({
      ...formData,
      multiYearFunding: formData.multiYearFunding?.filter((_, i) => i !== index)
    });
  };

  const handleYearChange = (index: number, field: 'year' | 'amount', value: number) => {
    const updated = [...(formData.multiYearFunding || [])];
    updated[index] = { ...updated[index], [field]: value };
    
    // Update total target amount if in multi-year mode
    const total = updated.reduce((sum, f) => sum + f.amount, 0);
    setFormData({
      ...formData,
      multiYearFunding: updated,
      targetAmount: total
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      multiYearFunding: multiYearMode ? formData.multiYearFunding : []
    } as Goal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-8"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {formData.category && (
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {React.createElement(CATEGORIES.find(c => c.id === formData.category)?.icon || HelpCircle, { size: 20, className: "text-slate-600" })}
              </div>
            )}
            <h3 className="font-bold text-lg text-slate-900">{initialData ? 'Edit Goal' : 'New Goal'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Goal Category</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id as any })}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border ${
                    formData.category === cat.id 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                  }`}
                >
                  <cat.icon size={18} />
                  <span className="text-[10px] font-bold truncate w-full text-center">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {portfolio.selectedMemberId === 'family' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                Goal For
              </label>
              <select 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-medium"
                value={formData.memberId || ''}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              >
                {portfolio.familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name} ({member.relationship})</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Goal Name</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Higher Education for Child"
              />
            </div>

            {/* Multi-year Toggle */}
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div>
                <p className="text-sm font-bold text-indigo-900">Multi-Year Funding</p>
                <p className="text-[10px] text-indigo-600 font-medium">For goals like education with recurring annual costs</p>
              </div>
              <button
                type="button"
                onClick={() => setMultiYearMode(!multiYearMode)}
                className={`w-12 h-6 rounded-full transition-all relative ${multiYearMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${multiYearMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {multiYearMode ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Funding Schedule</label>
                  <button
                    type="button"
                    onClick={handleAddYear}
                    className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 hover:underline"
                  >
                    <Plus size={12} /> Add Year
                  </button>
                </div>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {formData.multiYearFunding?.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input 
                            type="number"
                            placeholder="Year"
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={item.year ?? ''}
                            onChange={(e) => handleYearChange(index, 'year', e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                          <input 
                            type="number"
                            placeholder="Amount"
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={item.amount ?? ''}
                            onChange={(e) => handleYearChange(index, 'amount', e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveYear(index)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {(!formData.multiYearFunding || formData.multiYearFunding.length === 0) && (
                    <p className="text-center py-4 text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-xl">
                      No years added. Click "Add Year" to start.
                    </p>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Total Target</span>
                  <span className="text-sm font-bold text-slate-900">{formatLakhs(formData.targetAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Target Amount</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[10000000, 50000000, 100000000, 250000000, 500000000, 1000000000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormData({ ...formData, targetAmount: amt })}
                        className={`py-2 text-[10px] font-bold rounded-xl transition-all border ${
                          formData.targetAmount === amt 
                            ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                            : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        {amt >= 10000000 ? `${amt/10000000} Cr` : formatLakhs(amt)}
                      </button>
                    ))}
                  </div>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                    value={formData.targetAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                    placeholder="Enter amount in ₹"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Current Savings</label>
                  <input 
                    required
                    type="number" 
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                    value={formData.currentAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Start Date</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                  value={formData.startDate || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Date (Start)</label>
                <input 
                  required
                  type="date" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                  value={formData.targetDate || ''}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Priority</label>
                <select 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-medium"
                  value={formData.priority || 'Medium'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Expected Return (%)</label>
                <input 
                  required
                  type="number" 
                  step="0.1"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                  value={formData.expectedReturn ?? ''}
                  onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Current Monthly SIP</label>
                <input 
                  required
                  type="number" 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none font-medium"
                  value={formData.monthlyContribution ?? ''}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value === '' ? undefined : Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-slate-700">Adjust for Inflation</label>
                  <p className="text-[10px] text-slate-500">Increase target based on rising costs</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, inflationAdjusted: !formData.inflationAdjusted })}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.inflationAdjusted ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.inflationAdjusted ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              {formData.inflationAdjusted && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200 pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Inflation Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white font-medium"
                    value={formData.expectedInflation ?? ''}
                    onChange={(e) => setFormData({ ...formData, expectedInflation: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </div>
              )}
            </div>

            {/* Strategic Insights */}
            <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 mb-2">
                <TrendingUp size={18} />
                <h4 className="text-xs font-black uppercase tracking-widest">Strategic Projections</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 p-3 rounded-xl border border-white/80">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Required Monthly SIP</p>
                  <p className="text-lg font-black text-indigo-600">{formatLakhs(calculations.recommendedMonthly)}</p>
                </div>
                <div className="bg-white/60 p-3 rounded-xl border border-white/80">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Required Lumpsum</p>
                  <p className="text-lg font-black text-slate-900">{formatLakhs(calculations.requiredLumpsum)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-[10px] text-indigo-700 bg-white/40 p-3 rounded-xl">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  To reach your {formData.inflationAdjusted ? 'inflation-adjusted ' : ''}target of <span className="font-bold">{formatLakhs(calculations.inflationAdjustedTarget)}</span> in <span className="font-bold">{calculations.monthsLeft} months</span> at <span className="font-bold">{formData.expectedReturn}%</span> returns, you need to deploy capital as shown above.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
            >
              <Save size={18} />
              Save Goal
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default GoalModal;
