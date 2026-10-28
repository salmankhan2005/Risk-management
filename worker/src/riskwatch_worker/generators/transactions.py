import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Tuple, Dict
from ..domain.models import Account, Merchant, Device, Transaction, TransferLink

CHANNELS = ["API", "WEB", "MOBILE_APP", "POS", "ATM"]

def generate_transactions_dataset(
    seed: str,
    accounts: List[Account],
    merchants: List[Merchant],
    devices: List[Device],
    target_transactions: int = 100000
) -> Tuple[List[Transaction], List[TransferLink]]:
    """
    Deterministically generates transactions and transfers, maintaining balance reconciliation
    for every account.
    """
    rng = random.Random(seed + "_txns")

    # Map of running balances
    account_balances: Dict[uuid.UUID, Decimal] = {
        acc.id: acc.current_balance for acc in accounts
    }
    account_map: Dict[uuid.UUID, Account] = {acc.id: acc for acc in accounts}

    transactions: List[Transaction] = []
    transfer_links: List[TransferLink] = []

    start_date = datetime(2026, 9, 1, 0, 0, 0, tzinfo=timezone.utc)
    end_date = datetime(2026, 10, 22, 23, 59, 59, tzinfo=timezone.utc)
    total_seconds = int((end_date - start_date).total_seconds())

    txn_counter = 1

    # Generate transactions in chronological batches or random distributed timestamps
    # To keep accounts monotonic in time, we sort afterwards or generate per-account chronological steps.
    # To ensure balance_after = balance_before + signed_amount strictly, we track per-account chronological events.

    # Pre-allocate transaction slots across accounts
    num_accounts = len(accounts)

    while len(transactions) < target_transactions:
        # Choose transaction type: 70% Purchase/POS/ATM (Debit/Credit), 30% Account-to-Account Transfer
        is_transfer = (rng.random() < 0.3) and (num_accounts > 1)

        time_offset = rng.randint(0, total_seconds)
        occurred_at = start_date + timedelta(seconds=time_offset)

        if not is_transfer:
            acc = rng.choice(accounts)
            curr_bal = account_balances[acc.id]

            # 60% debit, 40% credit (deposits/salary/refunds)
            is_debit = (rng.random() < 0.6)
            amount_val = Decimal(str(rng.randint(100, 25000)))

            if is_debit:
                # Check overdraft constraint
                min_allowed = -acc.overdraft_limit if acc.allow_overdraft else Decimal("0.00")
                if (curr_bal - amount_val) < min_allowed:
                    # Switch to a credit deposit to restore liquidity
                    is_debit = False

            if is_debit:
                signed_amount = -amount_val
                new_bal = curr_bal + signed_amount
                ttype = "DEBIT"
                merchant = rng.choice(merchants)
            else:
                signed_amount = amount_val
                new_bal = curr_bal + signed_amount
                ttype = "CREDIT"
                merchant = None

            account_balances[acc.id] = new_bal

            t_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_txn_{txn_counter}")
            txn = Transaction(
                id=t_id,
                business_id=f"TXN-2026-{txn_counter:08d}",
                account_id=acc.id,
                type=ttype,
                amount=amount_val,
                signed_amount=signed_amount,
                currency=acc.currency,
                balance_before=curr_bal,
                balance_after=new_bal,
                status="POSTED",
                channel=rng.choice(CHANNELS),
                merchant_id=merchant.id if merchant else None,
                device_id=rng.choice(devices).id,
                idempotency_key=f"idem_{t_id}",
                description=f"{ttype} via {merchant.name if merchant else 'Direct Deposit'}",
                occurred_at=occurred_at
            )
            transactions.append(txn)
            txn_counter += 1

        else:
            # Transfer between two distinct accounts
            source_acc, dest_acc = rng.sample(accounts, 2)
            src_bal = account_balances[source_acc.id]
            dest_bal = account_balances[dest_acc.id]

            amount_val = Decimal(str(rng.randint(500, 50000)))
            min_src_allowed = -source_acc.overdraft_limit if source_acc.allow_overdraft else Decimal("0.00")

            if (src_bal - amount_val) < min_src_allowed:
                # Adjust amount to fit available funds or skip
                amount_val = Decimal(str(max(100, int((src_bal - min_src_allowed) * Decimal("0.5")))))
                if (src_bal - amount_val) < min_src_allowed:
                    continue

            # Debit Leg on source
            src_signed = -amount_val
            src_new_bal = src_bal + src_signed
            account_balances[source_acc.id] = src_new_bal

            # Credit Leg on destination
            dest_signed = amount_val
            dest_new_bal = dest_bal + dest_signed
            account_balances[dest_acc.id] = dest_new_bal

            t1_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_txn_{txn_counter}")
            debit_txn = Transaction(
                id=t1_id,
                business_id=f"TXN-2026-{txn_counter:08d}",
                account_id=source_acc.id,
                type="DEBIT",
                amount=amount_val,
                signed_amount=src_signed,
                currency=source_acc.currency,
                balance_before=src_bal,
                balance_after=src_new_bal,
                status="POSTED",
                channel="API",
                merchant_id=None,
                device_id=rng.choice(devices).id,
                idempotency_key=f"idem_{t1_id}",
                description=f"Transfer to {dest_acc.business_id}",
                occurred_at=occurred_at
            )
            transactions.append(debit_txn)
            txn_counter += 1

            if len(transactions) >= target_transactions:
                break

            t2_id = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_txn_{txn_counter}")
            credit_txn = Transaction(
                id=t2_id,
                business_id=f"TXN-2026-{txn_counter:08d}",
                account_id=dest_acc.id,
                type="CREDIT",
                amount=amount_val,
                signed_amount=dest_signed,
                currency=dest_acc.currency,
                balance_before=dest_bal,
                balance_after=dest_new_bal,
                status="POSTED",
                channel="API",
                merchant_id=None,
                device_id=None,
                idempotency_key=f"idem_{t2_id}",
                description=f"Transfer from {source_acc.business_id}",
                occurred_at=occurred_at + timedelta(seconds=2)
            )
            transactions.append(credit_txn)
            txn_counter += 1

            # Transfer Link
            trf_group = uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_trfgroup_{txn_counter}")
            trf_link = TransferLink(
                id=uuid.uuid5(uuid.NAMESPACE_DNS, f"{seed}_trflink_{txn_counter}"),
                transfer_group_id=trf_group,
                source_transaction_id=debit_txn.id,
                destination_transaction_id=credit_txn.id,
                source_account_id=source_acc.id,
                destination_account_id=dest_acc.id,
                amount=amount_val,
                currency=source_acc.currency,
                status="RECONCILED",
                linked_at=occurred_at + timedelta(seconds=2)
            )
            transfer_links.append(trf_link)

    # Update final account current_balance in the accounts list
    for acc in accounts:
        if acc.id in account_balances:
            acc.current_balance = account_balances[acc.id]

    return transactions, transfer_links

