import pytest
from riskwatch_worker.generators.master_data import generate_master_dataset
from riskwatch_worker.generators.transactions import generate_transactions_dataset

def test_identical_seed_produces_identical_customers():
    c1, _, a1, _, _, _ = generate_master_dataset("20261022", 100, 150)
    c2, _, a2, _, _, _ = generate_master_dataset("20261022", 100, 150)

    assert len(c1) == len(c2) == 100
    for i in range(100):
        assert c1[i].id == c2[i].id
        assert c1[i].business_id == c2[i].business_id
        assert c1[i].first_name == c2[i].first_name
        assert c1[i].email == c2[i].email
        assert c1[i].risk_tier == c2[i].risk_tier

def test_different_seed_produces_different_dataset():
    c1, _, _, _, _, _ = generate_master_dataset("seed_alpha", 50, 75)
    c2, _, _, _, _, _ = generate_master_dataset("seed_beta", 50, 75)

    assert c1[0].id != c2[0].id

def test_balance_reconciliation_invariant():
    _, _, accounts, merchants, devices, _ = generate_master_dataset("20261022", 50, 75)
    txns, links = generate_transactions_dataset("20261022", accounts, merchants, devices, 500)

    assert len(txns) == 500
    for t in txns:
        assert t.balance_after == t.balance_before + t.signed_amount
        if t.type == "DEBIT":
            assert t.signed_amount == -t.amount
        elif t.type == "CREDIT":
            assert t.signed_amount == t.amount

