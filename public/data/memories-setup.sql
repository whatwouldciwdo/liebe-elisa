-- Run once in the Supabase SQL Editor.
-- Create the manager account in Authentication > Users and disable public signup.
-- Only accounts explicitly added to memory_admins can upload or insert memories.
create table if not exists public.memory_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.memory_admins enable row level security;
drop policy if exists "Read own manager membership" on public.memory_admins;
create policy "Read own manager membership" on public.memory_admins
  for select to authenticated using (user_id = auth.uid());

-- After creating your account, replace the email below and run this statement:
-- insert into public.memory_admins(user_id)
-- select id from auth.users where email = 'your-manager-email@example.com'
-- on conflict do nothing;

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  month text not null check (month ~ '^202[567]-(0[1-9]|1[0-2])$' and month >= '2025-12' and month <= '2027-01'),
  title text not null check (length(trim(title)) between 1 and 120),
  caption text not null default '' check (length(caption) <= 1000),
  image_url text not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists memories_month_idx on public.memories(month, created_at);
alter table public.memories enable row level security;
drop policy if exists "Public memories read" on public.memories;
create policy "Public memories read" on public.memories for select to anon, authenticated using (true);
drop policy if exists "Managers add memories" on public.memories;
create policy "Managers add memories" on public.memories for insert to authenticated
  with check (exists(select 1 from public.memory_admins where user_id = auth.uid()));
grant select on public.memory_admins to authenticated;
grant select on public.memories to anon, authenticated;
grant insert on public.memories to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('memories', 'memories', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Managers upload memories" on storage.objects;
create policy "Managers upload memories" on storage.objects for insert to authenticated
  with check (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text
    and exists(select 1 from public.memory_admins where user_id = auth.uid()));
drop policy if exists "Managers read memory storage" on storage.objects;
create policy "Managers read memory storage" on storage.objects for select to authenticated
  using (bucket_id = 'memories' and exists(select 1 from public.memory_admins where user_id = auth.uid()));
drop policy if exists "Managers clean failed uploads" on storage.objects;
create policy "Managers clean failed uploads" on storage.objects for delete to authenticated
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = auth.uid()::text
    and exists(select 1 from public.memory_admins where user_id = auth.uid()));