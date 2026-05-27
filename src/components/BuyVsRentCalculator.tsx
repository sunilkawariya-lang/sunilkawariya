
import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Key, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Percent, 
  Calendar, 
  Info,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  PieChart as PieChartIcon,
  ChevronRight,
  FileText,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { generateBuyVsRentPDF } from '../services/pdfService';
import ExportButtons from './ExportButtons';
import AIRecommendation from './AIRecommendation';
import { handleDownloadCalculatorReport } from '../utils/exportUtils';

const BuyVsRentCalculator: React.FC = () => {
  // --- Buying Inputs ---
  const [homeValue, setHomeValue] = useState(10000000); // 1 Cr
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [registrationCostPercent, setRegistrationCostPercent] = useState(6);
  const [interiorCost, setInteriorCost] = useState(1000000);
  const [otherCosts, setOtherCosts] = useState(200000);
  
  const [mortgageRate, setMortgageRate] = useState(6.8);
  const [mortgageTenure, setMortgageTenure] = useState(30);
  const [propertyTaxMonthly, setPropertyTaxMonthly] = useState(2000);
  const [maintenanceMonthly, setMaintenanceMonthly] = useState(3000);
  const [propertyAppreciation, setPropertyAppreciation] = useState(5);

  // --- Renting Inputs ---
  const [monthlyRent, setMonthlyRent] = useState(50000);
  const [rentAppreciation, setRentAppreciation] = useState(3);
  const [investmentReturn, setInvestmentReturn] = useState(7);
  
  // --- Tax Inputs ---
  const [taxRegime, setTaxRegime] = useState<'old' | 'new'>('old');
  const [taxBracket, setTaxBracket] = useState(30);
  const [monthlyBasicSalary, setMonthlyBasicSalary] = useState(100000);
  const [monthlyHRA, setMonthlyHRA] = useState(40000);
  const [isMetro, setIsMetro] = useState(true);

  // --- Common Inputs ---
  const [timeframe, setTimeframe] = useState(5);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const results = useMemo(() => {
    // 1. Buying Calculations
    const downPayment = homeValue * (downPaymentPercent / 100);
    const registrationCost = homeValue * (registrationCostPercent / 100);
    const initialOutlay = downPayment + registrationCost + interiorCost + otherCosts;
    
    const loanAmount = homeValue - downPayment;
    const r = mortgageRate / 12 / 100;
    const n = mortgageTenure * 12;
    const emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    let currentLoanBalance = loanAmount;
    let totalEmiPaid = 0;
    let totalTaxesPaid = 0;
    let totalMaintenancePaid = 0;
    let totalTaxSavingsBuying = 0;
    
    const buyingYearlyData = [];
    let currentPropertyValue = homeValue;

    for (let year = 1; year <= timeframe; year++) {
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;
      for (let month = 1; month <= 12; month++) {
        const interest = currentLoanBalance * r;
        const principal = emi - interest;
        currentLoanBalance -= principal;
        totalEmiPaid += emi;
        totalTaxesPaid += propertyTaxMonthly;
        totalMaintenancePaid += maintenanceMonthly;
        yearlyInterest += interest;
        yearlyPrincipal += principal;
      }

      let yearlyTaxSavings = 0;
      if (taxRegime === 'old') {
        // Section 24(b) - Interest deduction up to 2L
        const interestDeduction = Math.min(yearlyInterest, 200000);
        // Section 80C - Principal deduction up to 1.5L (assuming available)
        const principalDeduction = Math.min(yearlyPrincipal, 150000);
        yearlyTaxSavings = (interestDeduction + principalDeduction) * (taxBracket / 100);
        totalTaxSavingsBuying += yearlyTaxSavings;
      }

      currentPropertyValue *= (1 + propertyAppreciation / 100);
      buyingYearlyData.push({
        year,
        propertyValue: currentPropertyValue,
        loanBalance: currentLoanBalance,
        equity: currentPropertyValue - currentLoanBalance,
        totalCost: initialOutlay + totalEmiPaid + totalTaxesPaid + totalMaintenancePaid - totalTaxSavingsBuying,
        yearlyTaxSavings
      });
    }

    const finalEquity = currentPropertyValue - currentLoanBalance;
    const totalBuyingCost = initialOutlay + totalEmiPaid + totalTaxesPaid + totalMaintenancePaid - totalTaxSavingsBuying;

    // 2. Renting Calculations
    let investmentValue = initialOutlay;
    let totalRentPaid = 0;
    let totalTaxSavingsRenting = 0;
    const invR = investmentReturn / 12 / 100;
    const rentR = rentAppreciation / 100;
    
    const rentingYearlyData = [];
    let currentRent = monthlyRent;

    for (let year = 1; year <= timeframe; year++) {
      let yearlyRent = 0;
      for (let month = 1; month <= 12; month++) {
        // Investment growth
        investmentValue *= (1 + invR);
        
        // Tax savings for Renting (HRA)
        let monthlyTaxSavings = 0;
        if (taxRegime === 'old') {
          const monthlyRentPaid = currentRent;
          const hraExemption = Math.min(
            monthlyHRA,
            Math.max(0, monthlyRentPaid - (monthlyBasicSalary * 0.1)),
            monthlyBasicSalary * (isMetro ? 0.5 : 0.4)
          );
          monthlyTaxSavings = hraExemption * (taxBracket / 100);
          totalTaxSavingsRenting += monthlyTaxSavings;
        }

        // Difference between Buying Monthly Cost and Renting Monthly Cost (Tax Adjusted)
        const yearlyTaxSavingsBuying = buyingYearlyData[year-1].yearlyTaxSavings;
        const monthlyTaxSavingsBuying = yearlyTaxSavingsBuying / 12;

        const buyingMonthlyCostNet = emi + propertyTaxMonthly + maintenanceMonthly - monthlyTaxSavingsBuying;
        const rentingMonthlyCostNet = currentRent - monthlyTaxSavings;
        
        const savings = buyingMonthlyCostNet - rentingMonthlyCostNet;
        investmentValue += savings;
        
        totalRentPaid += currentRent;
        yearlyRent += currentRent;
      }
      currentRent *= (1 + rentR);
      rentingYearlyData.push({
        year,
        investmentValue,
        totalRentPaid,
        totalTaxSavingsRenting
      });
    }

    const finalInvestmentValue = investmentValue;

    // 3. Comparison
    const buyingNetWorth = finalEquity;
    const rentingNetWorth = finalInvestmentValue;
    const difference = buyingNetWorth - rentingNetWorth;
    const winner = difference > 0 ? 'Buying' : 'Renting';

    // 4. Chart Data
    const chartData = buyingYearlyData.map((d, i) => ({
      year: `Year ${d.year}`,
      Buying: Math.round(d.equity),
      Renting: Math.round(rentingYearlyData[i].investmentValue)
    }));

    return {
      initialOutlay,
      emi,
      totalEmiPaid,
      totalTaxesPaid,
      totalMaintenancePaid,
      finalPropertyValue: currentPropertyValue,
      remainingLoan: currentLoanBalance,
      buyingNetWorth,
      rentingNetWorth,
      totalRentPaid,
      totalTaxSavingsBuying,
      totalTaxSavingsRenting,
      difference: Math.abs(difference),
      winner,
      chartData
    };
  }, [
    homeValue, downPaymentPercent, registrationCostPercent, interiorCost, otherCosts,
    mortgageRate, mortgageTenure, propertyTaxMonthly, maintenanceMonthly, propertyAppreciation,
    monthlyRent, rentAppreciation, investmentReturn, timeframe,
    taxRegime, taxBracket, monthlyBasicSalary, monthlyHRA, isMetro
  ]);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const doc = generateBuyVsRentPDF({
        homeValue,
        downPaymentPercent,
        registrationCostPercent,
        interiorCost,
        otherCosts,
        mortgageRate,
        mortgageTenure,
        propertyTaxMonthly,
        maintenanceMonthly,
        propertyAppreciation,
        monthlyRent,
        rentAppreciation,
        investmentReturn,
        timeframe,
        taxRegime,
        taxBracket,
        monthlyBasicSalary,
        monthlyHRA,
        isMetro,
        results
      });
      doc.save(`Buy_vs_Rent_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Inputs Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-6 space-y-6">
            <h4 className="text-sm font-bold text-wealth-navy uppercase tracking-widest flex items-center gap-2">
              <Home size={18} className="text-wealth-gold" />
              Property Details
            </h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Home Value</label>
                  <span className="text-sm font-bold text-wealth-navy">{formatCurrency(homeValue)}</span>
                </div>
                <input 
                  type="range" min="2000000" max="50000000" step="500000"
                  value={homeValue} onChange={(e) => setHomeValue(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-wealth-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Down Payment (%)</label>
                  <div className="relative">
                    <input 
                      type="number" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                    />
                    <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Registration (%)</label>
                  <div className="relative">
                    <input 
                      type="number" value={registrationCostPercent} onChange={(e) => setRegistrationCostPercent(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                    />
                    <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Interior Cost</label>
                  <input 
                    type="number" value={interiorCost} onChange={(e) => setInteriorCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Other Costs</label>
                  <input 
                    type="number" value={otherCosts} onChange={(e) => setOtherCosts(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 space-y-6">
            <h4 className="text-sm font-bold text-wealth-navy uppercase tracking-widest flex items-center gap-2">
              <Key size={18} className="text-wealth-gold" />
              Mortgage & Maintenance
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Interest Rate (%)</label>
                  <input 
                    type="number" step="0.1" value={mortgageRate} onChange={(e) => setMortgageRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tenure (Years)</label>
                  <input 
                    type="number" value={mortgageTenure} onChange={(e) => setMortgageTenure(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tax/Ins (Monthly)</label>
                  <input 
                    type="number" value={propertyTaxMonthly} onChange={(e) => setPropertyTaxMonthly(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Appreciation (%)</label>
                  <input 
                    type="number" step="0.5" value={propertyAppreciation} onChange={(e) => setPropertyAppreciation(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 space-y-6">
            <h4 className="text-sm font-bold text-wealth-navy uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={18} className="text-wealth-gold" />
              Renting & Investment
            </h4>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Monthly Rent</label>
                  <span className="text-sm font-bold text-wealth-navy">{formatCurrency(monthlyRent)}</span>
                </div>
                <input 
                  type="range" min="5000" max="200000" step="1000"
                  value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-wealth-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Rent Inc. (%)</label>
                  <input 
                    type="number" step="0.5" value={rentAppreciation} onChange={(e) => setRentAppreciation(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Inv. Return (%)</label>
                  <input 
                    type="number" step="0.5" value={investmentReturn} onChange={(e) => setInvestmentReturn(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                  />
                </div>
              </div>

          <div className="premium-card p-6 space-y-6">
            <h4 className="text-sm font-bold text-wealth-navy uppercase tracking-widest flex items-center gap-2">
              <FileText size={18} className="text-wealth-gold" />
              Tax Configuration
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Tax Regime</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTaxRegime('old')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      taxRegime === 'old' 
                        ? 'bg-wealth-navy text-white shadow-md' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Old Regime
                  </button>
                  <button
                    onClick={() => setTaxRegime('new')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      taxRegime === 'new' 
                        ? 'bg-wealth-navy text-white shadow-md' 
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    New Regime
                  </button>
                </div>
              </div>

              {taxRegime === 'old' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Income Tax Bracket (%)</label>
                    <select 
                      value={taxBracket} 
                      onChange={(e) => setTaxBracket(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                    >
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={15}>15%</option>
                      <option value={20}>20%</option>
                      <option value={25}>25%</option>
                      <option value={30}>30%</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Basic Salary (M)</label>
                      <input 
                        type="number" value={monthlyBasicSalary} onChange={(e) => setMonthlyBasicSalary(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">HRA Received (M)</label>
                      <input 
                        type="number" value={monthlyHRA} onChange={(e) => setMonthlyHRA(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-wealth-navy focus:ring-2 focus:ring-wealth-gold/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <input 
                      type="checkbox" id="isMetroBuyRent" checked={isMetro} 
                      onChange={(e) => setIsMetro(e.target.checked)}
                      className="w-4 h-4 text-wealth-gold bg-white border-slate-300 rounded focus:ring-wealth-gold"
                    />
                    <label htmlFor="isMetroBuyRent" className="text-[10px] font-bold text-slate-600 uppercase cursor-pointer">Living in a Metro City?</label>
                  </div>
                </div>
              )}

              {taxRegime === 'new' && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Under the <span className="font-bold">New Tax Regime</span>, most deductions like HRA exemption and Home Loan interest (Section 24b) are <span className="font-bold">not available</span>.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Timeframe (Years)</label>
              <span className="text-sm font-bold text-wealth-navy">{timeframe} Years</span>
            </div>
            <input 
              type="range" min="1" max="30" step="1"
              value={timeframe} onChange={(e) => setTimeframe(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-wealth-gold"
            />
          </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Verdict Card */}
          <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${
            results.winner === 'Buying' 
              ? 'bg-emerald-50 border-emerald-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${results.winner === 'Buying' ? 'bg-emerald-600' : 'bg-amber-600'} text-white`}>
                    {results.winner === 'Buying' ? <Home size={20} /> : <Key size={20} />}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest ${results.winner === 'Buying' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    Advisor's Verdict
                  </span>
                </div>
                <h3 className="text-3xl font-black text-wealth-navy">
                  {results.winner} is financially better by {formatCurrency(results.difference)}
                </h3>
                <p className="text-sm text-slate-600 font-medium max-w-xl">
                  Over a {timeframe}-year period, {results.winner.toLowerCase()} results in a higher net worth. 
                  This assumes a {propertyAppreciation}% property appreciation vs a {investmentReturn}% investment return.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth Advantage</p>
                <p className={`text-4xl font-black ${results.winner === 'Buying' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {formatCurrency(results.difference)}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buying Summary */}
            <div className="premium-card p-8 space-y-6">
              <h4 className="text-lg font-bold text-wealth-navy flex items-center gap-2">
                <Home className="text-emerald-600" size={20} />
                Buying Scenario
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Initial Outlay</span>
                  <span className="text-sm font-bold text-wealth-navy">{formatCurrency(results.initialOutlay)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Monthly EMI</span>
                  <span className="text-sm font-bold text-wealth-navy">{formatCurrency(results.emi)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Property Value ({timeframe}y)</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(results.finalPropertyValue)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Remaining Loan</span>
                  <span className="text-sm font-bold text-rose-600">{formatCurrency(results.remainingLoan)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Total Tax Savings</span>
                  <span className="text-sm font-bold text-emerald-600">+{formatCurrency(results.totalTaxSavingsBuying)}</span>
                </div>
                <div className="pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth (Equity)</p>
                  <p className="text-2xl font-black text-wealth-navy">{formatCurrency(results.buyingNetWorth)}</p>
                </div>
              </div>
            </div>

            {/* Renting Summary */}
            <div className="premium-card p-8 space-y-6">
              <h4 className="text-lg font-bold text-wealth-navy flex items-center gap-2">
                <TrendingUp className="text-amber-600" size={20} />
                Renting Scenario
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Initial Investment</span>
                  <span className="text-sm font-bold text-wealth-navy">{formatCurrency(results.initialOutlay)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Total Rent Paid</span>
                  <span className="text-sm font-bold text-rose-600">{formatCurrency(results.totalRentPaid)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Avg. Monthly Rent</span>
                  <span className="text-sm font-bold text-wealth-navy">{formatCurrency(results.totalRentPaid / (timeframe * 12))}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Inv. Growth Rate</span>
                  <span className="text-sm font-bold text-emerald-600">{investmentReturn}%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Total Tax Savings (HRA)</span>
                  <span className="text-sm font-bold text-emerald-600">+{formatCurrency(results.totalTaxSavingsRenting)}</span>
                </div>
                <div className="pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth (Investment)</p>
                  <p className="text-2xl font-black text-wealth-navy">{formatCurrency(results.rentingNetWorth)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="premium-card p-8">
            <h4 className="text-lg font-bold text-wealth-navy mb-8 flex items-center gap-2">
              <PieChartIcon className="text-wealth-gold" size={20} />
              Net Worth Projection Over Time
            </h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.chartData}>
                  <defs>
                    <linearGradient id="colorBuying" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRenting" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fill: '#64748b'}}
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="Buying" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBuying)" />
                  <Area type="monotone" dataKey="Renting" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRenting)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Advisor Insights */}
          <div className="bg-wealth-navy rounded-[2.5rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-wealth-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-wealth-gold/20 rounded-2xl flex items-center justify-center text-wealth-gold">
                  <Lightbulb size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold">Senior Advisor's Strategic Insights</h4>
                  <p className="text-slate-400 text-xs">Customized analysis for your 5-year horizon</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-wealth-gold uppercase tracking-widest">When Buying Wins</h5>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-wealth-gold mt-1.5 shrink-0" />
                      If property appreciation exceeds {propertyAppreciation + 1}%, the equity build-up significantly outpaces market returns.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-wealth-gold mt-1.5 shrink-0" />
                      Buying becomes superior if you plan to stay for more than 7-10 years, as initial closing costs are amortized over a longer period.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-wealth-gold mt-1.5 shrink-0" />
                      Tax benefits on home loan interest (Section 24) and principal (80C) can further tilt the scale towards buying.
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-wealth-gold uppercase tracking-widest">When Renting Wins</h5>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-wealth-gold mt-1.5 shrink-0" />
                      If you can achieve &gt;{investmentReturn + 2}% in the stock market, the compounding of the down payment usually beats real estate.
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-wealth-gold mt-1.5 shrink-0" />
                      Short horizons (&lt; 5 years) almost always favor renting due to high entry/exit costs in real estate (registration, brokerage, interiors).
                    </li>
                    <li className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-wealth-gold mt-1.5 shrink-0" />
                      Renting provides maximum liquidity and geographical flexibility for career growth.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-wealth-gold font-bold border border-white/10">
                    PB
                  </div>
                  <div>
                    <p className="text-sm font-bold">PMS Basket Advisory Team</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Institutional Grade Analysis</p>
                  </div>
                </div>

                <div className="w-full">
                  <AIRecommendation 
                    calculatorType="Buy vs Rent"
                    inputs={{ homeValue, monthlyRent, mortgageRate, timeframe, propertyAppreciation, investmentReturn }}
                    results={results}
                    variant="dark"
                  />
                </div>

                <ExportButtons 
                  title="Buy vs Rent Analysis"
                    variant="dark"
                    onDownload={handleDownloadCalculatorReport}
                    inputs={[
                      ['Property Value', formatCurrency(homeValue)],
                      ['Monthly Rent', formatCurrency(monthlyRent)],
                      ['Mortgage Rate', `${mortgageRate}%`],
                      ['Timeframe', `${timeframe} Years`]
                    ]}
                    results={[
                      ['Buying Net Worth', formatCurrency(results.buyingNetWorth)],
                      ['Renting Net Worth', formatCurrency(results.rentingNetWorth)],
                      ['Net Benefit', formatCurrency(results.difference)],
                      ['Winner', results.winner]
                    ]}
                  />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyVsRentCalculator;
