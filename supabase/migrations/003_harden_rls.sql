-- Harden RLS: remove recursive profiles policies, add safe client lookup RPC,
-- and protect sensitive profile fields from client self-updates.

-- Helper: read current user's role without re-entering profiles RLS
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

-- Trainers can look up a client by exact email (case-insensitive) without
-- granting select on all client profiles.
create or replace function public.find_client_by_email(lookup_email text)
returns table (
  id uuid,
  email text,
  full_name text,
  role text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  if public.current_user_role() is distinct from 'trainer' then
    return;
  end if;

  return query
  select p.id, p.email, p.full_name, p.role
  from public.profiles p
  where p.role = 'client'
    and lower(p.email) = lower(trim(lookup_email))
  limit 1;
end;
$$;

revoke all on function public.find_client_by_email(text) from public;
grant execute on function public.find_client_by_email(text) to authenticated;

-- Drop the broad/recursive "find any client" policy
drop policy if exists "Trainers can find client profiles" on public.profiles;

-- Recreate linked-client / linked-trainer policies using the helper
-- (avoids recursive profiles-from-profiles checks)
drop policy if exists "Trainers can view their clients" on public.profiles;
create policy "Trainers can view their clients"
  on public.profiles for select
  using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.trainer_id = auth.uid() and tc.client_id = profiles.id
    )
  );

drop policy if exists "Clients can view their trainer" on public.profiles;
create policy "Clients can view their trainer"
  on public.profiles for select
  using (
    exists (
      select 1 from public.trainer_clients tc
      where tc.client_id = auth.uid() and tc.trainer_id = profiles.id
    )
  );

-- Only allow limited self-updates (not role / billing fields)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Never let authenticated clients change role or billing columns
  if tg_op = 'UPDATE' and auth.uid() is not null then
    new.role := old.role;
    new.subscription_status := old.subscription_status;
    new.stripe_customer_id := old.stripe_customer_id;
    new.email := old.email;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Normalize emails to lowercase on insert/update via handle_new_user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case
      when coalesce(new.raw_user_meta_data ->> 'role', 'trainer') = 'client'
        then 'client'
      else 'trainer'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;

-- Case-insensitive email lookups
create index if not exists idx_profiles_email_lower on public.profiles (lower(email));

-- Ensure trainer_clients inserts verify both parties exist and roles are correct
create or replace function public.validate_trainer_client_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trainer_role text;
  client_role text;
begin
  select role into trainer_role from public.profiles where id = new.trainer_id;
  select role into client_role from public.profiles where id = new.client_id;

  if trainer_role is distinct from 'trainer' then
    raise exception 'trainer_id must reference a trainer profile';
  end if;
  if client_role is distinct from 'client' then
    raise exception 'client_id must reference a client profile';
  end if;
  if new.trainer_id = new.client_id then
    raise exception 'cannot link a profile to itself';
  end if;

  return new;
end;
$$;

drop trigger if exists trainer_clients_validate on public.trainer_clients;
create trigger trainer_clients_validate
  before insert or update on public.trainer_clients
  for each row execute function public.validate_trainer_client_link();
