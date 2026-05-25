
export const COOLDOWN_KEY = 'fin_market_api_cooldown';
const COOLDOWN_DURATION_SHORT = 10 * 1000; // Reduced to 10 seconds
const COOLDOWN_DURATION_LONG = 60 * 60 * 1000; // Reduced to 1 hour (24h was too much)

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add a way to bypass cooldown for urgent retries if the user explicitly clicks a button
let bypassNextCheck = false;
export function setBypassNextCooldown() {
  bypassNextCheck = true;
}

export function isQuotaExceededError(error: any): boolean {
  if (!error) return false;
  
  // Try to find status/message in various SDK error formats
  const innerError = error.error || error;
  const status = String(innerError.status || error.status || (typeof innerError === 'object' && innerError.status) || "").toUpperCase();
  const code = innerError.code || error.code || (typeof innerError === 'object' && innerError.error?.code);
  const errorMessage = (innerError.message || error.message || (typeof innerError === 'object' && innerError.error?.message) || "").toLowerCase();
  
  return (
    status === 'RESOURCE_EXHAUSTED' || 
    status === 'UNAVAILABLE' ||
    code === 429 || 
    code === 503 ||
    errorMessage.includes('resource_exhausted') || 
    errorMessage.includes('429') || 
    errorMessage.includes('503') ||
    errorMessage.includes('quota exceeded') || 
    errorMessage.includes('spending cap') || 
    errorMessage.includes('high demand') ||
    errorMessage.includes('try again later')
  );
}

export function isMonthlyCapError(error: any): boolean {
  if (!error) return false;
  
  const innerError = error.error || error;
  const message = (
    innerError.message || 
    error.message || 
    (typeof innerError === 'object' && innerError.error?.message) || 
    (typeof error === 'string' ? error : String(error))
  ).toLowerCase();
  
  return message.includes('spending cap') || message.includes('monthly spending limit');
}

export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  let currentError = error;
  // If error message is a JSON string, try to parse it to check inner properties
  if (typeof error.message === 'string' && (error.message.startsWith('{') || error.message.includes('"error"'))) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error) currentError = parsed.error;
      else currentError = parsed;
    } catch (e) {
      // Not JSON, continue with original
    }
  }

  // If it's a monthly spending cap, it's NOT retryable until next month
  if (isMonthlyCapError(currentError)) return false;

  const innerError = currentError.error || currentError;
  const status = String(innerError.status || currentError.status || (typeof innerError === 'object' && innerError.status) || "").toUpperCase();
  const code = innerError.code || currentError.code || (typeof innerError === 'object' && innerError.error?.code);
  const message = (innerError.message || currentError.message || (typeof innerError === 'object' && innerError.error?.message) || "").toLowerCase();
  
  // 429: Too Many Requests / Resource Exhausted
  // 503: Service Unavailable / High demand
  // 500: Internal Server Error (often transient)
  // 504: Gateway Timeout
  return (
    status === 'RESOURCE_EXHAUSTED' || 
    status === 'UNAVAILABLE' ||
    status === 'INTERNAL' ||
    status.includes('INTERNAL SERVER ERROR') ||
    code === 429 || 
    code === 503 ||
    code === 500 ||
    code === 504 ||
    message.includes('resource_exhausted') || 
    message.includes('429') || 
    message.includes('503') ||
    message.includes('quota exceeded') ||
    message.includes('high demand') ||
    message.includes('service unavailable') ||
    message.includes('unavailable') ||
    message.includes('try again later') ||
    message.includes('spike in demand') ||
    message.includes('internal server error')
  );
}

export function isCooldownActive(): boolean {
  if (bypassNextCheck) {
    bypassNextCheck = false;
    localStorage.removeItem(COOLDOWN_KEY);
    return false;
  }
  const cooldownUntil = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0');
  return Date.now() < cooldownUntil;
}

export function getCooldownTimeLeft(): number {
  const cooldownUntil = parseInt(localStorage.getItem(COOLDOWN_KEY) || '0');
  return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
}

export function clearCooldown() {
  localStorage.removeItem(COOLDOWN_KEY);
}

export function setCooldown(isHardLimit = false) {
  const duration = isHardLimit ? COOLDOWN_DURATION_LONG : COOLDOWN_DURATION_SHORT;
  localStorage.setItem(COOLDOWN_KEY, (Date.now() + duration).toString());
}

export async function callAIWithRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (isRetryableError(error) && attempt < maxRetries) {
        attempt++;
        // Exponential backoff with jitter: 2s, 4s, 8s...
        const baseBackoff = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const backoff = baseBackoff + jitter;
        
        console.warn(`AI Service issue (Retryable), retrying in ${Math.round(backoff)}ms (Attempt ${attempt}/${maxRetries})...`, error);
        await sleep(backoff);
        continue;
      }
      throw error;
    }
  }
  throw new Error("AI call failed after maximum retries");
}
