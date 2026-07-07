-- CourtWork: Basketball trainer homework playlists
-- Run via Supabase CLI or SQL editor

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'trainer' check (role in ('trainer', 'client')),
  avatar_url text,
  stripe_customer_id text unique,
  subscription_status text default 'free' check (subscription_status in ('free', 'active', 'canceled', 'past_due')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trainer-client relationships
create table public.trainer_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (trainer_id, client_id)
);

-- Video clips library
create table public.clips (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  storage_path text not null,
  duration_seconds integer,
  thumbnail_url text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Playlists (homework templates)
create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Playlist items (ordered clips)
create table public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  position integer not null default 0,
  notes text,
  unique (playlist_id, clip_id)
);

-- Homework assignments
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text,
  due_date date,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Client progress per clip in an assignment
create table public.assignment_progress (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  completed_at timestamptz,
  unique (assignment_id, clip_id)
);

-- Indexes
create index idx_clips_trainer on public.clips(trainer_id);
create index idx_playlists_trainer on public.playlists(trainer_id);
create index idx_playlist_items_playlist on public.playlist_items(playlist_id);
create index idx_assignments_client on public.assignments(client_id);
create index idx_assignments_trainer on public.assignments(trainer_id);
create index idx_trainer_clients_trainer on public.trainer_clients(trainer_id);
create index idx_trainer_clients_client on public.trainer_clients(client_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'trainer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger clips_updated_at before update on public.clips
  for each row execute function public.set_updated_at();
create trigger playlists_updated_at before update on public.playlists
  for each row execute function public.set_updated_at();
create trigger assignments_updated_at before update on public.assignments
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.trainer_clients enable row level security;
alter table public.clips enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_progress enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Trainers can view their clients"
  on public.profiles for select
  using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.trainer_id = auth.uid() and tc.client_id = profiles.id
    )
  );

create policy "Clients can view their trainer"
  on public.profiles for select
  using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.client_id = auth.uid() and tc.trainer_id = profiles.id
    )
  );

create policy "Trainers can find client profiles"
  on public.profiles for select
  using (
    role = 'client'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'trainer'
    )
  );

-- Trainer-clients policies
create policy "Trainers manage their client links"
  on public.trainer_clients for all
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

create policy "Clients view their trainer links"
  on public.trainer_clients for select
  using (client_id = auth.uid());

-- Clips policies
create policy "Trainers manage own clips"
  on public.clips for all
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

create policy "Clients view assigned clips"
  on public.clips for select
  using (
    exists (
      select 1 from public.assignments a
      join public.playlist_items pi on pi.playlist_id = a.playlist_id
      where a.client_id = auth.uid() and pi.clip_id = clips.id
    )
  );

-- Playlists policies
create policy "Trainers manage own playlists"
  on public.playlists for all
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

create policy "Clients view assigned playlists"
  on public.playlists for select
  using (
    exists (
      select 1 from public.assignments a
      where a.client_id = auth.uid() and a.playlist_id = playlists.id
    )
  );

-- Playlist items policies
create policy "Trainers manage playlist items"
  on public.playlist_items for all
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_items.playlist_id and p.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_items.playlist_id and p.trainer_id = auth.uid()
    )
  );

create policy "Clients view assigned playlist items"
  on public.playlist_items for select
  using (
    exists (
      select 1 from public.assignments a
      where a.client_id = auth.uid() and a.playlist_id = playlist_items.playlist_id
    )
  );

-- Assignments policies
create policy "Trainers manage assignments"
  on public.assignments for all
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

create policy "Clients view own assignments"
  on public.assignments for select
  using (client_id = auth.uid());

create policy "Clients update own assignment status"
  on public.assignments for update
  using (client_id = auth.uid())
  with check (client_id = auth.uid());

-- Assignment progress policies
create policy "Clients manage own progress"
  on public.assignment_progress for all
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_progress.assignment_id and a.client_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_progress.assignment_id and a.client_id = auth.uid()
    )
  );

create policy "Trainers view client progress"
  on public.assignment_progress for select
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_progress.assignment_id and a.trainer_id = auth.uid()
    )
  );

-- Storage bucket (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('clips', 'clips', false);

-- Storage policies (apply after bucket creation):
-- create policy "Trainers upload clips" on storage.objects for insert
--   with check (bucket_id = 'clips' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Trainers manage own clip files" on storage.objects for all
--   using (bucket_id = 'clips' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Clients read assigned clips" on storage.objects for select
--   using (bucket_id = 'clips' and exists (
--     select 1 from public.clips c
--     join public.playlist_items pi on pi.clip_id = c.id
--     join public.assignments a on a.playlist_id = pi.playlist_id
--     where c.storage_path = name and a.client_id = auth.uid()
--   ));
