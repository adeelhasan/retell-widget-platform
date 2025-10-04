import { CONFIG } from './config';

function isPrivateIP(hostname: string): boolean {
  // Check if hostname is a private IP address
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);

  if (!match) return false;

  const [, a, b, c, d] = match.map(Number);

  // Validate IP octets (0-255)
  if (a > 255 || b > 255 || c > 255 || d > 255) return false;

  // Check private IP ranges
  return (
    a === 127 || // 127.0.0.0/8 - Loopback
    a === 10 || // 10.0.0.0/8 - Private
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12 - Private
    (a === 192 && b === 168) // 192.168.0.0/16 - Private
  );
}

export function isAllowedDomain(origin: string, allowedDomain: string): boolean {
  if (!origin || !allowedDomain) return false;

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.hostname;

    // Handle localhost
    if (allowedDomain === 'localhost' && originHost === 'localhost') {
      return true;
    }

    // Allow private IPs in development when allowed_domain is localhost
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (allowedDomain === 'localhost' && isPrivateIP(originHost) && isDevelopment) {
      console.log(`✅ Allowing private IP ${originHost} in development mode`);
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
      if (allowedDomain.startsWith('http://') || allowedDomain.startsWith('https://')) {
        const allowedUrl = new URL(allowedDomain);
        targetDomain = allowedUrl.hostname;
      }
    } catch {
      // allowedDomain is just a hostname/pattern, use as-is
    }
    
    // Check wildcard patterns
    if (targetDomain.includes('*')) {
      return matchesWildcardPattern(originHost, targetDomain);
    }
    
    // Exact match
    if (originHost === targetDomain) return true;
    
    // Subdomain match (only for non-wildcard patterns)
    if (originHost.endsWith('.' + targetDomain)) return true;
    
    return false;
  } catch (error) {
    console.error('Domain validation error:', error);
    return false;
  }
}

function matchesWildcardPattern(hostname: string, pattern: string): boolean {
  // Handle *.domain.com patterns
  if (pattern.startsWith('*.') && !pattern.endsWith('.*')) {
    const baseDomain = pattern.slice(2); // Remove '*.'
    return hostname.endsWith('.' + baseDomain) || hostname === baseDomain;
  }
  
  // Handle *.domain.* patterns (wildcard TLD)
  if (pattern.startsWith('*.') && pattern.endsWith('.*')) {
    const domainPart = pattern.slice(2, -2); // Remove '*.' and '.*'
    
    // Check if hostname matches pattern: subdomain.domain.tld or domain.tld
    const regex = new RegExp(`^([^.]+\\.)?${escapeRegex(domainPart)}\\.[^.]+$`);
    return regex.test(hostname);
  }
  
  return false;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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