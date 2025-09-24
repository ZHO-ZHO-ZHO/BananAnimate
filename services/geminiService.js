export const generateVideoFromColab = async ({
  originalImageBase64,
  originalImageMimeType,
  editPrompt,
  scenePrompt,
  animationMode,
  motionVideoBase64,
  motionVideoMimeType,
}) => {
  const backendUrl = window.location.origin;
  const endpoint = `${backendUrl}/generate-video`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original_image: originalImageBase64,
        image_mime_type: originalImageMimeType,
        edit_prompt: editPrompt,
        motion_video: motionVideoBase64,
        video_mime_type: motionVideoMimeType,
        scene_prompt: scenePrompt,
        mode: animationMode,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (error) {
        throw new Error(`Backend request failed with status ${response.status}: ${errorText}`);
      }
      throw new Error(
        `Backend request failed with status ${response.status}: ${errorJson.error || 'Unknown error'}`
      );
    }

    const result = await response.json();

    if (result.status === 'success' && result.video_data) {
      return `data:${result.mime_type};base64,${result.video_data}`;
    }

    throw new Error(result.error || 'Backend processed the request but failed to generate video.');
  } catch (error) {
    console.error('Error communicating with Colab backend:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Could not connect to the Colab backend. Please check the URL and ensure the Colab script is running.'
      );
    }
    throw error;
  }
};
