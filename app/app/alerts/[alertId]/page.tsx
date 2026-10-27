'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Bell, Briefcase, CheckCircle, Clock, Shield } from 'lucide-react';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';

export default function AlertDetailPage({ params }: { params: Promise<{ alertId: string }> }) {
  const { alertId } = use(params);
  const router = useRouter();
  const { alerts, customers, transactions, cases, updateAlert, logAuditEvent } = useRiskWatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');

  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) {
    return (
      <div className="app-page-wrapper" style={{ textAlign: 'center', padding: '80px' }}>
        <h2>Alert Not Found</h2>
        <Link href="/app/alerts" className="btn-primary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === alert.linkedCustomerId);
  const linkedTxns = transactions.filter((t) => alert.linkedTransactionIds?.includes(t.id));
  const linkedCases = cases.filter((c) => c.linkedAlertIds.includes(alertId));
  const hasNoTxn = !alert.linkedTransactionIds || alert.linkedTransactionIds.length === 0;

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    updateAlert(alertId, { status: newStatus as any });
    logAuditEvent({
      entityType: 'Alert',
      entityId: alertId,
      action: `Status changed to ${newStatus}`,
      actor: 'analyst@riskwatch.io',
      details: comment || `Status updated to ${newStatus}`,
    });
    setNewStatus('');
    setComment('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: `Evidence (${linkedTxns.length})` },
    { id: 'cases', label: `Linked Cases (${linkedCases.length})` },
    { id: 'workflow', label: 'Disposition' },
  ];

  return (
    <div className="app-page-wrapper">
      <Link href="/app/alerts" className="btn-secondary" style={{ fontSize: '11.5px', width: 'fit-content' }}>
        <ArrowLeft size={13} /> Back to Alerts
      </Link>

      {hasNoTxn && (
        <div className="exception-banner exception-banner-critical">
          <AlertTriangle size={15} />
          <strong>Controlled Negative Scenario:</strong> This alert has no linked triggering transaction. Alerts must reference at least one transaction to be considered valid. This scenario is flagged for ground-truth validation.
        </div>
      )}

      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className={`badge ${alert.severity === 'Critical' ? 'badge-critical' : alert.severity === 'High' ? 'badge-high' : 'badge-medium'}`}>{alert.severity}</span>
            <span className={`badge ${alert.status === 'Resolved' ? 'badge-success' : alert.status === 'False Positive' ? 'badge-neutral' : 'badge-critical'}`}>{alert.status}</span>
            <span className="badge badge-neutral">Score: {alert.riskScore}</span>
          </div>
          <h1>{alert.title}</h1>
          <p>{alert.id} · Triggered {formatDate(alert.triggeredAt || alert.createdAt)} · Rules: {alert.ruleIds.join(', ')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {customer && (
            <Link href={`/app/customers/${customer.id}`} className="btn-secondary">
              View Customer
            </Link>
          )}
          <Link href={`/app/network?focus=${alert.linkedAccountIds?.[0] ?? ''}`} className="btn-primary">
            View in Graph
          </Link>
        </div>
      </div>

      <div className="app-tabs">
        {tabs.map((t) => (
          <button type="button" key={t.id} className={`app-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="detail-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="app-card">
              <div className="app-card-header"><h3 className="app-card-title"><Bell size={15} color="#AD7048" /> Alert Details</h3></div>
              <div className="app-card-body">
                <div className="key-value-list">
                  <div className="key-value-row"><span className="key-value-label">Alert ID</span><span className="key-value-value">{alert.id}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Title</span><span className="key-value-value">{alert.title}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Severity</span><span className="key-value-value">{alert.severity}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Risk Score</span><span className="key-value-value tabular-nums">{alert.riskScore}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Status</span><span className="key-value-value">{alert.status}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Rules Triggered</span><span className="key-value-value">{alert.ruleIds.join(', ')}</span></div>
                  <div className="key-value-row"><span className="key-value-label">Triggered At</span><span className="key-value-value tabular-nums">{formatDate(alert.triggeredAt || alert.createdAt)}</span></div>
                  {alert.resolvedAt && <div className="key-value-row"><span className="key-value-label">Resolved At</span><span className="key-value-value tabular-nums">{formatDate(alert.resolvedAt)}</span></div>}
                  <div className="key-value-row"><span className="key-value-label">Assigned To</span><span className="key-value-value">{alert.assignedTo ?? 'Unassigned'}</span></div>
                </div>
              </div>
            </div>

            {customer && (
              <div className="app-card">
                <div className="app-card-header"><h3 className="app-card-title"><Shield size={15} color="#AD7048" /> Linked Customer</h3></div>
                <div className="app-card-body">
                  <div className="key-value-list">
                    <div className="key-value-row"><span className="key-value-label">Name</span><span className="key-value-value">{customer.displayName}</span></div>
                    <div className="key-value-row"><span className="key-value-label">KYC Status</span><span className="key-value-value">{customer.kycStatus}</span></div>
                    <div className="key-value-row"><span className="key-value-label">Risk Tier</span><span className="key-value-value">{customer.riskTier}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Linked Transactions', value: linkedTxns.length, warn: hasNoTxn },
              { label: 'Linked Accounts', value: alert.linkedAccountIds?.length ?? 0, warn: false },
              { label: 'Linked Cases', value: linkedCases.length, warn: false },
            ].map((s) => (
              <div key={s.label} className={`kpi-card ${s.warn ? 'kpi-card-warn' : ''}`}>
                <div className="kpi-top">
                  <span>{s.label}</span>
                  {s.warn && <AlertTriangle size={14} color="#D94C42" />}
                </div>
                <div className="kpi-value tabular-nums">{s.value}</div>
                {s.warn && <div style={{ fontSize: '10px', color: '#D94C42', fontWeight: 700 }}>No triggering transaction</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EVIDENCE TAB */}
      {activeTab === 'evidence' && (
        <div className="app-card">
          {linkedTxns.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#D94C42' }}>
              <AlertTriangle size={24} />
              <p style={{ marginTop: '8px' }}>No transactions linked to this alert. This is a controlled negative scenario.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="app-table">
                <thead>
                  <tr><th>Txn ID</th><th>Type</th><th>Amount</th><th>Risk Score</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {linkedTxns.map((tx) => (
                    <tr key={tx.id} className="app-table-clickable-row" onClick={() => router.push(`/app/transactions/${tx.id}`)}>
                      <td><strong>{tx.id}</strong></td>
                      <td><span className="badge badge-neutral">{tx.type}</span></td>
                      <td className="tabular-nums" style={{ fontWeight: 700 }}>${tx.amount.toFixed(2)}</td>
                      <td><span className={`badge ${tx.riskScore >= 80 ? 'badge-critical' : tx.riskScore >= 50 ? 'badge-medium' : 'badge-low'}`}>{tx.riskScore}</span></td>
                      <td><span className="badge badge-neutral">{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CASES TAB */}
      {activeTab === 'cases' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {linkedCases.length === 0 && <p style={{ color: '#6F6A60' }}>No cases linked to this alert.</p>}
          {linkedCases.map((c) => (
            <div key={c.id} className="app-card" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => router.push(`/app/cases/${c.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={14} color="#C7A16B" />
                  <strong>{c.id}</strong>
                  <span className="badge badge-neutral">{c.priority}</span>
                </div>
                <span className="badge badge-medium">{c.status}</span>
              </div>
              <div style={{ fontSize: '13px' }}>{c.title}</div>
            </div>
          ))}
        </div>
      )}

      {/* WORKFLOW TAB */}
      {activeTab === 'workflow' && (
        <div className="detail-grid">
          <div className="app-card">
            <div className="app-card-header"><h3 className="app-card-title"><CheckCircle size={15} color="#AD7048" /> Update Disposition</h3></div>
            <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-row">
                <label className="form-label">New Status</label>
                <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="">Select status...</option>
                  <option value="Open">Open</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Resolved">Resolved</option>
                  <option value="False Positive">False Positive</option>
                  <option value="Escalated">Escalated</option>
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Comment</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Add a disposition note or investigation comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <button type="button" className="btn-primary" onClick={handleUpdateStatus} disabled={!newStatus}>
                <CheckCircle size={14} /> Apply Disposition
              </button>
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header"><h3 className="app-card-title"><Clock size={15} color="#AD7048" /> Status History</h3></div>
            <div className="app-card-body">
              <div style={{ fontSize: '12px', color: '#6F6A60', padding: '8px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Current: {alert.status}</div>
                <div>Triggered: {formatDate(alert.triggeredAt || alert.createdAt)}</div>
                {alert.resolvedAt && <div>Resolved: {formatDate(alert.resolvedAt)}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
