/**
 * Formulário para criação de estudantes
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Mail, GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StudentFormData } from '@/types/student';

interface StudentFormProps {
  formData: StudentFormData;
  errors: Record<string, string>;
  isLoading: boolean;
  isValidating: Record<string, boolean>;
  onChange: (field: keyof StudentFormData, value: string) => void;
  onSubmit: () => void;
  onValidateField: (field: keyof StudentFormData) => Promise<void>;
  isEditing?: boolean;
}

export default function StudentForm({
  formData,
  errors,
  isLoading,
  isValidating,
  onChange,
  onSubmit,
  onValidateField,
  isEditing = false,
}: StudentFormProps) {
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const handleFieldChange = (field: keyof StudentFormData, value: string) => {
    onChange(field, value);
    
    // Marcar campo como tocado
    if (!touchedFields[field]) {
      setTouchedFields(prev => ({ ...prev, [field]: true }));
    }
  };

  const handleFieldBlur = async (field: keyof StudentFormData) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    await onValidateField(field);
  };

  const isFieldValid = (field: keyof StudentFormData) => {
    return touchedFields[field] && !errors[field] && formData[field].trim() !== '';
  };

  const isFormValid = () => {
    return (
      formData.fullName.trim() !== '' &&
      formData.email.trim() !== '' &&
      Object.keys(errors).length === 0 &&
      !Object.values(isValidating).some(Boolean)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid() && !isLoading) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Campo Nome Completo */}
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium">
          Nome Completo *
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <Input
            id="fullName"
            type="text"
            placeholder="Digite o nome completo do estudante"
            value={formData.fullName}
            onChange={(e) => handleFieldChange('fullName', e.target.value)}
            onBlur={() => handleFieldBlur('fullName')}
            className={`pl-10 pr-10 ${
              errors.fullName 
                ? 'border-destructive focus:border-destructive' 
                : isFieldValid('fullName')
                ? 'border-green-500 focus:border-green-500'
                : ''
            }`}
            disabled={isLoading}
            autoComplete="name"
          />
          {isValidating.fullName && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {isFieldValid('fullName') && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>
        {errors.fullName && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="w-3 h-3" />
            {errors.fullName}
          </div>
        )}
      </div>

      {/* Campo Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email *
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Mail className="w-4 h-4 text-muted-foreground" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            className={`pl-10 pr-10 ${
              errors.email 
                ? 'border-destructive focus:border-destructive' 
                : isFieldValid('email')
                ? 'border-green-500 focus:border-green-500'
                : ''
            }`}
            disabled={isLoading}
            autoComplete="email"
          />
          {isValidating.email && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {isFieldValid('email') && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>
        {errors.email && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="w-3 h-3" />
            {errors.email}
          </div>
        )}
      </div>

      {/* Campo Matrícula (exibido como não editável em modo de edição) */}
      {formData.studentRegistration && (
        <div className="space-y-2">
          <Label htmlFor="studentRegistration" className="text-sm font-medium">
            Matrícula
          </Label>
          <Input
            id="studentRegistration"
            type="text"
            value={formData.studentRegistration}
            className="bg-muted"
            readOnly
          />
          <p className="text-xs text-muted-foreground">
            Matrícula gerada automaticamente
          </p>
        </div>
      )}
      {/* Campo oculto para manter o valor no estado */}
      <input
        type="hidden"
        id="studentRegistrationHidden"
        value={formData.studentRegistration || ''}
        onChange={(e) => handleFieldChange('studentRegistration', e.target.value)}
      />
      {errors.studentRegistration && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="w-3 h-3" />
          {errors.studentRegistration}
        </div>
      )}

      {/* Campo Série */}
      <div className="space-y-2">
        <Label htmlFor="grade" className="text-sm font-medium">
          Série *
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
          </div>
          <Select
            value={formData.grade || ''}
            onValueChange={(value: '1º Ano' | '2º Ano' | '3º Ano') => handleFieldChange('grade', value)}
          >
            <SelectTrigger className="pl-10 pr-3">
              <SelectValue placeholder="Selecione a série" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1º Ano">1º Ano</SelectItem>
              <SelectItem value="2º Ano">2º Ano</SelectItem>
              <SelectItem value="3º Ano">3º Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {errors.grade && (
          <div className="flex items-center gap-1 text-sm text-destructive">
            <AlertCircle className="w-3 h-3" />
            {errors.grade}
          </div>
        )}
      </div>


      {/* Informações adicionais */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Informações Importantes:</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Uma senha temporária será gerada automaticamente</li>
          <li>• O estudante deverá alterar a senha no primeiro login</li>
          <li>• As credenciais serão exibidas após a criação</li>
          <li>• O estudante receberá acesso imediato ao sistema</li>
        </ul>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={!isFormValid() || isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? 'Atualizando...' : 'Criando Estudante...'}
            </>
          ) : (
            isEditing ? 'Atualizar Estudante' : 'Criar Estudante'
          )}
        </Button>
      </div>
    </form>
  );
}
