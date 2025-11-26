# Retell Widget Platform

A multi-tenant SaaS platform for embedding Retell AI voice agents on websites through simple script tags. **Send dynamic context from your webpages to voice agents** - no backend coding required.

## Why This Project?

[Retell AI](https://www.retellai.com/) provides powerful voice AI agents for phone and web. While Retell offers a [chat widget](https://docs.retellai.com/deploy/chat-widget) that works with public keys (client-side), **web voice calls require API keys** which must be kept server-side for security.

**The challenge:** Embedding web voice agents requires:

1. **Backend infrastructure** - Set up a server to securely create web calls
2. **API security** - Protect your Retell API key (can't be exposed client-side)
3. **Custom implementation** - Build domain verification, rate limiting, metadata handling yourself

**This platform solves all of that.** It provides a secure, multi-tenant middleware layer that:

- ✅ **Keeps API keys server-side** - Your Retell API keys never touch the client
- ✅ **One-line integration** - Just add a `<script>` tag, no backend coding needed
- 🌟 **Dynamic metadata passing** - Auto-inject page context into voice calls (customer name, product details, cart value, etc.)
- ✅ **Built-in security** - Domain verification, database-backed rate limiting, optional password protection
- ✅ **Multi-tenant dashboard** - Manage multiple widgets for different websites
- ✅ **Production-ready** - Deploy to Vercel in minutes with Supabase backend

### How It Compares

| Approach | API Security | Dynamic Metadata | Setup Time | Infrastructure |
|----------|--------------|------------------|------------|----------------|
| **Retell Chat Widget** | ✅ Public key (safe) | ✅ Via data attributes | ⚡ 5 min | None |
| **DIY Backend** ([Retell docs](https://docs.retellai.com/api-references/create-web-call)) | ✅ Secure | ⚠️ Custom code required | ⏰ Hours/days | Required |
| **This Platform** | ✅ Secure | ✅ **Built-in & easy** | ⚡ 10 min | Managed (Vercel + Supabase) |

---

## 📖 Table of Contents

**Product Overview**
- [What You Can Build](#-what-you-can-build) - Four widget types explained
- [Smart Metadata System](#-smart-metadata-system) - Context passing
- [Platform Features](#-platform-features) - Core capabilities

**Getting Started**
- [Quick Start](#-quick-start) - Get running in 5 minutes
- [Widget Integration](#-widget-integration) - Embed code examples
- [Widget Customization](#-widget-customization) - Styling and appearance
- [Site Builder Integration](#-site-builder-integration) - Wix, Squarespace, Webflow
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

Four widget types for different engagement scenarios:

| Widget Type | Use Case | How It Works | Perfect For |
|-------------|----------|--------------|-------------|
| 🎤 **Inbound Web** | Browser voice chat | Click button → instant voice conversation | Sales demos, support, product help |
| 📞 **Inbound Phone** | Traditional phone support | Display number → user calls → AI answers | 24/7 reception, appointment scheduling |
| 📱 **Outbound Phone** | We'll call you | User enters number → AI calls within seconds | Lead capture, callbacks, surveys |
| 🔔 **Outbound Web** | Simulated incoming call | Widget rings → user answers → message delivered | Flash sales, cart recovery, VIP outreach |

**All widgets support**:
- Dynamic metadata injection (customer name, product details, etc.)
- Customizable styling and branding
- Domain verification and rate limiting
- Optional password protection

---

## 🎨 Smart Metadata System

### 🌟 Unique to This Platform: Dynamic Context Passing

**Unlike Retell's native widgets**, this platform lets you pass custom metadata from your webpage directly to your voice agent. This enables truly personalized conversations based on user context.

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

### Real-World Example

**E-commerce Product Support:**
```html
<form class="retell-metadata" data-widget-id="abc123">
  <input type="hidden" name="customer_name" value="Sarah">
  <input type="hidden" name="product_name" value="Pro Camera Lens">
  <input type="hidden" name="cart_total" value="$849">
  <input type="hidden" name="loyalty_tier" value="Gold Member">
</form>
```
*Agent greeting*: "Hello {{customer_name}}! I see you're interested in the {{product_name}}. As a {{loyalty_tier}}, you qualify for free expedited shipping!"

<details>
<summary><strong>More examples: Real Estate, Lead Generation</strong></summary>

**Real Estate:**
```html
<form class="retell-metadata" data-widget-id="abc123">
  <input type="hidden" name="property_address" value="123 Oak Street">
  <input type="hidden" name="listing_price" value="$650,000">
  <input type="hidden" name="bedrooms" value="3">
</form>
```
*Agent*: "I'm calling about {{property_address}}, the {{bedrooms}} bedroom home listed at {{listing_price}}..."

**Lead Generation:**
```html
<form class="retell-metadata" data-widget-id="abc123">
  <input type="hidden" name="company_name" value="TechCorp Inc">
  <input type="hidden" name="plan_interest" value="Enterprise">
  <input type="hidden" name="referral_source" value="LinkedIn Ad">
</form>
```
*Agent*: "Thanks for your interest from {{company_name}}! I see you came from {{referral_source}}..."

</details>

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

## 🎨 Widget Customization

Customize widget appearance using **data attributes** (simple) or **CSS variables** (advanced).

**Quick example (data attributes):**
```html
<script src="..." data-widget-id="..."
  data-button-bg="#10b981"
  data-button-color="white"
  data-button-radius="20px">
</script>
```

<details>
<summary><strong>All customization options</strong></summary>

### Method 1: Data Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-button-bg` | Background (solid/gradient) | `#10b981` or `linear-gradient(...)` |
| `data-button-color` | Text color | `white` |
| `data-button-radius` | Border radius | `20px` |
| `data-button-padding` | Padding | `14px 28px` |
| `data-button-font-size` | Font size | `16px` |
| `data-modal-z-index` | Modal z-index | `99999` |
| `data-font-family` | Font family | `'Arial', sans-serif` |

### Method 2: CSS Variables (Advanced)

```html
<style>
  :root {
    --retell-widget-button-bg: #10b981;
    --retell-widget-button-color: white;
    --retell-widget-button-radius: 20px;
    /* 20+ more variables available */
  }
</style>
```

**Available CSS variables:** button (bg, color, hover, radius, padding, font-size, font-weight, shadow), modal (bg, border-radius, shadow, z-index), form (input-border, input-focus-border, input-radius), colors (primary, error, success), typography (font-family)

### Method 3: Dashboard Defaults

Set button text and default metadata in dashboard (applies to all instances).

</details>

**No CSS conflicts:** Uses unique `.rtl-w-*` class prefixes and scoped reset—safe to use with any framework.

---

## 🏗️ Site Builder Integration

For **Wix, Squarespace, Webflow, Framer**, etc. that separate `<head>` and `<body>` content.

**Two-step setup:**

1. **Add to site header** (Settings → Custom Code):
   ```html
   <script src="https://your-app.vercel.app/widget.js"></script>
   ```

2. **Add where you want it** (HTML block/embed):
   ```html
   <div data-retell-widget="your-widget-id"></div>
   ```

**Customization:** Add data attributes or inline styles to the div:
```html
<div data-retell-widget="..."
  data-button-text="Call Us"
  data-button-bg="#10b981"
  style="max-width: 250px;">
</div>
```

<details>
<summary><strong>Platform-specific instructions: Wix • Squarespace • Webflow • Framer</strong></summary>

### Wix
1. Settings → Custom Code → Add widget.js script in `<head>` → Apply
2. Add "HTML iframe" element → Paste div code → Resize

### Squarespace
1. Settings → Advanced → Code Injection → Paste in "Header" → Save
2. Add "Code Block" → Paste div code → Adjust size

### Webflow
1. Project Settings → Custom Code → Paste in "Head Code" → Save
2. Add "Embed" element → Paste div code → Set size → Publish

### Framer
1. Page Settings → "Start of `<head>` tag" → Paste script
2. Add "Code" component → Paste div code → Resize

</details>

**Benefits:** Script loads once, supports multiple widgets, easier for non-technical users.

**Backwards compatible:** Original inline `<script>` method still works for custom sites.

---

## 🛠️ Setup & Deployment

### Prerequisites
- Node.js 18+ and npm
- [Supabase](https://supabase.com) account
- [Retell AI](https://www.retellai.com/) account

### Quick Deploy to Production

1. **Fork and deploy to Vercel**
   - Fork this repository
   - Visit [vercel.com](https://vercel.com) and import your fork
   - Deploy (Vercel will auto-detect Next.js)

2. **Set up Supabase database**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor
   - Copy contents of `database-setup.sql` from this repo
   - Paste and run in SQL Editor

3. **Configure environment variables in Vercel**
   - Go to your Vercel project → Settings → Environment Variables
   - Add these values (find in Supabase: Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
   - Redeploy to apply environment variables

4. **Start creating widgets**
   - Visit your deployed URL
   - Sign up for an account
   - Create your first widget with your Retell agent ID

### Local Development Setup

```bash
# Clone and install
git clone https://github.com/your-username/retell-web-agent-middleware.git
cd retell-web-agent-middleware
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Set up git hooks (optional but recommended)
npm run setup-hooks

# Start development server
npm run dev
```

**Development commands:**
```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Test production build
npm run typecheck    # TypeScript validation
npm run lint         # Run ESLint
```

**Git hooks** (automated pre-push checks):
- TypeScript type checking
- Production build validation
- Prevents broken code from being pushed

---

## 📖 Technical Reference

### 🔒 Security Features

**Core Security:**
- **Domain Verification** - Restrict widgets to authorized domains only
- **Rate Limiting** - Database-backed, configurable per-widget (default: 10 calls/hour)
- **Daily Minutes Limits** - Budget control with daily minute caps
- **Password Protection** - Optional access codes for semi-private widgets
- **Row Level Security** - Database-level multi-tenant isolation

<details>
<summary><strong>Daily Minutes Limit (Cost Control)</strong></summary>

**What it does:**
- Set max daily call minutes per widget (e.g., 120 min/day = max $12/day at $0.10/min)
- Automatically blocks new calls when limit reached
- Resets at midnight UTC
- Call durations synced every 10 minutes via Supabase pg_cron

**Setup:**
1. Enable in widget settings and set minute limit
2. Configure environment variable: `CRON_SECRET=your-secret`
3. Enable Supabase extensions and schedule cron job:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule sync (every 10 minutes)
SELECT cron.schedule(
  'sync-call-durations',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/cron/sync-call-durations',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
  $$
);
```

**Database tables:** `call_logs`, `widgets.daily_minutes_limit`, `widgets.daily_minutes_enabled`

</details>

<details>
<summary><strong>Rate Limiting Details</strong></summary>

**Implementation:**
- Database-backed using `call_logs` table (survives restarts, multi-instance safe)
- Sliding window algorithm (default: 1-hour window)
- Race condition prevention (rapid clicks blocked)
- Per-widget configuration in dashboard

**Configuration:**
```bash
RATE_LIMIT_CALLS_PER_HOUR=10      # Global default
RATE_LIMIT_WINDOW_MS=3600000      # 1 hour
```

**Per-widget overrides:** Set custom limits in dashboard (0 = use default)

</details>

<details>
<summary><strong>Bot Protection & Additional Security</strong></summary>

**Current protection:**
- Domain verification
- Rate limiting
- Optional access codes

**Recommended additions for production:**
- **Cloudflare** on widget host page (Bot Fight Mode, Turnstile CAPTCHA)
- **IP-based rate limiting** (future enhancement)

**Note:** As a demo/starter project, current security provides reasonable protection. Scale security based on your threat model.

</details>

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
- `src/app/api/widget-simple/` - Embeddable widget script endpoint (primary)
- `src/app/api/widget-bundle/` - Legacy endpoint (redirects to widget-simple)
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
