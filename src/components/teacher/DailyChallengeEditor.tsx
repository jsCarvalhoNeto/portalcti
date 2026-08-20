import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import { Eye, KeyRound, Sparkles, HelpCircle } from 'lucide-react';

interface DailyChallengeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  challenge?: any;
  onSave: (challenge: any) => void;
}

const DailyChallengeEditor: React.FC<DailyChallengeEditorProps> = ({
  isOpen,
  onClose,
  challenge,
  onSave
}) => {
  const { subjects } = useTeacherDashboard();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    difficulty: 'medium',
    points: 10,
    subject_id: '0',
    active_date: new Date().toISOString().split('T')[0],
    type: 'question',
    requires_validation: false,
    correct_answer: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        content: challenge.content || challenge.html_content || '',
        difficulty: challenge.difficulty || 'medium',
        points: challenge.points || 10,
        subject_id: challenge.subject_id?.toString() || '0',
        active_date: (challenge.start_date || challenge.active_date || challenge.created_at)?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: challenge.type || 'question',
        requires_validation: Boolean(challenge.requires_validation || challenge.correct_answer),
        correct_answer: challenge.correct_answer || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        content: '',
        difficulty: 'medium',
        points: 10,
        subject_id: '0',
        active_date: new Date().toISOString().split('T')[0],
        type: 'question',
        requires_validation: false,
        correct_answer: ''
      });
    }
  }, [challenge, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Por favor, preencha pelo menos o título e o conteúdo do desafio.');
      return;
    }

    if (formData.requires_validation && !formData.correct_answer.trim()) {
      alert('Você ativou a exigência de chave/resposta, por favor informe o valor esperado.');
      return;
    }

    setIsLoading(true);
    try {
      const challengeData = {
        ...formData,
        subject_id: formData.subject_id !== '0' ? parseInt(formData.subject_id) : null,
        points: parseInt(formData.points.toString()),
        requires_validation: formData.requires_validation,
        correct_answer: formData.requires_validation ? formData.correct_answer.trim() : null
      };
      
      await onSave(challengeData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar desafio:', error);
      alert('Erro ao salvar o desafio. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {challenge ? 'Editar Desafio Diário' : 'Novo Desafio Diário'}
          </DialogTitle>
          <DialogDescription>
            {challenge ? 'Edite as informações do desafio diário.' : 'Crie um novo desafio diário para seus alunos.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título do Desafio *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Resolva este problema matemático ou vença o jogo"
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descrição breve ou instruções do desafio para o aluno"
              rows={2}
            />
          </div>

          {/* Seção de Validação e Chave Secreta */}
          <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <Label htmlFor="requires_validation" className="font-semibold text-indigo-900 cursor-pointer">
                  Exigir Palavra-Chave ou Resposta Correta para Conclusão
                </Label>
              </div>
              <input
                type="checkbox"
                id="requires_validation"
                checked={formData.requires_validation}
                onChange={(e) => handleInputChange('requires_validation', e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {formData.requires_validation && (
              <div className="pt-2 space-y-2">
                <Label htmlFor="correct_answer" className="text-sm font-medium text-gray-700">
                  Chave Secreta ou Resposta Esperada *
                </Label>
                <Input
                  id="correct_answer"
                  value={formData.correct_answer}
                  onChange={(e) => handleInputChange('correct_answer', e.target.value)}
                  placeholder="Ex: H2O, 42, VITORIA2026, PARABENS"
                  required={formData.requires_validation}
                  className="bg-white border-indigo-200 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    O aluno só ganha os pontos se digitar exatamente esse valor (a validação não diferencia maiúsculas de minúsculas).
                    Em jogos HTML, você também pode disparar <code>window.parent.postMessage({'{'} type: 'CHALLENGE_SOLVED', key: '{formData.correct_answer || 'SUA_CHAVE'}' {'}'}, '*')</code> ao finalizar.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Conteúdo Interativo do Desafio (HTML / CSS / JS) *</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
              </Button>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Escreva o código HTML da atividade, quiz ou jogo. O aluno visualizará esse código dentro do portal.
              </p>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder={`Exemplo de jogo ou pergunta:
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 20px; }
    .btn { background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .secret { font-weight: bold; color: #16a34a; font-size: 1.2rem; }
  </style>
</head>
<body>
  <h3>Resolva a charada:</h3>
  <p>Qual é o elemento mais abundante no universo?</p>
  <button class="btn" onclick="document.getElementById('resp').style.display='block'">Mostrar Dica</button>
  <div id="resp" style="display:none; margin-top:15px;">
    Chave do Desafio: <span class="secret">HIDROGENIO</span>
  </div>
</body>
</html>`}
                rows={showPreview ? 8 : 12}
                required
                className="font-mono text-sm"
              />
              {showPreview && formData.content && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b text-sm font-medium text-gray-700">
                    Preview Interativo
                  </div>
                  <div className="bg-white">
                    <iframe
                      srcDoc={formData.content}
                      className="w-full min-h-[300px] border-0"
                      title="Preview do Desafio"
                      sandbox="allow-scripts allow-forms allow-popups allow-modals"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Disciplina */}
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) => handleInputChange('subject_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todas as disciplinas</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label>Tipo de Desafio</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">Pergunta</SelectItem>
                  <SelectItem value="exercise">Exercício</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="reflection">Reflexão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Dificuldade */}
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => handleInputChange('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pontos */}
            <div className="space-y-2">
              <Label htmlFor="points">Pontos</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="100"
                value={formData.points}
                onChange={(e) => handleInputChange('points', parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="active_date">Data de Ativação</Label>
              <Input
                id="active_date"
                type="date"
                value={formData.active_date}
                onChange={(e) => handleInputChange('active_date', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {isLoading ? 'Salvando...' : (challenge ? 'Atualizar' : 'Criar Desafio')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DailyChallengeEditor;
