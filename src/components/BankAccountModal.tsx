import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, CreditCard, User, Hash, Wallet, AlertCircle } from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { BankAccount } from '../types';

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: BankAccount;
}

export default function BankAccountModal({ isOpen, onClose, account }: BankAccountModalProps) {
  const { addBankAccount, updateBankAccount, portfolio } = useFirebase();
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    bankName: '',
    accountHolderName: '',
    lastFourDigits: '',
    accountNumber: '',
    ifscCode: '',
    balance: 0,
    accountType: 'Savings',
    memberId: portfolio.selectedMemberId === 'family' ? 'm1' : portfolio.selectedMemberId
  });

  useEffect(() => {
    if (account) {
      setFormData(account);
    } else {
      setFormData({
        bankName: '',
        accountHolderName: '',
        lastFourDigits: '',
        accountNumber: '',
        ifscCode: '',
        balance: 0,
        accountType: 'Savings',
        memberId: portfolio.selectedMemberId === 'family' ? 'm1' : portfolio.selectedMemberId
      });
    }
  }, [account, portfolio.selectedMemberId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (account) {
        await updateBankAccount(formData);
      } else {
        await addBankAccount(formData);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save bank account:', err);
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
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{account ? 'Edit Account' : 'Add Bank Account'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Salary">Salary</option>
                <option value="Fixed Deposit">Fixed Deposit</option>
                <option value="Recurring Deposit">Recurring Deposit</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Account Holder Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                required
                type="text"
                value={formData.accountHolderName}
                onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                placeholder="Name as per bank records"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Account Number (Optional)</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ 
                      ...formData, 
                      accountNumber: val,
                      lastFourDigits: val.slice(-4)
                    });
                  }}
                  placeholder="Full account number"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Last 4 Digits</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">IFSC Code (Optional)</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                placeholder="HDFC0001234"
                className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Current Balance</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  required
                  type="number"
                  value={formData.balance ?? ''}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value === '' ? undefined : Number(e.target.value) })}
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
              {account ? 'Update Account' : 'Add Account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
