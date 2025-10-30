import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileText, BookOpen, Users, Plus, Edit, Trash2, Eye, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ActivityManagement() {
  const { userRole } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados das atividades
    setTimeout(() => {
      const mockActivities = [
        {
          id: '1',
          title: 'Exercício de Fixação 1',
          subject: 'Matemática Básica',
          type: 'Exercício',
          dueDate: '2024-12-15',
          students: 25,
          completed: 18,
          status: 'Ativa'
        },
        {
          id: '2',
          title: 'Trabalho Prático',
          subject: 'Português Técnico',
          type: 'Trabalho',
          dueDate: '2024-12-20',
          students: 22,
          completed: 15,
          status: 'Ativa'
        },
        {
          id: '3',
          title: 'Prova Bimestral',
          subject: 'Informática Aplicada',
          type: 'Prova',
          dueDate: '2024-12-10',
          students: 30,
          completed: 28,
          status: 'Concluída'
        }
      ];
      setActivities(mockActivities);
      setLoading(false);
    }, 100);
  }, []);

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchTerm.toLowerCase())
 );

  const handleCreateActivity = () => {
    // Lógica para criar nova atividade
    console.log('Criar nova atividade');
  };

  const handleEditActivity = (id: string) => {
    // Lógica para editar atividade
    console.log('Editar atividade:', id);
  };

  const handleDeleteActivity = (id: string) => {
    // Lógica para deletar atividade
    console.log('Deletar atividade:', id);
  };

  const handleViewActivity = (id: string) => {
    // Lógica para visualizar atividade
    console.log('Visualizar atividade:', id);
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Atividades</h1>
          <p className="text-gray-600 mt-2">
            {userRole === 'teacher' 
              ? 'Gerencie as atividades e avaliações dos seus alunos'
              : 'Gerencie todas as atividades do sistema'
            }
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar atividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreateActivity}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Atividade
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{activity.title}</CardTitle>
                      <p className="text-sm text-gray-600">{activity.subject}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activity.status === 'Ativa' 
                        ? 'bg-green-100 text-green-800' 
                        : activity.status === 'Concluída'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {activity.type}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">
                      <Users className="h-4 w-4 inline mr-1" />
                      {activity.completed}/{activity.students} concluídas
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewActivity(activity.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditActivity(activity.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
            <p className="text-gray-600">Tente ajustar sua busca ou crie uma nova atividade.</p>
          </div>
        )}
      </div>
    </div>
  );
}
