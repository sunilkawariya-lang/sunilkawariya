
import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, User } from 'lucide-react';
import { motion } from 'motion/react';
import { EmergencyFund } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';

interface EmergencyFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fund: EmergencyFund) => void;
  initialData: EmergencyFund;
}

const EmergencyFundModal: React.FC<EmergencyFundModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { portfolio } = useFirebase();
  const [formData, setFormData] = useState<EmergencyFund>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">Update Emergency Fund</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {portfolio.selectedMemberId === 'family' && (
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                Member
              </label>
              <select 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                value={formData.memberId}
                onChange={(e) => {
                  const memberId = e.target.value;
                  const existingFund = portfolio.emergencyFunds.find(f => f.memberId === memberId);
                  if (existingFund) {
                    setFormData(existingFund);
                  } else {
                    setFormData({ ...formData, memberId });
                  }
                }}
              >
                {portfolio.familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name} ({member.relationship})</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Amount Saved (₹)</label>
            <input 
              required
              type="number" 
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
              value={formData.currentAmount ?? ''}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value === '' ? 0 : Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Expense (₹)</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                value={formData.monthlyExpense ?? ''}
                onChange={(e) => setFormData({ ...formData, monthlyExpense: e.target.value === '' ? 0 : Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Months</label>
              <input 
                required
                type="number" 
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                value={formData.targetMonths ?? ''}
                onChange={(e) => setFormData({ ...formData, targetMonths: e.target.value === '' ? 0 : Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3">
            <AlertCircle className="text-blue-600 shrink-0" size={20} />
            <p className="text-xs text-blue-800 leading-relaxed">
              Financial experts recommend keeping <strong>{formData.targetMonths} months</strong> of expenses in a liquid account. Your current target is <strong>₹{(formData.monthlyExpense * formData.targetMonths).toLocaleString('en-IN')}</strong>.
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Update Fund
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EmergencyFundModal;
