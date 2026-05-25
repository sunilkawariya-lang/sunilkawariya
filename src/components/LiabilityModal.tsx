
import React, { useState, useEffect } from 'react';
import { X, Save, IndianRupee, Calendar, Percent, Landmark, AlertCircle, User } from 'lucide-react';
import { Liability, LiabilityType } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';

interface LiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (liability: Liability) => void;
  initialData?: Liability | null;
}

const LIABILITY_TYPES: LiabilityType[] = [
  'Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Credit Card', 'Other'
];

const LiabilityModal: React.FC<LiabilityModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { portfolio } = useFirebase();
  const [formData, setFormData] = useState<Partial<Liability>>({
    name: '',
    type: 'Personal Loan',
    totalAmount: 0,
    outstandingAmount: 0,
    interestRate: 0,
    emi: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    lender: '',
    memberId: portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        type: 'Personal Loan',
        totalAmount: 0,
        outstandingAmount: 0,
        interestRate: 0,
        emi: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        lender: '',
        memberId: portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId,
      });
    }
  }, [initialData, isOpen, portfolio.selectedMemberId, portfolio.familyMembers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData as Liability,
      id: initialData?.id || Math.random().toString(36).substr(2, 9)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="text-rose-600" size={24} />
            {initialData ? 'Edit Liability' : 'Add New Liability'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {portfolio.selectedMemberId === 'family' && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                Borrower
              </label>
              <select 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none bg-white"
                value={formData.memberId || ''}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              >
                {portfolio.familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name} ({member.relationship})</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Loan Name</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., HDFC Home Loan"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Loan Type</label>
              <select
                value={formData.type || 'Personal Loan'}
                onChange={e => setFormData({ ...formData, type: e.target.value as LiabilityType })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none bg-white"
              >
                {LIABILITY_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Lender / Bank</label>
              <input
                type="text"
                required
                value={formData.lender || ''}
                onChange={e => setFormData({ ...formData, lender: e.target.value })}
                placeholder="e.g., ICICI Bank"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Total Loan Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  required
                  value={formData.totalAmount ?? ''}
                  onChange={e => setFormData({ ...formData, totalAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Outstanding Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  required
                  value={formData.outstandingAmount ?? ''}
                  onChange={e => setFormData({ ...formData, outstandingAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Monthly EMI</label>
              <div className="relative">
                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  required
                  value={formData.emi ?? ''}
                  onChange={e => setFormData({ ...formData, emi: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Interest Rate (%)</label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.interestRate ?? ''}
                  onChange={e => setFormData({ ...formData, interestRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  required
                  value={formData.startDate || ''}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">End Date (Expected)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="date"
                  required
                  value={formData.endDate || ''}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Liability
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiabilityModal;
