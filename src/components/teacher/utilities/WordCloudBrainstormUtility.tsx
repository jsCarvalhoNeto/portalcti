import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  TrendingUp, 
  MessageSquare
} from 'lucide-react';

interface WordItem {
  id: string;
  text: string;
  count: number;
}

const INITIAL_WORDS: WordItem[] = [
  { id: '1', text: 'Inovação', count: 14 },
  { id: '2', text: 'Inteligência Artificial', count: 12 },
  { id: '3', text: 'Código Limpo', count: 9 },
  { id: '4', text: 'Banco de Dados', count: 8 },
  { id: '5', text: 'React', count: 7 },
  { id: '6', text: 'Node.js', count: 6 },
  { id: '7', text: 'APIs REST', count: 5 },
  { id: '8', text: 'Git & GitHub', count: 5 },
  { id: '9', text: 'Segurança', count: 4 },
  { id: '10', text: 'Cloud', count: 3 },
  { id: '11', text: 'Trabalho em Equipe', count: 6 },
  { id: '12', text: 'Resolução de Problemas', count: 8 }
];

const COLORS = [
  'text-indigo-600 dark:text-indigo-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-rose-600 dark:text-rose-400',
  'text-amber-600 dark:text-amber-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-purple-600 dark:text-purple-400',
  'text-pink-600 dark:text-pink-400'
];

export default function WordCloudBrainstormUtility() {
  const [topic, setTopic] = useState('Quais tecnologias e habilidades mais definem o futuro da Informática?');
  const [words, setWords] = useState<WordItem[]>(INITIAL_WORDS);
  const [newWord, setNewWord] = useState('');
  const [copied, setCopied] = useState(false);

  const totalResponses = words.reduce((acc, curr) => acc + curr.count, 0);
  const maxCount = Math.max(...words.map(w => w.count), 1);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newWord.trim();
    if (!clean) return;

    const existingIdx = words.findIndex(w => w.text.toLowerCase() === clean.toLowerCase());
    if (existingIdx !== -1) {
      const updated = [...words];
      updated[existingIdx].count += 1;
      setWords(updated);
    } else {
      setWords([...words, { id: Date.now().toString(), text: clean, count: 1 }]);
    }
    setNewWord('');
  };

  const handleIncrement = (id: string) => {
    setWords(words.map(w => w.id === id ? { ...w, count: w.count + 1 } : w));
  };

  const handleReset = () => {
    if (confirm('Deseja limpar todas as palavras da nuvem?')) {
      setWords([]);
    }
  };

  const handleCopySummary = () => {
    const sorted = [...words].sort((a, b) => b.count - a.count);
    const text = `Nuvem de Palavras: "${topic}"\n\n` + sorted.map(w => `• ${w.text}: ${w.count} menções`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Topo do Brainstorming */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500 text-white gap-1">
              <Cloud className="w-3.5 h-3.5" />
              Nuvem de Palavras Coletiva
            </Badge>
            <span className="text-xs text-purple-200">{totalResponses} respostas computadas</span>
          </div>
          <div>
            <span className="text-xs text-purple-300">Tema ou Pergunta do Brainstorm:</span>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 bg-white/10 border-white/20 text-white font-semibold text-base focus-visible:ring-purple-400"
              placeholder="Ex: Em uma palavra, qual foi o maior aprendizado da aula de hoje?"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleCopySummary}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Resumo'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Grid Principal: Nuvem + Inserção de Palavras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A Nuvem Visual (2 Colunas) */}
        <Card className="lg:col-span-2 border-2 border-border/80 shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Nuvem de Ideias da Turma
            </CardTitle>
            <span className="text-xs text-muted-foreground">Tamanho proporcional à frequência</span>
          </CardHeader>
          <CardContent>
            {words.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground space-y-2">
                <Cloud className="w-12 h-12 mx-auto opacity-40 text-purple-500" />
                <p className="font-semibold text-foreground">A nuvem está vazia</p>
                <p className="text-xs">Adicione a primeira palavra no painel ao lado para começar!</p>
              </div>
            ) : (
              <div className="min-h-[320px] p-8 rounded-2xl bg-gradient-to-br from-card to-muted/40 border border-border/60 flex flex-wrap items-center justify-center gap-4 sm:gap-6 select-none">
                {words.map((item, index) => {
                  const ratio = item.count / maxCount;
                  let sizeClass = 'text-xs font-medium';
                  if (ratio > 0.8) sizeClass = 'text-3xl sm:text-4xl font-extrabold tracking-tight';
                  else if (ratio > 0.5) sizeClass = 'text-2xl sm:text-3xl font-bold';
                  else if (ratio > 0.3) sizeClass = 'text-lg sm:text-xl font-semibold';
                  else sizeClass = 'text-sm font-medium';

                  const colorClass = COLORS[index % COLORS.length];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleIncrement(item.id)}
                      className={`transition-all duration-200 hover:scale-125 cursor-pointer flex items-center gap-1.5 ${sizeClass} ${colorClass}`}
                      title={`Clique para adicionar +1 voto (${item.count} votos)`}
                    >
                      <span>{item.text}</span>
                      <span className="text-[10px] font-mono opacity-50 font-normal">({item.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna Direita: Inserir Palavra & Ranking */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-500" />
                Adicionar Palavra
              </CardTitle>
              <CardDescription>Insira uma contribuição de aluno</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddWord} className="space-y-3">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Ex: Lógica de Programação"
                  className="text-sm"
                  required
                />
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-1.5">
                  <Plus className="w-4 h-4" />
                  Enviar para a Nuvem
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Ranking dos Mais Citados */}
          {words.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                  Termos Mais Votados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {[...words]
                  .sort((a, b) => b.count - a.count)
                  .map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 font-bold font-mono text-muted-foreground">{i + 1}º</span>
                        <span className="truncate font-medium">{item.text}</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs ml-2 shrink-0">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
