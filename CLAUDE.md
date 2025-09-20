# Claude Code Instructions for Retell Widget Platform

This file contains project-specific instructions to help Claude Code understand the codebase and maintain consistency across development sessions.

## Project Overview

**Multi-Tenant Retell AI Widget SaaS Platform**
- Users create embeddable voice agent widgets for their websites
- Next.js 14 + Supabase + shadcn/ui architecture
- Focus: Security, simplicity, and RLS compliance

## Key Development Principles

### 1. Authentication Patterns
**ALWAYS USE** the standardized authentication utilities:
- `src/lib/auth-server.ts` - Server-side auth functions
- `src/lib/with-auth.ts` - HOC wrappers for API routes

**Example**: 
```typescript
// ✅ CORRECT - Use HOC pattern
export const GET = withAuthAsync(getWidget, { validateUUID: 'id' });

// ❌ WRONG - Manual auth handling
const token = request.headers.get('Authorization')?.split(' ')[1];
const { user } = await supabase.auth.getUser(token);
```

### 2. Supabase RLS Requirements
- **ALL database operations** must use user-scoped Supabase clients
- **NEVER** bypass RLS unless using admin operations
- **ALWAYS** include `user_id` filters in queries
- **Reference**: See `AUTHENTICATION.md` for complete patterns

### 3. File Organization
```
src/
├── app/                     # Next.js 14 App Router
│   ├── api/                # API routes (use auth utilities)
│   ├── dashboard/          # Main dashboard pages
│   └── [other-pages]/      
├── components/             # UI components
│   ├── ui/                # shadcn/ui components
│   ├── layouts/           # Layout components
│   ├── sections/          # Page sections
│   └── features/          # Business logic components
├── lib/                   # Utilities and configuration
│   ├── auth-server.ts     # ⭐ Authentication utilities
│   ├── with-auth.ts       # ⭐ API route wrappers
│   ├── supabase.ts        # Client-side Supabase
│   ├── supabase-server.ts # Admin Supabase
│   ├── config.ts          # Global configuration
│   └── types.ts           # TypeScript types
└── docs/                  # Documentation
```

### 4. Component Architecture
- **Layout Components**: Header, Navigation, AppLayout
- **Section Components**: PageHeader, WidgetGrid, EmptyState
- **Feature Components**: WidgetCard, WidgetForm, modals
- **UI Components**: shadcn/ui primitives

### 5. TypeScript Standards
- **Use strict typing** for all components and API routes
- **Define interfaces** in `src/lib/types.ts`
- **Export types** for reuse across components
- **Use `Record<string, string>`** instead of `any` for route params

## Critical Security Requirements

### Domain Verification
- **ALL widget operations** must verify origin domain
- **Use** `isAllowedDomain()` function in `src/lib/security.ts`
- **Block unauthorized domains** with 403 status

### Rate Limiting
- **Apply rate limiting** to widget call endpoints
- **Use** `checkRateLimit()` function
- **Configurable** per-widget limits

### Input Validation
- **Validate ALL inputs** on both client and server
- **Use** validation functions in `src/lib/utils-helpers.ts`
- **Return 400** for invalid inputs with descriptive errors

## Database Schema (Supabase)

### Users Table
- Managed by Supabase Auth automatically
- RLS enabled by default

### Widgets Table
```sql
widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  retell_api_key text not null, -- encrypted by Supabase
  agent_id text not null,
  allowed_domain text not null,
  button_text text default 'Start Voice Demo',
  rate_limit_calls_per_hour integer,
  rate_limit_enabled boolean default true,
  created_at timestamp default now()
)
```

### RLS Policies
```sql
-- Users can only access their own widgets
CREATE POLICY "Users can manage own widgets" ON widgets 
FOR ALL USING (auth.uid() = user_id);
```

## API Patterns

### Protected Routes (Auth Required)
```typescript
// Use withAuthAsync for routes with params
export const GET = withAuthAsync(getWidget, { validateUUID: 'id' });
export const PUT = withAuthAsync(updateWidget, { validateUUID: 'id' });
export const DELETE = withAuthAsync(deleteWidget, { validateUUID: 'id' });

// Use withSimpleAuth for routes without params
export const GET = withSimpleAuth(getWidgets);
export const POST = withSimpleAuth(createWidget);
```

### Public Routes
```typescript
// Domain verification required
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!isAllowedDomain(origin, widget.allowed_domain)) {
    return NextResponse.json({ error: 'Domain not authorized' }, { status: 403 });
  }
  // ... rest of logic
}
```

## Widget Implementation

### Embed Pattern
```html
<script 
  src="https://your-domain.vercel.app/api/widget-simple"
  data-widget-id="uuid-here"
  data-button-text="Custom Button Text">
</script>

<!-- Optional metadata -->
<form class="retell-metadata" data-widget-id="uuid-here">
  <input type="hidden" name="property_id" value="123">
  <input type="hidden" name="lead_source" value="Website">
</form>
```

### Metadata Collection
- **Form-based**: Use hidden inputs with `retell-metadata` class
- **Structured**: Associate with widget ID via `data-widget-id`
- **Validation**: Limit size to `MAX_METADATA_SIZE_BYTES`

## Common Pitfalls to Avoid

### ❌ Authentication Anti-Patterns
```typescript
// DON'T: Use client-side supabase in API routes
import { supabase } from '@/lib/supabase';
const { user } = await supabase.auth.getUser(token);

// DON'T: Skip user_id filtering
const { data } = await supabase.from('widgets').select('*');

// DON'T: Manual auth boilerplate
const authHeader = request.headers.get('Authorization');
// ... 50 lines of auth code
```

### ✅ Correct Patterns
```typescript
// DO: Use auth utilities
export const GET = withAuthAsync(getWidget, { validateUUID: 'id' });

// DO: Include user filtering
const { data } = await supabase
  .from('widgets')
  .select('*')
  .eq('user_id', user.id);
```

## Environment Variables

### Required for Development
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Configuration
```bash
RATE_LIMIT_CALLS_PER_HOUR=10
MAX_WIDGETS_PER_USER=10
MAX_WIDGET_NAME_LENGTH=100
ALLOWED_DEV_DOMAINS=localhost,*.vercel.app
```

## Testing Requirements

### Before Deployment
1. **Run build**: `npm run build` - must pass without errors
2. **Test auth flows**: Login, widget CRUD, domain verification
3. **Test widget embedding**: Verify widget loads and functions
4. **Check RLS**: Ensure users only see their own widgets

### Widget Testing
1. **Create widget** with proper domain in dashboard
2. **Update example HTML** with real widget ID
3. **Test on authorized domain** - should work
4. **Test on unauthorized domain** - should fail with 403

## Documentation References

- **Authentication**: `docs/AUTHENTICATION.md` - Complete auth patterns
- **Requirements**: `docs/retell_widget_requirements.md` - Original spec
- **API Routes**: See individual route files for endpoint docs
- **Components**: See component files for prop interfaces

## Development Workflow

1. **Plan changes** - Use TodoWrite tool for complex tasks
2. **Follow auth patterns** - Never deviate from established patterns
3. **Test builds** - Always verify with `npm run build`
4. **Update types** - Add/modify interfaces in `src/lib/types.ts`
5. **Document changes** - Update relevant docs if adding new patterns

## Quick Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build               # Test production build
npm run typecheck           # TypeScript validation

# Authentication Testing
# 1. Create widget in dashboard
# 2. Test CRUD operations
# 3. Verify domain restrictions

# Widget Testing  
# 1. Update widget-example.html with real widget ID
# 2. Test on localhost:3000/widget-example.html
# 3. Test domain authorization
```

---

**Remember**: This project prioritizes security and maintainability. Always use the established authentication patterns and never bypass RLS unless absolutely necessary with admin operations.