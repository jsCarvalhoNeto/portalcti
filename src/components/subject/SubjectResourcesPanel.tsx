import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Sparkles, 
  X,
  Video,
  Globe,
  Download,
  ExternalLink,
  Layers,
  FolderArchive,
  Wrench,
  BookMarked,
  Library,
  FileDown,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import subjectResourceService, { SubjectResource, CreateResourceData } from '@/services/subjectResourceService';
import SubjectResourceEditor from './SubjectResourceEditor';

interface SubjectResourcesPanelProps {
  subjectId: number | string;
  subjectName?: string;
  canManage?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  livro: {
    label: 'Livro',
    icon: BookOpen,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20'
  },
  video: {
    label: 'Vídeo',
    icon: Video,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20'
  },
  artigo: {
    label: 'Artigo',
    icon: FileText,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20'
  },
  site: {
    label: 'Site / Portal',
    icon: Globe,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20'
  },
  software: {
    label: 'Software',
    icon: Wrench,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20'
  },
  outro: {
    label: 'Outro',
    icon: FolderArchive,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20'
  }
};

export default function SubjectResourcesPanel({
  subjectId,
  subjectName = 'Disciplina',
  canManage = false
}: SubjectResourcesPanelProps) {
  const { toast } = useToast();

  const [resources, setResources] = useState<SubjectResource[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modais de edição
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedResourceForEdit, setSelectedResourceForEdit] = useState<SubjectResource | null>(null);

  const numSubjectId = Number(subjectId);

  const loadResources = useCallback(async () => {
    if (!subjectId) return;
    try {
      setLoading(true);
      const data = await subjectResourceService.getBySubject(subjectId);
      setResources(data);
    } catch (error) {
      console.error('Erro ao carregar recursos da disciplina:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os recursos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [subjectId, toast]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Ações de Criar / Editar
  const handleSaveResource = async (formData: CreateResourceData) => {
    try {
      if (selectedResourceForEdit) {
        const updated = await subjectResourceService.update(
          selectedResourceForEdit.id,
          formData,
          numSubjectId
        );
        setResources(prev => prev.map(item => String(item.id) === String(updated.id) ? updated : item));
        toast({
          title: 'Recurso Atualizado',
          description: 'O recurso foi atualizado com sucesso!'
        });
      } else {
        const created = await subjectResourceService.create(formData);
        setResources(prev => [created, ...prev]);
        toast({
          title: 'Recurso Adicionado',
          description: 'Novo recurso didático cadastrado com sucesso!'
        });
      }
      setIsEditorOpen(false);
      setSelectedResourceForEdit(null);
    } catch (error) {
      console.error('Erro ao salvar recurso:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Houve uma falha ao salvar o recurso. Tente novamente.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Ação de Deletar
  const handleDeleteResource = async (resource: SubjectResource) => {
    const confirmed = window.confirm(`Deseja realmente remover o recurso "${resource.title}"?`);
    if (!confirmed) return;

    try {
      await subjectResourceService.delete(resource.id, numSubjectId);
      setResources(prev => prev.filter(item => String(item.id) !== String(resource.id)));
      toast({
        title: 'Recurso Removido',
        description: 'O recurso foi excluído com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao excluir recurso:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o recurso.',
        variant: 'destructive'
      });
    }
  };

  const handleOpenCreate = () => {
    setSelectedResourceForEdit(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (resource: SubjectResource) => {
    setSelectedResourceForEdit(resource);
    setIsEditorOpen(true);
  };

  // Métricas Rápidas
  const metrics = useMemo(() => {
    const total = resources.length;
    const books = resources.filter(r => r.resource_type === 'livro').length;
    const videos = resources.filter(r => r.resource_type === 'video').length;
    const articles = resources.filter(r => r.resource_type === 'artigo').length;
    const websites = resources.filter(r => r.resource_type === 'site').length;
    const downloads = resources.filter(r => Boolean(r.download_url || r.file_path)).length;

    return { total, books, videos, articles, websites, downloads };
  }, [resources]);

  // Lista Filtrada
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      // Filtro por Tipo
      if (typeFilter !== 'all' && res.resource_type !== typeFilter) {
        return false;
      }

      // Filtro por Busca
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = res.title.toLowerCase().includes(query);
        const matchDesc = res.description ? res.description.toLowerCase().includes(query) : false;
        if (!matchTitle && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [resources, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Principal Inspirado no Cronograma */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 border border-blue-500/20 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
              <Library className="w-3.5 h-3.5" />
              Recursos Didáticos & Materiais
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Recursos de {subjectName}
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h2>
            <p className="text-sm text-blue-200/80 max-w-2xl">
              Acesse livros recomendados com capas, videoaulas complementares, artigos técnicos, links para sites de referência e arquivos para download.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={loadResources}
              disabled={loading}
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
                Novo Recurso
              </Button>
            )}
          </div>
        </div>

        {/* Métricas Rápidas */}
        {resources.length > 0 && (
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-blue-200 block">Total de Recursos</span>
              <span className="text-2xl font-bold text-white">{metrics.total}</span>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-blue-200 block">Livros / E-books</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-blue-400">{metrics.books}</span>
                <BookOpen className="w-4 h-4 text-blue-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-blue-200 block">Vídeos & Aulas</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-red-400">{metrics.videos}</span>
                <Video className="w-4 h-4 text-red-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10">
              <span className="text-xs text-blue-200 block">Artigos & Textos</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-emerald-400">{metrics.articles}</span>
                <FileText className="w-4 h-4 text-emerald-300 opacity-60" />
              </div>
            </div>
            <div className="bg-black/25 rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-xs text-blue-200 block">Com Download</span>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-cyan-400">{metrics.downloads}</span>
                <Download className="w-4 h-4 text-cyan-300 opacity-60" />
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
                placeholder="Buscar por título ou descrição do recurso..."
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

            {/* Filtros por Categoria de Recurso */}
            <div className="flex items-center flex-wrap gap-1.5 bg-muted/60 p-1 rounded-lg border text-xs">
              <span className="px-2 font-semibold text-muted-foreground hidden sm:inline">Tipo:</span>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'livro', label: 'Livros' },
                { value: 'video', label: 'Vídeos' },
                { value: 'artigo', label: 'Artigos' },
                { value: 'site', label: 'Sites' },
                { value: 'software', label: 'Softwares' },
                { value: 'outro', label: 'Outros' }
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
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards de Recursos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground font-medium">Carregando recursos didáticos...</p>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => {
            const config = TYPE_CONFIG[resource.resource_type] || TYPE_CONFIG.outro;
            const Icon = config.icon;
            const hasDownload = Boolean(resource.download_url || resource.file_path);
            const hasUrl = Boolean(resource.url);

            return (
              <Card
                key={resource.id}
                className="bg-card border hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Capa do Recurso */}
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] bg-muted/30 border-b overflow-hidden">
                    {resource.cover_url ? (
                      <img
                        src={resource.cover_url}
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Fallback em caso de erro ao carregar a imagem
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className={`w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted/50 to-muted ${config.bg}`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.bg} ${config.color} border ${config.border} shadow-sm group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {config.label}
                        </span>
                      </div>
                    )}

                    {/* Badge Sobreposta de Tipo */}
                    <div className="absolute top-2.5 left-2.5">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-bold px-2 py-0.5 backdrop-blur-md shadow-sm flex items-center gap-1 ${config.bg} ${config.color} border ${config.border}`}
                      >
                        <Icon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </div>

                    {/* Botões de Gestão (Editar / Deletar) sobre a capa */}
                    {canManage && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-md p-1 rounded-lg border shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(resource)}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Editar Recurso"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResource(resource)}
                          className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir Recurso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo do Card */}
                  <CardHeader className="p-4 pb-2 space-y-1.5">
                    <CardTitle
                      className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2"
                      title={resource.title}
                    >
                      {resource.title}
                    </CardTitle>
                    {resource.description && (
                      <CardDescription className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {resource.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </div>

                {/* Rodapé com Links de Acesso e Download */}
                <CardContent className="p-4 pt-2 border-t mt-3 bg-muted/10 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {hasUrl && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Acessar
                      </a>
                    )}

                    {hasDownload && (
                      <a
                        href={resource.download_url || resource.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-xs ${
                          hasUrl 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'flex-1 bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                        title="Baixar arquivo ou material"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    )}

                    {!hasUrl && !hasDownload && (
                      <div className="w-full text-center py-1 text-[11px] text-muted-foreground italic">
                        Material de consulta em sala
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Estado Vazio */
        <Card className="bg-card border border-dashed py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
              <Library className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {searchQuery || typeFilter !== 'all'
                ? 'Nenhum recurso encontrado com os filtros aplicados'
                : 'Nenhum recurso didático cadastrado ainda'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              {searchQuery || typeFilter !== 'all'
                ? 'Tente remover a busca ou selecionar outro tipo para ver os demais materiais.'
                : 'Nenhum livro, vídeo, artigo ou material foi anexado a esta disciplina até o momento.'}
            </p>
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                className="mt-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Cadastrar Primeiro Recurso
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação / Edição */}
      <SubjectResourceEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        resource={selectedResourceForEdit}
        subjectId={subjectId}
        subjectName={subjectName}
        onSave={handleSaveResource}
      />
    </div>
  );
}
