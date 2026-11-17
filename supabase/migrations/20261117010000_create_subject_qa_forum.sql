-- Migration: Mural / Fórum de Dúvidas por Disciplina ou Aula
-- Respostas de colegas marcadas como "Solução" pelo professor concedem pontos na gamificação

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.subject_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  lesson_id TEXT DEFAULT NULL,
  lesson_title TEXT DEFAULT NULL,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  accepted_answer_id UUID DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subject_questions_subject_id_idx
  ON public.subject_questions (subject_id, created_at DESC);

CREATE INDEX IF NOT EXISTS subject_questions_lesson_id_idx
  ON public.subject_questions (lesson_id);

CREATE TABLE IF NOT EXISTS public.subject_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.subject_questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  is_solution BOOLEAN NOT NULL DEFAULT false,
  is_teacher_answer BOOLEAN NOT NULL DEFAULT false,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subject_question_answers_question_id_idx
  ON public.subject_question_answers (question_id, created_at ASC);

ALTER TABLE public.subject_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_question_answers ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura: usuários autenticados podem ler dúvidas e respostas
CREATE POLICY "Authenticated users can view subject questions"
  ON public.subject_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view subject question answers"
  ON public.subject_question_answers FOR SELECT
  TO authenticated
  USING (true);

-- Políticas de inserção: usuários autenticados podem postar dúvidas e respostas em seu próprio nome
CREATE POLICY "Authenticated users can create subject questions"
  ON public.subject_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create subject question answers"
  ON public.subject_question_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Políticas de atualização e exclusão: autor, professor ou admin
CREATE POLICY "Authors and teachers can update subject questions"
  ON public.subject_questions FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Authors and teachers can delete subject questions"
  ON public.subject_questions FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Authors and teachers can update subject question answers"
  ON public.subject_question_answers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Authors and teachers can delete subject question answers"
  ON public.subject_question_answers FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('teacher', 'admin')
    )
  );
