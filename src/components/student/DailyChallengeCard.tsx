import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Target, Clock, BookOpen, Sparkles } from 'lucide-react';
import dailyChallengeService, { DailyChallenge } from '@/services/dailyChallengeService';
import { useToast } from '@/hooks/use-toast';

export default function DailyChallengeCard() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const [completing, setCompleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🎯 DailyChallengeCard: Componente montado');
    fetchTodayChallenge();
  }, []);

  const fetchTodayChallenge = async () => {
    console.log('🔍 DailyChallengeCard: Iniciando busca do desafio do dia...');
    setLoading(true);
    try {
      console.log('📞 DailyChallengeCard: Chamando dailyChallengeService.getTodayChallenge()...');
      const data = await dailyChallengeService.getTodayChallenge();
      console.log('📊 DailyChallengeCard: Resultado getTodayChallenge:', data);
      setChallenge(data);
      
      if (data) {
        console.log('✅ DailyChallengeCard: Desafio carregado com sucesso:', data.title);
      } else {
        console.log('❌ DailyChallengeCard: Nenhum desafio encontrado');
      }
    } catch (error) {
      console.error('❌ DailyChallengeCard: Erro ao buscar desafio do dia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChallenge = async () => {
    if (!challenge) return;
    
    setCompleting(true);
    try {
      const result = await dailyChallengeService.completeChallenge(challenge.id!);
      if (result.success) {
        toast({
          title: 'Parabéns! 🎉',
          description: `Você ganhou ${result.points} pontos!`,
          variant: 'default',
        });
        // Recarregar dados de gamificação
        if ((window as any).dispatchEvent) {
          (window as any).dispatchEvent(new CustomEvent('gamification:update'));
        }
      }
    } catch (error) {
      console.error('Erro ao completar desafio:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível completar o desafio. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setCompleting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'question': return 'Pergunta';
      case 'exercise': return 'Exercício';
      case 'quiz': return 'Quiz';
      case 'reflection': return 'Reflexão';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card className="hover:shadow-glow transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Desafio do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Carregando desafio...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challenge) {
    return (
      <Card className="hover:shadow-glow transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Desafio do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum desafio disponível hoje</p>
            <p className="text-sm text-muted-foreground">Volte amanhã para um novo desafio!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="hover:shadow-glow transition-all duration-300 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Desafio do Dia
          </CardTitle>
          <CardDescription>Complete e ganhe pontos!</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {challenge.title}
              </h3>
              {challenge.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {challenge.description}
                </p>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {getDifficultyText(challenge.difficulty)}
                </Badge>
                
                <Badge variant="outline" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {getTypeText(challenge.type)}
                </Badge>
                
                <Badge variant="outline" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {challenge.points} pontos
                </Badge>
                
                {challenge.subject_name && (
                  <Badge variant="outline">
                    {challenge.subject_name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setShowChallenge(true)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ver Desafio
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal do Desafio */}
      <Dialog open={showChallenge} onOpenChange={setShowChallenge}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {challenge.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4">
            {challenge.description && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">{challenge.description}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Badge className={getDifficultyColor(challenge.difficulty)}>
                {getDifficultyText(challenge.difficulty)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {getTypeText(challenge.type)}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {challenge.points} pontos
              </Badge>
            </div>

            {/* Renderização do conteúdo HTML */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-gray-900">Atividade Interativa</h4>
              </div>
              <div className="bg-white min-h-[400px]">
                {(() => {
                  console.log('🎨 DailyChallengeCard: Tentando renderizar HTML do desafio...');
                  console.log('📄 DailyChallengeCard: html_content disponível:', !!challenge.html_content);
                  console.log('📏 DailyChallengeCard: Tamanho html_content:', challenge.html_content?.length || 0);
                  console.log('🔍 DailyChallengeCard: Preview html_content:', challenge.html_content?.substring(0, 200) || 'VAZIO');
                  return null;
                })()}
                <iframe
                  srcDoc={challenge.html_content}
                  className="w-full h-[600px] border-0"
                  title="Desafio Interativo"
                  sandbox="allow-scripts allow-forms allow-popups allow-modals"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setShowChallenge(false)}>
                Fechar
              </Button>
              <Button 
                onClick={handleCompleteChallenge}
                disabled={completing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Trophy className="w-4 h-4 mr-2" />
                {completing ? 'Completando...' : `Completar (+${challenge.points} pts)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}