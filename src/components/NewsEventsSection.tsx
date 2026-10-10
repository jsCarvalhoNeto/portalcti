import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Newspaper, 
  MapPin, 
  Users,
  CheckCircle2
} from "lucide-react";
import { PortalNewsItem, PortalEventItem } from "@/types/portal";
import { 
  getPortalNews, 
  getMainPortalEvent, 
  DEFAULT_NEWS, 
  DEFAULT_MAIN_EVENT 
} from "@/services/portalSettingsService";
import { Link } from "react-router-dom";

const NewsEventsSection = () => {
  const [news, setNews] = useState<PortalNewsItem[]>(DEFAULT_NEWS);
  const [mainEvent, setMainEvent] = useState<PortalEventItem>(DEFAULT_MAIN_EVENT);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [fetchedNews, fetchedEvent] = await Promise.all([
        getPortalNews(true),
        getMainPortalEvent(),
      ]);
      setNews(fetchedNews);
      setMainEvent(fetchedEvent);
    } catch (err) {
      console.warn("Erro ao buscar notícias ou eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUpdate = () => {
      fetchData();
    };

    window.addEventListener("portal-data-updated", handleUpdate);
    return () => {
      window.removeEventListener("portal-data-updated", handleUpdate);
    };
  }, []);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "Tecnologia": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      "Desenvolvimento": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      "Segurança": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      "Institucional": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      "Eventos": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const formatEventDate = () => {
    if (!mainEvent.start_date) return "Data a ser definida";
    try {
      const start = new Date(mainEvent.start_date).toLocaleDateString('pt-BR');
      if (mainEvent.end_date) {
        const end = new Date(mainEvent.end_date).toLocaleDateString('pt-BR');
        return `${start} a ${end}`;
      }
      return start;
    } catch {
      return mainEvent.start_date;
    }
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
                  key={article.id || index} 
                  className="group hover:shadow-medium transition-all duration-300 bg-card border-none"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={getCategoryColor(article.category)}>
                        {article.category}
                      </Badge>
                      <div className="flex items-center text-muted-foreground text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {article.read_time}
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
                        {article.published_at ? new Date(article.published_at).toLocaleDateString('pt-BR') : ''}
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
              <Card className="group hover:shadow-medium transition-all duration-300 bg-card border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {mainEvent.event_type}
                    </Badge>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Users className="w-4 h-4 mr-1" />
                      Evento principal
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {mainEvent.title}
                  </h3>
                  {mainEvent.subtitle && (
                    <p className="text-sm text-primary font-medium mb-3">
                      {mainEvent.subtitle}
                    </p>
                  )}

                  <p className="text-muted-foreground mb-4">
                    {mainEvent.description}
                  </p>

                  <div className="space-y-2 mb-5">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      {formatEventDate()}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2 text-primary" />
                      {mainEvent.location}
                    </div>
                  </div>

                  {mainEvent.status === 'registration-open' ? (
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" asChild>
                      <Link to={mainEvent.registration_url || '/eventos/inscricao'}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Inscrições Abertas - Participar
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full text-muted-foreground" disabled>
                      {mainEvent.status === 'registration-closed' ? 'Inscrições Encerradas' : 'Em Breve'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/eventos">
                Ver Todos os Eventos
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsEventsSection;
