import { Button } from "@/components/ui/button";
import { ArrowRight, Play, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Estudantes de informática aprendendo tecnologia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Portal do
              <span className="block bg-gradient-to-r from-accent to-primary-glow bg-clip-text text-transparent">
                Curso Técnico
              </span>
              <span className="block text-3xl md:text-4xl lg:text-5xl">
                em Informática
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Sua jornada para se tornar um profissional de tecnologia começa aqui. 
              Acesse disciplinas, projetos, notícias e muito mais.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <Button variant="gradient" size="lg" className="group">
                <BookOpen className="w-5 h-5 mr-2" />
                Explorar Disciplinas
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button variant="glass" size="lg" className="group">
                <Play className="w-5 h-5 mr-2" />
                Assistir Apresentação
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">12+</div>
                <div className="text-white/80 text-sm">Disciplinas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
                <div className="text-white/80 text-sm">Projetos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">200+</div>
                <div className="text-white/80 text-sm">Alunos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">98%</div>
                <div className="text-white/80 text-sm">Aprovação</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;