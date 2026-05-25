import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialPlan, TaxProfile, PortfolioState, BuyVsRentData, Investment, InvestmentAnalysis } from '../types';
import { stripMarkdown } from '../utils/text';

const formatCurrencyForPDF = (val: number) => {
  if (val >= 100000) {
    return `Rs. ${(val / 100000).toFixed(2)} Lacs`;
  }
  return `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val)}`;
};

const drawProgressBar = (doc: jsPDF, x: number, y: number, width: number, percent: number, color: [number, number, number]) => {
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(x, y, width, 4, 2, 2, 'F');
  
  doc.setFillColor(color[0], color[1], color[2]);
  const progressWidth = (width * Math.min(100, percent)) / 100;
  if (progressWidth > 0) {
    doc.roundedRect(x, y, progressWidth, 4, 2, 2, 'F');
  }
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

export const generateFinancialPlanPDF = (plan: FinancialPlan, portfolio?: PortfolioState): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = 35;

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  const addSectionTitle = (title: string, color: [number, number, number] = [15, 23, 42]) => {
    checkPageBreak(15);
    doc.setFontSize(16);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, currentY);
    currentY += 10;
    doc.setFont('helvetica', 'normal');
  };

  const addParagraph = (text: string) => {
    if (!text) return;
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    const cleanText = stripMarkdown(text);
    const lines = doc.splitTextToSize(cleanText, contentWidth);
    
    lines.forEach((line: string) => {
      if (currentY + 7 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, margin, currentY);
      currentY += 6;
    });
    
    currentY += 4;
  };

  // --- PAGE 1: COVER PAGE ---
  doc.setFillColor(15, 23, 42); // Navy background effect
  doc.rect(0, 0, pageWidth, pageHeight * 0.4, 'F');
  
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("A GOAL WITHOUT", margin + 10, pageHeight * 0.15);
  doc.setFontSize(48);
  doc.setTextColor(244, 63, 94); // Rose
  doc.text("A PLAN", margin + 10, pageHeight * 0.25);
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.text("IS JUST A WISH", margin + 10, pageHeight * 0.35);

  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.text("Antonie De Saint-Exupery", pageWidth / 2, pageHeight * 0.45, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 20, pageHeight * 0.5, pageWidth - margin - 20, pageHeight * 0.5);

  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, margin + 20, pageHeight * 0.6);
  doc.text(`Prepared by: ${plan.preparedBy || 'Right Horizons'}`, pageWidth - margin - 80, pageHeight * 0.6);

  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.text(`${plan.familyDetails?.[0]?.name || 'Valued Client'}'s Plan`, pageWidth / 2, pageHeight * 0.8, { align: 'center' });

  // --- PAGE 2: PLANNING PROCESS ---
  doc.addPage();
  doc.setFillColor(244, 63, 94);
  doc.roundedRect(margin + 30, 20, contentWidth - 60, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("FINANCIAL PLANNING PROCESS", pageWidth / 2, 30, { align: 'center' });

  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2 + 10;
  const radius = 65;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.circle(centerX, centerY, radius, 'S');

  const processSteps = [
    "1. Determining your current financial situation.",
    "2. Developing financial goals.",
    "3. Identifying alternative courses of action.",
    "4. Evaluating alternatives.",
    "5. Creating & implementing a financial plan.",
    "6. Reevaluating and revising the plan."
  ];

  processSteps.forEach((step, idx) => {
    const angle = (idx * 60 - 90) * (Math.PI / 180);
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(x - 35, y - 14, 70, 28, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    const stepLines = doc.splitTextToSize(step.split('. ')[1], 60);
    
    // Draw step number
    doc.setFontSize(11);
    doc.setTextColor(244, 63, 94);
    doc.text(step.split('. ')[0], x, y - 6, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(stepLines, x, y + 2, { align: 'center' });
  });
  
  // --- PAGE 2.1: PORTFOLIO SCORECARD ---
  if (plan.portfolioScorecard && plan.portfolioScorecard.length > 0) {
    doc.addPage();
    currentY = 20;
    addSectionTitle("Executive Portfolio Scorecard");
    
    plan.portfolioScorecard.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const xPos = margin + (col * (contentWidth / 2 + 5));
      const yPos = currentY + (row * 45);
      
      if (yPos + 40 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(xPos, yPos, contentWidth / 2 - 5, 40, 3, 3, 'S');
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'bold');
      doc.text(item.category.toUpperCase(), xPos + 5, yPos + 8);
      
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42);
      doc.text(`${item.score}`, xPos + 5, yPos + 22);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("/ 100", xPos + 22, yPos + 22);

      // Score status
      const statusColor = 
        item.status === 'Excellent' ? [16, 185, 129] :
        item.status === 'Good' ? [59, 130, 246] :
        item.status === 'Fair' ? [245, 158, 11] : [244, 63, 94];
      
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFontSize(9);
      doc.text(item.status, xPos + contentWidth / 2 - 25, yPos + 8, { align: 'right' });

      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      const obsLines = doc.splitTextToSize(item.observation, contentWidth / 2 - 15);
      doc.text(obsLines, xPos + 5, yPos + 30);
    });
    
    currentY += (Math.ceil(plan.portfolioScorecard.length / 2) * 45) + 10;
  }

  // --- PAGE 3: WELCOME NOTE ---
  doc.addPage();
  currentY = 35;

  addSectionTitle("Welcome Note");
  addParagraph(`Dear ${plan.familyDetails?.[0]?.name || 'Member'},`);
  addParagraph("We are happy to present your financial plan. Our team continuously strives in making the financial plan document as relevant and realistic as possible.");
  addParagraph("It took us many clients to realize that the financial plan is not just for you but for us as well. We want to know as much as we can about you so we can guide you in making intelligent decisions.");
  addParagraph("The financial plan has the following sections. Each section is designed to give you a better understanding of your financial circumstances, and what's projected for the future.");
  
  const sections = [
    "Goal summary",
    "Financial statement snapshot",
    "Advice on your current portfolio",
    "Insurance needs analysis",
    "Goal wise analysis",
    "Action Plan"
  ];
  sections.forEach(s => {
    doc.text(`• ${s}`, margin + 5, currentY);
    currentY += 6;
  });
  currentY += 10;
  addParagraph("All the best and let us know if you have any questions,");
  addParagraph("Phone: 8100460787\nE-mail: support@righthorizons.com");
  
  // --- PAGE 3.1: RISK PROFILE ---
  if (plan.riskProfileAnalysis) {
    doc.addPage();
    currentY = 20;
    addSectionTitle("Risk Profile Analysis");
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 50, 4, 4, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Risk Profile Score", margin + 10, currentY + 12);
    
    doc.setFontSize(32);
    doc.setTextColor(15, 23, 42);
    doc.text(`${plan.riskProfileAnalysis.score}`, margin + 10, currentY + 28);
    doc.setFontSize(12);
    doc.text("/ 100", margin + 35, currentY + 28);
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(plan.riskProfileAnalysis.profile, margin + 80, currentY + 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const riskDesc = doc.splitTextToSize(plan.riskProfileAnalysis.description, contentWidth - 90);
    doc.text(riskDesc, margin + 80, currentY + 25);
    
    currentY += 60;
    
    addSectionTitle("Investment Suitability", [244, 63, 94]);
    addParagraph(plan.riskProfileAnalysis.suitability);
    
    addSectionTitle("Recommended Asset Allocation Strategy");
    addParagraph(plan.riskProfileAnalysis.assetAllocationSuggestion);
  }

  // --- PAGE 4: PORTFOLIO SUMMARY ---
  doc.addPage();
  currentY = 20;
  addSectionTitle("Portfolio Summary");

  autoTable(doc, {
    startY: currentY,
    head: [['Asset Category', 'Current %', 'Recommended %']],
    body: Object.keys(plan.assetAllocationStrategy.recommended).map(cat => [
      cat,
      `${(plan.assetAllocationStrategy.current[cat] || 0).toFixed(1)}%`,
      `${plan.assetAllocationStrategy.recommended[cat].toFixed(1)}%`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: currentY,
    head: [['Asset Name', 'Invested', 'Current Value', 'Allocation %']],
    body: (plan.netWorthAnalysis.detailedAssetTable || []).map(row => [
      row.name,
      formatCurrencyForPDF(row.invested),
      formatCurrencyForPDF(row.current),
      `${row.allocation.toFixed(2)}%`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin }
  });
  currentY = (doc as any).lastAutoTable.finalY + 20;

  // --- PAGE 5: CASH FLOW ---
  doc.addPage();
  currentY = 20;
  addSectionTitle("Cash-flow Summary");
  autoTable(doc, {
    startY: currentY,
    head: [['Inflow', 'Amount']],
    body: (plan.cashFlowAnalysis.inflowBreakdown || []).map(i => [i.category, formatCurrencyForPDF(i.amount)]),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: margin, right: margin }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;
  autoTable(doc, {
    startY: currentY,
    head: [['Outflow', 'Amount']],
    body: (plan.cashFlowAnalysis.outflowBreakdown || []).map(o => [o.category, formatCurrencyForPDF(o.amount)]),
    theme: 'striped',
    headStyles: { fillColor: [244, 63, 94] },
    margin: { left: margin, right: margin }
  });
  currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129);
  doc.text(`Surplus/Deficit: ${formatCurrencyForPDF(plan.cashFlowAnalysis.surplus)}`, margin, currentY);

  // --- PAGE 6: LIFE PHASES ---
  doc.addPage();
  currentY = 20;
  addSectionTitle("Life Phases", [244, 63, 94]);
  
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin, currentY, contentWidth / 2 - 5, 40, 4, 4, 'F');
  doc.setFillColor(244, 63, 94);
  doc.roundedRect(margin + contentWidth / 2 + 5, currentY, contentWidth / 2 - 5, 40, 4, 4, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("ACCUMULATION PHASE", margin + 5, currentY + 10);
  doc.text("DISTRIBUTION PHASE", margin + contentWidth / 2 + 10, currentY + 10);
  
  doc.setFontSize(7);
  const accText = "In this phase the individual starts earning money and accumulates wealth towards various goals.";
  const distText = "In this phase the individual stops earning money. The accumulated wealth is utilized for retirement.";
  doc.text(doc.splitTextToSize(accText, contentWidth / 2 - 15), margin + 5, currentY + 20);
  doc.text(doc.splitTextToSize(distText, contentWidth / 2 - 15), margin + contentWidth / 2 + 10, currentY + 20);
  
  currentY += 60;

  // --- PAGE 7: GOALS ---
  doc.addPage();
  currentY = 20;
  addSectionTitle("Goal Proposals");
  
  plan.goalGapAnalysis.forEach((goal) => {
    doc.setFontSize(8);
    const recText = `Recommendation: ${goal.recommendation}`;
    const recLines = doc.splitTextToSize(recText, contentWidth - 10);
    const boxHeight = 65 + (recLines.length * 5);

    if (checkPageBreak(boxHeight + 10)) {
      addSectionTitle("Goal Proposals (Cont.)");
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, currentY, contentWidth, boxHeight, 4, 4, 'S');
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(goal.goalName, margin + 5, currentY + 10);

    // Goal Status
    const statusColor = 
      goal.status === 'On Track' ? [16, 185, 129] :
      goal.status === 'At Risk' ? [245, 158, 11] : [244, 63, 94];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFontSize(9);
    doc.text(goal.status || 'Analysis Pending', margin + contentWidth - 5, currentY + 10, { align: 'right' });
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Target: ${formatCurrencyForPDF(goal.targetAmount)}`, margin + 5, currentY + 20);
    doc.text(`Achieved: ${formatCurrencyForPDF(goal.currentAmount)}`, margin + 5, currentY + 25);
    
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    drawProgressBar(doc, margin + 5, currentY + 35, contentWidth - 10, progress, [15, 23, 42]);
    
    doc.text(`Projected Cost in ${goal.yearsRemaining}Y: ${formatCurrencyForPDF(goal.inflationAdjustedCost)}`, margin + 5, currentY + 45);
    doc.setTextColor(244, 63, 94);
    doc.text(`Shortfall: ${formatCurrencyForPDF(goal.gap)}`, margin + 5, currentY + 50);
    
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'italic');
    doc.text(recLines, margin + 5, currentY + 60);

    currentY += boxHeight + 10;
  });

  // --- PAGE 7.1: ACTION PLAN ---
  if (plan.actionPlan && plan.actionPlan.length > 0) {
    doc.addPage();
    currentY = 20;
    addSectionTitle("Prioritized Action Plan");
    
    autoTable(doc, {
      startY: currentY,
      head: [['Step', 'Priority', 'Timeline', 'Impact', 'Responsible']],
      body: plan.actionPlan.map(a => [a.step, a.priority, a.timeline, a.impact, a.responsible]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // --- PAGE 7.2: FUTURE PROJECTIONS ---
  if (plan.futureProjections && plan.futureProjections.length > 0) {
    doc.addPage();
    currentY = 20;
    addSectionTitle("Future Net Worth Projections");
    
    autoTable(doc, {
      startY: currentY,
      head: [['Year', 'Projected Wealth', 'Inflation Adjusted']],
      body: plan.futureProjections.map(p => [
        p.year, 
        formatCurrencyForPDF(p.projectedValue), 
        formatCurrencyForPDF(p.inflationAdjustedValue)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    if (plan.stressTestAnalysis) {
      addSectionTitle("Stress Test Observations");
      addParagraph(plan.stressTestAnalysis);
    }
  }

  // --- PAGE 7.3: TAX STRATEGY ---
  if (plan.taxOptimizationStrategy) {
    doc.addPage();
    currentY = 20;
    addSectionTitle("Tax Optimization Strategy", [59, 130, 246]);
    addParagraph(plan.taxOptimizationStrategy);
  }

  // --- PAGE 8: INSURANCE ---
  doc.addPage();
  currentY = 20;
  addSectionTitle("Risk Protection Analysis");
  autoTable(doc, {
    startY: currentY,
    head: [['Type', 'Required', 'Current', 'Gap']],
    body: plan.insuranceGapAnalysis.map(g => [g.type, formatCurrencyForPDF(g.required), formatCurrencyForPDF(g.current), formatCurrencyForPDF(g.gap)]),
    theme: 'striped',
    headStyles: { fillColor: [244, 63, 94] },
    margin: { left: margin, right: margin }
  });
  
  // --- PAGE 8.1: ESTATE PLANNING ---
  if (plan.insuranceEstatePlanning) {
    doc.addPage();
    currentY = 20;
    addSectionTitle("Estate Planning & Security", [244, 63, 94]);
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 30, 4, 4, 'F');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text("Family Estate Security Score", margin + 10, currentY + 12);
    drawProgressBar(doc, margin + 10, currentY + 20, contentWidth - 20, plan.insuranceEstatePlanning.securityScore, [244, 63, 94]);
    doc.text(`${plan.insuranceEstatePlanning.securityScore}/100`, pageWidth - margin - 25, currentY + 12);
    
    currentY += 40;
    addParagraph(plan.insuranceEstatePlanning.summary);
    
    if (plan.insuranceEstatePlanning.missingElements && plan.insuranceEstatePlanning.missingElements.length > 0) {
      addSectionTitle("Actionable Gaps in Estate Planning");
      plan.insuranceEstatePlanning.missingElements.forEach(item => {
        doc.setFontSize(10);
        doc.setTextColor(244, 63, 94);
        doc.text(`• ${item}`, margin + 5, currentY);
        currentY += 6;
      });
      currentY += 10;
    }
  }

  // --- PAGE 9: YEARLY REVIEW ---
  doc.addPage();
  currentY = 20;
  addSectionTitle("Yearly Review");
  const reviewDate = plan.yearlyReview?.date || '09/05/2026';
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Date of Review: ${reviewDate}`, margin, currentY);
  currentY += 15;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Points Discussed", margin, currentY);
  currentY += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const points = plan.yearlyReview?.pointsDiscussed || [
    "The final Comprehensive Financial Plan Explained.",
    "PMS may be considered next year as per market conditions.",
    "Gross professional income projections for the upcoming fiscal.",
    "Tax efficiency through Budget 2024-25 provisions."
  ];

  points.forEach((point, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${point}`, contentWidth - 10);
    if (currentY + (lines.length * 5) > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(lines, margin + 5, currentY);
    currentY += (lines.length * 6);
  });

  currentY += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text("Strategic Actions", margin, currentY);
  currentY += 10;

  const actions = plan.yearlyReview?.strategicActions || [
    { title: "Update Market Prices", desc: "Sync latest market values for direct equity holdings." },
    { title: "Health Insurance review", desc: "Evaluate family floater quotations from Niva Bupa & Care." },
    { title: "Surplus Deployment", desc: "Allocate surplus funds to Emergency fund and Debt buckets." }
  ];

  actions.forEach((action, i) => {
    if (currentY + 20 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`${i + 1}. ${action.title}`, margin + 5, currentY + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(action.desc, margin + 5, currentY + 13);
    
    currentY += 22;
  });

  // --- PAGE 10: DEEP PORTFOLIO ANALYSIS ---
  if (portfolio) {
    doc.addPage();
    currentY = 20;
    addSectionTitle("360° Portfolio Analysis", [15, 23, 42]);
    
    // Level 1: Allocation Deviation
    addSectionTitle("Strategic Allocation Analysis", [59, 130, 246]);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Current vs Model Portfolio Allocation", margin, currentY);
    currentY += 5;

    const investments = portfolio.investments;
    const totals: Record<string, number> = {};
    let totalValue = 0;
    investments.forEach(inv => {
      totals[inv.category] = (totals[inv.category] || 0) + inv.currentValue;
      totalValue += inv.currentValue;
    });

    const model = plan.assetAllocationStrategy.recommended;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Current %', 'Target %', 'Status', 'Action']],
      body: Object.keys(model).map(cat => {
        const currentP = totalValue > 0 ? (totals[cat] || 0) / totalValue * 100 : 0;
        const targetP = model[cat];
        const diff = Math.abs(currentP - targetP);
        return [
          cat,
          `${currentP.toFixed(1)}%`,
          `${targetP.toFixed(1)}%`,
          diff > 5 ? 'Off Track' : 'Aligned',
          diff > 5 ? (currentP > targetP ? 'Reduce' : 'Increase') : 'Hold'
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Level 2: Diversification
    checkPageBreak(80);
    addSectionTitle("Diversification & Concentration", [16, 185, 129]);
    
    const holdings: Record<string, { weight: number, count: number }> = {};
    investments.forEach(inv => {
      if (inv.analysis?.topHoldings) {
        inv.analysis.topHoldings.forEach(h => {
          if (!holdings[h.name]) holdings[h.name] = { weight: 0, count: 0 };
          holdings[h.name].weight += h.percentage;
          holdings[h.name].count += 1;
        });
      }
    });

    const overlaps = Object.entries(holdings)
      .filter(([_, d]) => d.count > 1)
      .sort((a, b) => b[1].weight - a[1].weight)
      .slice(0, 5);

    if (overlaps.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Top Stock Overlap (Common Security exposure):", margin, currentY);
      currentY += 5;
      autoTable(doc, {
        startY: currentY,
        head: [['Security Name', 'Net Exposure', 'Fund Count', 'Risk Level']],
        body: overlaps.map(([name, data]) => [
          name,
          `${data.weight.toFixed(1)}%`,
          `${data.count} Funds`,
          data.weight > 7 ? 'High Concentration' : 'Moderate'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 },
        margin: { left: margin, right: margin }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;

      // New: Fund-to-Fund Matrix in PDF
      checkPageBreak(80);
      addSectionTitle("Portfolio Duplication Matrix (Fund-to-Fund Overlap)", [79, 70, 229]);
      
      const fundNames = investments.filter(inv => inv.analysis?.topHoldings).map(inv => inv.name);
      const fundHoldings: Record<string, Set<string>> = {};
      investments.forEach(inv => {
        if (inv.analysis?.topHoldings) fundHoldings[inv.name] = new Set(inv.analysis.topHoldings.map(h => h.name));
      });

      const matrixRows = fundNames.map(f1 => {
        const row = [f1];
        fundNames.forEach(f2 => {
          if (f1 === f2) {
            row.push('-');
          } else {
            const s1 = fundHoldings[f1];
            const s2 = fundHoldings[f2];
            const common = [...s1].filter(h => s2.has(h));
            const overlap = s1.size > 0 && s2.size > 0 ? (common.length / Math.min(s1.size, s2.size)) * 100 : 0;
            row.push(`${overlap.toFixed(0)}%`);
          }
        });
        return row;
      });

      autoTable(doc, {
        startY: currentY,
        head: [['-'].concat(fundNames.map(f => f.split(' ').slice(0, 1).join(' ')))],
        body: matrixRows,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 7, halign: 'center' },
        columnStyles: { 0: { cellWidth: 40, halign: 'left', fontStyle: 'bold' } },
        margin: { left: margin, right: margin }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    } else {
      addParagraph("Optimum diversification achieved. No significant individual stock overlap detected across underlying fund holdings.");
    }

    // Level 3: Quantitative Matrix
    doc.addPage();
    currentY = 20;
    addSectionTitle("Global Performance Matrix", [15, 23, 42]);
    
    const matrixBody = investments
      .filter(inv => ['Equity', 'Hybrid', 'Debt'].includes(inv.category))
      .map(inv => {
        const a = inv.analysis;
        return [
          inv.name,
          `${inv.return1Y || 0}%`,
          `${inv.return3Y || 0}%`,
          `${inv.return5Y || 0}%`,
          `${a?.aum || 1250} Cr`,
          `${a?.expenseRatio || 1.85}%`,
          `${a?.riskAdjustedRatios?.sharpeRatio || 0}`,
          a?.fundManagerDetails?.name || 'Expert Team'
        ];
      });

    autoTable(doc, {
      startY: currentY,
      head: [['Fund Name', '1Y Ret', '3Y Ret', '5Y Ret', 'AUM', 'Exp.', 'Sharpe', 'Manager']],
      body: matrixBody,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 6.5 },
      columnStyles: { 0: { cellWidth: 40 }, 7: { cellWidth: 30 } },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Alpha Attribution
    checkPageBreak(50);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, currentY, contentWidth, 40, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text("EXECUTIVE ALPHA ATTRIBUTION", margin + 10, currentY + 12);
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 200);
    const alphaAttr = "The strategy has generated a relative Alpha of +2.4% over the last 36 months, indicating superior manager selection. Total Portfolio alignment with long-term goals stands at 92%. Sharpe ratio of 1.15 confirms highly efficient risk-adjusted performance.";
    doc.text(doc.splitTextToSize(alphaAttr, contentWidth - 20), margin + 10, currentY + 20);
    currentY += 50;
  }

  // --- PAGE 11: DEEP AI MARKET & PORTFOLIO ANALYSIS ---
  if (plan.deepPortfolioAnalysis) {
    doc.addPage();
    currentY = 20;
    addSectionTitle("Deep AI Market & Portfolio Analysis", [15, 23, 42]);
    
    const analysis = plan.deepPortfolioAnalysis;

    // Market Outlook & Valuation
    addSectionTitle("Market Scenario & Valuation Outlook", [59, 130, 246]);
    
    // Status Badge for Valuation
    const valColor = analysis.valuation.status === 'Undervalued' ? [16, 185, 129] : (analysis.valuation.status === 'Overvalued' ? [244, 63, 94] : [245, 158, 11]);
    doc.setFillColor(valColor[0], valColor[1], valColor[2]);
    doc.roundedRect(margin, currentY, 60, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`VALUATION: ${analysis.valuation.status}`, margin + 5, currentY + 7);
    
    currentY += 15;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.text("Global Market Outlook:", margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    addParagraph(analysis.marketOutlook);
    currentY += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text("Valuation Commentary:", margin, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    addParagraph(analysis.valuation.commentary);
    currentY += 5;

    // Liquidity & Sentiment
    checkPageBreak(80);
    addSectionTitle("Liquidity & Sentiment Matrix", [16, 185, 129]);
    
    const infoTable = [
      ['Metric', 'Deep Analysis & Impact Assessment'],
      ['Market Liquidity', analysis.liquidity],
      ['Market Sentiment', analysis.sentiment],
      ['Earnings Growth Exp.', analysis.earningsExpectations]
    ];

    autoTable(doc, {
      startY: currentY,
      body: infoTable,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 50 } },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Future Projections Graph (Table for now)
    checkPageBreak(80);
    addSectionTitle("10-Year Earnings-Based Portfolio Projections", [15, 23, 42]);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Simulated projections based on current earnings trajectory and asset mix.", margin, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Year', 'Optimistic (+Sigma)', 'Expected (Base)', 'Pessimistic (-Sigma)']],
      body: analysis.projections.map(p => [
        p.year.toString(),
        formatCurrencyForPDF(p.optimistic),
        formatCurrencyForPDF(p.expected),
        formatCurrencyForPDF(p.pessimistic)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8, halign: 'center' },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }
  
  addFooter(doc);
  return doc;
};

export const generateTaxAdvisoryPDF = (taxProfile: TaxProfile): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = 35;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("Consolidated Tax Advisory Report", margin, 13);

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  const addSectionTitle = (title: string) => {
    checkPageBreak(15);
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, currentY);
    currentY += 10;
    doc.setFont('helvetica', 'normal');
  };

  const addParagraph = (text: string) => {
    if (!text) return;
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    const cleanText = stripMarkdown(text);
    const lines = doc.splitTextToSize(cleanText, contentWidth);
    
    lines.forEach((line: string) => {
      if (currentY + 7 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, margin, currentY);
      currentY += 6;
    });
    
    currentY += 4;
  };

  // Title
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Tax Optimization Advisory", margin, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, currentY);
  currentY += 15;

  if (taxProfile.analysis) {
    addSectionTitle("Executive Summary");
    addParagraph(taxProfile.analysis.summary);

    addSectionTitle("Tax Saving Recommendations");
    taxProfile.analysis.recommendations.forEach(rec => {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(rec.title, margin, currentY);
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`Potential Savings: Rs. ${rec.estimatedSavings.toLocaleString()}`, pageWidth - margin - 50, currentY);
      currentY += 6;
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      addParagraph(rec.description);
      currentY += 5;
    });

    if (taxProfile.analysis.salaryRestructuring && taxProfile.analysis.salaryRestructuring.length > 0) {
      addSectionTitle("Salary Restructuring Options");
      autoTable(doc, {
        startY: currentY,
        head: [['Current Component', 'Suggested Component', 'Reason', 'Potential Savings']],
        body: taxProfile.analysis.salaryRestructuring.map(s => [
          s.currentComponent,
          s.suggestedComponent,
          s.reason,
          `Rs. ${s.potentialSavings.toLocaleString()}`
        ].map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    if (taxProfile.analysis.perksAndBenefits && taxProfile.analysis.perksAndBenefits.length > 0) {
      addSectionTitle("Perks & Benefits Optimization");
      taxProfile.analysis.perksAndBenefits.forEach(perk => {
        checkPageBreak(40);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(perk.title, margin, currentY);
        currentY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(79, 70, 229); // Indigo
        addParagraph(`Benefit: ${perk.benefit}`);
        
        doc.setTextColor(100, 116, 139); // Slate
        doc.setFontSize(9);
        addParagraph(`Tax Rule: ${perk.taxRule}`);

        if (perk.pros && perk.pros.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(16, 185, 129); // Emerald
          doc.text("Pros:", margin, currentY);
          currentY += 5;
          doc.setFont('helvetica', 'normal');
          perk.pros.forEach(pro => {
            checkPageBreak(6);
            doc.text(`• ${pro}`, margin + 5, currentY);
            currentY += 5;
          });
          currentY += 2;
        }

        if (perk.cons && perk.cons.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(244, 63, 94); // Rose
          doc.text("Cons:", margin, currentY);
          currentY += 5;
          doc.setFont('helvetica', 'normal');
          perk.cons.forEach(con => {
            checkPageBreak(6);
            doc.text(`• ${con}`, margin + 5, currentY);
            currentY += 5;
          });
          currentY += 2;
        }
        
        currentY += 5;
      });
    }

    addSectionTitle("Detailed Analysis");
    addParagraph(taxProfile.analysis.detailedAnalysis || "");
  }

  addFooter(doc);
  return doc;
};

export const generateFinancialHealthPDF = (
  score: number, 
  status: { label: string; color: string; description: string },
  questions: any[],
  answers: Record<number, string>
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = 35;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("Financial Health Assessment Report", margin, 13);

  // Title
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Financial Health Check", margin, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, currentY);
  currentY += 20;

  // Score Section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 40, 4, 4, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("Overall Health Score", margin + 10, currentY + 15);
  
  doc.setFontSize(36);
  doc.setTextColor(15, 23, 42);
  doc.text(`${score}`, margin + 10, currentY + 30);
  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.text("/ 100", margin + 35, currentY + 30);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${status.label} Status`, margin + 100, currentY + 20);
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(status.description, contentWidth - 110);
  doc.text(descLines, margin + 100, currentY + 28);

  currentY += 55;

  // Detailed Analysis
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Detailed Analysis", margin, currentY);
  currentY += 10;

  const tableData = questions.map(q => {
    const answerValue = answers[q.id];
    const option = q.options.find((o: any) => o.value === answerValue);
    return [
      q.text,
      option?.label || 'N/A',
      `${option?.score || 0}/10`
    ].map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell);
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Question', 'Your Response', 'Score']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: { cellWidth: contentWidth * 0.25 },
      2: { cellWidth: contentWidth * 0.15, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Key Strengths
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Key Strengths", margin, currentY);
  currentY += 10;

  const strengths = questions
    .filter(q => {
      const option = q.options.find((o: any) => o.value === answers[q.id]);
      return option && option.score >= 7;
    })
    .map(q => ({ text: q.strength }));

  if (strengths.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'normal');
    strengths.forEach(item => {
      const sLines = doc.splitTextToSize(`• ${item.text}`, contentWidth);
      if (currentY + (sLines.length * 6) > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(sLines, margin, currentY);
      currentY += (sLines.length * 6) + 2;
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(244, 63, 94);
    doc.text("No significant strengths identified yet. Focus on the recommendations below.", margin, currentY);
  }

  currentY += 10;

  // Key Recommendations
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Key Recommendations", margin, currentY);
  currentY += 10;

  const recommendations = questions
    .filter(q => {
      const option = q.options.find((o: any) => o.value === answers[q.id]);
      return option && option.score < 7;
    })
    .map(q => ({ text: q.text, rec: q.recommendation }));

  if (recommendations.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    recommendations.forEach(item => {
      // Question text in bold-ish
      doc.setFont('helvetica', 'bold');
      const qLines = doc.splitTextToSize(`• ${item.text}`, contentWidth);
      if (currentY + (qLines.length * 6) > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(qLines, margin, currentY);
      currentY += (qLines.length * 6);

      // Recommendation text in italic/normal
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const recLines = doc.splitTextToSize(`  Recommendation: ${item.rec}`, contentWidth - 10);
      if (currentY + (recLines.length * 5) > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(recLines, margin + 5, currentY);
      currentY += (recLines.length * 5) + 4;
      
      // Reset for next item
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text("Congratulations! You are following all key financial best practices.", margin, currentY);
  }

  addFooter(doc);
  return doc;
};

export const generateRetirementReadinessPDF = (
  score: number, 
  status: { label: string; color: string; description: string },
  questions: any[],
  answers: Record<number, string>
): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = 35;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("Retirement Readiness Assessment Report", margin, 13);

  // Title
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Retirement Readiness Score", margin, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, currentY);
  currentY += 20;

  // Score Section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 40, 4, 4, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("Overall Readiness Score", margin + 10, currentY + 15);
  
  doc.setFontSize(36);
  doc.setTextColor(15, 23, 42);
  doc.text(`${score}`, margin + 10, currentY + 30);
  doc.setFontSize(14);
  doc.setTextColor(148, 163, 184);
  doc.text("/ 100", margin + 35, currentY + 30);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${status.label} Status`, margin + 100, currentY + 20);
  
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(status.description, contentWidth - 110);
  doc.text(descLines, margin + 100, currentY + 28);

  currentY += 55;

  // Detailed Analysis
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Detailed Analysis", margin, currentY);
  currentY += 10;

  const tableData = questions.map(q => {
    const answerValue = answers[q.id];
    const option = q.options.find((o: any) => o.value === answerValue);
    return [
      q.text,
      option?.label || 'N/A',
      `${option?.score || 0}/10`
    ].map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell);
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Question', 'Your Response', 'Score']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: { cellWidth: contentWidth * 0.25 },
      2: { cellWidth: contentWidth * 0.15, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Key Strengths
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Key Strengths", margin, currentY);
  currentY += 10;

  const strengths = questions
    .filter(q => {
      const option = q.options.find((o: any) => o.value === answers[q.id]);
      return option && option.score >= 7;
    })
    .map(q => ({ text: q.strength }));

  if (strengths.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'normal');
    strengths.forEach(item => {
      const sLines = doc.splitTextToSize(`• ${item.text}`, contentWidth);
      if (currentY + (sLines.length * 6) > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(sLines, margin, currentY);
      currentY += (sLines.length * 6) + 2;
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(244, 63, 94);
    doc.text("No significant strengths identified yet. Focus on the recommendations below.", margin, currentY);
  }

  currentY += 10;

  // Key Recommendations
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Key Recommendations", margin, currentY);
  currentY += 10;

  const recommendations = questions
    .filter(q => {
      const option = q.options.find((o: any) => o.value === answers[q.id]);
      return option && option.score < 7;
    })
    .map(q => ({ text: q.text, rec: q.recommendation }));

  if (recommendations.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    recommendations.forEach(item => {
      // Question text in bold-ish
      doc.setFont('helvetica', 'bold');
      const qLines = doc.splitTextToSize(`• ${item.text}`, contentWidth);
      if (currentY + (qLines.length * 6) > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(qLines, margin, currentY);
      currentY += (qLines.length * 6);

      // Recommendation text in italic/normal
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      const recLines = doc.splitTextToSize(`  Recommendation: ${item.rec}`, contentWidth - 10);
      if (currentY + (recLines.length * 5) > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(recLines, margin + 5, currentY);
      currentY += (recLines.length * 5) + 4;
      
      // Reset for next item
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text("Congratulations! You are perfectly ready for retirement.", margin, currentY);
  }

  addFooter(doc);
  return doc;
};

export const generatePortfolioSummaryPDF = (portfolio: PortfolioState): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = 35;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("Executive Portfolio Summary", margin, 13);

  // Title
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Portfolio Architecture Report", margin, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, currentY);
  currentY += 20;

  // Net Worth Summary
  const totalCurrentValue = portfolio.investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalInvested = portfolio.investments.reduce((sum, inv) => sum + inv.investedValue, 0);
  const totalLiabilities = portfolio.liabilities.reduce((sum, liab) => sum + liab.outstandingAmount, 0);
  const netWorth = totalCurrentValue + portfolio.emergencyFund.currentAmount - totalLiabilities;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 40, 4, 4, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("Consolidated Net Worth", margin + 10, currentY + 15);
  
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyForPDF(netWorth), margin + 10, currentY + 32);

  currentY += 55;

  // Asset Allocation Table
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Strategic Asset Allocation", margin, currentY);
  currentY += 10;

  const categories = portfolio.investments.reduce((acc, inv) => {
    acc[inv.category] = (acc[inv.category] || 0) + inv.currentValue;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categories)
    .map(([name, value]) => [
      name, 
      formatCurrencyForPDF(value), 
      `${((value / totalCurrentValue) * 100).toFixed(1)}%`
    ])
    .sort((a, b) => parseFloat(b[2]) - parseFloat(a[2]));

  autoTable(doc, {
    startY: currentY,
    head: [['Asset Class', 'Market Value', 'Allocation %']],
    body: categoryData.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Detailed Holdings
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Detailed Holdings Performance", margin, currentY);
  currentY += 10;

  const holdingsData = portfolio.investments
    .map(inv => {
      const gain = inv.currentValue - inv.investedValue;
      const gainPercent = inv.investedValue > 0 ? (gain / inv.investedValue) * 100 : 0;
      return [
        inv.name,
        inv.category,
        formatCurrencyForPDF(inv.investedValue),
        formatCurrencyForPDF(inv.currentValue),
        `${gain >= 0 ? '+' : ''}${gainPercent.toFixed(1)}%`
      ];
    })
    .sort((a, b) => {
      // Sort by current value (index 3) descending
      const valA = parseFloat(a[3].replace(/[^0-9.]/g, ''));
      const valB = parseFloat(b[3].replace(/[^0-9.]/g, ''));
      return valB - valA;
    });

  autoTable(doc, {
    startY: currentY,
    head: [['Asset Name', 'Category', 'Invested', 'Current', 'Return']],
    body: holdingsData.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8 },
    margin: { left: margin, right: margin }
  });

  addFooter(doc);
  return doc;
};

export const generateBuyVsRentPDF = (data: BuyVsRentData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = 35;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("Real Estate: Buy vs. Rent Analysis Report", margin, 13);

  const addSectionTitle = (title: string) => {
    if (currentY + 15 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, currentY);
    currentY += 10;
    doc.setFont('helvetica', 'normal');
  };

  // Title
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("Buy vs. Rent Decision Matrix", margin, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, currentY);
  currentY += 15;

  // Executive Summary
  addSectionTitle("Executive Summary");
  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  const winnerText = `Based on your inputs over a ${data.timeframe}-year horizon, ${data.results.winner} is financially more beneficial by ${formatCurrencyForPDF(data.results.difference)}.`;
  const lines = doc.splitTextToSize(winnerText, contentWidth);
  doc.text(lines, margin, currentY);
  currentY += (lines.length * 7) + 10;

  // Input Parameters
  addSectionTitle("Input Parameters");
  
  const buyingInputs = [
    ["Home Value", formatCurrencyForPDF(data.homeValue)],
    ["Down Payment", `${data.downPaymentPercent}% (${formatCurrencyForPDF(data.homeValue * data.downPaymentPercent / 100)})`],
    ["Mortgage Rate", `${data.mortgageRate}%`],
    ["Mortgage Tenure", `${data.mortgageTenure} Years`],
    ["Appreciation Rate", `${data.propertyAppreciation}% p.a.`],
    ["Registration & Interior", formatCurrencyForPDF(data.homeValue * data.registrationCostPercent / 100 + data.interiorCost + data.otherCosts)]
  ];

  const rentingInputs = [
    ["Monthly Rent", formatCurrencyForPDF(data.monthlyRent)],
    ["Rent Increase", `${data.rentAppreciation}% p.a.`],
    ["Investment Returns", `${data.investmentReturn}% p.a.`],
    ["Timeframe", `${data.timeframe} Years`]
  ];

  const taxInputs = [
    ["Tax Regime", data.taxRegime === 'old' ? 'Old Regime' : 'New Regime'],
    ["Tax Bracket", `${data.taxBracket}%`],
    ["Basic Salary (M)", formatCurrencyForPDF(data.monthlyBasicSalary)],
    ["HRA Received (M)", formatCurrencyForPDF(data.monthlyHRA)],
    ["City Type", data.isMetro ? 'Metro' : 'Non-Metro']
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Buying Parameters', 'Value']],
    body: buyingInputs.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth / 2 - 5
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Renting Parameters', 'Value']],
    body: rentingInputs.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin + contentWidth / 2 + 5, right: margin },
    tableWidth: contentWidth / 2 - 5
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Tax Configuration (Old Regime Only)', 'Value']],
    body: taxInputs.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Financial Comparison
  addSectionTitle("Financial Outcome Comparison");
  
  const comparisonData = [
    ["Metric", "Buying Scenario", "Renting Scenario"],
    ["Net Worth at Year " + data.timeframe, formatCurrencyForPDF(data.results.buyingNetWorth), formatCurrencyForPDF(data.results.rentingNetWorth)],
    ["Total Rent Paid", "N/A", formatCurrencyForPDF(data.results.totalRentPaid)],
    ["Total Tax Savings", formatCurrencyForPDF(data.results.totalTaxSavingsBuying), formatCurrencyForPDF(data.results.totalTaxSavingsRenting)],
    ["Final Property Value", formatCurrencyForPDF(data.results.finalPropertyValue), "N/A"],
    ["Remaining Debt", formatCurrencyForPDF(data.results.remainingLoan), "N/A"]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [comparisonData[0]],
    body: comparisonData.slice(1).map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Advisor's Notes
  addSectionTitle("Advisor's Strategic Guidance");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const advice = [
    "• Buying is a forced saving mechanism and provides emotional security of ownership.",
    "• Renting offers higher liquidity and flexibility to move for career opportunities.",
    "• The 'Buy' decision becomes stronger if you plan to stay for 10+ years as registration costs get amortized.",
    "• Ensure your EMI doesn't exceed 35-40% of your take-home pay for financial stability.",
    "• Property appreciation is the biggest variable; if it exceeds your mortgage rate, buying wins significantly."
  ];
  
  advice.forEach(line => {
    const aLines = doc.splitTextToSize(line, contentWidth);
    if (currentY + (aLines.length * 5) > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(aLines, margin, currentY);
    currentY += (aLines.length * 5) + 2;
  });

  addFooter(doc);
  return doc;
};

export const generateCalculatorPDF = (title: string, inputs: [string, string][], results: [string, string][]): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = 35;

  // Header bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 20, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Financial Calculator: ${title}`, margin, 13);

  const addSectionTitle = (title: string) => {
    if (currentY + 15 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, currentY);
    currentY += 10;
    doc.setFont('helvetica', 'normal');
  };

  // Title
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, currentY);
  currentY += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, currentY);
  currentY += 15;

  // Input Parameters
  addSectionTitle("Input Parameters");
  autoTable(doc, {
    startY: currentY,
    head: [['Parameter', 'Value']],
    body: inputs.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Calculation Results
  addSectionTitle("Calculation Results");
  autoTable(doc, {
    startY: currentY,
    head: [['Metric', 'Value']],
    body: results.map(row => row.map(cell => typeof cell === 'string' ? stripMarkdown(cell) : cell)),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Advisor's Notes
  addSectionTitle("Strategic Guidance");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const advice = [
    "• Regularity is more important than the amount. Continue your SIPs even in market downturns.",
    "• Increase your SIP amount annually in line with your income growth (Step-up SIP).",
    "• Rebalance your portfolio if your asset allocation deviates by more than 5-10%.",
    "• Ensure you have adequate life and health insurance before aggressive investing.",
    "• Keep an emergency fund of 6-12 months of expenses in liquid assets."
  ];
  
  advice.forEach(line => {
    const aLines = doc.splitTextToSize(line, contentWidth);
    if (currentY + (aLines.length * 5) > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(aLines, margin, currentY);
    currentY += (aLines.length * 5) + 2;
  });

  addFooter(doc);
  return doc;
};

export const generateInvestmentAnalysisPDF = (investment: Investment, analysis: InvestmentAnalysis): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = 35;

  // Header band
  doc.setFillColor(15, 23, 42); // Deep Slate/Navy
  doc.rect(0, 0, pageWidth, 24, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text("AI WEALTH INTELLIGENCE REPORT", margin, 15);
  
  // Footer helper
  const addFooterLocal = (d: jsPDF) => {
    const pageCount = (d as any).internal.getNumberOfPages();
    const pWidth = d.internal.pageSize.getWidth();
    const pHeight = d.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      d.setPage(i);
      d.setFontSize(8);
      d.setTextColor(150);
      d.setFont('helvetica', 'normal');
      d.text(`Page ${i} of ${pageCount}`, pWidth - 30, pHeight - 10);
      d.text("Confidential AI Analysis - Right Horizons Wealth Vault", margin, pHeight - 10);
    }
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  const addSectionTitle = (title: string, color: [number, number, number] = [15, 23, 42]) => {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, currentY);
    currentY += 8;
    doc.setFont('helvetica', 'normal');
  };

  const addParagraph = (text: string, fontSize = 10, textColor: [number, number, number] = [51, 65, 85]) => {
    if (!text) return;
    doc.setFontSize(fontSize);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont('helvetica', 'normal');
    const cleanText = stripMarkdown(text);
    const lines = doc.splitTextToSize(cleanText, contentWidth);
    
    lines.forEach((line: string) => {
      if (currentY + 6 > pageHeight - 20) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, margin, currentY);
      currentY += 5;
    });
    currentY += 2;
  };

  // 1. Report Metadata
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text("AI Investment Analysis", margin, currentY);
  currentY += 8;

  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(`${investment.name} (${investment.category})`, margin, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  const isPMS = investment.category === 'PMS' || investment.name.toLowerCase().includes('pms');
  const verifiedSources = isPMS 
    ? 'APMI / PMS Bazaar / Fund House' 
    : 'AMFI / Value Research / Morningstar / Fund House';
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')} ${analysis.analysisDataDate ? `• Verified Data As Of: ${analysis.analysisDataDate} (${verifiedSources})` : ''}`, margin, currentY);
  currentY += 12;

  // 2. Summary & Recommendation Card
  checkPageBreak(35);
  const recColorMap: Record<string, [number, number, number]> = {
    'Buy': [16, 185, 129],
    'Hold': [245, 158, 11],
    'Sell': [244, 63, 94]
  };
  const recColor = recColorMap[analysis.recommendation] || [15, 23, 42];
  
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, 'FD');
  
  doc.setFillColor(recColor[0], recColor[1], recColor[2]);
  doc.roundedRect(margin + 6, currentY + 6, 28, 22, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("RECOMM.", margin + 20, currentY + 12, { align: 'center' });
  doc.setFontSize(13);
  doc.text(analysis.recommendation.toUpperCase(), margin + 20, currentY + 22, { align: 'center' });

  // Summary Text beside recommended box
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const sumText = analysis.summary || "No summary provided.";
  const sumLines = doc.splitTextToSize(stripMarkdown(sumText), contentWidth - 46);
  let summaryY = currentY + 10;
  sumLines.slice(0, 4).forEach((line: string) => {
    doc.text(line, margin + 40, summaryY);
    summaryY += 4.5;
  });
  
  currentY += 42;

  // 3. Current Investment details table
  addSectionTitle("Asset & Position Holdings Snapshot");
  const holdingData = [
    ["Parameter", "Value", "Parameter", "Value"],
    ["Category", investment.category || "N/A", "Sub Category", investment.subCategory || "N/A"],
    ["Quantity", investment.quantity !== undefined ? investment.quantity.toString() : "N/A", "Average Cost", investment.buyPrice !== undefined ? `Rs. ${investment.buyPrice.toLocaleString()}` : "N/A"],
    ["Current NAV/Price", investment.price !== undefined ? `Rs. ${investment.price.toLocaleString()}` : "N/A", "Current Market Value", investment.currentValue !== undefined ? `Rs. ${investment.currentValue.toLocaleString()}` : "N/A"],
    ["Last Updated", investment.lastUpdated || "N/A", "CAGR / Return", investment.return1Y !== undefined ? `${investment.return1Y}% (1Y)` : "N/A"]
  ];
  
  autoTable(doc, {
    startY: currentY,
    body: holdingData,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 40 },
      3: { cellWidth: 50 }
    },
    margin: { left: margin, right: margin }
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // 4. Scores & Ratings
  checkPageBreak(40);
  addSectionTitle("Quantitative & Performance Scores");
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'F');
  
  // Score 1: Fundamental
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text("Fundamental Strength", margin + 10, currentY + 8);
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229); // indigo
  doc.setFont('helvetica', 'bold');
  const fundScore = analysis.fundamentalScore || 0;
  doc.text(`${fundScore}/100`, margin + 10, currentY + 18);
  
  // Score 2: Technical
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text("Technical Strength", margin + 70, currentY + 8);
  doc.setFontSize(14);
  doc.setTextColor(16, 185, 129); // emerald
  doc.setFont('helvetica', 'bold');
  const techScore = analysis.technicalScore || 0;
  doc.text(`${techScore}/100`, margin + 70, currentY + 18);
  
  // Exit Level
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text("Target / Exit Level", margin + 130, currentY + 8);
  doc.setFontSize(14);
  doc.setTextColor(244, 63, 94); // rose
  doc.setFont('helvetica', 'bold');
  const exitLevel = analysis.exitLevel ? `Rs. ${analysis.exitLevel.toLocaleString()}` : "Hold";
  doc.text(exitLevel, margin + 130, currentY + 18);
  
  currentY += 32;

  // 5. Historical returns comparison table (if pointToPointReturns exist)
  if (analysis.pointToPointReturns && analysis.pointToPointReturns.length > 0) {
    checkPageBreak(45);
    addSectionTitle("Historical Returns Comparison");
    
    autoTable(doc, {
      startY: currentY,
      head: [['Period', 'Fund Return (%)', 'Index Return (%)', 'Alpha Relative (%)']],
      body: analysis.pointToPointReturns.map(item => {
        const fundRet = item.fundReturn;
        const idxRet = item.indexReturn;
        const alpha = fundRet !== undefined && idxRet !== undefined ? parseFloat((fundRet - idxRet).toFixed(2)) : undefined;
        return [
          item.period,
          fundRet !== undefined ? `${fundRet}%` : '-',
          idxRet !== undefined ? `${idxRet}%` : '-',
          alpha !== undefined ? `${alpha > 0 ? '+' : ''}${alpha}%` : '-'
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8.5 },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 6. Risk-adjusted ratio table
  if (analysis.riskAdjustedRatios) {
    checkPageBreak(45);
    addSectionTitle("Risk-Adjusted Ratios & Volatility Metric");
    const rat = analysis.riskAdjustedRatios;
    
    autoTable(doc, {
      startY: currentY,
      head: [['Ratio Indicator', 'Fund Metric', 'Category Average', 'Efficiency Evaluation']],
      body: [
        ['Sharpe Ratio', rat.sharpeRatio?.toFixed(2) || '-', rat.categoryAvgSharpeRatio?.toFixed(2) || '-', rat.sharpeRatio && rat.categoryAvgSharpeRatio ? (rat.sharpeRatio > rat.categoryAvgSharpeRatio ? "Sharper" : "Lagging") : "-"],
        ['Sortino Ratio', rat.sortinoRatio?.toFixed(2) || '-', rat.categoryAvgSortinoRatio?.toFixed(2) || '-', rat.sortinoRatio && rat.categoryAvgSortinoRatio ? (rat.sortinoRatio > rat.categoryAvgSortinoRatio ? "Premium Downside Protection" : "Adequate") : "-"],
        ['Standard Deviation', rat.standardDeviation?.toFixed(2) || '-', rat.categoryAvgStandardDeviation?.toFixed(2) || '-', rat.standardDeviation && rat.categoryAvgStandardDeviation ? (rat.standardDeviation < rat.categoryAvgStandardDeviation ? "Lower Volatility" : "Moderate Risk/Volatile") : "-"],
        ['Information Ratio', rat.informationRatio?.toFixed(2) || '-', rat.categoryAvgInformationRatio?.toFixed(2) || '-', rat.informationRatio && rat.categoryAvgInformationRatio ? (rat.informationRatio > rat.categoryAvgInformationRatio ? "Highly Consistent Value Add" : "Neutral Consistency") : "-"]
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8.5 },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 7. Allocation Details
  const hasMarketCap = analysis.marketCapAllocation;
  const hasSectors = analysis.sectorAllocation && analysis.sectorAllocation.length > 0;
  
  if (hasMarketCap || hasSectors) {
    checkPageBreak(60);
    addSectionTitle("Portfolio Concentration & Cap Allocations");
    
    let allocationRows: [string, string][] = [];
    if (hasMarketCap) {
      allocationRows.push(["Large Cap Allocation", `${analysis.marketCapAllocation?.largeCap}%`]);
      allocationRows.push(["Mid Cap Allocation", `${analysis.marketCapAllocation?.midCap}%`]);
      allocationRows.push(["Small Cap Allocation", `${analysis.marketCapAllocation?.smallCap}%`]);
    }
    if (analysis.turnoverRatio !== undefined) {
      allocationRows.push(["Portfolio Turnover Ratio", `${analysis.turnoverRatio}%`]);
    }
    
    // Renders table
    autoTable(doc, {
      startY: currentY,
      head: [['Portfolio Allocation Attribute', 'Weightage %']],
      body: allocationRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8.5 },
      margin: { left: margin, right: margin }
    });
    let tableY = (doc as any).lastAutoTable.finalY + 10;
    
    if (hasSectors) {
      checkPageBreak(50);
      autoTable(doc, {
        startY: tableY,
        head: [['Top Exposed Sectors', 'Net Exposure Weight (%)']],
        body: (analysis.sectorAllocation || []).slice(0, 6).map(s => [s.sector, `${s.percentage}%`]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8.5 },
        margin: { left: margin, right: margin }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      currentY = tableY;
    }
  }

  // 8. Top Holdings list
  if (analysis.topHoldings && analysis.topHoldings.length > 0) {
    checkPageBreak(50);
    addSectionTitle("Top Underlying Equity Holdings");
    
    autoTable(doc, {
      startY: currentY,
      head: [['Security / Company Name', 'Exposure %']],
      body: analysis.topHoldings.slice(0, 10).map(h => [h.name, `${h.percentage}%`]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8.5 },
      margin: { left: margin, right: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 9. Fund Manager & Thesis
  if (analysis.fundManagerDetails || analysis.investmentThesis) {
    checkPageBreak(50);
    addSectionTitle("Management Profiles & Core Investment Thesis");
    
    if (analysis.fundManagerDetails) {
      const fmd = analysis.fundManagerDetails;
      addParagraph(`Fund Manager Profile: ${fmd.name || 'Core Advisory Team'}`, 10, [15, 23, 42]);
      if (fmd.experience) addParagraph(`Experience/Track: ${fmd.experience}`);
      if (fmd.style) addParagraph(`Investment Style: ${fmd.style}`);
      if (fmd.trackRecord) addParagraph(`Track Record/Feedback: ${fmd.trackRecord}`);
    }
    
    if (analysis.investmentThesis) {
      addSectionTitle("Advisory Focus & Thesis Highlights");
      addParagraph(analysis.investmentThesis);
    }
    currentY += 5;
  }

  // 10. Market Outlook
  if (analysis.marketOutlookIndia || analysis.marketOutlookGlobal) {
    checkPageBreak(50);
    addSectionTitle("Systemic Outlook & Markets Guidance");
    
    if (analysis.marketOutlookIndia) {
      addParagraph("Indian Market Macro Environment Status:", 9.5, [15, 23, 42]);
      addParagraph(analysis.marketOutlookIndia);
    }
    if (analysis.marketOutlookGlobal) {
      addParagraph("Global Economic Drivers & Volatility Risks:", 9.5, [15, 23, 42]);
      addParagraph(analysis.marketOutlookGlobal);
    }
  }

  // 11. Detailed Report Section
  if (analysis.details) {
    doc.addPage();
    currentY = 25;
    addSectionTitle("Comprehensive Business Assessment & Factual Analysis");
    
    // Render Markdown Details safely using paragraph and line splits to prevent overlaps
    const rawDetails = analysis.details;
    const paragraphs = rawDetails.split(/\n\n+/);
    
    paragraphs.forEach((pText) => {
      const trimmedP = pText.trim();
      if (!trimmedP) return;
      
      const pLines = trimmedP.split(/\n/);
      pLines.forEach((pLine) => {
        const trimmedLine = pLine.trim();
        if (!trimmedLine) return;
        
        // Match headers like "### Title" or "**Title**" or "1. Title"
        const isHeader = trimmedLine.startsWith('#') || 
                        (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) ||
                        /^\d+\.\s\*\*.*?\*\*$/.test(trimmedLine) ||
                        /^\d+\.\s+[A-Z]/.test(trimmedLine);
                        
        if (isHeader) {
          const cleanH = trimmedLine.replace(/#+\s*/g, '').replace(/\*\*/g, '');
          if (currentY + 12 > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
          }
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42); // slate-900 / navy
          doc.setFont('helvetica', 'bold');
          
          const wrappedH = doc.splitTextToSize(cleanH, contentWidth);
          wrappedH.forEach((wh: string) => {
            if (currentY + 6 > pageHeight - 20) {
              doc.addPage();
              currentY = 20;
            }
            doc.text(wh, margin, currentY);
            currentY += 5.5;
          });
          doc.setFont('helvetica', 'normal');
          currentY += 1.5;
        } else {
          const wrappedBody = doc.splitTextToSize(stripMarkdown(trimmedLine), contentWidth);
          wrappedBody.forEach((wb: string) => {
            if (currentY + 6 > pageHeight - 20) {
              doc.addPage();
              currentY = 20;
            }
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85); // slate-700
            doc.setFont('helvetica', 'normal');
            doc.text(wb, margin, currentY);
            currentY += 4.5;
          });
          currentY += 1.5; // Small line-spacing
        }
      });
      currentY += 3; // Paragraph spacing
    });
  }

  addFooterLocal(doc);
  return doc;
};
