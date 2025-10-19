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
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activityName, setActivityName] = useState('');
 const [selectedSubject, setSelectedSubject] = useState('');
 const [selectedGrade, setSelectedGrade] = useState('');
 const [activityType, setActivityType] = useState<'individual' | 'team'>('individual');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
 const [period, setPeriod] = useState('');
  const [evaluationType, setEvaluationType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Validação de tipo de arquivo
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.ms-powerpoint', 
                           'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                           'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                           'application/zip', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Formatos permitidos: PDF, TXT, PPT, PPTX, DOC, DOCX, ZIP, JPG, PNG, GIF, WEBP",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!activityName || !selectedSubject || !selectedGrade || !user) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (file) {
        // Se houver arquivo, usar FormData para upload
        const formData = new FormData();
        formData.append('name', activityName);
        formData.append('subject_id', selectedSubject);
        // Não enviar o campo 'grade' - o controller pega a série da disciplina
        formData.append('type', activityType);
        formData.append('description', description);
        if (deadline) {
          formData.append('deadline', deadline);
        }
        if (period) {
          formData.append('period', period);
        }
        if (evaluationType) {
          formData.append('evaluation_type', evaluationType);
        }
        formData.append('file', file);
        
        const response = await fetch(`${API_URL}/activities`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Erro ao criar atividade');
        }

        await response.json();
      } else {
        // Se não houver arquivo, usar a função existente
        // Não enviar o campo 'grade' - o controller pega a série da disciplina
        await createActivity({
          name: activityName,
          subject_id: parseInt(selectedSubject, 10),
          type: activityType,
          description: description || undefined,
          deadline: deadline || undefined,
          period: period || undefined,
          evaluation_type: evaluationType || undefined,
        });
      }

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
      <DialogContent className="sm:max-w-[425px] sm:max-h-[90vh] overflow-y-auto">
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
            <Select onValueChange={setSelectedSubject} value={selectedSubject}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione a disciplina" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Descrição da atividade..."
              rows={3}
            />
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
              {file && (
                <p className="text-sm text-gray-50">Arquivo selecionado: {file.name}</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
