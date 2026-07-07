-- ---------------------------------------------------------------------------
-- 20260706130000_tool_configs_unique.sql
-- One config row per (agent, tool type) — lets the Integrations UI upsert
-- a toggle instead of hand-rolling a select-then-insert-or-update.
-- ---------------------------------------------------------------------------

alter table public.tool_configs
  add constraint tool_configs_agent_tool_type_unique unique (agent_id, tool_type);
