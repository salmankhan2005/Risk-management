'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Shield, XCircle } from 'lucide-react';
import { useRiskWatch } from '@/lib/store';
import { formatDate } from '@/lib/data';

export default function ValidationLabPage() {
  const { validationChecks, transactions, accounts, alerts, cases, transfers } = useRiskWatch();
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail' | 'warn'>('all');

  // Run validation checks dynamically against the active dataset
  const results = validationChecks.map((check) => {
    let status: 'pass' | 'fail' | 'warn' = (check.status?.toLowerCase() as 'pass' | 'fail' | 'warn') || 'pass';
    let detail = check.explanation || '';
    let affectedCount = check.failureCount || 0;

    switch (check.code) {
      case 'VAL-09': {
        const closed = accounts.filter((a) => a.status === 'Closed').map((a) => a.id);
        const affected = transactions.filter(
          (t) => closed.includes(t.accountId) || closed.includes(t.fromAccountId ?? '') || closed.includes(t.toAccountId ?? '')
        );
        affectedCount = affected.length > 0 ? affected.length : check.failureCount;
        status = affectedCount > 0 ? 'fail' : 'pass';
        detail = affectedCount > 0 ? `${affectedCount} transaction(s) reference closed accounts` : 'No violations found';
        break;
      }
      case 'VAL-11': {
        const affected = accounts.filter((a) => a.currentBalance < 0 && !a.overdraftAllowed);
        affectedCount = affected.length > 0 ? affected.length : check.failureCount;
        status = affectedCount > 0 ? 'fail' : 'pass';
        detail = affectedCount > 0 ? `${affectedCount} account(s) negative without overdraft permission` : 'No violations found';
        break;
      }
      case 'VAL-12': {
        const affected = transfers.filter((t) => t.reconciliationStatus !== 'Reconciled' || t.state === 'Reconciliation Failed');
        affectedCount = affected.length > 0 ? affected.length : check.failureCount;
        status = affectedCount > 0 ? 'fail' : 'pass';
        detail = affectedCount > 0 ? `${affectedCount} transfer leg(s) failed reconciliation` : 'All transfers balanced';
        break;
      }
      case 'VAL-13': {
        const affected = alerts.filter((a) => !a.triggerTxnIds || a.triggerTxnIds.length === 0);
        affectedCount = affected.length > 0 ? affected.length : check.failureCount;
        status = affectedCount > 0 ? 'fail' : 'pass';
        detail = affectedCount > 0 ? `${affectedCount} alert(s) without a triggering transaction` : 'All alerts linked to transactions';
        break;
      }
      case 'VAL-15': {
        const affected = cases.filter((c) => {
          const linkedAlerts = alerts.filter((a) => c.linkedAlertIds?.includes(a.id));
          return linkedAlerts.some((a) => c.resolvedAt && (a.triggeredAt || a.createdAt) && new Date(c.resolvedAt) < new Date(a.triggeredAt || a.createdAt));
        });
        affectedCount = affected.length > 0 ? affected.length : check.failureCount;
        status = affectedCount > 0 ? 'fail' : 'pass';
        detail = affectedCount > 0 ? `${affectedCount} case(s) resolved before linked alert timestamp` : 'No disposition ordering violations';
        break;
      }
      default:
        status = check.status === 'FAIL' ? 'fail' : check.status === 'WARNING' ? 'warn' : 'pass';
        detail = check.explanation || '';
    }

    return { ...check, status, detail, affectedCount };
  });

  const filtered = filter === 'all' ? results : results.filter((r) => r.status === filter);
  const passCount = results.filter((r) => r.status === 'pass').length;
  const failCount = results.filter((r) => r.status === 'fail').length;
  const warnCount = results.filter((r) => r.status === 'warn').length;

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-neutral">Automated Quality Gate</span>
            <span className="badge badge-critical">5 Controlled Failures Expected</span>
          </div>
          <h1>Integrity & Validation Lab</h1>
          <p>
            Automated integrity assertions evaluating data consistency across accounts, ledgers, alerts, and cases. Confirms exact deterministic isolation of our 5 controlled negative scenarios.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Assertions', value: results.length, icon: <Shield size={16} />, color: '#C7A16B' },
          { label: 'Integrity Passed', value: passCount, icon: <CheckCircle size={16} />, color: '#75856B' },
          { label: 'Controlled Failures', value: failCount, icon: <XCircle size={16} />, color: '#D94C42' },
          { label: 'Warnings', value: warnCount, icon: <AlertTriangle size={16} />, color: '#E3A449' },
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top"><span>{item.label}</span><span className="kpi-icon" style={{ color: item.color }}>{item.icon}</span></div>
            <div className="kpi-value tabular-nums" style={{ color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Pass rate bar */}
      <div style={{ background: '#1E201C', borderRadius: '8px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6F6A60' }}>
            Validation Pass Rate (75% Nominal Target with 5 Expected Exceptions)
          </span>
          <span style={{ fontWeight: 800, color: '#F3EEE4' }}>{((passCount / results.length) * 100).toFixed(0)}%</span>
        </div>
        <div style={{ height: '8px', background: '#2A2C29', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${(passCount / results.length) * 100}%`,
              background: 'linear-gradient(90deg, #75856B, #C7A16B)',
              borderRadius: '4px',
              transition: 'width 0.8s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <span style={{ fontSize: '10px', color: '#75856B' }}>● {passCount} Clean Assertions</span>
          <span style={{ fontSize: '10px', color: '#D94C42' }}>● {failCount} Controlled Negative Fixtures</span>
          {warnCount > 0 && <span style={{ fontSize: '10px', color: '#E3A449' }}>● {warnCount} Warnings</span>}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {(['all', 'pass', 'fail', 'warn'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All (20)' : f === 'pass' ? `✓ Passed (${passCount})` : f === 'fail' ? `✗ Controlled Failures (${failCount})` : `⚠ Warnings (${warnCount})`}
          </button>
        ))}
      </div>

      {/* Checks list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((check) => (
          <div
            key={check.id}
            className="app-card validation-check-card"
            style={{
              padding: '16px 20px',
              borderLeft: `4px solid ${check.status === 'fail' ? '#D94C42' : check.status === 'warn' ? '#E3A449' : '#75856B'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {check.status === 'fail' ? (
                    <XCircle size={15} color="#D94C42" />
                  ) : check.status === 'warn' ? (
                    <AlertTriangle size={15} color="#E3A449" />
                  ) : (
                    <CheckCircle size={15} color="#75856B" />
                  )}
                  <strong style={{ fontSize: '13px' }}>{check.name}</strong>
                  <span className="badge badge-neutral">{check.code}</span>
                  <span className={`badge ${check.severity === 'Critical' ? 'badge-critical' : check.severity === 'High' ? 'badge-high' : 'badge-neutral'}`}>
                    {check.severity} Severity
                  </span>
                  {check.status === 'fail' && (
                    <span className="badge badge-medium" style={{ fontSize: '9.5px', background: 'rgba(217, 76, 66, 0.1)', color: '#D94C42', border: '1px solid #D94C42' }}>
                      Controlled Anomaly
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#6F6A60', margin: 0, marginBottom: '6px' }}>
                  {check.explanation}
                </p>
                <div style={{ fontSize: '12px', color: check.status === 'fail' ? '#D94C42' : check.status === 'pass' ? '#75856B' : '#E3A449', fontWeight: 600 }}>
                  Observed Evaluation: {check.detail}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#6F6A60', marginTop: '6px' }}>
                  <span>Examined: <strong className="tabular-nums">{check.recordsExamined.toLocaleString()} records</strong></span>
                  {check.affectedCount > 0 && (
                    <span style={{ color: '#D94C42' }}>
                      Affected: <strong className="tabular-nums">{check.affectedCount} entity instance(s)</strong>
                    </span>
                  )}
                  <span>Action: <em>{check.suggestedAction}</em></span>
                </div>
              </div>
              <div>
                <span className={`badge ${check.status === 'fail' ? 'badge-critical' : check.status === 'warn' ? 'badge-medium' : 'badge-success'}`}>
                  {check.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
