import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ChallengeToggleProps {
  challengeId: number;
  isActive: boolean;
  onToggle: (id: number, isActive: boolean) => Promise<void>;
  disabled?: boolean;
  subjectName?: string;
}

const ChallengeToggle: React.FC<ChallengeToggleProps> = ({
  challengeId,
  isActive,
  onToggle,
  disabled = false,
  subjectName
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    console.log('🔄 ChallengeToggle: handleToggle called', {
      challengeId,
      currentActive: isActive,
      newActive: checked,
      disabled,
      isLoading
    });

    if (isLoading || disabled) {
      console.log('⚠️ ChallengeToggle: Action blocked', { isLoading, disabled });
      return;
    }

    setIsLoading(true);
    try {
      console.log('📡 ChallengeToggle: Calling onToggle...');
      await onToggle(challengeId, checked);
      console.log('✅ ChallengeToggle: onToggle completed successfully');
    } catch (error) {
      console.error('❌ ChallengeToggle: onToggle failed', error);
      // Se houve erro, não muda o estado do switch
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center space-x-2">
        <Switch
          id={`toggle-${challengeId}`}
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={disabled || isLoading}
        />
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Label 
            htmlFor={`toggle-${challengeId}`} 
            className="text-sm font-medium cursor-pointer"
          >
            {isActive ? 'Ativo' : 'Inativo'}
          </Label>
        )}
      </div>
      
      <div>
        <Badge 
          variant={isActive ? 'default' : 'secondary'}
          className={`text-xs ${isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600'}`}
        >
          {isActive ? '● Ativo' : '○ Inativo'}
        </Badge>
      </div>
      
      {isActive && subjectName && (
        <div className="text-xs text-muted-foreground">
          <span className="inline-flex items-center">
            🎯 Ativo para {subjectName}
          </span>
        </div>
      )}
    </div>
  );
};

export default ChallengeToggle;