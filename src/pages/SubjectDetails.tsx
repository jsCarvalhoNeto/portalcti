import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BookOpen, Users, Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SubjectDetails() {
  const { id } = useParams();
  const { } = useAuth();
  const [subject, setSubject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
    // Simular carregamento de dados da disciplina
    setTimeout(() => {
      setSubject({
        id,
        title: 'Exemplo de Disciplina',
        description: 'Descrição da disciplina de exemplo',
        teacher: 'Professor Exemplo',
        students: 25,
        activities: 8,
        materials: 12
      });
      setLoading(false);
    }, 1000);
 }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{subject?.title}</h1>
          <p className="text-gray-600 mt-2">{subject?.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professor</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subject?.teacher}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subject?.students}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atividades</CardTitle>
              <FileText className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subject?.activities}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="materials">Materiais</TabsTrigger>
            <TabsTrigger value="students">Alunos</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo da Disciplina</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p>Este é um exemplo de conteúdo da disciplina. Aqui serão exibidos os materiais de aula, anotações e recursos de aprendizagem.</p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span>Unidade 1: Introdução ao tema</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <span>Unidade 2: Desenvolvimento do conteúdo</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      <span>Unidade 3: Aplicação prática</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Atividades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Exercício de Fixação 1</h3>
                      <p className="text-sm text-gray-600">Data de entrega: 15/12/2024</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Acessar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">Trabalho Prático</h3>
                      <p className="text-sm text-gray-600">Data de entrega: 20/12/2024</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Acessar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Materiais de Apoio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <FileText className="h-5 w-5 text-red-600" />
                    <span>Apresentação da Aula 1</span>
                    <Button variant="outline" size="sm" className="ml-auto">
                      Baixar
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <FileText className="h-5 w-5 text-red-600" />
                    <span>Guia de Estudos</span>
                    <Button variant="outline" size="sm" className="ml-auto">
                      Baixar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Alunos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {i}
                      </div>
                      <span>Aluno {i}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
