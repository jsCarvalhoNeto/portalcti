import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { fileService } from '@/services/fileService';

interface FileUploadProps {
  activityId: number;
  enrollmentId?: number;
  type: 'activity' | 'student-response';
  activityData?: {
    year: string;
    subject: string;
    period: string;
  };
  multiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (files: any[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface FileInfo {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  uploadedFile?: any;
}

export default function FileUpload({
  activityId,
  enrollmentId,
  type,
  activityData,
  multiple = false,
  maxFiles = 5,
  onUploadComplete,
  onError,
  className = ''
}: FileUploadProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileInfo[] = [];
    const currentFileCount = files.length;

    for (let i = 0; i < selectedFiles.length && (multiple ? currentFileCount + i < maxFiles : i < 1); i++) {
      const file = selectedFiles[i];
      const validation = fileService.validateFile(file);

      if (!validation.valid) {
        onError?.(validation.error || 'Arquivo inválido');
        continue;
      }

      newFiles.push({
        file,
        id: `${Date.now()}-${i}`,
        status: 'pending',
        progress: 0
      });
    }

    if (multiple) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFile = async (fileInfo: FileInfo): Promise<void> => {
    return new Promise((resolve, reject) => {
      setFiles(prev => prev.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileInfo.id && f.status === 'uploading') {
            const newProgress = Math.min(f.progress + Math.random() * 15, 90);
            return { ...f, progress: newProgress };
          }
          return f;
        }));
      }, 200);

      const uploadData = {
        activityId,
        enrollmentId,
        description: description.trim() || undefined,
        activityData
      };

      const uploadPromise = type === 'activity' 
        ? fileService.uploadActivityFile(fileInfo.file, uploadData)
        : fileService.uploadStudentResponseFile(fileInfo.file, uploadData);

      uploadPromise
        .then(uploadedFile => {
          clearInterval(progressInterval);
          setFiles(prev => prev.map(f => 
            f.id === fileInfo.id 
              ? { ...f, status: 'success', progress: 100, uploadedFile }
              : f
          ));
          resolve();
        })
        .catch(error => {
          clearInterval(progressInterval);
          const errorMessage = error.response?.data?.message || error.message || 'Erro no upload';
          setFiles(prev => prev.map(f => 
            f.id === fileInfo.id 
              ? { ...f, status: 'error', progress: 0, error: errorMessage }
              : f
          ));
          reject(error);
        });
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      if (multiple) {
        // Upload múltiplo usando a API específica
        const filesToUpload = files.filter(f => f.status === 'pending').map(f => f.file);
        
        if (filesToUpload.length > 0) {
          const uploadedFiles = await fileService.uploadMultipleFiles(filesToUpload, {
            type,
            activityId,
            enrollmentId,
            activityData
          });
          
          onUploadComplete?.(uploadedFiles);
        }
      } else {
        // Upload individual
        const pendingFiles = files.filter(f => f.status === 'pending');
        
        for (const fileInfo of pendingFiles) {
          await uploadFile(fileInfo);
        }
        
        const successfulFiles = files
          .filter(f => f.status === 'success')
          .map(f => f.uploadedFile);
          
        onUploadComplete?.(successfulFiles);
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      onError?.('Erro ao fazer upload dos arquivos');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const canUpload = files.some(f => f.status === 'pending') && !isUploading;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          {type === 'activity' ? 'Anexar arquivos à atividade' : 'Enviar arquivos de resposta'}
        </CardTitle>
        <CardDescription>
          {multiple ? `Selecione até ${maxFiles} arquivos` : 'Selecione um arquivo'} 
          {' '}(PDF, DOC, PPT, ZIP, imagens, etc. - máximo 50MB por arquivo)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de drag and drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Clique aqui ou arraste {multiple ? 'arquivos' : 'um arquivo'} para fazer upload
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.txt,.html,.css,.js,.json,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.wav,.mp4,.avi,.mov"
          />
        </div>

        {/* Campo de descrição */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Adicione uma descrição para os arquivos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        )}

        {/* Lista de arquivos */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Arquivos selecionados:</h4>
            <div className="space-y-2">
              {files.map((fileInfo) => (
                <div key={fileInfo.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(fileInfo.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {fileInfo.file.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {fileService.formatFileSize(fileInfo.file.size)}
                      </Badge>
                    </div>
                    {fileInfo.status === 'uploading' && (
                      <Progress value={fileInfo.progress} className="h-1 mt-1" />
                    )}
                    {fileInfo.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">{fileInfo.error}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(fileInfo.id)}
                      disabled={fileInfo.status === 'uploading'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de upload */}
        {files.length > 0 && (
          <div className="flex justify-end">
            <Button 
              onClick={handleUpload}
              disabled={!canUpload}
              className="flex items-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Enviando...' : 'Enviar arquivos'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}