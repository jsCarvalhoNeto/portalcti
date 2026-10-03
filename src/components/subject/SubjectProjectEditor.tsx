import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  FolderOpen, 
  FileText, 
  Upload, 
  Link2, 
  X, 
  Sparkles, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  Image as ImageIcon,
  FileDown,
  Paperclip,
  Trash2,
  Plus
} from 'lucide-react';
import { SubjectProject, CreateProjectData, ProjectAttachedFile, subjectProjectService } from '@/services/subjectProjectService';
import { useToast } from '@/hooks/use-toast';
import fileUploadService from '@/services/fileUploadService';

interface SubjectProjectEditorProps {
  isOpen: boolean;
  onClose: () => void;
  project?: SubjectProject | null;
  subjectId: number | string;
  subjectName?: string;
  subjectGrade?: string;
  onSave: (data: CreateProjectData) => Promise<void>;
}

const PERIOD_OPTIONS = [
  { value: '1º Bimestre', label: '1º Bimestre' },
  { value: '2º Bimestre', label: '2º Bimestre' },
  { value: '3º Bimestre', label: '3º Bimestre' },
  { value: '4º Bimestre', label: '4º Bimestre' }
];

const GRADE_OPTIONS = [
  { value: '1º Ano', label: '1º Ano' },
  { value: '2º Ano', label: '2º Ano' },
  { value: '3º Ano', label: '3º Ano' }
];

export default function SubjectProjectEditor({
  isOpen,
  onClose,
  project,
  subjectId,
  subjectName = 'Disciplina',
  subjectGrade = '1º Ano',
  onSave
}: SubjectProjectEditorProps) {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [period, setPeriod] = useState('1º Bimestre');
  const [grade, setGrade] = useState(subjectGrade || '1º Ano');
  
  // Arquivos anexados
  const [attachedFiles, setAttachedFiles] = useState<ProjectAttachedFile[]>([]);
  const [fileTab, setFileTab] = useState<'upload' | 'url'>('upload');
  const [webFileUrl, setWebFileUrl] = useState('');
  const [webFileName, setWebFileName] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Capa
  const [coverTab, setCoverTab] = useState<'url' | 'upload'>('url');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (project) {
        setName(project.name || '');
        setDescription(project.description || '');
        setStartDate(project.start_date ? project.start_date.split('T')[0] : '');
        setDeadline(project.deadline ? project.deadline.split('T')[0] : '');
        setPeriod(project.period || '1º Bimestre');
        setGrade(project.grade || subjectGrade || '1º Ano');
        setAttachedFiles(project.files || []);
        setCoverUrl(project.cover_url || '');
      } else {
        setName('');
        setDescription('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setDeadline('');
        setPeriod('1º Bimestre');
        setGrade(subjectGrade || '1º Ano');
        setAttachedFiles([]);
        setCoverUrl('');
      }
      setWebFileUrl('');
      setWebFileName('');
    }
  }, [isOpen, project, subjectGrade]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingFile(true);
      toast({
        title: 'Enviando arquivo...',
        description: `Processando "${file.name}".`
      });

      const res = await subjectProjectService.uploadProjectFile(file);
      setAttachedFiles(prev => [
        ...prev,
        {
          name: res.fileName,
          url: res.fileUrl,
          size: res.fileSize
        }
      ]);

      toast({
        title: 'Arquivo Anexado',
        description: `O arquivo "${file.name}" foi adicionado ao projeto com sucesso!`
      });
    } catch (err) {
      console.error('Erro no upload de arquivo do projeto:', err);
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível carregar o arquivo.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddWebFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webFileUrl.trim()) return;

    const fileName = webFileName.trim() || 'Link do Documento';
    setAttachedFiles(prev => [
      ...prev,
      {
        name: fileName,
        url: webFileUrl.trim()
      }
    ]);

    setWebFileUrl('');
    setWebFileName('');
    toast({
      title: 'Link Anexado',
      description: 'O link foi anexado à lista de arquivos do projeto.'
    });
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato Inválido',
        description: 'Por favor, selecione uma imagem válida (PNG, JPG, WebP).',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploadingCover(true);
      let uploadedUrl = '';
      try {
        uploadedUrl = await fileUploadService.uploadImage(file);
      } catch {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setCoverUrl(uploadedUrl);
      toast({
        title: 'Capa Carregada',
        description: 'Imagem da capa anexada ao projeto!'
      });
    } catch (err) {
      console.error('Erro no upload da capa:', err);
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível carregar a imagem da capa.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Título Obrigatório',
        description: 'Por favor, informe o título do projeto.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateProjectData = {
        subject_id: Number(subjectId),
        name: name.trim(),
        description: description.trim(),
        start_date: startDate && startDate.trim() !== '' ? startDate : null,
        deadline: deadline && deadline.trim() !== '' ? deadline : null,
        grade: grade || '1º Ano',
        period: period || '1º Bimestre',
        file_path: attachedFiles[0]?.url || null,
        file_name: attachedFiles[0]?.name || null,
        files: attachedFiles,
        cover_url: coverUrl.trim() || undefined
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar projeto:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {project ? 'Editar Projeto' : 'Adicionar Novo Projeto'}
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre propostas de projetos práticos, integradores ou de conclusão de módulo para {subjectName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Título do Projeto */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-name" className="text-xs font-bold">
              Título do Projeto *
            </Label>
            <Input
              id="proj-name"
              placeholder="Ex: Desenvolvimento de E-commerce com React e Node.js"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-sm"
            />
          </div>

          {/* Datas de Início e Entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="proj-start" className="text-xs font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                Data de Início do Projeto
              </Label>
              <Input
                id="proj-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-deadline" className="text-xs font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Data de Término / Apresentação
              </Label>
              <Input
                id="proj-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Período e Série */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="proj-period" className="text-xs font-bold">
                Período / Bimestre *
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="proj-period" className="h-10 text-sm">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-grade" className="text-xs font-bold">
                Série / Ano *
              </Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="proj-grade" className="h-10 text-sm">
                  <SelectValue placeholder="Selecione a série" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição do Projeto */}
          <div className="space-y-1.5">
            <Label htmlFor="proj-desc" className="text-xs font-bold">
              Descrição e Escopo do Projeto
            </Label>
            <Textarea
              id="proj-desc"
              rows={3}
              placeholder="Descreva a proposta do projeto, objetivos de aprendizagem, tecnologias sugeridas, entregáveis esperados e regras..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm resize-y"
            />
          </div>

          {/* Espaço para Anexar Arquivos do Projeto */}
          <div className="border rounded-xl p-4 bg-emerald-500/5 border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-2 text-foreground">
                <Paperclip className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Espaço para Anexar Arquivos do Projeto
                <span className="text-[11px] font-normal text-muted-foreground">({attachedFiles.length} anexado{attachedFiles.length !== 1 ? 's' : ''})</span>
              </Label>
            </div>

            {/* Lista de Arquivos Anexados */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-background border rounded-lg flex items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold truncate text-foreground">{file.name}</span>
                      {file.size && (
                        <span className="text-[10px] text-muted-foreground shrink-0">({file.size})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-bold text-[11px] flex items-center gap-1"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Baixar
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded"
                        title="Remover anexo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Abas para Anexar Novo Arquivo */}
            <Tabs value={fileTab} onValueChange={(v) => setFileTab(v as any)} className="w-full pt-1">
              <TabsList className="grid grid-cols-2 h-8 text-xs bg-muted">
                <TabsTrigger value="upload" className="text-xs gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Enviar do Computador (PDF, ZIP, DOCX)
                </TabsTrigger>
                <TabsTrigger value="url" className="text-xs gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  Link Web / Nuvem
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="pt-2 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="proj-file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="w-full h-10 text-xs gap-2 border-dashed font-semibold"
                >
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {isUploadingFile ? 'Enviando arquivo...' : 'Escolher arquivo para anexar'}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Você pode anexar editais em PDF, modelos de código em ZIP, modelos de documentação, etc.
                </p>
              </TabsContent>

              <TabsContent value="url" className="pt-2 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Nome do arquivo / link (ex: Template de Código)"
                    value={webFileName}
                    onChange={(e) => setWebFileName(e.target.value)}
                    className="h-9 text-xs sm:w-1/3"
                  />
                  <Input
                    placeholder="URL do arquivo (Google Drive, GitHub, etc.)"
                    value={webFileUrl}
                    onChange={(e) => setWebFileUrl(e.target.value)}
                    className="h-9 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddWebFile}
                    disabled={!webFileUrl.trim()}
                    className="h-9 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Anexar
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Imagem de Capa do Projeto (Opcional) */}
          <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-2 text-foreground">
                <ImageIcon className="w-4 h-4 text-primary" />
                Imagem da Capa ou Banner do Projeto
                <span className="text-[11px] font-normal text-muted-foreground">(Opcional)</span>
              </Label>
              {coverUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverUrl('')}
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 px-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Remover
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-1">
                <div className="aspect-[16/10] rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden relative">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Prévia da capa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-center p-2 text-muted-foreground flex flex-col items-center gap-1">
                      <FolderOpen className="w-6 h-6 opacity-40 text-emerald-500" />
                      <span className="text-[10px] leading-tight">Banner padrão ativo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <Tabs value={coverTab} onValueChange={(v) => setCoverTab(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-2 h-8 text-xs bg-muted">
                    <TabsTrigger value="url" className="text-xs gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      Link Web
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      Upload Imagem
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="pt-2">
                    <Input
                      placeholder="URL da imagem (ex: https://.../banner.jpg)"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </TabsContent>

                  <TabsContent value="upload" className="pt-2">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      className="hidden"
                      id="cover-proj-file-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="w-full h-9 text-xs gap-2 border-dashed"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      {isUploadingCover ? 'Enviando...' : 'Escolher imagem da capa'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSaving ? 'Salvando...' : project ? 'Salvar Alterações' : 'Adicionar Projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
