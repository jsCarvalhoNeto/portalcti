import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

// Função para garantir que não haja dupla barra na URL
const createAPI = () => {
  // Force localhost for testing new backend features locally
  // TODO: Revert this before deploying to production if you want to use the .env variable again
  let baseURL = API_URL; // import.meta.env.VITE_API_URL;

  // Validar se VITE_API_URL está definida
  if (!baseURL) {
    console.error('❌ VITE_API_URL não está definida! Configure a variável de ambiente no Railway.');
    console.error('📋 Adicione: VITE_API_URL=https://ctibackend-production.up.railway.app/api');
    // Usar fallback para desenvolvimento local
    baseURL = '/api';
  }

  // Remover barra final se existir para evitar dupla barra
  if (baseURL && baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
  }

  console.log('🌐 API configurada com baseURL:', baseURL);

  const instance = axios.create({
    baseURL: baseURL,
    withCredentials: true, // Habilitar envio de cookies
    timeout: 30000, // 30 segundos de timeout para dispositivos móveis
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // Interceptor para lidar com erros 401 (navegação privada)
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Dinamicamente importar utilitário para evitar dependência circular
        try {
          const { default: PrivacyModeUtils } = await import('../utils/privacyMode');
          const privacyCheck = await PrivacyModeUtils.handlePrivacyMode();

          if (privacyCheck.isPrivate || !privacyCheck.cookiesWork) {
            console.warn('🔒 Erro 401 relacionado a navegação privada detectado', {
              url: error.config?.url,
              method: error.config?.method,
              privacyDetails: privacyCheck
            });

            // Adicionar informação adicional ao erro
            error.isPrivacyModeIssue = true;
            error.privacyDetails = privacyCheck;
          } else {
            console.log('⚠️ Erro 401 não relacionado a modo privado - pode ser sessão expirada');
          }
        } catch (importError) {
          console.warn('Não foi possível verificar modo de navegação privada:', importError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createAPI();

export default api;
