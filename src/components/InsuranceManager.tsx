
import React, { useState } from 'react';
import { PortfolioState, InsurancePolicy, InsuranceType } from '../types';
import { Shield, Plus, Calendar, IndianRupee, ArrowRight, TrendingUp, AlertCircle, Heart, Car, FileText, Trash2, Edit2, ChevronRight, Sparkles, CheckCircle2, XCircle, UserCheck, Loader2, ShieldAlert, Target, Wallet, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import InsuranceModal from './InsuranceModal';
import InsuranceKnowledgeCenter from './InsuranceKnowledgeCenter';
import InsuranceCashFlow from './InsuranceCashFlow';
import InsuranceQuotes from './InsuranceQuotes';
import { generateInsuranceAnalysis } from '../services/analysisService';
import { useFirebase } from '../contexts/FirebaseContext';

interface InsuranceManagerProps {
  portfolio: PortfolioState;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioState>>;
}

const InsuranceManager: React.FC<InsuranceManagerProps> = ({ portfolio, setPortfolio }) => {
  const { addInsurance, updateInsurance, deleteInsurance, familyMembers } = useFirebase();
  const [selectedType, setSelectedType] = useState<InsuranceType | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadingPolicyId, setUploadingPolicyId] = useState<string | null>(null);

  const handleAnalyzePolicy = async (policy: InsurancePolicy, fileData?: { data: string, mimeType: string }) => {
    setIsAnalyzing(true);
    try {
      const analysis = await generateInsuranceAnalysis(policy, fileData);
      await updateInsurance({ ...policy, analysis });
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, policy: InsurancePolicy) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPolicyId(policy.id);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      await handleAnalyzePolicy(policy, { data: base64, mimeType: file.type });
      setUploadingPolicyId(null);
    };
    reader.readAsDataURL(file);
  };

  const [isHLVModalOpen, setIsHLVModalOpen] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  // HLV Calculation Logic
  const calculateHLV = () => {
    const self = portfolio.familyMembers.find(m => m.relationship === 'Self');
    const age = self?.age || 30;
    const retirementAge = self?.retirementAge || 60;
    const yearsToRetire = Math.max(0, retirementAge - age);
    
    const annualIncome = portfolio.taxProfile?.annualIncome || 0;
    // Estimate personal expenses as 30% of income if not specified
    const personalExpenses = annualIncome * 0.3;
    const netIncomeToReplace = Math.max(0, annualIncome - personalExpenses);
    
    // Using a 2% real rate of return (e.g. 8% return - 6% inflation)
    const realRate = 0.02;
    let incomeReplacementPv = 0;
    if (yearsToRetire > 0) {
      incomeReplacementPv = netIncomeToReplace * ((1 - Math.pow(1 + realRate, -yearsToRetire)) / realRate);
    }

    const totalLiabilities = portfolio.liabilities.reduce((sum, l) => sum + (l?.outstandingAmount || 0), 0);
    const totalGoals = portfolio.goals.reduce((sum, g) => sum + ((g?.targetAmount || 0) - (g?.currentAmount || 0)), 0);
    const totalAssets = portfolio.investments.reduce((sum, inv) => sum + (inv?.currentValue || 0), 0) + 
                       portfolio.bankAccounts.reduce((sum, acc) => sum + (acc?.balance || 0), 0);
    
    const totalRequired = incomeReplacementPv + totalLiabilities + totalGoals;
    const hlvTarget = Math.max(0, totalRequired - totalAssets);
    
    const currentTermCover = portfolio.insurances
      .filter(p => p.type === 'Term' && p.status === 'Active')
      .reduce((sum, p) => sum + p.sumAssured, 0);
    
    const gap = Math.max(0, hlvTarget - currentTermCover);

    return {
      incomeReplacement: incomeReplacementPv,
      totalLiabilities,
      totalGoals,
      totalAssets,
      totalRequired,
      hlvTarget,
      currentTermCover,
      gap,
      yearsToRetire
    };
  };

  const hlvData = calculateHLV();

  const toggleExpand = (id: string) => {
    setExpandedPolicyId(expandedPolicyId === id ? null : id);
  };

  const handleSavePolicy = async (policy: InsurancePolicy) => {
    const exists = portfolio.insurances.find(p => p.id === policy.id);
    if (exists) {
      await updateInsurance(policy);
    } else {
      await addInsurance(policy);
    }
  };

  const openAddModal = () => {
    setEditingPolicy(null);
    setIsModalOpen(true);
  };

  const openEditModal = (policy: InsurancePolicy) => {
    setEditingPolicy(policy);
    setIsModalOpen(true);
  };

  const filteredPolicies = selectedType === 'All' 
    ? portfolio.insurances 
    : portfolio.insurances.filter(p => p.type === selectedType);

  const getTypeIcon = (type: InsuranceType) => {
    switch (type) {
      case 'Term': return <Shield className="text-blue-500" />;
      case 'Health': return <Heart className="text-rose-500" />;
      case 'Motor': return <Car className="text-slate-500" />;
      case 'ULIP':
      case 'Endowment':
      case 'MoneyBack': return <TrendingUp className="text-emerald-500" />;
      default: return <FileText className="text-slate-400" />;
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteInsurance(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Insurance Portfolio</h2>
          <p className="text-slate-500">Manage your protection and savings-linked policies.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Add Policy
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Total Sum Assured</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {formatCurrency(portfolio.insurances.reduce((sum, p) => sum + p.sumAssured, 0))}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Shield size={14} className="text-blue-500" />
            <span>Across {portfolio.insurances.length} policies</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Annual Premium Outflow</p>
          <h3 className="text-2xl font-bold text-slate-900">
            {formatCurrency(portfolio.insurances.reduce((sum, p) => {
              const multiplier = p.premiumFrequency === 'Yearly' ? 1 : p.premiumFrequency === 'Half-Yearly' ? 2 : p.premiumFrequency === 'Quarterly' ? 4 : 12;
              return sum + (p.premium * multiplier);
            }, 0))}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <Calendar size={14} className="text-indigo-500" />
            <span>Next premium due in 12 days</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 font-medium mb-1">Future Maturity Value</p>
          <h3 className="text-2xl font-bold text-emerald-600">
            {formatCurrency(portfolio.insurances.reduce((sum, p) => sum + (p.maturityAmount || 0), 0))}
          </h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>From non-term savings plans</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['All', 'Term', 'Health', 'Motor', 'Endowment', 'ULIP', 'MoneyBack'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              selectedType === type 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Policy Selector Dropdown for Deep Dive */}
      {portfolio.insurances.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Sparkles className="text-emerald-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Policy Analysis Deep Dive</h3>
                <p className="text-xs text-slate-500">Select a policy to get AI-powered pros, cons, and suitability analysis.</p>
              </div>
            </div>
            <select 
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none min-w-[250px] cursor-pointer"
              value={expandedPolicyId || ''}
              onChange={(e) => setExpandedPolicyId(e.target.value || null)}
            >
              <option value="">Select a policy to analyze...</option>
              {portfolio.insurances.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.provider}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Policies List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPolicies.map((policy) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={policy.id}
              onClick={() => toggleExpand(policy.id)}
              className={`bg-white rounded-3xl border transition-all cursor-pointer overflow-hidden group ${
                expandedPolicyId === policy.id ? 'border-emerald-500 ring-4 ring-emerald-500/5 shadow-lg' : 'border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all ${
                      expandedPolicyId === policy.id ? 'bg-emerald-50' : 'bg-slate-50 group-hover:bg-white group-hover:shadow-sm'
                    }`}>
                      {getTypeIcon(policy.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{policy.name}</h4>
                      <p className="text-xs text-slate-500">{policy.provider} • {policy.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => openEditModal(policy)}
                      className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(policy.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sum Assured</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(policy.sumAssured)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Premium</p>
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(policy.premium)} 
                      <span className="text-xs font-medium text-slate-400 ml-1">/{policy.premiumFrequency}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</p>
                      <p className="text-xs font-bold text-slate-700">{format(new Date(policy.expiryDate), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nominee</p>
                      <p className="text-xs font-bold text-slate-700">{policy.nominee}</p>
                    </div>
                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${expandedPolicyId === policy.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedPolicyId === policy.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Benefits Section */}
                      {policy.benefits && policy.benefits.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <Shield size={16} className="text-emerald-500" />
                            Policy Benefits
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {policy.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Non-Term Plan Details */}
                      {(policy.maturityAmount || policy.premiumPayingTerm || policy.policyTerm || policy.bonusAmount || policy.cashflows) && (
                        <div className="mt-6 pt-6 border-t border-dashed border-slate-200">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                              <TrendingUp size={16} className="text-emerald-500" />
                              Maturity & Cashflows
                            </h5>
                            {policy.maturityDate && (
                              <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg uppercase">
                                Matures {format(new Date(policy.maturityDate), 'MMM yyyy')}
                              </span>
                            )}
                          </div>
                          
                          {(policy.maturityAmount || policy.premiumPayingTerm || policy.policyTerm || policy.bonusAmount) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              {policy.maturityAmount && (
                                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Basic Maturity Amt</p>
                                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(policy.maturityAmount)}</p>
                                </div>
                              )}
                              {policy.policyTerm && (
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Policy Term</p>
                                  <p className="text-lg font-bold text-indigo-700">{policy.policyTerm} Years</p>
                                </div>
                              )}
                              {policy.premiumPayingTerm && (
                                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                  <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Premium Paying Term</p>
                                  <p className="text-lg font-bold text-indigo-700">{policy.premiumPayingTerm} Years</p>
                                </div>
                              )}
                              {policy.bonusAmount && (
                                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1">Projected Total Bonus</p>
                                  <p className="text-lg font-bold text-purple-700">{formatCurrency(policy.bonusAmount)}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {policy.cashflows && policy.cashflows.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Survival Benefits</p>
                              {policy.cashflows.map((cf, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-xs">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                    <span className="font-medium text-slate-600">{cf.description}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-slate-900">{formatCurrency(cf.amount)}</p>
                                    <p className="text-[10px] text-slate-400">{format(new Date(cf.date), 'dd MMM yyyy')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI Analysis Section */}
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles size={16} className="text-emerald-500" />
                            AI Suitability Analysis
                          </h5>
                          {!policy.analysis && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAnalyzePolicy(policy); }}
                                disabled={isAnalyzing}
                                className="text-[10px] font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
                              >
                                {isAnalyzing && expandedPolicyId === policy.id && !uploadingPolicyId ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                Quick Analysis
                              </button>
                              <label className="cursor-pointer text-[10px] font-bold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                                {uploadingPolicyId === policy.id ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                Upload & Deep Analyze
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept=".pdf,image/*"
                                  onChange={(e) => handleFileUpload(e, policy)}
                                  disabled={isAnalyzing}
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        {policy.analysis ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Pros
                                </p>
                                <ul className="space-y-1">
                                  {policy.analysis.pros.map((pro, i) => (
                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                      <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <XCircle size={12} /> Cons
                                </p>
                                <ul className="space-y-1">
                                  {policy.analysis.cons.map((con, i) => (
                                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                      <span className="mt-1 w-1 h-1 rounded-full bg-rose-400 flex-shrink-0" />
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Detailed Insights from Document */}
                            {(policy.analysis.keyFeatures || policy.analysis.limitations || policy.analysis.waitingPeriods || policy.analysis.exclusions) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                {policy.analysis.keyFeatures && policy.analysis.keyFeatures.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Key Features</p>
                                    <ul className="space-y-1">
                                      {policy.analysis.keyFeatures.map((item, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                          <div className="mt-1.5 w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {policy.analysis.limitations && policy.analysis.limitations.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Limitations</p>
                                    <ul className="space-y-1">
                                      {policy.analysis.limitations.map((item, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                          <div className="mt-1.5 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {policy.analysis.waitingPeriods && policy.analysis.waitingPeriods.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Waiting Periods</p>
                                    <ul className="space-y-1">
                                      {policy.analysis.waitingPeriods.map((item, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                          <div className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {policy.analysis.exclusions && policy.analysis.exclusions.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Exclusions</p>
                                    <ul className="space-y-1">
                                      {policy.analysis.exclusions.map((item, i) => (
                                        <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                          <div className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 flex-shrink-0" />
                                          {item}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Plan Specific Details */}
                            {(policy.analysis.noClaimConditions || policy.analysis.payoutDetails || policy.analysis.surrenderValueDetails) && (
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                                {policy.analysis.noClaimConditions && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">No Claim Scenario</p>
                                    <p className="text-xs text-slate-600">{policy.analysis.noClaimConditions}</p>
                                  </div>
                                )}
                                {policy.analysis.payoutDetails && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payout Details</p>
                                    <p className="text-xs text-slate-600">{policy.analysis.payoutDetails}</p>
                                  </div>
                                )}
                                {policy.analysis.surrenderValueDetails && (
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Surrender Payout</p>
                                    <p className="text-xs text-slate-600">{policy.analysis.surrenderValueDetails}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <UserCheck size={12} /> Suitability Analysis
                              </p>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {policy.analysis.suitability}
                              </p>
                            </div>

                            <div className="flex justify-end">
                              <label className="cursor-pointer text-[10px] font-bold px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1">
                                <FileText size={12} />
                                Re-upload Document for Deep Analysis
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept=".pdf,image/*"
                                  onChange={(e) => handleFileUpload(e, policy)}
                                  disabled={isAnalyzing}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          !isAnalyzing && (
                            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              <p className="text-xs text-slate-400">Click "Analyze Policy" to get AI-powered insights.</p>
                            </div>
                          )
                        )}
                        
                        {isAnalyzing && expandedPolicyId === policy.id && (
                          <div className="text-center py-8">
                            <Loader2 className="animate-spin text-emerald-500 mx-auto mb-2" size={24} />
                            <p className="text-xs text-slate-500">AI is evaluating your policy details...</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPolicies.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-slate-300" size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No policies found</h3>
            <p className="text-slate-500">Try adjusting your filters or add a new policy.</p>
          </div>
        )}
      </div>

      {/* Cash Flow Projection */}
      <InsuranceCashFlow portfolio={portfolio} />

      {/* Insurance Insight */}
      <div className="bg-blue-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="p-4 bg-blue-800 rounded-2xl relative z-10">
          <ShieldAlert size={32} className={hlvData.gap > 0 ? "text-amber-400" : "text-emerald-400"} />
        </div>
        <div className="flex-1 text-center md:text-left relative z-10">
          <h4 className="text-xl font-bold mb-2">Human Life Value (HLV) Analysis</h4>
          <p className="text-blue-100/80 text-sm mb-0">
            Based on your income, liabilities, and future goals, your recommended life cover is <strong>{formatCurrency(hlvData.hlvTarget)}</strong>. 
            {hlvData.gap > 0 ? (
              <> You currently have a gap of <strong className="text-amber-400">{formatCurrency(hlvData.gap)}</strong>.</>
            ) : (
              <> Your current cover of <strong>{formatCurrency(hlvData.currentTermCover)}</strong> is adequate.</>
            )}
          </p>
        </div>
        <button 
          onClick={() => setIsHLVModalOpen(true)}
          className="bg-white text-blue-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors whitespace-nowrap relative z-10"
        >
          View Detailed Breakup
        </button>
      </div>

      {/* HLV Breakup Modal */}
      <AnimatePresence>
        {isHLVModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 lg:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <ShieldCheck className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">HLV Detailed Breakup</h3>
                      <p className="text-sm text-slate-500">How we calculated your ideal life insurance cover</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsHLVModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Calculation Table */}
                  <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                            <TrendingUp size={16} />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-600 block">My Finance (Income Replacement)</span>
                            <span className="text-[10px] text-slate-400">PV of earnings for {hlvData.yearsToRetire} years</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">{formatCurrency(hlvData.incomeReplacement)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                            <IndianRupee size={16} />
                          </div>
                          <span className="text-sm font-medium text-slate-600">Loans and Liabilities</span>
                        </div>
                        <span className="font-bold text-slate-900">+{formatCurrency(hlvData.totalLiabilities)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                            <Target size={16} />
                          </div>
                          <span className="text-sm font-medium text-slate-600">Future Financial Goals Gap</span>
                        </div>
                        <span className="font-bold text-slate-900">+{formatCurrency(hlvData.totalGoals)}</span>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                        <span className="text-sm font-bold text-slate-900">Total Protection Required</span>
                        <span className="font-bold text-slate-900">{formatCurrency(hlvData.totalRequired)}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                            <Wallet size={16} />
                          </div>
                          <span className="text-sm font-medium text-slate-600">My Savings (Investments & Bank)</span>
                        </div>
                        <span className="font-bold text-emerald-600">-{formatCurrency(hlvData.totalAssets)}</span>
                      </div>
                    </div>

                    <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Ideal Life Cover (HLV)</p>
                        <h4 className="text-2xl font-bold">{formatCurrency(hlvData.hlvTarget)}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Existing Life Cover</p>
                        <h4 className="text-2xl font-bold">{formatCurrency(hlvData.currentTermCover)}</h4>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Box */}
                  <div className={`p-6 rounded-3xl border ${hlvData.gap > 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-xl ${hlvData.gap > 0 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        {hlvData.gap > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                      </div>
                      <div>
                        <h4 className={`font-bold ${hlvData.gap > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>
                          {hlvData.gap > 0 ? 'Protection Gap Detected' : 'Fully Protected'}
                        </h4>
                        <p className={`text-sm mt-1 leading-relaxed ${hlvData.gap > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {hlvData.gap > 0 
                            ? `Your current life insurance is short by ${formatCurrency(hlvData.gap)}. In the event of an emergency, your family might struggle to maintain their lifestyle and meet future goals like child education or loan repayments.`
                            : `Congratulations! Your current life cover is sufficient to replace your income, clear all debts, and fund all your future financial goals. You have built a robust safety net for your family.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsHLVModalOpen(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Close
                    </button>
                    {hlvData.gap > 0 && (
                      <button 
                        onClick={() => {
                          setIsHLVModalOpen(false);
                          openAddModal();
                        }}
                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
                      >
                        Add New Term Plan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <InsuranceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePolicy}
        editingPolicy={editingPolicy}
        familyMembers={familyMembers}
      />

      {/* Instant Quotes Section */}
      <div className="pt-8 border-t border-slate-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Get Insurance Quotes</h2>
          <p className="text-slate-500">Compare individual and family plans from top insurers instantly.</p>
        </div>
        <InsuranceQuotes />
      </div>

      {/* Knowledge Center */}
      <div className="pt-8 border-t border-slate-100">
        <InsuranceKnowledgeCenter />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Delete Policy?</h3>
              <p className="text-slate-500 mt-2">Are you sure you want to delete this insurance policy? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
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

export default InsuranceManager;
