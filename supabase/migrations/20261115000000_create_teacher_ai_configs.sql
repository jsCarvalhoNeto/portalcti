-- Migration: Criar tabela de configurações de IA por professor
-- Permite que professores cadastrem uma ou mais combinações de modelo e chave da API do Google (Gemini)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.teacher_ai_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT DEFAULT NULL,
  provider TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google')),
  model_name TEXT NOT NULL CHECK (char_length(trim(model_name)) > 0),
  api_key TEXT NOT NULL CHECK (char_length(trim(api_key)) > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_ai_configs_teacher_id_idx
  ON public.teacher_ai_configs (teacher_id);

ALTER TABLE public.teacher_ai_configs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso: cada professor gerencia apenas suas próprias configurações de IA
CREATE POLICY "Teachers can view own ai configs"
  ON public.teacher_ai_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert own ai configs"
  ON public.teacher_ai_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own ai configs"
  ON public.teacher_ai_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own ai configs"
  ON public.teacher_ai_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);
