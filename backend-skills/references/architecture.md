# Architecture Reference

## Relationship summary
- Customer 1:N KYC profile versions.
- Customer N:M Account through effective-dated AccountOwnership.
- Customer N:M Device through effective-dated CustomerDevice.
- Account 1:N Transactions.
- Merchant and Device each have optional 1:N relationships to Transactions.
- TransferLink connects source/destination transaction legs.
- RiskRule 1:N immutable RiskRuleVersion; versions 1:N RiskEvaluation.
- RiskEvaluation 1:N RiskEvaluationEvidence.
- Alert N:M Transaction through AlertTransaction.
- Alert N:M RiskEvaluation through AlertRuleEvaluation.
- Case N:M Alert through CaseAlert and N:M Transaction through CaseTransaction.
- Case 1:N AnalystAction.
- Lifecycle changes create EntityStateEvent/AuditEvent records.
- AnomalyInjectionRun 1:N AnomalyManifestEntry.
- GroundTruthLabel points to target/scenario but is isolated from risk inputs.

## Migration order
1. Extensions and enums.
2. User profiles and roles.
3. Customers and KYC.
4. Accounts and ownership.
5. Merchants, devices, customer-device links.
6. Transactions and transfers.
7. Rules, versions, evaluations, evidence.
8. Alerts and bridges.
9. Cases, bridges, analyst actions.
10. State and audit events.
11. Jobs, manifests, validation, anomalies, ground truth, exports.
12. Constraints and indexes.
13. RLS policies and grants.

## Audit semantics
Record actor, action, previous/new state, timestamp, reason, correlation ID, and evidence references. Do not mutate previous analyst actions. Publish a new rule version rather than changing historical evaluation meaning.

## Worker semantics
Use a reliable queue or database-backed atomic job-claim protocol. Persist checkpoints and use bounded batches. Make retries idempotent.
