'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Clock, Search } from 'lucide-react';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { AuditEvent } from '@/lib/types';

export default function AuditTrailPage() {
  const { auditLog } = useRiskWatch();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const pageSize = 30;

  const entityTypes: string[] = ['all', ...Array.from(new Set(auditLog.map((e: AuditEvent) => e.entityType)))];

  const filtered = auditLog
    .filter((e: AuditEvent) => {
      const matchSearch =
        !search ||
        e.entityId.toLowerCase().includes(search.toLowerCase()) ||
        e.action.toLowerCase().includes(search.toLowerCase()) ||
        e.actor.toLowerCase().includes(search.toLowerCase()) ||
        (e.reason && e.reason.toLowerCase().includes(search.toLowerCase())) ||
        (e.afterSummary && e.afterSummary.toLowerCase().includes(search.toLowerCase()));
      const matchEntity = entityFilter === 'all' || e.entityType === entityFilter;
      return matchSearch && matchEntity;
    })
    .sort((a: AuditEvent, b: AuditEvent) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const entityColorMap: Record<string, string> = {
    Transaction: '#AD7048',
    Alert: '#D94C42',
    Case: '#C7A16B',
    Account: '#75856B',
    Customer: '#7BA0A8',
    RiskRule: '#9B8FD6',
    UserSession: '#C7A16B',
    ValidationLab: '#75856B',
    Generator: '#AD7048',
  };

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-neutral">Cryptographic Provenance</span>
            <span className="badge badge-success">Immutable WORM Log</span>
          </div>
          <h1>Platform Audit Trail & Forensic Record</h1>
          <p>
            Append-only, tamper-evident log of all analyst actions, system events, and state changes. Every record is immutable once created.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Events', value: auditLog.length },
          { label: 'Unique Actors', value: new Set(auditLog.map((e: AuditEvent) => e.actor)).size },
          { label: 'Entity Types', value: new Set(auditLog.map((e: AuditEvent) => e.entityType)).size },
          { label: 'Today', value: auditLog.filter((e: AuditEvent) => new Date(e.timestamp).toDateString() === new Date().toDateString()).length },
        ].map((s) => (
          <div key={s.label} className="kpi-card">
            <div className="kpi-top"><span>{s.label}</span><span className="kpi-icon"><Activity size={14} /></span></div>
            <div className="kpi-value tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6F6A60' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by entity ID, action, actor, or details..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: '30px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {entityTypes.map((et: string) => (
            <button key={et} type="button" className={`filter-chip ${entityFilter === et ? 'active' : ''}`} onClick={() => { setEntityFilter(et); setPage(1); }}>
              {et === 'all' ? 'All Types' : et}
            </button>
          ))}
        </div>
      </div>

      {/* Event count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11.5px', color: '#6F6A60' }}>{filtered.length.toLocaleString()} events · Page {page} of {totalPages || 1}</span>
        <span style={{ fontSize: '10px', color: '#6F6A60', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} /> Sorted by most recent first
        </span>
      </div>

      {/* Audit feed */}
      <div className="app-card" style={{ overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Details & Reason</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((event: AuditEvent) => (
                <tr key={event.id} style={{ fontSize: '11.5px' }}>
                  <td className="tabular-nums" style={{ whiteSpace: 'nowrap', color: '#6F6A60' }}>
                    {formatDate(event.timestamp)}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '1px 7px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      background: `${entityColorMap[event.entityType] ?? '#6F6A60'}22`,
                      color: entityColorMap[event.entityType] ?? '#6F6A60',
                    }}>
                      {event.entityType}
                    </span>
                  </td>
                  <td>
                    <span
                      className="link-cell"
                      style={{ fontSize: '11px' }}
                      onClick={() => {
                        const entityPaths: Record<string, string> = {
                          Transaction: `/app/transactions/${event.entityId}`,
                          Alert: `/app/alerts/${event.entityId}`,
                          Case: `/app/cases/${event.entityId}`,
                          Customer: `/app/customers/${event.entityId}`,
                          Account: `/app/accounts/${event.entityId}`,
                          RiskRule: `/app/rules/${event.entityId}`,
                        };
                        const path = entityPaths[event.entityType];
                        if (path) router.push(path);
                      }}
                    >
                      {event.entityId}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#C7A16B' }}>{event.action}</td>
                  <td style={{ color: '#4A463E' }}>
                    <div>{event.actor}</div>
                    <div style={{ fontSize: '10px', color: '#6F6A60' }}>{event.role}</div>
                  </td>
                  <td style={{ color: '#4A463E', maxWidth: '320px' }}>
                    <div>{event.afterSummary}</div>
                    {event.reason && (
                      <div style={{ fontSize: '10.5px', color: '#6F6A60' }}><em>Reason: {event.reason}</em></div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid #E8E3D9' }}>
          <button type="button" className="btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            ← Prev
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const pNum = i + 1;
            return (
              <button key={pNum} type="button" className={`btn-secondary ${page === pNum ? 'active' : ''}`} onClick={() => setPage(pNum)}
                style={{ minWidth: '36px', background: page === pNum ? '#AD7048' : undefined, color: page === pNum ? '#FAF7F0' : undefined }}>
                {pNum}
              </button>
            );
          })}
          <button type="button" className="btn-secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
