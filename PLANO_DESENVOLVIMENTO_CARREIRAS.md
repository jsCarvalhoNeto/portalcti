# Plano de Desenvolvimento: Portal de Carreiras e Talentos (CTI)

Este documento detalha o plano de implementação para a nova área de carreiras do portal, focada em conectar alunos do 3º ano com o mercado de trabalho.

## 1. Visão Geral

O objetivo é criar um ecossistema onde:
1.  **Alunos** possam criar um perfil profissional e compartilhar seus currículos (PDF).
2.  **Empregadores** (ou o público) possam visualizar talentos disponíveis e baixar currículos.

## 2. Estrutura de Dados Sugerida

Para suportar essas funcionalidades, precisaremos de uma nova entidade `CareerProfile` vinculada ao `Student`.

```typescript
// src/types/career.ts (Sugestão)

export interface CareerProfile {
  student_id: string;
  bio: string; // Resumo profissional
  skills: string[]; // Lista de habilidades (ex: "React", "Python")
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  resume_url: string; // URL do PDF armazenado
  is_available: boolean; // Se o aluno está buscando oportunidades ativamente
  is_published: boolean; // Se o perfil está visível publicamente
  views_count: number; // Métrica de visualizações
}
```

## 3. Novas Funcionalidades no Frontend

### A. Para o Aluno (Área Privada)
**Local:** `src/pages/StudentDashboard.tsx` e nova página `src/pages/CareerProfileEditor.tsx`.

1.  **Nova Aba "Carreira" no Dashboard**:
    *   Adicionar uma nova aba "Carreira" ou "Meu Currículo" no `StudentDashboard`.
    *   Botão de acesso rápido "Editar Perfil Profissional".

2.  **Editor de Perfil (`CareerProfileEditor`)**:
    *   **Upload de Currículo**: Campo `input type="file"` aceitando apenas PDF.
    *   **Dados Profissionais**: Formulário para preencher Bio, Links (LinkedIn, GitHub) e Tags de Habilidades.
    *   **Preview**: Visualização de como o card aparecerá para empresas.
    *   **Toggle de Visibilidade**: "Tornar meu perfil público".

### B. Para o Público/Empresas (Área Pública)
**Local:** Nova página `src/pages/TalentShowcase.tsx`.

1.  **Mural de Talentos**:
    *   Grid de cards mostrando: Foto do aluno (avatar), Nome, Bio curta, Tags de Habilidades.
    *   Botão "Ver Perfil Completo" ou "Baixar Currículo".
    *   **Filtros**:
        *   Por Habilidade (ex: "Quero alguém que saiba Java").
        *   Por Turma/Ano de Conclusão.

## 4. Plano de Implementação Passo a Passo

### Passo 1: Camada de Serviço
Crie um arquivo `src/services/careerService.ts`:
*   `getProfile(studentId)`
*   `updateProfile(studentId, data)`
*   `uploadResume(file)`
*   `getAllTalents(filters)`

### Passo 2: Componentes de UI
*   `ResumeUploader.tsx`: Componente com drag-and-drop para PDFs.
*   `SkillSelector.tsx`: Input de tags para habilidades.
*   `StudentCareerCard.tsx`: O card que será exibido no mural público.

### Passo 3: Rotas
Adicionar no `src/App.tsx`:
```tsx
<Route path="/talentos" element={<TalentShowcase />} />
<Route path="/student/career" element={<CareerProfileEditor />} />
```

## 5. Ideias de Inovações e Melhorias (Dicas)

Aqui estão algumas sugestões para tornar o sistema ainda mais interessante:

1.  **Selo de "Aluno Verificado"**:
    *   Implementar um fluxo onde um professor pode validar o perfil do aluno antes de ir ao ar, garantindo a qualidade das informações.

2.  **Geração Automática de Currículo Simples**:
    *   Se o aluno não tiver um PDF, o sistema poderia gerar um PDF simples usando os dados cadastrados (notas, cursos realizados no portal, bio).

3.  **Botão "Tenho Interesse"**:
    *   Em vez de apenas baixar o currículo e divulgar o email do aluno (privacidade), a empresa clica em "Tenho Interesse". O sistema envia um e-mail automático para o aluno dizendo: "A empresa X visualizou seu perfil e quer entrar em contato".

4.  **Estatísticas para o Aluno**:
    *   Mostrar no Dashboard: "Seu currículo foi baixado 5 vezes esta semana". Isso motiva o aluno.

5.  **Integração com LinkedIn**:
    *   Botão "Importar do LinkedIn" para preencher a Bio e Experiências automaticamente.

6.  **Vídeo de Apresentação (Pitch)**:
    *   Permitir que o aluno faça upload de um vídeo curto de 1 minuto se apresentando.

7.  **Gamificação da Carreira**:
    *   Ganhar medalhas no portal por completar o perfil profissional (ex: "Medalha Pronto para o Mercado").

## Próximos Passos Sugeridos

Recomendo iniciar pela criação do **Mural de Talentos (Mockado)** para visualizar como ficará a apresentação final, e depois construir o formulário de edição para os alunos.
