import { CONFIG } from './config';

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function validateWidgetName(name: string): boolean {
  return name.trim().length > 0 && name.length <= CONFIG.LIMITS.MAX_WIDGET_NAME_LENGTH;
}

export function validateDomain(domain: string): boolean {
  return validateDomainPattern(domain);
}

export function validateDomainPattern(domain: string): boolean {
  if (!domain || typeof domain !== 'string') return false;
  
  const trimmed = domain.trim();
  if (trimmed.length === 0) return false;
  
  // Handle full URLs - extract hostname
  let hostname = trimmed;
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      hostname = url.hostname;
    }
  } catch {
    return false;
  }
  
  // Special cases
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }
  
  // Wildcard patterns
  if (hostname.includes('*')) {
    return validateWildcardPattern(hostname);
  }
  
  // Regular hostname validation
  return validateHostname(hostname);
}

function validateWildcardPattern(pattern: string): boolean {
  // Only allow * at the beginning of domains
  if (!pattern.startsWith('*.')) return false;
  
  const afterWildcard = pattern.slice(2); // Remove '*.'
  
  // Pattern like *.domain.*
  if (afterWildcard.includes('*')) {
    // Only allow * at the end for TLD wildcard
    if (!afterWildcard.endsWith('.*')) return false;
    const domainPart = afterWildcard.slice(0, -2); // Remove '.*'
    return validateHostname(domainPart);
  }
  
  // Pattern like *.domain.com
  return validateHostname(afterWildcard);
}

function validateHostname(hostname: string): boolean {
  if (!hostname || hostname.length === 0) return false;
  
  // Basic hostname validation
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!hostnameRegex.test(hostname)) return false;
  
  // Must have at least one dot (except single words like localhost)
  if (!hostname.includes('.') && hostname !== 'localhost') {
    // Allow single-word domains like "x.ai" style without dots
    // But require at least 2 characters
    return hostname.length >= 2;
  }
  
  return true;
}

export function validateApiKey(apiKey: string): boolean {
  return apiKey.trim().length > 0 && apiKey.startsWith('key_');
}

export function validateAgentId(agentId: string): boolean {
  return agentId.trim().length > 0 && agentId.startsWith('agent_');
}

export function validateMetadata(metadata: unknown): boolean {
  if (!metadata) return true;
  
  try {
    const serialized = JSON.stringify(metadata);
    return serialized.length <= CONFIG.LIMITS.MAX_METADATA_SIZE;
  } catch {
    return false;
  }
}

export function generateEmbedCode(widgetId: string, buttonText?: string, metadata?: Record<string, unknown>): string {
  // Use the environment variable or fallback to localhost for development
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );
  
  let embedCode = `<script 
  src="${baseUrl}/api/widget-bundle" 
  data-widget-id="${widgetId}"`;
  
  if (buttonText && buttonText !== 'Start Voice Demo') {
    embedCode += `\n  data-button-text="${buttonText}"`;
  }
  
  if (metadata && Object.keys(metadata).length > 0) {
    embedCode += `\n  data-metadata='${JSON.stringify(metadata)}'`;
  }
  
  embedCode += '\n></script>';
  
  return embedCode;
}