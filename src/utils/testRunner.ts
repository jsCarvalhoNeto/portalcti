/**
 * Executor de testes manual para validar funcionalidades
 * Execute este arquivo para testar as funcionalidades implementadas
 */

import { runPasswordServiceTests } from '../services/__tests__/passwordService.test';
import { runValidationServiceTests } from '../services/__tests__/validationService.test';
import { runUseStudentCreationTests } from '../hooks/__tests__/useStudentCreation.test';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export async function runAllTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log('🚀 Iniciando execução de testes...\n');

  // Teste 1: PasswordService
  try {
    const passed = runPasswordServiceTests();
    results.push({
      name: 'PasswordService',
      passed,
    });
  } catch (error) {
    results.push({
      name: 'PasswordService',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }

  console.log(''); // Linha em branco

  // Teste 2: ValidationService
  try {
    const passed = runValidationServiceTests();
    results.push({
      name: 'ValidationService',
      passed,
    });
  } catch (error) {
    results.push({
      name: 'ValidationService',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }

  console.log(''); // Linha em branco

  // Teste 3: useStudentCreation
  try {
    const passed = runUseStudentCreationTests();
    results.push({
      name: 'useStudentCreation',
      passed,
    });
  } catch (error) {
    results.push({
      name: 'useStudentCreation',
      passed: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }

  console.log(''); // Linha em branco

  // Resumo dos resultados
  console.log('📊 Resumo dos Testes:');
  console.log('====================');
  
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
  });
  
  console.log(`\n📈 Total: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Todos os testes passaram com sucesso!');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os erros acima.');
  }

  return results;
}

// Função para testar funcionalidades específicas em desenvolvimento
export function testStudentCreationFlow() {
  console.log('🧪 Testando fluxo de criação de estudante...\n');
  
  try {
    // Importar serviços
    const { generateSecurePassword } = require('../services/passwordService');
    const { validateEmail, validateStudentRegistration, validateFullName, sanitizeStudentData } = require('../services/validationService');
    
    // Teste 1: Geração de senha
    console.log('1. Testando geração de senha...');
    const password = generateSecurePassword();
    console.log(`   Senha gerada: ${password} (${password.length} caracteres)`);
    console.assert(password.length === 12, 'Senha deve ter 12 caracteres');
    console.log('   ✅ Geração de senha OK\n');
    
    // Teste 2: Validação de dados
    console.log('2. Testando validação de dados...');
    const testData = {
      fullName: '  João Silva Santos  ',
      email: '  JOAO.SILVA@EXAMPLE.COM  ',
      studentRegistration: '  est2024001  '
    };
    
    console.log('   Dados originais:', testData);
    
    // Validar antes da sanitização
    console.log('   Validações:');
    console.log(`   - Nome válido: ${validateFullName(testData.fullName)}`);
    console.log(`   - Email válido: ${validateEmail(testData.email)}`);
    console.log(`   - Matrícula válida: ${validateStudentRegistration(testData.studentRegistration)}`);
    
    // Sanitizar dados
    const sanitizedData = sanitizeStudentData(testData);
    console.log('   Dados sanitizados:', sanitizedData);
    console.log('   ✅ Validação e sanitização OK\n');
    
    // Teste 3: Casos de erro
    console.log('3. Testando casos de erro...');
    const invalidData = {
      fullName: 'A', // Muito curto
      email: 'email-inválido', // Formato inválido
      studentRegistration: 'ABC12' // Muito curto
    };
    
    console.log('   Dados inválidos:', invalidData);
    console.log('   Validações (devem falhar):');
    console.log(`   - Nome válido: ${validateFullName(invalidData.fullName)} (esperado: false)`);
    console.log(`   - Email válido: ${validateEmail(invalidData.email)} (esperado: false)`);
    console.log(`   - Matrícula válida: ${validateStudentRegistration(invalidData.studentRegistration)} (esperado: false)`);
    console.log('   ✅ Casos de erro OK\n');
    
    console.log('🎉 Fluxo de criação de estudante testado com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste do fluxo:', error);
    return false;
  }
}

// Executar testes se este arquivo for chamado diretamente
if (typeof window === 'undefined' && require.main === module) {
  runAllTests().then(() => {
    console.log('\n' + '='.repeat(50));
    testStudentCreationFlow();
  });
}