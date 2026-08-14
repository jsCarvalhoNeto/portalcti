import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Trophy, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
  Tv
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  category: string;
  question: string;
  codeSnippet?: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

const SAMPLE_QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    category: 'Banco de Dados / SQL',
    question: 'Qual comando SQL é utilizado para extrair dados de uma tabela sem alterar os registros?',
    options: [
      { key: 'A', text: 'INSERT INTO' },
      { key: 'B', text: 'SELECT' },
      { key: 'C', text: 'UPDATE' },
      { key: 'D', text: 'DELETE' }
    ],
    correctAnswer: 'B',
    explanation: 'O comando SELECT realiza consultas e retorna linhas da tabela sem modificar os dados salvos no banco.',
    points: 100
  },
  {
    id: '2',
    category: 'JavaScript & React',
    question: 'O que o seguinte código irá imprimir no console?',
    codeSnippet: `const x = [1, 2, 3];\nconst y = x.map(n => n * 2);\nconsole.log(y);`,
    options: [
      { key: 'A', text: '[1, 2, 3]' },
      { key: 'B', text: '[2, 4, 6]' },
      { key: 'C', text: '6' },
      { key: 'D', text: 'undefined' }
    ],
    correctAnswer: 'B',
    explanation: 'O método .map() cria um novo array aplicando a função de multiplicação por 2 em cada elemento: [2, 4, 6].',
    points: 150
  },
  {
    id: '3',
    category: 'Controle de Versão / Git',
    question: 'Qual comando envia os commits do repositório local para o GitHub?',
    options: [
      { key: 'A', text: 'git pull' },
      { key: 'B', text: 'git push' },
      { key: 'C', text: 'git commit -m' },
      { key: 'D', text: 'git clone' }
    ],
    correctAnswer: 'B',
    explanation: 'O comando `git push` envia os commits registrados localmente para o servidor remoto (GitHub/GitLab).',
    points: 100
  }
];

export default function FlashChallengeUtility() {
  const [questions, setQuestions] = useState<QuizQuestion[]>(SAMPLE_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [teamScore, setTeamScore] = useState(0);

  const currentQ = questions[currentIdx] || questions[0];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) {
            setIsTimerRunning(false);
            setIsRevealed(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const startTimer = (seconds: number = 30) => {
    setTimerSeconds(seconds);
    setIsTimerRunning(true);
    setIsRevealed(false);
    setSelectedOption(null);
  };

  const handleReveal = () => {
    setIsTimerRunning(false);
    setIsRevealed(true);
    if (selectedOption === currentQ.correctAnswer) {
      setTeamScore(s => s + currentQ.points);
    }
  };

  const handleNextQuestion = () => {
    setIsTimerRunning(false);
    setIsRevealed(false);
    setSelectedOption(null);
    setTimerSeconds(30);
    setCurrentIdx((prev) => (prev + 1) % questions.length);
  };

  const handleResetGame = () => {
    setCurrentIdx(0);
    setTeamScore(0);
    setIsTimerRunning(false);
    setIsRevealed(false);
    setSelectedOption(null);
    setTimerSeconds(30);
  };

  return (
    <div className="space-y-6">
      {/* Topo do Quiz */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-white/30 gap-1">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Desafio Relâmpago / Quiz
            </Badge>
            <span className="text-xs text-white/80">Questão {currentIdx + 1} de {questions.length}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Desafio Rápido da Turma</h2>
          <p className="text-xs text-white/80">
            Lance a pergunta no Datashow e dê tempo para a turma debater e responder!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-white/70 block">Pontuação Acumulada</span>
            <span className="text-2xl font-black font-mono flex items-center justify-end gap-1.5">
              <Trophy className="w-5 h-5 text-amber-300 fill-amber-300" />
              {teamScore} pts
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs"
            onClick={handleResetGame}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Painel Central da Questão */}
      <Card className="border-2 border-border/80 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <Badge variant="outline" className="bg-muted text-xs">
              {currentQ.category}
            </Badge>

            {/* Temporizador Regressivo */}
            <div className="flex items-center gap-2">
              <div className={`px-4 py-1.5 rounded-full font-mono font-black text-base flex items-center gap-1.5 transition-colors ${
                timerSeconds <= 5 && timerSeconds > 0 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : isTimerRunning 
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                <Clock className="w-4 h-4" />
                {timerSeconds}s
              </div>

              {!isTimerRunning && !isRevealed && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => startTimer(15)}>15s</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => startTimer(30)}>30s</Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => startTimer(60)}>60s</Button>
                </div>
              )}
            </div>
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold leading-snug">
            {currentQ.question}
          </CardTitle>

          {currentQ.codeSnippet && (
            <div className="mt-3 p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
              <pre>{currentQ.codeSnippet}</pre>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Alternativas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQ.options.map((opt) => {
              const isCorrect = opt.key === currentQ.correctAnswer;
              const isChosen = selectedOption === opt.key;

              let style = 'bg-card border-border hover:border-primary/50 hover:bg-muted/30';
              if (isRevealed) {
                if (isCorrect) {
                  style = 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/40';
                } else if (isChosen && !isCorrect) {
                  style = 'bg-rose-500/15 border-rose-500 text-rose-800 dark:text-rose-300 opacity-60';
                } else {
                  style = 'opacity-40 border-border';
                }
              } else if (isChosen) {
                style = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30';
              }

              return (
                <div
                  key={opt.key}
                  onClick={() => !isRevealed && setSelectedOption(opt.key)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      isRevealed && isCorrect 
                        ? 'bg-emerald-500 text-white' 
                        : isChosen 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {opt.key}
                    </span>
                    <span className="text-sm font-medium">{opt.text}</span>
                  </div>

                  {isRevealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {isRevealed && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Explicação Pedagógica (Após Revelação) */}
          {isRevealed && (
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 animate-in fade-in space-y-1">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Resposta Correta: Letra {currentQ.correctAnswer} (+{currentQ.points} pts)
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center justify-between pt-3 border-t">
            {!isRevealed ? (
              <Button
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
                onClick={handleReveal}
              >
                <Sparkles className="w-4 h-4" />
                Revelar Resposta Correta
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                onClick={handleNextQuestion}
              >
                Próxima Questão
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleNextQuestion}
            >
              Pular Pergunta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
