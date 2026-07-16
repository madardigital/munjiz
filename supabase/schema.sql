-- منجِز: مخطط Supabase/PostgreSQL
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  course text not null check (char_length(course) between 1 and 120),
  instructor text check (instructor is null or char_length(instructor) <= 120),
  assignment_type text not null default 'أخرى' check (assignment_type in ('بحث','تقرير','عرض تقديمي','واجب','مشروع','اختبار','أخرى')),
  due_at timestamptz not null,
  priority text not null default 'متوسطة' check (priority in ('منخفضة','متوسطة','عالية','عاجلة')),
  status text not null default 'لم يبدأ' check (status in ('لم يبدأ','جارٍ العمل','يحتاج معلومات','جاهز للمراجعة','مكتمل')),
  instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  is_done boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  remind_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  category text not null default 'أخرى',
  created_at timestamptz not null default now()
);

create index if not exists assignments_user_due_idx on public.assignments(user_id, due_at);
create index if not exists tasks_assignment_position_idx on public.tasks(assignment_id, position);
create index if not exists reminders_user_time_idx on public.reminders(user_id, remind_at);
create index if not exists attachments_assignment_idx on public.attachments(assignment_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at before update on public.assignments for each row execute function public.set_updated_at();
drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.attachments enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy assignments_select_own on public.assignments for select to authenticated using ((select auth.uid()) = user_id);
create policy assignments_insert_own on public.assignments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy assignments_update_own on public.assignments for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy assignments_delete_own on public.assignments for delete to authenticated using ((select auth.uid()) = user_id);

create policy tasks_select_own on public.tasks for select to authenticated using ((select auth.uid()) = user_id);
create policy tasks_insert_own on public.tasks for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.assignments a where a.id = assignment_id and a.user_id = (select auth.uid())));
create policy tasks_update_own on public.tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and exists (select 1 from public.assignments a where a.id = assignment_id and a.user_id = (select auth.uid())));
create policy tasks_delete_own on public.tasks for delete to authenticated using ((select auth.uid()) = user_id);

create policy reminders_select_own on public.reminders for select to authenticated using ((select auth.uid()) = user_id);
create policy reminders_insert_own on public.reminders for insert to authenticated with check ((select auth.uid()) = user_id);
create policy reminders_update_own on public.reminders for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy reminders_delete_own on public.reminders for delete to authenticated using ((select auth.uid()) = user_id);

create policy attachments_select_own on public.attachments for select to authenticated using ((select auth.uid()) = user_id);
create policy attachments_insert_own on public.attachments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy attachments_delete_own on public.attachments for delete to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.assignments, public.tasks, public.reminders, public.attachments to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assignment-files','assignment-files',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy assignment_files_select_own on storage.objects for select to authenticated using (bucket_id='assignment-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy assignment_files_insert_own on storage.objects for insert to authenticated with check (bucket_id='assignment-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy assignment_files_update_own on storage.objects for update to authenticated using (bucket_id='assignment-files' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='assignment-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy assignment_files_delete_own on storage.objects for delete to authenticated using (bucket_id='assignment-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
