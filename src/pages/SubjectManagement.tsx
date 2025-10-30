import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, Users, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SubjectManagement() {
  const { userRole } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados das disciplinas
    setTimeout(() => {
      const mockSubjects = [
        {
          id: '1',
          title: 'Matemática Básica',
          description: 'Fundamentos de matemática para ensino técnico',
          teacher: 'Prof. Carlos Silva',
          students: 25,
          activities: 8,
          status: 'Ativa'
        },
        {
          id: '2',
          title: 'Português Técnico',
          description: 'Língua portuguesa aplicada ao contexto técnico',
          teacher: 'Prof. Ana Santos',
          students: 22,
          activities: 6,
          status: 'Ativa'
        },
        {
          id: '3',
          title: 'Informática Aplicada',
          description: 'Fundamentos de informática e uso de softwares',
          teacher: 'Prof. João Oliveira',
          students: 30,
          activities: 10,
          status: 'Ativa'
        }
      ];
      setSubjects(mockSubjects);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredSubjects = subjects.filter(subject =>
    subject.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSubject = () => {
    // Lógica para criar nova disciplina
    console.log('Criar nova disciplina');
  };

  const handleEditSubject = (id: string) => {
    // Lógica para editar disciplina
    console.log('Editar disciplina:', id);
  };

  const handleDeleteSubject = (id: string) => {
    // Lógica para deletar disciplina
    console.log('Deletar disciplina:', id);
  };

  const handleViewSubject = (id: string) => {
    // Lógica para visualizar disciplina
    console.log('Visualizar disciplina:', id);
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Disciplinas</h1>
          <p className="text-gray-600 mt-2">
            {userRole === 'teacher' 
              ? 'Gerencie suas disciplinas e materiais de ensino'
              : 'Gerencie todas as disciplinas do sistema'
            }
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar disciplinas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreateSubject}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Disciplina
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSubjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{subject.title}</CardTitle>
                      <p className="text-sm text-gray-600">{subject.teacher}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    subject.status === 'Ativa' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {subject.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{subject.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {subject.students} alunos
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {subject.activities} atividades
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSubject(subject.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSubject(subject.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="text-red-600 hover:text-red-70"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma disciplina encontrada</h3>
            <p className="text-gray-600">Tente ajustar sua busca ou crie uma nova disciplina.</p>
          </div>
        )}
      </div>
    </div>
  );
}
