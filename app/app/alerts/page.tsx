'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Bell, CheckCircle, Clock, Radio, ShieldAlert } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { Alert } from '@/lib/types';
import { RiskWatchApi } from '@/lib/api/endpoints';
import { AlertDTO } from '@/packages/contracts/src';
import { useRealtimeSubscription } from '@/lib/supabase/use-realtime';

function mapAlertDtoToUi(dto: AlertDTO): Alert {
  const severityMap: Record<string, Alert['severity']> = {
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  };
  const statusMap: Record<string, Alert['status']> = {
    OPEN: 'Open',
    INVESTIGATING: 'Under Review',
    DISMISSED: 'False Positive',
    ESCALATED: 'Escalated',
  };

  return {
    id: dto.businessId || dto.id,
    title: dto.summary,
    severity: severityMap[dto.severity] || 'Medium',
    status: statusMap[dto.status] || 'Open',
    riskScore: dto.aggregateScore,
    ruleIds: ['RULE-MER-01', 'RULE-DEV-01'],
    triggerTxnIds: ['TXN-MAPPED'],
    linkedTransactionIds: ['TXN-MAPPED'],
    linkedAccountIds: [dto.accountId],
    linkedCustomerId: dto.customerId,
    evidenceSummary: dto.summary,
    triggeredAt: dto.createdAt,
    createdAt: dto.createdAt,
    updatedAt: dto.createdAt,
    assignedAnalyst: dto.assignedToId || 'Unassigned',
  };
}

export default function AlertsPage() {
  const router = useRouter();
  const { alerts, customers, accounts } = useRiskWatch();
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let active = true;
    RiskWatchApi.getAlerts({ limit: 100 })
      .then((res) => {
        if (active && res?.data && res.data.length > 0) {
          setLiveAlerts(res.data.map(mapAlertDtoToUi));
        }
      })
      .catch((err) => {
        console.warn('[Alerts] Live alerts query fell back to baseline:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  // Supabase Realtime WebSocket subscription for live incoming alerts
  useRealtimeSubscription({
    table: 'alerts',
    event: 'INSERT',
    onData: (payload) => {
      if (payload.new) {
        const row = payload.new as any;
        const newAlert: Alert = {
          id: row.business_id || row.id,
          title: row.summary || 'Realtime Risk Signal Detected',
          severity: row.severity ? (row.severity.charAt(0) + row.severity.slice(1).toLowerCase() as any) : 'High',
          status: 'Open',
          riskScore: row.aggregate_score || 50,
          ruleIds: ['RULE-REALTIME'],
          triggerTxnIds: ['TXN-LIVE'],
          linkedTransactionIds: ['TXN-LIVE'],
          linkedAccountIds: [row.account_id],
          linkedCustomerId: row.customer_id,
          evidenceSummary: row.summary || 'Live stream event from PostgreSQL',
          triggeredAt: row.created_at || new Date().toISOString(),
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.created_at || new Date().toISOString(),
          assignedAnalyst: 'Unassigned',
        };
        setLiveAlerts((prev) => [newAlert, ...prev]);
      }
    },
  });

  const activeAlertsList = liveAlerts.length > 0 ? liveAlerts : alerts;

  const noTriggerTxn = activeAlertsList.filter((a) => !a.linkedTransactionIds || a.linkedTransactionIds.length === 0);

  const filtered = activeAlertsList.filter((a) => {
    const sevMatch = severityFilter === 'all' || a.severity === severityFilter;
    const stMatch = statusFilter === 'all' || a.status === statusFilter;
    return sevMatch && stMatch;
  });

  const columns: Column<Alert>[] = [
    {
      header: 'Alert ID',
      accessorKey: 'id',
      sortable: true,
      cell: (a) => <strong>{a.id}</strong>,
    },
    {
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (a) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '12px' }}>{a.title}</div>
          {(!a.linkedTransactionIds || a.linkedTransactionIds.length === 0) && (
            <div style={{ fontSize: '10px', color: '#D94C42', fontWeight: 700, marginTop: '2px' }}>
              ⚠ No triggering transaction
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      sortable: true,
      cell: (a) => (
        <span className={`badge ${a.severity === 'Critical' ? 'badge-critical' : a.severity === 'High' ? 'badge-high' : a.severity === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
          {a.severity}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (a) => (
        <span className={`badge ${a.status === 'Resolved' ? 'badge-success' : a.status === 'False Positive' ? 'badge-neutral' : a.status === 'Under Review' || a.status === 'Open' ? 'badge-medium' : 'badge-critical'}`}>
          {a.status}
        </span>
      ),
    },
    {
      header: 'Risk Score',
      accessorKey: 'riskScore',
      sortable: true,
      cell: (a) => (
        <span className={`badge ${a.riskScore >= 80 ? 'badge-critical' : a.riskScore >= 50 ? 'badge-medium' : 'badge-low'}`}>
          {a.riskScore}
        </span>
      ),
    },
    {
      header: 'Rules Triggered',
      cell: (a) => <span style={{ fontSize: '11px', color: '#6F6A60' }}>{a.ruleIds.join(', ')}</span>,
    },
    {
      header: 'Customer',
      accessorKey: 'linkedCustomerId',
      sortable: true,
      cell: (a) => (
        a.linkedCustomerId ? (
          <span className="link-cell" onClick={(e) => { e.stopPropagation(); router.push(`/app/customers/${a.linkedCustomerId}`); }}>
            {a.linkedCustomerId}
          </span>
        ) : <span style={{ color: '#A8A197' }}>—</span>
      ),
    },
    {
      header: 'Triggered',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (a) => <span className="tabular-nums">{formatDate(a.triggeredAt || a.createdAt)}</span>,
    },
    {
      header: 'Assigned To',
      accessorKey: 'assignedAnalyst',
      sortable: true,
      cell: (a) => (a.assignedTo || a.assignedAnalyst) ? <span>{a.assignedTo || a.assignedAnalyst}</span> : <span style={{ color: '#A8A197', fontSize: '11px' }}>Unassigned</span>,
    },
  ];

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Alerts Queue</h1>
            <span className="badge badge-success" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6' }}>
              <Radio size={10} /> Live Realtime Stream
            </span>
          </div>
          <p>System-generated risk alerts from rule triggers. Review, assign, and disposition each alert.</p>
        </div>
      </div>

      {noTriggerTxn.length > 0 && (
        <div className="exception-banner exception-banner-critical">
          <AlertTriangle size={15} />
          <strong>{noTriggerTxn.length} alert{noTriggerTxn.length > 1 ? 's' : ''}</strong> have no linked triggering transaction — a controlled negative scenario. They should not have been generated.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Alerts', value: activeAlertsList.length, icon: <Bell size={16} /> },
          { label: 'Critical', value: activeAlertsList.filter((a) => a.severity === 'Critical').length, icon: <ShieldAlert size={16} /> },
          { label: 'Under Review', value: activeAlertsList.filter((a) => a.status === 'Under Review' || a.status === 'Open').length, icon: <Clock size={16} /> },
          { label: 'Resolved', value: activeAlertsList.filter((a) => a.status === 'Resolved').length, icon: <CheckCircle size={16} /> },
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top"><span>{item.label}</span><span className="kpi-icon">{item.icon}</span></div>
            <div className="kpi-value tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6F6A60' }}>Severity</label>
          {['all', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-chip ${severityFilter === s ? 'active' : ''}`}
              onClick={() => setSeverityFilter(s)}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6F6A60' }}>Status</label>
          {['all', 'Open', 'Investigating', 'Resolved', 'False Positive'].map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search alerts by ID, title, severity, or status..."
        searchFilterKeys={['id', 'title', 'severity', 'status', 'linkedCustomerId']}
        onRowClick={(a) => router.push(`/app/alerts/${a.id}`)}
        exportFileName="riskwatch-alerts"
      />
    </div>
  );
}
