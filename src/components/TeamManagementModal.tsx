// ===================================================================
// GERENCIAMENTO DE EQUIPES - SABERES EM CONEXÃO
// ===================================================================
// Permite adicionar/remover alunos de equipes existentes
// ===================================================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  RefreshCw,
  UserPlus,
  UserMinus,
  Search,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface TeamManagementModalProps {
  open: boolean;
  onClose: () => void;
}

interface Participant {
  name: string;
  email: string;
  role: 'Líder' | 'Membro';
}

interface Team {
  team_id: string;
  team_name: string;
  project_title: string;
  axis_title: string;
  axis_color: string;
  leader: string;
  leader_email: string;
  total_members: number;
  participants: Participant[];
  registered_at: string;
}

interface NewMember {
  name: string;
  email: string;
}

export default function TeamManagementModal({ open, onClose }: TeamManagementModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [newMember, setNewMember] = useState<NewMember>({ name: '', email: '' });
  const { toast } = useToast();

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events/admin/all-teams');
      const data = response.data;
      
      if (data.success) {
        setTeams(data.data);
        setFilteredTeams(data.data);
      } else {
        throw new Error(data.message || 'Erro ao buscar equipes');
      }
    } catch (error: any) {
      console.error('Erro ao buscar equipes:', error);
      
      let errorMessage = 'Falha ao carregar as equipes';
      if (error.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredTeams(teams);
      return;
    }

    const filtered = teams.filter(team => 
      team.team_name.toLowerCase().includes(term.toLowerCase()) ||
      team.project_title.toLowerCase().includes(term.toLowerCase()) ||
      team.leader.toLowerCase().includes(term.toLowerCase()) ||
      team.axis_title.toLowerCase().includes(term.toLowerCase()) ||
      team.participants.some(p => 
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        p.email.toLowerCase().includes(term.toLowerCase())
      )
    );
    setFilteredTeams(filtered);
  };

  const handleAddMember = async (teamId: string) => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha nome e email do novo membro',
        variant: 'destructive'
      });
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMember.email)) {
      toast({
        title: 'Erro',
        description: 'Email inválido',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await api.post(`/events/admin/teams/${teamId}/add-member`, newMember);
      
      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Membro adicionado com sucesso!'
        });
        setNewMember({ name: '', email: '' });
        setEditingTeam(null);
        fetchTeams();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Erro ao adicionar membro:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Falha ao adicionar membro',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (teamId: string, memberEmail: string, memberName: string) => {
    if (!confirm(`Deseja remover ${memberName} da equipe?`)) {
      return;
    }

    try {
      const response = await api.post(`/events/admin/teams/${teamId}/remove-member`, {
        email: memberEmail
      });
      
      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Membro removido com sucesso!'
        });
        fetchTeams();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error('Erro ao remover membro:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Falha ao remover membro',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchTeams();
    }
  }, [open]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6" />
            Gerenciamento de Equipes
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova alunos das equipes cadastradas no evento
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Barra de Busca e Ações */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por equipe, projeto, líder, eixo ou participante..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={fetchTeams} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{teams.length}</div>
                  <p className="text-xs text-muted-foreground">Total de Equipes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {teams.reduce((sum, team) => sum + team.total_members, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total de Estudantes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{filteredTeams.length}</div>
                  <p className="text-xs text-muted-foreground">Equipes Filtradas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {Math.round(teams.reduce((sum, team) => sum + team.total_members, 0) / teams.length) || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Média Membros/Equipe</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Equipes */}
            <div className="space-y-4">
              {filteredTeams.map((team) => (
                <Card key={team.team_id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{team.team_name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{team.project_title}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span 
                            className="text-xs font-medium px-2 py-1 rounded"
                            style={{ backgroundColor: `${team.axis_color}20`, color: team.axis_color }}
                          >
                            {team.axis_title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {team.total_members} membros
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(team.registered_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant={editingTeam === team.team_id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditingTeam(editingTeam === team.team_id ? null : team.team_id)}
                      >
                        {editingTeam === team.team_id ? (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Lista de Participantes */}
                    <div className="space-y-2">
                      {team.participants.map((participant, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {participant.role === 'Líder' ? '👑' : '👤'} {participant.name}
                              </span>
                              {participant.role === 'Líder' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Líder
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{participant.email}</p>
                          </div>
                          {editingTeam === team.team_id && participant.role !== 'Líder' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(team.team_id, participant.email, participant.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              Remover
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Formulário para Adicionar Membro */}
                    {editingTeam === team.team_id && (
                      <div className="mt-4 p-4 border-2 border-dashed rounded-lg bg-blue-50/50">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <UserPlus className="w-4 h-4" />
                          Adicionar Novo Membro
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`name-${team.team_id}`}>Nome Completo</Label>
                            <Input
                              id={`name-${team.team_id}`}
                              placeholder="Digite o nome do aluno"
                              value={newMember.name}
                              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`email-${team.team_id}`}>Email</Label>
                            <Input
                              id={`email-${team.team_id}`}
                              type="email"
                              placeholder="Digite o email do aluno"
                              value={newMember.email}
                              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleAddMember(team.team_id)}
                            className="flex items-center gap-2"
                            disabled={!newMember.name || !newMember.email}
                          >
                            <Save className="w-4 h-4" />
                            Adicionar à Equipe
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setNewMember({ name: '', email: '' });
                              setEditingTeam(null);
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                        {team.total_members >= 6 && (
                          <p className="text-sm text-amber-600 mt-2">
                            ⚠️ Esta equipe já possui o número máximo de membros (6)
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTeams.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-12">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe cadastrada'}
                </p>
                <p className="text-sm">
                  {searchTerm ? 'Tente outro termo de busca' : 'Aguardando inscrições no evento'}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
