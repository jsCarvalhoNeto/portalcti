// ===================================================================
// PÁGINA DE EIXOS TEMÁTICOS - SABERES EM CONEXÃO
// ===================================================================
// Página para seleção de eixo temático integrada ao portal principal
// Layout baseado no design original do Saberes - versão simplificada
// ===================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, GraduationCap } from "lucide-react";

interface ThematicAxis {
  id: number;
  name: string;
  description: string;
  title?: string;
  teachers?: string[];
  technicalAreas?: string[];
  color?: string;
  total_registrations?: number;
  max_teams?: number;
  availability_status?: 'available' | 'full' | 'unlimited';
}

const EventThematicAxes = () => {
  const navigate = useNavigate();
  const [axes, setAxes] = useState<ThematicAxis[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("studentData");
    if (!data) {
      navigate("/eventos/inscricao");
      return;
    }
    setStudentData(JSON.parse(data));
  }, [navigate]);

  useEffect(() => {
    const fetchAxes = async () => {
      try {
        const response = await fetch("/api/events/thematic-axes");
        if (response.ok) {
          const result = await response.json();
          console.log('API Response:', result);
          const axesArray = result.success ? result.data : [];
          
          // Transform API data to match the expected format
          const transformedAxes = axesArray.map((axis: any) => ({
            ...axis,
            name: axis.title || axis.name, // Garantir que name seja definido usando title da API
            teachers: axis.teachers ? axis.teachers.split(', ') : [],
            technicalAreas: axis.technical_areas ? axis.technical_areas.split(', ') : []
          }));
          
          setAxes(Array.isArray(transformedAxes) ? transformedAxes : []);
        } else {
          console.error('Failed to fetch axes:', response.status);
          setAxes([]);
        }
      } catch (error) {
        console.error("Erro ao buscar eixos temáticos:", error);
        setAxes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAxes();
  }, []);

  const handleChooseAxis = (axis: ThematicAxis) => {
    const updatedData = {
      ...studentData,
      thematicAxis: axis
    };
    
    localStorage.setItem("studentData", JSON.stringify(updatedData));
    navigate("/eventos/equipe");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4" style={{ marginTop: '80px' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="text-lg text-muted-foreground mt-4">Carregando eixos temáticos...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-white py-12" style={{ marginTop: '80px' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-3">Eixos Temáticos</h1>
            <p className="text-xl text-white/90 mb-2">
              Olá, <span className="font-semibold">{studentData?.name}</span>!
            </p>
            <p className="text-white/80">
              Escolha o eixo temático que melhor se alinha com sua proposta de trabalho
            </p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {axes.map((axis) => (
            <Card
              key={axis.id}
              className="flex flex-col hover:shadow-lg transition-all duration-300 bg-card border hover:border-primary/20"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl leading-tight mb-3 flex-1 mr-2">
                    {axis.title || axis.name}
                  </CardTitle>
                  {axis.max_teams && (
                    <div className="text-right">
                      <Badge 
                        variant={axis.availability_status === 'full' ? 'destructive' : 
                               (axis.total_registrations || 0) >= (axis.max_teams * 0.8) ? 'outline' : 'secondary'}
                        className="text-xs"
                      >
                        {axis.total_registrations || 0}/{axis.max_teams}
                      </Badge>
                      {axis.availability_status === 'full' && (
                        <p className="text-xs text-red-600 mt-1 font-semibold">LOTADO</p>
                      )}
                    </div>
                  )}
                </div>
                <CardDescription className="text-sm line-clamp-3 min-h-[60px]">
                  {axis.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Professores Responsáveis:
                    </p>
                    <p className="text-sm text-foreground">
                      {axis.teachers && axis.teachers.length > 0 ? axis.teachers.join(", ") : "A definir"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Áreas Técnicas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {axis.technicalAreas && axis.technicalAreas.length > 0 ? 
                        axis.technicalAreas.map((area, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-secondary/80"
                          >
                            {area}
                          </Badge>
                        )) : (
                          <Badge variant="secondary" className="text-xs bg-secondary/80">
                            A definir
                          </Badge>
                        )
                      }
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleChooseAxis(axis)}
                  disabled={axis.availability_status === 'full'}
                  className={`w-full transition-all text-white ${
                    axis.availability_status === 'full' 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90'
                  }`}
                >
                  {axis.availability_status === 'full' ? 'Eixo Lotado' : 'Escolher este Eixo'}
                  {axis.availability_status !== 'full' && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {axes.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Nenhum eixo temático disponível no momento.
            </p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default EventThematicAxes;