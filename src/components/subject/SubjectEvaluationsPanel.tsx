import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  X,
  Download,
  ExternalLink,
  Award,
  Calendar,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  FileDown,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import subjectEvaluationService, { SubjectEvaluation, CreateEvaluationData } from '@/services/subjectEvaluationService';
import SubjectEvaluationEditor from './SubjectEvaluationEditor';

interface SubjectEvaluationsPanelProps {
  subjectId: number | string;
  subjectName?: string;
  subjectGrade?: string;
  canManage?: boolean;
}

export default function SubjectEvaluationsPanel({
  subjectId,
  subjectName = 'Disciplina',
  subjectGrade = '1º Ano',
  canManage = false
}: SubjectEvaluationsPanelProps) {
  const { toast } = useToast();

  const [evaluations, setEvaluations] = useState<SubjectEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais de edição
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedEvalForEdit, setSelectedEvalForEdit] = useState<SubjectEvaluation | null>(null);

  const numSubjectId = Number(subjectId);

  const loadEvaluations = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const data = await subjectEvaluationService.getBySubject(subjectId);
      setEvaluations(data);
    } catch (error) {
      console.error('Erro ao carregar avaliações da disciplina:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as avaliações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [subjectId, toast]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  // Ações de Criar / Editar
  const handleSaveEvaluation = async (formData: CreateEvaluationData) => {
    try {
      if (selectedEvalForEdit) {
        const updated = await subjectEvaluationService.update(
          selectedEvalForEdit.id,
          formData,
          numSubjectId
        );
        setEvaluations(prev => prev.map(item => String(item.id) === String(updated.id) ? updated : item));
        toast({
          title: 'Avaliação Atualizada',
          description: 'A avaliação foi atualizada com sucesso!'
        });
      } else {
        const created = await subjectEvaluationService.create(formData);
        setEvaluations(prev => [created, ...prev]);
        toast({
          title: 'Avaliação Cadastrada',
          description: 'Nova avaliação adicionada com sucesso!'
        });
      }
      setIsEditorOpen(false);
      setSelectedEvalForEdit(null);
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Houve uma falha ao salvar a avaliação. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Ação de Deletar
  const handleDeleteEvaluation = async (evaluation: SubjectEvaluation) => {
    const confirmed = window.confirm(`Deseja realmente excluir a avaliação "${evaluation.name}"?`);
    if (!confirmed) return;

    try {
      await subjectEvaluationService.delete(evaluation.id, numSubjectId);
      setEvaluations(prev => prev.filter(item => String(item.id) !== String(evaluation.id)));
      toast({
        title: 'Avaliação Excluída',
        description: 'A avaliação foi removida com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir a avaliação.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenCreate = () => {
    setSelectedEvalForEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (evaluation: SubjectEvaluation) => {
    setSelectedEvalForEdit(evaluation);
    setIsEditorOpen(true);
  };

  // Métricas Rápidas
  const metrics = useMemo(() => {
    const total = evaluations.length;
    const parciais = evaluations.filter(e => (e.evaluation_type || '').toLowerCase().includes('parcial')).length;
    const globais = evaluations.filter(e => (e.evaluation_type || '').toLowerCase().includes('global')).length;
    const withPdf = evaluations.filter(e => Boolean(e.file_path)).length;

    return { total, parciais, globais, withPdf };
  }, [evaluations]);

  // Lista Filtrada
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((item) => {
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
  }, [evaluations, periodFilter, typeFilter, gradeFilter, searchQuery]);

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border border-purple-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <ClipboardList className="w-3.5 h-3.5" />
              Instrumentos de Avaliação & Provas
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Avaliações de {subjectName}
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-sm text-purple-200/80 max-w-2xl">
              Consulte e gerencie as avaliações parciais e globais com provas em PDF anexadas, datas agendadas, orientações e série correspondente.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadEvaluations}
              disabled={loading}
              className="bg-black/30 hover:bg-black/50 text-white border-white/20 gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg gap-2 h-9"
              >
                <Plus className="w-4 h-4" />
                Nova Avaliação
              </Button>
            )}
          </div>
        </div>

        {/* Métricas Rápidas */}
        {evaluations.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-purple-200 block">Total de Avaliações</span>
              <span className="text-2xl font-bold text-white">{metrics.total}</span>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-purple-200 block">Avaliações Parciais</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-amber-400">{metrics.parciais}</span>
                <Award className="w-4 h-4 text-amber-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-purple-200 block">Avaliações Globais</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-purple-400">{metrics.globais}</span>
                <Award className="w-4 h-4 text-purple-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-purple-200 block">Com Arquivo PDF</span>
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
                placeholder="Buscar por título ou orientações da avaliação..."
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

      {/* Grid de Cards de Avaliações */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
          <p className="text-sm text-muted-foreground font-medium">Carregando avaliações da disciplina...</p>
        </div>
      ) : filteredEvaluations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvaluations.map((item) => {
            const isGlobal = (item.evaluation_type || '').toLowerCase().includes('global');
            const hasPdf = Boolean(item.file_path);
            const dateFormatted = formatDate(item.deadline);

            return (
              <Card
                key={item.id}
                className={`bg-card border hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
                  isGlobal 
                    ? 'hover:border-purple-500/50' 
                    : 'hover:border-amber-500/50'
                }`}
              >
                <div>
                  {/* Topo do Card / Capa da Avaliação */}
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
                          : 'bg-gradient-to-br from-amber-900/20 via-orange-900/10 to-slate-900/30'
                      }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform ${
                          isGlobal
                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          <Award className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-bold tracking-wide uppercase ${
                          isGlobal ? 'text-purple-600 dark:text-purple-400' : 'text-amber-600 dark:text-amber-400'
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
                            : 'bg-amber-500/90 text-slate-950 font-extrabold'
                        }`}
                      >
                        <Award className="w-3 h-3" />
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
                            title="Editar Avaliação"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvaluation(item)}
                            className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                            title="Excluir Avaliação"
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
                      className="text-base font-bold text-foreground leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2"
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
                          {dateFormatted}
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
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs"
                      title="Abrir arquivo PDF da prova"
                    >
                      <FileDown className="w-4 h-4" />
                      Baixar Avaliação em PDF
                    </a>
                  ) : (
                    <div className="w-full text-center py-1.5 text-xs text-muted-foreground/80 italic bg-muted/30 rounded-md border border-dashed">
                      Avaliação realizada presencialmente
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
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-1">
              <ClipboardList className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {searchQuery || periodFilter !== 'all' || typeFilter !== 'all' || gradeFilter !== 'all'
                ? 'Nenhuma avaliação encontrada com os filtros aplicados'
                : 'Nenhuma avaliação cadastrada ainda'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              {searchQuery || periodFilter !== 'all' || typeFilter !== 'all' || gradeFilter !== 'all'
                ? 'Tente ajustar os filtros ou limpar o campo de busca para visualizar as demais provas.'
                : 'Nenhuma avaliação parcial ou global foi anexada a esta disciplina até o momento.'}
            </p>
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="mt-3 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Primeira Avaliação
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação / Edição */}
      <SubjectEvaluationEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        evaluation={selectedEvalForEdit}
        subjectId={subjectId}
        subjectName={subjectName}
        subjectGrade={subjectGrade}
        onSave={handleSaveEvaluation}
      />
    </div>
  );
}
