
import React from 'react';
import { X, TrendingUp, Shield, IndianRupee, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Investment, AssetCategory } from '../types';
import { ASSET_COLORS } from '../constants';

interface BreakupDetailsModalProps {
  type: 'Equity' | 'Debt' | null;
  investments: Investment[];
  onClose: () => void;
}

const BreakupDetailsModal: React.FC<BreakupDetailsModalProps> = ({ type, investments, onClose }) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const filteredInvestments = investments.filter(inv => inv.category === type);
  const totalValue = filteredInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);

  if (!type) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${type === 'Equity' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                {type === 'Equity' ? <TrendingUp size={24} /> : <Shield size={24} />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{type} Allocation Details</h3>
                <p className="text-sm text-slate-500 font-medium">Detailed breakdown of your {type.toLowerCase()} holdings</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total {type} Value</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Number of Holdings</p>
                <p className="text-2xl font-bold text-slate-900">{filteredInvestments.length}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Holdings Breakdown</h4>
              {filteredInvestments.sort((a, b) => b.currentValue - a.currentValue).map((inv) => (
                <div 
                  key={inv.id}
                  className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm text-xl" style={{ backgroundColor: ASSET_COLORS[inv.category] }}>
                        {inv.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{inv.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{inv.subCategory}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(inv.currentValue)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Value</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(inv.currentValue / totalValue) * 100}%` }}
                        className={`h-full ${type === 'Equity' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-400 w-12 text-right">
                      {((inv.currentValue / totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Invested</p>
                        <p className="text-xs font-bold text-slate-700">{formatCurrency(inv.investedValue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Returns</p>
                        <p className={`text-xs font-bold ${inv.currentValue >= inv.investedValue ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {((inv.currentValue - inv.investedValue) / inv.investedValue * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => (window as any).setActiveTab?.('portfolio')}
                      className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      Manage <ExternalLink size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BreakupDetailsModal;
