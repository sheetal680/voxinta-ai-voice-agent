-- ---------------------------------------------------------------------------
-- 20260704120500_tool_configs.sql
-- Per-agent tool configuration for the plugin-based tool-calling system.
-- ---------------------------------------------------------------------------

create table public.tool_configs (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  agent_id   uuid references public.agents (id) on delete cascade,
  -- Plugin kind: calculator | weather | web_search | email | calendar |
  --              database | rest_api | custom (open-ended for extensibility).
  tool_type  text not null,
  name       text not null,
  enabled    boolean not null default true,
  -- Tool-specific settings (API endpoints, keys handled server-side, etc.).
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tool_configs_owner_id_idx on public.tool_configs (owner_id);
create index tool_configs_agent_id_idx on public.tool_configs (agent_id);

create trigger tool_configs_set_updated_at
  before update on public.tool_configs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: owner-scoped, admin bypass.
-- ---------------------------------------------------------------------------
alter table public.tool_configs enable row level security;

create policy "tool_configs_select"
  on public.tool_configs for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "tool_configs_insert"
  on public.tool_configs for insert to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "tool_configs_update"
  on public.tool_configs for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "tool_configs_delete"
  on public.tool_configs for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());
