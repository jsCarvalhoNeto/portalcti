// ===================================================================
// PÁGINA DE INSCRIÇÃO - SABERES EM CONEXÃO
// ===================================================================
// Página principal de inscrição integrada ao portal principal
// ===================================================================

import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GraduationCap, Mail, User } from "lucide-react";

const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  email: z
    .string()
    .trim()
    .email({ message: "Email inválido" })
    .max(255, { message: "Email deve ter no máximo 255 caracteres" }),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

const EventRegistration = () => {
  const navigate = useNavigate();

  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    // Store in localStorage for later use
    localStorage.setItem("studentData", JSON.stringify(data));
    navigate("/eventos/eixos-tematicos");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4" style={{ marginTop: '80px' }}>
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full shadow-lg mb-4">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
              Saberes em Conexão
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Escola, Ciência e Sociedade 2025
            </p>
            <p className="text-lg text-muted-foreground mt-2">
              EEEP Balbina Viana Arraes
            </p>
          </div>

          <Card className="p-8 shadow-2xl bg-card/95 backdrop-blur-sm border-0">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Inscrição de Participação
              </h2>
              <p className="text-muted-foreground">
                Preencha seus dados para iniciar o processo de inscrição no projeto.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        Nome Completo
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            placeholder="Digite seu nome completo"
                            className="pl-10 h-12 text-base"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="seu.email@exemplo.com"
                            className="pl-10 h-12 text-base"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all"
                  size="lg"
                >
                  Continuar para Eixos Temáticos
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Data do evento: 8 a 12 de dezembro de 2025
              </p>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventRegistration;