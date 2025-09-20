import { NextRequest, NextResponse } from 'next/server';
import { 
  authenticateRequest, 
  isAuthError, 
  createAuthErrorResponse,
  validateUUID,
  createInvalidUUIDResponse,
  AuthContext 
} from './auth-server';

type RouteHandler<T = Record<string, string>> = (
  request: NextRequest,
  context: { params: T },
  authContext: AuthContext
) => Promise<NextResponse> | NextResponse;

type RouteHandlerWithPromiseParams<T = Record<string, string>> = (
  request: NextRequest,
  context: { params: Promise<T> },
  authContext: AuthContext
) => Promise<NextResponse> | NextResponse;

/**
 * Higher-order function that wraps API route handlers with authentication
 * This eliminates boilerplate auth code and ensures consistent auth patterns
 * 
 * @param handler - The route handler function that requires authentication
 * @param options - Optional configuration for the auth wrapper
 */
export function withAuth<T = Record<string, string>>(
  handler: RouteHandler<T>,
  options: {
    validateUUID?: keyof T; // Field name to validate as UUID
  } = {}
) {
  return async (
    request: NextRequest,
    context: { params: T }
  ): Promise<NextResponse> => {
    try {
      // Authenticate the request
      const authResult = await authenticateRequest(request);
      
      if (isAuthError(authResult)) {
        return createAuthErrorResponse(authResult);
      }
      
      // Validate UUID if specified
      if (options.validateUUID && context.params) {
        const idValue = context.params[options.validateUUID] as string;
        if (idValue && !validateUUID(idValue)) {
          return createInvalidUUIDResponse();
        }
      }
      
      // Call the actual handler with auth context
      return await handler(request, context, authResult);
      
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Variant for Next.js 14+ routes where params is a Promise
 * This handles the new async params pattern in App Router
 */
export function withAuthAsync<T = Record<string, string>>(
  handler: RouteHandlerWithPromiseParams<T>,
  options: {
    validateUUID?: keyof T; // Field name to validate as UUID
  } = {}
) {
  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    try {
      // Authenticate the request
      const authResult = await authenticateRequest(request);
      
      if (isAuthError(authResult)) {
        return createAuthErrorResponse(authResult);
      }
      
      // Resolve params and validate UUID if specified
      if (options.validateUUID) {
        const resolvedParams = await context.params;
        const idValue = resolvedParams[options.validateUUID] as string;
        if (idValue && !validateUUID(idValue)) {
          return createInvalidUUIDResponse();
        }
      }
      
      // Call the actual handler with auth context
      return await handler(request, context, authResult);
      
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Simple wrapper for routes that just need authentication without params
 */
export function withSimpleAuth(
  handler: (request: NextRequest, authContext: AuthContext) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Authenticate the request
      const authResult = await authenticateRequest(request);
      
      if (isAuthError(authResult)) {
        return createAuthErrorResponse(authResult);
      }
      
      // Call the actual handler with auth context
      return await handler(request, authResult);
      
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Type-safe helper for extracting route parameters
 * Useful when working with dynamic routes like [id] or [slug]
 */
export async function getRouteParams<T>(params: Promise<T>): Promise<T> {
  return await params;
}