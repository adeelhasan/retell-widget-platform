import { CONFIG } from './config';

export function isAllowedDomain(origin: string, allowedDomain: string): boolean {
  if (!origin || !allowedDomain) return false;
  
  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.hostname;
    
    // Handle localhost
    if (allowedDomain === 'localhost' && originHost === 'localhost') {
      return true;
    }
    
    // Handle development domains
    const devDomains = CONFIG.SECURITY.ALLOWED_DEV_DOMAINS;
    if (devDomains.some(domain => {
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2);
        return originHost.endsWith('.' + baseDomain) || originHost === baseDomain;
      }
      return originHost.includes(domain);
    })) {
      return true;
    }
    
    // Extract domain from URL if allowedDomain is a full URL
    let targetDomain = allowedDomain;
    try {
      const allowedUrl = new URL(allowedDomain);
      targetDomain = allowedUrl.hostname;
    } catch {
      // allowedDomain is just a hostname, use as-is
    }
    
    // Exact match
    if (originHost === targetDomain) return true;
    
    // Subdomain match
    if (originHost.endsWith('.' + targetDomain)) return true;
    
    return false;
  } catch (error) {
    console.error('Domain validation error:', error);
    return false;
  }
}

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, number[]>();

export function checkRateLimit(widgetId: string, limit: number = CONFIG.RATE_LIMITING.CALLS_PER_HOUR): boolean {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMITING.WINDOW_MS;
  
  if (!rateLimitStore.has(widgetId)) {
    rateLimitStore.set(widgetId, []);
  }
  
  const calls = rateLimitStore.get(widgetId)!;
  
  // Remove old calls outside the window
  const validCalls = calls.filter(timestamp => timestamp > windowStart);
  rateLimitStore.set(widgetId, validCalls);
  
  // Check if limit exceeded
  if (validCalls.length >= limit) {
    return false;
  }
  
  // Add current call
  validCalls.push(now);
  return true;
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMITING.WINDOW_MS;
  
  for (const [widgetId, calls] of rateLimitStore.entries()) {
    const validCalls = calls.filter(timestamp => timestamp > windowStart);
    if (validCalls.length === 0) {
      rateLimitStore.delete(widgetId);
    } else {
      rateLimitStore.set(widgetId, validCalls);
    }
  }
}, CONFIG.RATE_LIMITING.WINDOW_MS); // Cleanup every hour