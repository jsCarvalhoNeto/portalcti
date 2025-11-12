import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Calculator, FileText, Key, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import PollUtility from '@/components/teacher/PollUtility';

const utilities = [
  {
    name: 'Pesquisa Online',
    description: 'Crie pesquisas enquetes para seus alunos com resultados em tempo real.',
    icon: BarChart3,
    color: '#3b82f6'
  },
  {
    name: 'Conversor de Notas',
    description: 'Converta notas entre diferentes escalas de avaliação.',
    icon: Calculator,
    color: '#10b981'
  },
  {
    name: 'Relatórios Personalizados',
    description: 'Gere relatórios detalhados sobre o desempenho dos alunos.',
    icon: FileText,
    color: '#f59e0b'
  },
  {
    name: 'Calculadora de Média',
    description: 'Calcule a média das notas dos alunos de forma rápida e prática.',
    icon: Settings,
    color: '#8b5cf6'
  }
];

export default function TeacherUtilities() {
  const [activeUtility, setActiveUtility] = useState<string | null>(null);
  
   // Função para determinar se a cor é clara ou escura
  const isLightColor = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 255;
    const g = (rgb >> 8) & 255;
    const b = rgb & 255;
    const brightness = (r * 29 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  const handleUtilityClick = (name: string) => {
    if (name === 'Pesquisa Online') {
      setActiveUtility(name);
    } else {
      console.log(`Acessando ${name}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Utilitários</h1>
      
      {activeUtility === 'Pesquisa Online' ? (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Pesquisa Online</h2>
            <Button
              variant="outline"
              onClick={() => setActiveUtility(null)}
            >
              Voltar
            </Button>
          </div>
          <PollUtility />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {utilities.map((utility, index) => {
            const textColor = isLightColor(utility.color) ? '#1f2937' : '#ffffff';
            const Icon = utility.icon;
            
            return (
              <Card 
                key={index} 
                className="hover:shadow-glow transition-all duration-300 border-0 relative overflow-hidden cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${utility.color}CC 0%, ${utility.color}AA 100%)`,
                  color: textColor
                }}
              >
                {/* Barra de cor no topo do card */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: utility.color }}
                />
                
                <CardHeader className="relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle 
                        className="text-lg" 
                        style={{ color: textColor }}
                      >
                        {utility.name}
                      </CardTitle>
                      <CardDescription 
                        style={{ color: `${textColor}B3` }}
                      >
                        Ferramenta do Professor
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="border-white/30 text-white bg-white/20"
                    >
                      Disponível
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="space-y-4">
                    <p 
                      className="text-sm" 
                      style={{ color: `${textColor}CC` }}
                    >
                      {utility.description}
                    </p>
                    
                    {/* Botão de ação seguindo o padrão */}
                    <div className="flex justify-center">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center justify-center gap-2 bg-white/20 border-white/30 hover:bg-white/30 transition-all py-3 px-6"
                        style={{ color: textColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUtilityClick(utility.name);
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">Acessar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
