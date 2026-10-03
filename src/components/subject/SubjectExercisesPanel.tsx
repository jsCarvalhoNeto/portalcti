import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  PenTool, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  X,
  FileText,
  Calendar,
  GraduationCap,
  Award,
  FileDown,
  Layers,
  CheckSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import subjectExerciseService, { SubjectExercise, CreateExerciseData } from '@/services/subjectExerciseService';
import SubjectExerciseEditor from './SubjectExerciseEditor';

interface SubjectExercisesPanelProps {
  subjectId: number | string;
  subjectName?: string;
  subjectGrade?: string;
  canManage?: boolean;
}

export default function SubjectExercisesPanel({
  subjectId,
  subjectName = 'Disciplina',
  subjectGrade = '1º Ano',
  canManage = false
}: SubjectExercisesPanelProps) {
  const { toast } = useToast();

  const [exercises, setExercises] = useState<SubjectExercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais de edição
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = useState<SubjectExercise | null>(null);

  const numSubjectId = Number(subjectId);

  const loadExercises = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const data = await subjectExerciseService.getBySubject(subjectId);
      setExercises(data);
    } catch (error) {
      console.error('Erro ao carregar exercícios da disciplina:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os exercícios.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [subjectId, toast]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Ações de Criar / Editar
  const handleSaveExercise = async (formData: CreateExerciseData) => {
    try {
      if (selectedExerciseForEdit) {
        const updated = await subjectExerciseService.update(
          selectedExerciseForEdit.id,
          formData,
          numSubjectId
        );
        setExercises(prev => prev.map(item => String(item.id) === String(updated.id) ? updated : item));
        toast({
          title: 'Exercício Atualizado',
          description: 'A lista de exercícios foi atualizada com sucesso!'
        });
      } else {
        const created = await subjectExerciseService.create(formData);
        setExercises(prev => [created, ...prev]);
        toast({
          title: 'Exercício Adicionado',
          description: 'Nova lista de exercícios cadastrada com sucesso!'
        });
      }
      setIsEditorOpen(false);
      setSelectedExerciseForEdit(null);
    } catch (error) {
      console.error('Erro ao salvar exercício:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Houve uma falha ao salvar o exercício. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Ação de Deletar
  const handleDeleteExercise = async (exercise: SubjectExercise) => {
    const confirmed = window.confirm(`Deseja realmente excluir o exercício "${exercise.name}"?`);
    if (!confirmed) return;

    try {
      await subjectExerciseService.delete(exercise.id, numSubjectId);
      setExercises(prev => prev.filter(item => String(item.id) !== String(exercise.id)));
      toast({
        title: 'Exercício Excluído',
        description: 'A lista de exercícios foi removida com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir exercício:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o exercício.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenCreate = () => {
    setSelectedExerciseForEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (exercise: SubjectExercise) => {
    setSelectedExerciseForEdit(exercise);
    setIsEditorOpen(true);
  };

  // Métricas Rápidas
  const metrics = useMemo(() => {
    const total = exercises.length;
    const parciais = exercises.filter(e => (e.evaluation_type || '').toLowerCase().includes('parcial')).length;
    const globais = exercises.filter(e => (e.evaluation_type || '').toLowerCase().includes('global')).length;
    const withPdf = exercises.filter(e => Boolean(e.file_path)).length;

    return { total, parciais, globais, withPdf };
  }, [exercises]);

  // Lista Filtrada
  const filteredExercises = useMemo(() => {
    return exercises.filter((item) => {
      // Filtro por Período
      if (periodFilter !== 'all') {
        const itemPeriod = (item.period || '').toLowerCase();
        if (periodFilter === '1' && !itemPeriod.includes('1')) return false;
        if (periodFilter === '2' && !itemPeriod.includes('2')) return false;
        if (periodFilter === '3' && !itemPeriod.includes('3')) return false;
        if (periodFilter === '4' && !itemPeriod.includes('4')) return false;
      }

      // Filtro por Tipo (Parcial vs Global)
      if (typeFilter !== 'all') {
        const itemType = (item.evaluation_type || '').toLowerCase();
        if (typeFilter === 'parcial' && !itemType.includes('parcial')) return false;
        if (typeFilter === 'global' && !itemType.includes('global')) return false;
      }

      // Filtro por Série
      if (gradeFilter !== 'all') {
        const itemGrade = (item.grade || '').toLowerCase();
        if (gradeFilter === '1' && !itemGrade.includes('1')) return false;
        if (gradeFilter === '2' && !itemGrade.includes('2')) return false;
        if (gradeFilter === '3' && !itemGrade.includes('3')) return false;
      }

      // Filtro por Busca
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.name.toLowerCase().includes(query);
        const matchDesc = item.description ? item.description.toLowerCase().includes(query) : false;
        if (!matchTitle && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [exercises, periodFilter, typeFilter, gradeFilter, searchQuery]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Principal Inspirado no Cronograma e Recursos */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-950 via-amber-950 to-slate-950 border border-orange-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
              <PenTool className="w-3.5 h-3.5" />
              Listas de Exercícios & Atividades Práticas
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Exercícios de {subjectName}
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-sm text-orange-200/80 max-w-2xl">
              Consulte e gerencie as listas de exercícios, prazos de entrega, PDFs com enunciados e atividades práticas da disciplina.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadExercises}
              disabled={loading}
              className="bg-black/30 hover:bg-black/50 text-white border-white/20 gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-lg gap-2 h-9"
              >
                <Plus className="w-4 h-4" />
                Novo Exercício
              </Button>
            )}
          </div>
        </div>

        {/* Métricas Rápidas */}
        {exercises.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-orange-200 block">Total de Exercícios</span>
              <span className="text-2xl font-bold text-white">{metrics.total}</span>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-orange-200 block">Atividades Parciais</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-amber-400">{metrics.parciais}</span>
                <Award className="w-4 h-4 text-amber-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-orange-200 block">Atividades Globais</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-purple-400">{metrics.globais}</span>
                <Award className="w-4 h-4 text-purple-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-orange-200 block">Com Arquivo PDF</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-emerald-400">{metrics.withPdf}</span>
                <FileText className="w-4 h-4 text-emerald-300 opacity-60" />
              </div>
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
                placeholder="Buscar por título ou orientações do exercício..."
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

            {/* Filtros em Pílulas */}
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

              {/* Filtro por Tipo */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'parcial', label: 'Parcial' },
                  { value: 'global', label: 'Global' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setTypeFilter(item.value)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      typeFilter === item.value
                        ? 'bg-background text-foreground shadow-sm font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Série */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
                {[
                  { value: 'all', label: 'Todas Séries' },
                  { value: '1', label: '1º Ano' },
                  { value: '2', label: '2º Ano' },
                  { value: '3', label: '3º Ano' }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setGradeFilter(item.value)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      gradeFilter === item.value
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

      {/* Grid de Cards de Exercícios */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
          <p className="text-sm text-muted-foreground font-medium">Carregando listas de exercícios...</p>
        </div>
      ) : filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map((item) => {
            const isGlobal = (item.evaluation_type || '').toLowerCase().includes('global');
            const hasPdf = Boolean(item.file_path);
            const dateFormatted = formatDate(item.deadline);

            return (
              <Card
                key={item.id}
                className={`bg-card border hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
                  isGlobal 
                    ? 'hover:border-purple-500/50' 
                    : 'hover:border-orange-500/50'
                }`}
              >
                <div>
                  {/* Topo do Card / Capa do Exercício */}
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] bg-muted/30 border-b overflow-hidden">
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center gap-2.5 p-4 ${
                        isGlobal 
                          ? 'bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-slate-900/30' 
                          : 'bg-gradient-to-br from-orange-900/20 via-amber-900/10 to-slate-900/30'
                      }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform ${
                          isGlobal
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                        }`}>
                          <PenTool className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-bold tracking-wide uppercase ${
                          isGlobal ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'
                        }`}>
                          {item.evaluation_type}
                        </span>
                      </div>
                    )}

                    {/* Badges Sobrepostas no Topo Esquerdo */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-bold px-2 py-0.5 backdrop-blur-md shadow-sm flex items-center gap-1 ${
                          isGlobal
                            ? 'bg-purple-600/90 text-white'
                            : 'bg-orange-500/90 text-white font-extrabold'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3" />
                        {isGlobal ? 'Global' : 'Parcial'}
                      </Badge>

                      {item.period && (
                        <Badge
                          variant="outline"
                          className="text-[11px] font-semibold px-1.5 py-0 bg-background/80 backdrop-blur-md"
                        >
                          {item.period}
                        </Badge>
                      )}
                    </div>

                    {/* Badge da Série no Topo Direito ou Ações */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {canManage ? (
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity bg-background/85 backdrop-blur-md p-1 rounded-lg border shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Editar Exercício"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExercise(item)}
                            className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                            title="Excluir Exercício"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-background/80 backdrop-blur-md">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {item.grade}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo do Card */}
                  <CardHeader className="p-4 pb-2 space-y-2">
                    <CardTitle
                      className="text-base font-bold text-foreground leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2"
                      title={item.name}
                    >
                      {item.name}
                    </CardTitle>

                    {/* Informações de Série e Data */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1 font-medium">
                        <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                        {item.grade || subjectGrade}
                      </span>

                      {dateFormatted && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                          <Calendar className="w-3.5 h-3.5" />
                          Prazo: {dateFormatted}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <CardDescription className="text-xs text-muted-foreground line-clamp-3 leading-relaxed pt-1">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </div>

                {/* Rodapé com Download do PDF */}
                <CardContent className="p-4 pt-2 border-t mt-3 bg-muted/10">
                  {hasPdf ? (
                    <a
                      href={item.file_path!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-xs"
                      title="Abrir arquivo PDF da lista de exercícios"
                    >
                      <FileDown className="w-4 h-4" />
                      Baixar Lista em PDF
                    </a>
                  ) : (
                    <div className="w-full text-center py-1.5 text-xs text-muted-foreground/80 italic bg-muted/30 rounded-md border border-dashed">
                      Atividade prática em laboratório
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Estado Vazio */
        <Card className="bg-card border border-dashed py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-1">
              <PenTool className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {searchQuery || periodFilter !== 'all' || typeFilter !== 'all' || gradeFilter !== 'all'
                ? 'Nenhum exercício encontrado com os filtros aplicados'
                : 'Nenhum exercício cadastrado ainda'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              {searchQuery || periodFilter !== 'all' || typeFilter !== 'all' || gradeFilter !== 'all'
                ? 'Tente ajustar os filtros ou limpar o campo de busca para visualizar as demais atividades.'
                : 'Nenhuma lista de exercícios ou atividade prática foi anexada a esta disciplina até o momento.'}
            </p>
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="mt-3 bg-orange-600 hover:bg-orange-700 text-white font-bold gap-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Primeiro Exercício
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação / Edição */}
      <SubjectExerciseEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        exercise={selectedExerciseForEdit}
        subjectId={subjectId}
        subjectName={subjectName}
        subjectGrade={subjectGrade}
        onSave={handleSaveExercise}
      />
    </div>
  );
}
