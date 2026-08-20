import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, BookOpen, Target, KeyRound, Users, CheckCircle2, GraduationCap, Clock } from 'lucide-react';

interface DailyChallengeViewerProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

const DailyChallengeViewer: React.FC<DailyChallengeViewerProps> = ({
  isOpen,
  onClose,
  challenge,
  onEdit,
  onDelete
}) => {
  if (!challenge) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5" />
            Visualizar Desafio Diário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header com informações básicas */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {challenge.title}
            </h3>
            
            {challenge.description && (
              <p className="text-gray-600 mb-4">
                {challenge.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
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
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(challenge.start_date || challenge.active_date || challenge.created_at)}
              </Badge>

              {challenge.correct_answer && (
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 flex items-center gap-1">
                  <KeyRound className="h-3 w-3 text-indigo-600" />
                  Chave: {challenge.correct_answer}
                </Badge>
              )}
            </div>
          </div>

          {/* Disciplina */}
          {challenge.subject_name && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-1">Disciplina</h4>
              <p className="text-gray-700">{challenge.subject_name}</p>
            </div>
          )}

          {/* Conteúdo principal */}
          <div className="bg-white border rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conteúdo do Desafio
            </h4>
            <div className="space-y-4">
              {/* Preview do conteúdo HTML */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b text-sm font-medium text-gray-700">
                  Preview Interativo
                </div>
                <div className="bg-white">
                  <iframe
                    srcDoc={challenge.content}
                    className="w-full min-h-[400px] border-0"
                    title="Preview do Desafio"
                    sandbox="allow-scripts allow-forms allow-popups allow-modals"
                  />
                </div>
              </div>
              
              {/* Código fonte (colapsável) */}
              <details className="border rounded-lg">
                <summary className="bg-gray-50 px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Ver código fonte
                </summary>
                <div className="p-3 bg-gray-800 text-green-400 font-mono text-sm overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{challenge.content}</pre>
                </div>
              </details>
            </div>
          </div>

          {/* Estatísticas e Submissões dos Alunos */}
          <div className="bg-slate-50 border rounded-lg p-5 space-y-4">
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
              <div className="bg-white p-3 rounded-lg border shadow-xs">
                <div className="text-2xl font-bold text-blue-600">
                  {challenge.stats?.total_attempts || 0}
                </div>
                <div className="text-xs text-gray-600 font-medium mt-0.5">Total de Tentativas</div>
              </div>
              <div className="bg-white p-3 rounded-lg border shadow-xs">
                <div className="text-2xl font-bold text-emerald-600">
                  {challenge.stats?.completed || 0}
                </div>
                <div className="text-xs text-gray-600 font-medium mt-0.5">Concluídos</div>
              </div>
              <div className="bg-white p-3 rounded-lg border shadow-xs">
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
                <div className="divide-y max-h-64 overflow-y-auto">
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
              <div className="text-center py-6 bg-white rounded-lg border text-gray-500 text-sm">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="font-medium text-gray-700">Nenhum aluno realizou este desafio ainda</p>
                <p className="text-xs text-gray-500 mt-1">Assim que os alunos executarem e concluírem a atividade, as tentativas aparecerão aqui.</p>
              </div>
            )}
          </div>

          {/* Informações adicionais */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Criado em:</span>{' '}
              {challenge.created_at ? formatDate(challenge.created_at) : 'N/A'}
            </div>
            <div>
              <span className="font-medium">Última atualização:</span>{' '}
              {challenge.updated_at ? formatDate(challenge.updated_at) : 'N/A'}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between pt-6">
          <div className="flex gap-2">
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
                Excluir
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {onEdit && (
              <Button onClick={() => {
                onEdit();
                onClose();
              }}>
                Editar
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DailyChallengeViewer;
