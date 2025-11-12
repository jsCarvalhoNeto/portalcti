import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Users, BookOpen, Home } from "lucide-react";

interface RegistrationData {
  student: { name: string; email: string };
  axis: { title: string; teachers: string[]; technicalAreas: string[] };
  team: string[];
  registeredAt: string;
}

const Confirmation = () => {
  const navigate = useNavigate();
  const [registration, setRegistration] = useState<RegistrationData | null>(null);

  useEffect(() => {
    const data = localStorage.getItem("teamRegistration");
    if (!data) {
      navigate("/");
      return;
    }
    setRegistration(JSON.parse(data));
  }, [navigate]);

  const handleNewRegistration = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!registration) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <Card className="shadow-hover bg-white">
          <CardHeader className="text-center pb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground mb-2">
              Inscrição Confirmada!
            </CardTitle>
            <CardDescription className="text-lg">
              Sua equipe foi registrada com sucesso no projeto
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Student Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Responsável pela Inscrição
              </h3>
              <p className="text-sm text-foreground font-medium">
                {registration.student.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {registration.student.email}
              </p>
            </div>

            {/* Axis Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Eixo Temático Escolhido
              </h3>
              <p className="text-sm text-foreground font-medium mb-3">
                {registration.axis.title}
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Professores Responsáveis:
                  </p>
                  <p className="text-sm text-foreground">
                    {registration.axis.teachers.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Áreas Técnicas:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {registration.axis.technicalAreas.map((area) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Integrantes da Equipe ({registration.team.length})
              </h3>
              <ol className="space-y-2">
                {registration.team.map((member, index) => (
                  <li key={index} className="text-sm text-foreground flex items-start gap-2">
                    <span className="font-medium text-primary min-w-[20px]">
                      {index + 1}.
                    </span>
                    <span>{member}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Event Info */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Informações do Evento
              </h3>
              <ul className="text-sm text-foreground space-y-1">
                <li>📅 Data: 8 a 12 de dezembro de 2025</li>
                <li>⏰ Tempo de apresentação: até 20 minutos</li>
                <li>📄 Resumo expandido: entrega até 19/12/2025</li>
                <li>🎓 Certificado digital será disponibilizado</li>
              </ul>
            </div>

            <Button
              onClick={handleNewRegistration}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4" />
              Realizar Nova Inscrição
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-white/80 mt-6 text-sm">
          EEEP Balbina Viana Arraes • Saberes em Conexão 2025
        </p>
      </div>
    </div>
  );
};

export default Confirmation;
