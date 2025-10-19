import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SyllabusItem {
  id: string;
  title: string;
  description: string;
  hours?: string;
  subtopics?: SyllabusItem[];
}

interface SubjectSyllabusProps {
  subjectName: string;
  syllabusContent: SyllabusItem[];
  totalHours: string;
}

export default function SubjectSyllabus({ subjectName, syllabusContent, totalHours }: SubjectSyllabusProps) {
  const renderSyllabusItem = (item: SyllabusItem, level: number = 0) => {
    const isMainTopic = level === 0;
    const isSubtopic = level === 1;
    
    return (
      <div key={item.id} className={`${level > 0 ? 'ml-6' : ''}`}>
        <div className={`flex items-start gap-3 ${isMainTopic ? 'mb-4' : isSubtopic ? 'mb-3' : 'mb-2'}`}>
          <div className={`mt-1 w-2 h-2 rounded-full ${isMainTopic ? 'bg-primary' : isSubtopic ? 'bg-secondary' : 'bg-muted'}`}></div>
          <div className="flex-1">
            <h3 className={`font-semibold ${isMainTopic ? 'text-lg' : isSubtopic ? 'text-base' : 'text-sm'} text-foreground`}>
              {item.title}
            </h3>
            {item.description && (
              <p className={`${isMainTopic ? 'text-base' : isSubtopic ? 'text-sm' : 'text-xs'} text-muted-foreground mt-1`}>
                {item.description}
              </p>
            )}
            {item.hours && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {item.hours}
              </Badge>
            )}
          </div>
        </div>
        {item.subtopics && item.subtopics.map(subtopic => 
          renderSyllabusItem(subtopic, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{subjectName}</h1>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center bg-background rounded-lg p-4 w-32 border">
            <p className="font-bold text-xl text-foreground">{totalHours}</p>
            <p className="text-sm text-muted-foreground">Carga Horária</p>
          </div>
        </div>
      </div>

      {/* Syllabus Content */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Ementa da Disciplina</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {syllabusContent.map(item => renderSyllabusItem(item, 0))}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Equipe de Elaboração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              <strong>Coordenador da Educação Profissional:</strong> Rodolfo Sena da Penha
            </p>
            <p className="text-muted-foreground">
              <strong>Célula do Desenvolvimento Curricular:</strong> Maria Alves de Melo
            </p>
            <p className="text-muted-foreground">
              <strong>Coordenador Técnico Pedagógico:</strong> Renanh Gonçalves de Araújo
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Equipe de elaboração composta por professores das EEEP's da região.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
