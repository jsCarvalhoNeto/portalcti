import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles,
  Flame,
  Coffee,
  CheckCircle2,
  Timer,
  BookOpen
} from 'lucide-react';

interface Preset {
  label: string;
  minutes: number;
  type: 'activity' | 'break' | 'presentation' | 'quick';
}

const PRESETS: Preset[] = [
  { label: '3 min (Apresentação)', minutes: 3, type: 'presentation' },
  { label: '5 min (Pergunta Rápida)', minutes: 5, type: 'quick' },
  { label: '10 min (Discussão)', minutes: 10, type: 'activity' },
  { label: '15 min (Pausa Curta)', minutes: 15, type: 'break' },
  { label: '20 min (Desafio Prático)', minutes: 20, type: 'activity' },
  { label: '30 min (Atividade em Grupo)', minutes: 30, type: 'activity' },
  { label: '45 min (Prova/Simulado)', minutes: 45, type: 'activity' },
];

export default function ClassTimerUtility() {
  const [mode, setMode] = useState<'timer' | 'pomodoro'>('timer');
  const [pomodoroPhase, setPomodoroPhase] = useState<'focus' | 'break'>('focus');
  const [pomodoroCycles, setPomodoroCycles] = useState(0);

  const [totalSeconds, setTotalSeconds] = useState(20 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [customMinutes, setCustomMinutes] = useState('20');
  const [customTitle, setCustomTitle] = useState('Tempo de Atividade Prática');
  const [isFinished, setIsFinished] = useState(false);
  
  const timerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            playNotificationSound();

            // Transição automática no Pomodoro
            if (mode === 'pomodoro') {
              if (pomodoroPhase === 'focus') {
                setPomodoroPhase('break');
                setPomodoroCycles(c => c + 1);
                setTotalSeconds(5 * 60);
                setCustomTitle('Pausa Rápida (5 min)');
                return 5 * 60;
              } else {
                setPomodoroPhase('focus');
                setTotalSeconds(25 * 60);
                setCustomTitle('Ciclo de Foco & Produção (25 min)');
                return 25 * 60;
              }
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds, mode, pomodoroPhase]);

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, delay: number, dur: number) => {
        setTimeout(() => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + dur);
        }, delay);
      };
      playBeep(523.25, 0, 0.2);
      playBeep(659.25, 200, 0.2);
      playBeep(783.99, 400, 0.4);
      playBeep(1046.50, 700, 0.6);
    } catch (e) {
      console.warn('Audio Context não suportado ou bloqueado', e);
    }
  };

  const handleStart = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(totalSeconds);
      setIsFinished(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    setIsFinished(false);
  };

  const handlePresetSelect = (preset: Preset) => {
    const sec = preset.minutes * 60;
    setTotalSeconds(sec);
    setRemainingSeconds(sec);
    setIsRunning(false);
    setIsFinished(false);
    setCustomMinutes(preset.minutes.toString());
    setCustomTitle(preset.label);
    setMode('timer');
  };

  const switchMode = (newMode: 'timer' | 'pomodoro') => {
    setMode(newMode);
    setIsRunning(false);
    setIsFinished(false);
    if (newMode === 'pomodoro') {
      setPomodoroPhase('focus');
      setTotalSeconds(25 * 60);
      setRemainingSeconds(25 * 60);
      setCustomTitle('Ciclo de Foco & Produção (25 min)');
    } else {
      setTotalSeconds(20 * 60);
      setRemainingSeconds(20 * 60);
      setCustomTitle('Tempo de Atividade Prática');
    }
  };

  const handleCustomApply = () => {
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      const sec = mins * 60;
      setTotalSeconds(sec);
      setRemainingSeconds(sec);
      setIsRunning(false);
      setIsFinished(false);
      setMode('timer');
    }
  };

  const toggleFullscreen = () => {
    if (!timerContainerRef.current) return;
    if (!document.fullscreenElement) {
      timerContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(err => console.error(err));
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const isUrgent = remainingSeconds <= 60 && remainingSeconds > 0;

  return (
    <div className="space-y-6">
      {/* Seletor de Modo Simples vs Pomodoro */}
      {!isFullscreen && (
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={mode === 'timer' ? 'default' : 'outline'}
              className="text-xs gap-1.5"
              onClick={() => switchMode('timer')}
            >
              <Timer className="w-3.5 h-3.5" />
              Cronômetro de Atividades
            </Button>
            <Button
              size="sm"
              variant={mode === 'pomodoro' ? 'default' : 'outline'}
              className="text-xs gap-1.5"
              onClick={() => switchMode('pomodoro')}
            >
              <Coffee className="w-3.5 h-3.5 text-rose-500" />
              Ciclo Pomodoro da Aula
            </Button>
          </div>

          {mode === 'pomodoro' && (
            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs">
              🍅 {pomodoroCycles} ciclo(s) concluído(s)
            </Badge>
          )}
        </div>
      )}

      {/* Bloco Principal do Timer */}
      <div 
        ref={timerContainerRef}
        className={`relative transition-all duration-300 rounded-2xl flex flex-col items-center justify-center p-8 ${
          isFullscreen 
            ? 'bg-slate-950 text-white min-h-screen justify-between py-12 px-6' 
            : mode === 'pomodoro' && pomodoroPhase === 'focus'
              ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-rose-900/40'
              : mode === 'pomodoro' && pomodoroPhase === 'break'
                ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white shadow-2xl border border-emerald-900/40'
                : 'bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xl border border-slate-700/50'
        }`}
      >
        {/* Barra superior de controles em tela cheia */}
        <div className="w-full flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 flex gap-1 items-center">
              <Clock className="w-3.5 h-3.5" />
              {mode === 'pomodoro' ? (pomodoroPhase === 'focus' ? '🍅 Pomodoro: Foco' : '☕ Pomodoro: Intervalo') : 'Cronômetro de Aula'}
            </Badge>
            {isUrgent && (
              <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                Reta Final!
              </Badge>
            )}
            {isFinished && (
              <Badge className="bg-emerald-500 text-white flex items-center gap-1 animate-bounce">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tempo Esgotado!
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-white/10"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Desativar Som' : 'Ativar Som'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 bg-slate-800/60 text-white hover:bg-slate-700 gap-1.5"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isFullscreen ? 'Sair Tela Cheia' : 'Projetar (Datashow)'}
            </Button>
          </div>
        </div>

        {/* Título da Atividade */}
        <div className="text-center my-2 max-w-2xl">
          <h2 className={`${isFullscreen ? 'text-4xl lg:text-5xl' : 'text-2xl'} font-bold tracking-tight text-white/95 drop-shadow`}>
            {customTitle || 'Atividade em Andamento'}
          </h2>
        </div>

        {/* Display do Tempo Gigante */}
        <div className="my-8 text-center">
          <div 
            className={`font-mono font-extrabold tracking-tighter select-none transition-colors duration-300 ${
              isFullscreen ? 'text-8xl sm:text-9xl lg:text-[14rem]' : 'text-7xl sm:text-8xl'
            } ${
              isFinished 
                ? 'text-emerald-400 animate-pulse' 
                : isUrgent 
                  ? 'text-rose-400 animate-pulse' 
                  : 'text-white'
            }`}
          >
            {formatTime(remainingSeconds)}
          </div>

          {/* Barra de Progresso Visual */}
          <div className="w-full max-w-xl mx-auto h-3 bg-slate-800 rounded-full overflow-hidden mt-4 border border-slate-700">
            <div 
              className={`h-full transition-all duration-1000 ${
                isFinished 
                  ? 'bg-emerald-500' 
                  : isUrgent 
                    ? 'bg-rose-500' 
                    : mode === 'pomodoro'
                      ? (pomodoroPhase === 'focus' ? 'bg-gradient-to-r from-rose-500 to-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400')
                      : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Botões de Ação do Timer */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          {!isRunning ? (
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-emerald-900/30 gap-2"
              onClick={handleStart}
            >
              <Play className="w-6 h-6 fill-current" />
              {remainingSeconds === 0 ? 'Reiniciar' : 'Iniciar'}
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-500 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-amber-900/30 gap-2"
              onClick={handlePause}
            >
              <Pause className="w-6 h-6 fill-current" />
              Pausar
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            className="border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700 text-lg px-6 py-6 rounded-xl gap-2"
            onClick={handleReset}
          >
            <RotateCcw className="w-5 h-5" />
            Zerar
          </Button>
        </div>
      </div>

      {/* Painel de Configuração e Presets (Apenas fora do fullscreen) */}
      {!isFullscreen && mode === 'timer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Durações Prontas
              </CardTitle>
              <CardDescription>Clique para carregar tempos comuns de aula</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Tempo Personalizado
              </CardTitle>
              <CardDescription>Defina o nome e minutos exatos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Título da Atividade</label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Ex: Resolução de Exercício 3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Minutos</label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      type="number"
                      min="1"
                      max="300"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full"
                onClick={handleCustomApply}
              >
                Aplicar Novo Tempo
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
