import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, CreditCard as CardIcon, User, Hash, Wallet, Calendar, AlertCircle } from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { CreditCard } from '../types';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: CreditCard;
}

export default function CreditCardModal({ isOpen, onClose, card }: CreditCardModalProps) {
  const { addCreditCard, updateCreditCard, portfolio } = useFirebase();
  const [formData, setFormData] = useState<Partial<CreditCard>>({
    cardName: '',
    bankName: '',
    lastFourDigits: '',
    creditLimit: 0,
    availableLimit: 0,
    currentOutstanding: 0,
    statementDate: 1,
    dueDate: 20,
    memberId: portfolio.selectedMemberId === 'family' ? 'm1' : portfolio.selectedMemberId
  });

  useEffect(() => {
    if (card) {
      setFormData(card);
    } else {
      setFormData({
        cardName: '',
        bankName: '',
        lastFourDigits: '',
        creditLimit: 0,
        availableLimit: 0,
        currentOutstanding: 0,
        statementDate: 1,
        dueDate: 20,
        memberId: portfolio.selectedMemberId === 'family' ? 'm1' : portfolio.selectedMemberId
      });
    }
  }, [card, portfolio.selectedMemberId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (card) {
        await updateCreditCard(formData);
      } else {
        await addCreditCard(formData);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save credit card:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <CardIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{card ? 'Edit Card' : 'Add Credit Card'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Card Name</label>
              <div className="relative">
                <CardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  value={formData.cardName}
                  onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                  placeholder="e.g. Millennia"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Bank Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Last 4 Digits</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  maxLength={4}
                  type="text"
                  value={formData.lastFourDigits}
                  onChange={(e) => setFormData({ ...formData, lastFourDigits: e.target.value })}
                  placeholder="1234"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Credit Limit</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="number"
                  value={formData.creditLimit ?? ''}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Current Outstanding</label>
              <input
                required
                type="number"
                value={formData.currentOutstanding ?? ''}
                onChange={(e) => setFormData({ ...formData, currentOutstanding: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Available Limit</label>
              <input
                required
                type="number"
                value={formData.availableLimit ?? ''}
                onChange={(e) => setFormData({ ...formData, availableLimit: e.target.value === '' ? undefined : Number(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Statement Date (Day)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="number"
                  min={1}
                  max={31}
                  value={formData.statementDate ?? ''}
                  onChange={(e) => setFormData({ ...formData, statementDate: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Due Date (Day)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="number"
                  min={1}
                  max={31}
                  value={formData.dueDate ?? ''}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              {card ? 'Update Card' : 'Add Card'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
