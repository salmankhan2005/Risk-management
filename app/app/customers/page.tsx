'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CreditCard, Search, Users } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { Customer } from '@/lib/types';

export default function CustomersPage() {
  const router = useRouter();
  const { customers, accounts, alerts } = useRiskWatch();

  const columns: Column<Customer>[] = [
    {
      header: 'Customer ID',
      accessorKey: 'id',
      sortable: true,
      cell: (c) => <strong>{c.id}</strong>,
    },
    {
      header: 'Display Name',
      accessorKey: 'displayName',
      sortable: true,
      cell: (c) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.displayName}</div>
          <div style={{ fontSize: '10.5px', color: '#6F6A60' }}>{c.email}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (c) => (
        <span className={`badge ${c.status === 'Active' ? 'badge-success' : c.status === 'Suspended' ? 'badge-critical' : 'badge-neutral'}`}>
          {c.status}
        </span>
      ),
    },
    {
      header: 'KYC Status',
      accessorKey: 'kycStatus',
      sortable: true,
      cell: (c) => (
        <span className={`badge ${c.kycStatus === 'Verified' ? 'badge-success' : c.kycStatus === 'Requires Review' ? 'badge-critical' : 'badge-medium'}`}>
          {c.kycStatus}
        </span>
      ),
    },
    {
      header: 'Risk Tier',
      accessorKey: 'riskTier',
      sortable: true,
      cell: (c) => (
        <span className={`badge ${c.riskTier === 'Critical' ? 'badge-critical' : c.riskTier === 'High' ? 'badge-high' : c.riskTier === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
          {c.riskTier}
        </span>
      ),
    },
    {
      header: 'Accounts',
      accessorKey: 'accountsCount',
      sortable: true,
      cell: (c) => (
        <span className="tabular-nums" style={{ fontWeight: 600 }}>
          {accounts.filter((a) => a.customerId === c.id).length}
        </span>
      ),
    },
    {
      header: 'Transaction Count',
      accessorKey: 'transactionCount',
      sortable: true,
      cell: (c) => <span className="tabular-nums">{c.transactionCount}</span>,
    },
    {
      header: 'Total Volume',
      accessorKey: 'totalVolume',
      sortable: true,
      cell: (c) => (
        <span className="tabular-nums" style={{ fontWeight: 600 }}>
          {formatCurrency(c.totalVolume)}
        </span>
      ),
    },
    {
      header: 'Active Alerts',
      cell: (c) => {
        const activeAlerts = alerts.filter((a) => a.linkedCustomerId === c.id && a.status !== 'False Positive' && a.status !== 'Resolved');
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

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Customer Registry</h1>
          <p>KYC status, account ownership, risk tiers, and alert exposure for all synthetic customer records.</p>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total Customers', value: customers.length.toLocaleString(), icon: <Users size={16} /> },
          { label: 'High / Critical Risk', value: customers.filter((c) => c.riskTier === 'High' || c.riskTier === 'Critical').length, icon: <AlertTriangle size={16} /> },
          { label: 'KYC Requires Review', value: customers.filter((c) => c.kycStatus === 'Requires Review').length, icon: <Search size={16} /> },
          { label: 'Suspended', value: customers.filter((c) => c.status === 'Suspended').length, icon: <CreditCard size={16} /> },
        ].map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top">
              <span>{item.label}</span>
              <span className="kpi-icon">{item.icon}</span>
            </div>
            <div className="kpi-value tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search by ID, name, email, or KYC status..."
        searchFilterKeys={['id', 'displayName', 'email', 'kycStatus', 'riskTier']}
        onRowClick={(c) => router.push(`/app/customers/${c.id}`)}
        exportFileName="riskwatch-customers"
      />
    </div>
  );
}
