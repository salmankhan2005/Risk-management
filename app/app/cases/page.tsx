'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Briefcase, CheckCircle, Clock, Radio } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { Case } from '@/lib/types';
import { RiskWatchApi } from '@/lib/api/endpoints';
import { CaseDTO } from '@/packages/contracts/src';
import { useRealtimeSubscription } from '@/lib/supabase/use-realtime';

function mapCaseDtoToUi(dto: CaseDTO): Case {
  const statusMap: Record<string, Case['status']> = {
    OPEN: 'Open',
    IN_REVIEW: 'Investigating',
    CLOSED: 'Closed',
  };
  const priorityMap: Record<string, Case['priority']> = {
    CRITICAL: 'P1',
    HIGH: 'P2',
    MEDIUM: 'P3',
    LOW: 'P4',
  };

  return {
    id: dto.businessId || dto.id,
    title: dto.title,
    description: `Investigation case linked to customer ${dto.customerId}`,
    status: statusMap[dto.status] || 'Open',
    priority: priorityMap[dto.severity] || 'P2',
    severity: (dto.severity.charAt(0).toUpperCase() + dto.severity.slice(1).toLowerCase()) as Case['severity'],
    linkedAlertIds: ['ALT-MAPPED'],
    linkedCustomerIds: [dto.customerId],
    linkedAccountIds: [],
    linkedTxnIds: ['TXN-MAPPED'],
    evidenceSummary: `Case opened for multi-alert investigation on customer ${dto.customerId}`,
    assignedAnalyst: 'Neha Sen',
    assignedTo: 'Neha Sen',
    assignedAnalystRole: 'Operations Analyst',
    assignedAt: dto.openedAt,
    createdAt: dto.openedAt,
    resolvedAt: dto.closedAt || undefined,
    history: [],
  };
}

export default function CasesPage() {
  const router = useRouter();
  const { cases, alerts } = useRiskWatch();
  const [liveCases, setLiveCases] = useState<Case[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let active = true;
    RiskWatchApi.getCases({ limit: 100 })
      .then((res) => {
        if (active && res?.data && res.data.length > 0) {
          setLiveCases(res.data.map(mapCaseDtoToUi));
        }
      })
      .catch((err) => {
        console.warn('[Cases] Live cases query fell back to baseline:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Supabase Realtime subscription for live case state transitions & assignments
  useRealtimeSubscription({
    table: 'cases',
    event: '*',
    onData: (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        const row = payload.new as any;
        const newCase = mapCaseDtoToUi({
          id: row.id,
          businessId: row.business_id,
          customerId: row.customer_id,
          title: row.title,
          status: row.status,
          severity: row.severity,
          disposition: row.disposition,
          version: row.version,
          alertsCount: 0,
          openedAt: row.opened_at,
          closedAt: row.closed_at,
          updatedAt: row.updated_at,
        });
        setLiveCases((prev) => [newCase, ...prev]);
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const row = payload.new as any;
        setLiveCases((prev) =>
          prev.map((c) =>
            c.id === (row.business_id || row.id)
              ? {
                  ...c,
                  status: row.status === 'IN_REVIEW' ? 'Investigating' : row.status === 'CLOSED' ? 'Closed' : 'Open',
                  disposition: row.disposition,
                  resolvedAt: row.closed_at || c.resolvedAt,
                }
              : c
          )
        );
      }
    },
  });

  const activeCasesList = liveCases.length > 0 ? liveCases : cases;

  // Check controlled negative scenario: case disposition precedes alert trigger
  const casesWithEarlyDisposition = activeCasesList.filter((c) => {
    const linkedAlerts = alerts.filter((a) => c.linkedAlertIds.includes(a.id));
    return linkedAlerts.some((a) => c.resolvedAt && (a.triggeredAt || a.createdAt) && new Date(c.resolvedAt) < new Date(a.triggeredAt || a.createdAt));
  });

  const filtered = activeCasesList.filter((c) => {
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<Case>[] = [
    {
      header: 'Case ID',
      accessorKey: 'id',
      sortable: true,
      cell: (c) => <strong>{c.id}</strong>,
    },
    {
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (c) => <div style={{ fontWeight: 600, fontSize: '12px', maxWidth: '260px' }}>{c.title}</div>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (c) => (
        <span className={`badge ${c.status === 'Resolved' || c.status === 'Closed' ? 'badge-success' : c.status === 'Investigating' ? 'badge-medium' : 'badge-critical'}`}>
          {c.status}
        </span>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (c) => (
        <span className={`badge ${c.priority === 'P1' ? 'badge-critical' : c.priority === 'P2' ? 'badge-high' : c.priority === 'P3' ? 'badge-medium' : 'badge-low'}`}>
          {c.priority}
        </span>
      ),
    },
    {
      header: 'Alerts',
      cell: (c) => <span className="tabular-nums" style={{ fontWeight: 600 }}>{c.linkedAlertIds.length}</span>,
    },
    {
      header: 'Customers',
      cell: (c) => <span className="tabular-nums">{c.linkedCustomerIds.length}</span>,
    },
    {
      header: 'Assigned To',
      accessorKey: 'assignedAnalyst',
      sortable: true,
      cell: (c) => (c.assignedTo || c.assignedAnalyst) ? <span>{c.assignedTo || c.assignedAnalyst}</span> : <span style={{ color: '#A8A197', fontSize: '11px' }}>Unassigned</span>,
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (c) => <span className="tabular-nums">{formatDate(c.createdAt)}</span>,
    },
    {
      header: 'Flags',
      cell: (c) => {
        const isEarly = casesWithEarlyDisposition.some((ec) => ec.id === c.id);
        return isEarly ? (
          <span className="badge badge-critical" title="Case disposition precedes alert trigger">
            Early Disp.
          </span>
        ) : null;
      },
    },
  ];

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Investigation Cases</h1>
            <span className="badge badge-success" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6' }}>
              <Radio size={10} /> Live Realtime Stream
            </span>
          </div>
          <p>Consolidated risk investigations grouping related alerts, accounts, and transactions. Manage analyst assignments and final dispositions.</p>
        </div>
      </div>

      {casesWithEarlyDisposition.length > 0 && (
        <div className="exception-banner exception-banner-critical">
          <AlertTriangle size={15} />
          <strong>{casesWithEarlyDisposition.length} case{casesWithEarlyDisposition.length > 1 ? 's' : ''}</strong> show a disposition timestamp that precedes the linked alert trigger — a controlled negative scenario indicating invalid case workflow sequencing.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Cases', value: activeCasesList.length, icon: <Briefcase size={16} /> },
          { label: 'P1 Priority', value: activeCasesList.filter((c) => c.priority === 'P1').length, icon: <AlertTriangle size={16} /> },
          { label: 'Investigating', value: activeCasesList.filter((c) => c.status === 'Investigating').length, icon: <Clock size={16} /> },
          { label: 'Resolved', value: activeCasesList.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length, icon: <CheckCircle size={16} /> },
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top"><span>{item.label}</span><span className="kpi-icon">{item.icon}</span></div>
            <div className="kpi-value tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6F6A60' }}>Priority</label>
          {['all', 'P1', 'P2', 'P3', 'P4'].map((p) => (
            <button key={p} type="button" className={`filter-chip ${priorityFilter === p ? 'active' : ''}`} onClick={() => setPriorityFilter(p)}>
              {p === 'all' ? 'All' : p}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6F6A60' }}>Status</label>
          {['all', 'Open', 'Assigned', 'Investigating', 'Pending Review', 'Resolved', 'Closed'].map((s) => (
            <button key={s} type="button" className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search by ID, title, status, priority, or assignee..."
        searchFilterKeys={['id', 'title', 'status', 'priority', 'assignedAnalyst']}
        onRowClick={(c) => router.push(`/app/cases/${c.id}`)}
        exportFileName="riskwatch-cases"
      />
    </div>
  );
}
