import { z } from 'zod';

export const UserRoleSchema = z.enum(['operations_analyst', 'risk_reviewer', 'system_admin']);

export const KycStatusSchema = z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED', 'REQUIRES_REVIEW', 'REJECTED']);

export const RiskTierSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const AccountStatusSchema = z.enum(['ACTIVE', 'DORMANT', 'CLOSED']);

export const CustomerStatusSchema = z.enum(['ACTIVE', 'DORMANT', 'SUSPENDED']);

export const TransactionTypeSchema = z.enum(['DEBIT', 'CREDIT']);

export const SeverityLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const AlertStatusSchema = z.enum(['OPEN', 'INVESTIGATING', 'DISMISSED', 'ESCALATED']);

export const CaseStatusSchema = z.enum(['OPEN', 'IN_REVIEW', 'CLOSED']);

export const CaseDispositionSchema = z.enum([
  'FALSE_POSITIVE',
  'SUSPICIOUS_REPORTED',
  'RESOLVED_BENIGN',
  'POLICY_VIOLATION',
]);

export const PaginationQuerySchema = z.object({
  cursor: z.string().optional().nullable(),
  limit: z.coerce.number().min(1).max(100).default(25),
});

export const TransactionsQuerySchema = PaginationQuerySchema.extend({
  accountId: z.string().uuid().optional(),
  type: TransactionTypeSchema.optional(),
  minAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  maxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  flaggedOnly: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const AlertsQuerySchema = PaginationQuerySchema.extend({
  status: AlertStatusSchema.optional(),
  severity: SeverityLevelSchema.optional(),
  ruleId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});

export const CasesQuerySchema = PaginationQuerySchema.extend({
  status: CaseStatusSchema.optional(),
  severity: SeverityLevelSchema.optional(),
  assignedTo: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
});

export const CaseDispositionRequestSchema = z.object({
  disposition: CaseDispositionSchema,
  notes: z.string().min(5, 'Disposition notes must be at least 5 characters long.').max(2000),
  expectedVersion: z.number().int().positive(),
});

export const CaseAssignRequestSchema = z.object({
  assignedToId: z.string().uuid().nullable(),
  expectedVersion: z.number().int().positive(),
});

export const RuleSimulationRequestSchema = z.object({
  ruleId: z.string().uuid(),
  draftConfig: z.record(z.string(), z.unknown()),
  timeWindowDays: z.number().int().min(1).max(90).default(30),
});

export const PublishRuleVersionRequestSchema = z.object({
  parameters: z.record(z.string(), z.unknown()).default({}),
  thresholdValue: z.number().nonnegative(),
  timeWindowMinutes: z.number().int().positive().nullable().optional(),
  scoreContribution: z.number().int().min(1).max(100).default(20),
  severity: SeverityLevelSchema.default('MEDIUM'),
  reason: z.string().min(5).max(500).default('Published updated rule version'),
});

export const GenerationJobRequestSchema = z.object({
  seed: z.string().min(1).max(64).default('20261022'),
  targetCustomers: z.number().int().min(100).max(50000).default(5000),
  targetAccounts: z.number().int().min(100).max(100000).default(7000),
  targetTransactions: z.number().int().min(500).max(500000).default(100000),
});

export const ValidationRunRequestSchema = z.object({
  jobId: z.string().uuid().optional(),
  datasetSeed: z.string().default('20261022'),
});

export const ExportJobRequestSchema = z.object({
  format: z.enum(['CSV', 'JSON']).default('CSV'),
  scope: z.enum(['ALL_ENTITIES', 'ALERTS_ONLY', 'TRANSACTIONS_ONLY', 'AUDIT_ONLY']).default('ALL_ENTITIES'),
});
