# Análise da Funcionalidade de Atividades & Notas

## Visão Geral
A aba "Atividades & Notas" no painel do professor apresenta uma lacuna significativa na funcionalidade de gerenciamento de notas para atividades específicas.

## Funcionalidades Atuais
1. **Criação de Atividades**: Funcionalidade completa ✓
   - Modal de criação de atividades
   - Validação de campos
   - Integração com API
   - Exibição das atividades criadas

2. **Exibição de Atividades**: Funcionalidade completa ✓
   - Listagem das atividades criadas
   - Informações básicas (nome, disciplina, série, tipo)

## Falhas Identificadas

### 1. Falta de Conexão entre Atividades e Notas
**Problema**: A tabela `activities` não está conectada à tabela `grades` no banco de dados.

**Impacto**: Não é possível atribuir notas específicas para atividades individuais.

**Solução Necessária**: 
- Criar uma tabela intermediária `activity_grades` ou adicionar um campo `activity_id` à tabela `grades`
- Estrutura sugerida:
```sql
CREATE TABLE `activity_grades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `activity_id` INT NOT NULL,
  `enrollment_id` INT NOT NULL,
  `grade` DECIMAL(5, 2) NOT NULL,
  `graded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_activity_student` (`activity_id`, `enrollment_id`)
);
```

### 2. Interface de Atribuição de Notas
**Problema**: A aba mostra "Nenhuma nota recente" e não há funcionalidade para atribuir notas às atividades.

**Impacto**: Professores não podem gerenciar notas de forma granular por atividade.

**Solução Necessária**:
- Criar componente para visualizar alunos inscritos em uma atividade
- Adicionar campos para inserção de notas por aluno
- Implementar funcionalidade de atribuição de notas

### 3. Visualização de Notas por Atividade
**Problema**: Não há interface para visualizar notas específicas de atividades.

**Solução Necessária**:
- Criar seção para exibir notas das atividades
- Permitir visualização por aluno ou por atividade
- Adicionar funcionalidade de exportação de notas

## Componentes Afetados

### Componentes Frontend
- `TeacherGradesActivitiesTab.tsx` - Precisa de seção para notas de atividades
- `NewActivityModal.tsx` - Pode precisar de ajustes para integração com notas
- `activityService.ts` - Precisa de novos endpoints para gerenciamento de notas

### Serviços Backend
- `activityService.ts` - Precisa de funções para atribuição e busca de notas
- `teacherDashboardService.ts` - Precisa de funções para busca de notas por atividade

## Recomendações

### Prioridade 1: Estrutura de Banco de Dados
1. Criar tabela para conectar atividades e notas
2. Atualizar migrações existentes
3. Garantir integridade referencial

### Prioridade 2: Funcionalidades Backend
1. Implementar endpoints para atribuição de notas
2. Implementar endpoints para busca de notas por atividade
3. Atualizar serviços existentes

### Prioridade 3: Funcionalidades Frontend
1. Criar interface para atribuição de notas
2. Atualizar aba de atividades para mostrar notas
3. Implementar modal para edição de notas

## Conclusão
A funcionalidade "Atividades & Notas" está incompleta. Existe a capacidade de criar atividades, mas não de gerenciar as notas associadas a elas, o que torna o nome da aba enganoso. A implementação completa dessa funcionalidade é essencial para o uso educacional do sistema.
