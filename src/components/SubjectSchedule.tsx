import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface ScheduleItem {
  id: string;
  lesson: string;
  hasNotes: boolean;
  hasVideo: boolean;
  av1: boolean;
  av2: boolean;
}

interface SubjectScheduleProps {
  subjectName: string;
  scheduleContent: ScheduleItem[];
}

export default function SubjectSchedule({ subjectName, scheduleContent }: SubjectScheduleProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{subjectName}</h1>
        <p className="text-lg text-muted-foreground">Cronograma de Aulas</p>
      </div>

      {/* Schedule Table */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Cronograma de Aulas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Aula</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Notas de Aula</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Vídeo</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Avaliação</th>
                </tr>
              </thead>
              <tbody>
                {scheduleContent.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-accent/50">
                    <td className="py-3 px-4 text-foreground">
                      {item.lesson}
                    </td>
                    <td className="py-3 px-4">
                      {item.hasNotes ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src="/src/assets/note.svg" 
                            alt="Notas de Aula" 
                            className="w-8 h-8 rounded cursor-pointer hover:opacity-80 transition-opacity"
                            title="Notas de Aula"
                          />
                          <span className="text-sm text-muted-foreground">Disponível</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.hasVideo ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src="/src/assets/movie.svg" 
                            alt="Vídeo" 
                            className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
                            title="Vídeo"
                          />
                          <span className="text-sm text-muted-foreground">Disponível</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`${item.id}-av1`}
                            checked={item.av1}
                            disabled
                          />
                          <label 
                            htmlFor={`${item.id}-av1`} 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
                          >
                            AV1
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`${item.id}-av2`}
                            checked={item.av2}
                            disabled
                          />
                          <label 
                            htmlFor={`${item.id}-av2`} 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground"
                          >
                            AV2
                          </label>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <img src="/src/assets/note.svg" alt="Notas de Aula" className="w-6 h-6 rounded" />
              <span className="text-sm text-muted-foreground">Notas de Aula (link futuro)</span>
            </div>
            <div className="flex items-center gap-2">
              <img src="/src/assets/movie.svg" alt="Vídeo" className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Vídeo (link futuro)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border rounded"></div>
              <span className="text-sm text-muted-foreground">Avaliação AV1</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border rounded"></div>
              <span className="text-sm text-muted-foreground">Avaliação AV2</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
