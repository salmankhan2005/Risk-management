'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { Transfer } from '@/lib/types';

export default function TransfersPage() {
  const router = useRouter();
  const { transfers, accounts } = useRiskWatch();

  const unreconciled = transfers.filter((t) => !t.reconciled);
  const failed = transfers.filter((t) => t.status === 'Failed');

  const columns: Column<Transfer>[] = [
    {
      header: 'Transfer ID',
      accessorKey: 'id',
      sortable: true,
      cell: (t) => <strong>{t.id}</strong>,
    },
    {
      header: 'From Account',
      accessorKey: 'fromAccountId',
      sortable: true,
      cell: (t) => (
        <span
          className="link-cell"
          onClick={(e) => { e.stopPropagation(); router.push(`/app/accounts/${t.fromAccountId}`); }}
        >
          {t.fromAccountId}
        </span>
      ),
    },
    {
      header: 'To Account',
      accessorKey: 'toAccountId',
      sortable: true,
      cell: (t) => (
        <span
          className="link-cell"
          onClick={(e) => { e.stopPropagation(); router.push(`/app/accounts/${t.toAccountId}`); }}
        >
          {t.toAccountId}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (t) => <span className="tabular-nums" style={{ fontWeight: 700 }}>{formatCurrency(t.amount, t.currency)}</span>,
    },
    {
      header: 'Currency',
      accessorKey: 'currency',
      sortable: true,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (t) => (
        <span className={`badge ${t.status === 'Completed' ? 'badge-success' : t.status === 'Failed' ? 'badge-critical' : 'badge-medium'}`}>
          {t.status}
        </span>
      ),
    },
    {
      header: 'Reconciled',
      accessorKey: 'reconciled',
      sortable: true,
      cell: (t) => (
        <span className={`badge ${t.reconciled ? 'badge-success' : 'badge-critical'}`}>
          {t.reconciled ? <><CheckCircle size={10} /> Yes</> : <><XCircle size={10} /> No</>}
        </span>
      ),
    },
    {
      header: 'Debit Txn',
      accessorKey: 'debitTransactionId',
      cell: (t) => t.debitTransactionId ? (
        <span className="link-cell" onClick={(e) => { e.stopPropagation(); router.push(`/app/transactions/${t.debitTransactionId}`); }}>
          {t.debitTransactionId}
        </span>
      ) : <span style={{ color: '#A8A197' }}>—</span>,
    },
    {
      header: 'Credit Txn',
      accessorKey: 'creditTransactionId',
      cell: (t) => t.creditTransactionId ? (
        <span className="link-cell" onClick={(e) => { e.stopPropagation(); router.push(`/app/transactions/${t.creditTransactionId}`); }}>
          {t.creditTransactionId}
        </span>
      ) : <span style={{ color: '#D94C42', fontWeight: 600, fontSize: '11px' }}>MISSING ⚠</span>,
    },
    {
      header: 'Initiated',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (t) => <span className="tabular-nums">{formatDate(t.initiatedAt || t.timestamp)}</span>,
    },
  ];

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Transfers</h1>
          <p>Internal fund movement between accounts, reconciliation status, and leg-matching integrity checks.</p>
        </div>
      </div>

      {unreconciled.length > 0 && (
        <div className="exception-banner exception-banner-critical">
          <AlertTriangle size={15} />
          <strong>{unreconciled.length} transfer{unreconciled.length > 1 ? 's' : ''}</strong> failed reconciliation — debit and credit legs do not match. Controlled negative scenario for validation.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Transfers', value: transfers.length, icon: <ArrowLeftRight size={16} /> },
          { label: 'Failed', value: failed.length, icon: <XCircle size={16} /> },
          { label: 'Unreconciled', value: unreconciled.length, icon: <AlertTriangle size={16} /> },
          {
            label: 'Total Moved',
            value: formatCurrency(transfers.reduce((s, t) => s + t.amount, 0)),
            icon: <CheckCircle size={16} />,
          },
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top"><span>{item.label}</span><span className="kpi-icon">{item.icon}</span></div>
            <div className="kpi-value tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={transfers}
        searchPlaceholder="Search by ID, account, status, or currency..."
        searchFilterKeys={['id', 'sourceAccountId', 'destAccountId', 'currency', 'state']}
        exportFileName="riskwatch-transfers"
      />
    </div>
  );
}
