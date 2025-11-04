import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Crown, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface TeamMember {
  enrollment_id: number;
  name: string;
  actual_name: string;
  email: string;
  is_leader: boolean;
  grade: number | null;
  auto_applied: boolean;
  status: 'graded' | 'submitted' | 'pending';
  graded_at: string | null;
}

interface Team {
  leader_enrollment_id: number;
  leader: TeamMember;
  team_members: TeamMember[];
  total_members: number;
  graded_members: number;
}

interface ActivityTeamsData {
  activity_id: number;
  activity_name: string;
  activity_type: string;
  teams: Team[];
  total_teams: number;
  total_students: number;
}

interface ActivityTeamsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  activityId: number;
  activityName: string;
}

export default function ActivityTeamsModal({ 
  isOpen, 
  onOpenChange, 
  activityId, 
  activityName 
}: ActivityTeamsModalProps) {
  const [teamsData, setTeamsData] = useState<ActivityTeamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && activityId) {
      fetchTeamsData();
    }
  }, [isOpen, activityId]);

  const fetchTeamsData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/activities/${activityId}/teams`, {
        withCredentials: true
      });
      
      setTeamsData(response.data);
      console.log('📊 Dados das equipes:', response.data);
      
    } catch (error: any) {
      console.error('Erro ao buscar dados das equipes:', error);
      
      if (error.response?.status === 404) {
        toast({
          title: "Atividade não encontrada",
          description: "Esta atividade não existe ou não pertence a você.",
          variant: "destructive",
        });
      } else if (error.response?.data?.message?.includes('não é do tipo equipe')) {
        toast({
          title: "Atividade Individual",
          description: "Esta atividade não é do tipo equipe.",
          variant: "default",
        });
        setTeamsData({
          activity_id: activityId,
          activity_name: activityName,
          activity_type: 'individual',
          teams: [],
          total_teams: 0,
          total_students: 0
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as informações das equipes.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      graded: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Avaliado' },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: Clock, text: 'Enviado' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'Pendente' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getMemberTypeIcon = (member: TeamMember) => {
    if (member.is_leader) {
      return (
        <div title="Líder da Equipe">
          <Crown className="w-4 h-4 text-yellow-600" />
        </div>
      );
    }
    return (
      <div title="Membro da Equipe">
        <User className="w-4 h-4 text-blue-600" />
      </div>
    );
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipes - {activityName}</DialogTitle>
            <DialogDescription>Carregando informações das equipes...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Equipes - {activityName}
          </DialogTitle>
          <DialogDescription>
            {teamsData?.activity_type === 'individual' ? 
              'Esta atividade é do tipo individual - não possui equipes.' :
              `Visualizando ${teamsData?.total_teams || 0} equipes com ${teamsData?.total_students || 0} alunos no total.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {teamsData?.activity_type === 'individual' ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">Atividade Individual</h3>
                  <p className="text-muted-foreground">
                    Esta atividade não é do tipo "Em Equipe". Para ver as submissões individuais, 
                    use o botão "Ver Notas" no painel de atividades.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : teamsData?.teams.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhuma Equipe Formada</h3>
                  <p className="text-muted-foreground">
                    Esta atividade é do tipo "Em Equipe", mas ainda não há equipes formadas.
                    As equipes aparecerão aqui após os alunos fazerem suas submissões.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Estatísticas Gerais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total de Equipes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamsData?.total_teams}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamsData?.total_students}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Equipes Avaliadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {teamsData?.teams.filter(team => team.graded_members > 0).length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de Equipes */}
              <div className="space-y-4">
                {teamsData?.teams.map((team, teamIndex) => (
                  <Card key={team.leader_enrollment_id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Equipe {teamIndex + 1}
                        </span>
                        <Badge variant="outline">
                          {team.total_members} membros
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Líder da Equipe */}
                        <div className="border rounded-lg p-3 bg-yellow-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getMemberTypeIcon(team.leader)}
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {team.leader.actual_name || team.leader.name}
                                  <Badge className="bg-yellow-100 text-yellow-800">Líder</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">{team.leader.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {team.leader.grade !== null && (
                                <Badge variant="outline">Nota: {team.leader.grade}</Badge>
                              )}
                              {getStatusBadge(team.leader.status)}
                            </div>
                          </div>
                        </div>

                        {/* Membros da Equipe */}
                        {team.team_members.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">Membros da Equipe:</h4>
                            {team.team_members.map((member) => (
                              <div key={member.enrollment_id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {getMemberTypeIcon(member)}
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        {member.actual_name || member.name}
                                        {member.auto_applied && (
                                          <Badge className="bg-blue-100 text-blue-800">Auto</Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground">{member.email}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {member.grade !== null && (
                                      <Badge variant="outline">Nota: {member.grade}</Badge>
                                    )}
                                    {getStatusBadge(member.status)}
                                  </div>
                                </div>
                                {member.auto_applied && (
                                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                    🤖 Nota aplicada automaticamente pelo sistema de equipes
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}