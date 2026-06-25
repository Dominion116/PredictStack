'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import dynamic from 'next/dynamic';
import { OfflineBanner } from './OfflineBanner';

// Load the Stacks Connect provider only on the client — it depends on
// @stacks/transactions / @noble/secp256k1 which cannot run during SSR.
const StacksConnectWrapper = dynamic(
    () => import('./stacks-connect-wrapper').then(m => m.StacksConnectWrapper),
    { ssr: false }
);

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
            storageKey="predictstack-theme"
        >
            <StacksConnectWrapper>
                {children}
                <OfflineBanner />
            </StacksConnectWrapper>
        </ThemeProvider>
    );
}
