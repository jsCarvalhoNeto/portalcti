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
  PenTool, 
  FileText, 
  Upload, 
  Link2, 
  X, 
  Sparkles, 
  Award, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  Image as ImageIcon,
  FileDown,
  CheckSquare
} from 'lucide-react';
import { SubjectExercise, CreateExerciseData, subjectExerciseService } from '@/services/subjectExerciseService';
import { useToast } from '@/hooks/use-toast';
import fileUploadService from '@/services/fileUploadService';

interface SubjectExerciseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  exercise?: SubjectExercise | null;
  subjectId: number | string;
  subjectName?: string;
  subjectGrade?: string;
  onSave: (data: CreateExerciseData) => Promise<void>;
}

const EVALUATION_TYPES = [
  { value: 'Avaliação Parcial', label: 'Parcial', desc: 'Atividade prática do bimestre', color: 'text-amber-500' },
  { value: 'Avaliação Global', label: 'Global', desc: 'Atividade global de fechamento', color: 'text-purple-500' }
];

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

export default function SubjectExerciseEditor({
  isOpen,
  onClose,
  exercise,
  subjectId,
  subjectName = 'Disciplina',
  subjectGrade = '1º Ano',
  onSave
}: SubjectExerciseEditorProps) {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [evaluationType, setEvaluationType] = useState('Avaliação Parcial');
  const [period, setPeriod] = useState('1º Bimestre');
  const [grade, setGrade] = useState(subjectGrade || '1º Ano');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  
  // PDF
  const [pdfTab, setPdfTab] = useState<'upload' | 'url'>('upload');
  const [pdfPath, setPdfPath] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Capa
  const [coverTab, setCoverTab] = useState<'url' | 'upload'>('url');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (exercise) {
        setName(exercise.name || '');
        setEvaluationType(exercise.evaluation_type || 'Avaliação Parcial');
        setPeriod(exercise.period || '1º Bimestre');
        setGrade(exercise.grade || subjectGrade || '1º Ano');
        setDescription(exercise.description || '');
        setDeadline(exercise.deadline ? exercise.deadline.split('T')[0] : '');
        setPdfPath(exercise.file_path || '');
        setPdfName(exercise.file_name || (exercise.file_path ? 'exercicio.pdf' : ''));
        setCoverUrl(exercise.cover_url || '');
      } else {
        setName('');
        setEvaluationType('Avaliação Parcial');
        setPeriod('1º Bimestre');
        setGrade(subjectGrade || '1º Ano');
        setDescription('');
        setDeadline('');
        setPdfPath('');
        setPdfName('');
        setCoverUrl('');
      }
    }
  }, [isOpen, exercise, subjectGrade]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: 'Formato Inválido',
        description: 'Por favor, selecione um arquivo em formato PDF.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploadingPdf(true);
      toast({
        title: 'Enviando PDF...',
        description: 'Processando lista de exercícios.'
      });

      const res = await subjectExerciseService.uploadPdfFile(file);
      setPdfPath(res.fileUrl);
      setPdfName(res.fileName);

      toast({
        title: 'PDF Anexado',
        description: `Arquivo "${file.name}" anexado com sucesso.`
      });
    } catch (err) {
      console.error('Erro no upload do PDF:', err);
      toast({
        title: 'Erro ao Enviar PDF',
        description: 'Não foi possível carregar o arquivo PDF.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingPdf(false);
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
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
        description: 'Imagem da capa anexada com sucesso!'
      });
    } catch (err) {
      console.error('Erro no upload da capa:', err);
      toast({
        title: 'Erro no Upload',
        description: 'Não foi possível carregar a imagem.',
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
        description: 'Por favor, informe o título do exercício.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateExerciseData = {
        subject_id: Number(subjectId),
        name: name.trim(),
        grade: grade || '1º Ano',
        period: period || '1º Bimestre',
        evaluation_type: evaluationType,
        description: description.trim(),
        deadline: deadline || null,
        file_path: pdfPath.trim() || null,
        file_name: pdfName.trim() || (pdfPath ? 'exercicio.pdf' : null),
        cover_url: coverUrl.trim() || undefined
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar exercício:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {exercise ? 'Editar Exercício' : 'Adicionar Novo Exercício'}
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre listas de exercícios para {subjectName}, informando período, série, tipo e anexo do PDF.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Título do Exercício */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-name" className="text-xs font-bold">
              Título do Exercício / Lista *
            </Label>
            <Input
              id="ex-name"
              placeholder="Ex: Lista de Exercícios 02 - Seletores e Flexbox no CSS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-sm"
            />
          </div>

          {/* Tipo, Período e Série */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tipo (Parcial vs Global) */}
            <div className="space-y-1.5">
              <Label htmlFor="ex-type" className="text-xs font-bold">
                Abrangência *
              </Label>
              <Select value={evaluationType} onValueChange={setEvaluationType}>
                <SelectTrigger id="ex-type" className="h-10 text-sm">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {EVALUATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className={`font-semibold ${t.color}`}>{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período / Bimestre */}
            <div className="space-y-1.5">
              <Label htmlFor="ex-period" className="text-xs font-bold">
                Período do Exercício *
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="ex-period" className="h-10 text-sm">
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

            {/* Série */}
            <div className="space-y-1.5">
              <Label htmlFor="ex-grade" className="text-xs font-bold">
                Série / Ano *
              </Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="ex-grade" className="h-10 text-sm">
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

          {/* Disciplina e Prazo de Entrega */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                Disciplina
              </Label>
              <div className="h-10 px-3 flex items-center bg-muted/40 border rounded-md text-sm font-semibold text-foreground">
                {subjectName}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ex-deadline" className="text-xs font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Data Limite para Entrega
              </Label>
              <Input
                id="ex-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Anexar PDF do Exercício */}
          <div className="border rounded-xl p-4 bg-orange-500/5 border-orange-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                Arquivo PDF da Lista de Exercícios
              </Label>
              {pdfPath && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPdfPath('');
                    setPdfName('');
                  }}
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 px-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Remover PDF
                </Button>
              )}
            </div>

            {/* Informação do PDF Atual */}
            {pdfPath ? (
              <div className="p-3 bg-background border rounded-lg flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-foreground truncate">{pdfName || 'exercicio.pdf'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">Arquivo anexado e disponível para download</p>
                  </div>
                </div>
                <a
                  href={pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Visualizar PDF
                </a>
              </div>
            ) : null}

            {/* Opções de Upload ou URL do PDF */}
            <Tabs value={pdfTab} onValueChange={(v) => setPdfTab(v as any)} className="w-full">
              <TabsList className="grid grid-cols-2 h-8 text-xs bg-muted">
                <TabsTrigger value="upload" className="text-xs gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  Upload do PDF (PC)
                </TabsTrigger>
                <TabsTrigger value="url" className="text-xs gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  Link do PDF (Web)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="pt-2 space-y-2">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                  id="pdf-ex-file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={isUploadingPdf}
                  className="w-full h-10 text-xs gap-2 border-dashed font-semibold"
                >
                  <Upload className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  {isUploadingPdf ? 'Enviando PDF...' : 'Selecionar lista em PDF do computador'}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Anexe o roteiro da atividade prática ou lista de exercícios em PDF.
                </p>
              </TabsContent>

              <TabsContent value="url" className="pt-2 space-y-2">
                <Input
                  placeholder="Cole o link do PDF (ex: link do Google Drive ou link direto)"
                  value={pdfPath}
                  onChange={(e) => {
                    setPdfPath(e.target.value);
                    if (!pdfName) setPdfName('exercicio.pdf');
                  }}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Você pode usar links de documentos armazenados na nuvem.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Imagem de Capa (Opcional) */}
          <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-2 text-foreground">
                <ImageIcon className="w-4 h-4 text-primary" />
                Imagem de Capa ou Banner da Atividade
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
                      <PenTool className="w-6 h-6 opacity-40 text-orange-500" />
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
                      placeholder="URL da imagem (ex: https://.../capa.jpg)"
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
                      id="cover-ex-file-input"
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

          {/* Orientações e Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-desc" className="text-xs font-bold">
              Instruções de Resolução e Enunciado
            </Label>
            <Textarea
              id="ex-desc"
              rows={3}
              placeholder="Descreva as orientações para os alunos: como resolver, ferramentas necessárias (VS Code, simulador, etc.), formato de envio e critérios..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm resize-y"
            />
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
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              {isSaving ? 'Salvando...' : exercise ? 'Salvar Alterações' : 'Adicionar Exercício'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
