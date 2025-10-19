import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, BookOpen } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { subjectService } from "@/services/subjectService";
import { Subject } from "@/types/subject";


const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregando disciplinas...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center py-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl mb-12">
            <BookOpen className="w-16 h-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Disciplinas
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore todas as disciplinas disponíveis em nosso curso técnico de informática. 
              Encontre as matérias que melhor se adequam ao seu perfil e objetivos.
            </p>
          </div>

          {/* Subjects Grid */}
          {subjects.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                Nenhuma disciplina encontrada
              </h3>
              <p className="text-muted-foreground">
                As disciplinas serão exibidas aqui assim que forem cadastradas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <Card 
                  key={subject.id} 
                  className="hover:shadow-lg transition-all duration-300 border-border/50 cursor-pointer"
                  onClick={() => navigate(`/disciplinas/${subject.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2 text-foreground">
                          {subject.name}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Professor: {subject.teacher_name}
                        </CardDescription>
                      </div>
                      {subject.semester && (
                        <Badge variant="secondary" className="ml-2">
                          {subject.semester}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {subject.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {subject.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-3 text-sm">
                      {subject.schedule && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{subject.schedule}</span>
                        </div>
                      )}
                      
                      {subject.max_students && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {subject.current_students || 0}/{subject.max_students} vagas
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {subject.max_students && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              ((subject.current_students || 0) / subject.max_students) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Subjects;
