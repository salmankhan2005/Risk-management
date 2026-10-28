import { api } from './client';
import {
  AccountDTO,
  AlertDTO,
  AuditEventDTO,
  CaseDTO,
  CustomerDTO,
  DashboardSummaryDTO,
  GenerationJobDTO,
  RiskRuleDTO,
  RiskRuleVersionDTO,
  TransactionDTO,
  ValidationRunDTO,
} from '@/packages/contracts/src';

export const RiskWatchApi = {
  // Auth
  me: () => api.get<{ userId: string; displayName: string; roles: string[]; permissions: string[] }>('/me'),

  // Dashboard
  getDashboardSummary: (timeWindow: string = '7d') =>
    api.get<DashboardSummaryDTO>('/dashboard/summary', { timeWindow }),

  // Customers & Accounts
  getCustomers: (params?: Record<string, unknown>) => api.get<CustomerDTO[]>('/customers', params),
  getCustomer: (id: string) => api.get<CustomerDTO>(`/customers/${id}`),
  getAccounts: (params?: Record<string, unknown>) => api.get<AccountDTO[]>('/accounts', params),
  getAccount: (id: string) => api.get<AccountDTO>(`/accounts/${id}`),

  // Transactions
  getTransactions: (params?: Record<string, unknown>) => api.get<TransactionDTO[]>('/transactions', params),
  getTransaction: (id: string) => api.get<TransactionDTO>(`/transactions/${id}`),

  // Alerts
  getAlerts: (params?: Record<string, unknown>) => api.get<AlertDTO[]>('/alerts', params),
  getAlert: (id: string) => api.get<AlertDTO>(`/alerts/${id}`),

  // Cases
  getCases: (params?: Record<string, unknown>) => api.get<CaseDTO[]>('/cases', params),
  getCase: (id: string) => api.get<CaseDTO>(`/cases/${id}`),
  recordDisposition: (
    caseId: string,
    payload: { disposition: string; notes: string; expectedVersion: number }
  ) => api.post<CaseDTO>(`/cases/${caseId}/disposition`, payload),
  assignCase: (caseId: string, payload: { assignedToId: string | null; expectedVersion: number }) =>
    api.post<CaseDTO>(`/cases/${caseId}/assign`, payload),

  // Rules
  getRules: () => api.get<RiskRuleDTO[]>('/rules'),
  getRuleVersions: (ruleId: string) => api.get<RiskRuleVersionDTO[]>(`/rules/${ruleId}/versions`),
  simulateRule: (ruleId: string, payload: { draftConfig: Record<string, unknown>; timeWindowDays?: number }) =>
    api.post<{ triggerCount: number; sampleMatches: unknown[] }>(`/rules/${ruleId}/simulations`, payload),

  // Generation & Validation Jobs
  createGenerationJob: (payload: { seed?: string; targetCustomers?: number; targetTransactions?: number }) =>
    api.post<GenerationJobDTO>('/jobs/generation', payload),
  getJobStatus: (id: string) => api.get<GenerationJobDTO>(`/jobs/${id}`),
  createValidationRun: (payload?: { jobId?: string; datasetSeed?: string }) =>
    api.post<ValidationRunDTO>('/validation-runs', payload),
  getValidationRun: (id: string) => api.get<ValidationRunDTO>(`/validation-runs/${id}`),

  // Audit
  getAuditEvents: (params?: Record<string, unknown>) => api.get<AuditEventDTO[]>('/audit-events', params),
};

