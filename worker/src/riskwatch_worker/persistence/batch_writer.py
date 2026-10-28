import psycopg2
from psycopg2.extras import execute_values
from typing import List, Dict, Any
from ..config import settings
from ..domain.models import Customer, Account, Merchant, Device, Transaction, TransferLink, Alert, Case, AnomalyEntry, ValidationCheckResult

def get_connection():
    return psycopg2.connect(
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=settings.DB_NAME,
        sslmode=settings.DB_SSLMODE
    )

def batch_insert_merchants(conn, merchants: List[Merchant]):
    query = """
        INSERT INTO public.merchants (id, merchant_code, name, category_code, risk_level, country, is_high_risk)
        VALUES %s
        ON CONFLICT (merchant_code) DO NOTHING;
    """
    records = [
        (str(m.id), m.business_id, m.name, m.category, m.risk_category.upper(), m.country, m.is_high_risk)
        for m in merchants
    ]
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def batch_insert_devices(conn, devices: List[Device]):
    query = """
        INSERT INTO public.devices (id, fingerprint, ip_address, device_type, operating_system, is_vpn, is_tor, first_seen_at)
        VALUES %s
        ON CONFLICT (fingerprint) DO NOTHING;
    """
    records = [
        (str(d.id), d.fingerprint, d.ip_address, d.device_type, d.os, d.is_known_proxy, False, d.first_seen_at)
        for d in devices
    ]
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def batch_insert_customers(conn, customers: List[Customer]):
    query = """
        INSERT INTO public.customers (id, business_id, first_name, last_name, email, phone, country, risk_tier, created_at)
        VALUES %s
        ON CONFLICT (id) DO NOTHING;
    """
    records = [
        (str(c.id), c.business_id, c.first_name, c.last_name, c.email, c.phone, c.country, c.risk_tier, c.created_at)
        for c in customers
    ]
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def batch_insert_accounts(conn, accounts: List[Account]):
    query = """
        INSERT INTO public.accounts (id, business_id, primary_customer_id, account_type, currency, status, current_balance, overdraft_limit, allow_overdraft, opened_at, closed_at)
        VALUES %s
        ON CONFLICT (id) DO NOTHING;
    """
    records = [
        (str(a.id), a.business_id, str(a.primary_customer_id), a.account_type, a.currency, a.status, a.current_balance, a.overdraft_limit, a.allow_overdraft, a.opened_at, a.closed_at)
        for a in accounts
    ]
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def batch_insert_transactions(conn, transactions: List[Transaction]):
    if not transactions:
        return
    with conn.cursor() as cur:
        cur.execute("SELECT business_id FROM public.transactions;")
        existing_bus_id = {r[0] for r in cur.fetchall()}

    records = [
        (str(t.id), t.business_id, str(t.account_id), t.type, t.amount, t.signed_amount, t.currency, t.balance_before, t.balance_after, t.status, t.channel, str(t.merchant_id) if t.merchant_id else None, str(t.device_id) if t.device_id else None, t.idempotency_key, t.description, t.occurred_at)
        for t in transactions
        if t.business_id not in existing_bus_id
    ]
    if not records:
        print("[*] Transactions already synchronized in database.")
        return

    query = """
        INSERT INTO public.transactions (id, business_id, account_id, type, amount, signed_amount, currency, balance_before, balance_after, status, channel, merchant_id, device_id, idempotency_key, description, occurred_at)
        VALUES %s
        ON CONFLICT (id) DO NOTHING;
    """
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def batch_insert_transfer_links(conn, links: List[TransferLink]):
    query = """
        INSERT INTO public.transfer_links (id, transfer_group_id, source_transaction_id, destination_transaction_id, source_account_id, destination_account_id, amount, currency, status, linked_at)
        VALUES %s
        ON CONFLICT (id) DO NOTHING;
    """
    records = [
        (str(l.id), str(l.transfer_group_id), str(l.source_transaction_id), str(l.destination_transaction_id), str(l.source_account_id), str(l.destination_account_id), l.amount, l.currency, l.status, l.linked_at)
        for l in links
    ]
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def batch_insert_alerts(conn, alerts: List[Alert]):
    if not alerts:
        return
    with conn.cursor() as cur:
        cur.execute("SELECT deduplication_key, business_id FROM public.alerts;")
        existing = cur.fetchall()
        existing_dedup = {r[0] for r in existing}
        existing_bus_id = {r[1] for r in existing}

    records = [
        (str(a.id), a.business_id, str(a.account_id), str(a.customer_id), a.status, a.severity, a.aggregate_score, a.summary, a.deduplication_key, str(a.assigned_to) if a.assigned_to else None, a.created_at)
        for a in alerts
        if a.deduplication_key not in existing_dedup and a.business_id not in existing_bus_id
    ]
    if not records:
        print("[*] All alerts already synchronized in database.")
        return

    query = """
        INSERT INTO public.alerts (id, business_id, account_id, customer_id, status, severity, aggregate_score, summary, deduplication_key, assigned_to, created_at)
        VALUES %s
        ON CONFLICT (id) DO NOTHING;
    """
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def batch_insert_cases(conn, cases: List[Case]):
    if not cases:
        return
    with conn.cursor() as cur:
        cur.execute("SELECT business_id FROM public.cases;")
        existing_bus_id = {r[0] for r in cur.fetchall()}

    records = [
        (str(c.id), c.business_id, str(c.customer_id), c.title, c.status, c.severity, c.disposition, str(c.assigned_to) if c.assigned_to else None, c.version, c.opened_at, c.closed_at)
        for c in cases
        if c.business_id not in existing_bus_id
    ]
    if not records:
        print("[*] All cases already synchronized in database.")
        return

    query = """
        INSERT INTO public.cases (id, business_id, customer_id, title, status, severity, disposition, assigned_to, version, opened_at, closed_at)
        VALUES %s
        ON CONFLICT (id) DO NOTHING;
    """
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def batch_insert_ground_truth(conn, seed: str, ground_truth: List[Dict[str, Any]]):
    query = """
        INSERT INTO public.ground_truth_labels (dataset_seed, entity_type, entity_id, true_risk_label, scenario_provenance)
        VALUES %s
        ON CONFLICT (dataset_seed, entity_type, entity_id) DO NOTHING;
    """
    records = [
        (seed, gt["entity_type"], gt["entity_id"], "ANOMALOUS" if gt.get("is_anomaly") else "BENIGN", gt.get("scenario", "BASELINE"))
        for gt in ground_truth
    ]
    with conn.cursor() as cur:
        execute_values(cur, query, records, page_size=1000)

def persist_validation_run(conn, seed: str, results: List[ValidationCheckResult], job_id: str = None) -> str:
    total = len(results)
    passed = sum(1 for r in results if r.status == "PASS")
    failed = sum(1 for r in results if r.status == "FAIL")
    overall_status = "PASSED" if failed == 0 else "FAILED"

    import json
    metrics = {
        "dataset_seed": seed,
        "total_checks": total,
        "passed_checks": passed,
        "failed_checks": failed,
    }

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO public.validation_runs (job_id, status, total_checks, passed_checks, failed_checks, summary_metrics, executed_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (
                job_id if job_id else None,
                overall_status,
                total,
                passed,
                failed,
                json.dumps(metrics),
                "riskwatch-worker"
            )
        )
        run_id = cur.fetchone()[0]

        query = """
            INSERT INTO public.validation_results (run_id, check_code, name, category, severity, status, message, violation_count, details)
            VALUES %s;
        """
        records = [
            (
                str(run_id),
                r.check_id,
                r.name,
                r.category,
                r.severity,
                "PASSED" if r.status == "PASS" else "FAILED",
                r.details,
                r.failed_count,
                json.dumps({"sample_failed_ids": r.sample_failed_ids})
            )
            for r in results
        ]
        execute_values(cur, query, records)
        return str(run_id)
