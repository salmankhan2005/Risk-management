'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Download,
  Filter,
  RefreshCw,
  Search,
  Sliders,
} from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import { formatCurrency, formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { Transaction, TransactionDirection, TransactionType } from '@/lib/types';
import { RiskWatchApi } from '@/lib/api/endpoints';
import { TransactionDTO } from '@/packages/contracts/src';

function mapTxnDtoToUi(dto: TransactionDTO): Transaction {
  const numAmount = typeof dto.amount === 'number' ? dto.amount : parseFloat(String(dto.amount || '0'));
  const numSigned = typeof dto.signedAmount === 'number' ? dto.signedAmount : parseFloat(String(dto.signedAmount || '0'));
  const numBefore = typeof dto.balanceBefore === 'number' ? dto.balanceBefore : parseFloat(String(dto.balanceBefore || '0'));
  const numAfter = typeof dto.balanceAfter === 'number' ? dto.balanceAfter : parseFloat(String(dto.balanceAfter || '0'));

  const isDebit = dto.type === 'DEBIT' || numSigned < 0;
  const currency = (['INR', 'USD', 'EUR', 'GBP'].includes(dto.currency) ? dto.currency : 'INR') as Transaction['currency'];

  return {
    id: dto.businessId || dto.id,
    customerId: 'CUS-000001',
    accountId: dto.accountId,
    amount: numAmount,
    currency,
    type: isDebit ? 'Withdrawal' : 'Deposit',
    direction: isDebit ? 'Debit' : 'Credit',
    status: dto.status === 'POSTED' ? 'Settled' : 'Blocked',
    riskScore: numAmount > 100000 ? 85 : numAmount > 50000 ? 55 : 20,
    triggeredRules: numAmount > 100000 ? ['RULE-LRG-01'] : [],
    timestamp: dto.occurredAt,
    balanceBefore: numBefore,
    balanceAfter: numAfter,
    description: dto.description || `${dto.type} Transaction`,
    merchantId: dto.merchantId || undefined,
    deviceId: dto.deviceId || undefined,
  };
}

export default function TransactionsPage() {
  const router = useRouter();
  const { transactions } = useRiskWatch();
  const [liveTxns, setLiveTxns] = useState<Transaction[]>([]);

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [minRisk, setMinRisk] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    let active = true;
    RiskWatchApi.getTransactions({ limit: 100 })
      .then((res) => {
        if (active && res?.data && res.data.length > 0) {
          setLiveTxns(res.data.map(mapTxnDtoToUi));
        }
      })
      .catch((err) => {
        console.warn('[Transactions] Live transactions fetch fell back to baseline:', err);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeTxnsList = liveTxns.length > 0 ? liveTxns : transactions;

  // Multi-column filtering
  const filteredTransactions = useMemo(() => {
    return activeTxnsList.filter((t) => {
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
      if (directionFilter !== 'ALL' && t.direction !== directionFilter) return false;
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (t.riskScore < minRisk) return false;
      return true;
    });
  }, [activeTxnsList, typeFilter, directionFilter, statusFilter, minRisk]);

  const columns: Column<Transaction>[] = [
    {
      header: 'Transaction ID',
      accessorKey: 'id',
      sortable: true,
      cell: (t) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong>{t.id}</strong>
          <small style={{ color: '#6F6A60', fontSize: '10.5px' }}>{formatDate(t.timestamp)}</small>
        </div>
      ),
    },
    {
      header: 'Customer ID',
      accessorKey: 'customerId',
      sortable: true,
      cell: (t) => (
        <Link
          href={`/app/customers/${t.customerId}`}
          onClick={(e) => e.stopPropagation()}
          style={{ color: '#AD7048', textDecoration: 'none', fontWeight: 600 }}
        >
          {t.customerId}
        </Link>
      ),
    },
    {
      header: 'Account ID',
      accessorKey: 'accountId',
      sortable: true,
      cell: (t) => (
        <Link
          href={`/app/accounts/${t.accountId}`}
          onClick={(e) => e.stopPropagation()}
          style={{ color: '#171713', textDecoration: 'none', fontWeight: 500 }}
        >
          {t.accountId}
        </Link>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (t) => <span className="badge badge-neutral">{t.type}</span>,
    },
    {
      header: 'Direction',
      accessorKey: 'direction',
      sortable: true,
      cell: (t) => (
        <span
          className={`badge ${t.direction === 'Debit' ? 'badge-neutral' : 'badge-success'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          {t.direction === 'Debit' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {t.direction}
        </span>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (t) => (
        <span className="tabular-nums" style={{ fontWeight: 700 }}>
          {formatCurrency(t.amount, t.currency)}
        </span>
      ),
    },
    {
      header: 'Balance After',
      accessorKey: 'balanceAfter',
      sortable: true,
      cell: (t) => (
        <span
          className="tabular-nums"
          style={{ color: t.balanceAfter < 0 ? '#D94C42' : '#6F6A60', fontWeight: t.balanceAfter < 0 ? 800 : 500 }}
        >
          {formatCurrency(t.balanceAfter, t.currency)}
        </span>
      ),
    },
    {
      header: 'Risk Score',
      accessorKey: 'riskScore',
      sortable: true,
      cell: (t) => (
        <span
          className={`badge ${
            t.riskScore >= 80 ? 'badge-critical' : t.riskScore >= 50 ? 'badge-medium' : 'badge-low'
          }`}
        >
          {t.riskScore}
        </span>
      ),
    },
    {
      header: 'Triggered Rules',
      cell: (t) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {t.triggeredRules.length === 0 ? (
            <span style={{ color: '#A8A197', fontSize: '11px' }}>None</span>
          ) : (
            t.triggeredRules.map((r) => (
              <span key={r} className="badge badge-neutral" style={{ fontSize: '9.5px' }}>
                {r.replace('RUL-', '')}
              </span>
            ))
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (t) => (
        <span
          className={`badge ${
            t.status === 'Flagged' || t.status === 'Blocked' ? 'badge-critical' : 'badge-neutral'
          }`}
        >
          {t.status}
        </span>
      ),
    },
  ];

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <h1>Transaction Investigation Workspace</h1>
          <p>
            Filter, sort, and inspect 100,000 synthetic transactions with balance reconciliation and rule evaluation evidence.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        className="app-card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          background: '#FAF7F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#6F6A60' }}>
          <Filter size={14} color="#AD7048" /> Filters:
        </div>

        {/* Type select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6F6A60' }}>Type:</span>
          <select
            className="table-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="Purchase">Purchase</option>
            <option value="Transfer">Transfer</option>
            <option value="Withdrawal">Withdrawal</option>
            <option value="Deposit">Deposit</option>
          </select>
        </div>

        {/* Direction select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6F6A60' }}>Direction:</span>
          <select
            className="table-select"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
          >
            <option value="ALL">All Directions</option>
            <option value="Debit">Debit</option>
            <option value="Credit">Credit</option>
          </select>
        </div>

        {/* Status select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#6F6A60' }}>Status:</span>
          <select
            className="table-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Flagged">Flagged</option>
            <option value="Settled">Settled</option>
            <option value="Blocked">Blocked</option>
            <option value="Under Investigation">Under Investigation</option>
          </select>
        </div>

        {/* Min Risk Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#6F6A60' }}>Min Risk:</span>
          <input
            type="range"
            min="0"
            max="90"
            step="10"
            value={minRisk}
            onChange={(e) => setMinRisk(Number(e.target.value))}
            style={{ width: '90px', accentColor: '#AD7048' }}
          />
          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
            &ge; {minRisk}
          </span>
        </div>

        {/* Reset button */}
        {(typeFilter !== 'ALL' || directionFilter !== 'ALL' || statusFilter !== 'ALL' || minRisk > 0) && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setTypeFilter('ALL');
              setDirectionFilter('ALL');
              setStatusFilter('ALL');
              setMinRisk(0);
            }}
            style={{ fontSize: '11px', padding: '4px 8px', marginLeft: 'auto' }}
          >
            <RefreshCw size={11} /> Reset Filters
          </button>
        )}
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredTransactions}
        searchPlaceholder="Search by Transaction ID, description, or amount..."
        searchFilterKeys={['id', 'description', 'customerId', 'accountId']}
        onRowClick={(tx) => router.push(`/app/transactions/${tx.id}`)}
        exportFileName="riskwatch-transactions"
      />
    </div>
  );
}
