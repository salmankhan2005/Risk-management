'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CreditCard, DollarSign, TrendingDown } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { Account } from '@/lib/types';

export default function AccountsPage() {
  const router = useRouter();
  const { accounts, customers, transactions, alerts } = useRiskWatch();

  const columns: Column<Account>[] = [
    {
      header: 'Account ID',
      accessorKey: 'id',
      sortable: true,
      cell: (a) => <strong>{a.id}</strong>,
    },
    {
      header: 'Customer',
      accessorKey: 'customerId',
      sortable: true,
      cell: (a) => {
        const cust = customers.find((c) => c.id === a.customerId);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{cust?.displayName ?? a.customerId}</div>
            <div style={{ fontSize: '10.5px', color: '#6F6A60' }}>{a.customerId}</div>
          </div>
        );
      },
    },
    {
      header: 'Type',
      accessorKey: 'accountType',
      sortable: true,
      cell: (a) => <span className="badge badge-neutral">{a.accountType}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (a) => (
        <span className={`badge ${a.status === 'Active' ? 'badge-success' : a.status === 'Closed' ? 'badge-critical' : 'badge-medium'}`}>
          {a.status}
        </span>
      ),
    },
    {
      header: 'Balance',
      accessorKey: 'currentBalance',
      sortable: true,
      cell: (a) => (
        <span className="tabular-nums" style={{ fontWeight: 700, color: a.currentBalance < 0 ? '#D94C42' : 'inherit' }}>
          {a.currentBalance < 0 && <TrendingDown size={11} color="#D94C42" style={{ marginRight: '3px' }} />}
          {formatCurrency(a.currentBalance, a.currency)}
        </span>
      ),
    },
    {
      header: 'Currency',
      accessorKey: 'currency',
      sortable: true,
    },
    {
      header: 'Risk Level',
      accessorKey: 'riskLevel',
      sortable: true,
      cell: (a) => (
        <span className={`badge ${a.riskLevel === 'Critical' ? 'badge-critical' : a.riskLevel === 'High' ? 'badge-high' : a.riskLevel === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
          {a.riskLevel}
        </span>
      ),
    },
    {
      header: 'Overdraft',
      accessorKey: 'overdraftAllowed',
      sortable: true,
      cell: (a) => (
        <span className="badge badge-neutral">
          {a.overdraftAllowed ? `Yes (${formatCurrency(a.overdraftLimit)})` : 'No'}
        </span>
      ),
    },
    {
      header: 'Active Alerts',
      cell: (a) => {
        const activeAlerts = alerts.filter((al) => al.linkedAccountIds.includes(a.id) && al.status !== 'Resolved' && al.status !== 'False Positive');
        return activeAlerts.length > 0 ? (
          <span className="badge badge-critical">
            <AlertTriangle size={10} /> {activeAlerts.length}
          </span>
        ) : (
          <span style={{ color: '#A8A197', fontSize: '11px' }}>None</span>
        );
      },
    },
  ];

  const negativeBalance = accounts.filter((a) => a.currentBalance < 0 && !a.overdraftAllowed);

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Accounts Registry</h1>
          <p>Account balances, overdraft configurations, risk classifications, and ownership mapping across all synthetic records.</p>
        </div>
      </div>

      {/* Exception banner */}
      {negativeBalance.length > 0 && (
        <div className="exception-banner exception-banner-critical">
          <AlertTriangle size={15} />
          <strong>{negativeBalance.length} account{negativeBalance.length > 1 ? 's' : ''}</strong> show negative balances without an approved overdraft facility — a controlled negative scenario for validation.
        </div>
      )}

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Accounts', value: accounts.length.toLocaleString(), icon: <CreditCard size={16} /> },
          { label: 'Closed Accounts', value: accounts.filter((a) => a.status === 'Closed').length, icon: <AlertTriangle size={16} /> },
          { label: 'Negative Balance (no OD)', value: negativeBalance.length, icon: <TrendingDown size={16} /> },
          { label: 'Critical Risk', value: accounts.filter((a) => a.riskLevel === 'Critical').length, icon: <DollarSign size={16} /> },
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top"><span>{item.label}</span><span className="kpi-icon">{item.icon}</span></div>
            <div className="kpi-value tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={accounts}
        searchPlaceholder="Search by ID, customer, type, status, or currency..."
        searchFilterKeys={['id', 'customerId', 'accountType', 'status', 'currency', 'riskLevel']}
        onRowClick={(a) => router.push(`/app/accounts/${a.id}`)}
        exportFileName="riskwatch-accounts"
      />
    </div>
  );
}
