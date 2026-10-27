'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle, Code, Sliders } from 'lucide-react';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import RuleSimulator from '@/components/ui/RuleSimulator';

export default function RuleDetailPage({ params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = use(params);
  const { rules, alerts, transactions } = useRiskWatch();
  const [activeTab, setActiveTab] = useState('overview');

  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) {
    return (
      <div className="app-page-wrapper" style={{ textAlign: 'center', padding: '80px' }}>
        <h2>Rule Not Found</h2>
        <Link href="/app/rules" className="btn-primary" style={{ marginTop: '16px' }}><ArrowLeft size={14} /> Back</Link>
      </div>
    );
  }

  const triggeredAlerts = alerts.filter((a) => a.ruleIds.includes(ruleId));

  const severity = rule.severity || rule.severityMapping;
  const scoreWeight = rule.scoreWeight ?? rule.scoreContribution;
  const status = rule.status ?? (rule.enabled ? 'Active' : 'Draft');
  const createdAt = rule.createdAt || rule.effectiveFrom;
  const updatedAt = rule.updatedAt || rule.lastEvaluatedAt;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'logic', label: 'Rule Logic' },
    { id: 'alerts', label: `Triggered Alerts (${triggeredAlerts.length})` },
    { id: 'simulator', label: 'Simulator' },
  ];

  return (
    <div className="app-page-wrapper">
      <Link href="/app/rules" className="btn-secondary" style={{ fontSize: '11.5px', width: 'fit-content' }}>
        <ArrowLeft size={13} /> Back to Rules
      </Link>

      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className={`badge ${status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{status}</span>
            <span className={`badge ${severity === 'Critical' ? 'badge-critical' : severity === 'High' ? 'badge-high' : 'badge-medium'}`}>{severity}</span>
            <span className="badge badge-neutral">v{rule.version}</span>
          </div>
          <h1>{rule.name}</h1>
          <p>{rule.id} · {rule.category} · Weight: {scoreWeight} pts</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setActiveTab('simulator')}>
          <Sliders size={13} /> Open Simulator
        </button>
      </div>

      <div className="app-tabs">
        {tabs.map((t) => (
          <button type="button" key={t.id} className={`app-tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="detail-grid">
          <div className="app-card">
            <div className="app-card-header"><h3 className="app-card-title"><BookOpen size={15} color="#AD7048" /> Rule Profile</h3></div>
            <div className="app-card-body">
              <div className="key-value-list">
                <div className="key-value-row"><span className="key-value-label">Rule ID</span><span className="key-value-value">{rule.id}</span></div>
                <div className="key-value-row"><span className="key-value-label">Name</span><span className="key-value-value">{rule.name}</span></div>
                <div className="key-value-row"><span className="key-value-label">Category</span><span className="key-value-value">{rule.category}</span></div>
                <div className="key-value-row"><span className="key-value-label">Severity</span><span className="key-value-value">{severity}</span></div>
                <div className="key-value-row"><span className="key-value-label">Score Weight</span><span className="key-value-value tabular-nums">{scoreWeight}</span></div>
                <div className="key-value-row"><span className="key-value-label">Version</span><span className="key-value-value">v{rule.version}</span></div>
                <div className="key-value-row"><span className="key-value-label">Status</span><span className="key-value-value">{status}</span></div>
                <div className="key-value-row"><span className="key-value-label">Created</span><span className="key-value-value tabular-nums">{formatDate(createdAt)}</span></div>
                <div className="key-value-row"><span className="key-value-label">Updated</span><span className="key-value-value tabular-nums">{formatDate(updatedAt)}</span></div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="kpi-card">
              <div className="kpi-top"><span>Times Triggered</span><span className="kpi-icon"><CheckCircle size={15} /></span></div>
              <div className="kpi-value tabular-nums">{triggeredAlerts.length}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-top"><span>Score Contribution</span></div>
              <div className="kpi-value tabular-nums">{scoreWeight} pts</div>
            </div>
            <div className="app-card">
              <div className="app-card-header"><h3 className="app-card-title">Description</h3></div>
              <div className="app-card-body">
                <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#59554E' }}>{rule.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIC */}
      {activeTab === 'logic' && (
        <div className="app-card">
          <div className="app-card-header"><h3 className="app-card-title"><Code size={15} color="#AD7048" /> Rule Condition Logic</h3></div>
          <div className="app-card-body">
            <div style={{ background: '#10110F', borderRadius: '8px', padding: '20px', fontFamily: 'JetBrains Mono, Consolas, monospace', fontSize: '12.5px', color: '#F3EEE4', lineHeight: '1.8', overflowX: 'auto' }}>
              {/* Threshold parameters */}
              <div style={{ color: '#C7A16B', marginBottom: '12px', fontWeight: 700 }}>// Rule: {rule.name}</div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#75856B' }}>const </span>
                <span style={{ color: '#AD7048' }}>thresholdValue</span>
                <span style={{ color: '#F3EEE4' }}> = </span>
                <span style={{ color: '#C7A16B' }}>{rule.thresholdValue}</span>
                <span style={{ color: '#6F6A60' }}> // {rule.thresholdUnit}</span>
                <span style={{ color: '#F3EEE4' }}>;</span>
              </div>
              <div style={{ marginTop: '16px', color: '#6F6A60', borderTop: '1px solid #2A2C29', paddingTop: '12px' }}>
                <div style={{ color: '#C7A16B', marginBottom: '8px' }}>// Condition: triggers when...</div>
                <div style={{ color: '#F3EEE4' }}>{rule.logicExpression || rule.conditionLogic || `transaction matches ${rule.id} criteria → score += ${scoreWeight}`}</div>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6F6A60', marginBottom: '12px' }}>
                Configurable Thresholds
              </h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div className="key-value-row">
                  <span className="key-value-label">Active Threshold</span>
                  <span className="key-value-value tabular-nums" style={{ fontWeight: 700 }}>{rule.thresholdValue} {rule.thresholdUnit}</span>
                </div>
                <div className="key-value-row">
                  <span className="key-value-label">Score Contribution</span>
                  <span className="key-value-value tabular-nums" style={{ fontWeight: 700 }}>+{scoreWeight} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ALERTS */}
      {activeTab === 'alerts' && (
        <div className="app-card">
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr><th>Alert ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Triggered</th></tr>
              </thead>
              <tbody>
                {triggeredAlerts.map((al) => (
                  <tr key={al.id} className="app-table-clickable-row" onClick={() => window.location.href = `/app/alerts/${al.id}`}>
                    <td><strong>{al.id}</strong></td>
                    <td>{al.title}</td>
                    <td><span className={`badge ${al.severity === 'Critical' ? 'badge-critical' : al.severity === 'High' ? 'badge-high' : 'badge-medium'}`}>{al.severity}</span></td>
                    <td><span className="badge badge-neutral">{al.status}</span></td>
                    <td className="tabular-nums">{formatDate(al.triggeredAt || al.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SIMULATOR */}
      {activeTab === 'simulator' && (
        <RuleSimulator focusRuleId={ruleId} />
      )}
    </div>
  );
}
