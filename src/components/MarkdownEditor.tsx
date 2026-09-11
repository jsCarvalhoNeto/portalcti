import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  Edit3, 
  Columns,
  HelpCircle,
  Code2, 
  List, 
  ListOrdered,
  CheckSquare,
  Bold, 
  Italic, 
  Strikethrough,
  Quote, 
  Table as TableIcon,
  Link2,
  Minus,
  Sparkles,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { markdownToHtml, sanitizeHtml, autoFormatToMarkdown } from '@/utils/markdownUtils';
import { useToast } from '@/hooks/use-toast';

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

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "Cole ou digite aqui a descrição em Markdown...",
  minHeight = "min-h-[220px]",
  maxHeight = "max-h-[380px]",
  className = ""
}: MarkdownEditorProps) {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('html');
  const [activeMode, setActiveMode] = useState<'editor' | 'split' | 'preview'>('editor');

  // Estado para diálogo de inserção de link
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Pré-visualização com sanitização segura
  const previewHtml = useMemo(() => {
    if (!value || !value.trim()) {
      return '<p class="text-muted-foreground italic text-sm">Nenhum conteúdo digitado para pré-visualização...</p>';
    }
    return sanitizeHtml(markdownToHtml(value));
  }, [value]);

  /**
   * Envolve a seleção do usuário ou insere no cursor com prefixo e sufixo
   */
  const applyWrap = (prefix: string, suffix: string, defaultText: string = 'texto') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || '';
    const selectedText = currentVal.substring(start, end);

    const replacement = selectedText 
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultText}${suffix}`;

    const newValue = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultText.length);
      }
    }, 0);
  };

  /**
   * Aplica um prefixo a cada linha da seleção ou linha atual (para títulos, listas, citações)
   */
  const applyLinePrefix = (prefixOrGenerator: string | ((index: number) => string)) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || '';

    // Encontra o início da primeira linha afetada e o fim da última
    const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = currentVal.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = currentVal.length;

    const targetSection = currentVal.substring(lineStart, lineEnd);
    const lines = targetSection.split('\n');

    const formattedLines = lines.map((line, idx) => {
      const p = typeof prefixOrGenerator === 'function' ? prefixOrGenerator(idx + 1) : prefixOrGenerator;
      // Se for string simples e a linha já iniciar com o prefixo, removemos (toggle)
      if (typeof prefixOrGenerator === 'string' && line.startsWith(prefixOrGenerator)) {
        return line.substring(prefixOrGenerator.length);
      }
      return `${p}${line}`;
    });

    const newSection = formattedLines.join('\n');
    const newValue = currentVal.substring(0, lineStart) + newSection + currentVal.substring(lineEnd);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + newSection.length);
    }, 0);
  };

  /**
   * Insere um texto diretamente na posição do cursor
   */
  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value ? `${value}\n\n${textToInsert}` : textToInsert);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = value || '';

    const newValue = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + textToInsert.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  /**
   * Abre modal de inserção de link capturando o texto selecionado se houver
   */
  const handleOpenLinkDialog = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = (value || '').substring(start, end);
      setLinkText(selected || '');
    } else {
      setLinkText('');
    }
    setLinkUrl('');
    setIsLinkDialogOpen(true);
  };

  /**
   * Confirma e insere o link formatado em Markdown [Texto](URL)
   */
  const handleConfirmInsertLink = () => {
    const text = linkText.trim() || 'Link';
    const url = linkUrl.trim() || 'https://';
    const markdownLink = `[${text}](${url})`;

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentVal = value || '';
      const newValue = currentVal.substring(0, start) + markdownLink + currentVal.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + markdownLink.length, start + markdownLink.length);
      }, 0);
    } else {
      insertAtCursor(markdownLink);
    }

    setIsLinkDialogOpen(false);
  };

  /**
   * Insere bloco de código com a linguagem selecionada
   */
  const handleInsertCodeBlock = () => {
    const lang = selectedLanguage || 'html';
    const textarea = textareaRef.current;
    const currentVal = value || '';

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = currentVal.substring(start, end);
      const codeContent = selected || `// Digite seu código ${lang.toUpperCase()} aqui`;
      const snippet = `\`\`\`${lang}\n${codeContent}\n\`\`\`\n`;
      const newValue = currentVal.substring(0, start) + snippet + currentVal.substring(end);
      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + lang.length + 4, start + lang.length + 4 + codeContent.length);
      }, 0);
    } else {
      insertAtCursor(`\`\`\`${lang}\n// Digite seu código ${lang.toUpperCase()} aqui\n\`\`\`\n`);
    }
  };

  /**
   * Insere modelo de tabela Markdown
   */
  const handleInsertTable = () => {
    const tableSnippet = `\n| Etapa / Item | Descrição da Tarefa | Critério de Sucesso |\n| :--- | :--- | :--- |\n| 1. Introdução | Leitura do material de apoio | Compreensão do tema |\n| 2. Execução | Desenvolvimento da prática | Publicação ou entrega |\n| 3. Conclusão | Envio do link ou arquivo | Avaliação docente |\n\n`;
    insertAtCursor(tableSnippet);
  };

  /**
   * Auto-formatação inteligente do conteúdo atual em Markdown estruturado
   */
  const handleAutoFormat = () => {
    if (!value || !value.trim()) {
      toast({
        title: "Aviso",
        description: "Digite ou cole um texto antes de aplicar a formatação automática.",
      });
      return;
    }

    const formatted = autoFormatToMarkdown(value);
    onChange(formatted);
    toast({
      title: "Texto Formatado!",
      description: "Tópicos, passos e listas foram estruturados em Markdown automaticamente.",
    });
  };

  /**
   * Atalhos de teclado comuns (Ctrl+B, Ctrl+I, Ctrl+K, Tab)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        applyWrap('**', '**', 'negrito');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        applyWrap('*', '*', 'itálico');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleOpenLinkDialog();
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ');
    }
  };

  /**
   * Cópia de blocos de código dentro do preview
   */
  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* Diálogo de Inserção de Link */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Link2 className="w-4 h-4 text-primary" />
              Inserir Link em Markdown
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="link_text" className="text-xs">Texto do Link</Label>
              <Input
                id="link_text"
                placeholder="Ex: Acessar Painel WordPress"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
            <div>
              <Label htmlFor="link_url" className="text-xs">Endereço URL</Label>
              <Input
                id="link_url"
                placeholder="https://exemplo.com ou http://localhost"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="text-sm mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsLinkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleConfirmInsertLink}>
              Inserir Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barra de Controles e Modos */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        {/* Modos de visualização */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
          <Button
            type="button"
            variant={activeMode === 'editor' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveMode('editor')}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-none"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editor
          </Button>
          <Button
            type="button"
            variant={activeMode === 'split' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveMode('split')}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-none"
            title="Exibir lado a lado: digitação na esquerda e resultado em tempo real na direita"
          >
            <Columns className="w-3.5 h-3.5" />
            Lado a Lado
          </Button>
          <Button
            type="button"
            variant={activeMode === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveMode('preview')}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 shadow-none"
          >
            <Eye className="w-3.5 h-3.5" />
            Pré-visualização
          </Button>
        </div>

        {/* Botão de Auto-Formatação Mágica */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutoFormat}
          title="Detecta seções como 'Objetivo', 'Passo a passo', tópicos e parágrafos, formatando tudo em Markdown com 1 clique!"
          className="h-7 text-xs gap-1.5 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Auto-formatar Markdown
        </Button>
      </div>

      {/* Barra de Ferramentas Completa de Formatação (ativa quando não em modo apenas preview) */}
      {activeMode !== 'preview' && (
        <div className="p-2 bg-muted/40 border rounded-t-lg flex flex-wrap items-center justify-between gap-2 border-b-0">
          {/* Grupo de Formatação de Texto */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Títulos */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyLinePrefix('# ')}
              title="Título Principal (H1)"
              className="h-7 px-2 text-xs font-bold gap-0.5"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyLinePrefix('## ')}
              title="Subtítulo de Seção (H2)"
              className="h-7 px-2 text-xs font-bold gap-0.5 text-primary"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyLinePrefix('### ')}
              title="Tópico Menor (H3)"
              className="h-7 px-2 text-xs font-bold gap-0.5"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </Button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Estilo em Linha */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyWrap('**', '**', 'negrito')}
              title="Negrito (Ctrl+B)"
              className="h-7 px-2 text-xs"
            >
              <Bold className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyWrap('*', '*', 'itálico')}
              title="Itálico (Ctrl+I)"
              className="h-7 px-2 text-xs"
            >
              <Italic className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyWrap('~~', '~~', 'tachado')}
              title="Tachado"
              className="h-7 px-2 text-xs"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyWrap('`', '`', 'código')}
              title="Código em linha"
              className="h-7 px-2 text-xs font-mono"
            >
              &lt;/&gt;
            </Button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Listas & Citação */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyLinePrefix('- ')}
              title="Lista com Marcadores"
              className="h-7 px-2 text-xs"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyLinePrefix((idx) => `${idx}. `)}
              title="Lista Numerada"
              className="h-7 px-2 text-xs"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyLinePrefix('- [ ] ')}
              title="Lista de Tarefas / Checklist"
              className="h-7 px-2 text-xs"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyLinePrefix('> ')}
              title="Citação / Bloco de Destaque"
              className="h-7 px-2 text-xs"
            >
              <Quote className="w-3.5 h-3.5" />
            </Button>

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Link, Tabela e Linha Divisória */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleOpenLinkDialog}
              title="Inserir Link (Ctrl+K)"
              className="h-7 px-2 text-xs"
            >
              <Link2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleInsertTable}
              title="Inserir Tabela Estruturada"
              className="h-7 px-2 text-xs"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => insertAtCursor('\n---\n\n')}
              title="Linha Divisória Horizontal"
              className="h-7 px-2 text-xs font-mono"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Seletor de Linguagem e Inserir Bloco de Código */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium hidden sm:flex">
              <Code2 className="w-3.5 h-3.5 text-primary" />
              Linguagem:
            </span>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="h-7 text-xs w-[120px] bg-background">
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
              title="Insere bloco de código destacado com a linguagem selecionada"
            >
              <Code2 className="w-3 h-3" />
              + Código
            </Button>
          </div>
        </div>
      )}

      {/* ÁREA PRINCIPAL: CONFORME MODO ESCOLHIDO */}
      {/* 1. MODO EDITOR SIMPLES */}
      {activeMode === 'editor' && (
        <div className="space-y-1.5">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`font-mono text-sm ${minHeight} ${maxHeight} leading-relaxed resize-y bg-background rounded-t-none border-t-0 focus-visible:ring-1`}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <p className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              Selecione qualquer texto e clique nos botões para formatar títulos, negrito, listas ou código. Atalhos: Ctrl+B, Ctrl+I, Ctrl+K.
            </p>
            <span>{value ? value.length : 0} caracteres</span>
          </div>
        </div>
      )}

      {/* 2. MODO DIVIDIDO (LADO A LADO) */}
      {activeMode === 'split' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-b-lg overflow-hidden bg-muted/10 p-2">
            {/* Coluna da esquerda: Editor */}
            <div className="flex flex-col space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Markdown (Edição)
              </span>
              <Textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`font-mono text-sm ${minHeight} ${maxHeight} leading-relaxed resize-y bg-background rounded-md`}
              />
            </div>

            {/* Coluna da direita: Preview em tempo real */}
            <div className="flex flex-col space-y-1">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider px-1 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Como o aluno verá (Tempo Real)
              </span>
              <div 
                className={`markdown-rendered prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed break-words ${minHeight} ${maxHeight} overflow-y-auto p-4 border rounded-md bg-card/70 shadow-inner`}
                onClick={handlePreviewClick}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <p className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              Edite à esquerda e veja a formatação renderizada exatamente como aparecerá para o aluno à direita.
            </p>
            <span>{value ? value.length : 0} caracteres</span>
          </div>
        </div>
      )}

      {/* 3. MODO PRÉ-VISUALIZAÇÃO COMPLETA */}
      {activeMode === 'preview' && (
        <div className="space-y-1.5">
          <div 
            className={`markdown-rendered prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed break-words ${minHeight} ${maxHeight} overflow-y-auto p-6 border rounded-lg bg-card/60 shadow-inner`}
            onClick={handlePreviewClick}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            Esta é a visualização final formatada que o estudante terá acesso ao abrir a atividade.
          </p>
        </div>
      )}
    </div>
  );
}
