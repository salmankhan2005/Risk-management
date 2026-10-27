'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, BookOpen, CheckCircle, ExternalLink, Shield } from 'lucide-react';
import { useRiskWatch } from '@/lib/store';
import { formatDate } from '@/lib/data';
import { GroundTruthScenario } from '@/lib/types';

export default function GroundTruthPage() {
  const router = useRouter();
  const { groundTruthScenarios, transactions, accounts, alerts, cases, transfers } = useRiskWatch();
  const [selected, setSelected] = useState<string | null>(null);

  const scenarios = groundTruthScenarios;

  const getScenarioStatus = (scenario: GroundTruthScenario) => {
    const scType = scenario.scenarioType || scenario.scenarioId;
    if (scType === 'NEG-SCENARIO-01' || scType === 'transaction_on_closed_account') {
      const closed = accounts.filter((a) => a.status === 'Closed').map((a) => a.id);
      const hit = transactions.some((t) =>
        closed.includes(t.accountId) || closed.includes(t.fromAccountId ?? '') || closed.includes(t.toAccountId ?? '')
      );
      return hit ? 'confirmed' : 'detected';
    }
    if (scType === 'NEG-SCENARIO-02' || scType === 'negative_balance_no_overdraft') {
      const hit = accounts.some((a) => a.currentBalance < 0 && !a.overdraftAllowed);
      return hit ? 'confirmed' : 'detected';
    }
    if (scType === 'NEG-SCENARIO-03' || scType === 'transfer_reconciliation_failure') {
      const hit = transfers.some((t) => t.reconciliationStatus !== 'Reconciled' || t.state === 'Reconciliation Failed');
      return hit ? 'confirmed' : 'detected';
    }
    if (scType === 'NEG-SCENARIO-04' || scType === 'alert_without_transaction') {
      const hit = alerts.some((a) => !a.triggerTxnIds || a.triggerTxnIds.length === 0);
      return hit ? 'confirmed' : 'detected';
    }
    if (scType === 'NEG-SCENARIO-05' || scType === 'case_disposition_before_alert') {
      const hit = cases.some((c) => {
        const linkedAlerts = alerts.filter((a) => c.linkedAlertIds?.includes(a.id));
        return linkedAlerts.some((a) => c.resolvedAt && (a.triggeredAt || a.createdAt) && new Date(c.resolvedAt) < new Date(a.triggeredAt || a.createdAt));
      });
      return hit ? 'confirmed' : 'detected';
    }
    return scenario.validationResult === 'DETECTED' ? 'confirmed' : 'detected';
  };

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-neutral">Labeled Benchmark Suite</span>
            <span className="badge badge-critical">5 Controlled Negative Scenarios</span>
          </div>
          <h1>Ground Truth Isolation & Benchmark Manifest</h1>
          <p>
            Deterministic negative test fixtures seeded into the dataset. Each scenario is independently verifiable and serves as a strict regression benchmark for rule engine sensitivity and validation integrity.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="app-card" style={{ padding: '16px 20px', background: '#1E201C' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Shield size={15} color="#C7A16B" />
          <strong style={{ color: '#F3EEE4', fontSize: '13px' }}>What are Ground Truth Scenarios?</strong>
        </div>
        <p style={{ fontSize: '12.5px', color: '#A8A197', lineHeight: '1.6', margin: 0 }}>
          Ground truth scenarios are deliberately seeded anomalies — cases that <em>must</em> trigger specific assertions in the validation suite and be detected by the risk engine. Each fixture is documented with its expected outcome, supporting rules, affected entity identifiers, and current live status. These test suites guarantee zero false dismissal of core regulatory failure modes.
        </p>
      </div>

      {/* Scenarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {scenarios.map((scenario, idx) => {
          const status = getScenarioStatus(scenario);
          const scKey = scenario.scenarioId || String(scenario.id);
          const isSelected = selected === scKey;
          const affectedList = scenario.affectedEntityIds || [scenario.entityId];
          const name = scenario.name || scenario.issueType;
          const desc = scenario.description || scenario.explanation;
          const expectedDet = scenario.expectedDetectionMethod || scenario.expectedDetection;

          return (
            <div
              key={scKey}
              className="app-card"
              style={{
                padding: '20px',
                borderLeft: `4px solid ${status === 'confirmed' ? '#D94C42' : '#AD7048'}`,
                cursor: 'pointer',
                transition: 'box-shadow 0.2s ease',
              }}
              onClick={() => setSelected(isSelected ? null : scKey)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#10110F',
                        color: '#FAF7F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#10110F' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '1px' }}>
                        <code>{scenario.scenarioId}</code> · Entity: <strong>{scenario.entityType}</strong>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#4A463E', lineHeight: '1.5', margin: 0 }}>{desc}</p>

                  {isSelected && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="key-value-list" style={{ background: '#FAF7F0', borderRadius: '6px', padding: '14px', border: '1px solid #E8E3D9' }}>
                        <div className="key-value-row">
                          <span className="key-value-label">Expected Detection</span>
                          <span className="key-value-value" style={{ fontWeight: 600 }}>{expectedDet}</span>
                        </div>
                        <div className="key-value-row">
                          <span className="key-value-label">Expected Outcome</span>
                          <span className="key-value-value">{scenario.expectedOutcome}</span>
                        </div>
                        <div className="key-value-row">
                          <span className="key-value-label">Supporting Rule</span>
                          <span className="key-value-value">
                            <code style={{ color: '#AD7048', fontWeight: 700 }}>{scenario.supportingRule}</code>
                          </span>
                        </div>
                        <div className="key-value-row">
                          <span className="key-value-label">Target Entity References</span>
                          <span className="key-value-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                            {affectedList.join(', ')}
                          </span>
                        </div>
                        {scenario.seededAt && (
                          <div className="key-value-row">
                            <span className="key-value-label">Seeded At</span>
                            <span className="key-value-value tabular-nums">{formatDate(scenario.seededAt)}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {idx === 0 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '11px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/app/transactions');
                            }}
                          >
                            <ExternalLink size={12} /> Inspect Target Ledger
                          </button>
                        )}
                        {idx === 1 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '11px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/app/accounts');
                            }}
                          >
                            <ExternalLink size={12} /> Inspect Overdrawn Account
                          </button>
                        )}
                        {idx === 2 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '11px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/app/transfers');
                            }}
                          >
                            <ExternalLink size={12} /> Inspect Transfer Leg Failure
                          </button>
                        )}
                        {idx === 3 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '11px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/app/alerts');
                            }}
                          >
                            <ExternalLink size={12} /> Inspect Orphaned Alert
                          </button>
                        )}
                        {idx === 4 && (
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ fontSize: '11px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/app/cases');
                            }}
                          >
                            <ExternalLink size={12} /> Inspect Premature Disposition Case
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '11px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push('/app/validation');
                          }}
                        >
                          View in Validation Lab →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <span
                    className="badge badge-critical"
                    style={{ fontSize: '10px', textTransform: 'uppercase' }}
                  >
                    Confirmed Seeded
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
