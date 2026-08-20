import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, BookOpen, CheckCircle2, AlertCircle, Sparkles, Filter } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { subjectService } from "@/services/subjectService";
import { enrollmentService } from "@/services/enrollmentService";
import { useAuth } from "@/hooks/useAuth";
import { Subject } from "@/types/subject";

const Subjects = () => {
  const navigate = useNavigate();
  const { user, isStudent } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState<'my_subjects' | 'all'>('my_subjects');

  useEffect(() => {
    fetchData();
  }, [user, isStudent]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allSubjects = await subjectService.getAll();
      setSubjects(allSubjects);

      if (user && isStudent) {
        try {
          const enrolled = await enrollmentService.getStudentEnrolledSubjects(user.id);
          const ids = new Set(enrolled.map(e => Number(e.id)));
          setEnrolledSubjectIds(ids);
          // Se o aluno não tiver nenhuma matrícula, mostrar todas por padrão
          if (ids.size === 0) {
            setViewFilter('all');
          }
        } catch (enrollErr) {
          console.warn('Erro ao carregar matrículas do aluno:', enrollErr);
        }
      } else {
        setViewFilter('all');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedSubjects = useMemo(() => {
    if (isStudent && viewFilter === 'my_subjects' && enrolledSubjectIds.size > 0) {
      return subjects.filter(s => enrolledSubjectIds.has(Number(s.id)));
    }
    return subjects;
  }, [subjects, isStudent, viewFilter, enrolledSubjectIds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando disciplinas...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center py-12 md:py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-border/50 rounded-3xl mb-8 mt-4 shadow-sm">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
              <BookOpen className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
              Disciplinas do Curso
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Explore a grade curricular do curso técnico em informática.
            </p>

            {/* Filtro Inteligente para Estudantes */}
            {isStudent && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="inline-flex bg-muted p-1 rounded-xl border border-border/60">
                  <Button
                    size="sm"
                    variant={viewFilter === 'my_subjects' ? 'default' : 'ghost'}
                    onClick={() => setViewFilter('my_subjects')}
                    className="rounded-lg text-xs font-semibold gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Minhas Disciplinas ({enrolledSubjectIds.size})
                  </Button>
                  <Button
                    size="sm"
                    variant={viewFilter === 'all' ? 'default' : 'ghost'}
                    onClick={() => setViewFilter('all')}
                    className="rounded-lg text-xs font-semibold gap-1.5"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Todas as Disciplinas ({subjects.length})
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Aviso informativo para estudantes quando visualizando todas as matérias */}
          {isStudent && viewFilter === 'all' && (
            <div className="mb-8 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Informação sobre atividades e pontuação:</p>
                <p className="text-xs text-blue-800/90 dark:text-blue-300">
                  Você pode consultar as ementas e materiais de todas as matérias. Porém, o acesso a <strong>atividades interativas e pontuação na gamificação</strong> é exclusivo para as disciplinas da sua turma/série em que você está matriculado.
                </p>
              </div>
            </div>
          )}

          {/* Subjects Grid */}
          {displayedSubjects.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                Nenhuma disciplina encontrada
              </h3>
              <p className="text-muted-foreground">
                {viewFilter === 'my_subjects' 
                  ? 'Você ainda não está matriculado em nenhuma disciplina ativa.' 
                  : 'Nenhuma disciplina cadastrada no sistema.'}
              </p>
              {viewFilter === 'my_subjects' && (
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setViewFilter('all')}
                >
                  Ver todas as disciplinas do curso
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedSubjects.map((subject) => {
                const isEnrolled = isStudent ? enrolledSubjectIds.has(Number(subject.id)) : false;

                return (
                  <Card 
                    key={subject.id} 
                    className="hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer flex flex-col justify-between"
                    onClick={() => navigate(`/disciplinas/${subject.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1 text-foreground leading-snug">
                            {subject.name}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground text-xs">
                            Professor: {subject.teacher_name || 'A definir'}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {subject.grade && (
                            <Badge variant="outline" className="text-xs">
                              {subject.grade}
                            </Badge>
                          )}
                          {subject.semester && (
                            <Badge variant="secondary" className="text-xs">
                              {subject.semester}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {subject.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{subject.workload_hours ? `${subject.workload_hours}h` : (subject.schedule || 'Carga Regular')}</span>
                        </div>

                        {/* Status de matrícula do aluno */}
                        {isStudent && (
                          isEnrolled ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[11px] gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Sua Turma
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 border-slate-300 dark:border-slate-700 text-[11px]">
                              Outra Série
                            </Badge>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Subjects;
