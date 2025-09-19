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
  src="https://your-platform.com/widget.js" 
  data-widget-id="your-widget-id">
</script>
```

### Widget with Custom Button Text
```html
<script 
  src="https://your-platform.com/widget.js" 
  data-widget-id="your-widget-id"
  data-button-text="Talk to Our AI Agent">
</script>
```

### Widget with Metadata
```html
<script 
  src="https://your-platform.com/widget.js" 
  data-widget-id="your-widget-id"
  data-button-text="Get Property Information"
  data-metadata='{"property_id": "123", "user_type": "premium"}'>
</script>
```

## 🔒 Security Features

- **Domain Verification**: Widgets restricted to authorized domains
- **Rate Limiting**: Configurable per-widget call limits
- **Row Level Security**: Database-level access control
- **Input Validation**: Server-side validation for all inputs

## 🧪 Testing

Visit `http://localhost:3008/widget-demo.html` to test widget functionality.

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run typecheck    # TypeScript validation
npm run lint         # Run ESLint
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

## 📁 Key Files

- `src/app/dashboard/` - Widget management dashboard
- `src/app/api/` - REST API endpoints  
- `public/widget.js` - Embeddable widget script
- `public/widget-demo.html` - Demo page
- `database-setup.sql` - Database schema

## 🛡️ Platform Limits

- **Widgets per User**: 10 (configurable)
- **Rate Limit**: 10 calls/hour per widget (configurable)  
- **Widget Name**: 100 characters max
- **Metadata Size**: 1024 bytes max

---

**Built with**: Next.js 14, TypeScript, Supabase, shadcn/ui, Tailwind CSS
