import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Check, RotateCcw, Code, Eye, FileText } from 'lucide-react';

export default function HTMLCSSExercise() {
  const [htmlCode, setHtmlCode] = useState('<!DOCTYPE html>\n<html>\n<head>\n    <title>Meu Primeiro Exercício</title>\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            margin: 20px;\n        }\n        .container {\n            max-width: 600px;\n            margin: 0 auto;\n            padding: 20px;\n            border: 1px solid #ddd;\n            border-radius: 8px;\n        }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <h1>Olá, Mundo!</h1>\n        <p>Este é meu primeiro exercício de HTML e CSS.</p>\n    </div>\n</body>\n</html>');
  const [cssCode, setCssCode] = useState('');
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [exerciseNumber, setExerciseNumber] = useState(1);
  const [completed, setCompleted] = useState(false);

  const exercises = [
    {
      number: 1,
      title: 'Estrutura Básica HTML',
      description: 'Crie uma página HTML com estrutura básica, título e um parágrafo.',
      difficulty: 'Fácil'
    },
    {
      number: 2,
      title: 'Estilização CSS',
      description: 'Adicione estilos CSS para alterar cores, fontes e layout.',
      difficulty: 'Médio'
    },
    {
      number: 3,
      title: 'Layout com Flexbox',
      description: 'Crie um layout responsivo usando Flexbox.',
      difficulty: 'Difícil'
    }
  ];

  const currentExercise = exercises.find(ex => ex.number === exerciseNumber) || exercises[0];

  const runCode = () => {
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Preview</title>
        <style>
          ${cssCode}
        </style>
      </head>
      <body>
        ${htmlCode}
      </body>
      </html>
    `;
    setPreview(fullHtml);
    setShowPreview(true);
 };

  const resetCode = () => {
    setHtmlCode('<!DOCTYPE html>\n<html>\n<head>\n    <title>Meu Primeiro Exercício</title>\n    <style>\n        body {\n            font-family: Arial, sans-serif;\n            margin: 20px;\n        }\n        .container {\n            max-width: 600px;\n            margin: 0 auto;\n            padding: 20px;\n            border: 1px solid #ddd;\n            border-radius: 8px;\n        }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <h1>Olá, Mundo!</h1>\n        <p>Este é meu primeiro exercício de HTML e CSS.</p>\n    </div>\n</body>\n</html>');
    setCssCode('');
    setPreview('');
    setShowPreview(false);
  };

  const completeExercise = () => {
    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      if (exerciseNumber < exercises.length) {
        setExerciseNumber(exerciseNumber + 1);
      } else {
        setExerciseNumber(1);
      }
    }, 2000);
 };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exercício de HTML e CSS</h1>
          <p className="text-gray-600 mt-2">Pratique suas habilidades de desenvolvimento web</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Exercícios */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Exercícios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exercises.map((exercise) => (
                    <div
                      key={exercise.number}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        exerciseNumber === exercise.number
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setExerciseNumber(exercise.number)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Exercício {exercise.number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          exercise.difficulty === 'Fácil' 
                            ? 'bg-green-100 text-green-800'
                            : exercise.difficulty === 'Médio'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {exercise.difficulty}
                        </span>
                      </div>
                      <h3 className="font-medium mt-1">{exercise.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editor e Preview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações do Exercício Atual */}
            <Card>
              <CardHeader>
                <CardTitle>Exercício {currentExercise.number}: {currentExercise.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{currentExercise.description}</p>
                <div className="flex gap-2">
                  <Button onClick={runCode} variant="default">
                    <Play className="h-4 w-4 mr-2" />
                    Executar
                  </Button>
                  <Button onClick={resetCode} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetar
                  </Button>
                  <Button onClick={completeExercise} variant="outline" disabled={completed}>
                    <Check className="h-4 w-4 mr-2" />
                    {completed ? 'Concluído!' : 'Concluir'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Editor de HTML */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  HTML Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite seu código HTML aqui..."
                />
              </CardContent>
            </Card>

            {/* Editor de CSS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  CSS Editor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={cssCode}
                  onChange={(e) => setCssCode(e.target.value)}
                  className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite seu CSS aqui..."
                />
              </CardContent>
            </Card>

            {/* Preview */}
            {showPreview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <iframe
                    srcDoc={preview}
                    className="w-full h-96 border border-gray-30 rounded-lg"
                    title="Preview"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {completed && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg text-center max-w-md mx-auto">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Parabéns! 🎉</h2>
              <p className="text-gray-600 mb-4">Você completou o exercício {currentExercise.number}!</p>
              <p className="text-gray-600">
                {exerciseNumber < exercises.length 
                  ? 'Próximo exercício carregando...' 
                  : 'Todos os exercícios completados!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
