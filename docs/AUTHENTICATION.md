# Supabase Authentication Best Practices for Next.js

This guide provides standardized authentication patterns for Next.js projects using Supabase with Row Level Security (RLS). Use this as a template for future projects to avoid common authentication pitfalls.

## 🚨 Common Authentication Problems

### The Problem: Inconsistent Auth Patterns
Most Supabase + Next.js projects fail because they mix different authentication patterns:

- ❌ Using client-side `supabase` instance in API routes
- ❌ Calling `supabase.auth.getUser(token)` incorrectly  
- ❌ Not creating proper server-side clients with user tokens
- ❌ RLS policies not seeing authenticated user context

### The Solution: Standardized Auth Utilities
This project includes reusable authentication utilities that ensure RLS works correctly.

## 📁 File Structure

```
src/lib/
├── supabase.ts           # Client-side instance (UI components)
├── supabase-server.ts    # Admin instance (service role key)
├── auth-server.ts        # ✨ Server-side auth utilities
└── with-auth.ts          # ✨ HOC wrappers for API routes
```

## 🔧 Authentication Patterns

### 1. Client-Side Authentication (UI Components)

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Usage in components
const { data: { user } } = await supabase.auth.getUser();
```

### 2. Server-Side Admin Operations

```typescript
// src/lib/supabase-server.ts  
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Usage: Admin operations that bypass RLS
const { data } = await supabaseAdmin.from('users').select('*');
```

### 3. Server-Side User Context (RLS Compliant) ✨

```typescript
// src/lib/auth-server.ts
import { authenticateRequest } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  
  if (isAuthError(authResult)) {
    return createAuthErrorResponse(authResult);
  }
  
  const { user, supabase } = authResult;
  
  // This query respects RLS policies
  const { data } = await supabase
    .from('widgets')
    .select('*')
    .eq('user_id', user.id); // RLS automatically filters this
}
```

## 🎯 HOC Pattern (Recommended)

### Simple Route with Authentication

```typescript
// src/app/api/widgets/route.ts
import { withSimpleAuth } from '@/lib/with-auth';

async function getWidgets(request: NextRequest, { user, supabase }: AuthContext) {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) throw error;
  return NextResponse.json(data);
}

export const GET = withSimpleAuth(getWidgets);
```

### Route with Dynamic Parameters

```typescript
// src/app/api/widgets/[id]/route.ts
import { withAuthAsync } from '@/lib/with-auth';

async function getWidget(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
  { user, supabase }: AuthContext
) {
  const { id } = await params;
  
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
    
  if (error) throw error;
  return NextResponse.json(data);
}

// Auto-validates UUID format
export const GET = withAuthAsync(getWidget, { validateUUID: 'id' });
```

### CRUD Operations Example

```typescript
// Complete CRUD with authentication
import { withAuthAsync } from '@/lib/with-auth';
import { UpdateWidgetRequest } from '@/lib/types';

// GET /api/widgets/[id]
async function getWidget(request, { params }, { user, supabase }) {
  const { id } = await params;
  
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
    
  if (error?.code === 'PGRST116') {
    return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
  }
  if (error) throw error;
  
  return NextResponse.json(data);
}

// PUT /api/widgets/[id]  
async function updateWidget(request, { params }, { user, supabase }) {
  const { id } = await params;
  const body: UpdateWidgetRequest = await request.json();
  
  const { data, error } = await supabase
    .from('widgets')
    .update(body)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
    
  if (error) throw error;
  return NextResponse.json(data);
}

// DELETE /api/widgets/[id]
async function deleteWidget(request, { params }, { user, supabase }) {
  const { id } = await params;
  
  const { error } = await supabase
    .from('widgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
    
  if (error) throw error;
  return NextResponse.json({ success: true });
}

export const GET = withAuthAsync(getWidget, { validateUUID: 'id' });
export const PUT = withAuthAsync(updateWidget, { validateUUID: 'id' });
export const DELETE = withAuthAsync(deleteWidget, { validateUUID: 'id' });
```

## 🛡️ RLS Policies

### Example RLS Policies for widgets table

```sql
-- Enable RLS
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own widgets
CREATE POLICY "Users can view own widgets" ON widgets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert widgets for themselves  
CREATE POLICY "Users can insert own widgets" ON widgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own widgets
CREATE POLICY "Users can update own widgets" ON widgets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own widgets
CREATE POLICY "Users can delete own widgets" ON widgets
  FOR DELETE USING (auth.uid() = user_id);
```

## 🔍 Debugging Authentication Issues

### Common Error Messages and Solutions

| Error | Cause | Solution |
|-------|--------|----------|
| "Widget not found" | RLS filtering out rows | Check if user owns the resource |
| "Unauthorized" | Missing/invalid token | Verify Authorization header format |
| "JWT expired" | Token expired | Refresh token on client-side |
| "Row not found" (PGRST116) | RLS policy blocking access | Verify RLS policies and user ownership |

### Debug Checklist

1. ✅ **Token present**: Check Authorization header exists and format is `Bearer <token>`
2. ✅ **Client creation**: Use `createAuthenticatedSupabaseClient(token)` pattern
3. ✅ **RLS policies**: Verify policies allow the operation for `auth.uid()`
4. ✅ **User ownership**: Ensure `user_id` field matches authenticated user
5. ✅ **Environment variables**: Verify SUPABASE_URL and ANON_KEY are set

### Logging for Debug

```typescript
// Add to auth-server.ts for debugging
console.log('Auth Debug:', {
  hasToken: !!token,
  tokenPrefix: token?.substring(0, 10) + '...',
  userId: user?.id,
  operation: 'CREATE/READ/UPDATE/DELETE'
});
```

## 🚀 Quick Start for New Projects

### 1. Copy Authentication Files
```bash
# Copy these files to your new project
cp src/lib/auth-server.ts new-project/src/lib/
cp src/lib/with-auth.ts new-project/src/lib/
cp AUTHENTICATION.md new-project/
```

### 2. Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Basic API Route Template
```typescript
// src/app/api/your-resource/route.ts
import { withSimpleAuth } from '@/lib/with-auth';

async function getResources(request, { user, supabase }) {
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('user_id', user.id);
    
  if (error) throw error;
  return NextResponse.json(data);
}

async function createResource(request, { user, supabase }) {
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('your_table')
    .insert({ ...body, user_id: user.id })
    .select()
    .single();
    
  if (error) throw error;
  return NextResponse.json(data, { status: 201 });
}

export const GET = withSimpleAuth(getResources);
export const POST = withSimpleAuth(createResource);
```

## 📝 TypeScript Types

```typescript
// Add to your types file
export interface AuthContext {
  user: User;
  supabase: ReturnType<typeof createClient>;
}

export interface AuthenticatedAPIHandler<T = any> {
  (
    request: NextRequest,
    context: { params: T },
    authContext: AuthContext
  ): Promise<NextResponse> | NextResponse;
}
```

## 🎯 Best Practices Summary

### ✅ DO
- Use `withAuth` or `withAuthAsync` HOCs for all authenticated routes
- Create server-side Supabase clients with user tokens for RLS compliance
- Validate UUIDs for route parameters
- Include user ownership checks in database queries
- Handle auth errors consistently with proper HTTP status codes

### ❌ DON'T  
- Use client-side `supabase` instance in API routes
- Call `supabase.auth.getUser(token)` with token parameter
- Skip authentication validation in API routes
- Bypass RLS unless absolutely necessary (use admin client sparingly)
- Duplicate authentication logic across routes

### 🔧 Migration from Old Pattern

```typescript
// ❌ OLD WAY (causes RLS issues)
import { supabase } from '@/lib/supabase';

export async function DELETE(request, { params }) {
  const token = request.headers.get('Authorization')?.split(' ')[1];
  const { user } = await supabase.auth.getUser(token); // WRONG!
  // RLS doesn't work properly...
}

// ✅ NEW WAY (RLS compliant)
import { withAuthAsync } from '@/lib/with-auth';

async function deleteWidget(request, { params }, { user, supabase }) {
  // RLS automatically enforced
  const { error } = await supabase
    .from('widgets')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);
}

export const DELETE = withAuthAsync(deleteWidget, { validateUUID: 'id' });
```

---

**Remember**: Consistent authentication patterns prevent 90% of Supabase RLS issues. Use this guide as your standard template for all future projects! 🎉