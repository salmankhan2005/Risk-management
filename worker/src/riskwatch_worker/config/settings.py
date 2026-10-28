import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in root workspace directory
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

class WorkerSettings:
    DB_USER = os.getenv("POSTGRES_USER", "postgres")
    DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "Salmanvahith@2005")
    DB_HOST = os.getenv("POSTGRES_HOST", "db.ukhxxiuguhqbynkgcdus.supabase.co")
    DB_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
    DB_NAME = os.getenv("POSTGRES_DB", "postgres")
    DB_SSLMODE = os.getenv("POSTGRES_SSLMODE", "require")

    DEFAULT_SEED = "20261022"
    DEFAULT_CUSTOMERS = 5000
    DEFAULT_ACCOUNTS = 7000
    DEFAULT_TRANSACTIONS = 100000

    BATCH_SIZE = 1000
    WORKER_ID = os.getenv("WORKER_ID", f"worker-{os.getpid()}")
    EXPORT_DIR = ROOT_DIR / "exports"

settings = WorkerSettings()

