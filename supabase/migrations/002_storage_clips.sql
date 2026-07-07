-- Clips storage bucket and policies
-- Run in Supabase SQL editor if clip uploads fail

insert into storage.buckets (id, name, public)
values ('clips', 'clips', false)
on conflict (id) do nothing;

create policy "Trainers upload clips"
  on storage.objects for insert
  with check (
    bucket_id = 'clips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Trainers manage own clip files"
  on storage.objects for all
  using (
    bucket_id = 'clips'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Clients read assigned clips"
  on storage.objects for select
  using (
    bucket_id = 'clips'
    and exists (
      select 1 from public.clips c
      join public.playlist_items pi on pi.clip_id = c.id
      join public.assignments a on a.playlist_id = pi.playlist_id
      where c.storage_path = name and a.client_id = auth.uid()
    )
  );
