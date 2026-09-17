import { useState, useRef, useEffect, useMemo } from 'react';
import { useTeacherDashboard, Activity } from '@/contexts/TeacherDashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  FileText, 
  CheckCircle, 
  Edit3, 
  Edit, 
  Crown, 
  UserCheck, 
  GraduationCap,
  Search,
  Filter,
  RotateCcw,
  Calendar,
  BookOpen,
  Layers,
  Award,
  Tag
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import NewActivityModal from './NewActivityModal';
import EditActivityModal from './EditActivityModal';
import ActivityGradesModal from './ActivityGradesModal';
import CreateTeamModal from './CreateTeamModal';
import ActivityTeamsModal from './ActivityTeamsModal';
import TeacherConsolidatedGradesManager from './TeacherConsolidatedGradesManager';

export default function TeacherGradesActivitiesTab() {
  const { activities, subjects, grades, loading } = useTeacherDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  // Estados para modais de equipe
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [selectedActivityForTeams, setSelectedActivityForTeams] = useState<Activity | null>(null);
  
  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [filterEvaluationType, setFilterEvaluationType] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const activitiesLoading = loading.activities;

  // Anos civis extraídos das atividades
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    activities.forEach(act => {
      if (act.created_at) {
        const y = new Date(act.created_at).getFullYear().toString();
        if (y && !isNaN(Number(y))) {
          years.add(y);
        }
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [activities]);

  // Séries disponíveis (do contexto e das próprias atividades)
  const availableGrades = useMemo(() => {
    const gradeSet = new Set<string>(grades || []);
    activities.forEach(act => {
      if (act.grade && act.grade.trim()) {
        gradeSet.add(act.grade.trim());
      }
    });
    return Array.from(gradeSet).sort();
  }, [grades, activities]);

  // Disciplinas disponíveis (do contexto e das atividades)
  const availableSubjects = useMemo(() => {
    const map = new Map<number, string>();
    if (subjects) {
      subjects.forEach(s => map.set(s.id, s.name));
    }
    activities.forEach(act => {
      if (act.subject_id && act.subject_name) {
        map.set(act.subject_id, act.subject_name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [subjects, activities]);

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (filterSubject !== 'all') count++;
    if (filterGrade !== 'all') count++;
    if (filterYear !== 'all') count++;
    if (filterPeriod !== 'all') count++;
    if (filterEvaluationType !== 'all') count++;
    if (filterType !== 'all') count++;
    return count;
  }, [searchTerm, filterSubject, filterGrade, filterYear, filterPeriod, filterEvaluationType, filterType]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterSubject('all');
    setFilterGrade('all');
    setFilterYear('all');
    setFilterPeriod('all');
    setFilterEvaluationType('all');
    setFilterType('all');
  };

  // Atividades filtradas
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = activity.name?.toLowerCase().includes(term);
        const matchDesc = activity.description?.toLowerCase().includes(term);
        const matchSubject = activity.subject_name?.toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchSubject) return false;
      }

      // Disciplina
      if (filterSubject !== 'all') {
        if (activity.subject_id?.toString() !== filterSubject) return false;
      }

      // Série
      if (filterGrade !== 'all') {
        if (activity.grade !== filterGrade && !activity.grade?.includes(filterGrade)) return false;
      }

      // Ano Civil / Letivo
      if (filterYear !== 'all') {
        const actYear = new Date(activity.created_at).getFullYear().toString();
        if (actYear !== filterYear) return false;
      }

      // Período
      if (filterPeriod !== 'all') {
        if (activity.period !== filterPeriod) return false;
      }

      // Tipo de Avaliação (Parcial, Global)
      if (filterEvaluationType !== 'all') {
        if (activity.evaluation_type !== filterEvaluationType) return false;
      }

      // Formato (Individual, Equipe)
      if (filterType !== 'all') {
        if (activity.type !== filterType) return false;
      }

      return true;
    });
  }, [activities, searchTerm, filterSubject, filterGrade, filterYear, filterPeriod, filterEvaluationType, filterType]);

  const handleOpenGradesModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsGradesModalOpen(true);
  };

  const handleCreateTeam = (activity: Activity) => {
    setSelectedActivityForTeams(activity);
    setIsCreateTeamModalOpen(true);
  };

  const handleViewTeams = (activity: Activity) => {
    setSelectedActivityForTeams(activity);
    setIsTeamsModalOpen(true);
  };

  const handleTeamCreated = () => {
    console.log('Equipe criada com sucesso!');
  };

  const handleEditModalChange = (open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setSelectedActivity(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Atividades & Notas</h2>
          <p className="text-muted-foreground">Gerencie atividades, correções e notas consolidadas por período</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nova Atividade
        </Button>
      </div>

      <Tabs defaultValue="activities" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-2 max-w-md">
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Atividades & Entregas
          </TabsTrigger>
          <TabsTrigger value="consolidated" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Quadro Geral de Notas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consolidated" className="space-y-6">
          <TeacherConsolidatedGradesManager />
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <NewActivityModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
          {selectedActivity && (
            <ActivityGradesModal 
              isOpen={isGradesModalOpen} 
              onOpenChange={setIsGradesModalOpen} 
              activityId={parseInt(selectedActivity.id)}
              activityName={selectedActivity.name}
              subjectId={selectedActivity.subject_id}
            />
          )}
          {selectedActivity && isEditModalOpen && (
            <EditActivityModal 
              key={selectedActivity.id}
              isOpen={isEditModalOpen} 
              onOpenChange={handleEditModalChange} 
              activity={selectedActivity}
            />
          )}

          {/* Card de Filtros */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-semibold">Filtros de Atividades</CardTitle>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                    </Badge>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResetFilters}
                    className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Barra de Busca rápida */}
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  placeholder="Buscar por nome da atividade, descrição ou disciplina..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 h-9 text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    title="Limpar busca"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Grid de Seletores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {/* 1. Disciplina */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-primary/70" />
                    Disciplina
                  </label>
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Disciplinas</SelectItem>
                      {availableSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Série / Turma */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-primary/70" />
                    Série / Turma
                  </label>
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Séries</SelectItem>
                      {availableGrades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 3. Ano Calendário / Letivo */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary/70" />
                    Ano Letivo
                  </label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Anos</SelectItem>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 4. Período (1º, 2º, 3º, 4º) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Layers className="w-3 h-3 text-primary/70" />
                    Período
                  </label>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Períodos</SelectItem>
                      <SelectItem value="1º Período">1º Período</SelectItem>
                      <SelectItem value="2º Período">2º Período</SelectItem>
                      <SelectItem value="3º Período">3º Período</SelectItem>
                      <SelectItem value="4º Período">4º Período</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 5. Tipo de Avaliação (Global / Parcial) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Award className="w-3 h-3 text-primary/70" />
                    Tipo de Avaliação
                  </label>
                  <Select value={filterEvaluationType} onValueChange={setFilterEvaluationType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Avaliações</SelectItem>
                      <SelectItem value="Avaliação Parcial">Avaliação Parcial</SelectItem>
                      <SelectItem value="Avaliação Global">Avaliação Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 6. Formato (Individual / Equipe) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Tag className="w-3 h-3 text-primary/70" />
                    Formato
                  </label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Formatos</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="team">Em Equipe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Listagem de Atividades */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Todas as Atividades</CardTitle>
                  <CardDescription>Atividades criadas por você</CardDescription>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full w-fit">
                  Exibindo <span className="font-semibold text-foreground">{filteredActivities.length}</span> de <span className="font-semibold text-foreground">{activities.length}</span> atividades
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity) => (
                      <div key={activity.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:border-primary/30 transition-colors gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-base">{activity.name}</p>
                            <p className="text-sm text-muted-foreground">Disciplina: <span className="font-medium text-foreground">{activity.subject_name}</span></p>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              {activity.grade && (
                                <span className="text-xs text-muted-foreground">Série: {activity.grade}</span>
                              )}
                              {activity.grade && (activity.period || activity.evaluation_type) && (
                                <span className="text-muted-foreground/40">•</span>
                              )}
                              {activity.period && (
                                <Badge variant="outline" className="text-[11px] font-normal bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                                  {activity.period}
                                </Badge>
                              )}
                              {activity.evaluation_type && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-[11px] font-normal ${
                                    activity.evaluation_type.includes('Global')
                                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  }`}
                                >
                                  {activity.evaluation_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0">
                          <div className="text-left md:text-right text-xs">
                            <p className="font-medium text-foreground">Criada em: {new Date(activity.created_at).toLocaleDateString()}</p>
                            {activity.deadline && (
                              <p className="text-muted-foreground">
                                Prazo: {new Date(activity.deadline).toLocaleDateString()} {new Date(activity.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <Badge variant={activity.type === 'team' ? 'default' : 'secondary'} className="text-xs">
                            {activity.type === 'individual' ? 'Individual' : 'Em Equipe'}
                          </Badge>
                          
                          {/* Botões de Equipe */}
                          {activity.type === 'team' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCreateTeam(activity)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                              >
                                <Crown className="w-4 h-4" />
                                Nova Equipe
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewTeams(activity)}
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                              >
                                <UserCheck className="w-4 h-4" />
                                Ver Equipes
                              </Button>
                            </>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setIsGradesModalOpen(true);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Edit3 className="w-4 h-4" />
                            Notas
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedActivity(activity);
                              setIsEditModalOpen(true);
                            }}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <FileText className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                      {activeFiltersCount > 0 ? (
                        <>
                          <p className="text-base font-medium text-foreground">Nenhuma atividade encontrada com os filtros selecionados</p>
                          <p className="text-sm text-muted-foreground mt-1">Tente ajustar ou redefinir os filtros aplicados.</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleResetFilters} 
                            className="mt-4 gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Limpar Filtros
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground">Nenhuma atividade cadastrada</p>
                          <p className="text-sm text-muted-foreground mt-2">Crie novas atividades para seus alunos</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas Recentes</CardTitle>
          <CardDescription>Últimas notas atribuídas aos alunos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground py-8">Nenhuma nota recente - atribua notas às atividades</p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>

      {/* Modais de Equipe */}
      {selectedActivityForTeams && (
        <>
          <CreateTeamModal
            isOpen={isCreateTeamModalOpen}
            onOpenChange={setIsCreateTeamModalOpen}
            activityId={parseInt(selectedActivityForTeams.id)}
            activityName={selectedActivityForTeams.name}
            onTeamCreated={handleTeamCreated}
          />
          <ActivityTeamsModal
            isOpen={isTeamsModalOpen}
            onOpenChange={setIsTeamsModalOpen}
            activityId={parseInt(selectedActivityForTeams.id)}
            activityName={selectedActivityForTeams.name}
          />
        </>
      )}
    </div>
  );
}
