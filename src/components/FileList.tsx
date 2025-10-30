import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Trash2, 
  ExternalLink, 
  FileText,
  Eye,
  Calendar,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { fileService } from '@/services/fileService';
import { useAuth } from '@/hooks/useAuth';

interface FileListProps {
  activityId: number;
  type: 'activity' | 'student-responses';
  canDelete?: boolean;
  onFileDeleted?: () => void;
  className?: string;
}

interface FileItem {
  id: number;
  file_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  description?: string;
  created_at: string;
  uploaded_by_name: string;
  student_name?: string; // Para arquivos de estudantes
  enrollment_id?: number;
}

export default function FileList({
  activityId,
  type,
  canDelete = false,
  onFileDeleted,
  className = ''
}: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const { user, isTeacher } = useAuth();

  useEffect(() => {
    loadFiles();
  }, [activityId, type]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedFiles = type === 'activity'
        ? await fileService.getActivityFiles(activityId)
        : await fileService.getStudentFiles(activityId);
      
      setFiles(loadedFiles);
    } catch (err: any) {
      console.error('Erro ao carregar arquivos:', err);
      setError(err.response?.data?.message || 'Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const downloadInfo = await fileService.getDownloadInfo(file.id);
      
      // Abrir link de download em nova aba
      window.open(downloadInfo.downloadUrl, '_blank');
    } catch (err: any) {
      console.error('Erro no download:', err);
      setError(err.response?.data?.message || 'Erro ao fazer download');
    }
  };

  const handleView = (file: FileItem) => {
    // Abrir arquivo no Google Drive para visualização
    window.open(file.file_url, '_blank');
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${file.file_name}"?`)) {
      return;
    }

    try {
      setDeletingFileId(file.id);
      await fileService.deleteFile(file.id);
      
      // Remover arquivo da lista
      setFiles(prev => prev.filter(f => f.id !== file.id));
      onFileDeleted?.();
    } catch (err: any) {
      console.error('Erro ao deletar arquivo:', err);
      setError(err.response?.data?.message || 'Erro ao deletar arquivo');
    } finally {
      setDeletingFileId(null);
    }
  };

  const canDeleteFile = (file: FileItem): boolean => {
    if (!canDelete) return false;
    
    // Usuário pode deletar próprios arquivos ou professor pode deletar qualquer arquivo
    return file.uploaded_by_name === user?.email || isTeacher;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Carregando arquivos...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={loadFiles}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {type === 'activity' ? 'Arquivos da atividade' : 'Arquivos enviados pelos alunos'}
        </CardTitle>
        <CardDescription>
          {files.length === 0 
            ? 'Nenhum arquivo encontrado'
            : `${files.length} arquivo${files.length === 1 ? '' : 's'} encontrado${files.length === 1 ? '' : 's'}`
          }
        </CardDescription>
      </CardHeader>
      
      {files.length > 0 && (
        <CardContent>
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                {/* Ícone do arquivo */}
                <div className="flex-shrink-0">
                  <div className="text-2xl">
                    {fileService.getFileIcon(file.file_type)}
                  </div>
                </div>

                {/* Informações do arquivo */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">{file.file_name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {file.file_type.split('/')[1]?.toUpperCase() || 'ARQUIVO'}
                    </Badge>
                  </div>
                  
                  {file.description && (
                    <p className="text-sm text-muted-foreground">{file.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>
                        {file.student_name ? `${file.student_name}` : file.uploaded_by_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {/* Visualizar */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(file)}
                    title="Visualizar arquivo"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  {/* Download */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file)}
                    title="Fazer download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  {/* Abrir no Google Drive */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.file_url, '_blank')}
                    title="Abrir no Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>

                  {/* Deletar */}
                  {canDeleteFile(file) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file)}
                      disabled={deletingFileId === file.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Excluir arquivo"
                    >
                      {deletingFileId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}