export type UserRoleType = 'operations_analyst' | 'risk_reviewer' | 'system_admin';

export type KycStatusType = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REQUIRES_REVIEW' | 'REJECTED';

export type RiskTierType = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AccountStatusType = 'ACTIVE' | 'DORMANT' | 'CLOSED';

export type CustomerStatusType = 'ACTIVE' | 'DORMANT' | 'SUSPENDED';

export type TransactionType = 'DEBIT' | 'CREDIT';

export type TransactionStatusType = 'POSTED' | 'REVERSED' | 'FAILED';

export type TransferStatusType = 'RECONCILED' | 'IMBALANCED' | 'FAILED';

export type RuleStatusType = 'DRAFT' | 'PUBLISHED' | 'RETIRED';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatusType = 'OPEN' | 'INVESTIGATING' | 'DISMISSED' | 'ESCALATED';

export type CaseStatusType = 'OPEN' | 'IN_REVIEW' | 'CLOSED';

export type CaseDispositionType =
  | 'FALSE_POSITIVE'
  | 'SUSPICIOUS_REPORTED'
  | 'RESOLVED_BENIGN'
  | 'POLICY_VIOLATION';

export type JobStatusType =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCEL_REQUESTED'
  | 'CANCELLED';

export type ValidationSeverityType = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type ValidationStatusType = 'PASSED' | 'FAILED' | 'WARNING';

