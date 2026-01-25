'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Connect } from '@stacks/connect-react';
import { APP_DETAILS, userSession } from '@/lib/constants';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
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
  );
}

