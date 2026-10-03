// Script para testar o fluxo completo de dados
const testCompleteFlow = () => {
  console.log('🧪 Simulando fluxo completo de dados do evento...');
  
  // 1. Dados iniciais (página de inscrição)
  const initialData = {
    name: "Teste Silva",
    email: "teste@exemplo.com"
  };
  
  // 2. Dados após escolher eixo temático
  const axisData = {
    id: "estetica-masculina",
    title: "A Construção da Estética Masculina",
    name: "A Construção da Estética Masculina", // Agora mapeado corretamente
    description: "Este eixo explora as questões de identidade..."
  };
  
  const afterAxisSelection = {
    ...initialData,
    thematicAxis: axisData
  };
  
  // 3. Dados após formar equipe
  const teamData = {
    teamName: "Equipe Inovação",
    projectTitle: "App Educacional",
    projectDescription: "Um aplicativo para educação inclusiva",
    members: [
      {
        name: "Maria Santos",
        email: "maria@exemplo.com",
        phone: "(11) 99999-9999",
        role: "Desenvolvedora"
      }
    ]
  };
  
  const finalData = {
    ...afterAxisSelection,
    team: teamData
  };
  
  // 4. Dados que serão enviados para a API
  const apiData = {
    student_name: finalData.name,
    student_email: finalData.email,
    axis_id: finalData.thematicAxis.id,
    team_name: finalData.team.teamName,
    project_title: finalData.team.projectTitle,
    project_description: finalData.team.projectDescription,
    team_members: finalData.team.members || []
  };
  
  console.log('📊 Estrutura final dos dados:');
  console.log('- localStorage:', JSON.stringify(finalData, null, 2));
  console.log('\n📡 Dados para API:');
  console.log(JSON.stringify(apiData, null, 2));
  
  return { finalData, apiData };
};

testCompleteFlow();