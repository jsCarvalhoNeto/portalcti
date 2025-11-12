// ===================================================================
// PÁGINA DE CONFIRMAÇÃO - SABERES EM CONEXÃO
// ===================================================================
// Página de confirmação final integrada ao portal principal
// ===================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Users, Lightbulb, Target, Mail, AlertCircle, Loader2 } from "lucide-react";
import api from "@/services/api";
import axios from "axios";

const EventConfirmation = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  console.log('🔄 EventConfirmation render - Estados:', {
    hasStudentData: !!studentData,
    isSubmitting,
    isSubmitted,
    errorMessage
  });

  useEffect(() => {
    console.log('🔧 EventConfirmation - useEffect executado');
    const data = localStorage.getItem("studentData");
    console.log('📦 Dados do localStorage:', data);
    
    if (!data) {
      console.log('❌ Nenhum dado encontrado no localStorage, redirecionando...');
      navigate("/eventos/inscricao");
      return;
    }
    
    try {
      const parsed = JSON.parse(data);
      console.log('✅ Dados parseados:', parsed);
      
      if (!parsed.thematicAxis || !parsed.team) {
        console.log('❌ Dados incompletos:', {
          hasThematicAxis: !!parsed.thematicAxis,
          hasTeam: !!parsed.team
        });
        navigate("/eventos/inscricao");
        return;
      }
      
      console.log('✅ Dados válidos encontrados, definindo studentData');
      setStudentData(parsed);
    } catch (error) {
      console.error('❌ Erro ao parsear dados do localStorage:', error);
      navigate("/eventos/inscricao");
    }
  }, [navigate]);

  const handleConfirmRegistration = async () => {
    console.log('🎯 handleConfirmRegistration chamada!');
    console.log('📋 studentData atual:', studentData);
    
    if (!studentData) {
      console.log('❌ studentData está nulo, saindo...');
      return;
    }

    console.log('🚀 Iniciando processo de inscrição...');
    setIsSubmitting(true);
    setErrorMessage(""); // Limpar erros anteriores

    try {
      const registrationData = {
        student_name: studentData.name,
        student_email: studentData.email,
        axis_id: studentData.thematicAxis.id,
        team_name: studentData.team.teamName,
        project_title: studentData.team.projectTitle,
        project_description: studentData.team.projectDescription,
        team_members: studentData.team.members || []
      };

      console.log('📋 Dados de registro preparados:', registrationData);

      const response = await api.post("/events/register", registrationData);

      console.log('📡 Status da resposta:', response.status, response.statusText);

      const responseData = response.data;
      console.log('📄 Dados da resposta:', responseData);

      if ((response.status === 200 || response.status === 201) && responseData.success) {
        console.log('✅ Inscrição realizada com sucesso!');
        console.log('🔄 Definindo isSubmitted = true...');
        
        // Garantir que o estado seja atualizado corretamente
        setTimeout(() => {
          setIsSubmitted(true);
          localStorage.removeItem("studentData");
          console.log('🎉 Estado atualizado para sucesso!');
        }, 100);
        
      } else {
        console.error('❌ Erro da API:', responseData);
        const errorMsg = responseData.message || 'Erro desconhecido';
        setErrorMessage(errorMsg);
        alert(`Erro ao confirmar inscrição: ${errorMsg}`);
      }
    } catch (error) {
      console.error("❌ Erro ao confirmar inscrição:", error);
      
      // Verificar tipo de erro para dar feedback mais preciso
      let errorMsg = "Erro de conexão. Tente novamente.";
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMsg = "Timeout na conexão. Verifique sua internet e tente novamente.";
        } else if (error.code === 'ERR_NETWORK') {
          errorMsg = "Erro de rede. Verifique sua conexão com a internet.";
        } else if (error.response) {
          errorMsg = error.response.data?.message || `Erro ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          errorMsg = "Sem resposta do servidor. Verifique sua conexão.";
        }
      }
      
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      console.log('🏁 Finalizando processo...');
      setIsSubmitting(false);
    }
  };

  const handleBackToPortal = () => {
    navigate("/");
  };

  if (isSubmitted) {
    console.log('🎊 Renderizando tela de sucesso...');
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 flex items-center justify-center p-4" style={{ marginTop: '80px' }}>
          <div className="w-full max-w-2xl text-center">
            <Card className="p-8 shadow-2xl bg-card/95 backdrop-blur-sm border-0">
              <div className="space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full shadow-lg mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                
                <h1 className="text-3xl font-bold text-green-600">
                  Inscrição Confirmada!
                </h1>
                
                <p className="text-lg text-muted-foreground">
                  Parabéns! Sua inscrição no projeto <strong>Saberes em Conexão</strong> foi confirmada com sucesso.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    Você receberá um email de confirmação em breve com mais detalhes sobre o evento.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Próximos Passos:</h3>
                  <ul className="text-left space-y-2 text-muted-foreground">
                    <li>• Verifique seu email para confirmação</li>
                    <li>• Aguarde comunicações sobre cronograma</li>
                    <li>• Mantenha sua equipe informada</li>
                    <li>• Data do evento: 8 a 12 de dezembro de 2025</li>
                  </ul>
                </div>

                <Button
                  onClick={handleBackToPortal}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Voltar ao Portal
                </Button>
              </div>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4" style={{ marginTop: '80px' }}>
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="text-lg text-muted-foreground mt-4">Carregando dados da inscrição...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Se esta tela persistir, verifique se você completou todas as etapas anteriores.
            </p>
            <Button 
              onClick={() => navigate("/eventos")} 
              variant="outline" 
              className="mt-4"
            >
              Voltar ao Início
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4" style={{ marginTop: '80px' }}>
        <div className="w-full max-w-4xl">
          <Card className="p-8 shadow-2xl bg-card/95 backdrop-blur-sm border-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary mb-2">
                Confirme sua Inscrição
              </h1>
              <p className="text-lg text-muted-foreground">
                Revise todos os dados antes de finalizar sua inscrição no Saberes em Conexão.
              </p>
            </div>

            <div className="space-y-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Dados Pessoais
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p><strong>Nome:</strong> {studentData.name}</p>
                  <p><strong>Email:</strong> {studentData.email}</p>
                </div>
              </div>

              {/* Eixo Temático */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Eixo Temático
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p><strong>Eixo:</strong> {studentData.thematicAxis.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {studentData.thematicAxis.description}
                  </p>
                </div>
              </div>

              {/* Dados da Equipe */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Equipe
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <p><strong>Nome da Equipe:</strong> {studentData.team.teamName}</p>
                  
                  <div>
                    <p className="font-medium">Membros:</p>
                    <ul className="mt-2 space-y-1">
                      <li className="text-sm">
                        <span className="font-medium">{studentData.name}</span> (Líder) - {studentData.email}
                      </li>
                      {studentData.team.members?.map((member: any, index: number) => (
                        <li key={index} className="text-sm">
                          <span className="font-medium">{member.name}</span> - {member.email}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Projeto */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Projeto
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                  <p><strong>Título:</strong> {studentData.team.projectTitle}</p>
                  <div>
                    <p className="font-medium mb-2">Descrição:</p>
                    <p className="text-sm text-muted-foreground bg-background p-3 rounded border">
                      {studentData.team.projectDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações do Evento */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold text-primary mb-2">Informações do Evento</h4>
                <ul className="text-sm space-y-1">
                  <li><strong>Evento:</strong> Saberes em Conexão - Escola, Ciência e Sociedade 2025</li>
                  <li><strong>Local:</strong> EEEP Balbina Viana Arraes</li>
                  <li><strong>Data:</strong> 8 a 12 de dezembro de 2025</li>
                </ul>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{errorMessage}</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/eventos/equipe")}
                  disabled={isSubmitting}
                >
                  Editar Dados
                </Button>

                <Button
                  onClick={() => {
                    console.log('🖱️ Botão Confirmar Inscrição clicado!');
                    handleConfirmRegistration();
                  }}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white min-w-[180px]"
                  size="lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Confirmando...
                    </div>
                  ) : (
                    "Confirmar Inscrição"
                  )}
                </Button>
              </div>

              {/* Overlay de loading para toda a tela quando estiver submitting */}
              {isSubmitting && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold mb-2">Confirmando Inscrição</h3>
                    <p className="text-muted-foreground">
                      Aguarde enquanto processamos sua inscrição...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventConfirmation;