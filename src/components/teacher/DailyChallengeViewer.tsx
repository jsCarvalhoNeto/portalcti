import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, BookOpen, Target, KeyRound } from 'lucide-react';

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

          {/* Estatísticas (se disponível) */}
          {challenge.stats && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Estatísticas</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {challenge.stats.total_attempts || 0}
                  </div>
                  <div className="text-sm text-gray-600">Tentativas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {challenge.stats.completed || 0}
                  </div>
                  <div className="text-sm text-gray-600">Concluídos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {challenge.stats.success_rate || '0'}%
                  </div>
                  <div className="text-sm text-gray-600">Taxa de Sucesso</div>
                </div>
              </div>
            </div>
          )}

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
