'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Database,
  Globe,
  HardDrive,
  Key,
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Shield,
  ShieldCheck,
  Sliders,
  Terminal,
  UserCheck,
  Users,
} from 'lucide-react';
import { formatDate } from '@/lib/data';
import { useRiskWatch } from '@/lib/store';
import { UserRole } from '@/lib/types';

export default function SettingsPage() {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    metadata,
    resetToDefaults,
    logAuditEvent,
  } = useRiskWatch();

  const [activeTab, setActiveTab] = useState<'roles' | 'notifications' | 'retention' | 'api' | 'environment'>('roles');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notification toggles
  const [notifyCriticalAlerts, setNotifyCriticalAlerts] = useState(true);
  const [notifyCaseAssigned, setNotifyCaseAssigned] = useState(true);
  const [notifyReconFailures, setNotifyReconFailures] = useState(true);
  const [notifyValidationAnomalies, setNotifyValidationAnomalies] = useState(true);

  // API settings
  const [webhookUrl, setWebhookUrl] = useState('https://internal.riskwatch-relay.net/v1/events');
  const [apiKeyMasked] = useState('rw_demo_************************');

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    logAuditEvent(
      'SETTINGS_UPDATE',
      'SystemSettings',
      'NOTIFICATIONS',
      'Previous config',
      'Updated notification preferences',
      'User preference customization'
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetEnvironment = () => {
    if (confirm('Are you sure you want to restore RiskWatch to default baseline state? Any unsaved local overrides will be cleared.')) {
      resetToDefaults();
      alert('System reset to default baseline configuration (Seed 20261022).');
    }
  };

  return (
    <div className="app-page-wrapper">
      <div className="app-page-header">
        <div className="app-page-title-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-neutral">Platform Governance</span>
            <span className="badge badge-success">Enterprise Grade</span>
          </div>
          <h1>System Configuration & Governance Settings</h1>
          <p>
            Administrative control center for role-based access entitlements, automated alerts, retention baselines, and downstream API integrations.
          </p>
        </div>
      </div>

      {saveSuccess && (
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
          <span>Configuration preferences persisted and logged to immutable audit trail.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="app-tabs">
        <button
          type="button"
          className={`app-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <UserCheck size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Role Entitlements
        </button>
        <button
          type="button"
          className={`app-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Alert Notifications
        </button>
        <button
          type="button"
          className={`app-tab-btn ${activeTab === 'retention' ? 'active' : ''}`}
          onClick={() => setActiveTab('retention')}
        >
          <HardDrive size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Retention & Ledger Policy
        </button>
        <button
          type="button"
          className={`app-tab-btn ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <Server size={14} style={{ display: 'inline', marginRight: '6px' }} />
          API & Core Webhooks
        </button>
        <button
          type="button"
          className={`app-tab-btn ${activeTab === 'environment' ? 'active' : ''}`}
          onClick={() => setActiveTab('environment')}
        >
          <Terminal size={14} style={{ display: 'inline', marginRight: '6px' }} />
          Seed & Diagnostics
        </button>
      </div>

      {/* TAB 1: Roles */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="app-card">
            <div className="app-card-header">
              <div>
                <h3 className="app-card-title">Active User Session & Entitlement Context</h3>
                <p className="app-card-subtitle">
                  Currently operating as <strong>{currentUser}</strong> with active role <strong>{currentRole}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {(
                [
                  {
                    role: 'Operations Analyst',
                    badge: 'Front-Line Triage',
                    description: 'Optimized for high-throughput alert triage, transaction inspection, customer dossier lookups, and preliminary case assignment.',
                    capabilities: [
                      'Review and triage real-time alerts',
                      'Initiate and annotate investigation cases',
                      'Examine transaction ledgers and customer KYC',
                      'Simulate rule thresholds in sandbox mode',
                    ],
                  },
                  {
                    role: 'Risk/Compliance Reviewer',
                    badge: 'Compliance & Governance',
                    description: 'Authorized for formal case dispositioning (Suspicious Activity / Legitimate), regulatory reporting, and validation oversight.',
                    capabilities: [
                      'Formally submit Suspicious Activity (SAR) dispositions',
                      'Approve high-risk transaction restrictions',
                      'Export compliance audit packets & regulatory filings',
                      'Verify Ground Truth isolation anomalies',
                    ],
                  },
                  {
                    role: 'System Administrator',
                    badge: 'Full Platform Authority',
                    description: 'Comprehensive administrative oversight including rule logic modification, PRNG dataset regeneration, and system telemetry.',
                    capabilities: [
                      'Commit live rule thresholds to production engine',
                      'Regenerate synthetic corpus with arbitrary PRNG seeds',
                      'Manage webhook endpoints & security keys',
                      'Access raw audit logs and cryptographic proofs',
                    ],
                  },
                ] as const
              ).map((item) => {
                const isSelected = currentRole === item.role;
                return (
                  <div
                    key={item.role}
                    style={{
                      border: isSelected ? '2px solid #AD7048' : '1px solid #E8E3D9',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(173, 112, 72, 0.04)' : '#FAF7F0',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{item.badge}</span>
                        {isSelected && <span className="badge badge-success">ACTIVE ROLE</span>}
                      </div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '10px 0 6px 0', color: '#10110F' }}>
                        {item.role}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6F6A60', lineHeight: 1.5, margin: 0 }}>
                        {item.description}
                      </p>
                      <div style={{ marginTop: '14px', borderTop: '1px solid #E8E3D9', paddingTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#4A463E', marginBottom: '6px' }}>
                          Key Permissions:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.5px', color: '#4A463E', lineHeight: 1.6 }}>
                          {item.capabilities.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={isSelected ? 'btn-secondary' : 'btn-primary'}
                      onClick={() => handleRoleChange(item.role)}
                      style={{ marginTop: '16px', width: '100%' }}
                      disabled={isSelected}
                    >
                      {isSelected ? 'Current Active Role' : `Switch to ${item.role}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Notifications */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="app-card">
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Real-Time Operational Notification Thresholds</h3>
              <p className="app-card-subtitle">
                Configure event alerts routed to analyst inboxes, SOC dashboards, and notification hubs
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                id: 'critical-alerts',
                title: 'Critical Severity Alerts',
                description: 'Instantly notify when an alert with risk score >= 80 or Critical priority is synthesized.',
                checked: notifyCriticalAlerts,
                onChange: setNotifyCriticalAlerts,
              },
              {
                id: 'case-assigned',
                title: 'Case Assignment & Status Escalations',
                description: 'Broadcast notifications when a case is assigned to current analyst or escalated to compliance review.',
                checked: notifyCaseAssigned,
                onChange: setNotifyCaseAssigned,
              },
              {
                id: 'recon-failures',
                title: 'Reconciliation Leg Discrepancy Alerts',
                description: 'Immediate alert when debit and credit transfer legs fail mathematical reconciliation.',
                checked: notifyReconFailures,
                onChange: setNotifyReconFailures,
              },
              {
                id: 'validation-anomalies',
                title: 'Ground Truth & Validation Lab Breaches',
                description: 'Notify engineering leads if automated validation checks detect unplanned ledger deviations.',
                checked: notifyValidationAnomalies,
                onChange: setNotifyValidationAnomalies,
              },
            ].map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#FAF7F0',
                  borderRadius: '6px',
                  border: '1px solid #E8E3D9',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#10110F' }}>{item.title}</div>
                  <div style={{ fontSize: '11.5px', color: '#6F6A60', marginTop: '2px' }}>{item.description}</div>
                </div>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => item.onChange(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#AD7048', cursor: 'pointer' }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="submit" className="btn-primary">
                <Save size={13} /> Save Notification Preferences
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: Retention Policy */}
      {activeTab === 'retention' && (
        <div className="app-card">
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Data Retention & Ledger Archival Policy</h3>
              <p className="app-card-subtitle">
                Regulatory compliance adherence with statutory banking retention policies
              </p>
            </div>
            <span className="badge badge-success">Compliant</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', background: '#FAF7F0', borderRadius: '6px', border: '1px solid #E8E3D9' }}>
              <div style={{ fontSize: '11px', color: '#6F6A60', textTransform: 'uppercase' }}>Financial Transactions</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10110F', marginTop: '4px' }}>7 Years Statutory</div>
              <p style={{ fontSize: '11.5px', color: '#6F6A60', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                Fully indexed in high-density columnar store with immutable cryptographic hash chaining.
              </p>
            </div>
            <div style={{ padding: '14px', background: '#FAF7F0', borderRadius: '6px', border: '1px solid #E8E3D9' }}>
              <div style={{ fontSize: '11px', color: '#6F6A60', textTransform: 'uppercase' }}>Investigation Dossiers & SARs</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10110F', marginTop: '4px' }}>10 Years Retained</div>
              <p style={{ fontSize: '11.5px', color: '#6F6A60', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                All case histories, analyst notes, and disposition artifacts preserved in WORM storage.
              </p>
            </div>
            <div style={{ padding: '14px', background: '#FAF7F0', borderRadius: '6px', border: '1px solid #E8E3D9' }}>
              <div style={{ fontSize: '11px', color: '#6F6A60', textTransform: 'uppercase' }}>Audit Event Log</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10110F', marginTop: '4px' }}>Indefinite / Permanent</div>
              <p style={{ fontSize: '11.5px', color: '#6F6A60', margin: '6px 0 0 0', lineHeight: 1.5 }}>
                Append-only forensic event log. Modification or truncation physically disallowed by schema.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: API & Webhooks */}
      {activeTab === 'api' && (
        <div className="app-card">
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Integration Endpoints & Downstream Webhooks</h3>
              <p className="app-card-subtitle">
                Core banking relays and real-time event streaming interfaces
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row">
              <label className="form-label">Active API Key (Read / Write)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={apiKeyMasked}
                  readOnly
                  style={{ fontFamily: 'monospace', background: '#FAF7F0' }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => alert('API Key copied to clipboard')}
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">Alert Webhook Dispatch URL</label>
              <input
                type="text"
                className="form-input"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                style={{ fontFamily: 'monospace' }}
              />
              <div style={{ fontSize: '11px', color: '#6F6A60', marginTop: '4px' }}>
                Delivers signed JSON webhooks with HMAC-SHA256 headers upon alert generation.
              </div>
            </div>

            <div style={{ borderTop: '1px solid #E8E3D9', paddingTop: '14px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Active Bridge Connectors</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '10px', background: '#FAF7F0', borderRadius: '4px', border: '1px solid #E8E3D9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>Core Banking Switch</div>
                    <div style={{ fontSize: '10.5px', color: '#6F6A60' }}>Latency: 14ms · Protocol: ISO 8583</div>
                  </div>
                  <span className="badge badge-success">CONNECTED</span>
                </div>
                <div style={{ padding: '10px', background: '#FAF7F0', borderRadius: '4px', border: '1px solid #E8E3D9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>Sanctions & PEP Screener</div>
                    <div style={{ fontSize: '10.5px', color: '#6F6A60' }}>OFAC / UN / FIU-IND Feed</div>
                  </div>
                  <span className="badge badge-success">SYNCED</span>
                </div>
                <div style={{ padding: '10px', background: '#FAF7F0', borderRadius: '4px', border: '1px solid #E8E3D9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12px' }}>SAR Filing Gateway</div>
                    <div style={{ fontSize: '10.5px', color: '#6F6A60' }}>FinCEN / FIU XML Gateway</div>
                  </div>
                  <span className="badge badge-success">READY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Seed & Environment */}
      {activeTab === 'environment' && (
        <div className="app-card">
          <div className="app-card-header">
            <div>
              <h3 className="app-card-title">Deterministic Seed & Platform Diagnostics</h3>
              <p className="app-card-subtitle">
                System state reset and pseudorandom baseline parameters
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', background: '#FAF7F0', borderRadius: '4px', border: '1px solid #E8E3D9' }}>
                <div style={{ fontSize: '11px', color: '#6F6A60' }}>Engine Version</div>
                <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{metadata.generatorVersion}</div>
              </div>
              <div style={{ padding: '12px', background: '#FAF7F0', borderRadius: '4px', border: '1px solid #E8E3D9' }}>
                <div style={{ fontSize: '11px', color: '#6F6A60' }}>Active Seed</div>
                <div style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'monospace', color: '#AD7048', marginTop: '2px' }}>
                  {metadata.seed}
                </div>
              </div>
              <div style={{ padding: '12px', background: '#FAF7F0', borderRadius: '4px', border: '1px solid #E8E3D9' }}>
                <div style={{ fontSize: '11px', color: '#6F6A60' }}>Run Identifier</div>
                <div style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'monospace', marginTop: '2px' }}>
                  {metadata.runIdentifier}
                </div>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #D94C42',
                borderRadius: '6px',
                padding: '16px',
                background: 'rgba(217, 76, 66, 0.04)',
                marginTop: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertTriangle size={16} color="#D94C42" />
                <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#D94C42', margin: 0 }}>
                  Danger Zone: Reset Local State & Clear Browser Cache
                </h4>
              </div>
              <p style={{ fontSize: '12px', color: '#4A463E', margin: '4px 0 12px 0', lineHeight: 1.5 }}>
                Resetting will restore the application to initial factory specifications (Seed: 20261022). All local case triage notes, simulator modifications, and audit sessions will be cleared.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleResetEnvironment}
                style={{ background: '#D94C42', borderColor: '#D94C42' }}
              >
                <RotateCcw size={13} /> Reset Entire Application to Factory Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
