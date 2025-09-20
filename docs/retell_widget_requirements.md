# WIDGET_EMBEDDINGS_SPEC.md

**Project**: Multi-Tenant Retell AI Widget SaaS  
**Version**: 2.1 (Final Implementation Spec)  
**Date**: September 15, 2025  
**Target**: Claude Code Implementation

## Project Overview

A multi-tenant SaaS platform allowing users to embed Retell AI voice agents on their websites through a simple script tag. Emphasizes simplicity, rapid development, and clean architecture for future design system integration.

## Tech Stack

- **Frontend**: Next.js 14+ with App Router
- **UI Framework**: shadcn/ui (Tailwind CSS + Radix UI primitives)
- **Database**: Supabase (with built-in auth, encryption, RLS)
- **Hosting**: Vercel
- **Widget**: Vanilla JavaScript with configurable parameters
- **Icons**: Lucide React

## Core User Journey

1. **Sign Up**: User creates account via Supabase Auth
2. **Configure**: User creates widget with Retell credentials and domain
3. **Embed**: Platform provides `<script>` tag with customizable options  
4. **Deploy**: User adds script to their website
5. **Demo**: Visitors interact with voice agent

## Database Schema (Supabase)

### Users Table
```sql
-- Handled automatically by Supabase Auth
users (
  id uuid primary key,
  email text unique,
  created_at timestamp
)
```

### Widgets Table
```sql
widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  retell_api_key text not null, -- encrypted by Supabase
  agent_id text not null,
  allowed_domain text not null, -- one domain per widget
  button_text text default 'Start Voice Demo',
  rate_limit_calls_per_hour integer, -- null = use global default
  rate_limit_enabled boolean default true,
  created_at timestamp default now()
)
```

### Row Level Security (RLS) Policies
```sql
-- Enable RLS
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

-- Users can only access their own widgets
CREATE POLICY "Users can manage own widgets" ON widgets 
FOR ALL USING (auth.uid() = user_id);
```

## Global Configuration

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Rate Limiting
RATE_LIMIT_CALLS_PER_HOUR=10
RATE_LIMIT_WINDOW_MS=3600000

# Limits
MAX_METADATA_SIZE_BYTES=1024
MAX_WIDGETS_PER_USER=10
MAX_WIDGET_NAME_LENGTH=100

# Security
ALLOWED_DEV_DOMAINS=localhost,*.vercel.app,*.netlify.app
RETELL_API_TIMEOUT_MS=10000
```

### Configuration Module
```javascript
// /lib/config.js
export const CONFIG = {
  RATE_LIMITING: {
    CALLS_PER_HOUR: parseInt(process.env.RATE_LIMIT_CALLS_PER_HOUR) || 10,
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 3600000
  },
  LIMITS: {
    MAX_METADATA_SIZE: parseInt(process.env.MAX_METADATA_SIZE_BYTES) || 1024,
    MAX_WIDGETS_PER_USER: parseInt(process.env.MAX_WIDGETS_PER_USER) || 10,
    MAX_WIDGET_NAME_LENGTH: parseInt(process.env.MAX_WIDGET_NAME_LENGTH) || 100
  },
  SECURITY: {
    ALLOWED_DEV_DOMAINS: process.env.ALLOWED_DEV_DOMAINS?.split(',') || ['localhost'],
    RETELL_TIMEOUT_MS: parseInt(process.env.RETELL_API_TIMEOUT_MS) || 10000
  }
}
```

## API Endpoints

### Protected Routes (Supabase Auth Required)
```
GET /api/widgets
  - List user's widgets
  - Returns: Array of widget objects

POST /api/widgets  
  - Create new widget
  - Body: { name, retell_api_key, agent_id, allowed_domain, button_text? }
  - Returns: Created widget object

DELETE /api/widgets/[id]
  - Delete specific widget
  - Returns: Success confirmation
```

### Public Routes
```
POST /api/v1/register-call
  - Register call with Retell AI
  - Body: { widget_id, metadata? }
  - Headers: Origin (for domain verification)
  - Returns: { call_id } or error
```

## UI Architecture & Components

### Setup Requirements
```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add required components
npx shadcn-ui@latest add button input label card navigation-menu
npx shadcn-ui@latest add dialog form select textarea
```

### Layout Components

#### AppLayout (Main Shell)
```jsx
// /components/layouts/AppLayout.js
import { Header } from './Header'
import { Navigation } from './Navigation'

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

#### Header Component
```jsx
// /components/layouts/Header.js
import { Button } from '@/components/ui/button'
import { UserMenu } from './UserMenu'

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Retell Widget Platform</h1>
        </div>
        <UserMenu />
      </div>
    </header>
  )
}
```

#### Navigation Component
```jsx
// /components/layouts/Navigation.js
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu'

export function Navigation() {
  return (
    <NavigationMenu className="border-b">
      <div className="container px-4">
        <NavigationMenuItem>
          <NavigationMenuLink href="/dashboard">Widgets</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/settings">Settings</NavigationMenuLink>
        </NavigationMenuItem>
      </div>
    </NavigationMenu>
  )
}
```

### Feature Sections (Composable)

#### Page Header
```jsx
// /components/sections/PageHeader.js
export function PageHeader({ title, description, action }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </section>
  )
}
```

#### Widget Grid
```jsx
// /components/sections/WidgetGrid.js
export function WidgetGrid({ widgets }) {
  return (
    <section>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {widgets.map((widget) => (
          <WidgetCard key={widget.id} widget={widget} />
        ))}
      </div>
    </section>
  )
}
```

#### Empty State
```jsx
// /components/sections/EmptyState.js
import { Button } from '@/components/ui/button'

export function EmptyState({ title, description, action }) {
  return (
    <section className="text-center py-12">
      <div className="mx-auto max-w-md">
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </section>
  )
}
```

### Business Logic Components

#### Widget Card
```jsx
// /components/features/WidgetCard.js
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Copy, Edit, Trash } from 'lucide-react'

export function WidgetCard({ widget }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{widget.name}</CardTitle>
        <WidgetMenu widgetId={widget.id} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <p>Domain: {widget.allowed_domain}</p>
          <p>Agent ID: {widget.agent_id}</p>
          <p>Created: {formatDate(widget.created_at)}</p>
        </div>
        <Button variant="outline" size="sm" className="w-full">
          <Copy className="mr-2 h-4 w-4" />
          Copy Embed Code
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### Widget Form
```jsx
// /components/features/WidgetForm.js
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function WidgetForm({ widget, onSubmit, onCancel }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{widget ? 'Edit Widget' : 'Create New Widget'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Widget Name</Label>
            <Input id="name" placeholder="My Voice Demo Widget" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">Retell API Key</Label>
            <Input id="apiKey" type="password" placeholder="key_..." />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID</Label>
            <Input id="agentId" placeholder="agent_..." />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="domain">Allowed Domain</Label>
            <Input id="domain" type="url" placeholder="https://example.com" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="buttonText">Button Text</Label>
            <Input id="buttonText" defaultValue="Start Voice Demo" />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {widget ? 'Update Widget' : 'Create Widget'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
```

## Page Compositions

### Dashboard Page
```jsx
// /app/dashboard/page.js
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/sections/PageHeader'
import { WidgetGrid } from '@/components/sections/WidgetGrid'
import { EmptyState } from '@/components/sections/EmptyState'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const widgets = useWidgets()

  const headerAction = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create Widget
    </Button>
  )

  return (
    <AppLayout>
      <PageHeader 
        title="Your Widgets"
        description="Manage and deploy your Retell AI voice agents"
        action={headerAction}
      />
      
      {widgets.length > 0 ? (
        <WidgetGrid widgets={widgets} />
      ) : (
        <EmptyState
          title="No widgets yet"
          description="Create your first widget to get started with voice AI demos"
          action={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Widget
            </Button>
          }
        />
      )}
    </AppLayout>
  )
}
```

### Authentication Pages
```jsx
// /app/login/page.js
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign in to your account</h2>
          <p className="mt-2 text-muted-foreground">
            Or create a new account to get started
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          redirectTo={`${window.location.origin}/dashboard`}
        />
      </div>
    </div>
  )
}
```

## Widget Implementation

### Embeddable Widget Structure
```html
<!-- Embed Code for Users -->
<script 
  src="https://yourplatform.com/widget.js" 
  data-widget-id="uuid-here"
  data-button-text="Talk to Our AI Agent"
  data-metadata='{"property_id": "123", "user_phone": "+1234567890"}'
></script>
```

### Widget JavaScript (/public/widget.js)
```javascript
(function() {
  'use strict';
  
  class RetellWidget {
    constructor(config) {
      this.config = config;
      this.state = 'ready'; // ready, connecting, calling, ended
      this.init();
    }
    
    init() {
      this.createUI();
      this.attachEventListeners();
    }
    
    createUI() {
      const container = document.createElement('div');
      container.className = 'retell-widget';
      container.innerHTML = `
        <button class="retell-button" type="button">
          ${this.config.buttonText}
        </button>
        <div class="retell-status" style="display: none;"></div>
      `;
      
      // Insert after script tag
      const script = document.querySelector(`script[data-widget-id="${this.config.widgetId}"]`);
      script.parentNode.insertBefore(container, script.nextSibling);
      
      this.button = container.querySelector('.retell-button');
      this.status = container.querySelector('.retell-status');
    }
    
    async startCall() {
      this.setState('connecting');
      
      try {
        const response = await fetch('https://yourplatform.com/api/v1/register-call', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            widget_id: this.config.widgetId,
            metadata: this.config.metadata
          })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          this.setState('calling');
          // Handle Retell AI call setup with data.call_id
        } else {
          this.handleError(data.error);
        }
      } catch (error) {
        this.handleError('Failed to connect');
      }
    }
    
    setState(newState) {
      this.state = newState;
      this.updateUI();
    }
    
    updateUI() {
      const states = {
        ready: { text: this.config.buttonText, disabled: false },
        connecting: { text: 'Connecting...', disabled: true },
        calling: { text: 'In Call', disabled: true },
        ended: { text: this.config.buttonText, disabled: false }
      };
      
      const state = states[this.state];
      this.button.textContent = state.text;
      this.button.disabled = state.disabled;
    }
    
    handleError(message) {
      this.setState('ready');
      this.status.textContent = `Error: ${message}`;
      this.status.style.display = 'block';
      setTimeout(() => {
        this.status.style.display = 'none';
      }, 5000);
    }
    
    attachEventListeners() {
      this.button.addEventListener('click', () => {
        if (this.state === 'ready') {
          this.startCall();
        }
      });
    }
  }
  
  // Auto-initialize widgets
  document.addEventListener('DOMContentLoaded', () => {
    const scripts = document.querySelectorAll('script[data-widget-id]');
    
    scripts.forEach(script => {
      const config = {
        widgetId: script.dataset.widgetId,
        buttonText: script.dataset.buttonText || 'Start Voice Demo',
        metadata: script.dataset.metadata ? JSON.parse(script.dataset.metadata) : {}
      };
      
      new RetellWidget(config);
    });
  });
})();
```

## Security Implementation

### Domain Verification
```javascript
// /lib/security.js
export function isAllowedDomain(origin, allowedDomain) {
  if (!origin || !allowedDomain) return false;
  
  const originUrl = new URL(origin);
  const originHost = originUrl.hostname;
  
  // Handle localhost
  if (allowedDomain === 'localhost' && originHost === 'localhost') {
    return true;
  }
  
  // Handle development domains
  const devDomains = CONFIG.SECURITY.ALLOWED_DEV_DOMAINS;
  if (devDomains.some(domain => originHost.includes(domain))) {
    return true;
  }
  
  // Exact match
  if (originHost === allowedDomain) return true;
  
  // Subdomain match
  if (originHost.endsWith('.' + allowedDomain)) return true;
  
  return false;
}
```

### Rate Limiting
```javascript
// /lib/rateLimiter.js
const rateLimitStore = new Map();

export function checkRateLimit(widgetId, limit = CONFIG.RATE_LIMITING.CALLS_PER_HOUR) {
  const now = Date.now();
  const windowStart = now - CONFIG.RATE_LIMITING.WINDOW_MS;
  
  if (!rateLimitStore.has(widgetId)) {
    rateLimitStore.set(widgetId, []);
  }
  
  const calls = rateLimitStore.get(widgetId);
  
  // Remove old calls outside the window
  const validCalls = calls.filter(timestamp => timestamp > windowStart);
  rateLimitStore.set(widgetId, validCalls);
  
  // Check if limit exceeded
  if (validCalls.length >= limit) {
    return false;
  }
  
  // Add current call
  validCalls.push(now);
  return true;
}
```

## File Structure
```
/app
  /dashboard
    page.js (dashboard)
  /login
    page.js (auth)
  /api
    /widgets
      route.js (CRUD operations)
    /widgets/[id]
      route.js (delete widget)
    /v1
      /register-call
        route.js (public endpoint)

/components
  /ui (shadcn components)
    button.tsx
    input.tsx
    card.tsx
    navigation-menu.tsx
  /layouts
    AppLayout.js
    Header.js
    Navigation.js
    UserMenu.js
  /sections
    PageHeader.js
    WidgetGrid.js
    EmptyState.js
  /features
    WidgetCard.js
    WidgetForm.js
    EmbedCodeModal.js

/lib
  supabase.js (client configuration)
  config.js (global configuration)
  security.js (domain validation)
  rateLimiter.js (rate limiting logic)
  utils.js (helper functions)

/public
  widget.js (embeddable script)
```

## Success Metrics
- User can create account and widget in < 2 minutes
- Widget loads and connects to Retell AI in < 5 seconds  
- Domain verification blocks unauthorized usage
- Rate limiting prevents abuse without blocking legitimate usage
- Clean, accessible UI ready for design system upgrade

## Implementation Notes
- Use Supabase Auth UI components for rapid auth setup
- Implement all API routes with proper error handling
- Add input validation on both client and server
- Use TypeScript for better development experience
- Set up proper environment variable validation
- Include basic CSS for widget styling
- Test domain verification thoroughly
- Implement graceful error handling throughout

This specification provides a complete blueprint for implementing the Multi-Tenant Retell AI Widget SaaS platform with modern, maintainable architecture.