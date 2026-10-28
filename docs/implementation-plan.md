
# RiskWatch Production Implementation Plan

## Phase 1: Repository Audit, Architectural Alignment & Contracts (Current)
- [x] Comprehensive codebase audit across frontend routes, context store, and database configuration.
- [x] Read and cross-reference `riskwatch-backend-engineering` skill and reference documentation.
- [x] Establish architecture blueprint (`docs/architecture.md`) with Mermaid diagrams, feature maps, and role matrices.
- [x] Record architectural decisions (ADRs):
  - [x] ADR 0001: Modular Monolith Architecture & Database Source of Truth.
  - [x] ADR 0002: Deterministic Synthetic Generation & Explainable Evidence Model.
  - [x] ADR 0003: Hybrid Auth Integration and Role-Based Access Control.
- [x] Author comprehensive API contract (`docs/api-contract.md`) and failure matrix (`docs/failure-modes.md`).

## Phase 2: Complete Database Foundation
- [x] Implement complete domain migration in `supabase/migrations/20261028120000_core_schema.sql`:
  - 15 Enums, `user_profiles`, `user_roles`.
  - `customers`, `kyc_profiles`, `accounts`, `account_ownership`, `merchants`, `devices`, `customer_devices`.
  - `transactions` with `NUMERIC(15,2)` precision, signed amount constraints, balance reconciliation check.
  - `transfer_links` connecting source/destination legs with reconciliation invariant.
  - `risk_rules`, `risk_rule_versions`, `risk_evaluations`, `risk_evaluation_evidence`.
  - `alerts`, `alert_transactions`, `alert_rule_evaluations`.
  - `cases`, `case_alerts`, `case_transactions`, `analyst_actions`.
  - `generation_jobs`, `anomaly_manifest_entries`, `validation_runs`, `validation_results`.
  - `ground_truth_labels` isolated for benchmark verification.
  - `export_jobs`, `dataset_manifests`, `entity_state_events`, `audit_events`.
  - Compound indexes across high-traffic filter and query paths.
  - Atomic RPC functions: `rpc_record_case_disposition`, `rpc_post_transaction`.
  - RLS policies and grants across all 32 public tables.
- [x] Apply migration cleanly to remote Supabase database (`ukhxxiuguhqbynkgcdus`) and verify table schema.
- [x] Seed the 6 initial explainable risk rules into `public.risk_rules`.

## Phase 3: Security, Contracts & DTOs
- [x] Create `packages/contracts/`:
  - Shared TypeScript interfaces and enums for all domain entities (`enums.ts`, `dtos.ts`).
  - Standardized success envelope `ApiSuccess<T>` and error envelope `ApiError` (`envelopes.ts`).
  - Runtime validation schemas with Zod for all request parameters, query filters, and mutation payloads (`schemas.ts`).
- [x] Implement centralized typed API client in `lib/api/` (`client.ts`, `endpoints.ts`) with token binding, request IDs, error normalization, timeout/abort controllers, and typed return values.

## Phase 4: Read Paths & API Integration
- [ ] Implement optimized Supabase Edge Functions / Next.js API Route Handlers under `/api/v1/`:
  - `GET /api/v1/me` (Profile and resolved roles).
  - `GET /api/v1/dashboard/summary` (Aggregated metrics, status counts, risk distributions).
  - `GET /api/v1/customers` and `GET /api/v1/customers/:id`.
  - `GET /api/v1/accounts` and `GET /api/v1/accounts/:id`.
  - `GET /api/v1/transactions` (Cursor-paginated with composite filtering).
  - `GET /api/v1/alerts` and `GET /api/v1/alerts/:id` (With linked rule evaluations and evidence).
  - `GET /api/v1/cases` and `GET /api/v1/cases/:id` (With alerts, chronological timeline).
  - `GET /api/v1/rules` (Catalog and version history).
- [ ] Connect feature hooks and verify empty, loading, error, and populated states.

## Phase 5: Write Paths, Atomic Transactions & Audit
- [ ] Implement atomic PostgreSQL RPC functions:
  - `rpc_record_case_disposition`: Validates chronology, updates case, records `analyst_actions`, emits state and audit events.
  - `rpc_assign_case`: Reassigns case with optimistic concurrency check.
  - `rpc_publish_risk_rule`: Atomically publishes an immutable rule version and logs audit trail.
- [ ] Ensure all consequential operations append immutable audit records.

## Phase 6: Python Worker & Deterministic Job Pipeline
- [ ] Implement Python worker in `worker/`:
  - `worker/src/riskwatch_worker/config/`: Environment and job parameters.
  - `worker/src/riskwatch_worker/jobs/`: Atomic claimer (`FOR UPDATE SKIP LOCKED`), lease management, and checkpoints.
  - `worker/src/riskwatch_worker/generators/`: Parameterized generator for 5k customers, 7k accounts, 100k transactions with seed `20261022`.
  - `worker/src/riskwatch_worker/persistence/`: Batch database adapters with atomic transactions.

## Phase 7: Risk Engine, Evidence & Anomaly Suite
- [ ] Implement the 6 deterministic explainable risk rules:
  1. Transaction velocity spike.
  2. New-device activity.
  3. Circular transfers.
  4. Dormant-account reactivation.
  5. Large-amount transaction.
  6. Unusual merchant activity.
- [ ] Implement the 5 required negative scenarios and anomaly manifest:
  1. Transaction referencing a closed account.
  2. Negative balance without overdraft permission.
  3. Non-reconciling transfer legs.
  4. Alert without valid triggering transaction evidence.
  5. Case disposition predating alert creation.
- [ ] Isolate ground truth in dedicated schema/table inaccessible to normal rule evaluations.

## Phase 8: Validation Lab, Evaluation & Exports
- [ ] Implement automated validator families (structural, temporal, financial, traceability, reproducibility).
- [ ] Metric calculations with strict denominator checks (precision, recall, FPR, confusion matrix).
- [ ] Export engine generating CSV, JSON, and SHA-256 manifests.

## Phase 9: Frontend Completion & Analyst Workbench
- [ ] Transition dashboard and workbench views from local-only mock data to live API feeds.
- [ ] Implement real-time job progress polling and validation lab feedback.
- [ ] Verify UX across Warm, Monochrome, and Smoky Graphite themes.

## Phase 10: Final Verification & Recruiter-Ready Delivery
- [ ] Execute test suite: unit tests, database integration tests, RLS tests, reproducibility tests.
- [ ] Verify `npm run lint` and `npm run build` pass with zero warnings or errors.
- [ ] Author comprehensive `README.md` and verification walkthrough.

