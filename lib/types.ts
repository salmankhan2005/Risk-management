export type Currency = 'INR' | 'USD' | 'EUR';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type UserRole = 'Operations Analyst' | 'Risk/Compliance Reviewer' | 'System Administrator';

export type KYCStatus = 'Verified' | 'Pending' | 'Requires Review';

export type CustomerStatus = 'Active' | 'Dormant' | 'Suspended';

export type AccountStatus = 'Active' | 'Dormant' | 'Closed' | 'Restricted';

export type AccountType = 'Savings' | 'Current' | 'Corporate' | 'Escrow';

export type TransactionType = 'Purchase' | 'Transfer' | 'Withdrawal' | 'Deposit' | 'Refund';

export type TransactionDirection = 'Debit' | 'Credit';

export type TransactionStatus = 'Settled' | 'Flagged' | 'Blocked' | 'Under Investigation';

export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type AlertStatus = 'New' | 'Open' | 'Under Review' | 'Escalated' | 'Resolved' | 'False Positive';

export type CaseStatus = 'Open' | 'Assigned' | 'Investigating' | 'Pending Review' | 'Resolved' | 'Closed';

export type CasePriority = 'P1' | 'P2' | 'P3' | 'P4';

export type CaseDisposition =
  | 'Suspicious Activity'
  | 'Legitimate Activity'
  | 'False Positive'
  | 'Escalated'
  | 'Requires Further Investigation';

export type RuleCategory = 'Velocity' | 'Device' | 'Topology' | 'Lifecycle' | 'Value' | 'Merchant';

// 1. Customer
export interface Customer {
  id: string; // CUS-000001
  displayName: string;
  email: string;
  phone: string;
  country: string;
  riskTier: RiskLevel;
  kycStatus: KYCStatus;
  kycVerifiedDate: string;
  status: CustomerStatus;
  createdAt: string;
  accountsCount: number;
  totalVolume: number; // in INR
  transactionCount: number;
}

// 2. KYC Profile
export interface KYCProfile {
  id: string;
  customerId: string;
  documentType: 'Aadhaar' | 'PAN' | 'Passport' | 'Voter ID';
  documentNumberMasked: string;
  idScore: number; // 0-100
  pepCheckPassed: boolean;
  sanctionCheckPassed: boolean;
  verifiedAt: string;
  reviewer: string;
}

// 3. Account
export interface Account {
  id: string; // ACC-CUS-000001-01
  customerId: string;
  accountType: AccountType;
  status: AccountStatus;
  currency: Currency;
  openedAt: string;
  closedAt?: string;
  overdraftAllowed: boolean;
  overdraftLimit: number;
  currentBalance: number;
  lastTransactionAt: string;
  riskScore: number;
  riskLevel: RiskLevel;
}

// 4. Account Ownership
export interface AccountOwnership {
  id: string;
  accountId: string;
  customerId: string;
  ownershipType: 'Primary' | 'Joint' | 'Signatory';
  sharePercentage: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

// 5. Merchant
export interface Merchant {
  id: string; // MER-00104
  name: string;
  category: 'Electronics' | 'Jewelry' | 'Gambling' | 'Luxury Goods' | 'Crypto Exchange' | 'General Retail' | 'Travel';
  riskCategory: 'Low' | 'Medium' | 'High' | 'Prohibited';
  jurisdiction: string;
  flaggedTxCount: number;
}

// 6. Device
export interface Device {
  id: string; // DEV-00892
  fingerprint: string;
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  os: string;
  browser: string;
  ipAddress: string;
  geoCountry: string;
  firstSeenAt: string;
  lastSeenAt: string;
  isKnownProxy: boolean;
}

// 7. Customer Device Bridge
export interface CustomerDevice {
  id: string;
  customerId: string;
  deviceId: string;
  firstUsedAt: string;
  lastUsedAt: string;
  isPrimary: boolean;
  trustScore: number; // 0-100
}

// 8. Transaction
export interface Transaction {
  id: string; // TXN-2026-00000001
  timestamp: string;
  customerId: string;
  accountId: string;
  fromAccountId?: string;
  toAccountId?: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  currency: Currency;
  balanceBefore: number;
  balanceAfter: number;
  merchantId?: string;
  deviceId?: string;
  riskScore: number; // 0-100
  triggeredRules: string[];
  status: TransactionStatus;
  linkedAlertId?: string;
  linkedCaseId?: string;
  description?: string;
}

// 9. Transfer Link
export interface TransferLink {
  id: string; // TRF-2026-000001
  sourceAccountId: string;
  destAccountId: string;
  fromAccountId?: string;
  toAccountId?: string;
  sourceTxnId: string;
  destTxnId: string;
  debitTransactionId?: string;
  creditTransactionId?: string;
  amount: number;
  currency: Currency;
  timestamp: string;
  initiatedAt?: string;
  state: 'Completed' | 'Pending' | 'Reconciliation Failed' | 'Flagged Loop';
  status?: string;
  isCircular: boolean;
  circularPath?: string[]; // Account IDs in loop
  reconciliationStatus: 'Reconciled' | 'Discrepancy' | 'Unreconciled';
  reconciled?: boolean;
  linkedAlertId?: string;
  discrepancyReason?: string;
}

export type Transfer = TransferLink;

// 10. Risk Rule
export interface RiskRule {
  id: string; // RUL-VELOCITY-01
  name: string;
  description: string;
  category: RuleCategory;
  enabled: boolean;
  status?: 'Active' | 'Draft' | 'Deprecated';
  severity?: AlertSeverity;
  scoreWeight?: number;
  version: string;
  effectiveFrom: string;
  windowHours: number;
  thresholdValue: number;
  thresholdUnit: string;
  scoreContribution: number;
  severityMapping: AlertSeverity;
  lastEvaluatedAt: string;
  triggersCount: number;
  logicExpression: string;
  conditionLogic?: string;
  thresholds?: Record<string, number | string>;
  createdAt?: string;
  updatedAt?: string;
}

export type Rule = RiskRule;

// 11. Rule Evaluation
export interface RuleEvaluation {
  id: string;
  ruleId: string;
  txnId: string;
  observedValue: number;
  thresholdValue: number;
  passed: boolean; // true if triggered
  scoreAdded: number;
  evaluatedAt: string;
  explanation: string;
}

// 12. Alert
export interface Alert {
  id: string; // ALT-2026-000001
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  riskScore: number;
  ruleIds: string[];
  triggerTxnIds: string[];
  linkedTransactionIds?: string[];
  linkedAccountIds: string[];
  linkedCustomerId: string;
  assignedAnalyst?: string;
  assignedTo?: string;
  linkedCaseId?: string;
  createdAt: string;
  triggeredAt?: string;
  updatedAt: string;
  resolvedAt?: string;
  evidenceSummary: string;
  isControlledNegative?: boolean;
}

// 13. Alert Transaction Bridge
export interface AlertTransaction {
  id: string;
  alertId: string;
  transactionId: string;
  role: 'Primary Trigger' | 'Contextual Leg';
}

// 14. Alert Rule Bridge
export interface AlertRule {
  id: string;
  alertId: string;
  ruleId: string;
  observedValue: number;
  thresholdValue: number;
}

// 15. Case History
export interface CaseHistoryItem {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  details: string;
}

// 16. Case
export interface Case {
  id: string; // CASE-2026-000001
  title: string;
  description: string;
  severity: AlertSeverity;
  priority: CasePriority;
  status: CaseStatus;
  assignedAnalyst: string;
  assignedTo?: string;
  assignedAnalystRole: string;
  linkedCustomerIds: string[];
  linkedAccountIds: string[];
  linkedAlertIds: string[];
  linkedTxnIds: string[];
  evidenceSummary: string;
  disposition?: CaseDisposition;
  dispositionNotes?: string;
  notes?: string[];
  createdAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  history: CaseHistoryItem[];
}

// 17. Analyst Action
export interface AnalystAction {
  id: string;
  caseId?: string;
  alertId?: string;
  actor: string;
  role: string;
  action: string;
  timestamp: string;
  notes?: string;
  previousState?: string;
  newState?: string;
}

// 18. Entity State Event
export interface EntityStateEvent {
  id: string;
  entityType: 'Transaction' | 'Account' | 'Customer' | 'Alert' | 'Case' | 'Rule';
  entityId: string;
  previousStatus: string;
  newStatus: string;
  changedBy: string;
  timestamp: string;
  reason: string;
}

// 19. Audit Event
export interface AuditEvent {
  id: string; // AUD-2026-000001
  actor: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  beforeSummary: string;
  afterSummary: string;
  reason: string;
  correlationId: string;
}

// Validation Check definition
export interface ValidationCheck {
  id: number;
  code: string;
  name: string;
  checkType?: string;
  description?: string;
  expectedResult?: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  recordsExamined: number;
  failureCount: number;
  affectedRecordIds: string[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  explanation: string;
  suggestedAction: string;
  executedAt: string;
}

// Ground Truth Negative Scenario
export interface GroundTruthScenario {
  id: number;
  scenarioId: string;
  name?: string;
  description?: string;
  scenarioType?: string;
  expectedDetectionMethod?: string;
  affectedEntityIds?: string[];
  seededAt?: string;
  entityType: string;
  entityId: string;
  issueType: string;
  expectedDetection: string;
  expectedOutcome: string;
  explanation: string;
  supportingRule: string;
  validationResult: 'DETECTED' | 'UNRESOLVED';
  isControlledNegative: boolean;
}

// Dataset metadata
export interface DatasetMetadata {
  seed: string;
  generatorVersion: string;
  runIdentifier: string;
  createdAt: string;
  validationStatus: 'VALIDATED_WITH_LABELED_EXCEPTIONS' | 'CLEAN' | 'FAILED';
  totalCustomers: number;
  totalAccounts: number;
  totalTransactions: number;
  totalAlerts: number;
  totalCases: number;
  baselineVolumeMode: 'starter' | 'full';
}
