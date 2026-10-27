'use client';

import React, { useState } from 'react';
import { Download, FileText, RefreshCw, Settings } from 'lucide-react';
import { useRiskWatch } from '@/lib/store';
import {
  TransactionActivityChart,
  AlertSeverityChart,
  RuleTriggerChart,
  RiskScoreHistogram,
} from '@/components/ui/AppCharts';
import { formatCurrency } from '@/lib/data';

export default function ReportsPage() {
  const { transactions, alerts, rules, customers, accounts, cases } = useRiskWatch();
  const [reportType, setReportType] = useState('executive');
  const [generating, setGenerating] = useState(false);

  const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
  const flaggedTxns = transactions.filter((t) => t.status === 'Flagged');
  const criticalAlerts = alerts.filter((a) => a.severity === 'Critical');
  const openCases = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed');
  const highRiskCustomers = customers.filter((c) => c.riskTier === 'High' || c.riskTier === 'Critical');

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1800);
  };

  const reportTypes = [
    { id: 'executive', label: 'Executive Summary', description: 'High-level risk KPIs and trend overview' },
    { id: 'transaction', label: 'Transaction Risk Report', description: 'Detailed flagged transaction analysis' },
    { id: 'alert', label: 'Alert Analytics Report', description: 'Alert severity distribution and rule performance' },
    { id: 'compliance', label: 'Compliance Status Report', description: 'KYC status, SAR eligibility, and case resolution' },
  ];

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Reports</h1>
          <p>Generate, preview, and export risk intelligence reports for compliance, management, and regulatory purposes.</p>
        </div>
        <button type="button" className="btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Download size={13} /> Export PDF</>}
        </button>
      </div>

      {/* Report type selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {reportTypes.map((rt) => (
          <div
            key={rt.id}
            className={`app-card ${reportType === rt.id ? 'app-card-selected' : ''}`}
            style={{ padding: '16px 18px', cursor: 'pointer', borderColor: reportType === rt.id ? '#AD7048' : undefined, transition: 'all 0.2s' }}
            onClick={() => setReportType(rt.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FileText size={14} color={reportType === rt.id ? '#AD7048' : '#6F6A60'} />
              <strong style={{ fontSize: '12.5px', color: reportType === rt.id ? '#AD7048' : '#F3EEE4' }}>{rt.label}</strong>
            </div>
            <p style={{ fontSize: '11px', color: '#6F6A60', margin: 0 }}>{rt.description}</p>
          </div>
        ))}
      </div>

      {/* EXECUTIVE SUMMARY */}
      {reportType === 'executive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="app-card">
            <div className="app-card-header" style={{ borderBottom: '1px solid #2A2C29', marginBottom: '16px' }}>
              <h3 className="app-card-title" style={{ fontSize: '16px' }}>Executive Risk Summary</h3>
              <span style={{ fontSize: '10px', color: '#6F6A60' }}>Seed: 20261022 · Generated: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="app-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Transaction Volume', value: formatCurrency(totalVolume), risk: false },
                  { label: 'Flagged Transactions', value: flaggedTxns.length.toLocaleString(), risk: true },
                  { label: 'Critical Alerts', value: criticalAlerts.length.toLocaleString(), risk: true },
                  { label: 'Open Cases', value: openCases.length.toLocaleString(), risk: true },
                  { label: 'High/Critical Risk Customers', value: highRiskCustomers.length.toLocaleString(), risk: true },
                  { label: 'Accounts Under Review', value: accounts.filter((a) => a.riskLevel === 'High' || a.riskLevel === 'Critical').length.toLocaleString(), risk: false },
                ].map((kpi) => (
                  <div key={kpi.label} style={{ padding: '14px', background: '#1E201C', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6F6A60', fontWeight: 700, marginBottom: '4px' }}>{kpi.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: kpi.risk ? '#E3A449' : '#F3EEE4', fontFamily: 'var(--font-heading)' }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <AlertSeverityChart alerts={alerts} />
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION REPORT */}
      {reportType === 'transaction' && (
        <div className="app-card">
          <div className="app-card-header">
            <h3 className="app-card-title">Transaction Risk Analysis</h3>
          </div>
          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TransactionActivityChart transactions={transactions} />
            <RiskScoreHistogram transactions={transactions} />
          </div>
        </div>
      )}

      {/* ALERT REPORT */}
      {reportType === 'alert' && (
        <div className="app-card">
          <div className="app-card-header">
            <h3 className="app-card-title">Alert Analytics</h3>
          </div>
          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AlertSeverityChart alerts={alerts} />
            <RuleTriggerChart alerts={alerts} rules={rules} />
          </div>
        </div>
      )}

      {/* COMPLIANCE REPORT */}
      {reportType === 'compliance' && (
        <div className="app-card">
          <div className="app-card-header">
            <h3 className="app-card-title">Compliance Status</h3>
          </div>
          <div className="app-card-body">
            <table className="app-table">
              <thead>
                <tr><th>Metric</th><th>Count</th><th>% of Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {[
                  { metric: 'KYC Verified', value: customers.filter((c) => c.kycStatus === 'Verified').length, total: customers.length, ok: true },
                  { metric: 'KYC Requires Review', value: customers.filter((c) => c.kycStatus === 'Requires Review').length, total: customers.length, ok: false },
                  { metric: 'KYC Pending', value: customers.filter((c) => c.kycStatus === 'Pending').length, total: customers.length, ok: false },
                  { metric: 'Alerts Resolved', value: alerts.filter((a) => a.status === 'Resolved').length, total: alerts.length, ok: true },
                  { metric: 'Cases Resolved', value: cases.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length, total: cases.length, ok: true },
                  { metric: 'Suspended Customers', value: customers.filter((c) => c.status === 'Suspended').length, total: customers.length, ok: false },
                ].map((row) => (
                  <tr key={row.metric}>
                    <td>{row.metric}</td>
                    <td className="tabular-nums" style={{ fontWeight: 700 }}>{row.value.toLocaleString()}</td>
                    <td className="tabular-nums">{((row.value / row.total) * 100).toFixed(1)}%</td>
                    <td><span className={`badge ${row.ok ? 'badge-success' : 'badge-critical'}`}>{row.ok ? 'Compliant' : 'Attention'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
