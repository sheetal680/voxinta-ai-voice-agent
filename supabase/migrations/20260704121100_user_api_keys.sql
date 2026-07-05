-- ---------------------------------------------------------------------------
-- 20260704121100_user_api_keys.sql
-- User-supplied API keys for future BYO-provider support (see
-- features/settings). One row per (owner, provider); the key itself is
-- encrypted at rest (AES-256-GCM, services/shared/encryption.ts) — this
-- table never stores a usable plaintext key. `key_preview` (last 4 chars)
-- lets the UI show which key is on file without ever decrypting it back to
-- the client.
-- ---------------------------------------------------------------------------

create table public.user_api_keys (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  provider      text not null,
  encrypted_key text not null,
  key_preview   text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (owner_id, provider)
);

create index user_api_keys_owner_id_idx on public.user_api_keys (owner_id);

create trigger user_api_keys_set_updated_at
  before update on public.user_api_keys
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: strictly owner-only, no admin bypass — these are
-- encrypted secrets, not operational data an admin needs to inspect.
-- ---------------------------------------------------------------------------
alter table public.user_api_keys enable row level security;

create policy "user_api_keys_select"
  on public.user_api_keys for select to authenticated
  using (owner_id = auth.uid());

create policy "user_api_keys_insert"
  on public.user_api_keys for insert to authenticated
  with check (owner_id = auth.uid());

create policy "user_api_keys_update"
  on public.user_api_keys for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "user_api_keys_delete"
  on public.user_api_keys for delete to authenticated
  using (owner_id = auth.uid());
