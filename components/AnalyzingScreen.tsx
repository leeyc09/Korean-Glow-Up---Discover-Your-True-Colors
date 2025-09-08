
import React, { useState, useEffect } from 'react';

const messages = [
    "Analyzing your skin's undertones...",
    "Comparing hair and eye colors...",
    "Calibrating color harmonies...",
    "Building your personalized palette...",
    "Finding a high-quality celebrity photo...",
    "Just a moment more..."
];

const AnalyzingScreen: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % messages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
            <h2 className="mt-8 text-2xl font-semibold text-gray-800">Analyzing...</h2>
            <p className="mt-2 text-gray-600 transition-opacity duration-500">
                {messages[messageIndex]}
            </p>
        </div>
    );
};

export default AnalyzingScreen;