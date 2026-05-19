'use client';

import { ReactNode } from 'react';
import { Connect } from '@stacks/connect-react';
import { APP_DETAILS, userSession } from '@/lib/constants';

// Network is passed per-call in doContractCall (via NETWORK_ENV in constants).
// The Connect wrapper only handles auth; the wallet enforces its own network setting.
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
