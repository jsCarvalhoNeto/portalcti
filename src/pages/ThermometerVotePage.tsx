import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Smile, 
  Meh, 
  Frown, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  School,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';

type VoteType = 'understood' | 'doubts' | 'lost';

export default function ThermometerVotePage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [inputPin, setInputPin] = useState('');
  const [topic, setTopic] = useState<string>('Aguardando tópico da aula...');
  const [currentVote, setCurrentVote] = useState<VoteType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [voterId] = useState(() => {
    const saved = localStorage.getItem('thermometer_voter_id');
    if (saved) return saved;
    const newId = 'voter_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('thermometer_voter_id', newId);
    return newId;
  });

  const activePin = (code || '').toUpperCase().trim();
  const channelRef = useRef<any>(null);

  // Se tem código na URL, conecta no canal Realtime
  useEffect(() => {
    if (!activePin) return;

    // Recupera voto anterior da sessão se houver
    const savedVote = localStorage.getItem(`thermometer_vote_${activePin}`);
    if (savedVote && ['understood', 'doubts', 'lost'].includes(savedVote)) {
      setCurrentVote(savedVote as VoteType);
    } else {
      setCurrentVote(null);
    }

    const channelName = `thermometer_${activePin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'topic_update' }, (event) => {
        if (event?.payload?.topic) {
          setTopic(event.payload.topic);
        }
      })
      .on('broadcast', { event: 'session_reset' }, () => {
        setCurrentVote(null);
        localStorage.removeItem(`thermometer_vote_${activePin}`);
        toast.info('O professor iniciou uma nova rodada de votação!');
      })
      .on('broadcast', { event: 'state_sync' }, (event) => {
        if (event?.payload?.topic) {
          setTopic(event.payload.topic);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Pede o estado atual da aula para o professor
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
      toast.error('Digite o código ou PIN da sala!');
      return;
    }
    navigate(`/termometro/${clean}`);
  };

  const handleSendVote = async (type: VoteType) => {
    if (!activePin) return;

    setIsSubmitting(true);
    const previousVote = currentVote;
    setCurrentVote(type);
    localStorage.setItem(`thermometer_vote_${activePin}`, type);

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'vote',
          payload: {
            voterId,
            type,
            previousVote: previousVote || null,
            timestamp: Date.now()
          }
        });
      }
      toast.success('Voto computado com sucesso!');
    } catch (err) {
      console.error('Erro ao enviar voto via realtime:', err);
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
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 mb-2 border border-indigo-500/30">
              <School className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Termômetro da Aula</h1>
            <p className="text-sm text-slate-400">
              Digite o código ou PIN projetado pelo professor para participar da votação ao vivo.
            </p>
          </div>

          <Card className="bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleJoinByPin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                    Código da Sala / PIN:
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Ex: 849201"
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

  // Tela principal de votação no celular do aluno
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2.5 py-1">
            SALA: <span className="text-indigo-400 font-bold ml-1">{activePin}</span>
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
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Voto Anônimo
        </span>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto my-auto space-y-5">
        {/* Caixa com o tópico avaliado */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl text-center space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">
            Pergunta / Tópico da Aula:
          </p>
          <h2 className="text-lg font-bold text-white leading-snug">
            {topic}
          </h2>
        </div>

        <p className="text-center text-xs text-slate-400">
          Como você está se sentindo em relação a esta explicação?
        </p>

        {/* Os 3 Cartões de Voto Gigantes para Celular */}
        <div className="space-y-3.5">
          {/* Opção 1: Entendi Tudo */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSendVote('understood')}
            className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between gap-3 active:scale-[0.98] ${
              currentVote === 'understood'
                ? 'bg-emerald-600/25 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950'
                : 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/60'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentVote === 'understood' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                <Smile className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base text-emerald-400">Entendi Tudo!</h3>
                <p className="text-xs text-slate-300">Dominei o conceito e posso avançar</p>
              </div>
            </div>
            {currentVote === 'understood' && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white animate-in zoom-in-75">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </button>

          {/* Opção 2: Tenho Dúvidas */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSendVote('doubts')}
            className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between gap-3 active:scale-[0.98] ${
              currentVote === 'doubts'
                ? 'bg-amber-600/25 border-amber-400 ring-2 ring-amber-500/30 shadow-lg shadow-amber-950'
                : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/60'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentVote === 'doubts' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Meh className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base text-amber-400">Tenho Dúvidas</h3>
                <p className="text-xs text-slate-300">Mais ou menos, preciso de mais 1 exemplo</p>
              </div>
            </div>
            {currentVote === 'doubts' && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white animate-in zoom-in-75">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </button>

          {/* Opção 3: Estou Perdido */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSendVote('lost')}
            className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center justify-between gap-3 active:scale-[0.98] ${
              currentVote === 'lost'
                ? 'bg-rose-600/25 border-rose-400 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950'
                : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/60'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                currentVote === 'lost' 
                  ? 'bg-rose-500 text-white' 
                  : 'bg-rose-500/20 text-rose-400'
              }`}>
                <Frown className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base text-rose-400">Estou Perdido</h3>
                <p className="text-xs text-slate-300">Não entendi e preciso de revisão</p>
              </div>
            </div>
            {currentVote === 'lost' && (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white animate-in zoom-in-75">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>

        {/* Status do Voto do Aluno */}
        {currentVote ? (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
            <p className="text-xs text-slate-300">
              ✅ <span className="font-semibold text-white">Voto registrado!</span> Você pode tocar em outra opção para atualizar sua reação a qualquer momento.
            </p>
          </div>
        ) : (
          <p className="text-center text-[11px] text-slate-500">
            Toque em um dos botões acima para enviar seu feedback instantâneo ao professor.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500">
        Informática BVA • Termômetro de Compreensão em Tempo Real
      </footer>
    </div>
  );
}
