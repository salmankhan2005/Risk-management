'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Share2 } from 'lucide-react';
import NetworkGraph from '@/components/ui/NetworkGraph';
import { useRiskWatch } from '@/lib/store';

function NetworkContent() {
  const { customers, accounts, transfers } = useRiskWatch();
  const searchParams = useSearchParams();
  const focus = searchParams.get('focus');

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Entity Network Graph</h1>
          <p>Interactive relationship visualization showing customers, accounts, and transfer links. Highlighted red loops indicate circular transfer patterns — a critical risk signal.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6F6A60' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#AD7048' }} />
          Customer
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6F6A60' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C7A16B' }} />
          Account
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6F6A60' }}>
          <div style={{ width: '28px', height: '3px', background: '#D94C42' }} />
          Circular Transfer Loop
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#6F6A60' }}>
          <div style={{ width: '28px', height: '3px', background: '#75856B' }} />
          Normal Transfer
        </div>
      </div>

      <NetworkGraph customers={customers} accounts={accounts} transfers={transfers} focusEntityId={focus ?? undefined} />
    </div>
  );
}

export default function NetworkPage() {
  return (
    <Suspense fallback={<div className="app-page-wrapper"><p>Loading network graph...</p></div>}>
      <NetworkContent />
    </Suspense>
  );
}
