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
  CheckCircle2,
  FileDown,
  AlertCircle
} from 'lucide-react';
import { SubjectEvaluation, CreateEvaluationData, subjectEvaluationService } from '@/services/subjectEvaluationService';
import { useToast } from '@/hooks/use-toast';
import fileUploadService from '@/services/fileUploadService';

interface SubjectEvaluationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation?: SubjectEvaluation | null;
  subjectId: number | string;
  subjectName?: string;
  subjectGrade?: string;
  onSave: (data: CreateEvaluationData) => Promise<void>;
}

const EVALUATION_TYPES = [
  { value: 'Avaliação Parcial', label: 'Avaliação Parcial', desc: 'Instrumento parcial do bimestre', color: 'text-amber-500' },
  { value: 'Avaliação Global', label: 'Avaliação Global', desc: 'Instrumento global / prova final', color: 'text-purple-500' }
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

export default function SubjectEvaluationEditor({
  isOpen,
  onClose,
  evaluation,
  subjectId,
  subjectName = 'Disciplina',
  subjectGrade = '1º Ano',
  onSave
}: SubjectEvaluationEditorProps) {
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
      if (evaluation) {
        setName(evaluation.name || '');
        setEvaluationType(evaluation.evaluation_type || 'Avaliação Parcial');
        setPeriod(evaluation.period || '1º Bimestre');
        setGrade(evaluation.grade || subjectGrade || '1º Ano');
        setDescription(evaluation.description || '');
        setDeadline(evaluation.deadline ? evaluation.deadline.split('T')[0] : '');
        setPdfPath(evaluation.file_path || '');
        setPdfName(evaluation.file_name || (evaluation.file_path ? 'avaliacao.pdf' : ''));
        setCoverUrl(evaluation.cover_url || '');
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
  }, [isOpen, evaluation, subjectGrade]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast({
        title: 'Formato Inválido',
        description: 'Por favor, selecione um arquivo no formato PDF.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsUploadingPdf(true);
      toast({
        title: 'Enviando PDF...',
        description: 'Processando arquivo de avaliação.'
      });

      const res = await subjectEvaluationService.uploadPdfFile(file);
      setPdfPath(res.fileUrl);
      setPdfName(res.fileName);

      toast({
        title: 'PDF Anexado com Sucesso',
        description: `Arquivo "${file.name}" pronto para salvar.`
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
        description: 'Imagem de capa anexada à avaliação com sucesso!'
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
        description: 'Por favor, informe o título da avaliação.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload: CreateEvaluationData = {
        subject_id: Number(subjectId),
        name: name.trim(),
        grade: grade || '1º Ano',
        period: period || '1º Bimestre',
        evaluation_type: evaluationType,
        description: description.trim(),
        deadline: deadline || null,
        file_path: pdfPath.trim() || null,
        file_name: pdfName.trim() || (pdfPath ? 'avaliacao.pdf' : null),
        cover_url: coverUrl.trim() || undefined
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {evaluation ? 'Editar Avaliação' : 'Adicionar Nova Avaliação'}
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cadastre a avaliação para {subjectName}, informando o tipo, período, série e anexando o PDF.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Título da Avaliação */}
          <div className="space-y-1.5">
            <Label htmlFor="eval-name" className="text-xs font-bold">
              Título da Avaliação *
            </Label>
            <Input
              id="eval-name"
              placeholder="Ex: Avaliação Parcial - Introdução aos Circuitos e Memórias"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-10 text-sm"
            />
          </div>

          {/* Tipo de Avaliação, Período e Série */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tipo (Parcial vs Global) */}
            <div className="space-y-1.5">
              <Label htmlFor="eval-type" className="text-xs font-bold">
                Tipo de Avaliação *
              </Label>
              <Select value={evaluationType} onValueChange={setEvaluationType}>
                <SelectTrigger id="eval-type" className="h-10 text-sm">
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
              <Label htmlFor="eval-period" className="text-xs font-bold">
                Período / Bimestre *
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="eval-period" className="h-10 text-sm">
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
              <Label htmlFor="eval-grade" className="text-xs font-bold">
                Série / Ano *
              </Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="eval-grade" className="h-10 text-sm">
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

          {/* Disciplina e Data da Prova */}
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
              <Label htmlFor="eval-deadline" className="text-xs font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Data Agendada da Prova
              </Label>
              <Input
                id="eval-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
          </div>

          {/* Anexar PDF da Avaliação */}
          <div className="border rounded-xl p-4 bg-purple-500/5 border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Arquivo PDF da Prova / Avaliação
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
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-foreground truncate">{pdfName || 'avaliacao.pdf'}</p>
                    <p className="text-[11px] text-muted-foreground truncate">Arquivo anexado pronto para visualização</p>
                  </div>
                </div>
                <a
                  href={pdfPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Testar PDF
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
                  id="pdf-file-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => pdfInputRef.current?.click()}
                  disabled={isUploadingPdf}
                  className="w-full h-10 text-xs gap-2 border-dashed font-semibold"
                >
                  <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  {isUploadingPdf ? 'Enviando PDF...' : 'Selecionar arquivo PDF do computador'}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Selecione o arquivo da prova ou questionário em formato PDF para que os alunos possam visualizar ou baixar.
                </p>
              </TabsContent>

              <TabsContent value="url" className="pt-2 space-y-2">
                <Input
                  placeholder="Cole o link do PDF (ex: https://.../prova.pdf ou link do Google Drive)"
                  value={pdfPath}
                  onChange={(e) => {
                    setPdfPath(e.target.value);
                    if (!pdfName) setPdfName('avaliacao.pdf');
                  }}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Você pode usar links de documentos armazenados no Google Drive, OneDrive ou servidores da escola.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Imagem de Capa (Opcional) */}
          <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-2 text-foreground">
                <ImageIcon className="w-4 h-4 text-primary" />
                Imagem de Capa ou Banner da Prova
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
                      <Award className="w-6 h-6 opacity-40 text-purple-500" />
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
                      id="cover-eval-file-input"
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
            <Label htmlFor="eval-desc" className="text-xs font-bold">
              Orientações da Avaliação / Conteúdo Programático
            </Label>
            <Textarea
              id="eval-desc"
              rows={3}
              placeholder="Descreva as instruções para a realização da prova, capítulos e tópicos que serão cobrados, critérios de correção, etc."
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {isSaving ? 'Salvando...' : evaluation ? 'Salvar Alterações' : 'Adicionar Avaliação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
