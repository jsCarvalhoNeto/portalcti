import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User, Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados dos usuários
    setTimeout(() => {
      const mockUsers = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao@email.com',
          role: 'student',
          registration: '2024001',
          status: 'Ativo',
          lastLogin: '2024-12-01'
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria@email.com',
          role: 'teacher',
          registration: 'T001',
          status: 'Ativo',
          lastLogin: '2024-12-01'
        },
        {
          id: '3',
          name: 'Carlos Oliveira',
          email: 'carlos@email.com',
          role: 'admin',
          registration: 'A001',
          status: 'Ativo',
          lastLogin: '2024-12-01'
        },
        {
          id: '4',
          name: 'Ana Costa',
          email: 'ana@email.com',
          role: 'student',
          registration: '2024002',
          status: 'Ativo',
          lastLogin: '2024-11-30'
        }
      ];
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.registration.includes(searchTerm) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = () => {
    // Lógica para criar novo usuário
    console.log('Criar novo usuário');
  };

  const handleEditUser = (id: string) => {
    // Lógica para editar usuário
    console.log('Editar usuário:', id);
  };

  const handleDeleteUser = (id: string) => {
    // Lógica para deletar usuário
    console.log('Deletar usuário:', id);
  };

  const handleViewUser = (id: string) => {
    // Lógica para visualizar usuário
    console.log('Visualizar usuário:', id);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return 'Aluno';
      case 'teacher': return 'Professor';
      case 'admin': return 'Administrador';
      default: return role;
    }
 };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os usuários do sistema
          </p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar usuários por nome, email, matrícula ou papel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Matrícula:</span>
                    <span className="font-medium">{user.registration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'Ativo' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Último login:</span>
                    <span>{new Date(user.lastLogin).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewUser(user.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-gray-600">Tente ajustar sua busca ou crie um novo usuário.</p>
          </div>
        )}
      </div>
    </div>
  );
}
