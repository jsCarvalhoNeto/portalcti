import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FolderGit2, 
  ExternalLink, 
  Github, 
  Sparkles, 
  Code2, 
  Layers
} from 'lucide-react';
import { PortalProjectItem } from '@/types/portal';
import { getPortalProjects } from '@/services/portalSettingsService';

export default function ProjectsSection() {
  const [projects, setProjects] = useState<PortalProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await getPortalProjects(true);
      setProjects(data);
    } catch (err) {
      console.warn('Erro ao carregar projetos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const handleUpdate = () => {
      fetchProjects();
    };

    window.addEventListener('portal-data-updated', handleUpdate);
    return () => {
      window.removeEventListener('portal-data-updated', handleUpdate);
    };
  }, []);

  if (!loading && projects.length === 0) {
    return null;
  }

  return (
    <section id="projects" className="py-20 bg-muted/10 border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vitrine Tecnológica</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Projetos dos Nossos Estudantes
          </h2>
          <p className="text-muted-foreground mt-3 text-base sm:text-lg">
            Conheça soluções reais desenvolvidas pelos alunos do Curso Técnico em Informática durante seus projetos práticos e laboratoriais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <Card
              key={project.id || index}
              className="group hover:shadow-glow transition-all duration-300 bg-card border border-border/60 hover:border-primary/40 flex flex-col justify-between overflow-hidden"
            >
              <CardContent className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="font-medium text-xs bg-muted/50 border-primary/20 text-primary">
                      {project.category}
                    </Badge>
                    {project.is_featured && (
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white gap-1 text-[10px]">
                        <Sparkles className="w-3 h-3" /> Em Destaque
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-border/40">
                  {/* Tecnologias */}
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies?.map((tech, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px] font-normal py-0.5">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  {project.author_name && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-primary" />
                      <span>Desenvolvido por: <strong className="text-foreground">{project.author_name}</strong></span>
                    </div>
                  )}

                  {/* Links de Ação */}
                  <div className="flex items-center gap-2 pt-2">
                    {project.demo_url && (
                      <Button size="sm" className="flex-1 gap-1.5 h-9" asChild>
                        <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver Demonstração
                        </a>
                      </Button>
                    )}
                    {project.repo_url && (
                      <Button size="sm" variant="outline" className="gap-1.5 h-9" asChild>
                        <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                          <Github className="w-3.5 h-3.5" />
                          Código
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
