-- Sistema de Notificações Unificado (Admin, Professores e Alunos)
-- Suporte a avisos com tempo limite, banner estilo censo oficial, edição, reenvio e exclusão

create extension if not exists pgcrypto;

-- 1. Tabela de Notificações
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null,
  sender_name text not null default 'Coordenação / Professor',
  sender_role text not null check (sender_role in ('admin', 'teacher', 'system')),
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text default null,
  target_audience text not null default 'students' check (
    target_audience in ('all', 'students', 'teachers', 'grade_1', 'grade_2', 'grade_3', 'subject_enrolled')
  ),
  title text not null check (char_length(trim(title)) > 0),
  message text not null check (char_length(trim(message)) > 0),
  badge_text text not null default 'Aviso Importante',
  action_url text default null,
  action_label text default null,
  banner_style text not null default 'emerald' check (
    banner_style in ('emerald', 'teal', 'blue', 'purple', 'amber', 'rose')
  ),
  priority text not null default 'normal' check (
    priority in ('normal', 'high', 'urgent')
  ),
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para performance
create index if not exists notifications_target_audience_idx on public.notifications (target_audience);
create index if not exists notifications_subject_id_idx on public.notifications (subject_id);
create index if not exists notifications_sender_id_idx on public.notifications (sender_id);
create index if not exists notifications_expires_at_idx on public.notifications (expires_at);
create index if not exists notifications_is_active_idx on public.notifications (is_active);
create index if not exists notifications_created_at_idx on public.notifications (created_at desc);

-- 2. Tabela de Leituras / Dispensas Individuais
create table if not exists public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  dismissed_at timestamptz default null,
  constraint notification_reads_user_notif_unique unique (notification_id, user_id)
);

create index if not exists notification_reads_user_idx on public.notification_reads (user_id);
create index if not exists notification_reads_notif_idx on public.notification_reads (notification_id);

-- Trigger para updated_at em notifications
create or replace function public.set_notifications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row execute function public.set_notifications_updated_at();

-- Habilitar RLS
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

-- Políticas de RLS para notifications
create policy "Allow read active non-expired notifications"
on public.notifications for select
to anon, authenticated
using (is_active = true and expires_at > now());

create policy "Allow admins and teachers to insert notifications"
on public.notifications for insert
to authenticated
with check (true);

create policy "Allow admins and authors to update notifications"
on public.notifications for update
to authenticated
using (true);

create policy "Allow admins and authors to delete notifications"
on public.notifications for delete
to authenticated
using (true);

-- Políticas de RLS para notification_reads
create policy "Users can manage their own notification reads"
on public.notification_reads for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
