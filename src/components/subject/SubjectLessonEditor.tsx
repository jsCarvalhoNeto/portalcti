import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  Eye, 
  Edit3, 
  HelpCircle,
  Award,
  Layers,
  Code2,
  List,
  Bold,
  Italic,
  Quote,
  Table as TableIcon,
  Presentation,
  Video,
  ExternalLink,
  Link2
} from 'lucide-react';
import { SubjectLesson, CreateLessonData } from '@/services/subjectLessonService';
import { markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';

interface SubjectLessonEditorProps {
  isOpen: boolean;
  onClose: () => void;
  lesson?: SubjectLesson | null;
  subjectId: number;
  subjectName?: string;
  nextOrderIndex?: number;
  onSave: (lessonData: CreateLessonData) => Promise<void>;
}

const LESSON_TEMPLATE = `## 🎯 Objetivos da Aula
- Compreender os conceitos fundamentais do tópico
- Praticar com exemplos do mundo real
- Desenvolver a atividade prática proposta

---

## 📖 Conteúdo Programático
Apresente aqui o conteúdo textual detalhado da aula. Você pode utilizar tópicos, explicações conceituais e notas explicativas.

### 1. Introdução
Explicação introdutória sobre o assunto da aula...

### 2. Conceitos Principais
- **Conceito A**: Definição clara e direta
- **Conceito B**: Aplicação prática no mercado

---

## 💻 Exemplos de Código / Sintaxe
\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Exemplo de Aula</title>
</head>
<body>
  <h1>Olá Mundo!</h1>
</body>
</html>
\`\`\`

---

## 📝 Atividades & Prática Recomendada
1. Revise os conceitos apresentados.
2. Execute o código de exemplo no seu ambiente.
3. Prepare as dúvidas para a próxima aula.
`;

const CODE_LANGUAGES = [
  { value: 'html', label: 'HTML5' },
  { value: 'css', label: 'CSS3' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'jsx', label: 'React (JSX)' },
  { value: 'tsx', label: 'React (TSX)' },
  { value: 'php', label: 'PHP' },
  { value: 'python', label: 'Python' },
  { value: 'sql', label: 'SQL' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C / C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'bash', label: 'Bash / Terminal' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
];

export default function SubjectLessonEditor({
  isOpen,
  onClose,
  lesson,
  subjectId,
  subjectName,
  nextOrderIndex = 1,
  onSave
}: SubjectLessonEditorProps) {
  const [formData, setFormData] = useState<CreateLessonData>({
    subject_id: subjectId,
    title: '',
    lesson_date: new Date().toISOString().split('T')[0],
    content: '',
    is_completed: false,
    period: '1',
    evaluation_type: 'none',
    pdf_url: '',
    presentation_url: '',
    video_url: '',
    order_index: nextOrderIndex
  });

  const [selectedLanguage, setSelectedLanguage] = useState('html');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lesson) {
      setFormData({
        subject_id: lesson.subject_id || subjectId,
        title: lesson.title || '',
        lesson_date: lesson.lesson_date ? lesson.lesson_date.split('T')[0] : '',
        content: lesson.content || '',
        is_completed: Boolean(lesson.is_completed),
        period: lesson.period ? String(lesson.period) : '1',
        evaluation_type: lesson.evaluation_type || 'none',
        pdf_url: lesson.pdf_url || '',
        presentation_url: lesson.presentation_url || '',
        video_url: lesson.video_url || '',
        order_index: lesson.order_index ?? nextOrderIndex
      });
    } else {
      setFormData({
        subject_id: subjectId,
        title: '',
        lesson_date: new Date().toISOString().split('T')[0],
        content: '',
        is_completed: false,
        period: '1',
        evaluation_type: 'none',
        pdf_url: '',
        presentation_url: '',
        video_url: '',
        order_index: nextOrderIndex
      });
    }
    setActiveTab('editor');
  }, [lesson, subjectId, nextOrderIndex, isOpen]);

  const previewHtml = useMemo(() => {
    if (!formData.content || !formData.content.trim()) {
      return '<p class="text-muted-foreground italic">Nenhum conteúdo digitado para pré-visualização...</p>';
    }
    return sanitizeHtml(markdownToHtml(formData.content));
  }, [formData.content]);

  const handleInsertSnippet = (snippet: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${snippet}` : snippet
    }));
  };

  const handleInsertCodeBlock = () => {
    const lang = selectedLanguage || 'html';
    const snippet = `\`\`\`${lang}\n// Digite ou cole seu código ${lang.toUpperCase()} aqui\n\`\`\``;
    handleInsertSnippet(snippet);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor, informe o título da aula.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...formData,
        subject_id: subjectId
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border shadow-2xl">
        {/* Header com visual refinado */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/40 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {lesson ? 'Editar Aula do Cronograma' : 'Nova Aula do Cronograma'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {subjectName ? `${subjectName} • ` : ''}Configure os dados e o conteúdo em Markdown da aula
                </DialogDescription>
              </div>
            </div>
            {lesson && (
              <Badge variant="outline" className="text-xs bg-background">
                ID: {String(lesson.id).slice(0, 8)}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Linha 1: Título e Ordem */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="lesson-title" className="text-sm font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                Título da Aula <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lesson-title"
                placeholder="Ex: Aula 01 - Estrutura Básica do HTML5 e Tags Semânticas"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="bg-background text-base font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-order" className="text-sm font-semibold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                Nº / Ordem
              </Label>
              <Input
                id="lesson-order"
                type="number"
                min={1}
                value={formData.order_index}
                onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) || 1 }))}
                className="bg-background text-center font-bold"
              />
            </div>
          </div>

          {/* Linha 2: Data, Período e Tipo de Avaliação */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-date" className="text-sm font-semibold flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                Data da Aula
              </Label>
              <Input
                id="lesson-date"
                type="date"
                value={formData.lesson_date}
                onChange={(e) => setFormData(prev => ({ ...prev, lesson_date: e.target.value }))}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-period" className="text-sm font-semibold flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-500" />
                Período / Bimestre
              </Label>
              <Select
                value={formData.period || '1'}
                onValueChange={(val) => setFormData(prev => ({ ...prev, period: val }))}
              >
                <SelectTrigger id="lesson-period" className="bg-background">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º Período (1º Bimestre)</SelectItem>
                  <SelectItem value="2">2º Período (2º Bimestre)</SelectItem>
                  <SelectItem value="3">3º Período (3º Bimestre)</SelectItem>
                  <SelectItem value="4">4º Período (4º Bimestre)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-eval" className="text-sm font-semibold flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Cobrança em Avaliação
              </Label>
              <Select
                value={formData.evaluation_type || 'none'}
                onValueChange={(val) => setFormData(prev => ({ ...prev, evaluation_type: val }))}
              >
                <SelectTrigger id="lesson-eval" className="bg-background">
                  <SelectValue placeholder="Tipo de avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (Não cobrada diretamente)</SelectItem>
                  <SelectItem value="parcial">Avaliação Parcial (AV1)</SelectItem>
                  <SelectItem value="global">Avaliação Global (AV2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Switch de Status Realizada */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-0.5">
              <Label htmlFor="lesson-status" className="text-sm font-semibold flex items-center gap-1.5 cursor-pointer">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Status de Realização da Aula
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.is_completed 
                  ? 'Esta aula já foi ministrada e constará como realizada para os estudantes.'
                  : 'Esta aula está agendada ou pendente de realização.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={formData.is_completed ? "default" : "outline"} className={formData.is_completed ? "bg-green-600 hover:bg-green-700" : ""}>
                {formData.is_completed ? "Concluída" : "Pendente / Agendada"}
              </Badge>
              <Switch
                id="lesson-status"
                checked={formData.is_completed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_completed: checked }))}
              />
            </div>
          </div>

          {/* Seção de Recursos Extras (PDF, Apresentação, Vídeo) */}
          <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <Link2 className="w-4 h-4 text-primary" />
                  Recursos Extras & Links Complementares (Opcional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Informe os links diretos para que os alunos possam abrir a apostila em PDF, os slides e a videoaula com um único clique.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Campo 1: PDF */}
              <div className="space-y-1.5 bg-background p-3 rounded-lg border border-red-500/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lesson-pdf" className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Material / PDF
                  </Label>
                  {formData.pdf_url && (
                    <a
                      href={formData.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Testar
                    </a>
                  )}
                </div>
                <Input
                  id="lesson-pdf"
                  placeholder="https://.../apostila.pdf ou Drive"
                  value={formData.pdf_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pdf_url: e.target.value }))}
                  className="h-8 text-xs bg-muted/30 focus-visible:ring-red-500/30"
                />
              </div>

              {/* Campo 2: Apresentação */}
              <div className="space-y-1.5 bg-background p-3 rounded-lg border border-amber-500/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lesson-presentation" className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Presentation className="w-3.5 h-3.5" />
                    Apresentação / Slides
                  </Label>
                  {formData.presentation_url && (
                    <a
                      href={formData.presentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Testar
                    </a>
                  )}
                </div>
                <Input
                  id="lesson-presentation"
                  placeholder="Google Slides, Canva ou PPT"
                  value={formData.presentation_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, presentation_url: e.target.value }))}
                  className="h-8 text-xs bg-muted/30 focus-visible:ring-amber-500/30"
                />
              </div>

              {/* Campo 3: Vídeo */}
              <div className="space-y-1.5 bg-background p-3 rounded-lg border border-purple-500/20 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lesson-video" className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    Videoaula / Vídeo
                  </Label>
                  {formData.video_url && (
                    <a
                      href={formData.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Testar
                    </a>
                  )}
                </div>
                <Input
                  id="lesson-video"
                  placeholder="YouTube, Drive, Vimeo, Loom"
                  value={formData.video_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  className="h-8 text-xs bg-muted/30 focus-visible:ring-purple-500/30"
                />
              </div>
            </div>
          </div>

          {/* Área do Conteúdo da Aula */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-primary" />
                Conteúdo Textual da Aula (Markdown)
              </Label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInsertSnippet(LESSON_TEMPLATE)}
                  className="text-xs h-7 gap-1 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Sparkles className="w-3 h-3" />
                  Inserir Modelo Padrão
                </Button>
              </div>
            </div>

            {/* Abas Editor / Preview */}
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
              <div className="flex items-center justify-between mb-2">
                <TabsList className="grid grid-cols-2 w-56 h-8">
                  <TabsTrigger value="editor" className="text-xs flex items-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="text-xs flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Pré-visualização
                  </TabsTrigger>
                </TabsList>
              </div>

              {activeTab === 'editor' && (
                <div className="p-2.5 bg-muted/40 border rounded-t-lg flex flex-wrap items-center justify-between gap-2 border-b-0">
                  {/* Atalhos Rápidos de Formatação */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertSnippet('## Novo Tópico\nDescrição do tópico aqui...')}
                      title="Título H2"
                      className="h-7 px-2 text-xs font-bold"
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertSnippet('**Texto em Negrito**')}
                      title="Negrito"
                      className="h-7 px-2 text-xs"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertSnippet('*Texto em Itálico*')}
                      title="Itálico"
                      className="h-7 px-2 text-xs"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertSnippet('- Item 1\n- Item 2\n- Item 3')}
                      title="Lista"
                      className="h-7 px-2 text-xs"
                    >
                      <List className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertSnippet('| Coluna 1 | Coluna 2 |\n| --- | --- |\n| Valor A | Valor B |')}
                      title="Tabela"
                      className="h-7 px-2 text-xs"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertSnippet('> **Nota Importante:** Digite aqui sua observação ou aviso.')}
                      title="Citação / Dica"
                      className="h-7 px-2 text-xs"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInsertSnippet('---\n')}
                      title="Linha Divisória"
                      className="h-7 px-2 text-xs font-mono"
                    >
                      ───
                    </Button>
                  </div>

                  {/* Seletor de Linguagem e Inserir Código */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      <Code2 className="w-3.5 h-3.5 text-primary" />
                      Linguagem:
                    </span>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="h-7 text-xs w-[130px] bg-background">
                        <SelectValue placeholder="Linguagem" />
                      </SelectTrigger>
                      <SelectContent>
                        {CODE_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value} className="text-xs">
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleInsertCodeBlock}
                      className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1 px-2.5 shadow-sm"
                    >
                      <Code2 className="w-3 h-3" />
                      + Inserir Código
                    </Button>
                  </div>
                </div>
              )}

              <TabsContent value="editor" className="mt-0 space-y-2">
                <Textarea
                  placeholder="Cole ou digite aqui o conteúdo em Markdown da aula..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="font-mono text-sm min-h-[300px] max-h-[440px] leading-relaxed resize-y bg-background rounded-t-none"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Dica: Você pode colar anotações completas ou usar a barra de ferramentas para inserir códigos formatados com destaque de sintaxe.
                </p>
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div 
                  className="markdown-rendered min-h-[300px] max-h-[440px] overflow-y-auto p-6 border rounded-lg bg-card/60 shadow-inner break-words"
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    const copyBtn = target.closest('button') as HTMLButtonElement | null;
                    if (copyBtn && copyBtn.innerText.includes('Copiar')) {
                      const container = copyBtn.closest('.code-block-container');
                      const codeEl = container?.querySelector('code');
                      if (codeEl) {
                        navigator.clipboard.writeText(codeEl.innerText || '');
                        copyBtn.innerText = '✓ Copiado!';
                        setTimeout(() => {
                          copyBtn.innerText = 'Copiar';
                        }, 2000);
                      }
                    }
                  }}
                  dangerouslySetWarningContent={{ __html: previewHtml }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </form>

        {/* Footer com botões de ação */}
        <DialogFooter className="p-4 px-6 border-t bg-muted/20 flex-shrink-0 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !formData.title.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-w-[120px]"
          >
            {isSaving ? 'Salvando...' : lesson ? 'Salvar Alterações' : 'Criar Aula'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
