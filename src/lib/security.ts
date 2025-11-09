import { CONFIG } from './config';
import { supabaseAdmin } from './supabase-server';

// Delimiter for storing multiple domains in a single column
const DOMAIN_DELIMITER = '|||';

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
  if (!origin || !allowedDomain) {
    console.log('❌ isAllowedDomain: Missing origin or allowedDomain', { origin, allowedDomain });
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const originHost = originUrl.hostname;
    console.log('🔍 isAllowedDomain parsing:', { origin, originHost, allowedDomain });

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

    console.log('🎯 Domain comparison:', { originHost, targetDomain, match: originHost === targetDomain });

    // Check wildcard patterns
    if (targetDomain.includes('*')) {
      return matchesWildcardPattern(originHost, targetDomain);
    }

    // Exact match
    if (originHost === targetDomain) {
      console.log('✅ Exact match succeeded');
      return true;
    }
    
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

/**
 * Check if origin is allowed by any of the domains in the allowedDomainsStr
 * Supports multiple domains separated by DOMAIN_DELIMITER (|||)
 * Backward compatible: works with single domain strings
 */
export function isAllowedDomains(origin: string, allowedDomainsStr: string): boolean {
  if (!origin || !allowedDomainsStr) {
    console.log('❌ isAllowedDomains: Missing origin or allowedDomainsStr', { origin, allowedDomainsStr });
    return false;
  }

  // Split by delimiter and trim each domain
  const domains = allowedDomainsStr
    .split(DOMAIN_DELIMITER)
    .map(d => d.trim())
    .filter(d => d.length > 0);

  console.log('🔍 isAllowedDomains: Checking origin against domains', { origin, domains });

  // Check each domain until one matches
  return domains.some(domain => isAllowedDomain(origin, domain));
}

/**
 * Database-backed rate limiter using call_logs table
 * This ensures rate limiting works reliably across serverless functions and server restarts
 */
export async function checkRateLimit(widgetId: string, limit: number = CONFIG.RATE_LIMITING.CALLS_PER_HOUR): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - CONFIG.RATE_LIMITING.WINDOW_MS);

  try {
    // Count calls in the time window
    const { count, error } = await supabaseAdmin
      .from('call_logs')
      .select('*', { count: 'exact', head: true })
      .eq('widget_id', widgetId)
      .gte('started_at', windowStart.toISOString());

    if (error) {
      console.error('🔒 Rate limit check error:', error);
      // On error, allow the call but log the issue
      return true;
    }

    const callCount = count ?? 0;

    console.log(`🔒 Rate limit check for widget ${widgetId}: ${callCount}/${limit} calls in the last hour`);

    // Check if limit exceeded
    return callCount < limit;

  } catch (error) {
    console.error('🔒 Rate limit check exception:', error);
    // On exception, allow the call to avoid blocking legitimate requests
    return true;
  }
}