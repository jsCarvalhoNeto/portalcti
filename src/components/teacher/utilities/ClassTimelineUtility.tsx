import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  Play, 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  RotateCcw,
  Coffee,
  Code2,
  Tv
} from 'lucide-react';

interface AgendaItem {
  id: string;
  title: string;
  durationMinutes: number;
  type: 'intro' | 'theory' | 'practice' | 'break' | 'review';
  completed: boolean;
}

const DEFAULT_ITEMS: AgendaItem[] = [
  { id: '1', title: 'Abertura, Chamada & Recados Iniciais', durationMinutes: 15, type: 'intro', completed: false },
  { id: '2', title: 'Explicação: Criando APIs com Node.js & Express', durationMinutes: 40, type: 'theory', completed: false },
  { id: '3', title: 'Desafio Prático em Duplas no Laboratório', durationMinutes: 50, type: 'practice', completed: false },
  { id: '4', title: 'Intervalo / Café', durationMinutes: 15, type: 'break', completed: false },
  { id: '5', title: 'Code Review Coletivo & Dúvidas Finais', durationMinutes: 30, type: 'review', completed: false },
];

export default function ClassTimelineUtility() {
  const [items, setItems] = useState<AgendaItem[]>(DEFAULT_ITEMS);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDuration, setNewItemDuration] = useState('20');
  const [newItemType, setNewItemType] = useState<AgendaItem['type']>('practice');

  const totalMinutes = items.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const completedMinutes = items
    .filter(i => i.completed)
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);

  const progressPercent = totalMinutes > 0 ? (completedMinutes / totalMinutes) * 100 : 0;

  const toggleComplete = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const mins = parseInt(newItemDuration) || 15;
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        title: newItemTitle.trim(),
        durationMinutes: mins,
        type: newItemType,
        completed: false
      }
    ]);
    setNewItemTitle('');
    setNewItemDuration('20');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const resetAll = () => {
    setItems(items.map(i => ({ ...i, completed: false })));
    setCurrentStepIndex(0);
  };

  const advanceNextStep = () => {
    if (currentStepIndex < items.length) {
      const currentId = items[currentStepIndex].id;
      setItems(items.map(item => item.id === currentId ? { ...item, completed: true } : item));
      setCurrentStepIndex(prev => Math.min(items.length - 1, prev + 1));
    }
  };

  const getTypeBadge = (type: AgendaItem['type']) => {
    switch (type) {
      case 'intro':
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 text-xs">Introdução</Badge>;
      case 'theory':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">Teoria</Badge>;
      case 'practice':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">Prática / Lab</Badge>;
      case 'break':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">Intervalo</Badge>;
      case 'review':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-xs">Revisão</Badge>;
    }
  };

  const formatHoursMinutes = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} min`;
    return `${h}h ${m > 0 ? `${m}min` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Resumo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-500 text-white flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              Roteiro de Aula
            </Badge>
            <span className="text-xs text-indigo-200">
              Duração Total: {formatHoursMinutes(totalMinutes)}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Cronograma de Aulas e Atividades</h2>
          <p className="text-xs text-slate-300">
            Acompanhe o andamento de cada bloco de conteúdo para manter o ritmo ideal da aula.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-md"
            onClick={advanceNextStep}
            disabled={items.every(i => i.completed)}
          >
            <CheckCircle2 className="w-4 h-4" />
            Concluir Bloco Atual
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 text-xs gap-1"
            onClick={resetAll}
          >
            <RotateCcw className="w-3 h-3" />
            Resetar
          </Button>
        </div>
      </div>

      {/* Barra de Progresso Global */}
      <Card className="border-border/60">
        <CardContent className="pt-6 pb-5 space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
            <span>Progresso da Aula: <strong>{Math.round(progressPercent)}%</strong> concluído</span>
            <span>{formatHoursMinutes(completedMinutes)} de {formatHoursMinutes(totalMinutes)}</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista da Agenda */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Blocos Planejados ({items.length})
            </h3>
            <span className="text-xs text-muted-foreground">Clique no item para marcar como concluído</span>
          </div>

          <div className="space-y-2.5">
            {items.map((item, index) => {
              const isCurrent = !item.completed && items.slice(0, index).every(i => i.completed);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleComplete(item.id)}
                  className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                    item.completed
                      ? 'bg-muted/40 border-border/40 opacity-60'
                      : isCurrent
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-card border-border/70 hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        item.completed 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : isCurrent
                            ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
                            : 'border-muted-foreground/30 text-transparent'
                      }`}
                    >
                      {item.completed ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                    </button>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.title}
                        </span>
                        {isCurrent && (
                          <Badge className="bg-indigo-500 text-white text-[10px] py-0 h-4">
                            Em Andamento
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(item.type)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.durationMinutes} minutos
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Adicionar Novo Bloco */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                Adicionar Etapa
              </CardTitle>
              <CardDescription>Insira uma nova atividade ao roteiro</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={addItem} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Título do Bloco</label>
                  <Input
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="Ex: Apresentação dos Grupos"
                    className="mt-1 text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Duração (min)</label>
                    <Input
                      type="number"
                      min="1"
                      max="300"
                      value={newItemDuration}
                      onChange={(e) => setNewItemDuration(e.target.value)}
                      className="mt-1 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <select
                      value={newItemType}
                      onChange={(e) => setNewItemType(e.target.value as any)}
                      className="w-full h-9 mt-1 rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="practice">Prática / Lab</option>
                      <option value="theory">Teoria</option>
                      <option value="intro">Introdução</option>
                      <option value="break">Intervalo</option>
                      <option value="review">Revisão</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 mt-2">
                  <Plus className="w-4 h-4" />
                  Inserir no Roteiro
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
