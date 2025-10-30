import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  Settings,
  Folder,
  Info,
  CloudUpload
} from 'lucide-react';
import MainLayout from '@/layouts/MainLayout';
import api from '@/services/api';

export default function GoogleDriveTest() {
  const { } = useAuth();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Verificar status do Google Drive
  const checkStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/test-drive/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatus({ error: 'Erro ao conectar com servidor' });
    } finally {
      setLoading(false);
    }
  };

  // Inicializar Google Drive
  const initializeGoogleDrive = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/test-drive/init');
      
      setTestResults(prev => [...prev, {
        type: 'init',
        success: response.data.success,
        message: response.data.message,
        details: response.data.rootFolderId,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Atualizar status
      await checkStatus();
    } catch (error: any) {
      setTestResults(prev => [...prev, {
        type: 'init',
        success: false,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Testar criação de pastas
  const testFolderCreation = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/test-drive/test-folders', {
        year: '2024',
        subject: 'Teste Automático',
        period: '1º Semestre'
      });
      
      setTestResults(prev => [...prev, {
        type: 'folder',
        success: response.data.success,
        message: response.data.message,
        details: response.data.structure,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error: any) {
      setTestResults(prev => [...prev, {
        type: 'folder',
        success: false,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Testar upload de arquivo
  const testFileUpload = async () => {
    if (!selectedFile) {
      alert('Selecione um arquivo primeiro!');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('useGoogleDrive', 'true');
      formData.append('activityData', JSON.stringify({
        year: '2',
        subject: 'Teste Upload',
        period: '03'
      }));

      const response = await api.post('/api/test-drive/test-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setTestResults(prev => [...prev, {
        type: 'upload',
        success: response.data.success,
        message: response.data.message,
        details: `Método: ${response.data.method}`,
        file: response.data.file,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error: any) {
      setTestResults(prev => [...prev, {
        type: 'upload',
        success: false,
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (hasCredentials: boolean, isInitialized: boolean) => {
    if (hasCredentials && isInitialized) {
      return <Badge className="bg-green-500">✅ Funcionando</Badge>;
    }
    if (hasCredentials && !isInitialized) {
      return <Badge variant="secondary">⚙️ Precisa Inicializar</Badge>;
    }
    if (!hasCredentials) {
      return <Badge variant="destructive">❌ Sem Credenciais</Badge>;
    }
    return <Badge variant="outline">❓ Desconhecido</Badge>;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🚀 Teste Google Drive Integration</h1>
          <p className="text-muted-foreground">
            Teste e configure a integração com Google Drive API para upload de arquivos
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Button onClick={checkStatus} disabled={loading} variant="outline">
                {loading ? 'Verificando...' : 'Verificar Status'}
              </Button>
              
              {status && (
                <div className="flex items-center gap-2">
                  {getStatusBadge(status.hasCredentials, status.isInitialized)}
                </div>
              )}
            </div>

            {status && (
              <div className="space-y-2 text-sm">
                <div>📋 <strong>Credenciais:</strong> {status.hasCredentials ? '✅ Configuradas' : '❌ Faltando'}</div>
                <div>🔧 <strong>Inicializado:</strong> {status.isInitialized ? '✅ Sim' : '❌ Não'}</div>
                <div>☁️ <strong>Google Drive Ativo:</strong> {status.useGoogleDrive ? '✅ Sim' : '❌ Não'}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Testes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Inicialização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                1. Inicializar
              </CardTitle>
              <CardDescription>
                Configure a conexão com Google Drive API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={initializeGoogleDrive} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Inicializando...' : 'Inicializar Google Drive'}
              </Button>
            </CardContent>
          </Card>

          {/* Teste de Pastas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="w-5 h-5" />
                2. Criar Pastas
              </CardTitle>
              <CardDescription>
                Teste a criação da estrutura de pastas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testFolderCreation} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Testando...' : 'Testar Estrutura de Pastas'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upload Test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="w-5 h-5" />
              3. Teste de Upload
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo para testar a integração completa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
              />
            </div>
            
            {selectedFile && (
              <Alert>
                <Upload className="w-4 h-4" />
                <AlertDescription>
                  Arquivo selecionado: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={testFileUpload} 
              disabled={!selectedFile || loading}
              className="w-full"
            >
              {loading ? 'Enviando...' : 'Testar Upload'}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados dos Testes */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Resultados dos Testes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{result.type}</Badge>
                          <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                        </div>
                        <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                          {result.message}
                        </p>
                        {result.details && (
                          <p className="text-sm text-muted-foreground mt-1">{result.details}</p>
                        )}
                        {result.file && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <strong>Arquivo:</strong> {result.file.name}<br/>
                            {result.file.webViewLink && (
                              <a href={result.file.webViewLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                Ver no Google Drive
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instruções */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📖 Instruções</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>1. Credenciais:</strong> Certifique-se de que o arquivo `service-account-key.json` está na raiz do backend</p>
            <p><strong>2. Permissões:</strong> Compartilhe a pasta do Google Drive com: `infobva@sixth-sequencer-430212-e3.iam.gserviceaccount.com`</p>
            <p><strong>3. Teste:</strong> Execute os testes na ordem: Inicializar → Criar Pastas → Upload</p>
            <p><strong>4. Fallback:</strong> Se o Google Drive falhar, os arquivos são salvos localmente automaticamente</p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}