import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CameraIcon, RetryIcon } from './Icons';

interface CameraCaptureProps {
  onPhotoTaken: (dataUrl: string) => void;
  onAnalyze: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onPhotoTaken, onAnalyze }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please check your browser permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoDataUrl(dataUrl);
      onPhotoTaken(dataUrl);
    }
  };
  
  const retakePhoto = () => {
      setPhotoDataUrl(null);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h2 className="text-2xl font-bold mb-2 text-center">Take a Selfie</h2>
      <p className="text-gray-600 mb-4 text-center max-w-sm">For the best results, center your face in the guide. Use natural daylight and face the light directly.</p>
      <div className="relative w-full max-w-md aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-lg">
        {error && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white p-4">{error}</div>}
        <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${photoDataUrl ? 'hidden' : 'block'}`} />
        
        {!photoDataUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                    className="w-[70%] h-[85%] border-4 border-dashed border-white border-opacity-70 rounded-[50%] shadow-lg"
                    aria-hidden="true"
                ></div>
            </div>
        )}

        {photoDataUrl && <img src={photoDataUrl} alt="User selfie" className="w-full h-full object-cover" />}
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="mt-6 flex space-x-4">
        {photoDataUrl ? (
          <>
            <button
                onClick={retakePhoto}
                className="flex items-center gap-2 rounded-md bg-gray-200 px-3.5 py-2.5 text-lg font-semibold text-gray-700 shadow-sm hover:bg-gray-300 transition-transform duration-200 ease-in-out hover:scale-105"
            >
                <RetryIcon className="h-5 w-5" /> Retake
            </button>
            <button
                onClick={onAnalyze}
                className="rounded-md bg-indigo-600 px-8 py-2.5 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 transition-transform duration-200 ease-in-out hover:scale-105"
            >
                Analyze Photo
            </button>
          </>
        ) : (
          <button
            onClick={takePhoto}
            disabled={!stream}
            className="flex items-center gap-2 rounded-full bg-indigo-600 p-4 text-white shadow-lg hover:bg-indigo-500 disabled:bg-gray-400 transition-transform duration-200 ease-in-out hover:scale-110"
          >
            <CameraIcon className="h-8 w-8" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;