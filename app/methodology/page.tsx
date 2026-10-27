'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Cpu,
  FileCode,
  Layers,
  Scale,
  Shield,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { INITIAL_RULES } from '@/lib/data';

export default function MethodologyPage() {
  return (
    <div className="site-shell" style={{ background: '#F3EEE4', minHeight: '100vh', color: '#171713' }}>
      {/* Header */}
      <header className="site-header" style={{ borderBottom: '1px solid #D9D1C4' }}>
        <div className="header-inner">
          <Link className="brand" href="/">
            <span className="brand-symbol"><Shield strokeWidth={1.65} /></span>
            <span className="brand-wording">
              <span className="brand-name">RiskWatch</span>
              <span className="brand-subtitle">Financial Risk Intelligence</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" className="btn-secondary" style={{ fontSize: '11.5px' }}>
              <ArrowLeft size={14} /> Back to Home
            </Link>
            <Link href="/app/overview" className="button button-dark" style={{ minHeight: '38px', padding: '0 16px', fontSize: '12px' }}>
              Launch Workspace <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-gutter" style={{ paddingBottom: '80px', paddingTop: '48px', maxWidth: '1120px', margin: '0 auto' }}>
        {/* Title Block */}
        <div style={{ marginBottom: '40px' }}>
          <p className="section-eyebrow" style={{ color: '#AD7048', fontWeight: 800 }}>DETERMINISTIC EVALUATION ENGINE</p>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: '48px', fontWeight: 600, letterSpacing: '-0.04em', margin: '12px 0 16px', lineHeight: 1.05 }}>
            Risk Methodology & <em>Scoring Framework.</em>
          </h1>
          <p style={{ color: '#6F6A60', fontSize: '16px', maxWidth: '780px', lineHeight: 1.6 }}>
            RiskWatch replaces black-box probabilistic guesswork with deterministic rules, transparent scoring weights,
            and complete evidence traceability. Every flagged transaction, alert, and case references verifiable observed metrics against configured thresholds.
          </p>
        </div>

        {/* 3 Core Mathematical Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '48px' }}>
          <div className="app-card" style={{ padding: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(173, 112, 72, 0.12)', display: 'grid', placeItems: 'center', color: '#AD7048', marginBottom: '16px' }}>
              <Calculator size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Additive Risk Calibration</h3>
            <p style={{ color: '#6F6A60', fontSize: '12.5px', lineHeight: 1.6, margin: 0 }}>
              Base risk scores are composed additively: <code>Score = min(100, Σ (Rule_i · Weight_i · Multiplier_i))</code>.
              No transaction receives an arbitrary score without at least one explicit contributing rule trigger.
            </p>
          </div>

          <div className="app-card" style={{ padding: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(199, 161, 107, 0.15)', display: 'grid', placeItems: 'center', color: '#C7A16B', marginBottom: '16px' }}>
              <Scale size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Observed vs Configured Thresholds</h3>
            <p style={{ color: '#6F6A60', fontSize: '12.5px', lineHeight: 1.6, margin: 0 }}>
              Every evaluation logs both the configured threshold parameter (e.g. <code>max_velocity = 4</code>) and the actual observed metric
              (e.g. <code>observed_velocity = 5</code>), creating an immutable evidentiary audit trail.
            </p>
          </div>

          <div className="app-card" style={{ padding: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(117, 133, 107, 0.15)', display: 'grid', placeItems: 'center', color: '#75856B', marginBottom: '16px' }}>
              <CheckCircle2 size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Traceable Versioning</h3>
            <p style={{ color: '#6F6A60', fontSize: '12.5px', lineHeight: 1.6, margin: 0 }}>
              Rules are versioned (e.g. v1.4.0). Historical evaluations preserve the exact rule logic active at transaction time,
              preventing historical recalculation or retrospective bias.
            </p>
          </div>
        </div>

        {/* The 6 Core Rules in Detail */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '20px' }}>
            The 6 Transparent Risk Rules
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {INITIAL_RULES.map((rule) => (
              <div key={rule.id} className="app-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-neutral">{rule.id}</span>
                    <strong style={{ fontSize: '15px', color: '#171713' }}>{rule.name}</strong>
                    <span className={`badge ${rule.severityMapping === 'Critical' ? 'badge-critical' : rule.severityMapping === 'High' ? 'badge-high' : 'badge-medium'}`}>
                      {rule.severityMapping} Severity
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: '#6F6A60' }}>
                    <span>Category: <strong>{rule.category}</strong></span>
                    <span>Version: <strong>{rule.version}</strong></span>
                    <span>Contribution: <strong style={{ color: '#AD7048' }}>+{rule.scoreContribution} pts</strong></span>
                  </div>
                </div>

                <p style={{ color: '#6F6A60', fontSize: '13px', margin: '0 0 12px', lineHeight: 1.5 }}>
                  {rule.description}
                </p>

                <div style={{ background: '#191B18', color: '#F3EEE4', padding: '10px 14px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Logic: <code>{rule.logicExpression}</code></span>
                  <span style={{ color: '#C7A16B' }}>Threshold: {rule.thresholdValue} {rule.thresholdUnit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA to Interactive Simulator */}
        <div className="dataset-info-strip" style={{ padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', color: '#F3EEE4', fontFamily: 'var(--display)' }}>
              Test Rules in the Interactive Simulator
            </h3>
            <p style={{ margin: 0, color: '#A8A197', fontSize: '12.5px' }}>
              Adjust parameters in real-time, preview transaction trigger rates, and assess precision/recall impact.
            </p>
          </div>
          <Link href="/app/rules" className="btn-primary" style={{ background: '#C7A16B', color: '#10110F', border: 0 }}>
            Open Rule Simulator <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    </div>
  );
}
