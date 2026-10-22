'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} basePath="/api/auth" refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}

