# RiskWatch API Specification (`/api/v1`)

All endpoints adhere to standardized success and error envelopes. Timestamps are formatted as ISO-8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`). Monetary amounts are represented as decimal strings with 2 fractional digits to prevent JavaScript floating-point truncation.

## Standard Envelopes

### Success Envelope
```typescript
export type ApiSuccess<T> = {
  data: T;
  meta?: {
    requestId: string;
    nextCursor?: string | null;
    hasMore?: boolean;
    totalCount?: number;
  };
};
```

### Error Envelope
```typescript
export type ApiError = {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId: string;
  };
};
```

---

## Endpoint Catalog

### 1. Authentication & Profile
- **`GET /api/v1/me`**
  - **Purpose**: Retrieve currently authenticated user profile and resolved roles.
  - **Roles**: `operations_analyst`, `risk_reviewer`, `system_admin`.
  - **Response**:
    ```json
    {
      "data": {
        "userId": "user_2sN...",
        "displayName": "Neha Sen",
        "email": "neha.sen@riskwatch.local",
        "roles": ["operations_analyst"],
        "permissions": ["cases:read", "cases:annotate", "alerts:read"]
      },
      "meta": { "requestId": "req_01..." }
    }
    ```

### 2. Dashboard
- **`GET /api/v1/dashboard/summary`**
  - **Purpose**: High-level aggregated risk metrics and volume counters.
  - **Roles**: All authenticated roles.
  - **Query Parameters**:
    - `timeWindow`: `24h` | `7d` | `30d` (default `7d`)
  - **Response**:
    ```json
    {
      "data": {
        "asOf": "2026-10-28T12:00:00.000Z",
        "activeAlertsCount": 42,
        "criticalCasesCount": 8,
        "monitoredTransactionsVolume": "10452300.50",
        "flaggedVolume": "845200.00",
        "ruleTriggerBreakdown": [
          { "ruleId": "RULE-VEL-01", "name": "Velocity Spike", "count": 18 },
          { "ruleId": "RULE-CYC-01", "name": "Circular Transfer", "count": 6 }
        ]
      },
      "meta": { "requestId": "req_02..." }
    }
    ```

### 3. Customers & Accounts
- **`GET /api/v1/customers`**
  - **Query**: `cursor`, `limit` (max 100), `riskTier` (`LOW`|`MEDIUM`|`HIGH`|`CRITICAL`), `search`
- **`GET /api/v1/customers/:id`**
  - **Returns**: Customer master record, active KYC profile, and linked account ownerships.
- **`GET /api/v1/accounts`**
  - **Query**: `cursor`, `limit`, `status` (`ACTIVE`|`DORMANT`|`CLOSED`), `customerId`
- **`GET /api/v1/accounts/:id`**
  - **Returns**: Account details, current balance, overdraft limit, currency, owners.

### 4. Transactions & Transfers
- **`GET /api/v1/transactions`**
  - **Query**: `cursor`, `limit` (max 100), `accountId`, `type` (`DEBIT`|`CREDIT`), `minAmount`, `maxAmount`, `startDate`, `endDate`, `flaggedOnly` (boolean)
  - **Sorting Allowlist**: `occurred_at:desc`, `occurred_at:asc`, `amount:desc`
- **`GET /api/v1/transactions/:id`**
  - **Returns**: Full transaction details, balance before/after, merchant, device, linked transfer group, and triggering rule evaluations.

### 5. Alerts & Evidence
- **`GET /api/v1/alerts`**
  - **Query**: `cursor`, `limit`, `status` (`OPEN`|`INVESTIGATING`|`DISMISSED`|`ESCALATED`), `severity` (`LOW`|`MEDIUM`|`HIGH`|`CRITICAL`), `ruleId`
- **`GET /api/v1/alerts/:id`**
  - **Returns**: Alert summary, triggering transactions, rule evaluations, and full explainable evidence payload.

### 6. Cases & Dispositions
- **`GET /api/v1/cases`**
  - **Query**: `cursor`, `limit`, `status` (`OPEN`|`IN_REVIEW`|`CLOSED`), `assigneeId`, `severity`
- **`GET /api/v1/cases/:id`**
  - **Returns**: Case header, member alerts, relevant transactions, and chronological `analyst_actions` timeline.
- **`POST /api/v1/cases/:id/disposition`**
  - **Purpose**: Record formal analyst disposition (Close False Positive, Escalate SAR, Resolve Benign).
  - **Roles**: `operations_analyst` (Escalate only), `risk_reviewer`, `system_admin`.
  - **Payload**:
    ```json
    {
      "disposition": "FALSE_POSITIVE",
      "reason": "Verified legitimate payroll cycle; verified with merchant.",
      "notes": "Analyst verified telephone confirmation on 2026-10-28."
    }
    ```
  - **Response**: `200 OK` with updated Case DTO.

### 7. Risk Rules
- **`GET /api/v1/rules`**: Returns list of logical risk rules with active version metadata.
- **`GET /api/v1/rules/:id/versions`**: Returns immutable version history for a rule.
- **`POST /api/v1/rules/:id/simulations`**:
  - **Roles**: `risk_reviewer`, `system_admin`.
  - **Payload**: `{ "draftConfig": { "threshold": 5, "windowMinutes": 60 }, "sampleDatasetId": "ds_20261022" }`
  - **Returns**: Simulation metrics (trigger count, sample matches, latency estimate).

### 8. Generation & Background Jobs
- **`POST /api/v1/jobs/generation`**:
  - **Roles**: `system_admin`.
  - **Payload**: `{ "seed": "20261022", "customerCount": 5000, "transactionCount": 100000 }`
  - **Response**: `202 Accepted` + `{ "jobId": "job_gen_01...", "status": "PENDING" }`.
- **`GET /api/v1/jobs/:id`**: Returns current stage, progress percentage, checkpoint, and row counts.

### 9. Validation Runs & Metrics
- **`POST /api/v1/validation-runs`**: Trigger invariant validation suite across generated data.
- **`GET /api/v1/validation-runs/:id`**: Returns summary results of the 5 negative scenarios and structural checks.

### 10. Audit Log
- **`GET /api/v1/audit-events`**:
  - **Roles**: `risk_reviewer`, `system_admin`.
  - **Query**: `cursor`, `limit`, `entityType`, `entityId`, `actorId`, `startDate`, `endDate`.

