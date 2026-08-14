import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Braces, 
  Database, 
  Sparkles, 
  Minimize2, 
  RotateCcw,
  Layers
} from 'lucide-react';

export default function CodeFormatterValidatorUtility() {
  const [mode, setMode] = useState<'json' | 'sql'>('json');
  const [inputCode, setInputCode] = useState<string>(
    '{\n  "curso": "Técnico em Informática",\n  "modulo": 2,\n  "disciplinas": ["Banco de Dados", "Programação Web", "Redes"],\n  "alunos_matriculados": 35,\n  "ativo": true\n}'
  );
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'idle'; message: string }>({
    type: 'success',
    message: 'JSON Válido e bem estruturado!'
  });
  const [copied, setCopied] = useState(false);

  const handleValidateAndFormatJSON = (spaces: number = 2) => {
    try {
      if (!inputCode.trim()) {
        setStatusMessage({ type: 'idle', message: 'Cole um código para validar.' });
        return;
      }
      const parsed = JSON.parse(inputCode);
      const formatted = JSON.stringify(parsed, null, spaces);
      setInputCode(formatted);
      setStatusMessage({ type: 'success', message: 'JSON Válido e formatado com sucesso! ✅' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', message: `Erro de Sintaxe no JSON: ${err.message}` });
    }
  };

  const handleMinifyJSON = () => {
    try {
      const parsed = JSON.parse(inputCode);
      const minified = JSON.stringify(parsed);
      setInputCode(minified);
      setStatusMessage({ type: 'success', message: 'JSON Minificado (1 linha compacta) ✅' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', message: `Não foi possível minificar. Erro no JSON: ${err.message}` });
    }
  };

  const handleFormatSQL = () => {
    if (!inputCode.trim()) return;
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'INSERT INTO', 'VALUES',
      'UPDATE', 'SET', 'DELETE', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
      'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'PRIMARY KEY', 'FOREIGN KEY'
    ];

    let formatted = inputCode;
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw.toUpperCase());
    });

    setInputCode(formatted);
    setStatusMessage({ type: 'success', message: 'Palavras-chave SQL formatadas em MAIÚSCULO! ✅' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputCode('');
    setStatusMessage({ type: 'idle', message: 'Área limpa.' });
  };

  const loadExample = (type: 'json' | 'sql') => {
    setMode(type);
    if (type === 'json') {
      setInputCode(
        '{\n  "escola": "Portal CTI",\n  "turma": "INFO-2026",\n  "laboratorio": "Lab 02",\n  "professores": [\n    {"nome": "Prof. Santos", "materia": "Desenvolvimento Web"}\n  ]\n}'
      );
      setStatusMessage({ type: 'success', message: 'Exemplo JSON carregado.' });
    } else {
      setInputCode(
        'select a.id, a.nome, a.email, d.nome as disciplina\nfrom alunos a\ninner join matriculas m on a.id = m.aluno_id\ninner join disciplinas d on m.disciplina_id = d.id\nwhere a.ativo = true\norder by a.nome asc;'
      );
      setStatusMessage({ type: 'success', message: 'Exemplo SQL carregado.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            <Braces className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Formatador & Validador de Código (JSON / SQL)
            </h3>
            <p className="text-xs text-muted-foreground">
              Valide e embeleze sintaxes de JSON de APIs e queries SQL para seus alunos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={mode === 'json' ? 'default' : 'outline'}
            className="h-8 text-xs gap-1.5"
            onClick={() => loadExample('json')}
          >
            <Braces className="w-3.5 h-3.5" />
            Modo JSON
          </Button>
          <Button
            size="sm"
            variant={mode === 'sql' ? 'default' : 'outline'}
            className="h-8 text-xs gap-1.5"
            onClick={() => loadExample('sql')}
          >
            <Database className="w-3.5 h-3.5" />
            Modo SQL
          </Button>
        </div>
      </div>

      {/* Editor e Ações */}
      <div className="space-y-4">
        {/* Barra de Ferramentas de Formatação */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {mode === 'json' ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleValidateAndFormatJSON(2)}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Formatar / Prettify (2 Espaços)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => handleValidateAndFormatJSON(4)}
                >
                  4 Espaços
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleMinifyJSON}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  Minificar (1 linha)
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs gap-1.5"
                onClick={handleFormatSQL}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                Formatar Palavras-Chave SQL
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs gap-1 text-muted-foreground"
              onClick={handleClear}
            >
              <RotateCcw className="w-3 h-3" />
              Limpar
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>

        {/* Caixa de Texto / Editor */}
        <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <span>Editor {mode.toUpperCase()}</span>
            <span>{inputCode.split('\n').length} linhas | {inputCode.length} caracteres</span>
          </div>
          <Textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder={`Cole seu código ${mode.toUpperCase()} aqui...`}
            className="w-full font-mono text-xs bg-transparent text-slate-100 p-4 leading-relaxed border-0 focus-visible:ring-0 resize-y min-h-[300px]"
            spellCheck={false}
          />
        </div>

        {/* Mensagem de Status e Validação */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              : 'bg-muted/40 border-border text-muted-foreground'
        }`}>
          {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {statusMessage.type === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
          <span className="font-medium">{statusMessage.message}</span>
        </div>
      </div>
    </div>
  );
}
