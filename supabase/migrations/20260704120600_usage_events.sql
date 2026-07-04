-- ---------------------------------------------------------------------------
-- 20260704120600_usage_events.sql
-- Append-only usage/analytics events. Powers dashboard metrics (conversations,
-- messages, response time, daily/weekly/monthly usage) and future billing.
-- Typically written server-side (service role bypasses RLS).
-- ---------------------------------------------------------------------------

create table public.usage_events (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles (id) on delete cascade,
  agent_id        uuid references public.agents (id) on delete set null,
  conversation_id uuid references public.conversations (id) on delete set null,
  -- e.g. 'message_sent' | 'message_received' | 'tokens_used' |
  --      'document_uploaded' | 'tool_called' | 'voice_session'.
  event_type      text not null,
  -- Countable magnitude for the event (messages: 1, tokens: N, ...).
  quantity        numeric not null default 1,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index usage_events_owner_id_created_idx on public.usage_events (owner_id, created_at);
create index usage_events_event_type_idx on public.usage_events (event_type);
create index usage_events_agent_id_idx on public.usage_events (agent_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: users read their own events; inserts allowed for self;
-- events are immutable (no update/delete for users). Admins bypass via
-- is_admin(). Server-side writes use the service role, which bypasses RLS.
-- ---------------------------------------------------------------------------
alter table public.usage_events enable row level security;

create policy "usage_events_select"
  on public.usage_events for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "usage_events_insert"
  on public.usage_events for insert to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "usage_events_delete"
  on public.usage_events for delete to authenticated
  using (public.is_admin());
