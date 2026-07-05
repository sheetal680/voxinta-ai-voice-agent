-- ---------------------------------------------------------------------------
-- 20260704120900_conversation_list_stats.sql
-- Backs the Conversations dashboard view: one row per conversation with
-- aggregated message stats, filterable by agent/date range/free-text search
-- (conversation title or message content).
-- ---------------------------------------------------------------------------

create or replace function public.list_conversations_with_stats(
  filter_agent_id uuid default null,
  filter_search text default null,
  filter_from timestamptz default null,
  filter_to timestamptz default null
)
returns table (
  id                   uuid,
  title                text,
  agent_id             uuid,
  agent_name           text,
  created_at           timestamptz,
  updated_at           timestamptz,
  message_count        bigint,
  last_message_at      timestamptz,
  last_message_preview text,
  avg_response_time_ms numeric
)
language sql
stable
set search_path = public
as $$
  select
    c.id,
    c.title,
    c.agent_id,
    a.name as agent_name,
    c.created_at,
    c.updated_at,
    count(m.id) as message_count,
    max(m.created_at) as last_message_at,
    (
      select m2.content
      from public.messages m2
      where m2.conversation_id = c.id
      order by m2.created_at desc
      limit 1
    ) as last_message_preview,
    avg(m.response_time_ms) as avg_response_time_ms
  from public.conversations c
  left join public.agents a on a.id = c.agent_id
  left join public.messages m on m.conversation_id = c.id
  where (c.owner_id = auth.uid() or public.is_admin())
    and (filter_agent_id is null or c.agent_id = filter_agent_id)
    and (filter_from is null or c.created_at >= filter_from)
    and (filter_to is null or c.created_at <= filter_to)
    and (
      filter_search is null or filter_search = '' or
      c.title ilike '%' || filter_search || '%' or
      exists (
        select 1 from public.messages m3
        where m3.conversation_id = c.id and m3.content ilike '%' || filter_search || '%'
      )
    )
  group by c.id, a.name
  order by c.updated_at desc;
$$;
