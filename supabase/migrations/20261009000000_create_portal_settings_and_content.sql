-- Migration: Criar tabelas para personalização e configurações do Portal
-- Permite gerenciar dinamicamente: Menu do Portal, Notícias, Projetos, Eventos e Informações de Contato

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabela de Configurações Gerais do Portal (Menu, Contato, Redes Sociais, Destaques)
CREATE TABLE IF NOT EXISTS public.portal_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  menu_items JSONB NOT NULL DEFAULT '[
    {"id": "inicio", "name": "Início", "href": "/", "is_active": true, "order": 1},
    {"id": "disciplinas", "name": "Disciplinas", "href": "/disciplinas", "is_active": true, "order": 2},
    {"id": "projetos", "name": "Projetos", "href": "#projects", "is_active": true, "order": 3},
    {"id": "noticias", "name": "Notícias", "href": "#news", "is_active": true, "order": 4},
    {"id": "eventos", "name": "Eventos", "href": "/eventos", "is_active": true, "order": 5},
    {"id": "contato", "name": "Contato", "href": "#contact", "is_active": true, "order": 6}
  ]'::jsonb,
  contact_info JSONB NOT NULL DEFAULT '{
    "school_name": "EEEP Balbina Viana Arraes",
    "course_name": "Curso Técnico em Informática",
    "address": "Brejo Santo - CE",
    "email": "suporte@portalinfobva.tech",
    "secondary_email": "coordenacao@portalinfobva.tech",
    "phone": "(88) 3531-0000",
    "whatsapp": "(88) 99999-0000",
    "business_hours": "Segunda a Sexta: 07:30 às 17:00"
  }'::jsonb,
  social_links JSONB NOT NULL DEFAULT '{
    "instagram": "https://instagram.com",
    "github": "https://github.com",
    "youtube": "https://youtube.com",
    "linkedin": ""
  }'::jsonb,
  featured_subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir registro padrão se ainda não existir
INSERT INTO public.portal_settings (id)
VALUES ('main')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Notícias do Portal
CREATE TABLE IF NOT EXISTS public.portal_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  excerpt TEXT NOT NULL CHECK (char_length(trim(excerpt)) > 0),
  content TEXT DEFAULT NULL,
  category TEXT NOT NULL DEFAULT 'Tecnologia',
  read_time TEXT NOT NULL DEFAULT '4 min',
  image_url TEXT DEFAULT NULL,
  author_name TEXT DEFAULT 'Curso Técnico',
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_news_is_active_idx ON public.portal_news (is_active);
CREATE INDEX IF NOT EXISTS portal_news_published_at_idx ON public.portal_news (published_at DESC);
CREATE INDEX IF NOT EXISTS portal_news_display_order_idx ON public.portal_news (display_order ASC);

-- 3. Tabela de Projetos em Destaque do Portal
CREATE TABLE IF NOT EXISTS public.portal_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0),
  category TEXT NOT NULL DEFAULT 'Web',
  technologies TEXT[] NOT NULL DEFAULT '{}',
  author_name TEXT DEFAULT 'Alunos do Curso Técnico',
  repo_url TEXT DEFAULT NULL,
  demo_url TEXT DEFAULT NULL,
  image_url TEXT DEFAULT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_projects_is_active_idx ON public.portal_projects (is_active);
CREATE INDEX IF NOT EXISTS portal_projects_display_order_idx ON public.portal_projects (display_order ASC);

-- 4. Tabela de Eventos do Portal
CREATE TABLE IF NOT EXISTS public.portal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  subtitle TEXT DEFAULT NULL,
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0),
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  location TEXT NOT NULL DEFAULT 'EEEP Balbina Viana Arraes',
  attendees_count INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL DEFAULT 'Evento',
  status TEXT NOT NULL DEFAULT 'registration-open' CHECK (
    status IN ('registration-open', 'registration-closed', 'upcoming', 'finished')
  ),
  registration_url TEXT DEFAULT '/eventos/inscricao',
  is_main_event BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS portal_events_is_active_idx ON public.portal_events (is_active);
CREATE INDEX IF NOT EXISTS portal_events_is_main_event_idx ON public.portal_events (is_main_event);

-- Inserir dados iniciais (Seeds) de Notícias, se a tabela estiver vazia
INSERT INTO public.portal_news (title, excerpt, category, read_time, published_at, display_order)
SELECT 
  'IA Generativa Revoluciona Desenvolvimento de Software',
  'Novas ferramentas de IA estão transformando a forma como desenvolvedores criam e testam código, aumentando a produtividade em até 40%.',
  'Tecnologia',
  '4 min',
  CURRENT_DATE - INTERVAL '1 day',
  1
WHERE NOT EXISTS (SELECT 1 FROM public.portal_news LIMIT 1);

INSERT INTO public.portal_news (title, excerpt, category, read_time, published_at, display_order)
SELECT 
  'Lançamento do Novo Framework React 19',
  'O React 19 traz melhorias significativas no desempenho e novas APIs que simplificam o desenvolvimento de aplicações complexas.',
  'Desenvolvimento',
  '3 min',
  CURRENT_DATE - INTERVAL '2 days',
  2
WHERE (SELECT COUNT(*) FROM public.portal_news) = 1;

INSERT INTO public.portal_news (title, excerpt, category, read_time, published_at, display_order)
SELECT 
  'Segurança em Aplicações Web: Novas Tendências',
  'Com o aumento de ataques cibernéticos, as melhores práticas de segurança estão evoluindo para proteger aplicações modernas contra ameaças emergentes.',
  'Segurança',
  '5 min',
  CURRENT_DATE - INTERVAL '3 days',
  3
WHERE (SELECT COUNT(*) FROM public.portal_news) = 2;

-- Inserir dados iniciais de Eventos (Evento Principal Saberes em Conexão)
INSERT INTO public.portal_events (
  title, subtitle, description, start_date, end_date, location, attendees_count, event_type, status, registration_url, is_main_event, display_order
)
SELECT 
  'Saberes em Conexão',
  'Escola, Ciência e Sociedade 2025',
  'Um evento que conecta conhecimento acadêmico, pesquisa científica e aplicação prática na sociedade, promovendo a integração entre escola, universidade e comunidade.',
  '2025-12-08',
  '2025-12-12',
  'EEEP Balbina Viana Arraes',
  0,
  'Evento',
  'registration-closed',
  '/eventos/inscricao',
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.portal_events LIMIT 1);

-- Inserir dados iniciais de Projetos
INSERT INTO public.portal_projects (
  title, description, category, technologies, author_name, is_featured, display_order
)
SELECT 
  'Portal Institucional do Curso Técnico',
  'Plataforma completa para gestão acadêmica, gamificação, simuladores e portfólio de estudantes.',
  'Web',
  ARRAY['React', 'TypeScript', 'TailwindCSS', 'Supabase'],
  'Turma do 3º Ano',
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.portal_projects LIMIT 1);

INSERT INTO public.portal_projects (
  title, description, category, technologies, author_name, is_featured, display_order
)
SELECT 
  'Laboratório de Jogos Educacionais',
  'Mini-jogos e simuladores de lógica de programação e algoritmos desenvolvidos pelos estudantes.',
  'Games',
  ARRAY['JavaScript', 'HTML5 Canvas', 'CSS3'],
  'Turma do 2º Ano',
  true,
  2
WHERE (SELECT COUNT(*) FROM public.portal_projects) = 1;

-- 5. Configurar Row Level Security (RLS)
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_events ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura: Pública para visitantes anônimos e autenticados
CREATE POLICY "Public read portal_settings"
  ON public.portal_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read portal_news"
  ON public.portal_news FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR (auth.uid() IS NOT NULL));

CREATE POLICY "Public read portal_projects"
  ON public.portal_projects FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR (auth.uid() IS NOT NULL));

CREATE POLICY "Public read portal_events"
  ON public.portal_events FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR (auth.uid() IS NOT NULL));

-- Políticas de Escrita (INSERT, UPDATE, DELETE): Usuários autenticados (administradores)
CREATE POLICY "Allow authenticated insert portal_settings"
  ON public.portal_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update portal_settings"
  ON public.portal_settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert portal_news"
  ON public.portal_news FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update portal_news"
  ON public.portal_news FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete portal_news"
  ON public.portal_news FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert portal_projects"
  ON public.portal_projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update portal_projects"
  ON public.portal_projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete portal_projects"
  ON public.portal_projects FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert portal_events"
  ON public.portal_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update portal_events"
  ON public.portal_events FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete portal_events"
  ON public.portal_events FOR DELETE
  TO authenticated
  USING (true);
