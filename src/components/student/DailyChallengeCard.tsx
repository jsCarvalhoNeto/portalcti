import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Target, Clock, BookOpen, Sparkles, KeyRound, CheckCircle2, AlertCircle, HelpCircle, Award, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import dailyChallengeService, { DailyChallenge } from '@/services/dailyChallengeService';
import { useToast } from '@/hooks/use-toast';

export default function DailyChallengeCard() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChallenge, setShowChallenge] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodayChallenge();
  }, []);

  // Listener para capturar status de tela cheia nativa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Erro ao alternar tela cheia:', err);
      toast({
        title: 'Aviso',
        description: 'Não foi possível alternar para tela cheia automaticamente.',
      });
    }
  };

  const handleCloseModal = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setShowChallenge(false);
  };

  const handleRestartActivity = () => {
    setReloadKey(prev => prev + 1);
    toast({
      title: 'Atividade Reiniciada',
      description: 'A atividade interativa foi recarregada.',
    });
  };

  // Listener para capturar mensagens de jogos/atividades interativas dentro do iframe
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (!event.data) return;

      const data = event.data;
      const possibleKey = data.key || data.answer || data.secret || (typeof data === 'string' ? data : null);

      if (data.type === 'CHALLENGE_SOLVED' || data.type === 'CHALLENGE_COMPLETED' || (data.source === 'interactive_game' && possibleKey)) {
        if (possibleKey && typeof possibleKey === 'string') {
          setStudentAnswer(possibleKey.trim());
          setErrorMessage(null);
          toast({
            title: 'Chave Recebida! 🎮',
            description: 'A atividade concluiu com sucesso e a chave de validação foi preenchida automaticamente.',
          });
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [toast]);

  const fetchTodayChallenge = async () => {
    setLoading(true);
    try {
      const data = await dailyChallengeService.getTodayChallenge();
      setChallenge(data);
    } catch (error) {
      console.error('Erro ao buscar desafio do dia:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChallenge = async () => {
    if (!challenge) return;

    if (challenge.is_completed) {
      toast({
        title: 'Desafio Já Concluído',
        description: 'Você já completou este desafio anteriormente e garantiu seus pontos!',
      });
      return;
    }

    const requiresValidation = Boolean(challenge.requires_validation || (challenge.correct_answer && challenge.correct_answer.trim().length > 0));

    if (requiresValidation && !studentAnswer.trim()) {
      const msg = 'Por favor, digite a resposta ou palavra-chave obtida na atividade.';
      setErrorMessage(msg);
      toast({
        title: 'Campo Obrigatório',
        description: msg,
        variant: 'destructive',
      });
      return;
    }
    
    setCompleting(true);
    setErrorMessage(null);

    try {
      const result = await dailyChallengeService.completeChallenge(challenge.id!, studentAnswer);
      if (result.success) {
        toast({
          title: 'Desafio Concluído com Sucesso! 🎉',
          description: `Parabéns! Você ganhou +${result.points} pontos!`,
          variant: 'default',
        });
        
        // Atualizar estado local para concluído
        setChallenge(prev => prev ? { ...prev, is_completed: true } : null);
        setStudentAnswer('');
        setErrorMessage(null);
        
        // Recarregar dados de gamificação no portal
        if ((window as any).dispatchEvent) {
          (window as any).dispatchEvent(new CustomEvent('gamification:update'));
        }
      }
    } catch (error: any) {
      console.error('Erro ao completar desafio:', error);
      const friendlyMsg = error.message || 'A palavra-chave ou resposta informada não confere. Verifique o resultado na atividade e tente novamente!';
      setErrorMessage(friendlyMsg);
      toast({
        title: 'Aviso',
        description: friendlyMsg,
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

  const isCompleted = Boolean(challenge.is_completed);
  const requiresValidation = Boolean(challenge.requires_validation || (challenge.correct_answer && challenge.correct_answer.trim().length > 0));

  return (
    <>
      <Card className={`hover:shadow-glow transition-all duration-300 ${
        isCompleted 
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' 
          : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className={`w-5 h-5 ${isCompleted ? 'text-emerald-600' : 'text-purple-600'}`} />
              Desafio do Dia
            </CardTitle>
            {isCompleted && (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluído
              </Badge>
            )}
          </div>
          <CardDescription>
            {isCompleted ? 'Você já completou este desafio!' : 'Complete e ganhe pontos!'}
          </CardDescription>
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
                
                {requiresValidation && !isCompleted && (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-indigo-600" />
                    Requer Resposta / Chave
                  </Badge>
                )}

                {challenge.subject_name && (
                  <Badge variant="outline">
                    {challenge.subject_name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setStudentAnswer('');
                  setErrorMessage(null);
                  setShowChallenge(true);
                }}
                className={`flex-1 text-white ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Ver Atividade (Concluída)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Ver Desafio
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal do Desafio */}
      <Dialog open={showChallenge} onOpenChange={(open) => { if (!open) handleCloseModal(); else setShowChallenge(true); }}>
        <DialogContent className={`max-w-5xl max-h-[94vh] overflow-hidden flex flex-col p-0 ${
          isFullscreen ? 'w-screen h-screen max-w-none max-h-none rounded-none border-0' : ''
        }`}>
          <div 
            ref={containerRef}
            className={`flex flex-col h-full w-full bg-white overflow-hidden ${
              isFullscreen ? 'p-4 sm:p-6 overflow-y-auto' : 'p-6'
            }`}
          >
            <DialogHeader className="pb-3 border-b mb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="h-5 w-5 text-indigo-600 shrink-0" />
                  <DialogTitle className="text-lg font-bold text-gray-900 truncate">
                    {challenge.title}
                  </DialogTitle>
                  {isCompleted && (
                    <Badge className="bg-emerald-600 text-white flex items-center gap-1 text-xs shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluído
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pr-6 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRestartActivity}
                    className="h-8 px-2.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-1"
                    title="Reiniciar Atividade"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reiniciar</span>
                  </Button>

                  <Button
                    variant={isFullscreen ? "secondary" : "default"}
                    size="sm"
                    onClick={toggleFullscreen}
                    className={`h-8 px-3 text-xs flex items-center gap-1.5 font-medium transition-all ${
                      isFullscreen
                        ? 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200 border border-indigo-300'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                    }`}
                    title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir para Tela Toda'}
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Sair da Tela Cheia</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Tela Cheia</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Banner de Parabéns se já concluído */}
              {isCompleted && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center gap-3">
                  <Award className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">Parabéns! Desafio Concluído! 🎉</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Você já concluiu este desafio e garantiu seus +{challenge.points} pontos na gamificação.
                    </p>
                  </div>
                </div>
              )}

              {challenge.description && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700 text-sm">{challenge.description}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap items-center">
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {getDifficultyText(challenge.difficulty)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {getTypeText(challenge.type)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  {challenge.points} pontos
                </Badge>
                {requiresValidation && !isCompleted && (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-indigo-600" />
                    Validação Obrigatória
                  </Badge>
                )}
              </div>

              {/* Renderização do conteúdo HTML */}
              <div className="border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h4 className="font-medium text-gray-900 text-sm">Atividade Interativa</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {requiresValidation && !isCompleted && (
                      <span className="text-xs text-indigo-600 font-medium hidden md:inline">
                        Ao concluir a atividade, insira a resposta ou chave abaixo
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullscreen}
                      className="h-7 px-2 text-xs text-gray-600 hover:text-indigo-600 flex items-center gap-1"
                      title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir Atividade'}
                    >
                      {isFullscreen ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Restaurar</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Expandir</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="bg-white min-h-[400px]">
                  <iframe
                    key={reloadKey}
                    srcDoc={challenge.html_content}
                    className={`w-full border-0 transition-all duration-200 ${
                      isFullscreen ? 'h-[72vh] min-h-[580px]' : 'h-[550px]'
                    }`}
                    title="Desafio Interativo"
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                    allow="autoplay; fullscreen; camera; microphone; clipboard-read; clipboard-write"
                  />
                </div>
              </div>

              {/* Área de Validação e Conclusão */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                {isCompleted ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-emerald-50/50 border border-emerald-200 rounded-md">
                    <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Você já completou e pontuou neste desafio!</span>
                    </div>
                    <Button 
                      disabled={true}
                      className="bg-emerald-600 text-white opacity-90 cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Desafio Concluído (+{challenge.points} pts)
                    </Button>
                  </div>
                ) : requiresValidation ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      <span>Validação do Desafio:</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        type="text"
                        value={studentAnswer}
                        onChange={(e) => {
                          setStudentAnswer(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && studentAnswer.trim() && !completing) {
                            handleCompleteChallenge();
                          }
                        }}
                        placeholder="Digite o resultado, resposta ou a palavra-chave da atividade..."
                        className={`bg-white transition-colors flex-1 ${
                          errorMessage ? 'border-red-400 focus:border-red-500 ring-1 ring-red-200' : 'border-gray-300 focus:border-indigo-500'
                        }`}
                      />
                      <Button 
                        onClick={handleCompleteChallenge}
                        disabled={completing || !studentAnswer.trim()}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shrink-0"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        {completing ? 'Validando...' : `Validar e Ganhar (+${challenge.points} pts)`}
                      </Button>
                    </div>

                    {/* Feedback visual inline de erro/ajuda acessível */}
                    {errorMessage ? (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 animate-in fade-in duration-200">
                        <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Quase lá! Resposta ou chave não confere.</p>
                          <p className="text-xs text-red-600 mt-0.5">
                            Verifique se você concluiu a atividade interativa corretamente e obteve a chave esperada. (Maiúsculas e minúsculas não fazem diferença).
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                        <span>Dica: A validação não diferencia letras maiúsculas de minúsculas.</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Esta atividade é de participação livre. Clique no botão ao lado para concluir.
                    </span>
                    <Button 
                      onClick={handleCompleteChallenge}
                      disabled={completing}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      {completing ? 'Completando...' : `Completar (+${challenge.points} pts)`}
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={handleCloseModal}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}