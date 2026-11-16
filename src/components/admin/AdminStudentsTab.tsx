import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowUpDown,
  Edit,
  Eye,
  Filter,
  KeyRound,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';

interface StudentItem {
  id: string;
  full_name?: string;
  email: string;
  student_registration?: string;
  grade?: string | null;
  created_at?: string;
}

type StudentSortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';

interface AdminStudentsTabProps {
  students: StudentItem[];
  filteredStudents: StudentItem[];
  loadingStudents: boolean;
  studentGradeFilter: string;
  setStudentGradeFilter: (value: string) => void;
  studentSearch: string;
  setStudentSearch: (value: string) => void;
  studentSortBy: StudentSortOption;
  setStudentSortBy: (value: StudentSortOption) => void;
  onOpenStudentModal: (student?: StudentItem) => void;
  onResetPassword: (user: { id: string; name: string; email?: string; role?: string }) => void;
  onDeleteStudent: (studentId: string) => void;
}

export default function AdminStudentsTab({
  students,
  filteredStudents,
  loadingStudents,
  studentGradeFilter,
  setStudentGradeFilter,
  studentSearch,
  setStudentSearch,
  studentSortBy,
  setStudentSortBy,
  onOpenStudentModal,
  onResetPassword,
  onDeleteStudent,
}: AdminStudentsTabProps) {
  const hasActiveFilters =
    studentGradeFilter !== 'all' || studentSearch.trim() !== '' || studentSortBy !== 'name-asc';

  const resetFilters = () => {
    setStudentGradeFilter('all');
    setStudentSearch('');
    setStudentSortBy('name-asc');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Estudantes</h2>
          <p className="text-muted-foreground">Adicione, edite ou remova estudantes do sistema</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => onOpenStudentModal()}>
          <Plus className="w-4 h-4" />
          Novo Estudante
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Estudantes</CardTitle>
              <CardDescription>
                {filteredStudents.length === students.length
                  ? `Total de ${students.length} estudantes cadastrados`
                  : `Exibindo ${filteredStudents.length} de ${students.length} estudantes`}
              </CardDescription>
            </div>

            {/* Filtro rápido por Série */}
            <div className="flex flex-wrap items-center gap-2">
              {(['all', '1º Ano', '2º Ano', '3º Ano'] as const).map((gradeKey) => {
                const count =
                  gradeKey === 'all'
                    ? students.length
                    : students.filter((s) => s.grade === gradeKey).length;
                const label = gradeKey === 'all' ? 'Todas as Séries' : gradeKey;
                const isSelected = studentGradeFilter === gradeKey;
                return (
                  <Button
                    key={gradeKey}
                    type="button"
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    className="text-xs h-8"
                    onClick={() => setStudentGradeFilter(gradeKey)}
                  >
                    {label}
                    <Badge
                      variant={isSelected ? 'secondary' : 'outline'}
                      className="ml-1.5 px-1.5 py-0 text-[10px]"
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Barra de Busca e Filtro */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-3">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou matrícula..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                aria-label="Buscar estudante por nome, email ou matrícula"
                className="pl-9 pr-8 h-9"
              />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch('')}
                  aria-label="Limpar busca de estudante"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-full sm:w-48">
              <Select value={studentGradeFilter} onValueChange={setStudentGradeFilter}>
                <SelectTrigger className="h-9">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Filtrar por série" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Séries</SelectItem>
                  <SelectItem value="1º Ano">1º Ano</SelectItem>
                  <SelectItem value="2º Ano">2º Ano</SelectItem>
                  <SelectItem value="3º Ano">3º Ano</SelectItem>
                  <SelectItem value="no-grade">Sem Série Definida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={studentSortBy}
                onValueChange={(val: StudentSortOption) => setStudentSortBy(val)}
              >
                <SelectTrigger className="h-9">
                  <div className="flex items-center gap-2 truncate">
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Classificar por" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Ordem Alfabética (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Ordem Alfabética (Z-A)</SelectItem>
                  <SelectItem value="date-desc">Data de Cadastro (Mais recentes)</SelectItem>
                  <SelectItem value="date-asc">Data de Cadastro (Mais antigos)</SelectItem>
                </SelectContent>
              </Select>
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
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loadingStudents ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-28" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {student.full_name
                          ? student.full_name.split(' ').map((n: string) => n[0]).join('')
                          : (student.email ? student.email[0].toUpperCase() : 'E')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{student.full_name || 'Nome não informado'}</p>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
                        <span>Matrícula: {student.student_registration || 'Não informado'}</span>
                        {student.created_at && (
                          <>
                            <span>•</span>
                            <span>
                              Cadastrado em: {new Date(student.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </>
                        )}
                      </div>
                      {student.grade && (
                        <Badge
                          variant="secondary"
                          className={`text-xs mt-1.5 inline-block ${
                            student.grade === '1º Ano'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : student.grade === '2º Ano'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : student.grade === '3º Ano'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200'
                                  : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          {student.grade}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Ativo</Badge>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" aria-label="Visualizar estudante">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenStudentModal(student)}
                        title="Editar estudante"
                        aria-label={`Editar ${student.full_name || student.email}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          onResetPassword({
                            id: student.id,
                            name: student.full_name || 'Estudante',
                            email: student.email,
                            role: 'Estudante',
                          })
                        }
                        title="Resetar senha para balbina123"
                        aria-label={`Resetar senha de ${student.full_name || student.email}`}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteStudent(student.id)}
                        title="Remover estudante"
                        aria-label={`Remover ${student.full_name || student.email}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-base font-medium text-foreground">Nenhum estudante encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {studentGradeFilter !== 'all' || studentSearch
                      ? 'Nenhum estudante corresponde aos filtros selecionados.'
                      : 'Nenhum estudante cadastrado no sistema.'}
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
        </CardContent>
      </Card>
    </div>
  );
}
