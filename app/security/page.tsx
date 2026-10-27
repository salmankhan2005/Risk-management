'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Database,
  FileCheck2,
  HardDrive,
  Lock,
  RefreshCw,
  Shield,
  ShieldAlert,
  Terminal,
} from 'lucide-react';

export default function SecurityGovernancePage() {
  return (
    <div className="site-shell" style={{ background: '#F3EEE4', minHeight: '100vh', color: '#171713' }}>
      {/* Header */}
      <header className="site-header" style={{ borderBottom: '1px solid #D9D1C4' }}>
        <div className="header-inner">
          <Link className="brand" href="/">
            <span className="brand-symbol"><Shield strokeWidth={1.65} /></span>
            <span className="brand-wording">
              <span className="brand-name">RiskWatch</span>
              <span className="brand-subtitle">Financial Risk Intelligence</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" className="btn-secondary" style={{ fontSize: '11.5px' }}>
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <Link href="/app/overview" className="button button-dark" style={{ minHeight: '38px', padding: '0 16px', fontSize: '12px' }}>
              Launch Workspace <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-gutter" style={{ paddingBottom: '80px', paddingTop: '48px', maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'rgba(199, 161, 107, 0.18)', border: '1px solid rgba(199, 161, 107, 0.4)', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: '#8C6A34', marginBottom: '16px' }}>
            <Lock size={12} /> SYNTHETIC DATA & GOVERNANCE ARCHITECTURE
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '48px', fontWeight: 600, letterSpacing: '-0.04em', margin: '0 0 16px', lineHeight: 1.05 }}>
            Data Governance & <em>Ground-Truth Isolation.</em>
          </h1>
          <p style={{ color: '#6F6A60', fontSize: '16px', maxWidth: '780px', lineHeight: 1.6 }}>
            RiskWatch operates in a strictly synthetic, auditable environment. No customer PII, real banking credentials,
            or production account records are ingested. All data is generated deterministically from seed <code>20261022</code>.
          </p>
        </div>

        {/* 4 Pillars of Governance */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px', marginBottom: '44px' }}>
          <div className="app-card" style={{ padding: '22px' }}>
            <ShieldAlert size={24} color="#D94C42" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px' }}>Ground-Truth Isolation</h3>
            <p style={{ color: '#6F6A60', fontSize: '12px', lineHeight: 1.55, margin: 0 }}>
              Negative labels and anomaly injection tags are physically decoupled from runtime risk calculation features to prevent target leakage.
            </p>
          </div>

          <div className="app-card" style={{ padding: '22px' }}>
            <RefreshCw size={24} color="#C7A16B" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px' }}>Fixed-Seed Reproducibility</h3>
            <p style={{ color: '#6F6A60', fontSize: '12px', lineHeight: 1.55, margin: 0 }}>
              Regenerating the 100,000 transaction dataset using seed <code>20261022</code> yields identical row counts, IDs, and SHA-256 digests.
            </p>
          </div>

          <div className="app-card" style={{ padding: '22px' }}>
            <FileCheck2 size={24} color="#75856B" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px' }}>20 Automated Assertions</h3>
            <p style={{ color: '#6F6A60', fontSize: '12px', lineHeight: 1.55, margin: 0 }}>
              Continuous integrity verification checks primary-key uniqueness, foreign keys, overdraft constraints, balance arithmetic, and transfer reconciliation.
            </p>
          </div>

          <div className="app-card" style={{ padding: '22px' }}>
            <Terminal size={24} color="#AD7048" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 8px' }}>Append-Only Audit Trail</h3>
            <p style={{ color: '#6F6A60', fontSize: '12px', lineHeight: 1.55, margin: 0 }}>
              Every rule modification, case status progression, and analyst note creates an immutable event. Historical state is never overwritten.
            </p>
          </div>
        </div>

        {/* Controlled Negative Scenarios Section */}
        <div className="app-card" style={{ marginBottom: '44px' }}>
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Controlled Exception Scenarios</h3>
              <p className="app-card-subtitle">5 explicitly injected testing conditions to stress validation engines</p>
            </div>
            <Link href="/app/ground-truth" className="btn-secondary" style={{ fontSize: '11px' }}>
              Inspect in Ground Truth Lab <ArrowRight size={13} />
            </Link>
          </div>
          <div className="app-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px 16px', background: '#F3EEE4', border: '1px solid #D9D1C4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong>NEG-01: Transaction on Closed Account</strong>
                  <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>TXN-2026-00042001 attempts debit on ACC-CUS-000108-01 closed on 2026-06-30</div>
                </div>
                <span className="badge badge-critical">VAL-09 Breach</span>
              </div>

              <div style={{ padding: '12px 16px', background: '#F3EEE4', border: '1px solid #D9D1C4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong>NEG-02: Negative Balance without Overdraft Permission</strong>
                  <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>ACC-CUS-000219-01 balance dropped to -₹18,500 with zero overdraft allowance</div>
                </div>
                <span className="badge badge-critical">VAL-11 Breach</span>
              </div>

              <div style={{ padding: '12px 16px', background: '#F3EEE4', border: '1px solid #D9D1C4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong>NEG-03: Transfer Legs Reconciliation Mismatch</strong>
                  <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>TRF-2026-000088 debit ₹500,000 booked vs credit ₹420,000 received (delta ₹80,000)</div>
                </div>
                <span className="badge badge-high">VAL-12 Breach</span>
              </div>

              <div style={{ padding: '12px 16px', background: '#F3EEE4', border: '1px solid #D9D1C4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong>NEG-04: Alert Devoid of Triggering Transactions</strong>
                  <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>ALT-2026-000912 lacks foreign-key reference to underlying transaction facts</div>
                </div>
                <span className="badge badge-high">VAL-13 Breach</span>
              </div>

              <div style={{ padding: '12px 16px', background: '#F3EEE4', border: '1px solid #D9D1C4', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong>NEG-05: Case Disposition Precedes Related Alert Creation</strong>
                  <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>CASE-2026-000044 closed at 09:15 whereas alert timestamp is 14:10</div>
                </div>
                <span className="badge badge-critical">VAL-15 Breach</span>
              </div>
            </div>
          </div>
        </div>

        {/* Link to Validation Lab */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link href="/app/validation" className="btn-primary" style={{ padding: '10px 24px', fontSize: '13px' }}>
            Run Validation Lab (20 Checks) <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    </div>
  );
}
