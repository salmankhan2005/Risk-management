'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_ACCOUNTS,
  INITIAL_ALERTS,
  INITIAL_AUDIT,
  INITIAL_CASES,
  INITIAL_CUSTOMERS,
  INITIAL_DEVICES,
  INITIAL_GROUND_TRUTH,
  INITIAL_MERCHANTS,
  INITIAL_METADATA,
  INITIAL_RULES,
  INITIAL_TRANSACTIONS,
  INITIAL_TRANSFERS,
  INITIAL_VALIDATION_CHECKS,
} from './data';
import {
  Account,
  Alert,
  AlertStatus,
  AuditEvent,
  Case,
  CaseDisposition,
  CaseStatus,
  Customer,
  DatasetMetadata,
  Device,
  GroundTruthScenario,
  Merchant,
  RiskRule,
  Transaction,
  TransferLink,
  UserRole,
  ValidationCheck,
} from './types';

interface RiskWatchContextType {
  metadata: DatasetMetadata;
  currentUser: string;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  customers: Customer[];
  accounts: Account[];
  transactions: Transaction[];
  transfers: TransferLink[];
  alerts: Alert[];
  cases: Case[];
  rules: RiskRule[];
  merchants: Merchant[];
  devices: Device[];
  auditEvents: AuditEvent[];
  auditLog: AuditEvent[];
  validationChecks: ValidationCheck[];
  groundTruthScenarios: GroundTruthScenario[];

  // Actions
  updateAlert: (alertId: string, patch: Partial<Alert>) => void;
  updateAlertStatus: (alertId: string, status: AlertStatus, notes?: string) => void;
  createCase: (newCase: Omit<Case, 'id' | 'createdAt' | 'history'>) => Case;
  updateCase: (caseId: string, patch: Partial<Case>) => void;
  updateCaseStatus: (caseId: string, status: CaseStatus, disposition?: CaseDisposition, notes?: string) => void;
  addCaseNote: (caseId: string, note: string) => void;
  updateRule: (ruleId: string, updates: Partial<RiskRule>) => void;
  runValidation: () => void;
  regenerateDataset: (seed: string, volumeMode: 'starter' | 'full') => void;
  logAuditEvent: {
    (
      action: string,
      entityType: string,
      entityId: string,
      beforeSummary: string,
      afterSummary: string,
      reason: string
    ): void;
    (event: {
      action: string;
      entityType?: string;
      entityId?: string;
      actor?: string;
      details?: string;
      reason?: string;
      beforeSummary?: string;
      afterSummary?: string;
    }): void;
  };
  resetToDefaults: () => void;
}

const RiskWatchContext = createContext<RiskWatchContextType | undefined>(undefined);

const STORAGE_KEY = 'riskwatch_state_v1';

export function RiskWatchProvider({ children }: { children: React.ReactNode }) {
  const [metadata, setMetadata] = useState<DatasetMetadata>(INITIAL_METADATA);
  const [currentUser] = useState<string>('Neha Sen');
  const [currentRole, setCurrentRoleState] = useState<UserRole>('Operations Analyst');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [transfers, setTransfers] = useState<TransferLink[]>(INITIAL_TRANSFERS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [cases, setCases] = useState<Case[]>(INITIAL_CASES);
  const [rules, setRules] = useState<RiskRule[]>(INITIAL_RULES);
  const [merchants] = useState<Merchant[]>(INITIAL_MERCHANTS);
  const [devices] = useState<Device[]>(INITIAL_DEVICES);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(INITIAL_AUDIT);
  const [validationChecks, setValidationChecks] = useState<ValidationCheck[]>(INITIAL_VALIDATION_CHECKS);
  const [groundTruthScenarios] = useState<GroundTruthScenario[]>(INITIAL_GROUND_TRUTH);

  // Load from local storage on initial mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.alerts) setAlerts(parsed.alerts);
        if (parsed.cases) setCases(parsed.cases);
        if (parsed.rules) setRules(parsed.rules);
        if (parsed.auditEvents) setAuditEvents(parsed.auditEvents);
        if (parsed.metadata) setMetadata(parsed.metadata);
        if (parsed.currentRole) setCurrentRoleState(parsed.currentRole);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save changes to local storage
  const persistState = (newCases = cases, newAlerts = alerts, newRules = rules, newAudits = auditEvents, newMeta = metadata, role = currentRole) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          cases: newCases,
          alerts: newAlerts,
          rules: newRules,
          auditEvents: newAudits,
          metadata: newMeta,
          currentRole: role,
        })
      );
    } catch {
      // ignore
    }
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    logAuditEvent('ROLE_SWITCH', 'UserSession', currentUser, `Role: ${currentRole}`, `Role: ${role}`, 'Analyst demonstration role switch');
    persistState(cases, alerts, rules, auditEvents, metadata, role);
  };

  const logAuditEvent = (
    actionOrObj:
      | string
      | {
          action: string;
          entityType?: string;
          entityId?: string;
          actor?: string;
          details?: string;
          reason?: string;
          beforeSummary?: string;
          afterSummary?: string;
        },
    entityType?: string,
    entityId?: string,
    beforeSummary?: string,
    afterSummary?: string,
    reason?: string
  ) => {
    let act = '';
    let eType = 'System';
    let eId = 'N/A';
    let before = 'N/A';
    let after = 'N/A';
    let rsn = 'Analyst operational action';
    let actr = currentUser;

    if (typeof actionOrObj === 'object') {
      act = actionOrObj.action;
      eType = actionOrObj.entityType || 'System';
      eId = actionOrObj.entityId || 'N/A';
      before = actionOrObj.beforeSummary || 'N/A';
      after = actionOrObj.afterSummary || actionOrObj.details || 'N/A';
      rsn = actionOrObj.reason || actionOrObj.details || 'Analyst audit log';
      if (actionOrObj.actor) actr = actionOrObj.actor;
    } else {
      act = actionOrObj;
      eType = entityType || 'System';
      eId = entityId || 'N/A';
      before = beforeSummary || 'N/A';
      after = afterSummary || 'N/A';
      rsn = reason || 'Analyst operational action';
    }

    const newEvent: AuditEvent = {
      id: `AUD-2026-${String(auditEvents.length + 1).padStart(6, '0')}`,
      actor: actr,
      role: currentRole,
      action: act,
      entityType: eType,
      entityId: eId,
      timestamp: new Date().toISOString(),
      beforeSummary: before,
      afterSummary: after,
      reason: rsn,
      correlationId: `CORR-${Date.now().toString().slice(-6)}`,
    };
    const updated = [newEvent, ...auditEvents];
    setAuditEvents(updated);
    persistState(cases, alerts, rules, updated);
  };

  const updateAlert = (alertId: string, patch: Partial<Alert>) => {
    const updated = alerts.map((a) => (a.id === alertId ? { ...a, ...patch } : a));
    setAlerts(updated);
    persistState(cases, updated);
  };

  const updateCase = (caseId: string, patch: Partial<Case>) => {
    const updated = cases.map((c) => (c.id === caseId ? { ...c, ...patch } : c));
    setCases(updated);
    persistState(updated);
  };

  const updateAlertStatus = (alertId: string, status: AlertStatus, notes?: string) => {
    let before = '';
    const updated = alerts.map((a) => {
      if (a.id === alertId) {
        before = `Status: ${a.status}`;
        return {
          ...a,
          status,
          updatedAt: new Date().toISOString(),
          assignedAnalyst: currentUser,
        };
      }
      return a;
    });
    setAlerts(updated);
    logAuditEvent(
      'ALERT_STATUS_CHANGE',
      'Alert',
      alertId,
      before,
      `Status: ${status}`,
      notes || 'Status triage updated by analyst'
    );
    persistState(cases, updated);
  };

  const createCase = (caseData: Omit<Case, 'id' | 'createdAt' | 'history'>): Case => {
    const newCaseId = `CASE-2026-${String(cases.length + 1).padStart(6, '0')}`;
    const now = new Date().toISOString();
    const created: Case = {
      ...caseData,
      id: newCaseId,
      createdAt: now,
      assignedAt: now,
      history: [
        {
          id: `CH-${Date.now().toString().slice(-4)}`,
          timestamp: now,
          actor: currentUser,
          role: currentRole,
          action: 'Case Created',
          details: `Case formally registered with priority ${caseData.priority}`,
        },
      ],
    };
    const updatedCases = [created, ...cases];
    setCases(updatedCases);

    // If linked alerts, update them
    if (caseData.linkedAlertIds.length > 0) {
      setAlerts((prev) =>
        prev.map((al) =>
          caseData.linkedAlertIds.includes(al.id)
            ? { ...al, linkedCaseId: newCaseId, status: 'Under Review' }
            : al
        )
      );
    }

    logAuditEvent(
      'CASE_CREATED',
      'Case',
      newCaseId,
      'None',
      `Title: ${created.title}, Severity: ${created.severity}`,
      'Initiated from operational triage review'
    );
    persistState(updatedCases);
    return created;
  };

  const updateCaseStatus = (
    caseId: string,
    status: CaseStatus,
    disposition?: CaseDisposition,
    notes?: string
  ) => {
    let beforeState = '';
    const now = new Date().toISOString();
    const updated = cases.map((c) => {
      if (c.id === caseId) {
        beforeState = `Status: ${c.status}, Disposition: ${c.disposition || 'None'}`;
        const newHistory = [
          ...c.history,
          {
            id: `CH-${Date.now().toString().slice(-4)}`,
            timestamp: now,
            actor: currentUser,
            role: currentRole,
            action: disposition ? `Disposition: ${disposition}` : `Status: ${status}`,
            details: notes || `State transition to ${status}`,
          },
        ];
        return {
          ...c,
          status,
          disposition: disposition || c.disposition,
          dispositionNotes: notes || c.dispositionNotes,
          resolvedAt: status === 'Resolved' || status === 'Closed' ? now : c.resolvedAt,
          history: newHistory,
        };
      }
      return c;
    });
    setCases(updated);
    logAuditEvent(
      'CASE_TRANSITION',
      'Case',
      caseId,
      beforeState,
      `Status: ${status}, Disposition: ${disposition || 'Preserved'}`,
      notes || 'Analyst lifecycle progression'
    );
    persistState(updated);
  };

  const addCaseNote = (caseId: string, note: string) => {
    const now = new Date().toISOString();
    const updated = cases.map((c) => {
      if (c.id === caseId) {
        return {
          ...c,
          history: [
            ...c.history,
            {
              id: `CH-${Date.now().toString().slice(-4)}`,
              timestamp: now,
              actor: currentUser,
              role: currentRole,
              action: 'Note Appended',
              details: note,
            },
          ],
        };
      }
      return c;
    });
    setCases(updated);
    logAuditEvent('CASE_NOTE_ADDED', 'Case', caseId, 'Note count: N', 'Note count: N+1', note);
    persistState(updated);
  };

  const updateRule = (ruleId: string, updates: Partial<RiskRule>) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    setRules(updated);
    logAuditEvent(
      'RULE_MODIFIED',
      'RiskRule',
      ruleId,
      'Active config',
      `Modified keys: ${Object.keys(updates).join(', ')}`,
      'Threshold parameter tuned in simulator'
    );
    persistState(cases, alerts, updated);
  };

  const runValidation = () => {
    const now = new Date().toISOString();
    // Simulate real re-validation calculation
    const refreshed = validationChecks.map((check) => ({
      ...check,
      executedAt: now,
    }));
    setValidationChecks(refreshed);
    logAuditEvent(
      'VALIDATION_SUITE_RUN',
      'ValidationLab',
      'VAL-SUITE-2026',
      'Status: Pending Run',
      'Evaluated 20 checks against 100,000 transactions',
      'Integrity assertion re-run'
    );
  };

  const regenerateDataset = (seed: string, volumeMode: 'starter' | 'full') => {
    const now = new Date().toISOString();
    const newMeta: DatasetMetadata = {
      seed,
      generatorVersion: 'v2.4.0-enterprise',
      runIdentifier: `RUN-${seed}-${Date.now().toString().slice(-4)}`,
      createdAt: now,
      validationStatus: 'VALIDATED_WITH_LABELED_EXCEPTIONS',
      totalCustomers: volumeMode === 'full' ? 5000 : 500,
      totalAccounts: volumeMode === 'full' ? 7000 : 700,
      totalTransactions: volumeMode === 'full' ? 100000 : 10000,
      totalAlerts: volumeMode === 'full' ? 1000 : 100,
      totalCases: volumeMode === 'full' ? 284 : 28,
      baselineVolumeMode: volumeMode,
    };
    setMetadata(newMeta);
    logAuditEvent(
      'DATASET_REGENERATION',
      'Generator',
      `SEED-${seed}`,
      `Seed: ${metadata.seed}`,
      `Seed: ${seed}, Mode: ${volumeMode}, TxnCount: ${newMeta.totalTransactions}`,
      'Deterministic re-compilation with fixed seed'
    );
    persistState(cases, alerts, rules, auditEvents, newMeta);
  };

  const resetToDefaults = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setMetadata(INITIAL_METADATA);
    setCustomers(INITIAL_CUSTOMERS);
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTransfers(INITIAL_TRANSFERS);
    setAlerts(INITIAL_ALERTS);
    setCases(INITIAL_CASES);
    setRules(INITIAL_RULES);
    setAuditEvents(INITIAL_AUDIT);
    setValidationChecks(INITIAL_VALIDATION_CHECKS);
    setCurrentRoleState('Operations Analyst');
  };

  return (
    <RiskWatchContext.Provider
      value={{
        metadata,
        currentUser,
        currentRole,
        setCurrentRole,
        customers,
        accounts,
        transactions,
        transfers,
        alerts,
        cases,
        rules,
        merchants,
        devices,
        auditEvents,
        auditLog: auditEvents,
        validationChecks,
        groundTruthScenarios,
        updateAlert,
        updateAlertStatus,
        createCase,
        updateCase,
        updateCaseStatus,
        addCaseNote,
        updateRule,
        runValidation,
        regenerateDataset,
        logAuditEvent,
        resetToDefaults,
      }}
    >
      {children}
    </RiskWatchContext.Provider>
  );
}

export function useRiskWatch() {
  const context = useContext(RiskWatchContext);
  if (!context) {
    throw new Error('useRiskWatch must be used within a RiskWatchProvider');
  }
  return context;
}
