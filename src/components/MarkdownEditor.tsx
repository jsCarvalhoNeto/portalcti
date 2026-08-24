import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Eye, 
  Edit3, 
  HelpCircle,
  Code2,
  List,
  Bold,
  Italic,
  Quote,
  Table as TableIcon
} from 'lucide-react';
import { markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';

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
  const [selectedLanguage, setSelectedLanguage] = useState('html');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const previewHtml = useMemo(() => {
    if (!value || !value.trim()) {
      return '<p class="text-muted-foreground italic text-sm">Nenhum conteúdo digitado para pré-visualização...</p>';
    }
    return sanitizeHtml(markdownToHtml(value));
  }, [value]);

  const handleInsertSnippet = (snippet: string) => {
    onChange(value ? `${value}\n\n${snippet}` : snippet);
  };

  const handleInsertCodeBlock = () => {
    const lang = selectedLanguage || 'html';
    const snippet = `\`\`\`${lang}\n// Digite ou cole seu código ${lang.toUpperCase()} aqui\n\`\`\``;
    handleInsertSnippet(snippet);
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
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
          <div className="p-2 bg-muted/40 border rounded-t-lg flex flex-wrap items-center justify-between gap-2 border-b-0">
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
              >
                <Code2 className="w-3 h-3" />
                + Inserir Código
              </Button>
            </div>
          </div>
        )}

        <TabsContent value="editor" className="mt-0 space-y-1.5">
          <Textarea
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`font-mono text-sm ${minHeight} ${maxHeight} leading-relaxed resize-y bg-background rounded-t-none`}
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Suporta formatação Markdown completa (títulos, negrito, listas, tabelas e blocos de código com destaque).
          </p>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div 
            className={`markdown-rendered prose prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed break-words ${minHeight} ${maxHeight} overflow-y-auto p-6 border rounded-lg bg-card/60 shadow-inner`}
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
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
