import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  FileUp,
  Loader2,
  Save,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Wand2,
  Eye,
  Code2,
  BookOpen,
  Replace,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TeacherAiConfig, getTeacherAiConfigs } from '@/services/aiService';
import subjectLessonService, { SubjectLesson } from '@/services/subjectLessonService';
import {
  ScheduleMapItem,
  SourceFileMeta,
  SubjectAiContext,
  analyzeSubjectDocumentsWithAi,
  createEmptySubjectAiContext,
  formatLessonTitleFromSchedule,
  generateSingleLessonWithAi,
  getSubjectAiContext,
  saveSubjectAiContext,
} from '@/services/subjectAiContextService';
import { markdownToHtml, sanitizeHtml } from '@/utils/markdownUtils';

interface SubjectAiLessonGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: number;
  subjectName: string;
  lessons: SubjectLesson[];
  initialLesson?: SubjectLesson | null;
  onLessonSaved: (lesson: SubjectLesson, isUpdate: boolean) => void;
}

export default function SubjectAiLessonGeneratorModal({
  isOpen,
  onClose,
  subjectId,
  subjectName,
  lessons,
  initialLesson = null,
  onLessonSaved,
}: SubjectAiLessonGeneratorModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'generate' | 'context'>('generate');

  // Configurações de IA do professor
  const [aiConfigs, setAiConfigs] = useState<TeacherAiConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  // Contexto da disciplina (PDFs, quantidade de aulas, modelo)
  const [context, setContext] = useState<SubjectAiContext>(() =>
    createEmptySubjectAiContext(subjectId)
  );
  const [loadingContext, setLoadingContext] = useState(false);
  const [savingContext, setSavingContext] = useState(false);

  // Arquivos PDF selecionados para análise
  const [ementaFile, setEmentaFile] = useState<File | null>(null);
  const [cronogramaFile, setCronogramaFile] = useState<File | null>(null);
  const [escopoFile, setEscopoFile] = useState<File | null>(null);
  const [analyzingPdfs, setAnalyzingPdfs] = useState(false);

  // Seleção da aula alvo (existente ou nova)
  const [targetMode, setTargetMode] = useState<'existing' | 'new'>('existing');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [newOrderIndex, setNewOrderIndex] = useState<number>(1);
  const [newTitle, setNewTitle] = useState<string>('');
  const [titleManuallyEdited, setTitleManuallyEdited] = useState<boolean>(false);
  const [newPeriod, setNewPeriod] = useState<string>('1');
  const [newDate, setNewDate] = useState<string>('');

  // Parâmetros de geração (padrão 'both': Conteúdo + Plano Docente)
  const [generateTarget, setGenerateTarget] = useState<'content' | 'plan' | 'both'>('both');
  const [extraInstructions, setExtraInstructions] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Resultado gerado (preview e edição antes de salvar)
  const [generatedTitle, setGeneratedTitle] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [generatedPlan, setGeneratedPlan] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'visual' | 'markdown'>('visual');
  const [savingLesson, setSavingLesson] = useState(false);

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    [lessons]
  );

  // Carrega configs de IA e contexto da disciplina ao abrir
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    async function load() {
      setLoadingContext(true);
      try {
        const [configsList, savedCtx] = await Promise.all([
          user?.id ? getTeacherAiConfigs(user.id) : Promise.resolve([]),
          getSubjectAiContext(subjectId),
        ]);

        if (!active) return;

        const activeConfigs = configsList.filter((c) => c.is_active);
        setAiConfigs(activeConfigs);
        const defaultCfg = activeConfigs.find((c) => c.is_default) || activeConfigs[0];
        if (defaultCfg) {
          setSelectedConfigId(defaultCfg.id);
        }

        if (savedCtx) {
          setContext(savedCtx);
          setActiveTab(initialLesson || savedCtx.content_template || savedCtx.syllabus_text ? 'generate' : 'context');
        } else {
          const empty = createEmptySubjectAiContext(subjectId);
          empty.total_lessons = lessons.length > 0 ? lessons.length : 20;
          setContext(empty);
          setActiveTab('context');
        }
      } finally {
        if (active) setLoadingContext(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isOpen, subjectId, user?.id, initialLesson, lessons.length]);

  // Inicializa seleção da aula quando abre
  useEffect(() => {
    if (!isOpen) return;

    setGeneratedTitle('');
    setGeneratedContent('');
    setGeneratedPlan('');
    setExtraInstructions('');
    setTitleManuallyEdited(false);

    if (initialLesson) {
      setTargetMode('existing');
      setSelectedLessonId(String(initialLesson.id));
    } else if (sortedLessons.length > 0) {
      setTargetMode('existing');
      setSelectedLessonId(String(sortedLessons[0].id));
    } else {
      setTargetMode('new');
      setSelectedLessonId('');
    }

    const nextIdx =
      sortedLessons.length > 0
        ? Math.max(...sortedLessons.map((l) => l.order_index || 0)) + 1
        : 1;
    setNewOrderIndex(nextIdx);
    setNewTitle(formatLessonTitleFromSchedule(nextIdx));
    setNewPeriod('1');
    setNewDate('');
  }, [isOpen, initialLesson, sortedLessons]);

  // Aula existente selecionada (ou por ID ou por conflito de order_index no modo "nova")
  const selectedExistingLesson = useMemo(() => {
    if (targetMode === 'existing') {
      return sortedLessons.find((l) => String(l.id) === selectedLessonId) || null;
    }
    return sortedLessons.find((l) => Number(l.order_index) === Number(newOrderIndex)) || null;
  }, [targetMode, sortedLessons, selectedLessonId, newOrderIndex]);

  const effectiveOrderIndex = useMemo(() => {
    if (targetMode === 'existing' && selectedExistingLesson) {
      return selectedExistingLesson.order_index || 1;
    }
    return newOrderIndex;
  }, [targetMode, selectedExistingLesson, newOrderIndex]);

  const mappedScheduleItem: ScheduleMapItem | null = useMemo(() => {
    if (!context.schedule_map?.length) return null;
    return (
      context.schedule_map.find((item) => Number(item.order_index) === Number(effectiveOrderIndex)) ||
      null
    );
  }, [context.schedule_map, effectiveOrderIndex]);

  // Sincroniza automaticamente título, período e data com o item do cronograma no modo "Nova Aula"
  useEffect(() => {
    if (!isOpen || targetMode !== 'new') return;
    if (!titleManuallyEdited) {
      setNewTitle(formatLessonTitleFromSchedule(newOrderIndex, mappedScheduleItem?.title));
    }
    if (mappedScheduleItem?.period) {
      setNewPeriod(String(mappedScheduleItem.period));
    }
    if (mappedScheduleItem?.suggested_date) {
      setNewDate(mappedScheduleItem.suggested_date);
    }
  }, [isOpen, targetMode, newOrderIndex, mappedScheduleItem, titleManuallyEdited]);

  const hasExistingContent = Boolean(selectedExistingLesson?.content?.trim());
  const hasExistingPlan = Boolean(selectedExistingLesson?.lesson_plan?.trim());

  const handleAnalyzePdfs = async () => {
    if (!user?.id) return;
    if (aiConfigs.length === 0) {
      toast({
        title: 'IA não configurada',
        description: 'Cadastre uma chave da API do Google nas Configurações do Professor.',
        variant: 'destructive',
      });
      return;
    }

    const filesToAnalyze: Array<{ file: File; kind: SourceFileMeta['kind'] }> = [];
    if (ementaFile) filesToAnalyze.push({ file: ementaFile, kind: 'ementa' });
    if (cronogramaFile) filesToAnalyze.push({ file: cronogramaFile, kind: 'cronograma' });
    if (escopoFile) filesToAnalyze.push({ file: escopoFile, kind: 'escopo' });

    if (filesToAnalyze.length === 0) {
      toast({
        title: 'Selecione os PDFs',
        description: 'Anexe pelo menos um arquivo PDF (ementa, cronograma ou escopo).',
        variant: 'destructive',
      });
      return;
    }

    setAnalyzingPdfs(true);
    try {
      const result = await analyzeSubjectDocumentsWithAi({
        teacherId: user.id,
        subjectName,
        files: filesToAnalyze,
        targetLessonsCount: context.total_lessons > 0 ? context.total_lessons : undefined,
        configId: selectedConfigId || undefined,
      });

      const now = new Date().toISOString();
      const updatedSourceFiles: SourceFileMeta[] = filesToAnalyze.map((f) => ({
        name: f.file.name,
        kind: f.kind,
        updatedAt: now,
      }));

      const nextContext: SubjectAiContext = {
        ...context,
        total_lessons: result.detectedTotalLessons || context.total_lessons,
        syllabus_text: result.syllabusSummary,
        schedule_map: result.scheduleMap,
        source_files: updatedSourceFiles,
      };

      const saved = await saveSubjectAiContext({
        ...nextContext,
        teacher_id: user.id,
      });

      setContext(saved);
      toast({
        title: 'PDFs analisados e salvos!',
        description: `${saved.schedule_map.length} aulas mapeadas com o modelo ${result.model}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao analisar PDFs',
        description: error instanceof Error ? error.message : 'Não foi possível ler os PDFs.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingPdfs(false);
    }
  };

  const handleSaveContext = async () => {
    if (!user?.id) return;
    setSavingContext(true);
    try {
      const saved = await saveSubjectAiContext({
        ...context,
        subject_id: subjectId,
        teacher_id: user.id,
      });
      setContext(saved);
      toast({
        title: 'Configuração salva',
        description: 'Ementa, quantidade de aulas e modelo foram salvos para esta disciplina.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar configuração',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSavingContext(false);
    }
  };

  const handleGenerateLesson = async () => {
    if (!user?.id) return;
    if (aiConfigs.length === 0) {
      toast({
        title: 'IA não configurada',
        description: 'Cadastre uma chave da API do Google nas Configurações do Professor.',
        variant: 'destructive',
      });
      return;
    }

    if (!context.content_template?.trim() && generateTarget !== 'plan') {
      toast({
        title: 'Modelo de aula não informado',
        description: 'Cole o seu modelo de aula na aba "Ementa, PDFs & Modelo" antes de gerar.',
        variant: 'destructive',
      });
      setActiveTab('context');
      return;
    }

    const rawExistingTitle =
      targetMode === 'existing' && selectedExistingLesson
        ? selectedExistingLesson.title
        : newTitle.trim();
    const isGenericTitle = !rawExistingTitle || /^aula\s*\d+\s*$/i.test(rawExistingTitle);
    const targetTitle =
      isGenericTitle && mappedScheduleItem?.title
        ? formatLessonTitleFromSchedule(effectiveOrderIndex, mappedScheduleItem.title)
        : rawExistingTitle || formatLessonTitleFromSchedule(effectiveOrderIndex, mappedScheduleItem?.title);

    const targetPeriod =
      targetMode === 'existing' && selectedExistingLesson
        ? selectedExistingLesson.period
        : newPeriod;

    const targetDate =
      targetMode === 'existing' && selectedExistingLesson
        ? selectedExistingLesson.lesson_date
        : newDate || mappedScheduleItem?.suggested_date || null;

    const currentIdxInSorted = sortedLessons.findIndex(
      (l) => Number(l.order_index) === Number(effectiveOrderIndex)
    );
    const prevLesson =
      currentIdxInSorted > 0 ? sortedLessons[currentIdxInSorted - 1]?.title : undefined;
    const nextLesson =
      currentIdxInSorted >= 0 && currentIdxInSorted < sortedLessons.length - 1
        ? sortedLessons[currentIdxInSorted + 1]?.title
        : undefined;

    setGenerating(true);
    try {
      const result = await generateSingleLessonWithAi({
        teacherId: user.id,
        subjectName,
        context,
        orderIndex: effectiveOrderIndex,
        title: targetTitle,
        period: targetPeriod,
        lessonDate: targetDate,
        mappedItem: mappedScheduleItem,
        existingLesson: selectedExistingLesson,
        previousLessonTitle: prevLesson,
        nextLessonTitle: nextLesson,
        extraInstructions,
        generateTarget,
        configId: selectedConfigId || undefined,
      });

      setGeneratedTitle(result.title || targetTitle);
      if (result.content !== undefined) setGeneratedContent(result.content);
      if (result.lessonPlan !== undefined) setGeneratedPlan(result.lessonPlan);

      toast({
        title: 'Aula gerada com IA!',
        description: `Gerada com ${result.model} seguindo o modelo da disciplina. Revise antes de salvar.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar aula',
        description: error instanceof Error ? error.message : 'Falha na geração com IA.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGeneratedLesson = async () => {
    if (generateTarget !== 'plan' && !generatedContent.trim()) {
      toast({
        title: 'Conteúdo vazio',
        description: 'Gere a aula antes de salvar no cronograma.',
        variant: 'destructive',
      });
      return;
    }

    setSavingLesson(true);
    try {
      if (selectedExistingLesson) {
        // Substitui conteúdo/plano (e título se atualizado pelo cronograma/professor) mantendo ordem, data, período e status
        const updatePayload: {
          title?: string;
          content?: string;
          lesson_plan?: string;
        } = {};

        const trimmedTitle = generatedTitle.trim();
        if (trimmedTitle && trimmedTitle !== selectedExistingLesson.title) {
          updatePayload.title = trimmedTitle;
        }
        if (generateTarget === 'content' || generateTarget === 'both') {
          updatePayload.content = generatedContent;
        }
        if (generateTarget === 'plan' || generateTarget === 'both') {
          updatePayload.lesson_plan = generatedPlan;
        }

        const updated = await subjectLessonService.update(
          String(selectedExistingLesson.id),
          updatePayload,
          subjectId
        );

        onLessonSaved(updated, true);
        toast({
          title: 'Aula atualizada no cronograma!',
          description: `"${updated.title}" teve seu conteúdo substituído mantendo a organização atual.`,
        });
      } else {
        const finalNewTitle =
          generatedTitle.trim() ||
          newTitle.trim() ||
          formatLessonTitleFromSchedule(newOrderIndex, mappedScheduleItem?.title);

        const created = await subjectLessonService.create({
          subject_id: subjectId,
          title: finalNewTitle,
          order_index: newOrderIndex,
          period: newPeriod || '1',
          lesson_date: newDate || mappedScheduleItem?.suggested_date || null,
          content: generatedContent || '',
          lesson_plan: generatedPlan || null,
          evaluation_type: 'none',
          is_completed: false,
        });

        onLessonSaved(created, false);
        toast({
          title: 'Aula adicionada ao cronograma!',
          description: `"${created.title}" foi criada na posição #${created.order_index}.`,
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: 'Erro ao salvar aula',
        description: error instanceof Error ? error.message : 'Não foi possível salvar no cronograma.',
        variant: 'destructive',
      });
    } finally {
      setSavingLesson(false);
    }
  };

  const renderedContentHtml = useMemo(
    () => (generatedContent ? sanitizeHtml(markdownToHtml(generatedContent)) : ''),
    [generatedContent]
  );

  const renderedPlanHtml = useMemo(
    () => (generatedPlan ? sanitizeHtml(markdownToHtml(generatedPlan)) : ''),
    [generatedPlan]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Gerador de Aulas com IA — {subjectName}
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Configure os PDFs e o modelo da disciplina uma vez, e gere ou substitua aulas no cronograma quando precisar.
              </DialogDescription>
            </div>

            {aiConfigs.length > 0 && (
              <div className="w-full sm:w-56">
                <Select value={selectedConfigId} onValueChange={setSelectedConfigId}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Modelo de IA" />
                  </SelectTrigger>
                  <SelectContent>
                    {aiConfigs.map((cfg) => (
                      <SelectItem key={cfg.id} value={cfg.id} className="text-xs">
                        {cfg.label || cfg.model_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </DialogHeader>

        {loadingContext ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Carregando configurações da disciplina...</span>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'generate' | 'context')}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 pt-3 border-b bg-background">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="generate" className="gap-1.5 text-xs sm:text-sm">
                  <Wand2 className="w-3.5 h-3.5" />
                  Gerar / Substituir Aula
                </TabsTrigger>
                <TabsTrigger value="context" className="gap-1.5 text-xs sm:text-sm">
                  <BookOpen className="w-3.5 h-3.5" />
                  Ementa, PDFs & Modelo
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ABA 1: GERAR / SUBSTITUIR AULA */}
            <TabsContent value="generate" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
              {/* Seleção de Aula no Cronograma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border bg-muted/20">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Destino no Cronograma</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={targetMode === 'existing' ? 'default' : 'outline'}
                      onClick={() => setTargetMode('existing')}
                      disabled={sortedLessons.length === 0}
                      className="flex-1 gap-1.5 text-xs"
                    >
                      <Replace className="w-3.5 h-3.5" />
                      Aula Existente ({sortedLessons.length})
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={targetMode === 'new' ? 'default' : 'outline'}
                      onClick={() => setTargetMode('new')}
                      className="flex-1 gap-1.5 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nova Aula
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">O que gerar</Label>
                  <Select
                    value={generateTarget}
                    onValueChange={(v) => setGenerateTarget(v as 'content' | 'plan' | 'both')}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content">Conteúdo da Aula (para alunos)</SelectItem>
                      <SelectItem value="plan">Plano de Aula (docente)</SelectItem>
                      <SelectItem value="both">Ambos (Conteúdo + Plano de Aula)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {targetMode === 'existing' ? (
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">Selecionar aula do cronograma</Label>
                    <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Escolha a aula..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {sortedLessons.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)} className="text-xs">
                            #{l.order_index} — {l.title}{' '}
                            {l.content?.trim() ? ' (possui conteúdo)' : ' (vazia)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Posição / Nº da Aula</Label>
                      <Input
                        type="number"
                        min={1}
                        value={newOrderIndex}
                        onChange={(e) => {
                          setTitleManuallyEdited(false);
                          setNewOrderIndex(Number(e.target.value) || 1);
                        }}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Título da Aula</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => {
                          setTitleManuallyEdited(true);
                          setNewTitle(e.target.value);
                        }}
                        placeholder="Ex: Aula 05 - Estrutura de Dados"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Período / Bimestre</Label>
                      <Select value={newPeriod} onValueChange={setNewPeriod}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1º Bimestre</SelectItem>
                          <SelectItem value="2">2º Bimestre</SelectItem>
                          <SelectItem value="3">3º Bimestre</SelectItem>
                          <SelectItem value="4">4º Bimestre</SelectItem>
                          <SelectItem value="none">Sem período</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Data Prevista (opcional)</Label>
                      <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Aviso de substituição quando aula já existe */}
              {selectedExistingLesson && (hasExistingContent || hasExistingPlan) && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      A aula #{selectedExistingLesson.order_index} ({selectedExistingLesson.title}) já existe no cronograma.
                    </p>
                    <p className="opacity-90 mt-0.5">
                      Ao salvar, o conteúdo gerado <strong>substituirá</strong> o conteúdo atual mantendo a ordem, data, período e status já organizados no cronograma.
                    </p>
                  </div>
                </div>
              )}

              {/* Contexto extraído do cronograma para esta aula */}
              {mappedScheduleItem && (
                <div className="p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300">
                    <FileText className="w-3.5 h-3.5" />
                    Tópicos mapeados dos PDFs para a Aula #{mappedScheduleItem.order_index}:
                  </div>
                  <p className="font-medium">{mappedScheduleItem.title}</p>
                  {mappedScheduleItem.objectives && (
                    <p className="text-muted-foreground">Objetivos: {mappedScheduleItem.objectives}</p>
                  )}
                  {mappedScheduleItem.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {mappedScheduleItem.topics.map((t, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[11px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Instruções extras */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Instruções adicionais para esta aula (opcional)
                </Label>
                <Textarea
                  rows={2}
                  value={extraInstructions}
                  onChange={(e) => setExtraInstructions(e.target.value)}
                  placeholder="Ex: Focar em exercícios práticos em Python, incluir 3 questões de fixação no final..."
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleGenerateLesson}
                  disabled={generating}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando aula com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar Aula Seguindo o Modelo
                    </>
                  )}
                </Button>
              </div>

              {/* Preview e Edição do Resultado */}
              {(generatedContent || generatedPlan) && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold">Prévia do Material Gerado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={previewMode === 'visual' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('visual')}
                        className="h-7 text-xs gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Visualizar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={previewMode === 'markdown' ? 'default' : 'outline'}
                        onClick={() => setPreviewMode('markdown')}
                        className="h-7 text-xs gap-1"
                      >
                        <Code2 className="w-3 h-3" />
                        Editar Markdown
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Título do Card da Aula (Cronograma)</Label>
                    <Input
                      value={generatedTitle}
                      onChange={(e) => setGeneratedTitle(e.target.value)}
                      placeholder="Ex: Aula 05 – Representação das informações"
                      className="h-9 text-xs font-medium"
                    />
                  </div>

                  {generatedContent && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Conteúdo da Aula</Label>
                      {previewMode === 'visual' ? (
                        <div
                          className="p-4 rounded-lg border bg-card prose prose-sm dark:prose-invert max-w-none max-h-80 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: renderedContentHtml }}
                        />
                      ) : (
                        <Textarea
                          rows={12}
                          value={generatedContent}
                          onChange={(e) => setGeneratedContent(e.target.value)}
                          className="font-mono text-xs"
                        />
                      )}
                    </div>
                  )}

                  {generatedPlan && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Plano de Aula (Docente)</Label>
                      {previewMode === 'visual' ? (
                        <div
                          className="p-4 rounded-lg border bg-card prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: renderedPlanHtml }}
                        />
                      ) : (
                        <Textarea
                          rows={8}
                          value={generatedPlan}
                          onChange={(e) => setGeneratedPlan(e.target.value)}
                          className="font-mono text-xs"
                        />
                      )}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      onClick={handleSaveGeneratedLesson}
                      disabled={savingLesson}
                      className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {savingLesson ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {selectedExistingLesson
                        ? 'Substituir Conteúdo no Cronograma'
                        : 'Salvar Nova Aula no Cronograma'}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 2: EMENTA, PDFs & MODELO */}
            <TabsContent value="context" className="flex-1 overflow-y-auto px-6 py-4 space-y-5 mt-0">
              <div className="p-4 rounded-xl border bg-muted/20 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <FileUp className="w-4 h-4 text-indigo-500" />
                      1. Documentos PDF da Disciplina
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Envie os PDFs para a IA extrair a ementa, escopo e mapear o cronograma.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Qtd. de aulas:</Label>
                    <Input
                      type="number"
                      min={1}
                      max={300}
                      value={context.total_lessons}
                      onChange={(e) =>
                        setContext((prev) => ({
                          ...prev,
                          total_lessons: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-20 h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">PDF da Ementa</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setEmentaFile(e.target.files?.[0] || null)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">PDF do Cronograma</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setCronogramaFile(e.target.files?.[0] || null)}
                      className="text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">PDF do Escopo</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setEscopoFile(e.target.files?.[0] || null)}
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                {context.source_files?.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Últimos PDFs processados:</span>
                    {context.source_files.map((sf, idx) => (
                      <Badge key={idx} variant="outline" className="text-[11px]">
                        {sf.kind}: {sf.name}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAnalyzePdfs}
                    disabled={analyzingPdfs}
                    className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {analyzingPdfs ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analisando PDFs com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analisar PDFs e Mapear Aulas
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  2. Resumo da Ementa, Escopo e Diretrizes ({context.schedule_map.length} aulas mapeadas)
                </Label>
                <Textarea
                  rows={4}
                  value={context.syllabus_text}
                  onChange={(e) => setContext((prev) => ({ ...prev, syllabus_text: e.target.value }))}
                  placeholder="Preenchido automaticamente ao analisar os PDFs, ou cole aqui o texto da ementa e escopo..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  3. Instruções Gerais de Geração & Modelo da Aula
                </Label>
                <Textarea
                  rows={8}
                  value={context.content_template}
                  onChange={(e) =>
                    setContext((prev) => ({ ...prev, content_template: e.target.value }))
                  }
                  placeholder="Escreva as instruções gerais (metodologia, tom, regras) e cole aqui o seu modelo de aula em Markdown..."
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  4. Modelo de Plano de Aula — Docente (opcional)
                </Label>
                <Textarea
                  rows={5}
                  value={context.lesson_plan_template}
                  onChange={(e) =>
                    setContext((prev) => ({ ...prev, lesson_plan_template: e.target.value }))
                  }
                  placeholder="Cole aqui o seu modelo de Plano de Aula do professor (se desejar gerar também o plano docente)..."
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleSaveContext}
                  disabled={savingContext}
                  className="gap-2"
                >
                  {savingContext ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Configuração da Disciplina
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
