import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, GraduationCap, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentSubject {
  id: number;
  name: string;
  description?: string;
  teacher_name?: string;
  enrollment_date?: string;
}

interface StudentSubjectsManagerProps {
  studentId: string;
  onClose: () => void;
}

export default function StudentSubjectsManager({ studentId, onClose }: StudentSubjectsManagerProps) {
  const [enrolledSubjects, setEnrolledSubjects] = useState<StudentSubject[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<StudentSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnroll, setLoadingEnroll] = useState(false);
  const [loadingUnenroll, setLoadingUnenroll] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    loadSubjects();
  }, [studentId]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      
      // Buscar disciplinas matriculadas
      const enrolledResponse = await fetch(`${API_URL}/students/${studentId}/subjects`);
      if (enrolledResponse.ok) {
        const enrolledData = await enrolledResponse.json();
        setEnrolledSubjects(enrolledData);
      }

      // Buscar disciplinas disponíveis
      const availableResponse = await fetch(`${API_URL}/students/${studentId}/available-subjects`);
      if (availableResponse.ok) {
        const availableData = await availableResponse.json();
        setAvailableSubjects(availableData);
      }
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar as disciplinas do estudante.',
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
      const response = await fetch(`${API_URL}/students/${studentId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subjectId: parseInt(selectedSubject) }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Estudante matriculado na disciplina com sucesso.',
        });
        setSelectedSubject('');
        loadSubjects(); // Recarregar as disciplinas
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao matricular estudante.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao matricular estudante:', error);
      toast({
        title: 'Erro',
        description: 'Falha na conexão com o servidor.',
        variant: 'destructive',
      });
    } finally {
      setLoadingEnroll(false);
    }
  };

  const handleUnenroll = async (subjectId: number) => {
    try {
      setLoadingUnenroll(true);
      const response = await fetch(`${API_URL}/students/${studentId}/unenroll`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subjectId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Matrícula removida com sucesso.',
        });
        loadSubjects(); // Recarregar as disciplinas
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Falha ao remover matrícula.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao remover matrícula:', error);
      toast({
        title: 'Erro',
        description: 'Falha na conexão com o servidor.',
        variant: 'destructive',
      });
    } finally {
      setLoadingUnenroll(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Disciplinas Matriculadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Disciplinas Matriculadas ({enrolledSubjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrolledSubjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma disciplina encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrolledSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{subject.name}</h4>
                    {subject.teacher_name && (
                      <p className="text-sm text-muted-foreground">Professor: {subject.teacher_name}</p>
                    )}
                    {subject.enrollment_date && (
                      <p className="text-xs text-muted-foreground">Matriculado em: {formatDate(subject.enrollment_date)}</p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUnenroll(subject.id)}
                    disabled={loadingUnenroll}
                  >
                    {loadingUnenroll ? (
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Disciplina
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableSubjects.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>Não há disciplinas disponíveis para matrícula</p>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name} - {subject.teacher_name || 'Sem professor'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleEnroll}
                disabled={!selectedSubject || loadingEnroll}
              >
                {loadingEnroll ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Adicionar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Fechar */}
      <div className="flex justify-end">
        <Button onClick={onClose} variant="outline">
          Fechar
        </Button>
      </div>
    </div>
  );
}
