import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Tuple, Dict, Any
from ..domain.models import (
    Transaction, Account, TransferLink, Alert, Case, AnomalyEntry
)

def inject_negative_scenarios(
    transactions: List[Transaction],
    accounts: List[Account],
    transfer_links: List[TransferLink],
    alerts: List[Alert],
    cases: List[Case]
) -> Tuple[List[AnomalyEntry], List[Dict[str, Any]]]:
    """
    Deterministically injects the 5 required negative scenarios as controlled fixtures
    and records an isolated ground truth label dataset.
    """
    anomaly_manifest: List[AnomalyEntry] = []
    ground_truth_records: List[Dict[str, Any]] = []

    # 1. SCENARIO-01: Transaction referencing a CLOSED account
    if len(accounts) > 10 and len(transactions) > 10:
        target_acc = accounts[5]
        target_acc.status = "CLOSED"
        target_acc.closed_at = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)

        # Inject a transaction occurring after closed_at
        bad_txn = transactions[12]
        bad_txn.account_id = target_acc.id
        bad_txn.occurred_at = datetime(2026, 10, 5, 14, 0, 0, tzinfo=timezone.utc)

        entry1 = AnomalyEntry(
            scenario_id="ANOMALY-01",
            scenario_name="Transaction on Closed Account",
            target_entity_type="transaction",
            target_entity_id=str(bad_txn.id),
            target_business_id=bad_txn.business_id,
            expected_validator="VAL-ACC-01",
            expected_result="FAIL",
            metadata={"account_id": str(target_acc.id), "closed_at": target_acc.closed_at.isoformat()}
        )
        anomaly_manifest.append(entry1)
        ground_truth_records.append({
            "entity_type": "transaction",
            "entity_id": str(bad_txn.id),
            "is_anomaly": True,
            "scenario": "ANOMALY-01",
            "description": "Transaction executed against a terminated/closed account."
        })

    # 2. SCENARIO-02: Negative balance without overdraft permission
    if len(accounts) > 15:
        od_acc = accounts[8]
        od_acc.allow_overdraft = False
        od_acc.overdraft_limit = Decimal("0.00")
        od_acc.current_balance = Decimal("-12500.50")  # Violates invariant

        entry2 = AnomalyEntry(
            scenario_id="ANOMALY-02",
            scenario_name="Unauthorized Overdraft Negative Balance",
            target_entity_type="account",
            target_entity_id=str(od_acc.id),
            target_business_id=od_acc.business_id,
            expected_validator="VAL-BAL-02",
            expected_result="FAIL",
            metadata={"balance": str(od_acc.current_balance), "allow_overdraft": False}
        )
        anomaly_manifest.append(entry2)
        ground_truth_records.append({
            "entity_type": "account",
            "entity_id": str(od_acc.id),
            "is_anomaly": True,
            "scenario": "ANOMALY-02",
            "description": "Account maintains negative balance without overdraft facility."
        })

    # 3. SCENARIO-03: Non-reconciling transfer legs
    if len(transfer_links) > 5:
        target_link = transfer_links[2]
        target_link.status = "IMBALANCED"
        # Disrupt matching debit transaction amount
        for t in transactions:
            if t.id == target_link.source_transaction_id:
                t.amount = target_link.amount + Decimal("500.00")
                t.signed_amount = -(target_link.amount + Decimal("500.00"))
                break

        entry3 = AnomalyEntry(
            scenario_id="ANOMALY-03",
            scenario_name="Imbalanced Transfer Legs Reconciliation Failure",
            target_entity_type="transfer_link",
            target_entity_id=str(target_link.id),
            target_business_id=f"TRF-{target_link.id}",
            expected_validator="VAL-TRF-01",
            expected_result="FAIL",
            metadata={"discrepancy_amount": "500.00", "status": "IMBALANCED"}
        )
        anomaly_manifest.append(entry3)
        ground_truth_records.append({
            "entity_type": "transfer_link",
            "entity_id": str(target_link.id),
            "is_anomaly": True,
            "scenario": "ANOMALY-03",
            "description": "Transfer source debit leg does not reconcile with destination credit leg."
        })

    # 4. SCENARIO-04: Alert without valid triggering transaction evidence
    orphan_alert = Alert(
        id=uuid.uuid4(),
        business_id="ALT-2026-999999",
        account_id=accounts[0].id,
        customer_id=accounts[0].primary_customer_id,
        status="OPEN",
        severity="HIGH",
        aggregate_score=85,
        summary="Synthetically generated orphan alert lacking source risk evaluation evidence",
        deduplication_key="dedup_orphan_test",
        assigned_to=None,
        created_at=datetime(2026, 10, 15, 12, 0, 0, tzinfo=timezone.utc)
    )
    alerts.append(orphan_alert)

    entry4 = AnomalyEntry(
        scenario_id="ANOMALY-04",
        scenario_name="Orphan Alert Without Underlying Evidence",
        target_entity_type="alert",
        target_entity_id=str(orphan_alert.id),
        target_business_id=orphan_alert.business_id,
        expected_validator="VAL-ALT-02",
        expected_result="FAIL",
        metadata={"alert_id": str(orphan_alert.id), "reason": "No linked rule evaluations"}
    )
    anomaly_manifest.append(entry4)
    ground_truth_records.append({
        "entity_type": "alert",
        "entity_id": str(orphan_alert.id),
        "is_anomaly": True,
        "scenario": "ANOMALY-04",
        "description": "Alert has no triggering transactions or risk evaluation evidence records."
    })

    # 5. SCENARIO-05: Case disposition predating alert creation
    retro_case = Case(
        id=uuid.uuid4(),
        business_id="CASE-2026-999999",
        customer_id=accounts[0].primary_customer_id,
        title="Retro-dated Case Investigation",
        status="CLOSED",
        severity="MEDIUM",
        disposition="SUSPICIOUS_REPORTED",
        assigned_to=None,
        version=2,
        opened_at=datetime(2026, 8, 1, 10, 0, 0, tzinfo=timezone.utc),
        closed_at=datetime(2026, 8, 2, 10, 0, 0, tzinfo=timezone.utc)
    )
    cases.append(retro_case)

    entry5 = AnomalyEntry(
        scenario_id="ANOMALY-05",
        scenario_name="Case Disposition Predating Trigger Event",
        target_entity_type="case",
        target_entity_id=str(retro_case.id),
        target_business_id=retro_case.business_id,
        expected_validator="VAL-CASE-03",
        expected_result="FAIL",
        metadata={"case_id": str(retro_case.id), "closed_at": retro_case.closed_at.isoformat()}
    )
    anomaly_manifest.append(entry5)
    ground_truth_records.append({
        "entity_type": "case",
        "entity_id": str(retro_case.id),
        "is_anomaly": True,
        "scenario": "ANOMALY-05",
        "description": "Case disposition timestamp strictly precedes the initiating alert creation date."
    })

    return anomaly_manifest, ground_truth_records
