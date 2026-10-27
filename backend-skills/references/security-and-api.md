# Security and API Reference

## Starting capability matrix
- Operations analyst: read permitted transactions/accounts, read alerts/cases, record allowed actions within scope; no rule publishing or role management.
- Risk reviewer: read records, review/escalate/close cases according to policy, inspect rules; rule publishing and exports are policy-controlled.
- System admin: manage roles/configuration and privileged jobs; all consequential actions audited.
Define assignment/team scope if needed and test direct database access, not just API routes.

## API conventions
Use safe error envelopes with stable code, safe message, correlation ID, and optional field validation details. Never expose stack traces or secrets. Allowlist sort fields and cap page size. Treat exports as asynchronous jobs and separately authorize download access.

## Audit
Audit role changes, rule publication, generation jobs, exports, case creation/assignment, analyst dispositions, and relevant security events. Never log passwords, tokens, service keys, or unnecessary personal data.
