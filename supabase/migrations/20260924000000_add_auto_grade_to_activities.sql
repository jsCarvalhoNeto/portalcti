-- Adiciona campos de atribuição automática de notas para a tabela de atividades
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS auto_grade_enabled BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_grade_value NUMERIC(4,2) DEFAULT NULL;

COMMENT ON COLUMN public.activities.auto_grade_enabled IS 'Indica se a nota é atribuída automaticamente no momento do envio da atividade pelo aluno';
COMMENT ON COLUMN public.activities.auto_grade_value IS 'Valor padrão da nota atribuída automaticamente no momento do envio';
