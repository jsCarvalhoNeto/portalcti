import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Trophy, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function StudentProfiles() {
  const { userRole } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados dos alunos
    setTimeout(() => {
      const mockStudents = [
        {
          id: '1',
          name: 'João Silva',
          registration: '2024001',
          email: 'joao@email.com',
          grade: '9.5',
          attendance: '95%',
          achievements: 12,
          activities: 8
        },
        {
          id: '2',
          name: 'Maria Santos',
          registration: '2024002',
          email: 'maria@email.com',
          grade: '8.7',
          attendance: '92%',
          achievements: 8,
          activities: 7
        },
        {
          id: '3',
          name: 'Pedro Oliveira',
          registration: '2024003',
          email: 'pedro@email.com',
          grade: '7.8',
          attendance: '88%',
          achievements: 5,
          activities: 6
        }
      ];
      setStudents(mockStudents);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.registration.includes(searchTerm) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Perfis dos Alunos</h1>
          <p className="text-gray-600 mt-2">
            {userRole === 'teacher' 
              ? 'Visualize e gerencie os perfis dos seus alunos'
              : 'Visualize os perfis dos alunos do sistema'
            }
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar alunos por nome, matrícula ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{student.name}</CardTitle>
                    <p className="text-sm text-gray-600">Matrícula: {student.registration}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm font-medium">{student.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Média:</span>
                    <span className="text-sm font-medium text-blue-600">{student.grade}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Frequência:</span>
                    <span className="text-sm font-medium text-green-600">{student.attendance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conquistas:</span>
                    <span className="text-sm font-medium text-purple-600">{student.achievements}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Atividades:</span>
                    <span className="text-sm font-medium text-orange-600">{student.activities}</span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Atividades
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Trophy className="h-4 w-4 mr-2" />
                    Ver Conquistas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum aluno encontrado</h3>
            <p className="text-gray-600">Tente ajustar sua busca para encontrar alunos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
