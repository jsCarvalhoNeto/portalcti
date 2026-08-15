import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, BookOpen, Settings, BarChart3, LogOut, Home, Shield, Plus, Edit, Trash2, Eye, Menu, Search, Filter, X, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SubjectModal from '@/components/SubjectModal';
import StudentModal from '@/components/admin/StudentModal';
import TeacherModal from '@/components/admin/TeacherModal';
import UserEditModal from '@/components/admin/UserEditModal';
import { getAllStudents, deleteStudent } from '@/services/studentService';
import { getAllUsers, updateUserRole } from '@/services/userService';
import { getAllTeachers, deleteTeacher as deleteTeacherService } from '@/services/teacherService';
import { subjectService } from '@/services/subjectService';
import { SwipeableSheet, SwipeableSheetContent, SwipeableSheetTrigger } from '@/components/ui/swipeable-sheet';

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
  grade?: string | null;
}

interface AdminSubject {
  id: string;
  name: string;
  description?: string;
  teacher_id?: string;
  teacher_name?: string;
  teacher_ids?: string[];
  teachers?: Array<{ id: string; full_name: string; email?: string }>;
  schedule?: string;
  current_students: number;
  max_students: number;
  grade?: '1º Ano' | '2º Ano' | '3º Ano';
  semester?: string;
  period?: string;
  periods?: string[];
  year?: number;
  color?: string;
}


export default function AdminDashboard() {
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<AdminSubject | null>(null);
  const { toast } = useToast();

  // Filtros para Estudantes
  const [studentGradeFilter, setStudentGradeFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  // Filtros para Disciplinas
  const [subjectGradeFilter, setSubjectGradeFilter] = useState('all');
  const [subjectPeriodFilter, setSubjectPeriodFilter] = useState('all');
  const [subjectYearFilter, setSubjectYearFilter] = useState('all');
  const [subjectSemesterFilter, setSubjectSemesterFilter] = useState('all');
  const [subjectSearch, setSubjectSearch] = useState('');

  // Anos e semestres únicos extraídos das disciplinas para alimentar os selects
  const availableSubjectYears = Array.from(
    new Set(
      subjects
        .map((s) => s.year)
        .filter((y): y is number => typeof y === 'number' && !isNaN(y))
    )
  ).sort((a, b) => b - a);

  const availableSubjectSemesters = Array.from(
    new Set(
      subjects
        .map((s) => s.semester?.trim())
        .filter((sem): sem is string => Boolean(sem && sem.length > 0))
    )
  ).sort();

  // Filtragem de Estudantes
  const filteredStudents = students.filter((student) => {
    if (studentGradeFilter !== 'all') {
      if (studentGradeFilter === 'no-grade') {
        if (student.grade) return false;
      } else if (student.grade !== studentGradeFilter) {
        return false;
      }
    }
    if (studentSearch.trim()) {
      const searchLower = studentSearch.toLowerCase().trim();
      const matchName = student.full_name?.toLowerCase().includes(searchLower);
      const matchEmail = student.email?.toLowerCase().includes(searchLower);
      const matchReg = student.student_registration?.toLowerCase().includes(searchLower);
      if (!matchName && !matchEmail && !matchReg) {
        return false;
      }
    }
    return true;
  });

  // Filtragem de Disciplinas
  const filteredSubjects = subjects.filter((subject) => {
    // Série
    if (subjectGradeFilter !== 'all') {
      if (subjectGradeFilter === 'no-grade') {
        if (subject.grade) return false;
      } else if (subject.grade !== subjectGradeFilter) {
        return false;
      }
    }
    // Período
    if (subjectPeriodFilter !== 'all') {
      const hasInPeriods = Array.isArray(subject.periods) && subject.periods.some(p => p.toLowerCase().includes(subjectPeriodFilter.toLowerCase()));
      const hasInPeriod = typeof subject.period === 'string' && subject.period.toLowerCase().includes(subjectPeriodFilter.toLowerCase());
      if (!hasInPeriods && !hasInPeriod) {
        return false;
      }
    }
    // Ano
    if (subjectYearFilter !== 'all') {
      if (String(subject.year) !== subjectYearFilter) {
        return false;
      }
    }
    // Semestre
    if (subjectSemesterFilter !== 'all') {
      if (subject.semester?.toLowerCase().trim() !== subjectSemesterFilter.toLowerCase().trim()) {
        return false;
      }
    }
    // Busca textual
    if (subjectSearch.trim()) {
      const searchLower = subjectSearch.toLowerCase().trim();
      const matchName = subject.name?.toLowerCase().includes(searchLower);
      const matchTeacher = subject.teacher_name?.toLowerCase().includes(searchLower);
      const matchDesc = subject.description?.toLowerCase().includes(searchLower);
      const matchSchedule = subject.schedule?.toLowerCase().includes(searchLower);
      if (!matchName && !matchTeacher && !matchDesc && !matchSchedule) {
        return false;
      }
    }
    return true;
  });

  const getTabLabel = (tabValue: string) => {
    const labels: Record<string, string> = {
      overview: 'Visão Geral',
      users: 'Usuários',
      students: 'Estudantes',
      teachers: 'Professores',
      subjects: 'Disciplinas',
      settings: 'Configurações'
    };
    return labels[tabValue] || tabValue;
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
      fetchSubjects();
      fetchTeachers();
      fetchStudents();
    }
  }, [user, isAdmin]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const teacherData = await getAllTeachers();
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
    try {
      await deleteTeacherService(teacherId);
      toast({
        title: "Sucesso",
        description: "Professor removido com sucesso do sistema.",
      });
      fetchTeachers();
      fetchUsers();
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
      await deleteStudent(userId);
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso.",
      });
      fetchUsers();
      fetchTeachers();
      fetchStudents();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: (error as Error).message || "Erro ao deletar usuário",
        variant: "destructive",
      });
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await subjectService.getAll();
      const adminSubjects: AdminSubject[] = data.map(subject => ({
        id: subject.id.toString(),
        name: subject.name,
        description: subject.description,
        teacher_id: subject.teacher_id ? subject.teacher_id.toString() : undefined,
        teacher_name: subject.teacher_name,
        teacher_ids: subject.teacher_ids,
        teachers: subject.teachers,
        schedule: subject.schedule,
        current_students: subject.current_students || 0,
        max_students: subject.max_students || 0,
        grade: subject.grade,
        semester: subject.semester,
        period: subject.period,
        periods: subject.periods,
        year: subject.year,
        color: subject.color
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
      fetchSubjects();
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
    if (user?.roles?.some((r: any) => r.role === 'student')) {
      setEditingStudent(user);
      setShowStudentModal(true);
    } else if (user?.roles?.some((r: any) => r.role === 'teacher')) {
      setEditingTeacher(user);
      setShowTeacherModal(true);
    } else {
      setEditingUser(user);
      setShowUserEditModal(true);
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
      await updateUserRole(userId, 'admin');

      toast({
        title: "Sucesso",
        description: "Usuário promovido a administrador com sucesso.",
      });
      
      fetchUsers();
      fetchStudents();
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

  const stats = [
    { title: 'Estudantes Ativos', value: totalStudents.toString(), icon: Users, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Professores', value: teachers.length.toString(), icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Disciplinas', value: subjects.length.toString(), icon: BookOpen, color: 'text-accent', bgColor: 'bg-accent/10' },
    { title: 'Administradores', value: users.filter(u => u.roles.some((r: any) => r.role === 'admin')).length.toString(), icon: Shield, color: 'text-destructive', bgColor: 'bg-destructive/10' }
  ];

  const getUserStatus = (user: any) => {
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
          <div className="max-w-xl mx-auto mb-8">
            <TabsList className="hidden md:grid w-full grid-cols-6 gap-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="students">Estudantes</TabsTrigger>
              <TabsTrigger value="teachers">Professores</TabsTrigger>
              <TabsTrigger value="subjects">Disciplinas</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>
            
            {/* Menu mobile */}
            <div className="md:hidden">
              <div className="w-full">
                <SwipeableSheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SwipeableSheetTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        {getTabLabel(activeTab)}
                      </span>
                      <Menu className="w-4 h-4 ml-2" />
                    </Button>
                  </SwipeableSheetTrigger>
                  <SwipeableSheetContent side="bottom" className="p-0" onSwipeUp={() => setIsMobileMenuOpen(false)}>
                    <div className="p-4">
                      <h3 className="font-semibold mb-4">Navegação</h3>
                      <div className="space-y-2">
                        <Button
                          variant={activeTab === 'overview' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('overview');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Home className="w-4 h-4 mr-2" />
                          Visão Geral
                        </Button>
                        <Button
                          variant={activeTab === 'users' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('users');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Usuários
                        </Button>
                        <Button
                          variant={activeTab === 'students' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('students');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Estudantes
                        </Button>
                        <Button
                          variant={activeTab === 'teachers' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('teachers');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Professores
                        </Button>
                        <Button
                          variant={activeTab === 'subjects' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('subjects');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Disciplinas
                        </Button>
                        <Button
                          variant={activeTab === 'settings' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('settings');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Configurações
                        </Button>
                      </div>
                    </div>
                  </SwipeableSheetContent>
                </SwipeableSheet>
              </div>
            </div>
          </div>

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
                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('') : (user.email ? user.email[0].toUpperCase() : 'U')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || 'Sem nome'}</p>
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
                              {teacher.full_name ? teacher.full_name.split(' ').map((n: string) => n[0]).join('') : (teacher.email ? teacher.email[0].toUpperCase() : 'P')}
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

                  {/* Filtro rápido por Série (Badges / Pílulas) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={studentGradeFilter === 'all' ? 'default' : 'outline'}
                      className="text-xs h-8"
                      onClick={() => setStudentGradeFilter('all')}
                    >
                      Todas as Séries
                      <Badge variant={studentGradeFilter === 'all' ? 'secondary' : 'outline'} className="ml-1.5 px-1.5 py-0 text-[10px]">
                        {students.length}
                      </Badge>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={studentGradeFilter === '1º Ano' ? 'default' : 'outline'}
                      className="text-xs h-8"
                      onClick={() => setStudentGradeFilter('1º Ano')}
                    >
                      1º Ano
                      <Badge variant={studentGradeFilter === '1º Ano' ? 'secondary' : 'outline'} className="ml-1.5 px-1.5 py-0 text-[10px]">
                        {students.filter((s) => s.grade === '1º Ano').length}
                      </Badge>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={studentGradeFilter === '2º Ano' ? 'default' : 'outline'}
                      className="text-xs h-8"
                      onClick={() => setStudentGradeFilter('2º Ano')}
                    >
                      2º Ano
                      <Badge variant={studentGradeFilter === '2º Ano' ? 'secondary' : 'outline'} className="ml-1.5 px-1.5 py-0 text-[10px]">
                        {students.filter((s) => s.grade === '2º Ano').length}
                      </Badge>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={studentGradeFilter === '3º Ano' ? 'default' : 'outline'}
                      className="text-xs h-8"
                      onClick={() => setStudentGradeFilter('3º Ano')}
                    >
                      3º Ano
                      <Badge variant={studentGradeFilter === '3º Ano' ? 'secondary' : 'outline'} className="ml-1.5 px-1.5 py-0 text-[10px]">
                        {students.filter((s) => s.grade === '3º Ano').length}
                      </Badge>
                    </Button>
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
                      className="pl-9 pr-8 h-9"
                    />
                    {studentSearch && (
                      <button
                        type="button"
                        onClick={() => setStudentSearch('')}
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

                  {(studentGradeFilter !== 'all' || studentSearch.trim() !== '') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStudentGradeFilter('all');
                        setStudentSearch('');
                      }}
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
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredStudents.map((student) => {
                      const status = 'Ativo';
                      return (
                        <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/40 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {student.full_name ? student.full_name.split(' ').map((n: string) => n[0]).join('') : (student.email ? student.email[0].toUpperCase() : 'E')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{student.full_name || 'Nome não informado'}</p>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Matrícula: {student.student_registration || 'Não informado'}
                              </p>
                              {student.grade && (
                                <Badge variant="secondary" className={`text-xs mt-1 inline-block ${
                                  student.grade === '1º Ano' ? 'bg-green-100 text-green-800 border-green-200' :
                                  student.grade === '2º Ano' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                  student.grade === '3º Ano' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                  'bg-gray-100 text-gray-800 border-gray-200'
                                }`}>
                                  {student.grade}
                                </Badge>
                              )}
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
                    {filteredStudents.length === 0 && (
                      <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                        <p className="text-base font-medium text-foreground">Nenhum estudante encontrado</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {studentGradeFilter !== 'all' || studentSearch
                            ? 'Nenhum estudante corresponde aos filtros selecionados.'
                            : 'Nenhum estudante cadastrado no sistema.'}
                        </p>
                        {(studentGradeFilter !== 'all' || studentSearch) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => {
                              setStudentGradeFilter('all');
                              setStudentSearch('');
                            }}
                          >
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
                      className="pl-9 pr-8 h-9"
                    />
                    {subjectSearch && (
                      <button
                        type="button"
                        onClick={() => setSubjectSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {(subjectGradeFilter !== 'all' ||
                    subjectPeriodFilter !== 'all' ||
                    subjectYearFilter !== 'all' ||
                    subjectSemesterFilter !== 'all' ||
                    subjectSearch.trim() !== '') && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSubjectGradeFilter('all');
                        setSubjectPeriodFilter('all');
                        setSubjectYearFilter('all');
                        setSubjectSemesterFilter('all');
                        setSubjectSearch('');
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground h-9 px-3 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Limpar Filtros
                    </Button>
                  )}
                </div>

                {/* Grid de Seletores de Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* Filtro Série */}
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

                  {/* Filtro Período */}
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

                  {/* Filtro Ano */}
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

                  {/* Filtro Semestre */}
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

                {/* Barra de status de resultados */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <span>
                    {filteredSubjects.length === subjects.length
                      ? `Total: ${subjects.length} disciplinas`
                      : `Exibindo ${filteredSubjects.length} de ${subjects.length} disciplinas`}
                  </span>
                  {(subjectGradeFilter !== 'all' ||
                    subjectPeriodFilter !== 'all' ||
                    subjectYearFilter !== 'all' ||
                    subjectSemesterFilter !== 'all' ||
                    subjectSearch.trim() !== '') && (
                    <span className="text-primary font-medium">Filtros aplicados</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {loadingSubjects ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSubjects.map((subject) => (
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
                          <div className="text-xs text-muted-foreground">
                            ID: #{subject.id}
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
                {filteredSubjects.length === 0 && (
                  <div className="col-span-1 md:col-span-2 text-center py-12 border border-dashed rounded-lg bg-muted/20">
                    <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="text-base font-medium text-foreground">Nenhuma disciplina encontrada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {subjectGradeFilter !== 'all' ||
                      subjectPeriodFilter !== 'all' ||
                      subjectYearFilter !== 'all' ||
                      subjectSemesterFilter !== 'all' ||
                      subjectSearch
                        ? 'Nenhuma disciplina corresponde aos filtros selecionados.'
                        : 'Nenhuma disciplina cadastrada no sistema.'}
                    </p>
                    {(subjectGradeFilter !== 'all' ||
                      subjectPeriodFilter !== 'all' ||
                      subjectYearFilter !== 'all' ||
                      subjectSemesterFilter !== 'all' ||
                      subjectSearch) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setSubjectGradeFilter('all');
                          setSubjectPeriodFilter('all');
                          setSubjectYearFilter('all');
                          setSubjectSemesterFilter('all');
                          setSubjectSearch('');
                        }}
                      >
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
        onSuccess={() => {
          fetchStudents();
          fetchUsers();
        }}
        student={editingStudent}
      />
      <TeacherModal
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        onSuccess={() => {
          fetchTeachers();
          fetchUsers();
        }}
        teacher={editingTeacher}
      />
      <UserEditModal
        isOpen={showUserEditModal}
        onClose={() => setShowUserEditModal(false)}
        onSuccess={() => {
          fetchUsers();
          fetchStudents();
          fetchTeachers();
        }}
        user={editingUser}
      />
    </div>
  );
}
