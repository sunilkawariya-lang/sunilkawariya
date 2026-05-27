
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export type AssetCategory = 'Equity' | 'Debt' | 'Gold' | 'Hybrid' | 'Alternative' | 'Cash' | 'Real Estate' | 'ESOP' | 'PMS' | 'AIF' | 'Bonds' | 'Fixed Deposit' | 'Debenture' | 'PF' | 'PPF' | 'NPS' | 'International Fund' | 'Global Stock';

export interface AssetComposition {
  debt: number;
  equity: number;
  globalEquity: number;
  gold: number;
  realEstate: number;
  other: number;
}

export type RiskProfileType = 'Conservative' | 'Moderate' | 'Aggressive' | 'Very Aggressive' | 'Not Assessed';

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Other';
  isDependent: boolean;
  age?: number;
  occupation?: string;
  retirementAge?: number;
}

export interface RiskProfile {
  memberId: string;
  type: RiskProfileType;
  score: number; // 0-100
  lastAssessed: string;
}

export interface EmergencyFund {
  memberId: string;
  targetMonths: number;
  currentAmount: number;
  monthlyExpense: number;
}

export interface Nominee {
  id: string;
  name: string;
  relationship: string;
  share: number; // Percentage
}

export interface EstatePlanning {
  memberId: string;
  willStatus: 'Not Started' | 'Drafted' | 'Registered';
  nomineesUpdated: boolean;
  insuranceCover: number;
  digitalAssetsVault: boolean;
  nominees: Nominee[];
  trustCreated?: boolean;
  powerOfAttorney?: boolean;
  medicalDirective?: boolean;
  willDraft?: string;
}

export type InsuranceType = 'Term' | 'Health' | 'Motor' | 'ULIP' | 'Endowment' | 'MoneyBack' | 'Critical Illness';

export interface InsuranceAnalysis {
  pros: string[];
  cons: string[];
  suitability: string;
  lastGenerated: string;
  keyFeatures?: string[];
  limitations?: string[];
  waitingPeriods?: string[];
  exclusions?: string[];
  riskFactors?: string[];
  noClaimConditions?: string;
  payoutDetails?: string;
  surrenderValueDetails?: string;
}

export interface InsurancePolicy {
  id: string;
  memberId: string;
  name: string;
  type: InsuranceType;
  provider: string;
  sumAssured: number;
  premium: number;
  premiumFrequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
  startDate: string;
  expiryDate: string;
  nominee: string;
  status: 'Active' | 'Lapsed' | 'Matured' | 'Surrendered';
  benefits?: string[];
  // For non-term plans
  maturityDate?: string;
  maturityAmount?: number;
  premiumPayingTerm?: number; // in years
  policyTerm?: number; // in years
  bonusAmount?: number; // cumulative projected bonus amount
  cashflows?: { date: string; amount: number; description: string }[];
  analysis?: InsuranceAnalysis;
}

export interface InvestmentAnalysis {
  recommendation: 'Buy' | 'Hold' | 'Exit';
  status?: 'Green' | 'Yellow' | 'Red';
  summary: string;
  currency?: string; // 'INR' or 'USD'
  fundamentalScore?: number;
  technicalScore?: number;
  exitLevel?: number;
  riskRatio?: string;
  returnRatio?: string;
  details: string;
  lastGenerated: string;
  analysisDataDate?: string;
  // Mutual Fund specific
  fundHousePedigree?: string;
  fundManagerProfile?: string;
  upsideCaptureRatio?: number;
  downsideCaptureRatio?: number;
  turnoverRatio?: number;
  // Performance vs Index
  indexComparison?: {
    indexName: string;
    investmentReturn: number;
    indexReturn: number;
    period: string;
  }[];
  // Rolling Returns
  rollingReturn3Y?: number;
  rollingReturn5Y?: number;
  indexRollingReturn3Y?: number;
  indexRollingReturn5Y?: number;
  rollingAlpha3Y?: number;
  rollingAlpha5Y?: number;
  // Risk Levels
  riskLevel3Y?: 'Low' | 'Moderate' | 'High';
  riskLevel5Y?: 'Low' | 'Moderate' | 'High';
  // Market Outlook
  marketOutlookIndia?: string;
  marketOutlookGlobal?: string;
  // SIP Specific
  sipPerformance?: {
    totalInvested: number;
    currentValue: number;
    xirr: number;
    sipDuration: string;
  };
  // Detailed Mutual Fund Metrics
  pointToPointReturns?: {
    period: string;
    fundReturn: number;
    indexReturn: number;
  }[];
  rollingReturns?: {
    period: string;
    fundReturn: number;
    indexReturn: number;
  }[];
  riskAdjustedRatios?: {
    standardDeviation?: number;
    sharpeRatio?: number;
    sortinoRatio?: number;
    informationRatio?: number;
    upsideCapture?: number;
    downsideCapture?: number;
    beta?: number;
    treynor?: number;
    categoryAvgStandardDeviation?: number;
    categoryAvgSharpeRatio?: number;
    categoryAvgSortinoRatio?: number;
    categoryAvgInformationRatio?: number;
    categoryAvgUpsideCapture?: number;
    categoryAvgDownsideCapture?: number;
  };
  maxDrawdown?: number;
  categoryMaxDrawdown?: number;
  expenseRatio?: number;
  categoryExpenseRatio?: number;
  marketCapAllocation?: {
    largeCap: number;
    midCap: number;
    smallCap: number;
  };
  rankWithinCategory?: {
    year: number;
    rank: number;
    totalFunds: number;
  }[];
  aum?: number;
  fundManagerDetails?: {
    name: string;
    experience: string;
    trackRecord: string;
    style: string;
  };
  investmentThesis?: string;
  portfolioTurnoverRatio?: number;
  sectorAllocation?: {
    sector: string;
    percentage: number;
  }[];
  topHoldings?: {
    name: string;
    percentage: number;
  }[];
}

export interface Purchase {
  id: string;
  date: string;
  quantity: number;
  price: number;
}

export interface GoalMapping {
  goalId: string;
  percentage: number; // 0-100
  amount?: number; // Calculated based on percentage and investment's current value
}

export type RetirementBucket = 'Short-term' | 'Medium-term' | 'Long-term' | 'None';

export interface ESOPVesting {
  id: string;
  date: string;
  quantity: number;
  status: 'Vested' | 'Unvested' | 'Exercised';
}

export interface Investment {
  id: string;
  memberId: string;
  name: string;
  category: AssetCategory;
  subCategory: string; // e.g., 'Large Cap', 'PPF', 'SGB'
  currentValue: number;
  investedValue: number;
  lastUpdated: string;
  sector?: string; // e.g., 'IT', 'Banking', 'Pharma'
  symbol?: string; // For Stocks (e.g., RELIANCE.NS)
  schemeCode?: string; // For Mutual Funds (e.g., 120503)
  quantity?: number;
  price?: number; // Current Price
  buyPrice?: number; // Average Purchase Price
  purchases?: Purchase[];
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  isSIP?: boolean;
  sipAmount?: number;
  sipStartDate?: string;
  sipNextDate?: string;
  analysis?: InvestmentAnalysis;
  goalMappings?: GoalMapping[];
  retirementBucket?: RetirementBucket;
  aum?: number;
  expenseRatio?: number;
  // ESOP specific fields
  grantDate?: string;
  exercisePrice?: number;
  vestingSchedule?: ESOPVesting[];
  totalOptions?: number;
  maturityDate?: string;
  currency?: string; // 'INR' or 'USD'
  entityName?: string;
  composition?: AssetComposition;
  // Cashflow fields
  swpAmount?: number;
  swpFrequency?: 'Monthly' | 'Quarterly' | 'Yearly';
  swpNextDate?: string;
  interestRate?: number;
  interestFrequency?: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'On Maturity';
  maturityAmount?: number;
  fundHouse?: string;
  fundManager?: string;
  navDate?: string;
  needsClarification?: boolean;
  clarificationMessage?: string;
  source?: 'Manual' | 'Imported' | 'Default';
  // Performance and Audit fields
  dayChange?: number;
  dayChangePercent?: number;
  auditInfo?: {
    status: 'Verified' | 'Suspicious' | 'Unverified';
    message?: string;
    lastChecked: string;
    source: string;
  };
}

export interface GoalAnalysis {
  recommendation: string;
  rationale: string;
  performanceRatios: {
    sharpe?: number;
    sortino?: number;
    alpha?: number;
    beta?: number;
  };
  riskMetrics: {
    standardDeviation?: number;
    maxDrawdown?: number;
    valueAtRisk?: number;
  };
  marketContext: {
    peRatio?: number;
    pbRatio?: number;
    dividendYield?: number;
    bondYield?: number;
    marketValuation: string;
    globalSituation: string;
    indiaSituation: string;
  };
  quantitativeFactors: string[];
  qualitativeFactors: string[];
  lastGenerated: string;
}

export interface Goal {
  id: string;
  memberId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'High' | 'Medium' | 'Low';
  inflationAdjusted?: boolean;
  expectedInflation?: number; // e.g., 6 for 6%
  startDate?: string;
  expectedReturn?: number; // e.g., 12 for 12%
  monthlyContribution?: number;
  category?: 'Education' | 'Retirement' | 'Marriage' | 'Home' | 'Car' | 'Vacation' | 'Other';
  multiYearFunding?: { year: number; amount: number }[];
  analysis?: GoalAnalysis;
  retirementAge?: number;
  currentAge?: number;
  lifeExpectancy?: number;
  annualExpenses?: number;
  returnAfterRetirement?: number;
}

export type LiabilityType = 'Home Loan' | 'Car Loan' | 'Personal Loan' | 'Education Loan' | 'Credit Card' | 'Other';

export interface Liability {
  id: string;
  memberId: string;
  name: string;
  type: LiabilityType;
  totalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  emi: number;
  startDate: string;
  endDate: string;
  lender: string;
}

export interface Expense {
  id: string;
  memberId: string;
  category: string;
  amount: number;
  date: string;
  isRecurring: boolean;
}

export interface TaxDeduction {
  id: string;
  section: string; // e.g., '80D', '80G', '80E'
  amount: number;
  description: string;
}

export interface SalaryRestructuring {
  currentComponent: string;
  suggestedComponent: string;
  reason: string;
  potentialSavings: number;
}

export interface TaxAnalysis {
  summary: string;
  recommendations: {
    title: string;
    description: string;
    estimatedSavings: number;
  }[];
  perksAndBenefits: {
    title: string;
    benefit: string;
    taxRule: string;
    pros?: string[];
    cons?: string[];
  }[];
  salaryRestructuring?: SalaryRestructuring[];
  detailedAnalysis?: string;
  detailedReportUrl?: string;
  lastGenerated: string;
}

export interface TaxDocument {
  id: string;
  name: string;
  type: 'Salary Slip' | 'Form 130' | 'Investment Proof' | 'Other';
  uploadDate: string;
  fileData?: string; // base64
  mimeType?: string;
  extractedData?: any;
}

export interface CapitalGain {
  id: string;
  assetType: 'Equity' | 'Debt' | 'Real Estate' | 'Gold' | 'Other';
  gainType: 'Short Term' | 'Long Term';
  amount: number;
  description: string;
}

export interface TaxProfile {
  memberId: string;
  annualIncome: number;
  basicSalary: number;
  actualHRA: number;
  rentPaid: number;
  cityType: 'Metro' | 'Non-Metro';
  investments80C: number;
  nps80CCD: number;
  npsEmployer80CCD2: number;
  medicalInsurance80D: number;
  standardDeduction: number;
  otherDeductions: TaxDeduction[];
  capitalGains: CapitalGain[];
  totalTaxPayable: number;
  hraExemption?: number;
  analysis?: TaxAnalysis;
  documents?: TaxDocument[];
  regime?: 'Old' | 'New';
  // Salary Restructuring Components
  lta?: number;
  mealCoupons?: number;
  mobileReimbursement?: number;
  uniformAllowance?: number;
  booksGadgetsAllowance?: number;
  companyLease?: number;
  carLease?: number;
  fuelMaintenance?: number;
  driverSalary?: number;
  professionalPursuit?: number;
  helperAllowance?: number;
  giftVouchers?: number;
  gymWellness?: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  prevClose: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  analysis?: {
    summary: string;
    valuation: 'Undervalued' | 'Fair Value' | 'Overvalued';
    peRatio?: number;
    pbRatio?: number;
    dividendYield?: number;
    technicalTrend: 'Bullish' | 'Neutral' | 'Bearish';
    keyLevels?: { support: number; resistance: number };
  };
}

export interface MarketScenarioAnalysis {
  scenarioName: string;
  probability: number; // 0-100
  economicIndicators: {
    indicator: string;
    currentValue: string;
    trend: 'Rising' | 'Falling' | 'Stable';
    impact: 'Positive' | 'Negative' | 'Neutral';
  }[];
  marketSentiment: {
    overall: string;
    equity: string;
    debt: string;
    gold: string;
    realEstate: string;
  };
  sectorOutlook: {
    sector: string;
    rating: 'Overweight' | 'Neutral' | 'Underweight';
    rationale: string;
  }[];
  rebalancingRecommendations: {
    action: string;
    rationale: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  memberId: string;
  investmentId: string;
  investmentName: string;
  type: 'Buy' | 'Sell' | 'Dividend' | 'Interest';
  date: string;
  quantity: number;
  price: number;
  amount: number;
  category: AssetCategory;
  needsClarification?: boolean;
  clarificationMessage?: string;
}

export interface HistoricalSnapshot {
  date: string;
  totalValue: number;
  investedValue: number;
  categoryValues: Partial<Record<AssetCategory, number>>;
}

export interface Income {
  id: string;
  memberId: string;
  source: string; // 'Salary' | 'Bonus' | 'Rental' | 'Investment' | 'Other'
  amount: number;
  date: string;
  isRecurring: boolean;
  frequency: 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'One-time';
}

export interface BankAccount {
  id: string;
  memberId: string;
  accountHolderName: string;
  bankName: string;
  lastFourDigits: string;
  balance: number;
  accountType: 'Savings' | 'Current' | 'Salary' | 'Fixed Deposit' | 'Recurring Deposit';
  lastUpdated: string;
  accountNumber?: string;
  ifscCode?: string;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  category: string;
  reference?: string;
  tags?: string[];
}

export interface CreditCard {
  id: string;
  memberId: string;
  cardName: string;
  bankName: string;
  lastFourDigits: string;
  creditLimit: number;
  availableLimit: number;
  currentOutstanding: number;
  statementDate: number; // Day of month (1-31)
  dueDate: number; // Day of month (1-31)
  lastUpdated: string;
  cardNumber?: string;
  rewardPoints?: number;
}

export interface CreditCardTransaction {
  id: string;
  creditCardId: string;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  category: string;
  reference?: string;
  tags?: string[];
}

export interface DetailedGoalMapping {
  goalName: string;
  equityRequirement: number;
  debtRequirement: number;
  monthlySip: number;
  lumpsum: number;
  achievedPercentage: number;
  allocatedAssets: { name: string; value: number }[];
  plannerNotes: string[];
}

export interface FinancialPlan {
  executiveSummary: string; // The "Welcome Note" and general summary
  welcomeNote?: string;
  lastGenerated: string;
  preparedBy?: string;
  
  familyDetails: {
    name: string;
    age: number;
    relationship: string;
    panSuffix?: string;
    email?: string;
    kycStatus: 'Verified' | 'Not Verified' | 'In Progress';
  }[];

  portfolioScorecard: {
    category: string;
    score: number; // 0-100
    status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    observation: string;
  }[];
  
  netWorthAnalysis: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    analysis: string;
    assetBreakdown: Record<string, number>;
    liabilityBreakdown: Record<string, number>;
    detailedAssetTable: { name: string; invested: number; current: number; allocation: number }[];
  };

  cashFlowAnalysis: {
    monthlyIncome: number;
    monthlyExpenses: number;
    surplus: number;
    savingsRate: number;
    analysis: string;
    inflowBreakdown: { category: string; amount: number }[];
    outflowBreakdown: { category: string; amount: number }[];
  };

  riskProfileAnalysis: {
    profile: string;
    score: number; // Mapping current 0-100 to a broader range if needed (PDF shows 320/600)
    description: string;
    suitability: string;
    assetAllocationSuggestion: string;
    questionnaireSnapshot?: { question: string; answer: string }[];
  };

  goalGapAnalysis: {
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    gap: number;
    status: 'On Track' | 'At Risk' | 'Critical';
    recommendation: string;
    inflationAdjustedCost: number;
    yearsRemaining: number;
    mapping?: DetailedGoalMapping;
  }[];

  assetAllocationStrategy: {
    current: Record<string, number>;
    recommended: Record<string, number>;
    rebalancingSteps: string;
    glidePath?: { year: number; equity: number; debt: number; other: number }[];
  };

  insuranceGapAnalysis: {
    type: string; // 'Life', 'Health'
    required: number;
    current: number;
    gap: number;
    analysis: string;
    needBasedAnalysis?: { label: string; amount: number }[];
    suggestedPolicies?: { name: string; sumAssured: number; premium: number; status: string }[];
  }[];

  taxOptimizationStrategy: string;
  
  insuranceEstatePlanning: {
    summary: string;
    securityScore: number; // 0-100
    missingElements: string[];
    willChecklist?: { task: string; status: boolean }[];
  };

  actionPlan: {
    step: string;
    priority: 'High' | 'Medium' | 'Low';
    timeline: string;
    impact: string;
    responsible: 'Client' | 'Advisor' | 'Both';
  }[];

  futureProjections: {
    year: number;
    projectedValue: number;
    inflationAdjustedValue: number;
  }[];
  stressTestAnalysis: string;
  yearlyReview?: {
    date: string;
    pointsDiscussed: string[];
    strategicActions: { title: string; desc: string }[];
  };

  deepPortfolioAnalysis?: {
    marketOutlook: string;
    valuation: {
      status: 'Overvalued' | 'Fair' | 'Undervalued';
      commentary: string;
    };
    liquidity: string;
    sentiment: string;
    earningsExpectations: string;
    projections: {
      year: number;
      optimistic: number;
      expected: number;
      pessimistic: number;
    }[];
  };
}

export interface IPSPolicy {
  memberId: string;
  scopeAndPurpose: {
    context: string;
    investor: string;
    structure: string;
  };
  governance: {
    responsibilities: string;
    reviewProcess: string;
    reportingRequirements: string;
  };
  objectives: {
    investmentObjective: string;
    returnRequirements: string;
    riskTolerance: string;
    investmentPhilosophy: string;
    constraints: {
      liquidity: string;
      tax: string;
      legal: string;
      timeHorizon: string;
      uniqueCircumstances: string;
    };
  };
  assetAllocationPolicy: {
    targetEquity: number;
    targetDebt: number;
    targetGold: number;
    targetCash: number;
    rebalancingThresholds: string;
    permittedAssetClasses: string[];
    prohibitedAssetClasses: string[];
  };
  riskManagement: {
    performanceMeasurement: string;
    benchmarks: string;
    rebalancingPolicy: string;
  };
  lastUpdated: string;
  aiReview?: string;
}

export interface MarketIndexChange {
  name: string;
  currentValue: number;
  change: number;
  changePercent: number;
}

export interface SectorChange {
  name: string;
  changePercent: number;
  trend: 'Up' | 'Down' | 'Neutral';
  topStock?: string;
}

export interface AssetClassTrend {
  assetClass: AssetCategory;
  trend: string;
  outlook: 'Bullish' | 'Bearish' | 'Neutral';
  performance: string;
}

export interface ProductUpdate {
  category: 'MF' | 'PMS' | 'AIF' | 'Bonds';
  title: string;
  description: string;
  impact: string;
}

export interface MarketNews {
  title: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
  description: string;
  category: 'Global' | 'India' | 'Company' | 'Personal Finance';
}

export interface MarketEvent {
  title: string;
  date: string;
  description: string;
  type: 'Rule Change' | 'Economic Event' | 'Corporate Action';
}

export interface MarketReport {
  id: string;
  period: 'Weekly' | 'Monthly';
  date: string;
  summary: string;
  indexChanges: MarketIndexChange[];
  sectorChanges: SectorChange[];
  globalNews: MarketNews[];
  indiaNews: MarketNews[];
  majorEvents: MarketEvent[];
  assetTrends: AssetClassTrend[];
  productUpdates: ProductUpdate[];
  inspirationalStory: {
    title: string;
    story: string;
    lesson: string;
  };
  lastUpdated?: number;
}

export interface SafeDocument {
  id: string;
  memberId: string;
  name: string;
  category: 'Identity' | 'Property' | 'Investment' | 'Insurance' | 'Tax' | 'Other';
  uploadDate: string;
  expiryDate?: string;
  fileUrl?: string;
  fileData?: string;
  mimeType?: string;
  notes?: string;
}

export interface MeetingDiscussion {
  id: string;
  date: string;
  title: string;
  summary: string;
  actionItems: string[];
  attendees: string[];
  nextMeetingDate?: string;
}

export interface WalletTransaction {
  id: string;
  type: 'Credit' | 'Debit';
  amount: number;
  date: string;
  description: string;
  status: 'Completed' | 'Pending' | 'Failed';
  offerCode?: string;
}

export interface Wallet {
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface PortfolioState {
  familyMembers: FamilyMember[];
  selectedMemberId: string | 'family';
  investments: Investment[];
  wallet?: Wallet;
  walletTransactions?: WalletTransaction[];
  goals: Goal[];
  expenses: Expense[];
  incomes: Income[];
  bankAccounts: BankAccount[];
  bankTransactions: BankTransaction[];
  creditCards: CreditCard[];
  creditCardTransactions: CreditCardTransaction[];
  transactions: Transaction[];
  historicalSnapshots: HistoricalSnapshot[];
  taxProfiles: TaxProfile[];
  riskProfiles: RiskProfile[];
  emergencyFunds: EmergencyFund[];
  estatePlannings: EstatePlanning[];
  ipsPolicies: IPSPolicy[];
  insurances: InsurancePolicy[];
  marketIndices: MarketIndex[];
  liabilities: Liability[];
  safeDocuments: SafeDocument[];
  meetingDiscussions: MeetingDiscussion[];
  // Backoffice / Admin fields
  userActivities?: UserActivity[];
  securityLogs?: SecurityLog[];
  complianceChecks?: ComplianceCheck[];
  lastMarketRefresh?: string;
  // Singular fields for the current/filtered view
  taxProfile: TaxProfile;
  riskProfile: RiskProfile;
  emergencyFund: EmergencyFund;
  estatePlanning: EstatePlanning;
  ipsPolicy: IPSPolicy;
  financialPlan?: FinancialPlan;
  financialPlans?: Record<string, FinancialPlan>;
  profileCompleted?: boolean;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: string;
  ipAddress?: string;
  device?: string;
}

export interface SecurityLog {
  id: string;
  level: 'Info' | 'Warning' | 'Critical';
  event: string;
  source: string;
  timestamp: string;
  status: 'Resolved' | 'Pending' | 'Investigating';
}

export interface ComplianceCheck {
  id: string;
  category: 'SEBI' | 'Data Privacy' | 'KYC' | 'Tax';
  title: string;
  status: 'Compliant' | 'Non-Compliant' | 'Pending Review';
  lastChecked: string;
  nextReview: string;
  description: string;
}

export interface BuyVsRentData {
  homeValue: number;
  downPaymentPercent: number;
  registrationCostPercent: number;
  interiorCost: number;
  otherCosts: number;
  mortgageRate: number;
  mortgageTenure: number;
  propertyTaxMonthly: number;
  maintenanceMonthly: number;
  propertyAppreciation: number;
  monthlyRent: number;
  rentAppreciation: number;
  investmentReturn: number;
  timeframe: number;
  taxRegime: 'old' | 'new';
  taxBracket: number;
  monthlyBasicSalary: number;
  monthlyHRA: number;
  isMetro: boolean;
  results: {
    initialOutlay: number;
    emi: number;
    totalEmiPaid: number;
    totalTaxesPaid: number;
    totalMaintenancePaid: number;
    finalPropertyValue: number;
    remainingLoan: number;
    buyingNetWorth: number;
    rentingNetWorth: number;
    totalRentPaid: number;
    totalTaxSavingsBuying: number;
    totalTaxSavingsRenting: number;
    difference: number;
    winner: string;
    chartData: any[];
  };
}
