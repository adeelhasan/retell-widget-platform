# Retell Widget Platform

A multi-tenant SaaS platform for embedding Retell AI voice agents on websites through simple script tags.

## Why This Project?

[Retell AI](https://www.retellai.com/) provides powerful voice AI agents that can be embedded on websites. However, the traditional approach requires either:

1. **Exposing your API key client-side** (❌ security risk)
2. **Setting up your own backend server** (⏰ time-consuming, requires infrastructure)
3. **Managing authentication, rate limiting, and domain security yourself** (🛠️ complex)

**This platform solves all of that.** It provides a secure, hosted middleware layer that:

- ✅ **Keeps API keys server-side** - Your Retell API keys never touch the client
- ✅ **One-line integration** - Just add a `<script>` tag, no backend setup needed
- ✅ **Built-in security** - Domain verification, rate limiting, and optional password protection
- ✅ **Multi-tenant dashboard** - Manage multiple widgets for different websites
- ✅ **Production-ready** - Deploy to Vercel in minutes with Supabase backend

### How It Compares

| Approach | Security | Setup Time | Infrastructure |
|----------|----------|------------|----------------|
| **Client-side Retell SDK** | ❌ API keys exposed | ⚡ 5 min | None |
| **Custom backend** ([Retell docs](https://docs.retellai.com/get-started/web-voice-agent)) | ✅ Secure | ⏰ Hours/days | Required |
| **This Platform** | ✅ Secure | ⚡ 10 min | Managed (Vercel + Supabase) |

---

## 📖 Table of Contents

**Product Overview**
- [What You Can Build](#-what-you-can-build) - Four widget types explained
- [Smart Metadata System](#-smart-metadata-system) - Context passing
- [Platform Features](#-platform-features) - Core capabilities

**Getting Started**
- [Quick Start](#-quick-start) - Get running in 5 minutes
- [Widget Integration](#-widget-integration) - Embed code examples
- [Password Protection](#password-protected-widget) - Optional security

**Setup & Deployment**
- [Installation](#️-installation) - Full setup guide
- [Database Setup](#database-setup) - Schema installation
- [Deployment](#-deployment) - Deploy to Vercel

**Technical Reference**
- [Security Features](#-security-features) - Domain verification, rate limiting
- [Testing](#-testing) - Development and testing guide
- [Authentication](#-authentication--security) - API patterns
- [Key Files](#-key-files) - Important project files
- [Platform Limits](#️-platform-limits) - Quotas and constraints

---

## 🎯 What You Can Build

### Four Widget Types for Every Use Case

#### 🎤 Inbound Web - Browser Voice Chat
**Use Case**: Customer support, sales demos, interactive FAQs
**How It Works**: User clicks button → microphone activates → instant voice conversation in browser

```html
<script src="your-domain/api/widget-simple" data-widget-id="your-id"></script>
```

**Perfect For**:
- "Talk to Sales" buttons on landing pages
- Customer support chat alternatives
- Product demo scheduling
- Interactive help centers

---

#### 📞 Inbound Phone - Call Our Number
**Use Case**: Traditional phone support with AI answering
**How It Works**: Widget displays your phone number → user calls → AI agent answers

**Perfect For**:
- Business support lines
- Appointment scheduling by phone
- Order status inquiries
- 24/7 automated reception

---

#### 📱 Outbound Phone - We'll Call You
**Use Case**: Lead capture, callbacks, appointment reminders
**How It Works**: User enters phone number → AI calls them within seconds → personalized conversation

**Perfect For**:
- "Request callback" forms
- Lead qualification
- Appointment confirmations
- Customer surveys
- Demo bookings

**Bonus**: Automatically formats US phone numbers - users can enter `(555) 123-4567`, `555-123-4567`, or `5551234567`

---

#### 🔔 Outbound Web - Simulated Incoming Call
**Use Case**: Proactive engagement, urgent notifications
**How It Works**: Widget displays as "incoming call" → user answers in browser → agent delivers message

**Perfect For**:
- Flash sale notifications
- Abandoned cart recovery
- Limited-time offers
- VIP customer outreach
- Breaking news alerts

---

## 🎨 Smart Metadata System

### Automatic Context Passing

Your widgets can automatically pass page context to Retell agents using hidden form fields:

```html
<!-- Widget -->
<script src="your-domain/api/widget-simple" data-widget-id="abc123"></script>

<!-- Context form - automatically collected -->
<form class="retell-metadata" data-widget-id="abc123">
  <input type="hidden" name="customer_name" value="John Smith">
  <input type="hidden" name="product_interest" value="Enterprise Plan">
  <input type="hidden" name="cart_value" value="$299">
</form>
```

**Your agent receives**: All form values as `{{customer_name}}`, `{{product_interest}}`, `{{cart_value}}`

### Auto-Injected System Context

The platform automatically adds useful context to every call:

| Field | Description | Example |
|-------|-------------|---------|
| `page_url` | Current page URL | `https://example.com/pricing` |
| `page_title` | Browser page title | `"Pricing - Your Company"` |
| `timestamp` | When call started | `2025-01-15T10:30:00Z` |
| `user_agent` | Browser info | `Mozilla/5.0...` |
| `widget_version` | Widget version | `1.0.0` |

**Use in your agent prompt**:
```
User is viewing {{page_title}} at {{page_url}}.
Customer name: {{customer_name}}
```

### Widget-Level Defaults

Set default metadata values in the dashboard that apply to all calls from a widget. Page-level metadata overrides widget defaults.

**Example**: Set `lead_source: "Website Contact"` as default, then page can override with `lead_source: "Pricing Page"`.

---

## 🚀 Platform Features

- **Multi-tenant Architecture**: Each user manages their own widgets
- **One-Line Integration**: Just add a `<script>` tag - no backend needed
- **Secure by Design**: Domain verification, rate limiting, optional password protection
- **Daily Minutes Limits**: Control costs with per-widget daily minute caps
- **Modern Dashboard**: Built with Next.js 14 + shadcn/ui
- **Instant Auth**: Supabase authentication and database
- **Smart Metadata**: Auto-inject context from any webpage
- **Phone Normalization**: Auto-formats US numbers to E.164

---

## ⚡ Quick Start

**Get your first widget running in 5 minutes:**

1. **Deploy the platform** (one-time setup):
   - Fork this repo and deploy to [Vercel](https://vercel.com) (2 min)
   - Create a [Supabase](https://supabase.com) project (1 min)
   - Run `database-setup.sql` in Supabase SQL Editor (30 sec)
   - Add environment variables in Vercel (1 min)

2. **Create your first widget**:
   - Visit your deployed app → Sign up
   - Click "Create Widget" → Fill in:
     - Widget name (e.g., "Sales Demo")
     - Your Retell API key (from Retell dashboard)
     - Your Retell agent ID (e.g., `agent_abc123`)
     - Allowed domain (e.g., `example.com` or `localhost` for testing)
   - Copy the embed code

3. **Add to your website**:
   ```html
   <script
     src="https://your-app.vercel.app/api/widget-simple"
     data-widget-id="your-widget-id">
   </script>
   ```

**That's it!** Your voice AI is now live on your site.

---

## 🎨 Widget Integration

Now that you have the platform running, here's how to customize your widgets:

### Basic Widget
```html
<script 
  src="https://your-app.vercel.app/api/widget-simple" 
  data-widget-id="your-widget-id-from-dashboard">
</script>
```

### Widget with Custom Button Text and Metadata

Pass context to your Retell agent using a metadata form. The widget automatically collects these values and sends them securely through your middleware to Retell.

```html
<script
  src="https://your-app.vercel.app/api/widget-simple"
  data-widget-id="your-widget-id-from-dashboard"
  data-button-text="Talk to Our AI Agent">
</script>

<!-- Metadata form: Widget automatically reads hidden inputs -->
<form class="retell-metadata" data-widget-id="your-widget-id-from-dashboard">
  <input type="hidden" name="customer_name" value="John Smith">
  <input type="hidden" name="property_type" value="Condo">
  <input type="hidden" name="lead_source" value="Website">
  <input type="hidden" name="page_url" value="/contact">
</form>
```

**How it works:**
1. Widget finds form with `class="retell-metadata"` matching your widget ID
2. Extracts all hidden input values
3. Sends them server-side to your middleware
4. Middleware forwards to Retell as `retell_llm_dynamic_variables`
5. Use in your agent prompt: `{{customer_name}}`, `{{property_type}}`, etc.

**Dynamic values:**
```html
<script>
// Populate metadata from your contact form
document.getElementById('contactForm').addEventListener('submit', (e) => {
  document.querySelector('[name="customer_name"]').value = e.target.name.value;
  document.querySelector('[name="customer_email"]').value = e.target.email.value;
  // Widget reads updated values when call starts
});
</script>
```

### Password-Protected Widget

You can optionally protect widgets with an access code that users must enter before using the widget:

1. **Configure in Dashboard**:
   - Edit your widget
   - Toggle "Require Access Code" on
   - Set a password (4-50 characters)
   - Save the widget

2. **User Experience**:
   - When users try to use the widget, they'll see a password prompt
   - After entering the correct code, it's cached in their browser session
   - Incorrect codes are rejected with an error, allowing retry

3. **Use Cases**:
   - Semi-private demos (share password with specific clients)
   - Beta testing (limit access to testers)
   - Internal tools (add basic protection layer)
   - Time-limited campaigns (rotate passwords periodically)

**Note**: This is basic protection, not enterprise security. For sensitive use cases, combine with domain verification and consider additional authentication methods.

### Complete Example
See `public/widget-example.html` for a complete working example with styling and multiple metadata fields.

---

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) account
- A [Retell AI](https://www.retellai.com/) account

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/retell-web-agent-middleware.git
   cd retell-web-agent-middleware
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings → API
   - Copy your project URL and API keys

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Database Setup

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click "SQL Editor" in the left sidebar

2. **Run the schema**
   - Open `database-setup.sql` from this project
   - Copy all contents
   - Paste into Supabase SQL Editor
   - Click "Run"

This will create:
- `widgets` table with Row Level Security (RLS)
- Widget type enum
- All necessary constraints and indexes
- RLS policies for multi-tenant isolation

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

---

## 📖 Technical Reference

### 🔒 Security Features

- **Domain Verification**: Widgets restricted to authorized domains
- **Rate Limiting**: Configurable per-widget call limits (see limitations below)
- **Daily Minutes Limits**: Prevent budget overruns with daily minute caps (see below)
- **Row Level Security**: Database-level access control
- **Input Validation**: Server-side validation for all inputs

#### Daily Minutes Limit (Cost Control)

**What It Does:**
- Set a maximum total call minutes per day per widget
- Automatically blocks new calls once limit is reached
- Resets at midnight UTC
- Prevents budget overruns from unexpectedly long calls

**How It Works:**
1. Enable "Daily Minutes Limit" in widget settings
2. Set maximum minutes (e.g., 60 minutes = 1 hour/day)
3. Each call start is logged to database
4. Call durations are synced once daily at midnight UTC via cron job
5. Before starting new calls, system checks if today's total < limit

**Important Notes:**
- ⚠️ **Once-daily sync**: Call durations sync once per day (Vercel Hobby plan limitation)
- ✅ **Limits enforced at call-start**: New calls are blocked immediately when limit reached
- ✅ **Accurate tracking**: Durations fetched from Retell API for precision
- 🔄 **Auto-cleanup**: Old call logs deleted after 7 days (configurable via `CALL_LOGS_RETENTION_DAYS`)

**Example Use Case:**
- Set 120 minutes/day limit
- Your Retell plan costs $0.10/minute
- Maximum daily cost = $12 per widget
- Total protection from runaway costs

**Database Tables:**
- `call_logs`: Tracks all calls with duration and status
- `widgets.daily_minutes_limit`: Per-widget limit setting
- `widgets.daily_minutes_enabled`: Enable/disable toggle

**Configuration:**
```bash
# Optional environment variable (defaults to 7 days)
CALL_LOGS_RETENTION_DAYS=7

# Required for cron job authentication
CRON_SECRET=your-secure-random-string
```

**Cron Job Setup - Two Options:**

<details>
<summary><strong>Option A: Vercel Cron (Simple)</strong></summary>

The `vercel.json` file already configures a daily cron job. When you deploy:
- Vercel automatically registers the cron job
- Runs once daily at midnight UTC (Hobby plan)
- No additional setup needed

**Limitations:**
- Hobby plan: Once daily only
- Pro plan: Can run more frequently

</details>

<details>
<summary><strong>Option B: Supabase pg_cron (Recommended - Free & Flexible)</strong></summary>

Use Supabase's built-in cron (works on free tier, can run every 10 minutes):

1. **Enable the pg_cron extension** in Supabase:
```sql
-- Run once in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

2. **Schedule the cron job** to call your Vercel endpoint:
```sql
-- Schedule to run every 10 minutes
SELECT cron.schedule(
  'sync-call-durations',           -- Job name
  '*/10 * * * *',                  -- Every 10 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/cron/sync-call-durations',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer YOUR_CRON_SECRET'
    )
  );
  $$
);
```

3. **Verify it's scheduled:**
```sql
SELECT * FROM cron.job;
```

**To update the schedule:**
```sql
-- Unschedule old job
SELECT cron.unschedule('sync-call-durations');

-- Schedule with new frequency
SELECT cron.schedule(...);
```

**Advantages:**
- ✅ Free tier supports it
- ✅ Can run every 10 minutes (vs once daily on Vercel Hobby)
- ✅ More accurate usage tracking
- ✅ Native to your database

</details>

**Which should you use?**
- Start with **Vercel** (it's automatic)
- Upgrade to **Supabase pg_cron** when you want more frequent syncing

#### Rate Limiting Limitations (Demo Project)

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

#### Bot Protection Strategies

**Current Protection:**
- Domain verification (prevents unauthorized domains)
- Rate limiting (limits abuse per widget)
- Optional access code protection (password-protect widgets)

**Additional Protection Options (Future):**
1. **Cloudflare Protection** (Recommended)
   - Enable on the page hosting the widget (customer's website)
   - Bot Fight Mode, Turnstile CAPTCHA, or WAF rules
   - Protects at CDN level before requests reach your API

2. **IP-Based Rate Limiting** (Future Enhancement)
   - Track calls per IP address in addition to widget ID
   - Prevents single attacker from rotating widget IDs

**Note**: As a demo project, basic domain verification + rate limiting provides reasonable protection. For production, implement layered security based on your threat model.

### 🧪 Testing

Visit `http://localhost:3000/widget-example.html` to see a complete integration example with all widget types and metadata functionality.

**Testing Checklist:**
- Create widgets in dashboard for each widget type
- Test domain verification (authorized vs unauthorized domains)
- Test access code protection
- Test metadata passing from hidden form fields
- Test phone number normalization for outbound calls
- Verify rate limiting behavior

### 🔐 Authentication & Security

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

### 📁 Key Files

- `src/app/dashboard/` - Widget management dashboard
- `src/app/api/` - REST API endpoints
- `src/app/api/widget-simple/` - Embeddable widget script endpoint
- `public/widget-example.html` - Complete integration example
- `database-setup.sql` - **Complete database schema with all widget types** 📊
- `docs/AUTHENTICATION.md` - **Authentication best practices guide** 🔑
- `CLAUDE.md` - **Claude Code instructions for this project** 🤖

### 🛡️ Platform Limits

- **Widgets per User**: 10 (configurable)
- **Rate Limit**: 10 calls/hour per widget (configurable)  
- **Widget Name**: 100 characters max
- **Metadata Size**: 1024 bytes max

---

**Built with**: Next.js 14, TypeScript, Supabase, shadcn/ui, Tailwind CSS
