-- Migration: Sistema de Chamada Inteligente / Frequência por Código ou QR Code
-- Concede +20 pontos na gamificação por presença registrada

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabela de sessões de chamada abertas pelo professor
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE CASCADE,
  lesson_id TEXT DEFAULT NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  points_reward INTEGER NOT NULL DEFAULT 20 CHECK (points_reward >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attendance_sessions_code_idx
  ON public.attendance_sessions (code);

CREATE INDEX IF NOT EXISTS attendance_sessions_teacher_id_idx
  ON public.attendance_sessions (teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS attendance_sessions_subject_id_idx
  ON public.attendance_sessions (subject_id, created_at DESC);

-- 2. Tabela de registros de presença dos alunos
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id BIGINT REFERENCES public.subjects(id) ON DELETE SET NULL,
  points_awarded INTEGER NOT NULL DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'excused')),
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT attendance_records_unique_session_student UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS attendance_records_session_id_idx
  ON public.attendance_records (session_id, checked_in_at DESC);

CREATE INDEX IF NOT EXISTS attendance_records_student_id_idx
  ON public.attendance_records (student_id, checked_in_at DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Políticas para attendance_sessions
-- Professores gerenciam suas próprias sessões
CREATE POLICY "Teachers can manage own attendance sessions"
  ON public.attendance_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Alunos autenticados podem visualizar sessões para validar o código de chamada
CREATE POLICY "Authenticated users can view attendance sessions"
  ON public.attendance_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Políticas para attendance_records
-- Alunos podem visualizar seus próprios registros de presença
CREATE POLICY "Students can view own attendance records"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Professores podem visualizar registros das suas sessões
CREATE POLICY "Teachers can view records of own sessions"
  ON public.attendance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = attendance_records.session_id
        AND s.teacher_id = auth.uid()
    )
  );

-- Alunos podem registrar sua própria presença em sessões ativas e não expiradas
CREATE POLICY "Students can check in to active attendance sessions"
  ON public.attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = attendance_records.session_id
        AND s.is_active = true
        AND s.expires_at > now()
    )
  );

-- Professores podem inserir ou remover registros manualmente nas suas próprias sessões
CREATE POLICY "Teachers can manage records in own sessions"
  ON public.attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = attendance_records.session_id
        AND s.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete records in own sessions"
  ON public.attendance_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions s
      WHERE s.id = attendance_records.session_id
        AND s.teacher_id = auth.uid()
    )
  );
