
# RiskWatch — Financial Risk Intelligence & Analyst Workbench

RiskWatch is a full-stack financial-risk monitoring, transaction anomaly detection, and analyst investigation workbench built for enterprise fraud surveillance and regulatory compliance teams.

Designed with transparent, versioned risk rules and deterministic synthetic data generation, RiskWatch guarantees complete explainability—every alert and case is mathematically traceable back to source ledger transactions, device fingerprints, and rule evaluations.

---

## 🏛 System Architecture

RiskWatch is structured as a **modular monolith** with strong separation of concerns across presentation, request-oriented APIs, persistence, and background batch processing:

```text
                                  +---------------------------------------+
                                  |         Next.js App Router UI         |
                                  |   (Analyst Workbench & Dashboard)     |
                                  +-------------------+-------------------+
                                                      |
                                                      v  (Typed API Client / contracts DTOs)
+---------------------------------------------------------------------------------------------------+
|                                      HTTP API Layer (/api/v1)                                     |
|  - Auth & Profile (/me)           - Rules & Versioning (/rules)     - Generation Jobs (/jobs)     |
|  - Dashboard Summary (/dashboard) - Transactions (/transactions)    - Validation Lab (/validation)|
|  - Alerts & Evidence (/alerts)    - Customers & Accounts            - Manifest Exports (/exports) |
|  - Cases & Triage (/cases)        - Audit Trail (/audit-events)                                   |
+---------------------------------------------------------------------------------------------------+
                                                      |
                                                      v  (RPCs / Row Level Security)
+---------------------------------------------------------------------------------------------------+
|                                    Supabase PostgreSQL Engine                                     |
|  33 Tables | 20+ Composite Indexes | Atomic Stored Procedures | Realtime Updates | Security Definer |
|  - rpc_record_case_disposition    - rpc_assign_case                 - rpc_publish_risk_rule       |
+---------------------------------------------------------------------------------------------------+
                                                      ^
                                                      |  (psycopg2 batch writer / atomic claims)
+---------------------------------------------------------------------------------------------------+
|                                 Python High-Throughput Worker                                     |
|  Deterministic Master Data (seed: 20261022) | Sliding-Window Risk Engine (6 Rules)                |
|  5 Injected Anomaly Scenarios               | 20-Check Invariant Validation Suite                 |
|  Cryptographic Manifests (SHA-256)          | Bit-for-Bit Reproducibility CLI                      |
+---------------------------------------------------------------------------------------------------+
```

---

## 🛠 Technology Stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, Custom Financial Theme CSS System, Lucide Icons, Custom Charts.
- **Contracts & Validation:** Shared DTOs (`packages/contracts`), Zod runtime schema validation, typed API client (`lib/api/`).
- **Database & Identity:** Supabase PostgreSQL, Clerk Auth & Supabase RLS integration, atomic RPCs (`PL/pgSQL`), DB views (`v_dashboard_summary`).
- **Background Worker:** Python 3.8+, Click CLI, `psycopg2` batch pipeline, Pandas/NumPy deterministic sampling, `pytest`.
- **Testing:** Unit tests, integration tests, invariant validation suite, cryptographic reproducibility checks.

---

## 🔬 Risk Rules Engine

RiskWatch implements 6 deterministic, versioned risk rules with full evidence payloads:

| Rule Code | Category | Name | Detection Logic | Evidence Captured |
|---|---|---|---|---|
| `RULE-VEL-01` | Velocity | Transaction Velocity Spike | Triggered when > 5 debits occur within a 60-minute sliding window on the same account. | Transaction count in window, window duration, threshold snapshot. |
| `RULE-DEV-01` | Device | New Device Activity | Flags high-value transactions originating from unrecognized hardware fingerprints or known proxies/VPNs. | Hardware fingerprint, IP address, proxy flag, customer known devices. |
| `RULE-CYC-01` | Topology | Circular Transfer Analysis | Identifies circular funds flow structured across intermediate accounts returning to source. | Transfer group ID, route leg trace, cycle completion timestamp. |
| `RULE-DOR-01` | Lifecycle | Dormant Account Reactivation | Detects sudden high-value debits (> INR 5,000) on accounts with zero transactional activity for over 180 days. | Consecutive inactive days, dormant threshold (180d), debit amount. |
| `RULE-LRG-01` | Amount | Large Amount Outlier | Flags single debit transactions exceeding institutional threshold (INR 100,000.00). | Absolute amount, threshold snapshot, currency code. |
| `RULE-MER-01` | Merchant | Unusual Merchant Activity | Identifies transactions routed to high-risk merchant categories (crypto OTC, offshore gaming, unverified escrow). | Merchant code, category code (ELEC, JEWL, GAMB), risk tier. |

---

## 🧪 Ground Truth & Negative Testing Scenarios

Unlike mock dashboards that simulate random data, RiskWatch injects **5 controlled negative fixtures** into the synthetic generation run and isolates them in a dedicated Ground Truth registry:

1. **`ANOMALY-01` (Transaction on Closed Account):** Transaction timestamp occurs after `accounts.closed_at`. Detected by `VAL-ACC-01`.
2. **`ANOMALY-02` (Unauthorized Negative Balance):** Account maintains negative balance without overdraft authorization. Detected by `VAL-BAL-02`.
3. **`ANOMALY-03` (Imbalanced Transfer Legs):** Source debit leg amount does not reconcile with destination credit leg amount. Detected by `VAL-TRF-01`.
4. **`ANOMALY-04` (Orphan Alert Without Evidence):** Alert row exists with no underlying triggering risk evaluation or transaction evidence. Detected by `VAL-ALT-02`.
5. **`ANOMALY-05` (Retro-dated Case Disposition):** Case disposition timestamp strictly precedes the initiating alert creation date. Detected by `VAL-CASE-03`.

The **Validation Lab** runs 20 automated checks across 5 integrity families (`ACCOUNT`, `BALANCE`, `TRANSFER`, `ALERT`, `CASE`) and reports exact violation counts against isolated ground truth.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ and npm
- Python 3.8+ (with `pip`)
- Supabase PostgreSQL project

### 2. Environment Configuration
Create `.env` in the root directory:
```env
# Database Connection String
CONNECTION_STRING=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Supabase API
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[ANON_KEY]

# Clerk Authentication (Optional for demo exploration)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Database Migrations
Migrations are managed in `supabase/migrations/`:
- `20261028120000_core_schema.sql`: 33 tables, enums, RLS policies, core RPCs.
- `20261028130000_additional_rpcs.sql`: Composite indexes, `rpc_assign_case`, `v_dashboard_summary`.
- `20261028140000_rule_publication.sql`: `rpc_publish_risk_rule` atomic version publication.
- `20261028150000_allow_anon_read.sql`: Anonymous monitoring read permissions.

### 4. Running the Web Application
```bash
# Install dependencies
npm install

# Start local Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Test Suites

Execute all system invariant, schema, and Python worker unit tests:

```bash
# 1. Run Node.js contract & ledger invariant test suite + TypeScript typecheck
npm test

# 2. Run Python worker risk rules, determinism & validation test suite
pytest worker/tests

# 3. Verify cryptographic bit-for-bit dataset reproducibility (Seed: 20261022)
python -m riskwatch_worker.cli test-reproducibility
```

### 6. Running the Python Background Worker (Batch Generation & Queues)
```bash
# Generate full synthetic dataset and stream to Supabase
python -m riskwatch_worker.cli generate --seed 20261022 --customers 500 --accounts 700 --transactions 5000

# Start background queue poller
python -m riskwatch_worker.cli work
```

---

## 📊 API Specification Summary

All endpoints conform to standardized envelopes: `ApiSuccess<T>` and `ApiError`.

```typescript
// Standard API Envelope
interface ApiSuccess<T> {
  data: T;
  meta: {
    requestId: string;
    nextCursor?: string | null;
    hasMore?: boolean;
    totalCount?: number;
  };
}
```

Key endpoints:
- `GET /api/v1/dashboard/summary`: High-performance summary aggregates from PostgreSQL view.
- `GET /api/v1/alerts`: Paginated alert queue filtered by severity, status, or date.
- `GET /api/v1/cases`: Investigation workbench cases with linked alert counts.
- `POST /api/v1/cases/:id/disposition`: Atomic disposition recording via `rpc_record_case_disposition`.
- `POST /api/v1/cases/:id/assign`: Atomic analyst assignment with optimistic concurrency lock.
- `GET /api/v1/rules`: Active risk rules with parameter configurations.
- `POST /api/v1/rules/:id/versions`: Immutable rule publication via `rpc_publish_risk_rule`.
- `POST /api/v1/jobs/generation`: Triggers background dataset generation returning `202 Accepted`.
- `GET /api/v1/validation-runs`: Validation suite results and scenario pass/fail matrices.
- `GET /api/v1/exports`: Downloadable dataset manifests and SHA-256 checksums.

---

## 🔒 Security & Concurrency Design

- **Optimistic Concurrency Control:** Case assignments and dispositions require `expectedVersion` checking against `cases.version`, preventing overwrite collisions between concurrent analysts.
- **Append-Only Audit Trail:** Every status change, assignment, note addition, and rule version publication writes an immutable entry into `audit_events` and `analyst_actions`.
- **Row Level Security (RLS):** Supabase RLS enforces strict tenancy and role policies on all tables.
- **No Secrets in Frontend:** Database service-role credentials and worker database passwords remain exclusively in server environment variables.
- **Strict Signed-Amount Semantics:** Debits are stored as negative signed amounts (`signed_amount < 0`), credits as positive (`signed_amount > 0`), maintaining zero-sum transfer leg invariance.

---

## 🤖 AI Transparency & Prompt History

In compliance with the **YottaFlex AI Candidate Project Submission Guidelines (Sections 03 & 04)**, this project openly documents all prompt sequences and technical reasoning:

- **Prompt History:** This prompt history will help to build this application. These prompts are used in this application across planning, schema design, rules engine implementation, and validation: [`prompts/PROMPT_HISTORY.md`](prompts/PROMPT_HISTORY.md)
- **AI Disclosure & Reasoning:** Detailed account of AI acceleration, human engineering, architectural trade-offs, and verified invariants: [`prompts/AI_DISCLOSURE.md`](prompts/AI_DISCLOSURE.md)
- **Data Dictionary:** Schema, constraints, units, and validation rules for all 10 core entities: [`docs/data-dictionary.md`](docs/data-dictionary.md)
- **System Architecture & ADRs:** End-to-end architecture documentation and decision records: [`docs/architecture.md`](docs/architecture.md) & [`docs/adr/`](docs/adr/)

---

## 📄 License
MIT License. Created for production-grade financial surveillance portfolio evaluation.
