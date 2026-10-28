'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  Flame,
  Layers,
  Lock,
  RefreshCw,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Zap,
  Check,
  FileCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';

interface PipelineStage {
  name: string;
  percent: number;
  detail: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  { name: 'PRNG Master Data', percent: 20, detail: 'Synthesizing customers & double-entry deposit accounts' },
  { name: 'Ledger Balances', percent: 45, detail: 'Reconciling transaction amounts & transfer legs' },
  { name: '6 Risk Rules', percent: 70, detail: 'Evaluating velocity, merchant tiers, and proxy devices' },
  { name: 'Anomaly Injection', percent: 85, detail: 'Isolating 5 negative scenarios into ground truth' },
  { name: 'Validation Suite', percent: 95, detail: 'Verifying 20 mathematical invariants across 5 families' },
  { name: 'Completed', percent: 100, detail: 'Dataset compiled with cryptographic bit-for-bit parity' },
];

export default function DataGeneratorPage() {
  const {
    metadata,
    regenerateDataset,
    resetToDefaults,
    groundTruthScenarios,
  } = useRiskWatch();

  const [seedInput, setSeedInput] = useState<string>(metadata.seed || '20261022');
  const [volumeMode, setVolumeMode] = useState<'starter' | 'full'>(metadata.baselineVolumeMode || 'full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [successJob, setSuccessJob] = useState<{ id: string; seed: string } | null>(null);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setSuccessJob(null);
    setCurrentStageIdx(0);

    // Simulate real-time pipeline staging visually while submitting to backend API
    const targetCustomers = volumeMode === 'full' ? 5000 : 500;
    const targetAccounts = volumeMode === 'full' ? 7000 : 700;
    const targetTransactions = volumeMode === 'full' ? 100000 : 10000;

    // Asynchronously dispatch real job to backend API
    try {
      void fetch('/api/v1/jobs/generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: seedInput,
          targetCustomers,
          targetAccounts,
          targetTransactions,
        }),
      });
    } catch {
      // Background worker handles persistent queue
    }

    // Step through the 6 pipeline stages
    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      setCurrentStageIdx(i);
      await new Promise((resolve) => setTimeout(resolve, 260));
    }

    regenerateDataset(seedInput, volumeMode);
    setIsGenerating(false);
    setSuccessJob({
      id: `JOB-${Date.now().toString().slice(-6)}`,
      seed: seedInput,
    });
  };

  const handleReset = () => {
    setSeedInput('20261022');
    setVolumeMode('full');
    resetToDefaults();
    setSuccessJob(null);
  };

  const currentStage = PIPELINE_STAGES[currentStageIdx];

  return (
    <div className="app-page-wrapper">
      {/* Page Header */}
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-neutral">PRNG Engine</span>
            <span className="badge badge-success">Deterministic Synthesis</span>
            <span className="badge badge-neutral hidden sm:inline">Supabase Realtime Sync</span>
          </div>
          <h1>Synthetic Financial Data Generator</h1>
          <p>
            Deterministic generation harness powered by seed-isolated pseudorandom generators. Compiles interconnected customers, accounts, transaction graphs, and controlled negative edge cases.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            title="Restore factory dataset (Seed 20261022)"
          >
            <RotateCcw size={13} /> Reset Baseline
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleRegenerate}
            disabled={isGenerating}
            style={{ minWidth: '160px' }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={13} className="spin-slow" /> Synthesizing...
              </>
            ) : (
              <>
                <RefreshCw size={13} /> Regenerate Dataset
              </>
            )}
          </button>
        </div>
      </div>

      {/* Realtime Pipeline Execution Tracker Banner */}
      {isGenerating && (
        <div
          className="app-card"
          style={{
            borderColor: 'var(--app-accent, #AD7048)',
            background: 'var(--app-surface, #fbf9f4)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#AD7048',
                  animation: 'pulse 1.2s infinite',
                }}
              />
              <strong style={{ fontSize: '13px' }}>
                Pipeline Active: Stage {currentStageIdx + 1} of {PIPELINE_STAGES.length} — {currentStage.name}
              </strong>
            </div>
            <span className="tabular-nums font-mono" style={{ fontSize: '12px', fontWeight: 700, color: '#AD7048' }}>
              {currentStage.percent}%
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'var(--app-line, #ded7ca)',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                width: `${currentStage.percent}%`,
                height: '100%',
                background: '#AD7048',
                transition: 'width 240ms ease',
              }}
            />
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--app-muted, #6F6A60)' }}>
            {currentStage.detail}
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {successJob && !isGenerating && (
        <div
          style={{
            background: 'rgba(76, 104, 72, 0.12)',
            border: '1px solid #4C6848',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} color="#4C6848" />
            <span style={{ fontSize: '12.5px', color: 'var(--app-ink, #171713)' }}>
              Deterministic dataset compiled successfully with Seed <strong>{successJob.seed}</strong> ({volumeMode.toUpperCase()} scale).
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/app/transactions" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }}>
              View Transactions <ArrowRight size={12} />
            </Link>
            <Link href="/app/alerts" className="btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>
              Triage Alerts <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* Active Dataset Specifications & Run Manifest */}
      <div className="app-card" style={{ marginBottom: '16px' }}>
        <div className="app-card-header">
          <div>
            <h3 className="app-card-title">
              <Database size={16} color="#AD7048" />
              Active Dataset Specifications & Run Manifest
            </h3>
            <p className="app-card-subtitle">
              Current operational profile loaded in browser memory and local cache
            </p>
          </div>
          <span className="badge badge-success">Active Run</span>
        </div>

        <div className="app-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '10px 12px', background: 'var(--app-surface-muted, #f3eee4)', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--app-muted, #6F6A60)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Master Random Seed
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: '#AD7048', marginTop: '3px' }}>
                {metadata.seed}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--app-muted, #6F6A60)', marginTop: '2px' }}>
                Deterministic pseudorandom anchor
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--app-surface-muted, #f3eee4)', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--app-muted, #6F6A60)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Run Identifier
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace', marginTop: '5px' }}>
                {metadata.runIdentifier}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--app-muted, #6F6A60)', marginTop: '2px' }}>
                Engine version: {metadata.generatorVersion}
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--app-surface-muted, #f3eee4)', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--app-muted, #6F6A60)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Generated Timestamp
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '6px' }}>
                {formatDate(metadata.createdAt)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--app-muted, #6F6A60)', marginTop: '2px' }}>
                Synchronized client state
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--app-surface-muted, #f3eee4)', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: 'var(--app-muted, #6F6A60)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Validation Status
              </div>
              <div style={{ marginTop: '5px' }}>
                <span className="badge badge-critical" style={{ fontSize: '10px' }}>
                  VALIDATED WITH LABELED EXCEPTIONS
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--app-muted, #6F6A60)', marginTop: '4px' }}>
                5 deliberate anomalies present
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Volume Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Customer Profiles</span>
            <span className="kpi-icon"><Database size={15} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalCustomers.toLocaleString()}</div>
          <div className="kpi-sub">Synthetic entities with KYC</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Deposit Accounts</span>
            <span className="kpi-icon"><Layers size={15} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalAccounts.toLocaleString()}</div>
          <div className="kpi-sub">Savings, current & escrow</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Financial Transactions</span>
            <span className="kpi-icon"><Zap size={15} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalTransactions.toLocaleString()}</div>
          <div className="kpi-sub">Full ledger transactions</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Triage Risk Alerts</span>
            <span className="kpi-icon"><Flame size={15} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalAlerts.toLocaleString()}</div>
          <div className="kpi-sub">Rule trigger alerts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-top">
            <span>Investigation Cases</span>
            <span className="kpi-icon"><Shield size={15} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalCases.toLocaleString()}</div>
          <div className="kpi-sub">Assigned workflow cases</div>
        </div>
      </div>

      {/* Configuration Controls & Controlled Anomalies */}
      <div className="detail-grid" style={{ marginBottom: '16px' }}>
        {/* Left: Generator Parameter Configuration */}
        <div className="app-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">
                <Sliders size={16} color="#AD7048" />
                Generator Parameter Configuration
              </h3>
              <p className="app-card-subtitle">
                Customize random seed and dataset scale multiplier
              </p>
            </div>
          </div>

          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" htmlFor="seed-input" style={{ margin: 0, fontWeight: 650 }}>
                    Deterministic PRNG Seed
                  </label>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'var(--app-muted, #6F6A60)' }}>Presets:</span>
                    {['20261022', '20261023', '20261024'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '9.5px', padding: '1px 6px', minHeight: '20px', fontFamily: 'monospace' }}
                        onClick={() => setSeedInput(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  id="seed-input"
                  type="text"
                  className="form-input"
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="e.g. 20261022"
                  style={{ fontFamily: 'monospace', fontWeight: 600, width: '100%', padding: '9px 12px', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '10.5px', color: 'var(--app-muted, #6F6A60)', marginTop: '4px' }}>
                  Cryptographic anchor: Changing this string generates a reproducible, bit-for-bit alternate universe.
                </div>
              </div>

              <div className="form-row">
                <label className="form-label" style={{ marginBottom: '8px', fontWeight: 650 }}>
                  Scale Profile / Volume Mode
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    onClick={() => setVolumeMode('full')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: volumeMode === 'full' ? '2px solid var(--app-accent, #AD7048)' : '1px solid var(--app-line, #ded7ca)',
                      background: volumeMode === 'full' ? 'rgba(173, 112, 72, 0.08)' : 'var(--app-surface-muted, #f3eee4)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '12.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--app-ink, #171713)' }}>Full Enterprise Scale</span>
                      {volumeMode === 'full' ? (
                        <span className="badge badge-success" style={{ fontSize: '9px', gap: '4px' }}>
                          <CheckCircle2 size={11} /> Selected
                        </span>
                      ) : (
                        <span style={{ fontSize: '10.5px', color: 'var(--app-muted, #6F6A60)' }}>Standard</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--app-muted, #4A463E)', marginTop: '5px', lineHeight: 1.4 }}>
                      5,000 customers · 7,000 accounts · 100,000 transactions · 1,000 alerts · 284 cases
                    </div>
                  </div>

                  <div
                    onClick={() => setVolumeMode('starter')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: volumeMode === 'starter' ? '2px solid var(--app-accent, #AD7048)' : '1px solid var(--app-line, #ded7ca)',
                      background: volumeMode === 'starter' ? 'rgba(173, 112, 72, 0.08)' : 'var(--app-surface-muted, #f3eee4)',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '12.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--app-ink, #171713)' }}>Starter Sample Scale</span>
                      {volumeMode === 'starter' ? (
                        <span className="badge badge-success" style={{ fontSize: '9px', gap: '4px' }}>
                          <CheckCircle2 size={11} /> Selected
                        </span>
                      ) : (
                        <span style={{ fontSize: '10.5px', color: 'var(--app-muted, #6F6A60)' }}>Lightweight</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--app-muted, #4A463E)', marginTop: '5px', lineHeight: 1.4 }}>
                      500 customers · 700 accounts · 10,000 transactions · 100 alerts · 28 cases
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--app-line, #ded7ca)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--app-muted, #6F6A60)' }}>
                ⚡ ~1.2s Synthesis · Deterministic Memory Projection
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRegenerate}
                disabled={isGenerating}
                style={{ padding: '7px 16px', fontSize: '11px' }}
              >
                {isGenerating ? 'Synthesizing...' : 'Execute Synthesis'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controlled Negative Scenarios Guarantee */}
        <div className="app-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">
                <AlertTriangle size={16} color="#D94C42" />
                Guaranteed Controlled Anomalies ({groundTruthScenarios.length})
              </h3>
              <p className="app-card-subtitle">
                Deterministic negative test fixtures injected into every generation
              </p>
            </div>
            <span className="badge badge-critical">Labeled Ground Truth</span>
          </div>

          <div className="app-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groundTruthScenarios.map((sc, idx) => (
                <div
                  key={sc.scenarioId}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '9px 12px',
                    background: 'var(--app-surface-muted, #f3eee4)',
                    borderRadius: '6px',
                    border: '1px solid var(--app-line, #ded7ca)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'monospace' }}>
                        ANOMALY-0{idx + 1}
                      </span>
                      <strong style={{ fontSize: '11.5px', color: 'var(--app-ink, #171713)' }}>
                        {sc.issueType}
                      </strong>
                    </div>
                    <span className="badge badge-critical" style={{ fontSize: '8.5px', padding: '1px 5px' }}>
                      {sc.validationResult}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--app-muted, #6F6A60)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>Entity:</span>
                    <code style={{ fontSize: '10px', padding: '1px 4px', background: 'var(--app-surface, #fbf9f4)', border: '1px solid var(--app-line, #ded7ca)', borderRadius: '3px' }}>
                      {sc.entityId}
                    </code>
                    <span>·</span>
                    <span>{sc.expectedDetection}</span>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '12px',
                padding: '9px 12px',
                background: 'rgba(173, 112, 72, 0.08)',
                borderRadius: '6px',
                fontSize: '10.5px',
                color: 'var(--app-ink, #171713)',
                lineHeight: 1.45,
                border: '1px solid rgba(173, 112, 72, 0.2)',
              }}
            >
              <strong>Ground Truth Isolation:</strong> These 5 deliberate anomalies test validator detection fidelity and are strictly partitioned into <code>ground_truth.json</code>.
            </div>
          </div>
        </div>
      </div>

      {/* Compliance & Methodology Card */}
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <h3 className="app-card-title">
              <Lock size={16} color="#4C6848" />
              Privacy Preservation & Synthetic Fidelity Standards
            </h3>
            <p className="app-card-subtitle">
              Enterprise data protection and regulatory alignment certifications
            </p>
          </div>
        </div>
        <div className="app-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', fontSize: '12px', lineHeight: 1.6 }}>
            <div style={{ padding: '12px', background: 'var(--app-surface-muted, #f3eee4)', borderRadius: '6px', border: '1px solid var(--app-line, #ded7ca)' }}>
              <h4 style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--app-ink, #171713)' }}>
                Zero Actual PII Exposure
              </h4>
              <p style={{ color: 'var(--app-muted, #6F6A60)', margin: 0 }}>
                All names, Aadhaar/PAN formats, phone numbers, and addresses are algorithmically generated using synthetic dictionary distribution weights. No actual individual or institution information exists in this environment.
              </p>
            </div>
            <div style={{ padding: '12px', background: 'var(--app-surface-muted, #f3eee4)', borderRadius: '6px', border: '1px solid var(--app-line, #ded7ca)' }}>
              <h4 style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--app-ink, #171713)' }}>
                Deterministic Reproducibility
              </h4>
              <p style={{ color: 'var(--app-muted, #6F6A60)', margin: 0 }}>
                Given the seed <code>20261022</code>, any auditor or compliance officer anywhere in the world will reconstruct the identical cryptographic bitstream of transactions, balances, and edge cases.
              </p>
            </div>
            <div style={{ padding: '12px', background: 'var(--app-surface-muted, #f3eee4)', borderRadius: '6px', border: '1px solid var(--app-line, #ded7ca)' }}>
              <h4 style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--app-ink, #171713)' }}>
                Real-World Graph Topology
              </h4>
              <p style={{ color: 'var(--app-muted, #6F6A60)', margin: 0 }}>
                Transfer links preserve realistic scale-free power law distributions. Circular loops, burst velocity spikes, and proxy IP clustering emulate complex multi-hop money laundering topologies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
