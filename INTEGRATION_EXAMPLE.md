# Exemplo prático: Como substituir facilmente a implementação atual

```tsx

// ANTES (implementação atual problemática)
const handleColor = (type: 'color' | 'background') => {
  const colorPicker = document.createElement('input');
  colorPicker.type = 'color';
  colorPicker.style.position = 'absolute';
  colorPicker.style.left = '-9999px';
  document.body.appendChild(colorPicker);
  
  colorPicker.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.value) {
      handleFormat('styleWithCSS', 'true');
      handleFormat(type === 'color' ? 'foreColor' : 'backColor', target.value);
    }
  });
  
  colorPicker.click();
};

// DEPOIS (implementação melhorada - substituição direta)
import SimpleColorPicker from '@/components/ui/simple-color-picker';

const [currentTextColor, setCurrentTextColor] = useState('#000000');
const [currentBgColor, setCurrentBgColor] = useState('transparent');

const handleTextColor = (color: string) => {
  setCurrentTextColor(color);
  if (color === 'transparent') {
    handleFormat('removeFormat');
  } else {
    handleFormat('styleWithCSS', 'true');
    handleFormat('foreColor', color);
  }
};

const handleBackgroundColor = (color: string) => {
  setCurrentBgColor(color);
  handleFormat('styleWithCSS', 'true');
  handleFormat('backColor', color === 'transparent' ? '' : color);
};

// Na toolbar, substitua:
// ANTES:
{ 
  command: 'foreColor', 
  icon: Palette, 
  tooltip: 'Cor do texto', 
  customHandler: () => handleColor('color') 
},

// DEPOIS:
// Adicione diretamente no JSX da toolbar:
<SimpleColorPicker
  color={currentTextColor}
  onChange={handleTextColor}
  title="Cor do texto"
  size="sm"
/>
<SimpleColorPicker
  color={currentBgColor}
  onChange={handleBackgroundColor}
  title="Cor de fundo do texto"
  size="sm"
/>

// EXEMPLO COMPLETO DE INTEGRAÇÃO MÍNIMA:

import { useState } from 'react';
import SimpleColorPicker from '@/components/ui/simple-color-picker';

export default function RichTextToolbar({ onFormat, className }: RichTextToolbarProps) {
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('transparent');

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    if (color === 'transparent') {
      onFormat('removeFormat');
    } else {
      onFormat('styleWithCSS', 'true');
      onFormat('foreColor', color);
    }
  };

  const handleBgColorChange = (color: string) => {
    setBgColor(color);
    onFormat('styleWithCSS', 'true');
    onFormat('backColor', color === 'transparent' ? '' : color);
  };

  return (
    <div className={`flex flex-wrap items-center gap-1 p-2 bg-muted border rounded-t-lg ${className}`}>
      {/* ... outros botões da toolbar ... */}
      
      {/* Separador */}
      <div className="w-px h-6 bg-border mx-1" />
      
      {/* Seletores de cor melhorados */}
      <SimpleColorPicker
        color={textColor}
        onChange={handleTextColorChange}
        title="Cor do texto"
        size="sm"
      />
      
      <SimpleColorPicker
        color={bgColor}
        onChange={handleBgColorChange}
        title="Cor de fundo"
        size="sm"
      />
      
      {/* ... resto da toolbar ... */}
    </div>
  );
}
```