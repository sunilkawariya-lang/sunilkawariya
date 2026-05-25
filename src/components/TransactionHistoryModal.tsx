
import React from 'react';
import { X, Calendar, TrendingUp, TrendingDown, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Investment, Purchase } from '../types';
import { formatLakhs } from '../utils/finance';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  investment: Investment | null;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose, investment }) => {
  if (!investment) return null;

  const purchases = [...(investment.purchases || [])].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <History className="w-5 h-5 text-wealth-emerald" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900">Transaction History</h3>
                  <p className="text-xs text-slate-500 mt-1">{investment.name} • {investment.subCategory}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {purchases.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                    <span>Date</span>
                    <span className="text-right">Quantity</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Total Value</span>
                  </div>
                  {purchases.map((p) => (
                    <div key={p.id} className="grid grid-cols-4 gap-4 px-4 py-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-wealth-emerald transition-all group">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">
                          {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">{p.quantity.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-600">₹{p.price.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-wealth-navy">₹{(p.quantity * p.price).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-slate-300" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">No Transactions Found</h4>
                  <p className="text-sm text-slate-500 max-w-xs mt-2">
                    We couldn't find any historical purchase data for this investment.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invested</span>
                <span className="text-lg font-black text-wealth-navy">₹{investment.investedValue.toLocaleString()}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Value</span>
                <span className="text-lg font-black text-wealth-emerald">₹{investment.currentValue.toLocaleString()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TransactionHistoryModal;
