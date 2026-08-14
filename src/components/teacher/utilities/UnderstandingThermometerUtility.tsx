import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Smile, 
  Meh, 
  Frown, 
  RotateCcw, 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  BarChart2,
  Tv
} from 'lucide-react';

export default function UnderstandingThermometerUtility() {
  const [topic, setTopic] = useState('Conceito de Chaves Estrangeiras & JOINs no SQL');
  const [votes, setVotes] = useState({
    understood: 18,
    doubts: 7,
    lost: 2
  });

  const totalVotes = votes.understood + votes.doubts + votes.lost;

  const percentUnderstood = totalVotes > 0 ? Math.round((votes.understood / totalVotes) * 100) : 0;
  const percentDoubts = totalVotes > 0 ? Math.round((votes.doubts / totalVotes) * 100) : 0;
  const percentLost = totalVotes > 0 ? Math.round((votes.lost / totalVotes) * 100) : 0;

  const handleVote = (type: 'understood' | 'doubts' | 'lost') => {
    setVotes(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const handleReset = () => {
    setVotes({ understood: 0, doubts: 0, lost: 0 });
  };

  const getPedagogicalAdvice = () => {
    if (totalVotes === 0) {
      return {
        badge: 'Aguardando Votos',
        color: 'bg-muted text-muted-foreground',
        advice: 'Lance a pergunta para a turma e registre as reações dos alunos.'
      };
    }
    if (percentUnderstood >= 75) {
      return {
        badge: '🟢 Excelente Assimilação (>75%)',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        advice: 'A grande maioria compreendeu o conteúdo! Você pode avançar com segurança para os exercícios práticos e desafios mais avançados.'
      };
    }
    if (percentUnderstood >= 50) {
      return {
        badge: '🟡 Assimilação Moderada (50% a 74%)',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        advice: 'Boa parte da turma entendeu, mas há dúvidas pontuais. Recomendado fazer mais um exemplo prático passo a passo no projetor antes da atividade individual.'
      };
    }
    return {
      badge: '🔴 Atenção: Alto Índice de Dúvidas (<50%)',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      advice: 'Mais da metade da turma está com dificuldades. É recomendado revisar o conceito central usando uma analogia diferente antes de prosseguir.'
    };
  };

  const advice = getPedagogicalAdvice();

  return (
    <div className="space-y-6">
      {/* Topo / Pergunta da Aula */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Badge className="bg-indigo-500 text-white gap-1 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Termômetro de Compreensão em Tempo Real
          </Badge>
          <div>
            <span className="text-xs text-indigo-300">Tópico ou Pergunta Avaliada:</span>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 bg-white/10 border-white/20 text-white font-semibold text-base sm:text-lg focus-visible:ring-indigo-400"
              placeholder="Ex: Ficou claro como funcionam os Componentes no React?"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Zerar Votação
          </Button>
        </div>
      </div>

      {/* Grid de Opções de Voto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Opção 1: Entendi perfeitamente */}
        <Card 
          onClick={() => handleVote('understood')}
          className="border-2 border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between"
        >
          <CardHeader className="pb-2 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <Smile className="w-8 h-8" />
            </div>
            <CardTitle className="text-base text-emerald-700 dark:text-emerald-300">Entendi Tudo</CardTitle>
            <CardDescription className="text-xs">Dominei o conceito e posso avançar</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-0 space-y-3">
            <div className="text-4xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {votes.understood} <span className="text-sm font-normal text-muted-foreground">votos</span>
            </div>
            <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1">
              +1 Voto (Entendido)
            </Button>
          </CardContent>
        </Card>

        {/* Opção 2: Tenho dúvidas */}
        <Card 
          onClick={() => handleVote('doubts')}
          className="border-2 border-amber-500/40 hover:border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between"
        >
          <CardHeader className="pb-2 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <Meh className="w-8 h-8" />
            </div>
            <CardTitle className="text-base text-amber-700 dark:text-amber-300">Tenho Dúvidas</CardTitle>
            <CardDescription className="text-xs">Mais ou menos, preciso de mais 1 exemplo</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-0 space-y-3">
            <div className="text-4xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {votes.doubts} <span className="text-sm font-normal text-muted-foreground">votos</span>
            </div>
            <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs gap-1">
              +1 Voto (Dúvida)
            </Button>
          </CardContent>
        </Card>

        {/* Opção 3: Estou perdido */}
        <Card 
          onClick={() => handleVote('lost')}
          className="border-2 border-rose-500/40 hover:border-rose-500 bg-rose-50/30 dark:bg-rose-950/20 cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between"
        >
          <CardHeader className="pb-2 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
              <Frown className="w-8 h-8" />
            </div>
            <CardTitle className="text-base text-rose-700 dark:text-rose-300">Estou Perdido</CardTitle>
            <CardDescription className="text-xs">Não entendi e preciso de revisão</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-0 space-y-3">
            <div className="text-4xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {votes.lost} <span className="text-sm font-normal text-muted-foreground">votos</span>
            </div>
            <Button size="sm" className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs gap-1">
              +1 Voto (Perdido)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultados e Análise Pedagógica */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Barra Visual Proporcional */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" />
                Distribuição das Respostas da Turma ({totalVotes} alunos)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barra empilhada */}
            <div className="w-full h-8 rounded-xl overflow-hidden flex bg-muted border p-1 gap-1">
              {percentUnderstood > 0 && (
                <div 
                  className="bg-emerald-500 rounded-lg h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                  style={{ width: `${percentUnderstood}%` }}
                  title={`Entendido: ${percentUnderstood}%`}
                >
                  {percentUnderstood}%
                </div>
              )}
              {percentDoubts > 0 && (
                <div 
                  className="bg-amber-500 rounded-lg h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                  style={{ width: `${percentDoubts}%` }}
                  title={`Com dúvidas: ${percentDoubts}%`}
                >
                  {percentDoubts}%
                </div>
              )}
              {percentLost > 0 && (
                <div 
                  className="bg-rose-500 rounded-lg h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500"
                  style={{ width: `${percentLost}%` }}
                  title={`Perdidos: ${percentLost}%`}
                >
                  {percentLost}%
                </div>
              )}
            </div>

            {/* Legenda */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                <span className="font-bold">{percentUnderstood}%</span> Entendido
              </div>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300">
                <span className="font-bold">{percentDoubts}%</span> Com Dúvidas
              </div>
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300">
                <span className="font-bold">{percentLost}%</span> Dificuldade Alta
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recomendação Pedagógica */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Recomendação da Aula
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant="outline" className={`py-1 px-2.5 text-xs font-semibold ${advice.color}`}>
              {advice.badge}
            </Badge>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {advice.advice}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
