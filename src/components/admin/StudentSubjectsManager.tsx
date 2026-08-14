import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, GraduationCap, BookOpen, Sparkles, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { enrollmentService, type EnrolledSubject, type AvailableSubject } from '@/services/enrollmentService';

interface StudentSubjectsManagerProps {
  studentId: string;
  studentName?: string;
  studentGrade?: string | null;
  onClose: () => void;
}

export default function StudentSubjectsManager({
  studentId,
  studentName,
  studentGrade,
  onClose,
}: StudentSubjectsManagerProps) {
  const [enrolledSubjects, setEnrolledSubjects] = useState<EnrolledSubject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [unsubscribingId, setUnsubscribingId] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (studentId) {
      loadData();
    }
  }, [studentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrolled, available] = await Promise.all([
        enrollmentService.getStudentEnrolledSubjects(studentId),
        enrollmentService.getAvailableSubjects(studentId),
      ]);
      setEnrolledSubjects(enrolled);
      setAvailableSubjects(available);
    } catch (error: any) {
      console.error('Erro ao carregar dados de matrículas:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar as disciplinas do estudante.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!selectedSubject) return;

    try {
      setLoadingEnroll(true);
      const subjectId = parseInt(selectedSubject, 10);
      await enrollmentService.enrollStudent(studentId, subjectId);

      toast({
        title: 'Matrícula realizada!',
        description: 'Estudante matriculado na disciplina com sucesso.',
      });
      setSelectedSubject('');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao matricular estudante:', error);
      toast({
        title: 'Erro na matrícula',
        description: error.message || 'Falha ao matricular estudante.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEnroll(false);
    }
  };

  const handleUnenroll = async (subjectId: number, subjectName: string) => {
    try {
      setUnsubscribingId(subjectId);
      await enrollmentService.unenrollStudent(studentId, subjectId);

      toast({
        title: 'Matrícula removida',
        description: `Matrícula em "${subjectName}" removida com sucesso.`,
      });
      await loadData();
    } catch (error: any) {
      console.error('Erro ao remover matrícula:', error);
      toast({
        title: 'Erro ao desmatricular',
        description: error.message || 'Falha ao remover matrícula.',
        variant: 'destructive',
      });
    } finally {
      setUnsubscribingId(null);
    }
  };

  const handleEnrollGradeBatch = async () => {
    if (!studentGrade) return;

    try {
      setLoadingBatch(true);
      const count = await enrollmentService.enrollGradeSubjects(studentId, studentGrade);

      if (count > 0) {
        toast({
          title: 'Matrícula em lote concluída!',
          description: `O estudante foi matriculado em ${count} disciplina(s) do ${studentGrade}.`,
        });
      } else {
        toast({
          title: 'Aviso',
          description: `Nenhuma nova disciplina do ${studentGrade} encontrada para matricular.`,
        });
      }
      await loadData();
    } catch (error: any) {
      console.error('Erro ao matricular na série:', error);
      toast({
        title: 'Erro na matrícula em lote',
        description: error.message || 'Falha ao matricular nas disciplinas da série.',
        variant: 'destructive',
      });
    } finally {
      setLoadingBatch(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const availableGradeCount = availableSubjects.filter(
    (s) => studentGrade && s.grade === studentGrade
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando disciplinas do estudante...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do modal com informações do estudante */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {studentName ? `Disciplinas de ${studentName}` : 'Disciplinas do Estudante'}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie e vincule as disciplinas em que o aluno está matriculado.
          </p>
        </div>

        {studentGrade && (
          <Badge variant="secondary" className="self-start sm:self-center text-xs py-1 px-2.5">
            Série: <span className="font-semibold ml-1">{studentGrade}</span>
          </Badge>
        )}
      </div>

      {/* Ação rápida para matricular em todas as disciplinas da série */}
      {studentGrade && availableGradeCount > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Matrícula Automática por Série
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Existem <strong>{availableGradeCount}</strong> disciplina(s) do <strong>{studentGrade}</strong> disponíveis.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleEnrollGradeBatch}
            disabled={loadingBatch}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          >
            {loadingBatch ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Matricular em todas ({studentGrade})
          </Button>
        </div>
      )}

      {/* Disciplinas Matriculadas */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Disciplinas Matriculadas
              </CardTitle>
              <CardDescription className="text-xs">
                O aluno possui acesso a todos os materiais e atividades destas disciplinas.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-medium">
              {enrolledSubjects.length} {enrolledSubjects.length === 1 ? 'disciplina' : 'disciplinas'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {enrolledSubjects.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed rounded-lg bg-muted/20">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
              <p className="font-medium text-sm text-foreground">Nenhuma disciplina matriculada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione uma disciplina abaixo para vincular o estudante.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-lg border overflow-hidden">
              {enrolledSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors bg-card"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                    <div
                      className="w-3 h-10 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: subject.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {subject.name}
                        </h4>
                        {subject.grade && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {subject.grade}
                          </Badge>
                        )}
                        {subject.semester && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                            {subject.semester}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {subject.teacher_name && (
                          <span>Professor: <strong>{subject.teacher_name}</strong></span>
                        )}
                        {subject.enrollment_date && (
                          <span>Matriculado em: {formatDate(subject.enrollment_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnenroll(subject.id, subject.name)}
                    disabled={unsubscribingId === subject.id}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                    title="Remover matrícula"
                  >
                    {unsubscribingId === subject.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Adicionar Disciplina */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Adicionar Nova Matrícula
          </CardTitle>
          <CardDescription className="text-xs">
            Escolha uma disciplina disponível para matricular o estudante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableSubjects.length === 0 ? (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-muted/40 border text-muted-foreground">
              <AlertCircle className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span>
                {enrolledSubjects.length > 0
                  ? 'O estudante já está matriculado em todas as disciplinas cadastradas no sistema.'
                  : 'Nenhuma disciplina encontrada cadastrada no sistema. Cadastre disciplinas no menu "Disciplinas".'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Disciplina Disponível
                </label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma disciplina..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        <span className="font-medium">{subject.name}</span>
                        {subject.grade && (
                          <span className="text-muted-foreground ml-1.5 text-xs">({subject.grade})</span>
                        )}
                        {subject.teacher_name && (
                          <span className="text-muted-foreground ml-1 text-xs">· Prof. {subject.teacher_name}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleEnroll}
                disabled={!selectedSubject || loadingEnroll}
                className="shrink-0"
              >
                {loadingEnroll ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Matricular
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botões de Rodapé */}
      <div className="flex justify-between items-center pt-2">
        <Button onClick={onClose} variant="ghost" size="sm" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar para dados do aluno
        </Button>
        <Button onClick={onClose} variant="outline" size="sm">
          Concluir
        </Button>
      </div>
    </div>
  );
}
