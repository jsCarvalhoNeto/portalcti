import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Eye, KeyRound, Plus, Trash2 } from 'lucide-react';

interface TeacherItem {
  id: string;
  full_name?: string;
  email: string;
}

interface AdminTeachersTabProps {
  teachers: TeacherItem[];
  loadingTeachers: boolean;
  onOpenTeacherModal: (teacher?: TeacherItem) => void;
  onResetPassword: (user: { id: string; name: string; email?: string; role?: string }) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

export default function AdminTeachersTab({
  teachers,
  loadingTeachers,
  onOpenTeacherModal,
  onResetPassword,
  onDeleteTeacher,
}: AdminTeachersTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Professores</h2>
          <p className="text-muted-foreground">Adicione, edite ou remova professores do sistema</p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => onOpenTeacherModal()}
        >
          <Plus className="w-4 h-4" />
          Novo Professor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Professores</CardTitle>
          <CardDescription>
            Todos os professores cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTeachers ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-52" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {teacher.full_name
                          ? teacher.full_name.split(' ').map((n: string) => n[0]).join('')
                          : (teacher.email ? teacher.email[0].toUpperCase() : 'P')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{teacher.full_name || 'Nome não informado'}</p>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Professor</Badge>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" aria-label="Visualizar professor">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOpenTeacherModal(teacher)}
                        title="Editar professor"
                        aria-label={`Editar ${teacher.full_name || teacher.email}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onResetPassword({
                          id: teacher.id,
                          name: teacher.full_name || 'Professor',
                          email: teacher.email,
                          role: 'Professor',
                        })}
                        title="Resetar senha para balbina123"
                        aria-label={`Resetar senha de ${teacher.full_name || teacher.email}`}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteTeacher(teacher.id)}
                        title="Remover professor"
                        aria-label={`Remover ${teacher.full_name || teacher.email}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {teachers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum professor encontrado
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
