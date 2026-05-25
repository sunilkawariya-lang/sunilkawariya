
import React, { useMemo } from 'react';
import { PortfolioState, Investment } from '../types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  PieChart as PieChartIcon, 
  BarChart2, 
  Briefcase, 
  Layers, 
  Info,
  TrendingUp,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';

interface MutualFundAnalyticsProps {
  portfolio: PortfolioState;
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#f43f5e', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316'
];

const MutualFundAnalytics: React.FC<MutualFundAnalyticsProps> = ({ portfolio }) => {
  const mfInvestments = useMemo(() => {
    return portfolio.investments.filter(inv => 
      inv.category === 'Equity' || inv.category === 'Hybrid' || inv.subCategory.toLowerCase().includes('fund')
    );
  }, [portfolio.investments]);

  const fundHouseData = useMemo(() => {
    const aggregation: Record<string, number> = {};
    mfInvestments.forEach(inv => {
      const house = inv.fundHouse || 'Other / Direct';
      aggregation[house] = (aggregation[house] || 0) + inv.currentValue;
    });
    return Object.entries(aggregation)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [mfInvestments]);

  const subCategoryData = useMemo(() => {
    const aggregation: Record<string, number> = {};
    mfInvestments.forEach(inv => {
      const sub = inv.subCategory || 'Other';
      aggregation[sub] = (aggregation[sub] || 0) + inv.currentValue;
    });
    return Object.entries(aggregation)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [mfInvestments]);

  const sectorData = useMemo(() => {
    const aggregation: Record<string, number> = {};
    let totalValue = 0;
    
    mfInvestments.forEach(inv => {
      if (inv.analysis?.sectorAllocation) {
        inv.analysis.sectorAllocation.forEach(s => {
          const weight = (s.percentage / 100) * inv.currentValue;
          aggregation[s.sector] = (aggregation[s.sector] || 0) + weight;
          totalValue += weight;
        });
      } else if (inv.sector) {
        aggregation[inv.sector] = (aggregation[inv.sector] || 0) + inv.currentValue;
        totalValue += inv.currentValue;
      }
    });

    return Object.entries(aggregation)
      .map(([name, value]) => ({ 
        name, 
        value, 
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [mfInvestments]);

  const stockData = useMemo(() => {
    const aggregation: Record<string, number> = {};
    let totalValue = 0;

    mfInvestments.forEach(inv => {
      if (inv.analysis?.topHoldings) {
        inv.analysis.topHoldings.forEach(h => {
          const weight = (h.percentage / 100) * inv.currentValue;
          aggregation[h.name] = (aggregation[h.name] || 0) + weight;
          totalValue += weight;
        });
      }
    });

    return Object.entries(aggregation)
      .map(([name, value]) => ({ 
        name, 
        value, 
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [mfInvestments]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  if (mfInvestments.length === 0) {
    return (
      <div className="premium-card p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Briefcase size={32} />
        </div>
        <h3 className="text-xl font-bold text-wealth-navy">No Mutual Fund Data</h3>
        <p className="text-sm text-slate-500 mt-2">Add mutual fund investments to see detailed analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fund House Exposure */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Building2 size={20} />
            </div>
            <h3 className="text-lg font-bold text-wealth-navy">Fund House Exposure</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fundHouseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fundHouseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sub-category Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Layers size={20} />
            </div>
            <h3 className="text-lg font-bold text-wealth-navy">Category Breakdown</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sector Allocation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <BarChart2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-wealth-navy">Sector Allocation</h3>
            </div>
            {sectorData.length === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100">
                <Info size={12} />
                Analyze funds to see data
              </div>
            )}
          </div>
          <div className="h-80">
            {sectorData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500">Sector data is aggregated from AI fund analysis. Please analyze your mutual funds to populate this chart.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Holdings (Stock Level) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="premium-card p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-lg font-bold text-wealth-navy">Top 10 Holdings (Aggregate)</h3>
            </div>
            {stockData.length === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                <Info size={12} />
                Analyze funds to see data
              </div>
            )}
          </div>
          <div className="h-80">
            {stockData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stockData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500">Stock level data is aggregated from AI fund analysis. Please analyze your mutual funds to populate this chart.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MutualFundAnalytics;
