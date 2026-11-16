import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  Palette,
  Search,
  UserCheck,
} from 'lucide-react';

interface StudentSubjectsTabProps {
  filteredSubjects: any[];
  loadingSubjects: boolean;
  subjectSearchQuery: string;
  setSubjectSearchQuery: (query: string) => void;
  getSubjectColor: (subject: any) => string;
  getSubjectIcon: (name: string) => React.ElementType;
  onPersonalizeColor: (subject: any) => void;
  onNavigateToSubject: (subjectId: number | string) => void;
  setActiveTab: (tab: string) => void;
}

export default function StudentSubjectsTab({
  filteredSubjects,
  loadingSubjects,
  subjectSearchQuery,
  setSubjectSearchQuery,
  getSubjectColor,
  getSubjectIcon,
  onPersonalizeColor,
  onNavigateToSubject,
  setActiveTab,
}: StudentSubjectsTabProps) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Minhas Disciplinas</CardTitle>
            <CardDescription>
              Acesse materiais de aula, conteúdos, atividades e acompanhe seu desempenho
            </CardDescription>
          </div>
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar disciplina ou professor..."
              value={subjectSearchQuery}
              onChange={(e) => setSubjectSearchQuery(e.target.value)}
              aria-label="Buscar disciplina ou professor"
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border border-border/70 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loadingSubjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="border border-border/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((subject) => {
              const cardColor = getSubjectColor(subject);
              const SubjectIcon = getSubjectIcon(subject.name);

              return (
                <Card
                  key={subject.id}
                  className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-border/70 bg-card flex flex-col justify-between rounded-xl cursor-pointer"
                  onClick={() => onNavigateToSubject(subject.id)}
                >
                  {/* Linha superior com gradiente dinâmico da disciplina */}
                  <div
                    className="h-1 w-full opacity-70 group-hover:opacity-100 transition-all duration-300"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${cardColor}, transparent)`,
                    }}
                  />

                  <CardHeader className="pb-3 pt-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      {/* Ícone contextualizado com fundo translúcido */}
                      <div
                        className="p-2.5 rounded-xl transition-transform group-hover:scale-110 duration-200"
                        style={{
                          backgroundColor: `${cardColor}18`,
                          color: cardColor,
                        }}
                      >
                        <SubjectIcon className="w-5 h-5" />
                      </div>

                      {/* Ações de topo: Personalizar cor e Badge de Semestre / Status */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPersonalizeColor(subject);
                          }}
                          title="Personalizar cor da disciplina"
                          aria-label={`Personalizar cor de ${subject.name}`}
                        >
                          <Palette className="h-3.5 w-3.5" />
                        </Button>

                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium py-0.5 px-2 flex items-center gap-1.5 transition-colors"
                          style={{
                            backgroundColor: `${cardColor}12`,
                            color: cardColor,
                            borderColor: `${cardColor}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ backgroundColor: cardColor }}
                          />
                          {subject.semester ? `Semestre: ${subject.semester}` : 'Matriculado'}
                        </Badge>
                      </div>
                    </div>

                    {/* Título e Professor */}
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {subject.name}
                    </CardTitle>

                    {subject.teacher_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-primary/80" />
                        <span>Prof. {subject.teacher_name}</span>
                      </div>
                    )}

                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1.5 min-h-[32px]">
                      {subject.description ||
                        'Acesse o plano de aula, materiais complementares, exercícios e avaliações.'}
                    </CardDescription>

                    {/* Metadados rápidos */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                      <span className="bg-muted/70 px-2 py-0.5 rounded font-mono">
                        ID: {subject.id}
                      </span>
                      {subject.schedule && (
                        <span className="flex items-center gap-1 bg-muted/70 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {subject.schedule}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  {/* Botões de Ação na base */}
                  <CardContent className="pt-0 pb-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 gap-1.5 h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToSubject(subject.id);
                        }}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Conteúdo
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs font-medium hover:bg-muted/80 transition-all duration-200 gap-1.5 h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('grades');
                        }}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        Notas
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs font-medium hover:bg-muted border-border/80 transition-all duration-200 gap-1.5 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('activities');
                      }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Ver Atividades da Turma
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            {filteredSubjects.length === 0 && !loadingSubjects && (
              <div className="col-span-full text-center py-10 px-4 bg-muted/20 rounded-xl border border-dashed border-border/80 text-muted-foreground space-y-3">
                <BookOpen className="w-8 h-8 mx-auto opacity-40" />
                <p className="font-medium text-sm">
                  {subjectSearchQuery
                    ? 'Nenhuma disciplina encontrada para esta busca.'
                    : 'Nenhuma disciplina encontrada.'}
                </p>
                {subjectSearchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubjectSearchQuery('')}
                  >
                    Limpar Busca
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
