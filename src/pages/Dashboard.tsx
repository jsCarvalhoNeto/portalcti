import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Calendar, Trophy, FileText, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { userRole, profile } = useAuth();

  const menuItems = [
    {
      title: 'Minha Conta',
      description: 'Gerencie suas informações pessoais',
      icon: Users,
      path: userRole === 'student' ? '/student' : userRole === 'teacher' ? '/teacher' : '/admin',
      roles: ['student', 'teacher', 'admin']
    },
    {
      title: 'Disciplinas',
      description: 'Acesse suas disciplinas e materiais',
      icon: BookOpen,
      path: '/subjects',
      roles: ['student', 'teacher', 'admin']
    },
    {
      title: 'Calendário',
      description: 'Veja eventos e prazos importantes',
      icon: Calendar,
      path: userRole === 'student' ? '/student' : '/teacher',
      roles: ['student', 'teacher']
    },
    {
      title: 'Conquistas',
      description: 'Visualize suas conquistas e progresso',
      icon: Trophy,
      path: '/achievements',
      roles: ['student', 'teacher']
    },
    {
      title: 'Atividades',
      description: 'Acesse suas atividades e avaliações',
      icon: FileText,
      path: '/activities',
      roles: ['student', 'teacher']
    },
    {
      title: 'Administração',
      description: 'Gerencie usuários e configurações',
      icon: Settings,
      path: '/admin',
      roles: ['admin']
    },
    {
      title: 'Utilitários',
      description: 'Acesse ferramentas úteis para professores',
      icon: Settings,
      path: '/teacher/utilitarios',
      roles: ['teacher']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole || '')
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bem-vindo{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            {userRole === 'student' 
              ? 'Acesse suas disciplinas, atividades e acompanhe seu progresso.' 
              : userRole === 'teacher'
              ? 'Gerencie suas turmas, atividades e acompanhe o desempenho dos alunos.'
              : 'Gerencie o sistema, usuários e configurações do sistema.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link key={index} to={item.path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{item.description}</p>
                    <Button className="mt-4 w-full" variant="outline">
                      Acessar
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {userRole === 'admin' && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Estatísticas do Sistema</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900">Total de Usuários</h3>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900">Disciplinas Ativas</h3>
                <p className="text-2xl font-bold text-green-60">0</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium text-gray-900">Atividades</h3>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
