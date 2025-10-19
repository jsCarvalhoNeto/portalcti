import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Newspaper,
  MapPin,
  Users
} from "lucide-react";

const NewsEventsSection = () => {
  const news = [
    {
      title: "Nova Especialização em Inteligência Artificial",
      excerpt: "O curso técnico agora oferece módulos especializados em IA e Machine Learning para preparar alunos para o futuro.",
      date: "2024-01-15",
      category: "Educação",
      readTime: "3 min"
    },
    {
      title: "Parceria com Empresas de Tecnologia",
      excerpt: "Firmamos novas parcerias que garantem estágios e oportunidades de emprego para nossos estudantes.",
      date: "2024-01-10",
      category: "Oportunidades",
      readTime: "2 min"
    },
    {
      title: "Laboratório de Desenvolvimento Atualizado",
      excerpt: "Novos equipamentos e software de última geração chegaram para melhorar a experiência prática dos alunos.",
      date: "2024-01-05",
      category: "Infraestrutura",
      readTime: "4 min"
    }
  ];

  const events = [
    {
      title: "Workshop: Desenvolvimento Mobile com React Native",
      date: "2024-02-15",
      time: "14:00",
      location: "Lab 3 - Informática",
      attendees: 25,
      type: "Workshop",
      description: "Aprenda a criar aplicativos mobile multiplataforma."
    },
    {
      title: "Hackathon: Soluções para Smart Cities",
      date: "2024-02-20",
      time: "08:00",
      location: "Auditório Principal",
      attendees: 50,
      type: "Competição",
      description: "48 horas de programação intensa para criar soluções inovadoras."
    },
    {
      title: "Palestra: Carreira em Cibersegurança",
      date: "2024-02-25",
      time: "19:00",
      location: "Online",
      attendees: 100,
      type: "Palestra",
      description: "Profissionais da área compartilham experiências e dicas."
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Educação": "bg-blue-100 text-blue-700",
      "Oportunidades": "bg-green-100 text-green-700",
      "Infraestrutura": "bg-purple-100 text-purple-700"
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "Workshop": "bg-orange-100 text-orange-700",
      "Competição": "bg-red-100 text-red-700",
      "Palestra": "bg-blue-100 text-blue-700"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <section id="news" className="py-20 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* News Section */}
          <div className="animate-fade-in">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mr-4">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">Últimas Notícias</h2>
                <p className="text-muted-foreground">Fique por dentro das novidades</p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {news.map((article, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-medium transition-all duration-300 bg-card border-none"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getCategoryColor(article.category)}>
                        {article.category}
                      </Badge>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {article.readTime}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(article.date).toLocaleDateString('pt-BR')}
                      </span>
                      <Button variant="ghost" size="sm" className="group/btn">
                        Ler mais
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button variant="outline" className="w-full">
              Ver Todas as Notícias
            </Button>
          </div>

          {/* Events Section */}
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">Próximos Eventos</h2>
                <p className="text-muted-foreground">Não perca essas oportunidades</p>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              {events.map((event, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-medium transition-all duration-300 bg-card border-none"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        {event.attendees} vagas
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4">
                      {event.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(event.date).toLocaleDateString('pt-BR')} às {event.time}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                    </div>
                    
                    <Button variant="hero" size="sm" className="w-full">
                      Inscrever-se
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button variant="outline" className="w-full">
              Ver Todos os Eventos
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsEventsSection;