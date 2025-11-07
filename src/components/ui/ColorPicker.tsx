import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

/**
 * Componente para seleção de cores dos cards de disciplinas
 * Permite escolher cores predefinidas ou inserir cor personalizada
 */
export default function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  // Cores predefinidas baseadas no tema Tailwind CSS
  const presetColors = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Roxo', value: '#8B5CF6' },
    { name: 'Laranja', value: '#F97316' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Azul Escuro', value: '#1E40AF' },
    { name: 'Vermelho', value: '#EF4444' },
    { name: 'Amarelo', value: '#F59E0B' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Cinza', value: '#6B7280' },
    { name: 'Esmeralda', value: '#059669' },
  ];

  /**
   * Valida se a cor está no formato hexadecimal válido
   */
  const isValidHex = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  };

  /**
   * Manipula a seleção de uma cor predefinida
   */
  const handlePresetColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
  };

  /**
   * Manipula a aplicação de uma cor personalizada
   */
  const handleCustomColorApply = () => {
    if (isValidHex(customColor)) {
      onChange(customColor);
      setIsOpen(false);
    }
  };

  /**
   * Manipula a mudança do input de cor personalizada
   */
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let color = e.target.value;
    
    // Adiciona # se não estiver presente
    if (!color.startsWith('#') && color.length > 0) {
      color = '#' + color;
    }
    
    setCustomColor(color);
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm font-medium">Cor do Card:</Label>
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            className="flex items-center gap-2 h-8"
          >
            <div 
              className="w-4 h-4 rounded border border-border/50"
              style={{ backgroundColor: value }}
            />
            <Palette className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            {/* Cores Predefinidas */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Cores Predefinidas
              </Label>
              <div className="grid grid-cols-6 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handlePresetColorSelect(color.value)}
                    className="relative w-8 h-8 rounded border border-border/50 hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {value === color.value && (
                      <Check className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Cor Personalizada */}
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">
                Cor Personalizada
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="text"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    placeholder="#3B82F6"
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                  <div 
                    className="w-8 h-8 rounded border border-border/50 flex-shrink-0"
                    style={{ backgroundColor: isValidHex(customColor) ? customColor : '#f3f4f6' }}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleCustomColorApply}
                  disabled={!isValidHex(customColor)}
                >
                  Aplicar
                </Button>
              </div>
              
              {/* Ajuda sobre formato */}
              <p className="text-xs text-muted-foreground mt-2">
                Use formato hexadecimal: #RRGGBB (ex: #3B82F6)
              </p>
              
              {customColor && !isValidHex(customColor) && (
                <p className="text-xs text-red-500 mt-1">
                  Formato inválido. Use #RRGGBB
                </p>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <span className="text-xs text-muted-foreground font-mono">
        {value}
      </span>
    </div>
  );
}