-- ---------------------------------------------------------------------------
-- 20260704120800_documents_storage.sql
-- Storage bucket for uploaded knowledge-base source files (PDF/DOCX/TXT/MD).
-- Path convention: documents/{owner_id}/{document_id}-{filename} — the
-- owner_id prefix is what the RLS policies below check against auth.uid().
--
-- Unlike avatars, these files may contain private business content, so the
-- bucket is NOT public — every operation (including read) is owner-scoped.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10MB, mirrors KNOWLEDGE_MAX_FILE_SIZE_BYTES in features/knowledge/constants.ts
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/x-markdown'
  ]
)
on conflict (id) do nothing;

create policy "documents_owner_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "documents_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
