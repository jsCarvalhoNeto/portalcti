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
  Shield,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from 'lucide-react';

interface UserItem {
  id: string;
  full_name?: string;
  email: string;
  student_registration?: string | null;
  roles: Array<{ role: string }>;
  grade?: string;
  created_at?: string;
}

type UserSortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';

interface AdminUsersTabProps {
  users: UserItem[];
  filteredUsers: UserItem[];
  loadingUsers: boolean;
  currentUserId?: string;
  userRoleFilter: string;
  setUserRoleFilter: (value: string) => void;
  userSearch: string;
  setUserSearch: (value: string) => void;
  userSortBy: UserSortOption;
  setUserSortBy: (value: UserSortOption) => void;
  getUserStatus: (user: UserItem) => string;
  getUserStatusVariant: (status: string) => 'default' | 'secondary' | 'destructive' | 'outline';
  onOpenStudentModal: () => void;
  onOpenTeacherModal: () => void;
  onOpenUserModal: (user: UserItem) => void;
  onResetPassword: (user: { id: string; name: string; email?: string; role?: string }) => void;
  onPromoteToAdmin: (userId: string) => void;
  onRequestDemoteAdmin: (user: { id: string; name: string; email?: string }) => void;
  onNotifyError: (title: string, description: string) => void;
  onDeleteUser: (userId: string) => void;
}

export default function AdminUsersTab({
  users,
  filteredUsers,
  loadingUsers,
  currentUserId,
  userRoleFilter,
  setUserRoleFilter,
  userSearch,
  setUserSearch,
  userSortBy,
  setUserSortBy,
  getUserStatus,
  getUserStatusVariant,
  onOpenStudentModal,
  onOpenTeacherModal,
  onOpenUserModal,
  onResetPassword,
  onPromoteToAdmin,
  onRequestDemoteAdmin,
  onNotifyError,
  onDeleteUser,
}: AdminUsersTabProps) {
  const hasActiveFilters =
    userRoleFilter !== 'all' || userSearch.trim() !== '' || userSortBy !== 'name-asc';

  const resetFilters = () => {
    setUserRoleFilter('all');
    setUserSearch('');
    setUserSortBy('name-asc');
  };

  const roleCounts = {
    all: users.length,
    student: users.filter((u) => u.roles.some((r) => r.role === 'student')).length,
    teacher: users.filter((u) => u.roles.some((r) => r.role === 'teacher')).length,
    admin: users.filter((u) => u.roles.some((r) => r.role === 'admin')).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">
            Adicione, edite ou remova todos os tipos de usuários do sistema
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="flex items-center gap-2" onClick={onOpenStudentModal}>
            <Plus className="w-4 h-4" />
            Novo Estudante
          </Button>
          <Button className="flex items-center gap-2" onClick={onOpenTeacherModal}>
            <Plus className="w-4 h-4" />
            Novo Professor
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Todos os Usuários</CardTitle>
              <CardDescription>
                {filteredUsers.length === users.length
                  ? `Total de ${users.length} usuários cadastrados`
                  : `Exibindo ${filteredUsers.length} de ${users.length} usuários`}
              </CardDescription>
            </div>

            {/* Filtro rápido por Papel */}
            <div className="flex flex-wrap items-center gap-2">
              {([
                { key: 'all', label: 'Todos', count: roleCounts.all },
                { key: 'student', label: 'Estudantes', count: roleCounts.student },
                { key: 'teacher', label: 'Professores', count: roleCounts.teacher },
                { key: 'admin', label: 'Administradores', count: roleCounts.admin },
              ] as const).map((item) => {
                const isSelected = userRoleFilter === item.key;
                return (
                  <Button
                    key={item.key}
                    type="button"
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    className="text-xs h-8"
                    onClick={() => setUserRoleFilter(item.key)}
                  >
                    {item.label}
                    <Badge
                      variant={isSelected ? 'secondary' : 'outline'}
                      className="ml-1.5 px-1.5 py-0 text-[10px]"
                    >
                      {item.count}
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
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                aria-label="Buscar usuário por nome, email ou matrícula"
                className="pl-9 pr-8 h-9"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch('')}
                  aria-label="Limpar busca de usuário"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-full sm:w-48">
              <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                <SelectTrigger className="h-9">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Filtrar por papel" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Papéis</SelectItem>
                  <SelectItem value="student">Estudantes</SelectItem>
                  <SelectItem value="teacher">Professores</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-56">
              <Select
                value={userSortBy}
                onValueChange={(val: UserSortOption) => setUserSortBy(val)}
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
          {loadingUsers ? (
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
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((item) => {
                const status = getUserStatus(item);
                const isStudent = item.roles.some((r) => r.role === 'student');
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {item.full_name
                            ? item.full_name.split(' ').map((n: string) => n[0]).join('')
                            : (item.email ? item.email[0].toUpperCase() : 'U')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{item.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{item.email}</p>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
                          {isStudent && item.student_registration && (
                            <span>Matrícula: {item.student_registration}</span>
                          )}
                          {item.created_at && (
                            <>
                              {isStudent && item.student_registration && <span>•</span>}
                              <span>
                                Cadastrado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </>
                          )}
                        </div>
                        {isStudent && item.grade && (
                          <Badge
                            variant="secondary"
                            className={`text-xs mt-1.5 inline-block ${
                              item.grade === '1º Ano'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : item.grade === '2º Ano'
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : item.grade === '3º Ano'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {item.grade}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getUserStatusVariant(status)}>{status}</Badge>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" aria-label="Visualizar usuário">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onOpenUserModal(item)}
                          title="Editar usuário"
                          aria-label={`Editar ${item.full_name || item.email}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            onResetPassword({
                              id: item.id,
                              name: item.full_name || item.email,
                              email: item.email,
                              role: status,
                            })
                          }
                          title="Resetar senha para balbina123"
                          aria-label={`Resetar senha de ${item.full_name || item.email}`}
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        >
                          <KeyRound className="w-4 h-4" />
                        </Button>
                        {status !== 'Admin' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onPromoteToAdmin(item.id)}
                            title="Promover a Admin"
                            aria-label={`Promover ${item.full_name || item.email} a administrador`}
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const isSelf = currentUserId && item.id === currentUserId;
                              if (roleCounts.admin <= 1) {
                                onNotifyError(
                                  'Operação não permitida',
                                  'Não é possível reverter. O sistema obrigatoriamente precisa ter pelo menos um administrador ativo.'
                                );
                                return;
                              }
                              if (isSelf) {
                                onNotifyError(
                                  'Operação não permitida',
                                  'Você não pode remover seus próprios privilégios de administrador. Outro administrador deve realizar esta ação.'
                                );
                                return;
                              }
                              onRequestDemoteAdmin({
                                id: item.id,
                                name: item.full_name || item.email,
                                email: item.email,
                              });
                            }}
                            title="Reverter papel de Admin"
                            aria-label={`Reverter papel de administrador de ${item.full_name || item.email}`}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteUser(item.id)}
                          title="Remover usuário"
                          aria-label={`Remover ${item.full_name || item.email}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-base font-medium text-foreground">Nenhum usuário encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userRoleFilter !== 'all' || userSearch
                      ? 'Nenhum usuário corresponde aos filtros selecionados.'
                      : 'Nenhum usuário cadastrado no sistema.'}
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
