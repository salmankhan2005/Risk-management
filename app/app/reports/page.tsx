'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Download, FileText, RefreshCw, Printer } from 'lucide-react';
import { useRiskWatch } from '@/lib/store';
import {
  AlertSeverityChart,
  RuleTriggerChart,
  RiskScoreHistogram,
  TransactionActivityChart,
} from '@/components/ui/AppCharts';
import { formatCurrency } from '@/lib/data';

// ─── Print stylesheet injected once into <head> ───────────────────────────────
const PRINT_CSS = `
@media print {
  /* Hide everything except the report content */
  body > * { display: none !important; }
  #riskwatch-print-root { display: block !important; }

  #riskwatch-print-root {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    color: #111;
    background: #fff;
    margin: 0;
    padding: 0;
  }

  .print-page {
    padding: 20mm 18mm;
    page-break-after: always;
  }
  .print-page:last-child { page-break-after: avoid; }

  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 10pt;
    margin-bottom: 18pt;
  }
  .print-brand { font-size: 16pt; font-weight: 800; letter-spacing: -.02em; }
  .print-brand small { font-size: 9pt; font-weight: 400; color: #555; display: block; }
  .print-meta { font-size: 8.5pt; color: #555; text-align: right; line-height: 1.6; }

  .print-section-title {
    font-size: 13pt;
    font-weight: 700;
    margin: 16pt 0 8pt;
    padding-bottom: 4pt;
    border-bottom: 1px solid #ddd;
    color: #1a1a1a;
  }

  .print-kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10pt;
    margin-bottom: 16pt;
  }
  .print-kpi {
    border: 1px solid #ddd;
    border-radius: 4pt;
    padding: 9pt 11pt;
  }
  .print-kpi-label { font-size: 7.5pt; text-transform: uppercase; letter-spacing: .07em; color: #666; font-weight: 700; margin-bottom: 3pt; }
  .print-kpi-value { font-size: 18pt; font-weight: 800; color: #1a1a1a; }
  .print-kpi.risk .print-kpi-value { color: #8b3a2a; }

  .print-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 8pt; }
  .print-table th {
    background: #f5f5f5;
    text-align: left;
    padding: 5pt 8pt;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: .06em;
    font-weight: 700;
    border: 1px solid #ddd;
  }
  .print-table td {
    padding: 5pt 8pt;
    border: 1px solid #e5e5e5;
    vertical-align: middle;
  }
  .print-table tr:nth-child(even) td { background: #fafafa; }

  .print-badge {
    display: inline-block;
    padding: 1pt 5pt;
    border-radius: 3pt;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
  }
  .print-badge-ok { background: #e6f0e3; color: #2e5c28; border: 1px solid #b5d4ae; }
  .print-badge-risk { background: #fce9e7; color: #8b2e28; border: 1px solid #f0b8b3; }

  .print-footer {
    margin-top: 20pt;
    padding-top: 8pt;
    border-top: 1px solid #ddd;
    font-size: 7.5pt;
    color: #888;
    display: flex;
    justify-content: space-between;
  }

  .print-bar-chart { margin: 8pt 0 16pt; }
  .print-bar-row { display: flex; align-items: center; gap: 8pt; margin-bottom: 5pt; font-size: 8.5pt; }
  .print-bar-label { width: 100pt; text-align: right; color: #444; flex-shrink: 0; }
  .print-bar-track { flex: 1; height: 10pt; background: #f0f0f0; border-radius: 2pt; }
  .print-bar-fill { height: 100%; border-radius: 2pt; background: #7a4228; }
  .print-bar-value { width: 40pt; color: #333; font-weight: 600; }
}
`;

function injectPrintCSS() {
  if (document.getElementById('riskwatch-print-css')) return;
  const style = document.createElement('style');
  style.id = 'riskwatch-print-css';
  style.textContent = PRINT_CSS;
  document.head.appendChild(style);
}

// ─── Report types ─────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  { id: 'executive',   label: 'Executive Summary',        description: 'High-level risk KPIs and trend overview' },
  { id: 'transaction', label: 'Transaction Risk Report',   description: 'Detailed flagged transaction analysis' },
  { id: 'alert',       label: 'Alert Analytics Report',    description: 'Alert severity distribution and rule performance' },
  { id: 'compliance',  label: 'Compliance Status Report',  description: 'KYC status, SAR eligibility, and case resolution' },
];

export default function ReportsPage() {
  const { transactions, alerts, rules, customers, accounts, cases } = useRiskWatch();
  const [reportType, setReportType] = useState('executive');
  const [exporting, setExporting] = useState(false);
  const printRootRef = useRef<HTMLDivElement>(null);

  // ── Derived metrics ─────────────────────────────────────────────────────────
  const totalVolume        = transactions.reduce((s, t) => s + t.amount, 0);
  const flaggedTxns        = transactions.filter((t) => t.status === 'Flagged');
  const criticalAlerts     = alerts.filter((a) => a.severity === 'Critical');
  const highAlerts         = alerts.filter((a) => a.severity === 'High');
  const openCases          = cases.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed');
  const highRiskCustomers  = customers.filter((c) => c.riskTier === 'High' || c.riskTier === 'Critical');
  const highRiskAccounts   = accounts.filter((a) => a.riskLevel === 'High' || a.riskLevel === 'Critical');

  const kycVerified   = customers.filter((c) => c.kycStatus === 'Verified').length;
  const kycReview     = customers.filter((c) => c.kycStatus === 'Requires Review').length;
  const kycPending    = customers.filter((c) => c.kycStatus === 'Pending').length;
  const alertResolved = alerts.filter((a) => a.status === 'Resolved').length;
  const caseResolved  = cases.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const suspended     = customers.filter((c) => c.status === 'Suspended').length;

  const severityCounts = {
    Critical : criticalAlerts.length,
    High     : highAlerts.length,
    Medium   : alerts.filter((a) => a.severity === 'Medium').length,
    Low      : alerts.filter((a) => a.severity === 'Low').length,
  };
  const maxSev = Math.max(...Object.values(severityCounts), 1);

  const reportLabel = REPORT_TYPES.find((r) => r.id === reportType)?.label ?? 'Report';
  const generatedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const generatedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // ── PDF export via browser print ────────────────────────────────────────────
  const handleExportPDF = useCallback(() => {
    injectPrintCSS();
    setExporting(true);

    // Build the hidden print DOM
    let printRoot = document.getElementById('riskwatch-print-root');
    if (!printRoot) {
      printRoot = document.createElement('div');
      printRoot.id = 'riskwatch-print-root';
      printRoot.style.display = 'none';
      document.body.appendChild(printRoot);
    }

    // Common header/footer fragments
    const headerHTML = `
      <div class="print-header">
        <div class="print-brand">
          RiskWatch
          <small>Financial Risk Intelligence Platform</small>
        </div>
        <div class="print-meta">
          Report: ${reportLabel}<br/>
          Dataset Seed: 20261022<br/>
          Generated: ${generatedOn} at ${generatedAt}<br/>
          Classification: Internal / Confidential
        </div>
      </div>`;

    const footerHTML = `
      <div class="print-footer">
        <span>RiskWatch · Synthetic Demonstration Data · Seed 20261022</span>
        <span>Generated ${generatedOn} ${generatedAt}</span>
      </div>`;

    // Build content by report type
    let bodyHTML = '';

    if (reportType === 'executive') {
      const kpis = [
        { label: 'Total Transaction Volume', value: formatCurrency(totalVolume), risk: false },
        { label: 'Flagged Transactions',      value: flaggedTxns.length.toLocaleString(), risk: true },
        { label: 'Critical Alerts',           value: criticalAlerts.length.toLocaleString(), risk: true },
        { label: 'High Severity Alerts',      value: highAlerts.length.toLocaleString(), risk: true },
        { label: 'Open Investigation Cases',  value: openCases.length.toLocaleString(), risk: true },
        { label: 'High / Critical Customers', value: highRiskCustomers.length.toLocaleString(), risk: true },
      ];

      bodyHTML = `
        <h2 class="print-section-title">Key Risk Indicators</h2>
        <div class="print-kpi-grid">
          ${kpis.map((k) => `
            <div class="print-kpi ${k.risk ? 'risk' : ''}">
              <div class="print-kpi-label">${k.label}</div>
              <div class="print-kpi-value">${k.value}</div>
            </div>`).join('')}
        </div>

        <h2 class="print-section-title">Alert Severity Distribution</h2>
        <div class="print-bar-chart">
          ${Object.entries(severityCounts).map(([sev, count]) => `
            <div class="print-bar-row">
              <div class="print-bar-label">${sev}</div>
              <div class="print-bar-track">
                <div class="print-bar-fill" style="width:${Math.round((count / maxSev) * 100)}%"></div>
              </div>
              <div class="print-bar-value">${count.toLocaleString()}</div>
            </div>`).join('')}
        </div>

        <h2 class="print-section-title">Portfolio Overview</h2>
        <table class="print-table">
          <thead><tr><th>Dimension</th><th>Count</th><th>Notes</th></tr></thead>
          <tbody>
            <tr><td>Total Customers</td><td>${customers.length.toLocaleString()}</td><td>Synthetic KYC entities</td></tr>
            <tr><td>Total Accounts</td><td>${accounts.length.toLocaleString()}</td><td>Savings, current & escrow</td></tr>
            <tr><td>Total Transactions</td><td>${transactions.length.toLocaleString()}</td><td>Full ledger entries</td></tr>
            <tr><td>Total Alerts</td><td>${alerts.length.toLocaleString()}</td><td>Rule-triggered signals</td></tr>
            <tr><td>Total Cases</td><td>${cases.length.toLocaleString()}</td><td>Investigation workflows</td></tr>
            <tr><td>Active Risk Rules</td><td>${rules.filter((r) => r.status === 'Active').length}</td><td>Published rules</td></tr>
          </tbody>
        </table>`;
    }

    if (reportType === 'transaction') {
      const riskBuckets = [
        { label: '0–20 (Low)',      count: transactions.filter((t) => t.riskScore < 20).length },
        { label: '21–40',           count: transactions.filter((t) => t.riskScore >= 20 && t.riskScore < 40).length },
        { label: '41–60 (Medium)',  count: transactions.filter((t) => t.riskScore >= 40 && t.riskScore < 60).length },
        { label: '61–80 (High)',    count: transactions.filter((t) => t.riskScore >= 60 && t.riskScore < 80).length },
        { label: '81–100 (Critical)', count: transactions.filter((t) => t.riskScore >= 80).length },
      ];
      const maxBucket = Math.max(...riskBuckets.map((b) => b.count), 1);

      const topFlagged = transactions
        .filter((t) => t.riskScore >= 60)
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 15);

      bodyHTML = `
        <h2 class="print-section-title">Risk Score Distribution</h2>
        <div class="print-bar-chart">
          ${riskBuckets.map((b) => `
            <div class="print-bar-row">
              <div class="print-bar-label">${b.label}</div>
              <div class="print-bar-track">
                <div class="print-bar-fill" style="width:${Math.round((b.count / maxBucket) * 100)}%"></div>
              </div>
              <div class="print-bar-value">${b.count.toLocaleString()}</div>
            </div>`).join('')}
        </div>

        <h2 class="print-section-title">High-Risk Transactions (Score ≥ 60)</h2>
        <table class="print-table">
          <thead>
            <tr>
              <th>Transaction ID</th><th>Account</th><th>Type</th>
              <th>Amount</th><th>Risk Score</th><th>Status</th><th>Rules Triggered</th>
            </tr>
          </thead>
          <tbody>
            ${topFlagged.map((t) => `
              <tr>
                <td style="font-family:monospace;font-size:8pt">${t.id}</td>
                <td style="font-family:monospace;font-size:8pt">${t.accountId}</td>
                <td>${t.type}</td>
                <td class="tabular-nums">${formatCurrency(t.amount, t.currency)}</td>
                <td style="font-weight:700;color:${t.riskScore >= 80 ? '#8b2e28' : '#7a4228'}">${t.riskScore}</td>
                <td>${t.status}</td>
                <td style="font-size:8pt">${(t.triggeredRules ?? []).join(', ') || '—'}</td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }

    if (reportType === 'alert') {
      const ruleTriggers: Record<string, number> = {};
      alerts.forEach((a) => {
        (a.ruleIds ?? []).forEach((r) => { ruleTriggers[r] = (ruleTriggers[r] ?? 0) + 1; });
      });
      const topRules = Object.entries(ruleTriggers).sort((a, b) => b[1] - a[1]).slice(0, 10);
      const maxRule = Math.max(...topRules.map((r) => r[1]), 1);

      bodyHTML = `
        <h2 class="print-section-title">Alert Severity Breakdown</h2>
        <div class="print-bar-chart">
          ${Object.entries(severityCounts).map(([sev, count]) => `
            <div class="print-bar-row">
              <div class="print-bar-label">${sev}</div>
              <div class="print-bar-track">
                <div class="print-bar-fill" style="width:${Math.round((count / maxSev) * 100)}%"></div>
              </div>
              <div class="print-bar-value">${count.toLocaleString()}</div>
            </div>`).join('')}
        </div>

        <h2 class="print-section-title">Top Triggered Rules</h2>
        <div class="print-bar-chart">
          ${topRules.map(([ruleId, count]) => `
            <div class="print-bar-row">
              <div class="print-bar-label">${ruleId}</div>
              <div class="print-bar-track">
                <div class="print-bar-fill" style="width:${Math.round((count / maxRule) * 100)}%"></div>
              </div>
              <div class="print-bar-value">${count}</div>
            </div>`).join('')}
        </div>

        <h2 class="print-section-title">Alert Status Summary</h2>
        <table class="print-table">
          <thead><tr><th>Status</th><th>Count</th><th>% of Total</th></tr></thead>
          <tbody>
            ${['New', 'Open', 'Investigating', 'Escalated', 'Resolved', 'Dismissed'].map((status) => {
              const c = alerts.filter((a) => a.status === status).length;
              return `<tr>
                <td>${status}</td>
                <td style="font-weight:700">${c.toLocaleString()}</td>
                <td>${alerts.length ? ((c / alerts.length) * 100).toFixed(1) : '0.0'}%</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    }

    if (reportType === 'compliance') {
      const compRows = [
        { metric: 'KYC Verified',             value: kycVerified,    total: customers.length, ok: true },
        { metric: 'KYC Requires Review',       value: kycReview,      total: customers.length, ok: false },
        { metric: 'KYC Pending',               value: kycPending,     total: customers.length, ok: false },
        { metric: 'Alerts Resolved',           value: alertResolved,  total: alerts.length,    ok: true },
        { metric: 'Cases Resolved / Closed',   value: caseResolved,   total: cases.length,     ok: true },
        { metric: 'Suspended Customers',       value: suspended,      total: customers.length, ok: false },
        { metric: 'High / Critical Risk Accounts', value: highRiskAccounts.length, total: accounts.length, ok: false },
        { metric: 'High / Critical Risk Customers', value: highRiskCustomers.length, total: customers.length, ok: false },
      ];

      bodyHTML = `
        <h2 class="print-section-title">Compliance Metrics</h2>
        <table class="print-table">
          <thead>
            <tr><th>Metric</th><th>Count</th><th>% of Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${compRows.map((r) => `
              <tr>
                <td>${r.metric}</td>
                <td style="font-weight:700">${r.value.toLocaleString()}</td>
                <td>${r.total ? ((r.value / r.total) * 100).toFixed(1) : '0.0'}%</td>
                <td>
                  <span class="print-badge ${r.ok ? 'print-badge-ok' : 'print-badge-risk'}">
                    ${r.ok ? 'Compliant' : 'Attention'}
                  </span>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`;
    }

    printRoot.innerHTML = `
      <div class="print-page">
        ${headerHTML}
        ${bodyHTML}
        ${footerHTML}
      </div>`;

    // Trigger browser print dialog (saves as PDF on all modern browsers)
    printRoot.style.display = 'block';
    requestAnimationFrame(() => {
      window.print();
      printRoot!.style.display = 'none';
      setExporting(false);
    });
  }, [reportType, transactions, alerts, rules, customers, accounts, cases,
      totalVolume, flaggedTxns, criticalAlerts, highAlerts, openCases,
      highRiskCustomers, highRiskAccounts, kycVerified, kycReview, kycPending,
      alertResolved, caseResolved, suspended, severityCounts, maxSev,
      reportLabel, generatedOn, generatedAt]);

  return (
    <div className="app-page-wrapper" ref={printRootRef}>
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Reports</h1>
          <p>Generate, preview, and export risk intelligence reports for compliance, management, and regulatory purposes.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
            title="Print current view"
          >
            <Printer size={13} /> Print
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExportPDF}
            disabled={exporting}
            style={{ minWidth: '130px' }}
          >
            {exporting
              ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
              : <><Download size={13} /> Export PDF</>}
          </button>
        </div>
      </div>

      {/* ── Report type selector ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '4px' }}>
        {REPORT_TYPES.map((rt) => (
          <div
            key={rt.id}
            className="app-card"
            style={{
              padding: '14px 16px',
              cursor: 'pointer',
              border: reportType === rt.id ? '2px solid #AD7048' : undefined,
              background: reportType === rt.id ? 'rgba(173,112,72,0.06)' : undefined,
              transition: 'border-color 120ms ease, background 120ms ease',
            }}
            onClick={() => setReportType(rt.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FileText size={13} color={reportType === rt.id ? '#AD7048' : '#6F6A60'} />
              <strong style={{ fontSize: '12px', color: reportType === rt.id ? '#AD7048' : 'var(--app-ink)' }}>
                {rt.label}
              </strong>
            </div>
            <p style={{ fontSize: '10.5px', color: '#6F6A60', margin: 0, lineHeight: 1.4 }}>{rt.description}</p>
          </div>
        ))}
      </div>

      {/* ── EXECUTIVE SUMMARY ─────────────────────────────── */}
      {reportType === 'executive' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="app-card">
            <div className="app-card-header">
              <div>
                <h3 className="app-card-title">Executive Risk Summary</h3>
                <p className="app-card-subtitle">Seed: 20261022 · Generated: {generatedOn}</p>
              </div>
              <span className="badge badge-success">Active Dataset</span>
            </div>
            <div className="app-card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Total Transaction Volume', value: formatCurrency(totalVolume), risk: false },
                  { label: 'Flagged Transactions',      value: flaggedTxns.length.toLocaleString(), risk: true },
                  { label: 'Critical Alerts',           value: criticalAlerts.length.toLocaleString(), risk: true },
                  { label: 'Open Cases',                value: openCases.length.toLocaleString(), risk: true },
                  { label: 'High / Critical Customers', value: highRiskCustomers.length.toLocaleString(), risk: true },
                  { label: 'Accounts Under Review',     value: highRiskAccounts.length.toLocaleString(), risk: false },
                ].map((kpi) => (
                  <div key={kpi.label} style={{ padding: '12px 14px', background: 'var(--app-surface-muted)', borderRadius: '7px', border: '1px solid var(--app-line)' }}>
                    <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--app-muted)', fontWeight: 700, marginBottom: '4px' }}>{kpi.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: kpi.risk ? '#AD7048' : 'var(--app-ink)', fontFamily: 'monospace' }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <AlertSeverityChart alerts={alerts} />
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACTION REPORT ────────────────────────────── */}
      {reportType === 'transaction' && (
        <div className="app-card">
          <div className="app-card-header">
            <h3 className="app-card-title">Transaction Risk Analysis</h3>
            <span className="badge badge-neutral">{transactions.length.toLocaleString()} records</span>
          </div>
          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TransactionActivityChart transactions={transactions} />
            <RiskScoreHistogram transactions={transactions} />
          </div>
        </div>
      )}

      {/* ── ALERT REPORT ──────────────────────────────────── */}
      {reportType === 'alert' && (
        <div className="app-card">
          <div className="app-card-header">
            <h3 className="app-card-title">Alert Analytics</h3>
            <span className="badge badge-neutral">{alerts.length.toLocaleString()} alerts</span>
          </div>
          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <AlertSeverityChart alerts={alerts} />
            <RuleTriggerChart alerts={alerts} rules={rules} />
          </div>
        </div>
      )}

      {/* ── COMPLIANCE REPORT ─────────────────────────────── */}
      {reportType === 'compliance' && (
        <div className="app-card">
          <div className="app-card-header">
            <h3 className="app-card-title">Compliance Status</h3>
            <span className="badge badge-neutral">{generatedOn}</span>
          </div>
          <div className="app-card-body">
            <table className="app-table">
              <thead>
                <tr><th>Metric</th><th>Count</th><th>% of Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {[
                  { metric: 'KYC Verified',                  value: kycVerified,                  total: customers.length, ok: true },
                  { metric: 'KYC Requires Review',           value: kycReview,                    total: customers.length, ok: false },
                  { metric: 'KYC Pending',                   value: kycPending,                   total: customers.length, ok: false },
                  { metric: 'Alerts Resolved',               value: alertResolved,                total: alerts.length,    ok: true },
                  { metric: 'Cases Resolved / Closed',       value: caseResolved,                 total: cases.length,     ok: true },
                  { metric: 'Suspended Customers',           value: suspended,                    total: customers.length, ok: false },
                  { metric: 'High / Critical Risk Accounts', value: highRiskAccounts.length,      total: accounts.length,  ok: false },
                  { metric: 'High / Critical Risk Customers',value: highRiskCustomers.length,     total: customers.length, ok: false },
                ].map((row) => (
                  <tr key={row.metric}>
                    <td>{row.metric}</td>
                    <td className="tabular-nums" style={{ fontWeight: 700 }}>{row.value.toLocaleString()}</td>
                    <td className="tabular-nums">{row.total ? ((row.value / row.total) * 100).toFixed(1) : '0.0'}%</td>
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
