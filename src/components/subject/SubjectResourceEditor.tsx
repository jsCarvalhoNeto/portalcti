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
  BookOpen, 
  Video, 
  FileText, 
  Globe, 
  Download, 
  ExternalLink, 
  Image as ImageIcon, 
  Upload, 
  Link2, 
  X, 
  Check, 
  Sparkles, 
  Layers, 
  FolderArchive,
  Wrench,
  HelpCircle,
  FileDown
} from 'lucide-react';
import { SubjectResource, CreateResourceData } from '@/services/subjectResourceService';
import { useToast } from '@/hooks/use-toast';
import fileUploadService from '@/services/fileUploadService';

interface SubjectResourceEditorProps {
  isOpen: boolean;
  onClose: () => void;
  resource?: SubjectResource | null;
  subjectId: number | string;
  subjectName?: string;
  onSave: (data: CreateResourceData) => Promise<void>;
}

const RESOURCE_TYPES = [
  { value: 'livro', label: 'Livro / Apostila', icon: BookOpen, color: 'text-blue-500' },
  { value: 'video', label: 'Vídeo / Videoaula', icon: Video, color: 'text-red-500' },
  { value: 'artigo', label: 'Artigo / Publicação', icon: FileText, color: 'text-emerald-500' },
  { value: 'site', label: 'Site / Portal Web', icon: Globe, color: 'text-purple-500' },
  { value: 'software', label: 'Software / Ferramenta', icon: Wrench, color: 'text-cyan-500' },
  { value: 'outro', label: 'Outro Material', icon: FolderArchive, color: 'text-amber-500' },
];

export default function SubjectResourceEditor({
  isOpen,
  onClose,
  resource,
  subjectId,
  subjectName = 'Disciplina',
  onSave
}: SubjectResourceEditorProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('livro');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [url, setUrl] = useState('');
  
  // Abas de imagem de capa (URL ou Upload)
  const [coverTab, setCoverTab] = useState<'url' | 'upload'>('url');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (resource) {
        setTitle(resource.title || '');
        setResourceType(resource.resource_type || 'livro');
        setDescription(resource.description || '');
        setCoverUrl(resource.cover_url || '');
        setDownloadUrl(resource.download_url || resource.file_path || '');
        setUrl(resource.url || '');
      } else {
        setTitle('');
        setResourceType('livro');
        setDescription('');
        setCoverUrl('');
        setDownloadUrl('');
        setUrl('');
      }
    }
  }, [isOpen, resource]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem válida (PNG, JPG, WebP, etc.).',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploadingCover(true);
      let uploadedUrl = '';
      try {
        uploadedUrl = await fileUploadService.uploadImage(file);
      } catch (err) {
        console.warn('Upload via API local falhou, convertendo imagem para Base64:', err);
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
        description: 'A imagem da capa foi carregada com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao carregar capa:', error);
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível carregar a imagem da capa.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Título Obrigatório',
        description: 'Por favor, informe o título do recurso.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateResourceData = {
        subject_id: Number(subjectId),
        title: title.trim(),
        resource_type: resourceType,
        description: description.trim(),
        cover_url: coverUrl.trim() || undefined,
        download_url: downloadUrl.trim() || undefined,
        url: url.trim() || undefined
      };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar recurso:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const SelectedIcon = RESOURCE_TYPES.find(t => t.value === resourceType)?.icon || BookOpen;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {resource ? 'Editar Recurso Didático' : 'Adicionar Novo Recurso'}
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre livros, videoaulas, artigos ou links úteis para a disciplina {subjectName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Título e Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="res-title" className="text-xs font-bold flex items-center gap-1.5">
                Título do Recurso *
              </Label>
              <Input
                id="res-title"
                placeholder="Ex: Arquitetura e Organização de Computadores - 8ª Edição"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="res-type" className="text-xs font-bold">
                Tipo de Recurso
              </Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger id="res-type" className="h-10 text-sm">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${type.color}`} />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Imagem da Capa */}
          <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-2 text-foreground">
                <ImageIcon className="w-4 h-4 text-primary" />
                Imagem da Capa ou Banner
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
                  Remover Capa
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Preview da Capa */}
              <div className="sm:col-span-1">
                <div className="aspect-[3/4] max-h-[160px] rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/40 overflow-hidden relative group">
                  {coverUrl ? (
                    <>
                      <img
                        src={coverUrl}
                        alt="Prévia da capa"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold px-2 py-1 bg-black/60 rounded">
                          Prévia
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3 text-muted-foreground flex flex-col items-center gap-1.5">
                      <SelectedIcon className="w-8 h-8 opacity-40" />
                      <span className="text-[11px] leading-tight">Sem imagem anexada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Opções de Inserção da Capa */}
              <div className="sm:col-span-2 space-y-3">
                <Tabs value={coverTab} onValueChange={(v) => setCoverTab(v as any)} className="w-full">
                  <TabsList className="grid grid-cols-2 h-8 text-xs bg-muted">
                    <TabsTrigger value="url" className="text-xs gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      Link da Web
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      Upload do PC
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="pt-2 space-y-2">
                    <Input
                      placeholder="Cole a URL da capa (ex: https://.../capa.jpg)"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      className="h-9 text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dica: você pode colar links de imagens do Google, Unsplash ou capas oficiais de livros.
                    </p>
                  </TabsContent>

                  <TabsContent value="upload" className="pt-2 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="cover-file-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="w-full h-9 text-xs gap-2 border-dashed"
                    >
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      {isUploadingCover ? 'Enviando imagem...' : 'Escolher arquivo de imagem'}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      Formatos aceitos: JPG, PNG, WEBP, GIF.
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="res-desc" className="text-xs font-bold">
              Descrição / Resumo do Conteúdo
            </Label>
            <Textarea
              id="res-desc"
              rows={3}
              placeholder="Descreva brevemente este material (autor, edição, tópicos principais abordados, como o aluno deve utilizar)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm resize-y"
            />
          </div>

          {/* Links: Acesso e Download */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Link de Acesso / Site */}
            <div className="space-y-1.5">
              <Label htmlFor="res-url" className="text-xs font-bold flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                Link de Acesso / Site / Vídeo
              </Label>
              <Input
                id="res-url"
                type="url"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-10 text-xs"
              />
              <span className="text-[11px] text-muted-foreground block">
                Link para abrir o site, repositório ou vídeo no YouTube.
              </span>
            </div>

            {/* Link para Download */}
            <div className="space-y-1.5">
              <Label htmlFor="res-download" className="text-xs font-bold flex items-center gap-1.5">
                <FileDown className="w-3.5 h-3.5 text-emerald-500" />
                Link para Download do Arquivo / PDF
              </Label>
              <Input
                id="res-download"
                type="url"
                placeholder="https://... (Google Drive, PDF, ZIP)"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                className="h-10 text-xs"
              />
              <span className="text-[11px] text-muted-foreground block">
                Link direto para o aluno baixar o livro, material ou arquivo.
              </span>
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {isSaving ? 'Salvando...' : resource ? 'Salvar Alterações' : 'Adicionar Recurso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
