import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Code2, 
  Gamepad2, 
  Briefcase, 
  Award, 
  Network, 
  Database, 
  Globe, 
  Cpu, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  Zap
} from "lucide-react";

const FeaturesSection = () => {
  const learningPillars = [
    {
      icon: Gamepad2,
      title: "Gamificação & Desafios",
      description: "Ganhe XP resolvendo desafios práticos, suba de nível no ranking dos estudantes e desbloqueie conquistas exclusivas.",
      badge: "Engajamento",
      link: "/student",
      color: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    },
    {
      icon: Code2,
      title: "Laboratórios Online",
      description: "Escreva e teste códigos de HTML, CSS, JavaScript e lógica diretamente pelo navegador, sem necessidade de instalar nada.",
      badge: "100% Prático",
      link: "/disciplinas",
      color: "from-blue-500 to-cyan-600",
      bgLight: "bg-blue-500/10 text-blue-600 dark:text-blue-400"
    },
    {
      icon: Briefcase,
      title: "Perfil Profissional & Portfólio",
      description: "Construa seu currículo técnico em tempo real, exibindo projetos concluídos, habilidades validadas e links para o GitHub.",
      badge: "Carreira",
      link: "/student",
      color: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    },
    {
      icon: BookOpen,
      title: "Ementas & Disciplinas Integradas",
      description: "Acesse conteúdos estruturados, planos de aula, materiais para download e trilhas completas de cada semestre.",
      badge: "Matriz Curricular",
      link: "/disciplinas",
      color: "from-purple-500 to-indigo-600",
      bgLight: "bg-purple-500/10 text-purple-600 dark:text-purple-400"
    },
    {
      icon: Network,
      title: "Projetos Reais & Inovação",
      description: "Desenvolva soluções de software que resolvem problemas reais da comunidade escolar e de empresas parceiras.",
      badge: "Trabalho em Equipe",
      link: "/disciplinas",
      color: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-500/10 text-rose-600 dark:text-rose-400"
    },
    {
      icon: Award,
      title: "Certificações & Habilidades",
      description: "Valide competências técnicas reconhecidas pelo mercado de trabalho e prepare-se com excelência para o estágio.",
      badge: "Empregabilidade",
      link: "/student",
      color: "from-indigo-500 to-blue-600",
      bgLight: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
    }
  ];

  const specializationTracks = [
    {
      title: "Desenvolvimento Web & Frontend",
      icon: Globe,
      desc: "Crie interfaces modernas, responsivas e interativas com foco em experiência do usuário e performance.",
      techs: ["HTML5 / CSS3", "JavaScript ES6+", "React", "Tailwind CSS", "UI/UX Design"],
      accentColor: "border-blue-500/30 hover:border-blue-500/60"
    },
    {
      title: "Backend & Bancos de Dados",
      icon: Database,
      desc: "Modele bancos de dados relacionais e desenvolva APIs REST robustas e seguras para alimentar aplicações.",
      techs: ["Node.js", "Python", "SQL / PostgreSQL", "Modelagem ER", "APIs REST"],
      accentColor: "border-purple-500/30 hover:border-purple-500/60"
    },
    {
      title: "Redes, Infraestrutura & Linux",
      icon: Cpu,
      desc: "Configure servidores, topologias de rede, roteamento, segurança digital e comandos avançados de terminal.",
      techs: ["Redes TCP/IP", "Servidores Linux", "Roteamento & Switches", "Segurança", "Git/GitHub"],
      accentColor: "border-emerald-500/30 hover:border-emerald-500/60"
    },
    {
      title: "Lógica, Algoritmos & Automação",
      icon: Terminal,
      desc: "Desenvolva raciocínio analítico para resolver problemas complexos com código limpo e estruturado.",
      techs: ["Estruturas de Dados", "Algoritmos", "Automação", "Resolução de Problemas", "Clean Code"],
      accentColor: "border-amber-500/30 hover:border-amber-500/60"
    }
  ];

  const techBadges = [
    { name: "JavaScript", category: "Linguagem", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    { name: "TypeScript", category: "Linguagem", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    { name: "React", category: "Frontend", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
    { name: "Python", category: "Backend", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    { name: "Node.js", category: "Backend", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    { name: "PostgreSQL / SQL", category: "Banco de Dados", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
    { name: "Linux", category: "Sistema", color: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
    { name: "Git & GitHub", category: "Controle de Versão", color: "bg-red-500/10 text-red-600 border-red-500/20" },
    { name: "Tailwind CSS", category: "Design", color: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
    { name: "Redes TCP/IP", category: "Infra", color: "bg-teal-500/10 text-teal-600 border-teal-500/20" }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background Tech Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Metodologia Inovadora</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Por que estudar no <span className="text-primary">Técnico em Informática</span>?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Uma formação completa que une fundamentos teóricos sólidos com laboratórios práticos, projetos aplicados e ferramentas modernas adotadas pela indústria de tecnologia.
          </p>
        </div>

        {/* Grid de Pilares de Aprendizado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {learningPillars.map((pillar, index) => (
            <Card 
              key={pillar.title} 
              className="group relative bg-card/80 backdrop-blur-sm border border-border hover:border-primary/40 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 rounded-2xl overflow-hidden"
            >
              {/* Top Gradient Bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${pillar.color}`} />

              <CardContent className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pillar.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <pillar.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${pillar.bgLight}`}>
                    {pillar.badge}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {pillar.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  {pillar.description}
                </p>
                
                <Button variant="ghost" className="p-0 h-auto font-medium text-primary hover:text-primary/80 group/btn text-sm" asChild>
                  <Link to={pillar.link}>
                    Explorar recurso
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trilhas de Especialização */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Trilhas de Especialização
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Conheça as principais áreas do conhecimento abordadas durante os 3 anos do curso técnico.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specializationTracks.map((track) => (
              <div 
                key={track.title}
                className={`p-6 sm:p-8 rounded-2xl bg-card border ${track.accentColor} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <track.icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-foreground">
                      {track.title}
                    </h4>
                  </div>

                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {track.desc}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Competências desenvolvidas:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {track.techs.map((tech) => (
                      <span 
                        key={tech}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted/70 text-foreground text-xs font-medium rounded-lg border border-border"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stack Tecnológica */}
        <div className="rounded-3xl bg-gradient-to-br from-card via-muted/30 to-card border border-border p-8 sm:p-12 text-center shadow-sm">
          <div className="max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Tecnologias & Ferramentas Dominadas
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Aprenda a trabalhar com a mesma stack técnica utilizada pelas maiores empresas e startups do setor.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto mb-10">
            {techBadges.map((badge) => (
              <span 
                key={badge.name}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border ${badge.color} hover:scale-105 transition-transform duration-200 cursor-default shadow-xs`}
              >
                {badge.name}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              variant="gradient" 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md px-8 py-6 font-semibold"
              asChild
            >
              <Link to="/disciplinas">
                <BookOpen className="w-5 h-5 mr-2" />
                Acessar Ementas e Conteúdos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>

            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-xl px-8 py-6 font-medium"
              asChild
            >
              <Link to="/auth">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                Acessar Portal do Aluno
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
