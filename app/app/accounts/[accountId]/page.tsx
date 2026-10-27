'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, CreditCard, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';

export default function AccountDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = use(params);
  const router = useRouter();
  const { accounts, customers, transactions, transfers, alerts } = useRiskWatch();
  const [activeTab, setActiveTab] = useState('overview');

  const account = accounts.find((a) => a.id === accountId);
  if (!account) {
    return (
      <div className="app-page-wrapper" style={{ textAlign: 'center', padding: '80px' }}>
        <h2>Account Not Found</h2>
        <p style={{ color: '#6F6A60' }}>No record for ID: <code>{accountId}</code></p>
        <Link href="/app/accounts" className="btn-primary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </div>
    );
  }

  const owner = customers.find((c) => c.id === account.customerId);
  const acctTxns = transactions.filter((t) => t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId);
  const acctTransfers = transfers.filter((t) => t.fromAccountId === accountId || t.toAccountId === accountId);
  const acctAlerts = alerts.filter((a) => a.linkedAccountIds.includes(accountId));
  const negativeNoOD = account.currentBalance < 0 && !account.overdraftAllowed;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: `Transactions (${acctTxns.length})` },
    { id: 'transfers', label: `Transfers (${acctTransfers.length})` },
    { id: 'alerts', label: `Alerts (${acctAlerts.length})` },
  ];

  return (
    <div className="app-page-wrapper">
      <Link href="/app/accounts" className="btn-secondary" style={{ fontSize: '11.5px', width: 'fit-content' }}>
        <ArrowLeft size={13} /> Back to Accounts
      </Link>

      {negativeNoOD && (
        <div className="exception-banner exception-banner-critical">
          <AlertTriangle size={15} />
          <strong>Controlled Negative Scenario:</strong> This account carries a negative balance (<strong>{formatCurrency(account.currentBalance)}</strong>) without an authorized overdraft facility. This is a ground-truth exception for validation.
        </div>
      )}

      {account.status === 'Closed' && (
        <div className="exception-banner exception-banner-critical">
          <AlertTriangle size={15} />
          <strong>Account Closed:</strong> Any transactions referencing this account may constitute a controlled negative scenario — transactions on a closed account.
        </div>
      )}

      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className={`badge ${account.status === 'Active' ? 'badge-success' : 'badge-critical'}`}>{account.status}</span>
            <span className={`badge ${account.riskLevel === 'Critical' ? 'badge-critical' : account.riskLevel === 'High' ? 'badge-high' : 'badge-neutral'}`}>{account.riskLevel} Risk</span>
            <span className="badge badge-neutral">{account.accountType}</span>
          </div>
          <h1>{account.id}</h1>
          <p>
            Owned by{' '}
            <Link href={`/app/customers/${owner?.id}`} style={{ color: '#AD7048', fontWeight: 600 }}>
              {owner?.displayName ?? account.customerId}
            </Link>{' '}
            · {account.currency} · Created {formatDate(account.openedAt)}
          </p>
        </div>
      </div>

      <div className="app-tabs">
        {tabs.map((t) => (
          <button type="button" key={t.id} className={`app-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="detail-grid">
          <div className="app-card">
            <div className="app-card-header"><h3 className="app-card-title"><CreditCard size={15} color="#AD7048" /> Account Details</h3></div>
            <div className="app-card-body">
              <div className="key-value-list">
                <div className="key-value-row"><span className="key-value-label">Account ID</span><span className="key-value-value">{account.id}</span></div>
                <div className="key-value-row"><span className="key-value-label">Type</span><span className="key-value-value">{account.accountType}</span></div>
                <div className="key-value-row"><span className="key-value-label">Status</span><span className="key-value-value">{account.status}</span></div>
                <div className="key-value-row"><span className="key-value-label">Currency</span><span className="key-value-value">{account.currency}</span></div>
                <div className="key-value-row"><span className="key-value-label">Current Balance</span>
                  <span className="key-value-value tabular-nums" style={{ color: account.currentBalance < 0 ? '#D94C42' : '#75856B', fontWeight: 700 }}>
                    {account.currentBalance < 0 && <TrendingDown size={12} style={{ marginRight: '3px' }} />}
                    {formatCurrency(account.currentBalance, account.currency)}
                  </span>
                </div>
                <div className="key-value-row"><span className="key-value-label">Overdraft Allowed</span><span className="key-value-value">{account.overdraftAllowed ? `Yes — up to ${formatCurrency(account.overdraftLimit)}` : 'No'}</span></div>
                <div className="key-value-row"><span className="key-value-label">Opened</span><span className="key-value-value">{formatDate(account.openedAt)}</span></div>
                {account.closedAt && <div className="key-value-row"><span className="key-value-label">Closed</span><span className="key-value-value" style={{ color: '#D94C42' }}>{formatDate(account.closedAt)}</span></div>}
                <div className="key-value-row"><span className="key-value-label">Risk Level</span><span className="key-value-value">{account.riskLevel}</span></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Transactions', value: acctTxns.length },
              { label: 'Transfers Involved', value: acctTransfers.length },
              { label: 'Active Alerts', value: acctAlerts.filter((a) => a.status !== 'Resolved').length },
            ].map((s) => (
              <div key={s.label} className="kpi-card">
                <div className="kpi-top"><span>{s.label}</span></div>
                <div className="kpi-value tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="app-card">
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Txn ID</th><th>Type</th><th>Amount</th><th>Direction</th><th>Risk Score</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {acctTxns.map((tx) => (
                  <tr key={tx.id} className="app-table-clickable-row" onClick={() => router.push(`/app/transactions/${tx.id}`)}>
                    <td><strong>{tx.id}</strong></td>
                    <td><span className="badge badge-neutral">{tx.type}</span></td>
                    <td className="tabular-nums" style={{ fontWeight: 700 }}>{formatCurrency(tx.amount, tx.currency)}</td>
                    <td><span className="badge badge-neutral">{tx.direction}</span></td>
                    <td><span className={`badge ${tx.riskScore >= 80 ? 'badge-critical' : tx.riskScore >= 50 ? 'badge-medium' : 'badge-low'}`}>{tx.riskScore}</span></td>
                    <td><span className="badge badge-neutral">{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="app-card">
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr><th>Transfer ID</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Reconciled</th></tr>
              </thead>
              <tbody>
                {acctTransfers.map((tr) => (
                  <tr key={tr.id} className="app-table-clickable-row" onClick={() => router.push(`/app/transfers`)}>
                    <td><strong>{tr.id}</strong></td>
                    <td>{tr.fromAccountId}</td>
                    <td>{tr.toAccountId}</td>
                    <td className="tabular-nums" style={{ fontWeight: 700 }}>{formatCurrency(tr.amount, tr.currency)}</td>
                    <td><span className={`badge ${tr.status === 'Failed' ? 'badge-critical' : 'badge-success'}`}>{tr.status}</span></td>
                    <td><span className={`badge ${tr.reconciled ? 'badge-success' : 'badge-critical'}`}>{tr.reconciled ? 'Yes' : 'No'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {acctAlerts.map((al) => (
            <div key={al.id} className="app-card" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => router.push(`/app/alerts/${al.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={14} color="#D94C42" />
                  <strong>{al.id}</strong>
                  <span className={`badge ${al.severity === 'Critical' ? 'badge-critical' : 'badge-high'}`}>{al.severity}</span>
                </div>
                <span className="badge badge-neutral">{al.status}</span>
              </div>
              <div style={{ fontSize: '13px' }}>{al.title}</div>
            </div>
          ))}
          {acctAlerts.length === 0 && <p style={{ color: '#6F6A60' }}>No alerts linked to this account.</p>}
        </div>
      )}
    </div>
  );
}
