import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RiskWatch — From Transactions to Trust',
  description:
    'Financial risk intelligence for transparent transaction monitoring, linked-account analysis, synthetic data validation, and traceable investigations.',
  applicationName: 'RiskWatch',
  keywords: ['financial risk intelligence', 'transaction monitoring', 'synthetic data', 'risk rules', 'case management'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f4f0e8',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}