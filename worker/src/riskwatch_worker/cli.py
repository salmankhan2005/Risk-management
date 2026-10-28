import time
import click
from pathlib import Path
from .config import settings
from .jobs.orchestrator import run_generation_pipeline
from .jobs.claimer import claim_next_pending_job
from .persistence.batch_writer import get_connection

@click.group()
def cli():
    """RiskWatch background worker, deterministic generator, and validation lab CLI."""
    pass

@cli.command()
@click.option("--seed", default=settings.DEFAULT_SEED, help="Random seed for deterministic generation")
@click.option("--customers", default=1000, type=int, help="Target number of customers")
@click.option("--accounts", default=1400, type=int, help="Target number of accounts")
@click.option("--transactions", default=10000, type=int, help="Target number of transactions")
def generate(seed: str, customers: int, accounts: int, transactions: int):
    """Run deterministic generation, risk rules evaluation, anomaly injection, and exports."""
    click.echo(f"Starting deterministic generation with seed '{seed}'...")
    res = run_generation_pipeline(
        seed=seed,
        target_customers=customers,
        target_accounts=accounts,
        target_transactions=transactions
    )
    click.echo(click.style(f"[SUCCESS] Generation complete! Generated {res['transactions']} transactions, {res['alerts']} alerts, {res['cases']} cases.", fg="green"))

@cli.command()
def work():
    """Run continuous background worker loop claiming pending generation jobs."""
    click.echo(f"[*] RiskWatch worker {settings.WORKER_ID} started. Polling for pending jobs...")
    while True:
        try:
            conn = get_connection()
            conn.autocommit = True
            job = claim_next_pending_job(conn)
            conn.close()

            if job:
                click.echo(f"[+] Claimed job {job['id']} with seed {job['seed']}. Executing...")
                run_generation_pipeline(
                    seed=job["seed"],
                    target_customers=job["target_customers"],
                    target_accounts=job["target_accounts"],
                    target_transactions=job["target_transactions"],
                    job_id=job["id"]
                )
                click.echo(f"[✓] Job {job['id']} completed successfully.")
            else:
                time.sleep(3)
        except KeyboardInterrupt:
            click.echo("Worker shutting down.")
            break
        except Exception as e:
            click.echo(f"[!] Error in worker loop: {e}")
            time.sleep(5)

@cli.command()
@click.option("--seed", default=settings.DEFAULT_SEED, help="Seed to test reproducibility on")
def test_reproducibility(seed: str):
    """Runs generation twice with identical seed and asserts identical checksums."""
    click.echo(f"Testing reproducibility with seed '{seed}'...")
    dir1 = Path("exports/run1")
    dir2 = Path("exports/run2")

    from .generators.master_data import generate_master_dataset
    from .generators.transactions import generate_transactions_dataset
    from .exports.exporter import export_dataset_artifacts

    c1, _, a1, m1, d1, _ = generate_master_dataset(seed, 500, 700)
    tx1, _ = generate_transactions_dataset(seed, a1, m1, d1, 2000)
    chk1 = export_dataset_artifacts(dir1, seed, c1, a1, tx1, [], [], [], [], [])

    c2, _, a2, m2, d2, _ = generate_master_dataset(seed, 500, 700)
    tx2, _ = generate_transactions_dataset(seed, a2, m2, d2, 2000)
    chk2 = export_dataset_artifacts(dir2, seed, c2, a2, tx2, [], [], [], [], [])

    match = (chk1 == chk2)
    if match:
        click.echo(click.style("[PASS] Bit-for-bit reproducibility verified! All checksums match identically across both independent runs.", fg="green"))
    else:
        click.echo(click.style("[FAIL] Checksum mismatch between independent runs!", fg="red"))
        click.echo(f"Run 1: {chk1}")
        click.echo(f"Run 2: {chk2}")

if __name__ == "__main__":
    cli()
