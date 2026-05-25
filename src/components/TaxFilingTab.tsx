
import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Upload, 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  Info, 
  AlertCircle,
  User,
  Building,
  Briefcase,
  CreditCard,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Lock,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioState, TaxProfile } from '../types';

interface TaxFilingTabProps {
  portfolio: PortfolioState;
  taxProfile: TaxProfile;
}

type FilingStep = 'personal' | 'income' | 'deductions' | 'taxes_paid' | 'computation' | 'filing';

const TaxFilingTab: React.FC<TaxFilingTabProps> = ({ portfolio, taxProfile }) => {
  const [activeStep, setActiveStep] = useState<FilingStep>('personal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filingStatus, setFilingStatus] = useState<'idle' | 'validating' | 'uploading' | 'success' | 'error'>('idle');
  const [isUploadingForm130, setIsUploadingForm130] = useState(false);
  const [form130Data, setForm130Data] = useState<any>(null);

  const steps = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'income', label: 'Income Details', icon: Briefcase },
    { id: 'deductions', label: 'Deductions', icon: ShieldCheck },
    { id: 'taxes_paid', label: 'Taxes Paid', icon: CreditCard },
    { id: 'computation', label: 'Computation', icon: FileText },
    { id: 'filing', label: 'E-File', icon: Upload },
  ];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const handleEFile = async () => {
    setIsProcessing(true);
    setFilingStatus('validating');
    
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setFilingStatus('uploading');
    // Simulate API upload to Income Tax Portal
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setFilingStatus('success');
    setIsProcessing(false);
  };

  const handleForm130Upload = async () => {
    setIsUploadingForm130(true);
    // Simulate parsing Form 130 (formerly Form 16)
    await new Promise(resolve => setTimeout(resolve, 2500));
    setForm130Data({
      employerName: "Tech Solutions Pvt Ltd",
      tan: "MUMT12345G",
      salary: 1250000,
      tds: 125000
    });
    setIsUploadingForm130(false);
  };

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[600px] px-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeStep === step.id;
            const isPast = steps.findIndex(s => s.id === activeStep) > idx;
            
            return (
              <React.Fragment key={step.id}>
                <button 
                  onClick={() => setActiveStep(step.id as FilingStep)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 
                    isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isPast ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${isPast ? 'bg-emerald-200' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-8"
          >
            {activeStep === 'personal' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Personal Information</h3>
                    <p className="text-sm text-slate-500">Verify your basic details for ITR filing</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Full Name (As per PAN)</label>
                      <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold" defaultValue="Sunil Kawariya" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">PAN Number</label>
                      <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold uppercase" defaultValue="ABCDE1234F" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Aadhaar Number</label>
                      <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold" defaultValue="XXXX-XXXX-1234" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date of Birth</label>
                      <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold" defaultValue="1990-01-01" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                  <Info className="text-blue-500 shrink-0" size={20} />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Ensure your Aadhaar is linked with PAN to avoid filing rejection. You can check the status on the e-filing portal.
                  </p>
                </div>

                <div className="flex justify-end pt-8">
                  <button 
                    onClick={() => setActiveStep('income')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    Next: Income Details
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'income' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Income Details</h3>
                    <p className="text-sm text-slate-500">Summary of all income sources for FY 2025-26</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-8 bg-indigo-50/50 border border-dashed border-indigo-200 rounded-[2.5rem] text-center space-y-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-indigo-600">
                      {isUploadingForm130 ? <RefreshCw className="animate-spin" size={32} /> : <Upload size={32} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Upload Form 130 (formerly Form 16)</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                        Upload your employer-issued Form 130 to automatically pre-fill salary and TDS details.
                      </p>
                    </div>
                    <button 
                      onClick={handleForm130Upload}
                      disabled={isUploadingForm130}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isUploadingForm130 ? 'Parsing Document...' : 'Select PDF File'}
                    </button>
                    {form130Data && (
                      <p className="text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1">
                        <CheckCircle2 size={12} /> Data extracted from Tech Solutions Pvt Ltd
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400">
                          <Building size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Income from Salary</p>
                          <p className="text-xs text-slate-500">Extracted from Form 130 / Salary Slips</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">{formatCurrency(form130Data ? form130Data.salary : taxProfile.annualIncome)}</p>
                        <button className="text-[10px] font-bold text-indigo-600 hover:underline">Edit/Enter Manually</button>
                      </div>
                    </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400">
                        <TrendingUp size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Capital Gains</p>
                        <p className="text-xs text-slate-500">Equity, Debt, Real Estate</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">
                        {formatCurrency(taxProfile.capitalGains?.reduce((sum, g) => sum + (g?.amount || 0), 0) || 0)}
                      </p>
                      <button className="text-[10px] font-bold text-indigo-600 hover:underline">View Breakdown</button>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400">
                        <RefreshCw size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Other Sources</p>
                        <p className="text-xs text-slate-500">Bank Interest, Dividends</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{formatCurrency(25000)}</p>
                      <button className="text-[10px] font-bold text-indigo-600 hover:underline">Sync from Bank</button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                  <button 
                    onClick={() => setActiveStep('personal')}
                    className="px-8 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setActiveStep('deductions')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    Next: Deductions
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'deductions' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Deductions & Exemptions</h3>
                    <p className="text-sm text-slate-500">Claim all eligible tax benefits</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Section 80C</p>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Maxed Out</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-lg font-black text-slate-900">{formatCurrency(150000)}</p>
                        <p className="text-[10px] text-slate-500">PPF, ELSS, Insurance</p>
                      </div>
                      <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Section 80D</p>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">Partially Claimed</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-lg font-black text-slate-900">{formatCurrency(taxProfile.medicalInsurance80D)}</p>
                        <p className="text-[10px] text-slate-500">Health Insurance Premium</p>
                      </div>
                      <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-8">
                  <button 
                    onClick={() => setActiveStep('income')}
                    className="px-8 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setActiveStep('taxes_paid')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    Next: Taxes Paid
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'taxes_paid' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Taxes Paid & TDS</h3>
                    <p className="text-sm text-slate-500">Verify tax already deducted or paid</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-900">TDS from Salary</h4>
                      <span className="text-xs font-bold text-slate-500">As per Form 168 (formerly 26AS)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-black text-slate-900">{formatCurrency(form130Data ? form130Data.tds : 125000)}</p>
                      <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <RefreshCw size={14} />
                        Sync from Form 168
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Advance Tax</p>
                      <p className="text-lg font-black text-slate-900">{formatCurrency(0)}</p>
                      <button className="text-[10px] font-bold text-indigo-600 mt-2 hover:underline">Add Challan Details</button>
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Self-Assessment Tax</p>
                      <p className="text-lg font-black text-slate-900">{formatCurrency(0)}</p>
                      <button className="text-[10px] font-bold text-indigo-600 mt-2 hover:underline">Add Challan Details</button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-8">
                  <button 
                    onClick={() => setActiveStep('deductions')}
                    className="px-8 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setActiveStep('computation')}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                  >
                    Next: Final Computation
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'computation' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-slate-900 rounded-2xl text-white">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Final Tax Computation</h3>
                    <p className="text-sm text-slate-500">Summary of your tax return for AY 2026-27</p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-sm text-slate-400">Gross Total Income</span>
                        <span className="text-lg font-bold">{formatCurrency(taxProfile.annualIncome + 25000)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-sm text-slate-400">Total Deductions</span>
                        <span className="text-lg font-bold text-emerald-400">-{formatCurrency(175000)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-sm text-slate-400">Taxable Income</span>
                        <span className="text-lg font-bold">{formatCurrency(taxProfile.annualIncome - 150000)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-sm text-slate-400">Total Tax Payable</span>
                        <span className="text-lg font-bold">{formatCurrency(115000)}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-sm text-slate-400">Taxes Already Paid</span>
                        <span className="text-lg font-bold text-emerald-400">-{formatCurrency(125000)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-black uppercase tracking-widest text-emerald-400">Net Refund Due</span>
                        <span className="text-3xl font-black text-emerald-400">{formatCurrency(10000)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                    <AlertCircle className="text-amber-400 shrink-0" size={20} />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      This computation is based on the data provided and your current tax profile. Ensure all documents are verified before final submission.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between pt-8">
                  <button 
                    onClick={() => setActiveStep('taxes_paid')}
                    className="px-8 py-3 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setActiveStep('filing')}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
                  >
                    Proceed to E-File
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {activeStep === 'filing' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">E-File with Income Tax Portal</h3>
                    <p className="text-sm text-slate-500">Securely upload your return data</p>
                  </div>
                </div>

                <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
                  {filingStatus === 'idle' && (
                    <>
                      <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-indigo-600" size={40} />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-2xl font-bold text-slate-900">Ready to Securely File</h4>
                        <p className="text-slate-500">
                          Your tax return (ITR-1) has been generated and validated. We will now securely upload it to the Income Tax Department's e-filing portal via our authorized API integration.
                        </p>
                      </div>
                      <div className="flex flex-col gap-4">
                        <button 
                          onClick={handleEFile}
                          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                        >
                          <Upload size={20} />
                          Submit to Income Tax Portal
                        </button>
                        <button className="text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2">
                          <Download size={16} />
                          Download JSON for Manual Upload
                        </button>
                      </div>
                    </>
                  )}

                  {(filingStatus === 'validating' || filingStatus === 'uploading') && (
                    <div className="space-y-8">
                      <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                        <motion.div 
                          className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-slate-900">
                          {filingStatus === 'validating' ? 'Validating Return Data...' : 'Uploading to Portal...'}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {filingStatus === 'validating' ? 'Checking for schema errors and consistency' : 'Establishing secure connection with e-filing servers'}
                        </p>
                      </div>
                    </div>
                  )}

                  {filingStatus === 'success' && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-8"
                    >
                      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircle2 size={48} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-2xl font-bold text-slate-900">Return Filed Successfully!</h4>
                        <p className="text-slate-500">
                          Your ITR for AY 2026-27 has been submitted. Acknowledgement number: <span className="font-bold text-slate-900">1234567890</span>
                        </p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-4">
                        <h5 className="font-bold text-sm text-slate-900">Next Steps:</h5>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3 text-xs text-slate-600">
                            <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">1</div>
                            <span>E-verify your return within 30 days using Aadhaar OTP or Net Banking.</span>
                          </li>
                          <li className="flex items-start gap-3 text-xs text-slate-600">
                            <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">2</div>
                            <span>Download ITR-V (Acknowledgement) for your records.</span>
                          </li>
                        </ul>
                      </div>
                      <div className="flex gap-4">
                        <button className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                          <Download size={16} />
                          Download ITR-V
                        </button>
                        <button className="flex-1 border border-slate-200 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                          <ExternalLink size={16} />
                          Go to Portal
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TaxFilingTab;
