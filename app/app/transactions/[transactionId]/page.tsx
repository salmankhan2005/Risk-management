'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Fingerprint,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  Smartphone,
  Store,
  User,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ transactionId: string }>;
}) {
  const router = useRouter();
  const { transactionId } = use(params);
  const { transactions, customers, accounts, merchants, devices, alerts, cases, rules } = useRiskWatch();

  const txn = transactions.find((t) => t.id === transactionId);

  if (!txn) {
    return (
      <div className="app-page-wrapper" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>Transaction Not Found</h2>
        <p style={{ color: '#6F6A60' }}>
          Identifier <code>{transactionId}</code> does not exist in the active dataset.
        </p>
        <Link href="/app/transactions" className="btn-primary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={14} /> Back to Transactions
        </Link>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === txn.customerId);
  const account = accounts.find((a) => a.id === txn.accountId);
  const merchant = merchants.find((m) => m.id === txn.merchantId);
  const device = devices.find((d) => d.id === txn.deviceId);
  const linkedAlert = alerts.find((a) => a.id === txn.linkedAlertId || a.triggerTxnIds.includes(txn.id));
  const linkedCase = cases.find((c) => c.id === txn.linkedCaseId || c.linkedTxnIds.includes(txn.id));

  // Balance arithmetic check
  const expectedBalance =
    txn.direction === 'Debit' ? txn.balanceBefore - txn.amount : txn.balanceBefore + txn.amount;
  const arithmeticReconciled = expectedBalance === txn.balanceAfter;

  // Validation warnings
  const isClosedAccount = account?.status === 'Closed';
  const isOverdraftViolation = !account?.overdraftAllowed && txn.balanceAfter < 0;

  return (
    <div className="app-page-wrapper">
      {/* Top Back Nav & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/app/transactions" className="btn-secondary" style={{ fontSize: '11.5px' }}>
          <ArrowLeft size={13} /> Back to Transactions
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          {linkedAlert && (
            <Link href={`/app/alerts/${linkedAlert.id}`} className="btn-secondary" style={{ fontSize: '11.5px' }}>
              <AlertTriangle size={13} color="#D94C42" /> View Alert ({linkedAlert.id})
            </Link>
          )}
          {linkedCase && (
            <Link href={`/app/cases/${linkedCase.id}`} className="btn-primary" style={{ fontSize: '11.5px' }}>
              <Briefcase size={13} /> Open Investigation Case
            </Link>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="badge badge-neutral" style={{ fontSize: '12px' }}>{txn.type}</span>
            <span className={`badge ${txn.direction === 'Debit' ? 'badge-neutral' : 'badge-success'}`}>
              {txn.direction}
            </span>
            <span className={`badge ${txn.riskScore >= 80 ? 'badge-critical' : txn.riskScore >= 50 ? 'badge-medium' : 'badge-low'}`}>
              Risk Score: {txn.riskScore}
            </span>
            <span className={`badge ${txn.status === 'Flagged' || txn.status === 'Blocked' ? 'badge-critical' : 'badge-neutral'}`}>
              {txn.status}
            </span>
          </div>
          <h1>{txn.id}</h1>
          <p>{txn.description || 'Synthetic Ledger Transaction'}</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#6F6A60', textTransform: 'uppercase', fontWeight: 700 }}>
            Transaction Amount
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#171713', fontFamily: 'var(--sans)' }}>
            {formatCurrency(txn.amount, txn.currency)}
          </div>
          <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>
            Executed: {formatDate(txn.timestamp)}
          </div>
        </div>
      </div>

      {/* Controlled Negative Warning Banners if applicable */}
      {isClosedAccount && (
        <div className="negative-scenario-banner">
          <AlertTriangle size={18} color="#FCA5A5" />
          <div>
            <strong>EXCEPTION DETECTED (VAL-09 / NEG-01):</strong> This transaction references closed account{' '}
            <code>{txn.accountId}</code>. Account was officially closed prior to execution date.
          </div>
        </div>
      )}

      {isOverdraftViolation && (
        <div className="negative-scenario-banner">
          <AlertTriangle size={18} color="#FCA5A5" />
          <div>
            <strong>OVERDRAFT EXCEPTION (VAL-11 / NEG-02):</strong> Account <code>{txn.accountId}</code> has zero overdraft
            allowance, but this transaction pushed current balance to{' '}
            <strong style={{ color: '#FFF' }}>{formatCurrency(txn.balanceAfter, txn.currency)}</strong>.
          </div>
        </div>
      )}

      {/* Main Grid: Details + Context */}
      <div className="detail-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Balance Arithmetic Reconciliation Panel */}
          <div className="app-card">
            <div className="app-card-header">
              <h3 className="app-card-title">
                <Scale size={16} color="#AD7048" />
                Ledger Balance Reconciliation
              </h3>
              <span className={`badge ${arithmeticReconciled ? 'badge-success' : 'badge-critical'}`}>
                {arithmeticReconciled ? 'Arithmetically Reconciled' : 'Reconciliation Discrepancy'}
              </span>
            </div>
            <div className="app-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                <div style={{ padding: '12px', background: '#F3EEE4', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10.5px', color: '#6F6A60', textTransform: 'uppercase', fontWeight: 600 }}>Balance Before</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
                    {formatCurrency(txn.balanceBefore, txn.currency)}
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#F3EEE4', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10.5px', color: '#6F6A60', textTransform: 'uppercase', fontWeight: 600 }}>
                    {txn.direction === 'Debit' ? '- Debit Amount' : '+ Credit Amount'}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#AD7048', marginTop: '4px' }}>
                    {formatCurrency(txn.amount, txn.currency)}
                  </div>
                </div>

                <div style={{ padding: '12px', background: '#F3EEE4', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10.5px', color: '#6F6A60', textTransform: 'uppercase', fontWeight: 600 }}>Balance After</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: txn.balanceAfter < 0 ? '#D94C42' : '#171713', marginTop: '4px' }}>
                    {formatCurrency(txn.balanceAfter, txn.currency)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Triggered Rules & Threshold Evidence */}
          <div className="app-card">
            <div className="app-card-header">
              <div>
                <h3 className="app-card-title">
                  <Shield size={16} color="#AD7048" />
                  Triggered Risk Rules & Evidence
                </h3>
                <p className="app-card-subtitle">Observed transaction features vs configured policy limits</p>
              </div>
            </div>
            <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {txn.triggeredRules.length === 0 ? (
                <div style={{ color: '#6F6A60', fontSize: '12.5px' }}>
                  No rules triggered. Transaction fell within standard behavioral baselines.
                </div>
              ) : (
                txn.triggeredRules.map((ruleId) => {
                  const ruleObj = rules.find((r) => r.id === ruleId);
                  return (
                    <div
                      key={ruleId}
                      style={{
                        padding: '12px 14px',
                        background: '#F3EEE4',
                        border: '1px solid #E7DFD3',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-neutral">{ruleId}</span>
                          <strong style={{ fontSize: '13px' }}>{ruleObj?.name || ruleId}</strong>
                        </div>
                        <span className="badge badge-high">+{ruleObj?.scoreContribution || 25} pts</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#59554E' }}>
                        {ruleObj?.description}
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#6F6A60', marginTop: '4px' }}>
                        <span>Configured Limit: <strong>{ruleObj?.thresholdValue} {ruleObj?.thresholdUnit}</strong></span>
                        <span>Evaluation Version: <strong>{ruleObj?.version || '1.0'}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Forensic Timeline */}
          <div className="app-card">
            <div className="app-card-header">
              <h3 className="app-card-title">
                <Clock size={16} color="#AD7048" />
                Forensic Event Timeline
              </h3>
            </div>
            <div className="app-card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#75856B', marginTop: '5px' }} />
                  <div>
                    <strong style={{ fontSize: '12px' }}>Transaction Initiated & Settled</strong>
                    <div style={{ fontSize: '11px', color: '#6F6A60' }}>{formatDate(txn.timestamp)} · Amount debited from ledger</div>
                  </div>
                </div>

                {txn.riskScore >= 50 && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D94C42', marginTop: '5px' }} />
                    <div>
                      <strong style={{ fontSize: '12px' }}>Rule Engine Scored & Flagged</strong>
                      <div style={{ fontSize: '11px', color: '#6F6A60' }}>
                        Score {txn.riskScore} calculated additively from {txn.triggeredRules.length} triggered rules
                      </div>
                    </div>
                  </div>
                )}

                {linkedAlert && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#AD7048', marginTop: '5px' }} />
                    <div>
                      <strong style={{ fontSize: '12px' }}>Operational Alert Ingested</strong>
                      <div style={{ fontSize: '11px', color: '#6F6A60' }}>
                        {linkedAlert.id} registered in triage queue with {linkedAlert.severity} severity
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Entity Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Customer Context */}
          <div className="app-card">
            <div className="app-card-header">
              <h3 className="app-card-title">
                <User size={15} color="#AD7048" />
                Customer Context
              </h3>
              {customer && (
                <Link href={`/app/customers/${customer.id}`} className="btn-secondary" style={{ fontSize: '10.5px', padding: '3px 8px' }}>
                  Dossier <ArrowRight size={11} />
                </Link>
              )}
            </div>
            <div className="app-card-body">
              {customer ? (
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span className="key-value-label">Name</span>
                    <span className="key-value-value">{customer.displayName}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Customer ID</span>
                    <span className="key-value-value">{customer.id}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">KYC Status</span>
                    <span className="badge badge-success">{customer.kycStatus}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Risk Tier</span>
                    <span className={`badge ${customer.riskTier === 'Critical' ? 'badge-critical' : 'badge-neutral'}`}>
                      {customer.riskTier}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6F6A60', fontSize: '12px' }}>Customer {txn.customerId}</div>
              )}
            </div>
          </div>

          {/* Account Context */}
          <div className="app-card">
            <div className="app-card-header">
              <h3 className="app-card-title">
                <CreditCard size={15} color="#AD7048" />
                Account Context
              </h3>
              {account && (
                <Link href={`/app/accounts/${account.id}`} className="btn-secondary" style={{ fontSize: '10.5px', padding: '3px 8px' }}>
                  Ledger <ArrowRight size={11} />
                </Link>
              )}
            </div>
            <div className="app-card-body">
              {account ? (
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span className="key-value-label">Account ID</span>
                    <span className="key-value-value">{account.id}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Type</span>
                    <span className="key-value-value">{account.accountType}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Status</span>
                    <span className={`badge ${account.status === 'Active' ? 'badge-success' : 'badge-critical'}`}>
                      {account.status}
                    </span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Overdraft Allowed</span>
                    <span className="key-value-value">{account.overdraftAllowed ? `Yes (₹${account.overdraftLimit.toLocaleString()})` : 'Strict Prohibited'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#6F6A60', fontSize: '12px' }}>Account {txn.accountId}</div>
              )}
            </div>
          </div>

          {/* Device & IP Context */}
          {device && (
            <div className="app-card">
              <div className="app-card-header">
                <h3 className="app-card-title">
                  <Smartphone size={15} color="#AD7048" />
                  Device & Network Context
                </h3>
              </div>
              <div className="app-card-body">
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span className="key-value-label">Device ID</span>
                    <span className="key-value-value">{device.id}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Hardware Fingerprint</span>
                    <span className="key-value-value"><code>{device.fingerprint}</code></span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">IP Address</span>
                    <span className="key-value-value">{device.ipAddress}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">VPN / Known Proxy</span>
                    <span className={`badge ${device.isKnownProxy ? 'badge-critical' : 'badge-neutral'}`}>
                      {device.isKnownProxy ? 'Detected Proxy' : 'Clean Residential'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Merchant Context */}
          {merchant && (
            <div className="app-card">
              <div className="app-card-header">
                <h3 className="app-card-title">
                  <Store size={15} color="#AD7048" />
                  Merchant Context
                </h3>
              </div>
              <div className="app-card-body">
                <div className="key-value-list">
                  <div className="key-value-row">
                    <span className="key-value-label">Merchant Name</span>
                    <span className="key-value-value">{merchant.name}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Category</span>
                    <span className="badge badge-neutral">{merchant.category}</span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Risk Category</span>
                    <span className={`badge ${merchant.riskCategory === 'High' ? 'badge-critical' : 'badge-neutral'}`}>
                      {merchant.riskCategory}
                    </span>
                  </div>
                  <div className="key-value-row">
                    <span className="key-value-label">Jurisdiction</span>
                    <span className="key-value-value">{merchant.jurisdiction}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
