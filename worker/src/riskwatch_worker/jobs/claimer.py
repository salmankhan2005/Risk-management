import psycopg2
from typing import Optional, Dict, Any
from ..config import settings

def claim_next_pending_job(conn) -> Optional[Dict[str, Any]]:
    """
    Atomically claims the next pending generation job using SELECT ... FOR UPDATE SKIP LOCKED.
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, seed, target_customers, target_accounts, target_transactions, status
            FROM public.generation_jobs
            WHERE status = 'PENDING'
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1;
            """
        )
        row = cur.fetchone()
        if not row:
            return None

        job_id, seed, target_cust, target_acc, target_txn, status = row

        # Transition job to RUNNING
        cur.execute(
            """
            UPDATE public.generation_jobs
            SET status = 'RUNNING',
                started_at = NOW(),
                worker_id = %s,
                current_stage = 'CLAIMED',
                progress_percent = 5
            WHERE id = %s;
            """,
            (settings.WORKER_ID, str(job_id))
        )
        return {
            "id": str(job_id),
            "seed": seed or settings.DEFAULT_SEED,
            "target_customers": target_cust or settings.DEFAULT_CUSTOMERS,
            "target_accounts": target_acc or settings.DEFAULT_ACCOUNTS,
            "target_transactions": target_txn or settings.DEFAULT_TRANSACTIONS
        }

def update_job_progress(conn, job_id: str, stage: str, progress: int, counts: Optional[Dict[str, int]] = None):
    with conn.cursor() as cur:
        if counts:
            cur.execute(
                """
                UPDATE public.generation_jobs
                SET current_stage = %s,
                    progress_percent = %s,
                    generated_customers = COALESCE(%s, generated_customers),
                    generated_accounts = COALESCE(%s, generated_accounts),
                    generated_transactions = COALESCE(%s, generated_transactions),
                    generated_alerts = COALESCE(%s, generated_alerts),
                    lease_heartbeat = NOW()
                WHERE id = %s;
                """,
                (
                    stage, progress,
                    counts.get("customers"), counts.get("accounts"),
                    counts.get("transactions"), counts.get("alerts"),
                    job_id
                )
            )
        else:
            cur.execute(
                """
                UPDATE public.generation_jobs
                SET current_stage = %s,
                    progress_percent = %s,
                    lease_heartbeat = NOW()
                WHERE id = %s;
                """,
                (stage, progress, job_id)
            )

def complete_job(conn, job_id: str, success: bool, error_message: Optional[str] = None):
    with conn.cursor() as cur:
        status = "COMPLETED" if success else "FAILED"
        progress = 100 if success else 0
        cur.execute(
            """
            UPDATE public.generation_jobs
            SET status = %s,
                current_stage = %s,
                progress_percent = %s,
                completed_at = NOW(),
                error_message = %s
            WHERE id = %s;
            """,
            (status, "COMPLETED" if success else "FAILED", progress, error_message, job_id)
        )

