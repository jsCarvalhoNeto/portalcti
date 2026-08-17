import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Hand, 
  Monitor, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Clock,
  UserCheck,
  AlertCircle,
  Hash,
  XCircle,
  RotateCcw,
  HelpCircle,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface QueueItem {
  id: string;
  studentName: string;
  machineNumber: string;
  topic: string;
  createdAt: number;
  status: 'waiting' | 'in_progress' | 'resolved';
  voterId?: string;
}

const PC_LIST = Array.from({ length: 20 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  return `PC-${num}`;
});

export default function HelpQueueStudentPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [inputPin, setInputPin] = useState('');
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('lab_help_student_name') || '';
  });
  const [selectedPc, setSelectedPc] = useState<string>(() => {
    return localStorage.getItem('lab_help_selected_pc') || 'PC-01';
  });
  const [topic, setTopic] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeQueue, setActiveQueue] = useState<QueueItem[]>([]);
  const [myRequestId, setMyRequestId] = useState<string | null>(() => {
    return localStorage.getItem(`lab_help_req_id_${(code || '').toUpperCase()}`) || null;
  });

  const [voterId] = useState(() => {
    const saved = localStorage.getItem('lab_help_voter_id');
    if (saved) return saved;
    const newId = 'student_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('lab_help_voter_id', newId);
    return newId;
  });

  const activePin = (code || '').toUpperCase().trim();
  const channelRef = useRef<any>(null);

  // Conectar no canal Realtime da Fila do Laboratório
  useEffect(() => {
    if (!activePin) return;

    const channelName = `helpqueue_${activePin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'queue_updated' }, (event) => {
        if (event?.payload?.requests) {
          setActiveQueue(event.payload.requests);
        }
      })
      .on('broadcast', { event: 'session_reset' }, () => {
        setActiveQueue([]);
        setMyRequestId(null);
        localStorage.removeItem(`lab_help_req_id_${activePin}`);
        toast.info('O professor limpou a fila de atendimento.');
      })
      .on('broadcast', { event: 'state_sync' }, (event) => {
        if (event?.payload?.requests) {
          setActiveQueue(event.payload.requests);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Solicita a lista atual da fila
          channel.send({
            type: 'broadcast',
            event: 'request_state',
            payload: { voterId }
          }).catch(() => {});
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
  }, [activePin, voterId]);

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputPin.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    if (!clean) {
      toast.error('Digite o PIN da sala do laboratório!');
      return;
    }
    navigate(`/fila/${clean}`);
  };

  const handleSelectPc = (pc: string) => {
    setSelectedPc(pc);
    localStorage.setItem('lab_help_selected_pc', pc);
  };

  const handleNameChange = (val: string) => {
    setStudentName(val);
    localStorage.setItem('lab_help_student_name', val);
  };

  const handleSubmitHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePin) return;

    if (!studentName.trim()) {
      toast.error('Por favor, informe seu nome!');
      return;
    }

    if (!selectedPc) {
      toast.error('Por favor, selecione qual computador (PC) você está usando!');
      return;
    }

    setIsSubmitting(true);
    const newReqId = 'req_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);

    const newRequest: QueueItem = {
      id: newReqId,
      studentName: studentName.trim(),
      machineNumber: selectedPc,
      topic: topic.trim() || 'Dúvida na atividade prática',
      createdAt: Date.now(),
      status: 'waiting',
      voterId
    };

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'new_request',
          payload: newRequest
        });
      }

      setMyRequestId(newReqId);
      localStorage.setItem(`lab_help_req_id_${activePin}`, newReqId);
      setActiveQueue(prev => [...prev, newRequest]);
      toast.success(`Chamado enviado com sucesso para a máquina ${selectedPc}!`);
    } catch (err) {
      console.error('Erro ao enviar solicitação de ajuda:', err);
      toast.error('Não foi possível enviar a solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelMyRequest = async () => {
    if (!myRequestId || !activePin) return;

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'cancel_request',
          payload: { id: myRequestId, voterId }
        });
      }
      setMyRequestId(null);
      localStorage.removeItem(`lab_help_req_id_${activePin}`);
      setActiveQueue(prev => prev.filter(r => r.id !== myRequestId));
      toast.info('Solicitação de ajuda cancelada.');
    } catch (e) {
      toast.error('Erro ao cancelar solicitação.');
    }
  };

  const handleNewRequest = () => {
    setMyRequestId(null);
    localStorage.removeItem(`lab_help_req_id_${activePin}`);
    setTopic('');
  };

  // Se não foi informado código na URL: tela para digitar o PIN
  if (!activePin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-2 border border-indigo-500/30">
              <Hand className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Fila de Dúvidas do Lab</h1>
            <p className="text-sm text-slate-400">
              Digite o código ou PIN projetado na sala para entrar na fila de atendimento do laboratório.
            </p>
          </div>

          <Card className="bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleJoinByPin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                    PIN da Sala / Lab:
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Ex: 739102"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                      className="pl-11 text-center font-mono text-xl tracking-widest font-bold uppercase bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 h-12"
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base gap-2 shadow-lg shadow-indigo-600/30"
                >
                  Entrar no Laboratório
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Verificar se o aluno atual possui um chamado ativo
  const myCurrentRequest = activeQueue.find(r => r.id === myRequestId || (r.voterId && r.voterId === voterId));
  const waitingList = activeQueue.filter(r => r.status === 'waiting');
  const myPosition = myCurrentRequest && myCurrentRequest.status === 'waiting' 
    ? waitingList.findIndex(r => r.id === myCurrentRequest.id) + 1 
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2.5 py-1">
            LAB PIN: <span className="text-indigo-400 font-bold ml-1">{activePin}</span>
          </Badge>
          {isConnected ? (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[11px] gap-1.5 px-2 py-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Ao Vivo
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[11px] gap-1.5 px-2 py-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Conectando...
            </Badge>
          )}
        </div>

        <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
          <Hand className="w-3.5 h-3.5 text-amber-400" />
          Fila: {waitingList.length} aguardando
        </span>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto my-auto space-y-4">
        {/* TELA A: SE JÁ TEM CHAMADO ATIVO */}
        {myCurrentRequest ? (
          <div className="space-y-4 animate-in zoom-in-95">
            {myCurrentRequest.status === 'in_progress' ? (
              /* Status: O Professor está atendendo agora */
              <Card className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border-2 border-indigo-500 shadow-2xl text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center border-2 border-indigo-400 animate-bounce">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <Badge className="bg-indigo-600 text-white text-xs px-3 py-1">
                    🚀 EM ATENDIMENTO AGORA
                  </Badge>
                  <h2 className="text-2xl font-bold text-white pt-2">
                    O professor está indo ao seu {myCurrentRequest.machineNumber}!
                  </h2>
                  <p className="text-sm text-slate-300">
                    Aguarde na sua bancada para tirar sua dúvida.
                  </p>
                </div>
              </Card>
            ) : myCurrentRequest.status === 'resolved' ? (
              /* Status: Atendimento Concluído */
              <Card className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500 shadow-2xl text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <Badge className="bg-emerald-600 text-white text-xs px-3 py-1">
                    ✅ ATENDIMENTO CONCLUÍDO
                  </Badge>
                  <h2 className="text-xl font-bold text-white pt-2">
                    Dúvida finalizada com sucesso!
                  </h2>
                  <p className="text-xs text-slate-300">
                    Precisa de mais ajuda em outra etapa? Você pode solicitar um novo chamado.
                  </p>
                </div>

                <Button 
                  onClick={handleNewRequest}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-1.5"
                >
                  <Hand className="w-4 h-4" />
                  Pedir Nova Ajuda
                </Button>
              </Card>
            ) : (
              /* Status: Aguardando na Fila */
              <Card className="bg-slate-900/90 border-2 border-amber-500/50 shadow-2xl p-6 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/40 animate-pulse">
                    <Clock className="w-7 h-7" />
                  </div>
                  <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400 text-xs px-3 py-1">
                    ⏳ AGUARDANDO ATENDIMENTO
                  </Badge>
                  <div className="pt-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Sua Posição na Fila:</span>
                    <span className="text-4xl font-extrabold font-mono text-amber-400">
                      {myPosition > 0 ? `${myPosition}º Lugar` : 'Próximo'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Aluno:</span>
                    <span className="font-semibold text-white">{myCurrentRequest.studentName}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Máquina:</span>
                    <span className="font-mono font-bold text-indigo-400">{myCurrentRequest.machineNumber}</span>
                  </div>
                  {myCurrentRequest.topic && (
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-700/40">
                      <span className="text-slate-400">Assunto:</span>
                      <span className="text-slate-200 truncate max-w-[200px]">{myCurrentRequest.topic}</span>
                    </div>
                  )}
                </div>

                <p className="text-center text-xs text-slate-400">
                  O professor foi notificado com aviso sonoro e atenderá na sua vez.
                </p>

                <Button 
                  variant="outline"
                  onClick={handleCancelMyRequest}
                  className="w-full border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar Solicitação (Resolvi Sozinho)
                </Button>
              </Card>
            )}
          </div>
        ) : (
          /* TELA B: FORMULÁRIO COM OS 20 BOTÕES DE PC */
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">Solicitar Ajuda no Lab</h2>
              <p className="text-xs text-slate-400">
                Informe seu nome e toque no computador que você está usando:
              </p>
            </div>

            <Card className="bg-slate-900/90 border-slate-800 shadow-2xl">
              <CardContent className="pt-4 pb-5 space-y-4">
                <form onSubmit={handleSubmitHelp} className="space-y-4">
                  {/* Nome do Aluno */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Seu Nome:
                    </label>
                    <Input
                      type="text"
                      value={studentName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Matheus Ramos"
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-11 text-sm"
                      required
                    />
                  </div>

                  {/* Grade de 20 Botões de PCs do Laboratório */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                        Selecione seu Computador:
                      </label>
                      <Badge variant="secondary" className="font-mono text-xs bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        {selectedPc}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-52 overflow-y-auto p-1.5 bg-slate-950/60 rounded-xl border border-slate-800">
                      {PC_LIST.map((pc) => {
                        const isSelected = selectedPc === pc;
                        return (
                          <button
                            key={pc}
                            type="button"
                            onClick={() => handleSelectPc(pc)}
                            className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-900'
                                : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800/80'
                            }`}
                          >
                            <Monitor className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                            <span className="font-mono text-xs font-bold leading-none">{pc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dúvida Opcional */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Assunto / Dúvida breve (Opcional):
                    </label>
                    <Input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ex: Erro no SELECT do SQL, Git..."
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 h-10 text-xs"
                      maxLength={50}
                    />
                  </div>

                  {/* Botão de Envio */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !studentName.trim()}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
                  >
                    <Hand className="w-5 h-5" />
                    {isSubmitting ? 'Chamando...' : `Pedir Ajuda (${selectedPc})`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500">
        Informática BVA • Fila de Atendimento do Laboratório
      </footer>
    </div>
  );
}
