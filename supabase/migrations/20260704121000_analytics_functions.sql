-- ---------------------------------------------------------------------------
-- 20260704121000_analytics_functions.sql
-- Backs the Analytics dashboard: overview stats (conversations, users,
-- average response time, messages) and daily/weekly/monthly usage series.
-- Aggregated directly from conversations/messages (real, always-populated
-- activity) rather than usage_events, which nothing writes to yet.
-- ---------------------------------------------------------------------------

create or replace function public.dashboard_overview_stats()
returns table (
  total_conversations  bigint,
  total_messages       bigint,
  total_users          bigint,
  avg_response_time_ms numeric
)
language sql
stable
set search_path = public
as $$
  select
    (
      select count(*) from public.conversations c
      where c.owner_id = auth.uid() or public.is_admin()
    ) as total_conversations,
    (
      select count(*) from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where c.owner_id = auth.uid() or public.is_admin()
    ) as total_messages,
    (
      select count(*) from public.profiles p
      where p.id = auth.uid() or public.is_admin()
    ) as total_users,
    (
      select avg(m.response_time_ms) from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where (c.owner_id = auth.uid() or public.is_admin())
        and m.response_time_ms is not null
    ) as avg_response_time_ms;
$$;

-- ---------------------------------------------------------------------------
-- Conversation/message counts bucketed by day, week, or month, for the
-- trailing `periods` buckets up to and including the current one. Each count
-- is pre-aggregated in its own CTE before joining to the bucket series —
-- joining raw conversations and messages to the same bucket independently
-- would cross-join every conversation in a bucket against every message in
-- it, inflating message_count.
-- ---------------------------------------------------------------------------
create or replace function public.usage_over_time(
  granularity text default 'day',
  periods integer default 30
)
returns table (
  period_start        timestamptz,
  conversation_count   bigint,
  message_count        bigint
)
language plpgsql
stable
set search_path = public
as $$
declare
  step interval;
begin
  if granularity not in ('day', 'week', 'month') then
    raise exception 'invalid granularity: %, expected day/week/month', granularity;
  end if;
  if periods < 1 or periods > 366 then
    raise exception 'periods must be between 1 and 366';
  end if;

  step := ('1 ' || granularity)::interval;

  return query
  with bucket_series as (
    select generate_series(
      date_trunc(granularity, now()) - step * (periods - 1),
      date_trunc(granularity, now()),
      step
    ) as period_start
  ),
  conv_counts as (
    select date_trunc(granularity, c.created_at) as period_start, count(*) as conversation_count
    from public.conversations c
    where c.owner_id = auth.uid() or public.is_admin()
    group by 1
  ),
  msg_counts as (
    select date_trunc(granularity, m.created_at) as period_start, count(*) as message_count
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.owner_id = auth.uid() or public.is_admin()
    group by 1
  )
  select
    bs.period_start,
    coalesce(cc.conversation_count, 0) as conversation_count,
    coalesce(mc.message_count, 0) as message_count
  from bucket_series bs
  left join conv_counts cc on cc.period_start = bs.period_start
  left join msg_counts mc on mc.period_start = bs.period_start
  order by bs.period_start;
end;
$$;
