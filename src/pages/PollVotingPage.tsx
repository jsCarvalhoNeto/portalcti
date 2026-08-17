import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Hash, 
  Send,
  Lock,
  Radio,
  Check,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollState {
  title: string;
  options: PollOption[];
  isActive: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function PollVotingPage() {
  const params = useParams<{ code?: string; pollId?: string }>();
  const rawCode = params.code || params.pollId || '';
  const navigate = useNavigate();

  const [inputPin, setInputPin] = useState('');
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('poll_voter_name') || '';
  });
  const [poll, setPoll] = useState<PollState>({
    title: 'Aguardando pergunta do professor...',
    options: [],
    isActive: true
  });
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [voterId] = useState(() => {
    const saved = localStorage.getItem('poll_voter_id');
    if (saved) return saved;
    const newId = 'voter_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('poll_voter_id', newId);
    return newId;
  });

  const activePin = rawCode.toUpperCase().trim();
  const channelRef = useRef<any>(null);

  // Inscrição Realtime no canal da Enquete
  useEffect(() => {
    if (!activePin) return;

    // Recupera voto anterior
    const savedOption = localStorage.getItem(`poll_voted_${activePin}`);
    if (savedOption) {
      setSelectedOptionId(savedOption);
    } else {
      setSelectedOptionId(null);
    }

    const channelName = `poll_${activePin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'poll_state' }, (event) => {
        if (event?.payload) {
          setPoll(event.payload);
        }
      })
      .on('broadcast', { event: 'poll_reset' }, (event) => {
        if (event?.payload) {
          setPoll(event.payload);
        }
        setSelectedOptionId(null);
        localStorage.removeItem(`poll_voted_${activePin}`);
        toast.info('O professor iniciou uma nova rodada de votação!');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Solicita o estado da enquete para o professor
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
      toast.error('Digite o PIN da enquete!');
      return;
    }
    navigate(`/enquete/${clean}`);
  };

  const handleNameChange = (val: string) => {
    setStudentName(val);
    localStorage.setItem('poll_voter_name', val);
  };

  const handleVote = async (optionId: string) => {
    if (!activePin || !poll.isActive) return;

    setIsSubmitting(true);
    const previousOptionId = selectedOptionId;
    setSelectedOptionId(optionId);
    localStorage.setItem(`poll_voted_${activePin}`, optionId);

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'vote_poll',
          payload: {
            optionId,
            previousOptionId: previousOptionId || null,
            voterName: studentName.trim() || 'Aluno Anônimo',
            voterId,
            timestamp: Date.now()
          }
        });
      }
      toast.success('Voto computado com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar voto:', err);
      toast.error('Não foi possível enviar o voto. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se não foi informado código na URL: tela para digitar o PIN
  if (!activePin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/20 text-blue-400 mb-2 border border-blue-500/30">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Pesquisa Online</h1>
            <p className="text-sm text-slate-400">
              Digite o código ou PIN da enquete projetado pelo professor para votar ao vivo.
            </p>
          </div>

          <Card className="bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleJoinByPin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                    PIN da Enquete:
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Ex: 518290"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                      className="pl-11 text-center font-mono text-xl tracking-widest font-bold uppercase bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 h-12"
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base gap-2 shadow-lg shadow-blue-600/30"
                >
                  Entrar na Votação
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2.5 py-1">
            PIN: <span className="text-blue-400 font-bold ml-1">{activePin}</span>
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

        {poll.isActive ? (
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs gap-1 font-semibold">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            Votação Aberta
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs gap-1">
            <Lock className="w-3 h-3" />
            Encerrada
          </Badge>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto my-auto space-y-4">
        {/* Caixa com o título/pergunta da enquete */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-900 border border-blue-500/30 shadow-xl text-center space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-blue-400 font-semibold flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Pergunta da Enquete:
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
            {poll.title}
          </h2>
        </div>

        {/* Identificação do Aluno */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <label className="text-xs text-slate-400 block font-medium">Seu Nome (Opcional):</label>
          <Input
            value={studentName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Ana Beatriz"
            className="h-9 bg-slate-800/80 border-slate-700 text-xs text-white placeholder:text-slate-500"
            maxLength={40}
          />
        </div>

        {/* Lista de Opções de Voto */}
        {poll.options.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs">Carregando opções da enquete do professor...</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {poll.options.map((option, index) => {
              const letter = OPTION_LETTERS[index % OPTION_LETTERS.length];
              const isSelected = selectedOptionId === option.id;
              const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isSubmitting || !poll.isActive}
                  onClick={() => handleVote(option.id)}
                  className={`w-full p-3.5 rounded-2xl text-left border-2 transition-all flex flex-col gap-2 relative overflow-hidden active:scale-[0.98] ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-400 ring-2 ring-blue-500/30 shadow-lg shadow-blue-950'
                      : 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50'
                  } ${!poll.isActive ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl font-bold font-mono text-sm flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-blue-500 text-white shadow-sm' 
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {letter}
                      </div>
                      <span className="font-semibold text-sm text-white leading-tight">
                        {option.text}
                      </span>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 animate-in zoom-in-75">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Barra de porcentagem se já votou */}
                  {selectedOptionId && (
                    <div className="relative z-10 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>{option.votes} {option.votes === 1 ? 'voto' : 'votos'}</span>
                        <span className="font-bold text-blue-300">{percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSelected ? 'bg-blue-500' : 'bg-slate-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Status do Voto */}
        {selectedOptionId ? (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <p className="text-xs text-slate-300">
              ✅ <span className="font-semibold text-white">Voto registrado!</span> Você pode tocar em outra opção para alterar sua resposta se desejar.
            </p>
          </div>
        ) : (
          <p className="text-center text-[11px] text-slate-500">
            Toque na opção desejada para computar seu voto na enquete da turma.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500">
        Informática BVA • Pesquisa Online em Tempo Real
      </footer>
    </div>
  );
}
