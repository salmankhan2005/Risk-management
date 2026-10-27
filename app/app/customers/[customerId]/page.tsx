'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CreditCard,
  History,
  Shield,
  Smartphone,
  User,
  Wallet,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';

export default function CustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = use(params);
  const router = useRouter();
  const { customers, accounts, transactions, devices, alerts, cases } = useRiskWatch();
  const [activeTab, setActiveTab] = useState('overview');

  const customer = customers.find((c) => c.id === customerId);
  if (!customer) {
    return (
      <div className="app-page-wrapper" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>Customer Not Found</h2>
        <p style={{ color: '#6F6A60' }}>No record found for ID: <code>{customerId}</code></p>
        <Link href="/app/customers" className="btn-primary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={14} /> Back to Customers
        </Link>
      </div>
    );
  }

  const customerAccounts = accounts.filter((a) => a.customerId === customerId);
  const customerTxns = transactions.filter((t) => t.customerId === customerId);
  const customerAlerts = alerts.filter((a) => a.linkedCustomerId === customerId);
  const customerCases = cases.filter((c) => c.linkedCustomerIds.includes(customerId));

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'accounts', label: `Accounts (${customerAccounts.length})` },
    { id: 'transactions', label: `Transactions (${customerTxns.length})` },
    { id: 'alerts', label: `Alerts & Cases (${customerAlerts.length})` },
  ];

  return (
    <div className="app-page-wrapper">
      {/* Back nav */}
      <Link href="/app/customers" className="btn-secondary" style={{ fontSize: '11.5px', width: 'fit-content' }}>
        <ArrowLeft size={13} /> Back to Customers
      </Link>

      {/* Header */}
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className={`badge ${customer.riskTier === 'Critical' ? 'badge-critical' : customer.riskTier === 'High' ? 'badge-high' : customer.riskTier === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
              {customer.riskTier} Risk
            </span>
            <span className={`badge ${customer.kycStatus === 'Verified' ? 'badge-success' : 'badge-critical'}`}>
              KYC: {customer.kycStatus}
            </span>
            <span className={`badge ${customer.status === 'Active' ? 'badge-success' : 'badge-critical'}`}>
              {customer.status}
            </span>
          </div>
          <h1>{customer.displayName}</h1>
          <p>{customer.id} · {customer.email} · {customer.phone}</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {customerAlerts.length > 0 && (
            <Link href={`/app/alerts/${customerAlerts[0].id}`} className="btn-secondary">
              <AlertTriangle size={13} color="#D94C42" /> View Alert
            </Link>
          )}
          <Link href={`/app/network?focus=${customerId}`} className="btn-primary">
            View in Network Graph
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="app-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`app-tab-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="app-card">
              <div className="app-card-header">
                <h3 className="app-card-title"><User size={15} color="#AD7048" /> Customer Profile</h3>
              </div>
              <div className="app-card-body">
                <div className="key-value-list">
                  <div className="key-value-row"><span className="key-value-label">Customer ID</span><span className="key-value-value">{customer.id}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Display Name</span><span className="key-value-value">{customer.displayName}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Email</span><span className="key-value-value">{customer.email}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Phone</span><span className="key-value-value">{customer.phone}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Country</span><span className="key-value-value">{customer.country}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Created</span><span className="key-value-value">{formatDate(customer.createdAt)}</span></div>
                  <div className="key-value-row"><span className="key-value-label">KYC Verified</span><span className="key-value-value">{formatDate(customer.kycVerifiedDate)}</span></div>
                </div>
              </div>
            </div>

            <div className="app-card">
              <div className="app-card-header">
                <h3 className="app-card-title"><Wallet size={15} color="#AD7048" /> Transaction Summary</h3>
              </div>
              <div className="app-card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', background: '#F3EEE4', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#6F6A60', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Total Transactions</div>
                    <div style={{ fontSize: '20px', fontWeight: 800 }}>{customer.transactionCount}</div>
                  </div>
                  <div style={{ padding: '12px', background: '#F3EEE4', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#6F6A60', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Total Volume</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#AD7048' }}>{formatCurrency(customer.totalVolume)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick Stats */}
            {[
              { label: 'Owned Accounts', value: customerAccounts.length, icon: <CreditCard size={15} /> },
              { label: 'Open Alerts', value: customerAlerts.filter((a) => a.status !== 'False Positive' && a.status !== 'Resolved').length, icon: <AlertTriangle size={15} /> },
              { label: 'Open Cases', value: customerCases.filter((c) => c.status !== 'Closed' && c.status !== 'Resolved').length, icon: <Briefcase size={15} /> },
            ].map((s) => (
              <div key={s.label} className="kpi-card">
                <div className="kpi-top"><span>{s.label}</span><span className="kpi-icon">{s.icon}</span></div>
                <div className="kpi-value tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Accounts */}
      {activeTab === 'accounts' && (
        <div className="app-card">
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Account ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Currency</th>
                  <th>Balance</th>
                  <th>Risk Level</th>
                  <th>Overdraft</th>
                </tr>
              </thead>
              <tbody>
                {customerAccounts.map((acc) => (
                  <tr key={acc.id} className="app-table-clickable-row" onClick={() => router.push(`/app/accounts/${acc.id}`)}>
                    <td><strong>{acc.id}</strong></td>
                    <td><span className="badge badge-neutral">{acc.accountType}</span></td>
                    <td><span className={`badge ${acc.status === 'Active' ? 'badge-success' : 'badge-critical'}`}>{acc.status}</span></td>
                    <td>{acc.currency}</td>
                    <td className="tabular-nums" style={{ fontWeight: 700, color: acc.currentBalance < 0 ? '#D94C42' : 'inherit' }}>
                      {formatCurrency(acc.currentBalance, acc.currency)}
                    </td>
                    <td><span className={`badge ${acc.riskLevel === 'Critical' ? 'badge-critical' : acc.riskLevel === 'High' ? 'badge-high' : 'badge-neutral'}`}>{acc.riskLevel}</span></td>
                    <td>{acc.overdraftAllowed ? `Yes (${formatCurrency(acc.overdraftLimit)})` : 'Prohibited'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Transactions */}
      {activeTab === 'transactions' && (
        <div className="app-card">
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Direction</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customerTxns.map((tx) => (
                  <tr key={tx.id} className="app-table-clickable-row" onClick={() => router.push(`/app/transactions/${tx.id}`)}>
                    <td><strong>{tx.id}</strong></td>
                    <td><span className="badge badge-neutral">{tx.type}</span></td>
                    <td className="tabular-nums" style={{ fontWeight: 700 }}>{formatCurrency(tx.amount, tx.currency)}</td>
                    <td><span className={`badge ${tx.direction === 'Debit' ? 'badge-neutral' : 'badge-success'}`}>{tx.direction}</span></td>
                    <td><span className={`badge ${tx.riskScore >= 80 ? 'badge-critical' : tx.riskScore >= 50 ? 'badge-medium' : 'badge-low'}`}>{tx.riskScore}</span></td>
                    <td><span className={`badge ${tx.status === 'Flagged' ? 'badge-critical' : 'badge-neutral'}`}>{tx.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Alerts & Cases */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {customerAlerts.map((al) => (
            <div key={al.id} className="app-card" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => router.push(`/app/alerts/${al.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={15} color="#D94C42" />
                  <strong>{al.id}</strong>
                  <span className={`badge ${al.severity === 'Critical' ? 'badge-critical' : 'badge-high'}`}>{al.severity}</span>
                </div>
                <span className="badge badge-neutral">{al.status}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#59554E' }}>{al.title}</div>
              <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '4px' }}>Score: {al.riskScore} · Rules: {al.ruleIds.join(', ')}</div>
            </div>
          ))}
          {customerCases.map((c) => (
            <div key={c.id} className="app-card" style={{ padding: '16px 20px', cursor: 'pointer' }} onClick={() => router.push(`/app/cases/${c.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={15} color="#C7A16B" />
                  <strong>{c.id}</strong>
                  <span className="badge badge-neutral">{c.priority}</span>
                </div>
                <span className="badge badge-medium">{c.status}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#59554E' }}>{c.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
