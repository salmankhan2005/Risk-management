'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, BookOpen, CheckCircle, Code, Sliders } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { Rule } from '@/lib/types';

export default function RulesPage() {
  const router = useRouter();
  const { rules, alerts } = useRiskWatch();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = rules.filter(
    (r) => activeFilter === 'all' || (r.status ?? (r.enabled ? 'Active' : 'Draft')) === activeFilter
  );

  const columns: Column<Rule>[] = [
    {
      header: 'Rule ID',
      accessorKey: 'id',
      sortable: true,
      cell: (r) => <strong>{r.id}</strong>,
    },
    {
      header: 'Rule Name',
      accessorKey: 'name',
      sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '12px' }}>{r.name}</div>
          <div style={{ fontSize: '10.5px', color: '#6F6A60', marginTop: '2px' }}>{r.description}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'enabled',
      sortable: true,
      cell: (r) => {
        const st = r.status ?? (r.enabled ? 'Active' : 'Draft');
        return (
          <span className={`badge ${st === 'Active' ? 'badge-success' : st === 'Draft' ? 'badge-medium' : 'badge-neutral'}`}>
            {st}
          </span>
        );
      },
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (r) => <span className="badge badge-neutral">{r.category}</span>,
    },
    {
      header: 'Severity',
      accessorKey: 'severityMapping',
      sortable: true,
      cell: (r) => {
        const sev = r.severity ?? r.severityMapping;
        return (
          <span className={`badge ${sev === 'Critical' ? 'badge-critical' : sev === 'High' ? 'badge-high' : sev === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
            {sev}
          </span>
        );
      },
    },
    {
      header: 'Score Weight',
      accessorKey: 'scoreContribution',
      sortable: true,
      cell: (r) => {
        const weight = r.scoreWeight ?? r.scoreContribution;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '60px', height: '4px', background: '#E8E3D9', borderRadius: '2px' }}>
              <div style={{ width: `${(weight / 40) * 100}%`, height: '100%', background: weight >= 30 ? '#D94C42' : weight >= 20 ? '#E3A449' : '#75856B', borderRadius: '2px' }} />
            </div>
            <span className="tabular-nums" style={{ fontWeight: 700 }}>{weight}</span>
          </div>
        );
      },
    },
    {
      header: 'Version',
      accessorKey: 'version',
      sortable: true,
      cell: (r) => <span className="tabular-nums badge badge-neutral">v{r.version}</span>,
    },
    {
      header: 'Times Triggered',
      cell: (r) => {
        const count = alerts.filter((a) => a.ruleIds.includes(r.id)).length;
        return <span className="tabular-nums" style={{ fontWeight: 700, color: count > 5 ? '#D94C42' : 'inherit' }}>{count}</span>;
      },
    },
    {
      header: 'Last Updated',
      cell: (r) => <span className="tabular-nums">{formatDate(r.updatedAt || r.lastEvaluatedAt || r.effectiveFrom)}</span>,
    },
  ];

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Risk Rules Engine</h1>
          <p>Transparent scoring rules that drive risk detection. View thresholds, weights, trigger frequency, and simulation results.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-secondary" onClick={() => router.push('/app/validation')}>
            <CheckCircle size={13} /> Validation Lab
          </button>
          <button type="button" className="btn-primary" onClick={() => router.push('/app/rules/simulator')}>
            <Sliders size={13} /> Rule Simulator
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Rules', value: rules.length, icon: <BookOpen size={16} /> },
          { label: 'Active', value: rules.filter((r) => r.enabled || r.status === 'Active').length, icon: <CheckCircle size={16} /> },
          { label: 'Total Alerts Generated', value: alerts.length, icon: <Activity size={16} /> },
          { label: 'Avg Score Weight', value: (rules.reduce((s, r) => s + (r.scoreWeight ?? r.scoreContribution), 0) / rules.length).toFixed(1), icon: <Code size={16} /> },
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top"><span>{item.label}</span><span className="kpi-icon">{item.icon}</span></div>
            <div className="kpi-value tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {['all', 'Active', 'Draft', 'Deprecated'].map((f) => (
          <button key={f} type="button" className={`filter-chip ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search by rule ID, name, category, or logic..."
        searchFilterKeys={['id', 'name', 'category', 'severityMapping', 'logicExpression']}
        onRowClick={(r) => router.push(`/app/rules/${r.id}`)}
        exportFileName="riskwatch-rules"
      />
    </div>
  );
}
