import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Palette, X } from 'lucide-react';

interface SimpleColorPickerProps {
  color?: string;
  onChange: (color: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

// Cores mais usadas em editores de texto
const QUICK_COLORS = [
  // Linha 1 - Preto, branco e cinzas
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  // Linha 2 - Vermelhos
  '#ff0000', '#ff3333', '#ff6666', '#ff9999', '#ffcccc', '#ffe6e6',
  // Linha 3 - Azuis 
  '#0000ff', '#3333ff', '#6666ff', '#9999ff', '#ccccff', '#e6e6ff',
  // Linha 4 - Verdes
  '#00ff00', '#33ff33', '#66ff66', '#99ff99', '#ccffcc', '#e6ffe6',
  // Linha 5 - Amarelos/Laranjas
  '#ffff00', '#ffcc00', '#ff9900', '#ff6600', '#ff3300', '#ffcc99',
  // Linha 6 - Roxos/Rosas
  '#ff00ff', '#cc00cc', '#9900cc', '#6600cc', '#3300cc', '#cc99ff'
];

const SimpleColorPicker: React.FC<SimpleColorPickerProps> = ({
  color = '#000000',
  onChange,
  size = 'md',
  className = '',
  title = 'Selecionar cor'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (selectedColor: string) => {
    onChange(selectedColor);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const getDisplayColor = () => {
    return color === 'transparent' || !color ? '#ffffff' : color;
  };

  const showPaletteIcon = () => {
    return color === 'transparent' || !color;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${sizeClasses[size]} p-1 border-2 hover:border-primary/50 transition-colors ${className}`}
          style={{ 
            backgroundColor: getDisplayColor(),
            borderColor: color === 'transparent' ? '#e2e8f0' : undefined
          }}
          title={title}
        >
          {showPaletteIcon() && <Palette className="w-3 h-3 text-muted-foreground" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selecionar Cor</span>
            {color && color !== 'transparent' && (
              <span className="text-xs text-muted-foreground font-mono">
                {color.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Grid de cores */}
          <div className="grid grid-cols-6 gap-1">
            {QUICK_COLORS.map((quickColor) => (
              <button
                key={quickColor}
                className="w-8 h-8 rounded border-2 hover:scale-110 transition-all duration-150 relative focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                style={{ 
                  backgroundColor: quickColor,
                  borderColor: quickColor === '#ffffff' ? '#e2e8f0' : 'transparent'
                }}
                onClick={() => handleColorSelect(quickColor)}
                title={quickColor}
              >
                {color === quickColor && (
                  <Check 
                    className="w-4 h-4 absolute inset-0 m-auto drop-shadow-sm"
                    style={{ 
                      color: quickColor === '#ffffff' || quickColor === '#ffff00' || quickColor === '#e6ffe6' || quickColor === '#e6e6ff' || quickColor === '#ffe6e6' || quickColor === '#cccccc' ? '#000000' : '#ffffff' 
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Seletor personalizado */}
          <div className="flex gap-2 pt-2 border-t">
            <input
              type="color"
              className="w-10 h-8 rounded border border-input cursor-pointer"
              onChange={(e) => handleColorSelect(e.target.value)}
              title="Cor personalizada"
            />
            <Button
              onClick={() => handleColorSelect('transparent')}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Sem cor
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SimpleColorPicker;