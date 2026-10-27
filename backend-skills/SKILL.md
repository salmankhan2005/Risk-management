---
name: riskwatch-backend-engineering
description: Implement and review the RiskWatch financial-risk backend using Supabase/PostgreSQL, TypeScript, Python workers, deterministic synthetic data, transparent risk rules, audit history, validation, isolated ground truth, exports, and reproducibility.
---

# RiskWatch Backend Engineering Skill

## Mission
Build a secure, maintainable, tested backend—not a mock CRUD demo. Inspect the repository before editing. Preserve every requirement and report gaps honestly.

## Required stack
- Supabase PostgreSQL is the source of truth; Supabase Auth for authentication.
- PostgreSQL RLS, constraints, and server-side authorization enforce access.
- TypeScript for API contracts and request-oriented Edge Functions/RPC.
- Python worker for deterministic data generation, batch jobs, validation, and evaluation.
- Version-controlled SQL migrations; exact `NUMERIC` money arithmetic; UTC `TIMESTAMPTZ`.
- Persistent background jobs for long-running tasks. Use a modular monolith, not premature microservices.

## Business requirements
Support the full workflow: create customer/KYC, accounts/ownership, merchants/devices; generate timestamped debit/credit transactions with reconciled balances; link transfer legs; evaluate explainable risk rules; create evidence-linked alerts; group alerts into cases; record analyst dispositions as immutable history; preserve state-change events; validate; export; and report measurable results.

Default scale: 5,000 customers, 7,000 accounts, 100,000 transactions, 1,000 alerts. Default seed `20261022`. Starter and full scale must use the same parameterized generator.

Immutable business IDs:
- `CUS-000001`
- `ACC-<customer-id>-01`
- `TXN-2026-00000001`
- `ALT-2026-000001`
- `CASE-2026-000001`

Do not rely on database sequence order alone for deterministic IDs.

## Required entities
Customer, KYCProfile, Account, AccountOwnership, Merchant, Device, CustomerDevice, Transaction, TransferLink, RiskRule, RiskRuleVersion, RiskEvaluation, RiskEvaluationEvidence, Alert, AlertTransaction, AlertRuleEvaluation, Case, CaseAlert, CaseTransaction, AnalystAction, EntityStateEvent, AuditEvent, UserProfile, UserRole, GenerationJob, ValidationRun, ValidationResult, AnomalyInjectionRun, AnomalyManifestEntry, GroundTruthLabel, ExportJob, DatasetManifest.

Document every field (type, required/optional, allowed values, units, uniqueness, validation), relationship cardinality, optional relationships, effective dates, and lifecycle states. Use foreign keys and bridge tables for many-to-many relationships.

## Recommended repository shape
```text
apps/web/                 # UI only
apps/worker/src/
  generators/ domain/ risk_engine/ anomaly_injection/
  validation/ persistence/ jobs/ exports/ evaluation/ tests/
packages/contracts/
supabase/migrations/
supabase/functions/
docs/
scripts/
tests/
README.md
.env.example
```
Keep business rules out of React. Share canonical rule definitions and test fixtures across TypeScript and Python.

## Data integrity
- Use PostgreSQL `NUMERIC` for money and document rounding/currency precision.
- Define signed amount semantics, e.g. `balance_after = balance_before + signed_amount`.
- Enforce account status and overdraft policy.
- Use atomic operations for multi-record writes.
- Generate in bounded batches with checkpoints; never hold one transaction open for all 100,000 rows.
- Make retries idempotent.
- Preserve historical analyst actions and rule evaluations.
- Add indexes based on query patterns and query plans.

## Risk engine
Implement separate deterministic rules for:
1. Velocity spikes.
2. New-device activity.
3. Circular transfers.
4. Dormant-account reactivation.
5. Large-amount transactions.
6. Unusual merchant activity.

Persist rule ID/version, entity reference, timestamp, triggered result, observed values, thresholds, score contribution, explanation, evidence references, and status/errors. Document time-window semantics, null behavior, score aggregation, maximum score, severity thresholds, and effective dates. Never assign scores randomly or overwrite old evaluations.

## Generation pipeline
1. Create a persistent job and validate config.
2. Generate master data.
3. Generate valid dependent records and transactions.
4. Generate transfer links.
5. Validate baseline.
6. Inject labelled negative scenarios.
7. Evaluate risk rules.
8. Generate alerts and cases.
9. Generate lifecycle-consistent analyst actions.
10. Generate ground truth separately.
11. Run validation.
12. Export files/manifests/checksums.
13. Mark success only after required checks pass.

Derive balances, totals, scores, statuses, and labels from source facts and documented rules. Use deterministic RNG streams; record seed, config, generator version, counts, and checksums.

## Required negative scenarios
All must be in an anomaly manifest with affected IDs, expected validator/result, and reproducibility metadata:
1. Transaction references a closed account.
2. Negative balance without overdraft.
3. Transfer legs do not reconcile.
4. Alert has no triggering transaction evidence.
5. Case disposition precedes alert.

Generate valid baseline first. Inject labelled fixtures in a controlled stage; do not corrupt unrelated records or weaken all constraints. If DB constraints block a fixture, test it in a controlled validation/staging workflow and document it.

## Ground truth and metrics
Keep ground truth separate and access-restricted. Never expose it to risk-rule inputs. Derive labels from documented scenarios, not independent random assignment. Report row counts, validation failures, rule triggers, detection coverage, and TP/FP/TN/FN-derived precision/recall/FPR only when label definitions and denominators are valid. Report undefined metrics as unavailable. Synthetic results do not prove real-world fraud performance.

## Background jobs
Persist job type/status, seed/config, progress/stage, counts, errors, actor, timestamps, and checkpoints. Support PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED. Use reliable queue/atomic claim, bounded batches, and idempotent retries; never rely only on in-memory tasks or a single long HTTP request.

## API
Use versioned `/api/v1` contracts for dashboard metrics, transaction/account/customer search/details, alerts/evidence, cases/actions, rules/versioning/simulation, generation jobs/status, validation runs/results, exports, and authorized audit search. Use pagination, allowlisted sorting, input validation, safe consistent error envelopes, and correlation IDs. Long tasks return job IDs. Choose Edge Functions and/or secure RPC based on the operation.

## Security
Enable RLS on exposed tables and test it for every role. Derive actor identity from verified auth context. Never trust frontend-supplied roles. Keep service-role keys and worker credentials out of browser code and version control. Use parameterized operations. Restrict exports, rule publication, generation, and admin actions. Audit consequential actions without secrets.

Roles: `operations_analyst`, `risk_reviewer`, `system_admin`. Define a least-privilege permission matrix before implementing policies.

## Validation suite
Test PK uniqueness, FK integrity, valid joins, required fields/enums, duplicate links, timestamp/effective-date order, ownership/lifecycle, balance arithmetic, overdraft, transfer reconciliation, alert evidence, case chronology, ground-truth isolation, counts/coverage, export consistency, and reproducibility. Persist validation runs/results with check ID, severity, pass/fail, affected IDs/sample, explanation, timestamp. Never silently repair failures.

## Exports
Produce CSV/JSON/SQL seed data for entities, bridge tables, and events, plus `ground_truth.csv/json`, `anomaly_manifest.json`, `source_manifest.json`, `validation_summary.json`, and `reproducibility_report.json`. Record seed/config/version/counts/checksums/provenance. Prefer synthetic data unless public-data license and redistribution terms are clear.

## Tests
Unit tests for rules/scoring/arithmetic/lifecycle/determinism; integration tests for DB/API/atomic writes; RLS and authorization tests; all five negative scenarios; end-to-end generation → evaluation → alert → case → action → audit → validation → export; twice-run reproducibility comparison. Never claim tests passed unless executed.

## Work stages
1. Inspect repo.
2. Document architecture/data dictionary.
3. Create migrations, constraints, indexes, RLS.
4. Define shared API contracts/enums.
5. Implement repositories/domain services.
6. Implement deterministic generator.
7. Implement rules/evidence.
8. Implement alerts/cases/actions/audit.
9. Implement anomalies/isolated ground truth.
10. Implement jobs/checkpoints.
11. Implement validation/exports.
12. Add/run tests.
13. Document setup, env, deployment, and reproducibility.

After each stage, report files changed, tests run/results, gaps, and next step. Do not claim completion without code and test evidence.

## Definition of done
Migrations work on a clean DB; all entities/relationships exist; RLS tests pass; generation is deterministic; risk evidence is explainable; alerts/cases trace to facts/rules; history is preserved; all five anomalies are detected; ground truth is isolated; exports/manifests/checksums exist; reproducibility tests pass; README enables another developer to set up and verify the project.
