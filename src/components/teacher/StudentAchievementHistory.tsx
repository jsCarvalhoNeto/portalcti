import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Star, Calendar, Award, TrendingUp, User } from 'lucide-react';
import * as gamificationService from '@/services/gamificationService';

interface StudentAchievementHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
  studentName?: string;
  studentEmail?: string;
}

interface AchievementData {
  total: { total_points: number };
  history: Array<{
    id: string | number;
    source: string;
    points: number;
    reason?: string;
    created_at: string;
    subject_name?: string;
  }>;
  badges: Array<any>;
  unlocked_badges: Array<{
    id: string | number;
    name: string;
    key: string;
    type: string;
    description: string;
    threshold_points: number;
    icon_url?: string;
  }>;
  unlocked_by_subject: Array<{
    subject_id: string | number;
    subject_name: string;
    total_points: number;
    unlocked_badges: Array<any>;
  }>;
  per_subject_totals: Array<{
    subject_id: string | number;
    subject_name: string;
    total_points: number;
  }>;
}

export default function StudentAchievementHistory({
  open,
  onOpenChange,
  studentId,
  studentName,
  studentEmail
}: StudentAchievementHistoryProps) {
  const [data, setData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && studentId) {
      fetchStudentHistory();
    }
  }, [open, studentId]);

  const fetchStudentHistory = async () => {
    if (!studentId) return;
    
    setLoading(true);
    try {
      const result = await gamificationService.getStudentGamification(studentId);
      setData(result);
    } catch (error) {
      console.error('Erro ao carregar histórico do aluno:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'access':
        return <User className="w-4 h-4" />;
      case 'submission':
        return <TrendingUp className="w-4 h-4" />;
      case 'game':
        return <Star className="w-4 h-4" />;
      case 'adjustment':
        return <Award className="w-4 h-4" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  const getSourceDescription = (source: string) => {
    switch (source.toLowerCase()) {
      case 'access':
        return 'Acesso à plataforma';
      case 'submission':
        return 'Envio de atividade';
      case 'game':
        return 'Participação em jogo';
      case 'adjustment':
        return 'Ajuste manual';
      default:
        return source;
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Histórico de Conquistas - {studentName || studentId}
          </DialogTitle>
          {studentEmail && (
            <p className="text-sm text-muted-foreground">{studentEmail}</p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data ? (
          <ScrollArea className="h-[60vh]">
            <div className="space-y-6 p-1">
              {/* Resumo Geral */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="w-5 h-5 text-blue-500" />
                    Resumo Geral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {data.total?.total_points || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Pontos Totais</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-500">
                        {data.unlocked_badges?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Medalhas Conquistadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500">
                        {data.per_subject_totals?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Disciplinas Ativas</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="history">Histórico de Pontos</TabsTrigger>
                  <TabsTrigger value="badges">Medalhas</TabsTrigger>
                  <TabsTrigger value="subjects">Por Disciplina</TabsTrigger>
                </TabsList>

                {/* Histórico de Pontos */}
                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        Histórico de Pontuação
                      </CardTitle>
                      <CardDescription>
                        Últimas {data.history?.length || 0} atividades pontuadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.history && data.history.length > 0 ? (
                        <div className="space-y-3">
                          {data.history.map((entry) => (
                            <div
                              key={entry.id || `${entry.created_at}-${entry.points}`}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                  {getSourceIcon(entry.source)}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {getSourceDescription(entry.source)}
                                    {entry.reason && ` - ${entry.reason}`}
                                  </div>
                                  {entry.subject_name && (
                                    <div className="text-sm text-muted-foreground">
                                      Disciplina: {entry.subject_name}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {formatDate(entry.created_at)}
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant={entry.points >= 0 ? 'default' : 'destructive'}
                                className="font-semibold"
                              >
                                {entry.points >= 0 ? `+${entry.points}` : entry.points} pts
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma atividade pontuada encontrada.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Medalhas */}
                <TabsContent value="badges" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-500" />
                        Medalhas Conquistadas
                      </CardTitle>
                      <CardDescription>
                        {data.unlocked_badges?.length || 0} medalhas desbloqueadas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.unlocked_badges && data.unlocked_badges.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {data.unlocked_badges.map((badge) => (
                            <div
                              key={badge.id}
                              className="flex items-center gap-4 p-4 rounded-lg border bg-card/50"
                            >
                              <div className="flex-shrink-0">
                                {badge.icon_url ? (
                                  <img
                                    src={badge.icon_url}
                                    alt={badge.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <Medal className="w-6 h-6 text-yellow-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm">{badge.name}</div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  {badge.type}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {badge.description}
                                </div>
                                <div className="text-xs text-primary font-medium mt-1">
                                  {badge.threshold_points} pontos necessários
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma medalha conquistada ainda.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Por Disciplina */}
                <TabsContent value="subjects" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Progresso por Disciplina
                      </CardTitle>
                      <CardDescription>
                        Pontuação e medalhas conquistadas em cada disciplina
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.per_subject_totals && data.per_subject_totals.length > 0 ? (
                        <div className="space-y-4">
                          {data.per_subject_totals.map((subject) => {
                            const subjectUnlocked = data.unlocked_by_subject?.find(
                              (s) => s.subject_id === subject.subject_id
                            );
                            
                            return (
                              <div key={subject.subject_id} className="p-4 rounded-lg border bg-card/50">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="font-semibold">{subject.subject_name}</div>
                                    <div className="text-2xl font-bold text-primary">
                                      {subject.total_points} pontos
                                    </div>
                                  </div>
                                  <Badge variant="secondary">
                                    {subjectUnlocked?.unlocked_badges?.length || 0} medalhas
                                  </Badge>
                                </div>
                                
                                {subjectUnlocked?.unlocked_badges && subjectUnlocked.unlocked_badges.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-sm font-medium mb-2">Medalhas nesta disciplina:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {subjectUnlocked.unlocked_badges.map((badge: any) => (
                                        <div
                                          key={badge.id}
                                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20"
                                        >
                                          {badge.icon_url ? (
                                            <img
                                              src={badge.icon_url}
                                              alt={badge.name}
                                              className="w-4 h-4 rounded-full object-cover"
                                            />
                                          ) : (
                                            <Medal className="w-4 h-4 text-yellow-500" />
                                          )}
                                          <span className="text-xs font-medium">{badge.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Nenhuma atividade pontuada em disciplinas específicas.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Erro ao carregar os dados do aluno.
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}