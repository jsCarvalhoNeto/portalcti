-- Migração: Adiciona coluna de Plano de Aula exclusivo para o professor na tabela subject_lessons

ALTER TABLE public.subject_lessons
ADD COLUMN IF NOT EXISTS lesson_plan TEXT DEFAULT NULL;

COMMENT ON COLUMN public.subject_lessons.lesson_plan IS 'Plano de aula e orientações pedagógicas exclusivas para o professor';
