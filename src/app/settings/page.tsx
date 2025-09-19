'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layouts/AppLayout';
import { PageHeader } from '@/components/sections/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CONFIG } from '@/lib/config';
import type { User } from '@supabase/supabase-js';

export default function Settings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <PageHeader 
        title="Settings"
        description="Account settings and platform configuration"
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and subscription status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-sm text-muted-foreground">{user?.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium">User ID</div>
              <div className="text-xs text-muted-foreground font-mono">{user?.id}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Account Created</div>
              <div className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Limits</CardTitle>
            <CardDescription>
              Current limits and usage quotas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium">Max Widgets per User</div>
              <div className="text-sm text-muted-foreground">
                {CONFIG.LIMITS.MAX_WIDGETS_PER_USER} widgets
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Default Rate Limit</div>
              <div className="text-sm text-muted-foreground">
                {CONFIG.RATE_LIMITING.CALLS_PER_HOUR} calls per hour
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Max Widget Name Length</div>
              <div className="text-sm text-muted-foreground">
                {CONFIG.LIMITS.MAX_WIDGET_NAME_LENGTH} characters
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Max Metadata Size</div>
              <div className="text-sm text-muted-foreground">
                {CONFIG.LIMITS.MAX_METADATA_SIZE} bytes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Information */}
        <Card>
          <CardHeader>
            <CardTitle>API Information</CardTitle>
            <CardDescription>
              Integration details and endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium">Widget Registration Endpoint</div>
              <div className="text-xs text-muted-foreground font-mono">
                POST /api/v1/register-call
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Widget Script URL</div>
              <div className="text-xs text-muted-foreground font-mono">
                {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/widget.js
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Documentation</CardTitle>
            <CardDescription>
              Helpful resources and guides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium">Widget Integration Guide</div>
              <div className="text-sm text-muted-foreground">
                Learn how to embed widgets on your website
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">API Documentation</div>
              <div className="text-sm text-muted-foreground">
                Complete API reference and examples
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Retell AI Documentation</div>
              <div className="text-sm text-muted-foreground">
                Learn about Retell AI voice agents
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}