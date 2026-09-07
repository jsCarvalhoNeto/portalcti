-- Censo de Camisas do Curso Técnico
-- Tabela para registro dos tamanhos e modelos escolhidos pelos alunos

create extension if not exists pgcrypto;

create table if not exists public.shirt_orders (
  id uuid primary key default gen_random_uuid(),
  student_name text not null check (char_length(trim(student_name)) >= 2),
  student_id uuid references auth.users(id) on delete set null,
  student_registration text default '',
  grade text not null check (char_length(trim(grade)) > 0),
  model text not null check (model in ('masculino', 'feminino')),
  size text not null check (size in ('P', 'M', 'G', 'GG', 'XGG')),
  notes text default '',
  session_code text not null default 'GERAL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para busca rápida e agregação por turma e sessão
create index if not exists shirt_orders_grade_idx on public.shirt_orders (grade);
create index if not exists shirt_orders_session_idx on public.shirt_orders (session_code);
create index if not exists shirt_orders_created_at_idx on public.shirt_orders (created_at desc);

-- Trigger para atualização do updated_at
create or replace function public.set_shirt_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shirt_orders_set_updated_at on public.shirt_orders;
create trigger shirt_orders_set_updated_at
before update on public.shirt_orders
for each row execute function public.set_shirt_orders_updated_at();

-- Habilitar Row Level Security (RLS)
alter table public.shirt_orders enable row level security;

-- Políticas de RLS:
-- 1. Qualquer usuário autenticado ou anônimo pode cadastrar seu pedido
create policy "Anyone can register shirt order"
on public.shirt_orders for insert
to anon, authenticated
with check (true);

-- 2. Leitura pública para agregação ou pelo professor autenticado
create policy "Shirt orders are readable"
on public.shirt_orders for select
to anon, authenticated
using (true);

-- 3. Atualização e exclusão de pedidos por usuários autenticados
create policy "Authenticated users can update shirt orders"
on public.shirt_orders for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete shirt orders"
on public.shirt_orders for delete
to authenticated
using (true);
