// Patterns for common API keys and secrets
const SECRETS_REGEX = [
  // OpenAI API keys
  /sk-[a-zA-Z0-9]{20,}/g,
  /sk-proj-[a-zA-Z0-9]{20,}/g,
  
  // OpenRouter API keys
  /sk-or-[a-zA-Z0-9\-_]{20,}/g,
  
  // Firebase API keys
  /AIza[0-9A-Za-z\\-_]{35}/g,
  
  // Supabase keys
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWT tokens
  /sb-[a-zA-Z0-9]{20,}/g,
  
  // Generic patterns
  /Bearer\s+[A-Za-z0-9\-_\.~\+\/]+=*/g, // Bearer tokens
  /api[_-]?key[_-]?[=:]\s*['\"]?[a-zA-Z0-9_\-]{16,}['\"]?/gi,
  /secret[_-]?key[_-]?[=:]\s*['\"]?[a-zA-Z0-9_\-]{16,}['\"]?/gi,
  /access[_-]?token[_-]?[=:]\s*['\"]?[a-zA-Z0-9_\-]{16,}['\"]?/gi,
  
  // Credit card numbers (basic pattern)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // Social Security Numbers (US format)
  /\b\d{3}-\d{2}-\d{4}\b/g,
  
  // Email addresses (when used as identifiers)
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // IP addresses (sometimes sensitive)
  /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
];

// Environment variable patterns that should be redacted
const ENV_VAR_PATTERNS = [
  /process\.env\.[A-Z_]*KEY[A-Z_]*/gi,
  /process\.env\.[A-Z_]*SECRET[A-Z_]*/gi,
  /process\.env\.[A-Z_]*TOKEN[A-Z_]*/gi,
  /process\.env\.[A-Z_]*PASSWORD[A-Z_]*/gi,
];

interface ScrubOptions {
  placeholder?: string;
  preserveLength?: boolean;
  scrubEmails?: boolean;
  scrubIPs?: boolean;
}

/**
 * Scrub sensitive information from text
 */
export function scrubSecrets(
  text: string, 
  options: ScrubOptions = {}
): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const {
    placeholder = '[REDACTED]',
    preserveLength = false,
    scrubEmails = true,
    scrubIPs = false,
  } = options;

  let scrubbedText = text;

  // Apply all secret patterns
  SECRETS_REGEX.forEach((regex, index) => {
    // Skip email and IP patterns based on options
    if (!scrubEmails && index === SECRETS_REGEX.length - 2) return;
    if (!scrubIPs && index === SECRETS_REGEX.length - 1) return;

    scrubbedText = scrubbedText.replace(regex, (match) => {
      if (preserveLength) {
        return placeholder.repeat(Math.max(1, Math.floor(match.length / placeholder.length)));
      }
      return placeholder;
    });
  });

  // Scrub environment variable patterns
  ENV_VAR_PATTERNS.forEach(regex => {
    scrubbedText = scrubbedText.replace(regex, placeholder);
  });

  return scrubbedText;
}

/**
 * Scrub secrets from objects (deep scrubbing)
 */
export function scrubSecretsFromObject(
  obj: any,
  options: ScrubOptions = {}
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return scrubSecrets(obj, options);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => scrubSecretsFromObject(item, options));
  }

  if (typeof obj === 'object') {
    const scrubbed: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if the key itself suggests sensitive data
      const sensitiveKeyPatterns = [
        /key/i, /secret/i, /token/i, /password/i, /auth/i, /credential/i
      ];
      
      const isSensitiveKey = sensitiveKeyPatterns.some(pattern => pattern.test(key));
      
      if (isSensitiveKey && typeof value === 'string') {
        scrubbed[key] = options.placeholder || '[REDACTED]';
      } else {
        scrubbed[key] = scrubSecretsFromObject(value, options);
      }
    }
    return scrubbed;
  }

  return obj;
}

/**
 * Safe console.error that automatically scrubs secrets
 */
export function safeConsoleError(message: string, ...args: any[]): void {
  const scrubbedMessage = scrubSecrets(message);
  const scrubbedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return scrubSecrets(arg);
    }
    if (typeof arg === 'object') {
      return scrubSecretsFromObject(arg);
    }
    return arg;
  });
  
  console.error(scrubbedMessage, ...scrubbedArgs);
}

/**
 * Safe console.log that automatically scrubs secrets
 */
export function safeConsoleLog(message: string, ...args: any[]): void {
  const scrubbedMessage = scrubSecrets(message);
  const scrubbedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return scrubSecrets(arg);
    }
    if (typeof arg === 'object') {
      return scrubSecretsFromObject(arg);
    }
    return arg;
  });
  
  console.log(scrubbedMessage, ...scrubbedArgs);
}

/**
 * Safe JSON.stringify that scrubs secrets
 */
export function safeStringify(obj: any, options?: ScrubOptions): string {
  try {
    const scrubbed = scrubSecretsFromObject(obj, options);
    return JSON.stringify(scrubbed);
  } catch (error) {
    return '[Error stringifying object]';
  }
}

/**
 * Create a logger that automatically scrubs secrets
 */
export const secureLogger = {
  error: safeConsoleError,
  log: safeConsoleLog,
  warn: (message: string, ...args: any[]) => {
    const scrubbedMessage = scrubSecrets(message);
    const scrubbedArgs = args.map(arg => 
      typeof arg === 'object' ? scrubSecretsFromObject(arg) : scrubSecrets(String(arg))
    );
    console.warn(scrubbedMessage, ...scrubbedArgs);
  },
  info: (message: string, ...args: any[]) => {
    const scrubbedMessage = scrubSecrets(message);
    const scrubbedArgs = args.map(arg => 
      typeof arg === 'object' ? scrubSecretsFromObject(arg) : scrubSecrets(String(arg))
    );
    console.info(scrubbedMessage, ...scrubbedArgs);
  },
};