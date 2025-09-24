
import React, { useState, useEffect, useCallback } from 'react';
import { AppStep, AnimationMode } from './types';
import { VIDEO_LOADING_MESSAGES } from './constants';
import { generateVideoFromColab } from './services/geminiService';
import Card from './components/Card';
import FileUpload from './components/FileUpload';
import Spinner from './components/Spinner';
import StepIndicator from './components/StepIndicator';
import { ImageIcon, VideoIcon } from './components/Icons';

// Helper to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


const App: React.FC = () => {
  const [appStep, setAppStep] = useState<AppStep>(AppStep.UPLOAD);
  const [originalImage, setOriginalImage] = useState<{ file: File; url: string } | null>(null);
  const [sourceVideo, setSourceVideo] = useState<{ file: File; url: string } | null>(null);

  const [editPrompt, setEditPrompt] = useState<string>('Make this character a space pirate, add a cool sci-fi helmet');
  const [videoPrompt, setVideoPrompt] = useState<string>('A cinematic shot of the character');
  const [animationMode, setAnimationMode] = useState<AnimationMode>('replacement');

  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: number;
    if (isLoadingVideo) {
      setLoadingMessage(VIDEO_LOADING_MESSAGES[0]);
      let messageIndex = 1;
      interval = window.setInterval(() => {
        setLoadingMessage(VIDEO_LOADING_MESSAGES[messageIndex % VIDEO_LOADING_MESSAGES.length]);
        messageIndex++;
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isLoadingVideo]);

  const handleImageUpload = (file: File) => {
    setOriginalImage({ file, url: URL.createObjectURL(file) });
    setGeneratedVideoUrl(null);
    setError(null);
    if (sourceVideo) setAppStep(AppStep.GENERATE);
  };
  
  const handleVideoUpload = (file: File) => {
     setSourceVideo({ file, url: URL.createObjectURL(file) });
     setGeneratedVideoUrl(null);
     setError(null);
     if (originalImage) setAppStep(AppStep.GENERATE);
  }

  const handleGenerateVideo = async () => {
    if (!originalImage || !sourceVideo || !editPrompt || !videoPrompt) {
      setError('Please upload a character image, a motion video, and provide all prompts.');
      return;
    };

    setIsLoadingVideo(true);
    setError(null);
    setAppStep(AppStep.GENERATE); // Keep it in generate step
    setLoadingMessage('Preparing assets for your custom backend...');

    try {
      const originalImageBase64 = await fileToBase64(originalImage.file);
      const sourceVideoBase64 = await fileToBase64(sourceVideo.file);

      const originalImageMimeType = originalImage.file.type;
      const originalImageBase64Data = originalImageBase64.split(',')[1];
      const sourceVideoMimeType = sourceVideo.file.type;
      const sourceVideoBase64Data = sourceVideoBase64.split(',')[1];
      
      setLoadingMessage('Sending request to your Colab backend... This will take a while.');
      const videoUrl = await generateVideoFromColab({
          originalImageBase64: originalImageBase64Data,
          originalImageMimeType,
          editPrompt,
          scenePrompt: videoPrompt,
          animationMode,
          motionVideoBase64: sourceVideoBase64Data,
          motionVideoMimeType: sourceVideoMimeType,
      });

      setLoadingMessage('Video received from backend!');
      setGeneratedVideoUrl(videoUrl);
      setAppStep(AppStep.RESULT);
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate the video from your backend. ${errorMessage}`);
      setAppStep(AppStep.GENERATE);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleReset = () => {
    setAppStep(AppStep.UPLOAD);
    setOriginalImage(null);
    setSourceVideo(null);
    setGeneratedVideoUrl(null);
    setError(null);
  };
  
  const canGenerate = originalImage && sourceVideo && editPrompt && videoPrompt;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI Video Character Animator
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            One-click character editing and animation, powered by a Colab backend.
          </p>
        </header>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-200 hover:text-white">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        )}

        <div className="mb-12">
            <StepIndicator currentStep={appStep} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:col-span-1">
             <Card title="Upload Character" step={1}>
                <FileUpload 
                    onFileSelect={handleImageUpload} 
                    disabled={isLoadingVideo}
                    accept="image/*"
                    icon={<ImageIcon />}
                    title="Upload an image"
                    description="PNG, JPG, etc."
                />
                {originalImage && (
                  <div className="mt-4">
                    <img src={originalImage.url} alt="Original character" className="rounded-lg shadow-lg w-full" />
                  </div>
                )}
              </Card>

              <Card title="Upload Motion Video" step={2}>
                 <FileUpload 
                    onFileSelect={handleVideoUpload} 
                    disabled={isLoadingVideo}
                    accept="video/*"
                    icon={<VideoIcon />}
                    title="Upload a video"
                    description="MP4, MOV, etc."
                />
                {sourceVideo && (
                  <div className="mt-4">
                    <video src={sourceVideo.url} controls muted loop className="rounded-lg shadow-lg w-full"></video>
                  </div>
                )}
              </Card>
          </div>

          {/* Column 2: Config & Output */}
          <div className="space-y-8 lg:col-span-1">
             <Card title="Configure & Generate" step={3}>
                <div className="flex flex-col h-full space-y-4">
                    <div>
                      <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-2">Image Edit Prompt</label>
                      <textarea
                        id="edit-prompt"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="e.g., Make this character a medieval knight"
                        className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-indigo-500"
                        disabled={isLoadingVideo}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Animation Mode</label>
                        <div className="flex gap-4">
                          <button onClick={() => setAnimationMode('animation')} disabled={isLoadingVideo} className={`flex-1 text-sm py-2 px-3 rounded-md transition-colors ${animationMode === 'animation' ? 'bg-purple-600 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600'}`}>Animation</button>
                          <button onClick={() => setAnimationMode('replacement')} disabled={isLoadingVideo} className={`flex-1 text-sm py-2 px-3 rounded-md transition-colors ${animationMode === 'replacement' ? 'bg-purple-600 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600'}`}>Replacement</button>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-300 mb-2">Scene Prompt (for Wan-Animate)</label>
                        <textarea
                            id="video-prompt"
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            placeholder="Describe the character or style..."
                            className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-purple-500"
                            disabled={isLoadingVideo}
                            rows={2}
                        />
                     </div>
                      <button
                        onClick={handleGenerateVideo}
                        disabled={!canGenerate || isLoadingVideo}
                        className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center mt-auto"
                      >
                      {isLoadingVideo ? <><Spinner /> Generating...</> : '🎬 Generate Video'}
                      </button>
                </div>
             </Card>
             
             {(isLoadingVideo || generatedVideoUrl) && (
                <Card title="Result" step={4}>
                    {isLoadingVideo && (
                      <div className="text-center mt-4 text-sm text-purple-300">
                          <Spinner />
                          <p className="font-semibold mt-4">{loadingMessage}</p>
                          <p className="mt-2">Check your Colab notebook for detailed progress. This can take several minutes.</p>
                      </div>
                    )}
                    {generatedVideoUrl && !isLoadingVideo && (
                      <div className="mt-4">
                          <video src={generatedVideoUrl} controls className="rounded-lg shadow-lg w-full"></video>
                          <button
                            onClick={handleReset}
                            className="w-full mt-4 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300"
                          >
                            Start Over
                          </button>
                      </div>
                    )}
                </Card>
             )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
