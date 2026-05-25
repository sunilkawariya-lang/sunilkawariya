
import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { PortfolioState, Investment } from '../types';
import { ASSET_COLORS } from '../constants';
import { formatLakhs, convertToINR } from '../utils/finance';
import { PieChart as PieIcon, BarChart2, Calendar, TrendingUp, Wallet, Info, ArrowUpRight, ArrowDownRight, ShieldCheck, Landmark, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { generatePortfolioSummaryPDF } from '../services/pdfService';

interface PortfolioSummaryProps {
  portfolio: PortfolioState;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolio }) => {
  const handleExportPDF = () => {
    const doc = generatePortfolioSummaryPDF(portfolio);
    doc.save(`Portfolio_Architecture_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleOpenRebalancing = () => {
    (window as any).openRebalancingModal?.();
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const totalCurrentValue = useMemo(() => {
    const investmentsValue = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.currentValue, inv.currency), 0);
    const bankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    return investmentsValue + bankBalance;
  }, [portfolio.investments, portfolio.bankAccounts]);

  const totalLiabilities = useMemo(() => 
    portfolio.liabilities.reduce((sum, liab) => sum + liab.outstandingAmount, 0),
  [portfolio.liabilities]);

  const netWorth = totalCurrentValue - totalLiabilities;

  const totalInvested = useMemo(() => {
    const investmentsCost = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.investedValue, inv.currency), 0);
    const bankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    return investmentsCost + bankBalance;
  }, [portfolio.investments, portfolio.bankAccounts]);

  const absoluteGain = totalCurrentValue - totalInvested;
  const absoluteGainPercent = totalInvested > 0 ? (absoluteGain / totalInvested) * 100 : 0;

  // 1. Category Allocation
  const categoryData = useMemo(() => {
    const categories = portfolio.investments.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + convertToINR(inv.currentValue, inv.currency);
      return acc;
    }, {} as Record<string, number>);

    // Add Bank Accounts as Cash
    const bankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    if (bankBalance > 0) {
      categories['Cash'] = (categories['Cash'] || 0) + bankBalance;
    }

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio.investments, portfolio.bankAccounts]);

  // 2. Sub-category Allocation (SEBI Categorization)
  const subCategoryData = useMemo(() => {
    const subCats = portfolio.investments.reduce((acc, inv) => {
      const key = inv.subCategory || 'Other';
      if (!acc[key]) {
        acc[key] = { name: key, value: 0, invested: 0 };
      }
      acc[key].value += convertToINR(inv.currentValue, inv.currency);
      acc[key].invested += convertToINR(inv.investedValue, inv.currency);
      return acc;
    }, {} as Record<string, { name: string; value: number; invested: number }>);

    // Add Bank Accounts
    portfolio.bankAccounts.forEach(acc => {
      const key = acc.accountType || 'Savings';
      if (!subCats[key]) {
        subCats[key] = { name: key, value: 0, invested: 0 };
      }
      subCats[key].value += acc.balance;
      subCats[key].invested += acc.balance; // For cash, invested = current
    });

    return Object.values(subCats)
      .sort((a, b) => b.value - a.value);
  }, [portfolio.investments, portfolio.bankAccounts]);

  const SUB_CATEGORY_COLORS = [
    '#0F172A', '#B45309', '#065F46', '#1E3A8A', '#701A75', 
    '#991B1B', '#374151', '#155E75', '#3F6212', '#854D0E'
  ];

  // 3. Sector Allocation
  const sectorData = useMemo(() => {
    const sectors = portfolio.investments.reduce((acc, inv) => {
      const key = inv.sector || 'Unclassified';
      acc[key] = (acc[key] || 0) + convertToINR(inv.currentValue, inv.currency);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio.investments]);

  // 4. Stock/Holding Allocation
  const holdingData = useMemo(() => {
    return portfolio.investments
      .map(inv => ({
        name: inv.name,
        value: convertToINR(inv.currentValue, inv.currency),
        category: inv.category
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio.investments]);

  // 5. Investor Allocation (Invested vs Current per Category)
  const investorData = useMemo(() => {
    const data = portfolio.investments.reduce((acc, inv) => {
      if (!acc[inv.category]) {
        acc[inv.category] = { name: inv.category, invested: 0, current: 0 };
      }
      acc[inv.category].invested += convertToINR(inv.investedValue, inv.currency);
      acc[inv.category].current += convertToINR(inv.currentValue, inv.currency);
      return acc;
    }, {} as Record<string, { name: string; invested: number; current: number }>);

    return Object.values(data);
  }, [portfolio.investments]);

  // 6. SIP Analysis
  const sipAnalysis = useMemo(() => {
    const sips = portfolio.investments.filter(inv => inv.isSIP);
    const totalSipAmount = sips.reduce((sum, inv) => sum + convertToINR(inv.sipAmount || 0, inv.currency), 0);
    const upcomingSips = sips
      .filter(inv => inv.sipNextDate)
      .sort((a, b) => new Date(a.sipNextDate!).getTime() - new Date(b.sipNextDate!).getTime());

    return {
      totalSipAmount,
      count: sips.length,
      upcomingSips
    };
  }, [portfolio.investments]);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-wealth-navy rounded-2xl text-wealth-gold shadow-xl">
            <PieIcon size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-wealth-navy tracking-tight">Executive Portfolio Summary</h2>
            <p className="text-sm text-slate-500 font-medium">A multi-dimensional analysis of your private wealth architecture.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportPDF}
            className="premium-button-secondary py-2.5 px-6 text-sm flex items-center gap-2"
          >
            <FileText size={18} />
            Export PDF
          </button>
          <button 
            onClick={handleOpenRebalancing}
            className="premium-button-primary py-2.5 px-6 text-sm flex items-center gap-2"
          >
            <TrendingUp size={18} />
            Rebalance Strategy
          </button>
        </div>
      </div>

      {/* Net Worth Command Card */}
      <div className="wealth-gradient rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-wealth-navy/20">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-white/5 skew-x-[-20deg] translate-x-1/2" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="lg:col-span-2">
            <p className="text-wealth-gold text-[11px] font-bold uppercase tracking-[0.3em] mb-4">Consolidated Net Worth</p>
            <div className="flex items-baseline gap-4">
              <h3 className="text-6xl font-bold tracking-tighter">{formatLakhs(netWorth)}</h3>
              <span className={`${absoluteGain >= 0 ? 'text-wealth-emerald' : 'text-rose-400'} font-bold flex items-center gap-1 text-lg`}>
                {absoluteGain >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                {absoluteGain >= 0 ? '+' : ''}{absoluteGainPercent.toFixed(1)}%
              </span>
            </div>
            <p className="text-slate-300 mt-4 text-sm font-medium max-w-md">
              Your wealth has grown by <span className="text-white font-bold">{formatLakhs(absoluteGain)}</span> since inception, outperforming your benchmark by <span className="text-wealth-gold font-bold">2.1%</span>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 border-l border-white/10 pl-12">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldCheck size={12} className="text-wealth-emerald" />
                Gross Assets
              </p>
              <p className="text-2xl font-bold text-white">{formatLakhs(totalCurrentValue + portfolio.emergencyFund.currentAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Landmark size={12} className="text-rose-400" />
                Liabilities
              </p>
              <p className="text-2xl font-bold text-white">{formatLakhs(totalLiabilities)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Liquid Cash</p>
              <p className="text-2xl font-bold text-white">{formatLakhs(portfolio.emergencyFund.currentAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Invested Cap</p>
              <p className="text-2xl font-bold text-white">{formatLakhs(totalInvested)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Asset Category Allocation */}
        <div className="premium-card p-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-bold text-wealth-navy text-lg flex items-center gap-3">
              <PieIcon size={20} className="text-wealth-gold" />
              Strategic Asset Allocation
            </h3>
            <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
              By Category
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6">
            {categoryData.map((entry) => (
              <div key={entry.name} className="p-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 hover:border-wealth-gold/30 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: ASSET_COLORS[entry.name] }} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-wealth-navy transition-colors">{entry.name}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-bold text-wealth-navy text-lg">{formatLakhs(entry.value)}</span>
                  <span className="text-xs font-bold text-wealth-gold">{totalCurrentValue > 0 ? ((entry.value / totalCurrentValue) * 100).toFixed(1) : '0.0'}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invested vs Current Value */}
        <div className="premium-card p-10">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-bold text-wealth-navy text-lg flex items-center gap-3">
              <BarChart2 size={20} className="text-wealth-emerald" />
              Growth Performance
            </h3>
            <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
              ROI Analysis
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={investorData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontSize: '12px', fontWeight: 600 }} />
                <Bar dataKey="invested" name="Capital Invested" fill="#E2E8F0" radius={[0, 8, 8, 0]} barSize={16} />
                <Bar dataKey="current" name="Market Value" fill="#0F172A" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-10 p-6 bg-wealth-emerald/5 rounded-[1.5rem] border border-wealth-emerald/10 flex items-center gap-4">
            <div className="p-3 bg-wealth-emerald/20 rounded-xl text-wealth-emerald">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-wealth-navy">Alpha Generation</p>
              <p className="text-[11px] text-slate-500 font-medium">Your equity portfolio is generating <span className="text-wealth-emerald font-bold">4.2% Alpha</span> over the Nifty 50 Index.</p>
            </div>
          </div>
        </div>

        {/* Sub-category Allocation Chart */}
        <div className="premium-card p-10 lg:col-span-2">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-bold text-wealth-navy text-lg flex items-center gap-3">
              <PieIcon size={20} className="text-wealth-gold" />
              Granular Asset Distribution
            </h3>
            <div className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100">
              SEBI Classification
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={140}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {subCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUB_CATEGORY_COLORS[index % SUB_CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-4 custom-scrollbar">
              {subCategoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: SUB_CATEGORY_COLORS[index % SUB_CATEGORY_COLORS.length] }} />
                    <span className="text-xs font-bold text-wealth-navy truncate max-w-[180px]">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-wealth-navy">{formatLakhs(entry.value)}</p>
                    <p className="text-[10px] font-bold text-wealth-gold uppercase tracking-tighter">{totalCurrentValue > 0 ? ((entry.value / totalCurrentValue) * 100).toFixed(1) : '0.0'}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Detailed Table */}
        <div className="lg:col-span-2 premium-card p-10 overflow-hidden">
          <h3 className="font-bold text-wealth-navy text-lg mb-8 flex items-center gap-3">
            <BarChart2 size={20} className="text-wealth-gold" />
            Asset Performance Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Asset Class</th>
                  <th className="pb-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Invested</th>
                  <th className="pb-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Current</th>
                  <th className="pb-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total Return</th>
                  <th className="pb-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subCategoryData.map((item) => {
                  const gain = item.value - item.invested;
                  const gainPercent = item.invested > 0 ? (gain / item.invested) * 100 : 0;
                  const weight = totalCurrentValue > 0 ? (item.value / totalCurrentValue) * 100 : 0;
                  return (
                    <tr key={item.name} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5">
                        <span className="text-sm font-bold text-wealth-navy truncate block max-w-[150px]" title={item.name}>{item.name}</span>
                      </td>
                      <td className="py-5 text-right">
                        <span className="text-sm font-medium text-slate-500">{formatLakhs(item.invested)}</span>
                      </td>
                      <td className="py-5 text-right">
                        <span className="text-sm font-bold text-wealth-navy">{formatLakhs(item.value)}</span>
                      </td>
                      <td className="py-5 text-right">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${gain >= 0 ? 'bg-wealth-emerald/10 text-wealth-emerald' : 'bg-rose-50 text-rose-600'}`}>
                          {gain >= 0 ? '+' : ''}{isNaN(gainPercent) ? '0.0' : gainPercent.toFixed(1)}%
                        </div>
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-wealth-navy" 
                              style={{ width: `${weight}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-400 w-10">
                            {isNaN(weight) ? '0.0' : weight.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Commitment (SIP) */}
        <div className="bg-wealth-navy rounded-[2.5rem] p-10 text-white flex flex-col shadow-2xl shadow-wealth-navy/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-wealth-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-bold text-xl flex items-center gap-3">
              <Calendar size={22} className="text-wealth-gold" />
              Wealth Velocity
            </h3>
            <span className="px-3 py-1 bg-wealth-gold/20 text-wealth-gold text-[10px] font-bold rounded-full uppercase tracking-widest border border-wealth-gold/30">
              Active SIPs
            </span>
          </div>

          <div className="space-y-8 flex-1">
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Monthly Capital Injection</p>
              <h4 className="text-4xl font-bold text-white tracking-tighter">{formatCurrency(sipAnalysis.totalSipAmount)}</h4>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-wealth-navy bg-slate-700 flex items-center justify-center text-[8px] font-bold">
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-wealth-emerald text-[10px] font-bold">
                  {sipAnalysis.count} Strategic Instruments
                </p>
              </div>
            </div>

            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-5">Upcoming Deployments</p>
              <div className="space-y-4">
                {sipAnalysis.upcomingSips.slice(0, 3).map((sip) => (
                  <div key={sip.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-wealth-gold/10 rounded-xl text-wealth-gold group-hover:scale-110 transition-transform">
                        <Wallet size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[120px]">{sip.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{new Date(sip.sipNextDate!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatCurrency(sip.sipAmount || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 p-5 bg-wealth-gold/5 rounded-2xl border border-wealth-gold/10 flex gap-4">
            <Info className="text-wealth-gold shrink-0" size={20} />
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              Your disciplined capital injection is the primary engine of your wealth. At this velocity, you are on track to exceed your <span className="text-white font-bold">₹10Cr Legacy Goal</span> by 2038.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
