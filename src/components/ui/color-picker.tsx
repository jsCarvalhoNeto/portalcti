import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Palette } from 'lucide-react';

interface ColorPickerProps {
  color?: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  showInput?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DEFAULT_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00', '#CCFF00',
  '#99FF00', '#66FF00', '#33FF00', '#00FF00', '#00FF33', '#00FF66',
  '#00FF99', '#00FFCC', '#00FFFF', '#00CCFF', '#0099FF', '#0066FF',
  '#0033FF', '#0000FF', '#3300FF', '#6600FF', '#9900FF', '#CC00FF',
  '#FF00FF', '#FF00CC', '#FF0099', '#FF0066', '#FF0033'
];

const ColorPicker: React.FC<ColorPickerProps> = ({
  color = '#000000',
  onChange,
  presetColors = DEFAULT_COLORS,
  showInput = true,
  size = 'md',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);

  const handleColorSelect = (selectedColor: string) => {
    onChange(selectedColor);
    setCustomColor(selectedColor);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${sizeClasses[size]} p-1 ${className}`}
          style={{ backgroundColor: color }}
          title="Selecionar cor"
        >
          {!color || color === 'transparent' ? (
            <Palette className="w-4 h-4" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Selecionar Cor</Label>
          
          {/* Cores predefinidas */}
          <div className="grid grid-cols-6 gap-1">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform relative"
                style={{ backgroundColor: presetColor }}
                onClick={() => handleColorSelect(presetColor)}
                title={presetColor}
              >
                {color === presetColor && (
                  <Check 
                    className="w-4 h-4 absolute inset-0 m-auto text-white drop-shadow-lg"
                    style={{ 
                      color: presetColor === '#FFFFFF' || presetColor === '#FFFF00' ? '#000000' : '#FFFFFF' 
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Seletor de cor customizada */}
          {showInput && (
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="customColor" className="text-xs text-muted-foreground">
                Cor Personalizada
              </Label>
              <div className="flex gap-2">
                <Input
                  id="customColor"
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  className="w-12 h-8 p-0 border-0 cursor-pointer"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      onChange(e.target.value);
                    }
                  }}
                  placeholder="#000000"
                  className="flex-1 text-xs"
                />
              </div>
              <Button
                onClick={() => handleColorSelect(customColor)}
                size="sm"
                className="w-full"
              >
                Aplicar Cor
              </Button>
            </div>
          )}

          {/* Remover cor */}
          <Button
            onClick={() => handleColorSelect('transparent')}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Remover Cor
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;