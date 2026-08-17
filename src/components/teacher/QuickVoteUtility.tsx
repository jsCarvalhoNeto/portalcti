import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Star, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink, 
  RefreshCw, 
  Tv, 
  Radio, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Lock, 
  Unlock, 
  Users, 
  Award,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface VoteRecord {
  voterId: string;
  voterName: string;
  score: number;
  timestamp: number;
}

const SCORES = Array.from({ length: 11 }, (_, i) => i); // 0 a 10

const getScoreBarColor = (score: number) => {
  if (score <= 3) return 'from-rose-600 to-red-500';
  if (score <= 6) return 'from-amber-600 to-orange-500';
  return 'from-emerald-600 to-teal-500';
};

const getScoreTextColor = (score: number) => {
  if (score <= 3) return 'text-rose-600 dark:text-rose-400';
  if (score <= 6) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
};

export default function QuickVoteUtility() {
  const [title, setTitle] = useState('Avaliação do Nível de Aprendizado na Aula Prática de Hoje');
  const [subjectName, setSubjectName] = useState('Informática - 2º Ano');
  const [distribution, setDistribution] = useState<number[]>([0, 0, 0, 0, 1, 2, 4, 8, 12, 10, 6]); // Scores 0..10
  const [isVoteActive, setIsVoteActive] = useState(true);
  const [voterHistory, setVoterHistory] = useState<VoteRecord[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [newSubjectInput, setNewSubjectInput] = useState('');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // PIN da Sessão (6 dígitos)
  const [sessionPin, setSessionPin] = useState(() => {
    const saved = sessionStorage.getItem('quickvote_session_pin');
    if (saved) return saved;
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('quickvote_session_pin', newPin);
    return newPin;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const totalVotes = useMemo(() => distribution.reduce((acc, curr) => acc + curr, 0), [distribution]);

  const averageScore = useMemo(() => {
    if (totalVotes === 0) return 0;
    const weightedSum = distribution.reduce((acc, count, score) => acc + score * count, 0);
    return Number((weightedSum / totalVotes).toFixed(1));
  }, [distribution, totalVotes]);

  const voteUrl = `${window.location.origin}/votar/${sessionPin}`;

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  };

  const broadcastVoteState = (state: { title: string; subjectName: string; isActive: boolean; average: number; totalVotes: number }) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'vote_state',
        payload: state
      }).catch(() => {});
    }
  };

  // Inscrição Realtime no canal da Votação
  useEffect(() => {
    if (!sessionPin) return;

    const channelName = `quickvote_${sessionPin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'submit_vote' }, (event) => {
        const payload = event?.payload;
        if (payload && typeof payload.score === 'number') {
          const score = payload.score;
          if (score < 0 || score > 10) return;

          setDistribution(prev => {
            const next = [...prev];
            // Se já tinha votado antes, subtrai a nota antiga
            if (typeof payload.previousScore === 'number' && payload.previousScore >= 0 && payload.previousScore <= 10) {
              next[payload.previousScore] = Math.max(0, next[payload.previousScore] - 1);
            }
            next[score] = (next[score] || 0) + 1;

            const nextTotal = next.reduce((a, b) => a + b, 0);
            const nextAvg = nextTotal > 0 ? Number((next.reduce((a, b, idx) => a + b * idx, 0) / nextTotal).toFixed(1)) : 0;

            setTimeout(() => {
              broadcastVoteState({
                title,
                subjectName,
                isActive: isVoteActive,
                average: nextAvg,
                totalVotes: nextTotal
              });
            }, 50);

            return next;
          });

          if (payload.voterName) {
            setVoterHistory(prev => [
              {
                voterId: payload.voterId || '',
                voterName: payload.voterName,
                score,
                timestamp: Date.now()
              },
              ...prev.filter(v => v.voterId !== payload.voterId)
            ]);
          }

          playChime();
          toast.info(`⭐ Nota ${score} recebida ao vivo! (${payload.voterName || 'Aluno'})`, {
            duration: 2500
          });
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        channel.send({
          type: 'broadcast',
          event: 'vote_state',
          payload: {
            title,
            subjectName,
            isActive: isVoteActive,
            average: averageScore,
            totalVotes
          }
        }).catch(() => {});
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionPin, title, subjectName, isVoteActive, averageScore, totalVotes]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleActive = () => {
    const nextActive = !isVoteActive;
    setIsVoteActive(nextActive);
    broadcastVoteState({
      title,
      subjectName,
      isActive: nextActive,
      average: averageScore,
      totalVotes
    });
    toast.success(nextActive ? 'Votação reaberta para os alunos!' : 'Votação encerrada/bloqueada!');
  };

  const handleResetVotes = () => {
    if (confirm('Deseja zerar todas as notas desta votação?')) {
      const resetDist = Array(11).fill(0);
      setDistribution(resetDist);
      setVoterHistory([]);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'vote_reset',
          payload: {
            title,
            subjectName,
            isActive: isVoteActive,
            average: 0,
            totalVotes: 0
          }
        }).catch(() => {});
      }
      toast.success('Votos zerados para uma nova rodada!');
    }
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleInput.trim()) {
      toast.error('Informe o título da avaliação!');
      return;
    }

    setTitle(newTitleInput.trim());
    setSubjectName(newSubjectInput.trim() || 'Turma');
    setDistribution(Array(11).fill(0));
    setIsVoteActive(true);
    setVoterHistory([]);
    setIsCreatingNew(false);
    setNewTitleInput('');
    setNewSubjectInput('');

    broadcastVoteState({
      title: newTitleInput.trim(),
      subjectName: newSubjectInput.trim() || 'Turma',
      isActive: true,
      average: 0,
      totalVotes: 0
    });
    toast.success('Nova votação rápida criada e aberta ao vivo!');
  };

  const handleGenerateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('quickvote_session_pin', newPin);
    setSessionPin(newPin);
    setDistribution(Array(11).fill(0));
    setVoterHistory([]);
    toast.success(`Nova sala criada: PIN ${newPin}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopied(true);
      toast.success('Link de votação copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const maxVotesInSingleScore = Math.max(...distribution, 1);

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-8 bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between' : ''}`} ref={containerRef}>
      {/* Top Banner Controls */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-700 via-orange-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-500 text-slate-950 gap-1 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              Votação Rápida (Notas de 0 a 10)
            </Badge>

            {isConnected ? (
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/20 text-emerald-300 text-xs gap-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sala Online (PIN: {sessionPin})
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-400/40 bg-amber-500/20 text-amber-300 text-xs gap-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Conectando Supabase...
              </Badge>
            )}

            <Badge variant="outline" className="border-white/20 text-amber-200 bg-white/5 text-xs gap-1">
              <Users className="w-3 h-3 text-amber-300" />
              {totalVotes} avaliações
            </Badge>

            {isVoteActive ? (
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                Aberta
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                Encerrada
              </Badge>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-amber-200">
              {subjectName} • Os alunos escolhem uma nota de 0 a 10 pelo celular via QR Code.
            </p>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Button
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 text-xs gap-1.5 font-bold"
          >
            <QrCode className="w-4 h-4" />
            Projetar QR Code
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5 font-medium"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Sair Tela Cheia' : 'Projetar em Tela Cheia'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={() => setIsCreatingNew(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Votação
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleToggleActive}
          >
            {isVoteActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isVoteActive ? 'Encerrar' : 'Reabrir'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleResetVotes}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Zerar Votos
          </Button>
        </div>
      </div>

      {/* Banner de Acesso Rápido para Sala de Aula */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-300 font-medium">
              Os alunos votam acessando o link ou digitando o PIN:
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
                PIN: {sessionPin}
              </span>
              <span className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {voteUrl}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs gap-1 text-slate-200 hover:text-white hover:bg-slate-800"
            onClick={() => window.open(voteUrl, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Testar Votação
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs gap-1 text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={handleGenerateNewPin}
            title="Trocar código PIN da sala"
          >
            <RefreshCw className="w-3 h-3" />
            Novo PIN
          </Button>
        </div>
      </div>

      {/* Grid Principal: Média Geral + Gráfico de Barras de 0 a 10 */}
      <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 lg:grid-cols-3 flex-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Card Destaque: Média Geral da Turma */}
        <Card className="border-2 border-amber-500/30 bg-gradient-to-b from-card via-card to-amber-500/5 shadow-md flex flex-col justify-between">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Média Geral da Turma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center space-y-4">
            <div className="space-y-1">
              <div className={`font-black font-mono tracking-tight leading-none ${
                isFullscreen ? 'text-7xl sm:text-8xl' : 'text-6xl sm:text-7xl'
              } ${
                averageScore >= 7 ? 'text-emerald-500' : averageScore >= 5 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {averageScore}
              </div>
              <span className="text-xs font-semibold text-muted-foreground">escala de 0.0 a 10.0</span>
            </div>

            {/* Estrelas */}
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => {
                const filled = averageScore >= (i + 1) * 2;
                return (
                  <Star 
                    key={i} 
                    className={`w-6 h-6 ${filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} 
                  />
                );
              })}
            </div>

            <div className="p-3 rounded-xl bg-muted/60 border text-xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Total de Votos:</span>
                <strong className="text-foreground">{totalVotes}</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Avaliação Geral:</span>
                <strong className={averageScore >= 7 ? 'text-emerald-600 dark:text-emerald-400' : averageScore >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>
                  {averageScore >= 8 ? 'Excelente (≥ 8.0)' : averageScore >= 6 ? 'Bom (6.0 a 7.9)' : 'Precisa de Reforço (< 6.0)'}
                </strong>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição de Notas de 0 a 10 */}
        <Card className="lg:col-span-2 border-2 border-border/80 shadow-md">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-500" />
                Distribuição das Notas (0 a 10)
              </CardTitle>
              <CardDescription className="text-xs">
                Contagem proporcional em tempo real a cada voto recebido
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            {SCORES.map((score) => {
              const votesCount = distribution[score] || 0;
              const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
              const barColor = getScoreBarColor(score);
              const textColor = getScoreTextColor(score);

              return (
                <div key={score} className="grid grid-cols-[55px_1fr_65px] items-center gap-2.5 text-xs">
                  <span className={`font-mono font-bold text-right ${textColor}`}>
                    Nota {score}
                  </span>

                  <div className="h-5 rounded-lg bg-muted/60 border p-0.5 overflow-hidden flex">
                    <div
                      className={`h-full rounded-md bg-gradient-to-r ${barColor} transition-all duration-500 flex items-center justify-end px-1.5 text-[10px] text-white font-bold shadow-sm`}
                      style={{ width: `${Math.max(percent, percent > 0 ? 8 : 0)}%` }}
                    >
                      {percent > 12 && `${percent}%`}
                    </div>
                  </div>

                  <span className="font-mono text-muted-foreground text-right text-[11px]">
                    <strong className="text-foreground">{votesCount}</strong> ({percent}%)
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Projeção / QR Code para Data-Show */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-xl p-6 sm:p-8 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto border border-amber-500/30">
              <Tv className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Votação Rápida (0 a 10)
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Aponte a câmera do seu celular para o QR Code abaixo para votar na sua nota de 0 a 10.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-5 my-2">
            {/* Tópico atual em destaque */}
            <div className="w-full text-center p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold block mb-0.5">
                Tema em Avaliação:
              </span>
              <p className="text-base font-bold text-white">
                {title}
              </p>
            </div>

            {/* QR Code com borda e fundo branco */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-amber-500/30 animate-in zoom-in-90">
              <QRCodeSVG 
                value={voteUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* PIN e Link */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Código PIN:</span>
                <span className="font-mono text-2xl font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  {sessionPin}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono select-all">
                {voteUrl}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 font-bold"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link da Votação'}
            </Button>
            <Button
              variant="outline"
              className="w-full border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              onClick={() => setIsQrModalOpen(false)}
            >
              Fechar Projeção
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Criar Nova Votação Rápida */}
      <Dialog open={isCreatingNew} onOpenChange={setIsCreatingNew}>
        <DialogContent className="max-w-md p-6 bg-card border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Criar Nova Votação Rápida
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina o tema para os alunos avaliarem de 0 a 10
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNew} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Tema / Pergunta da Avaliação:
              </label>
              <Input
                value={newTitleInput}
                onChange={(e) => setNewTitleInput(e.target.value)}
                placeholder="Ex: Como você avalia seu domínio em Estrutura de Repetição?"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Turma / Disciplina:
              </label>
              <Input
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                placeholder="Ex: Algoritmos - 1º Ano"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreatingNew(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                Lançar Votação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
