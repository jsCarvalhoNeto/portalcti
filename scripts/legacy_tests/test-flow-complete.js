// Script para simular o fluxo completo no browser console
console.log('🧪 TESTE DO FLUXO DE INSCRIÇÃO');

// 1. Simular dados completos no localStorage
const mockData = {
  name: "João Teste",
  email: "joao@teste.com",
  thematicAxis: {
    id: "estetica-masculina",
    name: "A Construção da Estética Masculina",
    title: "A Construção da Estética Masculina",
    description: "Este eixo explora as questões de identidade..."
  },
  team: {
    teamName: "Equipe Teste",
    projectTitle: "Projeto de Teste",
    projectDescription: "Descrição do projeto de teste",
    members: []
  }
};

console.log('💾 Salvando dados de teste no localStorage...');
localStorage.setItem('studentData', JSON.stringify(mockData));

console.log('✅ Dados salvos. Agora vá para /eventos/confirmacao');
console.log('📋 Dados no localStorage:', JSON.stringify(mockData, null, 2));