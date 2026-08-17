import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Hash, 
  Send,
  Lock,
  Radio,
  Check,
  Award,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickVoteState {
  title: string;
  subjectName?: string;
  isActive: boolean;
  average: number;
  totalVotes: number;
}

const SCORES = Array.from({ length: 11 }, (_, i) => i); // 0 a 10

const getScoreColor = (score: number) => {
  if (score <= 3) return 'bg-rose-500 hover:bg-rose-400 text-white border-rose-600';
  if (score <= 6) return 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-600';
  return 'bg-emerald-500 hover:bg-emerald-400 text-white border-emerald-600';
};

const getScoreBadgeColor = (score: number) => {
  if (score <= 3) return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  if (score <= 6) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
};

export default function QuickVotePublicPage() {
  const params = useParams<{ hash?: string; code?: string }>();
  const rawCode = params.hash || params.code || '';
  const navigate = useNavigate();

  const [inputPin, setInputPin] = useState('');
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('quickvote_voter_name') || '';
  });
  const [voteState, setVoteState] = useState<QuickVoteState>({
    title: 'Aguardando tópico de votação do professor...',
    subjectName: 'Turma',
    isActive: true,
    average: 0,
    totalVotes: 0
  });
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const [voterId] = useState(() => {
    const saved = localStorage.getItem('quickvote_voter_id');
    if (saved) return saved;
    const newId = 'voter_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('quickvote_voter_id', newId);
    return newId;
  });

  const activePin = rawCode.toUpperCase().trim();
  const channelRef = useRef<any>(null);

  // Inscrição Realtime no canal da Votação Rápida
  useEffect(() => {
    if (!activePin) return;

    // Recupera nota anterior
    const savedScore = localStorage.getItem(`quickvote_score_${activePin}`);
    if (savedScore !== null && savedScore !== undefined) {
      setSelectedScore(Number(savedScore));
    } else {
      setSelectedScore(null);
    }

    const channelName = `quickvote_${activePin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'vote_state' }, (event) => {
        if (event?.payload) {
          setVoteState(event.payload);
        }
      })
      .on('broadcast', { event: 'vote_reset' }, (event) => {
        if (event?.payload) {
          setVoteState(event.payload);
        }
        setSelectedScore(null);
        localStorage.removeItem(`quickvote_score_${activePin}`);
        toast.info('O professor iniciou uma nova rodada de votação!');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Solicita o estado atual da votação para o professor
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
      toast.error('Digite o PIN da votação!');
      return;
    }
    navigate(`/votar/${clean}`);
  };

  const handleNameChange = (val: string) => {
    setStudentName(val);
    localStorage.setItem('quickvote_voter_name', val);
  };

  const handleVote = async (score: number) => {
    if (!activePin || !voteState.isActive) return;

    setIsSubmitting(true);
    const previousScore = selectedScore;
    setSelectedScore(score);
    localStorage.setItem(`quickvote_score_${activePin}`, score.toString());

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'submit_vote',
          payload: {
            score,
            previousScore: previousScore !== null ? previousScore : null,
            voterName: studentName.trim() || 'Aluno Anônimo',
            voterId,
            timestamp: Date.now()
          }
        });
      }
      toast.success(`Nota ${score} enviada com sucesso!`);
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
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 mb-2 border border-amber-500/30">
              <Star className="w-8 h-8 fill-amber-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Votação Rápida (0 a 10)</h1>
            <p className="text-sm text-slate-400">
              Digite o código PIN projetado pelo professor para avaliar a aula de 0 a 10.
            </p>
          </div>

          <Card className="bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleJoinByPin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                    PIN da Votação:
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Ex: 842190"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                      className="pl-11 text-center font-mono text-xl tracking-widest font-bold uppercase bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-amber-500 h-12"
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-base gap-2 shadow-lg shadow-amber-600/30"
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2.5 py-1">
            PIN: <span className="text-amber-400 font-bold ml-1">{activePin}</span>
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

        {voteState.isActive ? (
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
        {/* Tópico da Votação */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 shadow-xl text-center space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Tema da Avaliação:
          </p>
          <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
            {voteState.title}
          </h2>
          {voteState.subjectName && (
            <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700 bg-slate-800/60">
              {voteState.subjectName}
            </Badge>
          )}
        </div>

        {/* Identificação do Aluno */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <label className="text-xs text-slate-400 block font-medium">Seu Nome (Opcional):</label>
          <Input
            value={studentName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Matheus Ramos"
            className="h-9 bg-slate-800/80 border-slate-700 text-xs text-white placeholder:text-slate-500"
            maxLength={40}
          />
        </div>

        {/* Grade de Notas de 0 a 10 */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>Escolha sua nota:</span>
            <span className="text-[11px] text-slate-400 font-normal">0 (Mínimo) a 10 (Máximo)</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {SCORES.map((score) => {
              const isSelected = selectedScore === score;
              return (
                <button
                  key={score}
                  type="button"
                  disabled={isSubmitting || !voteState.isActive}
                  onClick={() => handleVote(score)}
                  className={`h-14 rounded-xl font-mono font-bold text-lg border-2 transition-all flex flex-col items-center justify-center relative active:scale-95 shadow-sm ${
                    isSelected
                      ? `${getScoreColor(score)} ring-4 ring-amber-400/40 scale-105 shadow-lg`
                      : 'bg-slate-800 text-white border-slate-700 hover:border-amber-400 hover:bg-slate-700'
                  } ${!voteState.isActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <span>{score}</span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-white text-slate-950 flex items-center justify-center text-[8px] font-black">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dica da escala */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-medium border-t border-slate-800">
            <span className="text-rose-400">0 - 3: Precisa Melhorar</span>
            <span className="text-amber-400">4 - 6: Regular/Bom</span>
            <span className="text-emerald-400">7 - 10: Excelente</span>
          </div>
        </div>

        {/* Status do Voto e Média Parcial */}
        {selectedScore !== null ? (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-white">Sua nota:</span>
              <Badge className={`text-base font-black px-2.5 py-0.5 ${getScoreBadgeColor(selectedScore)}`}>
                {selectedScore}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Você pode tocar em outra nota acima para alterar sua avaliação a qualquer momento.
            </p>
          </div>
        ) : (
          <p className="text-center text-[11px] text-slate-500">
            Toque em uma nota de 0 a 10 para computar sua avaliação no telão.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500">
        Informática BVA • Votação Rápida de 0 a 10
      </footer>
    </div>
  );
}
