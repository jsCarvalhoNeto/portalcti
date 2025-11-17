
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BarChart3, ListChecks, Calendar, Star, MoreHorizontal, FileText, Users } from 'lucide-react';
import EventReportsModal from '@/components/EventReportsModal';
import DetailedReportModal from '@/components/DetailedReportModal';
import TeamManagementModal from '@/components/TeamManagementModal';


export default function TeacherReportsTab() {
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showDetailedReportModal, setShowDetailedReportModal] = useState(false);
  const [showTeamManagementModal, setShowTeamManagementModal] = useState(false);

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Relatórios</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="atividades" className="w-full">
          <TabsList className="grid grid-cols-5 gap-2 mb-6">
            <TabsTrigger value="atividades">
              <ListChecks className="w-4 h-4 mr-2" /> Atividades
            </TabsTrigger>
            <TabsTrigger value="eventos">
              <Calendar className="w-4 h-4 mr-2" /> Eventos
            </TabsTrigger>
            <TabsTrigger value="notas">
              <BarChart3 className="w-4 h-4 mr-2" /> Notas
            </TabsTrigger>
            <TabsTrigger value="gamificacao">
              <Star className="w-4 h-4 mr-2" /> Gamificação
            </TabsTrigger>
            <TabsTrigger value="outros">
              <MoreHorizontal className="w-4 h-4 mr-2" /> Outros
            </TabsTrigger>
          </TabsList>
          <TabsContent value="atividades">
            <div className="text-muted-foreground text-center py-12">Selecione um filtro ou gere um relatório de atividades.</div>
          </TabsContent>
          <TabsContent value="eventos">
            <div className="flex flex-col gap-4 max-w-md mx-auto py-8">
              <button
                className="flex items-center w-full px-4 py-3 rounded-md border hover:bg-accent transition"
                onClick={() => setShowReportsModal(true)}
              >
                <BarChart3 className="w-4 h-4 mr-2" /> Relatórios do Evento
              </button>
              <button
                className="flex items-center w-full px-4 py-3 rounded-md border hover:bg-accent transition"
                onClick={() => setShowDetailedReportModal(true)}
              >
                <FileText className="w-4 h-4 mr-2" /> Relatório por Equipe
              </button>
              <button
                className="flex items-center w-full px-4 py-3 rounded-md border hover:bg-accent transition"
                onClick={() => setShowTeamManagementModal(true)}
              >
                <Users className="w-4 h-4 mr-2" /> Gerenciar Equipes
              </button>
            </div>
            <EventReportsModal 
              open={showReportsModal}
              onClose={() => setShowReportsModal(false)}
            />
            <DetailedReportModal 
              open={showDetailedReportModal}
              onClose={() => setShowDetailedReportModal(false)}
            />
            <TeamManagementModal 
              open={showTeamManagementModal}
              onClose={() => setShowTeamManagementModal(false)}
            />
          </TabsContent>
          <TabsContent value="notas">
            <div className="text-muted-foreground text-center py-12">Visualize e exporte relatórios de notas dos alunos.</div>
          </TabsContent>
          <TabsContent value="gamificacao">
            <div className="text-muted-foreground text-center py-12">Relatórios de gamificação e conquistas dos alunos.</div>
          </TabsContent>
          <TabsContent value="outros">
            <div className="text-muted-foreground text-center py-12">Outros relatórios e opções personalizadas.</div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
