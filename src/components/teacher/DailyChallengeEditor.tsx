import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import { Eye } from 'lucide-react';

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
    type: 'question'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (challenge) {
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        content: challenge.content || '',
        difficulty: challenge.difficulty || 'medium',
        points: challenge.points || 10,
        subject_id: challenge.subject_id?.toString() || '0',
        active_date: challenge.active_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        type: challenge.type || 'question'
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
        type: 'question'
      });
    }
  }, [challenge, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Por favor, preencha pelo menos o título e o conteúdo do desafio.');
      return;
    }

    setIsLoading(true);
    try {
      const challengeData = {
        ...formData,
        subject_id: formData.subject_id !== '0' ? parseInt(formData.subject_id) : null,
        points: parseInt(formData.points.toString())
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              placeholder="Ex: Resolva este problema matemático"
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
              placeholder="Descrição breve do desafio (opcional)"
              rows={2}
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Conteúdo do Desafio *</Label>
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
              <p className="text-sm text-muted-foreground">
                Você pode escrever HTML, CSS e JavaScript. O código será renderizado como uma página web interativa.
              </p>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder={`Exemplo:
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Meu Desafio Interativo</h1>
        <p>Clique no botão abaixo!</p>
        <button onclick="alert('Parabéns!')">Clique aqui</button>
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
                onChange={(e) => handleInputChange('points', parseInt(e.target.value))}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (challenge ? 'Atualizar' : 'Criar Desafio')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DailyChallengeEditor;
