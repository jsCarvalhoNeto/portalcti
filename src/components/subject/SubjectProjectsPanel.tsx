import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FolderOpen, 
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
  FileDown,
  Layers,
  Paperclip,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import subjectProjectService, { SubjectProject, CreateProjectData } from '@/services/subjectProjectService';
import SubjectProjectEditor from './SubjectProjectEditor';

interface SubjectProjectsPanelProps {
  subjectId: number | string;
  subjectName?: string;
  subjectGrade?: string;
  canManage?: boolean;
}

export default function SubjectProjectsPanel({
  subjectId,
  subjectName = 'Disciplina',
  subjectGrade = '1º Ano',
  canManage = false
}: SubjectProjectsPanelProps) {
  const { toast } = useToast();

  const [projects, setProjects] = useState<SubjectProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais de edição
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState<SubjectProject | null>(null);

  const numSubjectId = Number(subjectId);

  const loadProjects = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const data = await subjectProjectService.getBySubject(subjectId);
      setProjects(data);
    } catch (error) {
      console.error('Erro ao carregar projetos da disciplina:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os projetos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [subjectId, toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Ações de Criar / Editar
  const handleSaveProject = async (formData: CreateProjectData) => {
    try {
      if (selectedProjectForEdit) {
        const updated = await subjectProjectService.update(
          selectedProjectForEdit.id,
          formData,
          numSubjectId
        );
        setProjects(prev => prev.map(item => String(item.id) === String(updated.id) ? updated : item));
        toast({
          title: 'Projeto Atualizado',
          description: 'O projeto foi atualizado com sucesso!'
        });
      } else {
        const created = await subjectProjectService.create(formData);
        setProjects(prev => [created, ...prev]);
        toast({
          title: 'Projeto Cadastrado',
          description: 'Novo projeto adicionado com sucesso!'
        });
      }
      setIsEditorOpen(false);
      setSelectedProjectForEdit(null);
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Houve uma falha ao salvar o projeto. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Ação de Deletar
  const handleDeleteProject = async (project: SubjectProject) => {
    const confirmed = window.confirm(`Deseja realmente excluir o projeto "${project.name}"?`);
    if (!confirmed) return;

    try {
      await subjectProjectService.delete(project.id, numSubjectId);
      setProjects(prev => prev.filter(item => String(item.id) !== String(project.id)));
      toast({
        title: 'Projeto Excluído',
        description: 'O projeto foi removido com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o projeto.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenCreate = () => {
    setSelectedProjectForEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (project: SubjectProject) => {
    setSelectedProjectForEdit(project);
    setIsEditorOpen(true);
  };

  // Métricas Rápidas
  const metrics = useMemo(() => {
    const total = projects.length;
    const withStartDate = projects.filter(p => Boolean(p.start_date)).length;
    const withFiles = projects.filter(p => Boolean(p.file_path || (p.files && p.files.length > 0))).length;
    const withDeadline = projects.filter(p => Boolean(p.deadline)).length;

    return { total, withStartDate, withFiles, withDeadline };
  }, [projects]);

  // Lista Filtrada
  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      // Filtro por Período
      if (periodFilter !== 'all') {
        const itemPeriod = (item.period || '').toLowerCase();
        if (periodFilter === '1' && !itemPeriod.includes('1')) return false;
        if (periodFilter === '2' && !itemPeriod.includes('2')) return false;
        if (periodFilter === '3' && !itemPeriod.includes('3')) return false;
        if (periodFilter === '4' && !itemPeriod.includes('4')) return false;
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
  }, [projects, periodFilter, gradeFilter, searchQuery]);

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border border-emerald-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <FolderOpen className="w-3.5 h-3.5" />
              Projetos Práticos & Integradores
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Projetos de {subjectName}
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-sm text-emerald-200/80 max-w-2xl">
              Acompanhe as propostas de projetos, datas de início e entrega, orientações e baixe os arquivos e especificações anexadas.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProjects}
              disabled={loading}
              className="bg-black/30 hover:bg-black/50 text-white border-white/20 gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg gap-2 h-9"
              >
                <Plus className="w-4 h-4" />
                Novo Projeto
              </Button>
            )}
          </div>
        </div>

        {/* Métricas Rápidas */}
        {projects.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-emerald-200 block">Total de Projetos</span>
              <span className="text-2xl font-bold text-white">{metrics.total}</span>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-emerald-200 block">Com Data de Início</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-emerald-400">{metrics.withStartDate}</span>
                <Calendar className="w-4 h-4 text-emerald-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-emerald-200 block">Com Arquivos Anexos</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-teal-400">{metrics.withFiles}</span>
                <Paperclip className="w-4 h-4 text-teal-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-emerald-200 block">Com Prazo Definido</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-cyan-400">{metrics.withDeadline}</span>
                <Clock className="w-4 h-4 text-cyan-300 opacity-60" />
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
                placeholder="Buscar por título ou descrição do projeto..."
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

      {/* Grid de Cards de Projetos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
          <p className="text-sm text-muted-foreground font-medium">Carregando projetos da disciplina...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((item) => {
            const startDateFormatted = formatDate(item.start_date);
            const deadlineFormatted = formatDate(item.deadline);
            const filesList = item.files || [];

            return (
              <Card
                key={item.id}
                className="bg-card border hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Topo do Card / Capa do Projeto */}
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
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2.5 p-4 bg-gradient-to-br from-emerald-900/20 via-teal-900/10 to-slate-900/30">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          <FolderOpen className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold tracking-wide uppercase text-emerald-600 dark:text-emerald-400">
                          Projeto Prático
                        </span>
                      </div>
                    )}

                    {/* Badges Sobrepostas no Topo Esquerdo */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-bold px-2 py-0.5 backdrop-blur-md shadow-sm flex items-center gap-1 bg-emerald-600/90 text-white"
                      >
                        <FolderOpen className="w-3 h-3" />
                        Projeto
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

                    {/* Ações de Gestão (Professor) ou Série */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                      {canManage ? (
                        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity bg-background/85 backdrop-blur-md p-1 rounded-lg border shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Editar Projeto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(item)}
                            className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                            title="Excluir Projeto"
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
                      className="text-base font-bold text-foreground leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2"
                      title={item.name}
                    >
                      {item.name}
                    </CardTitle>

                    {/* Datas de Início e Término */}
                    <div className="space-y-1 pt-1 border-t border-border/40 text-xs">
                      {startDateFormatted && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            Início:
                          </span>
                          <span className="font-semibold text-foreground">{startDateFormatted}</span>
                        </div>
                      )}

                      {deadlineFormatted && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            Entrega:
                          </span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{deadlineFormatted}</span>
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <CardDescription className="text-xs text-muted-foreground line-clamp-3 leading-relaxed pt-1">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </div>

                {/* Rodapé com Arquivos Anexados para Download */}
                <CardContent className="p-4 pt-2 border-t mt-3 bg-muted/10 space-y-2">
                  {filesList.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                        <Paperclip className="w-3 h-3 text-emerald-500" />
                        Arquivos do Projeto ({filesList.length}):
                      </span>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {filesList.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all shadow-xs"
                            title={`Baixar ${file.name}`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <FileText className="w-3 h-3 shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </span>
                            <FileDown className="w-3.5 h-3.5 shrink-0 ml-1" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full text-center py-1.5 text-xs text-muted-foreground/80 italic bg-muted/30 rounded-md border border-dashed">
                      Nenhum arquivo anexado ao projeto
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
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {searchQuery || periodFilter !== 'all' || gradeFilter !== 'all'
                ? 'Nenhum projeto encontrado com os filtros aplicados'
                : 'Nenhum projeto cadastrado ainda'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              {searchQuery || periodFilter !== 'all' || gradeFilter !== 'all'
                ? 'Tente ajustar os filtros ou limpar a pesquisa para visualizar os demais projetos.'
                : 'Nenhum projeto prático ou integrador foi cadastrado nesta disciplina até o momento.'}
            </p>
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Primeiro Projeto
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação / Edição */}
      <SubjectProjectEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        project={selectedProjectForEdit}
        subjectId={subjectId}
        subjectName={subjectName}
        subjectGrade={subjectGrade}
        onSave={handleSaveProject}
      />
    </div>
  );
}
