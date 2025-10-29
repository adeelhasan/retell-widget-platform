# Retell Widget Platform

A multi-tenant SaaS platform for embedding Retell AI voice agents on websites through simple script tags.

## 🚀 Features

- **Multi-tenant Architecture**: Each user manages their own widgets
- **Simple Integration**: One-line script tag embedding  
- **Secure by Design**: Domain verification, rate limiting, and RLS
- **Modern UI**: Built with Next.js 14 + shadcn/ui
- **Real-time Auth**: Supabase authentication and database
- **Customizable Widgets**: Button text, metadata, and styling options

## 🏗️ Architecture

```
Frontend (Next.js)     Backend (API Routes)      Database (Supabase)
├── Dashboard          ├── /api/widgets          ├── auth.users
├── Authentication     ├── /api/widgets/[id]     └── public.widgets
├── Widget Management  └── /api/v1/register-call
└── Embed Generation   
                      
Widget (JavaScript)    Security Layer            
├── Auto-initialization├── Domain Verification   
├── State Management   ├── Rate Limiting        
├── API Integration    └── Input Validation     
└── Custom Styling     
```

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Retell AI account (for voice agents)

## 🛠️ Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd retell-widget-platform
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure Environment Variables**
   ```bash
   # Supabase (from your Supabase dashboard)
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Rate Limiting (optional - defaults shown)
   RATE_LIMIT_CALLS_PER_HOUR=10
   RATE_LIMIT_WINDOW_MS=3600000
   
   # Limits (optional - defaults shown)
   MAX_METADATA_SIZE_BYTES=1024
   MAX_WIDGETS_PER_USER=10
   MAX_WIDGET_NAME_LENGTH=100
   
   # Security (optional - defaults shown)
   ALLOWED_DEV_DOMAINS=localhost,*.vercel.app,*.netlify.app
   RETELL_API_TIMEOUT_MS=10000
   ```

4. **Database Setup**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the SQL from `database-setup.sql`

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🎨 Widget Integration

### Basic Widget
```html
<script 
  src="https://your-app.vercel.app/api/widget-simple" 
  data-widget-id="your-widget-id-from-dashboard">
</script>
```

### Widget with Custom Button Text and Metadata
```html
<script 
  src="https://your-app.vercel.app/api/widget-simple" 
  data-widget-id="your-widget-id-from-dashboard"
  data-button-text="Talk to Our AI Agent">
</script>
<form class="retell-metadata" data-widget-id="your-widget-id-from-dashboard">
  <input type="hidden" name="customer_name" value="John Smith">
  <input type="hidden" name="property_type" value="Condo">
  <input type="hidden" name="lead_source" value="Website">
</form>
```

### Complete Example
See `public/widget-example.html` for a complete working example with styling and multiple metadata fields.

## 🔒 Security Features

- **Domain Verification**: Widgets restricted to authorized domains
- **Rate Limiting**: Configurable per-widget call limits (see limitations below)
- **Row Level Security**: Database-level access control
- **Input Validation**: Server-side validation for all inputs

### Rate Limiting Limitations (Demo Project)

This is a **demo/MVP project** with in-memory rate limiting. Please be aware of these limitations:

**Current Implementation:**
- Rate limits are stored in-memory only (not in database)
- Sliding window algorithm (1-hour window by default)
- Applied to public widget endpoints: `/api/v1/register-call`, `/api/v1/outbound-call`, `/api/v1/phone-lookup`

**Known Limitations:**
1. ⚠️ **Server Restarts**: Rate limit data is lost on server restart/deployment
2. ⚠️ **Multi-Instance Deployments**: Each server instance has separate rate limits
   - Example: 10 calls/hour limit × 3 instances = 30 effective calls/hour
3. ⚠️ **No Audit Trail**: Call history is not logged to database
4. ⚠️ **No Manual Reset**: Dashboard doesn't have manual rate limit reset feature yet
5. ⚠️ **No Retry-After Info**: 429 responses don't include time until next available slot

**For Production Use:**
- Consider Redis-backed rate limiting for persistence and multi-instance support
- Add database logging for audit trails and compliance
- Implement rate limiting on all public endpoints
- Add manual reset feature in dashboard for customer support
- Consider additional bot protection (see Bot Protection section below)

### Bot Protection Strategies

**Current Protection:**
- Domain verification (prevents unauthorized domains)
- Rate limiting (limits abuse per widget)

**Additional Protection Options (Future):**
1. **Cloudflare Protection** (Recommended)
   - Enable on the page hosting the widget (customer's website)
   - Bot Fight Mode, Turnstile CAPTCHA, or WAF rules
   - Protects at CDN level before requests reach your API

2. **Optional Widget Password** (Future Feature)
   - Per-widget password configuration in dashboard
   - User must enter password before widget activates
   - Useful for semi-private demos or beta testing

3. **IP-Based Rate Limiting** (Future Enhancement)
   - Track calls per IP address in addition to widget ID
   - Prevents single attacker from rotating widget IDs

**Note**: As a demo project, basic domain verification + rate limiting provides reasonable protection. For production, implement layered security based on your threat model.

## 🧪 Testing

Visit `http://localhost:3000/widget-example.html` to see a complete integration example.

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run typecheck    # TypeScript validation
npm run lint         # Run ESLint
npm run pre-push     # Run pre-push checks (typecheck + build)
npm run setup-hooks  # Set up git hooks for automated checks
```

### 🛠️ Git Hooks
This project includes automated pre-push checks to prevent build failures:
- **Type checking** with TypeScript
- **Production build** validation
- **ESLint** warnings (non-blocking)

To set up git hooks after cloning:
```bash
npm run setup-hooks
```

The pre-push hook will run automatically before every `git push`. To bypass (not recommended):
```bash
git push --no-verify
```

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git remote add origin your-github-repo-url
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables (see .env.example)
   - Deploy

3. **Required Environment Variables in Vercel**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

### Post-Deployment
- Update widget test URLs to use your production domain
- Test widget functionality from external websites
- Configure custom domain if needed

## 🚀 Quick Start

1. Start the development server: `npm run dev`
2. Visit `http://localhost:3000` 
3. Sign up for an account
4. Create your first widget
5. Copy the embed code and test it

## 🔐 Authentication & Security

This project includes **standardized authentication utilities** to ensure proper Supabase RLS compliance and prevent common authentication issues.

### Key Authentication Files
- `src/lib/auth-server.ts` - Server-side authentication utilities
- `src/lib/with-auth.ts` - HOC wrappers for API routes  
- `docs/AUTHENTICATION.md` - **Complete authentication guide** (📖 **Copy this to future projects!**)

### Quick Auth Example
```typescript
// Clean, secure API route with authentication
import { withAuthAsync } from '@/lib/with-auth';

async function getWidget(request, { params }, { user, supabase }) {
  const { id } = await params;
  
  // RLS automatically enforced
  const { data } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
    
  return NextResponse.json(data);
}

export const GET = withAuthAsync(getWidget, { validateUUID: 'id' });
```

**→ See `docs/AUTHENTICATION.md` for complete patterns and troubleshooting guide**

## 📁 Key Files

- `src/app/dashboard/` - Widget management dashboard
- `src/app/api/` - REST API endpoints  
- `src/app/api/widget-simple/` - Embeddable widget script endpoint
- `public/widget-example.html` - Complete integration example
- `database-setup.sql` - Database schema
- `docs/AUTHENTICATION.md` - **Authentication best practices guide** 🔑
- `CLAUDE.md` - **Claude Code instructions for this project** 🤖

## 🛡️ Platform Limits

- **Widgets per User**: 10 (configurable)
- **Rate Limit**: 10 calls/hour per widget (configurable)  
- **Widget Name**: 100 characters max
- **Metadata Size**: 1024 bytes max

---

**Built with**: Next.js 14, TypeScript, Supabase, shadcn/ui, Tailwind CSS
