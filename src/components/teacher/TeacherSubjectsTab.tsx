import { useTeacherDashboard, Subject } from '@/contexts/TeacherDashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Calendar, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface TeacherSubjectsTabProps {
}

export default function TeacherSubjectsTab() {
  const { subjects, loading, error, refetch } = useTeacherDashboard();
  const subjectsLoading = loading.subjects;
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('TeacherSubjectsTab - Dados recebidos:', { subjects, subjectsLoading, error });
  }, [subjects, subjectsLoading, error]);

  const handleViewDetails = (subject: Subject) => {
    setSelectedSubject(subject);
  }

  const handleEditSubject = (subjectId: number) => {
    navigate(`/teacher/subjects/${subjectId}/edit`);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Minhas Disciplinas</h2>
          <p className="text-muted-foreground">Disciplinas que você leciona</p>
        </div>
      </div>

      {error?.subjects && (
        <div className="bg-destructive/10 border-destructive rounded-lg p-4 text-destructive">
          <p className="font-medium">Erro ao carregar disciplinas:</p>
          <p>{error.subjects}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch.subjects()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {subjectsLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription>ID: {subject.id}</CardDescription>
                  </div>
                  <Badge variant="outline">Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subject.description && (
                    <p className="text-sm text-muted-foreground">{subject.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Disciplina ID: {subject.id}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-1" 
                        onClick={() => handleEditSubject(subject.id)}
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-1"
                        onClick={() => handleViewDetails(subject)}
                      >
                        <GraduationCap className="w-4 h-4" />
                        Notas
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Atividades
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {subjects.length === 0 && !subjectsLoading && (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Nenhuma disciplina encontrada</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch.subjects()}
              >
                Recarregar Disciplinas
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog para detalhes da disciplina */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedSubject.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSubject(null)}
              >
                Fechar
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">ID:</span> {selectedSubject.id}
              </div>
              {selectedSubject.description && (
                <div>
                  <span className="font-medium">Descrição:</span> {selectedSubject.description}
                </div>
              )}
              {selectedSubject.schedule && (
                <div>
                  <span className="font-medium">Horário:</span> {selectedSubject.schedule}
                </div>
              )}
              {selectedSubject.max_students && (
                <div>
                  <span className="font-medium">Máximo de alunos:</span> {selectedSubject.max_students}
                </div>
              )}
              {selectedSubject.current_students !== undefined && (
                <div>
                  <span className="font-medium">Alunos matriculados:</span> {selectedSubject.current_students}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
