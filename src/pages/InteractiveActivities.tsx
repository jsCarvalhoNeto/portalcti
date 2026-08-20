import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, 
  Play, 
  Clock, 
  Users, 
  Trophy, 
  ArrowLeft, 
  Activity, 
  PenTool, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Code,
  Lock,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { subjectService } from '@/services/subjectService';
import { enrollmentService } from '@/services/enrollmentService';
import { supabase } from '@/lib/supabaseClient';
import { Subject } from '@/types/subject';
import interactiveActivityService, { InteractiveActivity } from '@/services/interactiveActivityService';
import InteractiveActivityEditor from '@/components/subject/InteractiveActivityEditor';
import InteractiveActivityPlayer from '@/components/subject/InteractiveActivityPlayer';

export default function InteractiveActivities() {
  const { id } = useParams<{ id: string }>();
  const { user, isTeacher, isAdmin, isStudent, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [activities, setActivities] = useState<InteractiveActivity[]>([]);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  // Modais de Criação/Edição e Player
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedActivityForEdit, setSelectedActivityForEdit] = useState<InteractiveActivity | null>(null);
  const [selectedActivityForPlay, setSelectedActivityForPlay] = useState<InteractiveActivity | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const canManage = Boolean(isTeacher || isAdmin);

  useEffect(() => {
    if (id) {
      loadSubjectAndActivities();
    }
  }, [id, user]);

  const loadSubjectAndActivities = async () => {
    if (!id) return;
    try {
      setLoading(true);
      
      // Buscar dados da disciplina
      try {
        const subjectData = await subjectService.getById(id);
        setSubject(subjectData);
      } catch (subErr) {
        console.warn('Erro ao carregar disciplina com relacionamentos, buscando registro básico:', subErr);
        const { data: basicSub } = await supabase
          .from('subjects')
          .select('*')
          .eq('id', id)
          .single();
        if (basicSub) {
          setSubject(basicSub as Subject);
        }
      }

      // Se for aluno autenticado, verificar se está matriculado nesta disciplina
      if (user && !canManage) {
        try {
          const enrolledSubjects = await enrollmentService.getStudentEnrolledSubjects(user.id);
          const enrolled = enrolledSubjects.some(s => String(s.id) === String(id));
          setIsEnrolled(enrolled);
        } catch (enrollErr) {
          console.warn('Erro ao validar matrícula do aluno:', enrollErr);
        }
      }

      // Buscar atividades interativas
      const activitiesData = await interactiveActivityService.getBySubject(id);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Erro ao carregar disciplina e atividades:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as atividades interativas.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedActivityForEdit(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (act: InteractiveActivity) => {
    setSelectedActivityForEdit(act);
    setIsEditorOpen(true);
  };

  const handleDelete = async (activityId: string | number) => {
    if (!id) return;
    if (!window.confirm('Tem certeza que deseja excluir esta atividade interativa?')) {
      return;
    }

    try {
      await interactiveActivityService.delete(activityId, id);
      setActivities(prev => prev.filter(a => String(a.id) !== String(activityId)));
      toast({
        title: 'Atividade Excluída',
        description: 'A atividade interativa foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir atividade:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a atividade.',
        variant: 'destructive'
      });
    }
  };

  const handleSaveActivity = async (activityData: any) => {
    if (!id) return;

    try {
      if (selectedActivityForEdit && selectedActivityForEdit.id) {
        // Atualizar
        const updated = await interactiveActivityService.update(selectedActivityForEdit.id, activityData);
        setActivities(prev => prev.map(a => String(a.id) === String(updated.id) ? updated : a));
        toast({
          title: 'Atividade Atualizada',
          description: 'A atividade interativa foi atualizada com sucesso!',
        });
      } else {
        // Criar
        const created = await interactiveActivityService.create(activityData);
        setActivities(prev => [created, ...prev]);
        toast({
          title: 'Atividade Criada',
          description: 'A nova atividade interativa está disponível no card para a turma!',
        });
      }
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a atividade interativa.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleStartActivity = (act: InteractiveActivity) => {
    setSelectedActivityForPlay(act);
    setIsPlayerOpen(true);
  };

  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'game':
        return <Gamepad2 className="w-5 h-5" />;
      case 'simulation':
        return <Activity className="w-5 h-5" />;
      case 'quiz':
        return <Trophy className="w-5 h-5" />;
      case 'exercise':
        return <PenTool className="w-5 h-5" />;
      default:
        return <Gamepad2 className="w-5 h-5" />;
    }
  };

  const getTypeText = (type?: string) => {
    switch (type) {
      case 'game': return 'Jogo Educativo';
      case 'simulation': return 'Simulação Interativa';
      case 'quiz': return 'Quiz / Desafio';
      case 'exercise': return 'Exercício Prático';
      default: return 'Atividade';
    }
  };

  const getTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'game':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300';
      case 'simulation':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300';
      case 'quiz':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300';
      case 'exercise':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Badge variant="outline" className="border-emerald-500 text-emerald-600">Iniciante</Badge>;
      case 'intermediate':
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Intermediário</Badge>;
      case 'advanced':
        return <Badge variant="outline" className="border-rose-500 text-rose-600">Avançado</Badge>;
      default:
        return <Badge variant="outline">Geral</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground text-sm">Carregando atividades interativas...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!subject) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Disciplina não encontrada</h1>
          <p className="text-muted-foreground mb-6">A disciplina solicitada não existe ou foi removida.</p>
          <Button onClick={() => navigate('/disciplinas')}>
            Voltar para Disciplinas
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Bloqueio de acesso para alunos não matriculados na matéria
  if (!canManage && !isEnrolled) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto border-amber-500/30 bg-card shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 sm:p-8 border-b border-border/50 text-center">
              <div className="w-16 h-16 bg-amber-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <Badge variant="outline" className="mb-2 border-amber-500/40 text-amber-700 dark:text-amber-300">
                Acesso Restrito
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Atividades Exclusivas da Turma
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
                Você não está matriculado na disciplina <strong>{subject.name}</strong> ({subject.grade || 'outra série'}).
              </p>
            </div>
            
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="bg-muted/50 rounded-xl p-4 text-xs sm:text-sm text-muted-foreground space-y-2 border border-border/50">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Por que o laboratório está bloqueado?
                </p>
                <p>
                  Os jogos interativos, simuladores e quizzes desta disciplina concedem pontos e conquistas vinculados ao progresso curricular exclusivo dos alunos da série correspondente.
                </p>
                <p>
                  Para responder atividades e pontuar no ranking geral, acesse as matérias vinculadas à sua série em <strong>Minhas Disciplinas</strong>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button 
                  onClick={() => navigate('/student')}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
                >
                  <GraduationCap className="w-4 h-4" />
                  Minhas Disciplinas
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/disciplinas')}
                  className="w-full sm:w-auto gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Ver Todas as Disciplinas
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Filtrar atividades
  const filteredActivities = activities.filter(act => {
    if (filterType === 'all') return true;
    return act.type === filterType;
  });

  return (
    <MainLayout>
      <div className="min-h-screen pb-16">
        {/* Header da Disciplina */}
        <header className="bg-card border-b sticky top-0 z-10 backdrop-blur-md bg-card/90">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1);
                    } else if (isTeacher || isAdmin) {
                      navigate(`/teacher/subjects/${id}/edit`);
                    } else {
                      navigate(`/disciplinas/${id}`);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                  <Gamepad2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">Atividades Interativas</h1>
                    {canManage && (
                      <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                        Professor
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{subject.name} • Jogos e Simuladores</p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadSubjectAndActivities}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
                {canManage && (
                  <Button 
                    onClick={handleCreateNew}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Atividade Interativa
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Banner de Apresentação com Alto Contraste */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 border border-purple-400/30 rounded-2xl p-6 md:p-8 mb-8 text-white shadow-lg shadow-purple-950/20">
            {/* Efeitos de iluminação sutil de fundo */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-300/40 text-purple-200 font-semibold text-xs tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                  <span>Laboratório Interativo da Disciplina</span>
                </div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Aprenda na prática com jogos, simuladores e quizzes
                </h2>
                <p className="text-sm md:text-base text-purple-100/90 leading-relaxed font-normal">
                  Abra qualquer atividade para executá-la no navegador com opção de tela inteira para maior imersão.
                </p>
              </div>

              {/* Filtros rápidos */}
              <div className="flex flex-wrap gap-2 bg-black/30 p-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterType("all")}
                  className={`text-xs font-semibold rounded-lg transition-all ${
                    filterType === "all"
                      ? "bg-white text-indigo-950 hover:bg-white/90 shadow-sm font-bold"
                      : "text-purple-100 hover:text-white hover:bg-white/15"
                  }`}
                >
                  Todas ({activities.length})
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterType("game")}
                  className={`text-xs font-semibold rounded-lg transition-all ${
                    filterType === "game"
                      ? "bg-white text-indigo-950 hover:bg-white/90 shadow-sm font-bold"
                      : "text-purple-100 hover:text-white hover:bg-white/15"
                  }`}
                >
                  Jogos
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterType("simulation")}
                  className={`text-xs font-semibold rounded-lg transition-all ${
                    filterType === "simulation"
                      ? "bg-white text-indigo-950 hover:bg-white/90 shadow-sm font-bold"
                      : "text-purple-100 hover:text-white hover:bg-white/15"
                  }`}
                >
                  Simulações
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilterType("quiz")}
                  className={`text-xs font-semibold rounded-lg transition-all ${
                    filterType === "quiz"
                      ? "bg-white text-indigo-950 hover:bg-white/90 shadow-sm font-bold"
                      : "text-purple-100 hover:text-white hover:bg-white/15"
                  }`}
                >
                  Quizzes
                </Button>
              </div>
            </div>
          </div>

          {/* Grid de Cards de Atividades */}
          {filteredActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => (
                <Card 
                  key={activity.id} 
                  className="bg-card border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  {/* Topo do Card com o Nome em Destaque */}
                  <CardHeader className="pb-3 space-y-3 bg-gradient-to-b from-muted/50 to-transparent">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <Badge variant="outline" className={`text-xs font-semibold ${getTypeBadgeColor(activity.type)}`}>
                          {getTypeText(activity.type)}
                        </Badge>
                      </div>

                      {/* Ações do Professor */}
                      {canManage && (
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(activity)}
                            title="Editar Atividade"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() => handleDelete(activity.id)}
                            title="Excluir Atividade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Nome da Atividade Interativa no Topo */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {activity.title}
                      </h3>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2 flex flex-col justify-between flex-1 space-y-4">
                    {/* Metadados: Dificuldade e Duração */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-b py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{activity.duration || '15-20 min'}</span>
                      </div>
                      <div>
                        {getDifficultyBadge(activity.difficulty)}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="space-y-2 pt-1">
                      <Button 
                        onClick={() => handleStartActivity(activity)}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 flex items-center justify-center gap-2 h-10 font-semibold"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Iniciar Atividade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Estado Vazio */
            <div className="text-center py-16 px-4 border border-dashed rounded-2xl bg-card/50 max-w-xl mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Nenhuma atividade interativa encontrada</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {canManage 
                  ? 'Como professor, você pode criar atividades interativas colando o código de artefatos HTML/CSS/JS.' 
                  : 'O professor ainda não publicou atividades interativas para esta disciplina.'}
              </p>
              {canManage && (
                <Button onClick={handleCreateNew} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Criar Primeira Atividade
                </Button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Criação / Edição de Atividade */}
      {isEditorOpen && (
        <InteractiveActivityEditor
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          activity={selectedActivityForEdit}
          subjectId={Number(id)}
          subjectName={subject.name}
          onSave={handleSaveActivity}
        />
      )}

      {/* Modal / Player da Atividade Interativa (com Fullscreen) */}
      {isPlayerOpen && (
        <InteractiveActivityPlayer
          isOpen={isPlayerOpen}
          onClose={() => setIsPlayerOpen(false)}
          activity={selectedActivityForPlay}
          subjectName={subject.name}
        />
      )}
    </MainLayout>
  );
}
