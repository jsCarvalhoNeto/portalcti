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
import { htmlToMarkdown } from '@/utils/markdownUtils';
import { useTeacherDashboard, Activity } from '@/contexts/TeacherDashboardContext';
import { updateActivity, deleteActivity, ActivityData } from '@/services/activityService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface EditActivityModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  activity: Activity | null;
}

export default function EditActivityModal({ isOpen, onOpenChange, activity }: EditActivityModalProps) {
  const { subjects, grades, refetch } = useTeacherDashboard();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activityName, setActivityName] = useState('');
 const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
 const [activityType, setActivityType] = useState<'individual' | 'team'>('individual');
  const [description, setDescription] = useState('');
   const [deadline, setDeadline] = useState('');

  // Função para formatar data para o formato datetime-local (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Verificar se a data é válida
    if (isNaN(date.getTime())) return '';
    // Formatar para YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Função para converter datetime-local para ISO string (formato que o backend espera)
  const convertToISO = (datetimeLocal: string): string => {
    if (!datetimeLocal) return '';
    const date = new Date(datetimeLocal);
    return date.toISOString();
  };
 const [period, setPeriod] = useState('');
  const [evaluationType, setEvaluationType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [autoGradeEnabled, setAutoGradeEnabled] = useState(false);
  const [autoGradeValue, setAutoGradeValue] = useState('10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Atualiza os campos sempre que a atividade for carregada ou o modal for aberto
  useEffect(() => {
    if (activity && isOpen) {
      setActivityName(activity.name || '');
      setSelectedSubject(activity.subject_id?.toString() || '');
      setSelectedGrade(activity.grade || '');
      setActivityType(activity.type || 'individual');
      const rawDesc = activity.description || '';
      const cleanDesc = (rawDesc.includes('<p>') || rawDesc.includes('<br>') || rawDesc.includes('<div>')) 
        ? htmlToMarkdown(rawDesc) 
        : rawDesc;
      setDescription(cleanDesc);
      setDeadline(activity.deadline ? formatDateTimeLocal(activity.deadline) : '');
      setPeriod(activity.period || '');
      setEvaluationType(activity.evaluation_type || '');
      setFileName(activity.file_name || '');
      setFile(null);
      setAutoGradeEnabled(Boolean(activity.auto_grade_enabled));
      setAutoGradeValue(activity.auto_grade_value != null ? String(activity.auto_grade_value) : '10');
    }
  }, [activity, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validação de tipo de arquivo
      const allowedTypes = [
        'application/pdf', 'text/plain', 'application/vnd.ms-powerpoint', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip', 'application/x-zip-compressed', 'application/x-zip', 'multipart/x-zip',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp'
      ];
      const allowedExtensions = ['.pdf', '.txt', '.ppt', '.pptx', '.doc', '.docx', '.zip', '.jpg', '.jpeg', '.png', '.gif', '.webp'];

      const hasValidType = allowedTypes.includes(selectedFile.type);
      const hasValidExt = allowedExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
      
      if (!hasValidType && !hasValidExt) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Formatos permitidos: PDF, TXT, PPT, PPTX, DOC, DOCX, ZIP, JPG, PNG, GIF, WEBP",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleDeleteActivity = async () => {
    if (!activity) return;

    const confirmed = window.confirm(
      `ATENÇÃO: Você está prestes a excluir permanentemente a atividade "${activity.name}".\n\n` +
      `Esta ação irá remover:\n` +
      `- A atividade em si\n` +
      `- Todas as submissões dos alunos\n` +
      `- Todas as notas atribuídas\n` +
      `- Os arquivos enviados pelos alunos\n\n` +
      `Esta ação não pode ser desfeita e afetará permanentemente os registros acadêmicos. Deseja continuar?`
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        await deleteActivity(parseInt(activity.id));
        toast({
          title: "Sucesso!",
          description: "Atividade excluída com sucesso.",
        });
        refetch.activities();
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível excluir atividade. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!activityName || !selectedSubject || !selectedGrade || !user || !activity) {
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
      const activityData: ActivityData = {
        name: activityName,
        subject_id: parseInt(selectedSubject, 10),
        grade: selectedGrade,
        type: activityType,
        description: description || undefined,
        deadline: deadline ? convertToISO(deadline) : null,
        period: period || undefined,
        evaluation_type: evaluationType || undefined,
        file_path: activity.file_path || undefined,
        file_name: activity.file_name || undefined,
        auto_grade_enabled: autoGradeEnabled,
        auto_grade_value: autoGradeEnabled ? autoGradeNum : null,
        rawFiles: file ? [file] : undefined
      };

      await updateActivity(parseInt(activity.id), activityData);

      toast({
        title: "Sucesso!",
        description: "A atividade foi atualizada com sucesso.",
      });
      
      refetch.activities();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a atividade. Tente novamente.",
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
          <DialogTitle>Editar Atividade</DialogTitle>
          <DialogDescription>
            Atualize as informações da atividade abaixo.
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
            <Select onValueChange={setSelectedSubject} value={selectedSubject} disabled={!subjects || subjects.length === 0}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={subjects && subjects.length > 0 ? "Selecione a disciplina" : "Nenhuma disciplina disponível"} />
              </SelectTrigger>
              <SelectContent>
                {subjects && subjects.length > 0 ? subjects.map((subject) => (
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
                {grades && grades.map((grade) => (
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
              defaultValue={activityType}
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
              <Label htmlFor="edit_auto_grade" className="font-semibold text-xs text-amber-900 dark:text-amber-300">
                Nota Automática
              </Label>
            </div>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit_auto_grade"
                    checked={autoGradeEnabled}
                    onCheckedChange={setAutoGradeEnabled}
                  />
                  <Label htmlFor="edit_auto_grade" className="text-xs cursor-pointer font-medium">
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
            <Label htmlFor="file" className="text-right">
              Arquivo
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.txt,.ppt,.pptx,.doc,.docx,.zip,.jpg,.jpeg,.png,.gif,.webp"
              />
              {(file || fileName) && (
                <p className="text-sm text-gray-500">
                  {file ? `Novo: ${file.name}` : `Atual: ${fileName}`}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteActivity}
            disabled={isSubmitting || isDeleting}
          >
            {isDeleting ? 'Excluindo...' : 'Excluir Atividade'}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Atualizar Atividade'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
