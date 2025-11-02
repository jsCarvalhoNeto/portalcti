import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  Code2, 
  Eye,
  Copy,
  CheckCircle 
} from 'lucide-react';
import { markdownToHtml } from '@/utils/markdownUtils';

interface MarkdownHelpButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const markdownExamples = [
  {
    title: 'Cabeçalhos',
    markdown: `# Cabeçalho Principal (H1)
## Cabeçalho Secundário (H2)  
### Cabeçalho Terciário (H3)
#### Cabeçalho Quaternário (H4)`,
    description: 'Use # para diferentes níveis de títulos'
  },
  {
    title: 'Formatação de Texto',
    markdown: `**Texto em negrito**
*Texto em itálico*
***Texto em negrito e itálico***
~~Texto tachado~~
\`código inline\``,
    description: 'Formate o texto com asteriscos, underline e crases'
  },
  {
    title: 'Listas',
    markdown: `Lista não ordenada:
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
- Item 3

Lista ordenada:
1. Primeiro item
2. Segundo item
3. Terceiro item`,
    description: 'Use - ou * para listas não ordenadas, números para ordenadas'
  },
  {
    title: 'Links e Imagens',
    markdown: `[Texto do link](https://exemplo.com)
[Link com título](https://exemplo.com "Título do link")

![Texto alternativo da imagem](https://via.placeholder.com/300x200)
![Imagem com título](https://via.placeholder.com/400x250 "Título da imagem")`,
    description: 'Use [] para o texto e () para a URL'
  },
  {
    title: 'Citações',
    markdown: `> Esta é uma citação simples.
> 
> Esta é uma citação em múltiplas linhas.
> Pode conter **formatação** também.

> ### Citação com título
> Esta citação tem um cabeçalho dentro.`,
    description: 'Use > no início da linha para citações'
  },
  {
    title: 'Código',
    markdown: `Código inline: \`console.log('Hello World')\`

Bloco de código:
\`\`\`javascript
function saudacao(nome) {
    console.log(\`Olá, \${nome}!\`);
}

saudacao('Professor');
\`\`\`

Código simples sem sintaxe:
\`\`\`
Este é um bloco de código simples
sem highlight de sintaxe.
\`\`\``,
    description: 'Use crases (`) para código inline e triplas (```) para blocos'
  },
  {
    title: 'Tabelas',
    markdown: `| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Célula 1 | Célula 2 | Célula 3 |
| Dados A  | Dados B  | Dados C  |

Alinhamento nas tabelas:
| Esquerda | Centro | Direita |
|:---------|:------:|--------:|
| Alinha   | No     | Nas     |
| À        | Centro | Direita |`,
    description: 'Use | para separar colunas e --- para o cabeçalho'
  },
  {
    title: 'Linha Horizontal',
    markdown: `Texto antes da linha.

---

Texto depois da linha.

Ou use asteriscos:

***

Ou underlines:

___`,
    description: 'Use --- (ou *** ou ___) para criar separadores'
  }
];

export default function MarkdownHelpButton({ 
  variant = 'outline', 
  size = 'sm',
  className = '' 
}: MarkdownHelpButtonProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeExample, setActiveExample] = useState(0);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar para clipboard:', err);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={`flex items-center gap-2 ${className}`}>
          <HelpCircle className="w-4 h-4" />
          Guia Markdown
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Guia de Markdown
          </DialogTitle>
          <DialogDescription>
            Aprenda a usar Markdown para formatar seu conteúdo de forma rápida e eficiente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeExample.toString()} onValueChange={(value) => setActiveExample(parseInt(value))}>
            {/* Lista de exemplos */}
            <TabsList className="grid grid-cols-4 h-auto p-1 mb-4">
              {markdownExamples.slice(0, 4).map((example, index) => (
                <TabsTrigger 
                  key={index}
                  value={index.toString()}
                  className="text-xs p-2 h-auto flex flex-col gap-1"
                >
                  {example.title}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsList className="grid grid-cols-4 h-auto p-1 mb-4">
              {markdownExamples.slice(4, 8).map((example, index) => (
                <TabsTrigger 
                  key={index + 4}
                  value={(index + 4).toString()}
                  className="text-xs p-2 h-auto flex flex-col gap-1"
                >
                  {example.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Conteúdo dos exemplos */}
            <div className="overflow-y-auto max-h-[50vh]">
              {markdownExamples.map((example, index) => (
                <TabsContent key={index} value={index.toString()} className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{example.title}</h3>
                        <p className="text-sm text-muted-foreground">{example.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(example.markdown, index)}
                        className="flex items-center gap-1"
                      >
                        {copiedIndex === index ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Código Markdown */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Code2 className="w-4 h-4" />
                          <Badge variant="outline">Markdown</Badge>
                        </div>
                        <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto font-mono border">
                          <code>{example.markdown}</code>
                        </pre>
                      </div>

                      {/* Resultado */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-4 h-4" />
                          <Badge variant="secondary">Resultado</Badge>
                        </div>
                        <div 
                          className="bg-background p-3 rounded-md border prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: markdownToHtml(example.markdown) 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>💡 Dica:</strong> Você pode colar texto markdown diretamente no editor visual e ele será convertido automaticamente!</p>
            <p><strong>⌨️ Atalhos:</strong> Ctrl+B (negrito), Ctrl+I (itálico), Ctrl+U (sublinhado)</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}