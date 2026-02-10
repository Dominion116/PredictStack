'use client';

import { ReactNode } from 'react';
import { Connect } from '@stacks/connect-react';
import { ThemeProvider } from 'next-themes';
import { APP_DETAILS, userSession } from '@/lib/constants';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Connect
        authOptions={{
          appDetails: APP_DETAILS,
          redirectTo: '/dashboard',
          onFinish: () => {
            window.location.reload();
          },
          userSession,
        }}
      >
        {children}
      </Connect>
    </ThemeProvider>
  );
}
