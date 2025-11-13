// ===================================================================
// PÁGINA DE FORMAÇÃO DE EQUIPE - SABERES EM CONEXÃO
// ===================================================================
// Página para formação de equipe integrada ao portal principal
// ===================================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ChevronLeft, Users, UserPlus, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const teamSchema = z.object({
  teamName: z.string().optional(),
  projectTitle: z.string().optional(), 
  projectDescription: z.string().optional(),
  memberName: z.string().optional(),
  memberEmail: z.string().optional(),
});

type TeamForm = z.infer<typeof teamSchema>;

const EventTeamForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studentData, setStudentData] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; email: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeamForm>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      teamName: "",
      projectTitle: "",
      projectDescription: "",
      memberName: "",
      memberEmail: "",
    },
  });

  useEffect(() => {
    const data = localStorage.getItem("studentData");
    if (!data) {
      navigate("/eventos/inscricao");
      return;
    }
    const parsed = JSON.parse(data);
    if (!parsed.thematicAxis) {
      navigate("/eventos/eixos-tematicos");
      return;
    }
    setStudentData(parsed);
  }, [navigate]);

  const addMember = () => {
    const memberName = form.getValues("memberName") || "";
    const memberEmail = form.getValues("memberEmail") || "";

    if (memberName.trim() && memberEmail.trim()) {
      if (teamMembers.length < 5) { // Agora permite até 5 membros adicionais + líder = 6 total
        setTeamMembers([...teamMembers, { name: memberName.trim(), email: memberEmail.trim() }]);
        form.setValue("memberName", "");
        form.setValue("memberEmail", "");
        form.clearErrors(["memberName", "memberEmail"]);
      }
    } else {
      if (!memberName.trim()) form.setError("memberName", { message: "Nome é obrigatório" });
      if (!memberEmail.trim()) form.setError("memberEmail", { message: "Email é obrigatório" });
    }
  };

  const removeMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const onSubmit = (data: TeamForm) => {
    console.log('🎯 EventTeamForm - onSubmit chamado');
    console.log('📋 Dados do formulário:', data);
    console.log('👥 Membros da equipe:', teamMembers);
    
    // Validar mínimo de 3 membros (líder + 2 adicionais)
    const totalMembers = teamMembers.length + 1; // +1 para incluir o líder
    if (teamMembers.length < 2) {
      toast({
        variant: "destructive",
        title: "Equipe incompleta",
        description: `Sua equipe precisa ter no mínimo 3 membros (incluindo você como líder). Adicione pelo menos ${2 - teamMembers.length} membro(s) adicional(is).`
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Limpar campos de membro antes de salvar (eles não são necessários na submissão)
    const { memberName, memberEmail, ...teamData } = data;
    
    // Garantir valores padrão para campos opcionais
    const processedTeamData = {
      teamName: teamData.teamName?.trim() || "Equipe sem nome",
      projectTitle: teamData.projectTitle?.trim() || "Projeto sem título",
      projectDescription: teamData.projectDescription?.trim() || "Descrição não fornecida",
    };
    
    const updatedData = {
      ...studentData,
      team: {
        ...processedTeamData,
        members: teamMembers
      }
    };
    
    console.log('💾 Salvando dados no localStorage:', updatedData);
    localStorage.setItem("studentData", JSON.stringify(updatedData));
    
    // Navegar direto para página de confirmação
    console.log('🚀 Navegando para confirmação...');
    navigate("/eventos/confirmacao");
  };

  const handleBack = () => {
    navigate("/eventos/eixos-tematicos");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4" style={{ marginTop: '80px' }}>
        <div className="w-full max-w-4xl">
          <Card className="p-8 shadow-2xl bg-card/95 backdrop-blur-sm border-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-primary mb-2">
                Formação da Equipe
              </h1>
              <p className="text-lg text-muted-foreground">
                Agora vamos formar sua equipe e definir o projeto para o eixo temático:{" "}
                <span className="font-semibold text-foreground">
                  {studentData?.thematicAxis?.name}
                </span>
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="teamName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Nome da Equipe (opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Inovadores do Futuro (opcional)"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Título do Projeto (opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Robótica na Agricultura (opcional)"
                            className="h-12 text-base"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Descrição do Projeto (opcional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva brevemente seu projeto, seus objetivos e como ele se relaciona com o eixo temático escolhido... (opcional)"
                          className="min-h-[100px] text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    Membros da Equipe (mínimo 3, máximo 6 membros incluindo você)
                  </h3>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-medium text-foreground">Líder da Equipe:</p>
                    <p className="text-sm text-muted-foreground">{studentData?.name} ({studentData?.email})</p>
                  </div>

                  {teamMembers.length > 0 && (
                    <div className="space-y-2">
                      {teamMembers.map((member, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeMember(index)}
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {teamMembers.length < 5 && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="memberName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              Nome do Membro
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nome completo"
                                className="h-12 text-base"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="memberEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              Email do Membro
                            </FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  type="email"
                                  placeholder="email@exemplo.com"
                                  className="h-12 text-base"
                                  {...field}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addMember}
                                  className="h-12 px-4"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    {teamMembers.length === 0 && "⚠️ Adicione pelo menos 2 membros (mínimo 3 incluindo você). Máximo: 5 membros adicionais."}
                    {teamMembers.length === 1 && "⚠️ Adicione mais 1 membro para atingir o mínimo de 3. Você pode adicionar até 4 membros adicionais."}
                    {teamMembers.length === 2 && "✅ Mínimo atingido! Você pode adicionar mais 3 membros à sua equipe."}
                    {teamMembers.length === 3 && "✅ Você pode adicionar mais 2 membros à sua equipe."}
                    {teamMembers.length === 4 && "✅ Você pode adicionar mais 1 membro à sua equipe."}
                    {teamMembers.length === 5 && "✅ Sua equipe está completa (máximo de 6 membros)."}
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Voltar
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 min-w-[160px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Finalizando...
                      </div>
                    ) : (
                      "Finalizar Inscrição"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventTeamForm;