from decimal import Decimal
import uuid
from datetime import datetime, timezone
from riskwatch_worker.domain.models import Customer, Account, Transaction, TransferLink, Alert, Case
from riskwatch_worker.validation.suite import run_validation_suite

def test_validation_suite_passes_on_clean_data():
    now = datetime.now(timezone.utc)
    c_id = uuid.uuid4()
    a_id = uuid.uuid4()

    cust = Customer(
        id=c_id,
        business_id="CUS-000001",
        first_name="Anita",
        last_name="Roy",
        email="anita.roy@example.com",
        phone="+919876543210",
        country="IN",
        risk_tier="LOW",
        created_at=now
    )
    acc = Account(
        id=a_id,
        business_id="ACC-CUS-000001-01",
        primary_customer_id=c_id,
        account_type="SAVINGS",
        currency="INR",
        status="ACTIVE",
        current_balance=Decimal("10000.00"),
        overdraft_limit=Decimal("0.00"),
        allow_overdraft=False,
        opened_at=now
    )
    txn = Transaction(
        id=uuid.uuid4(),
        business_id="TXN-2026-00000001",
        account_id=a_id,
        type="CREDIT",
        amount=Decimal("500.00"),
        signed_amount=Decimal("500.00"),
        currency="INR",
        balance_before=Decimal("9500.00"),
        balance_after=Decimal("10000.00"),
        status="POSTED",
        channel="WEB",
        merchant_id=None,
        device_id=None,
        idempotency_key="test_idem_1",
        description="Deposit",
        occurred_at=now
    )

    results = run_validation_suite([cust], [acc], [txn], [], [], [])
    assert len(results) == 20

    # Financial signed amount check must pass
    bal_check = next(r for r in results if r.check_id == "VAL-BAL-01")
    assert bal_check.status == "PASS"

    # Structural uniqueness check must pass
    str_check = next(r for r in results if r.check_id == "VAL-STR-01")
    assert str_check.status == "PASS"

