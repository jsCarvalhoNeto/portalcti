import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { thematicAxes } from "@/data/thematicAxes";
import { ArrowRight, Users, GraduationCap } from "lucide-react";

const ThematicAxes = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("studentData");
    if (!data) {
      navigate("/");
      return;
    }
    setStudentData(JSON.parse(data));
  }, [navigate]);

  const handleChooseAxis = (axisId: string) => {
    localStorage.setItem("selectedAxisId", axisId);
    navigate("/formulario-equipe");
  };

  if (!studentData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-3">Eixos Temáticos</h1>
            <p className="text-xl text-white/90 mb-2">
              Olá, <span className="font-semibold">{studentData.name}</span>!
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
          {thematicAxes.map((axis) => (
            <Card
              key={axis.id}
              className="flex flex-col hover:shadow-hover transition-all duration-300 bg-gradient-card border-border/50"
            >
              <CardHeader>
                <CardTitle className="text-xl leading-tight mb-3">
                  {axis.title}
                </CardTitle>
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
                      {axis.teachers.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Áreas Técnicas:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {axis.technicalAreas.map((area) => (
                        <Badge
                          key={area}
                          variant="secondary"
                          className="text-xs bg-secondary/80"
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleChooseAxis(axis.id)}
                  className="w-full bg-gradient-primary hover:shadow-hover transition-all"
                >
                  Escolher este Eixo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThematicAxes;
