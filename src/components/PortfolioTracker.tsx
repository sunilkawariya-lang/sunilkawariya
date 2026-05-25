
import React, { useState } from 'react';
import { PortfolioState, Investment, AssetCategory, BankAccount, Transaction, InsurancePolicy } from '../types';
import { Plus, Search, MoreVertical, TrendingUp, TrendingDown, IndianRupee, Edit2, Trash2, Sparkles, RefreshCw, Upload, Landmark, History, Download, Calendar, Shield, ShieldCheck, ShieldAlert, Quote } from 'lucide-react';
import { ASSET_COLORS } from '../constants';
import InvestmentModal from './InvestmentModal';
import BankAccountModal from './BankAccountModal';
import AnalysisModal from './AnalysisModal';
import PortfolioAnalysis from './PortfolioAnalysis';
import SIPAnalysisModal from './SIPAnalysisModal';
import TransactionModal from './TransactionModal';
import InsuranceModal from './InsuranceModal';
import TransactionHistoryModal from './TransactionHistoryModal';
import InvestmentPerformance from './InvestmentPerformance';
import { InvestmentAnalysis } from '../types';
import { fetchHistoricalReturns, updatePortfolioPrices } from '../services/livePriceService';
import { calculateXIRR, calculateCAGR, formatLakhs, convertToINR } from '../utils/finance';
import { downloadPortfolioExcel, downloadPortfolioPDF } from '../utils/reportGenerator';
import { useFirebase } from '../contexts/FirebaseContext';
import { motion, AnimatePresence } from 'motion/react';
import { Layers } from 'lucide-react';

interface PortfolioTrackerProps {
  portfolio: PortfolioState;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioState>>;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({ portfolio, setPortfolio, isRefreshing, onRefresh }) => {
  const { 
    addInvestment, updateInvestment, deleteInvestment,
    addBankAccount, updateBankAccount, deleteBankAccount,
    addTransaction, updateTransaction, deleteTransaction,
    addInsurance, updateInsurance, deleteInsurance
  } = useFirebase();
  const [activeSubTab, setActiveSubTab] = useState<'investments' | 'bank' | 'transactions' | 'insurance' | 'performance' | 'analysis'>('investments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<AssetCategory | 'All'>('All');
  const [activeCategoryTab, setActiveCategoryTab] = useState<AssetCategory | 'All'>('All');
  const [activeSubCategoryTab, setActiveSubCategoryTab] = useState<string | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedInvestmentForHistory, setSelectedInvestmentForHistory] = useState<Investment | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isSIPAnalysisModalOpen, setIsSIPAnalysisModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccount | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [analyzingInvestment, setAnalyzingInvestment] = useState<Investment | null>(null);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsurancePolicy | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'category' | 'subcategory'>('category');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteBankConfirmId, setDeleteBankConfirmId] = useState<string | null>(null);
  const [deleteTransactionConfirmId, setDeleteTransactionConfirmId] = useState<string | null>(null);
  const [deleteInsuranceConfirmId, setDeleteInsuranceConfirmId] = useState<string | null>(null);

  const handleRefreshAllPrices = async () => {
    setIsRefreshingAll(true);
    try {
      const updatedInvestments = await updatePortfolioPrices(portfolio.investments);
      
      // Update each investment in Firebase
      for (const inv of updatedInvestments) {
        const original = portfolio.investments.find(i => i.id === inv.id);
        if (original && (original.price !== inv.price || original.return1Y !== inv.return1Y)) {
          await updateInvestment(inv);
        }
      }
    } catch (error) {
      console.error("Failed to refresh all prices:", error);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleRefreshReturns = async (inv: Investment) => {
    setRefreshingId(inv.id);
    try {
      const returns = await fetchHistoricalReturns([inv]);
      const invReturns = returns[inv.id];
      
      if (invReturns) {
        const updated = {
          ...inv,
          return1Y: invReturns.return1Y ?? inv.return1Y,
          return3Y: invReturns.return3Y ?? inv.return3Y,
          return5Y: invReturns.return5Y ?? inv.return5Y,
          lastUpdated: new Date().toISOString()
        };
        await updateInvestment(updated);
      }
    } catch (error) {
      console.error("Failed to refresh returns:", error);
    } finally {
      setRefreshingId(null);
    }
  };

  const handleSaveInvestment = async (investment: Investment) => {
    const exists = portfolio.investments.find(i => i.id === investment.id);
    if (exists) {
      await updateInvestment(investment);
    } else {
      await addInvestment(investment);
    }
  };

  const handleSaveInsurance = async (policy: InsurancePolicy) => {
    const exists = (portfolio.insurances || []).find(i => i.id === policy.id);
    if (exists) {
      await updateInsurance(policy);
    } else {
      await addInsurance(policy);
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteInvestment(deleteConfirmId);
      setDeleteConfirmId(null);
    }
    if (deleteBankConfirmId) {
      await deleteBankAccount(deleteBankConfirmId);
      setDeleteBankConfirmId(null);
    }
    if (deleteTransactionConfirmId) {
      await deleteTransaction(deleteTransactionConfirmId);
      setDeleteTransactionConfirmId(null);
    }
    if (deleteInsuranceConfirmId) {
      await deleteInsurance(deleteInsuranceConfirmId);
      setDeleteInsuranceConfirmId(null);
    }
  };

  const openEditModal = (inv: Investment) => {
    setEditingInvestment(inv);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingInvestment(null);
    setIsModalOpen(true);
  };

  const openBankEditModal = (acc: BankAccount) => {
    setEditingBankAccount(acc);
    setIsBankModalOpen(true);
  };

  const openBankAddModal = () => {
    setEditingBankAccount(null);
    setIsBankModalOpen(true);
  };

  const openTransactionEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const openTransactionAddModal = () => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  };

  const openAnalysisModal = (inv: Investment) => {
    setAnalyzingInvestment(inv);
    setIsAnalysisModalOpen(true);
  };

  const handleUpdateAnalysis = async (investmentId: string, analysis: InvestmentAnalysis) => {
    const original = portfolio.investments.find(i => i.id === investmentId);
    if (original) {
      const updated = { ...original, analysis };
      setPortfolio(prev => ({
        ...prev,
        investments: prev.investments.map(i => i.id === investmentId ? updated : i)
      }));
      try {
        await updateInvestment(updated);
      } catch (err) {
        console.error("Failed to save updated analysis to database:", err);
      }
    }
  };

  const totalPortfolioSIP = portfolio.investments.reduce((sum, inv) => sum + (inv.isSIP ? (inv.sipAmount || 0) : 0), 0);

  const filteredInvestments = portfolio.investments.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         inv.subCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategoryTab === 'All' || inv.category === activeCategoryTab;
    const matchesSubCategory = activeSubCategoryTab === 'All' || inv.subCategory === activeSubCategoryTab;
    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  const filteredBankAccounts = portfolio.bankAccounts.filter(acc => {
    const matchesSearch = acc.bankName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         acc.accountHolderName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredTransactions = (portfolio.transactions || []).filter(tx => {
    const matchesSearch = tx.investmentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tx.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredInsurance = (portfolio.insurances || []).filter(ins => {
    const matchesSearch = ins.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ins.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (val: number, currency: string = 'INR') => 
    new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'en-IN', { 
      style: 'currency', 
      currency: currency, 
      maximumFractionDigits: 0 
    }).format(val);

  const categories: AssetCategory[] = ['Equity', 'Hybrid', 'Debt', 'Gold', 'Alternative', 'Real Estate', 'Cash', 'ESOP', 'PMS', 'AIF', 'Bonds', 'Fixed Deposit', 'Debenture', 'PF', 'PPF', 'NPS', 'International Fund', 'Global Stock'];

  const calculateGroupMetrics = (investments: Investment[]) => {
    const cashflows: { date: Date; amount: number }[] = [];
    let totalCurrentValue = 0;
    let totalInvestedValue = 0;
    let earliestDate = new Date();

    investments.forEach(inv => {
      totalCurrentValue += convertToINR(inv.currentValue, inv.currency);
      totalInvestedValue += convertToINR(inv.investedValue, inv.currency);
      
      if (inv.purchases && inv.purchases.length > 0) {
        inv.purchases.forEach(p => {
          const pDate = new Date(p.date);
          if (pDate < earliestDate) earliestDate = pDate;
          cashflows.push({
            date: pDate,
            amount: -convertToINR((p.quantity || 0) * (p.price || 0), inv.currency)
          });
        });
      } else {
        const fallbackDate = inv.lastUpdated ? new Date(inv.lastUpdated) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        if (fallbackDate < earliestDate) earliestDate = fallbackDate;
        cashflows.push({
          date: fallbackDate,
          amount: -convertToINR(inv.investedValue, inv.currency)
        });
      }
    });

    const gain = totalCurrentValue - totalInvestedValue;
    const absoluteReturn = totalInvestedValue > 0 ? (gain / totalInvestedValue) * 100 : 0;
    
    const yearsHeld = (new Date().getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    const isMoreThanOneYear = yearsHeld >= 1;

    let xirr: number | null = null;
    if (cashflows.length > 0) {
      cashflows.push({
        date: new Date(),
        amount: totalCurrentValue
      });
      xirr = calculateXIRR(cashflows);
    }

    return {
      absoluteReturn,
      xirr,
      isMoreThanOneYear,
      gain,
      totalInvestedValue,
      totalCurrentValue
    };
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const renderInvestmentTable = (investments: Investment[]) => (
    <div className="premium-card overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[25%]">Asset Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[8%]">Quantity</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[10%]">Invested</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[10%]">Live Price</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[12%]">Current Value</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[12%]">Returns</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[13%]">Goals / Bucket</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[10%]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {investments.map((inv) => {
              const gain = inv.currentValue - inv.investedValue;
              const gainPercent = inv.investedValue > 0 ? (gain / inv.investedValue) * 100 : 0;
              const isLive = !!(inv.symbol || inv.schemeCode);
              
              // Calculate Annualized Return (XIRR)
              let annualizedReturn: number | null = null;
              let earliestPurchaseDate = new Date();
              
              if (inv.purchases && inv.purchases.length > 0) {
                const cashflows = inv.purchases.map(p => {
                  const pDate = new Date(p.date);
                  if (pDate < earliestPurchaseDate) earliestPurchaseDate = pDate;
                  return {
                    date: pDate,
                    amount: -((p.quantity || 0) * (p.price || 0))
                  };
                });
                cashflows.push({
                  date: new Date(),
                  amount: inv.currentValue
                });
                annualizedReturn = calculateXIRR(cashflows);
              } else {
                // Fallback for individual investment XIRR
                const fallbackDate = inv.lastUpdated ? new Date(inv.lastUpdated) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                earliestPurchaseDate = fallbackDate;
                const cashflows = [
                  { date: fallbackDate, amount: -inv.investedValue },
                  { date: new Date(), amount: inv.currentValue }
                ];
                annualizedReturn = calculateXIRR(cashflows);
              }

              const yearsHeld = (new Date().getTime() - earliestPurchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
              const showXIRR = yearsHeld >= 1;
              
              return (
                <tr 
                  key={inv.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => openAnalysisModal(inv)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col max-w-[200px] lg:max-w-[300px]">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="flex flex-col truncate">
                            <span className="text-serif text-base font-medium text-slate-900 truncate" title={inv.name}>
                              {inv.name}
                            </span>
                            {inv.entityName && (
                              <span className="text-[10px] text-slate-400 font-medium italic truncate">
                                {inv.entityName}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0 items-center">
                            <span 
                              className="px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-tighter border"
                              style={{ 
                                backgroundColor: `${ASSET_COLORS[inv.category]}10`, 
                                color: ASSET_COLORS[inv.category],
                                borderColor: `${ASSET_COLORS[inv.category]}30`
                              }}
                            >
                              {inv.category}
                            </span>
                            {isLive && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase tracking-tighter border border-emerald-100 animate-pulse">
                                Live
                              </span>
                            )}
                            {inv.auditInfo?.status === 'Verified' && (
                              <div className="text-emerald-500 flex items-center justify-center bg-emerald-50 rounded p-0.5 border border-emerald-100" title="Audited & Verified Source">
                                <ShieldCheck size={10} />
                              </div>
                            )}
                            {inv.auditInfo?.status === 'Suspicious' && (
                              <div className="text-rose-500 flex items-center justify-center bg-rose-50 rounded p-0.5 border border-rose-100" title={inv.auditInfo.message}>
                                <ShieldAlert size={10} />
                              </div>
                            )}
                            {inv.analysis && (
                              <div className="flex items-center gap-1">
                                {inv.analysis.status && (
                                  <div className={`w-2 h-2 rounded-full shadow-sm ${
                                    inv.analysis.status === 'Green' ? 'bg-emerald-500 shadow-emerald-100' :
                                    inv.analysis.status === 'Yellow' ? 'bg-amber-500 shadow-amber-100' :
                                    'bg-rose-500 shadow-rose-100'
                                  }`} title={`${inv.analysis.status} Status`} />
                                )}
                                <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-tighter border ${
                                  inv.analysis.recommendation === 'Buy' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  inv.analysis.recommendation === 'Hold' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                  {inv.analysis.recommendation}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                          {inv.subCategory} {inv.fundHouse ? `• ${inv.fundHouse}` : ''} {inv.symbol || inv.schemeCode ? `• ${inv.symbol || inv.schemeCode}` : ''}
                        </p>
                        {inv.composition && (Object.values(inv.composition).some(v => v > 0)) && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {inv.composition.equity > 0 && <span className="text-[8px] px-1 bg-emerald-50 text-emerald-600 rounded">E: {inv.composition.equity}%</span>}
                            {inv.composition.debt > 0 && <span className="text-[8px] px-1 bg-indigo-50 text-indigo-600 rounded">D: {inv.composition.debt}%</span>}
                            {inv.composition.globalEquity > 0 && <span className="text-[8px] px-1 bg-rose-50 text-rose-600 rounded">GE: {inv.composition.globalEquity}%</span>}
                            {inv.composition.gold > 0 && <span className="text-[8px] px-1 bg-amber-50 text-amber-600 rounded">G: {inv.composition.gold}%</span>}
                            {inv.composition.realEstate > 0 && <span className="text-[8px] px-1 bg-violet-50 text-violet-600 rounded">RE: {inv.composition.realEstate}%</span>}
                            {inv.composition.other > 0 && <span className="text-[8px] px-1 bg-slate-50 text-slate-600 rounded">O: {inv.composition.other}%</span>}
                          </div>
                        )}
                        {inv.isSIP && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold rounded uppercase tracking-wider border border-indigo-100 flex items-center gap-1">
                              <RefreshCw size={8} />
                              SIP: {formatLakhs(inv.sipAmount || 0, inv.currency)}
                            </span>
                            {inv.sipStartDate && (
                              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[8px] font-bold rounded uppercase tracking-wider border border-slate-100 flex items-center gap-1">
                                <Calendar size={8} />
                                Start: {new Date(inv.sipStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                    {inv.category === 'ESOP' ? (
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-slate-700">
                          {inv.quantity?.toLocaleString() || '0'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                          of {inv.totalOptions?.toLocaleString() || '-'}
                        </span>
                      </div>
                    ) : (
                      inv.quantity?.toLocaleString() || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-700">{formatLakhs(inv.investedValue, inv.currency)}</span>
                      {inv.quantity && inv.quantity > 0 && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          Avg: {formatCurrency(inv.buyPrice || (inv.investedValue / inv.quantity), inv.currency)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-slate-900">
                        {inv.price ? formatCurrency(inv.price, inv.currency) : '-'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        {inv.navDate ? `NAV: ${new Date(inv.navDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : (inv.lastUpdated ? new Date(inv.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">
                    {formatLakhs(inv.currentValue, inv.currency)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`flex flex-col items-end ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      <div className="flex items-center gap-1 font-black">
                        {gain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{formatLakhs(gain, inv.currency)}</span>
                        <span className="text-[10px] opacity-70 ml-1">
                          ({isNaN(gainPercent) ? '0.0' : gainPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest opacity-70">
                        {inv.dayChange !== undefined && (
                          <span className={inv.dayChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            Day: {inv.dayChange >= 0 ? '+' : ''}{inv.dayChangePercent?.toFixed(1)}%
                          </span>
                        )}
                        {inv.dayChange !== undefined && showXIRR && <span className="mx-1">•</span>}
                        {showXIRR && annualizedReturn !== null && (
                          <span>{!isNaN(annualizedReturn) ? (annualizedReturn * 100).toFixed(1) : '0.0'}%</span>
                        )}
                        {!showXIRR && null}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {(inv.goalMappings || []).map((mapping, idx) => {
                        const goal = portfolio.goals.find(g => g.id === mapping.goalId);
                        if (!goal) return null;
                        return (
                          <span key={idx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded border border-emerald-100 whitespace-nowrap">
                            {goal.name} ({mapping.percentage}%)
                          </span>
                        );
                      })}
                      {inv.retirementBucket && inv.retirementBucket !== 'None' && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold rounded border border-indigo-100 whitespace-nowrap">
                          {inv.retirementBucket}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => openAnalysisModal(inv)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-indigo-100"
                        title="AI Analysis"
                      >
                        <Sparkles size={14} />
                        Analyze
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedInvestmentForHistory(inv);
                          setIsHistoryModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-wealth-emerald hover:bg-emerald-50 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-emerald-100"
                        title="Transaction History"
                      >
                        <History size={14} />
                        History
                      </button>
                      <button 
                        onClick={() => openEditModal(inv)}
                        className="p-2 text-slate-400 hover:text-wealth-emerald rounded-lg hover:bg-emerald-50 transition-all"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteInvestment(inv.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {investments.map((inv) => {
          const gain = inv.currentValue - inv.investedValue;
          const gainPercent = inv.investedValue > 0 ? (gain / inv.investedValue) * 100 : 0;
          const isLive = !!(inv.symbol || inv.schemeCode);

          return (
            <div 
              key={inv.id} 
              className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => openAnalysisModal(inv)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="max-w-[70%]">
                  <h4 className="text-serif text-lg font-medium text-slate-900 flex flex-wrap items-center gap-2 overflow-hidden">
                    <div className="flex flex-col truncate">
                      <span className="truncate" title={inv.name}>{inv.name}</span>
                      {inv.entityName && (
                        <span className="text-[8px] text-slate-400 font-medium italic truncate">
                          {inv.entityName}
                        </span>
                      )}
                    </div>
                    <span 
                      className="px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-tighter border"
                      style={{ 
                        backgroundColor: `${ASSET_COLORS[inv.category]}10`, 
                        color: ASSET_COLORS[inv.category],
                        borderColor: `${ASSET_COLORS[inv.category]}30`
                      }}
                    >
                      {inv.category}
                    </span>
                    {isLive && (
                      <span className="shrink-0 px-1 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase border border-emerald-100">Live</span>
                    )}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                    {inv.subCategory} {inv.fundHouse ? `• ${inv.fundHouse}` : ''} {inv.symbol || inv.schemeCode ? `• ${inv.schemeCode || inv.symbol}` : ''}
                  </p>
                  {inv.composition && (Object.values(inv.composition).some(v => v > 0)) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {inv.composition.equity > 0 && <span className="text-[8px] px-1 bg-emerald-50 text-emerald-600 rounded">E: {inv.composition.equity}%</span>}
                      {inv.composition.debt > 0 && <span className="text-[8px] px-1 bg-indigo-50 text-indigo-600 rounded">D: {inv.composition.debt}%</span>}
                      {inv.composition.globalEquity > 0 && <span className="text-[8px] px-1 bg-rose-50 text-rose-600 rounded">GE: {inv.composition.globalEquity}%</span>}
                      {inv.composition.gold > 0 && <span className="text-[8px] px-1 bg-amber-50 text-amber-600 rounded">G: {inv.composition.gold}%</span>}
                    </div>
                  )}
                  {inv.isSIP && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold rounded uppercase tracking-wider border border-indigo-100 flex items-center gap-1">
                        <RefreshCw size={8} />
                        SIP: {formatLakhs(inv.sipAmount || 0, inv.currency)}
                      </span>
                      {inv.sipStartDate && (
                        <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[8px] font-bold rounded uppercase tracking-wider border border-slate-100 flex items-center gap-1">
                          <Calendar size={8} />
                          Start: {new Date(inv.sipStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className={`text-right ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  <p className="text-sm font-black">{formatLakhs(gain, inv.currency)}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-60">
                    {isNaN(gainPercent) ? '0.0' : gainPercent.toFixed(1)}% Returns
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Invested</p>
                  <p className="text-xs font-bold text-slate-700">{formatLakhs(inv.investedValue, inv.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Current Value</p>
                  <p className="text-xs font-black text-slate-900">{formatLakhs(inv.currentValue, inv.currency)}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Live Price</p>
                  <p className="text-xs font-bold text-slate-900">{inv.price ? formatCurrency(inv.price, inv.currency) : '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">NAV Date</p>
                  <p className="text-[10px] font-bold text-slate-500">
                    {inv.navDate ? new Date(inv.navDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : (inv.lastUpdated ? new Date(inv.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')}
                  </p>
                </div>
              </div>

              {( (inv.goalMappings && inv.goalMappings.length > 0) || (inv.retirementBucket && inv.retirementBucket !== 'None') ) && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {(inv.goalMappings || []).map((mapping, idx) => {
                    const goal = portfolio.goals.find(g => g.id === mapping.goalId);
                    if (!goal) return null;
                    return (
                      <span key={idx} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded border border-emerald-100">
                        {goal.name} ({mapping.percentage}%)
                      </span>
                    );
                  })}
                  {inv.retirementBucket && inv.retirementBucket !== 'None' && (
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold rounded border border-indigo-100">
                      {inv.retirementBucket}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openAnalysisModal(inv); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 bg-indigo-50 rounded-lg text-[9px] font-black uppercase tracking-widest"
                    title="AI Analysis"
                  >
                    <Sparkles size={12} />
                    Analyze
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSelectedInvestmentForHistory(inv);
                      setIsHistoryModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-wealth-emerald bg-emerald-50 rounded-lg text-[9px] font-black uppercase tracking-widest"
                    title="Transaction History"
                  >
                    <History size={12} />
                    History
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(inv); }}
                    className="p-2 text-wealth-emerald bg-emerald-50 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteInvestment(inv.id); }}
                  className="p-2 text-rose-600 bg-rose-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCategorySection = (category: AssetCategory) => {
    const categoryInvestments = filteredInvestments.filter(inv => inv.category === category);
    if (categoryInvestments.length === 0) return null;

    const metrics = calculateGroupMetrics(categoryInvestments);
    const totalSIP = categoryInvestments.reduce((sum, inv) => sum + (inv.isSIP ? (inv.sipAmount || 0) : 0), 0);
    const isExpanded = expandedCategories.includes(category);

    const subCategoryGroups = categoryInvestments.reduce((acc, inv) => {
      const subCat = inv.subCategory || 'Other';
      if (!acc[subCat]) acc[subCat] = [];
      acc[subCat].push(inv);
      return acc;
    }, {} as Record<string, Investment[]>);

    return (
      <div key={category} className="space-y-4 premium-card border-slate-200 overflow-hidden">
        <div 
          className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => toggleCategory(category)}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-1.5 h-6 rounded-full" 
              style={{ backgroundColor: ASSET_COLORS[category] }}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-serif text-xl font-medium text-slate-900">{category}</h3>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-slate-400"
                >
                  <MoreVertical size={16} />
                </motion.div>
              </div>
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {categoryInvestments.length} Assets
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-8 text-right">
            {totalSIP > 0 && (
              <div>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Monthly SIP</p>
                <p className="text-sm font-black text-wealth-emerald">{formatLakhs(totalSIP)}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Invested</p>
              <p className="text-sm font-bold text-slate-700">{formatLakhs(metrics.totalInvestedValue)}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Current</p>
              <p className="text-sm font-black text-slate-900">{formatLakhs(metrics.totalCurrentValue)}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Total Gain</p>
              <p className={`text-sm font-black ${metrics.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatLakhs(metrics.gain)}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Returns</p>
              <div className={`text-sm font-black flex items-center gap-1 justify-end ${metrics.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                <span>{isNaN(metrics.absoluteReturn) ? '0.0' : metrics.absoluteReturn.toFixed(1)}%</span>
                {metrics.isMoreThanOneYear && metrics.xirr !== null && (
                  <span className="text-slate-400 font-bold opacity-60">/ {((metrics.xirr || 0) * 100).toFixed(1)}%</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-slate-50/30 border-t border-slate-100"
            >
              <div className="p-2 space-y-8">
                {viewMode === 'subcategory' ? (
                  Object.entries(subCategoryGroups).sort((a, b) => b[1].reduce((sum, i) => sum + i.currentValue, 0) - a[1].reduce((sum, i) => sum + i.currentValue, 0)).map(([subCat, invs]) => {
                    const m = calculateGroupMetrics(invs);
                    return (
                      <div key={subCat} className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm mx-4 mb-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-wealth-navy" />
                            {subCat}
                          </h4>
                          <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span>Invested: <span className="text-slate-700">{formatLakhs(m.totalInvestedValue)}</span></span>
                            <span>Current: <span className="text-slate-900">{formatLakhs(m.totalCurrentValue)}</span></span>
                            <span>Gain: <span className={m.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{isNaN(m.absoluteReturn) ? '0.0' : m.absoluteReturn.toFixed(1)}%</span></span>
                          </div>
                        </div>
                        {renderInvestmentTable(invs)}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4">
                    {renderInvestmentTable(categoryInvestments)}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderGrandTotal = () => {
    if (filteredInvestments.length === 0) return null;
    
    const metrics = calculateGroupMetrics(filteredInvestments);
    const totalSIP = filteredInvestments.reduce((sum, inv) => sum + (inv.isSIP ? (inv.sipAmount || 0) : 0), 0);

    return (
      <div className="wealth-gradient rounded-[2rem] p-8 text-white shadow-xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/10 rounded-xl text-wealth-gold">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Grand Total Portfolio Performance</h3>
              <p className="text-xs text-white/60 font-medium uppercase tracking-widest">Consolidated view of all active investments</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Invested</p>
              <p className="text-2xl font-bold">{formatLakhs(metrics.totalInvestedValue)}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Current Value</p>
              <p className="text-2xl font-bold">{formatLakhs(metrics.totalCurrentValue)}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Gain</p>
              <p className={`text-2xl font-bold ${metrics.gain >= 0 ? 'text-wealth-emerald' : 'text-rose-400'}`}>
                {formatLakhs(metrics.gain)}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Overall Returns</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${metrics.gain >= 0 ? 'text-wealth-emerald' : 'text-rose-400'}`}>
                  {isNaN(metrics.absoluteReturn) ? '0.0' : metrics.absoluteReturn.toFixed(1)}%
                </p>
                {metrics.isMoreThanOneYear && metrics.xirr !== null && (
                  <span className="text-white/40 text-sm font-bold">
                    / {(metrics.xirr * 100).toFixed(1)}% XIRR
                  </span>
                )}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Commitment</p>
              <p className="text-2xl font-bold text-wealth-gold">{formatLakhs(totalSIP)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBankAccounts = () => (
    <div className="space-y-6">
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[25%]">Bank Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[20%]">Account Holder</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Account Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Last 4 Digits</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[15%]">Balance</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[10%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBankAccounts.map((acc) => {
                const member = portfolio.familyMembers.find(m => m.id === acc.memberId);
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-2 rounded-lg text-wealth-emerald">
                          <Landmark size={18} />
                        </div>
                        <span className="text-serif text-base font-medium text-slate-900">{acc.bankName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-wealth-emerald">
                          {member?.name[0] || 'U'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{member?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold uppercase tracking-widest">{acc.accountType}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">**** {acc.lastFourDigits}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{formatLakhs(acc.balance)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openBankEditModal(acc)}
                          className="p-2 text-slate-400 hover:text-wealth-emerald rounded-lg hover:bg-emerald-50 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteBankConfirmId(acc.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
            <History size={24} />
          </div>
          <div>
            <h3 className="text-serif text-2xl font-medium text-slate-900">Wealth Movements</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Historical audit of all strategic deployments</p>
          </div>
        </div>
        <button className="premium-button-secondary px-4 py-2 flex items-center gap-2">
          <Download size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Export Ledger</span>
        </button>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[12%]">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[25%]">Investment</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[10%]">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[10%]">Quantity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[13%]">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[20%]">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[10%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-300 italic font-serif">
                    No movements recorded. Synchronize your accounts to populate the ledger.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-serif text-base font-medium text-slate-900">{tx.investmentName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        tx.type === 'Buy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                        tx.type === 'Sell' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                        'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-slate-500">{tx.quantity || '-'}</td>
                    <td className="px-6 py-4 text-right text-xs font-bold text-slate-700">{tx.price ? formatCurrency(tx.price) : '-'}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{formatLakhs(tx.amount)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openTransactionEditModal(tx)}
                          className="p-2 text-slate-400 hover:text-wealth-emerald rounded-lg hover:bg-emerald-50 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteTransactionConfirmId(tx.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInsurance = () => (
    <div className="space-y-6">
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[25%]">Policy Name</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Provider</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[15%]">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[15%]">Sum Assured</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[15%]">Premium</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[10%]">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[5%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInsurance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-300 italic font-serif">
                    No insurance policies recorded. Import from repository to track your coverage.
                  </td>
                </tr>
              ) : (
                filteredInsurance.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
                          <ShieldCheck size={18} />
                        </div>
                        <span className="text-serif text-base font-medium text-slate-900">{ins.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{ins.provider}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold uppercase tracking-widest">{ins.type}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{formatLakhs(ins.sumAssured)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-700">{formatLakhs(ins.premium)}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{ins.premiumFrequency}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        ins.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        {ins.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingInsurance(ins);
                            setIsInsuranceModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-wealth-emerald rounded-lg hover:bg-emerald-50 transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteInsuranceConfirmId(ins.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const totalInvestmentsValue = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.currentValue, inv.currency), 0);
  const totalInvestmentsCost = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.investedValue, inv.currency), 0);
  const totalBankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalInvested = totalInvestmentsCost + totalBankBalance;
  const totalCurrent = totalInvestmentsValue + totalBankBalance;
  const totalGain = totalCurrent - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const totalLiabilities = portfolio.liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0);
  const netWorth = totalCurrent - totalLiabilities;

  return (
    <div className="space-y-8">
      {/* Portfolio Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Assets</p>
          <p className="text-2xl font-black text-slate-900">{formatLakhs(totalCurrent)}</p>
          <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${totalGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalGain >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{totalGain >= 0 ? '+' : ''}{formatLakhs(totalGain)} ({totalGainPercent.toFixed(1)}%)</span>
          </div>
        </div>
        <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Bank Balance</p>
          <p className="text-2xl font-black text-slate-900">
            {formatLakhs(portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
          </p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
            Across {portfolio.bankAccounts.length} Accounts
          </p>
        </div>
        <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Insurance Cover</p>
          <p className="text-2xl font-black text-rose-600">
            {formatLakhs((portfolio.insurances || []).reduce((sum, ins) => sum + ins.sumAssured, 0))}
          </p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
            Total Sum Assured
          </p>
        </div>
        <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Monthly SIP</p>
          <p className="text-2xl font-black text-wealth-emerald">{formatLakhs(totalPortfolioSIP)}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
            Strategic Velocity
          </p>
        </div>
        <div className="premium-card p-6 bg-white border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Net Worth</p>
          <p className="text-2xl font-black text-indigo-600">
            {formatLakhs(netWorth)}
          </p>
          <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
            Assets - Liabilities
          </p>
        </div>
      </div>

      {/* Sub-tabs Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-200">
          <button
            onClick={() => setActiveSubTab('investments')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'investments' 
                ? 'bg-white text-wealth-emerald shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Investments
          </button>
          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'performance' 
                ? 'bg-white text-wealth-emerald shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Performance Tracker
          </button>
          <button
            onClick={() => setActiveSubTab('analysis')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'analysis' 
                ? 'bg-white text-wealth-emerald shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Portfolio Analysis
          </button>
          <button
            onClick={() => setActiveSubTab('bank')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'bank' 
                ? 'bg-white text-wealth-emerald shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Bank Accounts
          </button>
          <button
            onClick={() => setActiveSubTab('transactions')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'transactions' 
                ? 'bg-white text-wealth-emerald shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveSubTab('insurance')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeSubTab === 'insurance' 
                ? 'bg-white text-wealth-emerald shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Insurance
          </button>
        </div>

        {activeSubTab === 'investments' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {['All', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategoryTab(cat as any);
                    setActiveSubCategoryTab('All');
                  }}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    activeCategoryTab === cat
                      ? 'bg-wealth-navy text-white border-wealth-navy shadow-lg shadow-slate-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-wealth-navy hover:text-wealth-navy'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {activeCategoryTab !== 'All' && Array.from(new Set(portfolio.investments.filter(i => i.category === activeCategoryTab).map(i => i.subCategory))).length > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar bg-slate-50/50 p-2 rounded-2xl border border-slate-100"
              >
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Sub-Category:</span>
                {['All', ...Array.from(new Set(portfolio.investments.filter(i => i.category === activeCategoryTab).map(i => i.subCategory)))].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubCategoryTab(sub)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                      activeSubCategoryTab === sub
                        ? 'bg-wealth-emerald text-white border-wealth-emerald shadow-md'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-wealth-emerald hover:text-wealth-emerald'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {activeSubTab === 'investments' && totalPortfolioSIP > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div 
            whileHover={{ y: -4 }}
            onClick={() => setIsSIPAnalysisModalOpen(true)}
            className="premium-card p-6 flex items-center gap-4 cursor-pointer group wealth-gradient text-white border-none"
          >
            <div className="p-3 bg-white/10 text-white rounded-xl group-hover:bg-white/20 transition-colors">
              <RefreshCw size={24} />
            </div>
            <div>
              <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Wealth Velocity (SIP)</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-black">{formatLakhs(totalPortfolioSIP)}</p>
                <Sparkles size={16} className="text-wealth-gold animate-pulse" />
              </div>
              <p className="text-[8px] text-white/40 font-black uppercase mt-1">Strategic Analysis Available</p>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {activeSubTab === 'investments' && (
          <div className="flex items-center gap-4 bg-slate-100/50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('category')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'category' 
                  ? 'bg-white text-wealth-emerald shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Category
            </button>
            <button
              onClick={() => setViewMode('subcategory')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'subcategory' 
                  ? 'bg-white text-wealth-emerald shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sub-Category
            </button>
          </div>
        )}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={
              activeSubTab === 'investments' 
                ? "Search assets..." 
                : activeSubTab === 'bank' 
                  ? "Search accounts..." 
                  : "Search history..."
            }
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          {activeSubTab === 'investments' ? (
            <>
              <button 
                onClick={onRefresh || (() => (window as any).refreshMarketData?.(true))}
                disabled={isRefreshing || isRefreshingAll}
                className="premium-button-secondary flex-1 md:flex-none px-4 py-3 flex flex-col items-center gap-1 disabled:opacity-50 min-w-[120px]"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className={`text-wealth-emerald ${isRefreshing || isRefreshingAll ? 'animate-spin' : ''}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{isRefreshing || isRefreshingAll ? 'Syncing' : 'Sync Prices'}</span>
                </div>
                {portfolio.lastMarketRefresh && (
                  <span className="text-[8px] font-medium text-slate-400">
                    Last: {new Date(portfolio.lastMarketRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </button>

              <button 
                onClick={() => (window as any).openCASModal?.()}
                className="premium-button-secondary flex-1 md:flex-none px-4 py-3 flex items-center gap-2"
              >
                <Upload size={18} className="text-wealth-emerald" />
                <span className="text-[10px] font-black uppercase tracking-widest">Import Assets</span>
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => downloadPortfolioExcel(portfolio)}
                  className="premium-button-secondary px-4 py-3 flex items-center gap-2"
                  title="Download Excel Report"
                >
                  <Download size={18} className="text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Excel</span>
                </button>
                <button 
                  onClick={() => downloadPortfolioPDF(portfolio)}
                  className="premium-button-secondary px-4 py-3 flex items-center gap-2"
                  title="Download PDF Report"
                >
                  <Download size={18} className="text-rose-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
                </button>
              </div>
              
              <button 
                onClick={openAddModal}
                className="premium-button-primary flex-1 md:flex-none px-6 py-3 flex items-center gap-2"
              >
                <Plus size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Add Asset</span>
              </button>
            </>
          ) : activeSubTab === 'bank' ? (
            <button 
              onClick={openBankAddModal}
              className="premium-button-primary flex-1 md:flex-none px-6 py-3 flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Add Account</span>
            </button>
          ) : activeSubTab === 'insurance' ? (
            <button 
              onClick={() => {
                setEditingInsurance(null);
                setIsInsuranceModalOpen(true);
              }}
              className="premium-button-primary flex-1 md:flex-none px-6 py-3 flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Add Policy</span>
            </button>
          ) : (
            <button 
              onClick={() => {
                setEditingTransaction(null);
                setIsTransactionModalOpen(true);
              }}
              className="premium-button-primary flex-1 md:flex-none px-6 py-3 flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Add Transaction</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-10">
        {activeSubTab === 'investments' ? (
          <>
            {renderGrandTotal()}
            {filterCategory === 'All' ? (
              categories.map(cat => renderCategorySection(cat))
            ) : (
              renderCategorySection(filterCategory as AssetCategory)
            )}
          </>
        ) : activeSubTab === 'performance' ? (
          <InvestmentPerformance portfolio={portfolio} />
        ) : activeSubTab === 'analysis' ? (
          <PortfolioAnalysis portfolio={portfolio} />
        ) : activeSubTab === 'bank' ? (
          renderBankAccounts()
        ) : activeSubTab === 'insurance' ? (
          renderInsurance()
        ) : (
          renderTransactions()
        )}
      </div>

      {/* PROFESSIONAL TONY ROBBINS ASSET ALLOCATION QUOTE */}
      <div className="mt-14 pt-8 border-t border-slate-100 flex justify-center">
        <div className="max-w-4xl w-full px-8 py-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden text-center">
          <div className="absolute top-4 left-6 opacity-5 pointer-events-none select-none">
            <Quote size={80} className="text-slate-900" />
          </div>
          <p className="font-serif italic text-lg sm:text-xl text-slate-700 leading-relaxed relative z-10 font-medium">
            “The difference between success and failure is not which stock you buy or which piece of real estate you buy, it is asset allocation.”
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 relative z-10 font-sans">
            <span className="w-6 h-px bg-slate-300"></span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tony Robbins</span>
            <span className="w-6 h-px bg-slate-300"></span>
          </div>
        </div>
      </div>
      
      {activeSubTab === 'investments' && filteredInvestments.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No investments found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      )}

      {activeSubTab === 'bank' && filteredBankAccounts.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Landmark className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No bank accounts found</h3>
          <p className="text-slate-500">Add your bank accounts to track your liquid cash</p>
          <button 
            onClick={openBankAddModal}
            className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
          >
            Add Account
          </button>
        </div>
      )}

      {activeSubTab === 'insurance' && filteredInsurance.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No insurance policies found</h3>
          <p className="text-slate-500">Track your life, health, and general insurance policies</p>
          <button 
            onClick={() => {
              setEditingInsurance(null);
              setIsInsuranceModalOpen(true);
            }}
            className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
          >
            Add Policy
          </button>
        </div>
      )}

      <InvestmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveInvestment}
        initialData={editingInvestment}
        onAnalyze={(inv) => {
          setIsModalOpen(false);
          openAnalysisModal(inv);
        }}
      />

      <BankAccountModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        account={editingBankAccount || undefined}
      />

      <AnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        investment={analyzingInvestment}
        onUpdateAnalysis={handleUpdateAnalysis}
        onEdit={openEditModal}
      />

      <TransactionHistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        investment={selectedInvestmentForHistory}
      />

      <SIPAnalysisModal 
        isOpen={isSIPAnalysisModalOpen}
        onClose={() => setIsSIPAnalysisModalOpen(false)}
        sipInvestments={portfolio.investments.filter(inv => inv.isSIP)}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={async (tx) => {
          if (editingTransaction) {
            await updateTransaction(tx);
          } else {
            await addTransaction(tx);
          }
        }}
        initialData={editingTransaction || undefined}
        investments={portfolio.investments}
      />

      <InsuranceModal
        isOpen={isInsuranceModalOpen}
        onClose={() => setIsInsuranceModalOpen(false)}
        onSave={handleSaveInsurance}
        editingPolicy={editingInsurance}
        familyMembers={portfolio.familyMembers}
      />

      {/* Delete Confirmation Modal */}
      {(deleteConfirmId || deleteBankConfirmId || deleteTransactionConfirmId || deleteInsuranceConfirmId) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Delete {deleteBankConfirmId ? 'Bank Account' : deleteTransactionConfirmId ? 'Transaction' : deleteInsuranceConfirmId ? 'Insurance Policy' : 'Investment'}?
              </h3>
              <p className="text-slate-500 mt-2">
                Are you sure you want to delete this {deleteBankConfirmId ? 'account' : deleteTransactionConfirmId ? 'transaction' : deleteInsuranceConfirmId ? 'policy' : 'investment'}? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  setDeleteConfirmId(null); 
                  setDeleteBankConfirmId(null); 
                  setDeleteTransactionConfirmId(null);
                  setDeleteInsuranceConfirmId(null);
                }}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioTracker;
