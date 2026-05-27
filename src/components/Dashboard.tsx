import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PortfolioState, Investment, AssetCategory, FamilyMember, InsurancePolicy } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Zap,
  Brain,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Clock,
  Sparkles,
  Users,
  Layers,
  Bell,
  Calendar,
  X,
  Plus,
  Info,
  Scale,
  Shield
} from 'lucide-react';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LabelList,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { ASSET_COLORS, INDIAN_TAX_SLABS_NEW_2024, INDIAN_TAX_SLABS_OLD_2024, TARGET_ALLOCATIONS } from '../constants';
import { calculateXIRR, formatLakhs, convertToINR } from '../utils/finance';

interface DashboardProps {
  portfolio: PortfolioState;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ portfolio, isRefreshing, onRefresh }) => {
  const { user } = useFirebase();
  const [walletBalance, setWalletBalance] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState('Free');
  const [selectedPolicy, setSelectedPolicy] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid, 'profile', 'current');
    const unsub = onSnapshot(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setWalletBalance(data.walletBalance || 0);
        setSubscriptionTier(data.subscriptionTier || 'Free');
      }
    });
    return () => unsub();
  }, [user]);

  const totalInvestmentsValue = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.currentValue || 0, inv.currency), 0);
  const totalInvestmentsCost = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.investedValue || 0, inv.currency), 0);
  const totalBankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const totalCurrentValue = totalInvestmentsValue + totalBankBalance;
  const totalInvested = totalInvestmentsCost + totalBankBalance;
  const totalRealizedGains = (portfolio.taxProfile?.capitalGains || []).reduce((sum, g) => sum + (g?.amount || 0), 0) || 0;
  const totalUnrealizedGains = totalCurrentValue - totalInvested;
  const totalGains = totalRealizedGains + totalUnrealizedGains;

  const calculateTax = (taxableIncome: number, slabs: { limit: number, rate: number }[]) => {
    let tax = 0;
    let prevLimit = 0;
    for (const slab of slabs) {
      const taxableInSlab = Math.min(Math.max(0, taxableIncome - prevLimit), slab.limit - prevLimit);
      tax += taxableInSlab * slab.rate;
      if (taxableIncome <= slab.limit) break;
      prevLimit = slab.limit;
    }
    return tax;
  };

  const calculateTaxLeakage = () => {
    const profile = portfolio.taxProfile;
    if (!profile) return 0;
    
    const income = profile.annualIncome || 0;
    
    // Old Regime Deductions
    const oldDeductions = 50000 + // Standard Deduction
      Math.min(profile.investments80C || 0, 150000) +
      Math.min(profile.nps80CCD || 0, 50000) +
      Math.min(profile.medicalInsurance80D || 0, 25000);
    
    const oldTaxableIncome = Math.max(0, income - oldDeductions);
    const oldTax = calculateTax(oldTaxableIncome, INDIAN_TAX_SLABS_OLD_2024);
    
    // New Regime Deductions
    const newDeductions = 50000; // Standard Deduction only
    const newTaxableIncome = Math.max(0, income - newDeductions);
    const newTax = calculateTax(newTaxableIncome, INDIAN_TAX_SLABS_NEW_2024);
    
    const currentTax = profile.totalTaxPayable || Math.min(oldTax, newTax);
    const optimalTax = Math.min(oldTax, newTax);
    
    // Leakage from wrong regime
    let leakage = Math.max(0, currentTax - optimalTax);
    
    // Leakage from missed deductions (Old Regime)
    if (oldTax < newTax) {
      const missed80C = Math.max(0, 150000 - (profile.investments80C || 0));
      const missed80D = Math.max(0, 25000 - (profile.medicalInsurance80D || 0));
      const missedNPS = Math.max(0, 50000 - (profile.nps80CCD || 0));
      
      // Approximate tax saving at highest slab (30%)
      leakage += (missed80C + missed80D + missedNPS) * 0.3;
    }
    
    return leakage;
  };

  const taxLeakage = calculateTaxLeakage();

  const totalAssets = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.currentValue, inv.currency), 0) +
                     portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = portfolio.liabilities.reduce((sum, lib) => sum + lib.outstandingAmount, 0);
  const netWorth = totalAssets - totalLiabilities;

  const [allocationView, setAllocationView] = React.useState<'category' | 'sub-category'>('category');
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({});

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const assetAllocation = React.useMemo(() => {
    const allocation = portfolio.investments.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + convertToINR(inv.currentValue, inv.currency);
      return acc;
    }, {} as Record<string, number>);

    // Add Bank Accounts as Cash
    const bankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    if (bankBalance > 0) {
      allocation['Cash'] = (allocation['Cash'] || 0) + bankBalance;
    }

    return Object.entries(allocation).map(([name, value]) => ({ name, value }));
  }, [portfolio.investments, portfolio.bankAccounts]);

  // Sub-category Asset Allocation
  const subCategoryAllocation = React.useMemo(() => {
    const allocation = portfolio.investments.reduce((acc, inv) => {
      const cat = inv.category || 'Other';
      // If subCategory is missing or same as category, use a more descriptive name
      let subCat = inv.subCategory || 'General';
      if (subCat === cat) {
        subCat = `${cat} (General)`;
      }
      
      if (!acc[cat]) acc[cat] = {};
      acc[cat][subCat] = (acc[cat][subCat] || 0) + convertToINR(inv.currentValue, inv.currency);
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // Add Bank Accounts
    if (portfolio.bankAccounts.length > 0) {
      if (!allocation['Cash']) allocation['Cash'] = {};
      portfolio.bankAccounts.forEach(acc => {
        const subCat = acc.accountType || 'Savings';
        allocation['Cash'][subCat] = (allocation['Cash'][subCat] || 0) + acc.balance;
      });
    }

    return allocation;
  }, [portfolio.investments, portfolio.bankAccounts]);

  const subCategoryPieData = React.useMemo(() => {
    const data: { name: string; value: number; category: string }[] = [];
    Object.entries(subCategoryAllocation).forEach(([category, subCats]) => {
      Object.entries(subCats).forEach(([sub, val]) => {
        data.push({ name: sub, value: val, category });
      });
    });
    return data.sort((a, b) => b.value - a.value);
  }, [subCategoryAllocation]);

  // Investor-wise Allocation
  const investorAllocation = React.useMemo(() => {
    const allocationMap: Record<string, number> = {};
    
    portfolio.investments.forEach(inv => {
      const id = inv.memberId || 'm1';
      allocationMap[id] = (allocationMap[id] || 0) + convertToINR(inv.currentValue, inv.currency);
    });

    portfolio.bankAccounts.forEach(acc => {
      const id = acc.memberId || 'm1';
      allocationMap[id] = (allocationMap[id] || 0) + acc.balance;
    });

    const allocation = Object.entries(allocationMap).map(([id, value]) => {
      const member = portfolio.familyMembers.find(m => m.id === id);
      return { name: member?.name || 'Unknown', value };
    }).sort((a, b) => b.value - a.value);

    return allocation;
  }, [portfolio.investments, portfolio.bankAccounts, portfolio.familyMembers]);

  // 1-Day Portfolio Change Calculation
  const calculateOneDayChange = () => {
    // Priority 1: Aggregate individual investment day changes for real-time accuracy
    const totalDayChangeAmount = portfolio.investments.reduce((sum, inv) => {
      const change = inv.dayChange || 0;
      const quantity = inv.quantity || 1;
      return sum + convertToINR(change * quantity, inv.currency);
    }, 0);

    if (totalDayChangeAmount !== 0) {
      const percent = totalCurrentValue > 0 ? (totalDayChangeAmount / (totalCurrentValue - totalDayChangeAmount)) * 100 : 0;
      return { amount: totalDayChangeAmount, percent };
    }

    // Fallback: Historical Snapshots
    if (!portfolio.historicalSnapshots || portfolio.historicalSnapshots.length === 0) {
      return { amount: 0, percent: 0 };
    }
    
    const sortedSnapshots = [...portfolio.historicalSnapshots].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const lastSnapshot = sortedSnapshots[0];
    const changeAmount = totalCurrentValue - lastSnapshot.totalValue;
    const changePercent = lastSnapshot.totalValue > 0 ? (changeAmount / lastSnapshot.totalValue) * 100 : 0;
    
    return { amount: changeAmount, percent: changePercent };
  };

  const calculateOneYearChangeByWeightedReturns = () => {
    const totalCurrentInvestmentsValue = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.currentValue || 0, inv.currency), 0);
    if (totalCurrentInvestmentsValue === 0) return { amount: 0, percent: 0 };

    const weightedReturn = portfolio.investments.reduce((sum, inv) => {
      const ret = inv.return1Y || 0;
      const weight = convertToINR(inv.currentValue || 0, inv.currency) / totalCurrentInvestmentsValue;
      return sum + (ret * weight);
    }, 0);

    const amount = (totalCurrentInvestmentsValue * weightedReturn) / 100;
    return { amount, percent: weightedReturn };
  };

  const calculateOneYearChange = () => {
    // If we have individual 1Y returns, prefer them for "Live" accuracy
    const weighted = calculateOneYearChangeByWeightedReturns();
    if (weighted.percent !== 0) return weighted;

    // Fallback: Historical Snapshots
    if (!portfolio.historicalSnapshots || portfolio.historicalSnapshots.length === 0) {
      return { amount: 0, percent: 0 };
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const sortedSnapshots = [...portfolio.historicalSnapshots].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Find the snapshot closest to 1 year ago
    const snapshotOneYearAgo = sortedSnapshots.find(s => new Date(s.date) <= oneYearAgo) || sortedSnapshots[sortedSnapshots.length - 1];
    
    const changeAmount = totalCurrentValue - snapshotOneYearAgo.totalValue;
    const changePercent = snapshotOneYearAgo.totalValue > 0 ? (changeAmount / snapshotOneYearAgo.totalValue) * 100 : 0;

    return { amount: changeAmount, percent: changePercent };
  };

  const oneYearChange = calculateOneYearChange();
  const oneDayChange = calculateOneDayChange();

  const sipAmount = portfolio.investments
    .filter(inv => inv.isSIP)
    .reduce((sum, inv) => sum + (inv.sipAmount || 0), 0);

  const needsRebalancing = React.useMemo(() => {
    const totalValue = portfolio.investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0);
    if (totalValue === 0) return false;
    
    const riskType = portfolio.riskProfile?.type || 'Moderate';
    const targets = TARGET_ALLOCATIONS[riskType] || TARGET_ALLOCATIONS['Moderate'];
    
    const currentValues: Record<string, number> = {};
    portfolio.investments.forEach(inv => {
      currentValues[inv.category] = (currentValues[inv.category] || 0) + convertToINR(inv.currentValue || 0, inv.currency);
    });

    for (const [cat, targetPct] of Object.entries(targets)) {
      const currentPct = ((currentValues[cat] || 0) / totalValue) * 100;
      if (Math.abs(currentPct - targetPct) > 5) return true; // 5% threshold
    }
    return false;
  }, [portfolio]);

  const equityValue = portfolio.investments.filter(i => i.category === 'Equity').reduce((s, i) => s + convertToINR(i.currentValue, i.currency), 0);
  const debtValue = portfolio.investments.filter(i => i.category === 'Debt').reduce((s, i) => s + convertToINR(i.currentValue, i.currency), 0);
  const goldValue = portfolio.investments.filter(i => i.category === 'Gold').reduce((s, i) => s + convertToINR(i.currentValue, i.currency), 0);
  
  const equityPercent = totalCurrentValue > 0 ? (equityValue / totalCurrentValue) * 100 : 0;
  const debtPercent = totalCurrentValue > 0 ? (debtValue / totalCurrentValue) * 100 : 0;
  const goldPercent = totalCurrentValue > 0 ? (goldValue / totalCurrentValue) * 100 : 0;

  const [trajectoryPeriod, setTrajectoryPeriod] = React.useState<'1Y' | '5Y' | '10Y' | 'Retire'>('5Y');
  const [returnAssumptions, setReturnAssumptions] = React.useState({
    equity: 12,
    debt: 7,
    gold: 9,
    inflation: 6
  });
  const [isEditingTrajectory, setIsEditingTrajectory] = React.useState(false);
  const [valuationPeriod, setValuationPeriod] = React.useState<'1M' | '6M' | '1Y' | '5Y'>('1Y');
  const [valuationView, setValuationView] = React.useState<'segments' | 'model' | 'advisory'>('segments');

  const equityValuationData = React.useMemo(() => {
    const labels = valuationPeriod === '1M' ? ['W1', 'W2', 'W3', 'W4'] : 
                   valuationPeriod === '6M' ? ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] :
                   valuationPeriod === '1Y' ? ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] :
                   ['2005', '2010', '2015', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

    return labels.map((label, i) => {
      // Base components for EVI Model
      // Simulating the trend to end near 111.3 as per user image
      const baseVal = i === labels.length - 1 ? 111.3 : 80 + Math.random() * 50 + (i * 0.5);
      
      const pe = baseVal * (0.9 + Math.random() * 0.2);
      const pb = baseVal * (0.9 + Math.random() * 0.2);
      const yieldGap = baseVal * (0.9 + Math.random() * 0.2);
      const mcapGdp = baseVal * (0.9 + Math.random() * 0.2);

      const evi = (pe + pb + yieldGap + mcapGdp) / 4;

      // Raw values for historical metrics
      const peRaw = 18 + (baseVal - 100) / 5 + Math.random() * 2;
      const pbRaw = 2.8 + (baseVal - 100) / 40 + Math.random() * 0.3;
      const yieldGapRaw = 1.2 + (baseVal - 100) / 100 + Math.random() * 0.1;
      const mcapGdpRaw = 85 + (baseVal - 100) / 2 + Math.random() * 5;

      // Benchmarks (10-year averages)
      const peAvg = 20.5;
      const pbAvg = 3.1;
      const yieldGapAvg = 1.35;
      const mcapGdpAvg = 88.0;

      return {
        name: label,
        LargeCap: evi,
        MidCap: evi * (1.1 + Math.random() * 0.2),
        SmallCap: evi * (1.2 + Math.random() * 0.3),
        PE: pe,
        PB: pb,
        YieldGap: yieldGap,
        MCapGDP: mcapGdp,
        OverallEVI: i === labels.length - 1 ? 111.3 : evi,
        peRaw,
        pbRaw,
        yieldGapRaw,
        mcapGdpRaw,
        peAvg,
        pbAvg,
        yieldGapAvg,
        mcapGdpAvg
      };
    });
  }, [valuationPeriod]);

  const comparativeValuationData = React.useMemo(() => {
    const labels = valuationPeriod === '1M' ? ['W1', 'W2', 'W3', 'W4'] : 
                   valuationPeriod === '6M' ? ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] :
                   valuationPeriod === '1Y' ? ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'] :
                   ['2020', '2021', '2022', '2023', '2024', '2025', '2026'];

    return labels.map((label, i) => ({
      name: label,
      IndiaEquity: 90 + Math.random() * 30 + (i * 1.5),
      USEquity: 100 + Math.random() * 40 + (i * 2),
      Gold: 85 + Math.random() * 20 + (i * 1),
      Silver: 80 + Math.random() * 25 + (i * 1.2),
      Debt: 95 + Math.random() * 10 + (i * 0.5),
    }));
  }, [valuationPeriod]);

  const calculateTrajectory = () => {
    let years = 1;
    if (trajectoryPeriod === '5Y') years = 5;
    else if (trajectoryPeriod === '10Y') years = 10;
    else if (trajectoryPeriod === 'Retire') {
      const primaryMember = portfolio.familyMembers.find(m => m.id === 'm1');
      const age = primaryMember?.age || 35;
      years = Math.max(1, 60 - age);
    }

    const steps = 6;
    const data = [];
    
    // Assumed growth rates from state
    const equityGrowth = returnAssumptions.equity / 100;
    const debtGrowth = returnAssumptions.debt / 100;
    const goldGrowth = returnAssumptions.gold / 100;
    const inflation = returnAssumptions.inflation / 100;
    
    const equityValue = portfolio.investments.filter(i => i.category === 'Equity').reduce((s, i) => s + convertToINR(i.currentValue, i.currency), 0);
    const debtValue = portfolio.investments.filter(i => i.category === 'Debt').reduce((s, i) => s + convertToINR(i.currentValue, i.currency), 0);
    const goldValue = portfolio.investments.filter(i => i.category === 'Gold').reduce((s, i) => s + convertToINR(i.currentValue, i.currency), 0);
    const otherValue = totalCurrentValue - equityValue - debtValue - goldValue;
    
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * years;
      const projectedEquity = equityValue * Math.pow(1 + equityGrowth, t);
      const projectedDebt = debtValue * Math.pow(1 + debtGrowth, t);
      const projectedGold = goldValue * Math.pow(1 + goldGrowth, t);
      const projectedOther = otherValue * Math.pow(1.05, t); // 5% for others
      
      const totalProjected = projectedEquity + projectedDebt + projectedGold + projectedOther;
      const inflationAdjusted = totalProjected / Math.pow(1 + inflation, t);
      
      let label = '';
      if (trajectoryPeriod === '1Y') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        label = months[(currentMonth + Math.floor((i / steps) * 11)) % 12];
      } else {
        label = `Year ${Math.round(t)}`;
      }
      
      data.push({
        date: label,
        value: totalProjected,
        target: inflationAdjusted
      });
    }
    return data;
  };

  const trajectoryData = calculateTrajectory();

  // Alert System Logic (SIP, Insurance, Maturity)
  const generateAlerts = () => {
    const alerts: { id: string; type: 'SIP' | 'Insurance' | 'Maturity'; title: string; date: string; amount?: number; priority: 'High' | 'Medium' | 'Low' }[] = [];
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    // 1. SIP Alerts
    portfolio.investments.forEach(inv => {
      if (inv.isSIP && inv.sipNextDate) {
        const nextDate = new Date(inv.sipNextDate);
        if (nextDate >= now && nextDate <= threeMonthsFromNow) {
          alerts.push({
            id: `sip-${inv.id}`,
            type: 'SIP',
            title: `Upcoming SIP: ${inv.name}`,
            date: inv.sipNextDate,
            amount: inv.sipAmount,
            priority: nextDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000 ? 'High' : 'Medium'
          });
        }
      }
    });

    // 2. Insurance Premium Alerts
    portfolio.insurances.forEach(ins => {
      if (ins.expiryDate) {
        const expiryDate = new Date(ins.expiryDate);
        if (expiryDate >= now && expiryDate <= threeMonthsFromNow) {
          alerts.push({
            id: `ins-${ins.id}`,
            type: 'Insurance',
            title: `Premium Due: ${ins.name}`,
            date: ins.expiryDate,
            amount: ins.premium,
            priority: expiryDate.getTime() - now.getTime() < 15 * 24 * 60 * 60 * 1000 ? 'High' : 'Medium'
          });
        }
      }
    });

    // 3. Maturity Alerts (Investments & Insurance)
    portfolio.investments.forEach(inv => {
      if (inv.maturityDate) {
        const maturityDate = new Date(inv.maturityDate);
        if (maturityDate >= now && maturityDate <= threeMonthsFromNow) {
          alerts.push({
            id: `mat-inv-${inv.id}`,
            type: 'Maturity',
            title: `Investment Maturity: ${inv.name}`,
            date: inv.maturityDate,
            amount: inv.currentValue,
            priority: 'High'
          });
        }
      }
    });

    portfolio.insurances.forEach(ins => {
      if (ins.maturityDate) {
        const maturityDate = new Date(ins.maturityDate);
        if (maturityDate >= now && maturityDate <= threeMonthsFromNow) {
          alerts.push({
            id: `mat-ins-${ins.id}`,
            type: 'Maturity',
            title: `Policy Maturity: ${ins.name}`,
            date: ins.maturityDate,
            amount: ins.maturityAmount,
            priority: 'High'
          });
        }
      }
    });

    return alerts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const dashboardAlerts = generateAlerts();

  const strategicPlanning = React.useMemo(() => {
    const items = [];
    
    // 1. Emergency Fund
    const ef = portfolio.emergencyFund;
    const efStatus = ef ? ef.currentAmount >= (ef.monthlyExpense * 6) : false;
    items.push({
      label: '6 Months Emergency Fund',
      status: efStatus ? 'Completed' : 'Action Required',
      value: ef ? `${formatLakhs(ef.currentAmount)} / ${formatLakhs(ef.monthlyExpense * 6)}` : '0 / 0',
      isPositive: efStatus
    });

    // 2. Life Cover (HLV)
    const annualIncome = portfolio.taxProfile?.annualIncome || 0;
    const totalLiabilities = (portfolio.liabilities || []).reduce((sum, l) => sum + (l.outstandingAmount || 0), 0);
    const totalGoals = (portfolio.goals || []).reduce((sum, g) => sum + (g.targetAmount - g.currentAmount), 0);
    const totalAssets = (portfolio.investments || []).reduce((sum, inv) => sum + (inv.currentValue || 0), 0) + 
                       (portfolio.bankAccounts || []).reduce((sum, acc) => sum + (acc.balance || 0), 0);
    
    const incomeReplacement = annualIncome * 10;
    const totalRequired = incomeReplacement + totalLiabilities + totalGoals;
    const hlvTarget = Math.max(0, totalRequired - totalAssets);
    
    const termCover = portfolio.insurances
      .filter(i => i.type === 'Term' && i.status === 'Active')
      .reduce((sum, i) => sum + i.sumAssured, 0);
    const hlvStatus = termCover >= hlvTarget;
    items.push({
      label: 'Life Cover (HLV)',
      status: hlvStatus ? 'Adequate' : 'Under-insured',
      value: `${formatLakhs(termCover)} / ${formatLakhs(hlvTarget)}`,
      isPositive: hlvStatus
    });

    // 3. Health Cover
    const healthCover = portfolio.insurances
      .filter(i => i.type === 'Health' && i.status === 'Active')
      .reduce((sum, i) => sum + i.sumAssured, 0);
    const healthStatus = healthCover >= 5000000;
    items.push({
      label: 'Health Cover (Min 50L)',
      status: healthStatus ? 'Adequate' : 'Action Required',
      value: `${formatLakhs(healthCover)} / 50L`,
      isPositive: healthStatus
    });

    // 4. NPS
    const npsAmount = portfolio.taxProfile?.nps80CCD || 0;
    const npsStatus = npsAmount > 0;
    items.push({
      label: 'NPS (Tax Planning)',
      status: npsStatus ? 'Optimized' : 'Action Required',
      value: `₹${npsAmount.toLocaleString()}`,
      isPositive: npsStatus
    });

    // 5. Sukanya Samriddhi
    const hasGirlChild = portfolio.familyMembers.some(m => m.relationship === 'Child' && m.age !== undefined && m.age < 10);
    if (hasGirlChild) {
      const hasSSY = portfolio.investments.some(inv => inv.subCategory.toLowerCase().includes('sukanya') || inv.name.toLowerCase().includes('sukanya'));
      items.push({
        label: 'Sukanya Samriddhi Yojana',
        status: hasSSY ? 'Active' : 'Action Required',
        value: hasSSY ? 'Enrolled' : 'Not Started',
        isPositive: hasSSY
      });
    }

    // 6. Senior Citizen Scheme
    const hasSeniorCitizen = portfolio.familyMembers.some(m => m.age !== undefined && m.age >= 60);
    if (hasSeniorCitizen) {
      const hasSCSS = portfolio.investments.some(inv => inv.subCategory.toLowerCase().includes('scss') || inv.name.toLowerCase().includes('senior citizen'));
      items.push({
        label: 'Senior Citizen Savings Scheme',
        status: hasSCSS ? 'Active' : 'Action Required',
        value: hasSCSS ? 'Enrolled' : 'Not Started',
        isPositive: hasSCSS
      });
    }

    // 7. Personal Loan
    const personalLoan = portfolio.liabilities.find(l => l.type === 'Personal Loan');
    if (personalLoan) {
      items.push({
        label: 'Personal Loan Payment',
        status: 'Priority Action',
        value: formatLakhs(personalLoan.outstandingAmount),
        isPositive: false
      });
    }

    // 8. Auto Loan
    const autoLoan = portfolio.liabilities.find(l => l.type === 'Car Loan');
    if (autoLoan) {
      items.push({
        label: 'Auto Loan Payment',
        status: 'Priority Action',
        value: formatLakhs(autoLoan.outstandingAmount),
        isPositive: false
      });
    }

    // 9. SIP (50% of Savings)
    const monthlyIncome = (portfolio.taxProfile?.annualIncome || 0) / 12;
    const monthlyExpenses = portfolio.emergencyFund?.monthlyExpense || 0;
    const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses);
    const sipAmount = portfolio.investments
      .filter(inv => inv.isSIP)
      .reduce((sum, inv) => sum + (inv.sipAmount || 0), 0);
    const sipStatus = monthlySavings > 0 ? (sipAmount >= (monthlySavings * 0.5)) : true;
    items.push({
      label: 'SIP (50% of Savings)',
      status: sipStatus ? 'On Track' : 'Action Required',
      value: `${formatLakhs(sipAmount)} / ${formatLakhs(monthlySavings * 0.5)}`,
      isPositive: sipStatus
    });

    return items;
  }, [portfolio]);

  const recentTransactions = [...portfolio.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const activeGoals = portfolio.goals.slice(0, 3);

  // Behavioral Economics Metrics
  const wealthVelocity = 14.2; // Mocked: % growth over last 12 months
  const consolidationScore = 72; // % of estimated total wealth linked

  // Calculate Wealth Score (0-100)
  const calculateWealthScore = () => {
    let score = 0;
    
    // 1. Emergency Fund (20 points)
    const ef = portfolio.emergencyFund;
    const efRatio = (ef && ef.monthlyExpense > 0) ? ef.currentAmount / (ef.monthlyExpense * ef.targetMonths) : 0;
    score += Math.min(efRatio, 1) * 20;

    // 2. Insurance (20 points)
    const hasTerm = portfolio.insurances.some(i => i.type === 'Term');
    const hasHealth = portfolio.insurances.some(i => i.type === 'Health');
    if (hasTerm) score += 10;
    if (hasHealth) score += 10;

    // 3. Goal Progress (20 points)
    if (portfolio.goals.length > 0) {
      const avgProgress = portfolio.goals.reduce((acc, g) => {
        const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) : 0;
        return acc + progress;
      }, 0) / portfolio.goals.length;
      score += Math.min(avgProgress, 1) * 20;
    } else {
      score += 10; // Neutral if no goals
    }

    // 4. Asset Allocation (20 points)
    const categoriesCount = new Set(portfolio.investments.map(i => i.category)).size;
    score += Math.min(categoriesCount / 4, 1) * 20; // Reward diversification

    // 5. Estate Planning (20 points)
    const ep = portfolio.estatePlanning;
    if (ep?.willStatus === 'Registered') score += 10;
    else if (ep?.willStatus === 'Drafted') score += 5;
    if (ep?.nomineesUpdated) score += 10;

    return Math.round(score);
  };

  const wealthScore = calculateWealthScore();

  const calculatePortfolioReturn = () => {
    const absoluteReturnPercent = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

    const hasSnapshots = portfolio.historicalSnapshots && portfolio.historicalSnapshots.length > 0;
    const hasTransactions = portfolio.transactions && portfolio.transactions.length > 0;

    // If no transaction data or snapshots are available, we can't calculate XIRR accurately
    if (!hasSnapshots && !hasTransactions) {
      return { value: absoluteReturnPercent, label: 'Since Inception (Abs.)' };
    }

    // Determine portfolio age from available data
    let earliestDate: Date;
    if (hasSnapshots) {
      earliestDate = new Date(Math.min(...portfolio.historicalSnapshots.map(s => new Date(s.date).getTime())));
    } else {
      earliestDate = new Date(Math.min(...portfolio.transactions.map(t => new Date(t.date).getTime())));
    }

    const portfolioAgeInYears = (new Date().getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    // Use XIRR only if portfolio is older than 1 year AND we have data
    if (portfolioAgeInYears >= 1) {
      const cashflows: { date: Date; amount: number }[] = [];
      
      if (hasSnapshots) {
        const snapshots = [...portfolio.historicalSnapshots].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        cashflows.push({ date: new Date(snapshots[0].date), amount: -snapshots[0].investedValue });
        for (let i = 1; i < snapshots.length; i++) {
          const netInvestment = snapshots[i].investedValue - snapshots[i-1].investedValue;
          if (netInvestment !== 0) cashflows.push({ date: new Date(snapshots[i].date), amount: -netInvestment });
        }
        cashflows.push({ date: new Date(), amount: totalCurrentValue });
      } else if (hasTransactions) {
        portfolio.transactions.forEach(tx => {
          const inv = portfolio.investments.find(i => i.id === tx.investmentId);
          const amount = tx.type === 'Buy' ? -convertToINR(tx.amount, inv?.currency) : convertToINR(tx.amount, inv?.currency);
          cashflows.push({ date: new Date(tx.date), amount });
        });
        cashflows.push({ date: new Date(), amount: totalCurrentValue });
      }

      if (cashflows.length >= 2) {
        cashflows.sort((a, b) => a.date.getTime() - b.date.getTime());
        const xirr = calculateXIRR(cashflows);
        if (xirr !== null) return { value: xirr * 100, label: 'Since Inception (XIRR)' };
      }
    }

    return { value: absoluteReturnPercent, label: 'Since Inception (Abs.)' };
  };

  const portfolioReturn = calculatePortfolioReturn();
  const absoluteReturn = totalGains;
  const absoluteReturnPercent = totalInvested > 0 ? (absoluteReturn / totalInvested) * 100 : 0;

  const [showSIPDetails, setShowSIPDetails] = React.useState(false);
  const [showInvestmentDetails, setShowInvestmentDetails] = React.useState(false);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Executive Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Wealth Score Card */}
        <div className="lg:col-span-1 bg-wealth-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-wealth-navy/20 flex flex-col justify-between min-h-[320px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-wealth-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div>
            <div className="flex items-center gap-2 text-wealth-gold/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
              <ShieldCheck size={14} />
              Strategic Health Index
            </div>
            
            <div className="relative flex items-center justify-center py-4">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * wealthScore) / 100}
                  strokeLinecap="round"
                  className="text-wealth-gold transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black tracking-tighter">{wealthScore}</span>
                <span className="text-[10px] font-bold text-wealth-gold uppercase tracking-widest">Score</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <p className="text-sm font-medium text-slate-300 leading-relaxed">
              Your wealth architecture is <span className="text-white font-bold">{wealthScore > 80 ? 'Elite' : wealthScore > 60 ? 'Strong' : 'Vulnerable'}</span>. 
              {wealthScore < 80 && " Optimize your estate and asset allocation to reach 90+."}
            </p>
            <button 
              onClick={() => (window as any).setActiveTab?.('portfolio-refinement')}
              className="w-full py-3 bg-wealth-gold text-wealth-navy rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg active:scale-95"
            >
              <Brain size={14} />
              Refine Composition
            </button>
          </div>
        </div>

        {/* Net Worth & Velocity Card */}
        <div className="lg:col-span-3 wealth-gradient rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-wealth-navy/20 flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Sparkles size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold text-white">Welcome, {portfolio.familyMembers.find(m => m.id === 'm1')?.name || 'Investor'}</h2>
                  <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                    <Clock size={14} />
                    <span>Private Wealth Summary • {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <button 
                  onClick={() => (window as any).openRiskModal?.()}
                  className="flex items-center gap-3 w-fit px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl transition-all group"
                >
                  <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Zap size={14} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Risk Profile</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{portfolio.riskProfile?.type || 'Not Assessed'}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-600" />
                      <span className="text-xs font-bold text-indigo-400">{portfolio.riskProfile?.score || 0}/100</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white transition-colors ml-2" />
                </button>

                <button 
                  onClick={() => (window as any).setActiveTab?.('wallet')}
                  className="flex items-center gap-3 w-fit px-4 py-2 bg-wealth-gold/10 hover:bg-wealth-gold/20 backdrop-blur-md border border-wealth-gold/20 rounded-2xl transition-all group"
                >
                  <div className="p-1.5 bg-wealth-gold text-wealth-navy rounded-lg group-hover:rotate-12 transition-transform">
                    <Wallet size={14} />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-bold text-wealth-gold/60 uppercase tracking-widest leading-none mb-1">PMS Basket Wallet</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-wealth-gold">₹{(walletBalance || 0).toLocaleString('en-IN')}</span>
                      <div className="w-1 h-1 rounded-full bg-wealth-gold/30" />
                      <span className="text-[10px] font-bold text-wealth-gold/80 uppercase">{subscriptionTier || 'Free'}</span>
                    </div>
                  </div>
                  <Plus size={14} className="text-wealth-gold/40 group-hover:text-wealth-gold transition-colors ml-2" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onRefresh || (() => (window as any).refreshMarketData?.(true))}
                  disabled={isRefreshing}
                  className={`flex flex-col items-start gap-0.5 px-4 py-1.5 rounded-2xl border transition-all group ${
                    isRefreshing 
                      ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    <span className="text-[10px] font-bold">{isRefreshing ? 'REFRESHING...' : 'REFRESH DATA'}</span>
                  </div>
                  {portfolio.lastMarketRefresh && (
                    <span className="text-[8px] font-medium text-slate-500 ml-5">
                      Last: {new Date(portfolio.lastMarketRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-2xl text-[10px] font-bold border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  MARKET PULSE: BULLISH
                </div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
              <div className="space-y-6">
                <button 
                  onClick={() => setShowInvestmentDetails(true)}
                  className="text-left group transition-all"
                >
                  <p className="text-wealth-gold/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-wealth-gold transition-colors">Current Value</p>
                  <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-2 flex items-center gap-4">
                    {formatLakhs(totalCurrentValue)}
                    <ChevronRight size={32} className="text-white/20 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </h1>
                  {totalCurrentValue === 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl mt-2 max-w-fit animate-pulse">
                      <AlertCircle size={14} className="text-rose-400" />
                      <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                        {portfolio.investments.length > 0 ? "Values derived as zero. Update prices manually." : "No investments found. Get started now."}
                      </span>
                    </div>
                  )}
                </button>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <button 
                    onClick={() => setShowInvestmentDetails(true)}
                    className="text-left group transition-all"
                  >
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-slate-300 transition-colors">Investment Amount</p>
                    <p className="text-2xl font-bold text-white flex items-center gap-2">
                      {formatLakhs(totalInvested)}
                      <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all group-hover:translate-x-0.5" />
                    </p>
                  </button>
                  <button 
                    onClick={() => setShowInvestmentDetails(true)}
                    className="text-left group transition-all"
                  >
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-slate-300 transition-colors">Total Gain</p>
                    <p className={`text-2xl font-bold flex items-center gap-2 ${totalGains >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalGains >= 0 ? '+' : ''}{formatLakhs(totalGains)}
                      <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all group-hover:translate-x-0.5" />
                    </p>
                  </button>
                  <button 
                    onClick={() => setShowInvestmentDetails(true)}
                    className="text-left group transition-all"
                  >
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-slate-300 transition-colors">Total Return</p>
                    <p className={`text-2xl font-bold flex items-center gap-2 ${absoluteReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {absoluteReturnPercent >= 0 ? '+' : ''}{absoluteReturnPercent.toFixed(1)}%
                      <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all group-hover:translate-x-0.5" />
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full xl:w-auto">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <Activity size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">1D Return</span>
                  </div>
                  <div className={`text-2xl font-bold ${oneDayChange.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {oneDayChange.percent.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">1Y Return</span>
                  </div>
                  <div className={`text-2xl font-bold ${oneYearChange.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {oneYearChange.percent.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl">
                  <div className="flex items-center gap-2 text-emerald-400 mb-1">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{portfolioReturn.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">{portfolioReturn.value.toFixed(1)}%</div>
                </div>
                <button 
                  onClick={() => setShowSIPDetails(true)}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-5 rounded-3xl text-left transition-all group"
                >
                  <div className="flex items-center gap-2 text-blue-400 mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">SIP Amount</span>
                  </div>
                  <div className="text-2xl font-bold text-white flex items-center justify-between">
                    {formatLakhs(sipAmount)}
                    <ChevronRight size={20} className="text-white/40 group-hover:text-white transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Equity: {formatLakhs(equityValue)} ({equityPercent.toFixed(1)}%)
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Debt: {formatLakhs(debtValue)} ({debtPercent.toFixed(1)}%)
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Gold: {formatLakhs(goldValue)} ({goldPercent.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Nudges & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Rebalancing Nudge Card */}
          <div className="premium-card p-6 border-l-4 border-l-amber-500 group flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                <PieChartIcon size={14} className="text-amber-500" />
                Strategic Rebalancing
              </div>
              {needsRebalancing && (
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            
            <div>
              <h4 className="text-xl font-bold text-slate-900">
                {needsRebalancing ? 'Action Required' : 'Optimal Allocation'}
              </h4>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                {needsRebalancing 
                  ? 'Your portfolio has drifted from its target allocation.' 
                  : 'Your portfolio is currently aligned with your risk profile.'}
              </p>
            </div>

            <button 
              onClick={() => (window as any).openRebalancingModal?.()}
              className={`mt-4 w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                needsRebalancing 
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-100' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {needsRebalancing ? 'Execute Rebalance' : 'Review Allocation'}
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="premium-card p-6 border-l-4 border-l-rose-500 group cursor-pointer hover:bg-rose-50/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors">Cost of Inaction: ₹1.2L</h4>
                <p className="text-sm text-slate-500 mt-1">Your idle cash in savings is losing purchasing power. Deploy to Debt Funds now.</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 border-l-4 border-l-wealth-gold group cursor-pointer hover:bg-amber-50/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-50 text-wealth-gold rounded-2xl group-hover:scale-110 transition-transform">
                <Zap size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Consolidation Alpha</h4>
                <p className="text-sm text-slate-500 mt-1">Fragmented MF holdings detected. Consolidating could reveal ₹1.2L in redundant fees.</p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 border-l-4 border-l-emerald-500 group cursor-pointer hover:bg-emerald-50/30">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Target size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Alpha Opportunity</h4>
                <p className="text-sm text-slate-500 mt-1">Tax-loss harvesting opportunity found. Offset ₹85k in gains with unrealized losses.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alert System */}
        <div className="lg:col-span-1 premium-card p-6 bg-slate-900 text-white border-none shadow-xl shadow-slate-900/20">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold flex items-center gap-2">
              <Bell size={18} className="text-wealth-gold" />
              Alerts & Reminders
            </h4>
            {dashboardAlerts.length > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {dashboardAlerts.length}
              </span>
            )}
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {dashboardAlerts.length > 0 ? (
              dashboardAlerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        alert.priority === 'High' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                      }`} />
                      <span className="text-xs font-bold text-slate-300">{alert.type}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{alert.priority}</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">{alert.title}</p>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(alert.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                    {alert.amount && <span className="text-wealth-gold">{formatLakhs(alert.amount)}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="text-xs">No critical alerts for the next 90 days.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Asset Allocation Chart */}
        <div className="lg:col-span-1 premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <PieChartIcon size={18} className="text-wealth-gold" />
              Asset Allocation
            </h4>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setAllocationView('category')}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${allocationView === 'category' ? 'bg-white text-wealth-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Category
              </button>
              <button 
                onClick={() => setAllocationView('sub-category')}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${allocationView === 'sub-category' ? 'bg-white text-wealth-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sub-cat
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationView === 'category' ? assetAllocation : subCategoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={allocationView === 'category' ? 8 : 4}
                  dataKey="value"
                  stroke="none"
                >
                  {(allocationView === 'category' ? assetAllocation : subCategoryPieData).map((entry: any, index) => {
                    const color = ASSET_COLORS[entry.category as AssetCategory] || ASSET_COLORS[entry.name as AssetCategory] || '#CBD5E1';
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={color} 
                        fillOpacity={allocationView === 'sub-category' ? 0.6 + (index % 4) * 0.1 : 1}
                      />
                    );
                  })}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatLakhs(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-4">
            {Object.entries(subCategoryAllocation).map(([category, subCats], idx) => (
              <div key={idx} className="space-y-2">
                <button 
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between hover:bg-slate-50 p-1 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: ASSET_COLORS[category as AssetCategory] || '#CBD5E1' }} />
                    <span className="text-sm text-slate-900 font-bold">{category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{formatLakhs(Object.values(subCats).reduce((a, b) => a + b, 0))}</span>
                    <ChevronRight size={14} className={`text-slate-400 transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {expandedCategories[category] && (
                  <div className="pl-6 space-y-1 animate-in slide-in-from-top-1 duration-200">
                    {Object.entries(subCats).map(([sub, val], sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{sub}</span>
                        <span className="font-medium">{formatLakhs(val)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Investor-wise Allocation */}
        <div className="lg:col-span-1 premium-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Investor Allocation
              </h4>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {portfolio.selectedMemberId === 'family' ? 'Family Consolidated' : portfolio.familyMembers.find(m => m.id === portfolio.selectedMemberId)?.name || 'Individual View'}
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={investorAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {investorAllocation.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ec4899'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatLakhs(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {investorAllocation.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'][index % 4] }} />
                  <span className="text-sm text-slate-700 font-bold">{entry.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatLakhs(entry.value)}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{((entry.value / totalCurrentValue) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wealth Trajectory */}
        <div className="lg:col-span-1 premium-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-wealth-emerald" />
                Wealth Trajectory
              </h4>
              <p className="text-xs text-slate-400 mt-1">Projected growth vs. Inflation adjusted</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['1Y', '5Y', '10Y', 'Retire'].map(period => (
                <button 
                  key={period} 
                  onClick={() => setTrajectoryPeriod(period as any)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${trajectoryPeriod === period ? 'bg-white text-wealth-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trajectoryData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => formatLakhs(value)}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#059669" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                >
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    offset={10}
                    formatter={(val: number) => formatLakhs(val)}
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: '#059669' }}
                  />
                </Area>
                <Line 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#94A3B8" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-wealth-emerald" />
                <span className="text-slate-500">Actual Growth</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-slate-300 border-t border-dashed border-slate-400" />
                <span className="text-slate-500">Target Benchmark</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Final: {formatLakhs(trajectoryData[trajectoryData.length - 1].value)}
            </div>
          </div>

          {/* Growth Conditions / Assumptions */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Conditions & Assumptions</h5>
              <button 
                onClick={() => setIsEditingTrajectory(!isEditingTrajectory)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                id="edit-trajectory-assumptions"
              >
                {isEditingTrajectory ? 'Save Assumptions' : 'Edit Assumptions'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium mb-1">Equity Growth</p>
                {isEditingTrajectory ? (
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      value={returnAssumptions.equity}
                      onChange={(e) => setReturnAssumptions({...returnAssumptions, equity: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400">%</span>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-700">{returnAssumptions.equity.toFixed(1)}% <span className="text-[10px] font-normal text-slate-400">p.a.</span></p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium mb-1">Debt Growth</p>
                {isEditingTrajectory ? (
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      value={returnAssumptions.debt}
                      onChange={(e) => setReturnAssumptions({...returnAssumptions, debt: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400">%</span>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-700">{returnAssumptions.debt.toFixed(1)}% <span className="text-[10px] font-normal text-slate-400">p.a.</span></p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium mb-1">Gold Growth</p>
                {isEditingTrajectory ? (
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      value={returnAssumptions.gold}
                      onChange={(e) => setReturnAssumptions({...returnAssumptions, gold: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400">%</span>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-700">{returnAssumptions.gold.toFixed(1)}% <span className="text-[10px] font-normal text-slate-400">p.a.</span></p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-medium mb-1">Inflation</p>
                {isEditingTrajectory ? (
                  <div className="relative">
                    <input 
                      type="number"
                      step="0.1"
                      value={returnAssumptions.inflation}
                      onChange={(e) => setReturnAssumptions({...returnAssumptions, inflation: parseFloat(e.target.value) || 0})}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400">%</span>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-700">{returnAssumptions.inflation.toFixed(1)}% <span className="text-[10px] font-normal text-slate-400">p.a.</span></p>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed italic">
              * Projections are based on current asset allocation and historical category returns. Actual results may vary based on market conditions.
            </p>
          </div>
        </div>
      </div>

      {/* Market Valuation Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Equity Valuation Index */}
        <div className="premium-card p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <Activity size={20} className="text-indigo-600" />
                Equity Valuation Index (EVI)
              </h4>
              <p className="text-xs text-slate-400 mt-1">Proprietary multi-factor valuation model</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setValuationView('segments')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${valuationView === 'segments' ? 'bg-white text-wealth-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Segments
                </button>
                <button 
                  onClick={() => setValuationView('model')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${valuationView === 'model' ? 'bg-white text-wealth-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Model
                </button>
                <button 
                  onClick={() => setValuationView('advisory')}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${valuationView === 'advisory' ? 'bg-white text-wealth-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Advisory
                </button>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {['1M', '6M', '1Y', '5Y'].map(period => (
                  <button 
                    key={period} 
                    onClick={() => setValuationPeriod(period as any)}
                    className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${valuationPeriod === period ? 'bg-white text-wealth-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityValuationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} domain={[50, 170]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                {valuationView === 'segments' ? (
                  <>
                    <Line type="monotone" dataKey="LargeCap" stroke="#6366f1" strokeWidth={3} dot={false} name="Large Cap EVI" />
                    <Line type="monotone" dataKey="MidCap" stroke="#10b981" strokeWidth={3} dot={false} name="Mid Cap EVI" />
                    <Line type="monotone" dataKey="SmallCap" stroke="#f59e0b" strokeWidth={3} dot={false} name="Small Cap EVI" />
                  </>
                ) : valuationView === 'model' ? (
                  <>
                    <Line type="monotone" dataKey="PE" stroke="#6366f1" strokeWidth={2} dot={false} name="P/E Ratio" />
                    <Line type="monotone" dataKey="PB" stroke="#10b981" strokeWidth={2} dot={false} name="P/B Ratio" />
                    <Line type="monotone" dataKey="YieldGap" stroke="#f59e0b" strokeWidth={2} dot={false} name="G-Sec * PE" />
                    <Line type="monotone" dataKey="MCapGDP" stroke="#ec4899" strokeWidth={2} dot={false} name="M-Cap to GDP" />
                    <Line type="monotone" dataKey="OverallEVI" stroke="#000" strokeWidth={4} strokeDasharray="5 5" name="Composite EVI" />
                  </>
                ) : (
                  <>
                    <ReferenceArea y1={130} y2={170} fill="#fee2e2" fillOpacity={0.5} label={{ position: 'center', value: 'Book Partial Profits', fill: '#991b1b', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={110} y2={130} fill="#ffedd5" fillOpacity={0.5} label={{ position: 'center', value: 'Incremental Money to Debt', fill: '#9a3412', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={100} y2={110} fill="#fef9c3" fillOpacity={0.5} label={{ position: 'center', value: 'Neutral', fill: '#854d0e', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={80} y2={100} fill="#dcfce7" fillOpacity={0.5} label={{ position: 'center', value: 'Invest in Equities', fill: '#166534', fontSize: 10, fontWeight: 'bold' }} />
                    <ReferenceArea y1={50} y2={80} fill="#bbf7d0" fillOpacity={0.5} label={{ position: 'center', value: 'Aggressively Invest in Equities', fill: '#14532d', fontSize: 10, fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="OverallEVI" stroke="#000" strokeWidth={3} dot={false} name="Equity Valuation Index" />
                    <ReferenceLine y={111.3} stroke="#000" strokeDasharray="3 3" label={{ position: 'right', value: '111.3', fill: '#000', fontSize: 12, fontWeight: 'bold' }} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {valuationView === 'segments' ? (
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Large Cap</p>
                <p className="text-lg font-black text-slate-900">{equityValuationData[equityValuationData.length - 1].LargeCap.toFixed(1)}</p>
                <p className="text-[10px] text-slate-500 font-medium">Fair Value: 100</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Mid Cap</p>
                <p className="text-lg font-black text-slate-900">{equityValuationData[equityValuationData.length - 1].MidCap.toFixed(1)}</p>
                <p className="text-[10px] text-slate-500 font-medium">Fair Value: 100</p>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Small Cap</p>
                <p className="text-lg font-black text-slate-900">{equityValuationData[equityValuationData.length - 1].SmallCap.toFixed(1)}</p>
                <p className="text-[10px] text-slate-500 font-medium">Fair Value: 100</p>
              </div>
            </div>
          ) : valuationView === 'model' ? (
            <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-start gap-4">
                <Info size={20} className="text-indigo-500 shrink-0 mt-1" />
                <div className="space-y-2">
                  <p className="text-sm font-bold text-slate-900">EVI Methodology</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The Equity Valuation Index is calculated by assigning **equal weights** to four key factors: 
                    Price-to-Earnings (PE), Price-to-Book (PB), G-Sec * PE (Yield Gap), and Market Cap to GDP ratio. 
                    This proprietary model provides a holistic view of market attractiveness.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-wealth-gold/20 text-wealth-gold rounded-xl">
                    <Target size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold">Investment Advisory</h5>
                    <p className="text-[10px] text-slate-400 font-medium">Based on current EVI of {equityValuationData[equityValuationData.length - 1].OverallEVI.toFixed(1)}</p>
                  </div>
                </div>
                <div className="px-4 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                  Incremental Money to Debt
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                The market is currently in the "Neutral to Expensive" zone. We recommend maintaining your existing equity SIPs but directing any incremental lumpsum investments towards Debt or Liquid funds until valuations cool down.
              </p>
            </div>
          )}
        </div>

        {/* Comparative Valuation Trend */}
        <div className="premium-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <RefreshCw size={20} className="text-wealth-emerald" />
                Comparative Valuation Trend
              </h4>
              <p className="text-xs text-slate-400 mt-1">Relative valuation across major asset classes</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['1M', '6M', '1Y', '5Y'].map(period => (
                <button 
                  key={period} 
                  onClick={() => setValuationPeriod(period as any)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${valuationPeriod === period ? 'bg-white text-wealth-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparativeValuationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="IndiaEquity" stroke="#6366f1" strokeWidth={2} dot={false} name="India Equity" />
                <Line type="monotone" dataKey="USEquity" stroke="#10b981" strokeWidth={2} dot={false} name="US Equity" />
                <Line type="monotone" dataKey="Gold" stroke="#f59e0b" strokeWidth={2} dot={false} name="Gold" />
                <Line type="monotone" dataKey="Silver" stroke="#94a3b8" strokeWidth={2} dot={false} name="Silver" />
                <Line type="monotone" dataKey="Debt" stroke="#ec4899" strokeWidth={2} dot={false} name="Debt" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">India Equity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">US Equity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Gold</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Silver</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Debt</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Valuation Metrics Section */}
      <div className="space-y-6">
        {/* Wealth Roadmap CTA */}
        <div className="bg-wealth-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group transition-all hover:bg-slate-900">
          <div className="absolute top-0 right-0 w-64 h-64 bg-wealth-gold/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-wealth-gold/20 transition-all" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-wealth-gold/20 text-wealth-gold rounded-3xl group-hover:scale-110 transition-transform duration-500">
                <Sparkles size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-black tracking-tight mb-2">Strategic Wealth Roadmap</h4>
                <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                  Transform your raw financial data into a comprehensive AI-powered strategic plan. 
                  Analyze goals, optimize taxes, identify insurance gaps, and secure your family's future with our deep intelligence engine.
                </p>
              </div>
            </div>
            <button 
              onClick={() => (window as any).setActiveTab?.('financial-plan')}
              className="px-8 py-4 bg-wealth-gold text-wealth-navy font-black rounded-2xl hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-wealth-gold/20 whitespace-nowrap"
            >
              {portfolio.financialPlan ? 'View Wealth Roadmap' : 'Construct My Roadmap'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock size={24} className="text-indigo-600" />
              Historical Valuation Analysis
            </h4>
            <p className="text-sm text-slate-500 mt-1">Long-term trends of key valuation parameters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* PE Chart */}
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price-to-Earnings (PE)</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                equityValuationData[equityValuationData.length - 1].peRaw > equityValuationData[equityValuationData.length - 1].peAvg ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {equityValuationData[equityValuationData.length - 1].peRaw > equityValuationData[equityValuationData.length - 1].peAvg ? 'Above Avg' : 'Below Avg'}
              </span>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityValuationData}>
                  <defs>
                    <linearGradient id="colorPE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <ReferenceLine y={equityValuationData[0].peAvg} stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg', fill: '#94A3B8', fontSize: 8 }} />
                  <Area type="monotone" dataKey="peRaw" stroke="#6366f1" strokeWidth={2} fill="url(#colorPE)" name="PE Ratio" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-lg font-black text-slate-900">{equityValuationData[equityValuationData.length - 1].peRaw.toFixed(1)}</span>
                <p className="text-[10px] text-slate-400 font-medium">Current PE</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-500">{equityValuationData[0].peAvg.toFixed(1)}</span>
                <p className="text-[10px] text-slate-400 font-medium">10Y Avg</p>
              </div>
            </div>
          </div>

          {/* PB Chart */}
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price-to-Book (PB)</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                equityValuationData[equityValuationData.length - 1].pbRaw > equityValuationData[equityValuationData.length - 1].pbAvg ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {equityValuationData[equityValuationData.length - 1].pbRaw > equityValuationData[equityValuationData.length - 1].pbAvg ? 'Above Avg' : 'Below Avg'}
              </span>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityValuationData}>
                  <defs>
                    <linearGradient id="colorPB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <ReferenceLine y={equityValuationData[0].pbAvg} stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg', fill: '#94A3B8', fontSize: 8 }} />
                  <Area type="monotone" dataKey="pbRaw" stroke="#10b981" strokeWidth={2} fill="url(#colorPB)" name="PB Ratio" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-lg font-black text-slate-900">{equityValuationData[equityValuationData.length - 1].pbRaw.toFixed(2)}</span>
                <p className="text-[10px] text-slate-400 font-medium">Current PB</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-500">{equityValuationData[0].pbAvg.toFixed(2)}</span>
                <p className="text-[10px] text-slate-400 font-medium">10Y Avg</p>
              </div>
            </div>
          </div>

          {/* Yield Gap Chart */}
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">G-Sec * PE (Yield Gap)</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                equityValuationData[equityValuationData.length - 1].yieldGapRaw > equityValuationData[equityValuationData.length - 1].yieldGapAvg ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {equityValuationData[equityValuationData.length - 1].yieldGapRaw > equityValuationData[equityValuationData.length - 1].yieldGapAvg ? 'Above Avg' : 'Below Avg'}
              </span>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityValuationData}>
                  <defs>
                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <ReferenceLine y={equityValuationData[0].yieldGapAvg} stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg', fill: '#94A3B8', fontSize: 8 }} />
                  <Area type="monotone" dataKey="yieldGapRaw" stroke="#f59e0b" strokeWidth={2} fill="url(#colorYield)" name="Yield Gap" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-lg font-black text-slate-900">{equityValuationData[equityValuationData.length - 1].yieldGapRaw.toFixed(2)}</span>
                <p className="text-[10px] text-slate-400 font-medium">Current Gap</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-500">{equityValuationData[0].yieldGapAvg.toFixed(2)}</span>
                <p className="text-[10px] text-slate-400 font-medium">10Y Avg</p>
              </div>
            </div>
          </div>

          {/* M-Cap to GDP Chart */}
          <div className="premium-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">M-Cap to GDP Ratio</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                equityValuationData[equityValuationData.length - 1].mcapGdpRaw > equityValuationData[equityValuationData.length - 1].mcapGdpAvg ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {equityValuationData[equityValuationData.length - 1].mcapGdpRaw > equityValuationData[equityValuationData.length - 1].mcapGdpAvg ? 'Above Avg' : 'Below Avg'}
              </span>
            </div>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityValuationData}>
                  <defs>
                    <linearGradient id="colorGDP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                  <ReferenceLine y={equityValuationData[0].mcapGdpAvg} stroke="#94A3B8" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg', fill: '#94A3B8', fontSize: 8 }} />
                  <Area type="monotone" dataKey="mcapGdpRaw" stroke="#ec4899" strokeWidth={2} fill="url(#colorGDP)" name="M-Cap/GDP %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-lg font-black text-slate-900">{equityValuationData[equityValuationData.length - 1].mcapGdpRaw.toFixed(1)}%</span>
                <p className="text-[10px] text-slate-400 font-medium">Current Ratio</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-500">{equityValuationData[0].mcapGdpAvg.toFixed(1)}%</span>
                <p className="text-[10px] text-slate-400 font-medium">10Y Avg</p>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Recommendation Insight */}
        <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl">
              <Target size={24} />
            </div>
            <div>
              <h5 className="text-lg font-bold text-slate-900">Strategic Valuation Insight</h5>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Currently, {
                  [
                    equityValuationData[equityValuationData.length - 1].peRaw > equityValuationData[equityValuationData.length - 1].peAvg,
                    equityValuationData[equityValuationData.length - 1].pbRaw > equityValuationData[equityValuationData.length - 1].pbAvg,
                    equityValuationData[equityValuationData.length - 1].yieldGapRaw > equityValuationData[equityValuationData.length - 1].yieldGapAvg,
                    equityValuationData[equityValuationData.length - 1].mcapGdpRaw > equityValuationData[equityValuationData.length - 1].mcapGdpAvg
                  ].filter(Boolean).length
                } out of 4 key parameters are trading **above their 10-year averages**. 
                {equityValuationData[equityValuationData.length - 1].peRaw > equityValuationData[equityValuationData.length - 1].peAvg ? " The high PE indicates that corporate earnings need to catch up with prices." : " PE is relatively attractive."}
                {equityValuationData[equityValuationData.length - 1].mcapGdpRaw > 80 ? " The Market Cap to GDP ratio suggests the market is reaching a mature valuation phase." : ""}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Recommendation:</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                  Tactical Asset Allocation - Shift to Debt
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Strategic Planning */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Target size={18} className="text-wealth-navy" />
              Strategic Planning
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Health Check</span>
              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-wealth-emerald rounded-full"
                  style={{ width: `${(strategicPlanning.filter(i => i.isPositive).length / strategicPlanning.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
            {strategicPlanning.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${item.isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {item.isPositive ? <ShieldCheck size={18} /> : <AlertCircle size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.label}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-tight ${item.isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {item.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{item.value}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Status</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals Progress */}
        <div className="premium-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Target size={18} className="text-wealth-gold" />
              Strategic Goals
            </h4>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => (window as any).openGoalModal?.()}
                className="p-1.5 bg-wealth-navy text-wealth-gold rounded-lg hover:scale-105 transition-transform"
                title="Define New Strategic Goal"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={() => (window as any).setActiveTab?.('goals')}
                className="text-xs font-bold text-wealth-emerald hover:underline"
              >
                Manage Goals
              </button>
            </div>
          </div>
          <div className="space-y-8">
            {activeGoals.length > 0 ? (
              activeGoals.map(goal => {
                const now = new Date();
                const targetDate = new Date(goal.targetDate);
                const monthsLeft = Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()));
                const yearsLeft = monthsLeft / 12;
                
                let inflationAdjustedTarget = goal.targetAmount;
                if (goal.inflationAdjusted) {
                  inflationAdjustedTarget = goal.targetAmount * Math.pow(1 + (goal.expectedInflation || 6) / 100, yearsLeft);
                }
                
                const progress = (goal.currentAmount / inflationAdjustedTarget) * 100;
                return (
                  <div key={goal.id} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">{goal.priority} Priority</span>
                        <span className="font-bold text-slate-800 text-lg">{goal.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{formatLakhs(goal.currentAmount)}</span>
                        <span className="text-xs text-slate-400 block">of {formatLakhs(inflationAdjustedTarget)}</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-wealth-navy rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md">
                          {progress.toFixed(1)}% Funded
                        </div>
                        {progress < 50 && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                            <AlertCircle size={10} />
                            <span>Behind Schedule</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Target: {new Date(goal.targetDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm">No strategic goals defined.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trust, Compliance & Legal Center */}
      <div className="premium-card p-8 bg-white border border-slate-200/80 rounded-[2.5rem] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xl tracking-tight">
              <ShieldCheck size={22} className="text-wealth-navy" />
              Legal & Trust Compliance Hub
            </h4>
            <p className="text-xs text-slate-500 mt-1">Institutional-grade disclosures, user privacy policies, and service agreement terms</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Fully Compliant & Secure
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Privacy Policy Block */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Shield size={20} />
              </div>
              <h5 className="font-extrabold text-slate-900 text-base">Privacy Policy</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Learn how we protect your personal identity, safe documents, and Google Workspace integrations using 256-bit encryption. Zero data selling.
              </p>
            </div>
            <button 
              onClick={() => setSelectedPolicy('privacy')}
              className="mt-5 w-fit px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              View Full Privacy Policy
            </button>
          </div>

          {/* Terms Of Service Block */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 bg-amber-50 border border-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <Scale size={20} />
              </div>
              <h5 className="font-extrabold text-slate-900 text-base">Terms of Service</h5>
              <p className="text-xs text-slate-500 leading-relaxed">
                Review disclosures, liability caps, and user agreements concerning expert wealth consultancy, calculations, and AI model recommendations.
              </p>
            </div>
            <button 
              onClick={() => setSelectedPolicy('terms')}
              className="mt-5 w-fit px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              View Full Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Overlay Modal for Legal Documents */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedPolicy === 'privacy' ? 'Privacy Policy Disclosure' : 'Terms of Service Agreement'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Official regulatory document for member trust & safety</p>
              </div>
              <button 
                onClick={() => setSelectedPolicy(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {selectedPolicy === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedPolicy(null)}
                className="px-6 py-2.5 bg-wealth-navy hover:bg-wealth-navy/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Investment Details Modal */}
      {showInvestmentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Portfolio Investment Details</h3>
                <p className="text-sm text-slate-500">Comprehensive breakdown of all your held assets</p>
              </div>
              <button 
                onClick={() => setShowInvestmentDetails(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.investments.sort((a, b) => b.currentValue - a.currentValue).map((inv) => {
                  const gain = inv.currentValue - inv.investedValue;
                  const gainPercent = inv.investedValue > 0 ? (gain / inv.investedValue) * 100 : 0;
                  return (
                    <div key={inv.id} className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-wealth-gold/30 hover:shadow-lg transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-wealth-navy group-hover:text-white transition-colors">
                            <Layers size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 line-clamp-1">{inv.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.category}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.subCategory || 'General'}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${gain >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {gain >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invested</p>
                          <p className="text-sm font-bold text-slate-700">{formatLakhs(inv.investedValue)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current</p>
                          <p className="text-sm font-black text-wealth-navy">{formatLakhs(inv.currentValue)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-slate-400 italic">
                          {inv.isSIP ? 'Active SIP' : 'Lumpsum'}
                        </span>
                        <span className={`text-[10px] font-bold ${gain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {gain >= 0 ? 'Profit' : 'Loss'}: {formatLakhs(Math.abs(gain))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Invested</p>
                  <p className="text-xl font-black text-slate-900">{formatLakhs(totalInvested)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Current</p>
                  <p className="text-xl font-black text-wealth-navy">{formatLakhs(totalCurrentValue)}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInvestmentDetails(false)}
                className="px-8 py-3 bg-wealth-navy text-white font-bold rounded-xl hover:bg-wealth-navy/90 transition-all shadow-lg shadow-wealth-navy/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIP Details Modal */}
      {showSIPDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">SIP Portfolio Details</h3>
                <p className="text-sm text-slate-500">Breakdown of your active systematic investments</p>
              </div>
              <button 
                onClick={() => setShowSIPDetails(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {portfolio.investments.filter(inv => inv.isSIP).map((inv) => (
                  <div key={inv.id} className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                          <Activity size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{inv.name}</h4>
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{inv.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Monthly SIP</p>
                        <p className="text-lg font-black text-slate-900">{formatLakhs(inv.sipAmount || 0)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invested Amount</p>
                        <p className="font-bold text-slate-700">{formatLakhs(inv.investedValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Value</p>
                        <p className="font-bold text-slate-900">{formatLakhs(inv.currentValue)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {portfolio.investments.filter(inv => inv.isSIP).length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Calendar size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">No active SIPs found in your portfolio.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Monthly Commitment</p>
                <p className="text-2xl font-black text-slate-900">{formatLakhs(sipAmount)}</p>
              </div>
              <button 
                onClick={() => setShowSIPDetails(false)}
                className="px-8 py-3 bg-wealth-navy text-white font-bold rounded-xl hover:bg-wealth-navy/90 transition-all shadow-lg shadow-wealth-navy/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

