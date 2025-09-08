
import React from 'react';
import { SparklesIcon } from './Icons';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="max-w-md">
        <div className="mx-auto mb-6 h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-400">
          <SparklesIcon className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        Korean Glow-Up
        </h1>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Discover Your True Colors
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Discover your personal color palette and experience a complete Korean Glow-Up. Get personalized K-beauty recommendations for fashion and makeup, and even visualize your new look—all from a single selfie.
        </p>
        <div className="mt-10">
          <button
            onClick={onStart}
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-transform duration-200 ease-in-out hover:scale-105"
          >
            Start Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;