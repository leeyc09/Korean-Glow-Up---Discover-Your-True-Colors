
import React, { useState } from 'react';
import type { ColorInfo } from '../types';

interface ColorPaletteProps {
  colors: ColorInfo[];
  isAvoidPalette?: boolean;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, isAvoidPalette = false }) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex).then(() => {
      setCopiedHex(hex);
      setTimeout(() => {
        setCopiedHex(null);
      }, 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy hex to clipboard:', err);
    });
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
      {colors.map((color) => (
        <div key={color.hex} className="flex flex-col items-center group">
          <button
            onClick={() => handleCopy(color.hex)}
            className="w-16 h-16 rounded-full shadow-md border-2 border-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-110 relative"
            style={{ backgroundColor: color.hex }}
            aria-label={`Copy color ${color.name} (${color.hex}) to clipboard`}
            title={`Click to copy ${color.hex}`}
          >
            {isAvoidPalette && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full">
                <svg className="w-8 h-8 text-red-500 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            )}
          </button>
          <div className="mt-2 text-xs text-center text-gray-600 h-8 flex items-center justify-center w-full">
            {copiedHex === color.hex ? (
              <span className="font-bold text-indigo-600 animate-fade-in">Copied!</span>
            ) : (
              <span className="truncate">{color.name}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ColorPalette;
