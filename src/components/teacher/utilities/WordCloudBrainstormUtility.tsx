import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Cloud, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  Copy, 
  Check, 
  TrendingUp, 
  QrCode, 
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

interface WordItem {
  id: string;
  text: string;
  count: number;
}

const INITIAL_WORDS: WordItem[] = [
  { id: '1', text: 'Inovação', count: 8 },
  { id: '2', text: 'Inteligência Artificial', count: 7 },
  { id: '3', text: 'Banco de Dados', count: 5 },
  { id: '4', text: 'React', count: 4 },
  { id: '5', text: 'Node.js', count: 3 },
  { id: '6', text: 'Git & GitHub', count: 3 }
];

const COLORS = [
  'text-indigo-600 dark:text-indigo-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-rose-600 dark:text-rose-400',
  'text-amber-600 dark:text-amber-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-purple-600 dark:text-purple-400',
  'text-pink-600 dark:text-pink-400',
  'text-violet-600 dark:text-violet-400',
  'text-teal-600 dark:text-teal-400'
];

export default function WordCloudBrainstormUtility() {
  const [topic, setTopic] = useState('Quais tecnologias e habilidades mais definem o futuro da Informática?');
  const [words, setWords] = useState<WordItem[]>(INITIAL_WORDS);
  const [newWord, setNewWord] = useState('');
  const [copied, setCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PIN da Sessão (6 dígitos)
  const [sessionPin, setSessionPin] = useState(() => {
    const saved = sessionStorage.getItem('wordcloud_session_pin');
    if (saved) return saved;
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('wordcloud_session_pin', newPin);
    return newPin;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const topicRef = useRef(topic);
  topicRef.current = topic;

  // URL compartilhável para os alunos
  const voteUrl = `${window.location.origin}/nuvem/${sessionPin}`;

  const totalResponses = words.reduce((acc, curr) => acc + curr.count, 0);
  const maxCount = Math.max(...words.map(w => w.count), 1);

  // Inscrição no canal Realtime do Supabase
  useEffect(() => {
    if (!sessionPin) return;

    const channelName = `wordcloud_${sessionPin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'new_word' }, (event) => {
        const payload = event?.payload;
        if (payload && payload.word) {
          const incomingText = String(payload.word).trim();
          if (!incomingText) return;

          setWords(prev => {
            const existingIdx = prev.findIndex(
              w => w.text.toLowerCase() === incomingText.toLowerCase()
            );

            if (existingIdx !== -1) {
              const updated = [...prev];
              updated[existingIdx] = {
                ...updated[existingIdx],
                count: updated[existingIdx].count + 1
              };
              return updated;
            } else {
              return [
                ...prev,
                {
                  id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                  text: incomingText,
                  count: 1
                }
              ];
            }
          });

          toast.info(`Nova palavra adicionada à nuvem: "${incomingText}"`, {
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

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newWord.trim();
    if (!clean) return;

    const existingIdx = words.findIndex(w => w.text.toLowerCase() === clean.toLowerCase());
    if (existingIdx !== -1) {
      const updated = [...words];
      updated[existingIdx].count += 1;
      setWords(updated);
    } else {
      setWords([...words, { id: Date.now().toString(), text: clean, count: 1 }]);
    }
    setNewWord('');
    toast.success(`"${clean}" adicionado à nuvem!`);
  };

  const handleIncrement = (id: string) => {
    setWords(words.map(w => w.id === id ? { ...w, count: w.count + 1 } : w));
  };

  const handleReset = () => {
    if (confirm('Deseja limpar todas as palavras da nuvem?')) {
      setWords([]);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'session_reset',
          payload: {}
        }).catch(() => {});
      }
      toast.success('Nuvem limpa para uma nova dinâmica!');
    }
  };

  const handleGenerateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('wordcloud_session_pin', newPin);
    setSessionPin(newPin);
    setWords([]);
    toast.success(`Nova sala de brainstorm criada: PIN ${newPin}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopied(true);
      toast.success('Link da nuvem copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const handleCopySummary = () => {
    const sorted = [...words].sort((a, b) => b.count - a.count);
    const text = `Nuvem de Palavras: "${topic}"\n\n` + sorted.map(w => `• ${w.text}: ${w.count} menções`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Resumo copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-8 bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between' : ''}`} ref={containerRef}>
      {/* Topo do Brainstorming */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-purple-500 text-white gap-1">
              <Cloud className="w-3.5 h-3.5" />
              Nuvem de Palavras Coletiva
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

            <Badge variant="outline" className="border-white/20 text-purple-200 bg-white/5 text-xs gap-1">
              <Users className="w-3 h-3" />
              {totalResponses} respostas computadas
            </Badge>
          </div>

          <div>
            <span className="text-xs text-purple-300">Tema ou Pergunta do Brainstorm:</span>
            {isFullscreen ? (
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-1">
                {topic}
              </h2>
            ) : (
              <Input
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                className="mt-1 bg-white/10 border-white/20 text-white font-semibold text-base focus-visible:ring-purple-400"
                placeholder="Ex: Em uma palavra, qual tecnologia mais te surpreendeu hoje?"
              />
            )}
          </div>
        </div>

        {/* Botões de Ação do Professor */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Button
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 text-xs gap-1.5 font-semibold"
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
            onClick={handleCopySummary}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar Resumo'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Banner de Acesso Rápido para Sala de Aula */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-300 font-medium">
              Os alunos podem enviar ideias pelo celular acessando o link ou digitando o PIN:
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded border border-purple-500/30">
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
            Testar Envio
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

      {/* Grid Principal: Nuvem + Inserção de Palavras */}
      <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 flex-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* A Nuvem Visual */}
        <Card className={`${isFullscreen ? 'col-span-1 min-h-[60vh] flex flex-col justify-center' : 'lg:col-span-2'} border-2 border-border/80 shadow-md`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Nuvem de Ideias da Turma
            </CardTitle>
            <span className="text-xs text-muted-foreground font-mono font-medium">Tamanho proporcional à frequência ({words.length} termos únicos)</span>
          </CardHeader>
          <CardContent className="p-6">
            {words.length === 0 ? (
              <div className="p-16 text-center text-muted-foreground space-y-2">
                <Cloud className="w-12 h-12 mx-auto opacity-40 text-purple-500" />
                <p className="font-semibold text-foreground">A nuvem está vazia</p>
                <p className="text-xs">Projete o QR Code ou adicione palavras ao lado para começar!</p>
              </div>
            ) : (
              <div className={`rounded-2xl bg-gradient-to-br from-card via-card to-muted/30 border border-border/60 flex flex-wrap items-center justify-center gap-4 sm:gap-8 select-none transition-all ${
                isFullscreen ? 'min-h-[55vh] p-10 gap-8 sm:gap-12' : 'min-h-[340px] p-8'
              }`}>
                {words.map((item, index) => {
                  const ratio = item.count / maxCount;
                  let sizeClass = 'text-xs font-medium';
                  
                  if (isFullscreen) {
                    if (ratio >= 0.8) sizeClass = 'text-5xl sm:text-7xl font-black tracking-tight drop-shadow-sm';
                    else if (ratio >= 0.5) sizeClass = 'text-4xl sm:text-5xl font-extrabold';
                    else if (ratio >= 0.3) sizeClass = 'text-2xl sm:text-3xl font-bold';
                    else sizeClass = 'text-base sm:text-xl font-medium';
                  } else {
                    if (ratio >= 0.8) sizeClass = 'text-3xl sm:text-5xl font-extrabold tracking-tight';
                    else if (ratio >= 0.5) sizeClass = 'text-2xl sm:text-3xl font-bold';
                    else if (ratio >= 0.3) sizeClass = 'text-lg sm:text-xl font-semibold';
                    else sizeClass = 'text-sm sm:text-base font-medium';
                  }

                  const colorClass = COLORS[index % COLORS.length];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleIncrement(item.id)}
                      className={`transition-all duration-300 hover:scale-125 cursor-pointer flex items-center gap-2 ${sizeClass} ${colorClass} animate-in zoom-in-75`}
                      title={`Clique para adicionar +1 voto (${item.count} votos)`}
                    >
                      <span>{item.text}</span>
                      <span className="text-[11px] font-mono opacity-60 font-normal">({item.count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna Direita (Ocultada em Tela Cheia para focar 100% na Nuvem) */}
        {!isFullscreen && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-500" />
                  Adicionar Palavra Manual
                </CardTitle>
                <CardDescription>Inserir direto pelo painel do professor</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddWord} className="space-y-3">
                  <Input
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Ex: Lógica de Programação"
                    className="text-sm"
                    maxLength={35}
                    required
                  />
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-1.5">
                    <Plus className="w-4 h-4" />
                    Enviar para a Nuvem
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Ranking dos Mais Citados */}
            {words.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                    Termos Mais Votados ({words.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {[...words]
                    .sort((a, b) => b.count - a.count)
                    .map((item, i) => (
                      <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 hover:bg-muted/80 transition-colors">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 font-bold font-mono text-muted-foreground">{i + 1}º</span>
                          <span className="truncate font-medium">{item.text}</span>
                        </div>
                        <Badge variant="secondary" className="font-mono text-xs ml-2 shrink-0 bg-purple-500/15 text-purple-600 dark:text-purple-300">
                          {item.count} {item.count === 1 ? 'voto' : 'votos'}
                        </Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Modal de Projeção / QR Code para Data-Show */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-xl p-6 sm:p-8 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-500/20 text-purple-400 mx-auto border border-purple-500/30">
              <Tv className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Nuvem de Palavras Coletiva
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Aponte a câmera do seu celular para o QR Code abaixo para enviar suas ideias ao vivo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-5 my-2">
            {/* Tópico atual em destaque */}
            <div className="w-full text-center p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] uppercase tracking-wider text-purple-400 font-semibold block mb-0.5">
                Tema / Pergunta da Turma:
              </span>
              <p className="text-base font-semibold text-white">
                {topic}
              </p>
            </div>

            {/* QR Code com borda e fundo branco */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-purple-500/30 animate-in zoom-in-90">
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
                <span className="font-mono text-2xl font-extrabold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
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
              className="w-full bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link da Nuvem'}
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
