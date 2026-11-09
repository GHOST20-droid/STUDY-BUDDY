-- StudyVerse AI: Supabase schema (free tier). Run once in the Supabase SQL editor.
-- Students use Supabase ANONYMOUS sign-in: no login screen, but every browser still gets a real auth.uid(),
-- so row-level security isolates each student's data. Admins are separate email+password users listed in public.admins.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------- admin ----------
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade, email text not null, created_at timestamptz default now());
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.admins a where a.user_id = auth.uid()) and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false $$;
alter table public.admins enable row level security;
create policy admins_self_read on public.admins for select to authenticated using (user_id = auth.uid());

-- ---------- student data ----------
create table public.student_profiles (user_id uuid primary key references auth.users(id) on delete cascade, display_name text, daily_goal_minutes int default 45, daily_goal_doubts int default 2, daily_goal_questions int default 8, created_at timestamptz default now());
create table public.subjects (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, name text not null check (char_length(name) between 1 and 120), color text default '#4F46E5', created_at timestamptz default now());
create table public.chapters (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, subject_id uuid not null references public.subjects(id) on delete cascade, title text not null check (char_length(title) between 1 and 160), position int default 0);
create table public.topics (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, chapter_id uuid not null references public.chapters(id) on delete cascade, title text not null check (char_length(title) between 1 and 160), position int default 0);

create table public.documents (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, subject_id uuid references public.subjects(id) on delete cascade, chapter_id uuid references public.chapters(id) on delete set null,
  name text not null, file_type text not null check (file_type in ('pdf','pptx','docx','txt','paste')), storage_path text, size_bytes bigint default 0, use_in_ai boolean default true, visibility text not null default 'private' check (visibility in ('private','shared')), created_at timestamptz default now());
create table public.document_chunks (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, document_id uuid not null references public.documents(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null, topic_id uuid references public.topics(id) on delete set null, location text not null,  -- 'p.3' or 'Slide 12'
  content text not null, embedding vector(768), fts tsvector generated always as (to_tsvector('english', content)) stored);
create index document_chunks_doc_idx on public.document_chunks(document_id);
create index document_chunks_fts_idx on public.document_chunks using gin(fts);
create index document_chunks_vec_idx on public.document_chunks using hnsw (embedding vector_cosine_ops);

create table public.learning_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, subject_id uuid references public.subjects(id) on delete cascade, chapter_id uuid references public.chapters(id) on delete set null, mode text default 'deep' check (mode in ('deep','express')), lesson_point text, paused boolean default false, updated_at timestamptz default now());
create table public.messages (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, session_id uuid not null references public.learning_sessions(id) on delete cascade, role text not null check (role in ('user','assistant')), content text not null, citations jsonb default '[]', is_doubt boolean default false, created_at timestamptz default now());
create table public.topic_mastery (user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, topic_id uuid not null references public.topics(id) on delete cascade, concept int check (concept between 0 and 100), formula int check (formula between 0 and 100), numerical int check (numerical between 0 and 100), consecutive_errors int default 0, updated_at timestamptz default now(), primary key (user_id, topic_id));
create table public.learning_assessments (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, topic_id uuid references public.topics(id) on delete cascade, dimension text check (dimension in ('concept','formula','numerical')), signal text check (signal in ('correct','partial','incorrect')), created_at timestamptz default now());
create table public.student_mistakes (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, topic_id uuid references public.topics(id) on delete cascade, label text not null, created_at timestamptz default now());
create table public.unresolved_doubts (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, subject_id uuid references public.subjects(id) on delete cascade, topic_id uuid references public.topics(id) on delete set null, text text not null, status text default 'open' check (status in ('open','resolved')), created_at timestamptz default now(), resolved_at timestamptz);
create table public.exam_schedules (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, subject_id uuid not null references public.subjects(id) on delete cascade, exam_date date not null, hours_per_day numeric(3,1) not null check (hours_per_day between 0.5 and 14), understanding int check (understanding between 1 and 5), chapter_ids uuid[] default '{}', completed_topic_ids uuid[] default '{}', important_topic_ids uuid[] default '{}');
create table public.study_plans (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, exam_id uuid not null references public.exam_schedules(id) on delete cascade, plan jsonb not null, done jsonb default '{}', generated_at timestamptz default now());
create table public.practice_questions (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, topic_id uuid references public.topics(id) on delete cascade, kind text check (kind in ('numerical','mcq','short')), source text not null check (source in ('notes','generated','ai')), prompt text not null, payload jsonb not null, created_at timestamptz default now());  -- never labelled as official exam questions
create table public.practice_attempts (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade, question_id uuid references public.practice_questions(id) on delete set null, topic_id uuid references public.topics(id) on delete cascade, correct boolean not null, confidence text, diagnosis text, created_at timestamptz default now());

-- ---------- community (a shared note is its own copy; private documents are never exposed) ----------
create table public.shared_notes (id uuid primary key default gen_random_uuid(), contributor_id uuid not null default auth.uid() references auth.users(id) on delete cascade, contributor_name text default 'A student', title text not null check (char_length(title) between 1 and 160), subject_name text not null, chapter_name text, description text, body text not null check (char_length(body) <= 60000),
  status text not null default 'active' check (status in ('active','hidden','removed')), created_at timestamptz default now());
create table public.note_permissions (note_id uuid references public.shared_notes(id) on delete cascade, grantee_id uuid references auth.users(id) on delete cascade, can_save boolean default true, primary key (note_id, grantee_id));
create table public.note_reports (id uuid primary key default gen_random_uuid(), note_id uuid not null references public.shared_notes(id) on delete cascade, reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade, reason text check (char_length(reason) <= 500), created_at timestamptz default now(), unique (note_id, reporter_id));

-- ---------- row level security ----------
do $$ declare t text; begin
  foreach t in array array['subjects','chapters','topics','documents','document_chunks','learning_sessions','messages','learning_assessments','student_mistakes','unresolved_doubts','exam_schedules','study_plans','practice_questions','practice_attempts','topic_mastery','student_profiles'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_owner', t);
  end loop; end $$;

alter table public.shared_notes enable row level security; alter table public.note_permissions enable row level security; alter table public.note_reports enable row level security;
create policy shared_read   on public.shared_notes for select to authenticated using (status = 'active' or contributor_id = auth.uid() or public.is_admin());
create policy shared_insert on public.shared_notes for insert to authenticated with check (contributor_id = auth.uid());
create policy shared_update_own on public.shared_notes for update to authenticated using (contributor_id = auth.uid()) with check (contributor_id = auth.uid() and status = 'active');
create policy shared_delete_own on public.shared_notes for delete to authenticated using (contributor_id = auth.uid());
create policy shared_admin_update on public.shared_notes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy shared_admin_delete on public.shared_notes for delete to authenticated using (public.is_admin());
create policy perms_owner on public.note_permissions for all to authenticated using (exists (select 1 from public.shared_notes n where n.id = note_id and n.contributor_id = auth.uid())) with check (exists (select 1 from public.shared_notes n where n.id = note_id and n.contributor_id = auth.uid()));
create policy reports_insert on public.note_reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_own_read on public.note_reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy reports_admin_delete on public.note_reports for delete to authenticated using (public.is_admin());

-- hide a note automatically once three different students report it (an admin then reviews it)
create or replace function public.auto_hide_reported() returns trigger language plpgsql security definer set search_path = public as
$$ begin if (select count(*) from public.note_reports where note_id = new.note_id) >= 3 then update public.shared_notes set status = 'hidden' where id = new.note_id and status = 'active'; end if; return new; end $$;
create trigger note_reports_autohide after insert on public.note_reports for each row execute function public.auto_hide_reported();

-- ---------- retrieval: runs as the caller, so RLS keeps other students' chunks out ----------
create or replace function public.match_chunks(query_embedding vector(768), match_count int default 5, doc_ids uuid[] default null)
returns table (id uuid, document_id uuid, location text, content text, similarity float) language sql stable security invoker set search_path = public as
$$ select c.id, c.document_id, c.location, c.content, 1 - (c.embedding <=> query_embedding) from public.document_chunks c
   where c.embedding is not null and (doc_ids is null or c.document_id = any(doc_ids)) order by c.embedding <=> query_embedding limit least(match_count, 12) $$;

-- ---------- private file storage: each student can only touch their own folder ----------
insert into storage.buckets (id, name, public) values ('notes', 'notes', false) on conflict do nothing;
create policy notes_own_read   on storage.objects for select to authenticated using (bucket_id = 'notes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy notes_own_insert on storage.objects for insert to authenticated with check (bucket_id = 'notes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy notes_own_delete on storage.objects for delete to authenticated using (bucket_id = 'notes' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- after creating your admin user in Authentication > Users, run (with your user's email): ----------
-- insert into public.admins (user_id, email) select id, email from auth.users where email = 'you@example.com';
-- Run ONCE in the Supabase SQL editor (after schema.sql). Adds the table that saves each student's data across devices.
create table if not exists public.student_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.student_state enable row level security;
create policy student_state_owner on public.student_state for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
