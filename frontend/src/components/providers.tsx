'use client';

import { ReactNode } from 'react';
import { Connect } from '@stacks/connect-react';
import { APP_DETAILS, userSession } from '@/lib/constants';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Connect
      authOptions={{
        appDetails: APP_DETAILS,
        redirectTo: '/',
        onFinish: () => {
          // reload window to update UI states
          window.location.reload();
        },
        userSession,
      }}
    >
      {children}
    </Connect>
  );
}
