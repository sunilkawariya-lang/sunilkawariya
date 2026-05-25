
import React, { useMemo, useState } from 'react';
import { PortfolioState, InsurancePolicy } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Area
} from 'recharts';
import { format, addMonths, isBefore, isAfter, startOfYear, endOfYear, getYear, differenceInMonths } from 'date-fns';
import { Calendar, History, TrendingUp, Filter, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface InsuranceCashFlowProps {
  portfolio: PortfolioState;
}

const InsuranceCashFlow: React.FC<InsuranceCashFlowProps> = ({ portfolio }) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('All');
  const today = new Date();

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const cashFlowData = useMemo(() => {
    const policiesToAnalyze = selectedPolicyId === 'All' 
      ? portfolio.insurances 
      : portfolio.insurances.filter(p => p.id === selectedPolicyId);

    const yearData: Record<number, { year: number; premiumOutflow: number; benefitsInflow: number }> = {};

    policiesToAnalyze.forEach(policy => {
      const start = new Date(policy.startDate);
      const end = new Date(policy.expiryDate);
      const premium = policy.premium;
      
      const intervalMonths = 
        policy.premiumFrequency === 'Monthly' ? 1 :
        policy.premiumFrequency === 'Quarterly' ? 3 :
        policy.premiumFrequency === 'Half-Yearly' ? 6 : 12;

      // 1. Calculate Premiums (History + Future)
      let currentDate = start;
      while (isBefore(currentDate, end)) {
        const year = getYear(currentDate);
        if (!yearData[year]) yearData[year] = { year, premiumOutflow: 0, benefitsInflow: 0 };
        yearData[year].premiumOutflow += premium;
        currentDate = addMonths(currentDate, intervalMonths);
      }

      // 2. Maturity Benefit
      if (policy.maturityAmount && policy.maturityDate) {
        const matDate = new Date(policy.maturityDate);
        const matYear = getYear(matDate);
        if (!yearData[matYear]) yearData[matYear] = { year: matYear, premiumOutflow: 0, benefitsInflow: 0 };
        yearData[matYear].benefitsInflow += policy.maturityAmount;
      }

      // 3. Survival Benefits / Other Cashflows
      if (policy.cashflows) {
        policy.cashflows.forEach(cf => {
          const cfDate = new Date(cf.date);
          const cfYear = getYear(cfDate);
          if (!yearData[cfYear]) yearData[cfYear] = { year: cfYear, premiumOutflow: 0, benefitsInflow: 0 };
          yearData[cfYear].benefitsInflow += cf.amount;
        });
      }
    });

    return Object.values(yearData).sort((a, b) => a.year - b.year);
  }, [portfolio.insurances, selectedPolicyId]);

  const currentYear = getYear(today);
  const historyData = cashFlowData.filter(d => d.year <= currentYear);
  const futureData = cashFlowData.filter(d => d.year > currentYear);

  const totalPaid = historyData.reduce((sum, d) => sum + d.premiumOutflow, 0);
  const totalFuture = futureData.reduce((sum, d) => sum + d.premiumOutflow, 0);
  const totalBenefits = cashFlowData.reduce((sum, d) => sum + d.benefitsInflow, 0);

  if (portfolio.insurances.length === 0) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 border-dashed text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="text-slate-300" size={24} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Insurance Analytics Available</h3>
        <p className="text-slate-500">Add an insurance policy to see premium history and future cash flow projections.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Premium & Cash Flow Projection</h3>
              <p className="text-sm text-slate-500">History and future projections of insurance flows.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none min-w-[200px]"
            >
              <option value="All">All Policies (Consolidated)</option>
              {portfolio.insurances.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.provider})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Premiums Paid (History)</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
              <ArrowDownRight className="text-rose-500" size={18} />
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expected Premiums (Future)</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-slate-900">{formatCurrency(totalFuture)}</p>
              <History className="text-indigo-500" size={18} />
            </div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Expected Benefits</p>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalBenefits)}</p>
              <ArrowUpRight className="text-emerald-600" size={18} />
            </div>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-[400px] w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="year" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12 }}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px'
                }}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" height={36} />
              <Bar 
                dataKey="premiumOutflow" 
                name="Premium Outflow" 
                fill="#6366F1" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
              <Bar 
                dataKey="benefitsInflow" 
                name="Benefits Inflow" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              />
              <Line 
                type="monotone" 
                dataKey="premiumOutflow" 
                stroke="#4F46E5" 
                strokeWidth={2} 
                dot={false}
                name="Premium Trend"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-700">Year</th>
                <th className="px-6 py-4 font-bold text-slate-700">Status</th>
                <th className="px-6 py-4 font-bold text-rose-600 text-right">Premium Outflow (Dr.)</th>
                <th className="px-6 py-4 font-bold text-emerald-600 text-right">Inflow Benefits (Cr.)</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-right">Net Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cashFlowData.map((row) => (
                <tr key={row.year} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.year}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      row.year < currentYear ? 'bg-slate-100 text-slate-500' : 
                      row.year === currentYear ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {row.year < currentYear ? 'Historic' : row.year === currentYear ? 'Current' : 'Future'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-rose-600 font-medium">-{formatCurrency(row.premiumOutflow)}</td>
                  <td className="px-6 py-4 text-right text-emerald-600 font-medium">{row.benefitsInflow > 0 ? `+${formatCurrency(row.benefitsInflow)}` : '—'}</td>
                  <td className={`px-6 py-4 text-right font-bold ${
                    (row.benefitsInflow - row.premiumOutflow) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {formatCurrency(row.benefitsInflow - row.premiumOutflow)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold">
                <td className="px-6 py-4 rounded-bl-3xl" colSpan={2}>Grand Total</td>
                <td className="px-6 py-4 text-right">-{formatCurrency(totalPaid + totalFuture)}</td>
                <td className="px-6 py-4 text-right">+{formatCurrency(totalBenefits)}</td>
                <td className="px-6 py-4 text-right rounded-br-3xl">
                  {formatCurrency(totalBenefits - (totalPaid + totalFuture))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-6 flex items-start gap-3 p-4 bg-indigo-50 rounded-2xl text-xs text-indigo-700">
          <Info size={16} className="flex-shrink-0 mt-0.5" />
          <p>
            The premium history and projections are calculated based on the policy start date and frequency. 
            Maturity benefits and survival payouts are shown based on the data associated with your savings-linked policies (ULIPs, Endowment plans, etc).
          </p>
        </div>
      </div>
    </div>
  );
};

export default InsuranceCashFlow;
