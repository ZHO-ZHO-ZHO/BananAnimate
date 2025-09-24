
import { AnimationMode } from "../types";

interface GenerateVideoParams {
    originalImageBase64: string;
    originalImageMimeType: string;
    editPrompt: string;
    scenePrompt: string;
    animationMode: AnimationMode;
    motionVideoBase64: string;
    motionVideoMimeType: string;
}

/**
 * Generates a video by calling a custom backend API (running on Google Colab).
 * This function sends the original character image, an edit prompt, source video, and other parameters to the backend.
 * The backend will first edit the image using Gemini, then generate the video.
 * @returns A data URL for the generated video.
 */
export const generateVideoFromColab = async (params: GenerateVideoParams): Promise<string> => {
    const {
        originalImageBase64,
        originalImageMimeType,
        editPrompt,
        scenePrompt,
        animationMode,
        motionVideoBase64,
        motionVideoMimeType,
    } = params;
    
    // Automatically determine the backend URL from the current page's origin.
    // This works because the Colab script now serves the frontend.
    const backendUrl = window.location.origin;
    
    // The endpoint path as defined in the Python backend script
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
            } catch (e) {
                // If parsing fails, use the raw text
                throw new Error(`Backend request failed with status ${response.status}: ${errorText}`);
            }
            throw new Error(`Backend request failed with status ${response.status}: ${errorJson.error || 'Unknown error'}`);
        }

        const result = await response.json();
        
        if (result.status === 'success' && result.video_data) {
            // Construct a data URL from the received base64 video data
            return `data:${result.mime_type};base64,${result.video_data}`;
        } else {
            throw new Error(result.error || 'Backend processed the request but failed to generate video.');
        }

    } catch (error) {
        console.error("Error communicating with Colab backend:", error);
        if (error instanceof Error && error.message.includes('Failed to fetch')) {
             throw new Error("Could not connect to the Colab backend. Please check the URL and ensure the Colab script is running.");
        }
        throw error; // Re-throw other errors
    }
};
