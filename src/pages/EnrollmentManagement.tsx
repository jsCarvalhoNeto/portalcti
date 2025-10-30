import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Users, Plus, X, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function EnrollmentManagement() {
  const {  } = useAuth();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados das matrículas
    setTimeout(() => {
      const mockEnrollments = [
        {
          id: '1',
          student: 'João Silva',
          studentEmail: 'joao@email.com',
          subject: 'Matemática Básica',
          teacher: 'Prof. Carlos Silva',
          enrollmentDate: '2024-08-01',
          status: 'Ativa',
          progress: 85,
          grade: '9.5'
        },
        {
          id: '2',
          student: 'Maria Santos',
          studentEmail: 'maria@email.com',
          subject: 'Português Técnico',
          teacher: 'Prof. Ana Santos',
          enrollmentDate: '2024-08-01',
          status: 'Ativa',
          progress: 78,
          grade: '8.7'
        },
        {
          id: '3',
          student: 'Pedro Oliveira',
          studentEmail: 'pedro@email.com',
          subject: 'Informática Aplicada',
          teacher: 'Prof. João Oliveira',
          enrollmentDate: '2024-08-01',
          status: 'Ativa',
          progress: 92,
          grade: '9.8'
        }
      ];
      setEnrollments(mockEnrollments);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEnrollStudent = () => {
    // Lógica para matricular aluno
    console.log('Matricular aluno');
  };

  const handleUnenrollStudent = (id: string) => {
    // Lógica para desmatricular aluno
    console.log('Desmatricular aluno:', id);
  };

  const handleApproveEnrollment = (id: string) => {
    // Lógica para aprovar matrícula
    console.log('Aprovar matrícula:', id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Matrículas</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as matrículas dos alunos nas disciplinas
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar matrículas por aluno, disciplina ou professor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleEnrollStudent}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Matrícula
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEnrollments.map((enrollment) => (
            <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{enrollment.student}</CardTitle>
                      <p className="text-sm text-gray-600">{enrollment.subject}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      enrollment.status === 'Ativa' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {enrollment.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Professor:</span>
                    <span className="font-medium">{enrollment.teacher}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Email:</span>
                    <span className="font-medium">{enrollment.studentEmail}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Data de matrícula:</span>
                    <span>{new Date(enrollment.enrollmentDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Progresso:</span>
                    <span className="font-medium">{enrollment.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Média:</span>
                    <span className="font-medium text-blue-600">{enrollment.grade}</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${enrollment.progress}%` }}
                  ></div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnenrollStudent(enrollment.id)}
                    className="text-red-600 hover:text-red-700 flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Desmatricular
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApproveEnrollment(enrollment.id)}
                    className="text-green-600 hover:text-green-700 flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEnrollments.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma matrícula encontrada</h3>
            <p className="text-gray-600">Tente ajustar sua busca ou crie uma nova matrícula.</p>
          </div>
        )}
      </div>
    </div>
  );
}
