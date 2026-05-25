
import React, { useState, useMemo } from 'react';
import { PortfolioState, Nominee, EstatePlanning as EstatePlanningType, Investment, InsurancePolicy } from '../types';
import { FileText, Users, Shield, Key, CheckCircle2, AlertCircle, ArrowRight, Plus, User, X, Trash2, RotateCcw, Calendar, TrendingUp, DollarSign, Clock, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import WillDraftingModal from './WillDraftingModal';
import EstateKnowledgeCenter from './EstateKnowledgeCenter';
import EstateNews from './EstateNews';
import FIRECalculator from './FIRECalculator';

interface EstatePlanningProps {
  portfolio: PortfolioState;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioState>>;
}

const EstatePlanning: React.FC<EstatePlanningProps> = ({ portfolio, setPortfolio }) => {
  const { updateEstatePlanning, selectedMemberId, familyMembers } = useFirebase();
  const [activeTab, setActiveTab] = useState<'checklist' | 'cashflows' | 'fire'>('checklist');
  const [editingMemberId, setEditingMemberId] = useState<string>(
    selectedMemberId === 'family' ? (familyMembers[0]?.id || 'm1') : selectedMemberId
  );

  // Sync editingMemberId when selectedMemberId changes
  React.useEffect(() => {
    if (selectedMemberId !== 'family') {
      setEditingMemberId(selectedMemberId);
    } else if (!editingMemberId || editingMemberId === 'family') {
      setEditingMemberId(familyMembers[0]?.id || 'm1');
    }
  }, [selectedMemberId, familyMembers]);

  const estatePlanning = useMemo(() => {
    if (selectedMemberId !== 'family') return portfolio.estatePlanning;
    return portfolio.estatePlannings.find(p => p.memberId === editingMemberId) || {
      memberId: editingMemberId,
      willStatus: 'Not Started' as const,
      nomineesUpdated: false,
      insuranceCover: 0,
      digitalAssetsVault: false,
      trustCreated: false,
      powerOfAttorney: false,
      medicalDirective: false,
      nominees: []
    } as EstatePlanningType;
  }, [portfolio.estatePlanning, portfolio.estatePlannings, selectedMemberId, editingMemberId]);

  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [isNomineeModalOpen, setIsNomineeModalOpen] = useState(false);
  const [isWillModalOpen, setIsWillModalOpen] = useState(false);
  const [newCoverAmount, setNewCoverAmount] = useState<string>('');
  const [newNominee, setNewNominee] = useState<Partial<Nominee>>({
    name: '',
    relationship: '',
    share: 0
  });

  const openCoverModal = () => {
    setNewCoverAmount(estatePlanning.insuranceCover.toString());
    setIsCoverModalOpen(true);
  };

  const openNomineeModal = () => {
    setNewNominee({ name: '', relationship: '', share: 0 });
    setIsNomineeModalOpen(true);
  };

  const updateEstate = async (updates: Partial<typeof estatePlanning>) => {
    const memberId = selectedMemberId === 'family' ? editingMemberId : (estatePlanning.memberId || selectedMemberId);
    await updateEstatePlanning({ ...estatePlanning, ...updates, memberId });
  };

  const handleUpdateCover = async () => {
    const amount = parseFloat(newCoverAmount);
    if (!isNaN(amount)) {
      await updateEstate({ insuranceCover: amount });
      setIsCoverModalOpen(false);
      setNewCoverAmount('');
    }
  };

  const handleAddNominee = async () => {
    if (newNominee.name && newNominee.relationship && newNominee.share !== undefined && newNominee.share > 0) {
      const nominee: Nominee = {
        id: Math.random().toString(36).substr(2, 9),
        name: newNominee.name,
        relationship: newNominee.relationship,
        share: newNominee.share
      };
      const updatedNominees = [...(estatePlanning.nominees || []), nominee];
      await updateEstate({ nominees: updatedNominees, nomineesUpdated: true });
      setIsNomineeModalOpen(false);
      setNewNominee({ name: '', relationship: '', share: 0 });
    }
  };

  const handleDeleteNominee = async (id: string) => {
    const updatedNominees = (estatePlanning.nominees || []).filter(n => n.id !== id);
    await updateEstate({ nominees: updatedNominees });
  };

  const handleSaveWill = async (draft: string) => {
    await updateEstate({ willDraft: draft, willStatus: 'Drafted' });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const upcomingCashflows = useMemo(() => {
    const cashflows: { date: string; amount: number; description: string; type: string; source: string }[] = [];
    const memberId = selectedMemberId === 'family' ? editingMemberId : selectedMemberId;
    
    const filteredInvestments = portfolio.investments.filter(i => memberId === 'family' || i.memberId === memberId);
    const filteredInsurances = portfolio.insurances.filter(i => memberId === 'family' || i.memberId === memberId);

    // 1. Investment Maturities & SWPs
    filteredInvestments.forEach(inv => {
      if (inv.maturityDate) {
        cashflows.push({
          date: inv.maturityDate,
          amount: inv.maturityAmount || inv.currentValue || inv.investedValue,
          description: `Maturity of ${inv.name}`,
          type: 'Maturity',
          source: inv.category
        });
      }
      if (inv.swpAmount && inv.swpNextDate) {
        // Generate next 12 months of SWP
        let nextDate = new Date(inv.swpNextDate);
        for (let i = 0; i < 12; i++) {
          cashflows.push({
            date: nextDate.toISOString().split('T')[0],
            amount: inv.swpAmount,
            description: `SWP from ${inv.name}`,
            type: 'SWP',
            source: inv.category
          });
          if (inv.swpFrequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (inv.swpFrequency === 'Quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
          else if (inv.swpFrequency === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
          else break;
        }
      }
    });

    // 2. Insurance Maturities & Cashflows
    filteredInsurances.forEach(ins => {
      if (ins.maturityDate) {
        cashflows.push({
          date: ins.maturityDate,
          amount: ins.maturityAmount || 0,
          description: `Maturity of ${ins.name}`,
          type: 'Maturity',
          source: 'Insurance'
        });
      }
      if (ins.cashflows) {
        ins.cashflows.forEach(cf => {
          cashflows.push({
            ...cf,
            type: 'Survival Benefit',
            source: 'Insurance'
          });
        });
      }
    });

    return cashflows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [portfolio.investments, portfolio.insurances, selectedMemberId, editingMemberId]);

  const checklist = [
    {
      id: 'will',
      title: 'Draft a Will',
      desc: estatePlanning.willStatus === 'Drafted' ? 'Draft generated. Review and register.' : 'Ensure your assets are distributed according to your wishes.',
      status: estatePlanning.willStatus === 'Registered' ? 'complete' : estatePlanning.willStatus === 'Drafted' ? 'partial' : 'pending',
      icon: FileText,
      action: () => setIsWillModalOpen(true),
      reset: () => updateEstate({ willStatus: 'Not Started', willDraft: undefined })
    },
    {
      id: 'nominees',
      title: 'Update Nominees',
      desc: 'Check all bank accounts, demat accounts, and insurance policies.',
      status: estatePlanning.nomineesUpdated ? 'complete' : 'pending',
      icon: Users,
      action: openNomineeModal,
      reset: () => updateEstate({ nomineesUpdated: false, nominees: [] })
    },
    {
      id: 'insurance',
      title: 'Life Insurance Cover',
      desc: 'Adequate term insurance for your family\'s future.',
      status: estatePlanning.insuranceCover >= 10000000 ? 'complete' : 'pending',
      icon: Shield,
      action: openCoverModal,
      reset: () => updateEstate({ insuranceCover: 0 })
    },
    {
      id: 'digital',
      title: 'Digital Asset Vault',
      desc: 'Secure access to passwords and digital accounts for heirs.',
      status: estatePlanning.digitalAssetsVault ? 'complete' : 'pending',
      icon: Key,
      action: () => updateEstate({ digitalAssetsVault: true }),
      reset: () => updateEstate({ digitalAssetsVault: false })
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Estate Planning</h2>
          <p className="text-slate-500">Secure your legacy and protect your family's future.</p>
        </div>
        <div className="flex items-center gap-4">
          {selectedMemberId === 'family' && (
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
              <User size={18} className="text-indigo-500" />
              <select
                value={editingMemberId}
                onChange={(e) => setEditingMemberId(e.target.value)}
                className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer"
              >
                {familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}'s Plan</option>
                ))}
              </select>
            </div>
          )}
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Shield size={18} />
            Legacy Score: {Math.round((checklist.filter(c => c.status === 'complete').length / checklist.length) * 100)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'checklist' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Legacy Checklist
            </button>
            <button
              onClick={() => setActiveTab('cashflows')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cashflows' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <DollarSign size={16} />
              Maturity & Cashflows
            </button>
            <button
              onClick={() => setActiveTab('fire')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'fire' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Flame size={16} />
              FIRE Planner
            </button>
          </div>

          {activeTab === 'checklist' ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Legacy Checklist</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {checklist.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-6 flex items-start gap-4 transition-colors cursor-pointer ${
                      item.status === 'complete' ? 'bg-white' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => item.status !== 'complete' && item.action()}
                  >
                    <div className={`p-3 rounded-2xl ${
                      item.status === 'complete' ? 'bg-emerald-50 text-emerald-600' : 
                      item.status === 'partial' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <item.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900">{item.title}</h4>
                        {item.status === 'complete' ? (
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase">
                              <CheckCircle2 size={14} />
                              Completed
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                (item as any).reset?.();
                              }}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              title="Reset to Pending"
                            >
                              <RotateCcw size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              item.action();
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {item.id === 'will' ? (
                              estatePlanning.willStatus === 'Drafted' ? 'View Draft' : 'Draft Now'
                            ) : (
                              item.id === 'insurance' || item.id === 'nominees' ? 'Update' : 'Mark as Done'
                            )}
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                      {item.id === 'will' && estatePlanning.willStatus === 'Drafted' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateEstate({ willStatus: 'Registered' });
                          }}
                          className="mt-3 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg w-fit"
                        >
                          Mark as Registered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'cashflows' ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Upcoming Maturities & Cashflows</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Clock size={14} />
                  Next 12 Months
                </div>
              </div>
              <div className="p-0">
                {upcomingCashflows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {upcomingCashflows.map((cf, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                  <Calendar size={14} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {new Date(cf.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">{cf.description}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cf.source}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                cf.type === 'Maturity' ? 'bg-emerald-50 text-emerald-600' :
                                cf.type === 'SWP' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {cf.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-black text-slate-900">{formatCurrency(cf.amount)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-sm italic">No upcoming maturities or cashflows found for the next 12 months.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <FIRECalculator 
                currentAge={familyMembers.find(m => m.id === editingMemberId)?.age}
                monthlyExpenses={portfolio.emergencyFund.monthlyExpense}
                currentCorpus={portfolio.investments.reduce((s, i) => s + i.currentValue, 0)}
              />
            </div>
          )}

          <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Why Estate Planning Matters?</h3>
              <p className="text-indigo-100/80 text-sm mb-6 max-w-lg">
                Without a clear plan, your family could face legal hurdles and financial stress during an already difficult time. A well-structured estate ensures your assets reach the right people smoothly.
              </p>
              <button className="bg-white text-indigo-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                Talk to an Expert
              </button>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800/50 rounded-full -mr-32 -mt-32 blur-3xl" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="text-emerald-600" size={18} />
              Insurance Summary
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Term Cover</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(estatePlanning.insuranceCover)}</p>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <AlertCircle size={16} className="text-amber-500" />
                <span>Recommended: 15-20x Annual Income</span>
              </div>
              <button 
                onClick={openCoverModal}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                Update Cover Amount
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="text-indigo-600" size={18} />
              Nominees List
            </h4>
            <div className="space-y-3">
              {(estatePlanning.nominees || []).length > 0 ? (
                estatePlanning.nominees.map((nominee) => (
                  <div key={nominee.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group">
                    <div>
                      <span className="text-sm font-medium text-slate-700 block">{nominee.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">{nominee.relationship}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-600">{nominee.share}% Share</span>
                      <button 
                        onClick={() => handleDeleteNominee(nominee.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 italic">No nominees added yet.</p>
              )}
              <button 
                onClick={openNomineeModal}
                className="w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-slate-400 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Add Nominee
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estate News Section */}
      <EstateNews />

      {/* Estate Knowledge Center */}
      <EstateKnowledgeCenter />

      {/* Will Drafting Modal */}
      <AnimatePresence>
        {isWillModalOpen && (
          <WillDraftingModal
            isOpen={isWillModalOpen}
            onClose={() => setIsWillModalOpen(false)}
            portfolio={portfolio}
            estatePlanning={estatePlanning}
            onSave={handleSaveWill}
          />
        )}
      </AnimatePresence>

      {/* Insurance Cover Modal */}
      <AnimatePresence>
        {isCoverModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCoverModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Update Insurance Cover</h3>
                  <button onClick={() => setIsCoverModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Sum Assured (₹)</label>
                    <input
                      type="number"
                      value={newCoverAmount}
                      onChange={(e) => setNewCoverAmount(e.target.value)}
                      placeholder="e.g. 10000000"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <button
                    onClick={handleUpdateCover}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Nominee Modal */}
      <AnimatePresence>
        {isNomineeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNomineeModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Add New Nominee</h3>
                  <button onClick={() => setIsNomineeModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                    <input
                      type="text"
                      value={newNominee.name}
                      onChange={(e) => setNewNominee({ ...newNominee, name: e.target.value })}
                      placeholder="Enter nominee name"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Relationship</label>
                    <select
                      value={newNominee.relationship}
                      onChange={(e) => setNewNominee({ ...newNominee, relationship: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    >
                      <option value="">Select relationship</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Share Percentage (%)</label>
                    <input
                      type="number"
                      value={newNominee.share || ''}
                      onChange={(e) => setNewNominee({ ...newNominee, share: parseFloat(e.target.value) })}
                      placeholder="e.g. 50"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>
                  <button
                    onClick={handleAddNominee}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    Add Nominee
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EstatePlanning;
