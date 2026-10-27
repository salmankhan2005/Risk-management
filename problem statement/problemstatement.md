Business Context / Problem
Prioritize transactions and linked accounts for analyst review using transparent rules and synthetic risk indicators.

Objective and Scope
Build a working solution for this end-to-end workflow: Prioritize transactions and linked accounts for analyst review using transparent rules and synthetic risk indicators. The solution should expose key decisions and exceptions, preserve traceability, and produce measurable outputs. Medium complexity means multiple related entities, conditional rules, at least one exception path and meaningful evaluation metrics.

Primary Actors / Systems
Customer/account holder, operations analyst, risk/compliance reviewer and system administrator

Business Workflow and Rules
1. Generate/reference master data first: Customer, Account, Merchant, Device, Transaction.
2. Generate dependent transaction/event records using valid parent IDs.
3. Apply business logic: Create customers and KYC profiles; create accounts with ownership and status; generate merchants/devices; generate timestamped debit/credit transactions with balances that reconcile; add transfers linking source and destination; evaluate rules; group related alerts into cases; record analyst dispositions.
4. Persist state changes as explicit records/events where relevant; do not overwrite history.
5. Generate outcomes and ground-truth labels from documented rules, not independent random assignment.

Entities and Relationships
Core entities: Customer, Account, Merchant, Device, Transaction, TransferLink, RiskRule, Alert, Case, AnalystAction. Define a primary key for every entity and foreign keys for every relationship. Document cardinality (1:1, 1:N, N:M), optional relationships, effective dates and lifecycle states. Use bridge tables for many-to-many relationships; retain event history for state changes; validate all joins. For deliberate anomaly cases, keep an issue_type/ground_truth label rather than silently corrupting unrelated rows.

ID / Nomenclature Conventions
CUS-000001; ACC-<customer-id>-01; TXN-2026-00000001; ALT-2026-000001; CASE-2026-000001.

Synthetic Data Generation Instructions (Granular)
Step 1 — Write a data dictionary for: Customer, Account, Merchant, Device, Transaction, TransferLink, RiskRule, Alert, Case, AnalystAction. For each field specify type, required/optional, allowed values, units, uniqueness and validation rule.
Step 2 — Create parent/master tables first, then child and event tables. Apply this domain-specific generation logic: Create customers and KYC profiles; create accounts with ownership and status; generate merchants/devices; generate timestamped debit/credit transactions with balances that reconcile; add transfers linking source and destination; evaluate rules; group related alerts into cases; record analyst dispositions.
Step 3 — Apply deterministic IDs and naming: CUS-000001; ACC-<customer-id>-01; TXN-2026-00000001; ALT-2026-000001; CASE-2026-000001. Keep counters zero-padded, IDs immutable, and referenced IDs exactly consistent across files.
Step 4 — Generate the baseline volume: Generate 5,000 customers, 7,000 accounts, 100,000 transactions and 1,000 alerts. Include normal patterns, velocity spikes, new-device activity, circular transfers, dormant account reactivation and false positives. Synthetic data only. Use a fixed seed (e.g. 20261022) and parameterize scale so starter and full datasets use the same generator.
Step 5 — Generate valid baseline records first, then inject labelled edge cases: Transaction references closed account; negative balance without overdraft; transfer legs do not reconcile; alert has no triggering transaction; case disposition precedes alert.
Step 6 — Calculate derived values (totals, balances, scores, statuses and dates) from source records rather than generating them independently.
Step 7 — Produce a separate ground_truth.csv/json for known anomalies, expected decisions or labels; never leak it into input features.
Step 8 — Run validation: primary-key uniqueness, foreign-key integrity, allowed enums, date ordering, arithmetic reconciliation, lifecycle transitions and duplicate checks.
Step 9 — Export CSV/JSON/SQL seed data plus README, schema/data dictionary, generator command, fixed seed, source manifest and validation summary.
Step 10 — Regenerate twice with the same seed and compare row counts/checksums to demonstrate reproducibility.

Suggested Volume and Coverage
Generate 5,000 customers, 7,000 accounts, 100,000 transactions and 1,000 alerts. Include normal patterns, velocity spikes, new-device activity, circular transfers, dormant account reactivation and false positives. Synthetic data only.

Required Edge Cases / Negative Scenarios
Transaction references closed account; negative balance without overdraft; transfer legs do not reconcile; alert has no triggering transaction; case disposition precedes alert.

Validation Rules / Acceptance Criteria
Balances reconcile; every alert references triggering facts/rules; planted patterns are detectable; alert ranking is explainable; false-positive cases are represented.

Evaluation Focus for Generated Data
Review: (a) realistic distributions and meaningful variation; (b) consistent IDs and valid joins; (c) dependency/lifecycle consistency across entities; (d) correct derived values and reconciliation; (e) normal, boundary, failure and exception coverage; (f) separate ground truth; (g) fixed-seed reproducibility, documentation and lawful provenance.

Public Data Guidance / Lawful Use
External data is optional. If used, record source URL, dataset/version, retrieval date, license/terms, attribution, transformations and fields discarded. Use only data you are legally permitted to access and redistribute; do not bypass access controls or collect confidential/personal information. If licensing or suitability is unclear, use synthetic data and cite public reference data only for schema inspiration.