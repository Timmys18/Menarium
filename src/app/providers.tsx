'use client';

import { SessionProvider } from 'next-auth/react';
import { type ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider session={null}>
      {children}
    </SessionProvider>
  );
} 