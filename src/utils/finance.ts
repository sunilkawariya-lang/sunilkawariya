
/**
 * Calculates the internal rate of return for a series of cash flows.
 * @param cashflows Array of objects with date and amount.
 * @returns The XIRR as a decimal (e.g., 0.15 for 15%).
 */
export function calculateXIRR(cashflows: { date: Date; amount: number }[]): number | null {
  if (cashflows.length < 2) return null;

  // Newton's method to solve for r: sum(amount_i / (1 + r)^((date_i - date_0) / 365)) = 0
  const xirr = (flows: { date: Date; amount: number }[]) => {
    let r = 0.1; // Initial guess
    const maxIterations = 100;
    const precision = 1e-7;

    for (let i = 0; i < maxIterations; i++) {
      let f = 0;
      let df = 0;

      for (const flow of flows) {
        const years = (flow.date.getTime() - flows[0].date.getTime()) / (1000 * 60 * 60 * 24 * 365);
        const factor = Math.pow(1 + r, years);
        f += flow.amount / factor;
        df -= (years * flow.amount) / (Math.pow(1 + r, years + 1));
      }

      if (Math.abs(df) < precision) break;

      const nextR = r - f / df;
      if (Math.abs(nextR - r) < precision) return nextR;
      r = nextR;
    }

    return r;
  };

  try {
    const result = xirr(cashflows);
    if (isNaN(result) || !isFinite(result)) return null;
    return result;
  } catch (e) {
    return null;
  }
}

/**
 * Calculates simple CAGR for a single purchase.
 */
export function calculateCAGR(invested: number, current: number, startDate: Date, endDate: Date = new Date()): number | null {
  if (invested <= 0 || current <= 0) return null;
  const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (years <= 0) return null;
  return Math.pow(current / invested, 1 / years) - 1;
}

export const USD_TO_INR = 83;

/**
 * Converts an amount to INR based on the currency.
 */
export function convertToINR(amount: number, currency: string = 'INR'): number {
  if (currency === 'USD') return amount * USD_TO_INR;
  return amount;
}

/**
 * Formats a number into a readable currency string.
 * For INR, uses Lakhs/Crores. For USD, uses Millions/Billions.
 */
export function formatLakhs(val: number, currency: string = 'INR'): string {
  const absVal = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  const isUSD = currency === 'USD';
  
  if (isUSD) {
    if (absVal >= 1000000000) { // 1 Billion
      return `${sign}$${(absVal / 1000000000).toFixed(2)}B`;
    }
    if (absVal >= 1000000) { // 1 Million
      return `${sign}$${(absVal / 1000000).toFixed(2)}M`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  }
  
  if (absVal >= 10000000) { // 1 Crore = 100 Lakhs
    return `${sign}₹${(absVal / 10000000).toFixed(2)} Cr`;
  }
  
  if (absVal >= 100000) {
    return `${sign}₹${(absVal / 100000).toFixed(2)} Lacs`;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}
