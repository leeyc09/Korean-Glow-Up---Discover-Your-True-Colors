import React from 'react';
import type { KBeautyStyle } from '../types';
import { CloseIcon } from './Icons';

interface StyleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStyle: (style: KBeautyStyle) => void;
  celebrityName: string;
}

const StyleSelectionModal: React.FC<StyleSelectionModalProps> = ({ isOpen, onClose, onSelectStyle, celebrityName }) => {
  if (!isOpen) return null;

  const styles: { name: KBeautyStyle, description: string }[] = [
    { name: 'Natural Glow', description: "Effortless, dewy skin with a touch of natural color. Think 'no-makeup' makeup." },
    { name: 'Bold & Chic', description: "Confident and modern. Features sharp eyeliner, bold lips, and a sophisticated vibe." },
    { name: 'Vintage K-drama', description: "Soft, romantic, and nostalgic. Inspired by classic Korean drama aesthetics with muted tones." },
    { name: 'Celebrity Inspired', description: `Get a style inspired by ${celebrityName}. We'll adapt their signature look to you.` },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="style-modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8 relative transform transition-all duration-300 ease-in-out animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close style selection"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
        <div className="text-center">
          <h2 id="style-modal-title" className="text-3xl font-bold text-gray-900">Choose Your K-Beauty Style</h2>
          <p className="mt-2 text-gray-600">Select an aesthetic to transform your photo.</p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {styles.map((style) => (
            <button
              key={style.name}
              onClick={() => onSelectStyle(style.name)}
              className="p-6 text-left bg-gray-50 rounded-lg border-2 border-transparent hover:border-indigo-400 hover:shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <h3 className="text-xl font-semibold text-gray-800">{style.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{style.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StyleSelectionModal;