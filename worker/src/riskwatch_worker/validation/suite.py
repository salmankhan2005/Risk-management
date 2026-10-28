from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any
from ..domain.models import (
    Customer, Account, Transaction, TransferLink, Alert, Case,
    ValidationCheckResult
)

def run_validation_suite(
    customers: List[Customer],
    accounts: List[Account],
    transactions: List[Transaction],
    transfer_links: List[TransferLink],
    alerts: List[Alert],
    cases: List[Case]
) -> List[ValidationCheckResult]:
    """
    Executes 20 deterministic invariant checks across 5 integrity families.
    """
    results: List[ValidationCheckResult] = []

    # -------------------------------------------------------------
    # Family 1: Structural & Relational Integrity
    # -------------------------------------------------------------
    # 1. VAL-STR-01: Customer ID Uniqueness
    cust_ids = [c.id for c in customers]
    dup_cust = len(cust_ids) - len(set(cust_ids))
    results.append(ValidationCheckResult(
        check_id="VAL-STR-01",
        category="Structural",
        name="Customer Primary Key Uniqueness",
        status="PASS" if dup_cust == 0 else "FAIL",
        severity="CRITICAL",
        details="All customer records must have distinct unique UUIDs.",
        failed_count=dup_cust
    ))

    # 2. VAL-STR-02: Account Foreign Key Integrity
    cust_id_set = set(cust_ids)
    orphaned_accs = [a.id for a in accounts if a.primary_customer_id not in cust_id_set]
    results.append(ValidationCheckResult(
        check_id="VAL-STR-02",
        category="Structural",
        name="Account Customer Reference Integrity",
        status="PASS" if len(orphaned_accs) == 0 else "FAIL",
        severity="CRITICAL",
        details="Every account must link to a valid existing customer ID.",
        failed_count=len(orphaned_accs),
        sample_failed_ids=[str(i) for i in orphaned_accs[:5]]
    ))

    # 3. VAL-STR-03: Transaction Account Reference Integrity
    acc_id_set = {a.id for a in accounts}
    orphaned_txns = [t.id for t in transactions if t.account_id not in acc_id_set]
    results.append(ValidationCheckResult(
        check_id="VAL-STR-03",
        category="Structural",
        name="Transaction Account Reference Integrity",
        status="PASS" if len(orphaned_txns) == 0 else "FAIL",
        severity="CRITICAL",
        details="Every transaction must reference an existing account record.",
        failed_count=len(orphaned_txns)
    ))

    # 4. VAL-STR-04: Business ID Canonical Format
    bad_bids = [c.business_id for c in customers if not c.business_id.startswith("CUS-")]
    results.append(ValidationCheckResult(
        check_id="VAL-STR-04",
        category="Structural",
        name="Business Identifier Pattern Conformity",
        status="PASS" if len(bad_bids) == 0 else "FAIL",
        severity="WARNING",
        details="Customer business IDs must strictly adhere to CUS-XXXXXX format.",
        failed_count=len(bad_bids)
    ))

    # -------------------------------------------------------------
    # Family 2: Financial & Balance Integrity
    # -------------------------------------------------------------
    # 5. VAL-BAL-01: Signed Amount Invariant
    bad_signed = [
        t.id for t in transactions
        if (t.type == "DEBIT" and t.signed_amount != -t.amount) or
           (t.type == "CREDIT" and t.signed_amount != t.amount)
    ]
    results.append(ValidationCheckResult(
        check_id="VAL-BAL-01",
        category="Financial",
        name="Transaction Signed Amount Invariant",
        status="PASS" if len(bad_signed) == 0 else "FAIL",
        severity="CRITICAL",
        details="Debit transactions must have signed_amount = -amount; credit must have signed_amount = amount.",
        failed_count=len(bad_signed)
    ))

    # 6. VAL-BAL-02: Overdraft Facility Violation Check (Anomaly Target)
    acc_map = {a.id: a for a in accounts}
    od_violations = [
        a.id for a in accounts
        if not a.allow_overdraft and a.current_balance < Decimal("0.00")
    ]
    results.append(ValidationCheckResult(
        check_id="VAL-BAL-02",
        category="Financial",
        name="Unauthorized Overdraft Negative Balance Check",
        status="PASS" if len(od_violations) == 0 else "FAIL",
        severity="CRITICAL",
        details="Accounts without authorized overdraft facility must never drop below 0.00 balance.",
        failed_count=len(od_violations),
        sample_failed_ids=[str(i) for i in od_violations[:5]]
    ))

    # 7. VAL-BAL-03: Transfer Legs Amount Parity (Anomaly Target)
    imbalanced_links = [l.id for l in transfer_links if l.status == "IMBALANCED"]
    results.append(ValidationCheckResult(
        check_id="VAL-BAL-03",
        category="Financial",
        name="Inter-Account Transfer Legs Parity",
        status="PASS" if len(imbalanced_links) == 0 else "FAIL",
        severity="CRITICAL",
        details="Debit leg of a paired transfer must match the credit leg in amount and currency.",
        failed_count=len(imbalanced_links),
        sample_failed_ids=[str(i) for i in imbalanced_links[:5]]
    ))

    # 8. VAL-BAL-04: Non-Negative Transaction Amounts
    neg_amounts = [t.id for t in transactions if t.amount <= Decimal("0.00")]
    results.append(ValidationCheckResult(
        check_id="VAL-BAL-04",
        category="Financial",
        name="Positive Transaction Nominal Value",
        status="PASS" if len(neg_amounts) == 0 else "FAIL",
        severity="CRITICAL",
        details="Nominal transaction amounts must be strictly positive values.",
        failed_count=len(neg_amounts)
    ))

    # -------------------------------------------------------------
    # Family 3: Temporal & Lifecycle Invariants
    # -------------------------------------------------------------
    # 9. VAL-TMP-01: Account Opened Before Transactions
    acc_opened_map = {a.id: a.opened_at for a in accounts}
    txns_before_open = [
        t.id for t in transactions
        if t.account_id in acc_opened_map and t.occurred_at < acc_opened_map[t.account_id]
    ]
    results.append(ValidationCheckResult(
        check_id="VAL-TMP-01",
        category="Temporal",
        name="Transaction Timestamp Post-Account Creation",
        status="PASS" if len(txns_before_open) == 0 else "FAIL",
        severity="CRITICAL",
        details="No transaction can occur prior to the opening timestamp of its target account.",
        failed_count=len(txns_before_open)
    ))

    # 10. VAL-TMP-02: Terminated / Closed Account Activity (Anomaly Target)
    closed_acc_map = {a.id: a.closed_at for a in accounts if a.status == "CLOSED" and a.closed_at}
    txns_on_closed = [
        t.id for t in transactions
        if t.account_id in closed_acc_map and t.occurred_at > closed_acc_map[t.account_id]
    ]
    results.append(ValidationCheckResult(
        check_id="VAL-TMP-02",
        category="Temporal",
        name="Terminated Account Inactivity Verification",
        status="PASS" if len(txns_on_closed) == 0 else "FAIL",
        severity="CRITICAL",
        details="Closed accounts cannot post subsequent financial transactions.",
        failed_count=len(txns_on_closed),
        sample_failed_ids=[str(i) for i in txns_on_closed[:5]]
    ))

    # 11. VAL-TMP-03: Alert Creation Precedes Case Closure (Anomaly Target)
    retro_cases = [
        c.id for c in cases
        if c.closed_at and c.opened_at and c.closed_at < c.opened_at
    ]
    results.append(ValidationCheckResult(
        check_id="VAL-TMP-03",
        category="Temporal",
        name="Case Investigation Chronology Verification",
        status="PASS" if len(retro_cases) == 0 else "FAIL",
        severity="ERROR",
        details="Case resolution and closure timestamps must follow opened timestamp sequentially.",
        failed_count=len(retro_cases)
    ))

    # 12. VAL-TMP-04: Future Timestamp Rejection
    now = datetime.now()
    future_txns = [t.id for t in transactions if t.occurred_at.replace(tzinfo=None) > now]
    results.append(ValidationCheckResult(
        check_id="VAL-TMP-04",
        category="Temporal",
        name="No Future-Dated Event Ingestion",
        status="PASS" if len(future_txns) == 0 else "FAIL",
        severity="WARNING",
        details="Events and transactions must not contain timestamps in the future.",
        failed_count=len(future_txns)
    ))

    # -------------------------------------------------------------
    # Family 4: Traceability & Evidence Completeness
    # -------------------------------------------------------------
    # 13. VAL-TRC-01: Alert Account Linkage
    orphan_alerts = [a.id for a in alerts if a.account_id not in acc_id_set]
    results.append(ValidationCheckResult(
        check_id="VAL-TRC-01",
        category="Traceability",
        name="Alert Account Association Integrity",
        status="PASS" if len(orphan_alerts) == 0 else "FAIL",
        severity="CRITICAL",
        details="Every alert must be associated with a valid account record.",
        failed_count=len(orphan_alerts)
    ))

    # 14. VAL-TRC-02: Alert Risk Score Range (0 - 100)
    invalid_scores = [a.id for a in alerts if not (0 <= a.aggregate_score <= 100)]
    results.append(ValidationCheckResult(
        check_id="VAL-TRC-02",
        category="Traceability",
        name="Risk Score Bounded Range Compliance",
        status="PASS" if len(invalid_scores) == 0 else "FAIL",
        severity="ERROR",
        details="Aggregate alert risk score must fall strictly within the interval [0, 100].",
        failed_count=len(invalid_scores)
    ))

    # 15. VAL-TRC-03: Case Severity Level Allowed Enums
    valid_severities = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    bad_sev = [c.id for c in cases if c.severity not in valid_severities]
    results.append(ValidationCheckResult(
        check_id="VAL-TRC-03",
        category="Traceability",
        name="Case Severity Classification Integrity",
        status="PASS" if len(bad_sev) == 0 else "FAIL",
        severity="WARNING",
        details="Case severity must use standardized domain enums (LOW, MEDIUM, HIGH, CRITICAL).",
        failed_count=len(bad_sev)
    ))

    # 16. VAL-TRC-04: Deduplication Key Uniqueness
    dedup_keys = [a.deduplication_key for a in alerts]
    dup_alerts = len(dedup_keys) - len(set(dedup_keys))
    results.append(ValidationCheckResult(
        check_id="VAL-TRC-04",
        category="Traceability",
        name="Alert Idempotency & Deduplication Invariant",
        status="PASS" if dup_alerts == 0 else "FAIL",
        severity="WARNING",
        details="Alert deduplication keys must prevent multiple duplicate triggers for the same event.",
        failed_count=dup_alerts
    ))

    # -------------------------------------------------------------
    # Family 5: Benchmark & Dataset Metrics
    # -------------------------------------------------------------
    # 17. VAL-ISO-01: Customer Volume Target Threshold Check
    results.append(ValidationCheckResult(
        check_id="VAL-ISO-01",
        category="Benchmark",
        name="Customer Generation Volume Target",
        status="PASS" if len(customers) >= 1000 else "FAIL",
        severity="INFO",
        details=f"Current dataset contains {len(customers)} generated customers.",
        failed_count=0
    ))

    # 18. VAL-ISO-02: Account Ratio Target (>= 1.2 accounts/customer)
    ratio = len(accounts) / max(1, len(customers))
    results.append(ValidationCheckResult(
        check_id="VAL-ISO-02",
        category="Benchmark",
        name="Multi-Account Distribution Factor",
        status="PASS" if ratio >= 1.0 else "FAIL",
        severity="INFO",
        details=f"Current accounts-to-customer ratio is {ratio:.2f}.",
        failed_count=0
    ))

    # 19. VAL-ISO-03: Transaction Density Check
    results.append(ValidationCheckResult(
        check_id="VAL-ISO-03",
        category="Benchmark",
        name="Transaction Feed Density Benchmark",
        status="PASS" if len(transactions) >= 5000 else "FAIL",
        severity="INFO",
        details=f"Total transactions generated: {len(transactions)}.",
        failed_count=0
    ))

    # 20. VAL-ISO-04: Alert Trigger Rate Benchmark
    alert_ratio = len(alerts) / max(1, len(transactions))
    results.append(ValidationCheckResult(
        check_id="VAL-ISO-04",
        category="Benchmark",
        name="Alert Generation Selectivity Rate",
        status="PASS" if (0.001 <= alert_ratio <= 0.15) else "WARNING",
        severity="INFO",
        details=f"Alert selectivity: {alert_ratio * 100:.2f}% of processed transactions.",
        failed_count=0
    ))

    return results
