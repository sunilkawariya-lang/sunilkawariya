
import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, IndianRupee, Tag, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, Investment } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  initialData?: Transaction;
  investments: Investment[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData,
  investments 
}) => {
  const { portfolio } = useFirebase();
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Buy',
    investmentName: '',
    quantity: 0,
    price: 0,
    amount: 0,
    memberId: portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Buy',
        investmentName: '',
        quantity: 0,
        price: 0,
        amount: 0,
        memberId: portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId,
      });
    }
  }, [initialData, isOpen, portfolio.selectedMemberId, portfolio.familyMembers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.investmentName || !formData.date || !formData.amount) return;

    onSave({
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
    } as Transaction);
    onClose();
  };

  const handleInvestmentChange = (name: string) => {
    const inv = investments.find(i => i.name === name);
    setFormData(prev => ({
      ...prev,
      investmentName: name,
      investmentId: inv?.id,
      price: prev.price || inv?.price || 0
    }));
  };

  const calculateAmount = (qty: number, price: number) => {
    return qty * price;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900">
              {initialData ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={14} />
                  Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Tag size={14} />
                  Type
                </label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                  <option value="Dividend">Dividend</option>
                  <option value="Interest">Interest</option>
                </select>
              </div>
            </div>

            {portfolio.selectedMemberId === 'family' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Investor
                </label>
                <select 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.memberId || ''}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                >
                  {portfolio.familyMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Info size={14} />
                Investment Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  list="investments-list"
                  placeholder="Search or enter investment name..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.investmentName}
                  onChange={(e) => handleInvestmentChange(e.target.value)}
                />
                <datalist id="investments-list">
                  {investments.map(inv => (
                    <option key={inv.id} value={inv.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.quantity ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const qty = val === '' ? undefined : Number(val);
                    setFormData({ 
                      ...formData, 
                      quantity: qty,
                      amount: calculateAmount(qty || 0, formData.price || 0)
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  Price
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={formData.price ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const price = val === '' ? undefined : Number(val);
                    setFormData({ 
                      ...formData, 
                      price,
                      amount: calculateAmount(formData.quantity || 0, price || 0)
                    });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <IndianRupee size={14} />
                Total Amount
              </label>
              <input
                type="number"
                step="any"
                required
                className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-emerald-700"
                value={formData.amount ?? ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
              <p className="text-[10px] text-slate-400 font-medium">
                {formData.type === 'Buy' || formData.type === 'Sell' ? 'Calculated as Quantity × Price' : 'Enter the total amount received'}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {initialData ? 'Update Transaction' : 'Save Transaction'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionModal;
