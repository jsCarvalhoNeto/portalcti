// Script para testar o localStorage do frontend
console.log('=== VERIFICANDO DADOS NO LOCALSTORAGE ===');

const studentData = localStorage.getItem('studentData');
if (studentData) {
  const parsed = JSON.parse(studentData);
  console.log('📋 Dados encontrados no localStorage:');
  console.log(JSON.stringify(parsed, null, 2));
  
  // Verificar estrutura específica
  console.log('\n🔍 Verificando estrutura:');
  console.log('- Nome:', parsed.name);
  console.log('- Email:', parsed.email);
  console.log('- Eixo temático:', parsed.thematicAxis);
  console.log('- Equipe:', parsed.team);
  
  if (parsed.thematicAxis) {
    console.log('\n📌 Detalhes do eixo temático:');
    console.log('- ID:', parsed.thematicAxis.id);
    console.log('- Nome/Title:', parsed.thematicAxis.name || parsed.thematicAxis.title);
    console.log('- Descrição:', parsed.thematicAxis.description);
  }
  
  if (parsed.team) {
    console.log('\n👥 Detalhes da equipe:');
    console.log('- Nome da equipe:', parsed.team.teamName);
    console.log('- Título do projeto:', parsed.team.projectTitle);
    console.log('- Descrição do projeto:', parsed.team.projectDescription);
    console.log('- Membros:', parsed.team.members?.length || 0);
  }
  
} else {
  console.log('❌ Nenhum dado encontrado no localStorage');
}

console.log('\n=== FIM DA VERIFICAÇÃO ===');