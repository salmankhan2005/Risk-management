import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { RiskWatchProvider } from '@/lib/store';
import './app.css';

export default function InternalAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RiskWatchProvider>
      <AppLayout>{children}</AppLayout>
    </RiskWatchProvider>
  );
}
