import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SimpleColorPicker from '@/components/ui/simple-color-picker';
import AdvancedColorPicker from '@/components/ui/advanced-color-picker';
import ColorPicker from '@/components/ui/color-picker';

const ColorPickerDemo: React.FC = () => {
  const [simpleColor, setSimpleColor] = useState('#3b82f6');
  const [advancedColor, setAdvancedColor] = useState('#ef4444');
  const [basicColor, setBasicColor] = useState('#22c55e');
  const [recentColors, setRecentColors] = useState<string[]>(['#3b82f6', '#ef4444', '#22c55e']);

  const addRecentColor = (color: string) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== color);
      return [color, ...filtered].slice(0, 8);
    });
  };

  const sampleText = "Este é um texto de exemplo para demonstrar as cores!";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demo - Seletores de Cor Melhorados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* SimpleColorPicker Demo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. SimpleColorPicker (Recomendado)</h3>
            <div className="flex items-center gap-4">
              <SimpleColorPicker
                color={simpleColor}
                onChange={setSimpleColor}
                title="Cor simples"
              />
              <div className="flex-1 p-3 border rounded" style={{ color: simpleColor }}>
                {sampleText}
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded">{simpleColor}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              ✅ Melhor para uso geral - Interface limpa, 36 cores rápidas, cor customizada integrada
            </p>
          </div>

          {/* AdvancedColorPicker Demo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. AdvancedColorPicker (Recursos Completos)</h3>
            <div className="flex items-center gap-4">
              <AdvancedColorPicker
                color={advancedColor}
                onChange={(color) => {
                  setAdvancedColor(color);
                  addRecentColor(color);
                }}
                recentColors={recentColors}
                onRecentColorAdd={addRecentColor}
                title="Cor avançada"
                type="text"
              />
              <div className="flex-1 p-3 border rounded" style={{ color: advancedColor }}>
                {sampleText}
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded">{advancedColor}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              ✅ Múltiplas paletas, cores recentes, opacidade, entrada manual HEX/RGB
            </p>
          </div>

          {/* ColorPicker Demo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. ColorPicker (Versão Básica)</h3>
            <div className="flex items-center gap-4">
              <ColorPicker
                color={basicColor}
                onChange={setBasicColor}
              />
              <div className="flex-1 p-3 border rounded" style={{ color: basicColor }}>
                {sampleText}
              </div>
              <code className="text-sm bg-muted px-2 py-1 rounded">{basicColor}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              ✅ Versão minimalista com paleta personalizável
            </p>
          </div>

          {/* Comparação com implementação atual */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">4. Implementação Atual (Problemática)</h3>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                className="w-8 h-8 border rounded cursor-pointer"
                title="Color picker nativo"
              />
              <div className="flex-1 p-3 border rounded bg-muted/50 text-muted-foreground">
                Interface nativa do navegador (inconsistente)
              </div>
              <code className="text-sm bg-destructive/10 text-destructive px-2 py-1 rounded">Problemático</code>
            </div>
            <p className="text-sm text-muted-foreground">
              ❌ Interface inconsistente, experiência ruim, criação dinâmica de DOM
            </p>
          </div>

          {/* Exemplo de uso em toolbar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">5. Exemplo em Toolbar</h3>
            <div className="flex items-center gap-2 p-2 bg-muted border rounded">
              <Button variant="outline" size="sm" className="h-8 w-8 p-1">
                <strong>B</strong>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-1">
                <em>I</em>
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-1">
                <u>U</u>
              </Button>
              
              <div className="w-px h-6 bg-border mx-1" />
              
              <SimpleColorPicker
                color={simpleColor}
                onChange={setSimpleColor}
                title="Cor do texto"
                size="sm"
              />
              <SimpleColorPicker
                color="#fbbf24"
                onChange={() => {}}
                title="Cor de fundo"
                size="sm"
              />
              
              <div className="w-px h-6 bg-border mx-1" />
              
              <Button variant="outline" size="sm" className="h-8 w-8 p-1">
                🔗
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              ✅ Integração perfeita com outras ferramentas da toolbar
            </p>
          </div>

          {/* Vantagens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-600">✅ UX Melhorada</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p>• Interface consistente</p>
                <p>• Preview visual das cores</p>
                <p>• Acesso rápido a cores comuns</p>
                <p>• Feedback visual melhor</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-600">⚡ Performance</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p>• Não cria DOM dinamicamente</p>
                <p>• Menos manipulação direta</p>
                <p>• Rendering otimizado React</p>
                <p>• Memory leaks evitados</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-purple-600">🔧 Manutenibilidade</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p>• Código mais limpo</p>
                <p>• Componentes reutilizáveis</p>
                <p>• Fácil personalização</p>
                <p>• Melhor testabilidade</p>
              </CardContent>
            </Card>
          </div>

          {/* Call to action */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold text-primary mb-2">Recomendação</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Para substituir a implementação atual, use o <strong>SimpleColorPicker</strong>. 
              É fácil de integrar e oferece uma experiência muito melhor para o usuário.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Ver Documentação
              </Button>
              <Button size="sm">
                Implementar Agora
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColorPickerDemo;