# Painel do Professor

## Estrutura do Projeto

```
src/components/teacher/
├── TeacherDashboardLayout.tsx     # Layout principal do dashboard
├── TeacherOverviewTab.tsx         # Aba de visão geral
├── TeacherSubjectsTab.tsx         # Aba de disciplinas
├── TeacherStudentsTab.tsx         # Aba de alunos
├── TeacherGradesActivitiesTab.tsx  # Aba de notas e atividades
├── TeacherCalendarTab.tsx         # Aba de calendário
├── TeacherSettingsTab.tsx          # Aba de configurações
└── __tests__/
    └── TeacherDashboard.test.tsx  # Testes unitários
```

## Arquitetura

### Contexto Global
O `TeacherDashboardContext` gerencia o estado global do painel do professor, incluindo:
- Dados das disciplinas
- Lista de alunos
- Atividades pendentes
- Eventos do calendário
- Perfil do usuário
- Estados de loading e erro

### Componentes Principais

#### TeacherDashboardLayout
Componente de layout que fornece:
- Cabeçalho com informações do usuário
- Navegação por abas
- Estatísticas gerais
- Ações rápidas
- Atividades recentes

#### TeacherSubjectsTab
Exibe as disciplinas do professor com:
- Grid de cards para cada disciplina
- Informações básicas da disciplina
- Ações rápidas (conteúdo, notas, atividades)
- Modal para gerenciamento detalhado

#### TeacherStudentsTab
Mostra os alunos matriculados:
- Lista de alunos por disciplina
- Informações de contato
- Status de matrícula
- Ações de comunicação

#### TeacherGradesActivitiesTab
Gerencia notas e atividades:
- Lista de atividades pendentes
- Status de correção
- Estatísticas de progresso
- Interface para lançamento de notas

#### TeacherCalendarTab
Calendário acadêmico:
- Eventos próximos
- Horário de aulas
- Tipos de eventos (aula, prova, prazo, reunião)
- Integração com o calendário institucional

#### TeacherSettingsTab
Configurações do perfil:
- Edição de informações pessoais
- Alteração de senha
- Preferências de notificação
- Configurações de privacidade

## Funcionalidades Implementadas

### 1. Visão Geral
- Dashboard com métricas principais
- Cartões de estatísticas
- Ações rápidas
- Feed de atividades recentes

### 2. Minhas Disciplinas
- Visualização em grade das disciplinas
- Detalhes de cada disciplina
- Acesso rápido ao conteúdo
- Gerenciamento de materiais

### 3. Meus Alunos
- Lista de alunos matriculados
- Informações de contato
- Histórico acadêmico
- Comunicação direta

### 4. Atividades & Notas
- Lançamento de atividades
- Correção de trabalhos
- Gestão de notas
- Relatórios de desempenho

### 5. Calendário
- Eventos acadêmicos
- Horário de aulas
- Lembretes de prazos
- Sincronização com calendário externo

### 6. Configurações
- Perfil do professor
- Segurança da conta
- Preferências do sistema
- Notificações

## Integrações

### API Services
- `teacherDashboardService.ts` - Serviços específicos do painel
- `teacherService.ts` - Serviços gerais do professor
- `authService.ts` - Autenticação e autorização
- `userService.ts` - Gerenciamento de usuários

### Hooks Customizados
- `useTeacherData()` - Hook para dados das disciplinas
- `useAuth()` - Hook de autenticação
- `useTeacherDashboard()` - Hook do contexto global

## Estado da Implementação

✅ **Completo**: Componentes básicos e estrutura principal
✅ **Funcional**: Navegação entre abas e exibição de dados
✅ **Integrado**: Conexão com serviços da API
✅ **Responsivo**: Layout adaptável para diferentes dispositivos
⏳ **Em Desenvolvimento**: Funcionalidades avançadas e refinamentos
⏳ **Testes**: Cobertura de testes unitários e integração

## Próximos Passos

1. **Funcionalidades Avançadas**
   - Sistema de mensagens entre professor e alunos
   - Relatórios analíticos de desempenho
   - Integração com sistemas externos
   - Recursos colaborativos

2. **Melhorias de UX**
   - Animações e transições suaves
   - Personalização do dashboard
   - Widgets configuráveis
   - Temas e aparência

3. **Performance**
   - Otimização de carregamento
   - Cache inteligente de dados
   - Lazy loading de componentes
   - Redução de requisições

4. **Segurança**
   - Auditoria de acessos
   - Proteção contra ataques
   - Logs de atividades
   - Compliance regulatório

## Como Usar

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Testes
```bash
npm run test
```

## Contribuição

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

MIT
