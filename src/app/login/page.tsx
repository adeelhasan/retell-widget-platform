'use client';

import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthForm } from '@/components/features/AuthForm';

export default function Login() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Retell Widget Platform</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your voice AI widgets
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}