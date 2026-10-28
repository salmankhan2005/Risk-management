# ADR 0003: Hybrid Auth Integration and Role-Based Access Control

## Status
Accepted

## Context
RiskWatch uses Clerk for user-facing authentication (sign-in, sign-up, organization membership) while utilizing Supabase PostgreSQL for row-level security and data storage. Authorization must never trust client-provided claims or hidden UI buttons.

## Decision
1. **Third-Party JWT Integration**:
   - Clerk signs session JWTs that are validated by Supabase using Clerk's JWKS / public key.
   - The token's `sub` claim maps to the user's Clerk ID and is matched against database records via `(auth.jwt() ->> 'sub')`.
   - The token contains the `authenticated` role claim for Postgres permissions.
2. **Server-Derived Role Matrix**:
   - The platform defines three explicit roles:
     - `operations_analyst`: Queue triage, alert review, notes, escalation.
     - `risk_reviewer`: Case disposition, full alert resolution, rule simulation, export request.
     - `system_admin`: Rule publication, synthetic dataset generation, role management, full audit search.
   - Roles are stored in `user_roles` and mapped to verified actor identities on the server.
   - Endpoints verify role permissions before invoking business services; PostgreSQL RLS policies enforce access at the query level.

## Consequences
- No public user can escalate their own permissions or bypass backend checks.
- Audit events record the authentic actor ID derived directly from the verified session token.

