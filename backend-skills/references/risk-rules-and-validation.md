# Risk Rules and Validation Reference

## Rule contracts
Each rule specifies immutable rule ID/version, effective dates, input facts, time-window semantics, null behavior, threshold, score contribution, severity logic, evidence output, and tests.

Examples (thresholds are configurable examples, not universal standards):
- Velocity spike: transaction count in a configured window exceeds threshold.
- New device: activity uses a device not associated in a configured lookback.
- Circular transfer: directed transfer graph contains a cycle within a bounded window/path length.
- Dormant reactivation: an account with no qualifying activity for a configured dormancy period becomes active.
- Large amount: amount exceeds a currency-aware threshold.
- Unusual merchant: deterministic documented category/merchant rule; do not claim learned behavior unless implemented.

## Validation categories
- Structural: PK/FK, required fields, enum, duplicate bridge links.
- Temporal: event ordering, effective-date mismatch, lifecycle chronology.
- Financial: balance arithmetic, overdraft, transfer reconciliation.
- Traceability: alert lacks triggering transaction/rule evidence.
- Evaluation: planted pattern not detected, ground-truth leakage, invalid denominator.
- Reproducibility: row count/hash/config mismatch.

## Metrics
Precision = TP/(TP+FP); recall = TP/(TP+FN); FPR = FP/(FP+TN), only when denominators are positive. Otherwise report unavailable. State evaluation unit and label definition. Synthetic metrics are engineering checks, not real-world performance evidence.
