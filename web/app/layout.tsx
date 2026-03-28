import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'PharmaBill',
  description: 'Pharmacy Billing Management',
};

function HeaderFallback() {
  return <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-primary shadow-md" />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <div className="flex min-h-screen pt-14">
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
