'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LandingHero } from '@/components/sections/LandingHero';
import { LandingFeatures } from '@/components/sections/LandingFeatures';
import { LandingDemo } from '@/components/sections/LandingDemo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If logged in, redirect to dashboard
      if (session) {
        router.push('/dashboard');
      }
      // If not logged in, show landing page (no redirect)
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎤</span>
            <span className="text-xl font-bold">Retell Widget Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingDemo />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎤</span>
                <span className="text-lg font-bold">Retell Widget Platform</span>
              </div>
              <p className="text-muted-foreground">
                Free widget platform for embedding Retell AI voice agents on any website.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <a href="https://docs.retellai.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    Retell AI Docs
                  </a>
                </div>
                <div>
                  <Link href="/widget-example.html" className="hover:text-primary">
                    Example Widget
                  </Link>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <Link href="/login" className="hover:text-primary">
                    Sign In
                  </Link>
                </div>
                <div>
                  <Link href="/dashboard" className="hover:text-primary">
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>Built for the Retell AI community • Always free to use</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
