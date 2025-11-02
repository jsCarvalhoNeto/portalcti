/**
 * Serviço para upload e gerenciamento de arquivos locais
 */
class FileUploadService {
  constructor() {
    this.baseUrl = '/api/files';
  }

  /**
   * Upload de arquivo geral
   */
  async uploadFile(file, activityData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('year', activityData.year || '1');
    formData.append('subject', activityData.subject || 'geral');
    formData.append('period', activityData.period || '1');

    try {
      const response = await fetch(`${this.baseUrl}/upload-local`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.file;
      } else {
        throw new Error(result.error || 'Erro desconhecido no upload');
      }
    } catch (error) {
      console.error('Erro no upload de arquivo:', error);
      throw error;
    }
  }

  /**
   * Upload de imagem para editor
   */
  async uploadImage(file) {
    if (!file.type.startsWith('image/')) {
      throw new Error('O arquivo deve ser uma imagem');
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${this.baseUrl}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.url;
      } else {
        throw new Error(result.error || 'Erro desconhecido no upload da imagem');
      }
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      throw error;
    }
  }

  /**
   * Gerar URL de download
   */
  getDownloadUrl(relativePath) {
    return `${this.baseUrl}/local-download/${encodeURIComponent(relativePath)}`;
  }

  /**
   * Gerar URL de visualização
   */
  getViewUrl(relativePath) {
    return `${this.baseUrl}/local-view/${encodeURIComponent(relativePath)}`;
  }

  /**
   * Gerar URL de imagem
   */
  getImageUrl(relativePath) {
    return `${this.baseUrl}/image/${encodeURIComponent(relativePath)}`;
  }

  /**
   * Verificar se o serviço está funcionando
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/local/health`);
      return response.json();
    } catch (error) {
      console.error('Erro no health check:', error);
      throw error;
    }
  }

  /**
   * Upload com progresso (experimental)
   */
  async uploadWithProgress(file, activityData = {}, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', activityData.year || '1');
      formData.append('subject', activityData.subject || 'geral');
      formData.append('period', activityData.period || '1');

      const xhr = new XMLHttpRequest();

      // Configurar progresso
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
      }

      // Configurar resposta
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.success) {
              resolve(result.file);
            } else {
              reject(new Error(result.error || 'Erro desconhecido'));
            }
          } catch (error) {
            reject(new Error('Erro ao processar resposta do servidor'));
          }
        } else {
          reject(new Error(`Erro HTTP: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Erro de rede durante o upload'));
      });

      // Configurar headers
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Enviar requisição
      xhr.open('POST', `${this.baseUrl}/upload-local`);
      xhr.send(formData);
    });
  }
}

export default new FileUploadService();