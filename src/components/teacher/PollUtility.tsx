import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  BarChart3, 
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
  Layers,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface VoterRecord {
  voterId: string;
  voterName: string;
  optionId: string;
  timestamp: number;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const OPTION_COLORS = [
  { bg: 'bg-blue-500', bar: 'from-blue-600 to-indigo-500', text: 'text-blue-500' },
  { bg: 'bg-emerald-500', bar: 'from-emerald-600 to-teal-500', text: 'text-emerald-500' },
  { bg: 'bg-amber-500', bar: 'from-amber-600 to-orange-500', text: 'text-amber-500' },
  { bg: 'bg-purple-500', bar: 'from-purple-600 to-pink-500', text: 'text-purple-500' },
  { bg: 'bg-rose-500', bar: 'from-rose-600 to-red-500', text: 'text-rose-500' },
  { bg: 'bg-cyan-500', bar: 'from-cyan-600 to-sky-500', text: 'text-cyan-500' }
];

export default function PollUtility() {
  const [pollTitle, setPollTitle] = useState('Qual arquitetura de banco de dados você prefere para o projeto prático?');
  const [options, setOptions] = useState<PollOption[]>([
    { id: 'opt_1', text: 'PostgreSQL Relacional', votes: 12 },
    { id: 'opt_2', text: 'MongoDB Não-Relacional', votes: 8 },
    { id: 'opt_3', text: 'SQLite Embutido', votes: 4 },
    { id: 'opt_4', text: 'Supabase BaaS', votes: 15 }
  ]);
  
  const [isPollActive, setIsPollActive] = useState(true);
  const [voterHistory, setVoterHistory] = useState<VoterRecord[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [newOptionsInput, setNewOptionsInput] = useState<string[]>(['', '', '', '']);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // PIN da Sessão (6 dígitos)
  const [sessionPin, setSessionPin] = useState(() => {
    const saved = sessionStorage.getItem('poll_live_session_pin');
    if (saved) return saved;
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('poll_live_session_pin', newPin);
    return newPin;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const pollStateRef = useRef({ title: pollTitle, options, isActive: isPollActive });
  pollStateRef.current = { title: pollTitle, options, isActive: isPollActive };

  const pollUrl = `${window.location.origin}/enquete/${sessionPin}`;

  const totalVotes = options.reduce((acc, curr) => acc + curr.votes, 0);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
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

  // Broadcast do estado atual da enquete para todos os alunos
  const broadcastPollState = (updatedState: { title: string; options: PollOption[]; isActive: boolean }) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'poll_state',
        payload: updatedState
      }).catch(() => {});
    }
  };

  // Inscrição Realtime no canal da Enquete
  useEffect(() => {
    if (!sessionPin) return;

    const channelName = `poll_${sessionPin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'vote_poll' }, (event) => {
        const payload = event?.payload;
        if (payload && payload.optionId) {
          setOptions(prev => {
            const nextOptions = prev.map(opt => {
              // Se é a nova opção selecionada
              if (opt.id === payload.optionId) {
                return { ...opt, votes: opt.votes + 1 };
              }
              // Se o aluno trocou de voto anterior
              if (payload.previousOptionId && opt.id === payload.previousOptionId) {
                return { ...opt, votes: Math.max(0, opt.votes - 1) };
              }
              return opt;
            });

            // Transmite o novo total para os celulares
            const nextState = {
              title: pollStateRef.current.title,
              options: nextOptions,
              isActive: pollStateRef.current.isActive
            };
            setTimeout(() => broadcastPollState(nextState), 50);

            return nextOptions;
          });

          if (payload.voterName) {
            setVoterHistory(prev => [
              {
                voterId: payload.voterId || '',
                voterName: payload.voterName,
                optionId: payload.optionId,
                timestamp: Date.now()
              },
              ...prev.filter(v => v.voterId !== payload.voterId)
            ]);
          }

          playChime();
          toast.info(`Novo voto recebido ao vivo! (${payload.voterName || 'Aluno'})`, {
            duration: 2500
          });
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        // Envia o estado atual para o aluno que acabou de abrir a tela
        channel.send({
          type: 'broadcast',
          event: 'poll_state',
          payload: pollStateRef.current
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
  }, [sessionPin, isConnected]);

  const handleToggleActive = () => {
    const nextActive = !isPollActive;
    setIsPollActive(nextActive);
    const nextState = { ...pollStateRef.current, isActive: nextActive };
    broadcastPollState(nextState);
    toast.success(nextActive ? 'Votação reaberta para os alunos!' : 'Votação encerrada/bloqueada!');
  };

  const handleResetVotes = () => {
    if (confirm('Deseja zerar todos os votos desta enquete?')) {
      const resetOpts = options.map(o => ({ ...o, votes: 0 }));
      setOptions(resetOpts);
      setVoterHistory([]);
      const nextState = { ...pollStateRef.current, options: resetOpts };
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'poll_reset',
          payload: nextState
        }).catch(() => {});
      }
      toast.success('Votação zerada para uma nova rodada!');
    }
  };

  const handleCreateNewPoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleInput.trim()) {
      toast.error('Informe a pergunta da enquete!');
      return;
    }

    const validOptions = newOptionsInput.filter(o => o.trim().length > 0);
    if (validOptions.length < 2) {
      toast.error('Informe pelo menos 2 opções válidas!');
      return;
    }

    const createdOpts: PollOption[] = validOptions.map((text, idx) => ({
      id: `opt_${Date.now()}_${idx}`,
      text: text.trim(),
      votes: 0
    }));

    setPollTitle(newTitleInput.trim());
    setOptions(createdOpts);
    setIsPollActive(true);
    setVoterHistory([]);
    setIsCreatingNew(false);
    setNewTitleInput('');
    setNewOptionsInput(['', '', '', '']);

    const nextState = {
      title: newTitleInput.trim(),
      options: createdOpts,
      isActive: true
    };
    broadcastPollState(nextState);
    toast.success('Nova pesquisa criada e transmitida ao vivo!');
  };

  const applyTemplate = (type: 'yes_no' | 'true_false' | 'abcd' | 'feedback') => {
    if (type === 'yes_no') {
      setNewOptionsInput(['Sim', 'Não', 'Talvez / Em dúvida']);
    } else if (type === 'true_false') {
      setNewOptionsInput(['Verdadeiro', 'Falso']);
    } else if (type === 'abcd') {
      setNewOptionsInput(['Opção A', 'Opção B', 'Opção C', 'Opção D']);
    } else if (type === 'feedback') {
      setNewOptionsInput(['Excelente', 'Bom', 'Regular', 'Precisa de Revisão']);
    }
  };

  const handleGenerateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('poll_live_session_pin', newPin);
    setSessionPin(newPin);
    const resetOpts = options.map(o => ({ ...o, votes: 0 }));
    setOptions(resetOpts);
    setVoterHistory([]);
    toast.success(`Nova sala de pesquisa criada: PIN ${newPin}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      toast.success('Link da enquete copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.error('Não foi possível copiar o link.');
    }
  };

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

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-8 bg-slate-950 text-slate-100 min-h-screen' : ''}`} ref={containerRef}>
      {/* Top Banner Controls */}
      <div className={`p-5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-blue-600 text-white gap-1 font-bold">
              <BarChart3 className="w-3.5 h-3.5" />
              Pesquisa Online em Tempo Real
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

            <Badge variant="outline" className="border-white/20 text-blue-200 bg-white/5 text-xs gap-1">
              <Users className="w-3 h-3 text-blue-300" />
              {totalVotes} votos computados
            </Badge>

            {isPollActive ? (
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
              {pollTitle}
            </h2>
            <p className="text-xs text-blue-200">
              Projete o QR Code no Datashow e acompanhe os votos dos alunos ao vivo.
            </p>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Button
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 text-xs gap-1.5 font-semibold"
          >
            <QrCode className="w-4 h-4" />
            Projetar QR Code
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
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
            Nova Pesquisa
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleToggleActive}
          >
            {isPollActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            {isPollActive ? 'Encerrar' : 'Reabrir'}
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
      <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Os alunos votam acessando o link ou digitando o PIN:
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                PIN: {sessionPin}
              </span>
              <span className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md font-mono">
                {pollUrl}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs gap-1 text-slate-300 hover:text-white"
            onClick={() => window.open(pollUrl, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Testar Votação
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs gap-1 text-slate-400 hover:text-slate-200"
            onClick={handleGenerateNewPin}
            title="Trocar código PIN da sala"
          >
            <RefreshCw className="w-3 h-3" />
            Novo PIN
          </Button>
        </div>
      </div>

      {/* Gráfico Principal de Barras em Tempo Real */}
      <Card className="border-2 border-border/80 shadow-md">
        <CardHeader className="pb-4 flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Resultado da Enquete ao Vivo
            </CardTitle>
            <CardDescription className="text-xs">
              {totalVotes} {totalVotes === 1 ? 'voto registrado' : 'votos registrados na turma'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Link'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {options.map((opt, index) => {
            const letter = OPTION_LETTERS[index % OPTION_LETTERS.length];
            const color = OPTION_COLORS[index % OPTION_COLORS.length];
            const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

            return (
              <div key={opt.id} className="space-y-1.5">
                {/* Linha com Título e Estatística */}
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2.5 font-semibold text-foreground">
                    <span className={`w-7 h-7 rounded-lg font-bold font-mono text-xs flex items-center justify-center text-white ${color.bg} shadow-sm`}>
                      {letter}
                    </span>
                    <span className="text-base">{opt.text}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-muted-foreground text-xs">{opt.votes} {opt.votes === 1 ? 'voto' : 'votos'}</span>
                    <Badge variant="secondary" className="font-bold text-sm px-2.5 py-0.5">
                      {percent}%
                    </Badge>
                  </div>
                </div>

                {/* Barra Animada de Porcentagem */}
                <div className="w-full h-7 rounded-xl bg-muted/60 border p-0.5 overflow-hidden flex">
                  <div
                    className={`h-full rounded-lg bg-gradient-to-r ${color.bar} transition-all duration-700 flex items-center justify-end px-3 text-white text-xs font-bold shadow-sm`}
                    style={{ width: `${Math.max(percent, percent > 0 ? 5 : 0)}%` }}
                  >
                    {percent > 8 && <span>{percent}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Modal de Projeção / QR Code para Data-Show */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-xl p-6 sm:p-8 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/20 text-blue-400 mx-auto border border-blue-500/30">
              <Tv className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Pesquisa Online da Aula
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Aponte a câmera do seu celular para o QR Code abaixo para votar na pergunta.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-5 my-2">
            {/* Tópico atual em destaque */}
            <div className="w-full text-center p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-blue-400 font-semibold block mb-0.5">
                Pergunta Avaliada:
              </span>
              <p className="text-base font-bold text-white">
                {pollTitle}
              </p>
            </div>

            {/* QR Code com borda e fundo branco */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-blue-500/30 animate-in zoom-in-90">
              <QRCodeSVG 
                value={pollUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* PIN e Link */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Código PIN:</span>
                <span className="font-mono text-2xl font-extrabold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
                  {sessionPin}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono select-all">
                {pollUrl}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white gap-1.5 font-semibold"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link da Enquete'}
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

      {/* Modal para Criar Nova Enquete */}
      <Dialog open={isCreatingNew} onOpenChange={setIsCreatingNew}>
        <DialogContent className="max-w-lg p-6 bg-card border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Criar Nova Pesquisa Online
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Defina a pergunta e as opções para os alunos responderem pelo celular
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewPoll} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Pergunta da Pesquisa:
              </label>
              <Input
                value={newTitleInput}
                onChange={(e) => setNewTitleInput(e.target.value)}
                placeholder="Ex: Qual tema vocês querem aprofundar na próxima aula?"
                required
              />
            </div>

            {/* Templates Rápidos */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground block">
                Modelos Rápidos de Opções:
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" size="sm" variant="outline" className="text-xs h-7" onClick={() => applyTemplate('yes_no')}>
                  Sim / Não / Talvez
                </Button>
                <Button type="button" size="sm" variant="outline" className="text-xs h-7" onClick={() => applyTemplate('true_false')}>
                  Verdadeiro / Falso
                </Button>
                <Button type="button" size="sm" variant="outline" className="text-xs h-7" onClick={() => applyTemplate('abcd')}>
                  A / B / C / D
                </Button>
                <Button type="button" size="sm" variant="outline" className="text-xs h-7" onClick={() => applyTemplate('feedback')}>
                  Escala de Qualidade
                </Button>
              </div>
            </div>

            {/* Opções de Voto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-muted-foreground">Opções de Resposta:</label>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-xs text-blue-600 gap-1"
                  onClick={() => setNewOptionsInput([...newOptionsInput, ''])}
                  disabled={newOptionsInput.length >= 6}
                >
                  <Plus className="w-3 h-3" />
                  Mais Opção
                </Button>
              </div>

              {newOptionsInput.map((optVal, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded font-mono font-bold text-xs bg-muted flex items-center justify-center shrink-0">
                    {OPTION_LETTERS[i]}
                  </span>
                  <Input
                    value={optVal}
                    onChange={(e) => {
                      const next = [...newOptionsInput];
                      next[i] = e.target.value;
                      setNewOptionsInput(next);
                    }}
                    placeholder={`Opção ${OPTION_LETTERS[i]}...`}
                    className="text-xs h-9"
                  />
                  {newOptionsInput.length > 2 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-500 shrink-0"
                      onClick={() => setNewOptionsInput(newOptionsInput.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreatingNew(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
                Lançar Pesquisa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
