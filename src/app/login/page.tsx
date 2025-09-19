'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [redirectTo, setRedirectTo] = useState<string>('');

  useEffect(() => {
    // Set redirect URL only on client side
    setRedirectTo(`${window.location.origin}/dashboard`);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign in to your account</h2>
          <p className="mt-2 text-muted-foreground">
            Or create a new account to get started
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          {redirectTo && (
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              redirectTo={redirectTo}
              showLinks={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}