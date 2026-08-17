import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Trophy, 
  Hash, 
  PartyPopper,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentPickerJoinPage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [inputPin, setInputPin] = useState('');
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('picker_student_name') || '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasJoined, setHasJoined] = useState(() => {
    const saved = localStorage.getItem(`picker_joined_${(code || '').toUpperCase()}`);
    return saved === 'true';
  });
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [voterId] = useState(() => {
    const saved = localStorage.getItem('picker_voter_id');
    if (saved) return saved;
    const newId = 'picker_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('picker_voter_id', newId);
    return newId;
  });

  const activePin = (code || '').toUpperCase().trim();
  const channelRef = useRef<any>(null);

  // Inscrição Realtime no canal do Sorteio
  useEffect(() => {
    if (!activePin) return;

    const channelName = `studentpicker_${activePin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'winner_picked' }, (event) => {
        const picked = event?.payload?.studentName;
        if (picked) {
          setWinnerName(picked);
          if (picked.toLowerCase() === studentName.trim().toLowerCase()) {
            toast.success('🎉 VOCÊ FOI SORTEADO(A) PELO PROFESSOR!', {
              duration: 8000
            });
          }
        }
      })
      .on('broadcast', { event: 'session_reset' }, () => {
        setHasJoined(false);
        setWinnerName(null);
        localStorage.removeItem(`picker_joined_${activePin}`);
        toast.info('O professor iniciou uma nova rodada de sorteio!');
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
  }, [activePin, studentName]);

  const handleJoinByPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputPin.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
    if (!clean) {
      toast.error('Digite o PIN da sala de sorteio!');
      return;
    }
    navigate(`/sorteio/${clean}`);
  };

  const handleNameChange = (val: string) => {
    setStudentName(val);
    localStorage.setItem('picker_student_name', val);
  };

  const handleJoinPicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePin) return;

    const cleanName = studentName.trim();
    if (!cleanName) {
      toast.error('Por favor, informe seu nome completo!');
      return;
    }

    setIsSubmitting(true);

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'join_picker',
          payload: {
            studentName: cleanName,
            voterId,
            timestamp: Date.now()
          }
        });
      }

      setHasJoined(true);
      localStorage.setItem(`picker_joined_${activePin}`, 'true');
      toast.success('Você entrou na lista do sorteio com sucesso!');
    } catch (err) {
      console.error('Erro ao entrar no sorteio:', err);
      toast.error('Não foi possível entrar no sorteio. Tente novamente.');
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
              <UserCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sorteador da Turma</h1>
            <p className="text-sm text-slate-400">
              Digite o código ou PIN projetado na sala para entrar na lista do sorteio ao vivo.
            </p>
          </div>

          <Card className="bg-slate-900/90 border-slate-800 shadow-2xl backdrop-blur-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleJoinByPin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                    PIN do Sorteio:
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Ex: 932145"
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
                  Entrar no Sorteio
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isMeWinner = winnerName && winnerName.toLowerCase() === studentName.trim().toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2.5 py-1">
            SALA: <span className="text-amber-400 font-bold ml-1">{activePin}</span>
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
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Sorteio da Aula
        </span>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto my-auto space-y-4">
        {/* TELA A: SE O ALUNO É O VENCEDOR */}
        {isMeWinner ? (
          <Card className="bg-gradient-to-br from-amber-950 via-slate-900 to-amber-950/60 border-2 border-amber-400 shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-90">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border-4 border-amber-400 shadow-lg shadow-amber-500/30 animate-bounce">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
            <div className="space-y-1">
              <Badge className="bg-amber-500 text-slate-950 font-black text-xs px-3 py-1 uppercase tracking-wider">
                👑 VOCÊ FOI O ESCOLHIDO!
              </Badge>
              <h2 className="text-2xl font-black text-white pt-2">
                Parabéns, {studentName}!
              </h2>
              <p className="text-xs text-amber-200">
                Seu nome foi sorteado no telão da aula. Prepare-se para responder ou apresentar!
              </p>
            </div>
          </Card>
        ) : hasJoined ? (
          /* TELA B: ALUNO CONFIRMADO NA LISTA */
          <Card className="bg-slate-900/90 border-2 border-emerald-500/40 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-400 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 font-semibold">
                ✅ INSCRITO NO SORTEIO
              </Badge>
              <h2 className="text-xl font-bold text-white pt-1">
                {studentName}
              </h2>
              <p className="text-xs text-slate-400">
                Seu nome está na lista do professor. Acompanhe a roleta no telão da sala!
              </p>
            </div>

            {winnerName && !isMeWinner && (
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center space-y-1">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Último sorteado na rodada:</span>
                <p className="font-bold text-sm text-amber-400 flex items-center justify-center gap-1.5">
                  <PartyPopper className="w-4 h-4" />
                  {winnerName}
                </p>
              </div>
            )}
          </Card>
        ) : (
          /* TELA C: FORMULÁRIO PARA DIGITAR NOME */
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">Entrar no Sorteador</h2>
              <p className="text-xs text-slate-400">
                Digite seu nome para ser incluído na roleta de sorteio do professor:
              </p>
            </div>

            <Card className="bg-slate-900/90 border-slate-800 shadow-2xl">
              <CardContent className="pt-5 pb-5">
                <form onSubmit={handleJoinPicker} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Seu Nome Completo:
                    </label>
                    <Input
                      type="text"
                      value={studentName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Ex: Ana Clara Silva"
                      className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-amber-500 h-12 text-base font-semibold"
                      maxLength={40}
                      autoFocus
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !studentName.trim()}
                    className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-bold text-base gap-2 shadow-lg shadow-amber-600/30 transition-all active:scale-[0.98]"
                  >
                    <PartyPopper className="w-5 h-5" />
                    {isSubmitting ? 'Entrando...' : 'Entrar no Sorteio'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500">
        Informática BVA • Sorteador da Turma em Tempo Real
      </footer>
    </div>
  );
}
