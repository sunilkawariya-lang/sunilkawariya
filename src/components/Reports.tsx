
import React, { useMemo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { PortfolioState, Transaction, HistoricalSnapshot, AssetCategory } from '../types';
import { ASSET_COLORS } from '../constants';
import { 
  TrendingUp, TrendingDown, History, ArrowUpRight, ArrowDownRight, 
  Calendar, Download, Filter, Search, ChevronRight, PieChart as PieIcon,
  BarChart2, Activity, FileText, Info, Landmark, FileSpreadsheet, File as FilePdf,
  Sparkles, Target, Wallet, Zap, ShieldCheck, Loader2, CheckCircle2, AlertCircle, RefreshCw, Copy, Clock
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { generateDetailedFinancialPlan } from '../services/analysisService';
import { generateAIDetailedAnalysis, AIAnalysisReport } from '../services/reportService';
import { isCooldownActive, getCooldownTimeLeft, clearCooldown } from '../lib/quotaManager';
import { handleError, ErrorType } from '../lib/errorHandler';
import DetailedFinancialPlanView from './DetailedFinancialPlanView';
import PortfolioPerformance from './PortfolioPerformance';
import ErrorBoundary from './ErrorBoundary';
import { generateFinancialPlanPDF } from '../services/pdfService';
import { convertToINR } from '../utils/finance';
import { stripMarkdown } from '../utils/text';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ReactMarkdown from 'react-markdown';

interface ReportsProps {
  portfolio: PortfolioState;
  initialTab?: 'gains' | 'transactions' | 'performance' | 'performance-summary' | 'executive-report' | 'financial-plan' | 'tax-harvesting' | 'audit';
}

const Reports: React.FC<ReportsProps> = ({ portfolio, initialTab = 'executive-report' }) => {
  const { updateFinancialPlan } = useFirebase();
  const [activeSubTab, setActiveSubTab] = useState<'gains' | 'transactions' | 'performance' | 'performance-summary' | 'executive-report' | 'financial-plan' | 'tax-harvesting' | 'audit' | 'ai-detailed'>(initialTab as any);

  React.useEffect(() => {
    setActiveSubTab(initialTab as any);
  }, [initialTab]);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiReport, setAiReport] = useState<AIAnalysisReport | null>(null);
  const [isGeneratingAIReport, setIsGeneratingAIReport] = useState(false);
  
  // Performance Summary Filters
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>(['All']);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]); // Empty means all
  const [perfStartDate, setPerfStartDate] = useState<string>(() => {
    const d = new Date('2026-04-17'); // Using today's date from context
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [perfEndDate, setPerfEndDate] = useState<string>('2026-04-17');
  const [viewCashflowPeriod, setViewCashflowPeriod] = useState<'Given Period' | 'Since Inception'>('Given Period');
  
  // Performance Report Filters
  const [selectedPerfCategory, setSelectedPerfCategory] = useState<string>('All');
  const [selectedPerfSubCategory, setSelectedPerfSubCategory] = useState<string>('All');
  const [performanceLevel, setPerformanceLevel] = useState<'Aggregate' | 'Individual'>('Aggregate');

  const performanceHierarchy = useMemo(() => {
    const hierarchy: Record<string, Set<string>> = { 'All': new Set(['All']) };
    
    portfolio.investments.forEach(inv => {
      const cat = inv.category;
      if (!hierarchy[cat]) hierarchy[cat] = new Set(['All']);
      if (inv.subCategory) hierarchy[cat].add(inv.subCategory);
      hierarchy['All'].add(inv.subCategory); // Also add to 'All' category for flat view if needed
    });

    // Special handling for SIP
    if (portfolio.investments.some(inv => inv.isSIP)) {
      if (!hierarchy['SIP']) hierarchy['SIP'] = new Set(['All']);
      portfolio.investments.filter(inv => inv.isSIP).forEach(inv => {
        if (inv.subCategory) hierarchy['SIP'].add(inv.subCategory);
      });
    }

    return hierarchy;
  }, [portfolio.investments]);

  // Filter States
  const [filterType, setFilterType] = useState<'standard' | 'fy' | 'qtr' | 'custom'>('standard');
  const [selectedFY, setSelectedFY] = useState<string>(() => {
    const now = new Date();
    const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
    return `${year}-${(year + 1).toString().slice(-2)}`;
  });
  const [selectedQtr, setSelectedQtr] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string>('All');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const formatCurrencyForPDF = (val: number) => 
    `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)}`;

  // Filter: Get Date Range for FY
  const getFYRange = (fy: string) => {
    const [startYear] = fy.split('-').map(Number);
    return {
      start: new Date(startYear, 3, 1), // April 1st
      end: new Date(startYear + 1, 2, 31, 23, 59, 59) // March 31st
    };
  };

  const getQtrRange = (fy: string, qtr: string) => {
    const [startYear] = fy.split('-').map(Number);
    switch (qtr) {
      case 'Q1': return { start: new Date(startYear, 3, 1), end: new Date(startYear, 5, 30, 23, 59, 59) };
      case 'Q2': return { start: new Date(startYear, 6, 1), end: new Date(startYear, 8, 30, 23, 59, 59) };
      case 'Q3': return { start: new Date(startYear, 9, 1), end: new Date(startYear, 11, 31, 23, 59, 59) };
      case 'Q4': return { start: new Date(startYear + 1, 0, 1), end: new Date(startYear + 1, 2, 31, 23, 59, 59) };
      default: return getFYRange(fy);
    }
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = null;

    if (filterType === 'standard') {
      return portfolio.transactions;
    } else if (filterType === 'fy') {
      const range = getFYRange(selectedFY);
      start = range.start;
      end = range.end;
    } else if (filterType === 'qtr') {
      const range = getQtrRange(selectedFY, selectedQtr);
      start = range.start;
      end = range.end;
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59);
    }

    if (!start || !end) {
      return portfolio.transactions.filter(t => selectedInvestmentId === 'All' || t.investmentId === selectedInvestmentId);
    }

    return portfolio.transactions.filter(t => {
      const d = new Date(t.date);
      const dateMatch = d >= start! && d <= end!;
      const investmentMatch = selectedInvestmentId === 'All' || t.investmentId === selectedInvestmentId;
      return dateMatch && investmentMatch;
    });
  }, [portfolio.transactions, filterType, selectedFY, startDate, endDate, selectedInvestmentId]);

  // 2. Capital Gains Analysis
  const capitalGains = useMemo(() => {
    // Unrealised is always on current holdings (not filtered by date usually, but for report we can show what was unrealised then if we had snapshots, but here we use current)
    const unrealised = portfolio.investments.reduce((sum, inv) => sum + (inv.currentValue - inv.investedValue), 0);
    
    // Realised gains from filtered sell transactions
    const realised = filteredTransactions
      .filter(t => t.type === 'Sell')
      .reduce((sum, t) => {
        const inv = portfolio.investments.find(i => i.id === t.investmentId);
        if (inv && inv.buyPrice) {
          const cost = t.quantity * inv.buyPrice;
          return sum + (t.amount - cost);
        }
        // Fallback to 15% if buyPrice is missing, but mark it as estimated
        return sum + (t.amount * 0.15);
      }, 0);

    return { realised, unrealised, total: realised + unrealised };
  }, [portfolio.investments, filteredTransactions]);

  // Download Handlers
  const downloadExcel = (data: any[], fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const downloadPDF = (title: string, headers: string[][], body: any[][], fileName: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    
    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 20, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text("Wealth Strategy Report", margin, 13);
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, pageWidth - (margin * 2));
    doc.text(titleLines, margin, 35);
    
    const startY = 35 + (titleLines.length * 7) + 5;
    
    autoTable(doc, {
      head: headers,
      body: body.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
      startY: startY,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 20, pageHeight - 10);
        doc.text("Confidential - For Client Use Only", margin, pageHeight - 10);
      }
    });
    doc.save(`${fileName}.pdf`);
  };

  const handleCopyPerformance = (data: any[]) => {
    const header = "Category\tPortfolio Return (%)\tIndex Return (%)\tAlpha (%)\n";
    const rows = data.map(item => 
      `${item.category}\t${item.portfolioReturn.toFixed(2)}\t${item.indexReturn.toFixed(2)}\t${item.alpha.toFixed(2)}`
    ).join('\n');
    
    navigator.clipboard.writeText(header + rows);
    alert('Performance data copied to clipboard in Excel-friendly format!');
  };

  const handleDownloadPerformance = (type: 'excel' | 'pdf', title: string, data: any[]) => {
    const exportData = data.map(item => ({
      Category: item.category,
      'Portfolio Return (%)': item.portfolioReturn.toFixed(2),
      'Index Return (%)': item.indexReturn.toFixed(2),
      'Alpha (%)': item.alpha.toFixed(2)
    }));

    if (type === 'excel') {
      downloadExcel(exportData, `Performance_Report_${title.replace(/\s+/g, '_')}`);
    } else {
      downloadPDF(
        `Performance Report - ${title}`,
        [['Category', 'Portfolio Return', 'Index Return', 'Alpha']],
        data.map(item => [
          item.category, 
          `${item.portfolioReturn.toFixed(2)}%`, 
          `${item.indexReturn.toFixed(2)}%`, 
          `${item.alpha >= 0 ? '+' : ''}${item.alpha.toFixed(2)}%`
        ]),
        `Performance_Report_${title.replace(/\s+/g, '_')}`
      );
    }
  };

  const handleCopyGains = () => {
    const data = [
      { Metric: 'Unrealised Gains', Amount: capitalGains.unrealised },
      { Metric: 'Realised Gains', Amount: capitalGains.realised },
      { Metric: 'Total Capital Gain', Amount: capitalGains.total },
      { Metric: 'Estimated STCG (20%)', Amount: capitalGains.realised * 0.20 },
      { Metric: 'Estimated LTCG (12.5%)', Amount: Math.max(0, (capitalGains.realised * 0.80 - 125000) * 0.125) },
    ];
    const header = "Metric\tAmount (INR)\n";
    const rows = data.map(d => `${d.Metric}\t${d.Amount}`).join('\n');
    navigator.clipboard.writeText(header + rows);
    alert('Capital Gains data copied to clipboard!');
  };

  const handleCopyTransactions = () => {
    const header = "Date\tAsset\tType\tQuantity\tPrice\tAmount\n";
    const rows = filteredTransactions.map(t => 
      `${new Date(t.date).toLocaleDateString('en-IN')}\t${t.investmentName}\t${t.type}\t${t.quantity || '-'}\t${t.price || '-'}\t${t.amount}`
    ).join('\n');
    navigator.clipboard.writeText(header + rows);
    alert('Transactions data copied to clipboard!');
  };

  const handleDownloadGains = (type: 'excel' | 'pdf') => {
    const data = [
      { Metric: 'Unrealised Gains', Amount: capitalGains.unrealised },
      { Metric: 'Realised Gains', Amount: capitalGains.realised },
      { Metric: 'Total Capital Gain', Amount: capitalGains.total },
      { Metric: 'Estimated STCG (20%)', Amount: capitalGains.realised * 0.20 },
      { Metric: 'Estimated LTCG (12.5%)', Amount: Math.max(0, (capitalGains.realised * 0.80 - 125000) * 0.125) },
    ];

    const periodLabel = filterType === 'standard' ? 'Since Inception' : filterType === 'fy' ? `FY ${selectedFY}` : filterType === 'qtr' ? `${selectedQtr} FY ${selectedFY}` : `${startDate} to ${endDate}`;

    if (type === 'excel') {
      downloadExcel(data, `Capital_Gains_Report_${periodLabel.replace(/\s+/g, '_')}`);
    } else {
      downloadPDF(
        `Capital Gains Report - ${periodLabel}`,
        [['Metric', 'Amount (INR)']],
        data.map(d => [d.Metric, formatCurrencyForPDF(d.Amount)]),
        `Capital_Gains_Report_${periodLabel.replace(/\s+/g, '_')}`
      );
    }
  };

  const handleDownloadTransactions = (type: 'excel' | 'pdf') => {
    const data = filteredTransactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-IN'),
      Asset: t.investmentName,
      Type: t.type,
      Quantity: t.quantity || '-',
      Price: t.price || '-',
      Amount: t.amount,
      Status: 'Completed'
    }));

    const periodLabel = filterType === 'standard' ? 'Since Inception' : filterType === 'fy' ? `FY ${selectedFY}` : filterType === 'qtr' ? `${selectedQtr} FY ${selectedFY}` : `${startDate} to ${endDate}`;

    if (type === 'excel') {
      downloadExcel(data, `Transactions_Report_${periodLabel.replace(/\s+/g, '_')}`);
    } else {
      downloadPDF(
        `Transactions Report - ${periodLabel}`,
        [['Date', 'Asset', 'Type', 'Quantity', 'Price', 'Amount', 'Status']],
        data.map(d => [d.Date, d.Asset, d.Type, d.Quantity, d.Price, formatCurrencyForPDF(d.Amount), d.Status]),
        `Transactions_Report_${periodLabel.replace(/\s+/g, '_')}`
      );
    }
  };

  const executiveReportData = useMemo(() => {
    const totalInvestments = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.currentValue || 0, inv.currency), 0);
    const totalBankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalValue = totalInvestments + totalBankBalance;

    // 1. Product Level Allocation
    const productAllocation: Record<string, number> = {};
    portfolio.investments.forEach(inv => {
      const sub = (inv.subCategory || '').toLowerCase();
      const cat = (inv.category || '').toLowerCase();
      const name = (inv.name || '').toLowerCase();
      
      // Robust Mutual Fund detection
      const isMF = sub.includes('mutual fund') || 
                   sub.includes('index fund') || 
                   sub.includes('elss') || 
                   !!inv.schemeCode || 
                   name.includes(' fund') || 
                   name.includes(' growth') || 
                   name.includes(' direct') || 
                   name.includes(' regular') ||
                   (cat === 'equity' && !inv.symbol?.includes('.'));
      
      let key = inv.subCategory || inv.category || 'Other';
      
      // If it's a Mutual Fund, use the subCategory but clean it up
      if (isMF) {
        key = (inv.subCategory || '').replace(/Mutual Funds|Mutual Fund|Funds|Fund/gi, '').trim() || 'Other MF';
      } else if (sub.includes('pms')) {
        key = 'PMS';
      } else if (sub.includes('aif')) {
        key = 'AIF';
      } else if (sub.includes('bond')) {
        key = 'Bonds';
      } else if (sub.includes('stock') || sub.includes('equity shares') || (inv.category === 'Equity' && !isMF)) {
        key = 'Equity Stocks';
      } else if (cat === 'gold') {
        key = 'Gold';
      } else if (cat === 'real estate') {
        key = 'Real Estate';
      } else if (sub.includes('fixed deposit') || sub.includes('fd')) {
        key = 'Fixed Deposits';
      } else if (sub.includes('ppf') || sub.includes('nps') || sub.includes('government')) {
        key = 'Govt. Schemes';
      }
      
      productAllocation[key] = (productAllocation[key] || 0) + convertToINR(inv.currentValue || 0, inv.currency);
    });

    if (totalBankBalance > 0) {
      productAllocation['Bank Accounts'] = totalBankBalance;
    }

    // 2. Investor Wise Allocation
    const investorAllocation: Record<string, number> = {};
    portfolio.investments.forEach(inv => {
      const memberId = inv.memberId || 'm1'; // Default to primary member if missing
      const member = portfolio.familyMembers.find(m => m.id === memberId);
      const name = member ? member.name : 'Unknown';
      investorAllocation[name] = (investorAllocation[name] || 0) + convertToINR(inv.currentValue || 0, inv.currency);
    });

    portfolio.bankAccounts.forEach(acc => {
      const memberId = acc.memberId || 'm1';
      const member = portfolio.familyMembers.find(m => m.id === memberId);
      const name = member ? member.name : 'Unknown';
      investorAllocation[name] = (investorAllocation[name] || 0) + (acc.balance || 0);
    });

    // 3. Overall Portfolio Allocation (Asset Class)
    const assetAllocation: Record<string, number> = {};
    portfolio.investments.forEach(inv => {
      const cat = inv.category || 'Other';
      assetAllocation[cat] = (assetAllocation[cat] || 0) + convertToINR(inv.currentValue || 0, inv.currency);
    });

    if (totalBankBalance > 0) {
      assetAllocation['Cash'] = (assetAllocation['Cash'] || 0) + totalBankBalance;
    }

    // 4. Sub-category of Mutual Funds
    const mfSubCategoryAllocation: Record<string, number> = {};
    portfolio.investments.filter(inv => {
      const sub = (inv.subCategory || '').toLowerCase();
      const cat = (inv.category || '').toLowerCase();
      const name = (inv.name || '').toLowerCase();
      return sub.includes('mutual fund') || 
             sub.includes('index fund') || 
             sub.includes('elss') || 
             !!inv.schemeCode || 
             name.includes(' fund') || 
             name.includes(' growth') || 
             name.includes(' direct') || 
             name.includes(' regular') ||
             (cat === 'equity' && !inv.symbol?.includes('.'));
    }).forEach(inv => {
      const key = inv.subCategory.replace(/Mutual Funds|Mutual Fund/gi, '').trim() || 'Other MF';
      mfSubCategoryAllocation[key] = (mfSubCategoryAllocation[key] || 0) + convertToINR(inv.currentValue, inv.currency);
    });

    // 5. Fund House Wise Allocation
    const fundHouseAllocation: Record<string, number> = {};
    const COMMON_AMCS = [
      'HDFC', 'SBI', 'ICICI', 'Axis', 'Nippon', 'Kotak', 'Aditya Birla', 'UTI', 'IDFC', 'Bandhan',
      'DSP', 'Mirae', 'Tata', 'Franklin', 'Invesco', 'Canara Robeco', 'L&T', 'Motilal Oswal',
      'Quant', 'Parag Parikh', 'PPFAS', 'WhiteOak', 'Navi', 'Groww', 'Zerodha', 'HSBC', 'Union',
      'Edelweiss', 'Sundaram', 'JM Financial', 'LIC', 'Baroda BNP', 'Mahindra Manulife', 'PGIM',
      'Quantum', 'Taurus', 'Trust', 'ITI', 'NJ', 'Samco', 'Old Bridge', 'Helios'
    ];

    portfolio.investments.forEach(inv => {
      const sub = (inv.subCategory || '').toLowerCase();
      const name = (inv.name || '').toLowerCase();
      const cat = (inv.category || '').toLowerCase();
      
      const isMF = sub.includes('mutual fund') || 
                   sub.includes('index fund') || 
                   sub.includes('elss') || 
                   !!inv.schemeCode || 
                   name.includes(' fund') || 
                   name.includes(' growth') || 
                   name.includes(' direct') || 
                   name.includes(' regular') ||
                   (cat === 'equity' && !inv.symbol?.includes('.'));
                   
      const isPMS_AIF = sub.includes('pms') || sub.includes('aif');
      const isInsurance = sub.includes('insurance') || cat === 'insurance';

      if (inv.fundHouse) {
        fundHouseAllocation[inv.fundHouse] = (fundHouseAllocation[inv.fundHouse] || 0) + convertToINR(inv.currentValue, inv.currency);
      } else if (isMF || isPMS_AIF || isInsurance) {
        // Try to guess from name
        let guessedHouse = '';
        for (const amc of COMMON_AMCS) {
          if (name.includes(amc.toLowerCase())) {
            guessedHouse = amc + (isInsurance ? ' Insurance' : ' Mutual Fund');
            break;
          }
        }
        
        const key = guessedHouse || (isMF ? 'Other Mutual Funds' : isPMS_AIF ? 'Other PMS/AIF' : 'Other Insurance');
        fundHouseAllocation[key] = (fundHouseAllocation[key] || 0) + convertToINR(inv.currentValue, inv.currency);
      } else {
        // For Gold, Real Estate, etc.
        const key = cat === 'gold' ? 'Gold Holdings' : 
                    cat === 'real estate' ? 'Real Estate' : 
                    (cat === 'equity' && !isMF) ? 'Direct Equity' :
                    isMF ? 'Other Mutual Funds' :
                    'Other Assets';
        fundHouseAllocation[key] = (fundHouseAllocation[key] || 0) + convertToINR(inv.currentValue, inv.currency);
      }
    });

    if (totalBankBalance > 0) {
      fundHouseAllocation['Bank Accounts'] = (fundHouseAllocation['Bank Accounts'] || 0) + totalBankBalance;
    }

    // 6. Sector Wise Allocation
    const sectorAllocation: Record<string, number> = {};
    portfolio.investments.forEach(inv => {
      if (inv.sector) {
        sectorAllocation[inv.sector] = (sectorAllocation[inv.sector] || 0) + convertToINR(inv.currentValue, inv.currency);
      } else if (inv.category === 'Equity' && !inv.schemeCode) {
        sectorAllocation['Other Equity'] = (sectorAllocation['Other Equity'] || 0) + convertToINR(inv.currentValue, inv.currency);
      }
    });

    // 7. Top Stock Holdings (Aggregate & Category-wise)
    const stockHoldings: Record<string, number> = {};
    const categoryWiseHoldings: Record<string, Record<string, number>> = {};

    // 8. Market Cap Allocation (Consolidated & Category-wise)
    const consolidatedMarketCap = { large: 0, mid: 0, small: 0 };
    const categoryWiseMarketCap: Record<string, { large: number; mid: number; small: number }> = {};

    // 9. Sector Wise Allocation (Category-wise)
    const categoryWiseSector: Record<string, Record<string, number>> = {};

    portfolio.investments.forEach(inv => {
      const sub = (inv.subCategory || '').toLowerCase();
      const cat = (inv.category || 'Other');
      const catKey = cat.toString();
      const name = (inv.name || '').toLowerCase();
      const value = convertToINR(inv.currentValue, inv.currency);
      
      const isMF = sub.includes('mutual fund') || 
                   sub.includes('index fund') || 
                   sub.includes('elss') || 
                   !!inv.schemeCode || 
                   name.includes(' fund') || 
                   name.includes(' growth') || 
                   name.includes(' direct') || 
                   name.includes(' regular') ||
                   (cat.toLowerCase() === 'equity' && !inv.symbol?.includes('.'));

      // Process Sector
      if (inv.sector) {
        if (!categoryWiseSector[catKey]) categoryWiseSector[catKey] = {};
        categoryWiseSector[catKey][inv.sector] = (categoryWiseSector[catKey][inv.sector] || 0) + value;
      } else if (isMF && inv.analysis?.sectorAllocation) {
        if (!categoryWiseSector[catKey]) categoryWiseSector[catKey] = {};
        inv.analysis.sectorAllocation.forEach(s => {
          const sValue = (s.percentage / 100) * value;
          categoryWiseSector[catKey][s.sector] = (categoryWiseSector[catKey][s.sector] || 0) + sValue;
          sectorAllocation[s.sector] = (sectorAllocation[s.sector] || 0) + sValue;
        });
      }

      // Process Holdings
      if (!isMF && (cat.toLowerCase() === 'equity' || sub.includes('stock'))) {
        stockHoldings[inv.name] = (stockHoldings[inv.name] || 0) + value;
        if (!categoryWiseHoldings[catKey]) categoryWiseHoldings[catKey] = {};
        categoryWiseHoldings[catKey][inv.name] = (categoryWiseHoldings[catKey][inv.name] || 0) + value;
      } else if (isMF && inv.analysis?.topHoldings) {
        if (!categoryWiseHoldings[catKey]) categoryWiseHoldings[catKey] = {};
        inv.analysis.topHoldings.forEach(h => {
          const hValue = (h.percentage / 100) * value;
          stockHoldings[h.name] = (stockHoldings[h.name] || 0) + hValue;
          categoryWiseHoldings[catKey][h.name] = (categoryWiseHoldings[catKey][h.name] || 0) + hValue;
        });
      }

      // Process Market Cap
      if (isMF && inv.analysis?.marketCapAllocation) {
        const caps = inv.analysis.marketCapAllocation;
        const lVal = (caps.largeCap / 100) * value;
        const mVal = (caps.midCap / 100) * value;
        const sVal = (caps.smallCap / 100) * value;

        consolidatedMarketCap.large += lVal;
        consolidatedMarketCap.mid += mVal;
        consolidatedMarketCap.small += sVal;

        if (!categoryWiseMarketCap[catKey]) categoryWiseMarketCap[catKey] = { large: 0, mid: 0, small: 0 };
        categoryWiseMarketCap[catKey].large += lVal;
        categoryWiseMarketCap[catKey].mid += mVal;
        categoryWiseMarketCap[catKey].small += sVal;
      } else if (!isMF && (cat.toLowerCase() === 'equity')) {
        // Fallback for direct stocks - assume large cap if no other info
        const lVal = value;
        consolidatedMarketCap.large += lVal;
        if (!categoryWiseMarketCap[catKey]) categoryWiseMarketCap[catKey] = { large: 0, mid: 0, small: 0 };
        categoryWiseMarketCap[catKey].large += lVal;
      }
    });

    // 10. Performance Changes (1 Day Change)
    const lastSnapshot = portfolio.historicalSnapshots?.[portfolio.historicalSnapshots.length - 2];
    const portfolioChange = lastSnapshot ? totalValue - lastSnapshot.totalValue : 0;
    const portfolioChangePercent = lastSnapshot ? (portfolioChange / lastSnapshot.totalValue) * 100 : 0;

    // 11. Monthly Portfolio Trend
    const monthlyTrendData = (() => {
      const snapshots = [...portfolio.historicalSnapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const groups: Record<string, typeof snapshots[0]> = {};
      
      snapshots.forEach(s => {
        const date = new Date(s.date);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        groups[monthKey] = s; // Keep the last snapshot of each month
      });

      return Object.values(groups).map(s => ({
        date: s.date,
        month: new Date(s.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        value: s.totalValue,
        invested: s.investedValue
      }));
    })();

    return {
      totalValue,
      productAllocation,
      investorAllocation,
      assetAllocation,
      mfSubCategoryAllocation,
      fundHouseAllocation,
      sectorAllocation,
      stockHoldings,
      categoryWiseHoldings,
      consolidatedMarketCap,
      categoryWiseMarketCap,
      categoryWiseSector,
      portfolioChange,
      portfolioChangePercent,
      monthlyTrendData
    };
  }, [portfolio.investments, portfolio.familyMembers, portfolio.historicalSnapshots]);

  const handleDownloadExecutiveReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let currentY = 20;

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("EXECUTIVE WEALTH REPORT", margin, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, margin, 32);
    doc.text(`Portfolio Value: ${formatCurrencyForPDF(executiveReportData.totalValue)}`, pageWidth - margin - 60, 32);

    currentY = 50;

    // 1. Monthly Portfolio Trend (Added as per user request)
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text("1. Monthly Portfolio Trend", margin, currentY);
    currentY += 10;

    const trendRows = executiveReportData.monthlyTrendData.map(d => [
      d.month,
      formatCurrencyForPDF(d.value),
      formatCurrencyForPDF(d.invested)
    ]);

    autoTable(doc, {
      head: [['Month', 'Portfolio Value', 'Invested Value']],
      body: trendRows,
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // 2. Product Level Allocation
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text("2. Product Level Allocation", margin, currentY);
    currentY += 10;

    const productRows = Object.entries(executiveReportData.productAllocation).map(([name, value]) => [
      name,
      formatCurrencyForPDF(value),
      ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
    ]);

    autoTable(doc, {
      head: [['Product Category', 'Amount', 'Allocation %']],
      body: productRows.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // 3. Investor Wise Allocation
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFontSize(14);
    doc.text("3. Investor Wise Allocation", margin, currentY);
    currentY += 10;

    const investorRows = Object.entries(executiveReportData.investorAllocation).map(([name, value]) => [
      name,
      formatCurrencyForPDF(value),
      ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
    ]);

    autoTable(doc, {
      head: [['Investor Name', 'Amount', 'Allocation %']],
      body: investorRows.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // 4. Overall Asset Allocation
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    doc.setFontSize(14);
    doc.text("4. Overall Asset Allocation", margin, currentY);
    currentY += 10;

    const assetRows = Object.entries(executiveReportData.assetAllocation).map(([name, value]) => [
      name,
      formatCurrencyForPDF(value),
      ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
    ]);

    autoTable(doc, {
      head: [['Asset Class', 'Amount', 'Allocation %']],
      body: assetRows.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
      startY: currentY,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // 4. Mutual Fund Sub-category Allocation
    if (Object.keys(executiveReportData.mfSubCategoryAllocation).length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(14);
      doc.text("4. Mutual Fund Sub-category Allocation", margin, currentY);
      currentY += 10;

      const mfTotal = Object.values(executiveReportData.mfSubCategoryAllocation).reduce((a, b) => a + b, 0);
      const mfRows = Object.entries(executiveReportData.mfSubCategoryAllocation).map(([name, value]) => [
        name,
        formatCurrencyForPDF(value),
        ((value / mfTotal) * 100).toFixed(2) + '%'
      ]);

      autoTable(doc, {
        head: [['MF Sub-category', 'Amount', 'MF Allocation %']],
        body: mfRows.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: margin, right: margin }
      });
      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // 5. Fund House Allocation
    if (Object.keys(executiveReportData.fundHouseAllocation).length > 0) {
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(14);
      doc.text("5. Fund House Wise Allocation", margin, currentY);
      currentY += 10;

      const fhRows = Object.entries(executiveReportData.fundHouseAllocation).map(([name, value]) => [
        name,
        formatCurrencyForPDF(value),
        ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
      ]);

      autoTable(doc, {
        head: [['Fund House', 'Amount', 'Allocation %']],
        body: fhRows.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
        startY: currentY,
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] },
        margin: { left: margin, right: margin }
      });
    }

    addFooter(doc);
    doc.save(`Executive_Wealth_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const renderExecutiveReport = () => {
    const assetData = Object.entries(executiveReportData.assetAllocation).map(([name, value]) => ({
      name,
      value,
      color: ASSET_COLORS[name] || '#94a3b8'
    }));

    const investorData = Object.entries(executiveReportData.investorAllocation).map(([name, value]) => ({
      name,
      value
    }));

    const marketCapData = [
      { name: 'Large Cap', value: executiveReportData.consolidatedMarketCap.large, color: '#6366f1' },
      { name: 'Mid Cap', value: executiveReportData.consolidatedMarketCap.mid, color: '#10b981' },
      { name: 'Small Cap', value: executiveReportData.consolidatedMarketCap.small, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Executive Portfolio Summary</h3>
            <p className="text-sm text-slate-500">Comprehensive breakdown of your wealth across all dimensions</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                const data = Object.entries(executiveReportData.productAllocation).map(([name, value]) => ({
                  Product: name,
                  Amount: formatCurrencyForPDF(value),
                  'Allocation %': ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
                }));
                downloadExcel(data, `Portfolio_Allocation_${new Date().toISOString().split('T')[0]}`);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all border border-emerald-100"
            >
              <FileSpreadsheet size={16} />
              Excel
            </button>
            <button 
              onClick={handleDownloadExecutiveReport}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <Download size={20} />
              Download Full Report (PDF)
            </button>
          </div>
        </div>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net Worth</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(executiveReportData.totalValue)}</p>
            <div className={`flex items-center gap-1 mt-2 ${executiveReportData.portfolioChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {executiveReportData.portfolioChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-xs font-bold">{Math.abs(executiveReportData.portfolioChangePercent).toFixed(2)}%</span>
              <span className="text-[10px] text-slate-400 font-medium ml-1">vs yesterday</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Invested Capital</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(portfolio.investments.reduce((sum, inv) => sum + inv.investedValue, 0))}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Original cost of acquisition</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Appreciation</p>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(capitalGains.total)}
            </p>
            <div className="flex items-center gap-1 mt-2 text-emerald-600">
              <TrendingUp size={14} />
              <span className="text-xs font-bold">
                {((capitalGains.total / portfolio.investments.reduce((sum, inv) => sum + inv.investedValue, 1)) * 100).toFixed(2)}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium ml-1">Abs. Return</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active SIPs</p>
            <p className="text-2xl font-bold text-indigo-600">
              {portfolio.investments.filter(inv => inv.isSIP).length}
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Monthly: {formatCurrency(portfolio.investments.filter(inv => inv.isSIP).reduce((sum, inv) => sum + (inv.sipAmount || 0), 0))}
            </p>
          </div>
        </div>

        {/* Portfolio Performance Trends */}
        <ErrorBoundary>
          <PortfolioPerformance portfolio={portfolio} />
        </ErrorBoundary>

        {/* Section: Asset & Investor Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asset Allocation Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => {
                  const data = Object.entries(executiveReportData.assetAllocation).map(([name, value]) => [
                    name, 
                    formatCurrencyForPDF(value), 
                    ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
                  ]);
                  downloadPDF("Asset Allocation Report", [["Asset Class", "Value", "Allocation %"]], data, "Asset_Allocation");
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm"
                title="Download Section PDF"
              >
                <Download size={14} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PieIcon size={20} className="text-indigo-600" />
              Consolidated Asset Allocation
            </h4>
            <div className="h-[300px] flex flex-col sm:flex-row items-center gap-6">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {assetData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-3">
                {assetData.sort((a, b) => b.value - a.value).map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-slate-600">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {((item.value / executiveReportData.totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Investor Allocation */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => {
                  const data = Object.entries(executiveReportData.investorAllocation).map(([name, value]) => [
                    name, 
                    formatCurrencyForPDF(value), 
                    ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
                  ]);
                  downloadPDF("Investor Allocation Report", [["Investor", "Value", "Allocation %"]], data, "Investor_Allocation");
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm"
                title="Download Section PDF"
              >
                <Download size={14} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Landmark size={20} className="text-emerald-600" />
              Investor-wise Portfolio Breakdown
            </h4>
            <div className="space-y-6">
              {investorData.sort((a, b) => b.value - a.value).map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / executiveReportData.totalValue) * 100}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {((item.value / executiveReportData.totalValue) * 100).toFixed(2)}% Coverage
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600">Active Investor</p>
                  </div>
                </div>
              ))}
              {investorData.length > 0 && (
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total Wealth Pool</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(executiveReportData.totalValue)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section: Market Cap & Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Market Cap Allocation */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => {
                  const data = [
                    ["Large Cap", formatCurrencyForPDF(executiveReportData.consolidatedMarketCap.large)],
                    ["Mid Cap", formatCurrencyForPDF(executiveReportData.consolidatedMarketCap.mid)],
                    ["Small Cap", formatCurrencyForPDF(executiveReportData.consolidatedMarketCap.small)]
                  ];
                  downloadPDF("Market Cap Distribution", [["Cap Type", "Value"]], data, "Market_Cap");
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm"
                title="Download Section PDF"
              >
                <Download size={14} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Zap size={20} className="text-indigo-600" />
              Consolidated Market Cap Distribution
            </h4>
            <div className="h-[250px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketCapData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis hide />
                  <RechartsTooltip 
                    cursor={{ fill: '#f8fafc' }}
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                    {marketCapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category-wise Market Cap</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(executiveReportData.categoryWiseMarketCap).map(([cat, caps]) => {
                  const total = caps.large + caps.mid + caps.small;
                  return (
                    <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">{cat}</p>
                      <div className="flex h-1.5 rounded-full overflow-hidden w-full">
                        <div style={{ width: `${(caps.large / total) * 100}%` }} className="bg-indigo-500 h-full" />
                        <div style={{ width: `${(caps.mid / total) * 100}%` }} className="bg-emerald-500 h-full" />
                        <div style={{ width: `${(caps.small / total) * 100}%` }} className="bg-amber-500 h-full" />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[9px] font-bold text-slate-500">L: {((caps.large / total) * 100).toFixed(0)}%</span>
                        <span className="text-[9px] font-bold text-slate-500">M: {((caps.mid / total) * 100).toFixed(0)}%</span>
                        <span className="text-[9px] font-bold text-slate-500">S: {((caps.small / total) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Holding Heatmap */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => {
                  const data = Object.entries(executiveReportData.stockHoldings)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 50)
                    .map(([name, value]) => [
                      name, 
                      formatCurrencyForPDF(value), 
                      ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
                    ]);
                  downloadPDF("Top 50 Holdings Report", [["Asset", "Value", "Allocation %"]], data, "Top_Holdings");
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm"
                title="Download Section PDF"
              >
                <Download size={14} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              Portfolio Holding Heatmap
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {Object.entries(executiveReportData.stockHoldings)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 30) // Show top 30 in heatmap
                .map(([name, value], i) => {
                  const weight = (value / executiveReportData.totalValue) * 100;
                  const opacity = Math.max(0.2, Math.min(1, weight / 10)); // Scale opacity based on weight
                  return (
                    <div 
                      key={name}
                      title={`${name}: ${weight.toFixed(2)}%`}
                      className="aspect-square rounded-lg flex items-center justify-center p-1 text-center transition-all hover:scale-110 cursor-help"
                      style={{ 
                        backgroundColor: `rgba(99, 102, 241, ${opacity})`,
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                      }}
                    >
                      <span className={`text-[8px] font-bold leading-tight ${opacity > 0.6 ? 'text-white' : 'text-slate-700'}`}>
                        {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  );
                })}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-6">
              Blocks weighted by holding concentration
            </p>
          </div>
        </div>

        {/* Section: Sector & Top Holdings */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group overflow-hidden mb-8">
          <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600" />
            Monthly Portfolio Trend
          </h4>
          
          <div className="h-[300px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={executiveReportData.monthlyTrendData}>
                <defs>
                  <linearGradient id="colorTrendExec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <RechartsTooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorTrendExec)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Month End</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Portfolio Value</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {executiveReportData.monthlyTrendData.map((d, i, arr) => {
                  const prevValue = i > 0 ? arr[i-1].value : d.value;
                  const growth = ((d.value - prevValue) / prevValue) * 100;
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-xs font-bold text-slate-600">{d.month}</td>
                      <td className="px-6 py-3 text-xs text-right font-medium text-slate-900">{formatCurrency(d.value)}</td>
                      <td className={`px-6 py-3 text-xs text-right font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {growth >= 0 ? '+' : ''}{growth.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section: Sector & Top Holdings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sector Allocation */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => {
                  const data = Object.entries(executiveReportData.sectorAllocation)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, value]) => [
                      name, 
                      formatCurrencyForPDF(value), 
                      ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
                    ]);
                  downloadPDF("Sector Allocation Report", [["Sector", "Value", "Allocation %"]], data, "Sector_Allocation");
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm"
                title="Download Section PDF"
              >
                <Download size={14} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" />
              Consolidated Sector exposure
            </h4>
            <div className="h-[300px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(executiveReportData.sectorAllocation)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {Object.entries(executiveReportData.sectorAllocation)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'][index % 8]} />
                      ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category-wise Sector Mix</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(executiveReportData.categoryWiseSector).map(([cat, sectors]) => (
                    <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{cat}</span>
                        <span className="text-[9px] font-medium text-slate-500">Top Sectors</span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(sectors)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([name, val], i) => {
                            const catTotal = Object.values(sectors).reduce((a, b) => a + b, 0);
                            const perc = (val / catTotal) * 100;
                            return (
                              <div key={name} className="space-y-1">
                                <div className="flex justify-between text-[9px]">
                                  <span className="font-bold text-slate-600 truncate">{name}</span>
                                  <span className="font-bold text-slate-900">{perc.toFixed(1)}%</span>
                                </div>
                                <div className="h-1 bg-white rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${perc}%` }}
                                    className="h-full bg-indigo-500"
                                    style={{ opacity: 1 - (i * 0.2) }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top 10 Holdings */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
              <Target size={20} className="text-emerald-600" />
              Consolidated Top 10 Allocation
            </h4>
            <div className="space-y-5">
              {Object.entries(executiveReportData.stockHoldings)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, value], idx) => {
                  const weight = (value / executiveReportData.totalValue) * 100;
                  return (
                    <div key={name} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex gap-3 items-center">
                          <span className="text-[10px] font-bold text-slate-300">#{(idx + 1).toString().padStart(2, '0')}</span>
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">{name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 block">{formatCurrency(value)}</span>
                          <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">{weight.toFixed(2)}% Allocation</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, weight * 5)}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Category-level Concentration</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(executiveReportData.categoryWiseHoldings).map(([cat, holdings]) => (
                  <div key={cat} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{cat}</span>
                      <span className="text-[9px] font-medium text-slate-500">Top 3 Holdings</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(holdings)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([name, value], i) => {
                          const catTotal = Object.values(holdings).reduce((a, b) => a + b, 0);
                          const concentration = (value / catTotal) * 100;
                          return (
                            <div key={name} className="space-y-1">
                              <div className="flex justify-between text-[9px]">
                                <span className="font-bold text-slate-700 truncate max-w-[150px]">{name}</span>
                                <span className={`font-bold ${concentration > 30 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {concentration.toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-1 bg-white rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${concentration}%` }}
                                  className={`h-full ${concentration > 30 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                  style={{ opacity: 1 - (i * 0.2) }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Product Level Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative group">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
              <button 
                onClick={() => {
                  const data = Object.entries(executiveReportData.productAllocation).map(([name, value]) => [
                    name, 
                    formatCurrencyForPDF(value), 
                    ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
                  ]);
                  downloadPDF("Product Level Allocation", [["Product", "Amount", "Allocation %"]], data, "Product_Allocation");
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm"
                title="Download Section PDF"
              >
                <Download size={14} />
              </button>
            </div>
            <div className="p-8 border-b border-slate-100">
              <h4 className="font-bold text-slate-900">Product Level Allocation</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Product</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Allocation %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(executiveReportData.productAllocation)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, value]) => (
                      <tr key={name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-4 text-sm font-bold text-slate-700">{name}</td>
                        <td className="px-8 py-4 text-sm text-right font-medium text-slate-600">{formatCurrency(value)}</td>
                        <td className="px-8 py-4 text-sm text-right font-bold text-indigo-600">
                          {((value / executiveReportData.totalValue) * 100).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="px-8 py-4 text-sm uppercase tracking-widest">Total Portfolio</td>
                    <td className="px-8 py-4 text-sm text-right">{formatCurrency(executiveReportData.totalValue)}</td>
                    <td className="px-8 py-4 text-sm text-right">100.00%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Fund House Allocation */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative group">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
              <button 
                onClick={() => {
                  const data = Object.entries(executiveReportData.fundHouseAllocation)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, value]) => [
                      name, 
                      formatCurrencyForPDF(value), 
                      ((value / executiveReportData.totalValue) * 100).toFixed(2) + '%'
                    ]);
                  downloadPDF("Fund House Exposure", [["Fund House", "Amount", "Allocation %"]], data, "Fund_House_Exposure");
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm"
                title="Download Section PDF"
              >
                <Download size={14} />
              </button>
            </div>
            <div className="p-8 border-b border-slate-100">
              <h4 className="font-bold text-slate-900">Fund House Exposure</h4>
            </div>
            <div className="p-8">
              {Object.keys(executiveReportData.fundHouseAllocation).length > 0 ? (
                <div className="space-y-6">
                  <div className="w-full" style={{ height: `${Math.max(300, Object.keys(executiveReportData.fundHouseAllocation).length * 40)}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={Object.entries(executiveReportData.fundHouseAllocation)
                          .sort((a, b) => b[1] - a[1])
                          .map(([name, value]) => ({ name, value }))}
                        margin={{ left: 20, right: 40, top: 0, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100} 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }}
                        />
                        <RechartsTooltip 
                          formatter={(value: number) => [formatCurrency(value), 'Amount']}
                          labelFormatter={(label) => `Fund House: ${label}`}
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {Object.entries(executiveReportData.fundHouseAllocation)
                            .sort((a, b) => b[1] - a[1])
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    {Object.entries(executiveReportData.fundHouseAllocation)
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, value]) => (
                        <div key={name} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <p className="text-xs font-bold text-slate-700">{name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">{formatCurrency(value)}</p>
                            <p className="text-[10px] font-bold text-indigo-600">
                              {((value / executiveReportData.totalValue) * 100).toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total Exposure</p>
                    <p className="text-sm font-bold text-indigo-600">{formatCurrency(Object.values(executiveReportData.fundHouseAllocation).reduce((a, b) => a + b, 0))}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-10">No fund house data available</p>
              )}
            </div>
          </div>
        </div>

        {/* MF Sub-category Breakdown */}
        {Object.keys(executiveReportData.mfSubCategoryAllocation).length > 0 && (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative group">
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
              <button 
                onClick={() => {
                  const mfTotal = Object.values(executiveReportData.mfSubCategoryAllocation).reduce((a, b) => a + b, 0);
                  const data = Object.entries(executiveReportData.mfSubCategoryAllocation)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, value]) => [
                      name, 
                      formatCurrencyForPDF(value), 
                      ((value / mfTotal) * 100).toFixed(2) + '%'
                    ]);
                  downloadPDF("MF Sub-category Breakdown", [["Category", "Amount", "Allocation %"]], data, "MF_SubCategory_Breakdown");
                }}
                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm"
                title="Download Section PDF"
              >
                <Download size={14} />
              </button>
            </div>
            <h4 className="font-bold text-slate-900 mb-8">Mutual Fund Sub-category Breakdown</h4>
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="w-full lg:w-1/2 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(executiveReportData.mfSubCategoryAllocation)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(executiveReportData.mfSubCategoryAllocation)
                        .sort((a, b) => b[1] - a[1])
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} />
                        ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(executiveReportData.mfSubCategoryAllocation)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, value], index) => {
                    const totalValue = executiveReportData.totalValue;
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                    return (
                      <div key={name} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colors[index % 6] }} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{name}</p>
                          <p className="text-base font-bold text-slate-900">{formatCurrency(value)}</p>
                          <p className="text-[10px] font-bold text-indigo-600">
                            {((value / totalValue) * 100).toFixed(1)}% of Portfolio
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Sector and Stock Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sector Allocation */}
          {Object.keys(executiveReportData.sectorAllocation).length > 0 && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
                <Activity size={20} className="text-indigo-600" />
                Sector Wise Allocation
              </h4>
              <div className="h-[300px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(executiveReportData.sectorAllocation)
                        .sort((a, b) => b[1] - a[1])
                        .map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {Object.entries(executiveReportData.sectorAllocation)
                        .sort((a, b) => b[1] - a[1])
                        .map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'][index % 8]} />
                        ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(executiveReportData.sectorAllocation)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, value], index) => (
                    <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'][index % 8] }} />
                        <span className="text-[10px] font-bold text-slate-600 truncate">{name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-900">
                        {((value / executiveReportData.totalValue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top Stock Holdings */}
          {Object.keys(executiveReportData.stockHoldings).length > 0 && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-8 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600" />
                Top Stock Holdings
              </h4>
              <div className="space-y-4">
                {Object.entries(executiveReportData.stockHoldings)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([name, value]) => (
                    <div key={name} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{name}</span>
                        <span className="text-xs font-bold text-slate-900">{formatCurrency(value)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(value / executiveReportData.totalValue) * 100}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        {((value / executiveReportData.totalValue) * 100).toFixed(2)}% of Portfolio
                      </p>
                    </div>
                  ))}
                {Object.keys(executiveReportData.stockHoldings).length > 10 && (
                  <p className="text-[10px] text-slate-400 text-center pt-2 font-bold uppercase tracking-widest">
                    + {Object.keys(executiveReportData.stockHoldings).length - 10} more stock holdings
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const taxHarvestingData = useMemo(() => {
    const opportunities = portfolio.investments
      .filter(inv => inv.currentValue < inv.investedValue)
      .map(inv => {
        const loss = inv.investedValue - inv.currentValue;
        const isEquity = inv.category === 'Equity' || (inv.category === 'Hybrid' && inv.subCategory.includes('Equity'));
        
        // Simplified holding period check: if no purchases, assume STCL if lastUpdated is < 1 year ago
        const now = new Date();
        const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
        const isLongTerm = inv.purchases && inv.purchases.length > 0 
          ? inv.purchases.every(p => new Date(p.date) < oneYearAgo)
          : new Date(inv.lastUpdated) < oneYearAgo;

        const taxRate = isLongTerm ? 0.125 : 0.20; // LTCG 12.5%, STCG 20%
        const potentialSavings = loss * taxRate;

        return {
          id: inv.id,
          name: inv.name,
          category: inv.category,
          invested: inv.investedValue,
          current: inv.currentValue,
          loss,
          type: isLongTerm ? 'Long Term' : 'Short Term',
          potentialSavings
        };
      });

    const totalLoss = opportunities.reduce((sum, o) => sum + o.loss, 0);
    const totalSavings = opportunities.reduce((sum, o) => sum + o.potentialSavings, 0);

    // Realized gains in the selected period to offset
    const realizedGainsInPeriod = filteredTransactions
      .filter(t => t.type === 'Sell')
      .reduce((sum, t) => {
        const inv = portfolio.investments.find(i => i.id === t.investmentId);
        if (inv && inv.buyPrice) {
          const cost = t.quantity * inv.buyPrice;
          return sum + (t.amount - cost);
        }
        return sum + (t.amount * 0.15);
      }, 0);

    return { opportunities, totalLoss, totalSavings, realizedGainsInPeriod };
  }, [portfolio.investments, filteredTransactions]);

  const handleDownloadTaxHarvesting = (type: 'excel' | 'pdf') => {
    const data = taxHarvestingData.opportunities.map(o => ({
      Asset: o.name,
      Type: o.type,
      'Invested Value': o.invested,
      'Current Value': o.current,
      'Unrealised Loss': o.loss,
      'Potential Tax Saving': o.potentialSavings
    }));

    const periodLabel = filterType === 'standard' ? 'Since Inception' : filterType === 'fy' ? `FY ${selectedFY}` : filterType === 'qtr' ? `${selectedQtr} FY ${selectedFY}` : `${startDate} to ${endDate}`;

    if (type === 'excel') {
      downloadExcel(data, `Tax_Loss_Harvesting_Report_${periodLabel.replace(/\s+/g, '_')}`);
    } else {
      downloadPDF(
        `Tax Loss Harvesting Report - ${periodLabel}`,
        [['Asset', 'Type', 'Invested', 'Current', 'Loss', 'Potential Saving']],
        data.map(d => [
          d.Asset, 
          d.Type, 
          formatCurrencyForPDF(d['Invested Value']), 
          formatCurrencyForPDF(d['Current Value']), 
          formatCurrencyForPDF(d['Unrealised Loss']), 
          formatCurrencyForPDF(d['Potential Tax Saving'])
        ]),
        `Tax_Loss_Harvesting_Report_${periodLabel.replace(/\s+/g, '_')}`
      );
    }
  };

  const renderTaxHarvesting = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {renderFilters()}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Tax Loss Harvesting Opportunities</h3>
          <p className="text-sm text-slate-500">Identify investments in loss to offset your capital gains tax</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleDownloadTaxHarvesting('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
          <button 
            onClick={() => handleDownloadTaxHarvesting('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all"
          >
            <FilePdf size={16} />
            PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
              <TrendingDown size={20} />
            </div>
            <h4 className="font-bold text-slate-900">Total Harvestable Loss</h4>
          </div>
          <p className="text-3xl font-bold text-rose-600">{formatCurrency(taxHarvestingData.totalLoss)}</p>
          <p className="text-xs text-slate-500 mt-2">Unrealised losses available for harvesting</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-bold text-slate-900">Potential Tax Savings</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(taxHarvestingData.totalSavings)}</p>
          <p className="text-xs text-slate-500 mt-2">Estimated tax reduction on realization</p>
        </div>
        <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-xl text-white">
              <TrendingUp size={20} />
            </div>
            <h4 className="font-bold">Realized Gains (Period)</h4>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(taxHarvestingData.realizedGainsInPeriod)}
          </p>
          <p className="text-xs text-indigo-100 mt-2">Gains available to be offset in this period</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Specific Harvesting Opportunities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Name</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invested</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unrealised Loss</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Potential Saving</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxHarvestingData.opportunities.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <span className="text-sm font-bold text-slate-900 truncate block max-w-[200px]" title={o.name}>{o.name}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${o.type === 'Long Term' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {o.type}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-slate-600">{formatCurrency(o.invested)}</td>
                  <td className="px-8 py-4 text-sm text-slate-600">{formatCurrency(o.current)}</td>
                  <td className="px-8 py-4 text-sm font-bold text-rose-600">{formatCurrency(o.loss)}</td>
                  <td className="px-8 py-4 text-sm font-bold text-emerald-600">{formatCurrency(o.potentialSavings)}</td>
                </tr>
              ))}
              {taxHarvestingData.opportunities.length > 0 && (
                <tr className="bg-slate-900 text-white font-bold">
                  <td colSpan={2} className="px-8 py-4 text-sm uppercase tracking-widest">Total Opportunities</td>
                  <td className="px-8 py-4 text-sm">{formatCurrency(taxHarvestingData.opportunities.reduce((a, b) => a + b.invested, 0))}</td>
                  <td className="px-8 py-4 text-sm">{formatCurrency(taxHarvestingData.opportunities.reduce((a, b) => a + b.current, 0))}</td>
                  <td className="px-8 py-4 text-sm text-rose-400">{formatCurrency(taxHarvestingData.totalLoss)}</td>
                  <td className="px-8 py-4 text-sm text-emerald-400">{formatCurrency(taxHarvestingData.totalSavings)}</td>
                </tr>
              )}
              {taxHarvestingData.opportunities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-500">
                    No tax loss harvesting opportunities found in your current portfolio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 p-8 rounded-3xl border border-amber-100 flex gap-4">
          <AlertCircle className="text-amber-500 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-900 mb-2">Important Note: Wash Sale Concept</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              In India, while there is no explicit "Wash Sale" rule like in the US, the tax authorities may disallow losses if they appear to be created solely for tax evasion without commercial substance. 
              Avoid selling and immediately buying the same security on the same day. Consider waiting for a few days or buying a similar but different security.
            </p>
          </div>
        </div>
        <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 flex gap-4">
          <Info className="text-indigo-500 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-indigo-900 mb-2">How to Plan?</h4>
            <p className="text-sm text-indigo-800 leading-relaxed">
              1. Realize losses to offset realized gains of the same financial year.<br/>
              2. STCL can offset both STCG and LTCG.<br/>
              3. LTCL can only offset LTCG.<br/>
              4. Unadjusted losses can be carried forward for up to 8 assessment years.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-wrap items-end gap-6">
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter Type</label>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setFilterType('standard')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'standard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Since Inception
          </button>
          <button 
            onClick={() => setFilterType('fy')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'fy' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Financial Year
          </button>
          <button 
            onClick={() => setFilterType('qtr')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'qtr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Quarterly
          </button>
          <button 
            onClick={() => setFilterType('custom')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            Custom Period
          </button>
        </div>
      </div>

      {(filterType === 'fy' || filterType === 'qtr') && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select FY</label>
          <select 
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="block w-40 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {['2025-26', '2024-25', '2023-24', '2022-23'].map(fy => (
              <option key={fy} value={fy}>FY {fy}</option>
            ))}
          </select>
        </div>
      )}

      {filterType === 'qtr' && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Quarter</label>
          <select 
            value={selectedQtr}
            onChange={(e) => setSelectedQtr(e.target.value as any)}
            className="block w-32 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="Q1">Q1 (Apr-Jun)</option>
            <option value="Q2">Q2 (Jul-Sep)</option>
            <option value="Q3">Q3 (Oct-Dec)</option>
            <option value="Q4">Q4 (Jan-Mar)</option>
          </select>
        </div>
      )}

      {filterType === 'custom' && (
        <>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investment</label>
        <select 
          value={selectedInvestmentId}
          onChange={(e) => setSelectedInvestmentId(e.target.value)}
          className="block w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="All">All Investments</option>
          {portfolio.investments.map(inv => (
            <option key={inv.id} value={inv.id}>{inv.name}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderGains = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {renderFilters()}
      <div className="flex justify-end gap-3 mb-2">
        <button 
          onClick={() => handleDownloadGains('excel')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
        >
          <FileSpreadsheet size={16} />
          Excel
        </button>
        <button 
          onClick={handleCopyGains}
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all"
        >
          <Copy size={16} />
          Copy
        </button>
        <button 
          onClick={() => handleDownloadGains('pdf')}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all"
        >
          <FilePdf size={16} />
          PDF
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <h4 className="font-bold text-slate-900">Unrealised Gains</h4>
          </div>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(capitalGains.unrealised)}</p>
          <p className="text-xs text-slate-500 mt-2">Paper profits on current holdings</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
              <ArrowUpRight size={20} />
            </div>
            <h4 className="font-bold text-slate-900">Realised Gains</h4>
          </div>
          <p className="text-3xl font-bold text-indigo-600">{formatCurrency(capitalGains.realised)}</p>
          <p className="text-xs text-slate-500 mt-2">Profits booked from sales</p>
        </div>
        <div className="bg-slate-900 p-8 rounded-3xl text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/10 rounded-xl text-white">
              <Activity size={20} />
            </div>
            <h4 className="font-bold">Total Capital Gain</h4>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(capitalGains.total)}</p>
          <p className="text-xs text-slate-400 mt-2">Combined wealth generated</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-6">Tax Implications (Estimated)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-medium text-slate-600">Short Term Capital Gain (STCG)</span>
              <span className="font-bold text-rose-600">{formatCurrency(capitalGains.realised * 0.20)}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-sm font-medium text-slate-600">Long Term Capital Gain (LTCG)</span>
              <span className="font-bold text-rose-600">{formatCurrency(Math.max(0, (capitalGains.realised * 0.80 - 125000) * 0.125))}</span>
            </div>
          </div>
          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
            <Info className="text-amber-500 shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold text-amber-900 mb-1">Tax Planning Tip</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                You can harvest up to ₹1.25 Lakh of LTCG every year tax-free (as per Budget 2024). Consider selling and re-buying some equity units to reset your cost basis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {renderFilters()}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Transactions Report</h3>
          <div className="flex gap-3">
            <button 
              onClick={() => handleDownloadTransactions('excel')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all"
            >
              <FileSpreadsheet size={16} />
              Excel
            </button>
            <button 
              onClick={handleCopyTransactions}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all"
            >
              <Copy size={16} />
              Copy
            </button>
            <button 
              onClick={() => handleDownloadTransactions('pdf')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-all"
            >
              <FilePdf size={16} />
              PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Quantity</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                        <Calendar size={14} />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm font-bold text-slate-900">{t.investmentName}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.type === 'Buy' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-sm font-medium text-slate-600">{t.quantity || '-'}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-sm font-medium text-slate-600">{t.price ? formatCurrency(t.price) : '-'}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-sm font-bold text-slate-900">{formatCurrency(t.amount)}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                      Completed
                    </span>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length > 0 && (
                <tr className="bg-slate-900 text-white font-bold">
                  <td colSpan={5} className="px-8 py-4 text-sm uppercase tracking-widest">Total Transaction Value</td>
                  <td className="px-8 py-4 text-sm text-right">{formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.amount, 0))}</td>
                  <td></td>
                </tr>
              )}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-slate-500">
                    No transactions found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Calculate actual performance based on historical snapshots if available
  const getPerformanceData = useCallback((period: string) => {
    let filteredInvestments = portfolio.investments;

    // First level: Category
    if (selectedPerfCategory === 'SIP') {
      filteredInvestments = filteredInvestments.filter(inv => inv.isSIP);
    } else if (selectedPerfCategory !== 'All') {
      filteredInvestments = filteredInvestments.filter(inv => inv.category === selectedPerfCategory);
    }

    // Second level: Sub-category
    if (selectedPerfSubCategory !== 'All') {
      filteredInvestments = filteredInvestments.filter(inv => inv.subCategory === selectedPerfSubCategory);
    }

    if (performanceLevel === 'Individual') {
      return filteredInvestments.map(inv => {
        const invReturn = inv.return1Y || 0;
        const benchmarkReturn = inv.category === 'Equity' ? 15.2 : inv.category === 'Debt' ? 7.1 : 12.5;
        return {
          category: inv.name,
          portfolioReturn: invReturn,
          indexReturn: benchmarkReturn,
          alpha: invReturn - benchmarkReturn,
          isIndividual: true
        };
      });
    }

    // Aggregate View
    if (selectedPerfCategory === 'All' && selectedPerfSubCategory === 'All') {
      // Show major categories
      const categories = ['Equity', 'Debt', 'Hybrid', 'Gold', 'Alternative'];
      const data = categories.map(cat => {
        const assets = portfolio.investments.filter(inv => inv.category === cat);
        if (assets.length === 0) return null;
        
        const avgReturn = assets.reduce((sum, a) => sum + (a.return1Y || 0), 0) / assets.length;
        const benchmark = cat === 'Equity' || cat === 'Alternative' ? 15.2 : 7.1;
        
        return {
          category: cat,
          portfolioReturn: avgReturn,
          indexReturn: benchmark,
          alpha: avgReturn - benchmark
        };
      }).filter(Boolean) as any[];

      const overallReturn = portfolio.investments.length > 0 
        ? portfolio.investments.reduce((sum, i) => sum + (i.return1Y || 0), 0) / portfolio.investments.length
        : 0;
        
      data.push({
        category: 'Overall',
        portfolioReturn: overallReturn,
        indexReturn: 13.2,
        alpha: overallReturn - 13.2
      });

      return data;
    }

    // If a specific category or sub-category is selected
    const label = selectedPerfSubCategory !== 'All' ? selectedPerfSubCategory : selectedPerfCategory;
    const avgReturn = filteredInvestments.length > 0 
      ? filteredInvestments.reduce((sum, i) => sum + (i.return1Y || 0), 0) / filteredInvestments.length
      : 0;
      
    const benchmark = selectedPerfCategory === 'Bonds' || selectedPerfCategory.includes('Debt') ? 7.1 : 15.2;
    return [
      {
        category: label,
        portfolioReturn: avgReturn,
        indexReturn: benchmark,
        alpha: avgReturn - benchmark
      },
      {
        category: 'Overall',
        portfolioReturn: portfolio.investments.length > 0 
          ? portfolio.investments.reduce((sum, i) => sum + (i.return1Y || 0), 0) / portfolio.investments.length
          : 0,
        indexReturn: 13.2,
        alpha: (portfolio.investments.length > 0 ? (portfolio.investments.reduce((sum, i) => sum + (i.return1Y || 0), 0) / portfolio.investments.length) : 0) - 13.2
      }
    ];
  }, [portfolio.investments, selectedPerfCategory, selectedPerfSubCategory, performanceLevel]);

  const availableProducts = useMemo(() => {
    const cats = new Set<string>();
    portfolio.investments.forEach(inv => {
      if (inv.category) cats.add(inv.category);
    });
    return Array.from(cats);
  }, [portfolio.investments]);

  const renderPerformance = () => {

    const inceptionData = getPerformanceData('Since Inception');
    const currentFYData = getPerformanceData('Current FY');
    const selectedFYData = filterType === 'fy' ? getPerformanceData(selectedFY) : null;
    const selectedQtrData = filterType === 'qtr' ? getPerformanceData(`${selectedQtr} ${selectedFY}`) : null;
    const customData = filterType === 'custom' ? getPerformanceData(`${startDate} to ${endDate}`) : null;

    const renderPerformanceCard = (title: string, data: any[]) => {
      const overall = data.find(i => i.category === 'Overall') || (data.length > 0 ? {
        portfolioReturn: data.reduce((sum, i) => sum + i.portfolioReturn, 0) / data.length,
        indexReturn: data.reduce((sum, i) => sum + i.indexReturn, 0) / data.length,
        alpha: data.reduce((sum, i) => sum + i.alpha, 0) / data.length
      } : { portfolioReturn: 0, indexReturn: 0, alpha: 0 });
      
      const categories = data.filter(i => i.category !== 'Overall');

      return (
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex-1">
                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{title}</p>
                <h3 className="text-3xl font-bold mb-2">Portfolio vs Benchmark</h3>
                <p className="text-slate-400 text-sm max-w-md">
                  Comparison against a weighted benchmark based on your asset allocation.
                </p>
              </div>
              <div className="flex flex-wrap gap-8 md:gap-12 items-center">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Portfolio</p>
                  <p className="text-3xl font-bold text-emerald-400">{overall.portfolioReturn.toFixed(2)}%</p>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/10" />
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Benchmark</p>
                  <p className="text-3xl font-bold text-slate-200">{overall.indexReturn.toFixed(2)}%</p>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/10" />
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Alpha</p>
                  <p className={`text-3xl font-bold ${overall.alpha >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {overall.alpha >= 0 ? '+' : ''}{overall.alpha.toFixed(2)}%
                  </p>
                </div>
                <div className="hidden md:block w-px h-12 bg-white/10" />
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => handleDownloadPerformance('excel', title, data)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-bold text-[10px] hover:bg-white/20 transition-all"
                    title="Export to Excel"
                  >
                    <FileSpreadsheet size={12} />
                    Excel
                  </button>
                  <button 
                    onClick={() => handleCopyPerformance(data)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-bold text-[10px] hover:bg-white/20 transition-all"
                    title="Copy to Clipboard (Excel-friendly)"
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                  <button 
                    onClick={() => handleDownloadPerformance('pdf', title, data)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 text-white rounded-lg font-bold text-[10px] hover:bg-white/20 transition-all"
                    title="Export to PDF"
                  >
                    <FilePdf size={12} />
                    PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-8">Performance Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(val) => `${val}%`} />
                    <RechartsTooltip 
                      formatter={(val: number) => `${val.toFixed(2)}%`}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="portfolioReturn" name="Your Portfolio" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
                    <Bar dataKey="indexReturn" name="Benchmark Index" fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Detailed Numbers</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Portfolio</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Index</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alpha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((item) => (
                    <tr key={item.category} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 truncate max-w-[180px]" title={item.category}>{item.category}</td>
                      <td className="px-6 py-4 text-sm font-medium text-emerald-600">{item.portfolioReturn.toFixed(2)}%</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.indexReturn.toFixed(2)}%</td>
                      <td className={`px-6 py-4 text-sm font-bold ${item.alpha >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                        {item.alpha >= 0 ? '+' : ''}{item.alpha.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  {data.length > 0 && (
                    <tr className="bg-slate-900 text-white font-bold">
                      <td className="px-6 py-4 text-sm uppercase tracking-widest">Weighted Average</td>
                      <td className="px-6 py-4 text-sm text-emerald-400">{(data.reduce((sum, i) => sum + i.portfolioReturn, 0) / data.length).toFixed(2)}%</td>
                      <td className="px-6 py-4 text-sm text-slate-300">{(data.reduce((sum, i) => sum + i.indexReturn, 0) / data.length).toFixed(2)}%</td>
                      <td className="px-6 py-4 text-sm text-indigo-400">{(data.reduce((sum, i) => sum + i.alpha, 0) / data.length).toFixed(2)}%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderFilters()}

        <div className="flex flex-col gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investment Category</label>
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
              {Object.keys(performanceHierarchy).map(cat => (
                <button 
                  key={cat}
                  onClick={() => {
                    setSelectedPerfCategory(cat);
                    setSelectedPerfSubCategory('All');
                  }}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectedPerfCategory === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {selectedPerfCategory !== 'All' && Array.from(performanceHierarchy[selectedPerfCategory]).length > 1 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-Category</label>
              <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar max-w-full">
                {Array.from(performanceHierarchy[selectedPerfCategory]).map(sub => (
                  <button 
                    key={sub}
                    onClick={() => setSelectedPerfSubCategory(sub)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectedPerfSubCategory === sub ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Level</label>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              {(['Aggregate', 'Individual'] as const).map(level => (
                <button 
                  key={level}
                  onClick={() => setPerformanceLevel(level)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${performanceLevel === level ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filterType === 'standard' ? (
          <div className="space-y-16">
            {renderPerformanceCard('Current Financial Year', currentFYData)}
            <div className="h-px bg-slate-100" />
            {renderPerformanceCard('Since Inception', inceptionData)}
          </div>
        ) : filterType === 'fy' ? (
          selectedFYData && renderPerformanceCard(`Financial Year ${selectedFY}`, selectedFYData)
        ) : filterType === 'qtr' ? (
          selectedQtrData && renderPerformanceCard(`${selectedQtr} Financial Year ${selectedFY}`, selectedQtrData)
        ) : (
          customData && renderPerformanceCard(`Custom Period: ${startDate} to ${endDate}`, customData)
        )}
      </div>
    );
  };

  const isConsolidated = portfolio.selectedMemberId === 'family';

  const handleGenerateFinancialPlan = async () => {
    try {
      setIsGeneratingPlan(true);
      const plan = await generateDetailedFinancialPlan(portfolio);
      await updateFinancialPlan(plan);
    } catch (error) {
      handleError(error, { 
        type: ErrorType.API, 
        title: 'Wealth Roadmap Generation Failed'
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateAIAnalysis = async () => {
    if (isCooldownActive()) {
      alert(`AI is cooling down. Please wait ${getCooldownTimeLeft()}s`);
      return;
    }

    setIsGeneratingAIReport(true);
    try {
      const report = await generateAIDetailedAnalysis(portfolio);
      setAiReport(report);
    } catch (error) {
      handleError(error, { type: ErrorType.AI, title: 'Analysis Generation Failed' });
    } finally {
      setIsGeneratingAIReport(false);
    }
  };

  const downloadAIDetailedReportPDF = () => {
    if (!aiReport) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("BESPOKE WEALTH ANALYSIS", margin, 25);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, 32);

    let y = 50;
    const sections = [
      { title: 'Global Market Scenario & Future Outlook', content: aiReport.marketOutlook },
      { title: 'Portfolio Valuation & Sentiment Analysis', content: aiReport.valuationAnalysis },
      { title: 'Liquidity & Risk Assessment', content: aiReport.liquiditySentiment },
      { title: 'Portfolio Future Projections', content: aiReport.portfolioProjection },
      { title: 'Strategic Recommendations', content: aiReport.recommendations },
      { title: 'Audit & Data Validation Summary', content: aiReport.auditSummary }
    ];

    sections.forEach(section => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, margin, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const lines = doc.splitTextToSize(section.content, pageWidth - margin * 2);
      doc.text(lines, margin, y);
      y += (lines.length * 5) + 12;
    });

    addFooter(doc);
    doc.save(`Detailed_Wealth_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadFinancialPlanPDF = () => {
    const plan = portfolio.financialPlan;
    if (!plan) return;

    const doc = generateFinancialPlanPDF(plan, portfolio);
    doc.save(`Financial_Plan_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadFinancialPlanExcel = () => {
    const plan = portfolio.financialPlan;
    if (!plan) return;
    import('../services/exportService').then(({ downloadFinancialPlanExcel: download }) => {
      download(plan);
    });
  };

  const handleExportAll = () => {
    const wb = XLSX.utils.book_new();

    // 1. Capital Gains
    const gainsData = portfolio.investments.map(inv => ({
      Asset: inv.name,
      Category: inv.category,
      'Current Value': inv.currentValue || 0,
      'Invested Value': inv.investedValue || 0,
      'Unrealized Gain': (inv.currentValue || 0) - (inv.investedValue || 0),
      'Gain %': inv.investedValue ? (((inv.currentValue || 0) - inv.investedValue) / inv.investedValue * 100).toFixed(2) + '%' : '0%'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(gainsData), "Capital Gains");

    // 2. Transactions
    const transData = portfolio.transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-IN'),
      Asset: t.investmentName,
      Type: t.type,
      Quantity: t.quantity,
      Price: t.price,
      Amount: t.amount
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transData), "Transactions");

    // 3. Performance
    const currentFYPerf = getPerformanceData('Current FY');
    const perfData = currentFYPerf.map(item => ({
      Category: item.category,
      'Portfolio Return (%)': item.portfolioReturn.toFixed(2),
      'Index Return (%)': item.indexReturn.toFixed(2),
      'Alpha (%)': item.alpha.toFixed(2)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(perfData), "Performance (Current FY)");

    const inceptionPerf = getPerformanceData('Since Inception');
    const inceptionPerfData = inceptionPerf.map(item => ({
      Category: item.category,
      'Portfolio Return (%)': item.portfolioReturn.toFixed(2),
      'Index Return (%)': item.indexReturn.toFixed(2),
      'Alpha (%)': item.alpha.toFixed(2)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inceptionPerfData), "Performance (Inception)");

    // 4. Financial Plan Summary
    if (portfolio.financialPlan) {
      const plan = portfolio.financialPlan;
      const summaryData = [
        { Section: 'Executive Summary', Content: stripMarkdown(plan.executiveSummary) },
        { Section: 'Last Generated', Content: new Date(plan.lastGenerated).toLocaleDateString('en-IN') }
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Wealth Roadmap");
      
      if (plan.actionPlan) {
        const actionData = plan.actionPlan.map(action => ({
          Step: action.step,
          Priority: action.priority,
          Timeline: action.timeline,
          Impact: action.impact
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actionData), "Action Plan");
      }
    }

    XLSX.writeFile(wb, `Alpha_Insights_All_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      doc.text("Confidential Financial Plan - Empowering Your Wealth Journey", margin, pageHeight - 10);
    }
  };

  const renderAIDetailedReport = () => {
    if (!aiReport && !isGeneratingAIReport) {
      return (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="bg-indigo-50 p-6 rounded-full mb-6">
            <Sparkles className="w-12 h-12 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Alpha Insights Analysis</h3>
          <p className="text-slate-500 text-center max-w-md mb-10">
            Generate a comprehensive, private-bank grade analysis of your entire wealth portfolio including market outlook, valuations, and future projections.
          </p>
          <button 
            onClick={handleGenerateAIAnalysis}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 group"
          >
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
            Generate Detailed Analysis Report
          </button>
        </div>
      );
    }

    if (isGeneratingAIReport) {
      return (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-slate-200">
          <div className="relative mb-10">
            <div className="w-24 h-24 border-4 border-indigo-100 rounded-full" />
            <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600">
              <Sparkles size={32} className="animate-pulse" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3 text-center">Architecting Your Wealth Perspective...</h3>
          <p className="text-slate-500 text-center max-w-sm">
            Our AI is currently running global valuation models and cross-referencing your portfolio with the 2024-25 market outlook.
          </p>
        </div>
      );
    }

    if (!aiReport) return null;

    const sections = [
      { 
        id: 'outlook', 
        title: 'Market Scenario & Future Outlook', 
        content: aiReport.marketOutlook, 
        icon: TrendingUp, 
        color: 'bg-indigo-50 text-indigo-600' 
      },
      { 
        id: 'valuation', 
        title: 'Portfolio Valuation Analysis', 
        content: aiReport.valuationAnalysis, 
        icon: Target, 
        color: 'bg-emerald-50 text-emerald-600' 
      },
      { 
        id: 'liquidity', 
        title: 'Liquidity & Sentiment', 
        content: aiReport.liquiditySentiment, 
        icon: Activity, 
        color: 'bg-amber-50 text-amber-600' 
      },
      { 
        id: 'projections', 
        title: 'Future Portfolio Projections', 
        content: aiReport.portfolioProjection, 
        icon: Zap, 
        color: 'bg-rose-50 text-rose-600' 
      },
      { 
        id: 'recommendations', 
        title: 'Strategic Recommendations', 
        content: aiReport.recommendations, 
        icon: Sparkles, 
        color: 'bg-purple-50 text-purple-600' 
      },
      { 
        id: 'audit', 
        title: 'Audit & Data Validation Summary', 
        content: aiReport.auditSummary, 
        icon: ShieldCheck, 
        color: 'bg-slate-100 text-slate-600' 
      }
    ];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 italic">Alpha Insights Detailed Report</h3>
            <p className="text-sm text-slate-500">Sophisticated AI analysis based on global best practices</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleGenerateAIAnalysis}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all border border-slate-200"
            >
              <RefreshCw size={18} className={isGeneratingAIReport ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button 
              onClick={downloadAIDetailedReportPDF}
              className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
            >
              <Download size={20} />
              Download Full Analysis (PDF)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {sections.map((section) => (
            <motion.div 
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-8 lg:p-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 rounded-[1.25rem] ${section.color}`}>
                    <section.icon size={28} />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900">{section.title}</h4>
                </div>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-lg">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderPerformanceSummary = () => {
    const investors = ['All', ...portfolio.familyMembers.map(m => m.name)];
    
    const calculateMovement = (start: Date, end: Date) => {
      const categories = ['Equity', 'Hybrid', 'Debt & Others', 'Total'];
      const rows = [
        'Opening Balance', 'Purchase', 'Switch In', 'Switch Out', 
        'Div. PayOut', 'Redemption', 'Net Addition', 'Closing Balance', 
        'Net Gain', 'XIRR(%)'
      ];

      const data: Record<string, Record<string, number>> = {};
      rows.forEach(row => {
        data[row] = {};
        categories.forEach(cat => {
          data[row][cat] = 0;
        });
      });

      // Filter transactions by date, selected investors, and selected products
      const periodTransactions = portfolio.transactions.filter(t => {
        const d = new Date(t.date);
        const investorMatch = selectedInvestors.includes('All') || 
          selectedInvestors.includes(portfolio.familyMembers.find(m => m.id === t.memberId)?.name || '');
        
        const investment = portfolio.investments.find(inv => inv.id === t.investmentId);
        // If selectedProducts is empty, it means all are selected
        const productMatch = selectedProducts.length === 0 || (investment && selectedProducts.includes(investment.category));
        
        return d >= start && d <= end && investorMatch && productMatch;
      });

      // Helper to map category
      const mapCat = (cat: string) => {
        if (cat === 'Equity') return 'Equity';
        if (cat === 'Hybrid') return 'Hybrid';
        return 'Debt & Others';
      };

      periodTransactions.forEach(t => {
        const cat = mapCat(t.category);
        if (t.type === 'Buy') {
          data['Purchase'][cat] += t.amount;
          data['Purchase']['Total'] += t.amount;
        } else if (t.type === 'Sell') {
          data['Redemption'][cat] += t.amount;
          data['Redemption']['Total'] += t.amount;
        } else if (t.type === 'Dividend' || t.type === 'Interest') {
          data['Div. PayOut'][cat] += t.amount;
          data['Div. PayOut']['Total'] += t.amount;
        }
      });

      // Filter investments for closing balance
      const filteredInvestments = portfolio.investments.filter(inv => {
        const investorMatch = selectedInvestors.includes('All') || 
          selectedInvestors.includes(portfolio.familyMembers.find(m => m.id === inv.memberId)?.name || '');
        const productMatch = selectedProducts.length === 0 || selectedProducts.includes(inv.category);
        return investorMatch && productMatch;
      });

      categories.forEach(cat => {
        if (cat === 'Total') {
          data['Closing Balance'][cat] = filteredInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
        } else {
          data['Closing Balance'][cat] = filteredInvestments
            .filter(inv => mapCat(inv.category) === cat)
            .reduce((sum, inv) => sum + inv.currentValue, 0);
        }
      });

      // Estimate Opening Balance (Simplified for this UI)
      categories.forEach(cat => {
        data['Net Addition'][cat] = data['Purchase'][cat] + data['Switch In'][cat] - data['Switch Out'][cat] - data['Redemption'][cat];
        // For demo purposes, we'll estimate opening balance as closing - net addition - some gain
        // In a real app, this would come from historical snapshots
        data['Opening Balance'][cat] = Math.max(0, data['Closing Balance'][cat] - data['Net Addition'][cat] * 1.05);
        data['Net Gain'][cat] = data['Closing Balance'][cat] - (data['Opening Balance'][cat] + data['Net Addition'][cat]);
        data['XIRR(%)'][cat] = data['Opening Balance'][cat] > 0 ? (data['Net Gain'][cat] / data['Opening Balance'][cat]) * 100 : 0;
      });

      return data;
    };

    const givenPeriodData = calculateMovement(new Date(perfStartDate), new Date(perfEndDate));
    const sinceInceptionData = calculateMovement(new Date(2020, 0, 1), new Date());

    const renderTable = (title: string, data: any) => (
      <div className="flex-1 min-w-[400px] bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Values in INR</div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest">Metric</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Equity</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Hybrid</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Debt & Others</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[
              'Opening Balance', 'Purchase', 'Switch In', 'Switch Out', 
              'Div. PayOut', 'Redemption', 'Net Addition', 'Closing Balance', 
              'Net Gain', 'XIRR(%)'
            ].map((row, idx) => (
              <tr key={row} className={`${row === 'XIRR(%)' ? 'bg-indigo-600 text-white font-bold' : row === 'Closing Balance' ? 'bg-slate-900 text-white font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/30 transition-colors`}>
                <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{row} :</td>
                <td className="px-4 py-2.5 text-xs text-right font-medium">{row === 'XIRR(%)' ? data[row]['Equity'].toFixed(2) + '%' : Math.round(data[row]['Equity']).toLocaleString('en-IN')}</td>
                <td className="px-4 py-2.5 text-xs text-right font-medium">{row === 'XIRR(%)' ? data[row]['Hybrid'].toFixed(2) + '%' : Math.round(data[row]['Hybrid']).toLocaleString('en-IN')}</td>
                <td className="px-4 py-2.5 text-xs text-right font-medium">{row === 'XIRR(%)' ? data[row]['Debt & Others'].toFixed(2) + '%' : Math.round(data[row]['Debt & Others']).toLocaleString('en-IN')}</td>
                <td className="px-4 py-2.5 text-xs text-right font-bold">{row === 'XIRR(%)' ? data[row]['Total'].toFixed(2) + '%' : Math.round(data[row]['Total']).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Filters */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Investor :</label>
              <select 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={selectedInvestors[0]}
                onChange={(e) => setSelectedInvestors([e.target.value])}
              >
                {investors.map(inv => <option key={inv} value={inv}>{inv === 'All' ? 'All Investors' : inv}</option>)}
              </select>
            </div>

            <div className="space-y-3 lg:col-span-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Choose Products :</label>
              <div className="flex flex-wrap gap-3">
                {availableProducts.map(prod => {
                  const isChecked = selectedProducts.length === 0 || selectedProducts.includes(prod);
                  return (
                    <label key={prod} className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                        {isChecked && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isChecked}
                        onChange={() => {
                          if (selectedProducts.length === 0) {
                            // If currently "All", and we uncheck one, we need to set the others as selected
                            setSelectedProducts(availableProducts.filter(p => p !== prod));
                          } else if (selectedProducts.includes(prod)) {
                            const next = selectedProducts.filter(p => p !== prod);
                            // If we uncheck the last one, it might be better to keep it or handle as "None"
                            // But usually users want at least one or "All"
                            setSelectedProducts(next);
                          } else {
                            const next = [...selectedProducts, prod];
                            // If all are now selected, we can reset to empty for "All"
                            if (next.length === availableProducts.length) {
                              setSelectedProducts([]);
                            } else {
                              setSelectedProducts(next);
                            }
                          }
                        }}
                      />
                      <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">{prod}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Range :</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="date" 
                    value={perfStartDate}
                    onChange={(e) => setPerfStartDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <span className="text-slate-400">-</span>
                <div className="relative flex-1">
                  <input 
                    type="date" 
                    value={perfEndDate}
                    onChange={(e) => setPerfEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-end h-full">
              <button className="w-full px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="flex flex-col xl:flex-row gap-8">
          {renderTable('Given Period Performance', givenPeriodData)}
          {renderTable('Since Inception Performance', sinceInceptionData)}
        </div>

        {/* Footer Actions */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">View Cashflow :</label>
              <div className="flex items-center gap-6">
                {['Given Period', 'Since Inception'].map(period => (
                  <label key={period} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${viewCashflowPeriod === period ? 'border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                      {viewCashflowPeriod === period && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                    </div>
                    <input 
                      type="radio" 
                      className="hidden" 
                      name="cashflowPeriod"
                      checked={viewCashflowPeriod === period}
                      onChange={() => setViewCashflowPeriod(period as any)}
                    />
                    <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">{period}</span>
                  </label>
                ))}
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                  Apply View
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  const wb = XLSX.utils.book_new();
                  const ws1 = XLSX.utils.json_to_sheet(Object.entries(givenPeriodData).map(([row, vals]) => ({ Row: row, ...vals })));
                  const ws2 = XLSX.utils.json_to_sheet(Object.entries(sinceInceptionData).map(([row, vals]) => ({ Row: row, ...vals })));
                  XLSX.utils.book_append_sheet(wb, ws1, "Given Period");
                  XLSX.utils.book_append_sheet(wb, ws2, "Since Inception");
                  XLSX.writeFile(wb, `Performance_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);
                }}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm group"
                title="Download Excel"
              >
                <FileSpreadsheet size={24} className="group-hover:scale-110 transition-transform" />
              </button>
              <button 
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm group"
                title="Download PDF"
              >
                <FilePdf size={24} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialPlan = () => {
    const plan = portfolio.financialPlan;
    const cooldownActive = isCooldownActive();
    const timeLeft = getCooldownTimeLeft();

    if (!plan && !isGeneratingPlan) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6">
            <Sparkles size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Generate Your {isConsolidated ? 'Consolidated' : 'Detailed'} Financial Plan
          </h3>
          <p className="text-slate-500 text-center max-w-md mb-8">
            Our AI engine will analyze {isConsolidated ? 'your family\'s entire consolidated' : 'your entire'} portfolio, goals, and risk profile to create a comprehensive, 
            CFP-standard financial plan following global and Indian best practices.
          </p>
          
          {cooldownActive ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                <Clock size={18} />
                <span className="text-sm font-bold">AI Cooldown: Please wait {timeLeft}s</span>
              </div>
              <button 
                onClick={() => {
                  clearCooldown();
                  handleGenerateFinancialPlan();
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Force Attempt (May Fail Again)
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGenerateFinancialPlan}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
            >
              <Zap size={20} />
              Generate Plan Now
            </button>
          )}
        </div>
      );
    }

    if (isGeneratingPlan) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-slate-200">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-indigo-100 rounded-full" />
            <div className="w-24 h-24 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600">
              <Sparkles size={32} className="animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Crafting Your Bespoke Plan...</h3>
          <div className="text-slate-500 text-center max-w-md space-y-2">
            <p className="animate-pulse">Researching latest Indian Tax Laws (Budget 2024-25)...</p>
            <p className="text-xs opacity-70">Analyzing assets, liabilities, goals, and market resilience to build your roadmap to wealth.</p>
          </div>
        </div>
      );
    }

    return (
      <DetailedFinancialPlanView 
        plan={plan} 
        portfolio={portfolio}
        isConsolidated={isConsolidated}
        onDownloadPDF={downloadFinancialPlanPDF}
        onDownloadExcel={downloadFinancialPlanExcel}
        onRefresh={handleGenerateFinancialPlan}
      />
    );
  };

  const renderAuditReport = () => {
    const defaultInvestments = portfolio.investments.filter(inv => inv.source === 'Default');
    const importedInvestments = portfolio.investments.filter(inv => inv.source === 'Imported');
    const manualInvestments = portfolio.investments.filter(inv => !inv.source || inv.source === 'Manual');

    const totalDefault = defaultInvestments.reduce((sum, inv) => sum + convertToINR(inv.currentValue, inv.currency), 0);
    const totalImported = importedInvestments.reduce((sum, inv) => sum + convertToINR(inv.currentValue, inv.currency), 0);
    const totalManual = manualInvestments.reduce((sum, inv) => sum + convertToINR(inv.currentValue, inv.currency), 0);
    const totalBank = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    const grandTotal = totalDefault + totalImported + totalManual + totalBank;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Audit Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card p-6 bg-slate-50 border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Default Data</p>
            <h4 className="text-2xl font-bold text-slate-900">{formatCurrency(totalDefault)}</h4>
            <p className="text-xs text-slate-500 mt-1">{defaultInvestments.length} Sample Assets</p>
          </div>
          <div className="premium-card p-6 bg-emerald-50 border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Imported Data</p>
            <h4 className="text-2xl font-bold text-emerald-700">{formatCurrency(totalImported)}</h4>
            <p className="text-xs text-emerald-600 mt-1">{importedInvestments.length} Uploaded Assets</p>
          </div>
          <div className="premium-card p-6 bg-indigo-50 border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2">Manual/Other</p>
            <h4 className="text-2xl font-bold text-indigo-700">{formatCurrency(totalManual)}</h4>
            <p className="text-xs text-indigo-600 mt-1">{manualInvestments.length} Manual Entries</p>
          </div>
          <div className="premium-card p-6 bg-amber-50 border-amber-100">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Bank Balance</p>
            <h4 className="text-2xl font-bold text-amber-700">{formatCurrency(totalBank)}</h4>
            <p className="text-xs text-amber-600 mt-1">{portfolio.bankAccounts.length} Accounts</p>
          </div>
        </div>

        {/* Reconciliation Alert */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Portfolio Reconciliation</h3>
              <p className="text-sm text-slate-500">Audit trail of all assets contributing to the reported {formatCurrency(grandTotal)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${totalDefault > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {totalDefault > 0 ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                {totalDefault > 0 ? 'Sample Data Present' : 'Clean Portfolio'}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Name</th>
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</th>
                  <th className="pb-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Value</th>
                  <th className="pb-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...portfolio.investments]
                  .sort((a, b) => convertToINR(b.currentValue, b.currency) - convertToINR(a.currentValue, a.currency))
                  .map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{inv.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{inv.subCategory}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-lg text-slate-600">{inv.category}</span>
                    </td>
                    <td className="py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-tighter ${
                        inv.source === 'Imported' ? 'bg-emerald-100 text-emerald-700' :
                        inv.source === 'Default' ? 'bg-amber-100 text-amber-700' :
                        'bg-indigo-100 text-indigo-700'
                      }`}>
                        {inv.source || 'Manual'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(convertToINR(inv.currentValue, inv.currency))}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-xs font-bold text-slate-400">
                        {grandTotal > 0 ? ((convertToINR(inv.currentValue, inv.currency) / grandTotal) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </td>
                  </tr>
                ))}
                {portfolio.bankAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{acc.bankName} - {acc.lastFourDigits}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{acc.accountType}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-lg text-slate-600">Cash</span>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-tighter bg-indigo-100 text-indigo-700">
                        Bank Account
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(acc.balance)}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-xs font-bold text-slate-400">
                        {grandTotal > 0 ? ((acc.balance / grandTotal) * 100).toFixed(1) : '0.0'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-100 bg-slate-50/50 font-bold">
                  <td colSpan={3} className="py-6 pl-4 text-slate-900">Consolidated Portfolio Total</td>
                  <td className="py-6 text-right text-slate-900 text-lg">{formatCurrency(grandTotal)}</td>
                  <td className="py-6 text-right text-slate-900">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {totalDefault > 0 && (
          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
            <AlertCircle className="text-amber-600 shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm font-bold text-amber-900">Action Required: Sample Data Detected</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Your portfolio currently includes <span className="font-bold">{formatCurrency(totalDefault)}</span> of sample/default data. 
                To see an accurate report of only your investments, please delete the sample assets or use the "Clear Existing Data" option during your next import.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
            <p className="text-sm text-slate-500">In-depth analysis of your investment performance</p>
          </div>
        </div>
        <button 
          onClick={handleExportAll}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <Download size={18} />
          Export All Reports
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {[
          { id: 'executive-report', label: 'Executive Report', icon: FileText },
          { id: 'ai-detailed', label: 'AI Detailed Analysis', icon: Sparkles },
          { id: 'gains', label: 'Capital Gains', icon: TrendingUp },
          { id: 'transactions', label: 'Transactions', icon: Activity },
          { id: 'performance', label: 'Executive Performance', icon: BarChart2 },
          { id: 'performance-summary', label: 'Performance Summary', icon: PieIcon },
          { id: 'tax-harvesting', label: 'Tax Loss Harvesting', icon: Zap },
          { id: 'financial-plan', label: isConsolidated ? 'Consolidated Financial Plan' : 'Detailed Financial Plan', icon: Sparkles },
          { id: 'audit', label: 'Audit & Reconciliation', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
              activeSubTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[600px]">
        {activeSubTab === 'executive-report' && renderExecutiveReport()}
        {activeSubTab === 'ai-detailed' && renderAIDetailedReport()}
        {activeSubTab === 'gains' && renderGains()}
        {activeSubTab === 'transactions' && renderTransactions()}
        {activeSubTab === 'performance' && renderPerformance()}
        {activeSubTab === 'performance-summary' && renderPerformanceSummary()}
        {activeSubTab === 'tax-harvesting' && renderTaxHarvesting()}
        {activeSubTab === 'financial-plan' && renderFinancialPlan()}
        {activeSubTab === 'audit' && renderAuditReport()}
      </div>
    </div>
  );
};

export default Reports;
