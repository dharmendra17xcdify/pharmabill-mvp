import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import { getSettings } from '@/lib/settingsRepo';

export async function generateMetadata(): Promise<Metadata> {
  let name = 'PharmaFlow';
  try {
    const settings = await getSettings();
    if (settings?.store_name) name = settings.store_name;
  } catch {}
  return {
    title: { default: name, template: `%s | ${name}` },
    description: 'Seamless Pharmacy Billing & Inventory',
  };
}

function HeaderFallback() {
  return <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-blue-700 shadow" />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
