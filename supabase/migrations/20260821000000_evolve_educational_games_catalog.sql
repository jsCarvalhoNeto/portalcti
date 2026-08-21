-- Evolução incremental do catálogo. Mantém todos os jogos existentes válidos.
alter table public.educational_games
  add column if not exists template_key text,
  add column if not exists template_version integer not null default 1 check (template_version > 0),
  add column if not exists capabilities text[] not null default array['singleplayer', 'keyboard', 'touch']::text[],
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists revision integer not null default 1 check (revision > 0),
  add column if not exists published_at timestamptz;

update public.educational_games
set published_at = coalesce(published_at, updated_at)
where is_published = true;

create or replace function public.set_educational_games_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  if new.is_published and (not old.is_published or new.published_at is null) then
    new.published_at = now();
  elsif not new.is_published then
    new.published_at = null;
  end if;
  return new;
end;
$$;

create index if not exists educational_games_template_idx
  on public.educational_games (template_key, template_version)
  where template_key is not null;
