// Script de teste para simular inscrição completa
console.log('🧪 Simulando dados completos para teste...');

const testData = {
  name: "João Teste",
  email: "joao.teste@exemplo.com",
  thematicAxis: {
    id: "estetica-masculina",
    name: "A Construção da Estética Masculina",
    title: "A Construção da Estética Masculina",
    description: "Este eixo explora as questões de identidade..."
  },
  team: {
    teamName: "Equipe Teste Final",
    projectTitle: "Aplicativo Educacional",
    projectDescription: "Um aplicativo para melhorar a educação digital",
    members: [
      {
        name: "Maria Silva",
        email: "maria@teste.com"
      },
      {
        name: "Pedro Santos", 
        email: "pedro@teste.com"
      }
    ]
  }
};

localStorage.setItem('studentData', JSON.stringify(testData));
console.log('✅ Dados de teste salvos no localStorage');
console.log('📋 Dados:', testData);
console.log('🔗 Acesse: http://localhost:8081/eventos/confirmacao');