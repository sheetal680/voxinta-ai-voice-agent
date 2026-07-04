-- ---------------------------------------------------------------------------
-- 20260704120100_profiles.sql
-- User profiles (1:1 with auth.users), role model, and the is_admin() helper
-- that every other table's RLS policy uses for the admin bypass.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  -- 'user' by default; 'admin' grants access to all data via is_admin().
  role        text not null default 'user' check (role in ('user', 'admin')),
  -- Per-user settings (theme, voice prefs, notifications, ...).
  preferences jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin check. SECURITY DEFINER so it reads profiles without being subject to
-- profiles' own RLS (avoids recursion). Fixed search_path per Supabase lints.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Auto-provision a profile row whenever a new auth user is created.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Prevent non-admins from escalating their own role.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a profile role.';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- Profile insert is normally handled by the on_auth_user_created trigger;
-- this covers the self-insert case as a fallback.
create policy "profiles_insert"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles_delete"
  on public.profiles for delete to authenticated
  using (public.is_admin());
