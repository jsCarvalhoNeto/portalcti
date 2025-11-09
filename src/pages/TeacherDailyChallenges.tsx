import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import TeacherDailyChallengesTab from '@/components/teacher/TeacherDailyChallengesTab';
import { TeacherDashboardProvider } from '@/contexts/TeacherDashboardContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function TeacherDailyChallengesContent() {
  const { user, isTeacher } = useAuth();

  if (!user || !isTeacher) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/teacher" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Painel
              </Link>
            </Button>
          </div>
          
          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Trophy className="w-8 h-8" />
                Gerenciar Desafios Diários
              </CardTitle>
              <p className="text-purple-100">
                Crie desafios HTML, CSS e JavaScript para seus alunos. 
                Desenvolva a criatividade e habilidades práticas através de projetos interativos.
              </p>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <TeacherDailyChallengesTab />
        </div>
      </div>
    </MainLayout>
  );
}

export default function TeacherDailyChallenges() {
  return (
    <TeacherDashboardProvider>
      <TeacherDailyChallengesContent />
    </TeacherDashboardProvider>
  );
}