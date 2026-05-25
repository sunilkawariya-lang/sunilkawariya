import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  List as ListIcon,
  CreditCard as CreditCardIcon,
  Building2,
  FileText
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { BankAccount, BankTransaction, CreditCard, CreditCardTransaction } from '../types';
import { formatCurrency } from '../constants';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, isWithinInterval, parseISO, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import BankAccountModal from './BankAccountModal';
import BankStatementImportModal from './BankStatementImportModal';
import CreditCardModal from './CreditCardModal';
import CreditCardStatementImportModal from './CreditCardStatementImportModal';

type FilterType = 'Monthly' | 'Quarterly' | 'FY' | 'Custom';

export default function BankAccountManager() {
  const { 
    portfolio, 
    addBankAccount, updateBankAccount, deleteBankAccount, 
    addBankTransaction, updateBankTransaction, deleteBankTransaction,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addCreditCardTransaction, updateCreditCardTransaction, deleteCreditCardTransaction
  } = useFirebase();
  
  const [activeTab, setActiveTab] = useState<'banks' | 'cards'>('banks');
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [selectedCardId, setSelectedCardId] = useState<string | 'all'>('all');
  const [filterType, setFilterType] = useState<FilterType>('Monthly');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCardImportModalOpen, setIsCardImportModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | undefined>();
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>();

  const filteredTransactions = useMemo(() => {
    let txs: (BankTransaction | CreditCardTransaction)[] = activeTab === 'banks' ? portfolio.bankTransactions : portfolio.creditCardTransactions;
    
    if (activeTab === 'banks') {
      if (selectedAccountId !== 'all') {
        txs = (txs as BankTransaction[]).filter(t => t.bankAccountId === selectedAccountId);
      }
    } else {
      if (selectedCardId !== 'all') {
        txs = (txs as CreditCardTransaction[]).filter(t => t.creditCardId === selectedCardId);
      }
    }

    const now = new Date();
    let start: Date, end: Date;

    switch (filterType) {
      case 'Monthly':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'Quarterly':
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        break;
      case 'FY':
        const currentYear = now.getFullYear();
        const fyStartYear = now.getMonth() < 3 ? currentYear - 1 : currentYear;
        start = new Date(fyStartYear, 3, 1);
        end = new Date(fyStartYear + 1, 2, 31);
        break;
      case 'Custom':
        start = parseISO(customDateRange.start);
        end = parseISO(customDateRange.end);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    txs = txs.filter(t => {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start, end });
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      txs = txs.filter(t => 
        t.description.toLowerCase().includes(q) || 
        t.category.toLowerCase().includes(q)
      );
    }

    return txs.sort((a, b) => b.date.localeCompare(a.date));
  }, [portfolio.bankTransactions, portfolio.creditCardTransactions, activeTab, selectedAccountId, selectedCardId, filterType, customDateRange, searchQuery]);

  const stats = useMemo(() => {
    const credits = filteredTransactions.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
    const debits = filteredTransactions.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
    const net = credits - debits;

    const categories = filteredTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const pieData: { name: string; value: number }[] = Object.entries(categories).map(([name, value]) => ({ name, value }));

    return { credits, debits, net, pieData };
  }, [filteredTransactions]);

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#f97316', '#8b5cf6', '#f43f5e', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Tab Toggle */}
      <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'banks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Bank Accounts
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCardIcon className="w-4 h-4" />
          Credit Cards
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'banks' ? 'Bank Accounts & Transactions' : 'Credit Cards & Statements'}
          </h2>
          <p className="text-gray-500">
            {activeTab === 'banks' 
              ? 'Manage your cash flow and analyze expenses' 
              : 'Track credit usage and analyze spending patterns'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (activeTab === 'banks') {
                setEditingAccount(undefined);
                setIsAccountModalOpen(true);
              } else {
                setEditingCard(undefined);
                setIsCardModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'banks' ? 'Add Account' : 'Add Card'}
          </button>
          <button 
            onClick={() => {
              if (activeTab === 'banks') setIsImportModalOpen(true);
              else setIsCardImportModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Statement
          </button>
        </div>
      </div>

      {/* Selector Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {activeTab === 'banks' ? (
          <>
            <button
              onClick={() => setSelectedAccountId('all')}
              className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all ${
                selectedAccountId === 'all' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
              }`}
            >
              <div className="font-semibold">All Accounts</div>
              <div className="text-sm opacity-80">
                {formatCurrency(portfolio.bankAccounts.reduce((sum, a) => sum + a.balance, 0))}
              </div>
            </button>
            {portfolio.bankAccounts.map(account => (
              <div key={account.id} className="relative group flex-shrink-0">
                <button
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`w-full text-left px-6 py-3 rounded-xl border-2 transition-all ${
                    selectedAccountId === account.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <Building2 className="w-4 h-4" />
                    {account.bankName}
                  </div>
                  <div className="text-sm opacity-80">
                    **** {account.lastFourDigits} • {formatCurrency(account.balance)}
                  </div>
                </button>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAccount(account);
                      setIsAccountModalOpen(true);
                    }}
                    className="p-1 bg-white/80 backdrop-blur-sm rounded-md text-gray-400 hover:text-indigo-600 shadow-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this account and all its transactions?')) {
                        deleteBankAccount(account.id);
                      }
                    }}
                    className="p-1 bg-white/80 backdrop-blur-sm rounded-md text-gray-400 hover:text-rose-600 shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedCardId('all')}
              className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 transition-all ${
                selectedCardId === 'all' 
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                  : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
              }`}
            >
              <div className="font-semibold">All Cards</div>
              <div className="text-sm opacity-80">
                {formatCurrency(portfolio.creditCards.reduce((sum, c) => sum + c.currentOutstanding, 0))} Total Due
              </div>
            </button>
            {portfolio.creditCards.map(card => (
              <div key={card.id} className="relative group flex-shrink-0">
                <button
                  onClick={() => setSelectedCardId(card.id)}
                  className={`w-full text-left px-6 py-3 rounded-xl border-2 transition-all ${
                    selectedCardId === card.id 
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <CreditCardIcon className="w-4 h-4" />
                    {card.cardName}
                  </div>
                  <div className="text-sm opacity-80">
                    **** {card.lastFourDigits} • {formatCurrency(card.currentOutstanding)} Due
                  </div>
                </button>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCard(card);
                      setIsCardModalOpen(true);
                    }}
                    className="p-1 bg-white/80 backdrop-blur-sm rounded-md text-gray-400 hover:text-indigo-600 shadow-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this card and all its transactions?')) {
                        deleteCreditCard(card.id);
                      }
                    }}
                    className="p-1 bg-white/80 backdrop-blur-sm rounded-md text-gray-400 hover:text-rose-600 shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              {activeTab === 'banks' ? 'Total Credits' : 'Payments/Refunds'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.credits)}</div>
          <p className="text-sm text-gray-500 mt-1">For selected period</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              {activeTab === 'banks' ? 'Total Debits' : 'Total Spends'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.debits)}</div>
          <p className="text-sm text-gray-500 mt-1">For selected period</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${stats.net >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${stats.net >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
              {activeTab === 'banks' ? 'Net Savings' : 'Net Change'}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.net)}</div>
          <p className="text-sm text-gray-500 mt-1">For selected period</p>
        </motion.div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-lg w-fit">
            {(['Monthly', 'Quarterly', 'FY', 'Custom'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  filterType === type 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('analysis')}
                className={`p-2 rounded-md transition-all ${viewMode === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}
              >
                <PieChartIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filterType === 'Custom' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="flex items-center gap-4 pt-2 border-t border-gray-100"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">From:</span>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1.5 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">To:</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1.5 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-bottom border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(parseISO(tx.date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                          {tx.reference && <div className="text-xs text-gray-400">Ref: {tx.reference}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {tx.category}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-semibold ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'Credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                if (activeTab === 'banks') {
                                  // Edit bank tx
                                } else {
                                  // Edit card tx
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (activeTab === 'banks') deleteBankTransaction(tx.id);
                                else deleteCreditCardTransaction(tx.id);
                              }}
                              className="p-1 text-gray-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 opacity-20" />
                          <p>No transactions found for the selected period.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Breakdown</h3>
              <div className="space-y-4">
                {stats.pieData.sort((a, b) => b.value - a.value).map((item, index) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">{item.name}</span>
                      <span className="text-gray-900 font-semibold">{formatCurrency(item.value)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${(item.value / stats.debits) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <BankAccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        account={editingAccount}
      />
      <BankStatementImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        bankAccounts={portfolio.bankAccounts}
      />
      <CreditCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        card={editingCard}
      />
      <CreditCardStatementImportModal
        isOpen={isCardImportModalOpen}
        onClose={() => setIsCardImportModalOpen(false)}
        creditCards={portfolio.creditCards}
      />
    </div>
  );
}
