
import React, { useMemo, useState } from 'react';
import { PortfolioState, HistoricalSnapshot } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';

interface PortfolioPerformanceProps {
  portfolio: PortfolioState;
}

const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({ portfolio }) => {
  const [period, setPeriod] = useState<'Q' | 'H' | 'Y' | 'ALL'>('Y');

  const snapshots = useMemo(() => {
    if (!portfolio.historicalSnapshots || portfolio.historicalSnapshots.length === 0) {
      console.warn("PortfolioPerformance: No historical snapshots found");
      return [];
    }
    return [...portfolio.historicalSnapshots]
      .map(s => ({ ...s, rawDate: s.date }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [portfolio.historicalSnapshots]);

  const trendData = useMemo(() => {
    if (snapshots.length === 0) return [];

    const now = new Date();
    let startDate = new Date();
    
    if (period === 'Q') startDate.setMonth(now.getMonth() - 3);
    else if (period === 'H') startDate.setMonth(now.getMonth() - 6);
    else if (period === 'Y') startDate.setFullYear(now.getFullYear() - 1);
    else startDate = new Date(0); // All time

    const filtered = snapshots.filter(s => new Date(s.rawDate) >= startDate);
    if (filtered.length === 0) {
      // Fallback to last 2 snapshots if filter returns nothing
      if (snapshots.length >= 2) {
        return snapshots.slice(-2).map(s => ({
          ...s,
          date: new Date(s.rawDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          withAddition: s.totalValue,
          withoutAddition: s.totalValue,
          invested: s.investedValue
        }));
      }
      return [];
    }

    // Group by month and take the last one for each month
    const monthEndMap = new Map<string, HistoricalSnapshot>();
    let minDate = new Date();
    let maxDate = new Date();
    
    filtered.forEach(s => {
      const d = new Date(s.rawDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthEndMap.get(monthKey);
      if (!existing || new Date(s.rawDate) > new Date(existing.date)) {
        monthEndMap.set(monthKey, s);
      }
      
      if (d < minDate) minDate = d;
    });

    // Fill missing months between minDate and maxDate
    const processedFiltered: HistoricalSnapshot[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    
    let lastKnownSnapshot: HistoricalSnapshot | null = null;
    
    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const snapshot = monthEndMap.get(monthKey);
      
      if (snapshot) {
        processedFiltered.push(snapshot);
        lastKnownSnapshot = snapshot;
      } else if (lastKnownSnapshot) {
        // Carry forward last known snapshot for missing months
        processedFiltered.push({
          ...lastKnownSnapshot,
          date: new Date(current.getFullYear(), current.getMonth() + 1, 0).toISOString().split('T')[0], // Last day of month
        });
      }
      
      current.setMonth(current.getMonth() + 1);
    }

    if (processedFiltered.length === 0) return [];

    const startSnapshot = processedFiltered[0];
    const startInvested = startSnapshot.investedValue;

    return processedFiltered.map(s => {
      const additions = Math.max(0, s.investedValue - startInvested);
      const withoutAddition = s.totalValue - additions;
      
      return {
        ...s,
        date: new Date(s.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        withAddition: s.totalValue,
        withoutAddition: withoutAddition,
        invested: s.investedValue
      };
    });
  }, [snapshots, period]);

  const performanceMetrics = useMemo(() => {
    if (snapshots.length < 2) return null;

    const now = snapshots[snapshots.length - 1];
    
    const getReturn = (months: number) => {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - months);
      const start = snapshots.find(s => new Date(s.date) >= targetDate) || snapshots[0];
      
      const additions = Math.max(0, now.investedValue - start.investedValue);
      const organicValue = now.totalValue - additions;
      const periodReturn = start.totalValue > 0 ? ((organicValue / start.totalValue) - 1) * 100 : 0;
      
      return {
        return: periodReturn,
        absolute: Math.max(0, now.totalValue - start.totalValue - additions),
        startValue: start.totalValue,
        endValue: now.totalValue
      };
    };

    return {
      qtr: getReturn(3),
      half: getReturn(6),
      year: getReturn(12)
    };
  }, [snapshots]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  if (snapshots.length === 0) {
    return (
      <div className="premium-card p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Activity size={32} />
        </div>
        <h3 className="text-xl font-bold text-wealth-navy">No Historical Data</h3>
        <p className="text-sm text-slate-500 mt-2">Historical trends will appear as your portfolio snapshots are recorded over time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Debug Info (Hidden in production usually, but good for now) */}
      <div className="hidden">Data points: {snapshots.length}, Trend points: {trendData.length}</div>
      
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Quarterly Return', data: performanceMetrics?.qtr },
          { label: 'Half-Yearly Return', data: performanceMetrics?.half },
          { label: 'Yearly Return', data: performanceMetrics?.year }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="premium-card p-6"
          >
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
            <div className="flex items-end justify-between">
              <div>
                <h4 className={`text-2xl font-black ${(item.data?.return || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(item.data?.return || 0).toFixed(2)}%
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {formatCurrency(item.data?.absolute || 0)} organic growth
                </p>
              </div>
              <div className={`p-2 rounded-lg ${(item.data?.return || 0) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {(item.data?.return || 0) >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Trend Chart */}
      <div className="premium-card p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-wealth-navy">Monthly Portfolio Trend</h3>
              <p className="text-xs text-slate-500">Comparison of growth with and without new capital additions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {(['Q', 'H', 'Y', 'ALL'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  period === p ? 'bg-white text-wealth-navy shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p === 'ALL' ? 'Since Inception' : p}
              </button>
            ))}
          </div>
        </div>

        <div className="h-96 min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="rawDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                tickFormatter={formatDate}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => {
                  try {
                    return new Date(label).toLocaleDateString('en-IN', { dateStyle: 'long' });
                  } catch (e) {
                    return label;
                  }
                }}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="withAddition" 
                name="Total Value (With Additions)" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWith)" 
              />
              <Area 
                type="monotone" 
                dataKey="withoutAddition" 
                name="Organic Value (Without Additions)" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorWithout)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inception Chart: Investment vs Value */}
      <div className="premium-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-wealth-navy">Wealth Creation Since Inception</h3>
            <p className="text-xs text-slate-500">Cumulative investment vs current portfolio value</p>
          </div>
        </div>

        <div className="h-80 min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="rawDate" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                tickFormatter={formatDate}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => {
                  try {
                    return new Date(label).toLocaleDateString('en-IN', { dateStyle: 'long' });
                  } catch (e) {
                    return label;
                  }
                }}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
              <Line 
                type="monotone" 
                dataKey="investedValue" 
                name="Total Investment" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="totalValue" 
                name="Portfolio Value" 
                stroke="#10b981" 
                strokeWidth={4} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPerformance;
