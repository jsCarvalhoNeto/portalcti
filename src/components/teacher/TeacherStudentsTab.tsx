import { useState, useEffect, useMemo } from 'react';
import { useTeacherDashboard, Student } from '@/contexts/TeacherDashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Phone, GraduationCap, Search } from 'lucide-react';
import { getStudentsByGrade } from '@/services/teacherDashboardService';

export default function TeacherStudentsTab() {
  const { loading } = useTeacherDashboard();
  const initialLoading = loading.students;
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [displayedStudents, setDisplayedStudents] = useState<Student[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchStudents = async () => {
      setDataLoading(true);
      try {
        if (selectedGrade === 'all') {
          // Busca todos os alunos combinando os resultados de todas as séries
          const grades: ('1º Ano' | '2º Ano' | '3º Ano')[] = ['1º Ano', '2º Ano', '3º Ano'];
          const studentPromises = grades.map(grade => getStudentsByGrade(grade));
          const studentsByGrade = await Promise.all(studentPromises);

          if (!isMounted) return;

          const allStudents = studentsByGrade.flat();

          // Remove duplicatas com base no ID do aluno
          const uniqueStudents = Array.from(new Map(allStudents.map(student => [student.id, student])).values());
          setDisplayedStudents(uniqueStudents);
        } else {
          // Busca alunos para a série específica selecionada
          const data = await getStudentsByGrade(selectedGrade as '1º Ano' | '2º Ano' | '3º Ano');

          if (!isMounted) return;

          setDisplayedStudents(data);
        }
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
        if (isMounted) {
          setDisplayedStudents([]); // Limpa a lista em caso de erro
        }
      } finally {
        if (isMounted) {
          setDataLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, [selectedGrade]);

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(displayedStudents)) {
      return [];
    }
    if (!searchTerm) {
      return displayedStudents;
    }
    return displayedStudents.filter(student =>
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_registration?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, displayedStudents]);

  const isLoading = initialLoading || dataLoading;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold"><span>Meus Alunos</span></h2>
        <p className="text-muted-foreground"><span>Alunos matriculados em suas disciplinas</span></p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle><span>Filtros</span></CardTitle>
          <CardDescription><span>Busque e filtre alunos por série</span></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium"><span>Filtrar por Série</span></label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as séries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all"><span>Todas as séries</span></SelectItem>
                  <SelectItem value="1º Ano"><span>1º Ano</span></SelectItem>
                  <SelectItem value="2º Ano"><span>2º Ano</span></SelectItem>
                  <SelectItem value="3º Ano"><span>3º Ano</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium"><span>Buscar Aluno</span></label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou matrícula..."
                  className="pl-8 w-full p-2 border rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle><span>Lista de Alunos</span></CardTitle>
          <CardDescription>
            <span>{selectedGrade !== 'all' ? `Alunos de ${selectedGrade}` : 'Todos os alunos'}</span>
            {searchTerm && <span>{` - Buscando por: "${searchTerm}"`}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4" translate="no">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {student.full_name?.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium"><span>{student.full_name}</span></p>
                        <p className="text-sm text-muted-foreground"><span>{student.email}</span></p>
                        {student.student_registration && (
                          <p className="text-xs text-muted-foreground">
                            <span>Matrícula: </span><span>{student.student_registration}</span>
                          </p>
                        )}
                        {student.grade && (
                          <p className="text-xs text-muted-foreground">
                            <span>Série: </span><span>{student.grade}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="capitalize">
                        <span>{student.grade || 'Sem série'}</span>
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" title="Enviar e-mail">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Ligar">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Ver perfil">
                          <GraduationCap className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  <span>Nenhum aluno encontrado </span>
                  {selectedGrade !== 'all' && <span>{`em ${selectedGrade}`}</span>}
                  {searchTerm && <span>{` com o termo "${searchTerm}"`}</span>}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
