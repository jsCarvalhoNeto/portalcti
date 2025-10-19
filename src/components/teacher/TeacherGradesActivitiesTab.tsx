import { useState } from 'react';
import { useTeacherDashboard, Activity } from '@/contexts/TeacherDashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, CheckCircle, Edit3, Edit } from 'lucide-react';
import NewActivityModal from './NewActivityModal';
import EditActivityModal from './EditActivityModal';
import ActivityGradesModal from './ActivityGradesModal';

export default function TeacherGradesActivitiesTab() {
  const { activities, loading } = useTeacherDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const activitiesLoading = loading.activities;

  const handleOpenGradesModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsGradesModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Atividades & Notas</h2>
          <p className="text-muted-foreground">Gerencie atividades e notas dos alunos</p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nova Atividade
        </Button>
      </div>
      <NewActivityModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
      {selectedActivity && (
        <ActivityGradesModal 
          isOpen={isGradesModalOpen} 
          onOpenChange={setIsGradesModalOpen} 
          activityId={parseInt(selectedActivity.id)}
          activityName={selectedActivity.name}
          subjectId={selectedActivity.subject_id}
        />
      )}
      {selectedActivity && (
        <EditActivityModal 
          isOpen={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen} 
          activity={selectedActivity}
        />
      )}

      <Card>
        <CardHeader>
        <CardTitle>Todas as Atividades</CardTitle>
        <CardDescription>Atividades criadas por você</CardDescription>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.name}</p>
                        <p className="text-sm text-muted-foreground">Disciplina: {activity.subject_name}</p>
                        <p className="text-xs text-muted-foreground">Série: {activity.grade}</p>
                        <p className="text-xs text-muted-foreground">Tipo: {activity.type === 'individual' ? 'Individual' : 'Em equipe'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Criada em: {new Date(activity.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="secondary">
                        {activity.type === 'individual' ? 'Individual' : 'Equipe'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setIsGradesModalOpen(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Edit3 className="w-4 h-4" />
                        Notas
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedActivity(activity);
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma atividade pendente</p>
                  <p className="text-sm text-muted-foreground mt-2">Crie novas atividades para seus alunos</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notas Recentes</CardTitle>
          <CardDescription>Últimas notas atribuídas aos alunos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground py-8">Nenhuma nota recente - atribua notas às atividades</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
