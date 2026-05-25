
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PortfolioState, Investment, BankAccount } from '../types';
import { formatLakhs, convertToINR } from './finance';

export const downloadPortfolioExcel = (portfolio: PortfolioState) => {
  const wb = XLSX.utils.book_new();
  
  // 1. Summary Sheet
  const totalInvested = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.investedValue || 0, inv.currency), 0);
  const totalCurrent = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.currentValue || 0, inv.currency), 0);
  const totalBankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = portfolio.liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0);
  
  const summaryData = [
    ['Wealth Architect Portfolio Summary Report', ''],
    ['Date', new Date().toLocaleDateString()],
    ['Currency', 'Consolidated in INR (₹)'],
    ['', ''],
    ['Metric', 'Value (₹)'],
    ['Total Invested Value', totalInvested],
    ['Total Current Value', totalCurrent],
    ['Total Bank Balance', totalBankBalance],
    ['Total Liabilities', totalLiabilities],
    ['Net Worth', totalCurrent + totalBankBalance - totalLiabilities],
    ['', ''],
    ['Asset Allocation', ''],
    ...Object.entries(
      portfolio.investments.reduce((acc, inv) => {
        acc[inv.category] = (acc[inv.category] || 0) + convertToINR(inv.currentValue || 0, inv.currency);
        return acc;
      }, {} as Record<string, number>)
    ).map(([cat, val]) => [cat, val])
  ];
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  
  // 2. Investments Sheet
  const investmentData = [
    ['Name', 'Category', 'Sub-Category', 'Currency', 'Quantity', 'Invested Value', 'Current Price', 'Current Value', 'Gain/Loss', 'Gain %', 'Goals / Buckets'],
    ...portfolio.investments.map(inv => {
      const goals = (inv.goalMappings || []).map(m => {
        const goal = portfolio.goals.find(g => g.id === m.goalId);
        return goal ? `${goal.name} (${m.percentage}%)` : null;
      }).filter(Boolean).join(', ');
      
      const bucket = inv.retirementBucket && inv.retirementBucket !== 'None' ? `Bucket: ${inv.retirementBucket}` : '';
      const mappings = [goals, bucket].filter(Boolean).join(' | ');

      return [
        inv.name,
        inv.category,
        inv.subCategory,
        inv.currency || 'INR',
        inv.quantity || 0,
        inv.investedValue,
        inv.price || 0,
        inv.currentValue,
        inv.currentValue - inv.investedValue,
        inv.investedValue > 0 ? ((inv.currentValue - inv.investedValue) / inv.investedValue) * 100 : 0,
        mappings
      ];
    })
  ];
  
  const wsInvestments = XLSX.utils.aoa_to_sheet(investmentData);
  XLSX.utils.book_append_sheet(wb, wsInvestments, 'Investments');
  
  // 3. Bank Accounts Sheet
  const bankData = [
    ['Bank Name', 'Account Type', 'Last 4 Digits', 'Balance'],
    ...portfolio.bankAccounts.map(acc => [
      acc.bankName,
      acc.accountType,
      acc.lastFourDigits,
      acc.balance
    ])
  ];
  
  const wsBank = XLSX.utils.aoa_to_sheet(bankData);
  XLSX.utils.book_append_sheet(wb, wsBank, 'Bank Accounts');
  
  // Save File
  XLSX.writeFile(wb, `Wealth_Architect_Portfolio_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const downloadPortfolioPDF = (portfolio: PortfolioState) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Wealth Architect', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Strategic Portfolio Report', 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);
  
  // Summary Section
  const totalInvested = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.investedValue || 0, inv.currency), 0);
  const totalCurrent = portfolio.investments.reduce((sum, inv) => sum + convertToINR(inv.currentValue || 0, inv.currency), 0);
  const totalBankBalance = portfolio.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalLiabilities = portfolio.liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0);
  const netWorth = totalCurrent + totalBankBalance - totalLiabilities;
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Consolidated Financial Position (INR)', 14, 50);
  
  autoTable(doc, {
    startY: 55,
    head: [['Metric', 'Value (₹)']],
    body: [
      ['Total Invested Value', formatLakhs(totalInvested)],
      ['Total Current Value', formatLakhs(totalCurrent)],
      ['Total Bank Balance', formatLakhs(totalBankBalance)],
      ['Total Liabilities', formatLakhs(totalLiabilities)],
      ['Net Worth', formatLakhs(netWorth)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] }, // Slate 900
    styles: { fontStyle: 'bold' }
  });
  
  // Investments Table
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Investment Portfolio Details', 14, 22);
  
  autoTable(doc, {
    startY: 30,
    head: [['Name', 'Category', 'Qty', 'Invested', 'Current', 'Returns', 'Goals/Bucket']],
    body: portfolio.investments.map(inv => {
      const goals = (inv.goalMappings || []).map(m => {
        const goal = portfolio.goals.find(g => g.id === m.goalId);
        return goal ? `${goal.name}` : null;
      }).filter(Boolean).join(', ');
      const bucket = inv.retirementBucket && inv.retirementBucket !== 'None' ? inv.retirementBucket : '';
      const mappings = [goals, bucket].filter(Boolean).join(' | ');

      const convertedInvested = convertToINR(inv.investedValue, inv.currency);
      const convertedCurrent = convertToINR(inv.currentValue, inv.currency);

      return [
        inv.name,
        inv.category,
        inv.quantity?.toLocaleString() || '-',
        formatLakhs(inv.investedValue, inv.currency),
        formatLakhs(inv.currentValue, inv.currency),
        `${(((convertedCurrent - convertedInvested) / (convertedInvested || 1)) * 100).toFixed(1)}%`,
        mappings
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 20 },
      2: { cellWidth: 15 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 15 },
      6: { cellWidth: 40 }
    }
  });
  
  // Bank Accounts Table
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(14);
  if (finalY + 40 > doc.internal.pageSize.height) doc.addPage();
  else doc.text('Bank Liquidity', 14, finalY + 15);
  
  autoTable(doc, {
    startY: finalY + 20,
    head: [['Bank Name', 'Type', 'Last 4', 'Balance (₹)']],
    body: portfolio.bankAccounts.map(acc => [
      acc.bankName,
      acc.accountType,
      acc.lastFourDigits,
      formatLakhs(acc.balance)
    ]),
    theme: 'striped',
    headStyles: { fillColor: [16, 185, 129] },
    styles: { fontSize: 9 }
  });
  
  doc.save(`Wealth_Architect_Strategic_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
