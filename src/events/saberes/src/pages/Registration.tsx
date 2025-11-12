import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

const Registration = () => {
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
    navigate("/eixos-tematicos");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-elegant mb-4">
            <GraduationCap className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Saberes em Conexão
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Escola, Ciência e Sociedade 2025
          </p>
          <p className="text-lg text-white/80 mt-2">
            EEEP Balbina Viana Arraes
          </p>
        </div>

        <Card className="p-8 shadow-hover bg-gradient-card backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Inscrição de Participação
            </h2>
            <p className="text-muted-foreground">
              Preencha seus dados para iniciar o processo de inscrição no projeto.
            </p>
          </div>

          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="border-primary text-primary hover:bg-primary/10"
            >
              Acesso Administrativo
            </Button>
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
                className="w-full h-12 text-base font-semibold bg-gradient-primary hover:shadow-hover transition-all"
                size="lg"
              >
                Continuar para Eixos Temáticos
              </Button>
            </form>
          </Form>
        </Card>

        <p className="text-center text-white/70 mt-6 text-sm">
          Data do evento: 8 a 12 de dezembro de 2025
        </p>
      </div>
    </div>
  );
};

export default Registration;
