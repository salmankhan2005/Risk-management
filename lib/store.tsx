'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { createClerkSupabaseClient, getPublicSupabaseClient } from './supabase/clerk-client';
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
  workspaceReady: boolean;
  workspaceSyncStatus: WorkspaceSyncStatus;
  workspaceError: string;
  workspaceConfigurationMissing: boolean;
  retryWorkspaceSync: () => void;
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

type WorkspaceSyncStatus = 'loading' | 'ready' | 'local' | 'saving' | 'saved' | 'error';

interface PersistedWorkspace {
  cases: Case[];
  alerts: Alert[];
  rules: RiskRule[];
  auditEvents: AuditEvent[];
  metadata: DatasetMetadata;
  currentRole: UserRole;
}

const RiskWatchContext = createContext<RiskWatchContextType | undefined>(undefined);

const STORAGE_KEY = 'riskwatch_state_v1';
const DEFAULT_ROLE: UserRole = 'Operations Analyst';
const VALID_ROLES: UserRole[] = [
  'Operations Analyst',
  'Risk/Compliance Reviewer',
  'System Administrator',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPersistedWorkspace(value: unknown): value is PersistedWorkspace {
  return (
    isRecord(value) &&
    Array.isArray(value.cases) &&
    Array.isArray(value.alerts) &&
    Array.isArray(value.rules) &&
    Array.isArray(value.auditEvents) &&
    isRecord(value.metadata) &&
    typeof value.currentRole === 'string' &&
    VALID_ROLES.includes(value.currentRole as UserRole)
  );
}

export function RiskWatchProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [metadata, setMetadata] = useState<DatasetMetadata>(INITIAL_METADATA);
  const currentUser =
    user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Neha Sen';
  const [currentRole, setCurrentRoleState] = useState<UserRole>(DEFAULT_ROLE);
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
  const [loadedWorkspaceId, setLoadedWorkspaceId] = useState<string | null>('demo');
  const [loadedWorkspaceAttempt, setLoadedWorkspaceAttempt] = useState(0);
  const [workspaceSyncStatus, setWorkspaceSyncStatus] =
    useState<WorkspaceSyncStatus>('local');
  const [workspaceError, setWorkspaceError] = useState('');
  const [workspaceConfigurationMissing, setWorkspaceConfigurationMissing] =
    useState(false);
  const [workspacePersistenceAvailable, setWorkspacePersistenceAvailable] =
    useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const signedInUserId = userId || null;
  const signedInUserIdRef = useRef(signedInUserId);
  signedInUserIdRef.current = signedInUserId;
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    // Fallback: if Clerk hasn't loaded in 800ms, treat as unauthenticated demo mode
    const timer = setTimeout(() => {
      setAuthTimeout(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const authReady = isLoaded || authTimeout;
  const workspaceId = signedInUserId ?? 'demo';
  // Demo mode is instantly ready; signed-in mode waits for Supabase load completion
  const workspaceReady =
    (!signedInUserId && loadedWorkspaceId === 'demo') ||
    (authReady &&
      loadedWorkspaceId === workspaceId &&
      loadedWorkspaceAttempt === loadAttempt);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    let active = true;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    if (!signedInUserId) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (isRecord(parsed)) {
            if (Array.isArray(parsed.alerts)) setAlerts(parsed.alerts as Alert[]);
            if (Array.isArray(parsed.cases)) setCases(parsed.cases as Case[]);
            if (Array.isArray(parsed.rules)) setRules(parsed.rules as RiskRule[]);
            if (Array.isArray(parsed.auditEvents)) {
              setAuditEvents(parsed.auditEvents as AuditEvent[]);
            }
            if (isRecord(parsed.metadata)) {
              setMetadata(parsed.metadata as unknown as DatasetMetadata);
            }
            if (
              typeof parsed.currentRole === 'string' &&
              VALID_ROLES.includes(parsed.currentRole as UserRole)
            ) {
              setCurrentRoleState(parsed.currentRole as UserRole);
            }
          }
        }
        setWorkspacePersistenceAvailable(true);
        setWorkspaceSyncStatus('local');
      } catch (error) {
        console.error('Unable to load the local demo workspace.', error);
        setWorkspaceError('The local demo workspace could not be loaded or saved.');
        setWorkspaceSyncStatus('error');
      }
      setLoadedWorkspaceId('demo');
      setLoadedWorkspaceAttempt(loadAttempt);
      return () => {
        active = false;
      };
    }

    setLoadedWorkspaceId(null);
    setWorkspaceSyncStatus('loading');
    setWorkspaceError('');
    setWorkspaceConfigurationMissing(false);
    setWorkspacePersistenceAvailable(false);
    setMetadata(INITIAL_METADATA);
    setCurrentRoleState(DEFAULT_ROLE);
    setCustomers(INITIAL_CUSTOMERS);
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTransfers(INITIAL_TRANSFERS);
    setAlerts(INITIAL_ALERTS);
    setCases(INITIAL_CASES);
    setRules(INITIAL_RULES);
    setAuditEvents(INITIAL_AUDIT);
    setValidationChecks(INITIAL_VALIDATION_CHECKS);

    const supabase = createClerkSupabaseClient(() => getTokenRef.current());
    if (!supabase) {
      setWorkspaceConfigurationMissing(true);
      setWorkspaceSyncStatus('error');
      setLoadedWorkspaceId(signedInUserId);
      setLoadedWorkspaceAttempt(loadAttempt);
      return () => {
        active = false;
      };
    }
    const workspaceClient = supabase;

    async function loadWorkspace() {
      try {
        let res = await workspaceClient
          .from('user_workspace_state')
          .select('state')
          .eq('user_id', signedInUserId)
          .maybeSingle();

        // If error (e.g. JWT mismatch with Supabase), fallback to the public Supabase client
        if (res.error) {
          const publicClient = getPublicSupabaseClient();
          if (publicClient) {
            const fallbackRes = await publicClient
              .from('user_workspace_state')
              .select('state')
              .eq('user_id', signedInUserId)
              .maybeSingle();
            if (!fallbackRes.error) {
              res = fallbackRes;
            }
          }
        }

        if (!active) {
          return;
        }

        let savedState: unknown = res.data?.state;

        // If not in Supabase yet, check localStorage backup
        if (!savedState) {
          try {
            const localSaved = localStorage.getItem(`${STORAGE_KEY}_${signedInUserId}`);
            if (localSaved) {
              savedState = JSON.parse(localSaved);
            }
          } catch {}
        }

        if (savedState && isPersistedWorkspace(savedState)) {
          setCases(savedState.cases);
          setAlerts(savedState.alerts);
          setRules(savedState.rules);
          setAuditEvents(savedState.auditEvents);
          setMetadata(savedState.metadata);
          setCurrentRoleState(savedState.currentRole);
        }

        setWorkspacePersistenceAvailable(true);
        setWorkspaceConfigurationMissing(false);
        setWorkspaceSyncStatus('ready');
        setLoadedWorkspaceId(signedInUserId);
        setLoadedWorkspaceAttempt(loadAttempt);
      } catch (caughtError) {
        if (active) {
          console.error('Unable to load user workspace state.', caughtError);
          setWorkspacePersistenceAvailable(true);
          setWorkspaceSyncStatus('ready');
          setLoadedWorkspaceId(signedInUserId);
          setLoadedWorkspaceAttempt(loadAttempt);
        }
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, [authReady, isLoaded, userId, loadAttempt]);

  useEffect(
    () => () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    },
    [],
  );

  const retryWorkspaceSync = () => {
    if (workspacePersistenceAvailable) {
      setSaveAttempt((attempt) => attempt + 1);
    } else {
      setLoadAttempt((attempt) => attempt + 1);
    }
  };

  useEffect(() => {
    if (!workspaceReady || !workspacePersistenceAvailable) {
      return;
    }

    const state: PersistedWorkspace = {
      cases,
      alerts,
      rules,
      auditEvents,
      metadata,
      currentRole,
    };

    if (!signedInUserId) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setWorkspaceError('');
        setWorkspaceSyncStatus('local');
      } catch (error) {
        console.error('Unable to save the local demo workspace.', error);
        setWorkspaceError('The local demo workspace could not be saved.');
        setWorkspaceSyncStatus('error');
      }
      return;
    }

    const supabase = createClerkSupabaseClient(() => getTokenRef.current());
    if (!supabase) {
      setWorkspaceConfigurationMissing(true);
      setWorkspacePersistenceAvailable(false);
      setWorkspaceSyncStatus('error');
      return;
    }

    setWorkspaceSyncStatus('saving');
    setWorkspaceError('');
    const writeUserId = signedInUserId;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void (async () => {
        let saveRes = await supabase
          .from('user_workspace_state')
          .upsert(
            {
              user_id: signedInUserId,
              state,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );

        if (saveRes.error) {
          const publicClient = getPublicSupabaseClient();
          if (publicClient) {
            saveRes = await publicClient
              .from('user_workspace_state')
              .upsert(
                {
                  user_id: signedInUserId,
                  state,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
              );
          }
        }

        try {
          localStorage.setItem(`${STORAGE_KEY}_${signedInUserId}`, JSON.stringify(state));
        } catch {}

        if (signedInUserIdRef.current !== writeUserId) {
          return;
        }

        if (saveRes.error) {
          console.error('Unable to save user workspace to Supabase.', saveRes.error);
          setWorkspaceSyncStatus('local');
        } else {
          setWorkspaceError('');
          setWorkspaceSyncStatus('saved');
        }
      })();
    }, 350);
  }, [
    alerts,
    auditEvents,
    cases,
    currentRole,
    metadata,
    rules,
    signedInUserId,
    saveAttempt,
    workspacePersistenceAvailable,
    workspaceReady,
  ]);

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    logAuditEvent('ROLE_SWITCH', 'UserSession', currentUser, `Role: ${currentRole}`, `Role: ${role}`, 'Analyst demonstration role switch');
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
  };

  const updateAlert = (alertId: string, patch: Partial<Alert>) => {
    const updated = alerts.map((a) => (a.id === alertId ? { ...a, ...patch } : a));
    setAlerts(updated);
  };

  const updateCase = (caseId: string, patch: Partial<Case>) => {
    const updated = cases.map((c) => (c.id === caseId ? { ...c, ...patch } : c));
    setCases(updated);
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
  };

  const resetToDefaults = () => {
    if (!signedInUserId) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Unable to clear the local demo workspace.', error);
        setWorkspaceError('The local demo workspace could not be cleared.');
        setWorkspaceSyncStatus('error');
      }
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
    setCurrentRoleState(DEFAULT_ROLE);
  };

  return (
    <RiskWatchContext.Provider
      value={{
        metadata,
        currentUser,
        currentRole,
        workspaceReady,
        workspaceSyncStatus,
        workspaceError,
        workspaceConfigurationMissing,
        retryWorkspaceSync,
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
