import { useTeacherDashboard, Subject } from '@/contexts/TeacherDashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Palette, 
  BookOpen, 
  FileText, 
  Code2, 
  Cpu, 
  Database, 
  Network, 
  Users, 
  Clock, 
  Search, 
  Terminal,
  Laptop,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SubjectColorEditModal from './SubjectColorEditModal';

export default function TeacherSubjectsTab() {
  const { subjects, loading, error, refetch } = useTeacherDashboard();
  const subjectsLoading = loading.subjects;
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showColorEditModal, setShowColorEditModal] = useState(false);
  const [userColors, setUserColors] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    console.log('TeacherSubjectsTab - Dados recebidos:', { subjects, subjectsLoading, error });
    loadUserColors();
  }, [subjects, subjectsLoading, error]);

  // Carregar cores personalizadas do professor
  const loadUserColors = async () => {
    try {
      const response = await fetch('/api/user-colors', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.colors) {
          const colorsMap: Record<number, string> = {};
          data.colors.forEach((item: any) => {
            colorsMap[item.subject_id] = item.color;
          });
          setUserColors(colorsMap);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cores personalizadas:', error);
    }
  };

  // Função para obter cor de uma disciplina (personalizada ou padrão)
  const getSubjectColor = (subject: Subject) => {
    if (userColors[subject.id]) {
      return userColors[subject.id];
    }
    return subject.color || '#4f46e5';
  };

  // Ícone temático contextual baseado no nome da disciplina (estilo utilitários)
  const getSubjectIcon = (name: string) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('html') || lower.includes('css') || lower.includes('web') || lower.includes('front')) {
      return Code2;
    }
    if (lower.includes('arquitetura') || lower.includes('hardware') || lower.includes('manuten') || lower.includes('computador')) {
      return Cpu;
    }
    if (lower.includes('banco') || lower.includes('dados') || lower.includes('sql')) {
      return Database;
    }
    if (lower.includes('rede') || lower.includes('seguran') || lower.includes('infra')) {
      return Network;
    }
    if (lower.includes('program') || lower.includes('lógica') || lower.includes('algoritmo') || lower.includes('javascript') || lower.includes('python')) {
      return Terminal;
    }
    if (lower.includes('sistema') || lower.includes('software')) {
      return Laptop;
    }
    if (lower.includes('projeto') || lower.includes('design')) {
      return Layers;
    }
    return BookOpen;
  };

  // Filtragem de disciplinas por busca
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(s => 
      s.name.toLowerCase().includes(q) || 
      (s.description && s.description.toLowerCase().includes(q)) ||
      String(s.id).includes(q)
    );
  }, [subjects, searchQuery]);

  const handleViewDetails = (subject: Subject) => {
    setSelectedSubject(subject);
  }

  const handleEditColor = (subject: Subject) => {
    setEditingSubject(subject);
    setShowColorEditModal(true);
  }

  const handleColorEditSuccess = () => {
    refetch.subjects();
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Minhas Disciplinas</h2>
          <p className="text-muted-foreground">Disciplinas que você leciona</p>
        </div>
      </div>

      {error?.subjects && (
        <div className="bg-destructive/10 border-destructive rounded-lg p-4 text-destructive">
          <p className="font-medium">Erro ao carregar disciplinas:</p>
          <p>{error.subjects}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch.subjects()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Suas Disciplinas</CardTitle>
              <CardDescription>
                Gerencie os conteúdos, notas e atividades das turmas que você leciona
              </CardDescription>
            </div>
            {/* Campo de Busca Rápida */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar disciplina..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border border-border/70 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {subjectsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-xs">Carregando suas disciplinas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubjects.map((subject) => {
                const cardColor = getSubjectColor(subject);
                const SubjectIcon = getSubjectIcon(subject.name);

                return (
                  <Card
                    key={subject.id}
                    className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-border/70 bg-card flex flex-col justify-between rounded-xl"
                  >
                    {/* Linha superior com gradiente dinâmico da disciplina */}
                    <div 
                      className="h-1 w-full opacity-70 group-hover:opacity-100 transition-all duration-300"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${cardColor}, transparent)`
                      }}
                    />

                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        {/* Ícone contextualizado com fundo translúcido */}
                        <div 
                          className="p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-200"
                          style={{
                            backgroundColor: `${cardColor}18`,
                            color: cardColor
                          }}
                        >
                          <SubjectIcon className="w-5 h-5" />
                        </div>

                        {/* Ações de topo: Trocar cor e Badge de Status */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditColor(subject);
                            }}
                            title="Personalizar cor e detalhes da disciplina"
                          >
                            <Palette className="h-3.5 w-3.5" />
                          </Button>

                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium py-0.5 px-2 flex items-center gap-1.5 transition-colors"
                            style={{
                              backgroundColor: `${cardColor}12`,
                              color: cardColor,
                              borderColor: `${cardColor}30`
                            }}
                          >
                            <span 
                              className="w-1.5 h-1.5 rounded-full animate-pulse" 
                              style={{ backgroundColor: cardColor }}
                            />
                            Ativo
                          </Badge>
                        </div>
                      </div>

                      {/* Título e Identificador */}
                      <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {subject.name}
                      </CardTitle>

                      <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1 min-h-[32px]">
                        {subject.description || 'Disciplina do curso técnico com acompanhamento de aulas, materiais e notas.'}
                      </CardDescription>

                      {/* Metadados rápidos */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                        <span className="bg-muted/70 px-2 py-0.5 rounded font-mono">
                          ID: {subject.id}
                        </span>
                        {subject.schedule && (
                          <span className="flex items-center gap-1 bg-muted/70 px-2 py-0.5 rounded">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {subject.schedule}
                          </span>
                        )}
                        {subject.current_students !== undefined && (
                          <span className="flex items-center gap-1 bg-muted/70 px-2 py-0.5 rounded">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            {subject.current_students} {subject.current_students === 1 ? 'aluno' : 'alunos'}
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    {/* Botões de Ação na base */}
                    <CardContent className="pt-0 pb-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 gap-1.5 h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/teacher/subjects/${subject.id}/edit`);
                          }}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Conteúdo
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full text-xs font-medium hover:bg-muted/80 transition-all duration-200 gap-1.5 h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(subject);
                          }}
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          Notas
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-medium hover:bg-muted border-border/80 transition-all duration-200 gap-1.5 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(subject);
                        }}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver Detalhes & Atividades
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredSubjects.length === 0 && !subjectsLoading && (
                <div className="col-span-full text-center py-10 px-4 bg-muted/20 rounded-xl border border-dashed border-border/80 text-muted-foreground space-y-3">
                  <BookOpen className="w-8 h-8 mx-auto opacity-40" />
                  <p className="font-medium text-sm">
                    {searchQuery ? 'Nenhuma disciplina encontrada para esta busca.' : 'Nenhuma disciplina encontrada.'}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery('')}
                    >
                      Limpar Busca
                    </Button>
                  )}
                  {!searchQuery && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch.subjects()}
                    >
                      Recarregar Disciplinas
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para detalhes da disciplina */}
      {selectedSubject && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSubject(null)}
        >
          <div 
            className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-border/60 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2.5 rounded-xl"
                  style={{
                    backgroundColor: `${getSubjectColor(selectedSubject)}18`,
                    color: getSubjectColor(selectedSubject)
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedSubject.name}</h3>
                  <p className="text-xs text-muted-foreground">ID da Disciplina: #{selectedSubject.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedSubject(null)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-3.5 text-sm">
              {selectedSubject.description && (
                <div className="p-3 bg-muted/40 rounded-xl border border-border/60">
                  <span className="text-xs font-semibold text-muted-foreground block mb-1 uppercase tracking-wider">Descrição / Ementa</span>
                  <p className="text-xs text-foreground leading-relaxed">{selectedSubject.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                {selectedSubject.schedule && (
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                    <span className="font-semibold text-muted-foreground block mb-1">Horário das Aulas</span>
                    <span className="text-foreground flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {selectedSubject.schedule}
                    </span>
                  </div>
                )}
                {selectedSubject.current_students !== undefined && (
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                    <span className="font-semibold text-muted-foreground block mb-1">Matrículas Ativas</span>
                    <span className="text-foreground flex items-center gap-1.5 font-medium">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      {selectedSubject.current_students} {selectedSubject.max_students ? `/ ${selectedSubject.max_students}` : ''} alunos
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSubject(null)}
                className="text-xs rounded-lg"
              >
                Fechar
              </Button>
              <Button
                size="sm"
                className="text-xs rounded-lg gap-1.5"
                onClick={() => {
                  const id = selectedSubject.id;
                  setSelectedSubject(null);
                  navigate(`/teacher/subjects/${id}/edit`);
                }}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Gerenciar Aulas & Conteúdo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Cor */}
      <SubjectColorEditModal
        isOpen={showColorEditModal}
        onClose={() => setShowColorEditModal(false)}
        subject={editingSubject}
        onSuccess={handleColorEditSuccess}
      />
    </div>
  );
}
