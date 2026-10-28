import {
  AccountStatusType,
  AlertStatusType,
  CaseDispositionType,
  CaseStatusType,
  JobStatusType,
  KycStatusType,
  RiskTierType,
  RuleStatusType,
  SeverityLevel,
  TransactionStatusType,
  TransactionType,
  TransferStatusType,
  UserRoleType,
  ValidationSeverityType,
  ValidationStatusType,
} from './enums';

export interface UserProfileDTO {
  id: string;
  clerkId: string;
  displayName: string;
  email: string;
  department?: string | null;
  roles: UserRoleType[];
  permissions: string[];
}

export interface CustomerDTO {
  id: string;
  businessId: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  email: string;
  phone?: string | null;
  country: string;
  riskTier: RiskTierType;
  kycStatus?: KycStatusType;
  status?: string;
  createdAt: string;
  accountsCount?: number;
}

export interface KYCProfileDTO {
  id: string;
  customerId: string;
  version: number;
  status: KycStatusType;
  verifiedAt?: string | null;
  riskScore: number;
  sanctionScreened: boolean;
  pepStatus: boolean;
  notes?: string | null;
  createdAt: string;
}

export interface AccountDTO {
  id: string;
  businessId: string;
  primaryCustomerId?: string;
  customerId?: string;
  customerName?: string;
  accountType: string;
  currency: string;
  status: AccountStatusType;
  currentBalance: string;
  overdraftLimit?: string;
  allowOverdraft?: boolean;
  overdraftAllowed?: boolean;
  openedAt: string;
  closedAt?: string | null;
  lastTransactionAt?: string | null;
  riskScore?: number;
  riskTier?: string;
}

export interface TransactionDTO {
  id: string;
  businessId: string;
  accountId: string;
  accountBusinessId?: string;
  customerName?: string;
  customerId?: string;
  type: TransactionType;
  amount: string;
  signedAmount: string;
  currency: string;
  balanceBefore: string;
  balanceAfter: string;
  status: TransactionStatusType;
  channel: string;
  merchantName?: string | null;
  merchantId?: string | null;
  deviceFingerprint?: string | null;
  deviceId?: string | null;
  description?: string | null;
  occurredAt: string;
  initiatedAt?: string | null;
  settledAt?: string | null;
  riskScore?: number;
  riskTier?: string;
}

export interface TransferLinkDTO {
  id: string;
  transferGroupId: string;
  sourceTransactionId: string;
  destinationTransactionId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  currency: string;
  status: TransferStatusType;
  linkedAt: string;
}

export interface RiskRuleDTO {
  id: string;
  ruleCode: string;
  name: string;
  description: string;
  category: string;
  activeVersion?: RiskRuleVersionDTO;
}

export interface RiskRuleVersionDTO {
  id: string;
  ruleId: string;
  versionNumber: number;
  status: RuleStatusType;
  parameters: Record<string, unknown>;
  thresholdValue: string;
  timeWindowMinutes: number;
  scoreContribution: number;
  severity: SeverityLevel;
  effectiveFrom: string;
  effectiveTo?: string | null;
  publishedBy?: string | null;
  publishedAt?: string | null;
}

export interface RiskEvaluationEvidenceDTO {
  id: string;
  evaluationId: string;
  evidenceType: string;
  sourceRecordId: string;
  evidencePayload: Record<string, unknown>;
}

export interface RiskEvaluationDTO {
  id: string;
  ruleVersionId: string;
  ruleCode?: string;
  ruleName?: string;
  entityType: string;
  entityId: string;
  triggered: boolean;
  observedValue: string;
  thresholdSnapshot: string;
  scoreAwarded: number;
  explanation: string;
  evidence: RiskEvaluationEvidenceDTO[];
  evaluatedAt: string;
}

export interface AlertDTO {
  id: string;
  businessId: string;
  accountId: string;
  accountBusinessId?: string;
  customerId: string;
  customerName?: string;
  title?: string;
  description?: string;
  status: AlertStatusType;
  severity: SeverityLevel;
  aggregateScore: number;
  summary: string;
  deduplicationKey: string;
  assignedToName?: string | null;
  assignedToId?: string | null;
  evaluations?: RiskEvaluationDTO[];
  transactions?: TransactionDTO[];
  score?: number;
  ruleCode?: string;
  triggeredAt?: string;
  resolvedAt?: string | null;
  version?: number;
  createdAt: string;
}

export interface AnalystActionDTO {
  id: string;
  caseId: string;
  actorId: string;
  actorName?: string;
  actionType: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  disposition?: CaseDispositionType | null;
  notes?: string | null;
  createdAt: string;
}

export interface CaseDTO {
  id: string;
  businessId: string;
  customerId: string;
  customerName?: string;
  title: string;
  status: CaseStatusType;
  severity: SeverityLevel;
  disposition?: CaseDispositionType | null;
  assignedToName?: string | null;
  version: number;
  alertsCount?: number;
  alerts?: AlertDTO[];
  actions?: AnalystActionDTO[];
  openedAt: string;
  closedAt?: string | null;
  updatedAt: string;
  timeline?: Array<{
    id: string;
    actionType: string;
    actorId: string;
    occurredAt: string;
    notes?: string | null;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
  }>;
}

export interface DashboardSummaryDTO {
  asOf: string;
  activeAlertsCount: number;
  criticalCasesCount: number;
  monitoredTransactionsVolume: string;
  flaggedVolume: string;
  totalCustomersCount: number;
  totalAccountsCount: number;
  ruleTriggerBreakdown: Array<{
    ruleId: string;
    ruleCode: string;
    name: string;
    count: number;
    severity: SeverityLevel;
  }>;
  recentAlerts: AlertDTO[];
}

export interface GenerationJobDTO {
  id: string;
  jobType: string;
  status: JobStatusType;
  seed: string;
  targetCustomers: number;
  targetAccounts: number;
  targetTransactions: number;
  generatedCustomers: number;
  generatedAccounts: number;
  generatedTransactions: number;
  generatedAlerts: number;
  currentStage: string;
  progressPercent: number;
  errorMessage?: string | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface ValidationResultDTO {
  id: string;
  runId: string;
  checkCode: string;
  name: string;
  category: string;
  severity: ValidationSeverityType;
  status: ValidationStatusType;
  message: string;
  violationCount: number;
  details: Record<string, unknown>;
}

export interface ValidationRunDTO {
  id: string;
  jobId?: string | null;
  datasetSeed?: string | null;
  status: ValidationStatusType;
  totalChecks?: number;
  passedChecks?: number;
  failedChecks?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  summary?: string | null;
  summaryMetrics?: Record<string, unknown>;
  executedBy?: string;
  results?: ValidationResultDTO[];
  createdAt?: string;
}

export interface AuditEventDTO {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeSummary?: string | null;
  afterSummary?: string | null;
  reason?: string | null;
  requestId?: string | null;
  createdAt: string;
}

