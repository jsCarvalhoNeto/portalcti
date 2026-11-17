import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Calendar, Sparkles, RefreshCw, BookOpen, FolderOpen, PenTool, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Subject } from '@/contexts/TeacherDashboardContext';
import { cloneSubjectStructure } from '@/services/subjectCloneService';
import { toast } from 'sonner';

interface CloneSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onSuccess: (newSubjectId: number | string) => void;
}

export default function CloneSubjectModal({
  isOpen,
  onClose,
  subject,
  onSuccess,
}: CloneSubjectModalProps) {
  const { user } = useAuth();

  const currentYear = new Date().getFullYear();
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState<string>(String(currentYear));
  const [newSemester, setNewSemester] = useState('');
  const [newGrade, setNewGrade] = useState<string>('');
  const [newSchedule, setNewSchedule] = useState('');

  // Ajuste de datas
  const [sourceStartDate, setSourceStartDate] = useState('');
  const [targetStartDate, setTargetStartDate] = useState('');

  // Opções do que clonar
  const [includeLessons, setIncludeLessons] = useState(true);
  const [includeResources, setIncludeResources] = useState(true);
  const [includeActivities, setIncludeActivities] = useState(true);
  const [includeContents, setIncludeContents] = useState(true);
  const [includeAiContext, setIncludeAiContext] = useState(true);

  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    if (!subject || !isOpen) return;
    const nextYear = (subject.year || currentYear) >= currentYear ? currentYear + 1 : currentYear;
    setNewName(`${subject.name} (${nextYear})`);
    setNewYear(String(nextYear));
    setNewSemester(subject.semester || '1º Semestre');
    setNewGrade(subject.grade || '');
    setNewSchedule(subject.schedule || '');
    setSourceStartDate('');
    setTargetStartDate('');
    setIncludeLessons(true);
    setIncludeResources(true);
    setIncludeActivities(true);
    setIncludeContents(true);
    setIncludeAiContext(true);
  }, [subject, isOpen, currentYear]);

  const dateShiftDays = useMemo(() => {
    if (!sourceStartDate || !targetStartDate) return 0;
    const d1 = new Date(`${sourceStartDate}T12:00:00Z`);
    const d2 = new Date(`${targetStartDate}T12:00:00Z`);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  }, [sourceStartDate, targetStartDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !user?.id) return;

    if (!newName.trim()) {
      toast.error('Informe o nome da nova disciplina.');
      return;
    }

    setCloning(true);
    try {
      const result = await cloneSubjectStructure({
        sourceSubject: subject as any,
        teacherId: user.id,
        newName: newName.trim(),
        newYear: Number(newYear) || currentYear,
        newSemester: newSemester.trim() || undefined,
        newGrade: (newGrade || undefined) as any,
        newSchedule: newSchedule.trim() || undefined,
        dateShiftDays,
        include: {
          lessons: includeLessons,
          resources: includeResources,
          activities: includeActivities,
          contents: includeContents,
          aiContext: includeAiContext,
        },
      });

      const summaryParts: string[] = [];
      if (result.counts.lessons > 0) summaryParts.push(`${result.counts.lessons} aulas`);
      if (result.counts.resources > 0) summaryParts.push(`${result.counts.resources} materiais`);
      if (result.counts.activities > 0) summaryParts.push(`${result.counts.activities} atividades`);
      if (result.counts.contents > 0) summaryParts.push(`${result.counts.contents} seções`);
      if (result.counts.aiContext) summaryParts.push('contexto de IA');

      const detail =
        summaryParts.length > 0
          ? `Copiado: ${summaryParts.join(', ')}.`
          : 'Estrutura básica criada.';

      toast.success(`Disciplina "${result.newSubject.name}" criada! ${detail}`);
      onSuccess(result.newSubject.id);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao duplicar disciplina.');
    } finally {
      setCloning(false);
    }
  };

  if (!subject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !cloning && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-primary" />
            Duplicar Estrutura para Nova Turma
          </DialogTitle>
          <DialogDescription>
            Crie uma nova disciplina copiando aulas, materiais, exercícios e contexto de IA de{' '}
            <strong>{subject.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Dados da Nova Disciplina */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 space-y-1.5">
              <Label htmlFor="clone-subject-name">Nome da Nova Disciplina</Label>
              <Input
                id="clone-subject-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Programação Web I - 2027"
                required
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <Label htmlFor="clone-subject-year">Ano Letivo</Label>
              <Input
                id="clone-subject-year"
                type="number"
                min={2020}
                max={2100}
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <Label htmlFor="clone-subject-semester">Semestre</Label>
              <Input
                id="clone-subject-semester"
                value={newSemester}
                onChange={(e) => setNewSemester(e.target.value)}
                placeholder="Ex: 1º Semestre"
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <Label>Série / Turma</Label>
              <Select value={newGrade || 'keep'} onValueChange={(v) => setNewGrade(v === 'keep' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Manter atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Manter ({subject.grade || 'Não definida'})</SelectItem>
                  <SelectItem value="1º Ano">1º Ano</SelectItem>
                  <SelectItem value="2º Ano">2º Ano</SelectItem>
                  <SelectItem value="3º Ano">3º Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <Label htmlFor="clone-subject-schedule">Horário</Label>
              <Input
                id="clone-subject-schedule"
                value={newSchedule}
                onChange={(e) => setNewSchedule(e.target.value)}
                placeholder="Ex: Seg/Qua 19h"
              />
            </div>
          </div>

          {/* Ajuste Automático de Datas */}
          <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Ajuste Automático de Datas (Opcional)</span>
              </div>
              {dateShiftDays !== 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {dateShiftDays > 0 ? `+${dateShiftDays}` : dateShiftDays} dias nas aulas e prazos
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Informe a data da 1ª aula da turma anterior e a data de início da nova turma para deslocar automaticamente o cronograma e os prazos das atividades.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="source-start-date" className="text-xs">
                  Início da turma anterior
                </Label>
                <Input
                  id="source-start-date"
                  type="date"
                  value={sourceStartDate}
                  onChange={(e) => setSourceStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="target-start-date" className="text-xs">
                  Início da nova turma
                </Label>
                <Input
                  id="target-start-date"
                  type="date"
                  value={targetStartDate}
                  onChange={(e) => setTargetStartDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Seleção do que clonar */}
          <div className="space-y-2.5">
            <Label className="text-sm font-medium">Itens para copiar na clonagem</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-muted/40">
                <Checkbox
                  checked={includeLessons}
                  onCheckedChange={(v) => setIncludeLessons(Boolean(v))}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    Cronograma de Aulas
                  </div>
                  <span className="text-muted-foreground">
                    Copia todas as aulas e planos de aula (marcadas como pendentes).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-muted/40">
                <Checkbox
                  checked={includeResources}
                  onCheckedChange={(v) => setIncludeResources(Boolean(v))}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                    Materiais e Recursos
                  </div>
                  <span className="text-muted-foreground">
                    Copia livros, links, apostilas e referências cadastradas.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-muted/40">
                <Checkbox
                  checked={includeActivities}
                  onCheckedChange={(v) => setIncludeActivities(Boolean(v))}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-orange-500" />
                    Exercícios, Projetos e Avaliações
                  </div>
                  <span className="text-muted-foreground">
                    Copia enunciados e pesos sem copiar notas ou entregas de alunos.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-muted/40">
                <Checkbox
                  checked={includeContents}
                  onCheckedChange={(v) => setIncludeContents(Boolean(v))}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    Conteúdo / Ementa Inicial
                  </div>
                  <span className="text-muted-foreground">
                    Copia textos da aba Início, Conteúdo e Materiais da disciplina.
                  </span>
                </div>
              </label>

              <label className="sm:col-span-2 flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer hover:bg-muted/40">
                <Checkbox
                  checked={includeAiContext}
                  onCheckedChange={(v) => setIncludeAiContext(Boolean(v))}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    Contexto e Instruções de IA (`subject_ai_contexts`)
                  </div>
                  <span className="text-muted-foreground">
                    Copia a ementa analisada, mapa de aulas e modelos de prompt da disciplina.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={cloning}>
              Cancelar
            </Button>
            <Button type="submit" disabled={cloning}>
              {cloning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Duplicando estrutura...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar Disciplina
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
