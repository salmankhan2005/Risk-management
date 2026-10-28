# RiskWatch Data Dictionary

This document defines the schema, data types, constraints, allowed values, units, and integrity rules for all entities across the RiskWatch platform in accordance with the project specification.

---

## 1. Customer (`public.customers`)

Represents an individual banking customer or entity subject to KYC and risk monitoring.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `business_id` | TEXT | Required | `CUS-000001` to `CUS-999999` | None | Unique | Regex: `^CUS-\d{6}$` |
| `first_name` | TEXT | Required | Alpha strings (max 100) | None | Non-unique | Not empty, trimmed |
| `last_name` | TEXT | Required | Alpha strings (max 100) | None | Non-unique | Not empty, trimmed |
| `email` | TEXT | Required | Standard RFC 5322 email | None | Unique | Valid email syntax |
| `phone` | TEXT | Optional | E.164 phone number | None | Non-unique | Valid telephone pattern |
| `country` | CHAR(2) | Required | ISO 3166-1 alpha-2 (e.g. `IN`, `US`, `GB`) | None | Non-unique | Exact 2 uppercase chars |
| `risk_tier` | ENUM | Required | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Tier | Non-unique | Must be valid `risk_tier_type` |
| `kyc_status` | ENUM | Required | `UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED` | Status | Non-unique | Must be valid `kyc_status_type` |
| `created_at` | TIMESTAMPTZ | Required | UTC ISO-8601 timestamp | None | Non-unique | `created_at <= now()` |

---

## 2. Account (`public.accounts`)

Financial accounts holding balances and executing transactions.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `business_id` | TEXT | Required | `ACC-CUS-000001-01` | None | Unique | Regex: `^ACC-CUS-\d{6}-\d{2}$` |
| `primary_customer_id`| UUID | Required | Foreign Key to `customers.id` | None | Non-unique | Must reference existing customer |
| `account_type` | ENUM | Required | `SAVINGS`, `CHECKING`, `ESCROW`, `CURRENT` | Type | Non-unique | Valid account type |
| `currency` | CHAR(3) | Required | ISO 4217 (`INR`, `USD`, `EUR`, `GBP`) | Currency | Non-unique | Exact 3 uppercase chars |
| `status` | ENUM | Required | `ACTIVE`, `DORMANT`, `CLOSED` | Status | Non-unique | Valid `account_status_type` |
| `current_balance` | NUMERIC(15,2) | Required | Any real decimal | Currency | Non-unique | Reconciled balance |
| `overdraft_limit` | NUMERIC(15,2) | Required | Non-negative decimal | Currency | Non-unique | `overdraft_limit >= 0.00` |
| `allow_overdraft` | BOOLEAN | Required | `TRUE`, `FALSE` | Boolean | Non-unique | If FALSE, balance cannot drop below `0` |
| `opened_at` | TIMESTAMPTZ | Required | UTC ISO-8601 | None | Non-unique | `opened_at <= closed_at` (if closed) |
| `closed_at` | TIMESTAMPTZ | Optional | UTC ISO-8601 | None | Non-unique | Must be NULL if `status != CLOSED` |

---

## 3. Merchant (`public.merchants`)

Commercial entities receiving payments and transactions.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `merchant_code` | TEXT | Required | `MRC-0001` to `MRC-9999` | None | Unique | Regex: `^MRC-\d{4}$` |
| `name` | TEXT | Required | Commercial name string | None | Non-unique | Not empty |
| `category_code` | CHAR(4) | Required | `ELEC`, `JEWL`, `GAMB`, `CRYP`, `REST`, etc. | MCC code | Non-unique | Exact 4 uppercase chars |
| `risk_level` | ENUM | Required | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Tier | Non-unique | Must be valid `risk_tier_type` |
| `country` | CHAR(2) | Required | ISO 3166-1 alpha-2 | None | Non-unique | Exact 2 uppercase chars |
| `is_high_risk` | BOOLEAN | Required | `TRUE`, `FALSE` | Boolean | Non-unique | Corresponds to high/critical risk tier |

---

## 4. Device (`public.devices`)

Hardware or software client fingerprints initiating transactions.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `fingerprint` | TEXT | Required | 64-char hex SHA-256 hash | None | Unique | Regex: `^[a-f0-9]{64}$` |
| `ip_address` | INET | Required | Valid IPv4 or IPv6 string | IP | Non-unique | Valid network address |
| `device_type` | TEXT | Required | `MOBILE`, `DESKTOP`, `TABLET`, `ATM` | Type | Non-unique | Valid device classification |
| `operating_system` | TEXT | Required | `iOS`, `Android`, `Windows`, `macOS`, `Linux` | OS | Non-unique | Valid OS string |
| `is_vpn` | BOOLEAN | Required | `TRUE`, `FALSE` | Boolean | Non-unique | Flagged if VPN detected |
| `is_tor` | BOOLEAN | Required | `TRUE`, `FALSE` | Boolean | Non-unique | Flagged if Tor exit node detected |
| `first_seen_at` | TIMESTAMPTZ | Required | UTC ISO-8601 | None | Non-unique | `first_seen_at <= now()` |

---

## 5. Transaction (`public.transactions`)

Ledger records representing balance-impacting monetary events.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `business_id` | TEXT | Required | `TXN-2026-00000001` | None | Unique | Regex: `^TXN-2026-\d{8}$` |
| `account_id` | UUID | Required | Foreign Key to `accounts.id` | None | Non-unique | Must reference active account |
| `type` | ENUM | Required | `DEBIT`, `CREDIT` | Type | Non-unique | Must be valid `transaction_type` |
| `amount` | NUMERIC(15,2) | Required | Positive decimal | Currency | Non-unique | `amount > 0.00` strictly positive |
| `signed_amount` | NUMERIC(15,2) | Required | Negative for debit, positive for credit | Currency | Non-unique | `signed_amount = (type == 'DEBIT' ? -amount : amount)` |
| `currency` | CHAR(3) | Required | ISO 4217 code | Currency | Non-unique | Must match `account.currency` |
| `balance_before` | NUMERIC(15,2) | Required | Real decimal | Currency | Non-unique | Starting account ledger balance |
| `balance_after` | NUMERIC(15,2) | Required | Real decimal | Currency | Non-unique | `balance_before + signed_amount = balance_after` |
| `status` | ENUM | Required | `POSTED`, `REVERSED`, `FAILED` | Status | Non-unique | Valid `transaction_status_type` |
| `channel` | TEXT | Required | `ONLINE`, `MOBILE_APP`, `ATM`, `POS`, `BRANCH` | Channel | Non-unique | Valid execution channel |
| `merchant_id` | UUID | Optional | Foreign Key to `merchants.id` | None | Non-unique | Nullable if transfer/withdrawal |
| `device_id` | UUID | Optional | Foreign Key to `devices.id` | None | Non-unique | Nullable if offline/batch |
| `idempotency_key` | TEXT | Required | Unique alphanumeric string | None | Unique | Prevents duplicate processing |
| `description` | TEXT | Required | Free-form ledger narrative | None | Non-unique | Not empty |
| `occurred_at` | TIMESTAMPTZ | Required | UTC ISO-8601 | None | Non-unique | `occurred_at <= now()` |

---

## 6. TransferLink (`public.transfer_links`)

Reconciliation link tying a source debit transaction to a destination credit transaction.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `transfer_group_id`| UUID | Required | Correlation UUID | None | Non-unique | Links multi-leg transfers |
| `source_transaction_id`| UUID | Required | Foreign Key to `transactions.id` | None | Unique | Must be a `DEBIT` transaction |
| `destination_transaction_id`| UUID | Required | Foreign Key to `transactions.id` | None | Unique | Must be a `CREDIT` transaction |
| `source_account_id`| UUID | Required | Foreign Key to `accounts.id` | None | Non-unique | Originator account |
| `destination_account_id`| UUID | Required | Foreign Key to `accounts.id` | None | Non-unique | Beneficiary account |
| `amount` | NUMERIC(15,2) | Required | Positive decimal | Currency | Non-unique | Must match source and destination amount |
| `currency` | CHAR(3) | Required | ISO 4217 code | Currency | Non-unique | Currency code |
| `status` | ENUM | Required | `RECONCILED`, `IMBALANCED`, `FAILED` | Status | Non-unique | Valid `transfer_status_type` |
| `linked_at` | TIMESTAMPTZ | Required | UTC ISO-8601 | None | Non-unique | `linked_at >= transaction.occurred_at` |

---

## 7. RiskRule & RiskRuleVersion (`public.risk_rules`, `public.risk_rule_versions`)

Versioned declarative risk rules defining surveillance thresholds.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `rule_code` | TEXT | Required | `RULE-VEL-01`, `RULE-DEV-01`, etc. | Code | Unique | Regex: `^RULE-[A-Z]{3}-\d{2}$` |
| `name` | TEXT | Required | Descriptive title string | None | Non-unique | Not empty |
| `description` | TEXT | Required | Explanation of rule methodology | None | Non-unique | Not empty |
| `category` | TEXT | Required | `VELOCITY`, `DEVICE`, `TRANSFER`, `DORMANCY`, `AMOUNT`, `MERCHANT` | Category | Non-unique | Valid taxonomy code |
| `version_number` | INT | Required | Positive integer ($1, 2, 3\dots$) | Counter | Per rule | `version_number >= 1` |
| `status` | ENUM | Required | `DRAFT`, `PUBLISHED`, `RETIRED` | Status | Non-unique | Valid `rule_status_type` |
| `parameters` | JSONB | Required | Structured key-value object | None | Non-unique | Valid JSON object |
| `threshold_value`| NUMERIC(15,2) | Required | Real decimal | Units | Non-unique | Threshold baseline |
| `time_window_minutes`| INT | Optional | Positive integer | Minutes | Non-unique | Window duration |
| `score_contribution`| INT | Required | Integer between 1 and 100 | Points | Non-unique | `1 <= score_contribution <= 100` |
| `severity` | ENUM | Required | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Severity | Non-unique | Valid `severity_level` |

---

## 8. Alert (`public.alerts`)

Prioritized signals triggered by rule evaluations.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `business_id` | TEXT | Required | `ALT-2026-000001` | None | Unique | Regex: `^ALT-2026-\d{6}$` |
| `account_id` | UUID | Required | Foreign Key to `accounts.id` | None | Non-unique | Must reference evaluated account |
| `customer_id` | UUID | Required | Foreign Key to `customers.id` | None | Non-unique | Primary customer owner |
| `status` | ENUM | Required | `OPEN`, `INVESTIGATING`, `DISMISSED`, `ESCALATED` | Status | Non-unique | Valid `alert_status_type` |
| `severity` | ENUM | Required | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Severity | Non-unique | Valid `severity_level` |
| `aggregate_score` | INT | Required | Integer between 0 and 100 | Score | Non-unique | `0 <= aggregate_score <= 100` |
| `summary` | TEXT | Required | Analyst summary text | None | Non-unique | Explains triggering rules |
| `deduplication_key`| TEXT | Required | Composite dedup string | None | Unique | Prevents duplicate alert spam |
| `assigned_to` | TEXT | Optional | Analyst user ID or name | None | Non-unique | Nullable |
| `created_at` | TIMESTAMPTZ | Required | UTC ISO-8601 | None | Non-unique | `created_at <= now()` |

---

## 9. Case (`public.cases`)

Consolidated investigation container grouping related alerts, entities, and actions.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `business_id` | TEXT | Required | `CASE-2026-000001` | None | Unique | Regex: `^CASE-2026-\d{6}$` |
| `customer_id` | UUID | Required | Foreign Key to `customers.id` | None | Non-unique | Primary subject customer |
| `title` | TEXT | Required | Investigation title string | None | Non-unique | Not empty |
| `status` | ENUM | Required | `OPEN`, `IN_REVIEW`, `CLOSED` | Status | Non-unique | Valid `case_status_type` |
| `severity` | ENUM | Required | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Severity | Non-unique | Valid `severity_level` |
| `disposition` | ENUM | Optional | `FALSE_POSITIVE`, `SUSPICIOUS_REPORTED`, `RESOLVED_BENIGN`, `POLICY_VIOLATION` | Verdict | Non-unique | Valid `case_disposition_type` |
| `assigned_to` | TEXT | Optional | Analyst identifier | None | Non-unique | Nullable |
| `version` | INT | Required | Optimistic lock integer ($1, 2, 3\dots$) | Version | Non-unique | `version >= 1` |
| `opened_at` | TIMESTAMPTZ | Required | UTC ISO-8601 | None | Non-unique | `opened_at <= closed_at` (if closed) |
| `closed_at` | TIMESTAMPTZ | Optional | UTC ISO-8601 | None | Non-unique | Nullable if status is not `CLOSED` |

---

## 10. AnalystAction & AuditEvent (`public.analyst_actions`, `public.audit_events`)

Append-only tamper-evident audit history records.

| Field Name | Type | Required / Optional | Allowed Values / Format | Units | Uniqueness | Validation Rule |
|---|---|---|---|---|---|---|
| `id` | UUID | Required | UUIDv4 / UUIDv5 | None | Primary Key | Valid RFC 4122 UUID |
| `case_id` | UUID | Optional | Foreign Key to `cases.id` | None | Non-unique | Case action link |
| `actor_id` | TEXT | Required | Analyst identifier or system ID | None | Non-unique | Not empty |
| `action_type` / `action` | TEXT | Required | `DISPOSITION_SET`, `ASSIGNED`, `NOTE_ADDED`, etc. | Action | Non-unique | Valid action classification |
| `previous_status`| TEXT | Optional | Status before transition | None | Non-unique | Lifecycle state |
| `new_status` | TEXT | Optional | Status after transition | None | Non-unique | Lifecycle state |
| `disposition` | TEXT | Optional | Disposition enum value | None | Non-unique | Valid disposition |
| `notes` / `reason`| TEXT | Optional | Narrative justification | None | Non-unique | Analyst notes |
| `created_at` | TIMESTAMPTZ | Required | UTC ISO-8601 | None | Non-unique | Immutable append timestamp |

