// ===================================================================
// ERROR BOUNDARY - CAPTURA DE ERROS EM PRODUÇÃO/MOBILE
// ===================================================================
// Componente para capturar erros que causam tela branca
// ===================================================================

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackRoute?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary capturou erro:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });

    // Enviar para sistema de logging (opcional)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = this.props.fallbackRoute || '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <Card className="p-8 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-red-600 mb-2">
                    Ops! Algo deu errado
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Desculpe, ocorreu um erro inesperado.
                  </p>
                </div>

                {import.meta.env.DEV && this.state.error && (
                  <details className="text-left bg-muted p-4 rounded-lg">
                    <summary className="cursor-pointer font-medium mb-2">
                      Detalhes do Erro (Desenvolvimento)
                    </summary>
                    <div className="text-sm text-red-600 font-mono whitespace-pre-wrap overflow-auto max-h-64">
                      <p className="font-bold">{this.state.error.toString()}</p>
                      {this.state.errorInfo && (
                        <pre className="mt-2 text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Dica:</strong> Se o problema persistir, tente limpar o cache do navegador ou usar outro dispositivo.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={this.handleReload}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Recarregar Página
                  </Button>

                  <Button
                    onClick={this.handleReset}
                    className="flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    Voltar ao Início
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>Se o erro continuar, entre em contato com o suporte</p>
                  <p className="mt-1">ID do Erro: {Date.now().toString(36)}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
