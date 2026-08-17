import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  UserCheck, 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  Users, 
  CheckCircle2, 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Tv, 
  Radio, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Trophy, 
  PartyPopper,
  Loader2,
  Database,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabaseClient';
import { getStudentsByGrade } from '@/services/studentService';
import { toast } from 'sonner';

type GradeType = '1º Ano' | '2º Ano' | '3º Ano' | 'custom';

export default function LiveStudentPickerUtility() {
  const [selectedGrade, setSelectedGrade] = useState<GradeType>('2º Ano');
  const [students, setStudents] = useState<string[]>([
    'Ana Beatriz',
    'Bruno Santos',
    'Carlos Eduardo',
    'Débora Lima',
    'Eduardo Costa',
    'Fernanda Oliveira',
    'Gabriel Souza',
    'Helena Ramos',
    'Igor Martins',
    'Juliana Pereira'
  ]);
  const [manualInput, setManualInput] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [pickedHistory, setPickedHistory] = useState<string[]>([]);
  const [removeAfterPick, setRemoveAfterPick] = useState(true);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PIN da Sessão (6 dígitos)
  const [sessionPin, setSessionPin] = useState(() => {
    const saved = sessionStorage.getItem('student_picker_live_pin');
    if (saved) return saved;
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('student_picker_live_pin', newPin);
    return newPin;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const queueUrl = `${window.location.origin}/sorteio/${sessionPin}`;

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
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

  const playWinnerFanfare = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.12);
        osc.stop(audioCtx.currentTime + i * 0.12 + 0.4);
      });
    } catch (e) {
      console.warn(e);
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

  // Carregar alunos do banco de dados quando trocar a série
  const handleLoadFromDb = async (grade: GradeType) => {
    setSelectedGrade(grade);
    if (grade === 'custom') return;

    setIsLoadingDb(true);
    try {
      const data = await getStudentsByGrade(grade);
      if (data && data.length > 0) {
        const names = data.map(s => s.full_name).filter(Boolean);
        setStudents(names);
        setPickedHistory([]);
        setSelectedStudent(null);
        toast.success(`${names.length} alunos do ${grade} importados do banco de dados!`);
      } else {
        toast.info(`Nenhum aluno cadastrado no banco para o ${grade}. Você pode adicionar nomes manualmente.`);
      }
    } catch (err) {
      console.error('Erro ao buscar estudantes:', err);
      toast.error('Não foi possível carregar os alunos do banco de dados.');
    } finally {
      setIsLoadingDb(false);
    }
  };

  // Inscrição Realtime no canal do Sorteio
  useEffect(() => {
    if (!sessionPin) return;

    const channelName = `studentpicker_${sessionPin}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true }
      }
    });

    channel
      .on('broadcast', { event: 'join_picker' }, (event) => {
        const payload = event?.payload;
        if (payload && payload.studentName) {
          const incomingName = String(payload.studentName).trim();
          if (!incomingName) return;

          setStudents(prev => {
            if (prev.some(name => name.toLowerCase() === incomingName.toLowerCase())) {
              return prev;
            }
            return [...prev, incomingName];
          });

          playChime();
          toast.success(`🎉 ${incomingName} acabou de entrar no sorteio pelo celular!`, {
            duration: 3500
          });
        }
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

  const handleAddManualStudent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualInput.trim();
    if (!clean) return;

    if (students.some(s => s.toLowerCase() === clean.toLowerCase())) {
      toast.error('Este aluno já está na lista.');
      return;
    }

    setStudents([...students, clean]);
    setManualInput('');
    toast.success(`"${clean}" adicionado à lista!`);
  };

  const handleRemoveStudent = (nameToRemove: string) => {
    setStudents(students.filter(s => s !== nameToRemove));
    setPickedHistory(pickedHistory.filter(s => s !== nameToRemove));
  };

  const handlePick = () => {
    const available = removeAfterPick 
      ? students.filter(n => !pickedHistory.includes(n)) 
      : students;

    if (available.length === 0) {
      toast.error('Todos os alunos da lista já foram sorteados! Reinicie o histórico para sortear novamente.');
      return;
    }

    setIsRolling(true);
    setSelectedStudent(null);

    // Efeito roleta
    let count = 0;
    const maxSteps = 24;
    const interval = setInterval(() => {
      const randomTemp = available[Math.floor(Math.random() * available.length)];
      setSelectedStudent(randomTemp);
      count++;
      if (count >= maxSteps) {
        clearInterval(interval);
        const finalPick = available[Math.floor(Math.random() * available.length)];
        setSelectedStudent(finalPick);
        setIsRolling(false);
        setPickedHistory(prev => [finalPick, ...prev]);
        playWinnerFanfare();

        // Broadcast do vencedor para os celulares
        if (channelRef.current && isConnected) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'winner_picked',
            payload: { studentName: finalPick }
          }).catch(() => {});
        }

        toast.success(`👑 Aluno sorteado: ${finalPick}!`, {
          duration: 6000
        });
      }
    }, 75);
  };

  const handleResetHistory = () => {
    setPickedHistory([]);
    setSelectedStudent(null);
    toast.info('Histórico de sorteados reiniciado.');
  };

  const handleResetAll = () => {
    if (confirm('Deseja limpar toda a lista de alunos?')) {
      setStudents([]);
      setPickedHistory([]);
      setSelectedStudent(null);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'session_reset',
          payload: {}
        }).catch(() => {});
      }
      toast.success('Lista zerada para um novo sorteio!');
    }
  };

  const handleGenerateNewPin = () => {
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem('student_picker_live_pin', newPin);
    setSessionPin(newPin);
    setStudents([]);
    setPickedHistory([]);
    setSelectedStudent(null);
    toast.success(`Nova sala de sorteio criada: PIN ${newPin}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(queueUrl);
      setCopied(true);
      toast.success('Link do sorteio copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const availableStudents = removeAfterPick 
    ? students.filter(n => !pickedHistory.includes(n)) 
    : students;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'p-8 bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between' : ''}`} ref={containerRef}>
      {/* Top Banner Controls */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-amber-500 text-slate-950 gap-1 font-black">
              <UserCheck className="w-3.5 h-3.5" />
              Sorteador de Alunos em Tempo Real
            </Badge>

            {isConnected ? (
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-500/20 text-emerald-300 text-xs gap-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sala Online (PIN: {sessionPin})
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-400/40 bg-amber-500/20 text-amber-300 text-xs gap-1.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Conectando...
              </Badge>
            )}

            <Badge variant="outline" className="border-white/20 text-amber-200 bg-white/5 text-xs gap-1">
              <Users className="w-3 h-3 text-amber-300" />
              {students.length} alunos na lista
            </Badge>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sorteio da Turma com QR Code & Banco de Dados
            </h2>
            <p className="text-xs text-amber-200">
              Escolha a série para importar do banco, deixe os alunos entrarem pelo celular via QR Code ou digite manualmente.
            </p>
          </div>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Button
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 text-xs gap-1.5 font-bold"
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
            onClick={handleResetHistory}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Zerar Histórico
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs gap-1.5"
            onClick={handleResetAll}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Tudo
          </Button>
        </div>
      </div>

      {/* Banner de Acesso Rápido para Sala de Aula */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs text-slate-300 font-medium">
              Os alunos podem entrar no sorteio escaneando o QR Code ou digitando o PIN:
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded border border-amber-500/30">
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
            Testar Entrada
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

      {/* Grid Principal: Sorteio + Lista de Alunos com Séries */}
      <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 flex-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Coluna 1: O Display do Sorteio */}
        <div className="space-y-4 flex flex-col justify-between">
          <Card className="border-2 border-amber-500/30 bg-gradient-to-b from-card via-card to-amber-500/5 shadow-md flex-1 flex flex-col justify-between">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Roleta de Sorteio da Aula
              </CardTitle>
              <CardDescription>
                Clique para escolher aleatoriamente um aluno sem repetição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              {/* Display do Aluno Sorteado */}
              <div className={`flex flex-col items-center justify-center p-6 sm:p-10 rounded-2xl bg-muted/60 border-2 border-border/80 relative overflow-hidden ${
                isFullscreen ? 'min-h-[260px]' : 'min-h-[170px]'
              }`}>
                {selectedStudent ? (
                  <div className={`space-y-2 ${isRolling ? 'opacity-80 scale-95' : 'scale-100 animate-in zoom-in-95'}`}>
                    <Badge className="bg-amber-500 text-slate-950 font-bold mb-1">
                      {isRolling ? 'Sorteando...' : '🎉 ALUNO SELECIONADO!'}
                    </Badge>
                    <div className={`${isFullscreen ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl'} font-black text-foreground tracking-tight leading-tight`}>
                      {selectedStudent}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <Shuffle className="w-10 h-10 opacity-30 text-amber-500" />
                    <span>Clique no botão abaixo para iniciar o sorteio</span>
                  </div>
                )}
              </div>

              {/* Botão de Sortear */}
              <Button
                size="lg"
                className={`w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 gap-2 transition-all active:scale-[0.98] ${
                  isFullscreen ? 'text-xl py-8' : 'text-lg py-6'
                }`}
                onClick={handlePick}
                disabled={isRolling || availableStudents.length === 0}
              >
                <Sparkles className="w-6 h-6" />
                {isRolling ? 'Girando a Roleta...' : 'Sortear Aluno Agora'}
              </Button>

              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 gap-2">
                <span>
                  Disponíveis para sorteio: <strong className="text-foreground">{availableStudents.length}</strong> de {students.length}
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={removeAfterPick}
                    onChange={(e) => setRemoveAfterPick(e.target.checked)}
                    className="rounded border-border text-amber-500 focus:ring-amber-500"
                  />
                  Não repetir sorteado
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Histórico dos Sorteados */}
          {pickedHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <PartyPopper className="w-3.5 h-3.5 text-amber-500" />
                  Já Sorteados nesta rodada ({pickedHistory.length})
                </CardTitle>
                <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground gap-1" onClick={handleResetHistory}>
                  <RotateCcw className="w-3 h-3" /> Reiniciar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {pickedHistory.map((name, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 gap-1 py-1 px-2.5">
                      <span className="font-bold font-mono text-[10px]">{i + 1}º</span>
                      {name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna 2: Gerenciamento dos Alunos & Filtro por Série (oculta em fullscreen) */}
        {!isFullscreen && (
          <div className="space-y-4">
            <Card className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-500" />
                    Alunos Participantes ({students.length})
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">Importe por série ou adicione</span>
                </div>
                <CardDescription>
                  Selecione a série para carregar do banco de dados ou digite novos alunos
                </CardDescription>

                {/* Botões de Série para Carregar do Banco */}
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border">
                    {(['1º Ano', '2º Ano', '3º Ano'] as GradeType[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        disabled={isLoadingDb}
                        onClick={() => handleLoadFromDb(g)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                          selectedGrade === g
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <Database className="w-3 h-3" />
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                {/* Formulário de Inserção Rápida */}
                <form onSubmit={handleAddManualStudent} className="flex gap-2">
                  <Input
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Nome do aluno para adicionar..."
                    className="text-xs h-9"
                    maxLength={40}
                  />
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!manualInput.trim()}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 text-xs gap-1 font-bold h-9"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Incluir
                  </Button>
                </form>

                {/* Lista Visual com Chips dos Alunos */}
                <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto p-3 rounded-xl bg-muted/30 border space-y-2">
                  {isLoadingDb ? (
                    <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                      <span className="text-xs">Carregando alunos do banco de dados...</span>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-muted-foreground gap-1.5 text-center p-4">
                      <Users className="w-8 h-8 opacity-30 text-amber-500" />
                      <p className="text-xs font-semibold">Nenhum aluno na lista</p>
                      <p className="text-[11px]">Selecione uma série acima, adicione nomes ou deixe os alunos entrarem pelo QR Code.</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {students.map((studentName, idx) => {
                        const isPicked = pickedHistory.includes(studentName);
                        return (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className={`text-xs py-1 px-2.5 gap-1.5 transition-all flex items-center ${
                              isPicked 
                                ? 'opacity-40 line-through bg-muted text-muted-foreground' 
                                : 'bg-card border text-foreground hover:border-amber-500/40 shadow-2xs'
                            }`}
                          >
                            <span>{studentName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(studentName)}
                              className="text-muted-foreground hover:text-rose-500 rounded p-0.5 ml-0.5"
                              title="Remover aluno"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  💡 Alunos que escanearem o QR Code com o celular entram automaticamente nesta lista em tempo real.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Projeção / QR Code para Data-Show */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-xl p-6 sm:p-8 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto border border-amber-500/30">
              <Tv className="w-7 h-7" />
            </div>
            <DialogTitle className="text-2xl font-bold text-white">
              Entrada no Sorteio da Aula
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Aponte a câmera do seu celular para o QR Code abaixo para entrar na roleta de sorteio do professor.
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
                <span className="text-xs text-slate-400 uppercase tracking-wider">Código PIN da Sala:</span>
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
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 gap-1.5 font-bold"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link do Sorteio'}
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
