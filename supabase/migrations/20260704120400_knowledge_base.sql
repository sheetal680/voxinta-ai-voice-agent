-- ---------------------------------------------------------------------------
-- 20260704120400_knowledge_base.sql
-- Knowledge base (RAG): uploaded documents and their embedded chunks.
-- NOTE: the embedding dimension (1536) must match the embedding model chosen
-- in the RAG phase. Change here + reindex if the model differs.
-- ---------------------------------------------------------------------------

create table public.knowledge_documents (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles (id) on delete cascade,
  -- Documents belong to a specific agent's knowledge base.
  agent_id     uuid references public.agents (id) on delete cascade,
  filename     text not null,
  type         text not null check (type in ('pdf', 'docx', 'txt', 'md')),
  -- Ingestion lifecycle: upload -> extract -> chunk -> embed -> store.
  status       text not null default 'pending'
                 check (status in ('pending', 'processing', 'ready', 'failed')),
  size_bytes   bigint,
  -- Path in Supabase Storage for the original file.
  storage_path text,
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index knowledge_documents_owner_id_idx on public.knowledge_documents (owner_id);
create index knowledge_documents_agent_id_idx on public.knowledge_documents (agent_id);

create trigger knowledge_documents_set_updated_at
  before update on public.knowledge_documents
  for each row execute function public.set_updated_at();

create table public.document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents (id) on delete cascade,
  chunk_index integer not null,
  content     text not null,
  embedding   extensions.vector(1536),
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index document_chunks_document_id_idx on public.document_chunks (document_id);

-- Approximate nearest-neighbour index for cosine similarity search.
create index document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Similarity search helper. SECURITY INVOKER (default) so RLS applies and the
-- caller only ever searches their own chunks.
-- ---------------------------------------------------------------------------
create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_count int default 5,
  filter_agent_id uuid default null
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  similarity  float
)
language sql
stable
set search_path = public, extensions
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.knowledge_documents kd on kd.id = dc.document_id
  where dc.embedding is not null
    and (filter_agent_id is null or kd.agent_id = filter_agent_id)
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security.
-- ---------------------------------------------------------------------------
alter table public.knowledge_documents enable row level security;

create policy "knowledge_documents_select"
  on public.knowledge_documents for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "knowledge_documents_insert"
  on public.knowledge_documents for insert to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "knowledge_documents_update"
  on public.knowledge_documents for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "knowledge_documents_delete"
  on public.knowledge_documents for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

alter table public.document_chunks enable row level security;

-- Chunks inherit access from their parent document.
create policy "document_chunks_select"
  on public.document_chunks for select to authenticated
  using (
    exists (
      select 1 from public.knowledge_documents kd
      where kd.id = document_chunks.document_id
        and (kd.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "document_chunks_insert"
  on public.document_chunks for insert to authenticated
  with check (
    exists (
      select 1 from public.knowledge_documents kd
      where kd.id = document_chunks.document_id
        and (kd.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "document_chunks_update"
  on public.document_chunks for update to authenticated
  using (
    exists (
      select 1 from public.knowledge_documents kd
      where kd.id = document_chunks.document_id
        and (kd.owner_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.knowledge_documents kd
      where kd.id = document_chunks.document_id
        and (kd.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "document_chunks_delete"
  on public.document_chunks for delete to authenticated
  using (
    exists (
      select 1 from public.knowledge_documents kd
      where kd.id = document_chunks.document_id
        and (kd.owner_id = auth.uid() or public.is_admin())
    )
  );
