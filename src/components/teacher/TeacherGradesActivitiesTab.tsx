import { useState, useRef, useEffect } from 'react';
import { useTeacherDashboard, Activity } from '@/contexts/TeacherDashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, CheckCircle, Edit3, Edit, Crown, UserCheck } from 'lucide-react';
import NewActivityModal from './NewActivityModal';
import EditActivityModal from './EditActivityModal';
import ActivityGradesModal from './ActivityGradesModal';
import CreateTeamModal from './CreateTeamModal';
import ActivityTeamsModal from './ActivityTeamsModal';

export default function TeacherGradesActivitiesTab() {
  const { activities, loading } = useTeacherDashboard();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isGradesModalOpen, setIsGradesModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [pendingActivity, setPendingActivity] = useState<Activity | null>(null);
  const editModalTimeout = useRef<number | null>(null);
  
  // Estados para modais de equipe
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [selectedActivityForTeams, setSelectedActivityForTeams] = useState<Activity | null>(null);
  
  const activitiesLoading = loading.activities;

  const handleOpenGradesModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsGradesModalOpen(true);
  };

  const handleCreateTeam = (activity: Activity) => {
    setSelectedActivityForTeams(activity);
    setIsCreateTeamModalOpen(true);
  };

  const handleViewTeams = (activity: Activity) => {
    setSelectedActivityForTeams(activity);
    setIsTeamsModalOpen(true);
  };

  const handleTeamCreated = () => {
    // Callback para quando uma equipe for criada - pode recarregar dados se necessário
    console.log('Equipe criada com sucesso!');
  };

  // Controla delay para desmontar o modal de edição, mesmo ao trocar rapidamente de atividade
  const handleEditModalChange = (open: boolean) => {
    setIsEditModalOpen(open);
    if (open) {
      setShowEditModal(true);
      if (editModalTimeout.current) {
        clearTimeout(editModalTimeout.current);
        editModalTimeout.current = null;
      }
      if (pendingActivity) {
        setSelectedActivity(pendingActivity);
        setPendingActivity(null);
      }
    } else {
      editModalTimeout.current = window.setTimeout(() => {
        setShowEditModal(false);
        setSelectedActivity(null);
      }, 300); // tempo típico de animação do Dialog
    }
  };

  // Se usuário clicar em outra atividade enquanto modal está aberto, aguarda fechar antes de trocar
  useEffect(() => {
    if (pendingActivity && !isEditModalOpen && showEditModal) {
      // Modal está fechando, aguarda desmontar para trocar
      return;
    }
    if (pendingActivity && !showEditModal) {
      setSelectedActivity(pendingActivity);
      setShowEditModal(true);
      setIsEditModalOpen(true);
      setPendingActivity(null);
    }
  }, [pendingActivity, isEditModalOpen, showEditModal]);

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
      {selectedActivity && showEditModal && (
        <EditActivityModal 
          isOpen={isEditModalOpen} 
          onOpenChange={handleEditModalChange} 
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
                      
                      {/* Botões de Equipe - aparecem apenas para atividades do tipo 'team' */}
                      {activity.type === 'team' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateTeam(activity)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                          >
                            <Crown className="w-4 h-4" />
                            Nova Equipe
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTeams(activity)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                          >
                            <UserCheck className="w-4 h-4" />
                            Ver Equipes
                          </Button>
                        </>
                      )}

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
                          if (showEditModal) {
                            setPendingActivity(activity);
                            setIsEditModalOpen(false); // fecha o modal atual, depois troca
                          } else {
                            setSelectedActivity(activity);
                            setShowEditModal(true);
                            setIsEditModalOpen(true);
                          }
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

      {/* Modais de Equipe */}
      {selectedActivityForTeams && (
        <>
          <CreateTeamModal
            isOpen={isCreateTeamModalOpen}
            onOpenChange={setIsCreateTeamModalOpen}
            activityId={parseInt(selectedActivityForTeams.id)}
            activityName={selectedActivityForTeams.name}
            onTeamCreated={handleTeamCreated}
          />
          <ActivityTeamsModal
            isOpen={isTeamsModalOpen}
            onOpenChange={setIsTeamsModalOpen}
            activityId={parseInt(selectedActivityForTeams.id)}
            activityName={selectedActivityForTeams.name}
          />
        </>
      )}
    </div>
  );
}
