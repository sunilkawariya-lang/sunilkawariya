import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { Investment, InvestmentAnalysis, InsurancePolicy, InsuranceAnalysis, TaxProfile, TaxAnalysis, PortfolioState, FinancialPlan, Goal, EstatePlanning, MarketScenarioAnalysis } from "../types";
import { isCooldownActive, setCooldown, isQuotaExceededError, isMonthlyCapError, sleep, callAIWithRetry, isRetryableError } from "../lib/quotaManager";
import { safeStringify, safeParse } from "../lib/errorHandler";

const getAI = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY!;
  return new GoogleGenAI({ apiKey });
};

export async function generateGoalAnalysis(goal: Goal, portfolio: PortfolioState): Promise<any> {
  if (isCooldownActive()) {
    return {
      recommendation: "AI Analysis is currently in cooldown due to rate limits.",
      rationale: "The AI service is currently unavailable. Please try again in a few minutes.",
      performanceRatios: {},
      riskMetrics: {},
      marketContext: { marketValuation: "N/A", globalSituation: "N/A", indiaSituation: "N/A" },
      strategicRecommendation: {
        action: "Wait for cooldown",
        details: "API rate limit reached.",
        quantitativeFactors: [],
        qualitativeFactors: []
      }
    };
  }
  const ai = getAI();
  
  // Calculate required amounts for context
  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const monthsLeft = Math.max(0, (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth()));
  const yearsLeft = Math.max(0, monthsLeft / 12);
  const inflationAdjustedTarget = goal.inflationAdjusted 
    ? goal.targetAmount * Math.pow(1 + (goal.expectedInflation || 6) / 100, yearsLeft)
    : goal.targetAmount;
  
  const monthlyRate = (goal.expectedReturn || 12) / 12 / 100;
  let recommendedMonthly = 0;
  let requiredLumpsum = 0;
  
  if (monthsLeft > 0) {
    const fvOfCurrent = goal.currentAmount * Math.pow(1 + monthlyRate, monthsLeft);
    const shortfallToCover = inflationAdjustedTarget - fvOfCurrent;
    if (shortfallToCover > 0) {
      if (monthlyRate > 0) {
        recommendedMonthly = (shortfallToCover * monthlyRate) / (Math.pow(1 + monthlyRate, monthsLeft) - 1);
      } else {
        recommendedMonthly = shortfallToCover / monthsLeft;
      }
      requiredLumpsum = shortfallToCover / Math.pow(1 + monthlyRate, monthsLeft);
    }
  }

  const prompt = `
    Analyze this financial goal and provide a strategic recommendation.
    
    Goal: ${goal.name}
    Target: Rs. ${inflationAdjustedTarget.toFixed(0)} (Inflation Adjusted)
    Current: Rs. ${goal.currentAmount}
    Timeline: ${monthsLeft} months
    Priority: ${goal.priority}
    
    Requirements:
    - Monthly SIP needed: Rs. ${recommendedMonthly.toFixed(0)}
    - Lumpsum needed: Rs. ${requiredLumpsum.toFixed(0)}
    
    Investor Context:
    - Risk Profile: ${portfolio.riskProfile.type}
    - Asset Allocation: Equity ${portfolio.ipsPolicy.assetAllocationPolicy.targetEquity}%, Debt ${portfolio.ipsPolicy.assetAllocationPolicy.targetDebt}%
    
    Market Context:
    ${portfolio.marketIndices.slice(0, 3).map(idx => `- ${idx.name}: PE ${idx.analysis?.peRatio || 'N/A'}, Valuation: ${idx.analysis?.valuation || 'N/A'}`).join('\n')}
    
    Provide a CONCISE JSON response. Keep the rationale under 200 words.
    {
      "recommendation": "Short action-oriented summary",
      "rationale": "Strategic reasoning",
      "performanceRatios": { "sharpe": number, "sortino": number, "alpha": number, "beta": number },
      "riskMetrics": { "standardDeviation": number, "maxDrawdown": number, "valueAtRisk": number },
      "marketContext": {
        "peRatio": number, "pbRatio": number, "dividendYield": number, "bondYield": number,
        "marketValuation": "string", "globalSituation": "string", "indiaSituation": "string"
      },
      "quantitativeFactors": ["list"],
      "qualitativeFactors": ["list"]
    }
  `;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            rationale: { type: Type.STRING },
            performanceRatios: {
              type: Type.OBJECT,
              properties: {
                sharpe: { type: Type.NUMBER },
                sortino: { type: Type.NUMBER },
                alpha: { type: Type.NUMBER },
                beta: { type: Type.NUMBER }
              }
            },
            riskMetrics: {
              type: Type.OBJECT,
              properties: {
                standardDeviation: { type: Type.NUMBER },
                maxDrawdown: { type: Type.NUMBER },
                valueAtRisk: { type: Type.NUMBER }
              }
            },
            marketContext: {
              type: Type.OBJECT,
              properties: {
                peRatio: { type: Type.NUMBER },
                pbRatio: { type: Type.NUMBER },
                dividendYield: { type: Type.NUMBER },
                bondYield: { type: Type.NUMBER },
                marketValuation: { type: Type.STRING },
                globalSituation: { type: Type.STRING },
                indiaSituation: { type: Type.STRING }
              }
            },
            quantitativeFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            qualitativeFactors: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }));

    return safeParse(response.text || '{}');
  } catch (error: any) {
    console.error("Failed to generate goal analysis:", error);
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
      throw error;
    }
    
    const isHighDemand = isRetryableError(error);
    
    return {
      recommendation: isHighDemand ? "AI service is currently under high demand." : "Unable to generate analysis at this time.",
      rationale: isHighDemand ? "The AI server is experiencing temporary spikes. Your request was retried multiple times but failed. Please try again in a minute." : "The AI response was malformed or service error occurred.",
      performanceRatios: {},
      riskMetrics: {},
      marketContext: { marketValuation: "N/A", globalSituation: "N/A", indiaSituation: "N/A" },
      strategicRecommendation: {
        action: "Review manually",
        details: isHighDemand ? "High demand spike." : "AI analysis failed.",
        quantitativeFactors: [],
        qualitativeFactors: []
      }
    };
  }
}

export async function generateWillDraft(
  portfolio: PortfolioState,
  estatePlanning: EstatePlanning,
  executor: { name: string; relationship: string; address: string },
  bequests: { asset: string; beneficiary: string; percentage: number }[],
  additionalInfo?: {
    guardians?: { name: string; relationship: string }[];
    digitalAssets?: string;
    funeralInstructions?: string;
    witnesses?: { name: string; address: string }[];
  }
): Promise<string> {
  if (isCooldownActive()) {
    return "Error: AI generation is currently in cooldown due to rate limits. Please try again in a few minutes.";
  }
  const ai = getAI();
  
  // Use the memberId from estatePlanning to find the correct family member
  const member = portfolio.familyMembers.find(m => m.id === estatePlanning.memberId) || 
                 portfolio.familyMembers.find(m => m.id === portfolio.selectedMemberId) || 
                 portfolio.familyMembers[0];
  
  if (!member) {
    return "Error: No family member found for this estate plan.";
  }

  const assetsSummary = portfolio.investments.map(inv => 
    `- ${inv.name} (${inv.category}): Rs. ${inv.currentValue.toLocaleString()}`
  ).join('\n');

  const bequestsList = bequests.map(b => `- ${b.asset}: ${b.percentage}% to ${b.beneficiary}`).join('\n');

  const prompt = `
    As an expert legal consultant specializing in Indian Succession Law (Indian Succession Act, 1925), draft a comprehensive and legally sound Last Will and Testament for the following individual.
    
    TESTATOR DETAILS:
    - Name: ${member.name}
    - Age: ${member.age || 'Adult'}
    - Address: [Testator's Current Address]
    
    EXECUTOR DETAILS:
    - Name: ${executor.name}
    - Relationship: ${executor.relationship}
    - Address: ${executor.address}
    
    ASSETS FOR CONTEXT:
    ${assetsSummary}
    
    SPECIFIC BEQUESTS:
    ${bequestsList}
    
    ${additionalInfo?.guardians?.length ? `GUARDIANSHIP FOR MINORS:
    ${additionalInfo.guardians.map(g => `- ${g.name} (${g.relationship})`).join('\n')}` : ''}
    
    ${additionalInfo?.digitalAssets ? `DIGITAL ASSETS INSTRUCTIONS:
    ${additionalInfo.digitalAssets}` : ''}
    
    ${additionalInfo?.funeralInstructions ? `FUNERAL & BURIAL INSTRUCTIONS:
    ${additionalInfo.funeralInstructions}` : ''}
    
    RESIDUARY ESTATE:
    - Any assets not specifically mentioned should go to the primary beneficiaries in equal proportion.
    
    LEGAL REQUIREMENTS & CLAUSES TO INCLUDE (Based on Indian Law):
    1. DECLARATION: Clear statement that this is the last will and that the testator is of sound mind and acting without coercion.
    2. REVOCATION: Explicitly revoke all previous wills and codicils.
    3. APPOINTMENT OF EXECUTOR: Formally appoint the executor and define their powers.
    4. GUARDIANSHIP CLAUSE: If guardians are provided, appoint them for minor children.
    5. SIMULTANEOUS DEATH CLAUSE: Define distribution if the testator and primary beneficiary pass away together.
    6. NO-CONTEST (IN TERROREM) CLAUSE: State that any beneficiary contesting the will shall forfeit their share.
    7. DIGITAL ASSETS CLAUSE: Include instructions for digital legacy (social media, crypto, emails).
    8. ASSET DESCRIPTION: Clearly identify the assets being bequeathed.
    9. ATTESTATION CLAUSE: Provide space for two witnesses as required by Section 63 of the Indian Succession Act.
    10. NO STAMP PAPER REQUIREMENT: Mention that a Will does not require stamp paper or registration to be valid in India.
    11. TESTIMONIUM: The concluding part where the testator signs.
    
    STRUCTURE:
    - Title: LAST WILL AND TESTAMENT
    - Preamble & Declaration
    - Appointment of Executor
    - Appointment of Guardians (if applicable)
    - Specific Bequests
    - Digital Assets & Intellectual Property
    - Residuary Clause
    - Simultaneous Death & No-Contest Clauses
    - Funeral Expenses & Debts
    - Testimonium (Signature of Testator)
    - Attestation (Witness 1 & Witness 2 details with signature lines)
    
    Tone: Formal, legal, and clear. Use Markdown for formatting.
    Ensure the language is precise to avoid future litigation.
    
    DISCLAIMER: Add a clear disclaimer at the end stating that this is an AI-generated draft and should be reviewed by a qualified legal professional before execution.
  `;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        maxOutputTokens: 4096,
      }
    }));
    return response.text || "Failed to generate will draft.";
  } catch (error: any) {
    console.error("Error generating will draft:", error);
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
      throw error;
    }
    if (isRetryableError(error)) {
      return "The AI service is currently experiencing high demand. Please wait a minute and try again.";
    }
    return "Error generating will draft. Please try again later.";
  }
}

export async function generateInvestmentAnalysis(investment: Investment): Promise<InvestmentAnalysis> {
  if (isCooldownActive()) {
    return {
      recommendation: 'Hold',
      summary: 'AI Analysis is currently in cooldown due to rate limits.',
      details: 'Please try again in 30 minutes.',
      lastGenerated: new Date().toISOString()
    } as any;
  }
  const ai = getAI();
  const prompt = `
    Analyze the following investment and provide a detailed recommendation (Buy, Hold, or Exit).
    
    Investment Name: ${investment.name}
    Category: ${investment.category}
    Sub-Category: ${investment.subCategory}
    Current Value: ${investment.currentValue}
    Invested Value: ${investment.investedValue}
    1Y Return: ${investment.return1Y}%
    3Y Return: ${investment.return3Y}%
    5Y Return: ${investment.return5Y}%

    IMPORTANT GOAL: Ground your analysis in the most recent real-time data available on the web.
    For PMS (Portfolio Management Services) such as "ASK Indian Entrepreneur" or others, you MUST query the Association of Portfolio Managers in India (APMI) official portal (apmiindia.org), PMS Bazaar (pmsbazaar.com), and the fund house's website (e.g. askfinancials.com) to provide updated current performance statistics, AUM, and holdings.
    For Mutual Funds, verify against the Association of Mutual Funds in India (AMFI at amfiindia.com), the respective fund house portals, Value Research (valueresearchonline.com), and Morningstar (morningstar.in).
    For other investments, search their official websites or trusted financial tracking sources.

    Please research and provide a COMPREHENSIVE analysis:
    1. Point to Point return vs respective index for 1 Yr, 3 Yr, 5 Yr, 7 Yr and 10 Yr.
    2. 3 Yr and 5 Yr Rolling Return with Index comparison.
    3. Risk Adjusted ratio of fund compare to category on standard deviation, sharpe ratio, sortino, Information ratio, Upside and downside capture over 3 year.
    4. Max drawdown compare to category.
    5. Expense ratio compare to category.
    6. Market cap allocation (Large, Mid, Small %).
    7. Rank within category by year for last 5 years.
    8. AUM (Assets Under Management).
    9. Fund Manager track record, history, and style details.
    10. Analysis of holdings to understand investment thesis, including sector allocation and top 10 holdings with percentages.
    11. Portfolio turnover ratio to understand portfolio level churning.
    12. India and Global Market Overall View.
    13. Categorize as 'Green' (Outperforming/Strong), 'Yellow' (Neutral/Watch), or 'Red' (Underperforming/High Risk).
    14. Currency used for financials (INR or USD). Use USD for International/Global assets.
    15. Determine and return the actual date or reporting period that the retrieved factual financial data represents (the "as of" date or compiled data date, e.g., "April 2026" or "May 2026") in the "analysisDataDate" field. Do NOT just return today's date unless the retrieved data is indeed from today.

    IMPORTANT: In the 'details' field, provide a very long, detailed Markdown report (at least 800 words) covering:
    - Business model/Fund strategy
    - Competitive landscape/Peer comparison
    - Key risks and growth drivers
    - Technical price action analysis
    - Final verdict with specific entry/exit levels

    Format the response as a JSON object matching the InvestmentAnalysis interface.
  `;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendation: { type: Type.STRING, enum: ['Buy', 'Hold', 'Exit'] },
          status: { type: Type.STRING, enum: ['Green', 'Yellow', 'Red'] },
          summary: { type: Type.STRING },
          currency: { type: Type.STRING, enum: ['INR', 'USD'] },
          analysisDataDate: { type: Type.STRING },
          fundamentalScore: { type: Type.NUMBER },
          technicalScore: { type: Type.NUMBER },
          exitLevel: { type: Type.NUMBER },
          riskRatio: { type: Type.STRING },
          returnRatio: { type: Type.STRING },
          details: { type: Type.STRING },
          fundHousePedigree: { type: Type.STRING },
          fundManagerProfile: { type: Type.STRING },
          upsideCaptureRatio: { type: Type.NUMBER },
          downsideCaptureRatio: { type: Type.NUMBER },
          turnoverRatio: { type: Type.NUMBER },
          rollingReturn3Y: { type: Type.NUMBER },
          rollingReturn5Y: { type: Type.NUMBER },
          indexRollingReturn3Y: { type: Type.NUMBER },
          indexRollingReturn5Y: { type: Type.NUMBER },
          rollingAlpha3Y: { type: Type.NUMBER },
          rollingAlpha5Y: { type: Type.NUMBER },
          riskLevel3Y: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'] },
          riskLevel5Y: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'] },
          marketOutlookIndia: { type: Type.STRING },
          marketOutlookGlobal: { type: Type.STRING },
          pointToPointReturns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                period: { type: Type.STRING },
                fundReturn: { type: Type.NUMBER },
                indexReturn: { type: Type.NUMBER }
              },
              required: ['period', 'fundReturn', 'indexReturn']
            }
          },
          rollingReturns: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                period: { type: Type.STRING },
                fundReturn: { type: Type.NUMBER },
                indexReturn: { type: Type.NUMBER }
              },
              required: ['period', 'fundReturn', 'indexReturn']
            }
          },
          riskAdjustedRatios: {
            type: Type.OBJECT,
            properties: {
              standardDeviation: { type: Type.NUMBER },
              sharpeRatio: { type: Type.NUMBER },
              sortinoRatio: { type: Type.NUMBER },
              informationRatio: { type: Type.NUMBER },
              upsideCapture: { type: Type.NUMBER },
              downsideCapture: { type: Type.NUMBER },
              categoryAvgStandardDeviation: { type: Type.NUMBER },
              categoryAvgSharpeRatio: { type: Type.NUMBER },
              categoryAvgSortinoRatio: { type: Type.NUMBER },
              categoryAvgInformationRatio: { type: Type.NUMBER },
              categoryAvgUpsideCapture: { type: Type.NUMBER },
              categoryAvgDownsideCapture: { type: Type.NUMBER }
            }
          },
          maxDrawdown: { type: Type.NUMBER },
          categoryMaxDrawdown: { type: Type.NUMBER },
          expenseRatio: { type: Type.NUMBER },
          categoryExpenseRatio: { type: Type.NUMBER },
          marketCapAllocation: {
            type: Type.OBJECT,
            properties: {
              largeCap: { type: Type.NUMBER },
              midCap: { type: Type.NUMBER },
              smallCap: { type: Type.NUMBER }
            }
          },
          rankWithinCategory: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.NUMBER },
                rank: { type: Type.NUMBER },
                totalFunds: { type: Type.NUMBER }
              },
              required: ['year', 'rank', 'totalFunds']
            }
          },
          aum: { type: Type.NUMBER },
          fundManagerDetails: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              experience: { type: Type.STRING },
              trackRecord: { type: Type.STRING },
              style: { type: Type.STRING }
            }
          },
          investmentThesis: { type: Type.STRING },
          portfolioTurnoverRatio: { type: Type.NUMBER },
          sectorAllocation: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sector: { type: Type.STRING },
                percentage: { type: Type.NUMBER }
              },
              required: ['sector', 'percentage']
            }
          },
          topHoldings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                percentage: { type: Type.NUMBER }
              },
              required: ['name', 'percentage']
            }
          },
          indexComparison: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                indexName: { type: Type.STRING },
                investmentReturn: { type: Type.NUMBER },
                indexReturn: { type: Type.NUMBER },
                period: { type: Type.STRING },
              },
              required: ['indexName', 'investmentReturn', 'indexReturn', 'period']
            }
          },
          sipPerformance: {
            type: Type.OBJECT,
            properties: {
              totalInvested: { type: Type.NUMBER },
              currentValue: { type: Type.NUMBER },
              xirr: { type: Type.NUMBER },
              sipDuration: { type: Type.STRING },
            },
            required: ['totalInvested', 'currentValue', 'xirr', 'sipDuration']
          }
        },
        required: [
          'recommendation', 
          'summary', 
          'details', 
          'status'
        ]
      }
    }
  }));

  const result = safeParse(response.text || '{}');
  return {
    ...result,
    lastGenerated: new Date().toISOString()
  };
  } catch (error: any) {
    console.error("Failed to generate investment analysis:", error);
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
      throw error;
    }
    const isHighDemand = isRetryableError(error);
    return {
      recommendation: 'Hold',
      summary: isHighDemand ? 'AI Service is currently under high demand.' : 'Analysis unavailable due to technical error.',
      details: isHighDemand ? 'The AI server is experiencing temporary spikes. Please try again in a minute.' : 'Please try again later.',
      lastGenerated: new Date().toISOString()
    } as any;
  }
}

export async function generateSIPPortfolioAnalysis(sipInvestments: Investment[]): Promise<any> {
  if (isCooldownActive()) {
    return {
      recommendation: 'Hold',
      summary: 'AI Analysis is currently in cooldown due to rate limits.',
      details: 'Please try again in 30 minutes.',
      lastGenerated: new Date().toISOString()
    };
  }
  const ai = getAI();
  const sipData = sipInvestments.map(inv => ({
    name: inv.name,
    category: inv.category,
    subCategory: inv.subCategory,
    sipAmount: inv.sipAmount,
    sipStartDate: inv.sipStartDate,
    currentValue: inv.currentValue,
    investedValue: inv.investedValue,
    return1Y: inv.return1Y,
    return3Y: inv.return3Y,
    return5Y: inv.return5Y
  }));

  const prompt = `
    Analyze the following SIP investment portfolio and provide a consolidated recommendation (Hold, Exit, or Add More) based on risk and return analysis.
    
    SIP Portfolio Data:
    ${safeStringify(sipData, 2)}

    Format the response as a JSON object with:
    - recommendation: 'Hold' | 'Exit' | 'Add More'
    - summary: string
    - assetAllocationAnalysis: string
    - subCategoryAnalysis: string
    - benchmarkComparison: { indexName: string, portfolioReturn: number, indexReturn: number, alpha: number }[]
    - fundRecommendations: { fundName: string, action: 'Hold' | 'Exit' | 'Add More', reasoning: string }[]
    - riskReturnAnalysis: string
    - details: string (markdown)
  `;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendation: { type: Type.STRING, enum: ['Hold', 'Exit', 'Add More'] },
          summary: { type: Type.STRING },
          assetAllocationAnalysis: { type: Type.STRING },
          subCategoryAnalysis: { type: Type.STRING },
          benchmarkComparison: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                indexName: { type: Type.STRING },
                portfolioReturn: { type: Type.NUMBER },
                indexReturn: { type: Type.NUMBER },
                alpha: { type: Type.NUMBER },
              },
              required: ['indexName', 'portfolioReturn', 'indexReturn', 'alpha']
            }
          },
          fundRecommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                fundName: { type: Type.STRING },
                action: { type: Type.STRING, enum: ['Hold', 'Exit', 'Add More'] },
                reasoning: { type: Type.STRING },
              },
              required: ['fundName', 'action', 'reasoning']
            }
          },
          riskReturnAnalysis: { type: Type.STRING },
          details: { type: Type.STRING },
        },
        required: ['recommendation', 'summary', 'details', 'fundRecommendations']
      }
    }
  }));

  const result = safeParse(response.text || '{}');
  return {
    ...result,
    lastGenerated: new Date().toISOString()
  };
  } catch (error: any) {
    console.error("Failed to generate SIP portfolio analysis:", error);
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
      throw error;
    }
    const isHighDemand = isRetryableError(error);
    return {
      recommendation: 'Hold',
      summary: isHighDemand ? 'AI Service is currently under high demand.' : 'Analysis unavailable due to technical error.',
      details: isHighDemand ? 'The AI server is experiencing temporary spikes. Please try again in a minute.' : 'Please try again later.',
      lastGenerated: new Date().toISOString()
    };
  }
}

export async function generateInsuranceAnalysis(policy: InsurancePolicy, documentData?: { data: string, mimeType: string }): Promise<InsuranceAnalysis> {
  if (isCooldownActive()) {
    return {
      pros: [],
      cons: [],
      suitability: 'AI Analysis is currently in cooldown due to rate limits. Please try again in a few minutes.',
      lastGenerated: new Date().toISOString()
    };
  }
  const ai = getAI();
  let prompt = `
    Analyze the following Indian insurance policy and provide a detailed report.
    
    Policy Name: ${policy.name}
    Provider: ${policy.provider}
    Type: ${policy.type}
    Sum Assured: ${policy.sumAssured}
    Premium: ${policy.premium} (${policy.premiumFrequency})
    Benefits: ${safeStringify(policy.benefits)}
  `;

  if (documentData) {
    prompt += `
      A policy document has been uploaded. Please extract and analyze details from the document as well.
      Focus on:
      - Key features and specific benefits.
      - Limitations and hidden clauses.
      - Waiting periods (especially for pre-existing diseases in health insurance).
      - Exclusions (what is NOT covered).
      - Risk factors.
      - Conditions for no-claim scenarios (for Term plans).
      - Payout details and surrender value calculations (for Traditional/Savings plans).
    `;
  }

  prompt += `
    Format the response as a JSON object with:
    - pros: string[] (at least 3)
    - cons: string[] (at least 2)
    - suitability: string (detailed analysis)
    - keyFeatures: string[]
    - limitations: string[]
    - waitingPeriods: string[]
    - exclusions: string[]
    - riskFactors: string[]
    - noClaimConditions: string (if applicable)
    - payoutDetails: string (if applicable)
    - surrenderValueDetails: string (if applicable)
  `;

  const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
  
  if (documentData) {
    contents[0].parts.push({
      inlineData: {
        data: documentData.data,
        mimeType: documentData.mimeType
      }
    });
  }

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            suitability: { type: Type.STRING },
            keyFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
            limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
            waitingPeriods: { type: Type.ARRAY, items: { type: Type.STRING } },
            exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
            noClaimConditions: { type: Type.STRING },
            payoutDetails: { type: Type.STRING },
            surrenderValueDetails: { type: Type.STRING },
          },
          required: ['pros', 'cons', 'suitability']
        }
      }
    }));

    const result = safeParse(response.text || '{}');
    return {
      ...result,
      lastGenerated: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Failed to generate insurance analysis:", error);
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
      throw error;
    }
    const isHighDemand = isRetryableError(error);
    return {
      pros: [],
      cons: [],
      suitability: isHighDemand ? 'AI Service is currently under high demand. Please try again in a minute.' : 'Analysis unavailable due to technical error. Please try again later.',
      lastGenerated: new Date().toISOString()
    };
  }
}

export async function generateTaxAnalysis(taxProfile: TaxProfile): Promise<TaxAnalysis> {
  if (isCooldownActive()) {
    return {
      summary: 'AI Analysis is currently in cooldown due to rate limits. Please try again in a few minutes.',
      recommendations: [],
      perksAndBenefits: [],
      lastGenerated: new Date().toISOString()
    };
  }
  const ai = getAI();
  const prompt = `
    Analyze the following Indian tax profile and provide a detailed report including tax-saving recommendations, perks/benefits optimization, and salary restructuring options.
    
    Current Selected Regime: ${taxProfile.regime || 'New'}
    Annual Income: ${taxProfile.annualIncome}
    Basic Salary: ${taxProfile.basicSalary}
    Actual HRA: ${taxProfile.actualHRA}
    Rent Paid: ${taxProfile.rentPaid}
    HRA Exemption (Calculated): ${taxProfile.hraExemption || 0}
    City Type: ${taxProfile.cityType}
    80C Investments: ${taxProfile.investments80C}
    NPS (80CCD1B): ${taxProfile.nps80CCD}
    Employer NPS (80CCD2): ${taxProfile.npsEmployer80CCD2}
    Medical Insurance (80D): ${taxProfile.medicalInsurance80D}
    Other Deductions: ${safeStringify(taxProfile.otherDeductions)}
    Capital Gains Data: ${safeStringify(taxProfile.capitalGains || [])}
    Documents Extracted Data: ${safeStringify(taxProfile.documents?.map(d => d.extractedData) || [])}
    
    Salary Components:
    - LTA: ${taxProfile.lta || 0}
    - Meal Coupons: ${taxProfile.mealCoupons || 0}
    - Mobile Reimbursement: ${taxProfile.mobileReimbursement || 0}
    - Uniform Allowance: ${taxProfile.uniformAllowance || 0}
    - Books & Gadgets: ${taxProfile.booksGadgetsAllowance || 0}
    - Company Lease: ${taxProfile.companyLease || 0}
    - Car Lease: ${taxProfile.carLease || 0}
    - Fuel & Maintenance: ${taxProfile.fuelMaintenance || 0}
    - Driver Salary: ${taxProfile.driverSalary || 0}
    - Professional Pursuit: ${taxProfile.professionalPursuit || 0}
    - Helper Allowance: ${taxProfile.helperAllowance || 0}
    - Gift Vouchers: ${taxProfile.giftVouchers || 0}
    - Gym & Wellness: ${taxProfile.gymWellness || 0}
    
    IMPORTANT: Use the latest Indian Budget 2024-25 rules.
    1. Capital Gains Analysis: Analyze short-term and long-term capital gains across Equity, Debt, and other assets. Suggest strategies like tax-loss harvesting or utilizing the 1.25L LTCG exemption for Equity.
    2. Regime Selection: Evaluate if switching between Old and New regime would be more beneficial given the user's specific deductions and income.
    3. Deduction Optimization: Suggest specific ways to maximize 80C, 80D, and NPS 80CCD(1B) if not already utilized.
    4. Salary Restructuring: Analyze if the user can optimize their tax by restructuring components (e.g., increasing LTA, opting for meal coupons, etc., noting relevance to the selected regime).
    
    Format the response as a JSON object with:
    - summary: string (Markdown summary highlighting key findings)
    - recommendations: { title: string, description: string, estimatedSavings: number }[]
    - perksAndBenefits: { title: string, benefit: string, taxRule: string, pros: string[], cons: string[] }[]
    - salaryRestructuring: { currentComponent: string, suggestedComponent: string, reason: string, potentialSavings: number }[]
    - detailedAnalysis: string (A very long, detailed Markdown report covering capital gains, deduction strategies, and regime comparison)
  `;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedSavings: { type: Type.NUMBER },
              },
              required: ['title', 'description', 'estimatedSavings']
            }
          },
          perksAndBenefits: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                benefit: { type: Type.STRING },
                taxRule: { type: Type.STRING },
                pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['title', 'benefit', 'taxRule', 'pros', 'cons']
            }
          },
          salaryRestructuring: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                currentComponent: { type: Type.STRING },
                suggestedComponent: { type: Type.STRING },
                reason: { type: Type.STRING },
                potentialSavings: { type: Type.NUMBER },
              },
              required: ['currentComponent', 'suggestedComponent', 'reason', 'potentialSavings']
            }
          },
          detailedAnalysis: { type: Type.STRING }
        },
        required: ['summary', 'recommendations', 'perksAndBenefits', 'detailedAnalysis']
      }
    }
  }));

  const result = safeParse(response.text || '{}');
  return {
    ...result,
    lastGenerated: new Date().toISOString()
  };
  } catch (error: any) {
    console.error("Failed to generate tax analysis:", error);
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
      throw error;
    }
    const isHighDemand = isRetryableError(error);
    return {
      summary: isHighDemand ? 'AI Service is currently under high demand. Please try again in a minute.' : 'Analysis unavailable due to technical error. Please try again later.',
      recommendations: [],
      perksAndBenefits: [],
      lastGenerated: new Date().toISOString()
    };
  }
}

export async function generateDetailedFinancialPlan(portfolio: PortfolioState): Promise<FinancialPlan> {
  if (isCooldownActive()) {
    throw new Error("AI Analysis is currently in cooldown due to rate limits. Please try again in a few minutes.");
  }
  const ai = getAI();
  const dataSummary = {
    selectedMemberId: portfolio.selectedMemberId,
    familyMembers: portfolio.familyMembers,
    netWorth: {
      assets: portfolio.investments.reduce((sum, i) => sum + i.currentValue, 0) + portfolio.bankAccounts.reduce((sum, b) => sum + b.balance, 0),
      liabilities: portfolio.liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0)
    },
    cashFlow: {
      income: portfolio.incomes.reduce((sum, i) => sum + i.amount, 0),
      expenses: portfolio.expenses.reduce((sum, e) => sum + e.amount, 0)
    },
    riskProfile: portfolio.riskProfile,
    goals: portfolio.goals,
    assetAllocation: portfolio.investments.reduce((acc, inv) => {
      acc[inv.category] = (acc[inv.category] || 0) + inv.currentValue;
      return acc;
    }, {} as Record<string, number>),
    taxProfile: portfolio.taxProfile,
    insurance: portfolio.insurances,
    estatePlanning: portfolio.estatePlanning,
    meetingDiscussions: portfolio.meetingDiscussions
  };

  const prompt = `
    Create a detailed, institutional-grade financial plan based on the following client data. 
    
    Client Data:
    ${safeStringify(dataSummary, 2)}

    Requirements:
    1. EXHAUSTIVE GOAL ANALYSIS: For each goal, provide a deep analysis of current achievement, gap, and a specific "mapping" that suggests how to bridge the gap using Equity, Debt, and Monthly SIP targets.
    2. FUTURE PROJECTIONS: Provide year-by-year projections for the next 10 years at a minimum.
    3. TAX OPTIMIZATION: Suggest 3-5 specific actions for Indian tax compliance (New vs Old regime, deductions, perks).
    4. ACTION PLAN: Provide a clear, prioritized checklist of steps for the client and advisor.
    5. YEARLY REVIEW & MINUTES: You MUST use the provided meeting discussions/minutes from the client data. Summarize the latest one (ID: d1 if present) into "Points Discussed" and "Strategic Actions". Ensure the "date" matches the exact date in the meeting record (e.g., "2026-05-09").
    6. PREPARED BY: Ensure the "preparedBy" field is set to "Right Horizons".
    7. PORTFOLIO ANALYSIS: Include a deep quantitative analysis in the executive summary or specific sections, referencing Alpha, Beta, Sharpe, and Treynor ratios where relevant based on the investment data.
    8. DEEP PORTFOLIO ANALYSIS: You MUST populate the "deepPortfolioAnalysis" field with a global-standard report. Include:
       - Market Outlook: Future market trajectory.
       - Valuation Analysis: Current market valuation status (Overvalued/Fair/Undervalued) with deep commentary.
       - Sentiment & Liquidity: Current market sentiment and liquidity conditions.
       - Earnings Growth: Expected earnings growth for the specific sectors/assets in the portfolio.
       - 10-Year Projections: Optimistic, Expected, and Pessimistic portfolio growth projections based on the current asset mix and earnings expectations.
    9. FORMAT: Return only a JSON object matching the FinancialPlan interface. Do not truncate the JSON.
  `;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            portfolioScorecard: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: ['Excellent', 'Good', 'Fair', 'Poor'] },
                  observation: { type: Type.STRING }
                },
                required: ['category', 'score', 'status', 'observation']
              }
            },
            familyDetails: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        age: { type: Type.NUMBER },
        relationship: { type: Type.STRING },
        panSuffix: { type: Type.STRING },
        email: { type: Type.STRING },
        kycStatus: { type: Type.STRING, enum: ['Verified', 'Not Verified', 'In Progress'] }
      },
      required: ['name', 'age', 'relationship', 'kycStatus']
    }
  },
  netWorthAnalysis: {
    type: Type.OBJECT,
    properties: {
      totalAssets: { type: Type.NUMBER },
      totalLiabilities: { type: Type.NUMBER },
      netWorth: { type: Type.NUMBER },
      analysis: { type: Type.STRING },
      assetBreakdown: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
      liabilityBreakdown: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
      detailedAssetTable: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            invested: { type: Type.NUMBER },
            current: { type: Type.NUMBER },
            allocation: { type: Type.NUMBER }
          },
          required: ['name', 'invested', 'current', 'allocation']
        }
      }
    },
    required: ['totalAssets', 'totalLiabilities', 'netWorth', 'analysis', 'assetBreakdown', 'liabilityBreakdown', 'detailedAssetTable']
  },
  cashFlowAnalysis: {
    type: Type.OBJECT,
    properties: {
      monthlyIncome: { type: Type.NUMBER },
      monthlyExpenses: { type: Type.NUMBER },
      surplus: { type: Type.NUMBER },
      savingsRate: { type: Type.NUMBER },
      analysis: { type: Type.STRING },
      inflowBreakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            amount: { type: Type.NUMBER }
          },
          required: ['category', 'amount']
        }
      },
      outflowBreakdown: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            amount: { type: Type.NUMBER }
          },
          required: ['category', 'amount']
        }
      }
    },
    required: ['monthlyIncome', 'monthlyExpenses', 'surplus', 'savingsRate', 'analysis', 'inflowBreakdown', 'outflowBreakdown']
  },
  riskProfileAnalysis: {
    type: Type.OBJECT,
    properties: {
      profile: { type: Type.STRING },
      score: { type: Type.NUMBER },
      description: { type: Type.STRING },
      suitability: { type: Type.STRING },
      assetAllocationSuggestion: { type: Type.STRING },
      questionnaireSnapshot: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ['question', 'answer']
        }
      }
    },
    required: ['profile', 'score', 'description', 'suitability', 'assetAllocationSuggestion']
  },
  goalGapAnalysis: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        goalName: { type: Type.STRING },
        targetAmount: { type: Type.NUMBER },
        currentAmount: { type: Type.NUMBER },
        gap: { type: Type.NUMBER },
        status: { type: Type.STRING, enum: ['On Track', 'At Risk', 'Critical'] },
        recommendation: { type: Type.STRING },
        inflationAdjustedCost: { type: Type.NUMBER },
        yearsRemaining: { type: Type.NUMBER },
        mapping: {
          type: Type.OBJECT,
          properties: {
            goalName: { type: Type.STRING },
            equityRequirement: { type: Type.NUMBER },
            debtRequirement: { type: Type.NUMBER },
            monthlySip: { type: Type.NUMBER },
            lumpsum: { type: Type.NUMBER },
            achievedPercentage: { type: Type.NUMBER },
            allocatedAssets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                },
                required: ['name', 'value']
              }
            },
            plannerNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['goalName', 'equityRequirement', 'debtRequirement', 'monthlySip', 'lumpsum', 'achievedPercentage', 'allocatedAssets', 'plannerNotes']
        }
      },
      required: ['goalName', 'targetAmount', 'currentAmount', 'gap', 'status', 'recommendation', 'inflationAdjustedCost', 'yearsRemaining']
    }
  },
  assetAllocationStrategy: {
    type: Type.OBJECT,
    properties: {
      current: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
      recommended: { type: Type.OBJECT, additionalProperties: { type: Type.NUMBER } },
      rebalancingSteps: { type: Type.STRING },
      glidePath: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            year: { type: Type.NUMBER },
            equity: { type: Type.NUMBER },
            debt: { type: Type.NUMBER },
            other: { type: Type.NUMBER }
          },
          required: ['year', 'equity', 'debt', 'other']
        }
      }
    },
    required: ['current', 'recommended', 'rebalancingSteps']
  },
  insuranceGapAnalysis: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        required: { type: Type.NUMBER },
        current: { type: Type.NUMBER },
        gap: { type: Type.NUMBER },
        analysis: { type: Type.STRING },
        needBasedAnalysis: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              amount: { type: Type.NUMBER }
            },
            required: ['label', 'amount']
          }
        },
        suggestedPolicies: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sumAssured: { type: Type.NUMBER },
              premium: { type: Type.NUMBER },
              status: { type: Type.STRING }
            },
            required: ['name', 'sumAssured', 'premium', 'status']
          }
        }
      },
      required: ['type', 'required', 'current', 'gap', 'analysis']
    }
  },
  taxOptimizationStrategy: { type: Type.STRING },
  insuranceEstatePlanning: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      securityScore: { type: Type.NUMBER },
      missingElements: { type: Type.ARRAY, items: { type: Type.STRING } },
      willChecklist: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            task: { type: Type.STRING },
            status: { type: Type.BOOLEAN }
          },
          required: ['task', 'status']
        }
      }
    },
    required: ['summary', 'securityScore', 'missingElements']
  },
  actionPlan: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        step: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        timeline: { type: Type.STRING },
        impact: { type: Type.STRING },
        responsible: { type: Type.STRING, enum: ['Client', 'Advisor', 'Both'] }
      },
      required: ['step', 'priority', 'timeline', 'impact', 'responsible']
    }
  },
  futureProjections: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.NUMBER },
        projectedValue: { type: Type.NUMBER },
        inflationAdjustedValue: { type: Type.NUMBER }
      },
      required: ['year', 'projectedValue', 'inflationAdjustedValue']
    }
  },
  stressTestAnalysis: { type: Type.STRING },
  yearlyReview: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING },
      pointsDiscussed: { type: Type.ARRAY, items: { type: Type.STRING } },
      strategicActions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            desc: { type: Type.STRING }
          },
          required: ['title', 'desc']
        }
      }
    },
    required: ['date', 'pointsDiscussed', 'strategicActions']
  }
},
required: [
  'executiveSummary', 'portfolioScorecard', 'familyDetails', 'netWorthAnalysis', 'cashFlowAnalysis', 
  'riskProfileAnalysis', 'goalGapAnalysis', 'assetAllocationStrategy', 
  'insuranceGapAnalysis', 'taxOptimizationStrategy', 'insuranceEstatePlanning', 'actionPlan',
  'futureProjections', 'stressTestAnalysis', 'yearlyReview'
]
}
}
}));

const result = safeParse(response.text || '{}');
return {
...result,
lastGenerated: new Date().toISOString()
};
  } catch (error: any) {
    console.error("Failed to generate financial plan:", error);
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    if (isRetryableError(error)) {
      throw new Error("The AI service is currently experiencing high demand. Please try again in a minute.");
    }
    throw error;
  }
}

export async function generateIPSAnalysis(portfolio: PortfolioState): Promise<string> {
  if (isCooldownActive()) {
    return "AI Analysis is currently in cooldown due to rate limits. Please try again in a few minutes.";
  }
  const ai = getAI();
  const { ipsPolicy, investments, riskProfile, goals } = portfolio;
  const totalAssets = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

  const prompt = `
    As a Senior Investment Strategist, review the following Investment Policy Statement (IPS) for an Indian investor.
    
    Current IPS:
    ${safeStringify(ipsPolicy, 2)}
    
    Investor Portfolio Context:
    - Total Assets: ₹${totalAssets.toLocaleString('en-IN')}
    - Risk Profile: ${riskProfile.score}/100 (${riskProfile.type})
    - Goals: ${goals.map(g => `${g.name} (₹${g.targetAmount.toLocaleString('en-IN')})`).join(', ')}
    
    Please provide:
    1. A critical evaluation of the current IPS.
    2. Specific suggestions to improve it based on global best practices (CFA Institute standards) adapted for the Indian market (taxation, inflation, market volatility).
    3. Recommendations for rebalancing or constraint adjustments.
    
    Format the response in clear Markdown.
  `;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    }));

    return response.text;
  } catch (error: any) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    if (isRetryableError(error)) {
      throw new Error("The AI service is currently experiencing high demand. Please try again in a minute.");
    }
    console.error("IPS Analysis failed:", error);
    throw error;
  }
}

export async function generateMarketScenarioAnalysis(portfolio: PortfolioState): Promise<MarketScenarioAnalysis> {
  if (isCooldownActive()) {
    throw new Error("AI Analysis is currently in cooldown due to rate limits. Please try again in a few minutes.");
  }
  const ai = getAI();
  
  const prompt = `
    Perform a comprehensive Market Scenario Analysis for an Indian retail investor.
    Current Date: 2026-04-23
    
    Investor Portfolio Context:
    - Current Assets: ${portfolio.investments.length} holdings across ${Array.from(new Set(portfolio.investments.map(i => i.category))).join(', ')}
    - Risk Profile: ${portfolio.riskProfile.type} (Score: ${portfolio.riskProfile.score}/100)
    - Major Goals: ${portfolio.goals.slice(0, 2).map(g => g.name).join(', ')}
    
    Current Indian Market Indices:
    ${portfolio.marketIndices.map(idx => `- ${idx.name}: ${idx.value} (${idx.changePercent}%)`).join('\n')}
    
    Tasks:
    1. Identify current Indian economic indicators (GDP growth, RBI Repo Rate, CPI Inflation, GST collection trends).
    2. Analyze market sentiment for Equity, Debt, Gold, and Real Estate in the Indian context.
    3. Identify 3-5 sector outlooks (e.g., Banking, IT, Pharma, Energy/Green Hydrogen).
    4. Provide specific rebalancing recommendations based on the current market state and user's profile.
    
    Format the response as a JSON object matching the MarketScenarioAnalysis interface.
  `;

  try {
    const response = await callAIWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenarioName: { type: Type.STRING },
            probability: { type: Type.NUMBER },
            economicIndicators: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  indicator: { type: Type.STRING },
                  currentValue: { type: Type.STRING },
                  trend: { type: Type.STRING, enum: ['Rising', 'Falling', 'Stable'] },
                  impact: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] }
                },
                required: ['indicator', 'currentValue', 'trend', 'impact']
              }
            },
            marketSentiment: {
              type: Type.OBJECT,
              properties: {
                overall: { type: Type.STRING },
                equity: { type: Type.STRING },
                debt: { type: Type.STRING },
                gold: { type: Type.STRING },
                realEstate: { type: Type.STRING }
              },
              required: ['overall', 'equity', 'debt', 'gold', 'realEstate']
            },
            sectorOutlook: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sector: { type: Type.STRING },
                  rating: { type: Type.STRING, enum: ['Overweight', 'Neutral', 'Underweight'] },
                  rationale: { type: Type.STRING }
                },
                required: ['sector', 'rating', 'rationale']
              }
            },
            rebalancingRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
                },
                required: ['action', 'rationale', 'priority']
              }
            }
          },
          required: ['scenarioName', 'probability', 'economicIndicators', 'marketSentiment', 'sectorOutlook', 'rebalancingRecommendations']
        }
      }
    }));

    const result = safeParse(response.text || '{}');
    return {
      ...result,
      lastUpdated: new Date().toISOString()
    };
  } catch (error: any) {
    if (isQuotaExceededError(error)) {
      setCooldown(isMonthlyCapError(error));
    }
    if (isRetryableError(error)) {
      throw new Error("The AI service is currently experiencing high demand. Please try again in a minute.");
    }
    console.error("Market Scenario Analysis failed:", error);
    throw error;
  }
}
