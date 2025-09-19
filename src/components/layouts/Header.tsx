'use client';

import { Button } from '@/components/ui/button';
import { UserMenu } from './UserMenu';

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
  );
}