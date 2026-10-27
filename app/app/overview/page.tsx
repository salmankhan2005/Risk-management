'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Cpu,
  CreditCard,
  FileCheck2,
  History,
  Layers,
  Repeat,
  ShieldAlert,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  AlertSeverityChart,
  RiskScoreHistogram,
  TopTriggeredRulesChart,
  TransactionActivityChart,
} from '@/components/ui/AppCharts';
import { formatCurrency, formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';

export default function OverviewPage() {
  const router = useRouter();
  const {
    metadata,
    customers,
    accounts,
    transactions,
    alerts,
    cases,
    rules,
    auditEvents,
    validationChecks,
  } = useRiskWatch();

  // Synthetic 7-day timeline data for the chart
  const timelineData = [
    { date: 'Oct 16', volume: 13800, amount: 24500000 },
    { date: 'Oct 17', volume: 14200, amount: 28900000 },
    { date: 'Oct 18', volume: 15600, amount: 31200000 },
    { date: 'Oct 19', volume: 12400, amount: 21800000 },
    { date: 'Oct 20', volume: 14900, amount: 29400000 },
    { date: 'Oct 21', volume: 16800, amount: 38200000 },
    { date: 'Oct 22', volume: 12300, amount: 25000000 },
  ];

  // Alert severities count
  const severityCounts = {
    critical: alerts.filter((a) => a.severity === 'Critical').length + 74,
    high: alerts.filter((a) => a.severity === 'High').length + 238,
    medium: alerts.filter((a) => a.severity === 'Medium').length + 412,
    low: alerts.filter((a) => a.severity === 'Low').length + 276,
  };

  // Risk Score Histogram ranges
  const histogramData = [
    { range: '0-20', count: 64200 },
    { range: '21-40', count: 21800 },
    { range: '41-60', count: 8900 },
    { range: '61-80', count: 3600 },
    { range: '81-100', count: 1500 },
  ];

  // High risk transactions
  const highRiskTxns = transactions.filter((t) => t.riskScore >= 70).slice(0, 5);

  // Open cases
  const openCases = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed');

  // Failed validation checks count
  const failedChecks = validationChecks.filter((c) => c.status === 'FAIL');

  return (
    <div className="app-page-wrapper">
      {/* Page Title Header */}
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Financial Risk Intelligence</h1>
          <p>
            Monitor transaction behavior, prioritize risk signals, and investigate linked entities with transparent rules.
          </p>
        </div>
        <div className="app-page-actions">
          <Link href="/app/data-generator" className="btn-secondary">
            <Cpu size={14} color="#AD7048" /> Seed & Generator
          </Link>
          <Link href="/app/validation" className="btn-primary">
            <FileCheck2 size={14} /> Validation Lab (20 Checks)
          </Link>
        </div>
      </div>

      {/* Dataset Information Strip */}
      <div className="dataset-info-strip">
        <div className="dataset-info-items">
          <div className="dataset-info-item">
            <span>Deterministic Seed:</span>
            <strong>{metadata.seed}</strong>
          </div>
          <div className="dataset-info-item">
            <span>Run Identifier:</span>
            <strong>{metadata.runIdentifier}</strong>
          </div>
          <div className="dataset-info-item">
            <span>Generator Version:</span>
            <strong>{metadata.generatorVersion}</strong>
          </div>
          <div className="dataset-info-item">
            <span>Validation Status:</span>
            <span className="badge badge-synthetic" style={{ fontSize: '10px' }}>
              {metadata.validationStatus}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#C7A16B' }}>
          <Clock size={13} /> Created: {formatDate(metadata.createdAt)}
        </div>
      </div>

      {/* Controlled Negative Scenarios Banner */}
      <div className="negative-scenario-banner">
        <AlertTriangle size={18} color="#FCA5A5" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <strong>5 Controlled Negative Test Scenarios Present:</strong> Synthetic test records with intentional anomalies
          (closed account usage, negative overdraft breach, transfer mismatch, orphan alert, and anachronistic disposition)
          are isolated in the ground-truth registry and detected by the Validation Lab.
        </div>
        <Link href="/app/ground-truth" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap' }}>
          View Ground Truth <ArrowRight size={12} />
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => router.push('/app/customers')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span>Customers</span>
            <Users size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalCustomers.toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="badge badge-neutral">Baseline Synthetic</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => router.push('/app/accounts')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span>Accounts</span>
            <Wallet size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalAccounts.toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="badge badge-neutral">Savings, Current, Escrow</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => router.push('/app/transactions')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span>Transactions</span>
            <CreditCard size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalTransactions.toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="badge badge-neutral">Reconciled Arithmetic</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => router.push('/app/alerts')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span>Alert Signals</span>
            <AlertTriangle size={16} style={{ color: '#D94C42' }} />
          </div>
          <div className="kpi-value tabular-nums" style={{ color: '#D94C42' }}>
            {metadata.totalAlerts.toLocaleString()}
          </div>
          <div className="kpi-footer">
            <span className="badge badge-critical">{severityCounts.critical} Critical</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => router.push('/app/cases')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span>Open Cases</span>
            <Briefcase size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value tabular-nums" style={{ color: '#AD7048' }}>
            {openCases.length}
          </div>
          <div className="kpi-footer">
            <span className="badge badge-medium">Under Investigation</span>
          </div>
        </div>

        <div className="kpi-card" onClick={() => router.push('/app/validation')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span>Validation Checks</span>
            <FileCheck2 size={16} className="kpi-icon" />
          </div>
          <div className="kpi-value tabular-nums" style={{ color: failedChecks.length > 0 ? '#D94C42' : '#75856B' }}>
            {validationChecks.length - failedChecks.length} / {validationChecks.length}
          </div>
          <div className="kpi-footer">
            <span className="badge badge-critical">{failedChecks.length} Known Exceptions</span>
          </div>
        </div>
      </div>

      {/* Row 1: Activity Timeline Chart & Alert Severity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' }}>
        <TransactionActivityChart dailyData={timelineData} />
        <AlertSeverityChart severities={severityCounts} />
      </div>

      {/* Row 2: Top Triggered Rules & Risk Score Histogram */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        <TopTriggeredRulesChart
          rules={rules.map((r) => ({
            name: r.name,
            triggersCount: r.triggersCount,
            category: r.category,
          }))}
        />
        <RiskScoreHistogram distribution={histogramData} />
      </div>

      {/* Row 3: High-Risk Transactions Queue & Priority Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Recent High-Risk Transactions Table */}
        <div className="app-card">
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Priority Transaction Queue</h3>
              <p className="app-card-subtitle">Highest risk ledger items requiring analyst review</p>
            </div>
            <Link href="/app/transactions" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Direction</th>
                  <th>Risk Score</th>
                  <th>Triggered Rule</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {highRiskTxns.map((tx) => (
                  <tr
                    key={tx.id}
                    className="app-table-clickable-row"
                    onClick={() => router.push(`/app/transactions/${tx.id}`)}
                  >
                    <td><strong>{tx.id}</strong></td>
                    <td className="tabular-nums" style={{ fontWeight: 700 }}>
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td>
                      <span className={`badge ${tx.direction === 'Debit' ? 'badge-neutral' : 'badge-success'}`}>
                        {tx.direction}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${tx.riskScore >= 80 ? 'badge-critical' : 'badge-medium'}`}>
                        {tx.riskScore}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: '#6F6A60' }}>
                      {tx.triggeredRules[0] || 'Manual Flag'}
                    </td>
                    <td>
                      <span className="badge badge-high">{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Alert Signals */}
        <div className="app-card">
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Priority Risk Alerts</h3>
              <p className="app-card-subtitle">Aggregated multi-rule signal clusters</p>
            </div>
            <Link href="/app/alerts" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
              All alerts <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.slice(0, 4).map((al) => (
              <div
                key={al.id}
                onClick={() => router.push(`/app/alerts/${al.id}`)}
                style={{
                  padding: '10px 12px',
                  background: '#F3EEE4',
                  borderRadius: '6px',
                  border: '1px solid #E7DFD3',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <AlertTriangle size={13} color={al.severity === 'Critical' ? '#D94C42' : '#AD7048'} />
                    <strong style={{ fontSize: '12px' }}>{al.id}</strong>
                  </div>
                  <span className={`badge ${al.severity === 'Critical' ? 'badge-critical' : 'badge-high'}`}>
                    {al.severity} · {al.riskScore}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#2B2A26' }}>{al.title}</div>
                <div style={{ fontSize: '10.5px', color: '#6F6A60' }}>Status: {al.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Open Cases & Recent Audit Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Open Investigations */}
        <div className="app-card">
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Active Case Investigations</h3>
              <p className="app-card-subtitle">Analyst assignments and workflow states</p>
            </div>
            <Link href="/app/cases" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
              Cases workspace <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Analyst</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className="app-table-clickable-row"
                    onClick={() => router.push(`/app/cases/${c.id}`)}
                  >
                    <td><strong>{c.id}</strong></td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </td>
                    <td>
                      <span className={`badge ${c.priority === 'P1' ? 'badge-critical' : 'badge-neutral'}`}>
                        {c.priority}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-medium">{c.status}</span>
                    </td>
                    <td style={{ fontSize: '11px', color: '#6F6A60' }}>{c.assignedAnalyst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit Events */}
        <div className="app-card">
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Recent Audit Log</h3>
              <p className="app-card-subtitle">Append-only chronological state changes</p>
            </div>
            <Link href="/app/audit" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }}>
              Full audit trail <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditEvents.slice(0, 4).map((aud) => (
              <div
                key={aud.id}
                style={{
                  padding: '9px 11px',
                  background: '#F3EEE4',
                  borderRadius: '6px',
                  border: '1px solid #E7DFD3',
                  fontSize: '11.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#171713' }}>{aud.action}</span>
                  <span style={{ fontSize: '10px', color: '#6F6A60' }}>{formatDate(aud.timestamp)}</span>
                </div>
                <div style={{ color: '#59554E', fontSize: '11px' }}>
                  Actor: <strong>{aud.actor}</strong> ({aud.role}) · Entity: {aud.entityType} ({aud.entityId})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
