-- Migration 20261028160000_enable_realtime.sql
-- Add key monitoring tables to supabase_realtime publication for live WebSocket streaming

alter publication supabase_realtime add table public.alerts;
alter publication supabase_realtime add table public.cases;
alter publication supabase_realtime add table public.generation_jobs;
alter publication supabase_realtime add table public.transactions;

