-- ---------------------------------------------------------------------------
-- 20260704120200_agents.sql
-- AI agents. Users can create unlimited agents; each carries its own prompt,
-- personality, voice and generation settings.
-- ---------------------------------------------------------------------------

create table public.agents (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles (id) on delete cascade,
  name            text not null,
  description     text,
  avatar_url      text,
  -- System/base prompt for the agent.
  prompt          text,
  personality     text,
  welcome_message text,
  -- Voice id/preference (resolved by the active TTS provider).
  voice           text,
  temperature     real not null default 0.7 check (temperature >= 0 and temperature <= 2),
  language        text not null default 'en-US',
  max_tokens      integer not null default 1024 check (max_tokens > 0),
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index agents_owner_id_idx on public.agents (owner_id);

create trigger agents_set_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: owner-scoped, admin bypass.
-- ---------------------------------------------------------------------------
alter table public.agents enable row level security;

create policy "agents_select"
  on public.agents for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "agents_insert"
  on public.agents for insert to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "agents_update"
  on public.agents for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "agents_delete"
  on public.agents for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());
