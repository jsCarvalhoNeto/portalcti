import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Code, Sparkles, HelpCircle, Gamepad2, Play, Trophy, PenTool } from 'lucide-react';
import { InteractiveActivity } from '@/services/interactiveActivityService';

interface InteractiveActivityEditorProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: InteractiveActivity | null;
  subjectId: number;
  subjectName?: string;
  onSave: (activityData: any) => Promise<void>;
}

const TEMPLATE_EXAMPLE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1e1b4b, #0f172a);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(30, 41, 59, 0.85);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 30px;
      max-width: 550px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      text-align: center;
    }
    h1 { font-size: 1.6rem; color: #818cf8; margin-bottom: 12px; }
    p { font-size: 1rem; color: #cbd5e1; margin-bottom: 24px; line-height: 1.5; }
    .btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    button {
      background: #4f46e5;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover { background: #6366f1; transform: translateY(-2px); }
    .score-box {
      margin-top: 20px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 Desafio Interativo</h1>
    <p id="question">Qual componente do computador é responsável por processar todas as instruções e cálculos?</p>
    <div class="btn-grid">
      <button onclick="checkAnswer(false)">Memória RAM</button>
      <button onclick="checkAnswer(true)">Processador (CPU)</button>
      <button onclick="checkAnswer(false)">Disco Rígido (HD)</button>
      <button onclick="checkAnswer(false)">Placa de Vídeo</button>
    </div>
    <div id="result" class="score-box" style="display:none;"></div>
  </div>

  <script>
    function checkAnswer(isCorrect) {
      const res = document.getElementById('result');
      res.style.display = 'block';
      if (isCorrect) {
        res.innerHTML = '🎉 <strong>Correto!</strong> O Processador (CPU) é o cérebro do computador.';
        res.style.borderColor = '#22c55e';
        res.style.background = 'rgba(34, 197, 94, 0.2)';
      } else {
        res.innerHTML = '❌ <strong>Tente novamente!</strong> Pense em qual unidade executa as instruções.';
        res.style.borderColor = '#ef4444';
        res.style.background = 'rgba(239, 68, 68, 0.2)';
      }
    }
  </script>
</body>
</html>`;

export default function InteractiveActivityEditor({
  isOpen,
  onClose,
  activity,
  subjectId,
  subjectName,
  onSave
}: InteractiveActivityEditorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code_content: '',
    type: 'game' as 'game' | 'simulation' | 'quiz' | 'exercise',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: '20 min'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        code_content: activity.code_content || '',
        type: activity.type || 'game',
        difficulty: activity.difficulty || 'beginner',
        duration: activity.duration || '20 min'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        code_content: '',
        type: 'game',
        difficulty: 'beginner',
        duration: '20 min'
      });
    }
    setShowPreview(false);
  }, [activity, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Por favor, informe o título da atividade interativa.');
      return;
    }

    if (!formData.code_content.trim()) {
      alert('Por favor, cole o código do artefato HTML/CSS/JS da atividade.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave({
        ...formData,
        subject_id: subjectId
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar atividade interativa:', error);
      alert('Erro ao salvar a atividade. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertTemplate = () => {
    if (formData.code_content.trim() && !confirm('Deseja substituir o código atual pelo modelo de exemplo?')) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      title: prev.title || 'Quiz Interativo de Hardware',
      description: prev.description || 'Teste seus conhecimentos sobre os componentes principais do computador.',
      type: 'quiz',
      code_content: TEMPLATE_EXAMPLE
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Gamepad2 className="w-6 h-6" />
            <DialogTitle className="text-xl">
              {activity ? 'Editar Atividade Interativa' : 'Criar Nova Atividade Interativa'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {subjectName 
              ? `Disciplina: ${subjectName}. Cole o artefato de código HTML (com CSS e JS) para gerar o card da atividade.`
              : 'Cole o artefato de código HTML (com CSS e JS) para gerar o card da atividade para a turma.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Título da Atividade */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-1">
              Nome da Atividade Interativa *
              <span className="text-xs font-normal text-muted-foreground">(Aparece no topo do card)</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Simulador de Portas Lógicas / Jogo da Memória de Hardware"
              required
              className="text-base"
            />
          </div>

          {/* Descrição / Instruções */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold">
              Descrição ou Orientações para o Aluno
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo da atividade e instruções para os estudantes..."
              rows={2}
            />
          </div>

          {/* Metadados: Tipo, Dificuldade, Duração */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Atividade</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val: any) => setFormData(prev => ({ ...prev, type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="game">🎮 Jogo Educativo</SelectItem>
                  <SelectItem value="simulation">⚡ Simulação Interativa</SelectItem>
                  <SelectItem value="quiz">🏆 Quiz / Desafio</SelectItem>
                  <SelectItem value="exercise">✏️ Exercício Prático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Dificuldade</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(val: any) => setFormData(prev => ({ ...prev, difficulty: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">🟢 Iniciante</SelectItem>
                  <SelectItem value="intermediate">🟡 Intermediário</SelectItem>
                  <SelectItem value="advanced">🔴 Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">Duração Estimada</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="Ex: 15 min, 30 min"
              />
            </div>
          </div>

          {/* Código do Artefato */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="code_content" className="text-sm font-semibold flex items-center gap-2">
                <Code className="w-4 h-4 text-primary" />
                Código do Artefato Interativo (HTML + CSS + JS) *
              </Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleInsertTemplate}
                  className="text-xs h-8"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                  Carregar Exemplo
                </Button>
                <Button 
                  type="button" 
                  variant={showPreview ? 'secondary' : 'outline'} 
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs h-8"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Cole aqui o código gerado pelo artefato de código. Ele será executado interativamente em tela cheia quando o aluno ou professor abrir a atividade.
            </p>

            <Textarea
              id="code_content"
              value={formData.code_content}
              onChange={(e) => setFormData(prev => ({ ...prev, code_content: e.target.value }))}
              placeholder="Cole aqui o código <!DOCTYPE html> <html> ... <style>...</style> <script>...</script> </html>"
              rows={showPreview ? 8 : 13}
              required
              className="font-mono text-xs bg-slate-950 text-emerald-400 border-slate-800 focus:ring-primary"
              spellCheck={false}
            />

            {/* Preview em tempo real */}
            {showPreview && formData.code_content && (
              <div className="mt-3 border rounded-xl overflow-hidden shadow-md bg-card">
                <div className="bg-muted px-4 py-2 border-b flex items-center justify-between text-xs font-semibold">
                  <span>Pré-visualização da Atividade</span>
                  <span className="text-muted-foreground">Iframe Sandbox</span>
                </div>
                <div className="bg-slate-900 flex items-center justify-center p-1">
                  <iframe
                    srcDoc={formData.code_content}
                    title="Preview da Atividade Interativa"
                    className="w-full min-h-[380px] border-0 rounded-lg bg-white"
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? 'Salvando...' : activity ? 'Atualizar Atividade' : 'Criar Atividade Interativa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
