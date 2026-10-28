'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeftRight,
  Briefcase,
  Code2,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  Globe,
  HardDrive,
  Laptop,
  Repeat,
  ShieldCheck,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import {
  Account,
  Alert,
  Case,
  Customer,
  Device,
  Merchant,
  RiskRule,
  Transaction,
  TransferLink,
} from '@/lib/types';

type EntityTab =
  | 'transactions'
  | 'accounts'
  | 'customers'
  | 'transfers'
  | 'alerts'
  | 'cases'
  | 'merchants'
  | 'devices'
  | 'rules';

export default function DataExplorerPage() {
  const router = useRouter();
  const {
    transactions,
    accounts,
    customers,
    transfers,
    alerts,
    cases,
    merchants,
    devices,
    rules,
  } = useRiskWatch();

  const [activeTab, setActiveTab] = useState<EntityTab>('transactions');
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const tabs: { id: EntityTab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'transactions', label: 'Transactions', count: transactions.length, icon: <ArrowLeftRight size={14} /> },
    { id: 'accounts', label: 'Accounts', count: accounts.length, icon: <Wallet size={14} /> },
    { id: 'customers', label: 'Customers', count: customers.length, icon: <Users size={14} /> },
    { id: 'transfers', label: 'Transfers', count: transfers.length, icon: <Repeat size={14} /> },
    { id: 'alerts', label: 'Alerts', count: alerts.length, icon: <AlertTriangle size={14} /> },
    { id: 'cases', label: 'Cases', count: cases.length, icon: <Briefcase size={14} /> },
    { id: 'merchants', label: 'Merchants', count: merchants.length, icon: <Store size={14} /> },
    { id: 'devices', label: 'Devices', count: devices.length, icon: <Laptop size={14} /> },
    { id: 'rules', label: 'Rules', count: rules.length, icon: <ShieldCheck size={14} /> },
  ];

  // Column definitions for each entity
  const transactionColumns: Column<Transaction>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      sortable: true,
      cell: (tx) => <strong>{tx.id}</strong>,
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (tx) => <span className="tabular-nums">{formatDate(tx.timestamp)}</span>,
    },
    {
      header: 'Account',
      accessorKey: 'accountId',
      sortable: true,
      cell: (tx) => <span className="tabular-nums" style={{ color: '#AD7048' }}>{tx.accountId}</span>,
    },
    {
      header: 'Customer',
      accessorKey: 'customerId',
      sortable: true,
      cell: (tx) => <span className="tabular-nums">{tx.customerId}</span>,
    },
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (tx) => <span className="badge badge-neutral">{tx.type}</span>,
    },
    {
      header: 'Direction',
      accessorKey: 'direction',
      sortable: true,
      cell: (tx) => (
        <span className={`badge ${tx.direction === 'Credit' ? 'badge-success' : 'badge-neutral'}`}>
          {tx.direction}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (tx) => (
        <span className="tabular-nums" style={{ fontWeight: 700 }}>
          {formatCurrency(tx.amount, tx.currency)}
        </span>
      ),
    },
    {
      header: 'Balance After',
      accessorKey: 'balanceAfter',
      sortable: true,
      cell: (tx) => (
        <span className="tabular-nums" style={{ color: tx.balanceAfter < 0 ? '#D94C42' : 'inherit' }}>
          {formatCurrency(tx.balanceAfter, tx.currency)}
        </span>
      ),
    },
    {
      header: 'Risk Score',
      accessorKey: 'riskScore',
      sortable: true,
      cell: (tx) => (
        <span
          className="tabular-nums"
          style={{
            fontWeight: 700,
            color: tx.riskScore >= 80 ? '#D94C42' : tx.riskScore >= 50 ? '#E3A449' : '#75856B',
          }}
        >
          {tx.riskScore}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (tx) => (
        <span
          className={`badge ${
            tx.status === 'Flagged' || tx.status === 'Blocked'
              ? 'badge-critical'
              : tx.status === 'Under Investigation'
              ? 'badge-medium'
              : 'badge-success'
          }`}
        >
          {tx.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (tx) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'Transaction', data: tx });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  const accountColumns: Column<Account>[] = [
    {
      header: 'Account ID',
      accessorKey: 'id',
      sortable: true,
      cell: (acc) => <strong>{acc.id}</strong>,
    },
    {
      header: 'Customer ID',
      accessorKey: 'customerId',
      sortable: true,
      cell: (acc) => <span className="tabular-nums">{acc.customerId}</span>,
    },
    {
      header: 'Type',
      accessorKey: 'accountType',
      sortable: true,
      cell: (acc) => <span className="badge badge-neutral">{acc.accountType}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (acc) => (
        <span
          className={`badge ${
            acc.status === 'Active'
              ? 'badge-success'
              : acc.status === 'Closed'
              ? 'badge-neutral'
              : 'badge-critical'
          }`}
        >
          {acc.status}
        </span>
      ),
    },
    {
      header: 'Current Balance',
      accessorKey: 'currentBalance',
      sortable: true,
      cell: (acc) => (
        <span
          className="tabular-nums"
          style={{
            fontWeight: 700,
            color: acc.currentBalance < 0 ? '#D94C42' : 'inherit',
          }}
        >
          {formatCurrency(acc.currentBalance, acc.currency)}
        </span>
      ),
    },
    {
      header: 'Overdraft Limit',
      accessorKey: 'overdraftLimit',
      sortable: true,
      cell: (acc) => (
        <span className="tabular-nums">
          {acc.overdraftAllowed ? formatCurrency(acc.overdraftLimit, acc.currency) : 'None'}
        </span>
      ),
    },
    {
      header: 'Risk Level',
      accessorKey: 'riskLevel',
      sortable: true,
      cell: (acc) => (
        <span
          className={`badge ${
            acc.riskLevel === 'Critical'
              ? 'badge-critical'
              : acc.riskLevel === 'High'
              ? 'badge-high'
              : acc.riskLevel === 'Medium'
              ? 'badge-medium'
              : 'badge-low'
          }`}
        >
          {acc.riskLevel}
        </span>
      ),
    },
    {
      header: 'Opened At',
      accessorKey: 'openedAt',
      sortable: true,
      cell: (acc) => <span className="tabular-nums">{formatDate(acc.openedAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (acc) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'Account', data: acc });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  const customerColumns: Column<Customer>[] = [
    {
      header: 'Customer ID',
      accessorKey: 'id',
      sortable: true,
      cell: (c) => <strong>{c.id}</strong>,
    },
    {
      header: 'Name',
      accessorKey: 'displayName',
      sortable: true,
      cell: (c) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.displayName}</div>
          <div style={{ fontSize: '11px', color: '#6F6A60' }}>{c.email}</div>
        </div>
      ),
    },
    {
      header: 'Country',
      accessorKey: 'country',
      sortable: true,
      cell: (c) => <span>{c.country}</span>,
    },
    {
      header: 'Risk Tier',
      accessorKey: 'riskTier',
      sortable: true,
      cell: (c) => (
        <span
          className={`badge ${
            c.riskTier === 'Critical'
              ? 'badge-critical'
              : c.riskTier === 'High'
              ? 'badge-high'
              : c.riskTier === 'Medium'
              ? 'badge-medium'
              : 'badge-low'
          }`}
        >
          {c.riskTier}
        </span>
      ),
    },
    {
      header: 'KYC Status',
      accessorKey: 'kycStatus',
      sortable: true,
      cell: (c) => (
        <span className={`badge ${c.kycStatus === 'Verified' ? 'badge-success' : 'badge-medium'}`}>
          {c.kycStatus}
        </span>
      ),
    },
    {
      header: 'Accounts',
      accessorKey: 'accountsCount',
      sortable: true,
      cell: (c) => <span className="tabular-nums font-semibold">{c.accountsCount}</span>,
    },
    {
      header: 'Total Volume',
      accessorKey: 'totalVolume',
      sortable: true,
      cell: (c) => (
        <span className="tabular-nums font-semibold">
          {formatCurrency(c.totalVolume, 'INR')}
        </span>
      ),
    },
    {
      header: 'Tx Count',
      accessorKey: 'transactionCount',
      sortable: true,
      cell: (c) => <span className="tabular-nums">{c.transactionCount}</span>,
    },
    {
      header: 'Actions',
      cell: (c) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'Customer', data: c });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  const transferColumns: Column<TransferLink>[] = [
    {
      header: 'Transfer ID',
      accessorKey: 'id',
      sortable: true,
      cell: (t) => <strong>{t.id}</strong>,
    },
    {
      header: 'Source Account',
      accessorKey: 'sourceAccountId',
      sortable: true,
      cell: (t) => <span className="tabular-nums" style={{ color: '#AD7048' }}>{t.sourceAccountId}</span>,
    },
    {
      header: 'Destination Account',
      accessorKey: 'destAccountId',
      sortable: true,
      cell: (t) => <span className="tabular-nums" style={{ color: '#75856B' }}>{t.destAccountId}</span>,
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (t) => (
        <span className="tabular-nums font-semibold">
          {formatCurrency(t.amount, t.currency)}
        </span>
      ),
    },
    {
      header: 'State',
      accessorKey: 'state',
      sortable: true,
      cell: (t) => (
        <span
          className={`badge ${
            t.state === 'Completed'
              ? 'badge-success'
              : t.state === 'Reconciliation Failed' || t.state === 'Flagged Loop'
              ? 'badge-critical'
              : 'badge-medium'
          }`}
        >
          {t.state}
        </span>
      ),
    },
    {
      header: 'Reconciliation',
      accessorKey: 'reconciliationStatus',
      sortable: true,
      cell: (t) => (
        <span
          className={`badge ${
            t.reconciliationStatus === 'Reconciled'
              ? 'badge-success'
              : 'badge-critical'
          }`}
        >
          {t.reconciliationStatus}
        </span>
      ),
    },
    {
      header: 'Topology',
      cell: (t) =>
        t.isCircular ? (
          <span className="badge badge-critical">Circular Loop</span>
        ) : (
          <span className="badge badge-neutral">Linear</span>
        ),
    },
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (t) => <span className="tabular-nums">{formatDate(t.timestamp)}</span>,
    },
    {
      header: 'Actions',
      cell: (t) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'TransferLink', data: t });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  const alertColumns: Column<Alert>[] = [
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
          <div style={{ fontWeight: 600 }}>{a.title}</div>
          <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>{a.evidenceSummary}</div>
        </div>
      ),
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      sortable: true,
      cell: (a) => (
        <span
          className={`badge ${
            a.severity === 'Critical'
              ? 'badge-critical'
              : a.severity === 'High'
              ? 'badge-high'
              : a.severity === 'Medium'
              ? 'badge-medium'
              : 'badge-low'
          }`}
        >
          {a.severity}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (a) => (
        <span
          className={`badge ${
            a.status === 'New'
              ? 'badge-critical'
              : a.status === 'Open' || a.status === 'Under Review'
              ? 'badge-medium'
              : 'badge-success'
          }`}
        >
          {a.status}
        </span>
      ),
    },
    {
      header: 'Score',
      accessorKey: 'riskScore',
      sortable: true,
      cell: (a) => (
        <span className="tabular-nums" style={{ fontWeight: 700, color: a.riskScore >= 80 ? '#D94C42' : '#AD7048' }}>
          {a.riskScore}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessorKey: 'linkedCustomerId',
      sortable: true,
      cell: (a) => <span className="tabular-nums">{a.linkedCustomerId}</span>,
    },
    {
      header: 'Trigger Txns',
      cell: (a) => <span className="tabular-nums font-semibold">{a.triggerTxnIds?.length || 0}</span>,
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (a) => <span className="tabular-nums">{formatDate(a.createdAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (a) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'Alert', data: a });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  const caseColumns: Column<Case>[] = [
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
      cell: (c) => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.title}</div>
          <div style={{ fontSize: '11px', color: '#6F6A60' }}>{c.description}</div>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (c) => (
        <span className={`badge ${c.priority === 'P1' ? 'badge-critical' : c.priority === 'P2' ? 'badge-high' : 'badge-neutral'}`}>
          {c.priority}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (c) => (
        <span className={`badge ${c.status === 'Resolved' || c.status === 'Closed' ? 'badge-success' : 'badge-medium'}`}>
          {c.status}
        </span>
      ),
    },
    {
      header: 'Disposition',
      accessorKey: 'disposition',
      sortable: true,
      cell: (c) => (
        c.disposition ? (
          <span className="badge badge-neutral">{c.disposition}</span>
        ) : (
          <span style={{ fontSize: '11px', color: '#888' }}>Pending</span>
        )
      ),
    },
    {
      header: 'Analyst',
      accessorKey: 'assignedAnalyst',
      sortable: true,
      cell: (c) => <span>{c.assignedAnalyst}</span>,
    },
    {
      header: 'Linked Alerts',
      cell: (c) => <span className="tabular-nums font-semibold">{c.linkedAlertIds?.length || 0}</span>,
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (c) => <span className="tabular-nums">{formatDate(c.createdAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (c) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'Case', data: c });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  const merchantColumns: Column<Merchant>[] = [
    {
      header: 'Merchant ID',
      accessorKey: 'id',
      sortable: true,
      cell: (m) => <strong>{m.id}</strong>,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (m) => <span style={{ fontWeight: 600 }}>{m.name}</span>,
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (m) => <span className="badge badge-neutral">{m.category}</span>,
    },
    {
      header: 'Risk Category',
      accessorKey: 'riskCategory',
      sortable: true,
      cell: (m) => (
        <span
          className={`badge ${
            m.riskCategory === 'Prohibited' || m.riskCategory === 'High'
              ? 'badge-critical'
              : m.riskCategory === 'Medium'
              ? 'badge-medium'
              : 'badge-success'
          }`}
        >
          {m.riskCategory}
        </span>
      ),
    },
    {
      header: 'Jurisdiction',
      accessorKey: 'jurisdiction',
      sortable: true,
      cell: (m) => <span>{m.jurisdiction}</span>,
    },
    {
      header: 'Flagged Txns',
      accessorKey: 'flaggedTxCount',
      sortable: true,
      cell: (m) => (
        <span
          className="tabular-nums font-semibold"
          style={{ color: m.flaggedTxCount > 0 ? '#D94C42' : 'inherit' }}
        >
          {m.flaggedTxCount}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (m) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'Merchant', data: m });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  const deviceColumns: Column<Device>[] = [
    {
      header: 'Device ID',
      accessorKey: 'id',
      sortable: true,
      cell: (d) => <strong>{d.id}</strong>,
    },
    {
      header: 'Type',
      accessorKey: 'deviceType',
      sortable: true,
      cell: (d) => <span className="badge badge-neutral">{d.deviceType}</span>,
    },
    {
      header: 'OS & Browser',
      cell: (d) => <span>{d.os} · {d.browser}</span>,
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      sortable: true,
      cell: (d) => <code style={{ fontSize: '11px' }}>{d.ipAddress}</code>,
    },
    {
      header: 'Country',
      accessorKey: 'geoCountry',
      sortable: true,
      cell: (d) => <span>{d.geoCountry}</span>,
    },
    {
      header: 'Proxy Status',
      accessorKey: 'isKnownProxy',
      sortable: true,
      cell: (d) => (
        d.isKnownProxy ? (
          <span className="badge badge-critical">Known Proxy/VPN</span>
        ) : (
          <span className="badge badge-success">Clean ISP</span>
        )
      ),
    },
    {
      header: 'First Seen',
      accessorKey: 'firstSeenAt',
      sortable: true,
      cell: (d) => <span className="tabular-nums">{formatDate(d.firstSeenAt)}</span>,
    },
    {
      header: 'Actions',
      cell: (d) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'Device', data: d });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  const ruleColumns: Column<RiskRule>[] = [
    {
      header: 'Rule ID',
      accessorKey: 'id',
      sortable: true,
      cell: (r) => <strong>{r.id}</strong>,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.name}</div>
          <div style={{ fontSize: '11px', color: '#6F6A60' }}>{r.description}</div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (r) => <span className="badge badge-neutral">{r.category}</span>,
    },
    {
      header: 'Threshold',
      cell: (r) => <span className="tabular-nums">{r.thresholdValue} {r.thresholdUnit}</span>,
    },
    {
      header: 'Score Addition',
      accessorKey: 'scoreContribution',
      sortable: true,
      cell: (r) => <span className="tabular-nums font-semibold" style={{ color: '#AD7048' }}>+{r.scoreContribution}</span>,
    },
    {
      header: 'Severity',
      accessorKey: 'severityMapping',
      sortable: true,
      cell: (r) => (
        <span className={`badge ${r.severityMapping === 'Critical' ? 'badge-critical' : r.severityMapping === 'High' ? 'badge-high' : 'badge-medium'}`}>
          {r.severityMapping}
        </span>
      ),
    },
    {
      header: 'Triggers Count',
      accessorKey: 'triggersCount',
      sortable: true,
      cell: (r) => <span className="tabular-nums font-semibold">{r.triggersCount}</span>,
    },
    {
      header: 'Actions',
      cell: (r) => (
        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '10.5px', padding: '3px 8px' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord({ type: 'RiskRule', data: r });
          }}
        >
          <Code2 size={12} /> JSON
        </button>
      ),
    },
  ];

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-neutral">Relational Schema Browser</span>
            <span className="badge badge-success">9 Synchronized Entities</span>
          </div>
          <h1>Unified Enterprise Data Explorer</h1>
          <p>
            Cross-entity operational tabular browser. Query, inspect, filter, and inspect serialized schema records across all operational domain models and relationship graphs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="app-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`app-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className="app-tab-count">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Render Table based on active tab */}
      {activeTab === 'transactions' && (
        <DataTable
          columns={transactionColumns}
          data={transactions}
          searchPlaceholder="Search transactions by ID, account, customer, type, or status..."
          searchFilterKeys={['id', 'accountId', 'customerId', 'type', 'status', 'direction']}
          exportFileName="riskwatch-transactions"
          onRowClick={(tx) => router.push(`/app/transactions/${tx.id}`)}
        />
      )}

      {activeTab === 'accounts' && (
        <DataTable
          columns={accountColumns}
          data={accounts}
          searchPlaceholder="Search accounts by ID, customer ID, type, status, or risk..."
          searchFilterKeys={['id', 'customerId', 'accountType', 'status', 'riskLevel']}
          exportFileName="riskwatch-accounts"
          onRowClick={(acc) => router.push(`/app/accounts/${acc.id}`)}
        />
      )}

      {activeTab === 'customers' && (
        <DataTable
          columns={customerColumns}
          data={customers}
          searchPlaceholder="Search customers by ID, name, email, country, or status..."
          searchFilterKeys={['id', 'displayName', 'email', 'country', 'riskTier', 'kycStatus']}
          exportFileName="riskwatch-customers"
          onRowClick={(c) => router.push(`/app/customers/${c.id}`)}
        />
      )}

      {activeTab === 'transfers' && (
        <DataTable
          columns={transferColumns}
          data={transfers}
          searchPlaceholder="Search transfers by ID, source, destination, or status..."
          searchFilterKeys={['id', 'sourceAccountId', 'destAccountId', 'state', 'reconciliationStatus']}
          exportFileName="riskwatch-transfers"
        />
      )}

      {activeTab === 'alerts' && (
        <DataTable
          columns={alertColumns}
          data={alerts}
          searchPlaceholder="Search alerts by ID, title, severity, status, or customer..."
          searchFilterKeys={['id', 'title', 'severity', 'status', 'linkedCustomerId']}
          exportFileName="riskwatch-alerts"
          onRowClick={(a) => router.push(`/app/alerts/${a.id}`)}
        />
      )}

      {activeTab === 'cases' && (
        <DataTable
          columns={caseColumns}
          data={cases}
          searchPlaceholder="Search cases by ID, title, priority, status, or analyst..."
          searchFilterKeys={['id', 'title', 'priority', 'status', 'assignedAnalyst', 'disposition']}
          exportFileName="riskwatch-cases"
          onRowClick={(c) => router.push(`/app/cases/${c.id}`)}
        />
      )}

      {activeTab === 'merchants' && (
        <DataTable
          columns={merchantColumns}
          data={merchants}
          searchPlaceholder="Search merchants by ID, name, category, or jurisdiction..."
          searchFilterKeys={['id', 'name', 'category', 'riskCategory', 'jurisdiction']}
          exportFileName="riskwatch-merchants"
        />
      )}

      {activeTab === 'devices' && (
        <DataTable
          columns={deviceColumns}
          data={devices}
          searchPlaceholder="Search devices by ID, fingerprint, OS, IP address, or country..."
          searchFilterKeys={['id', 'fingerprint', 'os', 'browser', 'ipAddress', 'geoCountry']}
          exportFileName="riskwatch-devices"
        />
      )}

      {activeTab === 'rules' && (
        <DataTable
          columns={ruleColumns}
          data={rules}
          searchPlaceholder="Search rules by ID, name, category, or severity..."
          searchFilterKeys={['id', 'name', 'category', 'severityMapping']}
          exportFileName="riskwatch-rules"
          onRowClick={(r) => router.push(`/app/rules/${r.id}`)}
        />
      )}

      {/* JSON Record Viewer Modal */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(16, 17, 15, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="app-card"
            style={{
              width: '100%',
              maxWidth: '740px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid #AD7048',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="app-card-header"
              style={{
                borderBottom: '1px solid #E8E3D9',
                paddingBottom: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 className="app-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code2 size={16} color="#AD7048" />
                  {selectedRecord.type} Payload Inspector: {selectedRecord.data.id}
                </h3>
                <p className="app-card-subtitle">
                  Raw deserialized JSON document representation
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px' }}
                onClick={() => setSelectedRecord(null)}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#10110F', borderRadius: '4px', margin: '14px' }}>
              <pre
                style={{
                  color: '#FAF7F0',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {JSON.stringify(selectedRecord.data, null, 2)}
              </pre>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px', borderTop: '1px solid #E8E3D9' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedRecord.data, null, 2));
                  alert('Record JSON copied to clipboard');
                }}
              >
                Copy JSON
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSelectedRecord(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
