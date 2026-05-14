'use client';

import { ReactNode } from 'react';
import { Connect } from '@stacks/connect-react';
import { APP_DETAILS, userSession } from '@/lib/constants';

export function StacksConnectWrapper({ children }: { children: ReactNode }) {
    return (
        <Connect
            authOptions={{
                appDetails: APP_DETAILS,
                redirectTo: '/dashboard',
                onFinish: () => { window.location.reload(); },
                userSession,
            }}
        >
            {children}
        </Connect>
    );
}
