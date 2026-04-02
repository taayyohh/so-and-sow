'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from 'sonner';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

function PrivyWrapper({ children }: { children: React.ReactNode }) {
  if (!PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          accentColor: '#A8E4DA',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <PrivyWrapper>
      <Navigation />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: '#1b1b1b',
            border: '1px solid rgba(255,255,255,0.13)',
            color: '#ffffff',
          },
        }}
      />
    </PrivyWrapper>
  );
}
