# Atividade Interativa: Formulário de Login HTML & CSS

## Visão Geral
Esta atividade interativa permite aos alunos praticar HTML5 e CSS3 criando um formulário de login estilizado. A atividade segue o padrão estabelecido pelo jogo da memória e se integra ao sistema de gamificação do portal.

## Estrutura da Atividade

### Layout Principal
- **Área de Código (Esquerda)**: Editor com abas para `index.html` e `style.css`
- **Área de Visualização (Direita)**: Preview em tempo real do código
- **Botão "Comparar"**: Mostra a solução esperada lado a lado com o código do aluno

### Funcionalidades

#### Editor de Código
- **Abas HTML/CSS**: Alternância entre os arquivos `index.html` e `style.css`
- **Preview em Tempo Real**: Atualização automática do iframe quando o código muda
- **Syntax Highlighting**: Melhor experiência de codificação

#### Sistema de Avaliação
- **Pontuação Automática**: Avalia o código HTML e CSS separadamente
- **Critérios HTML** (100 pontos):
  - DOCTYPE correto (10 pts)
  - Idioma português (5 pts)
  - Elemento form (15 pts)
  - Container com classe (10 pts)
  - Labels corretos (10 pts)
  - Input email (10 pts)
  - Input password (10 pts)
  - Botão submit (10 pts)
  - Acessibilidade for/id (10 pts)
  - Placeholders (5 pts)
  - Validação required (5 pts)

- **Critérios CSS** (100 pontos):
  - Box-sizing (8 pts)
  - Flexbox (15 pts)
  - Centralização horizontal (10 pts)
  - Centralização vertical (10 pts)
  - Altura viewport (8 pts)
  - Padding correto (8 pts)
  - Bordas arredondadas (5 pts)
  - Sombra (8 pts)
  - Estado focus (10 pts)
  - Estado hover (8 pts)
  - Transições (5 pts)
  - Media queries (5 pts)

#### Gamificação
- **Integração com Sistema de Pontos**: Baseado na pontuação final (0-1000 pontos)
- **Critério de Conclusão**: 80% de acertos para completar
- **Tentativas Ilimitadas**: Permite melhorar progressivamente

#### Modo Comparação
- **Visualização Lado a Lado**: Código do aluno vs. solução esperada
- **Aprendizado Visual**: Facilita identificação de diferenças
- **Solução Completa**: Baseada no conteúdo da Aula 37

## Arquivos da Atividade

### Principais
- `HtmlCssFormActivity.tsx` - Componente principal
- `InteractiveActivities.tsx` - Lista de atividades (atualizada)
- `App.tsx` - Roteamento (atualizada)

### Conteúdo Pedagógico
Baseado na **Aula 37**: "Criando sua Primeira Interface: O Formulário de Login com HTML e CSS"

#### Objetivos de Aprendizagem:
1. **HTML Semântico**: Uso correto de elementos form, label, input
2. **CSS Box Model**: Compreensão de padding, margin, border
3. **Flexbox**: Técnicas de centralização e layout
4. **Acessibilidade**: Associação label/input, validação
5. **Responsividade**: Media queries básicas
6. **Interatividade**: Estados hover e focus

## Como Usar

### Para Alunos
1. Acesse a disciplina de HTML & CSS
2. Vá para "Atividades Interativas"
3. Clique em "Formulário de Login - HTML & CSS"
4. Digite o código nas abas HTML e CSS
5. Use "Avaliar Código" para ver sua pontuação
6. Use "Comparar" para ver a solução esperada
7. Complete com 80% ou mais para finalizar

### Para Professores
- A atividade aparece automaticamente na lista de atividades interativas
- O sistema registra tentativas e pontuações dos alunos
- Integração com relatórios de gamificação

## Tecnologias Utilizadas

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **Lucide Icons** para ícones
- **React Router** para navegação

### Funcionalidades Técnicas
- **Preview em Tempo Real**: Usando iframe com `srcDoc`
- **Avaliação Automática**: Análise de string para critérios específicos
- **Gamificação**: Integração com `gamificationService`
- **Responsividade**: Layout adaptável para diferentes telas

## Possíveis Melhorias Futuras

1. **Editor Avançado**: Integração com Monaco Editor (VS Code)
2. **Autocomplete**: Sugestões de código HTML/CSS
3. **Múltiplas Atividades**: Outras interfaces (navbar, footer, etc.)
4. **Dicas Contextuais**: Ajuda específica por critério
5. **Histórico**: Versões anteriores do código do aluno
6. **Colaboração**: Compartilhar códigos entre alunos

## Estrutura de Arquivos

```
src/
├── pages/
│   ├── html-css/
│   │   └── HtmlCssFormActivity.tsx
│   └── InteractiveActivities.tsx
├── services/
│   └── gamificationService.ts
└── App.tsx
```

## Padrões Seguidos

- **Layout Consistente**: Mesmo padrão do jogo da memória
- **Gamificação Integrada**: Pontuação e progresso
- **Responsividade**: Funciona em desktop e mobile
- **Acessibilidade**: Navegação por teclado e leitores de tela
- **Performance**: Componentes otimizados