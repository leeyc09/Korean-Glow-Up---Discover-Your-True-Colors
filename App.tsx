import React, { useState, useCallback } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import CameraCapture from './components/CameraCapture';
import AnalyzingScreen from './components/AnalyzingScreen';
import ResultsScreen from './components/ResultsScreen';
import GenderSelectionScreen from './components/GenderSelectionScreen';
import { AppStep, Gender } from './types';
import type { PersonalColorAnalysis, KBeautyStyle, ShotType } from './types';
import { analyzePersonalColor, transformImage, findCelebrityImage } from './services/geminiService';

interface TransformedResult {
    id: number;
    image: string;
    description: string;
}
let nextId = 0;

const shotTypeSequence: ShotType[] = ['Bust', 'Waist', 'Full'];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.Welcome);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PersonalColorAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [transformedResults, setTransformedResults] = useState<TransformedResult[]>([]);
  const [isGeneratingMore, setIsGeneratingMore] = useState<boolean>(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<KBeautyStyle | null>(null);


  const handleStart = () => {
    setCurrentStep(AppStep.GenderSelection);
  };

  const handleGenderSelect = (selectedGender: Gender) => {
    setGender(selectedGender);
    setCurrentStep(AppStep.Capture);
  };
  
  const handlePhotoTaken = (dataUrl: string) => {
    const base64Data = dataUrl.split(',')[1];
    setImageSrc(base64Data);
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageSrc) {
      setError("Please take a photo first.");
      return;
    }
     if (!gender) {
      setError("Please select a gender.");
      return;
    }
    setCurrentStep(AppStep.Analyzing);
    setError(null);
    try {
      // Step 1: Get the personal color analysis (without celebrity image URL)
      const partialResult = await analyzePersonalColor(imageSrc, gender);

      // Step 2: Find a reliable image URL for the celebrity
      const celebrityImageUrl = await findCelebrityImage(partialResult.koreanCelebrity.name);

      // Step 3: Combine the results into a complete analysis object
      const fullResult: PersonalColorAnalysis = {
        ...partialResult,
        koreanCelebrity: {
          ...partialResult.koreanCelebrity,
          celebrityImageURL: celebrityImageUrl,
        },
      };

      setAnalysisResult(fullResult);
      setCurrentStep(AppStep.Result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setCurrentStep(AppStep.Capture);
    }
  }, [imageSrc, gender]);
  
  const handleRestart = () => {
      setImageSrc(null);
      setAnalysisResult(null);
      setError(null);
      setGender(null);
      setIsTransforming(false);
      setTransformedResults([]);
      setIsGeneratingMore(false);
      setIsStyleModalOpen(false);
      setSelectedStyle(null);
      setCurrentStep(AppStep.Welcome);
  }

  const handleBeginStyleTransfer = () => {
    setIsStyleModalOpen(true);
  };

  const handleGenerateTransformation = useCallback(async (style: KBeautyStyle) => {
    if (!imageSrc || !analysisResult || !gender) {
        setError("Missing data for style transfer.");
        return;
    }
    setIsStyleModalOpen(false);
    setIsTransforming(true);
    setSelectedStyle(style);
    setError(null);
    setTransformedResults([]); // Clear previous results

    try {
        // Generate only the FIRST shot type from the sequence to avoid rate limits
        const shotType = shotTypeSequence[0];
        
        const res = await transformImage(
            imageSrc, 
            analysisResult.season, 
            analysisResult.koreanCelebrity.name, 
            analysisResult.fashionTips, 
            gender, 
            style, 
            shotType
        );
        
        const newResult = {
            id: nextId++,
            image: res.newImageBase64,
            description: res.description,
        };
        
        setTransformedResults([newResult]);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429")) {
            setError("The style generator is currently very busy. Please wait a moment and try again.");
        } else {
            setError(errorMessage);
        }
    } finally {
        setIsTransforming(false);
    }
  }, [imageSrc, analysisResult, gender]);

  const handleGenerateMore = useCallback(async () => {
    if (!imageSrc || !analysisResult || !gender || !selectedStyle) {
        setError("Missing data for generating more styles.");
        return;
    }

    const nextShotIndex = transformedResults.length;
    if (nextShotIndex >= shotTypeSequence.length) {
        console.log("All shot types have been generated.");
        return;
    }

    setIsGeneratingMore(true);
    setError(null);
    try {
        const shotType = shotTypeSequence[nextShotIndex];
        const { newImageBase64, description } = await transformImage(
            imageSrc,
            analysisResult.season,
            analysisResult.koreanCelebrity.name,
            analysisResult.fashionTips,
            gender,
            selectedStyle,
            shotType,
            // Pass palette for the last shot for more variation
            nextShotIndex === shotTypeSequence.length - 1 ? analysisResult.palette : undefined
        );
        setTransformedResults(prev => [...prev, {
            id: nextId++,
            image: newImageBase64,
            description: description,
        }]);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
    } finally {
        setIsGeneratingMore(false);
    }
  }, [imageSrc, analysisResult, gender, selectedStyle, transformedResults]);

  const renderStep = () => {
    switch (currentStep) {
      case AppStep.Welcome:
        return <WelcomeScreen onStart={handleStart} />;
      case AppStep.GenderSelection:
        return <GenderSelectionScreen onSelect={handleGenderSelect} />;
      case AppStep.Capture:
        return (
            <div>
                 {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg text-center" role="alert">{error}</div>}
                <CameraCapture onPhotoTaken={handlePhotoTaken} onAnalyze={handleAnalyze} />
            </div>
        )
      case AppStep.Analyzing:
        return <AnalyzingScreen />;
      case AppStep.Result:
        if (analysisResult) {
            const fullImageSrc = imageSrc ? `data:image/jpeg;base64,${imageSrc}` : null;
            return (
                <div>
                    {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg text-center" role="alert">{error}</div>}
                    <ResultsScreen 
                        result={analysisResult} 
                        userImage={fullImageSrc} 
                        onRestart={handleRestart}
                        onBeginStyleTransfer={handleBeginStyleTransfer}
                        isTransforming={isTransforming}
                        transformedResults={transformedResults}
                        onGenerateMore={handleGenerateMore}
                        isGeneratingMore={isGeneratingMore}
                        isStyleModalOpen={isStyleModalOpen}
                        onCloseStyleModal={() => setIsStyleModalOpen(false)}
                        onGenerateTransformation={handleGenerateTransformation}
                    />
                </div>
            );
        }
        handleRestart(); 
        return null;
      default:
        return <WelcomeScreen onStart={handleStart} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <main className="container mx-auto max-w-5xl">
        <div className="relative flex flex-col justify-center min-h-screen">
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

export default App;