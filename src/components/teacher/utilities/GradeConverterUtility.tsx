import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Sparkles, CheckCircle2 } from 'lucide-react';

export default function GradeConverterUtility() {
  const [scale10, setScale10] = useState('7.5');
  const [scale100, setScale100] = useState('75');
  const [concept, setConcept] = useState('B');

  const updateFrom10 = (val: string) => {
    setScale10(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(10, num));
      const s100 = (clamped * 10).toFixed(1);
      setScale100(s100.endsWith('.0') ? parseInt(s100).toString() : s100);
      setConcept(getConcept(clamped));
    }
  };

  const updateFrom100 = (val: string) => {
    setScale100(val);
    const num = parseFloat(val.replace(',', '.'));
    if (!isNaN(num)) {
      const clamped = Math.max(0, Math.min(100, num));
      const s10 = (clamped / 10).toFixed(2);
      setScale10(s10.endsWith('.00') ? parseInt(s10).toString() : s10);
      setConcept(getConcept(clamped / 10));
    }
  };

  const getConcept = (val10: number): string => {
    if (val10 >= 9.0) return 'A (Excelente)';
    if (val10 >= 7.5) return 'B (Bom)';
    if (val10 >= 6.0) return 'C (Regular / Aprovado)';
    if (val10 >= 4.0) return 'D (Insuficiente / Exame)';
    return 'E (Reprovado)';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
            Conversor Instantâneo de Notas
          </CardTitle>
          <CardDescription>
            Converta notas rapidamente entre a escala decimal (0 a 10), percentual (0 a 100) e conceitos acadêmicos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Escala 0 a 10 */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Escala 0 a 10 (Padrão)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={scale10}
                onChange={(e) => updateFrom10(e.target.value)}
                className="text-2xl font-bold font-mono h-14 text-center"
              />
              <p className="text-xs text-muted-foreground text-center">Usado no Portal CTI</p>
            </div>

            {/* Escala 0 a 100 */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Escala 0 a 100 (Pontos / %)
              </label>
              <Input
                type="number"
                step="1"
                min="0"
                max="100"
                value={scale100}
                onChange={(e) => updateFrom100(e.target.value)}
                className="text-2xl font-bold font-mono h-14 text-center text-indigo-600 dark:text-indigo-400"
              />
              <p className="text-xs text-muted-foreground text-center">Usado em exames e plataformas</p>
            </div>

            {/* Conceito Equivalente */}
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 space-y-2 flex flex-col justify-between">
              <label className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                Conceito Equivalente
              </label>
              <div className="text-xl font-bold text-center py-2 text-indigo-700 dark:text-indigo-300">
                {concept}
              </div>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 text-center">Classificação qualitativa</p>
            </div>
          </div>

          {/* Tabela de Referência */}
          <div className="mt-6 border rounded-lg overflow-hidden text-sm">
            <div className="bg-muted px-4 py-2 font-medium text-xs text-muted-foreground uppercase">
              Tabela de Referência Rápida
            </div>
            <div className="divide-y divide-border">
              <div className="grid grid-cols-3 p-3 text-xs sm:text-sm hover:bg-muted/20 items-center">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">9.0 a 10.0</span>
                <span>90 a 100 pts</span>
                <Badge className="w-fit bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Conceito A (Excelente)</Badge>
              </div>
              <div className="grid grid-cols-3 p-3 text-xs sm:text-sm hover:bg-muted/20 items-center">
                <span className="font-semibold text-blue-600 dark:text-blue-400">7.5 a 8.9</span>
                <span>75 a 89 pts</span>
                <Badge className="w-fit bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30">Conceito B (Bom)</Badge>
              </div>
              <div className="grid grid-cols-3 p-3 text-xs sm:text-sm hover:bg-muted/20 items-center">
                <span className="font-semibold text-amber-600 dark:text-amber-400">6.0 a 7.4</span>
                <span>60 a 74 pts</span>
                <Badge className="w-fit bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">Conceito C (Aprovado)</Badge>
              </div>
              <div className="grid grid-cols-3 p-3 text-xs sm:text-sm hover:bg-muted/20 items-center">
                <span className="font-semibold text-rose-600 dark:text-rose-400">0.0 a 5.9</span>
                <span>0 a 59 pts</span>
                <Badge className="w-fit bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30">Conceito D/E (Exame / Reprovado)</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
