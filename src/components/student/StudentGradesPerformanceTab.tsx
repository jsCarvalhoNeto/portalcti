import { getStudentActivities } from '@/services/activityService';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ExtendedStudentActivity {
  id: number;
  name: string;
  subject_name: string;
  teacher_name: string;
  type: 'individual' | 'team';
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  created_at: string;
  deadline: string | null;       // Campo para prazo final
  status: 'pending' | 'submitted' | 'completed';
  student_grade?: number | string | null; // Campo opcional que vem da API (pode ser number ou string)
  grade_date?: string | null;    // Campo opcional que vem da API
  period?: string | null;        // Campo opcional para período
  evaluation_type?: string | null; // Campo opcional para tipo de avaliação
}

export default function StudentGradesPerformanceTab() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ExtendedStudentActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ExtendedStudentActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
 const [filterSubject, setFilterSubject] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterEvaluationType, setFilterEvaluationType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  // Funções para toggle dos filtros
  const handleSubjectChange = (value: string) => {
    if (value === 'all') {
      setFilterSubject('');
    } else {
      setFilterSubject(value);
    }
  };

  const handleTeacherChange = (value: string) => {
    if (value === 'all') {
      setFilterTeacher('');
    } else {
      setFilterTeacher(value);
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      setFilterStatus('');
    } else {
      setFilterStatus(value);
    }
  };

  const handlePeriodChange = (value: string) => {
    if (value === 'all') {
      setFilterPeriod('');
    } else {
      setFilterPeriod(value);
    }
  };

  const handleEvaluationTypeChange = (value: string) => {
    if (value === 'all') {
      setFilterEvaluationType('');
    } else {
      setFilterEvaluationType(value);
    }
  };

  useEffect(() => {
    // Aplicar todos os filtros
    let filtered = activities;
    
    // Filtro de busca geral
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro por disciplina
    if (filterSubject) {
      filtered = filtered.filter(activity => 
        activity.subject_name.toLowerCase().includes(filterSubject.toLowerCase())
      );
    }
    
    // Filtro por professor
    if (filterTeacher) {
      filtered = filtered.filter(activity => 
        activity.teacher_name.toLowerCase().includes(filterTeacher.toLowerCase())
      );
    }
    
    // Filtro por status
    if (filterStatus) {
      filtered = filtered.filter(activity => activity.status === filterStatus);
    }

    // Filtro por período
    if (filterPeriod) {
      filtered = filtered.filter(activity => activity.period === filterPeriod);
    }

    // Filtro por tipo de avaliação
    if (filterEvaluationType) {
      filtered = filtered.filter(activity => activity.evaluation_type === filterEvaluationType);
    }
    
    setFilteredActivities(filtered);
  }, [activities, searchTerm, filterSubject, filterTeacher, filterStatus, filterPeriod, filterEvaluationType]);

  const fetchActivities = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar todas as atividades do aluno (já inclui informações de notas e status)
      const activitiesData = await getStudentActivities();
      
      // Garantir que os campos period e evaluation_type estejam presentes
      const activitiesWithDefaults = activitiesData.map((activity: any) => ({
        ...activity,
        period: activity.period || null,
        evaluation_type: activity.evaluation_type || null
      }));
      setActivities(activitiesWithDefaults);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ExtendedStudentActivity['status']) => {
    const statusConfig = {
      pending: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      submitted: { text: 'Enviado', color: 'bg-blue-100 text-blue-800' },
      completed: { text: 'Concluído', color: 'bg-green-100 text-green-800' }
    };
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getGradeDisplay = (activity: ExtendedStudentActivity) => {
    // API retorna a nota como student_grade
    if (activity.student_grade === null || activity.student_grade === undefined || activity.student_grade === '') return '-';
    // Verificar se é um número antes de chamar toFixed
    const gradeValue = Number(activity.student_grade);
    if (isNaN(gradeValue)) return '-';
    return gradeValue.toFixed(1);
  };

  // Obter opções únicas para os filtros
  const getUniqueSubjects = () => {
    return [...new Set(activities.map(a => a.subject_name))].filter(Boolean).sort();
  };

  const getUniqueTeachers = () => {
    return [...new Set(activities.map(a => a.teacher_name))].filter(Boolean).sort();
  };

  const getUniquePeriods = () => {
    return [...new Set(activities.map(a => a.period))].filter((p): p is string => !!p).sort();
  };

  const getUniqueEvaluationTypes = () => {
    return [...new Set(activities.map(a => a.evaluation_type))].filter((evaluationType): evaluationType is string => !!evaluationType).sort();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Notas das Atividades</h2>
          <p className="text-muted-foreground">
            Todas as suas atividades com status e notas informadas pelo professor
          </p>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <Select value={filterSubject} onValueChange={handleSubjectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mostrar todos</SelectItem>
              {getUniqueSubjects().map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTeacher} onValueChange={handleTeacherChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Professor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mostrar todos</SelectItem>
              {getUniqueTeachers().map(teacher => (
                <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mostrar todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="submitted">Enviado</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mostrar todos</SelectItem>
              {getUniquePeriods().map(period => (
                <SelectItem key={period} value={period}>{period}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEvaluationType} onValueChange={handleEvaluationTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo de Avaliação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Mostrar todos</SelectItem>
              {getUniqueEvaluationTypes().map(evaluationType => (
                <SelectItem key={evaluationType} value={evaluationType}>{evaluationType}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            {filteredActivities.length} item(s)
          </div>
        </div>
      </div>

      {/* Tabela de Notas */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Disciplina</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Atividade</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Professor</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Data de Envio</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Prazo Final</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Nota</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivities.length > 0 ? (
                  filteredActivities.map((activity) => (
                    <tr key={activity.id} className="border-t hover:bg-muted/20">
                      <td className="p-4">
                        <div className="font-medium">{activity.subject_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{activity.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">{activity.teacher_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {activity.created_at ? new Date(activity.created_at).toLocaleDateString('pt-BR') : '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {activity.deadline ? new Date(activity.deadline).toLocaleDateString('pt-BR') : '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(activity.status)}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-lg">
                          {getGradeDisplay(activity)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nenhuma atividade encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-60">
              {filteredActivities.length}
            </div>
            <div className="text-sm text-muted-foreground">Total de Atividades</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredActivities.filter(a => a.student_grade !== null && a.student_grade !== undefined && a.student_grade !== '').length}
            </div>
            <div className="text-sm text-muted-foreground">Com Notas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {(() => {
                const totalPoints = filteredActivities
                  .map(a => a.student_grade !== null && a.student_grade !== undefined && a.student_grade !== '' ? Number(a.student_grade) : 0)
                  .filter(grade => !isNaN(grade))
                  .reduce((sum, grade) => sum + grade, 0);
                return totalPoints.toFixed(1);
              })()}
            </div>
            <div className="text-sm text-muted-foreground">Total de Pontos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-60">
              {(() => {
                const validGrades = filteredActivities
                  .map(a => a.student_grade !== null && a.student_grade !== undefined && a.student_grade !== '' ? Number(a.student_grade) : null)
                  .filter((grade): grade is number => grade !== null && !isNaN(grade));
                return validGrades.length > 0 
                  ? (validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length).toFixed(1)
                  : '0.0';
              })()}
            </div>
            <div className="text-sm text-muted-foreground">Média Geral</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
