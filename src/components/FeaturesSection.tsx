import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Code, 
  Newspaper, 
  Calendar, 
  Users, 
  Award,
  ArrowRight,
  Cpu,
  Database,
  Globe
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Disciplinas",
      description: "Acesse conteúdos, materiais de aula e atividades de todas as matérias do curso técnico.",
      items: ["Programação", "Banco de Dados", "Redes", "Sistemas"],
      color: "from-blue-500 to-purple-600"
    },
    {
      icon: Code,
      title: "Projetos",
      description: "Explore projetos práticos desenvolvidos pelos alunos e colabore em novos desafios.",
      items: ["Web Apps", "Mobile", "Desktop", "IoT"],
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Newspaper,
      title: "Notícias",
      description: "Fique por dentro das últimas novidades do mundo da tecnologia e do curso.",
      items: ["Tech News", "Conquistas", "Oportunidades", "Atualizações"],
      color: "from-pink-500 to-red-600"
    },
    {
      icon: Calendar,
      title: "Eventos",
      description: "Participe de workshops, palestras, hackathons e outras atividades especiais.",
      items: ["Workshops", "Palestras", "Hackathons", "Feiras"],
      color: "from-red-500 to-orange-600"
    },
    {
      icon: Users,
      title: "Comunidade",
      description: "Conecte-se com colegas, professores e profissionais da área de tecnologia.",
      items: ["Fóruns", "Grupos", "Mentoria", "Networking"],
      color: "from-orange-500 to-yellow-600"
    },
    {
      icon: Award,
      title: "Certificações",
      description: "Acompanhe seu progresso e conquiste certificações reconhecidas no mercado.",
      items: ["Certificados", "Skills", "Portfolio", "Conquistas"],
      color: "from-yellow-500 to-green-600"
    }
  ];

  const techStack = [
    { icon: Globe, name: "Web Development", desc: "HTML, CSS, JavaScript, React" },
    { icon: Database, name: "Banco de Dados", desc: "MySQL, PostgreSQL, MongoDB" },
    { icon: Cpu, name: "Programação", desc: "Python, Java, C#, PHP" }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Explore o Portal
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Tudo que você precisa para sua formação em tecnologia está aqui. 
            Descubra todas as funcionalidades disponíveis para alunos e comunidade.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="group hover:shadow-strong transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-none animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {feature.items.map((item) => (
                    <span 
                      key={item}
                      className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                
                <Button variant="ghost" className="group/btn p-0 h-auto" asChild>
                  <Link to="/disciplinas">
                    Explorar
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-8">
            Tecnologias que Você Vai Dominar
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {techStack.map((tech, index) => (
              <div 
                key={tech.name} 
                className="flex flex-col items-center p-6 rounded-2xl bg-card hover:shadow-medium transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mb-4">
                  <tech.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">{tech.name}</h4>
                <p className="text-muted-foreground text-center">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="gradient" size="lg" className="animate-glow-pulse">
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
