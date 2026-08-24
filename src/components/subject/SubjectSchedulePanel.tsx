import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Award, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  Check, 
  X,
  Layers,
  ChevronRight,
  GraduationCap,
  CalendarCheck2,
  Presentation,
  Video,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import subjectLessonService, { SubjectLesson, CreateLessonData } from '@/services/subjectLessonService';
import SubjectLessonEditor from './SubjectLessonEditor';
import SubjectLessonViewer from './SubjectLessonViewer';

interface SubjectSchedulePanelProps {
  subjectId: number | string;
  subjectName?: string;
  canManage?: boolean;
}

export default function SubjectSchedulePanel({
  subjectId,
  subjectName = 'Disciplina',
  canManage = false
}: SubjectSchedulePanelProps) {
  const { toast } = useToast();

  const [lessons, setLessons] = useState<SubjectLesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [evalFilter, setEvalFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedLessonForEdit, setSelectedLessonForEdit] = useState<SubjectLesson | null>(null);
  const [selectedLessonForView, setSelectedLessonForView] = useState<SubjectLesson | null>(null);

  const numSubjectId = Number(subjectId);

  const loadLessons = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const data = await subjectLessonService.getBySubject(subjectId);
      setLessons(data);
    } catch (error) {
      console.error('Erro ao carregar aulas do cronograma:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as aulas do cronograma.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [subjectId, toast]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // Ações de Salvar / Criar / Editar
  const handleSaveLesson = async (formData: CreateLessonData) => {
    try {
      if (selectedLessonForEdit) {
        const updated = await subjectLessonService.update(
          String(selectedLessonForEdit.id),
          formData,
          numSubjectId
        );
        setLessons(prev => prev.map(item => String(item.id) === String(updated.id) ? updated : item));
        toast({
          title: 'Aula Atualizada',
          description: 'A aula foi salva com sucesso no cronograma.'
        });
      } else {
        const created = await subjectLessonService.create(formData);
        setLessons(prev => [...prev, created]);
        toast({
          title: 'Aula Criada',
          description: 'A nova aula foi adicionada ao cronograma com sucesso!'
        });
      }
      setIsEditorOpen(false);
      setSelectedLessonForEdit(null);
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Houve uma falha ao salvar a aula. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleToggleCompleted = async (lessonId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const updated = await subjectLessonService.toggleCompleted(lessonId, newStatus, numSubjectId);
      setLessons(prev => prev.map(item => String(item.id) === String(lessonId) ? { ...item, is_completed: newStatus } : item));
      
      if (selectedLessonForView && String(selectedLessonForView.id) === String(lessonId)) {
        setSelectedLessonForView(prev => prev ? { ...prev, is_completed: newStatus } : null);
      }

      toast({
        title: newStatus ? '✅ Aula Realizada' : '⏳ Aula Pendente',
        description: newStatus 
          ? 'Aula marcada como realizada com sucesso!' 
          : 'Aula marcada como pendente / agendada.'
      });
    } catch (error) {
      console.error('Erro ao alternar status da aula:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da aula.',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await subjectLessonService.delete(lessonId, numSubjectId);
      setLessons(prev => prev.filter(item => String(item.id) !== String(lessonId)));
      toast({
        title: 'Aula Excluída',
        description: 'A aula foi removida do cronograma.'
      });
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a aula.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenCreate = () => {
    setSelectedLessonForEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (lesson: SubjectLesson) => {
    setSelectedLessonForEdit(lesson);
    setIsEditorOpen(true);
  };

  const handleOpenView = (lesson: SubjectLesson) => {
    setSelectedLessonForView(lesson);
    setIsViewerOpen(true);
  };

  // Métricas
  const metrics = useMemo(() => {
    const total = lessons.length;
    const completed = lessons.filter(l => l.is_completed).length;
    const pending = total - completed;
    const withParcial = lessons.filter(l => l.evaluation_type === 'parcial').length;
    const withGlobal = lessons.filter(l => l.evaluation_type === 'global').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, withParcial, withGlobal, percent };
  }, [lessons]);

  // Filtros aplicados
  const filteredLessons = useMemo(() => {
    return lessons.filter(item => {
      // Filtro de período
      if (periodFilter !== 'all' && String(item.period) !== periodFilter) {
        return false;
      }
      // Filtro de avaliação
      if (evalFilter !== 'all' && item.evaluation_type !== evalFilter) {
        return false;
      }
      // Filtro de status
      if (statusFilter === 'completed' && !item.is_completed) return false;
      if (statusFilter === 'pending' && item.is_completed) return false;
      // Filtro de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }
      return true;
    });
  }, [lessons, periodFilter, evalFilter, statusFilter, searchQuery]);

  // Próximo índice sugerido para nova aula
  const nextOrderIndex = useMemo(() => {
    if (lessons.length === 0) return 1;
    const max = Math.max(...lessons.map(l => l.order_index || 0));
    return max + 1;
  }, [lessons]);

  // Formatação rápida de data
  const formatCardDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Data a definir';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      if (year && month && day) {
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return dateObj.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (e) {}
    return dateStr;
  };

  return (
    <div className="space-y-8">
      {/* Banner Principal com Identidade Visual Moderna */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 border border-blue-400/30 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-blue-950/20">
        {/* Efeitos de iluminação sutil */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-300/40 text-blue-200 font-semibold text-xs tracking-wide">
              <CalendarCheck2 className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
              <span>Cronograma Oficial de Aulas</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Acompanhe o Roteiro e Conteúdos das Aulas
            </h2>
            <p className="text-sm md:text-base text-blue-100/90 leading-relaxed font-normal">
              Acesse as anotações completas de cada aula, consulte as datas previstas e saiba com antecedência os conteúdos cobrados nas avaliações.
            </p>
          </div>

          {/* Ações do Topo */}
          <div className="flex items-center flex-wrap gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadLessons}
              className="bg-black/30 hover:bg-black/50 text-white border-white/20 gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg gap-2 h-9"
              >
                <Plus className="w-4 h-4" />
                Nova Aula
              </Button>
            )}
          </div>
        </div>

        {/* Métricas Rápidas */}
        {lessons.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-blue-200 block">Total de Aulas</span>
              <span className="text-2xl font-bold text-white">{metrics.total}</span>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-blue-200 block">Realizadas</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-400">{metrics.completed}</span>
                <span className="text-xs text-emerald-300">({metrics.percent}%)</span>
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-blue-200 block">Avaliação Parcial</span>
              <span className="text-2xl font-bold text-amber-400">{metrics.withParcial}</span>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-blue-200 block">Avaliação Global</span>
              <span className="text-2xl font-bold text-purple-400">{metrics.withGlobal}</span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="bg-card border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Campo de Busca */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título ou assunto da aula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background h-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtros em Abas Rápidas */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Filtro por Período */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
                <span className="px-2 font-semibold text-muted-foreground hidden sm:inline">Período:</span>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: '1', label: '1º Bim' },
                  { value: '2', label: '2º Bim' },
                  { value: '3', label: '3º Bim' },
                  { value: '4', label: '4º Bim' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setPeriodFilter(item.value)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      periodFilter === item.value
                        ? 'bg-background text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Status */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'completed', label: 'Realizadas' },
                  { value: 'pending', label: 'Pendentes' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setStatusFilter(item.value)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      statusFilter === item.value
                        ? 'bg-background text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Avaliação */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
                {[
                  { value: 'all', label: 'Qualquer Avaliação' },
                  { value: 'parcial', label: 'Parcial' },
                  { value: 'global', label: 'Global' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setEvalFilter(item.value)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      evalFilter === item.value
                        ? 'bg-background text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards de Aulas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground font-medium">Carregando cronograma de aulas...</p>
        </div>
      ) : filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <Card
              key={lesson.id}
              className={`bg-card border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
                lesson.is_completed ? 'border-emerald-500/20' : ''
              }`}
            >
              <div>
                {/* Header do Card com Badges */}
                <CardHeader className="pb-3 space-y-3 bg-gradient-to-b from-muted/40 to-transparent">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="font-bold text-xs bg-primary/10 text-primary border-primary/20">
                      Aula #{lesson.order_index || 1}
                    </Badge>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {lesson.period && lesson.period !== 'none' && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                          {lesson.period}º Bimestre
                        </Badge>
                      )}

                      {lesson.is_completed ? (
                        <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-700 text-[11px] px-1.5 py-0 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Realizada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px] px-1.5 py-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          Agendada
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Título da Aula */}
                  <CardTitle 
                    onClick={() => handleOpenView(lesson)}
                    className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors cursor-pointer line-clamp-2"
                  >
                    {lesson.title}
                  </CardTitle>

                  {/* Informações de Avaliação & Data */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      {formatCardDate(lesson.lesson_date)}
                    </span>

                    {lesson.evaluation_type === 'parcial' && (
                      <span className="text-amber-500 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Avaliação Parcial
                      </span>
                    )}

                    {lesson.evaluation_type === 'global' && (
                      <span className="text-purple-500 dark:text-purple-400 font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Avaliação Global
                      </span>
                    )}
                  </div>
                </CardHeader>

                {/* Conteúdo / Prévia */}
                <CardContent className="pt-2 pb-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-line break-words">
                  {lesson.content ? (
                    lesson.content
                      .replace(/^#+\s+/gm, '')
                      .replace(/\*\*/g, '')
                      .replace(/```[\s\S]*?```/g, '[Código]')
                      .replace(/>/g, '')
                      .trim()
                  ) : (
                    <span className="italic">Nenhum texto de resumo cadastrado.</span>
                  )}
                </CardContent>

                {/* Recursos Extras da Aula (PDF, Slides, Vídeo) */}
                {(lesson.pdf_url || lesson.presentation_url || lesson.video_url) && (
                  <div className="px-6 pb-3 pt-0 flex items-center gap-2 flex-wrap">
                    {lesson.pdf_url && (
                      <a
                        href={lesson.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25 hover:bg-red-500/20 hover:scale-[1.02] transition-all shadow-xs"
                        title="Abrir Material Complementar em PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                        PDF
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                      </a>
                    )}
                    {lesson.presentation_url && (
                      <a
                        href={lesson.presentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 hover:scale-[1.02] transition-all shadow-xs"
                        title="Abrir Apresentação de Slides"
                      >
                        <Presentation className="w-3.5 h-3.5 text-amber-500" />
                        Apresentação
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                      </a>
                    )}
                    {lesson.video_url && (
                      <a
                        href={lesson.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 hover:bg-purple-500/20 hover:scale-[1.02] transition-all shadow-xs"
                        title="Assistir Videoaula"
                      >
                        <Video className="w-3.5 h-3.5 text-purple-500" />
                        Vídeo
                        <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Rodapé com Ações */}
              <div className="p-4 pt-3 border-t bg-muted/20 flex items-center justify-between gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleOpenView(lesson)}
                  className="flex-1 w-full bg-primary/90 hover:bg-primary text-primary-foreground font-semibold text-xs gap-1.5 h-8 px-3"
                >
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Ver Aula Completa</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70 flex-shrink-0" />
                </Button>

                {canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant={lesson.is_completed ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleCompleted(String(lesson.id), lesson.is_completed)}
                      title={lesson.is_completed ? "Marcar como pendente" : "Marcar como realizada"}
                      className={`h-8 w-8 p-0 ${
                        lesson.is_completed 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(lesson)}
                      title="Editar Aula"
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Deseja realmente excluir "${lesson.title}"?`)) {
                          handleDeleteLesson(String(lesson.id));
                        }
                      }}
                      title="Excluir Aula"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 border-destructive/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="bg-card border-dashed">
          <CardContent className="p-12 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-foreground">Nenhuma aula encontrada</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || periodFilter !== 'all' || evalFilter !== 'all' || statusFilter !== 'all'
                  ? 'Não há aulas que correspondam aos filtros selecionados. Tente limpar os filtros.'
                  : 'Nenhuma aula cadastrada no cronograma desta disciplina até o momento.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              {searchQuery || periodFilter !== 'all' || evalFilter !== 'all' || statusFilter !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setPeriodFilter('all');
                    setEvalFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Limpar Todos os Filtros
                </Button>
              ) : canManage ? (
                <Button
                  onClick={handleOpenCreate}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeira Aula
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação / Edição */}
      <SubjectLessonEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedLessonForEdit(null);
        }}
        lesson={selectedLessonForEdit}
        subjectId={numSubjectId}
        subjectName={subjectName}
        nextOrderIndex={nextOrderIndex}
        onSave={handleSaveLesson}
      />

      {/* Modal de Visualização da Aula */}
      <SubjectLessonViewer
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedLessonForView(null);
        }}
        lesson={selectedLessonForView}
        subjectName={subjectName}
        isTeacher={canManage}
        onEdit={(lesson) => {
          setIsViewerOpen(false);
          handleOpenEdit(lesson);
        }}
        onDelete={(lessonId) => {
          setIsViewerOpen(false);
          handleDeleteLesson(lessonId);
        }}
        onToggleCompleted={handleToggleCompleted}
      />
    </div>
  );
}
