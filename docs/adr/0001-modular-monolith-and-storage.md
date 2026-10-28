# ADR 0001: Modular Monolith Architecture and Supabase PostgreSQL Source of Truth

## Status
Accepted

## Context
RiskWatch is a full-stack risk intelligence application serving real-time analysts while handling background dataset generation and validation. Microservice architectures introduce premature network latency, distributed transaction failure modes, and deployment complexity that obscure rather than enhance architectural rigor.

## Decision
1. **Modular Monolith**: We organize the system as a disciplined modular monolith:
   - Next.js 15 App Router provides the frontend analyst workbench and typed BFF endpoints.
   - Supabase PostgreSQL serves as the single authoritative source of truth.
   - Python background workers handle intensive batch tasks (deterministic generation, risk rule evaluation, validation runs, exports).
2. **Explicit Consistency Boundaries**:
   - High-consequence mutations (case dispositions, rule publication, alert evidence linking) execute as atomic PostgreSQL functions (RPC) with explicit row-level locking (`FOR UPDATE`).
   - Consequential state changes append immutable audit and state events within the same database transaction.
3. **No Dual Writes**:
   - Client state is a projection of persisted server facts. Local storage is restricted to signed-out demo sandboxing; signed-in users read and write solely against PostgreSQL.

## Consequences
- Single unified transactional database simplifies reconciliation, RLS, and backup/restore.
- Background worker connects via least-privilege credentials and processes jobs in bounded idempotent batches without holding open long-lived transactions.

