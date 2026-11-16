import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Settings, Users } from 'lucide-react';

interface AdminStatItem {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface AdminOverviewTabProps {
  stats: AdminStatItem[];
  setActiveTab: (tab: string) => void;
}

export default function AdminOverviewTab({ stats, setActiveTab }: AdminOverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-glow transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Gerenciar Usuários
            </CardTitle>
            <CardDescription>
              Adicionar, editar e gerenciar estudantes, professores e administradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setActiveTab('users')}>
              Acessar Usuários
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              Disciplinas
            </CardTitle>
            <CardDescription>
              Gerenciar disciplinas, cronogramas e conteúdo acadêmico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setActiveTab('subjects')}>
              Gerenciar Disciplinas
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-glow transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-secondary-foreground" />
              Configurações
            </CardTitle>
            <CardDescription>
              Configurar sistema e preferências gerais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setActiveTab('settings')}>
              Configurações
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>
            Últimas ações administrativas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: '5 novos estudantes cadastrados', time: 'Hoje às 14:30', icon: Users, color: 'text-green-600' },
              { action: 'Disciplina "Desenvolvimento Web" atualizada', time: 'Ontem às 16:45', icon: BookOpen, color: 'text-blue-600' },
              { action: 'Configurações de backup atualizadas', time: '2 dias atrás', icon: Settings, color: 'text-orange-600' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center">
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
