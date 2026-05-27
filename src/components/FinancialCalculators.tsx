
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Target, 
  IndianRupee, 
  Calendar, 
  Percent, 
  ArrowRight,
  ShieldCheck,
  Briefcase, 
  PiggyBank,
  Clock,
  Landmark,
  PieChart as PieChartIcon,
  ChevronRight,
  FileText,
  HeartPulse,
  Plus,
  Trash2,
  Home,
  Download,
  Car,
  Upload,
  Baby,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { PortfolioState } from '../types';
import { PrecisionInput } from './PrecisionInput';
import { formatLakhs, convertToINR } from '../utils/finance';
import FinancialHealthCheck from './FinancialHealthCheck';
import RetirementReadinessCheck from './RetirementReadinessCheck';
import BuyVsRentCalculator from './BuyVsRentCalculator';
import { FinancialPlanCalculator } from './FinancialPlanCalculator';
import { generateCalculatorPDF } from '../services/pdfService';
import * as XLSX from 'xlsx';
import ExportButtons from './ExportButtons';
import AIRecommendation from './AIRecommendation';
import { handleDownloadCalculatorReport as downloadReport } from '../utils/exportUtils';

interface SchemeDetail {
  tenure: string;
  eligibility: string;
  minInvestment: string;
  maxInvestment: string;
  interestRate: string;
  taxBenefit: string;
  taxLiability: string;
  withdrawalRules: string;
  brief: string;
  pros: string[];
  cons: string[];
}

const SCHEME_DETAILS: Record<string, SchemeDetail> = {
  ssy: {
    tenure: "21 years from opening (or marriage after 18)",
    eligibility: "Parents/guardians of a girl child (below 10 years)",
    minInvestment: "₹250 per year",
    maxInvestment: "₹1.5 Lakh per year",
    interestRate: "8.2% (Q4 FY 2023-24)",
    taxBenefit: "EEE (Exempt-Exempt-Exempt) - Deduction under 80C",
    taxLiability: "Fully Exempt",
    withdrawalRules: "50% for higher education after 18. Premature closure for marriage after 18.",
    brief: "A government-backed savings scheme for the girl child.",
    pros: ["High interest rate", "Sovereign guarantee", "Tax-free returns"],
    cons: ["Long lock-in period", "Limited to girl child", "Interest rate subject to quarterly change"]
  },
  nps: {
    tenure: "Up to 60 years (extendable to 85)",
    eligibility: "Indian citizens (18-85 years)",
    minInvestment: "₹1,000 per year",
    maxInvestment: "No upper limit",
    interestRate: "Market-linked (usually 9-12%)",
    taxBenefit: "Old: 80C (1.5L) + 80CCD(1B) (50k). New: 80CCD(2). Also includes NPS Vatsalya for minors.",
    taxLiability: "100% tax-free if corpus ≤ ₹8L. Above ₹8L: 80% tax-free (Non-Govt), 60% (Govt).",
    withdrawalRules: "100% withdrawal if corpus ≤ ₹8L. Above ₹8L: Up to 80% lump sum (Non-Govt), 60% (Govt). Balance for annuity.",
    brief: "A voluntary retirement savings scheme with market-linked returns and flexible withdrawal rules.",
    pros: ["Low cost", "Professional management", "Extended age limit (85y)", "NPS Vatsalya for children"],
    cons: ["Market risk", "Annuity income is taxable", "Partial lock-in until 60"]
  },
  ppf: {
    tenure: "15 years (extendable in blocks of 5)",
    eligibility: "Indian residents",
    minInvestment: "₹500 per year",
    maxInvestment: "₹1.5 Lakh per year",
    interestRate: "7.1% (Q4 FY 2023-24)",
    taxBenefit: "EEE - Deduction under 80C",
    taxLiability: "Fully Exempt",
    withdrawalRules: "Partial withdrawal from 7th year. Loans available from 3rd to 6th year.",
    brief: "A long-term tax-free savings scheme.",
    pros: ["Risk-free", "Tax-free returns", "Flexible deposits"],
    cons: ["Long lock-in", "Fixed investment limit"]
  },
  epf: {
    tenure: "Until retirement or resignation",
    eligibility: "Salaried employees in registered establishments",
    minInvestment: "12% of basic salary",
    maxInvestment: "No limit (tax applies above ₹2.5L/₹5L)",
    interestRate: "8.25% (FY 2023-24)",
    taxBenefit: "Deduction under 80C",
    taxLiability: "Taxable if employee contribution > ₹2.5 Lakh/year",
    withdrawalRules: "Full withdrawal after 2 months unemployment. Partial for specific needs.",
    brief: "Retirement benefit for salaried employees.",
    pros: ["High interest", "Employer contribution", "Compulsory savings"],
    cons: ["Restricted to salaried", "Complex withdrawal process"]
  },
  rd: {
    tenure: "6 months to 10 years",
    eligibility: "Residents and HUFs",
    minInvestment: "Varies (usually ₹100)",
    maxInvestment: "No limit",
    interestRate: "5% - 7.5% (varies by bank)",
    taxBenefit: "No deduction (except 5-year PO RD under 80C)",
    taxLiability: "Taxable as per slab (TDS applies)",
    withdrawalRules: "Premature withdrawal allowed with penalty.",
    brief: "Fixed monthly savings for a set period.",
    pros: ["Disciplined savings", "Fixed returns", "Low entry barrier"],
    cons: ["Taxable interest", "Lower rates than equity"]
  },
  fd: {
    tenure: "7 days to 10 years",
    eligibility: "Residents, HUFs, NRIs",
    minInvestment: "Varies (usually ₹1,000)",
    maxInvestment: "No limit",
    interestRate: "3% - 8% (varies by bank/tenure)",
    taxBenefit: "Only 5-year Tax-Saving FD under 80C",
    taxLiability: "Taxable as per slab (TDS applies)",
    withdrawalRules: "Premature withdrawal allowed with penalty (except tax-saving).",
    brief: "Lumpsum investment for a fixed period.",
    pros: ["Guaranteed returns", "Highly liquid", "Safe"],
    cons: ["Taxable interest", "Returns may not beat inflation"]
  },
  scss: {
    tenure: "5 years (extendable by 3)",
    eligibility: "Individuals above 60 years (or 55 for retired)",
    minInvestment: "₹1,000",
    maxInvestment: "₹30 Lakh",
    interestRate: "8.2% (Q4 FY 2023-24)",
    taxBenefit: "Deduction under 80C",
    taxLiability: "Taxable as per slab (TDS applies)",
    withdrawalRules: "Premature withdrawal allowed after 1 year with penalty.",
    brief: "Regular income scheme for seniors.",
    pros: ["High interest", "Quarterly payouts", "Sovereign guarantee"],
    cons: ["Taxable interest", "Age restriction", "5-year lock-in"]
  },
  pomis: {
    tenure: "5 years",
    eligibility: "Residents (Single/Joint/Minor)",
    minInvestment: "₹1,000",
    maxInvestment: "₹9 Lakh (Single), ₹15 Lakh (Joint)",
    interestRate: "7.4% (Q4 FY 2023-24)",
    taxBenefit: "None",
    taxLiability: "Taxable as per slab",
    withdrawalRules: "Allowed after 1 year with penalty (2% before 3y, 1% after 3y).",
    brief: "Monthly income scheme by Post Office.",
    pros: ["Guaranteed monthly income", "Safe investment", "Transferable between post offices"],
    cons: ["No tax benefit", "Taxable interest", "Fixed tenure"]
  },
  rbi_bonds: {
    tenure: "7 years",
    eligibility: "Residents and HUFs",
    minInvestment: "₹1,000",
    maxInvestment: "No upper limit",
    interestRate: "8.05% (Floating, resets half-yearly)",
    taxBenefit: "None",
    taxLiability: "Taxable as per slab",
    withdrawalRules: "No premature withdrawal except for seniors (60+).",
    brief: "Government bonds with floating interest rates.",
    pros: ["Sovereign safety", "Higher rates than most FDs", "No investment cap"],
    cons: ["Floating rate risk", "Long lock-in", "Interest is taxable"]
  }
};

const SchemeInfo: React.FC<{ type: string }> = ({ type }) => {
  const details = SCHEME_DETAILS[type];
  if (!details) return null;

  return (
    <div className="md:col-span-2 mt-8 pt-8 border-t border-slate-200">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="text-indigo-600" size={20} />
        <h4 className="text-lg font-bold text-slate-900">Scheme Details & Suitability</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brief</p>
          <p className="text-sm font-medium text-slate-700">{details.brief}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tenure</p>
          <p className="text-sm font-medium text-slate-700">{details.tenure}</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Eligibility</p>
          <p className="text-sm font-medium text-slate-700">{details.eligibility}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Min Investment</span>
            <span className="text-sm font-bold text-slate-900">{details.minInvestment}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Max Investment</span>
            <span className="text-sm font-bold text-slate-900">{details.maxInvestment}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Interest Rate</span>
            <span className="text-sm font-bold text-emerald-600">{details.interestRate}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Tax Benefit</span>
            <span className="text-sm font-bold text-indigo-600">{details.taxBenefit}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Tax on Income</span>
            <span className="text-sm font-bold text-slate-900">{details.taxLiability}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Withdrawal Rules</span>
            <span className="text-sm font-medium text-slate-700">{details.withdrawalRules}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <h5 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
            <Plus size={16} /> Pros
          </h5>
          <ul className="space-y-2">
            {details.pros.map((pro, i) => (
              <li key={i} className="text-xs font-medium text-emerald-600 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
          <h5 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-2">
            <Trash2 size={16} /> Cons
          </h5>
          <ul className="space-y-2">
            {details.cons.map((con, i) => (
              <li key={i} className="text-xs font-medium text-rose-600 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

interface TaxRule {
  title: string;
  rules: string[];
  notes?: string;
}

const TAX_RULES: Record<string, TaxRule> = {
  hra: {
    title: "HRA Exemption Rules",
    rules: [
      "Actual HRA received from employer",
      "Rent paid minus 10% of (Basic Salary + DA)",
      "50% of (Basic Salary + DA) for Metro cities, or 40% for Non-Metro cities",
      "Metro Cities: Delhi, Mumbai, Kolkata, Chennai, and Bengaluru (Bangalore)"
    ],
    notes: "Exemption is the minimum of the above three amounts. Basic salary includes Basic Pay and Dearness Allowance (DA)."
  },
  income_tax: {
    title: "Income Tax Regimes (FY 2025-26 & 2026-27)",
    rules: [
      "New Regime (Default): Standard Deduction of ₹1,00,000. Tax-free up to ₹8 Lakh (after rebate).",
      "Old Regime: Standard Deduction of ₹50,000. Deductions like 80C (up to ₹1.5L), 80D, HRA allowed.",
      "New Regime Slabs: 0-3L (Nil), 3-7L (5%), 7-10L (10%), 10-12L (15%), 12-15L (20%), Above 15L (30%)",
      "Old Regime Slabs: 0-2.5L (Nil), 2.5-5L (5%), 5-10L (20%), Above 10L (30%)"
    ],
    notes: "Budget 2026 increased the Standard Deduction for the New Regime to ₹1,00,000."
  },
  residency: {
    title: "Residential Status Rules",
    rules: [
      "Resident: If in India for 182 days or more during the financial year.",
      "Resident: If in India for 60 days or more during the FY AND 365 days or more during 4 preceding years.",
      "Exception: For Indian citizens leaving for employment/crew member, the 60-day condition is replaced by 182 days.",
      "Exception: For Indian citizens/PIO visiting India with income ≤ ₹15 Lakh, the 60-day condition is replaced by 182 days.",
      "Special Case: For Indian citizens/PIO visiting India with income > ₹15 Lakh, the 60-day condition is replaced by 120 days.",
      "Deemed Resident: Indian citizen with income > ₹15 Lakh not liable to tax elsewhere is a Resident (RNOR).",
      "ROR: Resident AND (Resident in 2 of 10 preceding years) AND (730 days in 7 preceding years).",
      "RNOR: Resident who does not satisfy ROR conditions, or is a Deemed Resident."
    ],
    notes: "Residential status must be determined for each financial year separately. PIO means Person of Indian Origin."
  },
  real_estate: {
    title: "Real Estate Capital Gain Tax Rules",
    rules: [
      "Section 54: Exemption on sale of residential house by reinvesting in another residential house.",
      "Section 54F: Exemption on sale of any asset (other than house) by reinvesting net consideration in a house.",
      "Section 54EC: Exemption by investing up to ₹50 Lakh in specified bonds (REC, NHAI, PFC, IRFC) within 6 months.",
      "Budget 2024: LTCG on property is 12.5% without indexation for assets acquired after 2001.",
      "Lock-in Period: New house (3 years), 54EC Bonds (5 years).",
      "Capital Gains Account Scheme: If new house not bought before tax filing, deposit gain in CGAS."
    ],
    notes: "Smart planning involves using 54EC for the first 50L of gain and reinvesting the rest or paying tax if MF returns outweigh RE growth."
  },
  esop: {
    title: "ESOP Taxation Rules (India & Global)",
    rules: [
      "Stage 1 (Exercise): Taxed as Perquisite. Tax = (FMV on Exercise Date - Exercise Price) * Number of Shares.",
      "Perquisite tax is calculated at your applicable income tax slab rate.",
      "Stage 2 (Sale): Taxed as Capital Gains. Tax = (Sale Price - FMV on Exercise Date) * Number of Shares.",
      "Listed Shares (India): LTCG (>12 months) at 12.5% (above 1.25L exemption). STCG at 20%.",
      "Unlisted/Global Shares: Treated as Unlisted in India. LTCG (>24 months) at 12.5% without indexation. STCG at slab rate.",
      "Foreign Tax Credit (FTC): If tax is paid in a foreign country (e.g., US), you can claim credit in India under DTAA (Form 67 required)."
    ],
    notes: "For startups recognized by DPIIT, the perquisite tax payment can be deferred. Global ESOPs must be reported in the Foreign Assets (FA) schedule of your ITR."
  }
};

const TaxRuleInfo: React.FC<{ type: string }> = ({ type }) => {
  const info = TAX_RULES[type];
  if (!info) return null;

  return (
    <div className="md:col-span-2 mt-8 pt-8 border-t border-slate-200">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="text-indigo-600" size={20} />
        <h4 className="text-lg font-bold text-slate-900">{info.title}</h4>
      </div>
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <ul className="space-y-3">
          {info.rules.map((rule, i) => (
            <li key={i} className="text-sm text-slate-700 flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              {rule}
            </li>
          ))}
        </ul>
        {info.notes && (
          <p className="mt-4 text-xs text-slate-500 italic border-t border-slate-200 pt-3">
            Note: {info.notes}
          </p>
        )}
      </div>
    </div>
  );
};

type CalculatorType = 'sip' | 'lumpsum' | 'emi' | 'retirement' | 'emergency' | 'fd' | 'stepup_sip' | 'swp' | 'ssy' | 'nps' | 'ppf' | 'epf' | 'rd' | 'delay' | 'target' | 'goals' | 'scss' | 'health_check' | 'gratuity' | 'retirement_readiness' | 'pomis' | 'rbi_bonds' | 'hra' | 'income_tax' | 'residency' | 'buy_vs_rent' | 'real_estate_gain' | 'esop' | 'car_lease' | 'capital_gains' | 'asset_allocation' | 'compounding' | 'hlv' | 'net_worth' | 'wealth_roadmap' | 'sip_with_emi' | 'child_education' | 'loan_eligibility';

interface FinancialCalculatorsProps {
  portfolio: PortfolioState;
}

const FinancialCalculators: React.FC<FinancialCalculatorsProps> = ({ portfolio }) => {
  const [activeCalc, setActiveCalc] = useState<CalculatorType>('sip');

  // --- Loan Eligibility Calculator Logic ---
  const initialMonthlyIncome = useMemo(() => {
    let incomeSum = 0;
    (portfolio.incomes || []).forEach(inc => {
      const amt = inc.amount || 0;
      if (inc.frequency === 'Monthly') {
        incomeSum += amt;
      } else if (inc.frequency === 'Yearly') {
        incomeSum += amt / 12;
      } else if (inc.frequency === 'Quarterly') {
        incomeSum += amt / 3;
      } else if (inc.frequency === 'Half-Yearly') {
        incomeSum += amt / 6;
      } else {
        if (inc.isRecurring) {
          incomeSum += amt;
        }
      }
    });
    return incomeSum > 0 ? incomeSum : 150000; // default to 1.5 Lakh if 0
  }, [portfolio.incomes]);

  const initialMonthlyLiabilities = useMemo(() => {
    return (portfolio.liabilities || []).reduce((sum, l) => sum + (l.emi || 0), 0);
  }, [portfolio.liabilities]);

  const [eligIncome, setEligIncome] = useState<number>(0);
  const [eligLiability, setEligLiability] = useState<number>(0);
  const [eligRate, setEligRate] = useState(8.5);
  const [eligYears, setEligYears] = useState(25);
  const [eligFOIR, setEligFOIR] = useState(50); // 50% default allowed EMI ratio

  // Initialize form fields once defaults are computed
  React.useEffect(() => {
    if (eligIncome === 0) {
      setEligIncome(initialMonthlyIncome);
    }
  }, [initialMonthlyIncome, eligIncome]);

  React.useEffect(() => {
    if (eligLiability === 0 && initialMonthlyLiabilities > 0) {
      setEligLiability(initialMonthlyLiabilities);
    }
  }, [initialMonthlyLiabilities, eligLiability]);

  const eligResults = useMemo(() => {
    const activeIncome = eligIncome || initialMonthlyIncome;
    const activeLiability = eligLiability;
    
    // Max allowed total EMI (FOIR limit)
    const maxTotalEmiLimit = activeIncome * (eligFOIR / 100);
    // Disposable monthly amount left for a new EMI
    const maxNewEmiPlayroom = Math.max(0, maxTotalEmiLimit - activeLiability);
    
    // Present Value (Mortgage/Loan formula): PV = EMI * [(1 - (1+r)^-n) / r]
    const r = eligRate / 12 / 100;
    const n = eligYears * 12;
    
    let maxLoanAmount = 0;
    if (r === 0) {
      maxLoanAmount = maxNewEmiPlayroom * n;
    } else {
      const pvFactor = Math.pow(1 + r, -n);
      maxLoanAmount = maxNewEmiPlayroom * ((1 - pvFactor) / r);
    }
    
    const rawTotalRepayment = maxNewEmiPlayroom * n;
    const totalInterestPayable = Math.max(0, rawTotalRepayment - maxLoanAmount);
    
    // Category Breakdowns
    const categoriesDetails = [
      {
        name: 'Home Loan',
        interest: 8.5,
        defaultYears: 20,
        desc: 'Ideal for property purchase. Typically lower rate, longest tenure.',
        color: '#6366f1',
        loanAmount: 0,
        potentialEmi: 0
      },
      {
        name: 'Car / Auto Loan',
        interest: 9.5,
        defaultYears: 7,
        desc: 'Shorter tenure, vehicle purchase. Standard secured rate.',
        color: '#3b82f6',
        loanAmount: 0,
        potentialEmi: 0
      },
      {
        name: 'Personal Loan',
        interest: 12.0,
        defaultYears: 5,
        desc: 'Unsecured, flexible use. Higher rate, shorter term.',
        color: '#f43f5e',
        loanAmount: 0,
        potentialEmi: 0
      },
      {
        name: 'Business/Edu Loan',
        interest: 10.5,
        defaultYears: 10,
        desc: 'For professional expansion or education financing.',
        color: '#10b981',
        loanAmount: 0,
        potentialEmi: 0
      }
    ].map(cat => {
      const catR = cat.interest / 12 / 100;
      const catN = cat.defaultYears * 12;
      let catMaxLoan = 0;
      if (catR === 0) {
        catMaxLoan = maxNewEmiPlayroom * catN;
      } else {
        const catPvFactor = Math.pow(1 + catR, -catN);
        catMaxLoan = maxNewEmiPlayroom * ((1 - catPvFactor) / catR);
      }
      return {
        ...cat,
        loanAmount: catMaxLoan,
        potentialEmi: maxNewEmiPlayroom
      };
    });

    // FOIR Debt to Income Health indicator
    const currentFOIR = activeIncome > 0 ? ((activeLiability / activeIncome) * 100) : 0;
    const projectedFOIR = activeIncome > 0 ? (((activeLiability + maxNewEmiPlayroom) / activeIncome) * 100) : 0;
    
    let healthZone: 'Safe' | 'Monitor' | 'Overburdened' = 'Safe';
    if (currentFOIR > 50) {
      healthZone = 'Overburdened';
    } else if (currentFOIR > 35) {
      healthZone = 'Monitor';
    }
    
    return {
      activeIncome,
      activeLiability,
      maxTotalEmiLimit,
      maxNewEmiPlayroom,
      maxLoanAmount,
      totalInterestPayable,
      totalRepayment: rawTotalRepayment,
      currentFOIR,
      projectedFOIR,
      healthZone,
      categoriesDetails,
      pieData: [
        { name: 'Existing Liabilities EMI', value: activeLiability, color: '#f43f5e' },
        { name: 'Eligible Fresh EMI Limit', value: maxNewEmiPlayroom, color: '#10b981' },
        { name: 'Unutilized Income Portion', value: Math.max(0, activeIncome - activeLiability - maxNewEmiPlayroom), color: '#cbd5e1' }
      ]
    };
  }, [eligIncome, eligLiability, eligRate, eligYears, eligFOIR, initialMonthlyIncome, initialMonthlyLiabilities]);

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadCalculatorReport = async (title: string, inputs: [string, string][], results: [string, string][], format: 'pdf' | 'excel' = 'pdf') => {
    setIsDownloading(true);
    try {
      await downloadReport(title, inputs, results, format);
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSWPExcel = () => {
    const data = swpResults.cashFlow.map(row => ({
      'Month': row.month,
      'Opening Balance (₹)': Math.round(row.openingBalance),
      'Withdrawal (₹)': Math.round(row.withdrawal),
      'Gain/Interest (₹)': Math.round(row.gain),
      'Closing Balance (₹)': Math.round(row.closingBalance)
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SWP Schedule");

    // Set column widths
    const wscols = [
      { wch: 10 }, // Month
      { wch: 20 }, // Opening Balance
      { wch: 20 }, // Withdrawal
      { wch: 20 }, // Gain
      { wch: 20 }  // Closing Balance
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `SWP_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDownloadEMIExcel = () => {
    const data = emiResults.schedule.map(row => ({
      'Month': row.month,
      'Opening Balance (₹)': Math.round(row.openingBalance),
      'EMI (₹)': Math.round(row.emi),
      'Interest (₹)': Math.round(row.interest),
      'Principal (₹)': Math.round(row.principal),
      'Lump Sum (₹)': Math.round(row.lumpSum),
      'Closing Balance (₹)': Math.round(row.closingBalance)
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EMI Schedule");

    const wscols = [
      { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Loan_EMI_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const formatNumber = (val: number) => 
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

  // --- SIP Calculator Logic ---
  const [sipMonthly, setSipMonthly] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  const sipResults = useMemo(() => {
    const i = sipRate / 100 / 12;
    const n = sipYears * 12;
    const totalInvested = sipMonthly * n;
    const futureValue = sipMonthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const returns = futureValue - totalInvested;
    
    return {
      totalInvested,
      returns,
      totalValue: futureValue,
      chartData: [
        { name: 'Invested', value: totalInvested, color: '#94a3b8' },
        { name: 'Returns', value: returns, color: '#10b981' }
      ]
    };
  }, [sipMonthly, sipRate, sipYears]);

  // --- Step-up SIP Calculator Logic ---
  const [stepUpMonthly, setStepUpMonthly] = useState(5000);
  const [stepUpRate, setStepUpRate] = useState(12);
  const [stepUpYears, setStepUpYears] = useState(10);
  const [stepUpPercent, setStepUpPercent] = useState(10);

  const stepUpResults = useMemo(() => {
    let totalInvested = 0;
    let futureValue = 0;
    let currentSip = stepUpMonthly;
    const r = stepUpRate / 100 / 12;

    for (let year = 1; year <= stepUpYears; year++) {
      for (let month = 1; month <= 12; month++) {
        totalInvested += currentSip;
        futureValue = (futureValue + currentSip) * (1 + r);
      }
      currentSip = currentSip * (1 + stepUpPercent / 100);
    }

    const returns = futureValue - totalInvested;
    
    return {
      totalInvested,
      returns,
      totalValue: futureValue,
      chartData: [
        { name: 'Invested', value: totalInvested, color: '#94a3b8' },
        { name: 'Returns', value: returns, color: '#10b981' }
      ]
    };
  }, [stepUpMonthly, stepUpRate, stepUpYears, stepUpPercent]);

  // --- SWP Calculator Logic ---
  const [swpTotal, setSwpTotal] = useState(1000000);
  const [swpWithdrawal, setSwpWithdrawal] = useState(10000);
  const [swpRate, setSwpRate] = useState(8);
  const [swpYears, setSwpYears] = useState(10);
  const [swpDefermentYears, setSwpDefermentYears] = useState(0);
  const [swpFrequency, setSwpFrequency] = useState<'monthly' | 'quarterly' | 'half-yearly' | 'yearly'>('monthly');

  const swpResults = useMemo(() => {
    const monthlyRate = swpRate / 100 / 12;
    const totalMonths = swpYears * 12;
    const defermentMonths = swpDefermentYears * 12;
    
    let balance = swpTotal;
    
    // Growth during deferment
    for (let i = 0; i < defermentMonths; i++) {
      balance += balance * monthlyRate;
    }

    const corpusAtStart = balance;
    let totalWithdrawn = 0;
    const cashFlow = [];
    
    const freqMap = {
      'monthly': 1,
      'quarterly': 3,
      'half-yearly': 6,
      'yearly': 12
    };
    const freqMonths = freqMap[swpFrequency];

    for (let i = 1; i <= totalMonths; i++) {
      const gain = balance * monthlyRate;
      const openingBalance = balance;
      let currentWithdrawal = 0;

      if (i % freqMonths === 0) {
        currentWithdrawal = swpWithdrawal;
      }

      if (balance + gain < currentWithdrawal) {
        currentWithdrawal = balance + gain;
        balance = 0;
        totalWithdrawn += currentWithdrawal;
        cashFlow.push({
          month: i,
          openingBalance,
          withdrawal: currentWithdrawal,
          gain,
          closingBalance: 0
        });
        break;
      }

      balance = (balance + gain) - currentWithdrawal;
      totalWithdrawn += currentWithdrawal;

      cashFlow.push({
        month: i,
        openingBalance,
        withdrawal: currentWithdrawal,
        gain,
        closingBalance: balance
      });
    }

    return {
      corpusAtStart,
      totalWithdrawal: totalWithdrawn,
      finalBalance: balance,
      cashFlow,
      chartData: [
        { name: 'Withdrawals', value: totalWithdrawn, color: '#10b981' },
        { name: 'Final Balance', value: balance, color: '#94a3b8' }
      ]
    };
  }, [swpTotal, swpWithdrawal, swpRate, swpYears, swpDefermentYears, swpFrequency]);

  // --- SSY Calculator Logic ---
  const [ssyInvestment, setSsyInvestment] = useState(50000);
  const [ssyFrequency, setSsyFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const [ssyAge, setSsyAge] = useState(1);
  const ssyRate = 8.2; // Fixed SSY rate

  const ssyResults = useMemo(() => {
    let balance = 0;
    let totalInvested = 0;
    const r = ssyRate / 100;
    const currentYear = new Date().getFullYear();
    const maturityYear = currentYear + 21;
    const maturityAge = ssyAge + 21;
    
    const annualDeposit = ssyFrequency === 'monthly' ? ssyInvestment * 12 : 
                         ssyFrequency === 'quarterly' ? ssyInvestment * 4 : 
                         ssyInvestment;

    // SSY: Deposit for 15 years, Maturity after 21 years
    for (let year = 1; year <= 21; year++) {
      if (year <= 15) {
        balance += annualDeposit;
        totalInvested += annualDeposit;
      }
      balance = balance * (1 + r);
    }

    return {
      totalInvested,
      maturityAmount: balance,
      interestEarned: balance - totalInvested,
      maturityYear,
      maturityAge,
      chartData: [
        { name: 'Invested', value: totalInvested, color: '#94a3b8' },
        { name: 'Interest', value: balance - totalInvested, color: '#10b981' }
      ]
    };
  }, [ssyInvestment, ssyFrequency, ssyAge]);

  // --- NPS Calculator Logic ---
  const [npsInvestment, setNpsInvestment] = useState(5000);
  const [npsFrequency, setNpsFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [npsRate, setNpsRate] = useState(10);
  const [npsAge, setNpsAge] = useState(30);
  const [npsRetirementAge, setNpsRetirementAge] = useState(60);
  const [npsAnnuity, setNpsAnnuity] = useState(40); // Default 40%, Min 20% as per user request
  const [npsAnnuityRate, setNpsAnnuityRate] = useState(6);

  const npsResults = useMemo(() => {
    const yearsToRetire = Math.max(0, npsRetirementAge - npsAge);
    const freqMap = { monthly: 12, quarterly: 4, yearly: 1 };
    const f = freqMap[npsFrequency];
    const n = yearsToRetire * f;
    const r = npsRate / 100 / f;
    const totalInvested = npsInvestment * n;
    
    // Future Value of Annuity formula
    const totalCorpus = n === 0 ? 0 : npsInvestment * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    
    // New Rule: 100% withdrawal if corpus <= 8L
    const isFullWithdrawalAllowed = totalCorpus <= 800000;
    const effectiveAnnuity = isFullWithdrawalAllowed ? 0 : npsAnnuity;
    
    const annuityAmount = totalCorpus * (effectiveAnnuity / 100);
    const lumpSumAmount = totalCorpus - annuityAmount;
    const monthlyPension = (annuityAmount * (npsAnnuityRate / 100)) / 12;
    
    return {
      totalInvested,
      totalCorpus,
      annuityAmount,
      lumpSumAmount,
      monthlyPension,
      isFullWithdrawalAllowed,
      chartData: [
        { name: `Lumpsum (${100 - (isFullWithdrawalAllowed ? 0 : npsAnnuity)}%)`, value: lumpSumAmount, color: '#10b981' },
        { name: `Annuity (${isFullWithdrawalAllowed ? 0 : npsAnnuity}%)`, value: annuityAmount, color: '#3b82f6' }
      ]
    };
  }, [npsInvestment, npsFrequency, npsRate, npsAge, npsRetirementAge, npsAnnuity, npsAnnuityRate]);

  // --- PPF Calculator Logic ---
  const [ppfInvestment, setPpfInvestment] = useState(50000);
  const [ppfFrequency, setPpfFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('yearly');
  const ppfRate = 7.1;
  const ppfYears = 15;

  const ppfResults = useMemo(() => {
    let balance = 0;
    let totalInvested = 0;
    const r = ppfRate / 100;
    
    const annualDeposit = ppfFrequency === 'monthly' ? ppfInvestment * 12 : 
                         ppfFrequency === 'quarterly' ? ppfInvestment * 4 : 
                         ppfInvestment;

    for (let year = 1; year <= ppfYears; year++) {
      balance += annualDeposit;
      totalInvested += annualDeposit;
      balance = balance * (1 + r);
    }

    return {
      totalInvested,
      maturityAmount: balance,
      interestEarned: balance - totalInvested,
      chartData: [
        { name: 'Invested', value: totalInvested, color: '#94a3b8' },
        { name: 'Interest', value: balance - totalInvested, color: '#10b981' }
      ]
    };
  }, [ppfInvestment, ppfFrequency]);

  // --- EPF Calculator Logic ---
  const [epfBasic, setEpfBasic] = useState(50000);
  const [epfAge, setEpfAge] = useState(25);
  const [epfCurrentBalance, setEpfCurrentBalance] = useState(0);
  const [epfSalaryGrowth, setEpfSalaryGrowth] = useState(5);
  const [epfVpfPercent, setEpfVpfPercent] = useState(0);
  const epfRate = 8.25;

  // --- RD & FD Tax States ---
  const [rdTaxRate, setRdTaxRate] = useState(20);
  const [fdTaxRate, setFdTaxRate] = useState(20);
  const [scssTaxRate, setScssTaxRate] = useState(20);

  const epfResults = useMemo(() => {
    const retirementAge = 58;
    const yearsToRetire = retirementAge - epfAge;
    const monthsToRetire = yearsToRetire * 12;
    const r = epfRate / 100 / 12;
    
    let currentBasic = epfBasic;
    let epfBalance = epfCurrentBalance;
    let totalEmployeeContribution = 0;
    let totalEmployerContribution = 0;
    let totalInterest = 0;
    
    const yearlyData = [];
    
    for (let year = 1; year <= yearsToRetire; year++) {
      let yearlyEmployee = 0;
      let yearlyEmployer = 0;
      let yearlyInterest = 0;
      
      for (let month = 1; month <= 12; month++) {
        const employeeEpf = currentBasic * (12 + epfVpfPercent) / 100;
        
        // Employer contribution: 8.33% to EPS (capped at 15000 basic), rest to EPF
        const epsContribution = Math.min(currentBasic, 15000) * 0.0833;
        const employerEpf = (currentBasic * 0.12) - epsContribution;
        
        const monthlyTotalContribution = employeeEpf + employerEpf;
        
        const interest = (epfBalance + monthlyTotalContribution / 2) * r;
        
        epfBalance += monthlyTotalContribution + interest;
        yearlyEmployee += employeeEpf;
        yearlyEmployer += employerEpf;
        yearlyInterest += interest;
        totalEmployeeContribution += employeeEpf;
        totalEmployerContribution += employerEpf;
        totalInterest += interest;
      }
      
      yearlyData.push({
        year: new Date().getFullYear() + year,
        age: epfAge + year,
        balance: epfBalance,
        basic: currentBasic
      });
      
      currentBasic = currentBasic * (1 + epfSalaryGrowth / 100);
    }

    // Pension Calculation (EPS)
    // Formula: (Average Salary of last 60 months * Service Years) / 70
    // Service years capped at 35. Average salary capped at 15000 for EPS usually.
    const serviceYears = Math.min(yearsToRetire + 10, 35); // Assuming 10 years already served or just using years to retire
    const pensionSalary = Math.min(currentBasic, 15000); 
    const monthlyPension = (pensionSalary * serviceYears) / 70;

    return {
      totalEmployeeContribution,
      totalEmployerContribution,
      totalInterest,
      totalCorpus: epfBalance,
      monthlyPension,
      yearlyData,
      chartData: [
        { name: 'Employee Cont.', value: totalEmployeeContribution, color: '#6366f1' },
        { name: 'Employer Cont.', value: totalEmployerContribution, color: '#94a3b8' },
        { name: 'Interest', value: totalInterest, color: '#10b981' }
      ]
    };
  }, [epfBasic, epfAge, epfCurrentBalance, epfSalaryGrowth, epfVpfPercent]);

  // --- RD Calculator Logic ---
  const [rdMonthly, setRdMonthly] = useState(5000);
  const [rdRate, setRdRate] = useState(7);
  const [rdYears, setRdYears] = useState(5);

  const rdResults = useMemo(() => {
    const r = rdRate / 100;
    const n = 4; // Quarterly compounding
    const t = rdYears;
    const P = rdMonthly;
    
    // RD Formula: M = P * ((1+r/n)^(n*t) - 1) / (1 - (1+r/n)^(-1/3))
    // Simpler approach: Iterate monthly
    let balance = 0;
    let totalInvested = 0;
    const monthlyRate = r / 12;
    
    for (let i = 1; i <= rdYears * 12; i++) {
      balance += P;
      totalInvested += P;
      balance = balance * (1 + monthlyRate);
    }

    const interestEarned = balance - totalInvested;
    const taxAmount = interestEarned * (rdTaxRate / 100);
    const postTaxMaturityAmount = balance - taxAmount;

    return {
      totalInvested,
      maturityAmount: balance,
      interestEarned,
      taxAmount,
      postTaxMaturityAmount,
      chartData: [
        { name: 'Invested', value: totalInvested, color: '#94a3b8' },
        { name: 'Post-tax Interest', value: interestEarned - taxAmount, color: '#10b981' },
        { name: 'Tax', value: taxAmount, color: '#f43f5e' }
      ]
    };
  }, [rdMonthly, rdRate, rdYears, rdTaxRate]);

  // --- Cost of Delay Logic ---
  const [delayMonthly, setDelayMonthly] = useState(10000);
  const [delayLumpsum, setDelayLumpsum] = useState(100000);
  const [delayRate, setDelayRate] = useState(12);
  const [delayYears, setDelayYears] = useState(20);
  const [delayMonths, setDelayMonths] = useState(12);

  // --- Car Lease Calculator Logic ---
  const [carPrice, setCarPrice] = useState(1500000);
  const [leaseTenure, setLeaseTenure] = useState(36);
  const [monthlyLeaseBase, setMonthlyLeaseBase] = useState(35000);
  const [carGstRate, setCarGstRate] = useState(28);
  const [carCessRate, setCarCessRate] = useState(17);
  const [corpTaxRate, setCorpTaxRate] = useState(30);
  const [residualValuePercent, setResidualValuePercent] = useState(30);
  const [exitGstRate, setExitGstRate] = useState(18);

  const carLeaseResults = useMemo(() => {
    const totalGstRate = carGstRate + carCessRate;
    const monthlyGst = monthlyLeaseBase * (totalGstRate / 100);
    const totalMonthlyLease = monthlyLeaseBase + monthlyGst;
    
    const monthlyTaxSaving = totalMonthlyLease * (corpTaxRate / 100);
    const netMonthlyCost = totalMonthlyLease - monthlyTaxSaving;
    
    const totalLeaseCost = netMonthlyCost * leaseTenure;
    
    const buybackPrice = carPrice * (residualValuePercent / 100);
    const exitGst = buybackPrice * (exitGstRate / 100);
    const totalExitCost = buybackPrice + exitGst;
    
    const totalOutflowLease = totalLeaseCost + totalExitCost;

    // Comparison with Loan
    const loanRate = 9;
    const loanTenureMonths = leaseTenure;
    const r = loanRate / 12 / 100;
    const emi = (carPrice * r * Math.pow(1 + r, loanTenureMonths)) / (Math.pow(1 + r, loanTenureMonths) - 1);
    const totalLoanPayment = emi * loanTenureMonths;
    
    // Resale value at end (assuming same as buyback for comparison)
    const resaleValue = buybackPrice; 
    const totalOutflowLoan = totalLoanPayment - resaleValue;

    const savings = totalOutflowLoan - totalOutflowLease;

    return {
      monthlyGst,
      totalMonthlyLease,
      monthlyTaxSaving,
      netMonthlyCost,
      totalLeaseCost,
      buybackPrice,
      exitGst,
      totalExitCost,
      totalOutflowLease,
      totalOutflowLoan,
      savings,
      chartData: [
        { name: 'Lease Outflow', value: totalOutflowLease, color: '#6366f1' },
        { name: 'Loan Outflow', value: totalOutflowLoan, color: '#94a3b8' }
      ]
    };
  }, [carPrice, leaseTenure, monthlyLeaseBase, carGstRate, carCessRate, corpTaxRate, residualValuePercent, exitGstRate]);

  // --- Capital Gains Calculator Logic ---
  const [cgTransactions, setCgTransactions] = useState<Array<{
    id: string;
    assetName: string;
    assetType: 'equity' | 'debt' | 'real_estate' | 'gold' | 'unlisted';
    buyDate: string;
    sellDate: string;
    buyPrice: number;
    sellPrice: number;
    quantity: number;
  }>>([]);

  const cgResults = useMemo(() => {
    let totalStcg = 0;
    let totalLtcg = 0;
    let totalStcgTax = 0;
    let totalLtcgTax = 0;
    let totalGain = 0;

    const processedTransactions = cgTransactions.map(tx => {
      const buyDate = new Date(tx.buyDate);
      const sellDate = new Date(tx.sellDate);
      const holdingPeriodMonths = (sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      const gain = (tx.sellPrice - tx.buyPrice) * tx.quantity;
      totalGain += gain;

      let isLtcg = false;
      let taxRate = 0;

      switch (tx.assetType) {
        case 'equity':
          isLtcg = holdingPeriodMonths >= 12;
          taxRate = isLtcg ? 12.5 : 20;
          break;
        case 'debt':
          isLtcg = holdingPeriodMonths >= 36;
          taxRate = 30; 
          break;
        case 'real_estate':
          isLtcg = holdingPeriodMonths >= 24;
          taxRate = isLtcg ? 12.5 : 30; 
          break;
        case 'gold':
        case 'unlisted':
          isLtcg = holdingPeriodMonths >= 24;
          taxRate = isLtcg ? 12.5 : 30;
          break;
      }

      const tax = gain > 0 ? (gain * taxRate / 100) : 0;
      if (isLtcg) {
        totalLtcg += gain;
        totalLtcgTax += tax;
      } else {
        totalStcg += gain;
        totalStcgTax += tax;
      }

      return {
        ...tx,
        gain,
        isLtcg,
        tax,
        holdingPeriodMonths
      };
    });

    const equityLtcg = processedTransactions
      .filter(tx => tx.assetType === 'equity' && tx.isLtcg)
      .reduce((sum, tx) => sum + tx.gain, 0);
    
    const equityLtcgTaxAdjustment = Math.min(Math.max(0, equityLtcg), 125000) * 0.125;
    const finalLtcgTax = Math.max(0, totalLtcgTax - equityLtcgTaxAdjustment);

    return {
      transactions: processedTransactions,
      totalGain,
      totalStcg,
      totalLtcg,
      totalStcgTax,
      totalLtcgTax: finalLtcgTax,
      totalTax: totalStcgTax + finalLtcgTax,
      chartData: [
        { name: 'STCG', value: Math.max(0, totalStcg), color: '#f43f5e' },
        { name: 'LTCG', value: Math.max(0, totalLtcg), color: '#10b981' }
      ]
    };
  }, [cgTransactions]);

  const handleCgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const newTransactions = data.map((row, index) => ({
          id: `upload-${Date.now()}-${index}`,
          assetName: row.AssetName || row.Asset || 'Unknown Asset',
          assetType: (row.AssetType || 'equity').toLowerCase() as any,
          buyDate: row.BuyDate || new Date().toISOString().split('T')[0],
          sellDate: row.SellDate || new Date().toISOString().split('T')[0],
          buyPrice: Number(row.BuyPrice || 0),
          sellPrice: Number(row.SellPrice || 0),
          quantity: Number(row.Quantity || 1)
        }));

        setCgTransactions([...cgTransactions, ...newTransactions]);
      } catch (error) {
        console.error('Error parsing file:', error);
      }
    };
    reader.readAsBinaryString(file);
  };

  const delayResults = useMemo(() => {
    const r = delayRate / 100 / 12;
    const n = delayYears * 12;
    const nDelayed = Math.max(0, n - delayMonths);

    // SIP
    const fvNowSip = r > 0 ? delayMonthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : delayMonthly * n;
    const fvDelayedSip = r > 0 ? delayMonthly * ((Math.pow(1 + r, nDelayed) - 1) / r) * (1 + r) : delayMonthly * nDelayed;
    const costSip = fvNowSip - fvDelayedSip;

    // Lumpsum
    const fvNowLumpsum = delayLumpsum * Math.pow(1 + delayRate / 100, delayYears);
    const fvDelayedLumpsum = delayLumpsum * Math.pow(1 + delayRate / 100, Math.max(0, delayYears - delayMonths / 12));
    const costLumpsum = fvNowLumpsum - fvDelayedLumpsum;

    const totalNow = fvNowSip + fvNowLumpsum;
    const totalDelayed = fvDelayedSip + fvDelayedLumpsum;
    const totalCost = costSip + costLumpsum;

    return {
      fvNowSip,
      fvDelayedSip,
      costSip,
      fvNowLumpsum,
      fvDelayedLumpsum,
      costLumpsum,
      totalNow,
      totalDelayed,
      totalCost,
      chartData: [
        { name: 'Wealth Created', value: totalDelayed, color: '#10b981' },
        { name: 'Wealth Lost', value: totalCost, color: '#f43f5e' }
      ]
    };
  }, [delayMonthly, delayLumpsum, delayRate, delayYears, delayMonths]);

  // --- Asset Allocation Calculator Logic ---
  const [aaEquity, setAaEquity] = useState(500000);
  const [aaDebt, setAaDebt] = useState(300000);
  const [aaGold, setAaGold] = useState(100000);
  const [aaCash, setAaCash] = useState(50000);
  const [aaRealEstate, setAaRealEstate] = useState(0);
  
  const [targetEquity, setTargetEquity] = useState(60);
  const [targetDebt, setTargetDebt] = useState(30);
  const [targetGold, setTargetGold] = useState(10);

  const aaResults = useMemo(() => {
    const total = aaEquity + aaDebt + aaGold + aaCash + aaRealEstate;
    const currentEquityPct = total > 0 ? (aaEquity / total) * 100 : 0;
    const currentDebtPct = total > 0 ? (aaDebt / total) * 100 : 0;
    const currentGoldPct = total > 0 ? (aaGold / total) * 100 : 0;
    const currentCashPct = total > 0 ? (aaCash / total) * 100 : 0;
    const currentREPct = total > 0 ? (aaRealEstate / total) * 100 : 0;

    const rebalanceEquity = (total * (targetEquity / 100)) - aaEquity;
    const rebalanceDebt = (total * (targetDebt / 100)) - aaDebt;
    const rebalanceGold = (total * (targetGold / 100)) - aaGold;

    return {
      total,
      current: {
        equity: currentEquityPct,
        debt: currentDebtPct,
        gold: currentGoldPct,
        cash: currentCashPct,
        realEstate: currentREPct
      },
      rebalance: {
        equity: rebalanceEquity,
        debt: rebalanceDebt,
        gold: rebalanceGold
      },
      chartData: [
        { name: 'Equity', value: aaEquity, color: '#10b981' },
        { name: 'Debt', value: aaDebt, color: '#3b82f6' },
        { name: 'Gold', value: aaGold, color: '#f59e0b' },
        { name: 'Cash', value: aaCash, color: '#94a3b8' },
        { name: 'Real Estate', value: aaRealEstate, color: '#6366f1' }
      ]
    };
  }, [aaEquity, aaDebt, aaGold, aaCash, aaRealEstate, targetEquity, targetDebt, targetGold]);

  // --- Compounding Calculator Logic ---
  const [compInitial, setCompInitial] = useState(100000);
  const [compMonthly, setCompMonthly] = useState(10000);
  const [compRate, setCompRate] = useState(12);
  const [compYears, setCompYears] = useState(10);

  const compoundingResults = useMemo(() => {
    const calculateForRate = (rate: number) => {
      const r = rate / 100 / 12;
      const n = compYears * 12;
      const fvInitial = compInitial * Math.pow(1 + r, n);
      const fvMonthly = r > 0 ? compMonthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : compMonthly * n;
      const totalValue = fvInitial + fvMonthly;
      const totalInvested = compInitial + (compMonthly * n);
      const totalInterest = totalValue - totalInvested;
      return { totalValue, totalInvested, totalInterest, rate };
    };

    const realistic = calculateForRate(compRate);
    const conservative = calculateForRate(Math.max(1, compRate - 3));
    const optimistic = calculateForRate(compRate + 3);

    return {
      ...realistic,
      ranges: { conservative, realistic, optimistic },
      chartData: [
        { name: 'Invested', value: realistic.totalInvested, color: '#94a3b8' },
        { name: 'Interest', value: realistic.totalInterest, color: '#10b981' }
      ]
    };
  }, [compInitial, compMonthly, compRate, compYears]);

  // --- HLV Calculator Logic ---
  const [hlvAge, setHlvAge] = useState(30);
  const [hlvRetirementAge, setHlvRetirementAge] = useState(60);
  const [hlvIncome, setHlvIncome] = useState(1200000);
  const [hlvExpenses, setHlvExpenses] = useState(600000);
  const [hlvSavings, setHlvSavings] = useState(portfolio.investments.reduce((sum, i) => sum + (i.currentValue || 0), 0) + portfolio.bankAccounts.reduce((sum, b) => sum + (b.balance || 0), 0));
  const [hlvLiabilities, setHlvLiabilities] = useState(portfolio.liabilities.reduce((sum, l) => sum + (l.outstandingAmount || 0), 0));
  const [hlvCurrentCover, setHlvCurrentCover] = useState(portfolio.insurances.filter(p => p.type === 'Term').reduce((sum, p) => sum + p.sumAssured, 0));
  const [hlvInflation, setHlvInflation] = useState(6);
  const [hlvReturn, setHlvReturn] = useState(8);

  const hlvResults = useMemo(() => {
    const yearsToRetire = Math.max(0, hlvRetirementAge - hlvAge);
    const annualSavings = Math.max(0, hlvIncome - hlvExpenses);
    const realRate = ((1 + hlvReturn / 100) / (1 + hlvInflation / 100)) - 1;
    
    // PV of annual savings for yearsToRetire at realRate (Income Replacement)
    let pvIncomeReplacement = 0;
    if (realRate !== 0) {
      pvIncomeReplacement = annualSavings * ((1 - Math.pow(1 + realRate, -yearsToRetire)) / realRate);
    } else {
      pvIncomeReplacement = annualSavings * yearsToRetire;
    }

    // Total Protection Needed = PV of Income Replacement + Liabilities - Current Liquid Assets
    const totalProtectionNeeded = Math.max(0, pvIncomeReplacement + hlvLiabilities - hlvSavings);
    const insuranceGap = Math.max(0, totalProtectionNeeded - hlvCurrentCover);

    return {
      pvIncomeReplacement,
      totalProtectionNeeded,
      insuranceGap,
      yearsToRetire,
      annualSavings
    };
  }, [hlvAge, hlvRetirementAge, hlvIncome, hlvExpenses, hlvSavings, hlvLiabilities, hlvCurrentCover, hlvInflation, hlvReturn]);

  // --- Net Worth Calculator Logic ---
  const [nwAssets, setNwAssets] = useState({
    cash: 50000,
    bank: 200000,
    investments: 1000000,
    realEstate: 5000000,
    vehicles: 800000,
    others: 100000
  });
  const [nwLiabilities, setNwLiabilities] = useState({
    homeLoan: 2000000,
    carLoan: 400000,
    personalLoan: 0,
    creditCard: 20000,
    others: 0
  });

  const netWorthResults = useMemo(() => {
    const totalAssets = Object.values(nwAssets).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(nwLiabilities).reduce((a, b) => a + b, 0);
    const netWorth = totalAssets - totalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      assetData: Object.entries(nwAssets).map(([name, value]) => ({ name, value })),
      liabilityData: Object.entries(nwLiabilities).map(([name, value]) => ({ name, value })),
      summaryData: [
        { name: 'Net Worth', value: Math.max(0, netWorth), color: '#10b981' },
        { name: 'Liabilities', value: totalLiabilities, color: '#f43f5e' }
      ]
    };
  }, [nwAssets, nwLiabilities]);

  // --- Target Corpus Logic ---
  const [targetAmount, setTargetAmount] = useState(100000000); // Default to 10 Cr
  const [targetYears, setTargetYears] = useState(15);
  const [targetRate, setTargetRate] = useState(12);
  const [targetStepUp, setTargetStepUp] = useState(10);
  const [targetInflation, setTargetInflation] = useState(6);
  const [targetExistingValue, setTargetExistingValue] = useState(0);
  const [targetExistingSip, setTargetExistingSip] = useState(0);

  const targetResults = useMemo(() => {
    const calculateForRate = (rate: number) => {
      const r = rate / 100 / 12;
      const n = targetYears * 12;
      
      // Future value of existing lumpsum
      const fvExisting = targetExistingValue * Math.pow(1 + rate/100, targetYears);
      
      // Future value of existing SIP: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
      // Usually SIP is at beginning of month, but standard formula is end. We'll use standard end-of-period.
      const fvExistingSip = targetExistingSip > 0 ? targetExistingSip * (Math.pow(1 + r, n) - 1) / r : 0;
      
      const totalFvAlreadyCovered = fvExisting + fvExistingSip;
      const adjustedTargetAmount = Math.max(0, targetAmount - totalFvAlreadyCovered);

      // SIP required: PMT = FV * r / ((1+r)^n - 1)
      const requiredSip = n > 0 ? (adjustedTargetAmount * r) / (Math.pow(1 + r, n) - 1) : 0;

      // Step-Up SIP required
      let requiredStepUpSip = 0;
      if (n > 0 && adjustedTargetAmount > 0) {
        const s = targetStepUp / 100;
        let totalValueUnits = 0;
        let currentUnitSip = 1;
        for (let yr = 0; yr < targetYears; yr++) {
          for (let m = 0; m < 12; m++) {
            totalValueUnits = (totalValueUnits + currentUnitSip) * (1 + r);
          }
          currentUnitSip *= (1 + s);
        }
        requiredStepUpSip = adjustedTargetAmount / totalValueUnits;
      }
      
      // Lumpsum required: PV = FV / (1+r)^n
      const requiredLumpsum = adjustedTargetAmount / Math.pow(1 + rate/100, targetYears);

      return {
        requiredSip,
        requiredStepUpSip,
        requiredLumpsum,
        fvExisting,
        fvExistingSip,
        totalFvAlreadyCovered,
        adjustedTargetAmount,
        rate
      };
    };

    const realistic = calculateForRate(targetRate);
    const conservative = calculateForRate(Math.max(1, targetRate - 3));
    const optimistic = calculateForRate(targetRate + 3);

    // Real Value in Today's Terms: PV = FV / (1+i)^n
    const realValueToday = targetAmount / Math.pow(1 + targetInflation/100, targetYears);

    return {
      ...realistic,
      realValueToday,
      ranges: {
        conservative,
        realistic,
        optimistic
      }
    };
  }, [targetAmount, targetYears, targetRate, targetInflation, targetExistingValue, targetExistingSip]);

  // --- Lumpsum Calculator Logic ---
  const [lumpsumAmount, setLumpsumAmount] = useState(100000);
  const [lumpsumRate, setLumpsumRate] = useState(12);
  const [lumpsumYears, setLumpsumYears] = useState(10);

  const lumpsumResults = useMemo(() => {
    const r = lumpsumRate / 100;
    const futureValue = lumpsumAmount * Math.pow(1 + r, lumpsumYears);
    const returns = futureValue - lumpsumAmount;
    
    return {
      totalInvested: lumpsumAmount,
      returns,
      totalValue: futureValue,
      chartData: [
        { name: 'Invested', value: lumpsumAmount, color: '#94a3b8' },
        { name: 'Returns', value: returns, color: '#10b981' }
      ]
    };
  }, [lumpsumAmount, lumpsumRate, lumpsumYears]);

  // --- EMI Calculator Logic ---
  const [loanAmount, setLoanAmount] = useState(1000000);
  const [loanRate, setLoanRate] = useState(8.5);
  const [loanYears, setLoanYears] = useState(20);
  const [extraMonthlyEmi, setExtraMonthlyEmi] = useState(0);
  const [prepaymentLumpSum, setPrepaymentLumpSum] = useState(0);
  const [prepaymentMonth, setPrepaymentMonth] = useState(1);
  const [prepaymentFrequency, setPrepaymentFrequency] = useState<'once' | 'yearly'>('once');

  const emiResults = useMemo(() => {
    const r = loanRate / 12 / 100;
    const n = loanYears * 12;
    const standardEmi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    // Generate Schedule with Prepayments
    let balance = loanAmount;
    let totalInterest = 0;
    let totalPayment = 0;
    const schedule = [];
    let monthsToClose = 0;
    
    const monthlyEmi = standardEmi + extraMonthlyEmi;

    for (let m = 1; m <= n; m++) {
      if (balance <= 0) break;
      
      const interest = balance * r;
      let principal = monthlyEmi - interest;
      
      // Apply Lump Sum Prepayment
      let lumpSum = 0;
      if (prepaymentFrequency === 'once' && m === prepaymentMonth) {
        lumpSum = prepaymentLumpSum;
      } else if (prepaymentFrequency === 'yearly' && m % 12 === 0) {
        lumpSum = prepaymentLumpSum;
      }
      
      if (principal + lumpSum > balance) {
        lumpSum = Math.max(0, balance - principal);
        principal = balance - lumpSum;
      }
      
      const totalMonthlyPayment = interest + principal + lumpSum;
      balance -= (principal + lumpSum);
      totalInterest += interest;
      totalPayment += totalMonthlyPayment;
      monthsToClose = m;
      
      schedule.push({
        month: m,
        openingBalance: balance + principal + lumpSum,
        emi: monthlyEmi,
        interest,
        principal,
        lumpSum,
        closingBalance: Math.max(0, balance)
      });
    }

    const standardTotalInterest = (standardEmi * n) - loanAmount;
    const interestSaved = standardTotalInterest - totalInterest;
    const monthsSaved = n - monthsToClose;

    return {
      emi: standardEmi,
      actualEmi: monthlyEmi,
      totalInterest,
      totalPayment,
      monthsToClose,
      yearsToClose: (monthsToClose / 12).toFixed(1),
      interestSaved,
      monthsSaved,
      schedule,
      chartData: [
        { name: 'Principal', value: loanAmount, color: '#10b981' },
        { name: 'Interest', value: totalInterest, color: '#f43f5e' }
      ]
    };
  }, [loanAmount, loanRate, loanYears, extraMonthlyEmi, prepaymentLumpSum, prepaymentMonth, prepaymentFrequency]);

  // --- Retirement Calculator Logic ---
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
  const [inflation, setInflation] = useState(6);
  const [postRetirementReturn, setPostRetirementReturn] = useState(8);
  const [existingCorpus, setExistingCorpus] = useState(0);
  const [preRetirementReturn, setPreRetirementReturn] = useState(12);
  const [retirementStepUp, setRetirementStepUp] = useState(10);
  const [ongoingInvestments, setOngoingInvestments] = useState<Array<{
    id: string;
    name: string;
    amount: number;
    frequency: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
    returnRate: number;
  }>>([
    { id: '1', name: 'EPF', amount: 5000, frequency: 'monthly', returnRate: 8.1 },
    { id: '2', name: 'PPF', amount: 150000, frequency: 'yearly', returnRate: 7.1 },
  ]);

  // --- SIP with EMI Planner Logic ---
  const [sipWithEmiLoanAmount, setSipWithEmiLoanAmount] = useState(6000000);
  const [sipWithEmiLoanRate, setSipWithEmiLoanRate] = useState(10);
  const [sipWithEmiLoanYears, setSipWithEmiLoanYears] = useState(20);
  const [sipWithEmiSipRate, setSipWithEmiSipRate] = useState(10);
  const [sipWithEmiStepUp, setSipWithEmiStepUp] = useState(10);

  const sipWithEmiResults = useMemo(() => {
    const rl = sipWithEmiLoanRate / 12 / 100;
    const n = sipWithEmiLoanYears * 12;
    const emi = (sipWithEmiLoanAmount * rl * Math.pow(1 + rl, n)) / (Math.pow(1 + rl, n) - 1);
    
    const totalLoanPayment = emi * n;
    const totalInterestPaid = totalLoanPayment - sipWithEmiLoanAmount;
    
    const sipAmount = emi * 0.25;
    const rs = sipWithEmiSipRate / 12 / 100;
    
    // Fixed SIP
    const totalInvestedFixed = sipAmount * n;
    const investmentValueFixed = rs > 0 ? sipAmount * ((Math.pow(1 + rs, n) - 1) / rs) * (1 + rs) : totalInvestedFixed;

    // Step-Up SIP
    let totalInvestedStepUp = 0;
    let investmentValueStepUp = 0;
    let currentSip = sipAmount;
    
    for (let yr = 0; yr < sipWithEmiLoanYears; yr++) {
      for (let m = 0; m < 12; m++) {
        investmentValueStepUp = (investmentValueStepUp + currentSip) * (1 + rs);
        totalInvestedStepUp += currentSip;
      }
      currentSip = currentSip * (1 + sipWithEmiStepUp / 100);
    }
    
    return {
      emi,
      sipAmount,
      totalLoanPayment,
      totalInterestPaid,
      totalInvestedFixed,
      investmentValueFixed,
      totalInvestedStepUp,
      investmentValueStepUp,
      chartData1: [
        { name: 'Total Loan Out Go', value: totalLoanPayment, color: '#dc2626' },
        { name: 'Total Interest Out Go', value: totalInterestPaid, color: '#bef264' }
      ],
      chartData2: [
        { name: 'Fixed SIP Value', value: investmentValueFixed, color: '#dc2626' },
        { name: 'Step-Up SIP Value', value: investmentValueStepUp, color: '#bef264' }
      ]
    };
  }, [sipWithEmiLoanAmount, sipWithEmiLoanRate, sipWithEmiLoanYears, sipWithEmiSipRate, sipWithEmiStepUp]);

  const handleDownloadSIPWithEMIExcel = () => {
    const data = [
      { 'Metric': 'Outstanding Loan Amount', 'Value': formatCurrency(sipWithEmiLoanAmount) },
      { 'Metric': 'Rate of Interest on Loan', 'Value': `${sipWithEmiLoanRate}%` },
      { 'Metric': 'Remaining Loan Tenure', 'Value': `${sipWithEmiLoanYears} Years` },
      { 'Metric': 'Monthly EMI Amount', 'Value': formatCurrency(sipWithEmiResults.emi) },
      { 'Metric': 'Monthly SIP Amount (25% of EMI)', 'Value': formatCurrency(sipWithEmiResults.sipAmount) },
      { 'Metric': 'SIP Step-Up (Annual)', 'Value': `${sipWithEmiStepUp}%` },
      { 'Metric': 'Expected Rate of Return (SIP)', 'Value': `${sipWithEmiSipRate}%` },
      { 'Metric': 'Total Loan Out Go', 'Value': formatCurrency(sipWithEmiResults.totalLoanPayment) },
      { 'Metric': 'Total Interest Out Go', 'Value': formatCurrency(sipWithEmiResults.totalInterestPaid) },
      { 'Metric': 'Fixed SIP - Invested', 'Value': formatCurrency(sipWithEmiResults.totalInvestedFixed) },
      { 'Metric': 'Fixed SIP - Value', 'Value': formatCurrency(sipWithEmiResults.investmentValueFixed) },
      { 'Metric': 'Step-Up SIP - Invested', 'Value': formatCurrency(sipWithEmiResults.totalInvestedStepUp) },
      { 'Metric': 'Step-Up SIP - Value', 'Value': formatCurrency(sipWithEmiResults.investmentValueStepUp) },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SIP with EMI Summary");
    XLSX.writeFile(workbook, `SIP_with_EMI_Planner_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- Child Education Planner Logic ---
  const [childAge, setChildAge] = useState(0);
  const [corpusRequired, setCorpusRequired] = useState(1000000);
  const [targetAge, setTargetAge] = useState(18);
  const [eduReturnRate, setEduReturnRate] = useState(12);
  const [inflationRate, setInflationRate] = useState(7);
  const [sipStepUp, setSipStepUp] = useState(10);

  const childEduResults = useMemo(() => {
    const tenure = Math.max(1, targetAge - childAge);
    const futureCorpus = corpusRequired * Math.pow(1 + inflationRate / 100, tenure);
    
    // Fixed SIP calculation
    const monthlyRate = eduReturnRate / 12 / 100;
    const months = tenure * 12;
    const fixedSip = monthlyRate > 0 
      ? futureCorpus / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
      : futureCorpus / months;
    
    // Step-up SIP calculation
    let stepUpSip = 0;
    if (months > 0) {
      const r = monthlyRate;
      let totalValue = 0;
      let currentSip = 1; // start with 1 unit
      for (let yr = 0; yr < tenure; yr++) {
        for (let m = 0; m < 12; m++) {
          totalValue = (totalValue + currentSip) * (1 + r);
        }
        currentSip = currentSip * (1 + sipStepUp / 100);
      }
      stepUpSip = futureCorpus / (totalValue / 1); // scaling factor
    }

    const totalInvestedFixed = fixedSip * months;
    let totalInvestedStepUp = 0;
    for (let i = 0; i < tenure; i++) {
      totalInvestedStepUp += stepUpSip * Math.pow(1 + sipStepUp / 100, i) * 12;
    }

    const lumpsumRequired = futureCorpus / Math.pow(1 + eduReturnRate / 100, tenure);

    return {
      tenure,
      futureCorpus,
      fixedSip,
      stepUpSip,
      totalInvestedFixed,
      totalInvestedStepUp,
      lumpsumRequired,
      sipChart: [
        { name: 'Fixed SIP', value: fixedSip, color: '#dc2626' },
        { name: 'Step Up SIP', value: stepUpSip, color: '#bef264' }
      ],
      investmentChart: [
        { name: 'Fixed SIP', value: totalInvestedFixed, color: '#dc2626' },
        { name: 'Step Up SIP', value: totalInvestedStepUp, color: '#bef264' },
        { name: 'Lumpsum', value: lumpsumRequired, color: '#64748b' },
        { name: 'Education Corpus', value: futureCorpus, color: '#475569' }
      ]
    };
  }, [childAge, corpusRequired, targetAge, eduReturnRate, inflationRate, sipStepUp]);

  const handleDownloadChildEduExcel = () => {
    const data = [
      { 'Metric': 'Current Age of Child', 'Value': childAge },
      { 'Metric': 'Corpus Required (Current Value)', 'Value': formatCurrency(corpusRequired) },
      { 'Metric': 'Corpus Required at Age', 'Value': targetAge },
      { 'Metric': 'Target Tenure', 'Value': `${childEduResults.tenure} Years` },
      { 'Metric': 'Expected Return Rate', 'Value': `${eduReturnRate}%` },
      { 'Metric': 'Inflation Rate', 'Value': `${inflationRate}%` },
      { 'Metric': 'SIP Step Up (Annual)', 'Value': `${sipStepUp}%` },
      { 'Metric': 'Future Education Corpus', 'Value': formatCurrency(childEduResults.futureCorpus) },
      { 'Metric': 'Fixed Monthly SIP Amount', 'Value': formatCurrency(childEduResults.fixedSip) },
      { 'Metric': 'Dynamic Step-Up SIP Amount', 'Value': formatCurrency(childEduResults.stepUpSip) },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Child Education Plan");
    XLSX.writeFile(workbook, `Child_Education_Plan_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const retirementResults = useMemo(() => {
    const yearsToRetirement = Math.max(0, retirementAge - currentAge);
    const yearsInRetirement = Math.max(0, lifeExpectancy - retirementAge);
    
    // Future monthly expense at retirement
    const futureMonthlyExpense = monthlyExpenses * Math.pow(1 + inflation / 100, yearsToRetirement);
    const futureAnnualExpense = futureMonthlyExpense * 12;
    
    // Real rate of return post-retirement
    const realRate = ((1 + postRetirementReturn / 100) / (1 + inflation / 100)) - 1;
    
    // Corpus required (Present Value of Annuity)
    const corpusRequired = realRate !== 0 
      ? futureAnnualExpense * ((1 - Math.pow(1 + realRate, -yearsInRetirement)) / realRate)
      : futureAnnualExpense * yearsInRetirement;
    
    // Future value of existing corpus
    const fvExistingCorpus = existingCorpus * Math.pow(1 + preRetirementReturn / 100, yearsToRetirement);
    
    // Future value of ongoing investments
    let fvOngoingInvestments = 0;
    ongoingInvestments.forEach(inv => {
      const r = inv.returnRate / 100;
      const n = yearsToRetirement;
      let fv = 0;
      if (n <= 0) return;

      if (inv.frequency === 'monthly') {
        const mr = r / 12;
        const mn = n * 12;
        fv = inv.amount * ((Math.pow(1 + mr, mn) - 1) / mr) * (1 + mr);
      } else if (inv.frequency === 'quarterly') {
        const qr = r / 4;
        const qn = n * 4;
        fv = inv.amount * ((Math.pow(1 + qr, qn) - 1) / qr) * (1 + qr);
      } else if (inv.frequency === 'half-yearly') {
        const hr = r / 2;
        const hn = n * 2;
        fv = inv.amount * ((Math.pow(1 + hr, hn) - 1) / hr) * (1 + hr);
      } else if (inv.frequency === 'yearly') {
        fv = inv.amount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      }
      fvOngoingInvestments += fv;
    });
    
    const totalProjectedCorpus = fvExistingCorpus + fvOngoingInvestments;
    const shortfall = Math.max(0, corpusRequired - totalProjectedCorpus);
    
    // Additional monthly SIP needed for shortfall
    const rShortfall = preRetirementReturn / 100 / 12;
    const nShortfall = yearsToRetirement * 12;
    const additionalSip = nShortfall > 0 ? (shortfall * rShortfall) / (Math.pow(1 + rShortfall, nShortfall) - 1) : 0;
    
    // Additional Step-Up SIP needed
    let additionalStepUpSip = 0;
    if (nShortfall > 0 && shortfall > 0) {
      const s = retirementStepUp / 100;
      let totalValueUnits = 0;
      let currentUnitSip = 1;
      for (let yr = 0; yr < yearsToRetirement; yr++) {
        for (let m = 0; m < 12; m++) {
          totalValueUnits = (totalValueUnits + currentUnitSip) * (1 + rShortfall);
        }
        currentUnitSip *= (1 + s);
      }
      additionalStepUpSip = shortfall / totalValueUnits;
    }

    // Additional Lumpsum needed today for shortfall
    const additionalLumpsum = shortfall / Math.pow(1 + preRetirementReturn / 100, yearsToRetirement);

    return {
      futureMonthlyExpense,
      corpusRequired,
      totalProjectedCorpus,
      shortfall,
      additionalSip,
      additionalStepUpSip,
      additionalLumpsum,
      yearsToRetirement,
      yearsInRetirement,
      fvExistingCorpus,
      fvOngoingInvestments
    };
  }, [currentAge, retirementAge, lifeExpectancy, monthlyExpenses, inflation, postRetirementReturn, existingCorpus, preRetirementReturn, ongoingInvestments]);

  // --- Emergency Fund Calculator Logic ---
  const [monthlyExpEF, setMonthlyExpEF] = useState(40000);
  const [monthsCoverage, setMonthsCoverage] = useState(6);

  const efResults = useMemo(() => {
    return {
      target: monthlyExpEF * monthsCoverage
    };
  }, [monthlyExpEF, monthsCoverage]);

  // --- Goal Planner Logic ---
  const [goalType, setGoalType] = useState<'education' | 'marriage' | 'house' | 'vacation' | 'other'>('education');
  const [goalFrequency, setGoalFrequency] = useState<'one-time' | 'half-yearly' | 'yearly'>('one-time');
  const [goalCurrentCost, setGoalCurrentCost] = useState(1000000);
  const [goalCurrentMonthlyContribution, setGoalCurrentMonthlyContribution] = useState(0);
  const [goalYearsToStart, setGoalYearsToStart] = useState(10);
  const [goalDuration, setGoalDuration] = useState(4);
  const [goalInflation, setGoalInflation] = useState(6);
  const [goalReturn, setGoalReturn] = useState(12);
  const [goalStepUp, setGoalStepUp] = useState(10);
  const [goalExistingSavings, setGoalExistingSavings] = useState(0);

  const goalResults = useMemo(() => {
    const calculateForRate = (rate: number) => {
      const years = goalYearsToStart;
      const inflation = goalInflation / 100;
      const returns = rate / 100;
      
      const futureCostFirst = goalCurrentCost * Math.pow(1 + inflation, years);
      let totalCorpusNeeded = 0;
      const periodCosts = [];
      const postGoalReturn = 0.08; 
      const freq = goalFrequency === 'one-time' ? 1 : (goalFrequency === 'half-yearly' ? 2 : 1);
      const totalOccurrences = goalFrequency === 'one-time' ? 1 : goalDuration * freq;
      
      for (let i = 0; i < totalOccurrences; i++) {
        const yearsElapsed = i / freq;
        const costAtPeriod = futureCostFirst * Math.pow(1 + inflation, yearsElapsed);
        periodCosts.push({ 
          period: i + 1, 
          cost: costAtPeriod,
          label: goalFrequency === 'half-yearly' ? `H${(i % 2) + 1} Y${Math.floor(i / 2) + 1}` : `Year ${i + 1}`
        });
        totalCorpusNeeded += costAtPeriod / Math.pow(1 + postGoalReturn, yearsElapsed);
      }

      // Future value of existing savings
      const fvExistingSavings = goalExistingSavings * Math.pow(1 + returns, years);
      
      // Future value of ongoing contributions (Existing SIP)
      const r_monthly = returns / 12;
      const n_monthly = years * 12;
      const fvExistingSip = goalCurrentMonthlyContribution > 0 ? (goalCurrentMonthlyContribution * (Math.pow(1 + r_monthly, n_monthly) - 1) / r_monthly) : 0;

      const totalCovered = fvExistingSavings + fvExistingSip;
      const adjustedTotalCorpusNeeded = Math.max(0, totalCorpusNeeded - totalCovered);

      // Required SIP to reach adjustedTotalCorpusNeeded
      const requiredSip = n_monthly > 0 ? (adjustedTotalCorpusNeeded * r_monthly) / (Math.pow(1 + r_monthly, n_monthly) - 1) : 0;

      // Step-Up SIP required
      let requiredStepUpSip = 0;
      if (n_monthly > 0 && adjustedTotalCorpusNeeded > 0) {
        const s = goalStepUp / 100;
        let totalValueUnits = 0;
        let currentUnitSip = 1;
        for (let yr = 0; yr < years; yr++) {
          for (let m = 0; m < 12; m++) {
            totalValueUnits = (totalValueUnits + currentUnitSip) * (1 + r_monthly);
          }
          currentUnitSip *= (1 + s);
        }
        requiredStepUpSip = adjustedTotalCorpusNeeded / totalValueUnits;
      }

      const requiredYearlySavings = requiredSip * 12;
      const requiredLumpsum = adjustedTotalCorpusNeeded / Math.pow(1 + returns, years);

      return {
        futureCostFirst,
        totalCorpusNeeded,
        requiredSip,
        requiredStepUpSip,
        requiredYearlySavings,
        requiredLumpsum,
        yearsToStart: years,
        periodCosts,
        fvExistingSavings,
        fvExistingSip,
        totalCovered,
        adjustedTotalCorpusNeeded,
        rate
      };
    };

    const realistic = calculateForRate(goalReturn);
    const conservative = calculateForRate(Math.max(1, goalReturn - 3));
    const optimistic = calculateForRate(goalReturn + 3);

    return {
      ...realistic,
      ranges: { conservative, realistic, optimistic },
      chartData: [
        { name: 'Required Corpus', value: realistic.totalCorpusNeeded, color: '#10b981' },
        { name: 'Current Cost', value: goalCurrentCost, color: '#94a3b8' }
      ]
    };
  }, [goalType, goalCurrentCost, goalYearsToStart, goalDuration, goalInflation, goalReturn, goalFrequency, goalExistingSavings, goalCurrentMonthlyContribution]);

  // --- ESOP Calculator Logic ---
  const [esopShares, setEsopShares] = useState(1000);
  const [esopExercisePrice, setEsopExercisePrice] = useState(100);
  const [esopFmvExercise, setEsopFmvExercise] = useState(500);
  const [esopSalePrice, setEsopSalePrice] = useState(800);
  const [esopTaxSlab, setEsopTaxSlab] = useState(30);
  const [esopAssetType, setEsopAssetType] = useState<'listed' | 'unlisted'>('listed');
  const [esopHoldingPeriod, setEsopHoldingPeriod] = useState(24); // in months
  const [esopRegion, setEsopRegion] = useState<'india' | 'global'>('india');
  const [usdToInr, setUsdToInr] = useState(83);
  const [foreignTaxPaid, setForeignTaxPaid] = useState(0); // in percentage or absolute? let's do percentage for simplicity or absolute USD. Let's do absolute USD.
  const [foreignTaxPaidAmt, setForeignTaxPaidAmt] = useState(0);

  const esopResults = useMemo(() => {
    const multiplier = esopRegion === 'global' ? usdToInr : 1;
    
    // Stage 1: Exercise (Perquisite Tax)
    const perquisiteValue = Math.max(0, (esopFmvExercise - esopExercisePrice) * esopShares) * multiplier;
    const perquisiteTax = perquisiteValue * (esopTaxSlab / 100) * 1.04; // including 4% cess

    // Stage 2: Sale (Capital Gains)
    const capitalGain = (esopSalePrice - esopFmvExercise) * esopShares * multiplier;
    let cgTax = 0;
    let cgType = '';

    // For Global ESOPs, they are always treated as "Unlisted" in India even if listed on NASDAQ
    const effectiveAssetType = esopRegion === 'global' ? 'unlisted' : esopAssetType;

    if (effectiveAssetType === 'listed') {
      if (esopHoldingPeriod > 12) {
        cgType = 'LTCG';
        // LTCG on listed shares: 12.5% above 1.25L (Budget 2024)
        const taxableGain = Math.max(0, capitalGain - 125000);
        cgTax = taxableGain * 0.125 * 1.04;
      } else {
        cgType = 'STCG';
        // STCG on listed shares: 20% (Budget 2024)
        cgTax = Math.max(0, capitalGain) * 0.20 * 1.04;
      }
    } else {
      // Unlisted or Global
      if (esopHoldingPeriod > 24) {
        cgType = 'LTCG';
        // LTCG on unlisted: 12.5% without indexation (Budget 2024)
        cgTax = Math.max(0, capitalGain) * 0.125 * 1.04;
      } else {
        cgType = 'STCG';
        // STCG on unlisted: Taxed at slab rate
        cgTax = Math.max(0, capitalGain) * (esopTaxSlab / 100) * 1.04;
      }
    }

    // Foreign Tax Credit (FTC) - simplified
    const ftcAmount = esopRegion === 'global' ? foreignTaxPaidAmt * usdToInr : 0;
    const totalTaxBeforeFTC = perquisiteTax + cgTax;
    const totalTax = Math.max(0, totalTaxBeforeFTC - ftcAmount);

    const totalValue = esopSalePrice * esopShares * multiplier;
    const totalCost = esopExercisePrice * esopShares * multiplier;
    const netProceeds = totalValue - totalCost - totalTax;

    return {
      perquisiteValue,
      perquisiteTax,
      capitalGain,
      cgTax,
      cgType,
      totalTax,
      totalTaxBeforeFTC,
      ftcAmount,
      netProceeds,
      totalValue,
      totalCost,
      chartData: [
        { name: 'Net Profit', value: Math.max(0, netProceeds), color: '#10b981' },
        { name: 'Total Tax', value: totalTax, color: '#f43f5e' },
        { name: 'Exercise Cost', value: totalCost, color: '#94a3b8' }
      ]
    };
  }, [esopShares, esopExercisePrice, esopFmvExercise, esopSalePrice, esopTaxSlab, esopAssetType, esopHoldingPeriod, esopRegion, usdToInr, foreignTaxPaidAmt]);

  // --- FD Calculator Logic ---
  const [fdAmount, setFdAmount] = useState(100000);
  const [fdRate, setFdRate] = useState(7);
  const [fdYears, setFdYears] = useState(5);

  const fdResults = useMemo(() => {
    const r = fdRate / 100;
    const n = 4; // Quarterly compounding
    const maturityAmount = fdAmount * Math.pow(1 + r/n, n * fdYears);
    const interestEarned = maturityAmount - fdAmount;
    const taxAmount = interestEarned * (fdTaxRate / 100);
    const postTaxMaturityAmount = maturityAmount - taxAmount;
    
    return {
      maturityAmount,
      interestEarned,
      taxAmount,
      postTaxMaturityAmount,
      chartData: [
        { name: 'Principal', value: fdAmount, color: '#94a3b8' },
        { name: 'Post-tax Interest', value: interestEarned - taxAmount, color: '#10b981' },
        { name: 'Tax', value: taxAmount, color: '#f43f5e' }
      ]
    };
  }, [fdAmount, fdRate, fdYears, fdTaxRate]);

  // --- SCSS Calculator Logic ---
  const [scssAmount, setScssAmount] = useState(1000000);
  const [scssRate, setScssRate] = useState(8.2);
  const [scssYears, setScssYears] = useState(5);

  const scssResults = useMemo(() => {
    const r = scssRate / 100;
    const t = scssYears;
    const P = scssAmount;
    
    // SCSS pays interest quarterly, it doesn't compound.
    // Total Interest = P * r * t
    const interestEarned = P * r * t;
    const quarterlyInterest = (P * r) / 4;
    const taxAmount = interestEarned * (scssTaxRate / 100);
    const postTaxInterest = interestEarned - taxAmount;
    const totalValue = P + interestEarned;
    const postTaxTotalValue = P + postTaxInterest;

    return {
      interestEarned,
      quarterlyInterest,
      taxAmount,
      postTaxInterest,
      totalValue,
      postTaxTotalValue,
      chartData: [
        { name: 'Principal', value: P, color: '#94a3b8' },
        { name: 'Post-tax Interest', value: postTaxInterest, color: '#10b981' },
        { name: 'Tax', value: taxAmount, color: '#f43f5e' }
      ]
    };
  }, [scssAmount, scssRate, scssYears, scssTaxRate]);

  // --- Post Office MIS Logic ---
  const [pomisAmount, setPomisAmount] = useState(100000);
  const [pomisAccountType, setPomisAccountType] = useState<'single' | 'joint'>('single');
  const pomisRate = 7.4;
  const pomisYears = 5;

  const pomisResults = useMemo(() => {
    const monthlyPayout = (pomisAmount * pomisRate / 100) / 12;
    const totalInterest = monthlyPayout * 12 * pomisYears;
    const totalValue = pomisAmount + totalInterest;

    return {
      monthlyPayout,
      totalInterest,
      totalValue,
      chartData: [
        { name: 'Principal', value: pomisAmount, color: '#94a3b8' },
        { name: 'Total Interest', value: totalInterest, color: '#f59e0b' }
      ]
    };
  }, [pomisAmount]);

  // --- RBI Savings Bonds Logic ---
  const [rbiAmount, setRbiAmount] = useState(100000);
  const [rbiType, setRbiType] = useState<'cumulative' | 'non-cumulative'>('non-cumulative');
  const rbiRate = 8.05;
  const rbiYears = 7;

  const rbiResults = useMemo(() => {
    let totalInterest = 0;
    let maturityAmount = 0;
    let halfYearlyPayout = 0;

    if (rbiType === 'non-cumulative') {
      halfYearlyPayout = (rbiAmount * rbiRate / 100) / 2;
      totalInterest = halfYearlyPayout * 2 * rbiYears;
      maturityAmount = rbiAmount;
    } else {
      const n = rbiYears * 2;
      const r = (rbiRate / 100) / 2;
      maturityAmount = rbiAmount * Math.pow(1 + r, n);
      totalInterest = maturityAmount - rbiAmount;
    }

    return {
      halfYearlyPayout,
      totalInterest,
      maturityAmount,
      chartData: [
        { name: 'Principal', value: rbiAmount, color: '#94a3b8' },
        { name: 'Total Interest', value: totalInterest, color: '#3b82f6' }
      ]
    };
  }, [rbiAmount, rbiType]);

  // --- Gratuity Calculator Logic ---
  const [gratuitySalary, setGratuitySalary] = useState(50000);
  const [gratuityYears, setGratuityYears] = useState(5);

  const gratuityResults = useMemo(() => {
    // Formula: (15 * Last Drawn Salary * Tenure of Service) / 26
    // Last Drawn Salary = Basic Salary + Dearness Allowance (DA)
    // Tenure of Service = Number of years of service (rounded to nearest year if > 6 months)
    const tenure = Math.round(gratuityYears);
    const rawAmount = (15 * gratuitySalary * tenure) / 26;
    const maxLimit = 2000000; // ₹20 Lakhs limit as per Payment of Gratuity Act
    const amount = Math.min(rawAmount, maxLimit);
    const isEligible = gratuityYears >= 4.8; // 5 years is standard, but 4 years 7 months is often considered 5 years
    const isCapped = rawAmount > maxLimit;
    
    return {
      amount,
      rawAmount,
      tenure,
      isEligible,
      isCapped,
      maxLimit,
      chartData: [
        { name: 'Gratuity Amount', value: amount, color: '#6366f1' }
      ]
    };
  }, [gratuitySalary, gratuityYears]);

  // --- HRA Calculator Logic ---
  const [hraBasic, setHraBasic] = useState(50000);
  const [hraDA, setHraDA] = useState(0);
  const [hraReceived, setHraReceived] = useState(20000);
  const [hraRent, setHraRent] = useState(15000);
  const [hraIsMetro, setHraIsMetro] = useState(true);

  const hraResults = useMemo(() => {
    const basicDA = hraBasic + hraDA;
    const limit1 = hraReceived;
    const limit2 = Math.max(0, hraRent - (0.1 * basicDA));
    const limit3 = (hraIsMetro ? 0.5 : 0.4) * basicDA;
    const exempt = Math.min(limit1, limit2, limit3);
    const taxable = Math.max(0, hraReceived - exempt);

    return { 
      exempt, 
      taxable,
      chartData: [
        { name: 'Exempt HRA', value: exempt, color: '#10b981' },
        { name: 'Taxable HRA', value: taxable, color: '#f43f5e' }
      ]
    };
  }, [hraBasic, hraDA, hraReceived, hraRent, hraIsMetro]);

  // --- Income Tax Logic ---
  const [taxGross, setTaxGross] = useState(1200000);
  const [taxOtherIncome, setTaxOtherIncome] = useState(0);
  const [tax80C, setTax80C] = useState(150000);
  const [tax80D, setTax80D] = useState(25000);
  const [taxOtherDeductions, setTaxOtherDeductions] = useState(0);
  const [taxHraExemptInput, setTaxHraExemptInput] = useState(0);

  const taxResults = useMemo(() => {
    // New Regime (FY 25-26 / 26-27)
    const stdDedNew = 100000;
    const taxableNew = Math.max(0, taxGross + taxOtherIncome - stdDedNew);
    
    const calculateNew = (income: number) => {
      if (income <= 800000) return 0; // Rebate 87A (Effective tax-free up to 8L)
      let tax = 0;
      if (income > 1500000) tax += (income - 1500000) * 0.3 + 140000;
      else if (income > 1200000) tax += (income - 1200000) * 0.2 + 80000;
      else if (income > 1000000) tax += (income - 1000000) * 0.15 + 50000;
      else if (income > 700000) tax += (income - 700000) * 0.1 + 20000;
      else if (income > 300000) tax += (income - 300000) * 0.05;
      return tax;
    };

    // Old Regime
    const stdDedOld = 50000;
    const deductionsOld = stdDedOld + Math.min(150000, tax80C) + Math.min(100000, tax80D) + taxOtherDeductions + taxHraExemptInput;
    const taxableOld = Math.max(0, taxGross + taxOtherIncome - deductionsOld);

    const calculateOld = (income: number) => {
      if (income <= 500000) return 0; // Rebate 87A
      let tax = 0;
      if (income > 1000000) tax += (income - 1000000) * 0.3 + 112500;
      else if (income > 500000) tax += (income - 500000) * 0.2 + 12500;
      else if (income > 250000) tax += (income - 250000) * 0.05;
      return tax;
    };

    const taxNew = calculateNew(taxableNew);
    const taxOld = calculateOld(taxableOld);
    const cessNew = taxNew * 0.04;
    const cessOld = taxOld * 0.04;

    const totalTaxNew = taxNew + cessNew;
    const totalTaxOld = taxOld + cessOld;

    return {
      taxableNew,
      taxableOld,
      totalTaxNew,
      totalTaxOld,
      savings: Math.max(0, totalTaxOld - totalTaxNew),
      betterRegime: totalTaxNew < totalTaxOld ? 'New Regime' : 'Old Regime',
      chartData: [
        { name: 'New Regime Tax', value: totalTaxNew, color: '#3b82f6' },
        { name: 'Old Regime Tax', value: totalTaxOld, color: '#94a3b8' }
      ]
    };
  }, [taxGross, taxOtherIncome, tax80C, tax80D, taxOtherDeductions, taxHraExemptInput]);

  // --- Residency Status Logic ---
  const [daysCurrent, setDaysCurrent] = useState(182);
  const [daysPrev4, setDaysPrev4] = useState(365);
  const [isIndianCitizen, setIsIndianCitizen] = useState(true);
  const [isPIO, setIsPIO] = useState(false);
  const [isLeavingForJob, setIsLeavingForJob] = useState(false);
  const [isCrewMember, setIsCrewMember] = useState(false);
  const [incomeExcludingForeign, setIncomeExcludingForeign] = useState(1000000);
  const [isLiableToTaxOtherCountry, setIsLiableToTaxOtherCountry] = useState(false);
  const [residentInPrev2of10, setResidentInPrev2of10] = useState(true);
  const [daysPrev7, setDaysPrev7] = useState(730);

  // --- Real Estate Capital Gain Logic ---
  const [reGainAmount, setReGainAmount] = useState(10000000); // 1 Cr
  const [reNetConsideration, setReNetConsideration] = useState(20000000); // 2 Cr
  const [reIsResidential, setReIsResidential] = useState(true);
  const [reTaxRate, setReTaxRate] = useState(12.5); // New rule: 12.5% without indexation
  const [reExpectedReturnMF, setReExpectedReturnMF] = useState(12);
  const [reExpectedReturnRE, setReExpectedReturnRE] = useState(8);
  const [reBondRate, setReBondRate] = useState(5.25);
  const [reYears, setReYears] = useState(5); // Standard for 54EC bonds

  const reResults = useMemo(() => {
    // Option 1: Reinvest in Real Estate (Section 54 / 54F)
    const futureValueRE = reGainAmount * Math.pow(1 + reExpectedReturnRE / 100, reYears);

    // Option 2: Pay Tax & Invest in MF/PMS
    const taxPaidOnlyMF = reGainAmount * (reTaxRate / 100);
    const investedMF = reGainAmount - taxPaidOnlyMF;
    const futureValueMF = investedMF * Math.pow(1 + reExpectedReturnMF / 100, reYears);

    // Option 3: 54EC Bonds (Max 50L) + Pay Tax on Remainder & Invest in MF
    const bondInvestment = Math.min(reGainAmount, 5000000);
    const taxableGainAfterBonds = reGainAmount - bondInvestment;
    const taxPaidWithBonds = taxableGainAfterBonds * (reTaxRate / 100);
    const mfInvestmentWithBonds = taxableGainAfterBonds - taxPaidWithBonds;
    
    const futureValueBonds = (bondInvestment * Math.pow(1 + reBondRate / 100, reYears)) + 
                             (mfInvestmentWithBonds * Math.pow(1 + reExpectedReturnMF / 100, reYears));

    return {
      optionRE: {
        tax: 0,
        invested: reGainAmount,
        futureValue: futureValueRE,
        gain: futureValueRE - reGainAmount
      },
      optionMF: {
        tax: taxPaidOnlyMF,
        invested: investedMF,
        futureValue: futureValueMF,
        gain: futureValueMF - investedMF
      },
      optionBonds: {
        tax: taxPaidWithBonds,
        invested: bondInvestment + mfInvestmentWithBonds,
        futureValue: futureValueBonds,
        gain: futureValueBonds - (bondInvestment + mfInvestmentWithBonds)
      },
      chartData: [
        { name: 'Reinvest in RE', value: futureValueRE, color: '#6366f1' },
        { name: 'Pay Tax & MF', value: futureValueMF, color: '#10b981' },
        { name: '54EC Bonds + MF', value: futureValueBonds, color: '#f59e0b' }
      ]
    };
  }, [reGainAmount, reIsResidential, reNetConsideration, reTaxRate, reExpectedReturnMF, reExpectedReturnRE, reBondRate, reYears]);

  const residencyResults = useMemo(() => {
    let isResident = false;
    let isDeemedResident = false;
    let status = 'Non-Resident (NR)';
    let reason = '';
    let category = '';

    // 1. Basic Condition 1: 182 days or more
    if (daysCurrent >= 182) {
      isResident = true;
      reason = 'Stayed for 182 days or more in the current financial year.';
    } 
    // 2. Deemed Residency (Section 6(1A))
    else if (isIndianCitizen && incomeExcludingForeign > 1500000 && !isLiableToTaxOtherCountry) {
      isResident = true;
      isDeemedResident = true;
      reason = 'Deemed Resident: Indian citizen with income > ₹15L (excluding foreign sources) not liable to tax in any other country.';
    }
    // 3. Basic Condition 2: 60 days + 365 days (with exceptions)
    else {
      let threshold = 60;
      let exceptionReason = '';

      if (isIndianCitizen && (isLeavingForJob || isCrewMember)) {
        threshold = 182;
        exceptionReason = ' (Threshold increased to 182 days for Indian citizens leaving for employment/crew member)';
      } else if ((isIndianCitizen || isPIO) && daysCurrent > 0) {
        // Visiting India
        if (incomeExcludingForeign <= 1500000) {
          threshold = 182;
          exceptionReason = ' (Threshold increased to 182 days for Indian citizens/PIO visiting India with income ≤ ₹15L)';
        } else {
          threshold = 120;
          exceptionReason = ' (Threshold increased to 120 days for Indian citizens/PIO visiting India with income > ₹15L)';
        }
      }

      if (daysCurrent >= threshold && daysPrev4 >= 365) {
        isResident = true;
        reason = `Stayed for ${threshold}+ days in current FY and 365+ days in preceding 4 years.${exceptionReason}`;
      } else {
        reason = `Did not meet the minimum stay requirements for residency. Current threshold: ${threshold} days.`;
      }
    }

    if (isResident) {
      // Check for ROR vs RNOR
      let isROR = false;
      
      // Deemed residents are always RNOR
      if (isDeemedResident) {
        isROR = false;
        reason += ' Deemed residents are classified as RNOR.';
      } 
      // Indian citizen/PIO with 120-181 days and > 15L income are always RNOR
      else if ((isIndianCitizen || isPIO) && daysCurrent >= 120 && daysCurrent < 182 && incomeExcludingForeign > 1500000) {
        isROR = false;
        reason += ' Indian citizens/PIO visiting India with 120-181 days stay and income > ₹15L are classified as RNOR.';
      }
      // Standard ROR check
      else if (residentInPrev2of10 && daysPrev7 >= 730) {
        isROR = true;
      }

      if (isROR) {
        status = 'Resident and Ordinarily Resident (ROR)';
        category = 'ROR';
      } else {
        status = 'Resident but Not Ordinarily Resident (RNOR)';
        category = 'RNOR';
        if (!isDeemedResident && !(daysCurrent >= 120 && daysCurrent < 182 && incomeExcludingForeign > 1500000)) {
          reason += ' Failed ROR conditions (Resident in 2/10 years AND 730 days in 7 years).';
        }
      }
    } else {
      status = 'Non-Resident (NR)';
      category = 'NR';
    }

    return { status, reason, category };
  }, [daysCurrent, daysPrev4, isIndianCitizen, isPIO, isLeavingForJob, isCrewMember, incomeExcludingForeign, isLiableToTaxOtherCountry, residentInPrev2of10, daysPrev7]);

  const addOngoingInvestment = () => {
    setOngoingInvestments([
      ...ongoingInvestments,
      { id: Date.now().toString(), name: 'New Investment', amount: 5000, frequency: 'monthly', returnRate: 10 }
    ]);
  };

  const removeOngoingInvestment = (id: string) => {
    setOngoingInvestments(ongoingInvestments.filter(inv => inv.id !== id));
  };

  const updateOngoingInvestment = (id: string, field: string, value: any) => {
    setOngoingInvestments(ongoingInvestments.map(inv => 
      inv.id === id ? { ...inv, [field]: value } : inv
    ));
  };

  const calculators = [
    { id: 'health_check', label: 'Financial Health Check', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'retirement_readiness', label: 'Retirement Readiness', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'wealth_roadmap', label: 'Wealth Roadmap', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'sip', label: 'SIP Calculator', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'stepup_sip', label: 'Step-up SIP', icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { id: 'lumpsum', label: 'Lumpsum', icon: IndianRupee, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'swp', label: 'SWP Calculator', icon: ArrowRight, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'emi', label: 'Loan EMI', icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'loan_eligibility', label: 'Loan Eligibility', icon: Landmark, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'retirement', label: 'Retirement', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'target', label: 'Goal Target', icon: Target, color: 'text-emerald-800', bg: 'bg-emerald-100' },
    { id: 'goals', label: 'Goal Planner', icon: Target, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'emergency', label: 'Emergency Fund', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'ssy', label: 'SSY (Sukanya)', icon: ShieldCheck, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'nps', label: 'NPS Calculator', icon: Briefcase, color: 'text-blue-700', bg: 'bg-blue-100' },
    { id: 'ppf', label: 'PPF Calculator', icon: PiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'epf', label: 'EPF Calculator', icon: Briefcase, color: 'text-slate-700', bg: 'bg-slate-100' },
    { id: 'rd', label: 'Recurring Deposit', icon: PiggyBank, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'fd', label: 'Fixed Deposit', icon: PiggyBank, color: 'text-orange-700', bg: 'bg-orange-100' },
    { id: 'scss', label: 'SCSS Calculator', icon: ShieldCheck, color: 'text-indigo-700', bg: 'bg-indigo-100' },
    { id: 'pomis', label: 'Post Office MIS', icon: Landmark, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'rbi_bonds', label: 'RBI Savings Bonds', icon: ShieldCheck, color: 'text-blue-800', bg: 'bg-blue-50' },
    { id: 'gratuity', label: 'Gratuity Calculator', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'hra', label: 'HRA Exemption', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'income_tax', label: 'Income Tax', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'residency', label: 'Residency Status', icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'buy_vs_rent', label: 'Buy vs Rent', icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'real_estate_gain', label: 'RE Capital Gain', icon: Home, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'esop', label: 'ESOP Taxation', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'car_lease', label: 'Car Leasing', icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'capital_gains', label: 'Capital Gains', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'asset_allocation', label: 'Asset Allocation', icon: PieChartIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'compounding', label: 'Compounding', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'hlv', label: 'Human Life Value', icon: HeartPulse, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'net_worth', label: 'Net Worth', icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'delay', label: 'Cost of Delay', icon: Clock, color: 'text-rose-700', bg: 'bg-rose-100' },
    { id: 'sip_with_emi', label: 'SIP with EMI', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'child_education', label: 'Child Education', icon: Baby, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Precision Tools</h2>
          <p className="text-slate-500">Plan your future with precision using our specialized tools</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {calculators.map((calc) => (
            <button
              key={calc.id}
              onClick={() => setActiveCalc(calc.id as CalculatorType)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                activeCalc === calc.id 
                  ? `${calc.bg} ${calc.color} font-bold shadow-sm border border-slate-100` 
                  : 'text-slate-500 hover:bg-white hover:shadow-sm'
              }`}
            >
              <calc.icon size={20} className={activeCalc === calc.id ? calc.color : 'group-hover:text-slate-700'} />
              <span className="text-sm">{calc.label}</span>
              {activeCalc === calc.id && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </div>

        {/* Calculator Content */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCalc}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Wealth Roadmap */}
              {activeCalc === 'wealth_roadmap' && (
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Strategic Wealth Roadmap</h3>
                      <p className="text-sm text-slate-500">Comprehensive AI-driven financial planning</p>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/30">
                    <FinancialPlanCalculator portfolio={portfolio} />
                  </div>
                </div>
              )}

              {/* Financial Health Check */}
              {activeCalc === 'health_check' && (
                <FinancialHealthCheck />
              )}

              {/* Retirement Readiness Check */}
              {activeCalc === 'retirement_readiness' && (
                <RetirementReadinessCheck />
              )}

              {/* Buy vs Rent Calculator */}
              {activeCalc === 'buy_vs_rent' && (
                <div className="p-8">
                  <BuyVsRentCalculator />
                </div>
              )}

              {/* SIP Calculator */}
              {activeCalc === 'sip' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                        <TrendingUp size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">SIP Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <PrecisionInput 
                        label="Monthly Investment"
                        value={sipMonthly}
                        onChange={setSipMonthly}
                        min={500}
                        max={100000}
                        step={500}
                        prefix="₹"
                      />
                      <PrecisionInput 
                        label="Expected Return Rate (p.a)"
                        value={sipRate}
                        onChange={setSipRate}
                        min={1}
                        max={30}
                        step={0.5}
                        suffix="%"
                      />
                      <PrecisionInput 
                        label="Time Period (Years)"
                        value={sipYears}
                        onChange={setSipYears}
                        min={1}
                        max={40}
                        step={1}
                        suffix="Y"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invested Amount</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(sipResults.totalInvested)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Returns</p>
                        <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(sipResults.returns)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                        <h4 className="text-3xl font-black text-slate-900">{formatCurrency(sipResults.totalValue)}</h4>
                      </div>
                    </div>

                    <AIRecommendation 
                      calculatorType="SIP"
                      inputs={{ monthly: sipMonthly, rate: sipRate, tenure: sipYears }}
                      results={sipResults}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sipResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {sipResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <ExportButtons 
                      title="SIP Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Monthly Investment", formatCurrency(sipMonthly)],
                        ["Expected Return", `${sipRate}%`],
                        ["Tenure", `${sipYears} Years`]
                      ]}
                      results={[
                        ["Total Invested", formatCurrency(sipResults.totalInvested)],
                        ["Estimated Returns", formatCurrency(sipResults.returns)],
                        ["Total Value", formatCurrency(sipResults.totalValue)]
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Lumpsum Calculator */}
              {activeCalc === 'lumpsum' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <IndianRupee size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Lumpsum Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <PrecisionInput 
                        label="Total Investment"
                        value={lumpsumAmount}
                        onChange={setLumpsumAmount}
                        min={5000}
                        max={10000000}
                        step={5000}
                        prefix="₹"
                      />
                      <PrecisionInput 
                        label="Expected Return Rate (p.a)"
                        value={lumpsumRate}
                        onChange={setLumpsumRate}
                        min={1}
                        max={30}
                        step={0.5}
                        suffix="%"
                      />
                      <PrecisionInput 
                        label="Time Period (Years)"
                        value={lumpsumYears}
                        onChange={setLumpsumYears}
                        min={1}
                        max={40}
                        step={1}
                        suffix="Y"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invested Amount</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(lumpsumResults.totalInvested)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Returns</p>
                        <h4 className="text-2xl font-bold text-blue-600">{formatCurrency(lumpsumResults.returns)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                        <h4 className="text-3xl font-black text-slate-900">{formatCurrency(lumpsumResults.totalValue)}</h4>
                      </div>
                    </div>

                    <AIRecommendation 
                      calculatorType="Lumpsum"
                      inputs={{ investment: lumpsumAmount, rate: lumpsumRate, tenure: lumpsumYears }}
                      results={lumpsumResults}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={lumpsumResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {lumpsumResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <ExportButtons 
                      title="Lumpsum Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Total Investment", formatCurrency(lumpsumAmount)],
                        ["Expected Return", `${lumpsumRate}%`],
                        ["Tenure", `${lumpsumYears} Years`]
                      ]}
                      results={[
                        ["Total Invested", formatCurrency(lumpsumResults.totalInvested)],
                        ["Estimated Returns", formatCurrency(lumpsumResults.returns)],
                        ["Total Value", formatCurrency(lumpsumResults.totalValue)]
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Loan EMI Calculator */}
              {activeCalc === 'emi' && (
                <div className="p-8 space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1 space-y-8">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                          <Landmark size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Loan EMI Calculator</h3>
                      </div>
                      
                      <div className="space-y-6">
                        <PrecisionInput 
                          label="Loan Amount"
                          value={loanAmount}
                          onChange={setLoanAmount}
                          min={100000}
                          max={50000000}
                          step={100000}
                          prefix="₹"
                        />
                        <PrecisionInput 
                          label="Interest Rate (%)"
                          value={loanRate}
                          onChange={setLoanRate}
                          min={5}
                          max={25}
                          step={0.1}
                          suffix="%"
                        />
                        <PrecisionInput 
                          label="Loan Tenure (Years)"
                          value={loanYears}
                          onChange={setLoanYears}
                          min={1}
                          max={30}
                          step={1}
                          suffix="Y"
                        />

                        <div className="pt-6 border-t border-slate-100 space-y-6">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp size={18} className="text-emerald-600" />
                            Prepayment Options
                          </h4>
                          
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700">Extra Monthly EMI</label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">₹</span>
                                <input 
                                  type="number"
                                  value={extraMonthlyEmi}
                                  onChange={(e) => setExtraMonthlyEmi(Number(e.target.value))}
                                  className="w-20 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded text-xs font-bold text-emerald-600 outline-none"
                                />
                              </div>
                            </div>
                            <input 
                              type="range" min="0" max="100000" step="1000"
                              value={extraMonthlyEmi} onChange={(e) => setExtraMonthlyEmi(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700">Lump Sum Prepayment</label>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">₹</span>
                                <input 
                                  type="number"
                                  value={prepaymentLumpSum}
                                  onChange={(e) => setPrepaymentLumpSum(Number(e.target.value))}
                                  className="w-24 px-2 py-1 bg-emerald-50 border border-emerald-100 rounded text-xs font-bold text-emerald-600 outline-none"
                                />
                              </div>
                            </div>
                            <input 
                              type="range" min="0" max="5000000" step="10000"
                              value={prepaymentLumpSum} onChange={(e) => setPrepaymentLumpSum(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Frequency</label>
                                <select 
                                  value={prepaymentFrequency}
                                  onChange={(e) => setPrepaymentFrequency(e.target.value as 'once' | 'yearly')}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                >
                                  <option value="once">One-time</option>
                                  <option value="yearly">Every Year</option>
                                </select>
                              </div>
                              {prepaymentFrequency === 'once' && (
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Month No.</label>
                                  <input 
                                    type="number"
                                    min="1" max={loanYears * 12}
                                    value={prepaymentMonth}
                                    onChange={(e) => setPrepaymentMonth(Number(e.target.value))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-50 rounded-3xl p-8 space-y-6">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Standard EMI</p>
                            <h4 className="text-3xl font-black text-rose-600">{formatCurrency(emiResults.emi)}</h4>
                          </div>
                          {extraMonthlyEmi > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actual Monthly Payment</p>
                              <h4 className="text-2xl font-black text-emerald-600">{formatCurrency(emiResults.actualEmi)}</h4>
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Interest Paid</p>
                            <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(emiResults.totalInterest)}</h4>
                          </div>
                          <div className="pt-4 border-t border-slate-200">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payment</p>
                            <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(emiResults.totalPayment)}</h4>
                          </div>
                        </div>

                        <div className="bg-emerald-50 rounded-3xl p-8 space-y-6 border border-emerald-100">
                          <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-emerald-600" />
                            Early Closure Impact
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">New Tenure</p>
                              <h4 className="text-xl font-black text-emerald-900">{emiResults.yearsToClose} Years</h4>
                              <p className="text-[10px] text-emerald-500 font-medium">({emiResults.monthsToClose} months)</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Time Saved</p>
                              <h4 className="text-xl font-black text-emerald-900">{(emiResults.monthsSaved / 12).toFixed(1)} Years</h4>
                              <p className="text-[10px] text-emerald-500 font-medium">({emiResults.monthsSaved} months)</p>
                            </div>
                            <div className="col-span-2 space-y-1 pt-4 border-t border-emerald-100">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Interest Saved</p>
                              <h4 className="text-2xl font-black text-emerald-900">{formatCurrency(emiResults.interestSaved)}</h4>
                            </div>
                          </div>

                          <div className="h-32 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={emiResults.chartData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={55}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {emiResults.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <AIRecommendation 
                        calculatorType="Loan EMI"
                        inputs={{ amount: loanAmount, rate: loanRate, tenure: loanYears, extraMonthly: extraMonthlyEmi, lumpSum: prepaymentLumpSum }}
                        results={emiResults}
                      />

                      <ExportButtons 
                        title="Loan EMI Calculator"
                        onDownload={handleDownloadCalculatorReport}
                        inputs={[
                          ["Loan Amount", formatCurrency(loanAmount)],
                          ["Interest Rate", `${loanRate}%`],
                          ["Tenure", `${loanYears} Years`],
                          ["Extra Monthly", formatCurrency(extraMonthlyEmi)],
                          ["Lumpsum Prepayment", formatCurrency(prepaymentLumpSum)]
                        ]}
                        results={[
                          ["Standard EMI", formatCurrency(emiResults.emi)],
                          ["Actual EMI", formatCurrency(emiResults.actualEmi)],
                          ["Total Interest", formatCurrency(emiResults.totalInterest)],
                          ["Interest Saved", formatCurrency(emiResults.interestSaved)],
                          ["Years to Close", `${emiResults.yearsToClose} Years`]
                        ]}
                      />

                      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <Calendar size={18} className="text-indigo-600" />
                            Payment Schedule
                          </h4>
                          <button 
                            onClick={handleDownloadEMIExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                          >
                            <Download size={14} />
                            Excel
                          </button>
                        </div>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-10 shadow-sm">
                              <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Month</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Opening</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">EMI</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Interest</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Principal</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Lump Sum</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Closing</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {emiResults.schedule.slice(0, 60).map((row) => (
                                <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-3 text-xs font-bold text-slate-900">{row.month}</td>
                                  <td className="px-6 py-3 text-xs text-slate-600">{formatCurrency(row.openingBalance)}</td>
                                  <td className="px-6 py-3 text-xs text-slate-600">{formatCurrency(row.emi)}</td>
                                  <td className="px-6 py-3 text-xs text-rose-600 font-medium">{formatCurrency(row.interest)}</td>
                                  <td className="px-6 py-3 text-xs text-emerald-600 font-medium">{formatCurrency(row.principal)}</td>
                                  <td className="px-6 py-3 text-xs text-indigo-600 font-bold">{row.lumpSum > 0 ? formatCurrency(row.lumpSum) : '-'}</td>
                                  <td className="px-6 py-3 text-xs font-bold text-slate-900">{formatCurrency(row.closingBalance)}</td>
                                </tr>
                              ))}
                              {emiResults.schedule.length > 60 && (
                                <tr>
                                  <td colSpan={7} className="px-6 py-4 text-center text-xs text-slate-400 italic bg-slate-50/30">
                                    Showing first 60 months. Download Excel for full schedule.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Retirement Calculator */}
              {activeCalc === 'retirement' && (
                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                        <Target size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Retirement Corpus Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Current Age</label>
                          <input 
                            type="number"
                            value={currentAge} onChange={(e) => setCurrentAge(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Retirement Age</label>
                          <input 
                            type="number"
                            value={retirementAge} onChange={(e) => setRetirementAge(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Life Expectancy</label>
                          <input 
                            type="number"
                            value={lifeExpectancy} onChange={(e) => setLifeExpectancy(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monthly Expenses (Today)</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="number"
                              value={monthlyExpenses} onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Existing Corpus</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="number"
                              value={existingCorpus} onChange={(e) => setExistingCorpus(Number(e.target.value))}
                              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Inflation (%)</label>
                          <input 
                            type="number"
                            value={inflation} onChange={(e) => setInflation(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pre-Ret. Return (%)</label>
                          <input 
                            type="number"
                            value={preRetirementReturn} onChange={(e) => setPreRetirementReturn(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Post-Ret. Return (%)</label>
                          <input 
                            type="number"
                            value={postRetirementReturn} onChange={(e) => setPostRetirementReturn(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold text-slate-500 uppercase">Annual Step-Up SIP (%)</label>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black">{retirementStepUp}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="25"
                          step="1"
                          value={retirementStepUp}
                          onChange={(e) => setRetirementStepUp(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ongoing Investments</h4>
                          <button 
                            onClick={addOngoingInvestment}
                            className="flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            <Plus size={14} /> Add Asset
                          </button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {ongoingInvestments.map((inv) => (
                            <div key={inv.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <input 
                                  type="text"
                                  value={inv.name}
                                  onChange={(e) => updateOngoingInvestment(inv.id, 'name', e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 p-0 font-bold text-slate-700 text-sm w-full"
                                  placeholder="Asset Name (e.g. EPF)"
                                />
                                <button 
                                  onClick={() => removeOngoingInvestment(inv.id)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount</label>
                                  <input 
                                    type="number"
                                    value={inv.amount}
                                    onChange={(e) => updateOngoingInvestment(inv.id, 'amount', Number(e.target.value))}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Freq.</label>
                                  <select 
                                    value={inv.frequency}
                                    onChange={(e) => updateOngoingInvestment(inv.id, 'frequency', e.target.value)}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                  >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="half-yearly">Half-Yearly</option>
                                    <option value="yearly">Yearly</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Return %</label>
                                  <input 
                                    type="number"
                                    value={inv.returnRate}
                                    onChange={(e) => updateOngoingInvestment(inv.id, 'returnRate', Number(e.target.value))}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          {ongoingInvestments.length === 0 && (
                            <p className="text-center text-xs text-slate-400 py-4 italic">No ongoing investments added.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-amber-50 rounded-3xl p-8 flex flex-col space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Monthly Expense at Retirement</p>
                          <h4 className="text-xl font-black text-slate-900">{formatCurrency(retirementResults.futureMonthlyExpense)}</h4>
                          <p className="text-[10px] text-slate-500">In {retirementResults.yearsToRetirement} years</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corpus Required</p>
                          <h4 className="text-xl font-black text-amber-600">{formatCurrency(retirementResults.corpusRequired)}</h4>
                          <p className="text-[10px] text-slate-500">Until age {lifeExpectancy}</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Projected Corpus</p>
                          <h4 className="text-xl font-black text-emerald-600">{formatCurrency(retirementResults.totalProjectedCorpus)}</h4>
                        </div>
                        <div className="space-y-2 pt-3 border-t border-slate-50">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">From Existing Corpus</span>
                            <span className="font-bold text-slate-700">{formatCurrency(retirementResults.fvExistingCorpus)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">From Ongoing Investments</span>
                            <span className="font-bold text-slate-700">{formatCurrency(retirementResults.fvOngoingInvestments)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900 p-6 rounded-2xl text-white space-y-4">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Corpus Shortfall</p>
                          <h4 className="text-2xl font-black text-rose-400">{formatCurrency(retirementResults.shortfall)}</h4>
                        </div>
                        
                        {retirementResults.shortfall > 0 ? (
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Addl. Monthly SIP</p>
                              <p className="text-lg font-bold text-emerald-400">{formatCurrency(retirementResults.additionalSip)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Step-Up SIP ({retirementStepUp}%)</p>
                              <p className="text-lg font-bold text-amber-400">{formatCurrency(retirementResults.additionalStepUpSip)}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">OR One-time Lumpsum</p>
                              <p className="text-lg font-bold text-blue-400">{formatCurrency(retirementResults.additionalLumpsum)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-emerald-400">
                            <ShieldCheck size={16} />
                            <p className="text-xs font-bold">You are on track for your retirement!</p>
                          </div>
                        )}
                      </div>

                      <AIRecommendation 
                        calculatorType="Retirement Readiness"
                        inputs={{ currentAge, retirementAge, monthlyExpenses, inflation, preRetirementReturn, postRetirementReturn, existingCorpus, ongoingInvestments }}
                        results={retirementResults}
                      />

                      <ExportButtons 
                        title="Retirement Calculator"
                        onDownload={handleDownloadCalculatorReport}
                        inputs={[
                          ["Current Age", currentAge.toString()],
                          ["Retirement Age", retirementAge.toString()],
                          ["Monthly Expenses", formatCurrency(monthlyExpenses)],
                          ["Inflation", `${inflation}%`]
                        ]}
                        results={[
                          ["Future Monthly Exp", formatCurrency(retirementResults.futureMonthlyExpense)],
                          ["Required Corpus", formatCurrency(retirementResults.corpusRequired)],
                          ["Shortfall", formatCurrency(retirementResults.shortfall)],
                          ["Addl. Monthly SIP", formatCurrency(retirementResults.additionalSip)]
                        ]}
                      />

                      <div className="flex items-center gap-3 p-4 bg-amber-100/50 rounded-xl text-amber-800 text-[10px] leading-relaxed">
                        <Clock size={16} className="shrink-0" />
                        <p>Calculations assume {preRetirementReturn}% return on investments during the accumulation phase and {postRetirementReturn}% during the withdrawal phase.</p>
                      </div>

                      <div className="pt-6 border-t border-amber-200 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <ShieldCheck size={14} className="text-amber-500" />
                          Verified Calculation
                        </div>
                        <button 
                          onClick={() => handleDownloadCalculatorReport(
                            "Retirement Calculator",
                            [
                              ["Current Age", `${currentAge}y`],
                              ["Retirement Age", `${retirementAge}y`],
                              ["Monthly Expense", formatCurrency(monthlyExpenses)],
                              ["Inflation", `${inflation}%`],
                              ["Pre-Retirement Return", `${preRetirementReturn}%`],
                              ["Post-Retirement Return", `${postRetirementReturn}%`]
                            ],
                            [
                              ["Corpus Required", formatCurrency(retirementResults.corpusRequired)],
                              ["Projected Corpus", formatCurrency(retirementResults.totalProjectedCorpus)],
                              ["Shortfall", formatCurrency(retirementResults.shortfall)],
                              ["Addl. Monthly SIP", formatCurrency(retirementResults.additionalSip)]
                            ]
                          )}
                          disabled={isDownloading}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
                        >
                          <Download size={14} />
                          {isDownloading ? 'Generating...' : 'Download Report'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Fund Calculator */}
              {activeCalc === 'emergency' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Emergency Fund Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Monthly Essential Expenses</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="number"
                            value={monthlyExpEF} onChange={(e) => setMonthlyExpEF(Number(e.target.value))}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <PrecisionInput 
                          label="Months of Coverage"
                          value={monthsCoverage}
                          onChange={setMonthsCoverage}
                          min={1}
                          max={24}
                          step={1}
                          suffix="Months"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-3xl p-8 flex flex-col justify-center items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-purple-100 mb-4">
                      <ShieldCheck size={40} className="text-purple-600" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Recommended Emergency Fund</p>
                      <h4 className="text-4xl font-black text-slate-900">{formatCurrency(efResults.target)}</h4>
                      <p className="text-sm text-slate-500 max-w-xs">
                        This amount should be kept in highly liquid assets like Savings Account or Liquid Mutual Funds.
                      </p>
                    </div>
                    
                    <div className="w-full bg-white p-6 rounded-2xl border border-purple-100 space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Monthly Expenses</span>
                        <span className="font-bold text-slate-900">{formatCurrency(monthlyExpEF)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Safety Multiplier</span>
                        <span className="font-bold text-slate-900">{monthsCoverage}x</span>
                      </div>
                    </div>

                    <AIRecommendation 
                      calculatorType="Emergency Fund"
                      inputs={{ monthly: monthlyExpEF, months: monthsCoverage }}
                      results={efResults}
                    />

                    <ExportButtons 
                      title="Emergency Fund Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Monthly Expenses", formatCurrency(monthlyExpEF)],
                        ["Coverage Months", `${monthsCoverage} Months`]
                      ]}
                      results={[
                        ["Target Emergency Fund", formatCurrency(efResults.target)]
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* FD Calculator */}
              {activeCalc === 'fd' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                        <PiggyBank size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Fixed Deposit Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <PrecisionInput 
                        label="Principal Amount"
                        value={fdAmount}
                        onChange={setFdAmount}
                        min={5000}
                        max={10000000}
                        step={5000}
                        prefix="₹"
                      />
                      <PrecisionInput 
                        label="Interest Rate (% p.a)"
                        value={fdRate}
                        onChange={setFdRate}
                        min={1}
                        max={15}
                        step={0.1}
                        suffix="%"
                      />
                      <PrecisionInput 
                        label="Tenure (Years)"
                        value={fdYears}
                        onChange={setFdYears}
                        min={1}
                        max={20}
                        step={1}
                        suffix="Y"
                      />
                      <PrecisionInput 
                        label="Tax Rate (%)"
                        value={fdTaxRate}
                        onChange={setFdTaxRate}
                        min={0}
                        max={50}
                        step={1}
                        suffix="%"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Principal Amount</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(fdAmount)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interest Earned (Pre-tax)</p>
                        <h4 className="text-2xl font-bold text-orange-600">{formatCurrency(fdResults.interestEarned)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tax Amount ({fdTaxRate}%)</p>
                        <h4 className="text-2xl font-bold text-rose-600">{formatCurrency(fdResults.taxAmount)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maturity Value (Pre-tax)</p>
                            <h4 className="text-xl font-bold text-slate-400 line-through">{formatCurrency(fdResults.maturityAmount)}</h4>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maturity Value (Post-tax)</p>
                            <h4 className="text-3xl font-black text-slate-900">{formatCurrency(fdResults.postTaxMaturityAmount)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={fdResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {fdResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <AIRecommendation 
                      calculatorType="Fixed Deposit"
                      inputs={{ principal: fdAmount, rate: fdRate, tenure: fdYears, taxRate: fdTaxRate }}
                      results={fdResults}
                    />

                    <ExportButtons 
                      title="Fixed Deposit Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Principal Amount", formatCurrency(fdAmount)],
                        ["Interest Rate", `${fdRate}%`],
                        ["Tenure", `${fdYears} Years`],
                        ["Tax Rate", `${fdTaxRate}%`]
                      ]}
                      results={[
                        ["Interest Earned", formatCurrency(fdResults.interestEarned)],
                        ["Tax Amount", formatCurrency(fdResults.taxAmount)],
                        ["Maturity Value (Pre-tax)", formatCurrency(fdResults.maturityAmount)],
                        ["Maturity Value (Post-tax)", formatCurrency(fdResults.postTaxMaturityAmount)]
                      ]}
                    />
                  </div>
                  <SchemeInfo type="fd" />
                </div>
              )}

              {/* Step-up SIP Calculator */}
              {activeCalc === 'stepup_sip' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                        <TrendingUp size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Step-up SIP Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <PrecisionInput 
                        label="Monthly Investment"
                        value={stepUpMonthly}
                        onChange={setStepUpMonthly}
                        min={500}
                        max={100000}
                        step={500}
                        prefix="₹"
                      />
                      <PrecisionInput 
                        label="Annual Step-up (%)"
                        value={stepUpPercent}
                        onChange={setStepUpPercent}
                        min={1}
                        max={25}
                        step={1}
                        suffix="%"
                      />
                      <PrecisionInput 
                        label="Expected Return Rate (p.a)"
                        value={stepUpRate}
                        onChange={setStepUpRate}
                        min={1}
                        max={30}
                        step={0.5}
                        suffix="%"
                      />
                      <PrecisionInput 
                        label="Time Period (Years)"
                        value={stepUpYears}
                        onChange={setStepUpYears}
                        min={1}
                        max={40}
                        step={1}
                        suffix="Y"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Invested</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(stepUpResults.totalInvested)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Est. Returns</p>
                        <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(stepUpResults.returns)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value</p>
                        <h4 className="text-3xl font-black text-slate-900">{formatCurrency(stepUpResults.totalValue)}</h4>
                      </div>
                    </div>
                    
                    <AIRecommendation 
                      calculatorType="Step-up SIP"
                      inputs={{ monthly: stepUpMonthly, stepUp: stepUpPercent, rate: stepUpRate, tenure: stepUpYears }}
                      results={stepUpResults}
                    />

                    <ExportButtons 
                      title="Step-up SIP Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Monthly Investment", formatCurrency(stepUpMonthly)],
                        ["Annual Step-up", `${stepUpPercent}%`],
                        ["Expected Return", `${stepUpRate}%`],
                        ["Tenure", `${stepUpYears} Years`]
                      ]}
                      results={[
                        ["Total Invested", formatCurrency(stepUpResults.totalInvested)],
                        ["Estimated Returns", formatCurrency(stepUpResults.returns)],
                        ["Total Value", formatCurrency(stepUpResults.totalValue)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stepUpResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {stepUpResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* SWP Calculator */}
              {activeCalc === 'swp' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <ArrowRight size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">SWP Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Total Investment</label>
                          <span className="text-sm font-bold text-indigo-600">{formatCurrency(swpTotal)}</span>
                        </div>
                        <input 
                          type="range" min="100000" max="10000000" step="50000"
                          value={swpTotal} onChange={(e) => setSwpTotal(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Withdrawal Amount</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="number"
                              value={swpWithdrawal} onChange={(e) => setSwpWithdrawal(Number(e.target.value))}
                              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Frequency</label>
                          <select 
                            value={swpFrequency}
                            onChange={(e) => setSwpFrequency(e.target.value as any)}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="half-yearly">Half-Yearly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Deferment (Years)</label>
                          <input 
                            type="number"
                            value={swpDefermentYears} onChange={(e) => setSwpDefermentYears(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                            min="0"
                            max="30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Withdrawal Period (Yrs)</label>
                          <input 
                            type="number"
                            value={swpYears} onChange={(e) => setSwpYears(Number(e.target.value))}
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                            min="1"
                            max="50"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Expected Return Rate (p.a)</label>
                          <span className="text-sm font-bold text-indigo-600">{swpRate}%</span>
                        </div>
                        <input 
                          type="range" min="1" max="20" step="0.5"
                          value={swpRate} onChange={(e) => setSwpRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      {swpDefermentYears > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Corpus at Start of Withdrawal</p>
                          <h4 className="text-xl font-bold text-indigo-600">{formatCurrency(swpResults.corpusAtStart)}</h4>
                          <p className="text-[10px] text-slate-500 italic">After {swpDefermentYears} years of growth</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Withdrawal</p>
                        <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(swpResults.totalWithdrawal)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Final Balance</p>
                        <h4 className="text-3xl font-black text-slate-900">{formatCurrency(swpResults.finalBalance)}</h4>
                      </div>
                    </div>

                    <AIRecommendation 
                      calculatorType="SWP"
                      inputs={{ corpus: swpTotal, withdrawal: swpWithdrawal, rate: swpRate, tenure: swpYears }}
                      results={swpResults}
                    />

                    <ExportButtons 
                      title="SWP Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Total Investment", formatCurrency(swpTotal)],
                        ["Monthly Withdrawal", formatCurrency(swpWithdrawal)],
                        ["Expected Return", `${swpRate}%`],
                        ["Tenure", `${swpYears} Years`]
                      ]}
                      results={[
                        ["Total Withdrawn", formatCurrency(swpResults.totalWithdrawal)],
                        ["Final Balance", formatCurrency(swpResults.finalBalance)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={swpResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {swpResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-8 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-900">Monthly Cash Flow</h4>
                      <button 
                        onClick={handleDownloadSWPExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all"
                      >
                        <Download size={14} />
                        Download Excel
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opening Balance</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Withdrawal</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gain (Interest)</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closing Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {swpResults.cashFlow.map((row) => (
                            <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-xs font-medium text-slate-600">{row.month}</td>
                              <td className="p-4 text-xs font-medium text-slate-600">{formatCurrency(row.openingBalance)}</td>
                              <td className="p-4 text-xs font-bold text-rose-600">{formatCurrency(row.withdrawal)}</td>
                              <td className="p-4 text-xs font-medium text-emerald-600">{formatCurrency(row.gain)}</td>
                              <td className="p-4 text-xs font-bold text-slate-900">{formatCurrency(row.closingBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SSY Calculator */}
              {activeCalc === 'ssy' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-pink-50 rounded-xl text-pink-600">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">SSY Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-3">Investment Frequency</label>
                        <div className="flex gap-2">
                          {(['monthly', 'quarterly', 'yearly'] as const).map(freq => (
                            <button
                              key={freq}
                              onClick={() => setSsyFrequency(freq)}
                              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl capitalize transition-all ${
                                ssyFrequency === freq 
                                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Investment Amount</label>
                          <span className="text-sm font-bold text-pink-600">{formatCurrency(ssyInvestment)}</span>
                        </div>
                        <input 
                          type="range" min={ssyFrequency === 'monthly' ? 500 : ssyFrequency === 'quarterly' ? 1500 : 1000} 
                          max={ssyFrequency === 'monthly' ? 12500 : ssyFrequency === 'quarterly' ? 37500 : 150000} 
                          step={ssyFrequency === 'monthly' ? 100 : ssyFrequency === 'quarterly' ? 500 : 1000}
                          value={ssyInvestment} onChange={(e) => setSsyInvestment(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Girl Child Age</label>
                          <span className="text-sm font-bold text-pink-600">{ssyAge}y</span>
                        </div>
                        <input 
                          type="range" min="0" max="10" step="1"
                          value={ssyAge} onChange={(e) => setSsyAge(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
                        />
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Current Interest Rate</span>
                          <span className="font-bold text-slate-900">{ssyRate}% p.a</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Invested</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(ssyResults.totalInvested)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interest Earned</p>
                        <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(ssyResults.interestEarned)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maturity Value (at 21y)</p>
                        <h4 className="text-3xl font-black text-slate-900">{formatCurrency(ssyResults.maturityAmount)}</h4>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Maturity Year</p>
                            <p className="text-lg font-bold text-pink-600">{ssyResults.maturityYear}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Girl's Age</p>
                            <p className="text-lg font-bold text-pink-600">{ssyResults.maturityAge}y</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ssyResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {ssyResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <SchemeInfo type="ssy" />
                </div>
              )}

              {/* NPS Calculator */}
              {activeCalc === 'nps' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
                        <Briefcase size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">NPS Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-3">Investment Frequency</label>
                        <div className="flex gap-2">
                          {(['monthly', 'quarterly', 'yearly'] as const).map(freq => (
                            <button
                              key={freq}
                              onClick={() => setNpsFrequency(freq)}
                              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl capitalize transition-all ${
                                npsFrequency === freq 
                                  ? 'bg-blue-700 text-white shadow-lg shadow-blue-200' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Investment Amount</label>
                          <span className="text-sm font-bold text-blue-700">{formatCurrency(npsInvestment)}</span>
                        </div>
                        <input 
                          type="range" min="500" max="150000" step="500"
                          value={npsInvestment} onChange={(e) => setNpsInvestment(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Expected Return (%)</label>
                          <span className="text-sm font-bold text-blue-700">{npsRate}%</span>
                        </div>
                        <input 
                          type="range" min="1" max="15" step="0.5"
                          value={npsRate} onChange={(e) => setNpsRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Current Age</label>
                          <span className="text-sm font-bold text-blue-700">{npsAge}y</span>
                        </div>
                        <input 
                          type="range" min="18" max="85" step="1"
                          value={npsAge} onChange={(e) => setNpsAge(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Retirement Age</label>
                          <span className="text-sm font-bold text-blue-700">{npsRetirementAge}y</span>
                        </div>
                        <input 
                          type="range" min="60" max="85" step="1"
                          value={npsRetirementAge} onChange={(e) => setNpsRetirementAge(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Annuity Percentage (%)</label>
                          <span className="text-sm font-bold text-blue-700">{npsAnnuity}%</span>
                        </div>
                        <input 
                          type="range" min="20" max="100" step="1"
                          value={npsAnnuity} onChange={(e) => setNpsAnnuity(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Min 20% required for annuity (if corpus &gt; ₹8L)</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Annuity Rate (%)</label>
                          <span className="text-sm font-bold text-blue-700">{npsAnnuityRate}%</span>
                        </div>
                        <input 
                          type="range" min="1" max="15" step="0.5"
                          value={npsAnnuityRate} onChange={(e) => setNpsAnnuityRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Corpus</p>
                        <h4 className="text-3xl font-black text-slate-900">{formatCurrency(npsResults.totalCorpus)}</h4>
                        {npsResults.isFullWithdrawalAllowed && npsResults.totalCorpus > 0 && (
                          <p className="text-[10px] text-emerald-600 font-bold">100% Tax-free withdrawal allowed (Corpus &le; ₹8L)</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lumpsum ({100 - npsAnnuity}%)</p>
                          <h4 className="text-lg font-bold text-emerald-600">{formatCurrency(npsResults.lumpSumAmount)}</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Annuity ({npsAnnuity}%)</p>
                          <h4 className="text-lg font-bold text-blue-600">{formatCurrency(npsResults.annuityAmount)}</h4>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Pension</p>
                        <h4 className="text-2xl font-black text-blue-700">{formatCurrency(npsResults.monthlyPension)}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Based on {npsAnnuityRate}% annuity rate</p>
                      </div>
                    </div>

                    <AIRecommendation 
                      calculatorType="NPS"
                      inputs={{ monthly: npsInvestment, frequency: npsFrequency, rate: npsRate, age: npsAge, retirementAge: npsRetirementAge, annuity: npsAnnuity, annuityRate: npsAnnuityRate }}
                      results={npsResults}
                    />

                    <ExportButtons 
                      title="NPS Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Monthly Investment", formatCurrency(npsInvestment)],
                        ["Current Age", npsAge.toString()],
                        ["Annuity Percent", `${npsAnnuity}%`],
                        ["Expected Return", `${npsRate}%`]
                      ]}
                      results={[
                        ["Total Corpus", formatCurrency(npsResults.totalCorpus)],
                        ["Lumpsum Amount", formatCurrency(npsResults.lumpSumAmount)],
                        ["Annuity Amount", formatCurrency(npsResults.annuityAmount)],
                        ["Monthly Pension", formatCurrency(npsResults.monthlyPension)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={npsResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {npsResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <SchemeInfo type="nps" />
                </div>
              )}

              {/* PPF Calculator */}
              {activeCalc === 'ppf' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                        <PiggyBank size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">PPF Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-3">Investment Frequency</label>
                        <div className="flex gap-2">
                          {(['monthly', 'quarterly', 'yearly'] as const).map(freq => (
                            <button
                              key={freq}
                              onClick={() => setPpfFrequency(freq)}
                              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl capitalize transition-all ${
                                ppfFrequency === freq 
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {freq}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Investment Amount</label>
                          <span className="text-sm font-bold text-emerald-600">{formatCurrency(ppfInvestment)}</span>
                        </div>
                        <input 
                          type="range" min={ppfFrequency === 'monthly' ? 500 : ppfFrequency === 'quarterly' ? 1500 : 1000} 
                          max={ppfFrequency === 'monthly' ? 12500 : ppfFrequency === 'quarterly' ? 37500 : 150000} 
                          step={ppfFrequency === 'monthly' ? 100 : ppfFrequency === 'quarterly' ? 500 : 1000}
                          value={ppfInvestment} onChange={(e) => setPpfInvestment(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-500">Interest Rate</span>
                          <span className="font-bold text-slate-900">{ppfRate}% p.a</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Lock-in Period</span>
                          <span className="font-bold text-slate-900">{ppfYears} Years</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Invested</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(ppfResults.totalInvested)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interest Earned</p>
                        <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(ppfResults.interestEarned)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maturity Value</p>
                        <h4 className="text-3xl font-black text-slate-900">{formatCurrency(ppfResults.maturityAmount)}</h4>
                      </div>
                    </div>

                    <AIRecommendation 
                      calculatorType="PPF"
                      inputs={{ annual: ppfInvestment, frequency: ppfFrequency, rate: 7.1, tenure: 15 }}
                      results={ppfResults}
                    />

                    <ExportButtons 
                      title="PPF Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Investment", formatCurrency(ppfInvestment)],
                        ["Frequency", ppfFrequency],
                        ["Interest Rate", `${ppfRate}%`]
                      ]}
                      results={[
                        ["Total Invested", formatCurrency(ppfResults.totalInvested)],
                        ["Interest Earned", formatCurrency(ppfResults.interestEarned)],
                        ["Maturity Value", formatCurrency(ppfResults.maturityAmount)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={ppfResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {ppfResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <SchemeInfo type="ppf" />
                </div>
              )}

              {/* EPF Calculator */}
              {activeCalc === 'epf' && (
                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-1 space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                        <Briefcase size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">EPF Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Monthly Basic + DA</label>
                          <span className="text-sm font-bold text-slate-700">{formatCurrency(epfBasic)}</span>
                        </div>
                        <input 
                          type="range" min="5000" max="200000" step="1000"
                          value={epfBasic} onChange={(e) => setEpfBasic(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Current EPF Balance</label>
                          <span className="text-sm font-bold text-slate-700">{formatCurrency(epfCurrentBalance)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="5000000" step="10000"
                          value={epfCurrentBalance} onChange={(e) => setEpfCurrentBalance(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-700"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700">Current Age</label>
                            <span className="text-xs font-bold text-slate-700">{epfAge}y</span>
                          </div>
                          <input 
                            type="range" min="18" max="57" step="1"
                            value={epfAge} onChange={(e) => setEpfAge(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-700"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700">Salary Growth</label>
                            <span className="text-xs font-bold text-slate-700">{epfSalaryGrowth}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="20" step="1"
                            value={epfSalaryGrowth} onChange={(e) => setEpfSalaryGrowth(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-700"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Voluntary PF (VPF)</label>
                          <span className="text-sm font-bold text-slate-700">{epfVpfPercent}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="88" step="1"
                          value={epfVpfPercent} onChange={(e) => setEpfVpfPercent(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-700"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Additional contribution over mandatory 12%</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-500">Interest Rate</span>
                          <span className="font-bold text-slate-900">{epfRate}% p.a</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Mandatory Contribution</span>
                          <span className="font-bold text-slate-900">12% (Employee)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900 rounded-3xl p-8 text-white">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Retirement Corpus</p>
                        <h4 className="text-4xl font-black mb-6">{formatCurrency(epfResults.totalCorpus)}</h4>

                        <AIRecommendation 
                          calculatorType="EPF"
                          inputs={{ basic: epfBasic, age: epfAge, balance: epfCurrentBalance, growth: epfSalaryGrowth, vpf: epfVpfPercent, retirementAge: 58 }}
                          results={epfResults}
                          variant="dark"
                        />

                        <ExportButtons 
                          title="EPF Calculator"
                          onDownload={handleDownloadCalculatorReport}
                          variant="dark"
                          inputs={[
                            ["Monthly Basic", formatCurrency(epfBasic)],
                            ["Current Age", epfAge.toString()],
                            ["VPF Percent", `${epfVpfPercent}%`],
                            ["Exp. Salary Growth", `${epfSalaryGrowth}%`]
                          ]}
                          results={[
                            ["Retirement Corpus", formatCurrency(epfResults.totalCorpus)],
                            ["Employee Share", formatCurrency(epfResults.totalEmployeeContribution)],
                            ["Employer Share", formatCurrency(epfResults.totalEmployerContribution)]
                          ]}
                        />
                        
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly Pension</p>
                            <p className="text-xl font-bold text-emerald-400">{formatCurrency(epfResults.monthlyPension)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Interest</p>
                            <p className="text-xl font-bold">{formatCurrency(epfResults.totalInterest)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-6 border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contribution Breakdown</p>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={epfResults.chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {epfResults.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="font-bold text-slate-900">Yearly Growth Projection</h4>
                        <span className="text-xs text-slate-400">Retirement at 58y</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                            <tr>
                              <th className="px-6 py-4">Year</th>
                              <th className="px-6 py-4">Age</th>
                              <th className="px-6 py-4">Basic + DA</th>
                              <th className="px-6 py-4 text-right">EPF Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {epfResults.yearlyData.filter((_, i) => i % 5 === 0 || i === epfResults.yearlyData.length - 1).map((row) => (
                              <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium">{row.year}</td>
                                <td className="px-6 py-4">{row.age}y</td>
                                <td className="px-6 py-4">{formatCurrency(row.basic)}</td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(row.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <SchemeInfo type="epf" />
                </div>
              )}

              {/* RD Calculator */}
              {activeCalc === 'rd' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                        <PiggyBank size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">RD Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Monthly Deposit</label>
                          <span className="text-sm font-bold text-orange-600">{formatCurrency(rdMonthly)}</span>
                        </div>
                        <input 
                          type="range" min="500" max="100000" step="500"
                          value={rdMonthly} onChange={(e) => setRdMonthly(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Interest Rate (%)</label>
                          <span className="text-sm font-bold text-orange-600">{rdRate}%</span>
                        </div>
                        <input 
                          type="range" min="1" max="15" step="0.1"
                          value={rdRate} onChange={(e) => setRdRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Tenure (Years)</label>
                          <span className="text-sm font-bold text-orange-600">{rdYears}y</span>
                        </div>
                        <input 
                          type="range" min="1" max="10" step="1"
                          value={rdYears} onChange={(e) => setRdYears(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Tax Rate (%)</label>
                          <span className="text-sm font-bold text-orange-600">{rdTaxRate}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="50" step="1"
                          value={rdTaxRate} onChange={(e) => setRdTaxRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Invested</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(rdResults.totalInvested)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interest Earned (Pre-tax)</p>
                        <h4 className="text-2xl font-bold text-orange-600">{formatCurrency(rdResults.interestEarned)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tax Amount ({rdTaxRate}%)</p>
                        <h4 className="text-2xl font-bold text-rose-600">{formatCurrency(rdResults.taxAmount)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maturity Value (Pre-tax)</p>
                            <h4 className="text-xl font-bold text-slate-400 line-through">{formatCurrency(rdResults.maturityAmount)}</h4>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maturity Value (Post-tax)</p>
                            <h4 className="text-3xl font-black text-slate-900">{formatCurrency(rdResults.postTaxMaturityAmount)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    <AIRecommendation 
                      calculatorType="Recurring Deposit"
                      inputs={{ monthly: rdMonthly, rate: rdRate, tenure: rdYears, taxRate: rdTaxRate }}
                      results={rdResults}
                    />

                    <ExportButtons 
                      title="RD Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Monthly Deposit", formatCurrency(rdMonthly)],
                        ["Interest Rate", `${rdRate}%`],
                        ["Tenure", `${rdYears} Years`],
                        ["Tax Rate", `${rdTaxRate}%`]
                      ]}
                      results={[
                        ["Total Invested", formatCurrency(rdResults.totalInvested)],
                        ["Interest (Pre-tax)", formatCurrency(rdResults.interestEarned)],
                        ["Tax Amount", formatCurrency(rdResults.taxAmount)],
                        ["Maturity (Post-tax)", formatCurrency(rdResults.postTaxMaturityAmount)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={rdResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {rdResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <SchemeInfo type="rd" />
                </div>
              )}

              {/* SCSS Calculator */}
              {activeCalc === 'scss' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">SCSS Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Investment Amount</label>
                          <span className="text-sm font-bold text-indigo-600">{formatCurrency(scssAmount)}</span>
                        </div>
                        <input 
                          type="range" min="1000" max="3000000" step="1000"
                          value={scssAmount} onChange={(e) => setScssAmount(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Maximum limit: ₹30 Lakhs</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Interest Rate (% p.a)</label>
                          <span className="text-sm font-bold text-indigo-600">{scssRate}%</span>
                        </div>
                        <input 
                          type="range" min="1" max="15" step="0.1"
                          value={scssRate} onChange={(e) => setScssRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Tenure (Years)</label>
                          <span className="text-sm font-bold text-indigo-600">{scssYears}y</span>
                        </div>
                        <input 
                          type="range" min="5" max="8" step="1"
                          value={scssYears} onChange={(e) => setScssYears(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Standard: 5 years, Extendable by 3 years</p>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Tax Rate (%)</label>
                          <span className="text-sm font-bold text-indigo-600">{scssTaxRate}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="50" step="1"
                          value={scssTaxRate} onChange={(e) => setScssTaxRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Principal Amount</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(scssAmount)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quarterly Interest Payout</p>
                        <h4 className="text-2xl font-bold text-indigo-600">{formatCurrency(scssResults.quarterlyInterest)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Interest Earned (Pre-tax)</p>
                        <h4 className="text-2xl font-bold text-indigo-600">{formatCurrency(scssResults.interestEarned)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tax Amount ({scssTaxRate}%)</p>
                        <h4 className="text-2xl font-bold text-rose-600">{formatCurrency(scssResults.taxAmount)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value (Pre-tax)</p>
                            <h4 className="text-xl font-bold text-slate-400 line-through">{formatCurrency(scssResults.totalValue)}</h4>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value (Post-tax)</p>
                            <h4 className="text-3xl font-black text-slate-900">{formatCurrency(scssResults.postTaxTotalValue)}</h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    <ExportButtons 
                      title="SCSS Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Principal Amount", formatCurrency(scssAmount)],
                        ["Interest Rate", `${scssRate}%`],
                        ["Tenure", `${scssYears} Years`],
                        ["Tax Rate", `${scssTaxRate}%`]
                      ]}
                      results={[
                        ["Quarterly Interest", formatCurrency(scssResults.quarterlyInterest)],
                        ["Interest (Pre-tax)", formatCurrency(scssResults.interestEarned)],
                        ["Tax Amount", formatCurrency(scssResults.taxAmount)],
                        ["Total (Post-tax)", formatCurrency(scssResults.postTaxTotalValue)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={scssResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {scssResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <SchemeInfo type="scss" />
                </div>
              )}

              {/* Post Office MIS */}
              {activeCalc === 'pomis' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                        <Landmark size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Post Office MIS</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Investment Amount</label>
                          <span className="text-sm font-bold text-orange-600">{formatCurrency(pomisAmount)}</span>
                        </div>
                        <input 
                          type="range" min="1000" max={pomisAccountType === 'single' ? 900000 : 1500000} step="1000"
                          value={pomisAmount} onChange={(e) => setPomisAmount(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
                        />
                        <div className="flex justify-between mt-1">
                          <p className="text-[10px] text-slate-400">Min: ₹1,000</p>
                          <p className="text-[10px] text-slate-400">Max: {pomisAccountType === 'single' ? '₹9 Lakh' : '₹15 Lakh'}</p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-3">Account Type</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              setPomisAccountType('single');
                              if (pomisAmount > 900000) setPomisAmount(900000);
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              pomisAccountType === 'single' 
                                ? 'bg-orange-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Single
                          </button>
                          <button
                            onClick={() => setPomisAccountType('joint')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              pomisAccountType === 'joint' 
                                ? 'bg-orange-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Joint
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Interest Rate</span>
                          <span className="font-bold text-slate-900">{pomisRate}% p.a.</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tenure</span>
                          <span className="font-bold text-slate-900">{pomisYears} Years</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Income</p>
                        <h4 className="text-3xl font-black text-orange-600">{formatCurrency(pomisResults.monthlyPayout)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Interest Earned</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(pomisResults.totalInterest)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maturity Amount</p>
                          <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(pomisAmount)}</h4>
                          <p className="text-[10px] text-slate-400">(Principal is returned at maturity)</p>
                        </div>
                      </div>
                    </div>

                    <ExportButtons 
                      title="Post Office MIS"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Principal Amount", formatCurrency(pomisAmount)],
                        ["Account Type", pomisAccountType],
                        ["Interest Rate", `${pomisRate}%`]
                      ]}
                      results={[
                        ["Monthly Payout", formatCurrency(pomisResults.monthlyPayout)],
                        ["Total Interest", formatCurrency(pomisResults.totalInterest)],
                        ["Maturity Amount", formatCurrency(pomisAmount)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pomisResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pomisResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <SchemeInfo type="pomis" />
                </div>
              )}

              {/* RBI Savings Bonds */}
              {activeCalc === 'rbi_bonds' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-800">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">RBI Savings Bonds</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Investment Amount</label>
                          <span className="text-sm font-bold text-blue-800">{formatCurrency(rbiAmount)}</span>
                        </div>
                        <input 
                          type="range" min="1000" max="10000000" step="1000"
                          value={rbiAmount} onChange={(e) => setRbiAmount(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-800"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Minimum: ₹1,000 | No Maximum Limit</p>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-3">Interest Option</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setRbiType('non-cumulative')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              rbiType === 'non-cumulative' 
                                ? 'bg-blue-800 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Non-Cumulative
                          </button>
                          <button
                            onClick={() => setRbiType('cumulative')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              rbiType === 'cumulative' 
                                ? 'bg-blue-800 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Cumulative
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {rbiType === 'non-cumulative' 
                            ? 'Interest is paid out half-yearly.' 
                            : 'Interest is compounded half-yearly and paid at maturity.'}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Current Interest Rate</span>
                          <span className="font-bold text-slate-900">{rbiRate}% p.a.</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tenure</span>
                          <span className="font-bold text-slate-900">{rbiYears} Years</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Rate is floating and resets every 6 months (NSC + 0.35%)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      {rbiType === 'non-cumulative' && (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Half-Yearly Payout</p>
                          <h4 className="text-3xl font-black text-blue-800">{formatCurrency(rbiResults.halfYearlyPayout)}</h4>
                        </div>
                      )}
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Interest Earned</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(rbiResults.totalInterest)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maturity Value</p>
                          <h4 className="text-3xl font-black text-slate-900">{formatCurrency(rbiResults.maturityAmount)}</h4>
                        </div>
                      </div>
                    </div>

                    <ExportButtons 
                      title="RBI Savings Bonds"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Principal Amount", formatCurrency(rbiAmount)],
                        ["Interest Option", rbiType],
                        ["Interest Rate", `${rbiRate}%`]
                      ]}
                      results={[
                        ["Half-Yearly Payout", rbiType === 'non-cumulative' ? formatCurrency(rbiResults.halfYearlyPayout) : 'NA'],
                        ["Total Interest", formatCurrency(rbiResults.totalInterest)],
                        ["Maturity Value", formatCurrency(rbiResults.maturityAmount)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={rbiResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {rbiResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <SchemeInfo type="rbi_bonds" />
                </div>
              )}

              {/* Gratuity Calculator */}
              {activeCalc === 'gratuity' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <Briefcase size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Gratuity Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Monthly Basic + DA</label>
                          <span className="text-sm font-bold text-indigo-600">{formatCurrency(gratuitySalary)}</span>
                        </div>
                        <input 
                          type="range" min="10000" max="1000000" step="5000"
                          value={gratuitySalary} onChange={(e) => setGratuitySalary(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Years of Service</label>
                          <span className="text-sm font-bold text-indigo-600">{gratuityYears}y</span>
                        </div>
                        <input 
                          type="range" min="1" max="50" step="0.5"
                          value={gratuityYears} onChange={(e) => setGratuityYears(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-3">
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <span className="font-bold">Eligibility:</span> Gratuity is payable to an employee who has rendered continuous service for at least 5 years.
                        {!gratuityResults.isEligible && (
                          <span className="block mt-2 text-rose-600 font-bold">
                            Current tenure is less than 5 years. You may not be eligible for gratuity yet.
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <span className="font-bold">Max Limit:</span> The maximum gratuity amount payable is ₹20 Lakhs as per current regulations.
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <span className="font-bold">Tax Exemption:</span> For private sector employees, the least of the following is exempt from tax:
                        <span className="block mt-1 ml-2">• Actual gratuity received</span>
                        <span className="block ml-2">• ₹20,00,000</span>
                        <span className="block ml-2">• 15 days' salary for each year of service</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Gratuity</p>
                        <h4 className="text-4xl font-black text-indigo-600">{formatCurrency(gratuityResults.amount)}</h4>
                        {gratuityResults.isCapped && (
                          <p className="text-[10px] text-rose-600 font-bold">Capped at maximum limit of {formatCurrency(gratuityResults.maxLimit)}</p>
                        )}
                      </div>
                      
                      <div className="pt-4 border-t border-slate-200 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Service Tenure (Rounded)</span>
                          <span className="text-sm font-bold text-slate-900">{gratuityResults.tenure} Years</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Last Drawn Salary (Basic + DA)</span>
                          <span className="text-sm font-bold text-slate-900">{formatCurrency(gratuitySalary)}</span>
                        </div>
                        {gratuityResults.isCapped && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-500">Calculated Amount (Uncapped)</span>
                            <span className="text-sm font-bold text-slate-400 line-through">{formatCurrency(gratuityResults.rawAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-8 p-4 bg-white rounded-2xl border border-slate-200">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Formula Used</p>
                      <p className="text-xs text-slate-600 font-mono">
                        (15 * Last Drawn Salary * Tenure) / 26
                      </p>
                    </div>

                    <AIRecommendation 
                      calculatorType="Gratuity"
                      inputs={{ salary: gratuitySalary, years: gratuityYears }}
                      results={{ amount: gratuityResults.amount }}
                    />

                    <ExportButtons 
                      title="Gratuity Report"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Monthly Basic + DA", formatCurrency(gratuitySalary)],
                        ["Years of Service", `${gratuityYears}y`]
                      ]}
                      results={[
                        ["Estimated Gratuity", formatCurrency(gratuityResults.amount)],
                        ["Eligibility Status", gratuityResults.isEligible ? "Eligible" : "Not Eligible"],
                        ["Calculated Tenure", `${gratuityResults.tenure} Years`]
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* HRA Calculator */}
              {activeCalc === 'hra' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                        <Landmark size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">HRA Exemption Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Monthly Basic Salary</label>
                          <span className="text-sm font-bold text-emerald-600">{formatCurrency(hraBasic)}</span>
                        </div>
                        <input 
                          type="range" min="10000" max="500000" step="5000"
                          value={hraBasic} onChange={(e) => setHraBasic(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Monthly DA (if any)</label>
                          <span className="text-sm font-bold text-emerald-600">{formatCurrency(hraDA)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="200000" step="1000"
                          value={hraDA} onChange={(e) => setHraDA(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">HRA Received (Monthly)</label>
                          <span className="text-sm font-bold text-emerald-600">{formatCurrency(hraReceived)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="200000" step="1000"
                          value={hraReceived} onChange={(e) => setHraReceived(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Rent Paid (Monthly)</label>
                          <span className="text-sm font-bold text-emerald-600">{formatCurrency(hraRent)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="200000" step="1000"
                          value={hraRent} onChange={(e) => setHraRent(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                        <input 
                          type="checkbox" id="isMetro" checked={hraIsMetro} 
                          onChange={(e) => setHraIsMetro(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="isMetro" className="text-sm font-bold text-slate-700">Living in a Metro City? (Delhi, Mumbai, Kolkata, Chennai, Bengaluru)</label>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Exempt HRA</p>
                        <h4 className="text-3xl font-black text-emerald-600">{formatCurrency(hraResults.exempt)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Taxable HRA</p>
                        <h4 className="text-2xl font-bold text-rose-600">{formatCurrency(hraResults.taxable)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yearly Exemption</p>
                          <h4 className="text-xl font-bold text-slate-900">{formatCurrency(hraResults.exempt * 12)}</h4>
                        </div>
                      </div>
                    </div>

                    <AIRecommendation 
                      calculatorType="HRA Exemption"
                      inputs={{ basic: hraBasic, da: hraDA, hraReceived, rentPaid: hraRent, isMetro: hraIsMetro }}
                      results={{ exempt: hraResults.exempt, taxable: hraResults.taxable }}
                    />

                    <ExportButtons 
                      title="HRA Exemption Report"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Monthly Basic", formatCurrency(hraBasic)],
                        ["Monthly DA", formatCurrency(hraDA)],
                        ["Monthly HRA Received", formatCurrency(hraReceived)],
                        ["Monthly Rent Paid", formatCurrency(hraRent)],
                        ["Is Metro City", hraIsMetro ? "Yes" : "No"]
                      ]}
                      results={[
                        ["Monthly Exempt HRA", formatCurrency(hraResults.exempt)],
                        ["Monthly Taxable HRA", formatCurrency(hraResults.taxable)],
                        ["Total Yearly Exemption", formatCurrency(hraResults.exempt * 12)]
                      ]}
                    />

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={hraResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {hraResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <TaxRuleInfo type="hra" />
                </div>
              )}

              {/* Income Tax Calculator */}
              {activeCalc === 'income_tax' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <FileText size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Income Tax Calculator (FY 2025-26 & 2026-27)</h3>
                    </div>
                    
                    <div className="space-y-6 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Gross Annual Salary</label>
                          <span className="text-sm font-bold text-blue-600">{formatCurrency(taxGross)}</span>
                        </div>
                        <input 
                          type="range" min="200000" max="10000000" step="50000"
                          value={taxGross} onChange={(e) => setTaxGross(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Other Income (Rent, Interest, etc.)</label>
                          <span className="text-sm font-bold text-blue-600">{formatCurrency(taxOtherIncome)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="5000000" step="10000"
                          value={taxOtherIncome} onChange={(e) => setTaxOtherIncome(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Deductions (For Old Regime)</h5>
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700">Section 80C (LIC, PPF, ELSS, etc.)</label>
                              <span className="text-sm font-bold text-blue-600">{formatCurrency(tax80C)}</span>
                            </div>
                            <input 
                              type="range" min="0" max="150000" step="5000"
                              value={tax80C} onChange={(e) => setTax80C(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700">Section 80D (Health Insurance)</label>
                              <span className="text-sm font-bold text-blue-600">{formatCurrency(tax80D)}</span>
                            </div>
                            <input 
                              type="range" min="0" max="100000" step="5000"
                              value={tax80D} onChange={(e) => setTax80D(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700">HRA Exemption</label>
                              <span className="text-sm font-bold text-blue-600">{formatCurrency(taxHraExemptInput)}</span>
                            </div>
                            <input 
                              type="range" min="0" max="1000000" step="5000"
                              value={taxHraExemptInput} onChange={(e) => setTaxHraExemptInput(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700">Other Deductions (80G, 80E, etc.)</label>
                              <span className="text-sm font-bold text-blue-600">{formatCurrency(taxOtherDeductions)}</span>
                            </div>
                            <input 
                              type="range" min="0" max="500000" step="5000"
                              value={taxOtherDeductions} onChange={(e) => setTaxOtherDeductions(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="p-4 bg-blue-600 rounded-2xl text-white">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Recommended Regime</p>
                        <h4 className="text-2xl font-black">{taxResults.betterRegime}</h4>
                        <p className="text-sm mt-2">Potential savings: <span className="font-bold">{formatCurrency(taxResults.savings)}</span></p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Regime Tax</p>
                          <h4 className="text-xl font-bold text-slate-900">{formatCurrency(taxResults.totalTaxNew)}</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Old Regime Tax</p>
                          <h4 className="text-xl font-bold text-slate-900">{formatCurrency(taxResults.totalTaxOld)}</h4>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Taxable Income (New)</span>
                          <span className="font-bold text-slate-900">{formatCurrency(taxResults.taxableNew)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Taxable Income (Old)</span>
                          <span className="font-bold text-slate-900">{formatCurrency(taxResults.taxableOld)}</span>
                        </div>
                      </div>

                      <AIRecommendation 
                        calculatorType="Income Tax"
                        inputs={{ gross: taxGross, other: taxOtherIncome, c80: tax80C, d80: tax80D }}
                        results={taxResults}
                      />

                      <ExportButtons 
                        title="Income Tax Comparison"
                        onDownload={handleDownloadCalculatorReport}
                        inputs={[
                          ["Gross Salary", formatCurrency(taxGross)],
                          ["Other Income", formatCurrency(taxOtherIncome)],
                          ["80C Deductions", formatCurrency(tax80C)],
                          ["80D Deductions", formatCurrency(tax80D)]
                        ]}
                        results={[
                          ["Recommended", taxResults.betterRegime],
                          ["Tax Savings", formatCurrency(taxResults.savings)],
                          ["New Regime Tax", formatCurrency(taxResults.totalTaxNew)],
                          ["Old Regime Tax", formatCurrency(taxResults.totalTaxOld)]
                        ]}
                      />
                    </div>

                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={taxResults.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis hide />
                          <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <TaxRuleInfo type="income_tax" />
                </div>
              )}

              {/* Residency Status Calculator */}
              {activeCalc === 'residency' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                        <ShieldCheck size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Residency Status Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                          <input 
                            type="checkbox" id="isCitizen" checked={isIndianCitizen} 
                            onChange={(e) => setIsIndianCitizen(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="isCitizen" className="text-sm font-bold text-slate-700">Indian Citizen</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                          <input 
                            type="checkbox" id="isPIO" checked={isPIO} 
                            onChange={(e) => setIsPIO(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="isPIO" className="text-sm font-bold text-slate-700">PIO</label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                          <input 
                            type="checkbox" id="isLeaving" checked={isLeavingForJob} 
                            onChange={(e) => setIsLeavingForJob(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="isLeaving" className="text-sm font-bold text-slate-700">Leaving for employment abroad?</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                          <input 
                            type="checkbox" id="isCrew" checked={isCrewMember} 
                            onChange={(e) => setIsCrewMember(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="isCrew" className="text-sm font-bold text-slate-700">Member of crew of Indian ship?</label>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                          <input 
                            type="checkbox" id="isLiable" checked={isLiableToTaxOtherCountry} 
                            onChange={(e) => setIsLiableToTaxOtherCountry(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor="isLiable" className="text-sm font-bold text-slate-700">Liable to tax in another country?</label>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Indian Income (Excl. Foreign Sources)</label>
                          <span className="text-sm font-bold text-purple-600">{formatCurrency(incomeExcludingForeign)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="5000000" step="50000"
                          value={incomeExcludingForeign} onChange={(e) => setIncomeExcludingForeign(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Days in India (Current FY)</label>
                          <span className="text-sm font-bold text-purple-600">{daysCurrent} Days</span>
                        </div>
                        <input 
                          type="range" min="0" max="366" step="1"
                          value={daysCurrent} onChange={(e) => setDaysCurrent(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Days in India (Preceding 4 FYs)</label>
                          <span className="text-sm font-bold text-purple-600">{daysPrev4} Days</span>
                        </div>
                        <input 
                          type="range" min="0" max="1461" step="1"
                          value={daysPrev4} onChange={(e) => setDaysPrev4(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Additional Conditions (for ROR Status)</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                            <input 
                              type="checkbox" id="isResPrev" checked={residentInPrev2of10} 
                              onChange={(e) => setResidentInPrev2of10(e.target.checked)}
                              className="w-4 h-4 text-purple-600 bg-white border-slate-300 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="isResPrev" className="text-sm font-bold text-slate-700">Resident in 2 out of 10 preceding years?</label>
                          </div>
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700">Days in India (Preceding 7 FYs)</label>
                              <span className="text-sm font-bold text-purple-600">{daysPrev7} Days</span>
                            </div>
                            <input 
                              type="range" min="0" max="2557" step="1"
                              value={daysPrev7} onChange={(e) => setDaysPrev7(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-center">
                    <div className="text-center space-y-6">
                      <div className="inline-flex p-4 bg-white rounded-full shadow-sm mb-4">
                        <ShieldCheck size={48} className="text-purple-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Status</p>
                        <h4 className="text-3xl font-black text-slate-900 leading-tight">{residencyResults.status}</h4>
                        <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {residencyResults.category}
                        </div>
                      </div>

                      <ExportButtons 
                        title="Residency Status Report"
                        onDownload={handleDownloadCalculatorReport}
                        inputs={[
                          ["Indian Citizen", isIndianCitizen ? "Yes" : "No"],
                          ["Days Current FY", daysCurrent.toString()],
                          ["Days Prev 4 FYs", daysPrev4.toString()],
                          ["Indian Income", formatCurrency(incomeExcludingForeign)]
                        ]}
                        results={[
                          ["Final Status", residencyResults.status],
                          ["Category", residencyResults.category],
                          ["Summary", residencyResults.reason]
                        ]}
                      />

                      <div className="p-6 bg-white rounded-2xl border border-slate-200 text-left">
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {residencyResults.reason}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className={`p-3 rounded-2xl border ${residencyResults.category === 'ROR' ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 opacity-50'}`}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ROR</p>
                          <p className={`text-xs font-bold ${residencyResults.category === 'ROR' ? 'text-emerald-600' : 'text-slate-400'}`}>Resident</p>
                        </div>
                        <div className={`p-3 rounded-2xl border ${residencyResults.category === 'RNOR' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100 opacity-50'}`}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">RNOR</p>
                          <p className={`text-xs font-bold ${residencyResults.category === 'RNOR' ? 'text-amber-600' : 'text-slate-400'}`}>Resident</p>
                        </div>
                        <div className={`p-3 rounded-2xl border ${residencyResults.category === 'NR' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100 opacity-50'}`}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">NR</p>
                          <p className={`text-xs font-bold ${residencyResults.category === 'NR' ? 'text-rose-600' : 'text-slate-400'}`}>Non-Resident</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <TaxRuleInfo type="residency" />
                </div>
              )}

              {/* Cost of Delay Calculator */}
              {/* Real Estate Capital Gain Calculator */}
              {activeCalc === 'real_estate_gain' && (
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <Home size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Real Estate Capital Gain Planner</h3>
                    </div>
                    <ExportButtons 
                      title="RE Capital Gain Analysis"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ['Gain Amount', formatCurrency(reGainAmount)],
                        ['Asset Type', reIsResidential ? 'Residential House' : 'Other Asset'],
                        ['Analysis Period', `${reYears}y`]
                      ]}
                      results={[
                        ['Option 1: Reinvest in RE (FV)', formatCurrency(reResults.optionRE.futureValue)],
                        ['Option 2: Pay Tax & MF (FV)', formatCurrency(reResults.optionMF.futureValue)],
                        ['Option 3: 54EC Bonds + MF (FV)', formatCurrency(reResults.optionBonds.futureValue)]
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Capital Gain Amount</label>
                          <span className="text-sm font-bold text-indigo-600">{formatCurrency(reGainAmount)}</span>
                        </div>
                        <input 
                          type="range" min="100000" max="100000000" step="100000"
                          value={reGainAmount} onChange={(e) => setReGainAmount(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-3">Asset Type Sold</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setReIsResidential(true)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              reIsResidential 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Residential House
                          </button>
                          <button
                            onClick={() => setReIsResidential(false)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              !reIsResidential 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Other Asset (Plot/Gold)
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {reIsResidential ? 'Section 54 applies. Reinvest gain in another house.' : 'Section 54F applies. Reinvest net consideration in a house.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Tax Rate (%)</label>
                            <span className="text-sm font-bold text-indigo-600">{reTaxRate}%</span>
                          </div>
                          <input 
                            type="range" min="10" max="20" step="0.5"
                            value={reTaxRate} onChange={(e) => setReTaxRate(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Analysis Period</label>
                            <span className="text-sm font-bold text-indigo-600">{reYears}y</span>
                          </div>
                          <input 
                            type="range" min="1" max="15" step="1"
                            value={reYears} onChange={(e) => setReYears(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">RE Growth (%)</label>
                            <span className="text-sm font-bold text-indigo-600">{reExpectedReturnRE}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="15" step="0.5"
                            value={reExpectedReturnRE} onChange={(e) => setReExpectedReturnRE(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">MF/PMS Return (%)</label>
                            <span className="text-sm font-bold text-indigo-600">{reExpectedReturnMF}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="25" step="0.5"
                            value={reExpectedReturnMF} onChange={(e) => setReExpectedReturnMF(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-3xl p-8 flex flex-col space-y-8">
                      <div className="space-y-4">
                        <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Option 1: Reinvest in Real Estate</p>
                          <div className="flex justify-between items-end">
                            <div>
                              <h4 className="text-2xl font-black text-indigo-600">{formatCurrency(reResults.optionRE.futureValue)}</h4>
                              <p className="text-[10px] text-slate-500">Wealth after {reYears} years (Tax: Nil)</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-emerald-600">+{formatCurrency(reResults.optionRE.gain)}</p>
                              <p className="text-[10px] text-slate-400">Total Gain</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Option 2: Pay Tax & Invest in MF/PMS</p>
                          <div className="flex justify-between items-end">
                            <div>
                              <h4 className="text-2xl font-black text-emerald-600">{formatCurrency(reResults.optionMF.futureValue)}</h4>
                              <p className="text-[10px] text-slate-500">Wealth after {reYears} years (Tax: {formatCurrency(reResults.optionMF.tax)})</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-emerald-600">+{formatCurrency(reResults.optionMF.gain)}</p>
                              <p className="text-[10px] text-slate-400">Total Gain</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Option 3: 54EC Bonds + MF/PMS</p>
                          <div className="flex justify-between items-end">
                            <div>
                              <h4 className="text-2xl font-black text-amber-600">{formatCurrency(reResults.optionBonds.futureValue)}</h4>
                              <p className="text-[10px] text-slate-500">Wealth after {reYears} years (Tax: {formatCurrency(reResults.optionBonds.tax)})</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-emerald-600">+{formatCurrency(reResults.optionBonds.gain)}</p>
                              <p className="text-[10px] text-slate-400">Total Gain</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reResults.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8'}} />
                            <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {reResults.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <h5 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                        <ShieldCheck size={18} /> Smart Tax Planning Notes
                      </h5>
                      <ul className="space-y-3">
                        <li className="text-xs text-indigo-800 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>If your expected MF/PMS return is significantly higher than RE growth, paying tax and investing in equity might create more wealth over 5-10 years.</span>
                        </li>
                        <li className="text-xs text-indigo-800 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>Use Section 54EC bonds for the first ₹50 Lakh of gain to save tax without buying a new property. The 5-year lock-in provides steady 5.25% returns.</span>
                        </li>
                        <li className="text-xs text-indigo-800 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span>For Section 54F, ensure you don't own more than one residential house (other than the new one) at the time of sale.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <h5 className="text-sm font-bold text-emerald-900 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} /> Recommendation Analysis
                      </h5>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        {reResults.optionMF.futureValue > reResults.optionRE.futureValue 
                          ? `Analysis suggests that despite paying ${formatCurrency(reResults.optionMF.tax)} in tax, investing in MF/PMS could potentially yield ${formatCurrency(reResults.optionMF.futureValue - reResults.optionRE.futureValue)} more wealth than reinvesting in Real Estate over ${reYears} years.`
                          : `Reinvesting in Real Estate appears to be the most tax-efficient and wealth-generating option, potentially yielding ${formatCurrency(reResults.optionRE.futureValue - reResults.optionMF.futureValue)} more than the MF/PMS route.`
                        }
                      </p>
                      <div className="mt-4 pt-4 border-t border-emerald-200">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Key Insight</p>
                        <p className="text-xs text-emerald-800">
                          The "Break-even" tax rate for MF vs RE is roughly {((reExpectedReturnMF - reExpectedReturnRE) * 0.8).toFixed(1)}%. If your tax liability is below this, MF is usually better.
                        </p>
                      </div>
                    </div>
                  </div>

                    <AIRecommendation 
                      calculatorType="Real Estate Capital Gain"
                      inputs={{ gain: reGainAmount, isResidential: reIsResidential, years: reYears, returns: { re: reExpectedReturnRE, mf: reExpectedReturnMF, bonds: 5.25 } }}
                      results={reResults}
                      variant="dark"
                    />

                    <TaxRuleInfo type="real_estate" />
                </div>
              )}

              {activeCalc === 'esop' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Briefcase className="text-emerald-600" size={20} />
                        ESOP Details
                      </h4>
                      
                      <div className="space-y-6">
                        <div className="flex p-1 bg-slate-100 rounded-2xl">
                          <button 
                            onClick={() => setEsopRegion('india')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${esopRegion === 'india' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            India ESOP
                          </button>
                          <button 
                            onClick={() => setEsopRegion('global')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${esopRegion === 'global' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Global ESOP
                          </button>
                        </div>

                        {esopRegion === 'global' && (
                          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">USD to INR Rate</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input 
                                  type="number" value={usdToInr}
                                  onChange={(e) => setUsdToInr(Number(e.target.value))}
                                  className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Foreign Tax Paid ($)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input 
                                  type="number" value={foreignTaxPaidAmt}
                                  onChange={(e) => setForeignTaxPaidAmt(Number(e.target.value))}
                                  className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Number of Shares</label>
                            <span className="text-sm font-bold text-indigo-600">{esopShares.toLocaleString()}</span>
                          </div>
                          <input 
                            type="range" min="1" max="100000" step="10" value={esopShares}
                            onChange={(e) => setEsopShares(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Exercise Price ({esopRegion === 'global' ? '$' : '₹'})</label>
                            <span className="text-sm font-bold text-indigo-600">{esopRegion === 'global' ? '$' : '₹'}{esopExercisePrice.toLocaleString()}</span>
                          </div>
                          <input 
                            type="range" min="0" max="10000" step="10" value={esopExercisePrice}
                            onChange={(e) => setEsopExercisePrice(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">FMV on Exercise ({esopRegion === 'global' ? '$' : '₹'})</label>
                            <span className="text-sm font-bold text-indigo-600">{esopRegion === 'global' ? '$' : '₹'}{esopFmvExercise.toLocaleString()}</span>
                          </div>
                          <input 
                            type="range" min="0" max="20000" step="10" value={esopFmvExercise}
                            onChange={(e) => setEsopFmvExercise(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Sale Price ({esopRegion === 'global' ? '$' : '₹'})</label>
                            <span className="text-sm font-bold text-indigo-600">{esopRegion === 'global' ? '$' : '₹'}{esopSalePrice.toLocaleString()}</span>
                          </div>
                          <input 
                            type="range" min="0" max="20000" step="10" value={esopSalePrice}
                            onChange={(e) => setEsopSalePrice(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Asset Type</label>
                            <select 
                              value={esopRegion === 'global' ? 'unlisted' : esopAssetType}
                              disabled={esopRegion === 'global'}
                              onChange={(e) => setEsopAssetType(e.target.value as 'listed' | 'unlisted')}
                              className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none ${esopRegion === 'global' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <option value="listed">Listed Equity</option>
                              <option value="unlisted">Unlisted Equity</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tax Slab (%)</label>
                            <select 
                              value={esopTaxSlab}
                              onChange={(e) => setEsopTaxSlab(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value={5}>5%</option>
                              <option value={10}>10%</option>
                              <option value={15}>15%</option>
                              <option value={20}>20%</option>
                              <option value={30}>30%</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Holding Period (Months)</label>
                            <span className="text-sm font-bold text-indigo-600">{esopHoldingPeriod} Months</span>
                          </div>
                          <input 
                            type="range" min="1" max="120" step="1" value={esopHoldingPeriod}
                            onChange={(e) => setEsopHoldingPeriod(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            {esopAssetType === 'listed' ? 'Listed: >12m is LTCG' : 'Unlisted: >24m is LTCG'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <TaxRuleInfo type="esop" />
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                      
                      <div className="relative z-10 space-y-8">
                        <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Net Proceeds (Post-Tax)</p>
                          <h3 className="text-4xl font-black text-emerald-400">{formatCurrency(esopResults.netProceeds)}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Perquisite Tax (Exercise)</p>
                            <p className="text-lg font-bold text-rose-400">{formatCurrency(esopResults.perquisiteTax)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">{esopResults.cgType} Tax (Sale)</p>
                            <p className="text-lg font-bold text-rose-400">{formatCurrency(esopResults.cgTax)}</p>
                          </div>
                        </div>

                        {esopRegion === 'global' && esopResults.ftcAmount > 0 && (
                          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center">
                              <span className="text-emerald-400 text-xs font-bold uppercase">Foreign Tax Credit (FTC)</span>
                              <span className="text-sm font-bold text-emerald-400">-{formatCurrency(esopResults.ftcAmount)}</span>
                            </div>
                          </div>
                        )}

                        <div className="pt-6 border-t border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-xs font-bold uppercase">Total Tax Liability</span>
                            <div className="text-right">
                              <span className="text-xl font-black text-rose-400">{formatCurrency(esopResults.totalTax)}</span>
                              {esopRegion === 'global' && esopResults.ftcAmount > 0 && (
                                <p className="text-[10px] text-slate-500 font-medium line-through decoration-rose-500/50">
                                  {formatCurrency(esopResults.totalTaxBeforeFTC)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <ExportButtons 
                          title="ESOP Tax Report"
                          onDownload={handleDownloadCalculatorReport}
                          variant="dark"
                          inputs={[
                            ["Shares", esopShares.toString()],
                            ["Region", esopRegion],
                            ["Exercise Price", esopExercisePrice.toString()],
                            ["FMV Exercise", esopFmvExercise.toString()]
                          ]}
                          results={[
                            ["Net Proceeds", formatCurrency(esopResults.netProceeds)],
                            ["Perquisite Tax", formatCurrency(esopResults.perquisiteTax)],
                            ["Capital Gain Tax", formatCurrency(esopResults.cgTax)],
                            ["Total Tax Liability", formatCurrency(esopResults.totalTax)]
                          ]}
                        />
                      </div>
                    </div>

                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Tax Breakdown</h4>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={esopResults.chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {esopResults.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                      <button 
                        onClick={() => {
                          const inputs: [string, string][] = [
                            ['Region', esopRegion === 'india' ? 'India' : 'Global'],
                            ['Shares', esopShares.toString()],
                            ['Exercise Price', esopRegion === 'global' ? `$${esopExercisePrice}` : formatCurrency(esopExercisePrice)],
                            ['FMV at Exercise', esopRegion === 'global' ? `$${esopFmvExercise}` : formatCurrency(esopFmvExercise)],
                            ['Sale Price', esopRegion === 'global' ? `$${esopSalePrice}` : formatCurrency(esopSalePrice)],
                            ['Asset Type', esopRegion === 'global' ? 'Global (Unlisted)' : esopAssetType],
                            ['Holding Period', `${esopHoldingPeriod} Months`]
                          ];
                          if (esopRegion === 'global') {
                            inputs.push(['Exchange Rate', `₹${usdToInr}`]);
                          }

                          const results: [string, string][] = [
                            ['Perquisite Value (INR)', formatCurrency(esopResults.perquisiteValue)],
                            ['Perquisite Tax (INR)', formatCurrency(esopResults.perquisiteTax)],
                            ['Capital Gain (INR)', formatCurrency(esopResults.capitalGain)],
                            [`${esopResults.cgType} Tax (INR)`, formatCurrency(esopResults.cgTax)]
                          ];
                          if (esopRegion === 'global') {
                            results.push(['Foreign Tax Credit (INR)', formatCurrency(esopResults.ftcAmount)]);
                          }
                          results.push(['Total Tax (INR)', formatCurrency(esopResults.totalTax)]);
                          results.push(['Net Proceeds (INR)', formatCurrency(esopResults.netProceeds)]);

                          handleDownloadCalculatorReport('ESOP Taxation Report', inputs, results);
                        }}
                        className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                      >
                      <Download size={18} />
                      Download Tax Report
                    </button>

                    <AIRecommendation 
                      calculatorType="ESOP"
                      inputs={{ region: esopRegion, shares: esopShares, exercise: esopExercisePrice, fmv: esopFmvExercise, sale: esopSalePrice, holding: esopHoldingPeriod }}
                      results={esopResults}
                      variant="dark"
                    />
                  </div>
                </div>
              )}

              {activeCalc === 'car_lease' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                      <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Car className="text-blue-600" size={20} />
                        Car Lease Details
                      </h4>
                      
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Car Price (Ex-Showroom)</label>
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(carPrice)}</span>
                          </div>
                          <input 
                            type="range" min="500000" max="10000000" step="50000" value={carPrice}
                            onChange={(e) => setCarPrice(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Lease Tenure (Months)</label>
                            <select 
                              value={leaseTenure}
                              onChange={(e) => setLeaseTenure(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value={12}>12 Months</option>
                              <option value={24}>24 Months</option>
                              <option value={36}>36 Months</option>
                              <option value={48}>48 Months</option>
                              <option value={60}>60 Months</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tax Bracket (%)</label>
                            <select 
                              value={corpTaxRate}
                              onChange={(e) => setCorpTaxRate(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value={0}>No Tax Benefit</option>
                              <option value={20}>20%</option>
                              <option value={25}>25%</option>
                              <option value={30}>30%</option>
                              <option value={35}>35% (HNI)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Monthly Lease (Base)</label>
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(monthlyLeaseBase)}</span>
                          </div>
                          <input 
                            type="range" min="10000" max="200000" step="1000" value={monthlyLeaseBase}
                            onChange={(e) => setMonthlyLeaseBase(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">GST Rate (%)</label>
                            <input 
                              type="number" value={carGstRate}
                              onChange={(e) => setCarGstRate(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Cess Rate (%)</label>
                            <input 
                              type="number" value={carCessRate}
                              onChange={(e) => setCarCessRate(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Residual Value (%)</label>
                            <input 
                              type="number" value={residualValuePercent}
                              onChange={(e) => setResidualValuePercent(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Exit GST (%)</label>
                            <select 
                              value={exitGstRate}
                              onChange={(e) => setExitGstRate(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value={12}>12% (Small Cars)</option>
                              <option value={18}>18% (Others)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                      <h5 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <ShieldCheck size={18} /> Exit GST Implications
                      </h5>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        At the end of the lease, if you choose to buy the car, GST is applicable on the residual value. 
                        For small cars (engine &lt; 1200cc petrol/1500cc diesel and length &lt; 4m), the rate is 12%. 
                        For all other vehicles, it is 18%. This is a critical factor in the total cost of ownership.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                      
                      <div className="relative z-10 space-y-8">
                        <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Lease Outflow (Post-Tax)</p>
                          <h3 className="text-4xl font-black text-blue-400">{formatCurrency(carLeaseResults.totalOutflowLease)}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Net Cost</p>
                            <p className="text-lg font-bold text-white">{formatCurrency(carLeaseResults.netMonthlyCost)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Tax Saving</p>
                            <p className="text-lg font-bold text-emerald-400">{formatCurrency(carLeaseResults.monthlyTaxSaving)}</p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-400 text-xs font-bold uppercase">Exit Buyback Cost</span>
                            <span className="text-lg font-bold text-white">{formatCurrency(carLeaseResults.buybackPrice)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-xs font-bold uppercase">GST on Exit ({exitGstRate}%)</span>
                            <span className="text-lg font-bold text-rose-400">{formatCurrency(carLeaseResults.exitGst)}</span>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-xs font-bold uppercase">Lease vs Loan Savings</span>
                            <div className="text-right">
                              <span className={`text-xl font-black ${carLeaseResults.savings > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(Math.abs(carLeaseResults.savings))}
                              </span>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {carLeaseResults.savings > 0 ? 'Cheaper than Loan' : 'More expensive than Loan'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Outflow Comparison</h4>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={carLeaseResults.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                            <Tooltip 
                              formatter={(value: number) => formatCurrency(value)}
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                              {carLeaseResults.chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const inputs: [string, string][] = [
                          ['Car Price', formatCurrency(carPrice)],
                          ['Tenure', `${leaseTenure} Months`],
                          ['Monthly Base Lease', formatCurrency(monthlyLeaseBase)],
                          ['GST + Cess Rate', `${carGstRate + carCessRate}%`],
                          ['Tax Bracket', `${corpTaxRate}%`],
                          ['Residual Value', `${residualValuePercent}%`],
                          ['Exit GST Rate', `${exitGstRate}%`]
                        ];

                        const results: [string, string][] = [
                          ['Monthly Total Lease', formatCurrency(carLeaseResults.totalMonthlyLease)],
                          ['Monthly Tax Saving', formatCurrency(carLeaseResults.monthlyTaxSaving)],
                          ['Net Monthly Cost', formatCurrency(carLeaseResults.netMonthlyCost)],
                          ['Buyback Price', formatCurrency(carLeaseResults.buybackPrice)],
                          ['GST on Exit', formatCurrency(carLeaseResults.exitGst)],
                          ['Total Exit Cost', formatCurrency(carLeaseResults.totalExitCost)],
                          ['Total Lease Outflow', formatCurrency(carLeaseResults.totalOutflowLease)],
                          ['Total Loan Outflow', formatCurrency(carLeaseResults.totalOutflowLoan)],
                          ['Net Savings', formatCurrency(carLeaseResults.savings)]
                        ];

                        handleDownloadCalculatorReport('Car Lease Analysis Report', inputs, results);
                      }}
                      className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                    >
                      <Download size={18} />
                      Download Lease Report
                    </button>
                  </div>
                </div>
              )}

              {activeCalc === 'capital_gains' && (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-700">
                        <TrendingUp size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Capital Gains Tax Calculator</h3>
                    </div>
                    <div className="flex gap-3">
                      <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                        <Upload size={18} />
                        Upload Data (Excel/CSV)
                        <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleCgFileUpload} />
                      </label>
                      <button 
                        onClick={() => setCgTransactions([...cgTransactions, {
                          id: Date.now().toString(),
                          assetName: 'New Asset',
                          assetType: 'equity',
                          buyDate: new Date().toISOString().split('T')[0],
                          sellDate: new Date().toISOString().split('T')[0],
                          buyPrice: 0,
                          sellPrice: 0,
                          quantity: 1
                        }])}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
                      >
                        <Plus size={18} />
                        Add Manually
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prices</th>
                                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Gain/Tax</th>
                                <th className="p-4"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {cgResults.transactions.map((tx, idx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-4">
                                    <input 
                                      type="text" value={tx.assetName}
                                      onChange={(e) => setCgTransactions(cgTransactions.map(t => t.id === tx.id ? {...t, assetName: e.target.value} : t))}
                                      className="w-full bg-transparent border-none text-sm font-bold text-slate-900 focus:ring-0 p-0"
                                    />
                                  </td>
                                  <td className="p-4">
                                    <select 
                                      value={tx.assetType}
                                      onChange={(e) => setCgTransactions(cgTransactions.map(t => t.id === tx.id ? {...t, assetType: e.target.value as any} : t))}
                                      className="bg-transparent border-none text-xs font-medium text-slate-600 focus:ring-0 p-0"
                                    >
                                      <option value="equity">Equity</option>
                                      <option value="debt">Debt</option>
                                      <option value="real_estate">Real Estate</option>
                                      <option value="gold">Gold</option>
                                      <option value="unlisted">Unlisted</option>
                                    </select>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                      <input 
                                        type="date" value={tx.buyDate}
                                        onChange={(e) => setCgTransactions(cgTransactions.map(t => t.id === tx.id ? {...t, buyDate: e.target.value} : t))}
                                        className="bg-transparent border-none text-[10px] text-slate-500 focus:ring-0 p-0"
                                      />
                                      <input 
                                        type="date" value={tx.sellDate}
                                        onChange={(e) => setCgTransactions(cgTransactions.map(t => t.id === tx.id ? {...t, sellDate: e.target.value} : t))}
                                        className="bg-transparent border-none text-[10px] text-slate-500 focus:ring-0 p-0"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-slate-400">B:</span>
                                        <input 
                                          type="number" value={tx.buyPrice}
                                          onChange={(e) => setCgTransactions(cgTransactions.map(t => t.id === tx.id ? {...t, buyPrice: Number(e.target.value)} : t))}
                                          className="w-20 bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-slate-400">S:</span>
                                        <input 
                                          type="number" value={tx.sellPrice}
                                          onChange={(e) => setCgTransactions(cgTransactions.map(t => t.id === tx.id ? {...t, sellPrice: Number(e.target.value)} : t))}
                                          className="w-20 bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0"
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex flex-col">
                                      <span className={`text-sm font-bold ${tx.gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {formatCurrency(tx.gain)}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        Tax: {formatCurrency(tx.tax)} ({tx.isLtcg ? 'LTCG' : 'STCG'})
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-right">
                                    <button 
                                      onClick={() => setCgTransactions(cgTransactions.filter(t => t.id !== tx.id))}
                                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              {cgTransactions.length === 0 && (
                                <tr>
                                  <td colSpan={6} className="p-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                                        <FileText size={48} />
                                      </div>
                                      <p className="text-sm text-slate-500 font-medium">No transactions added yet.</p>
                                      <p className="text-xs text-slate-400">Upload an Excel file or add data manually to calculate tax.</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        
                        <div className="relative z-10 space-y-8">
                          <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Estimated Tax</p>
                            <h3 className="text-4xl font-black text-indigo-400">{formatCurrency(cgResults.totalTax)}</h3>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Gain</p>
                              <p className="text-lg font-bold text-white">{formatCurrency(cgResults.totalGain)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">STCG Tax</p>
                              <p className="text-lg font-bold text-rose-400">{formatCurrency(cgResults.totalStcgTax)}</p>
                            </div>
                          </div>

                          <div className="pt-6 border-t border-white/10">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 text-xs font-bold uppercase">LTCG Tax</span>
                              <span className="text-xl font-black text-emerald-400">{formatCurrency(cgResults.totalLtcgTax)}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Includes 1.25L Equity LTCG exemption</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Gain Breakdown</h4>
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={cgResults.chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {cgResults.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                              />
                              <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <AIRecommendation 
                        calculatorType="Capital Gains"
                        inputs={{ transactions: cgTransactions }}
                        results={cgResults}
                        variant="dark"
                      />

                      <ExportButtons 
                        title="Capital Gains Tax Report"
                        onDownload={handleDownloadCalculatorReport}
                        inputs={[
                          ['Total Transactions', cgTransactions.length.toString()],
                          ['Total Gain', formatCurrency(cgResults.totalGain)]
                        ]}
                        results={[
                          ['STCG Gain', formatCurrency(cgResults.totalStcg)],
                          ['STCG Tax', formatCurrency(cgResults.totalStcgTax)],
                          ['LTCG Gain', formatCurrency(cgResults.totalLtcg)],
                          ['LTCG Tax', formatCurrency(cgResults.totalLtcgTax)],
                          ['Total Tax Liability', formatCurrency(cgResults.totalTax)]
                        ]}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <h5 className="text-sm font-bold text-indigo-900 mb-4 flex items-center gap-2">
                      <ShieldCheck size={18} /> Tax Planning Insights (Budget 2024 Updates)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <ul className="space-y-3">
                        <li className="text-xs text-indigo-800 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span><strong>Equity LTCG:</strong> Taxed at 12.5% if held for &gt;12 months. Exemption limit increased to ₹1.25 Lakh per year.</span>
                        </li>
                        <li className="text-xs text-indigo-800 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span><strong>Real Estate:</strong> LTCG taxed at 12.5% without indexation for assets acquired after 2001.</span>
                        </li>
                      </ul>
                      <ul className="space-y-3">
                        <li className="text-xs text-indigo-800 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span><strong>Debt Funds:</strong> Gains are taxed as per your income tax slab, regardless of holding period (for new investments).</span>
                        </li>
                        <li className="text-xs text-indigo-800 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                          <span><strong>Loss Set-off:</strong> Short-term losses can be set off against both STCG and LTCG. Long-term losses can only be set off against LTCG.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Asset Allocation Calculator */}
              {activeCalc === 'asset_allocation' && (
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                        <PieChartIcon size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Asset Allocation Planner</h3>
                    </div>
                    <AIRecommendation 
                      calculatorType="Asset Allocation"
                      inputs={{ currentAllocation: { equity: aaEquity, debt: aaDebt, gold: aaGold, cash: aaCash, realEstate: aaRealEstate }, targetAllocation: { equity: targetEquity, debt: targetDebt, gold: targetGold } }}
                      results={aaResults}
                    />

                    <ExportButtons 
                      title="Asset Allocation Analysis"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ['Equity', formatCurrency(aaEquity)],
                        ['Debt', formatCurrency(aaDebt)],
                        ['Gold', formatCurrency(aaGold)],
                        ['Cash', formatCurrency(aaCash)],
                        ['Real Estate', formatCurrency(aaRealEstate)],
                        ['Target Equity %', `${targetEquity}%`],
                        ['Target Debt %', `${targetDebt}%`],
                        ['Target Gold %', `${targetGold}%`]
                      ]}
                      results={[
                        ['Total Portfolio', formatCurrency(aaResults.total)],
                        ['Equity Rebalance', formatCurrency(aaResults.rebalance.equity)],
                        ['Debt Rebalance', formatCurrency(aaResults.rebalance.debt)],
                        ['Gold Rebalance', formatCurrency(aaResults.rebalance.gold)]
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Current Portfolio Values</h4>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Equity Investments</label>
                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(aaEquity)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="10000000" step="10000"
                            value={aaEquity} onChange={(e) => setAaEquity(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Debt / Fixed Income</label>
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(aaDebt)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="10000000" step="10000"
                            value={aaDebt} onChange={(e) => setAaDebt(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Gold / Commodities</label>
                            <span className="text-sm font-bold text-amber-600">{formatCurrency(aaGold)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="5000000" step="10000"
                            value={aaGold} onChange={(e) => setAaGold(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Cash / Liquid</label>
                            <span className="text-sm font-bold text-slate-600">{formatCurrency(aaCash)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="2000000" step="10000"
                            value={aaCash} onChange={(e) => setAaCash(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Target Allocation %</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Equity %</label>
                            <input 
                              type="number" value={targetEquity}
                              onChange={(e) => setTargetEquity(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Debt %</label>
                            <input 
                              type="number" value={targetDebt}
                              onChange={(e) => setTargetDebt(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Gold %</label>
                            <input 
                              type="number" value={targetGold}
                              onChange={(e) => setTargetGold(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                          </div>
                        </div>
                        {targetEquity + targetDebt + targetGold !== 100 && (
                          <p className="text-[10px] text-rose-500 font-bold">Total must equal 100% (Current: {targetEquity + targetDebt + targetGold}%)</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Total Portfolio Value</p>
                        <h3 className="text-4xl font-black text-emerald-400 mb-8">{formatCurrency(aaResults.total)}</h3>
                        
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rebalancing Needed</h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                              <span className="text-sm font-medium">Equity</span>
                              <span className={`text-sm font-bold ${aaResults.rebalance.equity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {aaResults.rebalance.equity >= 0 ? 'Invest ' : 'Sell '}{formatCurrency(Math.abs(aaResults.rebalance.equity))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                              <span className="text-sm font-medium">Debt</span>
                              <span className={`text-sm font-bold ${aaResults.rebalance.debt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {aaResults.rebalance.debt >= 0 ? 'Invest ' : 'Sell '}{formatCurrency(Math.abs(aaResults.rebalance.debt))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                              <span className="text-sm font-medium">Gold</span>
                              <span className={`text-sm font-bold ${aaResults.rebalance.gold >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {aaResults.rebalance.gold >= 0 ? 'Invest ' : 'Sell '}{formatCurrency(Math.abs(aaResults.rebalance.gold))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Current Allocation</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={aaResults.chartData.filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {aaResults.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Compounding Calculator */}
              {activeCalc === 'compounding' && (
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                        <TrendingUp size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Power of Compounding</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Initial Investment</label>
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(compInitial)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="10000000" step="10000"
                            value={compInitial} onChange={(e) => setCompInitial(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Monthly Contribution</label>
                            <span className="text-sm font-bold text-blue-600">{formatCurrency(compMonthly)}</span>
                          </div>
                          <input 
                            type="range" min="0" max="1000000" step="1000"
                            value={compMonthly} onChange={(e) => setCompMonthly(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Expected Return Rate (%)</label>
                            <span className="text-sm font-bold text-blue-600">{compRate}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="30" step="0.5"
                            value={compRate} onChange={(e) => setCompRate(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Tenure (Years)</label>
                            <span className="text-sm font-bold text-blue-600">{compYears}y</span>
                          </div>
                          <input 
                            type="range" min="1" max="50" step="1"
                            value={compYears} onChange={(e) => setCompYears(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                        </div>
                      </div>

                      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                        <h5 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                          <TrendingUp size={18} /> Compounding Insight
                        </h5>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          Your money is working for you! In {compYears} years, your interest earned ({formatCurrency(compoundingResults.totalInterest)}) 
                          is {((compoundingResults.totalInterest / compoundingResults.totalInvested) * 100).toFixed(0)}% of your total investment. 
                          The longer you stay invested, the faster your wealth grows.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/10">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Estimated Future Value</p>
                        <h3 className="text-4xl font-black text-blue-400 mb-6">{formatCurrency(compoundingResults.totalValue)}</h3>
                        
                        <div className="grid grid-cols-3 gap-2 mb-8 bg-black/20 p-2 rounded-2xl">
                          <div className="text-center p-2 rounded-xl">
                            <p className="text-[10px] font-bold text-rose-400 uppercase">Conservative</p>
                            <p className="text-xs font-black text-white">{formatCurrency(compoundingResults.ranges.conservative.totalValue)}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{compoundingResults.ranges.conservative.rate}%</p>
                          </div>
                          <div className="text-center p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
                            <p className="text-[10px] font-bold text-blue-300 uppercase">Realistic</p>
                            <p className="text-xs font-black text-white">{formatCurrency(compoundingResults.ranges.realistic.totalValue)}</p>
                            <p className="text-[10px] text-blue-400 font-bold">{compoundingResults.ranges.realistic.rate}%</p>
                          </div>
                          <div className="text-center p-2 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-400 uppercase">Optimistic</p>
                            <p className="text-xs font-black text-white">{formatCurrency(compoundingResults.ranges.optimistic.totalValue)}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{compoundingResults.ranges.optimistic.rate}%</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Invested</p>
                            <p className="text-xl font-bold">{formatCurrency(compoundingResults.totalInvested)}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Wealth Gained</p>
                            <p className="text-xl font-bold text-emerald-400">{formatCurrency(compoundingResults.totalInterest)}</p>
                          </div>
                        </div>
                      </div>

                      <ExportButtons 
                        title="Compounding Calculator"
                        onDownload={handleDownloadCalculatorReport}
                        inputs={[
                          ['Initial Investment', formatCurrency(compInitial)],
                          ['Monthly Contribution', formatCurrency(compMonthly)],
                          ['Expected Return', `${compRate}% p.a.`],
                          ['Tenure', `${compYears} Years`]
                        ]}
                        results={[
                          ['Total Invested', formatCurrency(compoundingResults.totalInvested)],
                          ['Wealth Gained', formatCurrency(compoundingResults.totalInterest)],
                          ['Maturity Value', formatCurrency(compoundingResults.totalValue)]
                        ]}
                      />

                      <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Wealth Breakdown</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={compoundingResults.chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {compoundingResults.chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HLV Calculator */}
              {activeCalc === 'hlv' && (
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                        <HeartPulse size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Human Life Value (HLV)</h3>
                    </div>
                    <AIRecommendation 
                      calculatorType="Human Life Value"
                      inputs={{ income: hlvIncome, age: hlvAge, retAge: hlvRetirementAge, expenses: hlvExpenses, savings: hlvSavings, liabilities: hlvLiabilities, currentCover: hlvCurrentCover, inflation: hlvInflation, return: hlvReturn }}
                      results={hlvResults}
                      variant="dark"
                    />

                    <ExportButtons 
                      title="HLV Analysis Report"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ['Current Age', `${hlvAge}y`],
                        ['Retirement Age', `${hlvRetirementAge}y`],
                        ['Annual Income', formatCurrency(hlvIncome)],
                        ['Annual Expenses', formatCurrency(hlvExpenses)]
                      ]}
                      results={[
                        ['Total Protection Need', formatCurrency(hlvResults.totalProtectionNeeded)],
                        ['Current Insurance Gap', formatCurrency(hlvResults.insuranceGap)],
                        ['Years to Retirement', `${hlvResults.yearsToRetire}y`]
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Current Age</label>
                          <input 
                            type="number" value={hlvAge}
                            onChange={(e) => setHlvAge(Number(e.target.value))}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Retirement Age</label>
                          <input 
                            type="number" value={hlvRetirementAge}
                            onChange={(e) => setHlvRetirementAge(Number(e.target.value))}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Annual Income</label>
                            <span className="text-sm font-bold text-rose-600">{formatCurrency(hlvIncome)}</span>
                          </div>
                          <input 
                            type="range" min="100000" max="10000000" step="100000"
                            value={hlvIncome} onChange={(e) => setHlvIncome(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Annual Expenses (My Finance)</label>
                            <span className="text-sm font-bold text-rose-600">{formatCurrency(hlvExpenses)}</span>
                          </div>
                          <input 
                            type="range" min="50000" max="5000000" step="50000"
                            value={hlvExpenses} onChange={(e) => setHlvExpenses(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">My Savings (Assets)</label>
                            <input 
                              type="number" value={hlvSavings}
                              onChange={(e) => setHlvSavings(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Loans & Liabilities</label>
                            <input 
                              type="number" value={hlvLiabilities}
                              onChange={(e) => setHlvLiabilities(Number(e.target.value))}
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Existing Life Cover</label>
                          <input 
                            type="number" value={hlvCurrentCover}
                            onChange={(e) => setHlvCurrentCover(Number(e.target.value))}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Inflation (%)</label>
                          <input 
                            type="number" value={hlvInflation}
                            onChange={(e) => setHlvInflation(Number(e.target.value))}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">ROI (%)</label>
                          <input 
                            type="number" value={hlvReturn}
                            onChange={(e) => setHlvReturn(Number(e.target.value))}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Additional Protection Required</p>
                        <h3 className="text-4xl font-black text-rose-400 mb-8">{formatCurrency(hlvResults.insuranceGap)}</h3>
                        
                        <div className="space-y-4 pt-6 border-t border-white/10">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Total Life Cover Need</span>
                            <span className="font-bold text-white">{formatCurrency(hlvResults.totalProtectionNeeded)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Income Replacement PV</span>
                            <span className="font-bold">{formatCurrency(hlvResults.pvIncomeReplacement)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Years to Retirement</span>
                            <span className="font-bold">{hlvResults.yearsToRetire} Years</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                        <h5 className="text-sm font-bold text-rose-900 mb-4 flex items-center gap-2">
                          <ShieldCheck size={18} /> Why HLV Matters?
                        </h5>
                        <p className="text-xs text-rose-800 leading-relaxed">
                          Human Life Value (HLV) represents the present value of your future earnings. 
                          It is the amount your family would need to maintain their current lifestyle 
                          and meet future goals if you were no longer there. 
                          <br /><br />
                          Your life insurance cover should ideally be equal to or greater than your HLV.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Worth Calculator */}
              {activeCalc === 'net_worth' && (
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <IndianRupee size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Net Worth Tracker</h3>
                    </div>
                    <AIRecommendation 
                      calculatorType="Net Worth"
                      inputs={{ totalAssets: netWorthResults.totalAssets, totalLiabilities: netWorthResults.totalLiabilities }}
                      results={{ netWorth: netWorthResults.netWorth }}
                    />

                    <ExportButtons 
                      title="Net Worth Statement"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={Object.entries(nwAssets).concat(Object.entries(nwLiabilities)).map(([k, v]) => [k.replace(/([A-Z])/g, ' $1').toUpperCase(), formatCurrency(v)])}
                      results={[
                        ['Total Assets', formatCurrency(netWorthResults.totalAssets)],
                        ['Total Liabilities', formatCurrency(netWorthResults.totalLiabilities)],
                        ['NET WORTH', formatCurrency(netWorthResults.netWorth)]
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                          <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest">Assets</h4>
                          <div className="space-y-4">
                            {Object.entries(nwAssets).map(([key, value]) => (
                              <div key={key}>
                                <label className="block text-xs font-bold text-slate-500 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input 
                                  type="number" value={value}
                                  onChange={(e) => setNwAssets({...nwAssets, [key]: Number(e.target.value)})}
                                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                          <h4 className="text-sm font-bold text-rose-600 uppercase tracking-widest">Liabilities</h4>
                          <div className="space-y-4">
                            {Object.entries(nwLiabilities).map(([key, value]) => (
                              <div key={key}>
                                <label className="block text-xs font-bold text-slate-500 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                <input 
                                  type="number" value={value}
                                  onChange={(e) => setNwLiabilities({...nwLiabilities, [key]: Number(e.target.value)})}
                                  className="w-full p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Your Net Worth</p>
                        <h3 className="text-4xl font-black text-emerald-400 mb-8">{formatCurrency(netWorthResults.netWorth)}</h3>
                        
                        <div className="space-y-4 pt-6 border-t border-white/10">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Total Assets</span>
                            <span className="font-bold text-emerald-400">{formatCurrency(netWorthResults.totalAssets)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Total Liabilities</span>
                            <span className="font-bold text-rose-400">{formatCurrency(netWorthResults.totalLiabilities)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl border border-slate-200 p-6">
                        <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Asset vs Liability</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={netWorthResults.summaryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {netWorthResults.summaryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeCalc === 'delay' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-50 rounded-xl text-rose-700">
                        <Clock size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Cost of Delay Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Planned Monthly SIP</label>
                          <span className="text-sm font-bold text-rose-700">{formatCurrency(delayMonthly)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="100000" step="500"
                          value={delayMonthly} onChange={(e) => setDelayMonthly(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Planned Lumpsum Investment</label>
                          <span className="text-sm font-bold text-rose-700">{formatCurrency(delayLumpsum)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="10000000" step="10000"
                          value={delayLumpsum} onChange={(e) => setDelayLumpsum(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Delay Period (Months)</label>
                          <span className="text-sm font-bold text-rose-700">{delayMonths}m</span>
                        </div>
                        <input 
                          type="range" min="1" max="120" step="1"
                          value={delayMonths} onChange={(e) => setDelayMonths(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Investment Tenure (Years)</label>
                          <span className="text-sm font-bold text-rose-700">{delayYears}y</span>
                        </div>
                        <input 
                          type="range" min="1" max="40" step="1"
                          value={delayYears} onChange={(e) => setDelayYears(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-700"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Expected Return (%)</label>
                          <span className="text-sm font-bold text-rose-700">{delayRate}%</span>
                        </div>
                        <input 
                          type="range" min="1" max="30" step="0.5"
                          value={delayRate} onChange={(e) => setDelayRate(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Wealth Created (SIP)</p>
                          <h4 className="text-lg font-bold text-slate-900">{formatCurrency(delayResults.fvDelayedSip)}</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Wealth Created (Lumpsum)</p>
                          <h4 className="text-lg font-bold text-slate-900">{formatCurrency(delayResults.fvDelayedLumpsum)}</h4>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Wealth if Started Now</p>
                        <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(delayResults.totalNow)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Wealth if Delayed</p>
                        <h4 className="text-2xl font-bold text-emerald-600">{formatCurrency(delayResults.totalDelayed)}</h4>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Cost of Delay (Wealth Lost)</p>
                        <h4 className="text-3xl font-black text-rose-600">{formatCurrency(delayResults.totalCost)}</h4>
                      </div>
                    </div>
                    
                    <div className="h-48 mt-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={delayResults.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {delayResults.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <AIRecommendation 
                      calculatorType="Cost of Delay"
                      inputs={{ monthly: delayMonthly, lumpsum: delayLumpsum, delayMonths, tenure: delayYears, rate: delayRate }}
                      results={{ ...delayResults, cost: delayResults.totalCost }}
                    />

                    <ExportButtons 
                      title="Cost of Delay Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ["Monthly SIP", formatCurrency(delayMonthly)],
                        ["Planned Lumpsum", formatCurrency(delayLumpsum)],
                        ["Delay Period", `${delayMonths} Months`],
                        ["Tenure", `${delayYears} Years`],
                        ["Expected Return", `${delayRate}%`]
                      ]}
                      results={[
                        ["Wealth if Started Now", formatCurrency(delayResults.totalNow)],
                        ["Wealth if Delayed", formatCurrency(delayResults.totalDelayed)],
                        ["Cost of Delay", formatCurrency(delayResults.totalCost)]
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Goal Target Calculator */}
              {activeCalc === 'target' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
                        <Target size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Goal Target Calculator</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Target Amount</label>
                          <span className="text-sm font-bold text-emerald-800">{formatCurrency(targetAmount)}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {[10000000, 50000000, 100000000, 250000000, 500000000, 1000000000].map(amt => (
                            <button
                              key={amt}
                              onClick={() => setTargetAmount(amt)}
                              className={`py-2 text-[10px] font-bold rounded-lg transition-all ${
                                targetAmount === amt 
                                  ? 'bg-emerald-800 text-white' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {amt >= 10000000 ? `${amt/10000000} Cr` : formatCurrency(amt)}
                            </button>
                          ))}
                        </div>
                        <input 
                          type="range" min="10000000" max="1000000000" step="10000000"
                          value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Time to Reach (Years)</label>
                          <span className="text-sm font-bold text-emerald-800">{targetYears}y</span>
                        </div>
                        <input 
                          type="range" min="1" max="40" step="1"
                          value={targetYears} onChange={(e) => setTargetYears(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-sm font-bold text-slate-700">Existing Investments & SIP</label>
                          <button 
                            onClick={() => {
                              const totalValue = portfolio.investments.reduce((sum, inv) => sum + (convertToINR(inv.currentValue || 0, inv.currency)), 0);
                              setTargetExistingValue(totalValue);
                            }}
                            className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-2 py-1 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors"
                          >
                            Sync Portfolio
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Existing Corpus</label>
                            <PrecisionInput 
                              value={targetExistingValue}
                              onChange={setTargetExistingValue}
                              label=""
                              min={0}
                              max={1000000000}
                              step={50000}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly SIP Running</label>
                            <PrecisionInput 
                              value={targetExistingSip}
                              onChange={setTargetExistingSip}
                              label=""
                              min={0}
                              max={5000000}
                              step={5000}
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          These existing funds will grow at {targetRate}% for {targetYears} years, reducing your required new SIP.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700">Expected Return (%)</label>
                            <span className="text-xs font-bold text-emerald-800">{targetRate}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="30" step="0.5"
                            value={targetRate} onChange={(e) => setTargetRate(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700">Annual SIP Step-Up (%)</label>
                            <span className="text-xs font-bold text-emerald-800">{targetStepUp}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="25" step="1"
                            value={targetStepUp} onChange={(e) => setTargetStepUp(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-800"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-700">Inflation (%)</label>
                            <span className="text-xs font-bold text-rose-600">{targetInflation}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="15" step="0.5"
                            value={targetInflation} onChange={(e) => setTargetInflation(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-3xl p-8 flex flex-col justify-center space-y-8">
                    <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 shadow-inner">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest text-center mb-4">Required Initial Monthly SIP</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm text-center space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Fixed Monthly SIP</p>
                          <h4 className="text-lg font-black text-slate-900">{formatCurrency(targetResults.requiredSip)}</h4>
                        </div>
                        <div className="bg-emerald-800 p-4 rounded-2xl shadow-md text-center space-y-1 text-white">
                          <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider">Step-Up SIP ({targetStepUp}%)</p>
                          <h4 className="text-lg font-black text-emerald-300">{formatCurrency(targetResults.requiredStepUpSip)}</h4>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="text-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:scale-105">
                          <p className="text-[8px] font-bold text-rose-500 uppercase">Conservative</p>
                          <p className="text-[10px] font-black text-slate-900">{formatCurrency(targetResults.ranges.conservative.requiredSip)}</p>
                          <p className="text-[8px] text-slate-400">{targetResults.ranges.conservative.rate}% Ret</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-800 text-white rounded-2xl shadow-md transform scale-110">
                          <p className="text-[8px] font-bold text-emerald-300 uppercase">Realistic</p>
                          <p className="text-xs font-black">{formatCurrency(targetResults.ranges.realistic.requiredSip)}</p>
                          <p className="text-[8px] text-emerald-200">{targetResults.ranges.realistic.rate}% Ret</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:scale-105">
                          <p className="text-[8px] font-bold text-indigo-500 uppercase">Optimistic</p>
                          <p className="text-[10px] font-black text-slate-900">{formatCurrency(targetResults.ranges.optimistic.requiredSip)}</p>
                          <p className="text-[8px] text-slate-400">{targetResults.ranges.optimistic.rate}% Ret</p>
                        </div>
                      </div>
                    </div>
                    
                    {(targetExistingValue > 0 || targetExistingSip > 0) && (
                      <div className="bg-emerald-100/30 p-5 rounded-3xl border border-emerald-200/50 text-center space-y-2">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Existing Portfolio Coverage</p>
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium text-slate-700">
                             Total value will grow to <span className="font-bold text-emerald-800">{formatCurrency(targetResults.fvExisting + targetResults.fvExistingSip)}</span>.
                          </p>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (targetResults.totalFvAlreadyCovered / targetAmount) * 100)}%` }}
                              className="h-full bg-emerald-600"
                            />
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">
                            Covers <span className="text-emerald-700">{((targetResults.totalFvAlreadyCovered / targetAmount) * 100).toFixed(1)}%</span> of your target corpus
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <AIRecommendation 
                      calculatorType="Goal Target"
                      inputs={{ target: targetAmount, years: targetYears, rate: targetRate }}
                      results={targetResults}
                    />

                    <ExportButtons 
                      title="Goal Target Calculator"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ['Target Amount', formatCurrency(targetAmount)],
                        ['Duration', `${targetYears} Years`],
                        ['Return Rate', `${targetRate}% p.a.`],
                        ['Inflation Rate', `${targetInflation}%`],
                        ['Existing Corpus', formatCurrency(targetExistingValue)],
                        ['Existing SIP', formatCurrency(targetExistingSip)]
                      ]}
                      results={[
                        ['Required Monthly SIP', formatCurrency(targetResults.ranges.realistic.requiredSip)],
                        ['Required Lumpsum', formatCurrency(targetResults.ranges.realistic.requiredLumpsum)],
                        ['Adjusted Target', formatCurrency(targetResults.adjustedTargetAmount)],
                        ['Real Value (Today)', formatCurrency(targetResults.realValueToday)]
                      ]}
                    />
                    
                    <div className="bg-white p-8 rounded-2xl border border-emerald-100 shadow-sm text-center space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR One-time Lumpsum</p>
                      <h4 className="text-3xl font-black text-emerald-800">{formatCurrency(targetResults.requiredLumpsum)}</h4>
                      <p className="text-sm text-slate-500">Invested today for {targetYears} years</p>
                    </div>

                    <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 text-center space-y-1">
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Real Value in Today's Terms</p>
                      <h4 className="text-2xl font-black text-slate-900">{formatCurrency(targetResults.realValueToday)}</h4>
                      <p className="text-[11px] text-slate-500">Purchasing power of {formatCurrency(targetAmount)} after {targetYears}y at {targetInflation}% inflation</p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-emerald-100/50 rounded-xl text-emerald-900 text-sm">
                      <TrendingUp size={20} />
                      <p>Consider a Step-up SIP to reach your goal even faster with smaller initial amounts.</p>
                    </div>
                  </div>
                </div>
              )}
              {activeCalc === 'goals' && (
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-50 rounded-xl text-rose-700">
                        <Target size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">Goal Planner</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-700 block mb-3">Goal Type</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['education', 'marriage', 'house', 'vacation', 'other'] as const).map(type => (
                            <button
                              key={type}
                              onClick={() => {
                                setGoalType(type);
                                if (type === 'education') {
                                  setGoalDuration(4);
                                  setGoalFrequency('yearly');
                                } else if (type === 'vacation') {
                                  setGoalDuration(1);
                                  setGoalFrequency('one-time');
                                } else {
                                  setGoalDuration(1);
                                  setGoalFrequency('one-time');
                                }
                              }}
                              className={`py-2 px-3 text-xs font-bold rounded-xl capitalize transition-all ${
                                goalType === type 
                                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' 
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(goalType === 'education' || goalType === 'vacation') && (
                        <div className="grid grid-cols-1 gap-6">
                          <div>
                            <label className="text-sm font-bold text-slate-700 block mb-3">Frequency</label>
                            <div className="flex gap-2">
                              {(['one-time', 'yearly', 'half-yearly'] as const).map(freq => (
                                <button
                                  key={freq}
                                  onClick={() => {
                                    setGoalFrequency(freq);
                                    if (freq === 'one-time') setGoalDuration(1);
                                  }}
                                  className={`flex-1 py-2 px-3 text-[10px] font-bold rounded-xl capitalize transition-all ${
                                    goalFrequency === freq 
                                      ? 'bg-slate-800 text-white' 
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {freq.replace('-', ' ')}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Current Cost of Goal</label>
                          <span className="text-sm font-bold text-rose-600">{formatCurrency(goalCurrentCost)}</span>
                        </div>
                        <input 
                          type="range" min="10000" max="50000000" step="10000"
                          value={goalCurrentCost} onChange={(e) => setGoalCurrentCost(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Current Monthly Contribution</label>
                          <span className="text-sm font-bold text-rose-600">{formatCurrency(goalCurrentMonthlyContribution)}</span>
                        </div>
                        <input 
                          type="range" min="0" max="500000" step="1000"
                          value={goalCurrentMonthlyContribution} onChange={(e) => setGoalCurrentMonthlyContribution(Number(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-sm font-bold text-slate-700">Existing Savings & Running SIP</label>
                          <button 
                            onClick={() => {
                              const totalValue = portfolio.investments.reduce((sum, inv) => sum + (convertToINR(inv.currentValue || 0, inv.currency)), 0);
                              setGoalExistingSavings(totalValue);
                            }}
                            className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-2 py-1 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                          >
                            Sync Portfolio
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Existing Savings</label>
                            <PrecisionInput 
                              value={goalExistingSavings}
                              onChange={setGoalExistingSavings}
                              label=""
                              min={0}
                              max={100000000}
                              step={50000}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Current SIP</label>
                            <PrecisionInput 
                              value={goalCurrentMonthlyContribution}
                              onChange={setGoalCurrentMonthlyContribution}
                              label=""
                              min={0}
                              max={1000000}
                              step={5000}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Years to Start</label>
                            <span className="text-sm font-bold text-rose-600">{goalYearsToStart}y</span>
                          </div>
                          <input 
                            type="range" min="1" max="30" step="1"
                            value={goalYearsToStart} onChange={(e) => setGoalYearsToStart(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                          />
                          <div className="flex gap-2 mt-2">
                            {[1, 5, 10].map(y => (
                              <button 
                                key={y}
                                onClick={() => setGoalYearsToStart(y)}
                                className="text-[10px] px-2 py-1 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100"
                              >
                                {y}y
                              </button>
                            ))}
                          </div>
                        </div>

                        {goalFrequency !== 'one-time' && (
                          <div>
                            <div className="flex justify-between mb-2">
                              <label className="text-sm font-bold text-slate-700">Goal Duration (Years)</label>
                              <span className="text-sm font-bold text-rose-600">{goalDuration}y</span>
                            </div>
                            <input 
                              type="range" min="1" max="30" step="1"
                              value={goalDuration} onChange={(e) => setGoalDuration(Number(e.target.value))}
                              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Inflation (%)</label>
                            <span className="text-sm font-bold text-rose-600">{goalInflation}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="15" step="0.5"
                            value={goalInflation} onChange={(e) => setGoalInflation(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Annual Step-Up (%)</label>
                            <span className="text-sm font-bold text-rose-600">{goalStepUp}%</span>
                          </div>
                          <input 
                            type="range" min="0" max="25" step="1"
                            value={goalStepUp} onChange={(e) => setGoalStepUp(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-bold text-slate-700">Returns (%)</label>
                            <span className="text-sm font-bold text-rose-600">{goalReturn}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="25" step="0.5"
                            value={goalReturn} onChange={(e) => setGoalReturn(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-8 flex flex-col space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Future Cost (1st Event)</p>
                        <h4 className="text-xl font-bold text-slate-900">{formatCurrency(goalResults.futureCostFirst)}</h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Corpus Needed</p>
                        <h4 className="text-xl font-bold text-rose-600">{formatCurrency(goalResults.totalCorpusNeeded)}</h4>
                      </div>
                    </div>

                    <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100/50">
                      <p className="text-[10px] font-bold text-rose-800 uppercase tracking-widest text-center mb-4">Required Initial Monthly SIP</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm text-center space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Fixed Monthly SIP</p>
                          <h4 className="text-lg font-black text-slate-900">{formatCurrency(goalResults.requiredSip)}</h4>
                        </div>
                        <div className="bg-rose-700 p-4 rounded-2xl shadow-md text-center space-y-1 text-white">
                          <p className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">Step-Up SIP ({goalStepUp}%)</p>
                          <h4 className="text-lg font-black text-rose-100">{formatCurrency(goalResults.requiredStepUpSip)}</h4>
                        </div>
                      </div>

                      <p className="text-[10px] font-bold text-rose-800 uppercase tracking-widest text-center mt-6 mb-4">SIP Required (Return Range)</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-white rounded-2xl border border-rose-100 shadow-sm transition-all hover:scale-105">
                          <p className="text-[8px] font-bold text-rose-500 uppercase">Conservative</p>
                          <p className="text-[10px] font-black text-slate-900">{formatCurrency(goalResults.ranges.conservative.requiredSip)}</p>
                          <p className="text-[8px] text-slate-400">{goalResults.ranges.conservative.rate}% Ret</p>
                        </div>
                        <div className="text-center p-3 bg-rose-700 text-white rounded-2xl shadow-md transform scale-110">
                          <p className="text-[8px] font-bold text-rose-200 uppercase">Realistic</p>
                          <p className="text-xs font-black">{formatCurrency(goalResults.ranges.realistic.requiredSip)}</p>
                          <p className="text-[8px] text-rose-300">{goalResults.ranges.realistic.rate}% Ret</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-2xl border border-rose-100 shadow-sm transition-all hover:scale-105">
                          <p className="text-[8px] font-bold text-indigo-500 uppercase">Optimistic</p>
                          <p className="text-[10px] font-black text-slate-900">{formatCurrency(goalResults.ranges.optimistic.requiredSip)}</p>
                          <p className="text-[8px] text-slate-400">{goalResults.ranges.optimistic.rate}% Ret</p>
                        </div>
                      </div>
                    </div>

                    {(goalExistingSavings > 0 || goalCurrentMonthlyContribution > 0) && (
                      <div className="bg-rose-100/30 p-5 rounded-3xl border border-rose-100 text-center space-y-2">
                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Existing Asset Coverage</p>
                        <div className="flex flex-col gap-1">
                          <p className="text-xs font-medium text-slate-700">
                             Savings will grow to <span className="font-bold text-rose-700">{formatCurrency(goalResults.fvExistingSavings + goalResults.fvExistingSip)}</span>.
                          </p>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (goalResults.totalCovered / goalResults.totalCorpusNeeded * 100))}%` }}
                              className="h-full bg-rose-500"
                            />
                          </div>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">
                            Covers <span className="text-rose-600">{( (goalResults.totalCovered / goalResults.totalCorpusNeeded) * 100 ).toFixed(1)}%</span> of your target corpus
                          </p>
                        </div>
                      </div>
                    )}

                    <ExportButtons 
                      title="Goal Planner"
                      onDownload={handleDownloadCalculatorReport}
                      inputs={[
                        ['Goal Type', goalType.charAt(0).toUpperCase() + goalType.slice(1)],
                        ['Current Cost', formatCurrency(goalCurrentCost)],
                        ['Years to Goal', `${goalYearsToStart}y`],
                        ['Goal Duration', `${goalDuration}y`],
                        ['Inflation Rate', `${goalInflation}%`],
                        ['Return Rate', `${goalReturn}%`],
                        ['Existing Savings', formatCurrency(goalExistingSavings)],
                        ['Current SIP', formatCurrency(goalCurrentMonthlyContribution)]
                      ]}
                      results={[
                        ['Total Corpus Needed', formatCurrency(goalResults.totalCorpusNeeded)],
                        ['Adjusted Corpus', formatCurrency(goalResults.adjustedTotalCorpusNeeded)],
                        ['Required Monthly SIP', formatCurrency(goalResults.requiredSip)],
                        ['One-time Lumpsum', formatCurrency(goalResults.requiredLumpsum)]
                      ]}
                    />

                    <div className="space-y-4">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Monthly Savings</p>
                            <h4 className="text-3xl font-black text-slate-900">{formatCurrency(goalResults.requiredSip)}</h4>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Yearly</p>
                            <h4 className="text-xl font-bold text-slate-700">{formatCurrency(goalResults.requiredYearlySavings)}</h4>
                          </div>
                        </div>
                        
                        {goalCurrentMonthlyContribution > 0 && (
                          <div className="pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-500">Current Contribution</span>
                              <span className="text-sm font-bold text-emerald-600">{formatCurrency(goalCurrentMonthlyContribution)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-slate-500">Gap to Fill</span>
                              <span className="text-sm font-bold text-rose-600">
                                {formatCurrency(Math.max(0, goalResults.requiredSip - goalCurrentMonthlyContribution))}
                              </span>
                            </div>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-4">Invested for {goalResults.yearsToStart} years at {goalReturn}% return</p>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">OR One-time Lumpsum</p>
                        <h4 className="text-2xl font-black text-rose-600">{formatCurrency(goalResults.requiredLumpsum)}</h4>
                        <p className="text-[10px] text-slate-400 mt-2">Invested today for {goalResults.yearsToStart} years</p>
                      </div>
                    </div>

                    {goalFrequency !== 'one-time' && (
                      <div className="h-40 mt-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Fund Requirement Timeline</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={goalResults.periodCosts}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8'}} />
                            <Tooltip 
                              formatter={(value: number) => [formatCurrency(value), 'Cost']}
                              contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="cost" fill="#e11d48" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* SIP with EMI Planner */}
              {activeCalc === 'sip_with_emi' && (
                <div className="p-8">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
                    <div className="max-w-2xl">
                      <h3 className="text-3xl font-black text-rose-600">
                        SIP with EMI Planner - Invest While Managing EMIs
                      </h3>
                      <p className="text-slate-500 mt-2 text-lg">
                        Find out the corpus size you may accumulate by investing 25% of your loan EMI through SIP
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                      <div className="space-y-6">
                        <PrecisionInput 
                          label="Outstanding Loan Amount"
                          value={sipWithEmiLoanAmount}
                          onChange={setSipWithEmiLoanAmount}
                          min={100000}
                          max={500000000}
                          step={100000}
                          prefix="₹"
                        />
                        <PrecisionInput 
                          label="Rate of Interest on Loan"
                          value={sipWithEmiLoanRate}
                          onChange={setSipWithEmiLoanRate}
                          min={4}
                          max={25}
                          step={0.1}
                          suffix="%"
                        />
                        <PrecisionInput 
                          label="Remaining Loan Tenure"
                          value={sipWithEmiLoanYears}
                          onChange={setSipWithEmiLoanYears}
                          min={1}
                          max={30}
                          step={1}
                          suffix="Y"
                        />
                        
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-sm flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-500 uppercase">Monthly EMI Amount</p>
                            <p className="text-lg font-black text-slate-900 border-2 border-rose-600 px-3 py-1 rounded-lg">{formatCurrency(sipWithEmiResults.emi)}</p>
                          </div>
                          <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-500 uppercase">Monthly SIP (25% of EMI)</p>
                            <p className="text-lg font-black text-slate-900 border-2 border-emerald-600 px-3 py-1 rounded-lg">{formatCurrency(sipWithEmiResults.sipAmount)}</p>
                          </div>
                        </div>

                        <PrecisionInput 
                          label="SIP Step-Up (Annual %)"
                          value={sipWithEmiStepUp}
                          onChange={setSipWithEmiStepUp}
                          min={0}
                          max={25}
                          step={1}
                          suffix="%"
                        />

                        <PrecisionInput 
                          label="Expected Rate of Return on SIP"
                          value={sipWithEmiSipRate}
                          onChange={setSipWithEmiSipRate}
                          min={4}
                          max={25}
                          step={0.5}
                          suffix="%"
                        />
                      </div>
                      
                      <button 
                        onClick={handleDownloadSIPWithEMIExcel}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-rose-100"
                      >
                        <Download size={20} />
                        SHARE NOW
                      </button>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
                            <div className="h-56 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sipWithEmiResults.chartData1} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" hide />
                                  <YAxis hide />
                                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {sipWithEmiResults.chartData1.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                               {sipWithEmiResults.chartData1.map((item, i) => (
                                 <div key={i} className="text-center">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{item.name}</p>
                                   <p className="text-xs font-bold text-slate-900">{formatCurrency(item.value)}</p>
                                 </div>
                               ))}
                            </div>
                          </div>

                          <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={sipWithEmiResults.chartData2} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                      {sipWithEmiResults.chartData2.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                               {sipWithEmiResults.chartData2.map((item, i) => (
                                 <div key={i} className="text-center">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{item.name}</p>
                                   <p className="text-xs font-bold text-slate-900">{formatCurrency(item.value)}</p>
                                 </div>
                               ))}
                            </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-[#bef264]/40 p-6 rounded-3xl border border-[#bef264]/60 space-y-4">
                             <h4 className="font-bold text-slate-900 border-b border-slate-900/10 pb-2 text-center underline uppercase text-xs">Loan Summary</h4>
                             <div className="space-y-4 text-center">
                                <div>
                                  <p className="text-xs font-bold text-slate-700">Total Loan Out Go</p>
                                  <p className="text-lg font-black text-slate-900">{formatCurrency(sipWithEmiResults.totalLoanPayment)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700">Total Interest Out Go</p>
                                  <p className="text-lg font-black text-slate-900">{formatCurrency(sipWithEmiResults.totalInterestPaid)}</p>
                                </div>
                             </div>
                          </div>

                          <div className="bg-[#bef264]/70 p-6 rounded-3xl border border-[#bef264]/90 space-y-4 shadow-sm">
                             <h4 className="font-bold text-slate-900 border-b border-slate-900/10 pb-2 text-center underline uppercase text-xs">Investment Summary</h4>
                             <div className="space-y-4 text-center">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-700">Fixed SIP Final Value</p>
                                    <p className="text-md font-black text-slate-900">{formatCurrency(sipWithEmiResults.investmentValueFixed)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-700">Step-Up SIP Final Value</p>
                                    <p className="text-md font-black text-slate-900 font-mono text-emerald-700">{formatCurrency(sipWithEmiResults.investmentValueStepUp)}</p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-black/5">
                                  <p className="text-[10px] font-bold text-slate-500 italic">Investing just 25% of your EMI with a {sipWithEmiStepUp}% annual step-up can potentially build a corpus of {formatCurrency(sipWithEmiResults.investmentValueStepUp)}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <AIRecommendation 
                         calculatorType="SIP with EMI"
                         inputs={{ loan: sipWithEmiLoanAmount, rate: sipWithEmiLoanRate, tenure: sipWithEmiLoanYears, sipRate: sipWithEmiSipRate, stepUp: sipWithEmiStepUp }}
                         results={{
                           ...sipWithEmiResults,
                           message: `By stepping up your 25% EMI SIP by ${sipWithEmiStepUp}% annually, you could accumulate an extra ${formatCurrency(sipWithEmiResults.investmentValueStepUp - sipWithEmiResults.investmentValueFixed)} compared to a fixed SIP.`
                         }}
                       />

                       <ExportButtons 
                         title="SIP with EMI Planner"
                         onDownload={handleDownloadCalculatorReport}
                         inputs={[
                           ['Loan Amount', formatCurrency(sipWithEmiLoanAmount)],
                           ['Loan Rate', `${sipWithEmiLoanRate}%`],
                           ['Tenure', `${sipWithEmiLoanYears} Years`],
                           ['EMI', formatCurrency(sipWithEmiResults.emi)],
                           ['SIP Amount', formatCurrency(sipWithEmiResults.sipAmount)],
                           ['SIP Step-Up', `${sipWithEmiStepUp}%`],
                           ['SIP Return Rate', `${sipWithEmiSipRate}%`]
                         ]}
                         results={[
                           ['Total Loan Outgo', formatCurrency(sipWithEmiResults.totalLoanPayment)],
                           ['Total Interest', formatCurrency(sipWithEmiResults.totalInterestPaid)],
                           ['Fixed SIP Value', formatCurrency(sipWithEmiResults.investmentValueFixed)],
                           ['Step-Up Value', formatCurrency(sipWithEmiResults.investmentValueStepUp)]
                         ]}
                       />
                    </div>
                  </div>
                </div>
              )}
              {/* Child Education Planner */}
              {activeCalc === 'child_education' && (
                <div className="p-8">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
                    <div className="max-w-2xl">
                      <h3 className="text-3xl font-black text-rose-600">
                        Child Education Planner Calculator
                      </h3>
                      <p className="text-slate-500 mt-2 text-lg">
                        Find out different investment options to plan for your child's future
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="space-y-6">
                        <PrecisionInput 
                          label="Current Age of Child"
                          value={childAge}
                          onChange={setChildAge}
                          min={0}
                          max={30}
                          step={1}
                          suffix="Year"
                        />
                        <PrecisionInput 
                          label="Corpus Required"
                          value={corpusRequired}
                          onChange={setCorpusRequired}
                          min={100000}
                          max={1000000000}
                          step={100000}
                          prefix="₹"
                        />
                        <PrecisionInput 
                          label="Corpus Required at Age of"
                          value={targetAge}
                          onChange={setTargetAge}
                          min={Math.max(5, childAge + 1)}
                          max={31}
                          step={1}
                        />
                        <PrecisionInput 
                          label="Expected Rate of Return"
                          value={eduReturnRate}
                          onChange={setEduReturnRate}
                          min={4}
                          max={25} // Image says max 12% in slider but 25% for other tools, sticking to a reasonable max
                          step={0.5}
                          suffix="%"
                        />
                        <PrecisionInput 
                          label="Rate of Inflation"
                          value={inflationRate}
                          onChange={setInflationRate}
                          min={1}
                          max={20}
                          step={0.5}
                          suffix="%"
                        />
                        <PrecisionInput 
                          label="SIP Step Up (Annual)"
                          value={sipStepUp}
                          onChange={setSipStepUp}
                          min={1}
                          max={25}
                          step={1}
                          suffix="%"
                        />
                      </div>
                      
                      <button 
                        onClick={handleDownloadChildEduExcel}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-rose-100"
                      >
                        <Download size={20} />
                        SHARE NOW
                      </button>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
                            <h4 className="text-sm font-bold text-slate-700 mb-6">Monthly SIP Amount</h4>
                            <div className="h-56 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={childEduResults.sipChart} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" hide />
                                  <YAxis hide />
                                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} label={{ position: 'top', formatter: (val: number) => `₹${formatNumber(val)}`, fontSize: 10 }}>
                                    {childEduResults.sipChart.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                               {childEduResults.sipChart.map((item, i) => (
                                 <div key={i} className="text-center">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">{item.name}</p>
                                 </div>
                               ))}
                            </div>
                          </div>

                          <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center">
                            <h4 className="text-sm font-bold text-slate-700 mb-6">Total Investment</h4>
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={childEduResults.investmentChart} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" hide />
                                    <YAxis hide />
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} label={{ position: 'top', formatter: (val: number) => `₹${formatNumber(val)}`, fontSize: 10 }}>
                                      {childEduResults.investmentChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-4 w-full">
                               {childEduResults.investmentChart.map((item, i) => (
                                 <div key={i} className="text-center">
                                   <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">{item.name}</p>
                                 </div>
                               ))}
                            </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-[#bef264]/40 p-6 rounded-3xl border border-[#bef264]/60 space-y-4">
                             <h4 className="font-bold text-slate-900 border-b border-slate-900/10 pb-2 text-center underline uppercase text-xs">SIP Amount</h4>
                             <div className="space-y-4 text-center">
                                <div>
                                  <p className="text-xs font-bold text-slate-700">Fixed SIP</p>
                                  <p className="text-lg font-black text-slate-900">{formatCurrency(childEduResults.fixedSip)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700">Step Up SIP</p>
                                  <p className="text-lg font-black text-slate-900">{formatCurrency(childEduResults.stepUpSip)}</p>
                                </div>
                             </div>
                          </div>

                          <div className="bg-[#bef264]/70 p-6 rounded-3xl border border-[#bef264]/90 space-y-4 shadow-sm">
                             <h4 className="font-bold text-slate-900 border-b border-slate-900/10 pb-2 text-center underline uppercase text-xs">Total Investment Value</h4>
                             <div className="space-y-4 text-center">
                                <div>
                                  <p className="text-xs font-bold text-slate-700">Education Corpus</p>
                                  <p className="text-lg font-black text-slate-900">{formatCurrency(childEduResults.futureCorpus)}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-700">Fixed SIP</p>
                                    <p className="text-sm font-black text-slate-900">{formatCurrency(childEduResults.totalInvestedFixed)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-700">Step Up SIP</p>
                                    <p className="text-sm font-black text-slate-900">{formatCurrency(childEduResults.totalInvestedStepUp)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-700">Lumpsum</p>
                                    <p className="text-sm font-black text-slate-900">{formatCurrency(childEduResults.lumpsumRequired)}</p>
                                  </div>
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <AIRecommendation 
                         calculatorType="Child Education"
                         inputs={{ currentAge: childAge, targetAge, corpus: corpusRequired, returnRate: eduReturnRate, inflation: inflationRate, stepUp: sipStepUp }}
                         results={{
                           futureCorpus: childEduResults.futureCorpus,
                           fixedSip: childEduResults.fixedSip,
                           stepUpSip: childEduResults.stepUpSip,
                           totalInvestedFixed: childEduResults.totalInvestedFixed,
                           totalInvestedStepUp: childEduResults.totalInvestedStepUp,
                           lumpsumRequired: childEduResults.lumpsumRequired
                         }}
                       />

                       <ExportButtons 
                         title="Child Education Planner"
                         onDownload={handleDownloadCalculatorReport}
                         inputs={[
                           ['Current Age', childAge.toString()],
                           ['Target Age', targetAge.toString()],
                           ['Required Corpus', formatCurrency(corpusRequired)],
                           ['Inflation', `${inflationRate}%`],
                           ['Return Rate', `${eduReturnRate}%`],
                           ['Step Up', `${sipStepUp}%`]
                         ]}
                         results={[
                           ['Future Corpus', formatCurrency(childEduResults.futureCorpus)],
                           ['Fixed SIP', formatCurrency(childEduResults.fixedSip)],
                           ['Step-Up SIP', formatCurrency(childEduResults.stepUpSip)],
                           ['Total Invested (Step-Up)', formatCurrency(childEduResults.totalInvestedStepUp)]
                         ]}
                       />
                    </div>
                  </div>
                </div>
              )}

              {activeCalc === 'loan_eligibility' && (
                <div className="p-8">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
                    <div className="max-w-2xl font-sans">
                      <h3 className="text-3xl font-black text-violet-600 flex items-center gap-3">
                        <Landmark className="text-violet-600" size={32} />
                        Loan Eligibility Checker
                      </h3>
                      <p className="text-slate-500 mt-2 text-lg">
                        Determine the maximum loan amount you can comfortably afford using your actual net income and active obligations.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-sans">
                    <div className="lg:col-span-1 space-y-8">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                          <span className="text-sm font-bold text-slate-700">Financial Profile</span>
                          <button
                            onClick={() => {
                              setEligIncome(initialMonthlyIncome);
                              setEligLiability(initialMonthlyLiabilities);
                            }}
                            className="text-xs font-bold text-violet-600 hover:text-violet-700 bg-white border border-violet-100 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                          >
                            Sync Profile Baselines
                          </button>
                        </div>

                        <div className="space-y-6">
                          <PrecisionInput 
                            label="Monthly Net Income"
                            value={eligIncome}
                            onChange={setEligIncome}
                            min={1000}
                            max={5000000}
                            step={5000}
                            prefix="₹"
                          />
                          <div className="flex gap-2 text-[11px] text-slate-500 font-medium -mt-2 bg-emerald-50 text-emerald-700 p-2.5 rounded-xl border border-emerald-100">
                            <span className="font-bold">✨ Baseline:</span>
                            <span>Registered Income: {formatCurrency(initialMonthlyIncome)} / month</span>
                          </div>

                          <PrecisionInput 
                            label="Existing Monthly EMIs (Liabilities)"
                            value={eligLiability}
                            onChange={setEligLiability}
                            min={0}
                            max={2000000}
                            step={1000}
                            prefix="₹"
                          />
                          <div className="flex gap-2 text-[11px] text-slate-500 font-medium -mt-2 bg-rose-50 text-rose-700 p-2.5 rounded-xl border border-rose-100">
                            <span className="font-bold">✨ Baseline:</span>
                            <span>Active Obligations: {formatCurrency(initialMonthlyLiabilities)} / month</span>
                          </div>

                          <PrecisionInput 
                            label="Allowed FOIR Cap (%)"
                            value={eligFOIR}
                            onChange={setEligFOIR}
                            min={10}
                            max={80}
                            step={5}
                            suffix="%"
                          />

                          <PrecisionInput 
                            label="Prospective Loan Rate (%)"
                            value={eligRate}
                            onChange={setEligRate}
                            min={4}
                            max={25}
                            step={0.1}
                            suffix="%"
                          />

                          <PrecisionInput 
                            label="Prospective Loan Tenure (Years)"
                            value={eligYears}
                            onChange={setEligYears}
                            min={1}
                            max={30}
                            step={1}
                            suffix="Y"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                      {/* Primary Results Display */}
                      <div className="bg-violet-50/50 p-8 rounded-3xl border border-violet-100/60 font-sans">
                        <p className="text-xs font-black text-violet-600 uppercase tracking-widest mb-1">Max Affordable Loan Potential</p>
                        <h4 className="text-4xl font-black text-slate-900 mb-6">{formatCurrency(eligResults.maxLoanAmount)}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white p-5 rounded-2xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-500">Max New EMI Allowance</p>
                            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(eligResults.maxNewEmiPlayroom)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Under {eligFOIR}% FOIR rules</p>
                          </div>
                          <div className="bg-white p-5 rounded-2xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-500">Total Interest Component</p>
                            <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(eligResults.totalInterestPayable)}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Calculated over tenure</p>
                          </div>
                          <div className="bg-white p-5 rounded-2xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-500">Debt Obligations (FOIR)</p>
                            <p className={`text-xl font-bold mt-1 ${
                              eligResults.healthZone === 'Safe' ? 'text-emerald-600' :
                              eligResults.healthZone === 'Monitor' ? 'text-amber-600' : 'text-rose-600'
                            }`}>{eligResults.currentFOIR.toFixed(1)}%</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Zone: {eligResults.healthZone}</p>
                          </div>
                        </div>

                        {/* Warnings if no playroom exists */}
                        {eligResults.maxNewEmiPlayroom <= 0 && (
                          <div className="mt-6 flex items-start gap-3 bg-red-50 text-rose-700 p-4 rounded-2xl border border-red-100">
                            <AlertCircle size={20} className="mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-bold">Ineligible For Additional Debt</p>
                              <p className="text-xs text-rose-600/95 mt-1 font-medium leading-relaxed">
                                Your existing liabilities ({formatCurrency(eligResults.activeLiability)}) consume {eligResults.currentFOIR.toFixed(1)}% of your monthly net income, which exceeds your set FOIR ceiling of {eligFOIR}%. Close your existing obligations or declare alternative revenue paths to establish buying playroom.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Side by Side Multi-Type Analysis */}
                      <div className="space-y-4 font-sans">
                        <h4 className="font-extrabold text-slate-800 text-lg">Benchmark Packages & Tenures Comparison</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {eligResults.categoriesDetails.map((category) => (
                            <div key={category.name} className="bg-white border border-slate-100 p-5 rounded-2xl hover:border-violet-200 transition-all flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between border-b border-rose-50 pb-3 mb-3">
                                  <span className="font-extrabold text-[#111827] text-md">{category.name}</span>
                                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{category.interest}% Interest</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-4">{category.desc}</p>
                              </div>

                              <div className="bg-slate-50/70 p-3.5 rounded-xl space-y-2">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-500">Tenure Benchmark:</span>
                                  <span className="text-slate-800 font-extrabold">{category.defaultYears} Years</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold border-t border-slate-100 pt-2">
                                  <span className="text-slate-500 font-bold">Max Loan Affordability:</span>
                                  <span className="text-violet-600 font-black">{formatCurrency(category.loanAmount)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pie chart analysis & Dynamic Guidance */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 font-sans">
                        <div className="border border-slate-100 rounded-3xl p-6 bg-white space-y-4">
                          <h4 className="font-bold text-slate-800 text-sm">Monthly Outflow Allocation</h4>
                          <div className="h-44">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={eligResults.pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {eligResults.pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-bold">
                            <div>
                              <div className="w-2.5 h-2.5 mx-auto rounded-full bg-[#f43f5e] mb-1"></div>
                              <span className="text-slate-500 block">Existing Debt EMI</span>
                              <span className="text-[#111827] block">{formatCurrency(eligResults.activeLiability)}</span>
                            </div>
                            <div>
                              <div className="w-2.5 h-2.5 mx-auto rounded-full bg-[#10b981] mb-1"></div>
                              <span className="text-slate-500 block">Fresh EMI Limit</span>
                              <span className="text-[#111827] block">{formatCurrency(eligResults.maxNewEmiPlayroom)}</span>
                            </div>
                            <div>
                              <div className="w-2.5 h-2.5 mx-auto rounded-full bg-[#cbd5e1] mb-1"></div>
                              <span className="text-slate-500 block">Savings & Living</span>
                              <span className="text-[#111827] block">{formatCurrency(Math.max(0, eligResults.activeIncome - eligResults.activeLiability - eligResults.maxNewEmiPlayroom))}</span>
                            </div>
                          </div>
                        </div>

                        {/* Strategic Tips Panel */}
                        <div className="border border-slate-100 rounded-3xl p-6 bg-white space-y-4 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              <Sparkles size={16} className="text-amber-500" />
                              How to Enhance Your Loan Eligibility
                            </h4>
                            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">Consider these expert techniques to borrow more if your maximum eligibility is insufficient:</p>
                            <ul className="space-y-3 text-xs leading-relaxed text-slate-600">
                              <li className="flex items-start gap-2.5">
                                <span className="p-1 rounded-full bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">✓</span>
                                <span><strong>Add Co-Applicant Income:</strong> Including your working spouse or parent adds their income to the pool, dramatically increasing Max EMI headroom.</span>
                              </li>
                              <li className="flex items-start gap-2.5">
                                <span className="p-1 rounded-full bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">✓</span>
                                <span><strong>Consolidate & Close Existing Debt:</strong> Prepaying small active credit card/personal loans frees up existing monthly EMIs, transferring that entire portion straight to your fresh eligibility pool.</span>
                              </li>
                              <li className="flex items-start gap-2.5">
                                <span className="p-1 rounded-full bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">✓</span>
                                <span><strong>Extend Debt Tenure:</strong> Selecting a 30-year option rather than 20-year home tenure reduces monthly pressure, letting you qualify for larger lump amounts (though compounding total interest will rise).</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <AIRecommendation 
                        calculatorType="Loan Eligibility"
                        inputs={{
                          monthlyIncome: eligResults.activeIncome,
                          existingEMI: eligResults.activeLiability,
                          proposedRate: eligRate,
                          proposedYears: eligYears,
                          foirRatio: eligFOIR
                        }}
                        results={{
                          maxFreshEmiRoom: eligResults.maxNewEmiPlayroom,
                          maxAffordableLoan: eligResults.maxLoanAmount,
                          totalInterest: eligResults.totalInterestPayable,
                          currentFoir: eligResults.currentFOIR,
                          projectedFoir: eligResults.projectedFOIR,
                          loanZone: eligResults.healthZone
                        }}
                      />

                      <ExportButtons 
                        title="Loan Eligibility Analysis"
                        onDownload={handleDownloadCalculatorReport}
                        inputs={[
                          ['Monthly Net Income', formatCurrency(eligResults.activeIncome)],
                          ['Active Existing EMIs', formatCurrency(eligResults.activeLiability)],
                          ['Allowed FOIR Cap', `${eligFOIR}%`],
                          ['Prospective Interest Rate', `${eligRate}%`],
                          ['Prospective Loan Tenure', `${eligYears} Years`]
                        ]}
                        results={[
                          ['Disposable EMI for New Loan', formatCurrency(eligResults.maxNewEmiPlayroom)],
                          ['Maximum Eligible Loan Amount', formatCurrency(eligResults.maxLoanAmount)],
                          ['Total Interest Component', formatCurrency(eligResults.totalInterestPayable)],
                          ['Total Cumulative Outflow', formatCurrency(eligResults.totalRepayment)],
                          ['Current Debt-to-Income (FOIR)', `${eligResults.currentFOIR.toFixed(1)}%`],
                          ['Projected Debt-to-Income', `${eligResults.projectedFOIR.toFixed(1)}%`]
                        ]}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FinancialCalculators;
