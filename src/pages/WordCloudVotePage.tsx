import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  School,
  Hash,
  MessageSquarePlus,
  History
} from 'lucide-react';
import { toast } from 'sonner';

export default function WordCloudVotePage() {
  const { code } = useParams<{ code?: string }>();
  const navigate = useNavigate();

  const [inputPin, setInputPin] = useState('');
  const [topic, setTopic] = useState<string>('Aguardando tema da nuvem...');
  const [word, setWord] = useState('');
  const [myWords, setMyWords] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [voterId] = useState(() => {
    const saved = localStorage.getItem('wordcloud_voter_id');
    if (saved) return saved;
    const newId = 'voter_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('wordcloud_voter_id', newId);
    return newId;
  });

  const activePin = (code || '').toUpperCase().trim();
  const channelRef = useRef<any>(null);

  // Carrega histórico de palavras enviadas pelo aluno nesta sala
  useEffect(() => {
    if (!activePin) return;

    try {
      const saved = localStorage.getItem(`wordcloud_my_words_${activePin}`);
      if (saved) {
        setMyWords(JSON.parse(saved));
      } else {
        setMyWords([]);
      }
    } catch {
      setMyWords([]);
    }

    const channelName = `wordcloud_${activePin}`;
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
        setMyWords([]);
        localStorage.removeItem(`wordcloud_my_words_${activePin}`);
        toast.info('O professor limpou a nuvem para uma nova dinâmica!');
      })
      .on('broadcast', { event: 'state_sync' }, (event) => {
        if (event?.payload?.topic) {
          setTopic(event.payload.topic);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // Pede o tema atual para o professor
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
    navigate(`/nuvem/${clean}`);
  };

  const handleSendWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePin) return;

    const cleanWord = word.trim().replace(/\s+/g, ' ');
    if (!cleanWord) {
      toast.error('Digite uma palavra ou termo!');
      return;
    }

    if (cleanWord.length > 35) {
      toast.error('O termo deve ter no máximo 35 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'new_word',
          payload: {
            voterId,
            word: cleanWord,
            timestamp: Date.now()
          }
        });
      }

      const updated = [cleanWord, ...myWords];
      setMyWords(updated);
      localStorage.setItem(`wordcloud_my_words_${activePin}`, JSON.stringify(updated));
      setWord('');
      toast.success(`"${cleanWord}" enviado para a nuvem!`);
    } catch (err) {
      console.error('Erro ao enviar palavra via realtime:', err);
      toast.error('Não foi possível enviar a palavra. Tente novamente.');
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
            <div className="inline-flex p-3 rounded-2xl bg-purple-500/20 text-purple-400 mb-2 border border-purple-500/30">
              <Cloud className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Nuvem de Ideias</h1>
            <p className="text-sm text-slate-400">
              Digite o código ou PIN da sala para enviar suas palavras para a tela do professor.
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
                      placeholder="Ex: 592810"
                      value={inputPin}
                      onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                      className="pl-11 text-center font-mono text-xl tracking-widest font-bold uppercase bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-purple-500 h-12"
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-base gap-2 shadow-lg shadow-purple-600/30"
                >
                  Entrar no Brainstorm
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tela principal de envio de palavras no celular do aluno
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-2 pb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-300 border border-slate-700 font-mono text-xs px-2.5 py-1">
            SALA: <span className="text-purple-400 font-bold ml-1">{activePin}</span>
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
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Envio Anônimo
        </span>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto my-auto space-y-5">
        {/* Caixa com o tema do Brainstorm */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-900 border border-purple-500/30 shadow-xl text-center space-y-1.5">
          <p className="text-[11px] uppercase tracking-wider text-purple-400 font-semibold">
            Tema / Pergunta da Turma:
          </p>
          <h2 className="text-lg font-bold text-white leading-snug">
            {topic}
          </h2>
        </div>

        {/* Formulário de Envio de Palavra */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
          <CardContent className="pt-5 pb-5">
            <form onSubmit={handleSendWord} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Sua contribuição (palavra ou termo curto):
                </label>
                <div className="relative">
                  <MessageSquarePlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="Ex: Inteligência Artificial, React..."
                    className="pl-10 bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-purple-500 h-12 text-base"
                    maxLength={35}
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
                  <span>Pode enviar quantas ideias quiser</span>
                  <span>{word.length}/35</span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !word.trim()}
                className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold text-base gap-2 shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar para a Nuvem'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Histórico das Minhas Palavras Enviadas */}
        {myWords.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <History className="w-3.5 h-3.5 text-purple-400" />
                Suas contribuições nesta aula ({myWords.length}):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {myWords.map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-purple-500/15 text-purple-300 border border-purple-500/20 text-xs py-1 px-2.5 gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-purple-400" />
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto pt-4 pb-2 text-center text-[11px] text-slate-500">
        Informática BVA • Nuvem de Palavras Coletiva em Tempo Real
      </footer>
    </div>
  );
}
