import React from 'react';
import { Gender } from '../types';
import { FemaleIcon, MaleIcon } from './Icons';

interface GenderSelectionScreenProps {
  onSelect: (gender: Gender) => void;
}

const GenderSelectionScreen: React.FC<GenderSelectionScreenProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
        Select Your Gender
      </h1>
      <p className="mt-2 text-lg leading-8 text-gray-600 max-w-md mb-10">
        This helps us choose a celebrity example that's right for you.
      </p>
      <div className="flex flex-col sm:flex-row gap-8">
        <button
          onClick={() => onSelect(Gender.Female)}
          className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg w-52 h-52 border-2 border-transparent hover:border-pink-400 hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
        >
          <FemaleIcon className="h-16 w-16 mb-4 text-pink-500" />
          <span className="text-2xl font-semibold text-gray-800">Female</span>
        </button>
        <button
          onClick={() => onSelect(Gender.Male)}
          className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-lg w-52 h-52 border-2 border-transparent hover:border-blue-400 hover:scale-105 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <MaleIcon className="h-16 w-16 mb-4 text-blue-500" />
          <span className="text-2xl font-semibold text-gray-800">Male</span>
        </button>
      </div>
    </div>
  );
};

export default GenderSelectionScreen;
