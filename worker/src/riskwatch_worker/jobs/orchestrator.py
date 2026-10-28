import time
from typing import Dict, Any
from pathlib import Path
from ..config import settings
from ..domain.models import RiskEvaluation
from ..generators.master_data import generate_master_dataset
from ..generators.transactions import generate_transactions_dataset
from ..risk_engine.rules import evaluate_rules_and_generate_alerts
from ..anomaly_injection.scenarios import inject_negative_scenarios
from ..validation.suite import run_validation_suite
from ..exports.exporter import export_dataset_artifacts
from ..persistence.batch_writer import (
    get_connection, batch_insert_merchants, batch_insert_devices,
    batch_insert_customers, batch_insert_accounts,
    batch_insert_transactions, batch_insert_transfer_links,
    batch_insert_alerts, batch_insert_cases, batch_insert_ground_truth,
    persist_validation_run
)
from .claimer import update_job_progress, complete_job

def run_generation_pipeline(
    seed: str = settings.DEFAULT_SEED,
    target_customers: int = 1000,
    target_accounts: int = 1400,
    target_transactions: int = 10000,
    job_id: str = None
) -> Dict[str, Any]:
    """
    Executes the complete 13-stage deterministic generation pipeline.
    """
    conn = get_connection()
    conn.autocommit = True

    try:
        if job_id:
            update_job_progress(conn, job_id, "GENERATING_MASTER_DATA", 15)

        print(f"[*] Stage 1 & 2: Generating master dataset for seed '{seed}' ({target_customers} customers, {target_accounts} accounts)...")
        customers, kyc_profiles, accounts, merchants, devices, customer_devices = generate_master_dataset(
            seed=seed,
            target_customers=target_customers,
            target_accounts=target_accounts
        )

        if job_id:
            update_job_progress(conn, job_id, "PERSISTING_MASTER_DATA", 30, {"customers": len(customers), "accounts": len(accounts)})

        print("[*] Stage 3: Batch persisting merchants, devices, customers and accounts into Supabase PostgreSQL...")
        batch_insert_merchants(conn, merchants)
        batch_insert_devices(conn, devices)
        batch_insert_customers(conn, customers)
        batch_insert_accounts(conn, accounts)

        if job_id:
            update_job_progress(conn, job_id, "GENERATING_TRANSACTIONS", 45)

        print(f"[*] Stage 4 & 5: Generating {target_transactions} transactions with balanced ledger & transfer links...")
        transactions, transfer_links = generate_transactions_dataset(
            seed=seed,
            accounts=accounts,
            merchants=merchants,
            devices=devices,
            target_transactions=target_transactions
        )

        if job_id:
            update_job_progress(conn, job_id, "PERSISTING_TRANSACTIONS", 60, {"transactions": len(transactions)})

        print("[*] Stage 6: Persisting transactions and transfer legs...")
        batch_insert_transactions(conn, transactions)
        batch_insert_transfer_links(conn, transfer_links)

        if job_id:
            update_job_progress(conn, job_id, "EVALUATING_RULES", 70)

        print("[*] Stage 7 & 8: Evaluating 6 risk rules and generating alerts & cases...")
        evaluations, alerts, cases = evaluate_rules_and_generate_alerts(
            transactions=transactions,
            accounts=accounts,
            merchants=merchants,
            devices=devices,
            customer_devices=customer_devices,
            rule_versions={},
            seed=seed
        )

        if job_id:
            update_job_progress(conn, job_id, "INJECTING_ANOMALIES", 80, {"alerts": len(alerts)})

        print("[*] Stage 9: Injecting 5 controlled negative scenarios and isolating ground truth...")
        anomaly_manifest, ground_truth = inject_negative_scenarios(
            transactions=transactions,
            accounts=accounts,
            transfer_links=transfer_links,
            alerts=alerts,
            cases=cases
        )

        batch_insert_alerts(conn, alerts)
        batch_insert_cases(conn, cases)
        batch_insert_ground_truth(conn, seed, ground_truth)

        if job_id:
            update_job_progress(conn, job_id, "RUNNING_VALIDATION", 90)

        print("[*] Stage 10 & 11: Executing 20 validation checks across 5 integrity families...")
        validation_results = run_validation_suite(
            customers=customers,
            accounts=accounts,
            transactions=transactions,
            transfer_links=transfer_links,
            alerts=alerts,
            cases=cases
        )

        val_run_id = persist_validation_run(conn, seed, validation_results)

        print("[*] Stage 12: Exporting dataset artifacts, manifests, and computing SHA-256 checksums...")
        checksums = export_dataset_artifacts(
            output_dir=settings.EXPORT_DIR,
            seed=seed,
            customers=customers,
            accounts=accounts,
            transactions=transactions,
            alerts=alerts,
            cases=cases,
            anomaly_manifest=anomaly_manifest,
            validation_results=validation_results,
            ground_truth=ground_truth
        )

        if job_id:
            complete_job(conn, job_id, success=True)

        print(f"[SUCCESS] Pipeline complete! Export checksums: {list(checksums.keys())}")
        return {
            "seed": seed,
            "customers": len(customers),
            "accounts": len(accounts),
            "transactions": len(transactions),
            "alerts": len(alerts),
            "cases": len(cases),
            "anomalies": len(anomaly_manifest),
            "validation_run_id": val_run_id,
            "checksums": checksums
        }
    except Exception as e:
        if job_id:
            complete_job(conn, job_id, success=False, error_message=str(e))
        raise e
    finally:
        conn.close()
