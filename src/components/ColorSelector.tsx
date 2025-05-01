import { useState } from 'react';

interface ColorOption {
  value: string;
  label: string;
  bgColor: string;
}

interface ColorSelectorProps {
  colors: ColorOption[];
  selectedColor: string;
  onColorChange: (color: string, customColor?: string) => void;
  customColor?: string;
}

export function ColorSelector({ 
  colors, 
  selectedColor, 
  onColorChange,
  customColor 
}: ColorSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-2">
        {colors.map((color) => (
          <div 
            key={color.value}
            className={`w-10 h-10 rounded-md cursor-pointer transition-all ${selectedColor === color.value ? 'ring-4 ring-primary' : 'ring-1 ring-border hover:ring-2'}`}
            style={{ backgroundColor: color.bgColor }}
            onClick={() => onColorChange(color.value)}
            title={color.label}
          />
        ))}
      </div>
      
      {selectedColor === 'custom' && (
        <div className="mt-2">
          <input
            type="color"
            value={customColor || '#ffffff'}
            onChange={(e) => onColorChange('custom', e.target.value)}
            className="h-10 w-full"
          />
        </div>
      )}
    </div>
  );
}
