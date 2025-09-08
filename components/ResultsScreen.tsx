import React, { useState, useEffect } from 'react';
import type { PersonalColorAnalysis, KBeautyStyle } from '../types';
import ColorPalette from './ColorPalette';
import { RetryIcon, SparklesIcon, ShareIcon, PlusIcon, ImageIcon, FashionIcon, MakeupIcon, TwitterIcon, EmailIcon, DownloadIcon, CopyIcon, CloseIcon } from './Icons';
import StyleSelectionModal from './StyleSelectionModal';
import { generateCollageBlob } from '../services/collageService';

interface TransformedResult {
    id: number;
    image: string;
    description: string;
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: PersonalColorAnalysis;
    collageBlob: Blob | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, result, collageBlob }) => {
    if (!isOpen) return null;

    const shareText = `I found my personal color: ${result.season}! My K-celeb match is ${result.koreanCelebrity.name}. Find your colors!`;
    const appUrl = window.location.href; 
    const canNativeShare = collageBlob && navigator.share && navigator.canShare?.({ files: [new File([collageBlob], 'korean-glow-up.png', { type: 'image/png' })] });

    const handleNativeShare = async () => {
        if (!canNativeShare || !collageBlob) return;
        const file = new File([collageBlob], 'korean-glow-up.png', { type: 'image/png' });
        try {
            await navigator.share({ title: 'My Personal Color Analysis', text: shareText, files: [file] });
            onClose();
        } catch (error) {
            console.error("Error using native share:", error);
        }
    };

    const handleDownload = () => {
        if (!collageBlob) return;
        const url = URL.createObjectURL(collageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'korean-glow-up.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onClose();
    };

    const handleTwitterShare = () => {
        const tweetText = encodeURIComponent(shareText);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(appUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        onClose();
    };

    const handleEmailShare = () => {
        const subject = encodeURIComponent('My K-Beauty Color Analysis');
        const body = encodeURIComponent(`${shareText}\n\nCheck out the Korean Glow-Up app:\n${appUrl}`);
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
        window.location.href = mailtoUrl;
        onClose();
    };

    const handleCopyText = () => {
        navigator.clipboard.writeText(shareText).then(() => {
            alert("Result text copied to clipboard!");
            onClose();
        }).catch(err => {
            console.error("Failed to copy text:", err);
            alert("Could not copy text.");
        });
    };

    const shareOptions = [
        { name: 'Download Collage', icon: DownloadIcon, handler: handleDownload, show: true },
        { name: 'Share Image', icon: ShareIcon, handler: handleNativeShare, show: !!canNativeShare },
        { name: 'Share to Twitter', icon: TwitterIcon, handler: handleTwitterShare, show: true },
        { name: 'Share via Email', icon: EmailIcon, handler: handleEmailShare, show: true },
        { name: 'Copy Results Text', icon: CopyIcon, handler: handleCopyText, show: true },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close share options">
                    <CloseIcon className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold text-center text-gray-800 mb-6">Share Your Results</h3>
                <div className="space-y-3">
                    {shareOptions.filter(opt => opt.show).map(opt => (
                        <button key={opt.name} onClick={opt.handler} className="w-full flex items-center gap-4 p-3 bg-gray-100 rounded-lg text-left hover:bg-indigo-100 hover:text-indigo-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <opt.icon className="h-6 w-6 text-gray-600" />
                            <span className="font-semibold text-gray-700">{opt.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RecommendationPill: React.FC<{ text: string }> = ({ text }) => {
    // Highlight brand names in parentheses
    const parts = text.split(/(\(.*?\))/g);
    return (
        <span className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">
            {parts.map((part, index) => 
                part.startsWith('(') && part.endsWith(')') ? (
                    <span key={index} className="font-semibold text-indigo-700">{part}</span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

interface ResultsScreenProps {
  result: PersonalColorAnalysis;
  userImage: string | null;
  onRestart: () => void;
  onBeginStyleTransfer: () => void;
  isTransforming: boolean;
  transformedResults: TransformedResult[];
  isStyleModalOpen: boolean;
  onCloseStyleModal: () => void;
  onGenerateTransformation: (style: KBeautyStyle) => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
    result, 
    userImage, 
    onRestart, 
    onBeginStyleTransfer, 
    isTransforming, 
    transformedResults,
    isStyleModalOpen,
    onCloseStyleModal,
    onGenerateTransformation,
}) => {
  const [isPreparingShare, setIsPreparingShare] = useState(false);
  const [celebrityImageError, setCelebrityImageError] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collageForSharing, setCollageForSharing] = useState<Blob | null>(null);


  useEffect(() => {
    setCelebrityImageError(false);
  }, [result]);

  let celebrityURL = result.koreanCelebrity.celebrityImageURL;
  try {
    celebrityURL = decodeURI(celebrityURL);
  } catch (e) {
    console.warn('Could not decode celebrity URL, using original value:', celebrityURL, e);
  }
  const proxiedCelebrityImageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(celebrityURL)}`;

  const handleOpenShareModal = async () => {
    if (!userImage || !result || isPreparingShare) return;
    setIsPreparingShare(true);

    try {
        const transformedImageSrc = transformedResults.length > 0 ? `data:image/jpeg;base64,${transformedResults[0].image}` : null;

        const collageBlob = await generateCollageBlob({
            userImageSrc: userImage,
            celebrityImageSrc: celebrityURL,
            transformedImageSrc: transformedImageSrc,
            season: result.season,
            celebrityName: result.koreanCelebrity.name,
            celebrityDescription: result.koreanCelebrity.description
        });

        if (!collageBlob) {
            throw new Error("Could not create collage image.");
        }
        
        setCollageForSharing(collageBlob);
        setIsShareModalOpen(true);

    } catch (error) {
        console.error('Error preparing for share:', error);
        alert("Could not generate the collage for sharing.");
    } finally {
        setIsPreparingShare(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto relative animate-fade-in">
      <StyleSelectionModal
        isOpen={isStyleModalOpen}
        onClose={onCloseStyleModal}
        onSelectStyle={onGenerateTransformation}
        celebrityName={result.koreanCelebrity.name}
      />
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        result={result}
        collageBlob={collageForSharing}
      />
       <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10">
        <button
          onClick={handleOpenShareModal}
          disabled={isPreparingShare}
          className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors disabled:opacity-50"
          aria-label="Share results"
        >
          {isPreparingShare ? (
             <div className="w-6 h-6 border-2 border-t-transparent border-gray-800 rounded-full animate-spin"></div>
          ) : (
            <ShareIcon className="h-6 w-6" />
          )}
        </button>
      </div>
      <div className="text-center mb-10">
        <h2 className="text-lg font-medium text-indigo-600">Your Personal Color Analysis</h2>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mt-1">{result.season}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Column: Analysis Details */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
             <h3 className="text-2xl font-bold mb-3 text-gray-800">Analysis Breakdown</h3>
             <p className="text-gray-600 leading-relaxed">{result.description}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
             <h3 className="text-2xl font-bold mb-4 text-gray-800">Your Color Guide</h3>
             <div>
                <h4 className="text-xl font-semibold mb-3 text-gray-800">Your Palette</h4>
                <ColorPalette colors={result.palette} />
             </div>
             {result.colorsToAvoid && result.colorsToAvoid.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-xl font-semibold mb-3 text-gray-800">Colors to Avoid</h4>
                    <ColorPalette colors={result.colorsToAvoid} isAvoidPalette={true} />
                </div>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Style Recommendations</h3>
            <div className="space-y-8">
              {/* Fashion Tips */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <FashionIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-800">Fashion Tips</h4>
                   <div className="mt-3 space-y-4">
                        <div>
                            <h5 className="font-semibold text-gray-700">Key Clothing Items</h5>
                            <div className="mt-2 space-y-3">
                                {result.fashionTips.clothingItems.map((tip, i) => (
                                    <div key={i}>
                                        <RecommendationPill text={tip.item} />
                                        <p className="text-sm text-gray-600 mt-1.5 ml-1 italic">
                                            <span className="font-semibold not-italic">Why it works:</span> {tip.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-700">Fabrics & Textures</h5>
                             <div className="mt-2 space-y-3">
                                {result.fashionTips.fabricsAndTextures.map((tip, i) => (
                                    <div key={i}>
                                        <RecommendationPill text={tip.item} />
                                        <p className="text-sm text-gray-600 mt-1.5 ml-1 italic">
                                            <span className="font-semibold not-italic">Why it works:</span> {tip.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-700">Accessories</h5>
                            <div className="mt-2 space-y-3">
                                {result.fashionTips.accessories.map((tip, i) => (
                                    <div key={i}>
                                        <RecommendationPill text={tip.item} />
                                        <p className="text-sm text-gray-600 mt-1.5 ml-1 italic">
                                            <span className="font-semibold not-italic">Why it works:</span> {tip.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                   </div>
                   <p className="mt-4 text-sm text-gray-600 italic">"{result.fashionTips.styleInspiration}"</p>
                </div>
              </div>
              
              {/* Makeup Tips */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-pink-100 text-pink-600">
                  <MakeupIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-800">Makeup Tips</h4>
                  <div className="mt-3 space-y-4">
                        <div>
                            <h5 className="font-semibold text-gray-700">Face</h5>
                            <div className="mt-2 space-y-3">
                                {result.makeupTips.face.map((item, i) => (
                                    <div key={i}>
                                        <RecommendationPill text={item.product} />
                                        <p className="text-sm text-gray-600 mt-1.5 ml-1 italic">
                                            <span className="font-semibold not-italic">Technique:</span> {item.technique}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-700">Eyes</h5>
                            <div className="mt-2 space-y-3">
                                {result.makeupTips.eyes.map((item, i) => (
                                    <div key={i}>
                                        <RecommendationPill text={item.product} />
                                        <p className="text-sm text-gray-600 mt-1.5 ml-1 italic">
                                            <span className="font-semibold not-italic">Technique:</span> {item.technique}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h5 className="font-semibold text-gray-700">Lips</h5>
                            <div className="mt-2 space-y-3">
                                {result.makeupTips.lips.map((item, i) => (
                                    <div key={i}>
                                        <RecommendationPill text={item.product} />
                                        <p className="text-sm text-gray-600 mt-1.5 ml-1 italic">
                                            <span className="font-semibold not-italic">Technique:</span> {item.technique}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                   </div>
                   <p className="mt-4 text-sm text-gray-600 italic">"{result.makeupTips.generalTip}"</p>
                </div>
              </div>
              
              {/* Hair Color Recommendations */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-800">Recommended Hair Colors</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                      {result.hairColorRecommendations.map((color, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">
                              {color}
                          </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Hair Styling Tips */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-teal-100 text-teal-600">
                  <SparklesIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-800">Recommended Hair Styles</h4>
                  <div className="mt-3 space-y-4">
                      {result.hairStylingTips.map((tip, index) => (
                          <div key={index} className="p-4 bg-gray-100 rounded-lg">
                              <h5 className="font-bold text-gray-800">{tip.style}</h5>
                              <p className="text-sm text-gray-600 mt-1 mb-2">{tip.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {tip.products.map((product, pIndex) => (
                                    <span key={pIndex} className="px-2.5 py-1 bg-white text-gray-700 rounded-full text-xs font-medium border border-gray-200">
                                      {product}
                                    </span>
                                ))}
                              </div>
                          </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visuals */}
        <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-8">
            {userImage && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <img src={userImage} alt="Your selfie" className="rounded-lg shadow-xl w-full object-cover aspect-square" />
                </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">K-Celebrity Match</h3>
              <div className="flex flex-col items-center text-center gap-4">
                  {celebrityImageError ? (
                     <div className="flex flex-col items-center justify-center w-48 h-48 rounded-2xl bg-gray-200 text-center p-4 border-4 border-white shadow-md">
                        <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500 mb-3">Image not available</p>
                        <a
                        href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(result.koreanCelebrity.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium hover:bg-indigo-200 transition-colors"
                        >
                        Search Images
                        </a>
                    </div>
                  ) : (
                    <img 
                        src={proxiedCelebrityImageUrl} 
                        alt={result.koreanCelebrity.name} 
                        className="w-48 h-48 rounded-2xl object-cover shadow-md border-4 border-white"
                        onError={() => setCelebrityImageError(true)}
                    />
                  )}
                  <div>
                      <p className="font-semibold text-3xl text-gray-800">{result.koreanCelebrity.name}</p>
                      <p className="text-gray-600 italic mt-1">"{result.koreanCelebrity.description}"</p>
                  </div>
              </div>
            </div>
        </div>
      </div>
      
      {/* Style Transformation Section */}
      <div className="mt-12">
        {transformedResults.length === 0 && (
             <div className="text-center p-8 bg-gray-100 rounded-lg">
                 <h2 className="text-2xl font-bold text-gray-800">Ready for a Makeover?</h2>
                 <p className="text-gray-600 mt-2 mb-6 max-w-2xl mx-auto">See how you'd look with K-beauty styling inspired by your results. Generate different shots of your new look.</p>
                 <button
                    onClick={onBeginStyleTransfer}
                    disabled={isTransforming}
                    className="flex items-center gap-3 mx-auto rounded-md bg-pink-500 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 transition-all duration-200 ease-in-out hover:scale-105 disabled:bg-gray-400 disabled:scale-100"
                >
                    {isTransforming ? (
                        <>
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                            <span>Generating Your Styles...</span>
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="h-6 w-6" />
                            Visualize My K-Celeb Style
                        </>
                    )}
                </button>
             </div>
        )}

        {transformedResults.length > 0 && (
            <div className="bg-transparent mt-8 animate-fade-in">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">Your Style Transformations</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {transformedResults.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-lg shadow-xl flex flex-col transition-transform hover:scale-105">
                           <img src={`data:image/jpeg;base64,${item.image}`} alt="Transformed selfie" className="rounded-lg shadow-md w-full aspect-square object-cover" />
                           <div className="mt-4 flex-grow">
                             <p className="text-gray-600 text-sm">{item.description}</p>
                           </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>


      <div className="mt-12 text-center">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 mx-auto rounded-md bg-indigo-600 px-3.5 py-2.5 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-transform duration-200 ease-in-out hover:scale-105"
        >
          <RetryIcon className="h-5 w-5" /> Start Over
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;