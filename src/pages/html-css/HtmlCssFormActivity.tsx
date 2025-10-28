import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import * as gamificationService from '@/services/gamificationService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Play, 
  Eye,
  RefreshCw,
  Code,
  Monitor,
  CheckCircle
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';

interface ProgressState {
  score: number;
  attempts: number;
  completed: boolean;
  startTime: number;
}

const HtmlCssFormActivity = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Estados principais
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [activeTab, setActiveTab] = useState('html');
  const [showComparison, setShowComparison] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    score: 0,
    attempts: 0,
    completed: false,
    startTime: Date.now()
  });

  // Código HTML inicial (template básico)
  const initialHtmlCode = `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login EEEP Balbina</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Seu código aqui -->
    
</body>
</html>`;

  // Código CSS inicial
  const initialCssCode = `/* Seu CSS aqui */
`;

  // Solução esperada - HTML
  const solutionHtml = `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login EEEP Balbina</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="login-container">
        <h1>Acesso ao Sistema</h1>
        <form action="#" method="post" class="login-form">
            <div class="input-group">
                <label for="email">E-mail</label>
                <input type="email" id="email" name="email" placeholder="seu.email@escola.ce.gov.br" required>
            </div>
            
            <div class="input-group">
                <label for="senha">Senha</label>
                <input type="password" id="senha" name="senha" placeholder="********" required>
            </div>
            
            <button type="submit" class="btn-login">Entrar</button>
        </form>
        <p class="esqueci-senha"><a href="#">Esqueci minha senha</a></p>
    </div>
</body>
</html>`;

  // Solução esperada - CSS
  const solutionCss = `* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f4f9;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

.login-container {
    background-color: #ffffff;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
}

h1 {
    color: #007bff;
    margin-bottom: 25px;
    font-size: 1.8em;
}

.input-group {
    margin-bottom: 20px;
    text-align: left;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
}

input[type="email"], 
input[type="password"] {
    width: 100%;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    transition: border-color 0.3s ease;
    font-size: 1em;
}

input:focus {
    border-color: #007bff;
    outline: none;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

.btn-login {
    width: 100%;
    background-color: #007bff;
    color: white;
    padding: 12px;
    border: none;
    border-radius: 6px;
    font-size: 1.1em;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-login:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
}

.esqueci-senha {
    margin-top: 15px;
    font-size: 0.9em;
}

.esqueci-senha a {
    color: #007bff;
    text-decoration: none;
}

.esqueci-senha a:hover {
    text-decoration: underline;
}

@media (max-width: 600px) {
    .login-container {
        padding: 20px;
        box-shadow: none;
        border-radius: 0;
    }
    body {
        align-items: flex-start;
    }
}`;

  // Inicializar código
  useEffect(() => {
    setHtmlCode(initialHtmlCode);
    setCssCode(initialCssCode);
  }, []);

  // Atualizar preview sempre que o código mudar
  useEffect(() => {
    updatePreview();
  }, [htmlCode, cssCode]);

  // Função para atualizar o preview
  const updatePreview = () => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!doc) return;

    // Substitui o link do CSS pelo código inline
    const htmlWithInlineCSS = htmlCode.replace(
      '<link rel="stylesheet" href="style.css">',
      `<style>${cssCode}</style>`
    );

    doc.open();
    doc.write(htmlWithInlineCSS);
    doc.close();
  };

  // Função para avaliar o código do aluno
  const evaluateCode = () => {
    const htmlScore = calculateHtmlScore();
    const cssScore = calculateCssScore();
    const totalScore = Math.round((htmlScore + cssScore) / 2);
    
    const newAttempts = progress.attempts + 1;
    const isCompleted = totalScore >= 80;
    
    setProgress(prev => ({
      ...prev,
      score: totalScore,
      attempts: newAttempts,
      completed: isCompleted
    }));

    // Feedback para o usuário - sempre mostrar resultado da avaliação
    if (isCompleted) {
      toast({
        title: 'Parabéns! 🎉',
        description: `Você completou a atividade com ${totalScore}% de acertos!`,
      });
      
      // Tentar enviar pontuação para gamificação (separadamente)
      handleGamificationSubmit(totalScore);
    } else {
      toast({
        title: 'Continue tentando!',
        description: `Pontuação atual: ${totalScore}%. Você precisa de 80% para completar.`,
        variant: 'default'
      });
      
      // Mesmo não completando, pode tentar enviar pontos proporcionais
      if (totalScore > 50) {
        handleGamificationSubmit(totalScore);
      }
    }
  };

  // Função para calcular pontuação do HTML
  const calculateHtmlScore = () => {
    const requirements = [
      { check: htmlCode.includes('<!DOCTYPE html>'), points: 10, name: 'DOCTYPE' },
      { check: htmlCode.includes('lang="pt-br"'), points: 5, name: 'Idioma' },
      { check: htmlCode.includes('<form'), points: 15, name: 'Elemento form' },
      { check: htmlCode.includes('class="login-container"'), points: 10, name: 'Container' },
      { check: htmlCode.includes('<label'), points: 10, name: 'Labels' },
      { check: htmlCode.includes('type="email"'), points: 10, name: 'Input email' },
      { check: htmlCode.includes('type="password"'), points: 10, name: 'Input password' },
      { check: htmlCode.includes('type="submit"') || htmlCode.includes('<button'), points: 10, name: 'Botão submit' },
      { check: htmlCode.includes('for="') && htmlCode.includes('id="'), points: 10, name: 'Acessibilidade (for/id)' },
      { check: htmlCode.includes('placeholder='), points: 5, name: 'Placeholders' },
      { check: htmlCode.includes('required'), points: 5, name: 'Validação required' }
    ];

    let score = 0;
    requirements.forEach(req => {
      if (req.check) score += req.points;
    });

    return score;
  };

  // Função para calcular pontuação do CSS
  const calculateCssScore = () => {
    const requirements = [
      { check: cssCode.includes('box-sizing: border-box'), points: 8, name: 'Box-sizing' },
      { check: cssCode.includes('display: flex'), points: 15, name: 'Flexbox' },
      { check: cssCode.includes('justify-content: center'), points: 10, name: 'Centralização horizontal' },
      { check: cssCode.includes('align-items: center'), points: 10, name: 'Centralização vertical' },
      { check: cssCode.includes('min-height: 100vh'), points: 8, name: 'Altura total viewport' },
      { check: cssCode.includes('padding:') && cssCode.includes('40px'), points: 8, name: 'Padding container' },
      { check: cssCode.includes('border-radius:'), points: 5, name: 'Bordas arredondadas' },
      { check: cssCode.includes('box-shadow:'), points: 8, name: 'Sombra' },
      { check: cssCode.includes(':focus'), points: 10, name: 'Estado de foco' },
      { check: cssCode.includes(':hover'), points: 8, name: 'Estado hover' },
      { check: cssCode.includes('transition:'), points: 5, name: 'Transições' },
      { check: cssCode.includes('@media'), points: 5, name: 'Responsividade' }
    ];

    let score = 0;
    requirements.forEach(req => {
      if (req.check) score += req.points;
    });

    return score;
  };

  // Função para enviar pontuação para gamificação
  const handleGamificationSubmit = async (score: number) => {
    try {
      if (user && user.id) {
        // Calcular pontos baseado na pontuação (0-1000 pontos, máximo 200)
        const points = Math.min(200, Math.round((score / 100) * 1000));
        
        const res = await gamificationService.awardGame(
          user.id.toString(), 
          points, 
          'html_css_form',
          id ? parseInt(id) : undefined
        );
        
        if (res) {
          const response = res as any;
          if (response.awarded > 0) {
            const executionInfo = response.executionCount ? ` (${response.executionCount}/${response.maxExecutions})` : '';
            setTimeout(() => {
              toast({ 
                title: '💎 Pontos de Gamificação!', 
                description: `+${response.awarded} pontos adicionados ao seu perfil${executionInfo}`,
                variant: 'default'
              });
            }, 1500);
            
            if (response.message) {
              setTimeout(() => {
                toast({ 
                  title: 'ℹ️ Informação', 
                  description: response.message,
                  variant: 'default'
                });
              }, 3000);
            }
          } else {
            // Mensagem mais sutil quando não ganha pontos por limite
            setTimeout(() => {
              toast({ 
                title: 'ℹ️ Limite de pontos de gamificação',
                description: 'Ótimo trabalho! Os pontos de gamificação são limitados a 3 execuções por atividade.',
                variant: 'default'
              });
            }, 1500);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar pontuação:', error);
    }
  };

  // Função para resetar o código
  const resetCode = () => {
    setHtmlCode(initialHtmlCode);
    setCssCode(initialCssCode);
    setShowComparison(false);
    setProgress(prev => ({
      ...prev,
      startTime: Date.now()
    }));
    toast({
      title: 'Código resetado',
      description: 'O código foi restaurado para o estado inicial.',
    });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/disciplinas/${id}/interactive-activities`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              
              <div className="text-center">
                <h1 className="text-xl font-bold text-foreground">Formulário de Login - HTML & CSS</h1>
                <p className="text-sm text-muted-foreground">Aula 37: Criando sua Primeira Interface</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Tentativas</div>
                  <div className="font-semibold">{progress.attempts}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Pontuação</div>
                  <div className="font-semibold">{progress.score}%</div>
                </div>
                {progress.completed && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            
            {/* Área do Editor - Esquerda */}
            <div className="flex flex-col">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-600" />
                    Editor de Código
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      onClick={evaluateCode} 
                      size="sm" 
                      className="flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Avaliar Código
                    </Button>
                    <Button 
                      onClick={() => setShowComparison(!showComparison)} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {showComparison ? 'Ocultar' : 'Comparar'}
                    </Button>
                    <Button 
                      onClick={resetCode} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Resetar
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mx-4">
                      <TabsTrigger value="html">index.html</TabsTrigger>
                      <TabsTrigger value="css">style.css</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="html" className="flex-1 m-0 p-4">
                      <textarea
                        value={htmlCode}
                        onChange={(e) => setHtmlCode(e.target.value)}
                        className="w-full h-full resize-none font-mono text-sm border rounded-md p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite seu código HTML aqui..."
                        spellCheck={false}
                      />
                    </TabsContent>
                    
                    <TabsContent value="css" className="flex-1 m-0 p-4">
                      <textarea
                        value={cssCode}
                        onChange={(e) => setCssCode(e.target.value)}
                        className="w-full h-full resize-none font-mono text-sm border rounded-md p-3 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Digite seu código CSS aqui..."
                        spellCheck={false}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Área de Visualização - Direita */}
            <div className="flex flex-col">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-green-600" />
                    Visualização
                    {showComparison && (
                      <Badge variant="secondary" className="ml-2">Modo Comparação</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 p-4">
                  {showComparison ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
                      {/* Seu código */}
                      <div className="flex flex-col">
                        <h3 className="text-sm font-semibold mb-2 text-blue-600">Seu Código</h3>
                        <div className="flex-1 border rounded">
                          <iframe
                            ref={iframeRef}
                            className="w-full h-full border-0 bg-white"
                            title="Preview do seu código"
                          />
                        </div>
                      </div>
                      
                      {/* Solução esperada */}
                      <div className="flex flex-col">
                        <h3 className="text-sm font-semibold mb-2 text-green-600">Solução Esperada</h3>
                        <div className="flex-1 border rounded">
                          <iframe
                            className="w-full h-full border-0 bg-white"
                            srcDoc={solutionHtml.replace(
                              '<link rel="stylesheet" href="style.css">',
                              `<style>${solutionCss}</style>`
                            )}
                            title="Solução esperada"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full border rounded">
                      <iframe
                        ref={iframeRef}
                        className="w-full h-full border-0 bg-white"
                        title="Preview do código"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Instruções */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Instruções da Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="mb-4">
                  <strong>Objetivo:</strong> Criar um formulário de login estilizado seguindo as melhores práticas de HTML5 e CSS3.
                </p>
                
                <h4 className="font-semibold mb-2">Requisitos HTML:</h4>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                  <li>Estrutura HTML5 completa com DOCTYPE</li>
                  <li>Formulário com elementos semânticos (form, label, input, button)</li>
                  <li>Inputs do tipo email e password</li>
                  <li>Associação correta entre labels e inputs (for/id)</li>
                  <li>Atributos de acessibilidade e validação</li>
                </ul>

                <h4 className="font-semibold mb-2">Requisitos CSS:</h4>
                <ul className="list-disc pl-5 mb-4 space-y-1">
                  <li>Reset CSS com box-sizing: border-box</li>
                  <li>Centralização usando Flexbox</li>
                  <li>Estilização do container com sombra e bordas arredondadas</li>
                  <li>Estados de foco e hover nos elementos interativos</li>
                  <li>Responsividade com media queries</li>
                </ul>

                <p className="text-sm text-muted-foreground">
                  <strong>Dica:</strong> Use o botão "Comparar" para ver a solução esperada lado a lado com seu código.
                  Você precisa de pelo menos 80% de acertos para completar a atividade.
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </MainLayout>
  );
};

export default HtmlCssFormActivity;