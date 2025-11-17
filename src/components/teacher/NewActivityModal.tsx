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
import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Validação de tipo de arquivo expandida
      const allowedTypes = [
        'application/pdf', 'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/javascript',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'text/x-python', 'text/x-java-source', 'text/markdown', 'application/json', 'application/xml'
      ];
      
      // Verificar arquivos inválidos (incluindo por extensão)
      const invalidFiles = selectedFiles.filter(file => !allowedTypes.includes(file.type) && 
        !file.name.toLowerCase().endsWith('.py') && !file.name.toLowerCase().endsWith('.sql') &&
        !file.name.toLowerCase().endsWith('.java') && !file.name.toLowerCase().endsWith('.c') &&
        !file.name.toLowerCase().endsWith('.cpp') && !file.name.toLowerCase().endsWith('.cs') &&
        !file.name.toLowerCase().endsWith('.php') && !file.name.toLowerCase().endsWith('.rb') &&
        !file.name.toLowerCase().endsWith('.go') && !file.name.toLowerCase().endsWith('.ts') &&
        !file.name.toLowerCase().endsWith('.md'));
      
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
      const oversizedFiles = selectedFiles.filter(file => file.size > 50 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast({
          title: "Arquivo muito grande",
          description: `Arquivos muito grandes (máx. 50MB): ${oversizedFiles.map(f => f.name).join(', ')}`,
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

    setIsSubmitting(true);
    try {
      if (files.length > 0) {
        // Se houver arquivos, usar FormData para upload
        const formData = new FormData();
        formData.append('name', activityName);
        formData.append('subject_id', selectedSubject);
        // Não enviar o campo 'grade' - o controller pega a série da disciplina
        formData.append('type', activityType);
        formData.append('description', description);
        if (deadline) {
          formData.append('deadline', convertToISO(deadline));
        }
        if (period) {
          formData.append('period', period);
        }
        if (evaluationType) {
          formData.append('evaluation_type', evaluationType);
        }
        
        // Adicionar múltiplos arquivos
        files.forEach((file) => {
          formData.append('files', file);
        });
        
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
      <DialogContent className="sm:max-w-[700px] sm:max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="description" className="text-right pt-2">
              Descrição
            </Label>
            <div className="col-span-3">
              <div className="bg-background rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
                <ReactQuill
                  id="description"
                  theme="snow"
                  value={typeof description === 'string' ? description : ''}
                  onChange={value => setDescription(typeof value === 'string' ? value : '')}
                  placeholder="Descrição da atividade..."
                  style={{ minHeight: 200, maxHeight: 400, resize: 'vertical', overflow: 'auto' }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['blockquote', 'code-block'],
                      ['link', 'image'],
                      ['clean']
                    ]
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use a barra de ferramentas para formatar o texto com negrito, itálico, listas, links, etc.
              </p>
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
                📁 Selecione até 10 arquivos (máx. 50MB cada). Suporta códigos, documentos, imagens e compactados.
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
