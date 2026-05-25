import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Zap, 
  Crown, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Gift,
  Clock,
  ExternalLink,
  Check
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { formatCurrency } from '../constants';
import { WalletTransaction } from '../types';

const OFFERS = [
  { id: 'off-1', name: 'Welcome Bonus', description: 'Add ₹1,000 and get ₹200 extra', amount: 1000, bonus: 200, icon: Gift, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'off-2', name: 'Elite Multiplier', description: 'Add ₹5,000 and get ₹1,200 extra', amount: 5000, bonus: 1200, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'off-3', name: 'Loyalty Boost', description: 'Add ₹2,500 and get ₹600 extra', amount: 2500, bonus: 600, icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const SUBSCRIPTIONS = [
  { id: 'sub-1', name: 'Premium AI Insights', price: 999, period: 'Month', features: ['Real-time Portfolio Analysis', 'Smart Rebalancing Alerts', 'Unlimited PDF Imports', 'Custom Stock Watchlists'], icon: Zap, color: 'text-emerald-600' },
  { id: 'sub-2', name: 'Family Wealth Plan', price: 1499, period: 'Month', features: ['Up to 5 Family Members', 'Consolidated Tax Planning', 'Estate Transition Wizard', 'Priority Concierge Support'], icon: ShieldCheck, color: 'text-blue-600' },
];

const Wallet = () => {
  const { portfolio, updateWalletBalance, addWalletTransaction } = useFirebase();
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showSubPurchase, setShowSubPurchase] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const balance = portfolio.wallet?.balance || 0;
  const transactions = portfolio.walletTransactions || [];

  const handleAddMoney = async (topUpAmount: number, bonusAmount: number = 0, offerName?: string) => {
    setIsProcessing(true);
    try {
      const total = topUpAmount + bonusAmount;
      const newBalance = balance + total;
      
      const transaction: Partial<WalletTransaction> = {
        type: 'Credit',
        amount: total,
        description: offerName ? `Top-up with ${offerName}` : 'Manual Top-up',
        status: 'Completed',
        date: new Date().toISOString(),
      };

      await updateWalletBalance(newBalance);
      await addWalletTransaction(transaction);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowAddMoney(false);
        setIsProcessing(false);
        setAmount('');
      }, 2000);
    } catch (error) {
      console.error('Wallet error:', error);
      setIsProcessing(false);
    }
  };

  const handlePurchaseSub = async (sub: any) => {
    if (balance < sub.price) {
      alert('Insufficient wallet balance. Please top up.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const newBalance = balance - sub.price;
      
      const transaction: Partial<WalletTransaction> = {
        type: 'Debit',
        amount: sub.price,
        description: `Subscription: ${sub.name}`,
        status: 'Completed',
        date: new Date().toISOString(),
      };

      await updateWalletBalance(newBalance);
      await addWalletTransaction(transaction);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowSubPurchase(false);
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Subscription error:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8">
      {/* Wallet Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-slate-200"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <WalletIcon size={18} />
              <span className="text-sm font-medium tracking-wider uppercase">Wallet Balance</span>
            </div>
            <div className="flex items-baseline gap-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                {formatCurrency(balance).replace('₹', '₹ ')}
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">
                <TrendingUp size={12} />
                +12% vs last month
              </div>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              Your flexible digital wallet for all Wealth Architect services. Securely top-up and pay for premium features.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setShowAddMoney(true)}
              className="px-8 py-4 bg-emerald-500 text-slate-900 rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" />
              Add Money
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Offers */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Gift className="text-emerald-600" size={20} />
                Exclusive Offers
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {OFFERS.map((offer) => (
                <button 
                  key={offer.id}
                  onClick={() => {
                    setSelectedSub(offer);
                    handleAddMoney(offer.amount, offer.bonus, offer.name);
                  }}
                  className={`flex flex-col gap-4 p-6 rounded-3xl border border-slate-100 text-left transition-all hover:shadow-xl hover:-translate-y-1 ${offer.bg}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm ${offer.color}`}>
                    <offer.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{offer.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{offer.description}</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/50">
                    <span className="text-sm font-bold text-slate-900">₹{offer.amount.toLocaleString('en-IN')}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-white shadow-sm ${offer.color}`}>
                      +₹{offer.bonus} Extra
                    </span>
                  </div>
                </button>
              ))}
              <div className="p-6 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center gap-2 text-slate-400">
                <ShieldCheck size={32} strokeWidth={1} />
                <p className="text-xs">More offers coming soon for Pro users</p>
              </div>
            </div>
          </section>

          {/* Transactions */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <History className="text-slate-400" size={20} />
                Transaction History
              </h3>
              <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
            </div>
            
            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              {transactions.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        tx.type === 'Credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {tx.type === 'Credit' ? <Plus size={20} /> : <Zap size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{tx.description}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === 'Credit' ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{tx.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <History size={32} />
                  </div>
                  <div className="text-slate-500">
                    <p className="font-bold">No transactions yet</p>
                    <p className="text-xs">Your wallet activity will appear here.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Subscriptions */}
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
              <Crown className="text-amber-500" size={20} />
              Subscriptions
            </h3>
            <div className="space-y-4">
              {SUBSCRIPTIONS.map((sub) => (
                <div key={sub.id} className="relative group">
                  <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-xl group-hover:bg-blue-500/10 transition-all opacity-0 group-hover:opacity-100" />
                  <div className="relative bg-white p-6 rounded-[2rem] border border-slate-100 space-y-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 ${sub.color}`}>
                        <sub.icon size={24} />
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">₹{sub.price}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">per {sub.period}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{sub.name}</h4>
                      <div className="mt-4 space-y-3">
                        {sub.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check size={14} className="text-emerald-500 mt-1 shrink-0" />
                            <span className="text-xs text-slate-600 leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedSub(sub);
                        setShowSubPurchase(true);
                      }}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                    >
                      Subscribe Now
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Help */}
          <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 space-y-4">
            <h4 className="font-bold text-emerald-900 flex items-center gap-2">
              <Zap size={18} />
              Why use the Wallet?
            </h4>
            <div className="space-y-3">
              {[
                'Instant access to AI reports',
                'One-click subscription renewal',
                'Exclusive bonus offers',
                'Secure & encrypted payments'
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] text-emerald-700 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(showAddMoney || showSubPurchase) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessing) {
                  setShowAddMoney(false);
                  setShowSubPurchase(false);
                }
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
            >
              {showAddMoney && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 mb-2">
                      <Plus size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Add Money to Wallet</h3>
                    <p className="text-slate-500 text-sm">Enter the amount you'd like to top-up</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">₹</div>
                      <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border-none rounded-3xl py-8 pl-12 pr-6 text-3xl font-bold focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {[500, 1000, 2000].map(val => (
                        <button 
                          key={val}
                          onClick={() => setAmount(val.toString())}
                          className="py-3 bg-slate-100 rounded-2xl text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                        >
                          +₹{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    disabled={!amount || isProcessing}
                    onClick={() => handleAddMoney(parseFloat(amount))}
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="animate-spin" size={20} />
                        Processing...
                      </>
                    ) : success ? (
                      <>
                        <Check size={20} className="text-emerald-400" />
                        Success!
                      </>
                    ) : (
                      'Continue to Pay'
                    )}
                  </button>
                  
                  <p className="text-[10px] text-center text-slate-400">
                    Safe & Secure 256-bit SSL Encrypted Payment
                  </p>
                </div>
              )}

              {showSubPurchase && selectedSub && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto text-blue-600 mb-2">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Confirm Purchase</h3>
                    <p className="text-slate-500 text-sm">Purchase {selectedSub.name}</p>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Subscription Fee</span>
                      <span className="font-bold text-slate-900">₹{selectedSub.price}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>GST (0% for wallet)</span>
                      <span className="font-bold text-slate-900">₹0</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-slate-900">Total Payable</span>
                      <span className="text-blue-600">₹{selectedSub.price}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <WalletIcon className="text-emerald-600" size={18} />
                      <span className="text-xs font-bold text-emerald-900">Wallet Balance</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-900">₹{balance}</span>
                  </div>

                  <button 
                    disabled={isProcessing || balance < selectedSub.price}
                    onClick={() => handlePurchaseSub(selectedSub)}
                    className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <Clock className="animate-spin" size={20} />
                    ) : success ? (
                      <Check className="text-emerald-400" size={20} />
                    ) : balance < selectedSub.price ? (
                      'Insufficient Balance'
                    ) : (
                      'Pay with Wallet'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wallet;
