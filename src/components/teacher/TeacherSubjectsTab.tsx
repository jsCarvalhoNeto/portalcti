import { useTeacherDashboard, Subject } from '@/contexts/TeacherDashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Palette, BookOpen, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubjectColorEditModal from './SubjectColorEditModal';

export default function TeacherSubjectsTab() {
  const { subjects, loading, error, refetch } = useTeacherDashboard();
  const subjectsLoading = loading.subjects;
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showColorEditModal, setShowColorEditModal] = useState(false);
  const [userColors, setUserColors] = useState<Record<number, string>>({});
  
  const navigate = useNavigate();

  useEffect(() => {
    console.log('TeacherSubjectsTab - Dados recebidos:', { subjects, subjectsLoading, error });
    loadUserColors();
  }, [subjects, subjectsLoading, error]);

  // Carregar cores personalizadas do professor
  const loadUserColors = async () => {
    try {
      const response = await fetch('/api/user-colors', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.colors) {
          const colorsMap: Record<number, string> = {};
          data.colors.forEach((item: any) => {
            colorsMap[item.subject_id] = item.color;
          });
          setUserColors(colorsMap);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cores personalizadas:', error);
    }
  };

  // Função para obter cor de uma disciplina (personalizada ou padrão)
  const getSubjectColor = (subject: Subject) => {
    // Se o professor tem cor personalizada, usa ela
    if (userColors[subject.id]) {
      return userColors[subject.id];
    }
    // Senão, usa a cor da disciplina ou padrão
    return subject.color || '#3B82F6';
  };

  const handleViewDetails = (subject: Subject) => {
    setSelectedSubject(subject);
  }

  const handleEditColor = (subject: Subject) => {
    setEditingSubject(subject);
    setShowColorEditModal(true);
  }

  const handleColorEditSuccess = () => {
    refetch.subjects();
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Minhas Disciplinas</h2>
          <p className="text-muted-foreground">Disciplinas que você leciona</p>
        </div>
      </div>

      {error?.subjects && (
        <div className="bg-destructive/10 border-destructive rounded-lg p-4 text-destructive">
          <p className="font-medium">Erro ao carregar disciplinas:</p>
          <p>{error.subjects}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => refetch.subjects()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suas Disciplinas</CardTitle>
          <CardDescription>Gerencie as disciplinas que você leciona</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            // Cor do card - usa cor personalizada ou padrão
            const cardColor = getSubjectColor(subject);
            
            // Determina se a cor é clara ou escura para ajustar o texto
            const isLightColor = (hex: string) => {
              const rgb = parseInt(hex.slice(1), 16);
              const r = (rgb >> 16) & 255;
              const g = (rgb >> 8) & 255;
              const b = rgb & 255;
              const brightness = (r * 299 + g * 587 + b * 114) / 1000;
              return brightness > 128;
            };

            const textColor = isLightColor(cardColor) ? '#1f2937' : '#ffffff';
            
            return (
              <Card 
                key={subject.id} 
                className="hover:shadow-glow transition-all duration-300 border-0 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${cardColor}CC 0%, ${cardColor}AA 100%)`,
                  color: textColor
                }}
              >
                {/* Barra de cor no topo do card */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: cardColor }}
                />
                
                <CardHeader className="relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle 
                        className="text-lg" 
                        style={{ color: textColor }}
                      >
                        {subject.name}
                      </CardTitle>
                      <CardDescription 
                        style={{ color: `${textColor}B3` }}
                      >
                        ID: {subject.id}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="border-white/30 text-white bg-white/20"
                    >
                      Ativo
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    {subject.description && (
                      <p 
                        className="text-sm" 
                        style={{ color: `${textColor}CC` }}
                      >
                        {subject.description}
                      </p>
                    )}
                    
                    {subject.description && (
                      <div 
                        className="text-sm mt-2"
                        style={{ color: `${textColor}B3` }}
                      >
                        ID: {subject.id}
                      </div>
                    )}
                    
                    {/* Botões organizados em grid responsivo para professores */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 bg-white/20 border-white/30 hover:bg-white/30 transition-all py-5"
                        style={{ color: textColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/teacher/subjects/${subject.id}/edit`);
                        }}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="text-sm font-medium">Conteúdo</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 bg-white/20 border-white/30 hover:bg-white/30 transition-all py-5"
                        style={{ color: textColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(subject);
                        }}
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-sm font-medium">Notas</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 bg-white/20 border-white/30 hover:bg-white/30 transition-all py-5"
                        style={{ color: textColor }}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Atividades</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 bg-white/20 border-white/30 hover:bg-white/30 transition-all py-5"
                        style={{ color: textColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditColor(subject);
                        }}
                        title="Editar cor do card"
                      >
                        <Palette className="w-4 h-4" />
                        <span className="text-sm font-medium">Cor</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
            {subjects.length === 0 && !subjectsLoading && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">Nenhuma disciplina encontrada</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => refetch.subjects()}
                >
                  Recarregar Disciplinas
                </Button>
              </div>
            )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para detalhes da disciplina */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedSubject.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSubject(null)}
              >
                Fechar
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">ID:</span> {selectedSubject.id}
              </div>
              {selectedSubject.description && (
                <div>
                  <span className="font-medium">Descrição:</span> {selectedSubject.description}
                </div>
              )}
              {selectedSubject.schedule && (
                <div>
                  <span className="font-medium">Horário:</span> {selectedSubject.schedule}
                </div>
              )}
              {selectedSubject.max_students && (
                <div>
                  <span className="font-medium">Máximo de alunos:</span> {selectedSubject.max_students}
                </div>
              )}
              {selectedSubject.current_students !== undefined && (
                <div>
                  <span className="font-medium">Alunos matriculados:</span> {selectedSubject.current_students}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Cor */}
      <SubjectColorEditModal
        isOpen={showColorEditModal}
        onClose={() => setShowColorEditModal(false)}
        subject={editingSubject}
        onSuccess={handleColorEditSuccess}
      />
    </div>
  );
}
