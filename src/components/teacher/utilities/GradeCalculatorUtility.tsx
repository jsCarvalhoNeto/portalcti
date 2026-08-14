import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calculator, CheckCircle, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';

interface GradeItem {
  id: string;
  name: string;
  grade: string;
  weight: string;
}

export default function GradeCalculatorUtility() {
  const [calcType, setCalcType] = useState<'arithmetic' | 'weighted'>('arithmetic');
  const [minPassingGrade, setMinPassingGrade] = useState('6.0');
  const [grades, setGrades] = useState<GradeItem[]>([
    { id: '1', name: 'Avaliação 1', grade: '7.5', weight: '1' },
    { id: '2', name: 'Avaliação 2', grade: '8.0', weight: '1' },
    { id: '3', name: 'Trabalho / Projeto', grade: '9.0', weight: '2' },
  ]);

  const addGradeRow = () => {
    const nextNum = grades.length + 1;
    setGrades([
      ...grades,
      { id: Date.now().toString(), name: `Atividade ${nextNum}`, grade: '', weight: '1' }
    ]);
  };

  const removeGradeRow = (id: string) => {
    if (grades.length <= 1) return;
    setGrades(grades.filter(g => g.id !== id));
  };

  const updateGrade = (id: string, field: keyof GradeItem, value: string) => {
    setGrades(grades.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const resetAll = () => {
    setGrades([
      { id: '1', name: 'Avaliação 1', grade: '', weight: '1' },
      { id: '2', name: 'Avaliação 2', grade: '', weight: '1' },
    ]);
  };

  // Cálculos
  const validGrades = grades
    .map(g => ({
      grade: parseFloat(g.grade.replace(',', '.')),
      weight: parseFloat(g.weight.replace(',', '.')) || 1
    }))
    .filter(g => !isNaN(g.grade));

  let finalAverage: number | null = null;
  if (validGrades.length > 0) {
    if (calcType === 'arithmetic') {
      const sum = validGrades.reduce((acc, curr) => acc + curr.grade, 0);
      finalAverage = sum / validGrades.length;
    } else {
      const totalWeight = validGrades.reduce((acc, curr) => acc + curr.weight, 0);
      const weightedSum = validGrades.reduce((acc, curr) => acc + (curr.grade * curr.weight), 0);
      finalAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
  }

  const passing = parseFloat(minPassingGrade.replace(',', '.')) || 6.0;
  const isApproved = finalAverage !== null && finalAverage >= passing;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Entrada de Notas */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-indigo-500" />
                    Notas e Avaliações
                  </CardTitle>
                  <CardDescription>Insira as notas da disciplina para calcular o resultado</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={calcType === 'arithmetic' ? 'default' : 'outline'}
                    onClick={() => setCalcType('arithmetic')}
                    className="text-xs"
                  >
                    Média Simples
                  </Button>
                  <Button
                    size="sm"
                    variant={calcType === 'weighted' ? 'default' : 'outline'}
                    onClick={() => setCalcType('weighted')}
                    className="text-xs"
                  >
                    Ponderada (Pesos)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {grades.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <Input
                        value={item.name}
                        onChange={(e) => updateGrade(item.id, 'name', e.target.value)}
                        placeholder={`Avaliação ${index + 1}`}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={item.grade}
                        onChange={(e) => updateGrade(item.id, 'grade', e.target.value)}
                        placeholder="Nota"
                        className="h-9 text-sm text-center font-semibold"
                      />
                    </div>
                    {calcType === 'weighted' && (
                      <div className="w-20">
                        <Input
                          type="number"
                          step="0.5"
                          min="1"
                          value={item.weight}
                          onChange={(e) => updateGrade(item.id, 'weight', e.target.value)}
                          placeholder="Peso"
                          className="h-9 text-sm text-center"
                          title="Peso da avaliação"
                        />
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-rose-500"
                      onClick={() => removeGradeRow(item.id)}
                      disabled={grades.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={addGradeRow}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Nota
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={resetAll}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel do Resultado e Configurações */}
        <div className="space-y-4">
          <Card className="bg-card shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Média Final Calculada</CardTitle>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-muted-foreground">Média para Aprovação:</span>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={minPassingGrade}
                  onChange={(e) => setMinPassingGrade(e.target.value)}
                  className="w-16 h-7 text-xs text-center font-bold"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-2xl bg-muted/60 text-center border border-border/80 flex flex-col items-center justify-center">
                <div className="text-5xl font-extrabold font-mono tracking-tight text-foreground">
                  {finalAverage !== null ? finalAverage.toFixed(2) : '--'}
                </div>
                <div className="mt-3">
                  {finalAverage === null ? (
                    <Badge variant="outline">Aguardando notas</Badge>
                  ) : isApproved ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1 px-3">
                      <CheckCircle className="w-4 h-4" /> Aprovado
                    </Badge>
                  ) : finalAverage >= passing - 1.5 ? (
                    <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 py-1 px-3">
                      <AlertTriangle className="w-4 h-4" /> Recuperação / Exame
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1.5 py-1 px-3">
                      <XCircle className="w-4 h-4" /> Reprovado
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• {validGrades.length} nota(s) preenchida(s) no cálculo.</p>
                <p>• Tipo: {calcType === 'arithmetic' ? 'Média Aritmética Simples' : 'Média Ponderada com Pesos'}.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
