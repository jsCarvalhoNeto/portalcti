import { API_URL } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import MarkdownEditor from '@/components/MarkdownEditor';
import { useTeacherDashboard } from '@/contexts/TeacherDashboardContext';
import { createActivity } from '@/services/activityService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface NewActivityModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function NewActivityModal({ isOpen, onOpenChange }: NewActivityModalProps) {
  const { subjects, grades, refetch } = useTeacherDashboard();

  // Snapshots locais para evitar que a lista de itens mude durante o ciclo de vida do modal
  const [subjectsSnapshot, setSubjectsSnapshot] = useState(subjects);
  const [gradesSnapshot, setGradesSnapshot] = useState(grades);

  // Corrige desmontagem abrupta do Select ao fechar o Dialog
  useEffect(() => {
    let timeout: number | undefined;
    if (isOpen) {
      setSubjectsSnapshot(subjects);
      setGradesSnapshot(grades);
    } else {
      // Aguarda animação do Dialog antes de limpar snapshots
      timeout = setTimeout(() => {
        setSubjectsSnapshot([]);
        setGradesSnapshot([]);
      }, 300); // 300ms = tempo típico de animação do Dialog
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOpen, subjects, grades]);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activityName, setActivityName] = useState('');
 const [selectedSubject, setSelectedSubject] = useState('');
 const [selectedGrade, setSelectedGrade] = useState('');
 const [activityType, setActivityType] = useState<'individual' | 'team'>('individual');
  const [description, setDescription] = useState('');
   const [deadline, setDeadline] = useState('');

  // ...

  // Função para converter datetime-local para ISO string (formato que o backend espera)
  const convertToISO = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    const date = new Date(datetimeLocal);
    return date.toISOString();
  };
 const [period, setPeriod] = useState('');
  const [evaluationType, setEvaluationType] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [autoGradeEnabled, setAutoGradeEnabled] = useState(false);
  const [autoGradeValue, setAutoGradeValue] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validação de tipo de arquivo expandida (MIME types e extensões)
      const allowedTypes = [
        'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/javascript',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip', 'application/x-zip-compressed', 'application/x-zip', 'multipart/x-zip',
        'application/x-rar-compressed', 'application/vnd.rar', 'application/x-7z-compressed',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'text/x-python', 'text/x-java-source', 'text/markdown', 'application/json', 'application/xml'
      ];

      const allowedExtensions = [
        '.pdf', '.txt', '.html', '.css', '.js', '.py', '.sql', '.java', '.c', '.cpp', '.cs',
        '.php', '.rb', '.go', '.ts', '.md', '.json', '.xml', '.ppt', '.pptx', '.doc', '.docx',
        '.xls', '.xlsx', '.zip', '.rar', '.7z', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
      ];
      
      // Verificar se todos os arquivos são válidos (por MIME type ou por extensão)
      const invalidFiles = selectedFiles.filter(file => {
        const hasValidType = allowedTypes.includes(file.type);
        const hasValidExt = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        return !hasValidType && !hasValidExt;
      });
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: `Arquivos inválidos: ${invalidFiles.map(f => f.name).join(', ')}. Formatos permitidos: PDF, TXT, HTML, CSS, JS, Python, SQL, Java, C/C++, PHP, DOC, XLS, PPT, ZIP, imagens`,
          variant: "destructive",
        });
        return;
      }

      // Verificar limite de arquivos (máximo 10 para professores)
      if (selectedFiles.length > 10) {
        toast({
          title: "Muitos arquivos selecionados",
          description: "Máximo de 10 arquivos permitidos por atividade.",
          variant: "destructive",
        });
        return;
      }

      // Verificar tamanho dos arquivos (máximo 50MB por arquivo)
      const oversizedFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast({
          title: "Arquivo muito grande",
          description: `Arquivos muito grandes (máx. 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      setFiles(selectedFiles);
      
      toast({
        title: "Arquivos selecionados",
        description: `${selectedFiles.length} arquivo(s) selecionado(s) com sucesso.`,
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Usar ref para saber se o modal estava aberto
  const wasOpen = useRef(isOpen);

  const resetForm = () => {
    setActivityName('');
    setSelectedSubject('');
    setSelectedGrade('');
    setActivityType('individual');
    setDescription('');
    setDeadline('');
    setPeriod('');
    setEvaluationType('');
    setFiles([]);
    setAutoGradeEnabled(false);
    setAutoGradeValue('10');
  };

  // Limpar o formulário apenas quando o modal for fechado
  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      resetForm();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!activityName || !selectedSubject || !selectedGrade || !user) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const autoGradeNum = parseFloat(autoGradeValue);
    if (autoGradeEnabled && (isNaN(autoGradeNum) || autoGradeNum < 0 || autoGradeNum > 10)) {
      toast({
        title: "Nota Inválida",
        description: "Por favor, informe uma nota automática válida entre 0 e 10.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createActivity({
        name: activityName,
        subject_id: parseInt(selectedSubject, 10),
        grade: selectedGrade,
        type: activityType,
        description: description || undefined,
        deadline: deadline ? convertToISO(deadline) : undefined,
        period: period || undefined,
        evaluation_type: evaluationType || undefined,
        auto_grade_enabled: autoGradeEnabled,
        auto_grade_value: autoGradeEnabled ? autoGradeNum : null,
        rawFiles: files.length > 0 ? files : undefined
      });

      toast({
        title: "Sucesso!",
        description: "A atividade foi criada com sucesso.",
      });
      
      refetch.activities();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a atividade. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Atividade</DialogTitle>
          <DialogDescription>
            Preencha as informações abaixo para criar uma nova atividade para seus alunos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="col-span-3"
              placeholder="Ex: Prova de Matemática"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Disciplina
            </Label>
            <Select onValueChange={setSelectedSubject} value={selectedSubject} disabled={!subjectsSnapshot || subjectsSnapshot.length === 0}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={subjectsSnapshot && subjectsSnapshot.length > 0 ? "Selecione a disciplina" : "Nenhuma disciplina disponível"} />
              </SelectTrigger>
              <SelectContent>
                {subjectsSnapshot && subjectsSnapshot.length > 0 ? subjectsSnapshot.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                )) : []}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grade" className="text-right">
              Série
            </Label>
            <Select onValueChange={setSelectedGrade} value={selectedGrade}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a série" />
              </SelectTrigger>
              <SelectContent>
                {/* Supondo que 'grades' seja um array de strings como ['1º Ano', '2º Ano'] */}
                {gradesSnapshot && gradesSnapshot.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="period" className="text-right">
              Período
            </Label>
            <Select onValueChange={setPeriod} value={period}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1º Período">1º Período</SelectItem>
                <SelectItem value="2º Período">2º Período</SelectItem>
                <SelectItem value="3º Período">3º Período</SelectItem>
                <SelectItem value="4º Período">4º Período</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="evaluation_type" className="text-right">
              Tipo de Avaliação
            </Label>
            <Select onValueChange={setEvaluationType} value={evaluationType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o tipo de avaliação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Avaliação Parcial">Avaliação Parcial</SelectItem>
                <SelectItem value="Avaliação Global">Avaliação Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Tipo</Label>
            <RadioGroup
              defaultValue="individual"
              className="col-span-3 flex items-center gap-4"
              onValueChange={(value) => setActivityType(value as 'individual' | 'team')}
              value={activityType}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="r1" />
                <Label htmlFor="r1">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="team" id="r2" />
                <Label htmlFor="r2">Em equipe</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2 font-semibold">
              Descrição
            </Label>
            <div className="col-span-3">
              <MarkdownEditor
                value={typeof description === 'string' ? description : ''}
                onChange={(val) => setDescription(val)}
                placeholder="Cole ou digite aqui a descrição em Markdown da atividade..."
                minHeight="min-h-[200px]"
                maxHeight="max-h-[360px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deadline" className="text-right">
              Data Final
            </Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4 p-3 rounded-lg border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10">
            <div className="text-right flex items-center justify-end gap-1.5 pt-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <Label htmlFor="auto_grade" className="font-semibold text-xs text-amber-900 dark:text-amber-300">
                Nota Automática
              </Label>
            </div>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto_grade"
                    checked={autoGradeEnabled}
                    onCheckedChange={setAutoGradeEnabled}
                  />
                  <Label htmlFor="auto_grade" className="text-xs cursor-pointer font-medium">
                    Atribuir nota automaticamente ao aluno enviar
                  </Label>
                </div>
                {autoGradeEnabled && (
                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300">
                    Ativo: {autoGradeValue}
                  </Badge>
                )}
              </div>
              {autoGradeEnabled && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Nota padrão atribuída no envio:</span>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={autoGradeValue}
                    onChange={(e) => setAutoGradeValue(e.target.value)}
                    className="w-20 h-8 text-xs text-center"
                    placeholder="10"
                  />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Quando ativado, os alunos que submeterem esta atividade receberão esta nota automaticamente no momento do envio.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="files" className="text-right">
              Arquivos
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="files"
                type="file"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.txt,.html,.css,.js,.py,.sql,.java,.c,.cpp,.cs,.php,.rb,.go,.ts,.md,.json,.xml,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.rar,.7z,.jpg,.jpeg,.png,.gif,.webp,.svg"
              />
              <p className="text-xs text-muted-foreground">
                📁 Selecione até 10 arquivos (máx. 10MB cada). Suporta códigos, documentos, imagens e compactados.
              </p>
              
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">
                    {files.length} arquivo(s) selecionado(s):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">📄</span>
                          <span className="text-gray-100">{file.name}</span>
                          <span className="text-xs text-gray-400">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
            onOpenChange(false);
          }}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Atividade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
