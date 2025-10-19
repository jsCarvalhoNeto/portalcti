import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

// Função para garantir que não haja dupla barra na URL
const createAPI = () => {
  let baseURL = API_URL;
  
  // Remover barra final se existir para evitar dupla barra
  if (baseURL && baseURL.endsWith('/')) {
    baseURL = baseURL.slice(0, -1);
  }
  
  return axios.create({
    baseURL: baseURL,
    withCredentials: true, // Habilitar envio de cookies
  });
};

const api = createAPI();

export default api;
