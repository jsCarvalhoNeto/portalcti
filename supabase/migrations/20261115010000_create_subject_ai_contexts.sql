-- Migration: Contexto de IA por disciplina (ementa, cronograma, escopo e modelo de aula)
-- Permite salvar o resumo pedagógico extraído dos PDFs, o mapeamento de aulas e o modelo/template da disciplina.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.subject_ai_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id BIGINT NOT NULL UNIQUE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_lessons INTEGER NOT NULL DEFAULT 20 CHECK (total_lessons > 0),
  syllabus_text TEXT DEFAULT NULL,
  schedule_map JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_template TEXT DEFAULT NULL,
  lesson_plan_template TEXT DEFAULT NULL,
  source_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subject_ai_contexts_subject_id_idx
  ON public.subject_ai_contexts (subject_id);

ALTER TABLE public.subject_ai_contexts ENABLE ROW LEVEL SECURITY;

-- Professores autenticados podem visualizar e gerenciar o contexto de IA das disciplinas
CREATE POLICY "Authenticated users can view subject ai contexts"
  ON public.subject_ai_contexts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subject ai contexts"
  ON public.subject_ai_contexts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subject ai contexts"
  ON public.subject_ai_contexts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subject ai contexts"
  ON public.subject_ai_contexts FOR DELETE
  TO authenticated
  USING (true);
