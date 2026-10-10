import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

// Função para garantir que não haja dupla barra na URL
const createAPI = () => {
  let baseURL = API_URL;

  const isProd = import.meta.env.PROD || (
    typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') && 
    !window.location.hostname.includes('127.0.0.1')
  );

  // Se estiver em ambiente público (portalinfobva.tech) e a URL apontar para localhost ou estiver vazia, usar backend de produção
  if (!baseURL || (isProd && baseURL.includes('localhost'))) {
    baseURL = 'https://ctibackend-production.up.railway.app/api';
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

  // Interceptor para injetar token de cabeçalho (fallback para cookies bloqueados)
  instance.interceptors.request.use(
    (config) => {
      // Tentar obter token dos headers de armazenamento local (definido no login)
      const storedSessionId = localStorage.getItem('user_session_header');
      if (storedSessionId) {
        config.headers['X-Session-Id'] = storedSessionId;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

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
