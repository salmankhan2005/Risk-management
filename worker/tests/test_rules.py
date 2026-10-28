from decimal import Decimal
import uuid
from riskwatch_worker.domain.models import Transaction, Account, Merchant, Device, CustomerDevice
from riskwatch_worker.risk_engine.rules import evaluate_rules_and_generate_alerts

def test_large_amount_rule_triggers_and_awards_score():
    acc_id = uuid.uuid4()
    cust_id = uuid.uuid4()
    account = Account(
        id=acc_id,
        business_id="ACC-TEST-01",
        primary_customer_id=cust_id,
        account_type="SAVINGS",
        currency="INR",
        status="ACTIVE",
        current_balance=Decimal("250000.00"),
        overdraft_limit=Decimal("0.00"),
        allow_overdraft=False,
        opened_at=None
    )
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    large_txn = Transaction(
        id=uuid.uuid4(),
        business_id="TXN-LARGE-01",
        account_id=acc_id,
        type="DEBIT",
        amount=Decimal("150000.00"),
        signed_amount=Decimal("-150000.00"),
        currency="INR",
        balance_before=Decimal("250000.00"),
        balance_after=Decimal("100000.00"),
        status="POSTED",
        channel="WEB",
        merchant_id=None,
        device_id=None,
        idempotency_key="idem_large",
        description="High value test transaction",
        occurred_at=now
    )

    evals, alerts, cases = evaluate_rules_and_generate_alerts(
        transactions=[large_txn],
        accounts=[account],
        merchants=[],
        devices=[],
        customer_devices=[],
        rule_versions={},
        seed="test_seed"
    )

    assert len(evals) == 1
    assert evals[0].triggered is True
    assert evals[0].score_awarded == 35
    assert "exceeds high-value threshold" in evals[0].explanation

