import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

export interface AuthContext {
  user: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any;
}

export interface AuthError {
  error: string;
  status: number;
}

/**
 * Creates a Supabase client with the user's authentication token
 * This is the correct pattern for RLS-compliant server-side operations
 */
export function createAuthenticatedSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
}

/**
 * Extracts and validates the authentication token from request headers
 */
export function extractAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}

/**
 * Authenticates a request and returns user context for RLS operations
 * This is the standardized authentication pattern for all API routes
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthContext | AuthError> {
  // Extract token from Authorization header
  const token = extractAuthToken(request);
  
  if (!token) {
    return {
      error: 'Missing or invalid Authorization header',
      status: 401
    };
  }
  
  // Create authenticated Supabase client
  const supabase = createAuthenticatedSupabaseClient(token);
  
  // Verify user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      error: 'Unauthorized - Invalid or expired token',
      status: 401
    };
  }
  
  return {
    user,
    supabase
  };
}

/**
 * Type guard to check if authentication result is an error
 */
export function isAuthError(result: AuthContext | AuthError): result is AuthError {
  return 'error' in result;
}

/**
 * Creates a standardized error response for authentication failures
 */
export function createAuthErrorResponse(authError: AuthError): NextResponse {
  return NextResponse.json(
    { error: authError.error },
    { status: authError.status }
  );
}

/**
 * Validates UUID format for route parameters
 * Common utility since most routes use UUID identifiers
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Creates a standardized error response for invalid UUIDs
 */
export function createInvalidUUIDResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Invalid ID format' },
    { status: 400 }
  );
}