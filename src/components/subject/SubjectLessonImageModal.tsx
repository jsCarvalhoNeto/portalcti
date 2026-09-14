import React, { useState, useRef } from 'react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ImageIcon, 
  Upload, 
  Link2, 
  Check, 
  Loader2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import fileUploadService from '@/services/fileUploadService';

interface SubjectLessonImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (markdownSnippet: string) => void;
}

export default function SubjectLessonImageModal({
  isOpen,
  onClose,
  onInsertImage
}: SubjectLessonImageModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [altText, setAltText] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imageAlignment, setImageAlignment] = useState<'default' | 'center' | 'full'>('center');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setAltText('');
    setImageUrl('');
    setIsUploading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione um arquivo de imagem (PNG, JPG, WebP ou GIF).',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Sugere legenda baseada no nome do arquivo
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setAltText(fileNameWithoutExt);
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadAndInsert = async () => {
    if (!selectedFile) {
      toast({
        title: 'Nenhuma imagem selecionada',
        description: 'Selecione um arquivo de imagem para fazer o upload.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploading(true);
      let finalUrl = '';

      try {
        // Tenta upload no endpoint do servidor
        finalUrl = await fileUploadService.uploadImage(selectedFile);
      } catch (uploadError) {
        console.warn('Upload via API falhou, utilizando fallback Base64 embutido:', uploadError);
        // Fallback garantido: converte para Data URL (Base64)
        finalUrl = await readFileAsDataUrl(selectedFile);
      }

      const caption = altText.trim() || 'Imagem da aula';
      let snippet = '';

      if (imageAlignment === 'center') {
        snippet = `\n\n<div align="center">\n  <img src="${finalUrl}" alt="${caption}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />\n  <p><em>${caption}</em></p>\n</div>\n\n`;
      } else {
        snippet = `\n\n![${caption}](${finalUrl})\n\n`;
      }

      onInsertImage(snippet);
      toast({
        title: 'Imagem inserida!',
        description: 'A imagem foi adicionada com sucesso ao conteúdo da aula.',
      });

      handleClose();
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      toast({
        title: 'Erro ao inserir imagem',
        description: 'Ocorreu um erro ao carregar o arquivo.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlInsert = () => {
    if (!imageUrl.trim()) {
      toast({
        title: 'URL obrigatória',
        description: 'Informe a URL direta da imagem na internet.',
        variant: 'destructive'
      });
      return;
    }

    const caption = altText.trim() || 'Imagem da aula';
    let snippet = '';

    if (imageAlignment === 'center') {
      snippet = `\n\n<div align="center">\n  <img src="${imageUrl.trim()}" alt="${caption}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />\n  <p><em>${caption}</em></p>\n</div>\n\n`;
    } else {
      snippet = `\n\n![${caption}](${imageUrl.trim()})\n\n`;
    }

    onInsertImage(snippet);
    toast({
      title: 'Imagem inserida!',
      description: 'A imagem da URL foi adicionada ao conteúdo da aula.',
    });

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <ImageIcon className="w-5 h-5 text-primary" />
            Inserir Imagem na Aula
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Adicione diagramas, fotos, capturas de tela ou esquemas gráficos para enriquecer a explicação.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload" className="text-xs flex items-center gap-1.5 font-semibold">
              <Upload className="w-3.5 h-3.5" />
              Upload do Computador
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs flex items-center gap-1.5 font-semibold">
              <Link2 className="w-3.5 h-3.5" />
              Link da Internet (URL)
            </TabsTrigger>
          </TabsList>

          {/* Aba 1: Upload do Computador */}
          <TabsContent value="upload" className="space-y-4 pt-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-all bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center gap-2.5"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    Clique para selecionar uma imagem
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP ou GIF (suporta até 10 MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl border bg-card/60 p-2 overflow-hidden flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Pré-visualização"
                    className="max-h-48 max-w-full object-contain rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs mt-2 text-primary"
                  >
                    Trocar arquivo selecionado
                  </Button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="upload-alt-text" className="text-xs font-semibold">
                    Legenda ou Descrição da Imagem
                  </Label>
                  <Input
                    id="upload-alt-text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Ex: Diagrama de barramento de dados"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba 2: Link da Internet (URL) */}
          <TabsContent value="url" className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="image-url" className="text-xs font-semibold">
                URL da Imagem
              </Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/diagrama.png"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="url-alt-text" className="text-xs font-semibold">
                Legenda ou Descrição da Imagem
              </Label>
              <Input
                id="url-alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Ex: Arquitetura de Von Neumann"
                className="h-8 text-xs"
              />
            </div>

            {imageUrl.trim() && (
              <div className="rounded-xl border bg-card/60 p-2 flex flex-col items-center">
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">
                  Pré-visualização do Link:
                </p>
                <img
                  src={imageUrl.trim()}
                  alt="Pré-visualização"
                  className="max-h-40 max-w-full object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Opção de Apresentação / Alinhamento */}
        <div className="pt-2 border-t flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">
            Formato de Exibição:
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={imageAlignment === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImageAlignment('center')}
              className="h-7 text-xs px-2.5"
            >
              Centralizado com Legenda
            </Button>
            <Button
              type="button"
              variant={imageAlignment === 'default' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setImageAlignment('default')}
              className="h-7 text-xs px-2.5"
            >
              Markdown Padrão
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isUploading}
            className="text-xs"
          >
            Cancelar
          </Button>

          {activeTab === 'upload' ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleUploadAndInsert}
              disabled={!selectedFile || isUploading}
              className="text-xs font-semibold gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Inserindo...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Inserir Imagem na Aula
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleUrlInsert}
              disabled={!imageUrl.trim()}
              className="text-xs font-semibold gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Inserir Imagem na Aula
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
