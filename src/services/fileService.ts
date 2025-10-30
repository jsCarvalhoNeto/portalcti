import api from './api';

interface FileUploadData {
  activityId?: number;
  enrollmentId?: number;
  description?: string;
  activityData?: {
    year: string;
    subject: string;
    period: string;
  };
}

interface UploadedFile {
  id: number;
  driveFileId: string;
  name: string;
  url: string;
  downloadUrl: string;
  type: string;
}

interface ActivityFile {
  id: number;
  file_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  description?: string;
  created_at: string;
  uploaded_by_name: string;
}

interface StudentFile extends ActivityFile {
  student_name: string;
  enrollment_id: number;
}

export const fileService = {
  /**
   * Upload de arquivo de atividade (professor)
   */
  async uploadActivityFile(file: File, data: FileUploadData): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('activityId', String(data.activityId));
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.activityData) {
      formData.append('activityData', JSON.stringify(data.activityData));
    }

    const response = await api.post('/api/files/upload/activity', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.file;
  },

  /**
   * Upload de arquivo de resposta (aluno)
   */
  async uploadStudentResponseFile(file: File, data: FileUploadData): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('activityId', String(data.activityId));
    formData.append('enrollmentId', String(data.enrollmentId));
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.activityData) {
      formData.append('activityData', JSON.stringify(data.activityData));
    }

    const response = await api.post('/api/files/upload/student-response', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.file;
  },

  /**
   * Upload múltiplos arquivos
   */
  async uploadMultipleFiles(files: File[], data: FileUploadData & { type: 'activity' | 'student-response' }): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('type', data.type);
    formData.append('activityId', String(data.activityId));
    
    if (data.enrollmentId) {
      formData.append('enrollmentId', String(data.enrollmentId));
    }
    if (data.activityData) {
      formData.append('activityData', JSON.stringify(data.activityData));
    }

    const response = await api.post('/api/files/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.files;
  },

  /**
   * Listar arquivos de uma atividade
   */
  async getActivityFiles(activityId: number): Promise<ActivityFile[]> {
    const response = await api.get(`/api/files/activity/${activityId}/files`);
    return response.data.files;
  },

  /**
   * Listar arquivos de resposta dos alunos (apenas para professores)
   */
  async getStudentFiles(activityId: number): Promise<StudentFile[]> {
    const response = await api.get(`/api/files/activity/${activityId}/student-files`);
    return response.data.files;
  },

  /**
   * Obter informações para download de arquivo
   */
  async getDownloadInfo(fileId: number): Promise<{
    name: string;
    downloadUrl: string;
    viewUrl: string;
    mimeType: string;
    size?: number;
  }> {
    const response = await api.get(`/api/files/download/${fileId}`);
    return response.data;
  },

  /**
   * Deletar arquivo
   */
  async deleteFile(fileId: number): Promise<void> {
    await api.delete(`/api/files/file/${fileId}`);
  },

  /**
   * Verificar se um tipo de arquivo é suportado
   */
  isSupportedFileType(file: File): boolean {
    const supportedTypes = [
      // Documentos
      'application/pdf',
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/javascript',
      
      // Microsoft Office
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      
      // Arquivos compactados
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      
      // Imagens
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      
      // Áudio e Vídeo
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      
      // Outros
      'application/json',
      'application/xml',
      'text/xml'
    ];

    return supportedTypes.includes(file.type);
  },

  /**
   * Formatar tamanho do arquivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Obter ícone baseado no tipo de arquivo
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📈';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('video')) return '🎬';
    if (mimeType.includes('audio')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return '📦';
    if (mimeType.includes('text')) return '📋';
    if (mimeType.includes('html')) return '🌐';
    if (mimeType.includes('css')) return '🎨';
    if (mimeType.includes('javascript')) return '⚡';
    return '📁';
  },

  /**
   * Validar arquivo antes do upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Verificar tamanho (50MB máximo)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Arquivo muito grande. Tamanho máximo permitido: 50MB'
      };
    }

    // Verificar tipo
    if (!this.isSupportedFileType(file)) {
      return {
        valid: false,
        error: `Tipo de arquivo não suportado: ${file.type}`
      };
    }

    return { valid: true };
  }
};