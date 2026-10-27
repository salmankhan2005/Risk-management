'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CreditCard,
  FileText,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';
import { useRiskWatch } from '@/lib/store';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { transactions, customers, accounts, alerts, cases, rules } = useRiskWatch();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search matches
  const matchedTxns = q ? transactions.filter((t) => t.id.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || String(t.amount).includes(q)).slice(0, 4) : [];
  const matchedCustomers = q ? customers.filter((c) => c.id.toLowerCase().includes(q) || c.displayName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedAccounts = q ? accounts.filter((a) => a.id.toLowerCase().includes(q) || a.accountType.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedAlerts = q ? alerts.filter((al) => al.id.toLowerCase().includes(q) || al.title.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedCases = q ? cases.filter((c) => c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedRules = q ? rules.filter((r) => r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)).slice(0, 3) : [];

  const hasResults =
    matchedTxns.length > 0 ||
    matchedCustomers.length > 0 ||
    matchedAccounts.length > 0 ||
    matchedAlerts.length > 0 ||
    matchedCases.length > 0 ||
    matchedRules.length > 0;

  const navigateTo = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div
      className="overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="search-dialog" style={{ width: 'min(640px, 95%)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Search Input Bar */}
        <div className="search-dialog-input-wrap">
          <Search size={18} color="#AD7048" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search TXN-..., CUS-..., ACC-..., ALT-..., CASE-..., RUL-..., or keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close search">
            <X size={16} />
          </button>
        </div>

        {/* Results Container */}
        <div style={{ overflowY: 'auto', padding: '12px', flex: 1, maxHeight: '480px' }}>
          {!query && (
            <div style={{ padding: '16px 8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8C8577', letterSpacing: '0.1em', marginBottom: '12px' }}>
                DIRECT QUICK JUMPS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo('/app/transactions')}
                >
                  <span><strong>Transactions Table</strong><small>100k synthetic records</small></span>
                  <ArrowRight size={14} color="#AD7048" />
                </button>
                <button
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo('/app/alerts')}
                >
                  <span><strong>Alert Review Workspace</strong><small>Triage high & critical items</small></span>
                  <ArrowRight size={14} color="#AD7048" />
                </button>
                <button
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo('/app/network')}
                >
                  <span><strong>Entity Network Graph</strong><small>Interactive relationship viewer</small></span>
                  <ArrowRight size={14} color="#AD7048" />
                </button>
                <button
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo('/app/validation')}
                >
                  <span><strong>Validation Lab</strong><small>20 automated integrity checks</small></span>
                  <ArrowRight size={14} color="#AD7048" />
                </button>
              </div>
            </div>
          )}

          {query && !hasResults && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6F6A60', fontSize: '13px' }}>
              No matches found for &ldquo;<strong>{query}</strong>&rdquo;. Try searching for <code>TXN-2026-00000001</code>, <code>CUS-000001</code>, or <code>velocity</code>.
            </div>
          )}

          {/* Transactions */}
          {matchedTxns.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8C8577', letterSpacing: '0.1em', padding: '4px 8px' }}>
                TRANSACTIONS
              </div>
              {matchedTxns.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo(`/app/transactions/${t.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CreditCard size={15} color="#AD7048" />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '12px' }}>{t.id} · ₹{t.amount.toLocaleString('en-IN')}</strong>
                      <small style={{ display: 'block', color: '#6F6A60' }}>{t.description || t.type} · Score: {t.riskScore}</small>
                    </div>
                  </div>
                  <span className={`badge ${t.riskScore >= 80 ? 'badge-critical' : t.riskScore >= 50 ? 'badge-medium' : 'badge-low'}`}>
                    Score {t.riskScore}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Alerts */}
          {matchedAlerts.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8C8577', letterSpacing: '0.1em', padding: '4px 8px' }}>
                ALERTS
              </div>
              {matchedAlerts.map((al) => (
                <button
                  key={al.id}
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo(`/app/alerts/${al.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertTriangle size={15} color="#D94C42" />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '12px' }}>{al.id} · {al.title}</strong>
                      <small style={{ display: 'block', color: '#6F6A60' }}>Status: {al.status} · Severity: {al.severity}</small>
                    </div>
                  </div>
                  <span className={`badge ${al.severity === 'Critical' ? 'badge-critical' : 'badge-high'}`}>
                    {al.severity}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Cases */}
          {matchedCases.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8C8577', letterSpacing: '0.1em', padding: '4px 8px' }}>
                CASES
              </div>
              {matchedCases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo(`/app/cases/${c.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Briefcase size={15} color="#C7A16B" />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '12px' }}>{c.id} · {c.title}</strong>
                      <small style={{ display: 'block', color: '#6F6A60' }}>Assigned: {c.assignedAnalyst} · Status: {c.status}</small>
                    </div>
                  </div>
                  <span className="badge badge-neutral">{c.priority}</span>
                </button>
              ))}
            </div>
          )}

          {/* Customers */}
          {matchedCustomers.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8C8577', letterSpacing: '0.1em', padding: '4px 8px' }}>
                CUSTOMERS
              </div>
              {matchedCustomers.map((cus) => (
                <button
                  key={cus.id}
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo(`/app/customers/${cus.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={15} color="#75856B" />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '12px' }}>{cus.id} · {cus.displayName}</strong>
                      <small style={{ display: 'block', color: '#6F6A60' }}>{cus.email} · KYC: {cus.kycStatus}</small>
                    </div>
                  </div>
                  <span className="badge badge-neutral">{cus.riskTier} Risk</span>
                </button>
              ))}
            </div>
          )}

          {/* Accounts */}
          {matchedAccounts.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8C8577', letterSpacing: '0.1em', padding: '4px 8px' }}>
                ACCOUNTS
              </div>
              {matchedAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo(`/app/accounts/${acc.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CreditCard size={15} color="#AD7048" />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '12px' }}>{acc.id} ({acc.accountType})</strong>
                      <small style={{ display: 'block', color: '#6F6A60' }}>Balance: ₹{acc.currentBalance.toLocaleString('en-IN')} · Status: {acc.status}</small>
                    </div>
                  </div>
                  <span className={`badge ${acc.status === 'Active' ? 'badge-success' : 'badge-critical'}`}>
                    {acc.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Rules */}
          {matchedRules.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8C8577', letterSpacing: '0.1em', padding: '4px 8px' }}>
                RULES
              </div>
              {matchedRules.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="search-result"
                  onClick={() => navigateTo(`/app/rules/${r.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={15} color="#C7A16B" />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '12px' }}>{r.id} · {r.name}</strong>
                      <small style={{ display: 'block', color: '#6F6A60' }}>{r.category} · Threshold: {r.thresholdValue} {r.thresholdUnit}</small>
                    </div>
                  </div>
                  <span className="badge badge-neutral">+{r.scoreContribution} pts</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="search-dialog-footer">
          <span>Global Search (Esc to close)</span>
        </div>
      </div>
    </div>
  );
}
