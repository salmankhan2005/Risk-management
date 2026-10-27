'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Play,
  RotateCcw,
  Save,
  Shield,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useRiskWatch } from '@/lib/store';
import { RiskRule } from '@/lib/types';

interface RuleSimulatorProps {
  rule?: RiskRule;
  focusRuleId?: string;
}

export default function RuleSimulator({ rule: initialRule, focusRuleId }: RuleSimulatorProps) {
  const { updateRule, transactions, rules } = useRiskWatch();

  const rule = initialRule || rules.find((r) => r.id === focusRuleId) || rules[0];

  const [draftThreshold, setDraftThreshold] = useState<number>(rule?.thresholdValue ?? 4);
  const [draftScore, setDraftScore] = useState<number>(rule?.scoreContribution ?? 35);
  const [draftEnabled, setDraftEnabled] = useState<boolean>(rule?.enabled ?? true);
  const [simulatedResults, setSimulatedResults] = useState<{
    testedCount: number;
    triggeredCount: number;
    difference: number;
    sampleTriggerTxns: string[];
  } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (rule) {
      setDraftThreshold(rule.thresholdValue);
      setDraftScore(rule.scoreContribution);
      setDraftEnabled(rule.enabled);
      setSimulatedResults(null);
    }
  }, [rule?.id]);

  // Run simulation against in-memory transaction dataset
  const runSimulation = () => {
    // Model realistic impact based on threshold adjustment
    let triggers = 0;
    const sampleIds: string[] = [];

    transactions.forEach((tx) => {
      let triggered = false;
      if (rule.category === 'Velocity') {
        // e.g. if threshold is lower, more trigger
        triggered = tx.triggeredRules.includes(rule.id) || (draftThreshold <= 3 && tx.amount > 100000);
      } else if (rule.category === 'Value') {
        triggered = tx.amount >= draftThreshold;
      } else if (rule.category === 'Device') {
        triggered = tx.deviceId === 'DEV-00892' || (draftThreshold <= 1 && !!tx.deviceId);
      } else {
        triggered = tx.triggeredRules.includes(rule.id);
      }

      if (triggered) {
        triggers++;
        if (sampleIds.length < 4) sampleIds.push(tx.id);
      }
    });

    const diff = triggers - rule.triggersCount;
    setSimulatedResults({
      testedCount: transactions.length,
      triggeredCount: triggers,
      difference: diff,
      sampleTriggerTxns: sampleIds,
    });
    setSavedSuccess(false);
  };

  const handleApplyRule = () => {
    updateRule(rule.id, {
      thresholdValue: draftThreshold,
      scoreContribution: draftScore,
      enabled: draftEnabled,
      version: `${rule.version.split('.')[0]}.${Number(rule.version.split('.')[1]) + 1}.0`,
      lastEvaluatedAt: new Date().toISOString(),
      triggersCount: simulatedResults ? simulatedResults.triggeredCount : rule.triggersCount,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="app-card">
      <div className="app-card-header">
        <div>
          <h3 className="app-card-title">
            <Sliders size={16} color="#AD7048" />
            Interactive Rule Simulator & Threshold Tuner
          </h3>
          <p className="app-card-subtitle">
            Simulate parameter adjustments without altering historical evaluations until explicitly committed.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setDraftThreshold(rule.thresholdValue);
              setDraftScore(rule.scoreContribution);
              setDraftEnabled(rule.enabled);
              setSimulatedResults(null);
            }}
            title="Reset parameters to active rule values"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={runSimulation}
            style={{ background: '#AD7048', borderColor: '#AD7048' }}
          >
            <Play size={13} /> Run Simulation
          </button>
        </div>
      </div>

      <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Sliders and Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span>Evaluation Threshold ({rule.thresholdUnit})</span>
              <strong style={{ color: '#AD7048' }}>{draftThreshold}</strong>
            </label>
            <input
              type="range"
              min={rule.category === 'Value' ? 100000 : 1}
              max={rule.category === 'Value' ? 2000000 : 20}
              step={rule.category === 'Value' ? 50000 : 1}
              value={draftThreshold}
              onChange={(e) => setDraftThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#AD7048' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#6F6A60', marginTop: '4px' }}>
              <span>Strict (More alerts)</span>
              <span>Permissive (Fewer alerts)</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span>Risk Score Contribution</span>
              <strong style={{ color: '#C7A16B' }}>+{draftScore} pts</strong>
            </label>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={draftScore}
              onChange={(e) => setDraftScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#C7A16B' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#6F6A60', marginTop: '4px' }}>
              <span>Low weight</span>
              <span>High weight</span>
            </div>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
              Rule Enforcement State
            </span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={draftEnabled}
                onChange={(e) => setDraftEnabled(e.target.checked)}
              />
              <span>{draftEnabled ? 'Active in Real-Time Engine' : 'Disabled (Bypassed)'}</span>
            </label>
          </div>
        </div>

        {/* Simulation Output Area */}
        {simulatedResults && (
          <div
            style={{
              background: '#F3EEE4',
              border: '1px solid #D9D1C4',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#171713' }}>Simulation Preview Outcome</strong>
                <div style={{ fontSize: '11px', color: '#6F6A60' }}>
                  Evaluated across {simulatedResults.testedCount} synthetic transactions
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                  Projected Triggers: <strong>{simulatedResults.triggeredCount}</strong>
                </span>
                <span
                  className={`badge ${
                    simulatedResults.difference > 0
                      ? 'badge-high'
                      : simulatedResults.difference < 0
                      ? 'badge-low'
                      : 'badge-neutral'
                  }`}
                  style={{ fontSize: '11px' }}
                >
                  {simulatedResults.difference > 0 ? `+${simulatedResults.difference}` : simulatedResults.difference} delta vs active rule
                </span>
              </div>
            </div>

            {simulatedResults.sampleTriggerTxns.length > 0 && (
              <div style={{ fontSize: '11.5px', color: '#6F6A60' }}>
                Sample triggering transactions:{' '}
                {simulatedResults.sampleTriggerTxns.map((id) => (
                  <code key={id} style={{ margin: '0 4px', background: '#E7DFD3', padding: '2px 5px', borderRadius: '3px' }}>
                    {id}
                  </code>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              {savedSuccess ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#75856B', fontSize: '12px', fontWeight: 700 }}>
                  <CheckCircle2 size={16} /> Rule changes applied and audit trail event committed!
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleApplyRule}
                  style={{ fontSize: '12px' }}
                >
                  <Save size={13} /> Apply & Commit New Version
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
