
# Guide: Deploying the All-in-One Wan-Animate + Gemini Backend on Google Colab

This guide walks you through setting up and running the all-in-one Python backend server on Google Colab. This single server handles everything: it runs the AI models and also hosts the web application, so you can use it with a single click.

## Prerequisites

1.  **Google Account**: Required to use Google Colab.
2.  **Google AI API Key**: The backend needs this to perform image editing.
    *   Visit the [Google AI Studio](https://aistudio.google.com/app/apikey) to get your API key.
    *   Copy the key and keep it safe.
3.  **ngrok Account**: This service exposes your Colab server to the internet.
    *   Go to the [ngrok dashboard](https://dashboard.ngrok.com/login) and sign up for a free account.
    *   On the left menu, find the **"Your Authtoken"** page.
    *   Copy your authtoken.

## Deployment Steps

### Step 1: Create and Configure Colab Notebook

1.  Open [Google Colab](https://colab.research.google.com/) and create a **"New notebook"**.
2.  **Enable GPU Acceleration (Crucial!)**:
    *   From the top menu, click `Runtime` -> `Change runtime type`.
    *   Under "Hardware accelerator", select `T4 GPU`.
    *   Click `Save`.

### Step 2: Clone Repository and Install Dependencies

In the first code cell of your notebook, paste and run the following commands. This will clone your GitHub repository and install the required packages.

**Note:** Replace `https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git` with the actual URL of your GitHub repo.

```bash
# Clone your repository
!git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git

# Navigate into the project directory
%cd YOUR_REPOSITORY_NAME

# Install all required Python packages
!pip install -r colab_backend/requirements.txt

# Download the Wan-Animate model weights (this may take several minutes)
!pip install "huggingface_hub[cli]"
!hugging-cli download Wan-AI/Wan2.2-Animate-14B --local-dir ./Wan-Animate-14B-Checkpoints
```

### Step 3: Configure and Run the Backend Server

1.  Click the `+ Code` button to create a new cell in your notebook.
2.  Paste the following code into this new cell.

    ```python
    # IMPORTANT: Paste your credentials here
    NGROK_AUTH_TOKEN = "YOUR_NGROK_AUTH_TOKEN"
    GEMINI_API_KEY = "YOUR_GOOGLE_AI_API_KEY"
    
    # Set credentials as environment variables
    import os
    os.environ['NGROK_AUTH_TOKEN'] = NGROK_AUTH_TOKEN
    os.environ['GEMINI_API_KEY'] = GEMINI_API_KEY
    
    # Run the main backend script
    !python colab_backend/main.py
    ```
3.  **Replace the placeholders**:
    *   Replace `"YOUR_NGROK_AUTH_TOKEN"` with the actual authtoken you copied from the ngrok website.
    *   Replace `"YOUR_GOOGLE_AI_API_KEY"` with the API key you got from Google AI Studio.
4.  **Run the cell** by clicking its "Play" button.

### Step 4: Access Your All-in-One Application

1.  After the script runs, the cell's output will show a message like this:

    ```
    ==============================================================================
    Your all-in-one AI Video App is running!
    
    Click this Public URL to open it: https://some-random-string.ngrok-free.app
    ==============================================================================
    ```

2.  **Simply CLICK the "Public URL"**. It will open the web application in a new browser tab, fully connected and ready to use.

### You're all set!

You no longer need to copy or paste any URLs. Just run the Colab notebook and click the link. You can monitor the progress of video generation in the output of the Colab cell.
