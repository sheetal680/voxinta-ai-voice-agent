-- ---------------------------------------------------------------------------
-- 20260704121200_admin_panel.sql
-- Admin Panel: feature flags storage, and cross-user aggregation functions
-- for User Management, Conversation Logs, and Reports. `profiles.role` and
-- `is_admin()` already exist (20260704120100_profiles.sql) — this migration
-- only adds what's new.
--
-- The three RPCs below explicitly `raise exception` when the caller isn't
-- an admin, rather than relying only on an implicit RLS bypass — they
-- return cross-user data by design, so the admin check is the point, not a
-- side effect of some other policy.
-- ---------------------------------------------------------------------------

create table public.feature_flags (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  enabled     boolean not null default false,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger feature_flags_set_updated_at
  before update on public.feature_flags
  for each row execute function public.set_updated_at();

alter table public.feature_flags enable row level security;

-- Flags are checked at runtime throughout the app (not just by admins), so
-- every authenticated user can read them — only admins can change them.
create policy "feature_flags_select"
  on public.feature_flags for select to authenticated
  using (true);

create policy "feature_flags_insert"
  on public.feature_flags for insert to authenticated
  with check (public.is_admin());

create policy "feature_flags_update"
  on public.feature_flags for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "feature_flags_delete"
  on public.feature_flags for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- User Management: every profile plus how much they've used the platform.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_users()
returns table (
  id                 uuid,
  email              text,
  full_name          text,
  avatar_url         text,
  role               text,
  created_at         timestamptz,
  agent_count        bigint,
  conversation_count bigint
)
language plpgsql
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  return query
  select
    p.id,
    p.email,
    p.full_name,
    p.avatar_url,
    p.role,
    p.created_at,
    (select count(*) from public.agents a where a.owner_id = p.id) as agent_count,
    (select count(*) from public.conversations c where c.owner_id = p.id) as conversation_count
  from public.profiles p
  order by p.created_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Conversation Logs: every conversation platform-wide, with its owner.
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_conversations(result_limit integer default 100)
returns table (
  id            uuid,
  title         text,
  owner_id      uuid,
  owner_email   text,
  agent_id      uuid,
  agent_name    text,
  created_at    timestamptz,
  updated_at    timestamptz,
  message_count bigint
)
language plpgsql
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  return query
  select
    c.id,
    c.title,
    c.owner_id,
    p.email as owner_email,
    c.agent_id,
    a.name as agent_name,
    c.created_at,
    c.updated_at,
    count(m.id) as message_count
  from public.conversations c
  left join public.profiles p on p.id = c.owner_id
  left join public.agents a on a.id = c.agent_id
  left join public.messages m on m.conversation_id = c.id
  group by c.id, p.email, a.name
  order by c.updated_at desc
  limit least(greatest(result_limit, 1), 500);
end;
$$;

-- ---------------------------------------------------------------------------
-- Reports: a platform-wide summary snapshot.
-- ---------------------------------------------------------------------------
create or replace function public.admin_platform_report()
returns table (
  total_users          bigint,
  total_agents         bigint,
  total_conversations  bigint,
  total_messages       bigint,
  total_tool_calls     bigint,
  avg_response_time_ms numeric,
  total_documents      bigint,
  failed_documents     bigint
)
language plpgsql
stable
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.';
  end if;

  return query
  select
    (select count(*) from public.profiles) as total_users,
    (select count(*) from public.agents) as total_agents,
    (select count(*) from public.conversations) as total_conversations,
    (select count(*) from public.messages) as total_messages,
    (select count(*) from public.messages where role = 'tool') as total_tool_calls,
    (select avg(response_time_ms) from public.messages where response_time_ms is not null)
      as avg_response_time_ms,
    (select count(*) from public.knowledge_documents) as total_documents,
    (select count(*) from public.knowledge_documents where status = 'failed') as failed_documents;
end;
$$;
