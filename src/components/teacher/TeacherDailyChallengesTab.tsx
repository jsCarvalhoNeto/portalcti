import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import dailyChallengeService, { DailyChallenge, CreateChallengeData, UpdateChallengeData } from '@/services/dailyChallengeService';
import DailyChallengeEditor from './DailyChallengeEditor';
import DailyChallengeViewer from './DailyChallengeViewer';
import ChallengeToggle from '@/components/ui/ChallengeToggle';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  Target,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';

export default function TeacherDailyChallengesTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Estados principais
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);

  // Carregar desafios do professor
  const loadChallenges = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await dailyChallengeService.getAllChallenges();
      setChallenges(data);
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os desafios'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, [user]);

  // Funções de ações
  const handleCreateChallenge = () => {
    setSelectedChallenge(null);
    setShowEditor(true);
  };

  const handleEditChallenge = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge);
    setShowEditor(true);
  };

  const handleViewChallenge = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge);
    setShowViewer(true);
  };

  const handleDeleteChallenge = async (challengeId: number) => {
    if (!confirm('Tem certeza que deseja excluir este desafio? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await dailyChallengeService.deleteChallenge(challengeId);
      await loadChallenges();
      toast({
        title: 'Sucesso',
        description: 'Desafio excluído com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao excluir desafio:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível excluir o desafio'
      });
    }
  };

  // Nova função para alternar status ativo/inativo
  const handleToggleActive = async (challengeId: number, isActive: boolean) => {
    try {
      const response = await dailyChallengeService.toggleChallengeActive(challengeId, isActive);
      
      // Atualizar o desafio na lista local
      setChallenges(challenges.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, is_active: isActive }
          : challenge
      ));

      const statusMessage = isActive ? 'ativado' : 'desativado';
      const subjectMessage = response.subject_name && isActive
        ? ` Outros desafios da disciplina ${response.subject_name} foram automaticamente desativados.`
        : '';

      toast({
        title: 'Sucesso',
        description: `Desafio ${statusMessage} com sucesso!${subjectMessage}`
      });
    } catch (error) {
      console.error('Erro ao alterar status do desafio:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível alterar o status do desafio'
      });
    }
  };

  const handleSaveChallenge = async (data: CreateChallengeData | UpdateChallengeData) => {
    try {
      if (selectedChallenge && selectedChallenge.id) {
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
    }
  };

  // Calcular estatísticas
  const stats = {
    total: challenges.length,
    active: challenges.filter(c => c.is_active).length,
    totalSubmissions: challenges.reduce((acc, c) => acc + (c.stats?.total_attempts || 0), 0),
    averageSubmissions: challenges.length > 0 
      ? Math.round((challenges.reduce((acc, c) => acc + (c.stats?.total_attempts || 0), 0) / challenges.length))
      : 0,
    completionRate: challenges.length > 0
      ? Math.round((challenges.reduce((acc, c) => acc + (c.stats?.success_rate || 0), 0) / challenges.length))
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Desafios</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Desafios Ativos</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
                <p className="text-sm text-muted-foreground">Total de Submissões</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações principais */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meus Desafios</h2>
          <p className="text-muted-foreground">Gerencie seus desafios HTML, CSS e JavaScript</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadChallenges}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleCreateChallenge}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Desafio
          </Button>
        </div>
      </div>

      {/* Lista de desafios */}
      {challenges.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum desafio criado ainda</h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro desafio para engajar seus alunos com projetos práticos
            </p>
            <Button onClick={handleCreateChallenge}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Desafio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className={`hover:shadow-lg transition-shadow ${challenge.is_active ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    {challenge.subject_name && (
                      <Badge variant="outline">{challenge.subject_name}</Badge>
                    )}
                  </div>
                </div>
                {challenge.description && (
                  <CardDescription className="line-clamp-2">
                    {challenge.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Toggle para ativar/desativar */}
                <div className="border-t pt-4">
                  <ChallengeToggle
                    challengeId={challenge.id!}
                    isActive={challenge.is_active || false}
                    onToggle={handleToggleActive}
                    subjectName={challenge.subject_name}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>{challenge.points} pontos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>{challenge.stats?.total_attempts || 0} tentativas</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Data: {new Date(challenge.active_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewChallenge(challenge)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditChallenge(challenge)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => challenge.id && handleDeleteChallenge(challenge.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal do Editor */}
      {showEditor && (
        <DailyChallengeEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setSelectedChallenge(null);
          }}
          challenge={selectedChallenge}
          onSave={handleSaveChallenge}
        />
      )}

      {/* Modal do Visualizador */}
      {showViewer && selectedChallenge && (
        <DailyChallengeViewer
          isOpen={showViewer}
          onClose={() => {
            setShowViewer(false);
            setSelectedChallenge(null);
          }}
          challenge={selectedChallenge}
        />
      )}
    </div>
  );
}