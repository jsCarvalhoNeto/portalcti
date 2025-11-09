import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Trophy, Users, Clock, Play, Edit, Trash2, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DailyChallenge, dailyChallengeService } from '../../services/dailyChallengeService';
import { subjectService } from '../../services/subjectService';
import { Subject } from '../../types/subject';
import DailyChallengeEditor from './DailyChallengeEditor';
import DailyChallengeViewer from './DailyChallengeViewer';

export default function TeacherDailyChallengesTab() {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar disciplinas disponíveis
  const loadSubjects = useCallback(async () => {
    try {
      setSubjectsLoading(true);
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar as disciplinas'
      });
    } finally {
      setSubjectsLoading(false);
    }
  }, [toast]);

  // Carregar desafios do professor
  const loadChallenges = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await dailyChallengeService.getChallengesByTeacher(Number(user.id));
      setChallenges(data);
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar seus desafios'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  useEffect(() => {
    loadSubjects();
    loadChallenges();
  }, [loadSubjects, loadChallenges]);

  const handleCreateChallenge = () => {
    setSelectedChallenge(null);
    setShowEditor(true);
  };

  const handleEditChallenge = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge);
    setShowEditor(true);
  };

  const handleDeleteChallenge = async (challengeId: number) => {
    if (!confirm('Tem certeza que deseja excluir este desafio?')) return;

    try {
      await dailyChallengeService.deleteChallenge(challengeId);
      toast({
        title: 'Sucesso',
        description: 'Desafio excluído com sucesso'
      });
      loadChallenges();
    } catch (error) {
      console.error('Erro ao excluir desafio:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o desafio'
      });
    }
  };

  // Visualizar desafio (preview + stats)
  const handleViewChallenge = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge);
    setShowViewer(true);
  };

  const handleViewStats = (challenge: DailyChallenge) => {
    handleViewChallenge(challenge);
  };

  const handlePreviewChallenge = (challenge: DailyChallenge) => {
    handleViewChallenge(challenge);
  };

  const handleSaveChallenge = async (data: any) => {
    setEditorLoading(true);
    try {
      if (selectedChallenge) {
        await dailyChallengeService.updateChallenge(selectedChallenge.id, data);
        toast({
          title: 'Sucesso',
          description: 'Desafio atualizado com sucesso!'
        });
      } else {
        await dailyChallengeService.createChallenge(data);
        toast({
          title: 'Sucesso',
          description: 'Desafio criado com sucesso!'
        });
      }
      await loadChallenges();
      setShowEditor(false);
      setSelectedChallenge(null);
    } catch (error) {
      console.error('Erro ao salvar desafio:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o desafio'
      });
    } finally {
      setEditorLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { label: 'Em Breve', variant: 'secondary' as const },
      active: { label: 'Ativo', variant: 'default' as const },
      expired: { label: 'Expirado', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expired;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || subjectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Desafio do Dia</h1>
          <p className="text-muted-foreground">
            Crie atividades gamificadas interativas para seus alunos
          </p>
        </div>
        <Button onClick={handleCreateChallenge}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Desafio
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{challenges.length}</p>
                <p className="text-xs text-muted-foreground">Total de Desafios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {challenges.filter(c => c.status === 'active').length}
                </p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {challenges.filter(c => c.status === 'upcoming').length}
                </p>
                <p className="text-xs text-muted-foreground">Agendados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {challenges.reduce((total, c) => total + (c.total_submissions || 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Participações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de desafios */}
      {challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Trophy className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum desafio criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie seu primeiro Desafio do Dia para engajar seus alunos com atividades gamificadas
            </p>
            <Button onClick={handleCreateChallenge}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Desafio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-glow transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    {challenge.description && (
                      <CardDescription className="text-sm">
                        {challenge.description}
                      </CardDescription>
                    )}
                  </div>
                  {getStatusBadge(challenge.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informações do desafio */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>{challenge.points} pontos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span>{challenge.total_submissions || 0} participações</span>
                  </div>
                </div>

                {/* Período de atividade */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Período de atividade:</span>
                  </div>
                  <div className="text-xs space-y-1 pl-6">
                    <div>
                      <strong>Início:</strong> {formatDate(challenge.start_date)}
                    </div>
                    <div>
                      <strong>Fim:</strong> {formatDate(challenge.end_date)}
                    </div>
                  </div>
                </div>

                {/* Disciplina associada */}
                {challenge.subject_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{challenge.subject_name}</Badge>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreviewChallenge(challenge)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewStats(challenge)}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Stats
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditChallenge(challenge)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteChallenge(challenge.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
      
      {/* Modal do Editor */}
      <DailyChallengeEditor
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setSelectedChallenge(null);
        }}
        challenge={selectedChallenge}
        onSave={handleSaveChallenge}
        subjects={subjects}
        isLoading={editorLoading}
      />

      {/* Modal do Viewer */}
      {selectedChallenge && (
        <DailyChallengeViewer
          challenge={selectedChallenge}
          isOpen={showViewer}
          onClose={() => {
            setShowViewer(false);
            setSelectedChallenge(null);
          }}
          onEdit={() => {
            setShowViewer(false);
            setShowEditor(true);
          }}
        />
      )}
    </>
  );
}