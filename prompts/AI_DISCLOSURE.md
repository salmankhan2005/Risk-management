# AI Assistance & Technical Disclosure

Submitted in compliance with **Section 03 (Use LLMs Transparently)** and **Section 04 (Make Your Reasoning Visible)** of the **YottaFlex AI Candidate Project Submission Guidelines**.

---

## 1. Executive Summary of AI Usage

In developing **RiskWatch**, AI coding assistants (including Claude and Gemini via the Antigravity pairing environment) were utilized as staff-level collaborative tools to accelerate boilerplate generation, draft PostgreSQL schemas, generate synthetic sampling functions, and construct comprehensive documentation.

All architectural decisions, database schemas, stored procedures, mathematical reconciliation formulas, and validation assertions were **personally reviewed, engineered, debugged, and verified**.

---

## 2. Where AI Accelerated the Work

| Engineering Domain | AI Role & Acceleration | Human Engineering & Review |
|---|---|---|
| **SQL Migrations & DDL** | Drafted initial table definitions from specification. | Engineered PostgreSQL composite indexes, explicit `SECURITY DEFINER` constraints, atomic RPC rollback guarantees, and `supabase_realtime` logical replication publication. |
| **Contract DTOs & Zod Schemas** | Generated repetitive TypeScript interface shapes and Zod schemas. | Enforced strict boundary contracts, validated pagination invariants, allowlisted sort keys, and established standardized `ApiSuccess<T>` and `ApiError` envelopes. |
| **Python Worker Boilerplate** | Generated dataclass models and initial Click CLI scaffolding. | Replaced random assignment with deterministic seed formulas (`uuid.uuid5`), developed sliding-window velocity queues, double-entry arithmetic invariants, and bit-for-bit checksum calculation. |
| **Documentation & ADRs** | Scaffolded Markdown structure for ADRs, architecture diagrams, and data dictionary. | Defined exact trade-offs, documented 16 operational failure modes, and established the comprehensive data dictionary adhering to the problem statement. |

---

## 3. Key Technical Decisions, Trade-Offs & Reasoning

### A. Modular Monolith vs. Microservices
* **Decision:** We structured RiskWatch as a **modular monolith** with Next.js App Router for both presentation and REST API endpoints (`/api/v1`), paired with an independent high-throughput Python worker for batch generation.
* **Why:** For an analyst workbench and risk surveillance platform, introducing separate Express/Fastify microservices creates premature network latency, serialization overhead, and distributed transaction complexity. Supabase Edge Functions and Next.js route handlers provide zero-latency access with full TypeScript type sharing from `@/packages/contracts`.

### B. Strict Signed-Amount Double-Entry Semantics
* **Decision:** Debits are stored as negative numbers (`signed_amount < 0`), credits as positive (`signed_amount > 0`).
* **Why:** In financial transaction monitoring, ambiguous sign semantics lead to reconciliation bugs. Using signed amounts guarantees that the ledger invariant `balance_before + signed_amount = balance_after` is mathematically unambiguous and checkable with a single database constraint.

### C. Isolated Ground Truth vs. Feature Contamination
* **Decision:** The 5 controlled negative test fixtures (`ANOMALY-01` to `ANOMALY-05`) are exported to a separate `ground_truth.json` file and stored in `public.ground_truth_records`.
* **Why:** In production risk systems, leaking anomaly labels into feature tables creates target leakage during model training and evaluation. The risk engine evaluates transactions blind to the ground truth, and the Validation Lab compares outcomes independently.

### D. Optimistic Concurrency Control on Case Triage
* **Decision:** Case updates, assignments, and dispositions require an `expectedVersion` parameter matched against `cases.version`.
* **Why:** When multiple fraud analysts review high-priority queues simultaneously, last-write-wins leads to silent overwrites of notes or dispositions. The atomic RPC `rpc_record_case_disposition` aborts with an error if the case was modified concurrently.

---

## 4. What Was Personally Debugged, Changed & Validated

During the build and integration process, several non-trivial issues arose that required hands-on diagnosis and resolution:

1. **Next.js 15 Webpack 5 Module Concatenation Crash:**
   * *Issue:* `npm run build` failed with `Unexpected end of JSON input` during client asset minification.
   * *Resolution:* Traced to Webpack 5 module concatenation bugs in Next.js 15.5. Disabled `concatenateModules` in `next.config.ts`, restoring clean compilation across all 37 routes.
2. **Missing Not-Found Route Boundary:**
   * *Issue:* Build failed with `Invariant: no direct app page entry found for /_not-found`.
   * *Resolution:* Authored `app/not-found.tsx` to satisfy Next.js 15 App Router requirements.
3. **Clerk Auth Hydration Deadlock in Browser:**
   * *Issue:* The UI was stuck on `"Loading your RiskWatch workspace..."` because unauthenticated visits waited indefinitely on Clerk's async SDK initialization.
   * *Resolution:* Refactored `lib/store.tsx` to optimistically initialize demo mode (`loadedWorkspaceId = 'demo'`) immediately on mount. If a user is not signed in, the full dashboard loads with zero latency.
4. **PostgreSQL IPv6 Connection Timeout & Special Character URI Parsing:**
   * *Issue:* Python `psycopg2` failed connecting via connection strings containing special characters (`@`) in the database password and IPv6 socket timeouts.
   * *Resolution:* Standardized worker configuration to use explicit connection parameters (`host`, `user`, `password`, `port`, `sslmode='require'`).
5. **Realtime WebSocket Replication Enablement:**
   * *Issue:* Supabase Realtime was not streaming database updates because the tables were not added to the publication.
   * *Resolution:* Authored migration `20261028160000_enable_realtime.sql` adding `alerts`, `cases`, `transactions`, and `generation_jobs` to `supabase_realtime`, and built `useRealtimeSubscription` for live browser updates.

---

## 5. How We Know the Solution Works

Verification was performed through rigorous, executable automated testing rather than manual assumption:
* **TypeScript & ESLint:** `npm run lint` (`tsc --noEmit`) passes with **0 errors**.
* **Next.js Production Build:** `npm run build` compiles **37/37 static and dynamic routes** with Exit 0.
* **Worker Test Suite:** `pytest worker/tests` passes **5/5 tests** covering determinism, double-entry reconciliation, and rule firing.
* **Bit-for-Bit Reproducibility:** `python -m riskwatch_worker.cli test-reproducibility` independently executes two complete pipelines with seed `20261022` and verifies SHA-256 checksum equality across all manifests and tables.
* **Live Database Connectivity:** Dev server queries live aggregates from Supabase PostgreSQL (`http://localhost:3000/api/v1/dashboard/summary`) with HTTP 200 responses.

