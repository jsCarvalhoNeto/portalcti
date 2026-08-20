import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar, 
  Trophy, 
  BookOpen, 
  Target, 
  KeyRound, 
  Users, 
  CheckCircle2, 
  GraduationCap, 
  Clock, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Sparkles, 
  AlertCircle, 
  Play, 
  Code2, 
  Eye,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DailyChallengeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: any;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleActive?: (challengeId: number, isActive: boolean) => void;
}

const DailyChallengeViewer: React.FC<DailyChallengeViewerProps> = ({
  isOpen,
  onClose,
  challenge,
  onEdit,
  onDelete,
  onToggleActive
}) => {
  const { toast } = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [testAnswer, setTestAnswer] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'submissions' | 'code'>('preview');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Listener para capturar mensagens do iframe do jogo
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (!event.data) return;

      const data = event.data;
      const possibleKey = data.key || data.answer || data.secret || (typeof data === 'string' ? data : null);

      if (data.type === 'CHALLENGE_SOLVED' || data.type === 'CHALLENGE_COMPLETED' || (data.source === 'interactive_game' && possibleKey)) {
        if (possibleKey && typeof possibleKey === 'string') {
          setTestAnswer(possibleKey.trim());
          setTestResult({
            success: true,
            message: `Chave capturada automaticamente do jogo: "${possibleKey.trim()}"`
          });
          toast({
            title: '🎮 Chave Detectada!',
            description: `O jogo enviou a chave de conclusão: ${possibleKey.trim()}`,
          });
        }
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [toast]);

  if (!challenge) return null;

  const htmlContent = challenge.html_content || challenge.content || '';

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

  const handleRestart = () => {
    setReloadKey(prev => prev + 1);
    setTestResult(null);
    toast({
      title: 'Atividade Reiniciada',
      description: 'O preview interativo foi recarregado para um novo teste.',
    });
  };

  const handleTestValidate = () => {
    if (!testAnswer.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, digite a resposta ou palavra-chave para testar.'
      });
      return;
    }

    const expected = (challenge.correct_answer || '').trim();
    if (!expected) {
      setTestResult({
        success: true,
        message: 'Este desafio não possui chave obrigatória configurada (conclusão livre).'
      });
      return;
    }

    const isMatch = testAnswer.trim().toLowerCase() === expected.toLowerCase();
    if (isMatch) {
      setTestResult({
        success: true,
        message: `Correto! "${testAnswer.trim()}" confere com a chave cadastrada ("${expected}"). Os alunos conseguirão pontuar com sucesso!`
      });
    } else {
      setTestResult({
        success: false,
        message: `Incorreto! Você digitou "${testAnswer.trim()}", mas a chave esperada cadastrada é "${expected}".`
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não informada';
    try {
      const dateOnly = dateString.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        const [year, month, day] = dateOnly.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
      }
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data não informada';
      return date.toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateString || 'Data não informada';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString || '-';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (!open) onClose();
    }}>
      <DialogContent className={`max-w-5xl max-h-[94vh] overflow-y-auto flex flex-col p-0 ${
        isFullscreen ? 'w-screen h-screen max-w-none max-h-none rounded-none border-0' : ''
      }`}>
        <div 
          ref={containerRef}
          className={`flex flex-col h-full w-full bg-slate-50 overflow-hidden ${
            isFullscreen ? 'p-4 sm:p-6 overflow-y-auto' : 'p-6'
          }`}
        >
          {/* Header do Visualizador */}
          <DialogHeader className="pb-4 border-b bg-white -m-6 mb-4 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-5 w-5 text-indigo-600 shrink-0" />
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    {challenge.title}
                  </DialogTitle>
                  {challenge.is_active ? (
                    <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Ativo</Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-300">Inativo</Badge>
                  )}
                </div>
                {challenge.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{challenge.description}</p>
                )}
              </div>

              {/* Ações Rápidas do Cabeçalho */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestart}
                  className="h-8 px-2.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
                  title="Reiniciar Pré-visualização"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar</span>
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

            {/* Badges de Metadados */}
            <div className="flex flex-wrap items-center gap-2 pt-3">
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
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(challenge.start_date || challenge.active_date || challenge.created_at)}
              </Badge>

              {challenge.subject_name && (
                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                  {challenge.subject_name}
                </Badge>
              )}

              {challenge.correct_answer && (
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 flex items-center gap-1">
                  <KeyRound className="h-3 w-3 text-indigo-600" />
                  Chave Esperada: <strong className="font-mono ml-0.5">{challenge.correct_answer}</strong>
                </Badge>
              )}
            </div>
          </DialogHeader>

          {/* Abas de Navegação */}
          <div className="flex items-center gap-2 mb-4 border-b pb-2">
            <Button
              variant={activeTab === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('preview')}
              className={`h-8 text-xs font-semibold ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Preview Interativo & Teste
            </Button>
            <Button
              variant={activeTab === 'submissions' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('submissions')}
              className={`h-8 text-xs font-semibold ${activeTab === 'submissions' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Tentativas dos Alunos ({challenge.stats?.total_attempts || 0})
            </Button>
            <Button
              variant={activeTab === 'code' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('code')}
              className={`h-8 text-xs font-semibold ${activeTab === 'code' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              <Code2 className="w-3.5 h-3.5 mr-1.5" />
              Código Fonte
            </Button>
          </div>
          
          <div className="space-y-6 flex-1 overflow-y-auto pr-1">
            {activeTab === 'preview' && (
              <>
                {/* Banner de Instrução para Teste do Professor */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3.5 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-indigo-900 space-y-1">
                    <p className="font-semibold">Modo de Teste Interativo do Professor</p>
                    <p className="text-indigo-800">
                      Você pode jogar, clicar e testar a atividade livremente abaixo. Para simular a validação da resposta/chave obtida pelo aluno, utilize o simulador logo abaixo da atividade.
                    </p>
                  </div>
                </div>

                {/* Preview Interativo do Desafio (Iframe) */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="bg-gray-100/90 px-4 py-2 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                        Ambiente de Execução Interativa
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRestart}
                        className="h-7 px-2 text-xs text-gray-600 hover:text-indigo-600"
                        title="Recarregar Atividade"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Recarregar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="h-7 px-2 text-xs text-gray-600 hover:text-indigo-600"
                        title={isFullscreen ? 'Sair da Tela Cheia' : 'Maximizar'}
                      >
                        {isFullscreen ? (
                          <>
                            <Minimize2 className="w-3 h-3 mr-1" />
                            Restaurar
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3 h-3 mr-1" />
                            Expandir
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white min-h-[480px]">
                    <iframe
                      key={reloadKey}
                      srcDoc={htmlContent}
                      className={`w-full border-0 transition-all duration-200 ${
                        isFullscreen ? 'h-[75vh] min-h-[600px]' : 'h-[520px] min-h-[480px]'
                      }`}
                      title="Preview do Desafio"
                      sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin allow-downloads"
                      allow="autoplay; fullscreen; camera; microphone; clipboard-read; clipboard-write"
                    />
                  </div>
                </div>

                {/* Simulador de Validação para o Professor */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-bold text-gray-900">
                        Simulador de Validação (Teste do Professor)
                      </h4>
                    </div>
                    {challenge.correct_answer && (
                      <span className="text-xs text-gray-500">
                        Chave configurada: <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{challenge.correct_answer}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      value={testAnswer}
                      onChange={(e) => {
                        setTestAnswer(e.target.value);
                        if (testResult) setTestResult(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleTestValidate();
                      }}
                      placeholder="Digite o resultado/chave obtido na atividade para testar a validação..."
                      className="bg-white border-gray-300 focus:border-indigo-500 flex-1"
                    />
                    <Button
                      onClick={handleTestValidate}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 mr-1.5" />
                      Testar Validação
                    </Button>
                  </div>

                  {testResult && (
                    <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 animate-in fade-in duration-200 ${
                      testResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold">{testResult.success ? 'Validação bem-sucedida!' : 'Validação falhou!'}</p>
                        <p className="mt-0.5">{testResult.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'submissions' && (
              <div className="bg-white border rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Tentativas e Submissões dos Alunos ({challenge.stats?.total_attempts || 0})
                  </h4>
                  {(challenge.stats?.total_attempts || 0) > 0 && (
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                      {challenge.stats?.total_attempts} {challenge.stats?.total_attempts === 1 ? 'aluno completou' : 'alunos completaram'}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">
                      {challenge.stats?.total_attempts || 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-0.5">Total de Tentativas</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-emerald-600">
                      {challenge.stats?.completed || 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-0.5">Concluídos</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600">
                      {challenge.stats?.success_rate || 0}%
                    </div>
                    <div className="text-xs text-gray-600 font-medium mt-0.5">Taxa de Conclusão</div>
                  </div>
                </div>

                {/* Lista dos Alunos */}
                {challenge.submissions && challenge.submissions.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="bg-gray-100/80 px-4 py-2.5 text-xs font-semibold text-gray-700 uppercase tracking-wider grid grid-cols-12 gap-2 border-b">
                      <span className="col-span-5 sm:col-span-5">Aluno</span>
                      <span className="col-span-3 sm:col-span-2">Turma / Série</span>
                      <span className="col-span-4 sm:col-span-3">Data da Tentativa</span>
                      <span className="hidden sm:block sm:col-span-2 text-right">Pontos</span>
                    </div>
                    <div className="divide-y max-h-72 overflow-y-auto">
                      {challenge.submissions.map((sub: any, idx: number) => (
                        <div key={sub.id || idx} className="px-4 py-3 text-sm grid grid-cols-12 gap-2 items-center hover:bg-slate-50 transition-colors">
                          <div className="col-span-5 sm:col-span-5 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{sub.student_name || 'Aluno'}</p>
                            {sub.student_email && <p className="text-xs text-gray-500 truncate">{sub.student_email}</p>}
                            {sub.student_answer && (
                              <p className="text-xs text-indigo-600 mt-1 truncate" title={`Resposta/Chave informada: ${sub.student_answer}`}>
                                Chave/Resposta: <span className="font-mono bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">{sub.student_answer}</span>
                              </p>
                            )}
                          </div>
                          <div className="col-span-3 sm:col-span-2 text-xs text-gray-600">
                            {sub.student_grade ? (
                              <Badge variant="outline" className="text-[11px] px-2 py-0.5 font-normal">
                                {sub.student_grade}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="col-span-4 sm:col-span-3 text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{formatDateTime(sub.submitted_at)}</span>
                          </div>
                          <div className="col-span-12 sm:col-span-2 flex sm:justify-end mt-1 sm:mt-0">
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-semibold">
                              +{sub.points_awarded || challenge.points} pts
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border text-gray-500 text-sm">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">Nenhum aluno realizou este desafio ainda</p>
                    <p className="text-xs text-gray-500 mt-1">Assim que os alunos executarem e concluírem a atividade, as tentativas aparecerão aqui.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'code' && (
              <div className="bg-white border rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    Código Fonte HTML / CSS / JavaScript
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(htmlContent);
                      toast({
                        title: 'Código Copiado',
                        description: 'O código do desafio foi copiado para a área de transferência.',
                      });
                    }}
                    className="text-xs h-7"
                  >
                    Copiar Código
                  </Button>
                </div>
                <div className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-96">
                  <pre className="whitespace-pre-wrap">{htmlContent}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé do Modal */}
          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t bg-white -m-6 mt-4 p-6 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onDelete && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir este desafio?')) {
                      onDelete();
                      onClose();
                    }
                  }}
                >
                  Excluir Desafio
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              {onEdit && (
                <Button 
                  onClick={() => {
                    onClose();
                    onEdit();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Editar Desafio
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DailyChallengeViewer;

