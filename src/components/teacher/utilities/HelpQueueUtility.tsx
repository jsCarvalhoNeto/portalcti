import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Hand, 
  CheckCircle2, 
  Clock, 
  Monitor, 
  Plus, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Play, 
  UserCheck, 
  RotateCcw,
  Maximize2,
  Minimize2,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Tv,
  Radio,
  Users
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface HelpRequest {
  id: string;
  studentName: string;
  machineNumber: string;
  topic: string;
  createdAt: number;
  status: 'waiting' | 'in_progress' | 'resolved';
  voterId?: string;
}

export default function HelpQueueUtility() {
  const [requests, setRequests] = useState<HelpRequest[]>([
    {
      id: '1',
      studentName: 'Lucas Ferreira',
      machineNumber: 'PC-04',
      topic: 'Erro de sintaxe no React Router',
      createdAt: Date.now() - 1000 * 60 * 4,
      status: 'waiting'
    },
    {
      id: '2',
      studentName: 'Mariana Costa',
      machineNumber: 'PC-12',
      topic: 'Dúvida na conexão com o Banco de Dados',
      createdAt: Date.now() - 1000 * 60 * 2,
      status: 'waiting'
    }
  ]);

  // Form para nova dúvida manual
  const [newStudent, setNewStudent] = useState('');
  const [newMachine, setNewMachine] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // PIN da Sessão do Lab (6 dígitos)
  const [sessionPin, setSessionPin] = useState(() => {
    const saved = sessionStorage.getItem('helpqueue_session_pin');
    if (saved) return saved;
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('helpqueue_session_pin', newPin);
    return newPin;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const requestsRef = useRef(requests);
  requestsRef.current = requests;

  const queueUrl = `${window.location.origin}/fila/${sessionPin}`;

  // Atualizador do tempo decorrido a cada 10 segundos
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn(e);
    }
  };

  // Broadcast do estado atual da fila para todos os alunos
  const broadcastQueueState = (currentList: HelpRequest[]) => {
    if (channelRef.current && isConnected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'queue_updated',
        payload: { requests: currentList }
      }).catch(() => {});
    }
  };

  // Inscrição no canal Realtime do Supabase
  useEffect(() => {
    if (!sessionPin) return;

    const channelName = `helpqueue_${sessionPin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'new_request' }, (event) => {
        const payload = event?.payload;
        if (payload && payload.id && payload.studentName) {
          const newReq: HelpRequest = {
            id: payload.id,
            studentName: payload.studentName,
            machineNumber: payload.machineNumber || 'PC-01',
            topic: payload.topic || 'Dúvida na atividade',
            createdAt: payload.createdAt || Date.now(),
            status: 'waiting',
            voterId: payload.voterId
          };

          setRequests(prev => {
            const nextList = [...prev, newReq];
            // Transmite a fila atualizada de volta
            setTimeout(() => broadcastQueueState(nextList), 100);
            return nextList;
          });

          playBeep();
          toast.info(`✋ Chamado de ${newReq.studentName} na máquina ${newReq.machineNumber}!`, {
            duration: 4000
          });
        }
      })
      .on('broadcast', { event: 'cancel_request' }, (event) => {
        const payload = event?.payload;
        if (payload && payload.id) {
          setRequests(prev => {
            const nextList = prev.filter(r => r.id !== payload.id);
            setTimeout(() => broadcastQueueState(nextList), 100);
            return nextList;
          });
          toast.info('Um aluno cancelou sua solicitação de ajuda.');
        }
      })
      .on('broadcast', { event: 'request_state' }, () => {
        channel.send({
          type: 'broadcast',
          event: 'state_sync',
          payload: { requests: requestsRef.current }
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

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.trim()) return;

    const newReq: HelpRequest = {
      id: Date.now().toString(),
      studentName: newStudent.trim(),
      machineNumber: newMachine.trim() ? (newMachine.toLowerCase().startsWith('pc') ? newMachine.toUpperCase() : `PC-${newMachine}`) : 'Bancada',
      topic: newTopic.trim() || 'Dúvida na atividade prática',
      createdAt: Date.now(),
      status: 'waiting'
    };

    const nextList = [...requests, newReq];
    setRequests(nextList);
    broadcastQueueState(nextList);
    setNewStudent('');
    setNewMachine('');
    setNewTopic('');
    playBeep();
    toast.success(`Chamado de ${newReq.studentName} inserido manualmente!`);
  };

  const updateStatus = (id: string, newStatus: 'waiting' | 'in_progress' | 'resolved') => {
    const nextList = requests.map(r => r.id === id ? { ...r, status: newStatus } : r);
    setRequests(nextList);
    broadcastQueueState(nextList);
    if (newStatus === 'in_progress') {
      const student = requests.find(r => r.id === id);
      toast.info(`Atendendo ${student?.studentName} (${student?.machineNumber})`);
    }
  };

  const removeRequest = (id: string) => {
    const nextList = requests.filter(r => r.id !== id);
    setRequests(nextList);
    broadcastQueueState(nextList);
  };

  const clearResolved = () => {
    const nextList = requests.filter(r => r.status !== 'resolved');
    setRequests(nextList);
    broadcastQueueState(nextList);
  };

  const resetAll = () => {
    if (confirm('Deseja limpar toda a fila de atendimento?')) {
      setRequests([]);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'session_reset',
          payload: {}
        }).catch(() => {});
      }
      toast.success('Fila de atendimento zerada!');
    }
  };

  const handleGenerateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('helpqueue_session_pin', newPin);
    setSessionPin(newPin);
    setRequests([]);
    toast.success(`Novo código PIN do Lab gerado: ${newPin}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(queueUrl);
      setCopied(true);
      toast.success('Link da fila copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const formatWaitTime = (timestamp: number) => {
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins <= 0) return 'Agora';
    if (diffMins === 1) return 'Há 1 min';
    return `Há ${diffMins} min`;
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

  const waitingList = requests.filter(r => r.status === 'waiting');
  const inProgressList = requests.filter(r => r.status === 'in_progress');
  const resolvedList = requests.filter(r => r.status === 'resolved');

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-8 bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between' : ''}`} ref={containerRef}>
      {/* Top Banner Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl ${
        isFullscreen ? 'bg-slate-900 text-white border border-slate-800 shadow-xl' : 'bg-card border border-border/80'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex flex-wrap items-center gap-2">
              Fila de Atendimento do Laboratório
              {waitingList.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {waitingList.length} aguardando
                </Badge>
              )}
              {isConnected ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-xs gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Ao Vivo
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  Conectando...
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Acompanhe e atenda as dúvidas dos alunos por ordem de chamado
            </p>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex items-center gap-2">
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
            variant="ghost"
            className="text-xs gap-1.5"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            {soundEnabled ? 'Som Ativo' : 'Mudo'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 font-medium"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Sair Tela Cheia' : 'Projetar em Tela Cheia'}
          </Button>
        </div>
      </div>

      {/* Banner de Acesso Rápido para os Alunos no Lab */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-300 font-medium">
              Os alunos podem pedir ajuda pelo celular informando a máquina (PC-01 a PC-20):
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm font-bold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded border border-indigo-500/30">
                PIN: {sessionPin}
              </span>
              <span className="text-xs text-slate-300 truncate max-w-xs sm:max-w-md font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {queueUrl}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs gap-1 text-slate-200 hover:text-white hover:bg-slate-800"
            onClick={() => window.open(queueUrl, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Testar Chamado
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

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: A Fila de Atendimento */}
        <div className="lg:col-span-2 space-y-4">
          {/* Aluno em Atendimento (Destaque) */}
          {inProgressList.length > 0 && (
            <Card className="border-2 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Em Atendimento Agora
                  </span>
                  <Badge className="bg-indigo-500 text-white">Atendendo</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {inProgressList.map(req => (
                  <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">{req.studentName}</span>
                        <Badge variant="outline" className="font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-xs">
                          <Monitor className="w-3 h-3 mr-1" />
                          {req.machineNumber}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{req.topic}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
                        onClick={() => updateStatus(req.id, 'resolved')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Concluir Dúvida
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => updateStatus(req.id, 'waiting')}
                      >
                        Voltar pra Fila
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Fila de Espera */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Próximos na Fila ({waitingList.length})
                </CardTitle>
                <CardDescription>Ordem de chegada para atendimento</CardDescription>
              </div>

              {waitingList.length > 0 && inProgressList.length === 0 && (
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5"
                  onClick={() => updateStatus(waitingList[0].id, 'in_progress')}
                >
                  <Play className="w-3.5 h-3.5" />
                  Chamar Próximo ({waitingList[0].studentName} - {waitingList[0].machineNumber})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {waitingList.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto" />
                  <p className="font-medium text-foreground">Fila de dúvidas zerada!</p>
                  <p className="text-xs">Nenhum aluno aguardando atendimento no momento.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {waitingList.map((req, index) => (
                    <div 
                      key={req.id} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                        index === 0 ? 'bg-amber-500/5 border-amber-500/30 shadow-sm' : 'bg-muted/30 border-border/60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          index === 0 ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}º
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{req.studentName}</span>
                            <Badge variant="outline" className="text-[11px] font-mono py-0 h-5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                              <Monitor className="w-2.5 h-2.5 mr-1" />
                              {req.machineNumber}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formatWaitTime(req.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{req.topic}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs font-medium gap-1 hover:bg-indigo-600 hover:text-white transition-colors"
                          onClick={() => updateStatus(req.id, 'in_progress')}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Atender
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                          onClick={() => removeRequest(req.id)}
                          title="Remover da fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Resolvidos */}
          {resolvedList.length > 0 && (
            <Card className="opacity-80">
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Atendimentos Concluídos Hoje ({resolvedList.length})
                </CardTitle>
                <Button size="sm" variant="ghost" className="h-6 text-[11px] text-muted-foreground" onClick={clearResolved}>
                  Limpar
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {resolvedList.map(req => (
                    <Badge key={req.id} variant="secondary" className="text-xs gap-1 font-normal bg-muted/60">
                      <span className="font-semibold">{req.studentName}</span>
                      <span className="text-muted-foreground">({req.machineNumber})</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna 3: Formulário Manual de Chamado */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                Novo Chamado Manual
              </CardTitle>
              <CardDescription>Adicionar direto pelo painel do professor</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRequest} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nome do Aluno</label>
                  <Input
                    value={newStudent}
                    onChange={(e) => setNewStudent(e.target.value)}
                    placeholder="Ex: Matheus Ramos"
                    className="mt-1 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Máquina / Computador</label>
                  <Input
                    value={newMachine}
                    onChange={(e) => setNewMachine(e.target.value)}
                    placeholder="Ex: 08 ou PC-08"
                    className="mt-1 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground">Dúvida / Assunto (Opcional)</label>
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="Ex: Dúvida no SELECT do SQL"
                    className="mt-1 text-sm"
                  />
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 mt-2">
                  <Plus className="w-4 h-4" />
                  Entrar na Fila
                </Button>
              </form>

              <div className="pt-4 border-t mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Ações Gerais:</span>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-500 hover:bg-rose-500/10" onClick={resetAll}>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Zerar Fila
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Projeção / QR Code para Data-Show */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-xl p-6 sm:p-8 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto border border-amber-500/30">
              <Tv className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Fila de Dúvidas do Laboratório
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Escaneie o QR Code com a câmera do celular e selecione o seu computador (PC-01 a PC-20) para pedir ajuda.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-5 my-2">
            {/* QR Code com borda e fundo branco */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-amber-500/30 animate-in zoom-in-90">
              <QRCodeSVG 
                value={queueUrl}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* PIN e Link */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Código PIN do Lab:</span>
                <span className="font-mono text-2xl font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  {sessionPin}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono select-all">
                {queueUrl}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link do Lab'}
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
