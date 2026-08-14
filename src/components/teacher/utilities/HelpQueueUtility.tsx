import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface HelpRequest {
  id: string;
  studentName: string;
  machineNumber: string;
  topic: string;
  createdAt: number;
  status: 'waiting' | 'in_progress' | 'resolved';
}

export default function HelpQueueUtility() {
  const [requests, setRequests] = useState<HelpRequest[]>([
    {
      id: '1',
      studentName: 'Lucas Ferreira',
      machineNumber: 'PC-04',
      topic: 'Erro de sintaxe no React Router',
      createdAt: Date.now() - 1000 * 60 * 4, // 4 min atrás
      status: 'waiting'
    },
    {
      id: '2',
      studentName: 'Mariana Costa',
      machineNumber: 'PC-12',
      topic: 'Dúvida na conexão com o Banco de Dados',
      createdAt: Date.now() - 1000 * 60 * 2, // 2 min atrás
      status: 'waiting'
    },
    {
      id: '3',
      studentName: 'Gabriel Santos',
      machineNumber: 'PC-07',
      topic: 'Não está instalando dependência npm',
      createdAt: Date.now() - 1000 * 60 * 1, // 1 min atrás
      status: 'waiting'
    }
  ]);

  // Form para nova dúvida
  const [newStudent, setNewStudent] = useState('');
  const [newMachine, setNewMachine] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  };

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

    setRequests(prev => [...prev, newReq]);
    setNewStudent('');
    setNewMachine('');
    setNewTopic('');
    playBeep();
  };

  const updateStatus = (id: string, newStatus: 'waiting' | 'in_progress' | 'resolved') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const removeRequest = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const clearResolved = () => {
    setRequests(prev => prev.filter(r => r.status !== 'resolved'));
  };

  const resetAll = () => {
    if (confirm('Deseja limpar toda a fila de atendimento?')) {
      setRequests([]);
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
    <div className="space-y-6" ref={containerRef}>
      {/* Top Banner Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl ${
        isFullscreen ? 'bg-slate-950 text-white border-b border-slate-800' : 'bg-card border border-border/80'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              Fila de Atendimento do Laboratório
              {waitingList.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {waitingList.length} aguardando
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              Acompanhe e atenda as dúvidas dos alunos por ordem de chamado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="text-xs gap-1.5"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Sair Tela Cheia' : 'Projetar Fila no Telão'}
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
                        <Badge variant="outline" className="font-mono bg-muted/60 text-xs">
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
                  Chamar Próximo ({waitingList[0].studentName})
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
                            <Badge variant="outline" className="text-[11px] font-mono py-0 h-5">
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

        {/* Coluna 3: Formulário de Adicionar Chamado */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                Novo Chamado de Dúvida
              </CardTitle>
              <CardDescription>Adicione o aluno ou máquina na fila</CardDescription>
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
    </div>
  );
}
