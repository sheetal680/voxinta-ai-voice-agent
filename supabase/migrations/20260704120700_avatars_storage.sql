-- ---------------------------------------------------------------------------
-- 20260704120700_avatars_storage.sql
-- Storage bucket for agent avatar images. Path convention:
-- avatars/{owner_id}/{filename} — the owner_id prefix is what the RLS
-- policies below check against auth.uid().
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB, mirrors AVATAR_MAX_SIZE_BYTES in features/agents/constants.ts
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Avatars are agent-facing images with no sensitive content, so reads are
-- public; writes/deletes are restricted to the owning user's own folder.
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
