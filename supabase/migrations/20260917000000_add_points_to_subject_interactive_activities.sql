-- Adiciona campo de pontuação de recompensa para atividades interativas
ALTER TABLE public.subject_interactive_activities
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 10;

COMMENT ON COLUMN public.subject_interactive_activities.points IS 'Pontos concedidos ao aluno ao concluir a atividade pela primeira vez';
