import * as XLSX from 'xlsx';
import { FinancialPlan, AssetCategory } from '../types';

const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[#*`_~]/g, '') // Remove basic markdown symbols
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
    .replace(/₹/g, 'Rs. ') // Replace Rupee symbol with Rs.
    .trim();
};

export const downloadFinancialPlanExcel = (plan: FinancialPlan) => {
  const wb = XLSX.utils.book_new();

  // 1. Executive Summary
  const summaryData = [
    { Section: 'Executive Summary', Content: stripMarkdown(plan.executiveSummary) },
    { Section: 'Last Generated', Content: new Date(plan.lastGenerated).toLocaleDateString('en-IN') }
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");

  // 2. Portfolio Scorecard
  if (plan.portfolioScorecard) {
    const scorecardData = plan.portfolioScorecard.map(item => ({
      Category: item.category,
      Score: item.score,
      Status: item.status,
      Observation: item.observation
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scorecardData), "Scorecard");
  }

  // 3. Net Worth Analysis
  if (plan.netWorthAnalysis) {
    const nwData = [
      { Metric: 'Total Assets', Value: plan.netWorthAnalysis.totalAssets },
      { Metric: 'Total Liabilities', Value: plan.netWorthAnalysis.totalLiabilities },
      { Metric: 'Net Worth', Value: plan.netWorthAnalysis.netWorth },
      { Metric: 'Analysis', Value: stripMarkdown(plan.netWorthAnalysis.analysis) }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(nwData), "Net Worth");
  }

  // 4. Goal Gap Analysis
  if (plan.goalGapAnalysis) {
    const goalData = plan.goalGapAnalysis.map(goal => ({
      'Goal Name': goal.goalName,
      'Target Amount': goal.targetAmount,
      'Current Amount': goal.currentAmount,
      'Years Remaining': goal.yearsRemaining,
      'Inflation Adj. Cost': goal.inflationAdjustedCost,
      'Gap': goal.gap,
      'Status': goal.status,
      'Recommendation': goal.recommendation
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goalData), "Goals");
  }

  // 5. Insurance Gap Analysis
  if (plan.insuranceGapAnalysis) {
    const insData = plan.insuranceGapAnalysis.map(gap => ({
      Type: gap.type,
      Required: gap.required,
      Current: gap.current,
      Gap: gap.gap,
      Analysis: stripMarkdown(gap.analysis)
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(insData), "Insurance");
  }

  // 6. Action Plan
  if (plan.actionPlan) {
    const actionData = plan.actionPlan.map(action => ({
      Step: action.step,
      Priority: action.priority,
      Timeline: action.timeline,
      Impact: action.impact
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(actionData), "Action Plan");
  }

  // 7. Cash Flow Analysis
  if (plan.cashFlowAnalysis) {
    const cfData = [
      { Metric: 'Monthly Income', Value: plan.cashFlowAnalysis.monthlyIncome },
      { Metric: 'Monthly Expenses', Value: plan.cashFlowAnalysis.monthlyExpenses },
      { Metric: 'Monthly Surplus', Value: plan.cashFlowAnalysis.surplus },
      { Metric: 'Savings Rate (%)', Value: plan.cashFlowAnalysis.savingsRate },
      { Metric: 'Analysis', Value: stripMarkdown(plan.cashFlowAnalysis.analysis) }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cfData), "Cash Flow");
  }

  // 8. Tax Optimization Strategy
  if (plan.taxOptimizationStrategy) {
    const taxData = [{ Strategy: stripMarkdown(plan.taxOptimizationStrategy) }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(taxData), "Tax Strategy");
  }

  // 9. Asset Allocation
  if (plan.assetAllocationStrategy) {
    const allocData = Object.entries(plan.assetAllocationStrategy.recommended).map(([cat, recommended]) => ({
      Category: cat,
      'Current (%)': plan.assetAllocationStrategy.current[cat as AssetCategory] || 0,
      'Recommended (%)': recommended
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allocData), "Asset Strategy");
    
    const rebalanceData = [{ Steps: stripMarkdown(plan.assetAllocationStrategy.rebalancingSteps) }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rebalanceData), "Rebalancing");
  }

  // 10. Risk Profile
  if (plan.riskProfileAnalysis) {
    const riskData = [
      { Metric: 'Risk Profile', Value: plan.riskProfileAnalysis.profile },
      { Metric: 'Risk Score', Value: plan.riskProfileAnalysis.score },
      { Metric: 'Description', Value: plan.riskProfileAnalysis.description },
      { Metric: 'Suitability', Value: plan.riskProfileAnalysis.suitability }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riskData), "Risk Profile");
  }

  // 11. Estate Planning
  if (plan.insuranceEstatePlanning) {
    const estateData = [
      { Metric: 'Security Score', Value: plan.insuranceEstatePlanning.securityScore },
      { Metric: 'Summary', Value: stripMarkdown(plan.insuranceEstatePlanning.summary) },
      { Metric: 'Missing Elements', Value: plan.insuranceEstatePlanning.missingElements?.join(', ') }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(estateData), "Estate Planning");
  }

  // 12. Future Projections
  if (plan.futureProjections) {
    const projData = plan.futureProjections.map(p => ({
      Year: p.year,
      'Projected Value': p.projectedValue,
      'Inflation Adjusted Value': p.inflationAdjustedValue
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projData), "Projections");
  }

  // 13. Stress Test
  if (plan.stressTestAnalysis) {
    const stressData = [{ Analysis: stripMarkdown(plan.stressTestAnalysis) }];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stressData), "Stress Test");
  }

  XLSX.writeFile(wb, `Wealth_Roadmap_${new Date().toISOString().split('T')[0]}.xlsx`);
};
