import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Palette, Pipette, Trash2, RotateCcw } from 'lucide-react';

interface AdvancedColorPickerProps {
  color?: string;
  onChange: (color: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  presetColors?: string[];
  recentColors?: string[];
  onRecentColorAdd?: (color: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
  type?: 'text' | 'background' | 'cell';
}

// Paletas de cores predefinidas
const COLOR_PALETTES = {
  basic: [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
  ],
  grayscale: [
    '#000000', '#1a1a1a', '#333333', '#4d4d4d', '#666666', '#808080', 
    '#999999', '#b3b3b3', '#cccccc', '#e6e6e6', '#f0f0f0', '#ffffff'
  ],
  modern: [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ],
  pastels: [
    '#fecaca', '#fed7aa', '#fde68a', '#fef3c7', '#d9f99d', '#bbf7d0',
    '#99f6e4', '#a7f3d0', '#bae6fd', '#dbeafe', '#e0e7ff', '#ede9fe',
    '#f3e8ff', '#fae8ff', '#fce7f3', '#ffe4e6'
  ],
  professional: [
    '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1',
    '#2563eb', '#1d4ed8', '#059669', '#047857', '#dc2626', '#b91c1c',
    '#7c2d12', '#a16207', '#4338ca', '#6366f1'
  ]
};

const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  color = '#000000',
  onChange,
  onRemove,
  showRemove = true,
  presetColors = COLOR_PALETTES.modern,
  recentColors = [],
  onRecentColorAdd,
  size = 'md',
  className = '',
  title = 'Selecionar cor',
  type = 'text'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(color);
  const [activeTab, setActiveTab] = useState('presets');

  const handleColorSelect = (selectedColor: string) => {
    onChange(selectedColor);
    setCustomColor(selectedColor);
    
    // Adicionar à lista de cores recentes
    if (onRecentColorAdd && selectedColor !== 'transparent') {
      onRecentColorAdd(selectedColor);
    }
    
    setIsOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  const handleRemoveColor = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('transparent');
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const getColorPreview = () => {
    if (!color || color === 'transparent') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Palette className="w-4 h-4 text-muted-foreground" />
        </div>
      );
    }
    return null;
  };

  const ColorGrid = ({ colors, title }: { colors: string[], title?: string }) => (
    <div className="space-y-2">
      {title && <Label className="text-xs text-muted-foreground">{title}</Label>}
      <div className="grid grid-cols-8 gap-1">
        {colors.map((paletteColor, index) => (
          <button
            key={`${paletteColor}-${index}`}
            className="w-6 h-6 rounded border hover:scale-110 transition-transform relative ring-offset-2 hover:ring-2 hover:ring-primary"
            style={{ backgroundColor: paletteColor }}
            onClick={() => handleColorSelect(paletteColor)}
            title={paletteColor}
          >
            {color === paletteColor && (
              <Check 
                className="w-3 h-3 absolute inset-0 m-auto drop-shadow-sm"
                style={{ 
                  color: paletteColor === '#ffffff' || paletteColor === '#ffff00' ? '#000000' : '#ffffff' 
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${sizeClasses[size]} p-1 border-2 ${className}`}
          style={{ 
            backgroundColor: color === 'transparent' ? 'transparent' : color,
            borderColor: color === 'transparent' ? '#e2e8f0' : color
          }}
          title={title}
        >
          {getColorPreview()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="presets" className="text-xs">Predefinidas</TabsTrigger>
            <TabsTrigger value="custom" className="text-xs">Personalizada</TabsTrigger>
            <TabsTrigger value="palettes" className="text-xs">Paletas</TabsTrigger>
          </TabsList>
          
          <div className="p-3 space-y-3">
            <TabsContent value="presets" className="mt-0 space-y-3">
              <ColorGrid colors={presetColors} />
              
              {recentColors && recentColors.length > 0 && (
                <ColorGrid colors={recentColors} title="Cores Recentes" />
              )}
            </TabsContent>

            <TabsContent value="custom" className="mt-0 space-y-3">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Cor Personalizada</Label>
                
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    className="w-12 h-10 p-1 border-2 cursor-pointer rounded"
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
                    className="flex-1 font-mono text-sm"
                  />
                </div>

                {/* Controles de opacidade */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Opacidade</Label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="100"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    onChange={(e) => {
                      const opacity = parseInt(e.target.value) / 100;
                      const hex = customColor;
                      const rgba = `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${opacity})`;
                      onChange(rgba);
                    }}
                  />
                </div>

                <Button
                  onClick={() => handleColorSelect(customColor)}
                  className="w-full"
                >
                  <Pipette className="w-4 h-4 mr-2" />
                  Aplicar Cor
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="palettes" className="mt-0 space-y-4">
              <div className="space-y-3">
                <ColorGrid colors={COLOR_PALETTES.basic} title="Básicas" />
                <ColorGrid colors={COLOR_PALETTES.grayscale} title="Escala de Cinza" />
                <ColorGrid colors={COLOR_PALETTES.modern} title="Modernas" />
                <ColorGrid colors={COLOR_PALETTES.pastels} title="Pastéis" />
                <ColorGrid colors={COLOR_PALETTES.professional} title="Profissionais" />
              </div>
            </TabsContent>

            {/* Ações */}
            <div className="flex gap-2 pt-2 border-t">
              {showRemove && (
                <Button
                  onClick={handleRemoveColor}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remover
                </Button>
              )}
              <Button
                onClick={() => {
                  const defaultColor = type === 'background' ? 'transparent' : '#000000';
                  handleColorSelect(defaultColor);
                }}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Padrão
              </Button>
            </div>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default AdvancedColorPicker;