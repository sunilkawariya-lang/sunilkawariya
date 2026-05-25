import { toast } from 'sonner';

export enum ErrorType {
  API = 'API',
  AI = 'AI',
  FIRESTORE = 'FIRESTORE',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN'
}

interface ErrorOptions {
  type?: ErrorType;
  title?: string;
  description?: string;
  fallback?: () => void;
  silent?: boolean;
}

export const safeStringify = (obj: any, indent?: number) => {
  const cache = new WeakSet();
  
  const replacer = (_key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);

      // Handle common problematic objects
      try {
        // Handle Firebase/Firestore specific objects even if mangled
        const isFirebase = 
          (value.constructor?.name && ['DocumentReference', 'CollectionReference', 'Query', 'Firestore', 'DocumentSnapshot', 'QuerySnapshot'].includes(value.constructor.name)) ||
          (value._delegate) || // Common in Firebase JS SDK
          (value.firestore && value.path); // Common duck-typing for Firestore refs
          
        if (isFirebase) {
          return `[Firebase ${value.constructor?.name || 'Object'}]`;
        }

        // Handle React/DOM elements
        if (value.$$typeof || value instanceof HTMLElement || value instanceof Event) {
          return `[Object ${value.constructor?.name || 'Complex'}]`;
        }
      } catch (e) {
        // If constructor check fails, just keep going
      }
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }
    
    if (typeof value === 'function') {
      return '[Function]';
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    return value;
  };

  try {
    return JSON.stringify(obj, replacer, indent);
  } catch (e) {
    // Ultimate fallback if even the replacer fails
    try {
      return String(obj);
    } catch (finalError) {
      return '[Unserializable Object]';
    }
  }
};

export function safeParse<T = any>(jsonStr: string, fallback: T): T;
export function safeParse<T = any>(jsonStr: string): T;
export function safeParse(jsonStr: string, fallback: any = null): any {
  if (!jsonStr || typeof jsonStr !== 'string') return fallback;
  
  let cleaned = jsonStr.trim();
  
  // 1. Remove markdown code blocks if present
  if (cleaned.includes('```')) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      cleaned = match[1].trim();
    }
  }
  
  // 2. Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (error: any) {
    // 3. If "Unexpected non-whitespace character after JSON", we likely have trailing text
    if (error.message?.includes('Unexpected token') || error.message?.includes('Unexpected non-whitespace character after JSON')) {
      // Try to extract the first valid JSON object or array
      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      let startIdx = -1;
      let endChar = '';
      
      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
        endChar = '}';
      } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        endChar = ']';
      }
      
      if (startIdx !== -1) {
        let stack = 0;
        let insideString = false;
        let escape = false;
        let foundEnd = -1;
        
        for (let i = startIdx; i < cleaned.length; i++) {
          const char = cleaned[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (char === '\\') {
            escape = true;
            continue;
          }
          if (char === '"') {
            insideString = !insideString;
            continue;
          }
          if (!insideString) {
            if (char === '{' || char === '[') stack++;
            if (char === '}' || char === ']') {
              stack--;
              if (stack === 0) {
                foundEnd = i + 1;
                break;
              }
            }
          }
        }
        
        if (foundEnd !== -1) {
          try {
            return JSON.parse(cleaned.substring(startIdx, foundEnd));
          } catch (e2) {
            // Extraction failed to produce valid JSON, move to further repair
          }
        }
      }
    }

    // 4. More aggressive cleaning for common AI issues
    let repaired = cleaned
      .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
      .replace(/\s*}\s*{/g, '},{')  // Fix multiple objects without commas
      .replace(/\s*\]\s*\[/g, '],[') // Fix multiple arrays without commas
      .trim();

    try {
      return JSON.parse(repaired);
    } catch (e3) {
      console.warn("safeParse failed even after cleaning:", e3);
      return fallback;
    }
  }
}

export const handleError = (error: any, options: ErrorOptions = {}) => {
  const { 
    type = ErrorType.UNKNOWN, 
    title = 'Something went wrong', 
    description, 
    fallback,
    silent = false 
  } = options;

  let message = description;
  if (!message) {
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const extractMessage = (err: any): string => {
        if (err.message) return err.message;
        if (err.error && typeof err.error.message === 'string') return err.error.message;
        return String(err);
      };
      message = extractMessage(error);
    } else {
      message = String(error);
    }
  }

  // Detect if it's a quota/rate limit error to avoid logging as a scary ERROR in console if we handle it
  const lowerMessageDetect = message.toLowerCase();
  const isQuotaError = lowerMessageDetect.includes('quota') || 
                       lowerMessageDetect.includes('429') || 
                       lowerMessageDetect.includes('503') ||
                       lowerMessageDetect.includes('resource_exhausted') || 
                       lowerMessageDetect.includes('unavailable') ||
                       lowerMessageDetect.includes('high demand') ||
                       lowerMessageDetect.includes('spending cap') || 
                       lowerMessageDetect.includes('monthly spending limit') ||
                       lowerMessageDetect.includes('cooldown');

  if (isQuotaError) {
    console.warn(`[${type}] Service Limit:`, message);
  } else {
    // Stringify error safely to avoid circular reference issues in console logging in some environments
    console.error(`[${type}] Error:`, typeof error === 'object' ? safeStringify(error) : error);
  }

  // Handle Firestore JSON errors
  if (typeof message === 'string' && message.startsWith('{') && message.includes('operationType')) {
    try {
      const parsed = JSON.parse(message);
      message = `Database ${parsed.operationType} failed on ${parsed.path || 'unknown path'}.`;
    } catch (e) {
      // Not a valid JSON, keep original message
    }
  }

  // Handle Gemini JSON errors if they come as a string message
  if (typeof message === 'string' && message.includes('"error"') && 
      (message.includes('"code": 429') || message.includes('"code":429') || 
       message.includes('"code": 503') || message.includes('"code":503'))) {
    try {
      const parsed = JSON.parse(message);
      if (parsed.error && parsed.error.message) {
        message = parsed.error.message;
      }
    } catch (e) {
      // Ignore parse error
    }
  }

  // User-friendly mapping for common errors
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('spending cap') || lowerMessage.includes('monthly spending limit')) {
    message = 'Maximum monthly AI spending limit reached. You can continue by providing your own Gemini API key in the application settings (Cog icon > API Keys).';
  } else if (lowerMessage.includes('quota') || lowerMessage.includes('429') || lowerMessage.includes('resource_exhausted')) {
    message = 'AI service rate limit reached. The system will automatically retry in a few minutes.';
  } else if (lowerMessage.includes('503') || lowerMessage.includes('high demand') || lowerMessage.includes('unavailable')) {
    message = 'AI model is currently experiencing high demand. We are retrying your request automatically. If it still fails, please try again in a minute.';
  } else if (lowerMessage.includes('network') || lowerMessage.includes('offline')) {
    message = 'Network error. Please check your internet connection.';
  } else if (message.includes('permission') || message.includes('insufficient')) {
    message = 'You do not have permission to perform this action.';
  }

  if (!silent) {
    toast.error(title, {
      description: message,
      duration: 5000,
    });
  }

  if (fallback) {
    fallback();
  }

  return message;
};

export const handleAsync = async <T>(
  promise: Promise<T>,
  options: ErrorOptions = {}
): Promise<[T | null, string | null]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const message = handleError(error, options);
    return [null, message];
  }
};
