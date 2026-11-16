import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, BookOpen, Settings, BarChart3, LogOut, Home, Shield, ShieldAlert, Plus, Edit, Trash2, Eye, Menu, Search, Filter, X, RotateCcw, KeyRound, Briefcase, GraduationCap, Bell, ArrowUpDown, Globe } from 'lucide-react';
import TeacherNotificationsModal from '@/components/teacher/TeacherNotificationsModal';
import PortalSettingsTab from '@/components/admin/portal/PortalSettingsTab';
import AdminOverviewTab from '@/components/admin/AdminOverviewTab';
import AdminTeachersTab from '@/components/admin/AdminTeachersTab';
import AdminStudentsTab from '@/components/admin/AdminStudentsTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminSubjectsTab from '@/components/admin/AdminSubjectsTab';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SubjectModal from '@/components/SubjectModal';
import StudentModal from '@/components/admin/StudentModal';
import TeacherModal from '@/components/admin/TeacherModal';
import UserEditModal from '@/components/admin/UserEditModal';
import { getAllStudents, deleteStudent } from '@/services/studentService';
import { getAllUsers, updateUserRole, resetUserPassword } from '@/services/userService';
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
  created_at?: string;
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
  created_at?: string;
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
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<AdminSubject | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<{ id: string; name: string; email?: string; role?: string } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [userToDemote, setUserToDemote] = useState<{ id: string; name: string; email?: string } | null>(null);
  const [demoteRole, setDemoteRole] = useState<'teacher' | 'student'>('teacher');
  const [isDemoting, setIsDemoting] = useState(false);
  const { toast } = useToast();

  // Filtros para Usuários
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [userSortBy, setUserSortBy] = useState<'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'>('name-asc');

  // Filtros para Estudantes
  const [studentGradeFilter, setStudentGradeFilter] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSortBy, setStudentSortBy] = useState<'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'>('name-asc');

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

  // Filtragem e ordenação de Usuários
  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      if (userRoleFilter !== 'all') {
        const hasRole = u.roles?.some((r: any) => r.role === userRoleFilter);
        if (!hasRole) return false;
      }
      if (userSearch.trim()) {
        const searchLower = userSearch.toLowerCase().trim();
        const matchName = u.full_name?.toLowerCase().includes(searchLower);
        const matchEmail = u.email?.toLowerCase().includes(searchLower);
        const matchReg = u.student_registration?.toLowerCase().includes(searchLower);
        if (!matchName && !matchEmail && !matchReg) {
          return false;
        }
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (userSortBy === 'name-asc') {
        const nameA = (a.full_name || a.email || '').trim();
        const nameB = (b.full_name || b.email || '').trim();
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      }
      if (userSortBy === 'name-desc') {
        const nameA = (a.full_name || a.email || '').trim();
        const nameB = (b.full_name || b.email || '').trim();
        return nameB.localeCompare(nameA, 'pt-BR', { sensitivity: 'base' });
      }
      if (userSortBy === 'date-desc') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (userSortBy === 'date-asc') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      }
      return 0;
    });
  }, [users, userRoleFilter, userSearch, userSortBy]);

  // Filtragem e ordenação de Estudantes
  const filteredStudents = useMemo(() => {
    const list = students.filter((student) => {
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

    return [...list].sort((a, b) => {
      if (studentSortBy === 'name-asc') {
        const nameA = (a.full_name || '').trim();
        const nameB = (b.full_name || '').trim();
        return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
      }
      if (studentSortBy === 'name-desc') {
        const nameA = (a.full_name || '').trim();
        const nameB = (b.full_name || '').trim();
        return nameB.localeCompare(nameA, 'pt-BR', { sensitivity: 'base' });
      }
      if (studentSortBy === 'date-desc') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      }
      if (studentSortBy === 'date-asc') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      }
      return 0;
    });
  }, [students, studentGradeFilter, studentSearch, studentSortBy]);

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
      portal: 'Portal',
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
      const targetUser = users.find(u => u.id === userId);
      const isTargetAdmin = targetUser?.roles.some((r: any) => r.role === 'admin');
      const totalAdmins = users.filter(u => u.roles.some((r: any) => r.role === 'admin')).length;

      if (isTargetAdmin && totalAdmins <= 1) {
        toast({
          title: "Operação não permitida",
          description: "Não é possível remover o único administrador. O sistema precisa obrigatoriamente de pelo menos um administrador ativo.",
          variant: "destructive",
        });
        return;
      }

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
      fetchTeachers();
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      toast({
        title: "Erro",
        description: "Falha ao promover usuário a administrador.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDemote = async () => {
    if (!userToDemote) return;
    const totalAdmins = users.filter(u => u.roles.some((r: any) => r.role === 'admin')).length;
    if (totalAdmins <= 1) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível reverter. O sistema obrigatoriamente precisa ter pelo menos um administrador ativo.",
        variant: "destructive",
      });
      setUserToDemote(null);
      return;
    }

    setIsDemoting(true);
    try {
      await updateUserRole(userToDemote.id, demoteRole);
      toast({
        title: "Papel atualizado!",
        description: `${userToDemote.name} agora possui o papel de ${demoteRole === 'teacher' ? 'Professor' : 'Estudante'}.`,
      });
      setUserToDemote(null);
      fetchUsers();
      fetchStudents();
      fetchTeachers();
    } catch (error: any) {
      console.error('Erro ao alterar papel de administrador:', error);
      toast({
        title: "Erro ao alterar papel",
        description: error.message || "Não foi possível reverter o usuário de administrador.",
        variant: "destructive",
      });
    } finally {
      setIsDemoting(false);
    }
  };

  const handleConfirmResetPassword = async (targetUser: { id: string; name: string; email?: string; role?: string }) => {
    setIsResettingPassword(true);
    try {
      await resetUserPassword(targetUser.id, 'balbina123');
      toast({
        title: "Senha resetada com sucesso!",
        description: `A senha de ${targetUser.name} foi redefinida para "balbina123".`,
      });
      setUserToResetPassword(null);
    } catch (error: any) {
      console.error('Erro ao resetar senha do usuário:', error);
      toast({
        title: "Erro ao resetar senha",
        description: error.message || "Não foi possível resetar a senha do usuário.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
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
            <TabsList className="hidden md:grid w-full grid-cols-7 gap-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="students">Estudantes</TabsTrigger>
              <TabsTrigger value="teachers">Professores</TabsTrigger>
              <TabsTrigger value="subjects">Disciplinas</TabsTrigger>
              <TabsTrigger value="portal">Portal</TabsTrigger>
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
                          variant={activeTab === 'portal' ? "secondary" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => {
                            setActiveTab('portal');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <Globe className="w-4 h-4 mr-2 text-primary" />
                          Portal
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
            <AdminOverviewTab stats={stats} setActiveTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsersTab
              users={users}
              filteredUsers={filteredUsers}
              loadingUsers={loadingUsers}
              currentUserId={user?.id || profile?.id}
              userRoleFilter={userRoleFilter}
              setUserRoleFilter={setUserRoleFilter}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
              userSortBy={userSortBy}
              setUserSortBy={setUserSortBy}
              getUserStatus={getUserStatus}
              getUserStatusVariant={getUserStatusVariant}
              onOpenStudentModal={() => openStudentModal()}
              onOpenTeacherModal={() => openTeacherModal()}
              onOpenUserModal={openUserModal}
              onResetPassword={setUserToResetPassword}
              onPromoteToAdmin={promoteToAdmin}
              onRequestDemoteAdmin={(target) => {
                setUserToDemote(target);
                setDemoteRole('teacher');
              }}
              onNotifyError={(title, description) =>
                toast({ title, description, variant: 'destructive' })
              }
              onDeleteUser={deleteUser}
            />
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <AdminTeachersTab
              teachers={teachers}
              loadingTeachers={loadingTeachers}
              onOpenTeacherModal={openTeacherModal}
              onResetPassword={setUserToResetPassword}
              onDeleteTeacher={deleteTeacher}
            />
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <AdminStudentsTab
              students={students}
              filteredStudents={filteredStudents}
              loadingStudents={loadingStudents}
              studentGradeFilter={studentGradeFilter}
              setStudentGradeFilter={setStudentGradeFilter}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              studentSortBy={studentSortBy}
              setStudentSortBy={setStudentSortBy}
              onOpenStudentModal={openStudentModal}
              onResetPassword={setUserToResetPassword}
              onDeleteStudent={deleteUser}
            />
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <AdminSubjectsTab
              subjects={subjects}
              filteredSubjects={filteredSubjects}
              loadingSubjects={loadingSubjects}
              subjectSearch={subjectSearch}
              setSubjectSearch={setSubjectSearch}
              subjectGradeFilter={subjectGradeFilter}
              setSubjectGradeFilter={setSubjectGradeFilter}
              subjectPeriodFilter={subjectPeriodFilter}
              setSubjectPeriodFilter={setSubjectPeriodFilter}
              subjectYearFilter={subjectYearFilter}
              setSubjectYearFilter={setSubjectYearFilter}
              subjectSemesterFilter={subjectSemesterFilter}
              setSubjectSemesterFilter={setSubjectSemesterFilter}
              availableSubjectYears={availableSubjectYears}
              availableSubjectSemesters={availableSubjectSemesters}
              showSubjectModal={showSubjectModal}
              setShowSubjectModal={setShowSubjectModal}
              editingSubject={editingSubject}
              subjectToDelete={subjectToDelete}
              setSubjectToDelete={setSubjectToDelete}
              onOpenSubjectModal={openSubjectModal}
              onRefreshSubjects={fetchSubjects}
              onDeleteSubject={deleteSubject}
            />
          </TabsContent>

          <TabsContent value="portal" className="space-y-6">
            <PortalSettingsTab subjects={subjects} />
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
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-primary font-semibold hover:bg-primary/10 border-primary/40"
                    onClick={() => setShowNotificationsModal(true)}
                  >
                    <Bell className="w-4 h-4 mr-2 text-primary" />
                    Configurar e Disparar Notificações
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
        currentUserId={user?.id || profile?.id}
        totalAdmins={users.filter(u => u.roles.some((r: any) => r.role === 'admin')).length}
        user={editingUser}
      />

      {/* Modal de Reverter Papel de Administrador */}
      <AlertDialog open={!!userToDemote} onOpenChange={(open) => !open && setUserToDemote(null)}>
        <AlertDialogContent className="sm:max-w-[460px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Reverter Papel de Administrador
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-left">
              <p>
                Deseja remover as permissões de administrador de <strong>{userToDemote?.name}</strong>{userToDemote?.email ? ` (${userToDemote.email})` : ''}?
              </p>
              
              <div className="space-y-2 pt-2">
                <Label htmlFor="demoteRoleSelect" className="text-foreground font-semibold text-xs">
                  Novo papel do usuário:
                </Label>
                <Select
                  value={demoteRole}
                  onValueChange={(val: 'teacher' | 'student') => setDemoteRole(val)}
                >
                  <SelectTrigger id="demoteRoleSelect" className="w-full">
                    <SelectValue placeholder="Selecione o novo papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-600" />
                        <span>Professor</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="student">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600" />
                        <span>Estudante</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground pt-1">
                O usuário perderá o acesso ao Painel Administrativo imediatamente e receberá as permissões do novo papel selecionado.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDemoting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDemoting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDemote();
              }}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isDemoting ? 'Alterando...' : 'Confirmar Reversão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação de Reset de Senha */}
      <AlertDialog open={!!userToResetPassword} onOpenChange={(open) => !open && setUserToResetPassword(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              Resetar Senha do {userToResetPassword?.role || 'Usuário'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-left">
              <p>
                Tem certeza que deseja resetar a senha de <strong>{userToResetPassword?.name}</strong>{userToResetPassword?.email ? ` (${userToResetPassword.email})` : ''}?
              </p>
              <div className="p-3 bg-muted/70 rounded-md border text-sm space-y-1.5">
                <p className="font-semibold text-foreground text-xs">Nova senha padrão que será configurada:</p>
                <div className="flex items-center justify-between font-mono bg-background px-3 py-1.5 rounded border">
                  <span className="font-bold text-amber-600 dark:text-amber-400">balbina123</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText('balbina123');
                      toast({ title: "Copiado!", description: "Senha 'balbina123' copiada para a área de transferência." });
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Após a confirmação, o usuário poderá entrar no portal imediatamente utilizando a senha <strong>balbina123</strong>.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingPassword}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isResettingPassword}
              onClick={(e) => {
                e.preventDefault();
                if (userToResetPassword) {
                  handleConfirmResetPassword(userToResetPassword);
                }
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isResettingPassword ? 'Resetando...' : 'Confirmar Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Gestão de Notificações Unificado (Admin) */}
      <TeacherNotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        teacherId={user?.id}
        teacherName={profile?.full_name || 'Coordenação Geral'}
        isAdmin={true}
        subjects={subjects.map(s => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
