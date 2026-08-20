-- Jogos Educativos: catálogo independente das atividades por disciplina.
-- Execute esta migração no projeto Supabase antes de publicar o frontend.

create extension if not exists pgcrypto;

create table if not exists public.educational_games (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 140),
  description text not null default '',
  code_content text not null check (char_length(trim(code_content)) > 0),
  access_mode text not null default 'classroom' check (access_mode in ('classroom', 'online')),
  is_published boolean not null default false,
  share_code varchar(12) not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists educational_games_teacher_updated_idx
  on public.educational_games (teacher_id, updated_at desc);

create index if not exists educational_games_public_share_idx
  on public.educational_games (share_code)
  where is_published = true;

create or replace function public.set_educational_games_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists educational_games_set_updated_at on public.educational_games;
create trigger educational_games_set_updated_at
before update on public.educational_games
for each row execute function public.set_educational_games_updated_at();

alter table public.educational_games enable row level security;

create policy "Teachers read their own educational games"
on public.educational_games for select
to authenticated
using (auth.uid() = teacher_id);

create policy "Teachers create their own educational games"
on public.educational_games for insert
to authenticated
with check (auth.uid() = teacher_id);

create policy "Teachers update their own educational games"
on public.educational_games for update
to authenticated
using (auth.uid() = teacher_id)
with check (auth.uid() = teacher_id);

create policy "Teachers delete their own educational games"
on public.educational_games for delete
to authenticated
using (auth.uid() = teacher_id);

-- A rota pública precisa ler somente jogos já publicados pelo professor.
create policy "Published educational games are publicly readable"
on public.educational_games for select
to anon, authenticated
using (is_published = true);
