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
  try {
    new URL(domain);
    return true;
  } catch {
    return false;
  }
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