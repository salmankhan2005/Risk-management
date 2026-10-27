'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  Flame,
  Info,
  Layers,
  Lock,
  RefreshCw,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';

export default function DataGeneratorPage() {
  const {
    metadata,
    regenerateDataset,
    resetToDefaults,
    groundTruthScenarios,
    auditEvents,
  } = useRiskWatch();

  const [seedInput, setSeedInput] = useState<string>(metadata.seed || '20261022');
  const [volumeMode, setVolumeMode] = useState<'starter' | 'full'>(metadata.baselineVolumeMode || 'full');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRegenerate = () => {
    setIsGenerating(true);
    setSuccessMessage(null);

    setTimeout(() => {
      regenerateDataset(seedInput, volumeMode);
      setIsGenerating(false);
      setSuccessMessage(
        `Deterministic dataset recompiled successfully using seed "${seedInput}" in ${volumeMode.toUpperCase()} mode.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    }, 900);
  };

  const handleReset = () => {
    setSeedInput('20261022');
    setVolumeMode('full');
    resetToDefaults();
    setSuccessMessage('Reset dataset to default baseline specifications (Seed: 20261022, Full Scale).');
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-neutral">PRNG Engine</span>
            <span className="badge badge-success">Deterministic Synthesis</span>
          </div>
          <h1>Synthetic Financial Data Generator</h1>
          <p>
            Deterministic generation harness powered by seed-isolated pseudorandom generators. Compiles interconnected customers, accounts, transaction graphs, and controlled negative edge cases.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-secondary" onClick={handleReset} title="Restore factory dataset">
            <RotateCcw size={13} /> Reset Baseline
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleRegenerate}
            disabled={isGenerating}
            style={{ minWidth: '150px' }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={13} className="spin-slow" /> Compiling...
              </>
            ) : (
              <>
                <RefreshCw size={13} /> Regenerate Dataset
              </>
            )}
          </button>
        </div>
      </div>

      {successMessage && (
        <div
          style={{
            background: 'rgba(117, 133, 107, 0.15)',
            border: '1px solid #75856B',
            color: '#10110F',
            padding: '12px 16px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12.5px',
          }}
        >
          <CheckCircle2 size={16} color="#75856B" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Current Metadata Card */}
      <div className="app-card">
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6F6A60', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Master Random Seed
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: '#AD7048', marginTop: '4px' }}>
              {metadata.seed}
            </div>
            <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>
              Deterministic pseudorandom anchor
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6F6A60', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Run Identifier
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace', marginTop: '6px' }}>
              {metadata.runIdentifier}
            </div>
            <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>
              Engine version: {metadata.generatorVersion}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6F6A60', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Generated Timestamp
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '6px' }}>
              {formatDate(metadata.createdAt)}
            </div>
            <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>
              Synchronized client state
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6F6A60', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Validation Status
            </div>
            <div style={{ marginTop: '6px' }}>
              <span className="badge badge-critical" style={{ fontSize: '10.5px' }}>
                {metadata.validationStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '4px' }}>
              5 deliberate anomalies present
            </div>
          </div>
        </div>
      </div>

      {/* Target Volume Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Customer Profiles</span>
            <span className="kpi-icon"><Database size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalCustomers.toLocaleString()}</div>
          <div className="kpi-sub">Synthetic entities with KYC</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Deposit Accounts</span>
            <span className="kpi-icon"><Layers size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalAccounts.toLocaleString()}</div>
          <div className="kpi-sub">Savings, current & escrow</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Financial Transactions</span>
            <span className="kpi-icon"><Zap size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalTransactions.toLocaleString()}</div>
          <div className="kpi-sub">Full ledger transactions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Triage Risk Alerts</span>
            <span className="kpi-icon"><Flame size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalAlerts.toLocaleString()}</div>
          <div className="kpi-sub">Rule trigger alerts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span>Investigation Cases</span>
            <span className="kpi-icon"><Shield size={16} /></span>
          </div>
          <div className="kpi-value tabular-nums">{metadata.totalCases.toLocaleString()}</div>
          <div className="kpi-sub">Assigned workflow cases</div>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="detail-grid">
        <div className="app-card">
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row">
              <label className="form-label" htmlFor="seed-input">
                Deterministic PRNG Seed
              </label>
              <input
                id="seed-input"
                type="text"
                className="form-input"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="e.g. 20261022"
                style={{ fontFamily: 'monospace', fontWeight: 600 }}
              />
              <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '4px' }}>
                Changing this string produces an entirely different deterministically generated universe.
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">
                Scale Profile / Volume Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  onClick={() => setVolumeMode('full')}
                  style={{
                    padding: '14px',
                    borderRadius: '6px',
                    border: volumeMode === 'full' ? '2px solid #AD7048' : '1px solid #E8E3D9',
                    background: volumeMode === 'full' ? 'rgba(173, 112, 72, 0.06)' : '#FAF7F0',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Full Enterprise Scale</span>
                    {volumeMode === 'full' && <CheckCircle2 size={16} color="#AD7048" />}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#4A463E', marginTop: '6px' }}>
                    5,000 customers · 7,000 accounts · 100,000 transactions · 1,000 alerts
                  </div>
                </div>

                <div
                  onClick={() => setVolumeMode('starter')}
                  style={{
                    padding: '14px',
                    borderRadius: '6px',
                    border: volumeMode === 'starter' ? '2px solid #AD7048' : '1px solid #E8E3D9',
                    background: volumeMode === 'starter' ? 'rgba(173, 112, 72, 0.06)' : '#FAF7F0',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Starter Sample Scale</span>
                    {volumeMode === 'starter' && <CheckCircle2 size={16} color="#AD7048" />}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#4A463E', marginTop: '6px' }}>
                    500 customers · 700 accounts · 10,000 transactions · 100 alerts
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E8E3D9', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6F6A60' }}>
                Execution time: ~0.8s (deterministic memory projection)
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                {isGenerating ? 'Compiling Dataset...' : 'Execute Synthesis'}
              </button>
            </div>
          </div>
        </div>

        {/* Controlled Negative Scenarios Guarantee */}
        <div className="app-card">
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groundTruthScenarios.map((sc, idx) => (
              <div
                key={sc.scenarioId}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  background: '#FAF7F0',
                  borderRadius: '6px',
                  border: '1px solid #E8E3D9',
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#10110F',
                    color: '#FAF7F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#10110F' }}>
                      {sc.issueType}
                    </span>
                    <span className="badge badge-critical" style={{ fontSize: '9.5px' }}>
                      {sc.validationResult}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '2px' }}>
                    Entity: <code>{sc.entityId}</code> ({sc.entityType}) · Expected: {sc.expectedOutcome}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '10px',
              background: 'rgba(173, 112, 72, 0.08)',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#4A463E',
              lineHeight: 1.5,
            }}
          >
            <strong>Note on Ground Truth Isolation:</strong> These anomalies are not platform bugs; they are purposefully labeled negative assertions verified by our 20-point validation suite.
          </div>
        </div>
      </div>

      {/* Compliance & Methodology Card */}
      <div className="app-card">
        <div className="app-card-header">
          <div>
            <h3 className="app-card-title">
              <Lock size={16} color="#75856B" />
              Privacy Preservation & Synthetic Fidelity Standards
            </h3>
            <p className="app-card-subtitle">
              Enterprise data protection and regulatory alignment certifications
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '12px', lineHeight: 1.6 }}>
          <div style={{ padding: '12px', background: '#FAF7F0', borderRadius: '6px', border: '1px solid #E8E3D9' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#10110F' }}>
              Zero Actual PII Exposure
            </h4>
            <p style={{ color: '#4A463E', margin: 0 }}>
              All names, Aadhaar/PAN formats, phone numbers, and addresses are algorithmically generated using synthetic dictionary distribution weights. No actual individual or institution information exists in this environment.
            </p>
          </div>
          <div style={{ padding: '12px', background: '#FAF7F0', borderRadius: '6px', border: '1px solid #E8E3D9' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#10110F' }}>
              Deterministic Reproducibility
            </h4>
            <p style={{ color: '#4A463E', margin: 0 }}>
              Given the seed <code>20261022</code>, any auditor or compliance officer anywhere in the world will reconstruct the identical cryptographic bitstream of transactions, balances, and edge cases.
            </p>
          </div>
          <div style={{ padding: '12px', background: '#FAF7F0', borderRadius: '6px', border: '1px solid #E8E3D9' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#10110F' }}>
              Real-World Graph Topology
            </h4>
            <p style={{ color: '#4A463E', margin: 0 }}>
              Transfer links preserve realistic scale-free power law distributions. Circular loops, burst velocity spikes, and proxy IP clustering emulate complex multi-hop money laundering topologies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
