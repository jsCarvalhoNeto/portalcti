import { API_URL } from '@/services/api';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, BookOpen, Settings, BarChart3, LogOut, Home, Shield, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SubjectModal from '@/components/SubjectModal';
import StudentModal from '@/components/admin/StudentModal';
import TeacherModal from '@/components/admin/TeacherModal';
import { getAllStudents } from '@/services/studentService';
import { getAllUsers } from '@/services/userService';
import { getAllTeachers } from '@/services/teacherService';

import { subjectService } from '@/services/subjectService';

interface User {
  id: string;
  full_name?: string;
  email: string;
  student_registration?: string | null;
  roles: Array<{ role: string }>;
  grade?: string;
}

interface Teacher {
  id: string;
  full_name?: string;
  email: string;
}

interface Student {
  id: string;
  full_name?: string;
  email: string;
  student_registration?: string;
}

interface AdminSubject {
  id: string;
  name: string;
  description?: string;
  teacher_name?: string;
  schedule?: string;
  current_students: number;
  max_students: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
}

export default function AdminDashboard() {
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [subjects, setSubjects] = useState<AdminSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<AdminSubject | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<AdminSubject | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
      fetchSubjects();
      fetchTeachers();
      fetchStudents(); // Buscar estudantes também
    }
  }, [user, isAdmin]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
      const API_URL_ENDPOINT = `${API_URL}/teachers`; // URL absoluta para o backend

    try {
      const response = await fetch(API_URL_ENDPOINT);
      if (!response.ok) {
        throw new Error('Falha ao buscar professores da API');
      }
      const teacherData = await response.json();
      setTeachers(teacherData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar professores",
        variant: "destructive",
      });
    } finally {
      setLoadingTeachers(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      // Contar apenas estudantes ativos (com papel de estudante)
      const activeStudents = allUsers.filter(user => user.roles.some((r: any) => r.role === 'student'));
      setTotalStudents(activeStudents.length);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const studentData = await getAllStudents();
      setStudents(studentData);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estudantes",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const deleteTeacher = async (teacherId: string) => {
    const API_URL_ENDPOINT = `${API_URL}/teachers/${teacherId}`;

    try {
      const response = await fetch(API_URL_ENDPOINT, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao deletar professor da API');
      }

      toast({
        title: "Sucesso",
        description: "Professor removido com sucesso do sistema.",
      });
      fetchTeachers(); // Atualiza a lista de professores
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao deletar professor",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Remove o estudante via API real
      const API_URL_ENDPOINT = `${API_URL}/students/${userId}`;
      const response = await fetch(API_URL_ENDPOINT, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover estudante do sistema');
      }

      toast({
        title: "Sucesso",
        description: "Estudante removido com sucesso.",
      });
      fetchUsers();
      fetchTeachers();
      fetchStudents(); // Atualiza a lista de estudantes também
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao deletar estudante",
        variant: "destructive",
      });
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await subjectService.getAll();
      // Converter os dados para o formato AdminSubject
      const adminSubjects = data.map(subject => ({
        id: subject.id.toString(),
        name: subject.name,
        description: subject.description,
        teacher_name: subject.teacher_name,
        schedule: subject.schedule,
        current_students: subject.current_students || 0,
        max_students: subject.max_students || 0,
        grade: subject.grade
      }));
      setSubjects(adminSubjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar disciplinas",
        variant: "destructive",
      });
    } finally {
      setLoadingSubjects(false);
    }
  };

  const deleteSubject = async (subjectId: string) => {
    try {
      await subjectService.delete(subjectId);
      toast({
        title: "Sucesso",
        description: "Disciplina removida com sucesso do sistema.",
      });
      fetchSubjects(); // Atualiza a lista de disciplinas
      setSubjectToDelete(null);
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao deletar disciplina",
        variant: "destructive",
      });
    }
  };

  const openStudentModal = (student?: any) => {
    setEditingStudent(student || null);
    setShowStudentModal(true);
  };

  const openUserModal = (user?: any) => {
    // Verifica se é um estudante ou professor e direciona para o modal apropriado
    if (user?.roles?.some((r: any) => r.role === 'student')) {
      setEditingStudent(user);
      setShowStudentModal(true);
    } else if (user?.roles?.some((r: any) => r.role === 'teacher')) {
      setEditingTeacher(user);
      setShowTeacherModal(true);
    } else {
      // Para outros tipos de usuário, usar o modal de estudante como fallback
      // ou implementar um modal genérico se necessário
      setEditingStudent(user);
      setShowStudentModal(true);
    }
  };

  const openSubjectModal = (subject?: any) => {
    setEditingSubject(subject || null);
    setShowSubjectModal(true);
  };

  const openTeacherModal = (teacher?: any) => {
    setEditingTeacher(teacher || null);
    setShowTeacherModal(true);
  };

  const promoteToAdmin = async (userId: string) => {
    try {
      console.log(`Promovendo usuário a admin: ${userId}`);
      
      // Chama a API real para atualizar o papel do usuário
      const response = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'admin' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao promover usuário');
      }

      toast({
        title: "Sucesso",
        description: "Usuário promovido a administrador com sucesso.",
      });
      
      // Atualiza todas as listas para refletir a mudança
      fetchUsers();
      fetchStudents(); // Atualiza a lista de estudantes também, pois o usuário pode ter sido um estudante
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      toast({
        title: "Erro",
        description: "Falha ao promover usuário a administrador.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  // Stats data using real data
  const stats = [
    { title: 'Estudantes Ativos', value: totalStudents.toString(), icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Professores', value: teachers.length.toString(), icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Disciplinas', value: subjects.length.toString(), icon: BookOpen, color: 'text-accent', bgColor: 'bg-accent/10' },
    { title: 'Administradores', value: users.filter(u => u.roles.some((r: any) => r.role === 'admin')).length.toString(), icon: Shield, color: 'text-destructive', bgColor: 'bg-destructive/10' }
  ];

  const getUserStatus = (user: any) => {
    // Verifica se é admin comparando com o email do admin ou papel de admin
    if (user.email === 'admin@portal.com' || user.roles?.some((r: any) => r.role === 'admin')) return 'Admin';
    if (user.roles?.some((r: any) => r.role === 'student')) return 'Estudante';
    if (user.roles?.some((r: any) => r.role === 'teacher')) return 'Professor';
    return 'Pendente';
  };

  const getUserStatusVariant = (status: string) => {
    if (status === 'Admin') return 'destructive';
    if (status === 'Estudante') return 'default';
    if (status === 'Professor') return 'secondary';
    return 'outline';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">
                  Bem-vindo, {profile?.full_name || user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Administrador
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                title="Atualizar página"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Portal
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 max-w-xl mx-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="students">Estudantes</TabsTrigger>
            <TabsTrigger value="teachers">Professores</TabsTrigger>
            <TabsTrigger value="subjects">Disciplinas</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="hover:shadow-glow transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Gerenciar Usuários
                  </CardTitle>
                  <CardDescription>
                    Adicionar, editar e gerenciar estudantes, professores e administradores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setActiveTab('users')}>
                    Acessar Usuários
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    Disciplinas
                  </CardTitle>
                  <CardDescription>
                    Gerenciar disciplinas, cronogramas e conteúdo acadêmico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('subjects')}>
                    Gerenciar Disciplinas
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-secondary-foreground" />
                    Configurações
                  </CardTitle>
                  <CardDescription>
                    Configurar sistema e preferências gerais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('settings')}>
                    Configurações
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>
                  Últimas ações administrativas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: '5 novos estudantes cadastrados', time: 'Hoje às 14:30', icon: Users, color: 'text-green-600' },
                    { action: 'Disciplina "Desenvolvimento Web" atualizada', time: 'Ontem às 16:45', icon: BookOpen, color: 'text-blue-600' },
                    { action: 'Configurações de backup atualizadas', time: '2 dias atrás', icon: Settings, color: 'text-orange-600' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
                <p className="text-muted-foreground">Adicione, edite ou remova todos os tipos de usuários do sistema</p>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex items-center gap-2"
                  onClick={() => openStudentModal()}
                >
                  <Plus className="w-4 h-4" />
                  Novo Estudante
                </Button>
                <Button
                  className="flex items-center gap-2"
                  onClick={() => openTeacherModal()}
                >
                  <Plus className="w-4 h-4" />
                  Novo Professor
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Todos os Usuários</CardTitle>
                <CardDescription>
                  Estudantes, professores e administradores do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => {
                      const status = getUserStatus(user);
                      const isStudent = user.roles.some((r: any) => r.role === 'student');
                      const isTeacher = user.roles.some((r: any) => r.role === 'teacher');
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('') : user.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || 'Nome não informado'}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {isStudent && user.student_registration && (
                                <p className="text-xs text-muted-foreground">
                                  Matrícula: {user.student_registration}
                                </p>
                              )}
                              {isStudent && user.grade && (
                                <Badge variant="secondary" className={`text-xs ${
                                  user.grade === '1º Ano' ? 'bg-green-100 text-green-800 border-green-200' :
                                  user.grade === '2º Ano' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  user.grade === '3º Ano' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                  {user.grade}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getUserStatusVariant(status)}>
                              {status}
                            </Badge>
 <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
 <Button size="sm" variant="ghost" onClick={() => openUserModal(user)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              {status !== 'Admin' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => promoteToAdmin(user.id)}
                                  title="Promover a Admin"
                                >
                                  <Shield className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteUser(user.id)}
                                title="Remover usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {users.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Professores</h2>
                <p className="text-muted-foreground">Adicione, edite ou remova professores do sistema</p>
              </div>
              <Button
                className="flex items-center gap-2"
                onClick={() => openTeacherModal()}
              >
                <Plus className="w-4 h-4" />
                Novo Professor
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Lista de Professores</CardTitle>
                <CardDescription>
                  Todos os professores cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTeachers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {teacher.full_name ? teacher.full_name.split(' ').map((n: string) => n[0]).join('') : teacher.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{teacher.full_name || 'Nome não informado'}</p>
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            Professor
                          </Badge>
                          <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openTeacherModal(teacher)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                              variant="ghost"
                              onClick={() => deleteTeacher(teacher.id)}
                              title="Remover professor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {teachers.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum professor encontrado
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Estudantes</h2>
                <p className="text-muted-foreground">Adicione, edite ou remova estudantes do sistema</p>
              </div>
            <Button
                className="flex items-center gap-2"
                onClick={() => openStudentModal()}
              >
                <Plus className="w-4 h-4" />
                Novo Estudante
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Lista de Estudantes</CardTitle>
                <CardDescription>
                  Todos os estudantes cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => {
                      const status = 'Ativo'; // Estudantes sempre estão ativos
                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {student.full_name ? student.full_name.split(' ').map((n: string) => n[0]).join('') : student.email[0].toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{student.full_name || 'Nome não informado'}</p>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Matrícula: {student.student_registration || 'Não informado'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default">
                              {status}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openStudentModal(student)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteUser(student.id)}
                                title="Remover estudante"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {students.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum estudante encontrado
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Disciplinas</h2>
                <p className="text-muted-foreground">Organize e configure as disciplinas do curso</p>
              </div>
              <Button className="flex items-center gap-2" onClick={() => openSubjectModal()}>
                <Plus className="w-4 h-4" />
                Nova Disciplina
              </Button>
            </div>

            {loadingSubjects ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-glow transition-all duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
<CardTitle className="text-lg">{subject.name}</CardTitle>
                          <CardDescription>Professor: {subject.teacher_name || 'Não atribuído'}</CardDescription>
                          {subject.schedule && (
                            <p className="text-sm text-muted-foreground mt-1">{subject.schedule}</p>
                          )}
                        </div>
                        <Badge variant="outline">{subject.current_students}/{subject.max_students}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {subject.description && (
                          <p className="text-sm text-muted-foreground">{subject.description}</p>
                        )}
                        <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          Série: {subject.grade || 'Não informado'}
                        </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openSubjectModal(subject)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSubjectToDelete(subject)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {subjects.length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">Nenhuma disciplina encontrada</p>
                  </div>
                )}
              </div>
            )}

            <SubjectModal
              isOpen={showSubjectModal}
              onClose={() => setShowSubjectModal(false)}
              subject={editingSubject}
              onSuccess={fetchSubjects}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a disciplina "{subjectToDelete?.name}"?
                    <br /><br />
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
                        deleteSubject(subjectToDelete.id);
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir Definitivamente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
              <p className="text-muted-foreground">Configure preferências e parâmetros do portal</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais</CardTitle>
                  <CardDescription>Configurações básicas do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar Notificações
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Gerenciar Permissões
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Configurações de Segurança
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manutenção</CardTitle>
                  <CardDescription>Ferramentas de manutenção do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Gerar Relatórios
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Backup do Sistema
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Logs do Sistema
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
 <StudentModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSuccess={fetchStudents}
        student={editingStudent}
      />
      <TeacherModal
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        onSuccess={fetchTeachers}
        teacher={editingTeacher}
      />
    </div>
  );
}
