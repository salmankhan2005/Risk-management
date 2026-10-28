import json
import hashlib
import csv
from pathlib import Path
from typing import List, Dict, Any
from ..domain.models import Customer, Account, Transaction, Alert, Case, AnomalyEntry, ValidationCheckResult

def compute_sha256(file_path: Path) -> str:
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def export_dataset_artifacts(
    output_dir: Path,
    seed: str,
    customers: List[Customer],
    accounts: List[Account],
    transactions: List[Transaction],
    alerts: List[Alert],
    cases: List[Case],
    anomaly_manifest: List[AnomalyEntry],
    validation_results: List[ValidationCheckResult],
    ground_truth: List[Dict[str, Any]]
) -> Dict[str, str]:
    """
    Exports all required dataset files, CSV tables, manifests, and checksums.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_checksums: Dict[str, str] = {}

    # 1. Anomaly Manifest JSON
    anomaly_path = output_dir / "anomaly_manifest.json"
    anomaly_data = [
        {
            "scenarioId": a.scenario_id,
            "scenarioName": a.scenario_name,
            "targetEntityType": a.target_entity_type,
            "targetEntityId": a.target_entity_id,
            "targetBusinessId": a.target_business_id,
            "expectedValidator": a.expected_validator,
            "expectedResult": a.expected_result,
            "metadata": a.metadata
        }
        for a in anomaly_manifest
    ]
    with open(anomaly_path, "w", encoding="utf-8") as f:
        json.dump(anomaly_data, f, indent=2)
    manifest_checksums["anomaly_manifest.json"] = compute_sha256(anomaly_path)

    # 2. Validation Summary JSON
    val_path = output_dir / "validation_summary.json"
    val_data = {
        "datasetSeed": seed,
        "totalChecks": len(validation_results),
        "passedChecks": sum(1 for v in validation_results if v.status == "PASS"),
        "failedChecks": sum(1 for v in validation_results if v.status == "FAIL"),
        "warningChecks": sum(1 for v in validation_results if v.status == "WARNING"),
        "checks": [
            {
                "checkId": v.check_id,
                "category": v.category,
                "name": v.name,
                "status": v.status,
                "severity": v.severity,
                "details": v.details,
                "failedCount": v.failed_count,
                "sampleFailedIds": v.sample_failed_ids
            }
            for v in validation_results
        ]
    }
    with open(val_path, "w", encoding="utf-8") as f:
        json.dump(val_data, f, indent=2)
    manifest_checksums["validation_summary.json"] = compute_sha256(val_path)

    # 3. Ground Truth JSON
    gt_path = output_dir / "ground_truth.json"
    with open(gt_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, indent=2)
    manifest_checksums["ground_truth.json"] = compute_sha256(gt_path)

    # 4. Transactions CSV (sample or full)
    tx_csv_path = output_dir / "transactions.csv"
    with open(tx_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "business_id", "account_id", "type", "amount", "signed_amount", "currency", "balance_before", "balance_after", "status", "occurred_at"])
        for t in transactions[:10000]:  # Export top 10k to CSV
            writer.writerow([str(t.id), t.business_id, str(t.account_id), t.type, str(t.amount), str(t.signed_amount), t.currency, str(t.balance_before), str(t.balance_after), t.status, t.occurred_at.isoformat()])
    manifest_checksums["transactions.csv"] = compute_sha256(tx_csv_path)

    # 5. Reproducibility Report & Dataset Manifest
    manifest_path = output_dir / "dataset_manifest.json"
    manifest_content = {
        "generatorVersion": "1.0.0",
        "datasetSeed": seed,
        "counts": {
            "customers": len(customers),
            "accounts": len(accounts),
            "transactions": len(transactions),
            "alerts": len(alerts),
            "cases": len(cases),
            "anomalies": len(anomaly_manifest)
        },
        "checksums": manifest_checksums
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_content, f, indent=2)
    manifest_checksums["dataset_manifest.json"] = compute_sha256(manifest_path)

    return manifest_checksums

