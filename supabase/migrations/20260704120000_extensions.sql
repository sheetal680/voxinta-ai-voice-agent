-- ---------------------------------------------------------------------------
-- 20260704120000_extensions.sql
-- Extensions + shared helper functions used across the schema.
-- ---------------------------------------------------------------------------

-- gen_random_uuid() and crypto helpers.
create extension if not exists pgcrypto with schema extensions;

-- pgvector for RAG embeddings. Installed in the `extensions` schema
-- (Supabase convention); types/operators are referenced as extensions.*.
create extension if not exists vector with schema extensions;

-- Shared trigger to keep an `updated_at` column fresh on UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
