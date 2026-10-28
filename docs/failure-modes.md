# RiskWatch Failure Modes Matrix

This matrix governs error detection, response codes, persistence behavior, retryability, and user-facing feedback across all system boundaries.

| Failure Trigger | Detection Layer | HTTP Code / Status | Persisted State | Retryable? | User-Visible Feedback | Observability & Audit Fields |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Malformed Payload / Invalid Enum** | Zod Schema Validation | `400 Bad Request` | No database write | No | Inline field validation error indicating invalid value. | `request_id`, `fieldErrors` |
| **Missing / Expired Auth Token** | Auth Middleware / Edge Gateway | `401 Unauthorized` | No state change | Yes (after refresh) | Redirect to `/sign-in` with session expired message. | `request_id`, `auth_error` |
| **Insufficient Role (e.g. Analyst publishing rule)** | API Role Guard / PostgreSQL RLS | `403 Forbidden` | Security event logged in `audit_events` | No | "You do not have permission to perform this administrative action." | `actor_id`, `required_role`, `attempted_action` |
| **Duplicate Mutation with Idempotency Key** | Database Unique Constraint on `idempotency_key` | `200 OK` (Idempotent Return) | Original committed record preserved; no duplicate insert | No (Completed) | Returns original successful response DTO seamlessly. | `idempotency_key`, `original_request_id` |
| **Concurrent Case Disposition Race** | Optimistic Lock (`version` / `updated_at`) in RPC | `409 Conflict` | Transaction aborted; case remains at prior state | Yes (after reload) | "Case was modified by another analyst. Please refresh and review latest status." | `case_id`, `expected_version`, `actual_version` |
| **Transaction on Closed Account** | Database Constraint / Posting Trigger | `422 Unprocessable` | Transaction rejected; balance unchanged | No | "Account ACC-... is closed and cannot accept postings." | `account_id`, `account_status`, `txn_id` |
| **Insufficient Balance (Overdraft Denied)** | Atomic RPC Balance Check | `422 Unprocessable` | Posting aborted | No | "Posting rejected: balance would breach overdraft limit." | `account_id`, `current_balance`, `attempted_amount` |
| **Transfer Legs Imbalance** | Transfer Reconciliation Invariant Check | `422 Unprocessable` | Transfer group marked `FAILED_RECONCILIATION` | No | "Transfer legs do not reconcile: debit leg does not match credit leg." | `transfer_id`, `debit_amount`, `credit_amount` |
| **Simulating Inactive / Retired Rule** | Rule Service Validator | `404 Not Found` | No simulation run | No | "Specified rule version is retired or does not exist." | `rule_id`, `rule_version` |
| **Worker Process Crash Mid-Batch** | Database Lease Timeout (`heartbeat_at < now() - 2m`) | Job remains `RUNNING` until lease reaper | Batch transaction rolled back; checkpoint restored | Yes (Automated) | Job progress bar displays "Worker lease renewed, resuming checkpoint." | `job_id`, `stage`, `checkpoint_batch_id` |
| **Job Cancellation Racing with Stage Completion** | Worker Cooperative Cancel Check | Job transitions to `CANCELLED` | Work up to last completed stage is preserved | No | "Job cancelled by administrator." | `job_id`, `cancelled_by`, `finished_at` |
| **Database Network Outage / Statement Timeout** | Database Driver / PgBouncer | `503 Service Unavailable` | Pending transaction rolled back | Yes (Exponential Backoff) | "Database temporarily unreachable. Please retry in a few moments." | `db_error_code`, `query_duration_ms` |
| **Invalid Anomaly Rejected by Constraint** | Test Fixture Validator | Assertion Pass in Test Suite | Anomaly isolated to test schema; production tables clean | No (Expected) | "Scenario verified: Database constraint prevented corrupted write." | `scenario_id`, `constraint_name` |
| **Unauthorized Ground Truth Query** | PostgreSQL RLS on `ground_truth_labels` | `403 Forbidden` / 0 rows returned | Unauthorized read blocked; audit logged | No | "Evaluation ground truth is restricted to authorized audit roles." | `actor_id`, `attempted_table: ground_truth_labels` |
| **Expired Export Download Link** | Storage Signed URL Verifier | `410 Gone` | Export metadata retained; file inaccessible | No (Regenerate) | "Download link has expired. Please request a new export." | `export_id`, `expired_at` |
| **Same-Seed Output Checksum Mismatch** | Reproducibility Pipeline Check | Test Failure / Job `FAILED` | Checksums recorded in `dataset_manifests` | No | "Reproducibility failure: Seed produced divergent dataset hash." | `seed`, `expected_hash`, `actual_hash` |

