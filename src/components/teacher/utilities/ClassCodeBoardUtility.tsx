import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  Sparkles, 
  Terminal, 
  FileCode, 
  Maximize2,
  Minimize2,
  Tv,
  RotateCcw
} from 'lucide-react';

interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  createdAt: number;
}

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript / Node.js', ext: 'js' },
  { id: 'typescript', label: 'TypeScript / React', ext: 'tsx' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'sql', label: 'SQL (Banco de Dados)', ext: 'sql' },
  { id: 'html', label: 'HTML & CSS', ext: 'html' },
  { id: 'bash', label: 'Terminal / Git / Shell', ext: 'sh' },
  { id: 'json', label: 'JSON / Payload API', ext: 'json' },
  { id: 'csharp', label: 'C# / .NET', ext: 'cs' },
];

const INITIAL_SNIPPETS: CodeSnippet[] = [
  {
    id: '1',
    title: 'Comandos Git para a Aula de Hoje',
    language: 'bash',
    code: `# Clonar o repositório da turma\ngit clone https://github.com/cursotecnico/exemplo-aula.git\ncd exemplo-aula\n\n# Instalar pacotes e rodar\nnpm install\nnpm run dev`,
    createdAt: Date.now() - 1000 * 60 * 30
  },
  {
    id: '2',
    title: 'Exemplo: Rota de Consulta em Node.js / Express',
    language: 'javascript',
    code: `import express from 'express';\nconst app = express();\n\napp.get('/api/alunos', (req, res) => {\n  res.json([\n    { id: 1, nome: 'Lucas Silva', curso: 'Técnico em Informática' },\n    { id: 2, nome: 'Mariana Costa', curso: 'Técnico em Informática' }\n  ]);\n});\n\napp.listen(3000, () => console.log('Servidor rodando na porta 3000 🚀'));`,
    createdAt: Date.now() - 1000 * 60 * 15
  }
];

export default function ClassCodeBoardUtility() {
  const [snippets, setSnippets] = useState<CodeSnippet[]>(INITIAL_SNIPPETS);
  const [activeSnippetId, setActiveSnippetId] = useState<string>('1');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [isFullView, setIsFullView] = useState(false);

  // Form para novo snippet
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('javascript');
  const [newCode, setNewCode] = useState('');

  const activeSnippet = snippets.find(s => s.id === activeSnippetId) || snippets[0];

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (snippet: CodeSnippet) => {
    const langObj = LANGUAGES.find(l => l.id === snippet.language);
    const ext = langObj ? langObj.ext : 'txt';
    const blob = new Blob([snippet.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${snippet.title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      language: newLang,
      code: newCode.trim(),
      createdAt: Date.now()
    };

    setSnippets([newSnippet, ...snippets]);
    setActiveSnippetId(newSnippet.id);
    setNewTitle('');
    setNewCode('');
  };

  const handleDeleteSnippet = (id: string) => {
    if (snippets.length <= 1) return;
    const remaining = snippets.filter(s => s.id !== id);
    setSnippets(remaining);
    if (activeSnippetId === id) {
      setActiveSnippetId(remaining[0].id);
    }
  };

  const updateActiveSnippetCode = (code: string) => {
    if (!activeSnippet) return;
    setSnippets(snippets.map(s => s.id === activeSnippet.id ? { ...s, code } : s));
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-xs';
      case 'base': return 'text-sm';
      case 'lg': return 'text-base';
      case 'xl': return 'text-lg leading-relaxed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo do Utilitário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Quadro de Código & Comandos da Aula
              <Badge variant="outline" className="text-xs bg-muted">
                {snippets.length} snippet(s)
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Compartilhe comandos do Git, rotas, queries e códigos de exemplo projetados para a turma
            </p>
          </div>
        </div>

        {/* Controles de Tamanho de Fonte para Projetor */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Tv className="w-3.5 h-3.5" /> Fonte Projetor:
          </span>
          <div className="flex items-center border rounded-lg overflow-hidden bg-muted/30">
            {(['sm', 'base', 'lg', 'xl'] as const).map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
                  fontSize === size ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel do Código Ativo (2 Colunas) */}
        {activeSnippet && (
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-sm">{activeSnippet.title}</h4>
                <Badge variant="outline" className="text-[11px] uppercase font-mono">
                  {activeSnippet.language}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  onClick={() => handleCopy(activeSnippet.code, activeSnippet.id)}
                >
                  {copiedId === activeSnippet.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === activeSnippet.id ? 'Copiado!' : 'Copiar Código'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleDownload(activeSnippet)}
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar Arquivo
                </Button>

                {snippets.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                    onClick={() => handleDeleteSnippet(activeSnippet.id)}
                    title="Excluir Snippet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Editor / Visualizador Monospace */}
            <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
              {/* Barra superior de terminal */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2">{activeSnippet.title}</span>
                </div>
                <span>{activeSnippet.code.split('\n').length} linhas</span>
              </div>

              <Textarea
                value={activeSnippet.code}
                onChange={(e) => updateActiveSnippetCode(e.target.value)}
                className={`w-full font-mono bg-transparent text-slate-100 p-4 leading-relaxed border-0 focus-visible:ring-0 resize-y min-h-[300px] ${getFontSizeClass()}`}
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Coluna Direita: Snippets Salvos & Adicionar Novo */}
        <div className="space-y-4">
          {/* Lista de Snippets da Sessão */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Snippets da Sessão</span>
                <span className="text-xs text-muted-foreground font-normal">Clique para alternar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {snippets.map(s => (
                <div
                  key={s.id}
                  onClick={() => setActiveSnippetId(s.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    activeSnippetId === s.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 font-semibold text-indigo-700 dark:text-indigo-300'
                      : 'bg-muted/30 border-border/60 hover:bg-muted/60 text-muted-foreground'
                  }`}
                >
                  <div className="truncate mr-2">
                    <p className="truncate font-medium">{s.title}</p>
                    <span className="text-[10px] uppercase font-mono opacity-70">{s.language}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(s.code, s.id);
                    }}
                    title="Copiar"
                  >
                    {copiedId === s.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Form Novo Snippet */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-500" />
                Novo Bloco de Código
              </CardTitle>
              <CardDescription className="text-xs">Insira um trecho para exibir na tela</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSnippet} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Título do Código</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Query SQL de Junção JOIN"
                    className="mt-1 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Linguagem / Tipo</label>
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    className="w-full h-8 mt-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {LANGUAGES.map(l => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Código / Comandos</label>
                  <Textarea
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Cole ou digite o código aqui..."
                    className="mt-1 font-mono text-xs min-h-[100px]"
                    required
                  />
                </div>

                <Button type="submit" size="sm" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Salvar Snippet no Quadro
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
