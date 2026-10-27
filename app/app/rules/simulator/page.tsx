'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle, Flame, Layers, ShieldCheck, Sliders, Zap } from 'lucide-react';
import RuleSimulator from '@/components/ui/RuleSimulator';
import { useRiskWatch } from '@/lib/store';
import { RiskRule } from '@/lib/types';

export default function StandaloneRuleSimulatorPage() {
  const { rules, transactions, alerts } = useRiskWatch();
  const [selectedRuleId, setSelectedRuleId] = useState<string>(rules[0]?.id || 'RUL-VELOCITY-01');

  const selectedRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

  const totalSimulatedTriggers = rules.reduce((acc, r) => acc + r.triggersCount, 0);

  return (
    <div className="app-page-wrapper">
      <Link href="/app/rules" className="btn-secondary" style={{ fontSize: '11.5px', width: 'fit-content' }}>
        <ArrowLeft size={13} /> Back to Risk Rules
      </Link>

      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-neutral">Simulation Environment</span>
            <span className="badge badge-success">Deterministic Corpus</span>
          </div>
          <h1>Rule Threshold Simulator & Sensitivity Lab</h1>
          <p>
            Interactive testing harness to evaluate parameter adjustments and score contributions against live and synthetic transaction baselines before committal to production rulesets.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Configured Rules</span>
            <span className="kpi-icon"><ShieldCheck size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{rules.length}</div>
          <div className="kpi-sub">All available detection models</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Evaluation Dataset</span>
            <span className="kpi-icon"><Layers size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{transactions.length} txns</div>
          <div className="kpi-sub">In-memory evaluation pool</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Total Alerts Produced</span>
            <span className="kpi-icon"><Zap size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{alerts.length}</div>
          <div className="kpi-sub">Active triage alerts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Aggregated Triggers</span>
            <span className="kpi-icon"><Flame size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{totalSimulatedTriggers}</div>
          <div className="kpi-sub">Across all rule evaluations</div>
        </div>
      </div>

      {/* Rule Selection Bar */}
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <h3 className="app-card-title">Select Rule to Tune</h3>
            <p className="app-card-subtitle">Choose a rule below to load its thresholds into the interactive tuner</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
          {rules.map((rule) => {
            const isSelected = rule.id === selectedRule?.id;
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => setSelectedRuleId(rule.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: isSelected ? '1.5px solid #AD7048' : '1px solid #E4DFD5',
                  background: isSelected ? 'rgba(173, 112, 72, 0.05)' : '#FAF7F0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#AD7048' }}>
                    {rule.id}
                  </span>
                  <span className={`badge ${rule.severityMapping === 'Critical' ? 'badge-critical' : rule.severityMapping === 'High' ? 'badge-high' : 'badge-medium'}`}>
                    {rule.severityMapping}
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#10110F' }}>
                  {rule.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6F6A60', marginTop: '4px' }}>
                  <span>Threshold: <strong>{rule.thresholdValue} {rule.thresholdUnit}</strong></span>
                  <span>Weight: <strong>+{rule.scoreContribution}</strong></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Embedded Simulator */}
      {selectedRule && <RuleSimulator rule={selectedRule} />}

      {/* Comparative Rules Overview Table */}
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <h3 className="app-card-title">Rule Configuration & Sensitivity Comparison Matrix</h3>
            <p className="app-card-subtitle">Global view of active parameters, thresholds, and trigger volume across the detection engine</p>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="app-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Threshold</th>
                <th>Score Addition</th>
                <th>Severity</th>
                <th>Historical Triggers</th>
                <th>Logic Expression</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => {
                const isSelected = r.id === selectedRule?.id;
                return (
                  <tr
                    key={r.id}
                    style={{
                      background: isSelected ? 'rgba(173, 112, 72, 0.04)' : undefined,
                      fontWeight: isSelected ? 600 : 'normal',
                    }}
                  >
                    <td>
                      <code style={{ fontSize: '11px', color: '#AD7048' }}>{r.id}</code>
                    </td>
                    <td>{r.name}</td>
                    <td>
                      <span className="badge badge-neutral">{r.category}</span>
                    </td>
                    <td className="tabular-nums">
                      {r.thresholdValue} {r.thresholdUnit}
                    </td>
                    <td className="tabular-nums">
                      <span style={{ color: r.scoreContribution >= 30 ? '#D94C42' : '#AD7048', fontWeight: 700 }}>
                        +{r.scoreContribution} pts
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${r.severityMapping === 'Critical' ? 'badge-critical' : r.severityMapping === 'High' ? 'badge-high' : 'badge-medium'}`}>
                        {r.severityMapping}
                      </span>
                    </td>
                    <td className="tabular-nums">{r.triggersCount}</td>
                    <td>
                      <code style={{ fontSize: '10.5px', background: '#F0ECE1', padding: '2px 5px', borderRadius: '3px' }}>
                        {r.logicExpression}
                      </code>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '10.5px', padding: '3px 8px' }}
                        onClick={() => setSelectedRuleId(r.id)}
                      >
                        Tune
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
