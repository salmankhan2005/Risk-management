# ADR 0002: Deterministic Synthetic Generation and Explainable Evidence Model

## Status
Accepted

## Context
Risk monitoring systems often fail recruiter and audit scrutiny by presenting fabricated numbers, unseeded random values, or opaque "AI risk scores" that cannot be traced to concrete underlying facts. To provide true recruiter-ready credibility, every risk alert must be explainable, and synthetic datasets must be 100% reproducible.

## Decision
1. **Deterministic Random Streams**:
   - Data generation utilizes isolated, seeded pseudo-random number generators (PRNGs) keyed to a default seed (`20261022`) and explicit timestamp anchors.
   - Distinct sub-streams are used per domain entity (customers, accounts, transactions, transfers) to avoid cascade shifts when generator logic evolves.
   - Running the generator twice with identical parameters produces byte-for-byte identical database rows and output checksums.
2. **Explicit Evidence Architecture**:
   - Alerts cannot be created without at least one triggering `risk_evaluations` record and referencing `transactions`.
   - Each evaluation produces `risk_evaluation_evidence` capturing:
     - The evaluated rule version and configuration snapshot.
     - Observed metric values vs configured thresholds.
     - Evaluated time windows and source entity references.
     - Human-readable explanation grounded directly in measured numbers.
3. **Isolated Ground Truth**:
   - Benchmark scenarios and anomaly labels are generated into an isolated table (`ground_truth_labels`) that is completely inaccessible to normal risk-rule queries, preventing data leakage during evaluation.

## Consequences
- Every alert in the analyst workbench can be expanded to show the exact mathematical rule, observed facts, and contributing transactions.
- Invariant tests verify that the 5 required negative scenarios are reliably detected by validators without corrupting baseline data.

