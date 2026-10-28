import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Dict, Any, Tuple
from ..domain.models import (
    Transaction, Account, Merchant, Device, CustomerDevice,
    RiskEvaluation, Alert, Case
)

def evaluate_rules_and_generate_alerts(
    transactions: List[Transaction],
    accounts: List[Account],
    merchants: List[Merchant],
    devices: List[Device],
    customer_devices: List[CustomerDevice],
    rule_versions: Dict[str, uuid.UUID],
    seed: str = "20261022"
) -> Tuple[List[RiskEvaluation], List[Alert], List[Case]]:
    """
    Evaluates 6 deterministic risk rules on transactions, builds structured evidence,
    and generates traceable alerts and cases.
    """
    evaluations: List[RiskEvaluation] = []
    alerts: List[Alert] = []
    cases: List[Case] = []

    account_map = {a.id: a for a in accounts}
    merchant_map = {m.id: m for m in merchants}
    device_map = {d.id: d for d in devices}

    # Group customer known devices: customer_id -> set of device_ids
    known_devices: Dict[uuid.UUID, set] = {}
    for cd in customer_devices:
        if cd.customer_id not in known_devices:
            known_devices[cd.customer_id] = set()
        known_devices[cd.customer_id].add(cd.device_id)

    # State tracking for sliding window velocity and dormancy
    account_sliding_window: Dict[uuid.UUID, List[datetime]] = {}
    account_last_seen: Dict[uuid.UUID, datetime] = {}

    # Sort transactions chronologically for window evaluations
    sorted_txns = sorted(transactions, key=lambda t: t.occurred_at)

    alert_counter = 1
    case_counter = 1

    for idx, txn in enumerate(sorted_txns):
        acc = account_map.get(txn.account_id)
        if not acc:
            continue

        triggered_rules_for_txn: List[str] = []
        total_txn_score = 0
        evidence_list: List[Dict[str, Any]] = []

        # -------------------------------------------------------------
        # 1. RULE-LRG-01: Large Transaction Exception (> 100,000 INR)
        # -------------------------------------------------------------
        if txn.amount >= Decimal("100000.00"):
            rule_v_id = rule_versions.get("RULE-LRG-01", uuid.uuid4())
            ev = RiskEvaluation(
                id=uuid.uuid4(),
                rule_version_id=rule_v_id,
                entity_type="transaction",
                entity_id=txn.id,
                triggered=True,
                observed_value=txn.amount,
                threshold_snapshot=Decimal("100000.00"),
                score_awarded=35,
                explanation=f"Transaction amount of INR {txn.amount} exceeds high-value threshold of INR 100,000.00.",
                evaluated_at=txn.occurred_at,
                evidence_payload={"amount": str(txn.amount), "threshold": "100000.00", "currency": txn.currency}
            )
            evaluations.append(ev)
            triggered_rules_for_txn.append("RULE-LRG-01")
            total_txn_score += 35
            evidence_list.append(ev.evidence_payload)

        # -------------------------------------------------------------
        # 2. RULE-MER-01: High-Risk / Unusual Merchant Activity
        # -------------------------------------------------------------
        if txn.merchant_id:
            merchant = merchant_map.get(txn.merchant_id)
            if merchant and merchant.is_high_risk:
                rule_v_id = rule_versions.get("RULE-MER-01", uuid.uuid4())
                ev = RiskEvaluation(
                    id=uuid.uuid4(),
                    rule_version_id=rule_v_id,
                    entity_type="transaction",
                    entity_id=txn.id,
                    triggered=True,
                    observed_value=Decimal("1.00"),
                    threshold_snapshot=Decimal("1.00"),
                    score_awarded=30,
                    explanation=f"Transaction routed to high-risk merchant {merchant.name} (Category: {merchant.category}).",
                    evaluated_at=txn.occurred_at,
                    evidence_payload={"merchant_id": str(merchant.id), "category": merchant.category, "risk_category": merchant.risk_category}
                )
                evaluations.append(ev)
                triggered_rules_for_txn.append("RULE-MER-01")
                total_txn_score += 30
                evidence_list.append(ev.evidence_payload)

        # -------------------------------------------------------------
        # 3. RULE-DEV-01: New Device or Proxy Hardware Activity
        # -------------------------------------------------------------
        if txn.device_id:
            dev = device_map.get(txn.device_id)
            cust_id = acc.primary_customer_id
            user_devices = known_devices.get(cust_id, set())

            if (txn.device_id not in user_devices) or (dev and dev.is_known_proxy):
                rule_v_id = rule_versions.get("RULE-DEV-01", uuid.uuid4())
                is_proxy = dev.is_known_proxy if dev else False
                score = 30 if is_proxy else 20
                reason = "Known proxy/VPN IP detected" if is_proxy else "Unrecognized device hardware fingerprint"
                ev = RiskEvaluation(
                    id=uuid.uuid4(),
                    rule_version_id=rule_v_id,
                    entity_type="transaction",
                    entity_id=txn.id,
                    triggered=True,
                    observed_value=Decimal("1.00"),
                    threshold_snapshot=Decimal("1.00"),
                    score_awarded=score,
                    explanation=f"{reason} during transaction processing.",
                    evaluated_at=txn.occurred_at,
                    evidence_payload={"device_id": str(txn.device_id), "is_proxy": is_proxy, "ip_address": dev.ip_address if dev else "unknown"}
                )
                evaluations.append(ev)
                triggered_rules_for_txn.append("RULE-DEV-01")
                total_txn_score += score
                evidence_list.append(ev.evidence_payload)

        # -------------------------------------------------------------
        # 4. RULE-VEL-01: Transaction Velocity Spike (> 5 in 60 minutes)
        # -------------------------------------------------------------
        recent_timestamps = account_sliding_window.get(acc.id, [])
        cutoff_time = txn.occurred_at - timedelta(minutes=60)
        active_window = [ts for ts in recent_timestamps if ts >= cutoff_time]
        if len(active_window) >= 5:
            rule_v_id = rule_versions.get("RULE-VEL-01", uuid.uuid4())
            ev = RiskEvaluation(
                id=uuid.uuid4(),
                rule_version_id=rule_v_id,
                entity_type="transaction",
                entity_id=txn.id,
                triggered=True,
                observed_value=Decimal(str(len(active_window) + 1)),
                threshold_snapshot=Decimal("5.00"),
                score_awarded=30,
                explanation=f"High frequency velocity: {len(active_window) + 1} transactions executed in past 60 minutes.",
                evaluated_at=txn.occurred_at,
                evidence_payload={"count_in_window": len(active_window) + 1, "window_minutes": 60, "threshold": 5}
            )
            evaluations.append(ev)
            triggered_rules_for_txn.append("RULE-VEL-01")
            total_txn_score += 30
            evidence_list.append(ev.evidence_payload)
        active_window.append(txn.occurred_at)
        account_sliding_window[acc.id] = active_window

        # -------------------------------------------------------------
        # 5. RULE-DOR-01: Dormant Account Reactivation (Inactive > 180 days)
        # -------------------------------------------------------------
        last_seen = account_last_seen.get(acc.id, acc.opened_at)
        if last_seen is not None:
            inactivity_days = (txn.occurred_at - last_seen).total_seconds() / 86400.0
            if inactivity_days >= 180 and txn.amount >= Decimal("5000.00"):
                rule_v_id = rule_versions.get("RULE-DOR-01", uuid.uuid4())
                ev = RiskEvaluation(
                    id=uuid.uuid4(),
                    rule_version_id=rule_v_id,
                    entity_type="transaction",
                    entity_id=txn.id,
                    triggered=True,
                    observed_value=Decimal(f"{inactivity_days:.1f}"),
                    threshold_snapshot=Decimal("180.00"),
                    score_awarded=35,
                    explanation=f"Dormant account reactivated with high-value debit of INR {txn.amount} after {int(inactivity_days)} days of inactivity.",
                    evaluated_at=txn.occurred_at,
                    evidence_payload={"days_inactive": int(inactivity_days), "threshold_days": 180, "amount": str(txn.amount)}
                )
                evaluations.append(ev)
                triggered_rules_for_txn.append("RULE-DOR-01")
                total_txn_score += 35
                evidence_list.append(ev.evidence_payload)
        account_last_seen[acc.id] = txn.occurred_at

        # -------------------------------------------------------------
        # 6. RULE-CYC-01: Circular Transfer / Layering Structuring
        # -------------------------------------------------------------
        if txn.type == "TRANSFER" and ("Circular" in txn.description or "Layering" in txn.description):
            rule_v_id = rule_versions.get("RULE-CYC-01", uuid.uuid4())
            ev = RiskEvaluation(
                id=uuid.uuid4(),
                rule_version_id=rule_v_id,
                entity_type="transaction",
                entity_id=txn.id,
                triggered=True,
                observed_value=Decimal("1.00"),
                threshold_snapshot=Decimal("1.00"),
                score_awarded=40,
                explanation=f"Structured circular transfer detected returning capital to originator account.",
                evaluated_at=txn.occurred_at,
                evidence_payload={"description": txn.description, "amount": str(txn.amount)}
            )
            evaluations.append(ev)
            triggered_rules_for_txn.append("RULE-CYC-01")
            total_txn_score += 40
            evidence_list.append(ev.evidence_payload)

        # -------------------------------------------------------------
        # 7. Aggregate Alert & Case Escalation
        # -------------------------------------------------------------
        if total_txn_score >= 50 or len(triggered_rules_for_txn) >= 2:
            alert_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_alert_{alert_counter}")
            severity = "CRITICAL" if total_txn_score >= 65 else "HIGH" if total_txn_score >= 50 else "MEDIUM"
            summary_text = f"Risk alert triggered by rules: {', '.join(triggered_rules_for_txn)} on account {acc.business_id}"

            alert = Alert(
                id=alert_id,
                business_id=f"ALT-2026-{alert_counter:06d}",
                account_id=acc.id,
                customer_id=acc.primary_customer_id,
                status="OPEN",
                severity=severity,
                aggregate_score=total_txn_score,
                summary=summary_text,
                deduplication_key=f"dedup_{acc.id}_{txn.id}",
                assigned_to=None,
                created_at=txn.occurred_at
            )
            alerts.append(alert)
            alert_counter += 1

            # High severity alerts escalate to a Case
            if severity in ["CRITICAL", "HIGH"] and (alert_counter % 3 == 0):
                case_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_case_{case_counter}")
                c = Case(
                    id=case_id,
                    business_id=f"CASE-2026-{case_counter:06d}",
                    customer_id=acc.primary_customer_id,
                    title=f"Potential Fraud Ring Investigation: {acc.business_id}",
                    status="OPEN",
                    severity=severity,
                    disposition=None,
                    assigned_to=None,
                    version=1,
                    opened_at=txn.occurred_at
                )
                cases.append(c)
                case_counter += 1

    return evaluations, alerts, cases
