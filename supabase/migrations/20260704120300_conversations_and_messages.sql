-- ---------------------------------------------------------------------------
-- 20260704120300_conversations_and_messages.sql
-- Conversations and their messages. Messages are RLS-scoped through their
-- parent conversation (no denormalized owner_id needed).
-- ---------------------------------------------------------------------------

create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  agent_id   uuid references public.agents (id) on delete set null,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_owner_id_idx on public.conversations (owner_id);
create index conversations_agent_id_idx on public.conversations (agent_id);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

create table public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations (id) on delete cascade,
  agent_id         uuid references public.agents (id) on delete set null,
  role             text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content          text not null,
  -- Assistant latency for analytics ("Response Time" metric).
  response_time_ms integer,
  metadata         jsonb not null default '{}'::jsonb,
  -- The message "timestamp".
  created_at       timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);
create index messages_agent_id_idx on public.messages (agent_id);

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;

create policy "conversations_select"
  on public.conversations for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "conversations_insert"
  on public.conversations for insert to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "conversations_update"
  on public.conversations for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "conversations_delete"
  on public.conversations for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

alter table public.messages enable row level security;

-- A message is visible/editable if the caller owns its conversation (or admin).
create policy "messages_select"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "messages_insert"
  on public.messages for insert to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "messages_update"
  on public.messages for update to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "messages_delete"
  on public.messages for delete to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.owner_id = auth.uid() or public.is_admin())
    )
  );
