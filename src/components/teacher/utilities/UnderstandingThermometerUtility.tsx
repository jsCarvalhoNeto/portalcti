import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Smile, 
  Meh, 
  Frown, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Users,
  Radio,
  Tv,
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

type VoteType = 'understood' | 'doubts' | 'lost';

export default function UnderstandingThermometerUtility() {
  const [topic, setTopic] = useState('Conceito de Chaves Estrangeiras & JOINs no SQL');
  const [manualVotes, setManualVotes] = useState({
    understood: 0,
    doubts: 0,
    lost: 0
  });

  // Votos recebidos em tempo real via Supabase Realtime (voterId -> voteType)
  const [voterMap, setVoterMap] = useState<Record<string, VoteType>>({});
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PIN da Sala (6 dígitos)
  const [sessionPin, setSessionPin] = useState(() => {
    const saved = sessionStorage.getItem('thermometer_session_pin');
    if (saved) return saved;
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('thermometer_session_pin', newPin);
    return newPin;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const topicRef = useRef(topic);
  topicRef.current = topic;

  // URL compartilhável para os alunos
  const voteUrl = `${window.location.origin}/termometro/${sessionPin}`;

  // Calcula os totais combinando celular + manual
  const realtimeCounts = Object.values(voterMap).reduce(
    (acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    },
    { understood: 0, doubts: 0, lost: 0 } as Record<VoteType, number>
  );

  const votes = {
    understood: realtimeCounts.understood + manualVotes.understood,
    doubts: realtimeCounts.doubts + manualVotes.doubts,
    lost: realtimeCounts.lost + manualVotes.lost
  };

  const totalVotes = votes.understood + votes.doubts + votes.lost;

  const percentUnderstood = totalVotes > 0 ? Math.round((votes.understood / totalVotes) * 100) : 0;
  const percentDoubts = totalVotes > 0 ? Math.round((votes.doubts / totalVotes) * 100) : 0;
  const percentLost = totalVotes > 0 ? Math.round((votes.lost / totalVotes) * 100) : 0;

  // Inscrição no canal Realtime do Supabase
  useEffect(() => {
    if (!sessionPin) return;

    const channelName = `thermometer_${sessionPin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'vote' }, (event) => {
        const payload = event?.payload;
        if (payload && payload.voterId && payload.type) {
          setVoterMap(prev => {
            const next = { ...prev, [payload.voterId]: payload.type as VoteType };
            return next;
          });
          toast.info(`Novo voto recebido ao vivo! (${payload.type === 'understood' ? '🟢 Entendi' : payload.type === 'doubts' ? '🟡 Dúvida' : '🔴 Dificuldade'})`, {
            duration: 2500
          });
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        channel.send({
          type: 'broadcast',
          event: 'state_sync',
          payload: { topic: topicRef.current }
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
  }, [sessionPin]);

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

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'topic_update',
        payload: { topic: newTopic }
      }).catch(() => {});
    }
  };

  const handleManualVote = (type: VoteType) => {
    setManualVotes(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const handleReset = () => {
    setVoterMap({});
    setManualVotes({ understood: 0, doubts: 0, lost: 0 });
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'session_reset',
        payload: {}
      }).catch(() => {});
    }
    toast.success('Termômetro zerado para uma nova pergunta!');
  };

  const handleGenerateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('thermometer_session_pin', newPin);
    setSessionPin(newPin);
    setVoterMap({});
    setManualVotes({ understood: 0, doubts: 0, lost: 0 });
    toast.success(`Nova sala criada: PIN ${newPin}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopied(true);
      toast.success('Link do termômetro copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const getPedagogicalAdvice = () => {
    if (totalVotes === 0) {
      return {
        badge: 'Aguardando Votos',
        color: 'bg-muted text-muted-foreground border-border',
        advice: 'Lance a pergunta para a turma, projete o QR Code e acompanhe as reações dos alunos.'
      };
    }

    if (percentUnderstood >= 75) {
      return {
        badge: '🟢 Excelente Assimilação (≥75%)',
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        advice: 'A grande maioria da turma compreendeu o conteúdo com segurança. Ótimo momento para lançar o desafio prático ou avançar para o próximo tópico!'
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
    <div className={`space-y-6 ${isFullscreen ? 'p-8 bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between' : ''}`} ref={containerRef}>
      {/* Topo / Pergunta da Aula & Controles de Sala */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-indigo-500 text-white gap-1 w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              Termômetro de Compreensão em Tempo Real
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

            <Badge variant="outline" className="border-white/20 text-indigo-200 bg-white/5 text-xs gap-1">
              <Users className="w-3 h-3" />
              {Object.keys(voterMap).length} votos via celular
            </Badge>
          </div>

          <div>
            <span className="text-xs text-indigo-300">Tópico ou Pergunta Avaliada:</span>
            {isFullscreen ? (
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-1">
                {topic}
              </h2>
            ) : (
              <Input
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="mt-1 bg-white/10 border-white/20 text-white font-semibold text-base sm:text-lg focus-visible:ring-indigo-400"
                placeholder="Ex: Ficou claro como funcionam as Chaves Estrangeiras e JOINs?"
              />
            )}
          </div>
        </div>

        {/* Botões de Ação do Professor */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Button
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 text-xs gap-1.5 font-semibold"
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
            onClick={handleCopyLink}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Link'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleReset}
            title="Zera os votos e avisa os alunos"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Zerar Votação
          </Button>
        </div>
      </div>

      {/* Banner de Acesso Rápido para Sala de Aula */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-300 font-medium">
              Os alunos podem votar pelo celular acessando o link ou digitando o PIN:
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-500/30">
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

      {/* 3 Cartões de Sentimento / Votação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Entendi Tudo */}
        <Card className="border-2 border-emerald-500/30 bg-gradient-to-b from-card via-card to-emerald-500/5 hover:border-emerald-500/60 transition-all shadow-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/20 shadow-sm">
              <Smile className="w-9 h-9" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Entendi Tudo</h3>
              <p className="text-xs text-muted-foreground">Dominei o conceito e posso avançar</p>
            </div>

            <div className="py-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {votes.understood}
              </span>
              <span className="text-xs text-muted-foreground ml-1 font-semibold">votos</span>
              <p className="text-[11px] text-muted-foreground mt-1">
                📱 Celulares: {realtimeCounts.understood} | 🖱️ Manual: {manualVotes.understood}
              </p>
            </div>

            {!isFullscreen && (
              <Button
                variant="outline"
                className="w-full border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                onClick={() => handleManualVote('understood')}
              >
                +1 Voto Manual
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tenho Dúvidas */}
        <Card className="border-2 border-amber-500/30 bg-gradient-to-b from-card via-card to-amber-500/5 hover:border-amber-500/60 transition-all shadow-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20 shadow-sm">
              <Meh className="w-9 h-9" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Tenho Dúvidas</h3>
              <p className="text-xs text-muted-foreground">Mais ou menos, preciso de mais 1 exemplo</p>
            </div>

            <div className="py-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-amber-600 dark:text-amber-400">
                {votes.doubts}
              </span>
              <span className="text-xs text-muted-foreground ml-1 font-semibold">votos</span>
              <p className="text-[11px] text-muted-foreground mt-1">
                📱 Celulares: {realtimeCounts.doubts} | 🖱️ Manual: {manualVotes.doubts}
              </p>
            </div>

            {!isFullscreen && (
              <Button
                variant="outline"
                className="w-full border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold"
                onClick={() => handleManualVote('doubts')}
              >
                +1 Voto Manual
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Estou Perdido */}
        <Card className="border-2 border-rose-500/30 bg-gradient-to-b from-card via-card to-rose-500/5 hover:border-rose-500/60 transition-all shadow-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center border border-rose-500/20 shadow-sm">
              <Frown className="w-9 h-9" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Estou Perdido</h3>
              <p className="text-xs text-muted-foreground">Não entendi e preciso de revisão</p>
            </div>

            <div className="py-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-rose-600 dark:text-rose-400">
                {votes.lost}
              </span>
              <span className="text-xs text-muted-foreground ml-1 font-semibold">votos</span>
              <p className="text-[11px] text-muted-foreground mt-1">
                📱 Celulares: {realtimeCounts.lost} | 🖱️ Manual: {manualVotes.lost}
              </p>
            </div>

            {!isFullscreen && (
              <Button
                variant="outline"
                className="w-full border-rose-500/30 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                onClick={() => handleManualVote('lost')}
              >
                +1 Voto Manual
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Barra de Distribuição Percentual */}
      <Card className="border-2 border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              Distribuição das Respostas da Turma ({totalVotes} {totalVotes === 1 ? 'aluno' : 'alunos'})
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              Total: {totalVotes} votos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra Empilhada Multicor */}
          <div className="w-full h-8 rounded-2xl bg-muted/60 border p-1 flex overflow-hidden gap-1">
            {totalVotes === 0 ? (
              <div className="w-full h-full rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                Nenhum voto registrado ainda nesta rodada
              </div>
            ) : (
              <>
                {percentUnderstood > 0 && (
                  <div
                    style={{ width: `${percentUnderstood}%` }}
                    className="h-full rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 shadow-sm"
                    title={`Entendi Tudo: ${percentUnderstood}%`}
                  >
                    {percentUnderstood >= 10 && `${percentUnderstood}%`}
                  </div>
                )}
                {percentDoubts > 0 && (
                  <div
                    style={{ width: `${percentDoubts}%` }}
                    className="h-full rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 shadow-sm"
                    title={`Tenho Dúvidas: ${percentDoubts}%`}
                  >
                    {percentDoubts >= 10 && `${percentDoubts}%`}
                  </div>
                )}
                {percentLost > 0 && (
                  <div
                    style={{ width: `${percentLost}%` }}
                    className="h-full rounded-lg bg-rose-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-500 shadow-sm"
                    title={`Estou Perdido: ${percentLost}%`}
                  >
                    {percentLost >= 10 && `${percentLost}%`}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-1 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>{percentUnderstood}% Entendido</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>{percentDoubts}% Com Dúvidas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span>{percentLost}% Dificuldade Alta</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caixa de Diagnóstico Pedagógico Automático */}
      <Card className={`border-2 ${advice.color} transition-all`}>
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <h4 className="font-bold text-sm">Recomendação da Aula</h4>
              <Badge variant="outline" className="text-[11px] font-semibold bg-background/50">
                {advice.badge}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {advice.advice}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Projeção / QR Code para Data-Show */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-xl p-6 sm:p-8 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto border border-indigo-500/30">
              <Tv className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Votação no Termômetro da Aula
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Aponte a câmera do seu celular para o QR Code abaixo para votar no seu nível de entendimento.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-5 my-2">
            {/* Tópico atual em destaque */}
            <div className="w-full text-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold block mb-0.5">
                Tópico Avaliado:
              </span>
              <p className="text-base font-semibold text-white">
                {topic}
              </p>
            </div>

            {/* QR Code com borda e fundo branco */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-indigo-500/30 animate-in zoom-in-90">
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
                <span className="font-mono text-2xl font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link do Termômetro'}
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
    </div>
  );
}
