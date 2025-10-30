import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  FileText,
  Upload
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import { subjectService } from '@/services/subjectService';
import { Subject } from '@/types/subject';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';

interface InteractiveActivity {
  id: string;
  title: string;
  description: string;
  type: 'game' | 'simulation' | 'quiz' | 'exercise';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'not-started' | 'in-progress' | 'completed';
  progress?: number;
  subject: string; // Adiciona o campo de disciplina
}

export default function InteractiveActivities() {
  const { id } = useParams<{ id: string }>();
  const { user, isStudent, loading: authLoading } = useAuth();
  const navigate = useNavigate();
   const [subject, setSubject] = useState<Subject | null>(null);
  const [activities, setActivities] = useState<InteractiveActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSubjectAndActivities();
    }
 }, [id]);

  const fetchSubjectAndActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch subject details
      const subjectData = await subjectService.getById(id!);
      setSubject(subjectData);
      
      // Fetch interactive activities (this would come from the backend)
      // For now, using mock data with subject classification
      const mockActivities: InteractiveActivity[] = [
        {
          id: '1',
          title: 'Jogo da Memória - Lógica de Programação',
          description: 'Desafios interativos para aprender lógica de programação',
          type: 'game',
          duration: '30 min',
          difficulty: 'beginner',
          status: 'not-started',
          progress: 0,
          subject: 'Lógica de Programação'
        },
        {
          id: '2',
          title: 'Formulário de Login - HTML & CSS',
          description: 'Crie uma interface de login seguindo as melhores práticas de HTML5 e CSS3',
          type: 'exercise',
          duration: '45 min',
          difficulty: 'intermediate',
          status: 'not-started',
          progress: 0,
          subject: 'HTML e CSS'
        },
        {
          id: '3',
          title: 'Simulador de Algoritmos',
          description: 'Visualize como os algoritmos funcionam em tempo real',
          type: 'simulation',
          duration: '45 min',
          difficulty: 'intermediate',
          status: 'in-progress',
          progress: 65,
          subject: 'HTML e CSS'
        },
        {
          id: '4',
          title: 'Quiz de Estruturas de Dados',
          description: 'Teste seus conhecimentos sobre arrays, listas e pilhas',
          type: 'quiz',
          duration: '20 min',
          difficulty: 'intermediate',
          status: 'completed',
          progress: 100,
          subject: 'Lógica de Programação'
        },
        {
          id: '5',
          title: 'Exercícios Interativos',
          description: 'Problemas práticos com feedback imediato',
          type: 'exercise',
          duration: '60 min',
          difficulty: 'advanced',
          status: 'not-started',
          progress: 0,
          subject: 'HTML e CSS'
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching subject and activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !isStudent) {
    return <Navigate to="/auth" replace />;
  }

 if (!subject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Disciplina não encontrada</h1>
            <p className="text-muted-foreground">A disciplina que você está procurando não existe.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

 const getActivityIcon = (type: string) => {
    switch (type) {
      case 'game':
        return <Gamepad2 className="w-5 h-5" />;
      case 'simulation':
        return <Play className="w-5 h-5" />;
      case 'quiz':
        return <Trophy className="w-5 h-5" />;
      case 'exercise':
        return <PenTool className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'game':
        return 'text-purple-400';
      case 'simulation':
        return 'text-blue-400';
      case 'quiz':
        return 'text-green-400';
      case 'exercise':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Concluído</Badge>;
      case 'in-progress':
        return <Badge variant="secondary">Em Progresso</Badge>;
      default:
        return <Badge variant="outline">Não Iniciado</Badge>;
    }
 };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <Badge variant="outline">Iniciante</Badge>;
      case 'intermediate':
        return <Badge variant="outline">Intermediário</Badge>;
      case 'advanced':
        return <Badge variant="outline">Avançado</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  // Função para agrupar atividades por disciplina
  const groupActivitiesBySubject = () => {
    const grouped: Record<string, InteractiveActivity[]> = {};
    activities.forEach(activity => {
      if (!grouped[activity.subject]) {
        grouped[activity.subject] = [];
      }
      grouped[activity.subject].push(activity);
    });
    return grouped;
  };

  const groupedActivities = groupActivitiesBySubject();
  const uniqueSubjects = Object.keys(groupedActivities);

  return (
    <MainLayout>
      <div>
        {/* Header */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/subject/${id}`)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Atividades Interativas</h1>
                  <p className="text-muted-foreground">{subject.name}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Seções por Disciplina */}
          {uniqueSubjects.map((subjectName) => (
            <div key={subjectName} className="mb-12">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  {subjectName === 'Lógica de Programação' && <Gamepad2 className="w-6 h-6 text-primary" />}
                  {subjectName === 'HTML e CSS' && <PenTool className="w-6 h-6 text-primary" />}
                  {subjectName !== 'Lógica de Programação' && subjectName !== 'HTML e CSS' && <Activity className="w-6 h-6 text-primary" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{subjectName}</h2>
                  <p className="text-muted-foreground">{groupedActivities[subjectName].length} atividade(s) disponível(is)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedActivities[subjectName].map((activity) => (
                  <Card key={activity.id} className="bg-card border hover:shadow-lg transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className={getActivityColor(activity.type)}>
                            {getActivityIcon(activity.type)}
                          </div>
                          {activity.title}
                        </CardTitle>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {activity.duration}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {activity.difficulty}
                          </span>
                        </div>
                        
                        {getDifficultyBadge(activity.difficulty)}
                        
                        {activity.status === 'in-progress' && activity.progress && (
                          <div className="pt-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${activity.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{activity.progress}% completo</p>
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-4">
                          <Button className="flex-1" onClick={() => {
                            if (activity.id === '1') {
                              // Mapear difficulty para o nível correspondente
                              const levelMap: Record<string, string> = {
                                'beginner': 'iniciante',
                                'intermediate': 'intermediario',
                                'advanced': 'avancado'
                              };
                              const gameLevel = levelMap[activity.difficulty] || 'iniciante';
                              navigate(`/disciplinas/${id}/interactive-activities/memory-game/${gameLevel}`);
                            } else if (activity.id === '2') {
                              // Atividade HTML/CSS - Formulário de Login
                              navigate(`/disciplinas/${id}/interactive-activities/html-css-form`);
                            }
                          }}>
                            <Play className="w-4 h-4 mr-2" />
                            {activity.status === 'completed' ? 'Revisar' : 'Iniciar'}
                          </Button>
                          <Button variant="outline" onClick={() => {
                            navigate(`/disciplinas/${id}/activity-files/${activity.id}`);
                          }}>
                            <FileText className="w-4 h-4 mr-2" />
                            Arquivos
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-16">
              <Gamepad2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhuma atividade interativa disponível</h3>
              <p className="text-muted-foreground">O professor ainda não adicionou atividades interativas para esta disciplina.</p>
            </div>
          )}
        </main>
      </div>
    </MainLayout>
  );
}
