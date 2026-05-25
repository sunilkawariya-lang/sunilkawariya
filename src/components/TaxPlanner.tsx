
import React, { useMemo, useState, useEffect } from 'react';
import { PortfolioState, TaxProfile, TaxDeduction, CapitalGain } from '../types';
import { INDIAN_TAX_SLABS_NEW_2024, INDIAN_TAX_SLABS_OLD_2024 } from '../constants';
import { Calculator, Info, CheckCircle2, AlertCircle, Sparkles, Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, User, ShieldCheck, Zap, FileText, Upload, Download, FileUp, Newspaper, ExternalLink, RefreshCw } from 'lucide-react';
import { generateTaxAnalysis } from '../services/analysisService';
import { parseTaxDocument, getTaxInsights } from '../services/geminiService';
import { generateTaxAdvisoryPDF } from '../services/pdfService';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useFirebase } from '../contexts/FirebaseContext';
import TaxFilingTab from './TaxFilingTab';

interface TaxPlannerProps {
  portfolio: PortfolioState;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioState>>;
}

const TaxPlanner: React.FC<TaxPlannerProps> = ({ portfolio, setPortfolio }) => {
  const { updateTaxProfile, selectedMemberId, familyMembers } = useFirebase();
  const [editingMemberId, setEditingMemberId] = useState<string>(
    selectedMemberId === 'family' ? (familyMembers[0]?.id || 'primary') : selectedMemberId
  );

  const taxProfile = useMemo(() => {
    if (selectedMemberId !== 'family') return portfolio.taxProfile;
    return portfolio.taxProfiles.find(p => p.memberId === editingMemberId) || {
      memberId: editingMemberId,
      annualIncome: 0,
      investments80C: 0,
      nps80CCD: 0,
      npsEmployer80CCD2: 0,
      medicalInsurance80D: 0,
      otherDeductions: [],
      capitalGains: [],
      totalTaxPayable: 0,
      regime: 'New',
      basicSalary: 0,
      actualHRA: 0,
      rentPaid: 0,
      cityType: 'Non-Metro',
      standardDeduction: 50000
    } as TaxProfile;
  }, [portfolio.taxProfile, portfolio.taxProfiles, selectedMemberId, editingMemberId]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeductionForm, setShowDeductionForm] = useState(false);
  const [showGainForm, setShowGainForm] = useState(false);
  const [expandedPerkIdx, setExpandedPerkIdx] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'deduction' | 'gain' } | null>(null);
  const [activeTab, setActiveTab] = useState<'planning' | 'filing'>('planning');
  
  const [taxInsights, setTaxInsights] = useState<any[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const fetchInsights = async (force = false) => {
    setIsLoadingInsights(true);
    try {
      const insights = await getTaxInsights(force);
      setTaxInsights(insights);
    } catch (error) {
      console.error("Error fetching tax insights:", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);
  
  const [newDeduction, setNewDeduction] = useState<Partial<TaxDeduction>>({
    section: '80D',
    amount: 0,
    description: ''
  });

  const [newGain, setNewGain] = useState<Partial<CapitalGain>>({
    assetType: 'Equity',
    gainType: 'Short Term',
    amount: 0,
    description: ''
  });

  const calculateHRAExemption = () => {
    const { basicSalary, actualHRA, rentPaid, cityType } = taxProfile;
    if (!basicSalary || !actualHRA || !rentPaid) return 0;

    const tenPercentBasic = basicSalary * 0.1;
    const rentMinusTenPercent = Math.max(0, rentPaid - tenPercentBasic);
    const cityPercentage = cityType === 'Metro' ? 0.5 : 0.4;
    const basicPercentage = basicSalary * cityPercentage;

    return Math.min(actualHRA, rentMinusTenPercent, basicPercentage);
  };

  const hraExemption = useMemo(() => calculateHRAExemption(), [taxProfile]);

  const calculateTax = (income: number, slabs: { limit: number, rate: number }[], deductions: number, capitalGains: CapitalGain[]) => {
    return calculateTaxBreakdown(income, slabs, deductions, capitalGains).totalTax;
  };

  const otherDeductionsTotal = useMemo(() => {
    return (taxProfile.otherDeductions || []).reduce((sum, d) => sum + (d?.amount || 0), 0);
  }, [taxProfile.otherDeductions]);

  const oldRegimeDeductions = useMemo(() => {
    return (
      50000 + // Standard Deduction for Old Regime
      Math.min(150000, taxProfile.investments80C || 0) +
      Math.min(50000, taxProfile.nps80CCD || 0) +
      (taxProfile.npsEmployer80CCD2 || 0) +
      (taxProfile.medicalInsurance80D || 0) +
      hraExemption +
      otherDeductionsTotal +
      (taxProfile.lta || 0) +
      (taxProfile.mealCoupons || 0) +
      (taxProfile.mobileReimbursement || 0) +
      (taxProfile.uniformAllowance || 0) +
      (taxProfile.booksGadgetsAllowance || 0) +
      (taxProfile.companyLease || 0) +
      (taxProfile.carLease || 0) +
      (taxProfile.fuelMaintenance || 0) +
      (taxProfile.driverSalary || 0) +
      (taxProfile.professionalPursuit || 0) +
      (taxProfile.helperAllowance || 0) +
      (taxProfile.giftVouchers || 0) +
      (taxProfile.gymWellness || 0)
    );
  }, [taxProfile, hraExemption, otherDeductionsTotal]);

  const newRegimeDeductions = 75000 + (taxProfile.npsEmployer80CCD2 || 0); // Standard Deduction + Employer NPS (Budget 2024-25)

  const calculateTaxBreakdown = (income: number, slabs: { limit: number, rate: number }[], deductions: number, capitalGains: CapitalGain[]) => {
    let slabGains = 0;
    let equitySTCG = 0;
    let equityLTCG = 0;
    let otherLTCG = 0;

    (capitalGains || []).forEach(gain => {
      if (gain.assetType === 'Equity') {
        if (gain.gainType === 'Short Term') equitySTCG += gain.amount;
        else equityLTCG += gain.amount;
      } else if (gain.assetType === 'Debt') {
        // Debt STCG and LTCG (post 2023) are mostly slab rates
        slabGains += gain.amount;
      } else if (gain.assetType === 'Gold' || gain.assetType === 'Real Estate' || gain.assetType === 'Other') {
        if (gain.gainType === 'Short Term') slabGains += gain.amount;
        else otherLTCG += gain.amount;
      }
    });

    let taxableIncome = Math.max(0, income + slabGains - deductions);
    let slabTax = 0;
    let prevLimit = 0;

    for (const slab of slabs) {
      const range = Math.min(taxableIncome, slab.limit) - prevLimit;
      if (range <= 0) break;
      slabTax += range * slab.rate;
      prevLimit = slab.limit;
      if (taxableIncome <= slab.limit) break;
    }

    // Rebate 87A and Marginal Relief
    if (slabs === INDIAN_TAX_SLABS_NEW_2024) {
      if (taxableIncome <= 700000) {
        slabTax = 0;
      } else {
        // Marginal Relief for New Regime: Tax cannot exceed income above 7L
        const excessIncome = taxableIncome - 700000;
        if (slabTax > excessIncome) {
          slabTax = excessIncome;
        }
      }
    } else if (slabs === INDIAN_TAX_SLABS_OLD_2024) {
      if (taxableIncome <= 500000) {
        slabTax = 0;
      }
    }

    const stcgTax = equitySTCG * 0.20;
    const ltcgTax = (Math.max(0, equityLTCG - 125000) * 0.125) + (otherLTCG * 0.125);
    const totalTax = (slabTax + stcgTax + ltcgTax) * 1.04;

    return { slabTax, stcgTax, ltcgTax, totalTax, taxableIncome };
  };

  const oldTaxBreakdown = calculateTaxBreakdown(taxProfile.annualIncome, INDIAN_TAX_SLABS_OLD_2024, oldRegimeDeductions, taxProfile.capitalGains);
  const newTaxBreakdown = calculateTaxBreakdown(taxProfile.annualIncome, INDIAN_TAX_SLABS_NEW_2024, newRegimeDeductions, taxProfile.capitalGains);

  const oldTax = oldTaxBreakdown.totalTax;
  const newTax = newTaxBreakdown.totalTax;

  const betterRegime = newTax < oldTax ? 'New' : 'Old';
  const savings = Math.abs(oldTax - newTax);

  const [simulation, setSimulation] = useState({
    add80C: 0,
    add80D: 0,
    addNPS: 0,
  });

  const simulatedProfile = useMemo(() => ({
    ...taxProfile,
    investments80C: taxProfile.investments80C + simulation.add80C,
    medicalInsurance80D: taxProfile.medicalInsurance80D + simulation.add80D,
    nps80CCD: taxProfile.nps80CCD + simulation.addNPS,
  }), [taxProfile, simulation]);

  const { oldTax: simOldTax, newTax: simNewTax } = useMemo(() => {
    const simOldDeductions = 50000 + 
      Math.min(150000, simulatedProfile.investments80C) +
      Math.min(50000, simulatedProfile.nps80CCD) +
      simulatedProfile.npsEmployer80CCD2 +
      simulatedProfile.medicalInsurance80D +
      hraExemption +
      otherDeductionsTotal;
    
    const simNewDeductions = 75000 + simulatedProfile.npsEmployer80CCD2;

    return {
      oldTax: calculateTaxBreakdown(simulatedProfile.annualIncome, INDIAN_TAX_SLABS_OLD_2024, simOldDeductions, simulatedProfile.capitalGains).totalTax,
      newTax: calculateTaxBreakdown(simulatedProfile.annualIncome, INDIAN_TAX_SLABS_NEW_2024, simNewDeductions, simulatedProfile.capitalGains).totalTax
    };
  }, [simulatedProfile, hraExemption, otherDeductionsTotal]);

  const simBetterRegime = simNewTax < simOldTax ? 'New' : 'Old';
  const simCurrentTax = simBetterRegime === 'New' ? simNewTax : simOldTax;
  const currentTax = betterRegime === 'New' ? newTax : oldTax;
  const potentialSavings = currentTax - simCurrentTax;

  const taxEfficiencyScore = useMemo(() => {
    const totalIncome = taxProfile.annualIncome;
    if (totalIncome === 0) return 100;
    
    const currentTax = betterRegime === 'New' ? newTax : oldTax;
    const taxPercentage = (currentTax / totalIncome) * 100;
    
    // Simple efficiency score: 100 - (tax percentage * 2)
    // Adjusting based on income levels would be better but this is a start
    let score = 100 - (taxPercentage * 2.5);
    
    // Bonus for maximizing deductions if in old regime
    if (betterRegime === 'Old') {
      if (taxProfile.investments80C >= 150000) score += 5;
      if (taxProfile.medicalInsurance80D >= 25000) score += 5;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }, [taxProfile, oldTax, newTax, betterRegime]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'Salary Slip' | 'Form 130' | 'Investment Proof' | 'Other') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const extractedData = await parseTaxDocument(base64, file.type, type);
        
        const newDoc = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type,
          uploadDate: new Date().toISOString(),
          extractedData
        };

        // Auto-fill profile if it's a salary slip
        let updatedProfile = {
          ...taxProfile,
          documents: [...(taxProfile.documents || []), newDoc]
        };

        if (type === 'Salary Slip' && extractedData) {
          updatedProfile = {
            ...updatedProfile,
            annualIncome: extractedData.GrossSalary || extractedData.annualIncome || updatedProfile.annualIncome,
            basicSalary: extractedData.BasicSalary || extractedData.basicSalary || updatedProfile.basicSalary,
            actualHRA: extractedData.HRA || extractedData.hra || updatedProfile.actualHRA,
            lta: extractedData.LTA || extractedData.lta || updatedProfile.lta,
            mealCoupons: extractedData.MealCoupons || extractedData.mealCoupons || updatedProfile.mealCoupons,
            mobileReimbursement: extractedData.MobileReimbursement || extractedData.mobileReimbursement || updatedProfile.mobileReimbursement,
            uniformAllowance: extractedData.UniformAllowance || extractedData.uniformAllowance || updatedProfile.uniformAllowance,
            booksGadgetsAllowance: extractedData.BooksGadgetsAllowance || extractedData.booksGadgetsAllowance || updatedProfile.booksGadgetsAllowance,
            companyLease: extractedData.CompanyLease || extractedData.companyLease || updatedProfile.companyLease,
            carLease: extractedData.CarLease || extractedData.carLease || updatedProfile.carLease,
            fuelMaintenance: extractedData.FuelMaintenance || extractedData.fuelMaintenance || updatedProfile.fuelMaintenance,
            driverSalary: extractedData.DriverSalary || extractedData.driverSalary || updatedProfile.driverSalary,
            professionalPursuit: extractedData.ProfessionalPursuit || extractedData.professionalPursuit || updatedProfile.professionalPursuit,
            helperAllowance: extractedData.HelperAllowance || extractedData.helperAllowance || updatedProfile.helperAllowance,
            giftVouchers: extractedData.GiftVouchers || extractedData.giftVouchers || updatedProfile.giftVouchers,
            gymWellness: extractedData.GymWellness || extractedData.gymWellness || updatedProfile.gymWellness,
          };
        } else if (type === 'Investment Proof' && extractedData) {
          if (extractedData.Section80C) {
            updatedProfile.investments80C = (updatedProfile.investments80C || 0) + extractedData.Section80C;
          }
          if (extractedData.Section80D) {
            updatedProfile.medicalInsurance80D = (updatedProfile.medicalInsurance80D || 0) + extractedData.Section80D;
          }
          if (extractedData.Amount && extractedData.Section) {
            const deduction = {
              id: Math.random().toString(36).substr(2, 9),
              section: extractedData.Section,
              amount: extractedData.Amount,
              description: extractedData.Description || 'Extracted from document'
            };
            updatedProfile.otherDeductions = [...(updatedProfile.otherDeductions || []), deduction];
          }
        } else if (type === 'Form 130' && extractedData) {
          updatedProfile = {
            ...updatedProfile,
            annualIncome: extractedData.GrossSalary || updatedProfile.annualIncome,
            investments80C: extractedData.Section80C || updatedProfile.investments80C,
            medicalInsurance80D: extractedData.Section80D || updatedProfile.medicalInsurance80D,
            standardDeduction: extractedData.StandardDeduction || updatedProfile.standardDeduction,
          };
        }

        await updateTaxProfile(updatedProfile);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Failed to upload/parse tax document:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!taxProfile.analysis) return;
    const doc = generateTaxAdvisoryPDF(taxProfile);
    doc.save(`Tax_Advisory_${familyMembers.find(m => m.id === editingMemberId)?.name || 'Report'}.pdf`);
  };

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await generateTaxAnalysis({
        ...taxProfile,
        hraExemption
      });
      await updateTaxProfile({
        ...taxProfile,
        analysis
      });
    } catch (error) {
      console.error("Failed to generate tax analysis:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addDeduction = async () => {
    if (newDeduction.amount && newDeduction.section) {
      const deduction = { ...newDeduction, id: Math.random().toString(36).substr(2, 9) } as TaxDeduction;
      await updateTaxProfile({
        ...taxProfile,
        otherDeductions: [
          ...(taxProfile.otherDeductions || []),
          deduction
        ]
      });
      setNewDeduction({ section: '80D', amount: 0, description: '' });
      setShowDeductionForm(false);
    }
  };

  const addGain = async () => {
    if (newGain.amount && newGain.assetType) {
      const gain = { ...newGain, id: Math.random().toString(36).substr(2, 9) } as CapitalGain;
      await updateTaxProfile({
        ...taxProfile,
        capitalGains: [
          ...(taxProfile.capitalGains || []),
          gain
        ]
      });
      setNewGain({ assetType: 'Equity', gainType: 'Short Term', amount: 0, description: '' });
      setShowGainForm(false);
    }
  };

  const removeDeduction = (id: string) => {
    setDeleteConfirm({ id, type: 'deduction' });
  };

  const removeGain = (id: string) => {
    setDeleteConfirm({ id, type: 'gain' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'deduction') {
      await updateTaxProfile({
        ...taxProfile,
        otherDeductions: (taxProfile.otherDeductions || []).filter(d => d.id !== deleteConfirm.id)
      });
    } else {
      await updateTaxProfile({
        ...taxProfile,
        capitalGains: (taxProfile.capitalGains || []).filter(g => g.id !== deleteConfirm.id)
      });
    }
    setDeleteConfirm(null);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Tax Optimization</h2>
          <p className="text-slate-500">Plan, optimize, and file your taxes seamlessly.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-center">
          <button
            onClick={() => setActiveTab('planning')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'planning' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Planning
          </button>
          <button
            onClick={() => setActiveTab('filing')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'filing' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Tax Filing
          </button>
        </div>

        {selectedMemberId === 'family' && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <User size={18} className="text-indigo-500" />
            <select
              value={editingMemberId}
              onChange={(e) => setEditingMemberId(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 outline-none cursor-pointer"
            >
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}'s Taxes</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'planning' ? (
          <motion.div
            key="planning"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Calculator className="text-emerald-600" size={20} />
              Income & HRA
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Annual Gross Salary</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={taxProfile.annualIncome}
                  onChange={(e) => updateTaxProfile({ ...taxProfile, annualIncome: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Basic Salary (Annual)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={taxProfile.basicSalary}
                  onChange={(e) => updateTaxProfile({ ...taxProfile, basicSalary: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Actual HRA</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={taxProfile.actualHRA}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, actualHRA: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rent Paid</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={taxProfile.rentPaid}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, rentPaid: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City Type</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                  value={taxProfile.cityType}
                  onChange={(e) => updateTaxProfile({ ...taxProfile, cityType: e.target.value as 'Metro' | 'Non-Metro' })}
                >
                  <option value="Metro">Metro (50% of Basic)</option>
                  <option value="Non-Metro">Non-Metro (40% of Basic)</option>
                </select>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Calculated HRA Exemption</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(hraExemption)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Zap className="text-amber-600" size={20} />
              Salary Structure
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              Optimize your salary components to reduce taxable income in the Old Regime.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">LTA (Annual)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.lta || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, lta: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meal Coupons</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.mealCoupons || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, mealCoupons: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile/Tel.</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.mobileReimbursement || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, mobileReimbursement: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Uniform Allw.</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.uniformAllowance || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, uniformAllowance: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Books/Gadgets</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.booksGadgetsAllowance || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, booksGadgetsAllowance: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Lease</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.companyLease || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, companyLease: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Car Lease</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.carLease || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, carLease: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fuel & Maint.</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.fuelMaintenance || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, fuelMaintenance: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Salary</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.driverSalary || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, driverSalary: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prof. Pursuit</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.professionalPursuit || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, professionalPursuit: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Helper Allw.</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.helperAllowance || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, helperAllowance: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gift Vouchers</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.giftVouchers || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, giftVouchers: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gym & Wellness</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none"
                    value={taxProfile.gymWellness || 0}
                    onChange={(e) => updateTaxProfile({ ...taxProfile, gymWellness: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                Tax Documents
              </h3>
              <div className="flex items-center gap-2">
                <select 
                  id="doc-type-select"
                  className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                  defaultValue="Salary Slip"
                >
                  <option value="Salary Slip">Salary Slip</option>
                  <option value="Form 130">Form 130</option>
                  <option value="Investment Proof">Investment Proof</option>
                  <option value="Other">Other</option>
                </select>
                <div className="relative">
                  <input 
                    type="file" 
                    id="tax-doc-upload" 
                    className="hidden" 
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const select = document.getElementById('doc-type-select') as HTMLSelectElement;
                      handleFileUpload(e, select.value as any);
                    }}
                  />
                  <label 
                    htmlFor="tax-doc-upload"
                    className="bg-blue-50 text-blue-600 p-2 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer block"
                  >
                    <Upload size={18} />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {isUploading && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 animate-pulse">
                  <FileUp className="text-blue-500" size={18} />
                  <p className="text-xs font-bold text-blue-700">Parsing document with AI...</p>
                </div>
              )}
              {(taxProfile.documents || []).map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <FileText size={16} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{doc.name}</p>
                      <p className="text-[10px] text-slate-500">{doc.type} • {new Date(doc.uploadDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      await updateTaxProfile({
                        ...taxProfile,
                        documents: (taxProfile.documents || []).filter(d => d.id !== doc.id)
                      });
                    }}
                    className="text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(taxProfile.documents || []).length === 0 && !isUploading && (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Upload className="text-slate-300 mx-auto mb-2" size={24} />
                  <p className="text-[10px] text-slate-400">Upload salary slips or Form 130 for AI analysis</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="text-indigo-600" size={20} />
              Capital Gains
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                <Info className="text-amber-500 shrink-0" size={20} />
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  <span className="font-bold">Budget 2024 Update:</span> Equity STCG is taxed at 20%. Equity LTCG above ₹1.25L is taxed at 12.5%. Non-equity STCG (Debt/Gold) is added to your income and taxed at slab rates.
                </p>
              </div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-slate-900">Summary</h4>
                <button 
                  onClick={() => setShowGainForm(true)}
                  className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1"
                >
                  <Plus size={14} /> Add Gain
                </button>
              </div>

              <div className="space-y-2">
                {(taxProfile.capitalGains || []).map(g => (
                  <div key={g.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{g.assetType} - {g.gainType}</p>
                      <p className="text-[10px] text-slate-500">{g.description}</p>
                      {g.gainType === 'Short Term' && (g.assetType === 'Debt' || g.assetType === 'Gold' || g.assetType === 'Other') && (
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">
                          Taxed at Slab Rates
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold">{formatCurrency(g.amount)}</span>
                      <button 
                        onClick={() => removeGain(g.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {(taxProfile.capitalGains || []).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4 italic">No capital gains added</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Plus className="text-emerald-600" size={20} />
              Deductions
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">80C (PPF, ELSS, LIC)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={taxProfile.investments80C}
                  onChange={(e) => updateTaxProfile({ ...taxProfile, investments80C: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">80D (Medical Insurance)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={taxProfile.medicalInsurance80D}
                  onChange={(e) => updateTaxProfile({ ...taxProfile, medicalInsurance80D: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">80CCD(2) (Employer NPS)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  value={taxProfile.npsEmployer80CCD2}
                  onChange={(e) => updateTaxProfile({ ...taxProfile, npsEmployer80CCD2: Number(e.target.value) })}
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">Allowed in both Old and New regimes (up to 10% of Basic + DA)</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-slate-900">Other Deductions</h4>
                  <button 
                    onClick={() => setShowDeductionForm(true)}
                    className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>

                <div className="space-y-2">
                  {(taxProfile.otherDeductions || []).map(d => (
                    <div key={d.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 group">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{d.section}</p>
                        <p className="text-[10px] text-slate-500">{d.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold">{formatCurrency(d.amount)}</span>
                        <button 
                          onClick={() => removeDeduction(d.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-6 shadow-sm">
              <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-900">
                  {betterRegime} Regime is better!
                </h3>
                <p className="text-sm text-emerald-700">
                  Save <span className="font-bold">{formatCurrency(savings)}</span>/year
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-center gap-6 shadow-sm">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-indigo-100"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - taxEfficiencyScore / 100)}
                    className="text-indigo-600 transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-xs font-black text-indigo-900">{taxEfficiencyScore}%</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-indigo-900">Tax Efficiency</h3>
                <p className="text-sm text-indigo-700">
                  {taxEfficiencyScore > 80 ? 'Excellent Optimization' : taxEfficiencyScore > 50 ? 'Good, but can improve' : 'Needs Optimization'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm min-w-[200px] flex-1">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-2">Old Regime Tax</p>
                <p className="text-2xl font-black text-slate-900 mb-2">{formatCurrency(oldTax)}</p>
                <div className="mb-2">
                  <p className="text-[8px] text-slate-400 uppercase font-bold">Taxable Income</p>
                  <p className="text-xs font-bold text-slate-600">{formatCurrency(oldTaxBreakdown.taxableIncome)}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-50">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Slab Tax:</span>
                    <span className="font-bold">{formatCurrency(oldTaxBreakdown.slabTax)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Capital Gains Tax:</span>
                    <span className="font-bold">{formatCurrency(oldTaxBreakdown.stcgTax + oldTaxBreakdown.ltcgTax)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-indigo-600 pt-1 border-t border-slate-50 mt-1">
                    <span>Total Gains:</span>
                    <span className="font-bold">{formatCurrency(taxProfile.capitalGains?.reduce((s, g) => s + g.amount, 0) || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white px-6 py-4 rounded-2xl border border-emerald-100 shadow-sm min-w-[200px] flex-1 relative overflow-hidden">
                {betterRegime === 'New' && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Recommended</div>}
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider mb-2">New Regime Tax</p>
                <p className="text-2xl font-black text-slate-900 mb-2">{formatCurrency(newTax)}</p>
                <div className="mb-2">
                  <p className="text-[8px] text-slate-400 uppercase font-bold">Taxable Income</p>
                  <p className="text-xs font-bold text-slate-600">{formatCurrency(newTaxBreakdown.taxableIncome)}</p>
                </div>
                <div className="space-y-1 pt-2 border-t border-slate-50">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Slab Tax:</span>
                    <span className="font-bold">{formatCurrency(newTaxBreakdown.slabTax)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Capital Gains Tax:</span>
                    <span className="font-bold">{formatCurrency(newTaxBreakdown.stcgTax + newTaxBreakdown.ltcgTax)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-indigo-600 pt-1 border-t border-slate-50 mt-1">
                    <span>Total Gains:</span>
                    <span className="font-bold">{formatCurrency(taxProfile.capitalGains?.reduce((s, g) => s + g.amount, 0) || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Sparkles className="text-emerald-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">AI Tax Optimization Analysis</h3>
                  <p className="text-xs text-slate-500">Personalized recommendations for your profile</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {taxProfile.analysis && (
                  <button 
                    onClick={handleDownloadReport}
                    className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Download size={16} />
                    Download Report
                  </button>
                )}
                <button 
                  onClick={handleGenerateAnalysis}
                  disabled={isAnalyzing}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-100"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
                  <Sparkles size={16} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {taxProfile.analysis ? (
                <div className="space-y-8">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="text-sm text-emerald-900 leading-relaxed">
                      <ReactMarkdown>{taxProfile.analysis.summary}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Tax Saving Roadmap */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="text-emerald-600" size={18} />
                      Your Tax Saving Roadmap
                    </h4>
                    <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                      {taxProfile.analysis.recommendations.map((rec, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[29px] top-1 w-6 h-6 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center z-10">
                            <span className="text-[10px] font-black text-emerald-600">{idx + 1}</span>
                          </div>
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-sm text-slate-900">{rec.title}</p>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                +{formatCurrency(rec.estimatedSavings)} Savings
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 leading-relaxed">
                              <ReactMarkdown>{rec.description}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="text-indigo-600" size={18} />
                        Salary Restructuring Options
                      </h4>
                      <div className="space-y-3">
                        {taxProfile.analysis.salaryRestructuring?.map((s, idx) => (
                          <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-sm text-slate-900">{s.currentComponent} → {s.suggestedComponent}</p>
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                +{formatCurrency(s.potentialSavings)} Savings
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed italic">"{s.reason}"</p>
                          </div>
                        ))}
                        {(!taxProfile.analysis.salaryRestructuring || taxProfile.analysis.salaryRestructuring.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No restructuring options identified.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="text-emerald-600" size={18} />
                        Detailed Advisory Report
                      </h4>
                      <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <FileText size={80} />
                        </div>
                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-4">Pro Report</p>
                        <p className="text-sm leading-relaxed mb-6">
                          Our AI has generated a comprehensive 10-page tax advisory report covering all aspects of your financial profile.
                        </p>
                        <button 
                          onClick={handleDownloadReport}
                          className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                          <Download size={14} />
                          Download Detailed PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="text-indigo-600" size={18} />
                      Perks & Benefits Optimization
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {taxProfile.analysis.perksAndBenefits.map((perk, idx) => (
                        <div 
                          key={idx} 
                          className={`p-4 bg-white border rounded-xl shadow-sm transition-all cursor-pointer ${expandedPerkIdx === idx ? 'border-indigo-500 ring-1 ring-indigo-500/20' : 'border-slate-100 hover:border-indigo-200'}`}
                          onClick={() => setExpandedPerkIdx(expandedPerkIdx === idx ? null : idx)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-sm text-slate-900">{perk.title}</p>
                            <div className="text-indigo-500">
                              {expandedPerkIdx === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                          <div className="text-xs text-indigo-600 font-medium mb-2">
                            <ReactMarkdown>{perk.benefit}</ReactMarkdown>
                          </div>
                          
                          <AnimatePresence>
                            {expandedPerkIdx === idx && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-3 border-t border-slate-50 space-y-3">
                                  <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                                    <Info size={12} className="text-slate-400 mt-0.5" />
                                    <div className="text-[10px] text-slate-500 italic">
                                      <ReactMarkdown>{perk.taxRule}</ReactMarkdown>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Pros</p>
                                      <ul className="space-y-1">
                                        {perk.pros?.map((pro, i) => (
                                          <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                                            <CheckCircle2 size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                                            {pro}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="space-y-1.5">
                                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Cons</p>
                                      <ul className="space-y-1">
                                        {perk.cons?.map((con, i) => (
                                          <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1">
                                            <AlertCircle size={10} className="text-rose-500 mt-0.5 shrink-0" />
                                            {con}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {expandedPerkIdx !== idx && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                              <Info size={10} />
                              Click to see pros, cons & rules
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {taxProfile.analysis.detailedAnalysis && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Zap className="text-amber-500" size={18} />
                        Detailed Strategic Analysis
                      </h4>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                        <div className="prose prose-sm prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-headings:mb-4 prose-p:mb-4">
                          <ReactMarkdown>{taxProfile.analysis.detailedAnalysis}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calculator className="text-slate-300 w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">No Analysis Yet</h4>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    Click the button above to get AI-driven tax saving recommendations based on your profile.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tax Saving Simulation */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="text-amber-500" size={20} />
                  Tax Saving Simulation
                </h3>
                <p className="text-xs text-slate-500">See how much you can save by investing more</p>
              </div>
              {potentialSavings > 0 && (
                <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Potential Savings: {formatCurrency(potentialSavings)}
                </div>
              )}
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional 80C Investment</label>
                  <input 
                    type="range" 
                    min="0" 
                    max={Math.max(0, 150000 - taxProfile.investments80C)} 
                    step="5000"
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    value={simulation.add80C}
                    onChange={(e) => setSimulation(prev => ({ ...prev, add80C: Number(e.target.value) }))}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>₹0</span>
                    <span className="text-emerald-600">+{formatCurrency(simulation.add80C)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional 80D (Health)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max={Math.max(0, 50000 - taxProfile.medicalInsurance80D)} 
                    step="1000"
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={simulation.add80D}
                    onChange={(e) => setSimulation(prev => ({ ...prev, add80D: Number(e.target.value) }))}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>₹0</span>
                    <span className="text-indigo-600">+{formatCurrency(simulation.add80D)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional NPS (80CCD)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max={Math.max(0, 50000 - taxProfile.nps80CCD)} 
                    step="5000"
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    value={simulation.addNPS}
                    onChange={(e) => setSimulation(prev => ({ ...prev, addNPS: Number(e.target.value) }))}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>₹0</span>
                    <span className="text-amber-600">+{formatCurrency(simulation.addNPS)}</span>
                  </div>
                </div>
              </div>

              {potentialSavings > 0 ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2 rounded-lg text-white">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Optimization Result</p>
                      <p className="text-[10px] text-emerald-700">By making these investments, your total tax liability reduces to <span className="font-bold">{formatCurrency(simCurrentTax)}</span>.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      updateTaxProfile({
                        ...taxProfile,
                        investments80C: taxProfile.investments80C + simulation.add80C,
                        medicalInsurance80D: taxProfile.medicalInsurance80D + simulation.add80D,
                        nps80CCD: taxProfile.nps80CCD + simulation.addNPS,
                      });
                      setSimulation({ add80C: 0, add80D: 0, addNPS: 0 });
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                  >
                    Apply to Profile
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Adjust the sliders above to see potential tax savings</p>
                </div>
              )}
            </div>
          </div>

          {/* Tax Saving Options Section */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="text-emerald-600" size={20} />
                Explore Tax Saving Investments
              </h3>
              <p className="text-xs text-slate-500">Maximize your savings with these popular tax-saving instruments</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Section 80C */}
                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md uppercase">Section 80C</span>
                    <Info size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">PPF, ELSS, LIC & More</h4>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    The most popular tax-saving section. Includes investments in PPF, ELSS funds, Life Insurance, EPF, and more.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Limit</span>
                      <span className="text-slate-900 font-bold">₹1.5 Lakh / Year</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Benefit</span>
                      <span className="text-emerald-600 font-bold">Full Deduction</span>
                    </div>
                  </div>
                  <a 
                    href="https://cleartax.in/s/80c-80ccc-80ccd-deductions" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-center py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                  >
                    Learn More
                  </a>
                </div>

                {/* Section 80D */}
                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md uppercase">Section 80D</span>
                    <Info size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">Health Insurance</h4>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Deductions for medical insurance premiums paid for self, family, and parents. Also covers preventive health checkups.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Limit</span>
                      <span className="text-slate-900 font-bold">Up to ₹1 Lakh</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Benefit</span>
                      <span className="text-indigo-600 font-bold">Health Coverage</span>
                    </div>
                  </div>
                  <a 
                    href="https://cleartax.in/s/section-80d-deduction" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-center py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    Learn More
                  </a>
                </div>

                {/* NPS 80CCD(1B) */}
                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-amber-200 transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-md uppercase">NPS 80CCD(1B)</span>
                    <Info size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">National Pension System</h4>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Additional deduction for investment in NPS, over and above the ₹1.5 Lakh limit of Section 80C.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Limit</span>
                      <span className="text-slate-900 font-bold">₹50,000 / Year</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Benefit</span>
                      <span className="text-amber-600 font-bold">Extra Deduction</span>
                    </div>
                  </div>
                  <a 
                    href="https://npscra.nsdl.co.in/tax-benefits-under-nps.php" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-center py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-amber-600 hover:text-white transition-all"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Tax News & Insights */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xl flex items-center gap-3">
                  <Newspaper className="text-blue-600" size={24} />
                  Tax News & Insights
                </h3>
                <p className="text-sm text-slate-500">Latest changes, strategies, and deduction notes from ClearTax, ET Wealth & Income Tax Dept.</p>
              </div>
              <button 
                onClick={() => fetchInsights(true)}
                disabled={isLoadingInsights}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-blue-600 disabled:opacity-50"
                title="Refresh Insights"
              >
                <RefreshCw size={20} className={isLoadingInsights ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div className="p-8">
              {isLoadingInsights ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-50 rounded-3xl border border-slate-100" />
                  ))}
                </div>
              ) : taxInsights.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {taxInsights.map((insight, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            {insight.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{insight.date}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight">
                          {insight.title}
                        </h4>
                        <div className="text-xs text-slate-600 leading-relaxed mb-6 line-clamp-4">
                          <ReactMarkdown>{insight.content}</ReactMarkdown>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 italic">Source: {insight.source}</span>
                        {insight.url && (
                          <a 
                            href={insight.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest"
                          >
                            Read Full <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                  <Newspaper size={48} className="text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No insights available at the moment.</p>
                  <button 
                    onClick={() => fetchInsights(true)}
                    className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                  >
                    Try fetching again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
        ) : (
          <motion.div
            key="filing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <TaxFilingTab portfolio={portfolio} taxProfile={taxProfile} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Deduction Modal */}
      <AnimatePresence>
        {showDeductionForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <h3 className="text-xl font-bold mb-6">Add Tax Deduction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                    value={newDeduction.section}
                    onChange={(e) => setNewDeduction(prev => ({ ...prev, section: e.target.value }))}
                  >
                    <option value="80D">80D (Medical Insurance)</option>
                    <option value="80G">80G (Donations)</option>
                    <option value="80E">80E (Education Loan Interest)</option>
                    <option value="80TTA">80TTA (Savings Interest)</option>
                    <option value="80TTB">80TTB (Senior Citizen Interest)</option>
                    <option value="Section 24">Section 24 (Home Loan Interest)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={newDeduction.amount}
                    onChange={(e) => setNewDeduction(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={newDeduction.description}
                    onChange={(e) => setNewDeduction(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. Donation to PM Cares"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowDeductionForm(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addDeduction}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Capital Gain Modal */}
      <AnimatePresence>
        {showGainForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <h3 className="text-xl font-bold mb-6">Add Capital Gain</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Asset Type</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                    value={newGain.assetType}
                    onChange={(e) => setNewGain(prev => ({ ...prev, assetType: e.target.value as any }))}
                  >
                    <option value="Equity">Equity / Equity Mutual Fund</option>
                    <option value="Debt">Debt Mutual Fund / Bonds</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Gold">Gold / SGB</option>
                    <option value="Other">Other Assets</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gain Type</label>
                  <select 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                    value={newGain.gainType}
                    onChange={(e) => setNewGain(prev => ({ ...prev, gainType: e.target.value as any }))}
                  >
                    <option value="Short Term">Short Term (STCG)</option>
                    <option value="Long Term">Long Term (LTCG)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={newGain.amount}
                    onChange={(e) => setNewGain(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="Enter gain amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    value={newGain.description}
                    onChange={(e) => setNewGain(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. Sale of HDFC Shares"
                  />
                </div>
                
                {(newGain.gainType === 'Short Term' && (newGain.assetType === 'Debt' || newGain.assetType === 'Gold' || newGain.assetType === 'Other')) && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-2">
                    <Info size={16} className="text-indigo-600 mt-0.5" />
                    <p className="text-[10px] text-indigo-700">
                      Note: STCG for this asset type is added to your total income and taxed at your applicable income tax slab rates.
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowGainForm(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={addGain}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Add Gain
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Delete {deleteConfirm.type === 'deduction' ? 'Deduction' : 'Capital Gain'}?</h3>
                <p className="text-slate-500 mt-2">Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaxPlanner;
