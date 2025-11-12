import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { thematicAxes } from "@/data/thematicAxes";
import { CheckCircle2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const teamFormSchema = z.object({
  members: z
    .array(
      z.object({
        name: z
          .string()
          .trim()
          .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
          .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
      })
    )
    .min(3, { message: "A equipe deve ter no mínimo 3 integrantes" })
    .max(6, { message: "A equipe deve ter no máximo 6 integrantes" }),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

const TeamForm = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<{ name: string; email: string } | null>(null);
  const [selectedAxis, setSelectedAxis] = useState<typeof thematicAxes[0] | null>(null);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      members: [{ name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  useEffect(() => {
    const data = localStorage.getItem("studentData");
    const axisId = localStorage.getItem("selectedAxisId");

    if (!data || !axisId) {
      navigate("/");
      return;
    }

    const student = JSON.parse(data);
    setStudentData(student);

    const axis = thematicAxes.find((a) => a.id === axisId);
    if (!axis) {
      navigate("/eixos-tematicos");
      return;
    }
    setSelectedAxis(axis);

    // Pre-fill with student's name
    form.setValue("members.0.name", student.name);
  }, [navigate, form]);

  const onSubmit = async (data: TeamFormData) => {
    if (!studentData || !selectedAxis) return;

    try {
      // Save to database
      const { error } = await supabase.from("registrations").insert({
        student_name: studentData.name,
        student_email: studentData.email,
        axis_id: selectedAxis.id,
        axis_title: selectedAxis.title,
        team_members: data.members.map((m) => m.name),
      });

      if (error) throw error;

      const registration = {
        student: studentData,
        axis: selectedAxis,
        team: data.members.map((m) => m.name),
        registeredAt: new Date().toISOString(),
      };

      // Store registration data for confirmation page
      localStorage.setItem("teamRegistration", JSON.stringify(registration));

      toast.success("Inscrição confirmada com sucesso!", {
        description: `Equipe de ${data.members.length} integrantes registrada.`,
      });

      navigate("/confirmacao");
    } catch (error: any) {
      toast.error("Erro ao salvar inscrição", {
        description: error.message,
      });
    }
  };

  const canAddMember = fields.length < 6;
  const canRemoveMember = fields.length > 3;

  if (!studentData || !selectedAxis) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-hero text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-3">Formação da Equipe</h1>
            <p className="text-xl text-white/90">
              {selectedAxis.title}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-card bg-gradient-card">
            <CardHeader>
              <CardTitle className="text-2xl">Integrantes da Equipe</CardTitle>
              <CardDescription className="text-base">
                Informe de 3 a 6 nomes de alunos. Seu nome já está incluído e conta no limite.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`members.${index}.name`}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel className="text-base">
                              {index === 0
                                ? "Responsável pela Inscrição (Você)"
                                : `Integrante ${index + 1}`}
                            </FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="Nome completo do integrante"
                                  className="h-11"
                                  disabled={index === 0}
                                  {...formField}
                                />
                              </FormControl>
                              {index > 0 && canRemoveMember && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => remove(index)}
                                  className="h-11 w-11 shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  {canAddMember && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => append({ name: "" })}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Integrante ({fields.length}/6)
                    </Button>
                  )}

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      📋 Informações da Equipe
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Total de integrantes: {fields.length}</li>
                      <li>• Mínimo exigido: 3 integrantes</li>
                      <li>• Máximo permitido: 6 integrantes</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-primary hover:shadow-hover transition-all"
                    size="lg"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Confirmar Participação da Equipe
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamForm;
