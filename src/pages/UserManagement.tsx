import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, User, Plus, Edit, Trash2, Eye, GraduationCap } from 'lucide-react';
import { getAllUsers, updateUserGrade, updateUserRole, type User as UserType } from '@/services/userService';

export default function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Carregar usuários da API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userData = await getAllUsers();
      setUsers(userData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários."
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const userRole = user.roles[0]?.role || '';
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.student_registration?.includes(searchTerm) ||
      userRole.toLowerCase().includes(searchLower) ||
      user.grade?.toLowerCase().includes(searchLower)
    );
  });

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

  const handleUpdateGrade = async (userId: string, grade: '1º Ano' | '2º Ano' | '3º Ano' | null) => {
    try {
      await updateUserGrade(userId, grade);
      toast({
        title: "Série atualizada",
        description: `Série ${grade ? `atualizada para ${grade}` : 'removida'} com sucesso.`
      });
      
      // Recarregar a lista de usuários
      loadUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar série",
        description: "Não foi possível atualizar a série do usuário."
      });
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      toast({
        title: "Papel atualizado",
        description: `Papel atualizado para ${getRoleLabel(role)} com sucesso.`
      });
      
      // Recarregar a lista de usuários
      loadUsers();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar papel",
        description: "Não foi possível atualizar o papel do usuário."
      });
    }
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

  const getGradeColor = (grade: string | null) => {
    switch (grade) {
      case '1º Ano': return 'bg-emerald-100 text-emerald-800';
      case '2º Ano': return 'bg-amber-100 text-amber-800';
      case '3º Ano': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const isStudent = (roles: Array<{ role: string }>) => {
    return roles.some(r => r.role === 'student');
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
              placeholder="Buscar usuários por nome, email, matrícula, papel ou série..."
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
                      <CardTitle className="text-lg">{user.full_name || 'Nome não informado'}</CardTitle>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${getRoleColor(user.roles[0]?.role || '')}`}>
                        {getRoleLabel(user.roles[0]?.role || '')}
                      </span>
                      {isStudent(user.roles) && user.grade && (
                        <span className={`px-2 py-1 rounded-full text-xs ${getGradeColor(user.grade)}`}>
                          <GraduationCap className="inline w-3 h-3 mr-1" />
                          {user.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {user.student_registration && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Matrícula:</span>
                      <span className="font-medium">{user.student_registration}</span>
                    </div>
                  )}
                  
                  {isStudent(user.roles) && (
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Série:</span>
                      <Select
                        value={user.grade || 'none'}
                        onValueChange={(value) => {
                          const grade = value === 'none' ? null : value as '1º Ano' | '2º Ano' | '3º Ano';
                          handleUpdateGrade(user.id, grade);
                        }}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não definida</SelectItem>
                          <SelectItem value="1º Ano">1º Ano</SelectItem>
                          <SelectItem value="2º Ano">2º Ano</SelectItem>
                          <SelectItem value="3º Ano">3º Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Papel:</span>
                    <Select
                      value={user.roles[0]?.role || ''}
                      onValueChange={(value) => handleUpdateRole(user.id, value)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Aluno</SelectItem>
                        <SelectItem value="teacher">Professor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Cadastrado em:</span>
                    <span>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
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
