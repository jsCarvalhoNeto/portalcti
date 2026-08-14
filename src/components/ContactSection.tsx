import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Send
} from "lucide-react";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Mensagem enviada com sucesso!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        setMessage(data.message || 'Erro ao enviar mensagem. Tente novamente.');
      }
    } catch (error) {
      setMessage('Erro de conexão. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Localização",
      details: [
        "EEEP Balbina Viana Arraes",
        "R. Leonor Rufino, 943 - Sol Nascente",
        "Brejo Santo - CE, CEP: 63260-000"
      ],
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Phone,
      title: "Telefones & WhatsApp",
      details: ["(88) 99849-9645", "Coordenação do Curso", "Atendimento via WhatsApp"],
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Mail,
      title: "E-mails Oficiais",
      details: [
        "professorsantosbva@gmail.com",
        "eeepbalbinaviana@escola.ce.gov.br",
        "informatica.bva@escola.ce.gov.br"
      ],
      color: "from-pink-500 to-red-600"
    },
    {
      icon: Clock,
      title: "Horário de Funcionamento",
      details: [
        "Segunda a Sexta: 07:30 às 17:00",
        "Ensino Médio Integrado (Tempo Integral)",
        "Portal Online: Acesso 24/7"
      ],
      color: "from-red-500 to-orange-600"
    }
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Entre em Contato
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tem dúvidas sobre o Curso Técnico em Informática ou sobre o processo seletivo? Fale com nossa coordenação e equipe pedagógica.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          {/* Contact Form */}
          <div className="animate-fade-in">
            <Card className="bg-gradient-card border-none shadow-medium">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6">
                  Envie sua Mensagem
                </h3>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nome Completo
                      </label>
                      <Input 
                        placeholder="Digite seu nome completo"
                        className="bg-background/50 border-border focus:border-primary"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        E-mail
                      </label>
                      <Input 
                        type="email"
                        placeholder="seu@email.com"
                        className="bg-background/50 border-border focus:border-primary"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Telefone
                    </label>
                    <Input 
                      placeholder="(88) 9 9999-9999"
                      className="bg-background/50 border-border focus:border-primary"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Assunto
                    </label>
                    <Input 
                      placeholder="Qual o motivo do seu contato?"
                      className="bg-background/50 border-border focus:border-primary"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Mensagem
                    </label>
                    <Textarea 
                      placeholder="Descreva sua dúvida ou solicitação..."
                      rows={5}
                      className="bg-background/50 border-border focus:border-primary resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                    />
                  </div>
                  
                  {message && (
                    <div className={`p-4 rounded-lg ${
                      message.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {message}
                    </div>
                  )}
                  
                  <Button 
                    variant="gradient" 
                    size="lg" 
                    className="w-full"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="grid grid-cols-1 gap-6 mb-8">
              {contactInfo.map((info, index) => (
                <Card 
                  key={info.title}
                  className="group hover:shadow-medium transition-all duration-300 bg-card border-none"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <info.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-2">
                          {info.title}
                        </h4>
                        <div className="space-y-1">
                          {info.details.map((detail, idx) => (
                            <p key={idx} className="text-muted-foreground">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Google Maps Real Embed */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-md border border-border h-80 relative">
          <iframe
            title="Localização da EEEP Balbina Viana Arraes"
            className="w-full h-full border-0 filter contrast-105"
            src="https://maps.google.com/maps?q=EEEP%20Balbina%20Viana%20Arraes%20Brejo%20Santo&t=&z=16&ie=UTF8&iwloc=&output=embed"
            loading="lazy"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
