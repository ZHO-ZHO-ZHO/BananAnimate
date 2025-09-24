import React, { useState, useEffect } from 'react';
import { AppStep, AnimationMode } from './types.js';
import { VIDEO_LOADING_MESSAGES } from './constants.js';
import { generateVideoFromColab } from './services/geminiService.js';
import Card from './components/Card.js';
import FileUpload from './components/FileUpload.js';
import Spinner from './components/Spinner.js';
import StepIndicator from './components/StepIndicator.js';
import { ImageIcon, VideoIcon } from './components/Icons.js';

const e = React.createElement;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const App = () => {
  const [appStep, setAppStep] = useState(AppStep.UPLOAD);
  const [originalImage, setOriginalImage] = useState(null);
  const [sourceVideo, setSourceVideo] = useState(null);
  const [editPrompt, setEditPrompt] = useState(
    'Make this character a space pirate, add a cool sci-fi helmet'
  );
  const [videoPrompt, setVideoPrompt] = useState('A cinematic shot of the character');
  const [animationMode, setAnimationMode] = useState(AnimationMode.REPLACEMENT);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    if (isLoadingVideo) {
      setLoadingMessage(VIDEO_LOADING_MESSAGES[0]);
      let messageIndex = 1;
      interval = window.setInterval(() => {
        setLoadingMessage(
          VIDEO_LOADING_MESSAGES[messageIndex % VIDEO_LOADING_MESSAGES.length]
        );
        messageIndex += 1;
      }, 5000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoadingVideo]);

  const handleImageUpload = (file) => {
    setOriginalImage({ file, url: URL.createObjectURL(file) });
    setGeneratedVideoUrl(null);
    setError(null);
    if (sourceVideo) {
      setAppStep(AppStep.GENERATE);
    }
  };

  const handleVideoUpload = (file) => {
    setSourceVideo({ file, url: URL.createObjectURL(file) });
    setGeneratedVideoUrl(null);
    setError(null);
    if (originalImage) {
      setAppStep(AppStep.GENERATE);
    }
  };

  const handleGenerateVideo = async () => {
    if (!originalImage || !sourceVideo || !editPrompt || !videoPrompt) {
      setError('Please upload a character image, a motion video, and provide all prompts.');
      return;
    }

    setIsLoadingVideo(true);
    setError(null);
    setAppStep(AppStep.GENERATE);
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
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
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

  const canGenerate = Boolean(originalImage && sourceVideo && editPrompt && videoPrompt);

  return e(
    'div',
    { className: 'min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-8' },
    e(
      'div',
      { className: 'max-w-7xl mx-auto' },
      e(
        'header',
        { className: 'text-center mb-12' },
        e(
          'h1',
          {
            className:
              'text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600',
          },
          'AI Video Character Animator'
        ),
        e(
          'p',
          { className: 'mt-4 text-lg text-gray-400' },
          'One-click character editing and animation, powered by a Colab backend.'
        )
      ),
      error
        ? e(
            'div',
            {
              className:
                'bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6',
              role: 'alert',
            },
            e('strong', { className: 'font-bold' }, 'Error: '),
            e('span', { className: 'block sm:inline' }, error),
            e(
              'button',
              {
                onClick: () => setError(null),
                className: 'absolute top-0 bottom-0 right-0 px-4 py-3 text-red-200 hover:text-white',
                type: 'button',
              },
              e('span', { 'aria-hidden': 'true' }, '\u00d7')
            )
          )
        : null,
      e('div', { className: 'mb-12' }, e(StepIndicator, { currentStep: appStep })),
      e(
        'div',
        { className: 'grid grid-cols-1 lg:grid-cols-2 gap-8' },
        e(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 gap-8 lg:col-span-1' },
          e(
            Card,
            { title: 'Upload Character', step: 1 },
            e(FileUpload, {
              onFileSelect: handleImageUpload,
              disabled: isLoadingVideo,
              accept: 'image/*',
              icon: e(ImageIcon),
              title: 'Upload an image',
              description: 'PNG, JPG, etc.',
            }),
            originalImage
              ? e(
                  'div',
                  { className: 'mt-4' },
                  e('img', {
                    src: originalImage.url,
                    alt: 'Original character',
                    className: 'rounded-lg shadow-lg w-full',
                  })
                )
              : null
          ),
          e(
            Card,
            { title: 'Upload Motion Video', step: 2 },
            e(FileUpload, {
              onFileSelect: handleVideoUpload,
              disabled: isLoadingVideo,
              accept: 'video/*',
              icon: e(VideoIcon),
              title: 'Upload a video',
              description: 'MP4, MOV, etc.',
            }),
            sourceVideo
              ? e(
                  'div',
                  { className: 'mt-4' },
                  e('video', {
                    src: sourceVideo.url,
                    controls: true,
                    muted: true,
                    loop: true,
                    className: 'rounded-lg shadow-lg w-full',
                  })
                )
              : null
          )
        ),
        e(
          'div',
          { className: 'space-y-8 lg:col-span-1' },
          e(
            Card,
            { title: 'Configure & Generate', step: 3 },
            e(
              'div',
              { className: 'flex flex-col h-full space-y-4' },
              e(
                'div',
                null,
                e(
                  'label',
                  {
                    htmlFor: 'edit-prompt',
                    className: 'block text-sm font-medium text-gray-300 mb-2',
                  },
                  'Image Edit Prompt'
                ),
                e('textarea', {
                  id: 'edit-prompt',
                  value: editPrompt,
                  onChange: (event) => setEditPrompt(event.target.value),
                  placeholder: 'e.g., Make this character a medieval knight',
                  className:
                    'w-full p-2 rounded-md bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-indigo-500',
                  disabled: isLoadingVideo,
                  rows: 3,
                })
              ),
              e(
                'div',
                null,
                e(
                  'label',
                  { className: 'block text-sm font-medium text-gray-300 mb-2' },
                  'Animation Mode'
                ),
                e(
                  'div',
                  { className: 'flex gap-4' },
                  e(
                    'button',
                    {
                      onClick: () => setAnimationMode(AnimationMode.ANIMATION),
                      disabled: isLoadingVideo,
                      className: [
                        'flex-1 text-sm py-2 px-3 rounded-md transition-colors',
                        animationMode === AnimationMode.ANIMATION
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'bg-gray-700 hover:bg-gray-600',
                      ].join(' '),
                      type: 'button',
                    },
                    'Animation'
                  ),
                  e(
                    'button',
                    {
                      onClick: () => setAnimationMode(AnimationMode.REPLACEMENT),
                      disabled: isLoadingVideo,
                      className: [
                        'flex-1 text-sm py-2 px-3 rounded-md transition-colors',
                        animationMode === AnimationMode.REPLACEMENT
                          ? 'bg-purple-600 text-white font-semibold'
                          : 'bg-gray-700 hover:bg-gray-600',
                      ].join(' '),
                      type: 'button',
                    },
                    'Replacement'
                  )
                )
              ),
              e(
                'div',
                null,
                e(
                  'label',
                  {
                    htmlFor: 'video-prompt',
                    className: 'block text-sm font-medium text-gray-300 mb-2',
                  },
                  'Scene Prompt (for Wan-Animate)'
                ),
                e('textarea', {
                  id: 'video-prompt',
                  value: videoPrompt,
                  onChange: (event) => setVideoPrompt(event.target.value),
                  placeholder: 'Describe the character or style...',
                  className:
                    'w-full p-2 rounded-md bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-purple-500',
                  disabled: isLoadingVideo,
                  rows: 2,
                })
              ),
              e(
                'button',
                {
                  onClick: handleGenerateVideo,
                  disabled: !canGenerate || isLoadingVideo,
                  className:
                    'w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center mt-auto',
                  type: 'button',
                },
                isLoadingVideo
                  ? e(React.Fragment, null, e(Spinner), ' Generating...')
                  : '🎬 Generate Video'
              )
            )
          ),
          isLoadingVideo || generatedVideoUrl
            ? e(
                Card,
                { title: 'Result', step: 4 },
                isLoadingVideo
                  ? e(
                      'div',
                      { className: 'text-center mt-4 text-sm text-purple-300' },
                      e(Spinner),
                      e(
                        'p',
                        { className: 'font-semibold mt-4' },
                        loadingMessage
                      ),
                      e(
                        'p',
                        { className: 'mt-2' },
                        'Check your Colab notebook for detailed progress. This can take several minutes.'
                      )
                    )
                  : generatedVideoUrl
                  ? e(
                      'div',
                      { className: 'mt-4' },
                      e('video', {
                        src: generatedVideoUrl,
                        controls: true,
                        className: 'rounded-lg shadow-lg w-full',
                      }),
                      e(
                        'button',
                        {
                          onClick: handleReset,
                          className:
                            'w-full mt-4 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition duration-300',
                          type: 'button',
                        },
                        'Start Over'
                      )
                    )
                  : null
              )
            : null
        )
      )
    )
  );
};

export default App;
