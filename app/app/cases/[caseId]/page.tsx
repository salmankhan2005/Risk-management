'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Briefcase, CheckCircle, Clock, User } from 'lucide-react';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';

export default function CaseDetailPage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = use(params);
  const router = useRouter();
  const { cases, alerts, customers, transactions, updateCase, logAuditEvent } = useRiskWatch();
  const [activeTab, setActiveTab] = useState('overview');
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');

  const c = cases.find((x) => x.id === caseId);
  if (!c) {
    return (
      <div className="app-page-wrapper" style={{ textAlign: 'center', padding: '80px' }}>
        <h2>Case Not Found</h2>
        <Link href="/app/cases" className="btn-primary" style={{ marginTop: '16px' }}><ArrowLeft size={14} /> Back</Link>
      </div>
    );
  }

  const linkedAlerts = alerts.filter((a) => c.linkedAlertIds.includes(a.id));
  const linkedCustomers = customers.filter((cu) => c.linkedCustomerIds.includes(cu.id));

  // Check controlled negative: case disposition precedes alert
  const earlyDisposition = linkedAlerts.some((a) => c.resolvedAt && (a.triggeredAt || a.createdAt) && new Date(c.resolvedAt) < new Date(a.triggeredAt || a.createdAt));

  const handleUpdate = () => {
    if (!newStatus) return;
    updateCase(caseId, { status: newStatus as any, resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : c.resolvedAt });
    logAuditEvent({
      entityType: 'Case',
      entityId: caseId,
      action: `Status changed to ${newStatus}`,
      actor: 'analyst@riskwatch.io',
      details: newNote || `Case status updated to ${newStatus}`,
    });
    setNewStatus('');
    setNewNote('');
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'alerts', label: `Alerts (${linkedAlerts.length})` },
    { id: 'customers', label: `Subjects (${linkedCustomers.length})` },
    { id: 'notes', label: `Notes (${c.notes?.length ?? 0})` },
    { id: 'workflow', label: 'Workflow' },
  ];

  return (
    <div className="app-page-wrapper">
      <Link href="/app/cases" className="btn-secondary" style={{ fontSize: '11.5px', width: 'fit-content' }}>
        <ArrowLeft size={13} /> Back to Cases
      </Link>

      {earlyDisposition && (
        <div className="exception-banner exception-banner-critical">
          <AlertTriangle size={15} />
          <strong>Controlled Negative Scenario:</strong> This case was disposed before the linked alert was triggered. Disposition timestamp (<strong>{formatDate(c.resolvedAt!)}</strong>) precedes alert trigger — invalid workflow sequence.
        </div>
      )}

      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className={`badge ${c.priority === 'P1' ? 'badge-critical' : c.priority === 'P2' ? 'badge-high' : 'badge-medium'}`}>{c.priority}</span>
            <span className={`badge ${c.status === 'Resolved' || c.status === 'Closed' ? 'badge-success' : 'badge-medium'}`}>{c.status}</span>
          </div>
          <h1>{c.title}</h1>
          <p>{c.id} · Created {formatDate(c.createdAt)} · Assigned to {c.assignedTo || c.assignedAnalyst || 'Unassigned'}</p>
        </div>
      </div>

      <div className="app-tabs">
        {tabs.map((t) => (
          <button type="button" key={t.id} className={`app-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="detail-grid">
          <div className="app-card">
            <div className="app-card-header"><h3 className="app-card-title"><Briefcase size={15} color="#AD7048" /> Case Details</h3></div>
            <div className="app-card-body">
              <div className="key-value-list">
                <div className="key-value-row"><span className="key-value-label">Case ID</span><span className="key-value-value">{c.id}</span></div>
                <div className="key-value-row"><span className="key-value-label">Title</span><span className="key-value-value">{c.title}</span></div>
                <div className="key-value-row"><span className="key-value-label">Status</span><span className="key-value-value">{c.status}</span></div>
                <div className="key-value-row"><span className="key-value-label">Priority</span><span className="key-value-value">{c.priority}</span></div>
                <div className="key-value-row"><span className="key-value-label">Assigned To</span><span className="key-value-value">{c.assignedTo || c.assignedAnalyst || 'Unassigned'}</span></div>
                <div className="key-value-row"><span className="key-value-label">Created</span><span className="key-value-value tabular-nums">{formatDate(c.createdAt)}</span></div>
                {c.resolvedAt && <div className="key-value-row"><span className="key-value-label">Resolved</span><span className="key-value-value tabular-nums" style={{ color: earlyDisposition ? '#D94C42' : 'inherit' }}>{formatDate(c.resolvedAt)} {earlyDisposition && '⚠'}</span></div>}
                <div className="key-value-row"><span className="key-value-label">Linked Alerts</span><span className="key-value-value tabular-nums">{c.linkedAlertIds.length}</span></div>
                <div className="key-value-row"><span className="key-value-label">Subjects</span><span className="key-value-value tabular-nums">{c.linkedCustomerIds.length}</span></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Linked Alerts', value: linkedAlerts.length },
              { label: 'Subject Customers', value: linkedCustomers.length },
              { label: 'Notes', value: c.notes?.length ?? 0 },
            ].map((s) => (
              <div key={s.label} className="kpi-card">
                <div className="kpi-top"><span>{s.label}</span></div>
                <div className="kpi-value tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALERTS */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {linkedAlerts.map((al) => (
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
              <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '4px' }}>Triggered: {formatDate(al.triggeredAt || al.createdAt)}</div>
              {c.resolvedAt && (al.triggeredAt || al.createdAt) && new Date(c.resolvedAt) < new Date(al.triggeredAt || al.createdAt) && (
                <div style={{ fontSize: '11px', color: '#D94C42', fontWeight: 700, marginTop: '4px' }}>
                  ⚠ Case resolved BEFORE this alert was triggered
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CUSTOMERS */}
      {activeTab === 'customers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {linkedCustomers.map((cu) => (
            <div key={cu.id} className="app-card" style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => router.push(`/app/customers/${cu.id}`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <User size={14} color="#AD7048" />
                <strong>{cu.displayName}</strong>
                <span className={`badge ${cu.riskTier === 'Critical' ? 'badge-critical' : 'badge-high'}`}>{cu.riskTier} Risk</span>
                <span className={`badge ${cu.kycStatus === 'Verified' ? 'badge-success' : 'badge-critical'}`}>{cu.kycStatus}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6F6A60' }}>{cu.id} · {cu.email}</div>
            </div>
          ))}
        </div>
      )}

      {/* NOTES */}
      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(!c.notes || c.notes.length === 0) && <p style={{ color: '#6F6A60' }}>No investigation notes yet.</p>}
          {c.notes?.map((note, i) => (
            <div key={i} className="app-card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '13px' }}>{note}</div>
            </div>
          ))}
        </div>
      )}

      {/* WORKFLOW */}
      {activeTab === 'workflow' && (
        <div className="detail-grid">
          <div className="app-card">
            <div className="app-card-header"><h3 className="app-card-title"><CheckCircle size={15} color="#AD7048" /> Update Case Status</h3></div>
            <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-row">
                <label className="form-label">New Status</label>
                <select className="form-select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="">Select status...</option>
                  <option value="Open">Open</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Note</label>
                <textarea className="form-textarea" rows={4} placeholder="Add investigation notes or decision rationale..." value={newNote} onChange={(e) => setNewNote(e.target.value)} />
              </div>
              <button type="button" className="btn-primary" onClick={handleUpdate} disabled={!newStatus}>
                <CheckCircle size={14} /> Apply Update
              </button>
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header"><h3 className="app-card-title"><Clock size={15} color="#AD7048" /> Timeline</h3></div>
            <div className="app-card-body">
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-label">Case Created</div>
                    <div className="timeline-time">{formatDate(c.createdAt)}</div>
                  </div>
                </div>
                {c.resolvedAt && (
                  <div className="timeline-item">
                    <div className={`timeline-dot ${earlyDisposition ? 'timeline-dot-warn' : 'timeline-dot-success'}`} />
                    <div className="timeline-content">
                      <div className="timeline-label">Case Resolved {earlyDisposition && '⚠'}</div>
                      <div className="timeline-time" style={{ color: earlyDisposition ? '#D94C42' : 'inherit' }}>{formatDate(c.resolvedAt)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
