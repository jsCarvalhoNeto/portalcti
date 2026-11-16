import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SubjectModal from '@/components/SubjectModal';
import { BookOpen, Edit, Eye, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react';

interface AdminSubjectItem {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  teacher_name?: string;
  schedule?: string;
  current_students: number;
  max_students: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  semester?: string;
  period?: string;
  year?: number;
  workload_hours?: number;
}

interface AdminSubjectsTabProps {
  subjects: AdminSubjectItem[];
  filteredSubjects: AdminSubjectItem[];
  loadingSubjects: boolean;
  subjectSearch: string;
  setSubjectSearch: (value: string) => void;
  subjectGradeFilter: string;
  setSubjectGradeFilter: (value: string) => void;
  subjectPeriodFilter: string;
  setSubjectPeriodFilter: (value: string) => void;
  subjectYearFilter: string;
  setSubjectYearFilter: (value: string) => void;
  subjectSemesterFilter: string;
  setSubjectSemesterFilter: (value: string) => void;
  availableSubjectYears: number[];
  availableSubjectSemesters: string[];
  showSubjectModal: boolean;
  setShowSubjectModal: (open: boolean) => void;
  editingSubject: AdminSubjectItem | null;
  subjectToDelete: AdminSubjectItem | null;
  setSubjectToDelete: (subject: AdminSubjectItem | null) => void;
  onOpenSubjectModal: (subject?: AdminSubjectItem) => void;
  onRefreshSubjects: () => void;
  onDeleteSubject: (subjectId: string) => void;
}

export default function AdminSubjectsTab({
  subjects,
  filteredSubjects,
  loadingSubjects,
  subjectSearch,
  setSubjectSearch,
  subjectGradeFilter,
  setSubjectGradeFilter,
  subjectPeriodFilter,
  setSubjectPeriodFilter,
  subjectYearFilter,
  setSubjectYearFilter,
  subjectSemesterFilter,
  setSubjectSemesterFilter,
  availableSubjectYears,
  availableSubjectSemesters,
  showSubjectModal,
  setShowSubjectModal,
  editingSubject,
  subjectToDelete,
  setSubjectToDelete,
  onOpenSubjectModal,
  onRefreshSubjects,
  onDeleteSubject,
}: AdminSubjectsTabProps) {
  const hasActiveFilters =
    subjectGradeFilter !== 'all' ||
    subjectPeriodFilter !== 'all' ||
    subjectYearFilter !== 'all' ||
    subjectSemesterFilter !== 'all' ||
    subjectSearch.trim() !== '';

  const resetFilters = () => {
    setSubjectGradeFilter('all');
    setSubjectPeriodFilter('all');
    setSubjectYearFilter('all');
    setSubjectSemesterFilter('all');
    setSubjectSearch('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Disciplinas</h2>
          <p className="text-muted-foreground">Organize e configure as disciplinas do curso</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => onOpenSubjectModal()}>
          <Plus className="w-4 h-4" />
          Nova Disciplina
        </Button>
      </div>

      {/* Painel de Filtros de Disciplinas */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por disciplina, professor, horário..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                aria-label="Buscar disciplina"
                className="pl-9 pr-8 h-9"
              />
              {subjectSearch && (
                <button
                  type="button"
                  onClick={() => setSubjectSearch('')}
                  aria-label="Limpar busca de disciplina"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-foreground h-9 px-3 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Limpar Filtros
              </Button>
            )}
          </div>

          {/* Grid de Seletores de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Série</span>
              <Select value={subjectGradeFilter} onValueChange={setSubjectGradeFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas as séries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as séries</SelectItem>
                  <SelectItem value="1º Ano">1º Ano</SelectItem>
                  <SelectItem value="2º Ano">2º Ano</SelectItem>
                  <SelectItem value="3º Ano">3º Ano</SelectItem>
                  <SelectItem value="no-grade">Sem série</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Período</span>
              <Select value={subjectPeriodFilter} onValueChange={setSubjectPeriodFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os períodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="1º Período">1º Período</SelectItem>
                  <SelectItem value="2º Período">2º Período</SelectItem>
                  <SelectItem value="3º Período">3º Período</SelectItem>
                  <SelectItem value="4º Período">4º Período</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Ano</span>
              <Select value={subjectYearFilter} onValueChange={setSubjectYearFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {Array.from(new Set([new Date().getFullYear(), ...availableSubjectYears]))
                    .sort((a, b) => b - a)
                    .map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        Ano {year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Semestre</span>
              <Select value={subjectSemesterFilter} onValueChange={setSubjectSemesterFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todos os semestres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os semestres</SelectItem>
                  {Array.from(
                    new Set([
                      `${new Date().getFullYear()}.1`,
                      `${new Date().getFullYear()}.2`,
                      ...availableSubjectSemesters,
                    ])
                  )
                    .sort()
                    .map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <span>
              {filteredSubjects.length === subjects.length
                ? `Total: ${subjects.length} disciplinas`
                : `Exibindo ${filteredSubjects.length} de ${subjects.length} disciplinas`}
            </span>
            {hasActiveFilters && <span className="text-primary font-medium">Filtros aplicados</span>}
          </div>
        </CardContent>
      </Card>

      {loadingSubjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="border rounded-xl p-6 space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription>
                      Professor: {subject.teacher_name || 'Não atribuído'}
                    </CardDescription>
                    {subject.schedule && (
                      <p className="text-sm text-muted-foreground mt-1">{subject.schedule}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {subject.current_students}/{subject.max_students}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {subject.description && (
                    <p className="text-sm text-muted-foreground">{subject.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {subject.grade && (
                      <Badge variant="secondary" className="text-xs">
                        {subject.grade}
                      </Badge>
                    )}
                    {subject.workload_hours && (
                      <Badge variant="outline" className="text-xs">
                        {subject.workload_hours}h
                      </Badge>
                    )}
                    {subject.period && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        {subject.period}
                      </Badge>
                    )}
                    {subject.year && (
                      <Badge variant="outline" className="text-xs">
                        Ano: {subject.year}
                      </Badge>
                    )}
                    {subject.semester && (
                      <Badge variant="outline" className="text-xs">
                        Semestre: {subject.semester}
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs text-muted-foreground">ID: #{subject.id}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenSubjectModal(subject)}
                        aria-label={`Editar ${subject.name}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" aria-label={`Visualizar ${subject.name}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSubjectToDelete(subject)}
                        aria-label={`Excluir ${subject.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredSubjects.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-12 border border-dashed rounded-lg bg-muted/20">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium text-foreground">Nenhuma disciplina encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters
                  ? 'Nenhuma disciplina corresponde aos filtros selecionados.'
                  : 'Nenhuma disciplina cadastrada no sistema.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                  <RotateCcw className="w-3.5 h-3.5 mr-2" />
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <SubjectModal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        subject={editingSubject}
        onSuccess={onRefreshSubjects}
      />

      <AlertDialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a disciplina "{subjectToDelete?.name}"?
              <br />
              <br />
              <span className="font-semibold text-destructive">
                ⚠️ Esta ação é irreversível e não pode ser desfeita.
              </span>
              <br />
              Todos os dados relacionados a esta disciplina serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (subjectToDelete?.id) {
                  onDeleteSubject(subjectToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
