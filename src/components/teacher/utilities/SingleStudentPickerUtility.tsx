import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, UserCheck, RotateCcw, Shuffle, Users, CheckCircle2 } from 'lucide-react';

export default function SingleStudentPickerUtility() {
  const [namesText, setNamesText] = useState(
    'Ana Silva\nBruno Santos\nCarlos Eduardo\nDébora Lima\nEduardo Costa\nFernanda Oliveira\nGabriel Souza\nHelena Ramos\nIgor Martins\nJuliana Pereira'
  );
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [pickedHistory, setPickedHistory] = useState<string[]>([]);
  const [removeAfterPick, setRemoveAfterPick] = useState(true);

  const getStudentList = () => {
    return namesText
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0);
  };

  const handlePick = () => {
    const list = getStudentList();
    const available = removeAfterPick 
      ? list.filter(n => !pickedHistory.includes(n)) 
      : list;

    if (available.length === 0) {
      alert('Todos os alunos da lista já foram sorteados! Limpe o histórico para recomeçar.');
      return;
    }

    setIsRolling(true);
    setSelectedStudent(null);

    // Efeito roleta de nomes piscando
    let count = 0;
    const maxSteps = 20;
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
      }
    }, 80);
  };

  const resetHistory = () => {
    setPickedHistory([]);
    setSelectedStudent(null);
  };

  const currentList = getStudentList();
  const remainingCount = removeAfterPick 
    ? currentList.filter(n => !pickedHistory.includes(n)).length 
    : currentList.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Painel do Sorteio */}
        <div className="space-y-4">
          <Card className="border-indigo-200 dark:border-indigo-900 bg-gradient-to-b from-card to-indigo-50/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                Sorteador de Aluno
              </CardTitle>
              <CardDescription>
                Escolha aleatoriamente um aluno para responder ou apresentar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              {/* Display do Aluno Sorteado */}
              <div className="min-h-[160px] flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/60 border border-border/80">
                {selectedStudent ? (
                  <div className={`space-y-2 ${isRolling ? 'opacity-70 scale-95' : 'scale-100 animate-in fade-in zoom-in-95'}`}>
                    <Badge className="bg-indigo-500 text-white mb-2">
                      {isRolling ? 'Sorteando...' : 'Aluno Selecionado!'}
                    </Badge>
                    <div className="text-3xl font-extrabold text-foreground tracking-tight">
                      {selectedStudent}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                    <Shuffle className="w-8 h-8 opacity-40" />
                    Clique no botão abaixo para sortear
                  </div>
                )}
              </div>

              {/* Botão de Ação */}
              <Button
                size="lg"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-base py-6 rounded-xl shadow-lg shadow-indigo-600/20 gap-2"
                onClick={handlePick}
                disabled={isRolling || remainingCount === 0}
              >
                <Sparkles className="w-5 h-5" />
                {isRolling ? 'Sorteando...' : 'Sortear Aluno'}
              </Button>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>Restantes: <strong className="text-foreground">{remainingCount}</strong> de {currentList.length}</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeAfterPick}
                    onChange={(e) => setRemoveAfterPick(e.target.checked)}
                    className="rounded border-border"
                  />
                  Não repetir aluno
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Histórico dos Sorteados */}
          {pickedHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Já Sorteados nesta rodada ({pickedHistory.length})</CardTitle>
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={resetHistory}>
                  <RotateCcw className="w-3 h-3" /> Reiniciar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {pickedHistory.map((name, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-muted gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lista de Alunos (Edição) */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                Lista de Nomes da Turma
              </CardTitle>
              <CardDescription>Cole ou edite a lista de alunos (um por linha)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder="Cole a lista de alunos aqui..."
                className="flex-1 min-h-[260px] font-mono text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Dica: Você pode copiar a lista direta da chamada ou do diário de classe.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
