import os
import sys
import base64
import subprocess
import threading
import time
import uuid
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from pyngrok import ngrok
import google.generativeai as genai

# --- Configuration ---
PORT = 5000
BASE_DIR = Path(__file__).parent.parent.resolve()
STATIC_FOLDER = BASE_DIR
TEMP_FOLDER = BASE_DIR / "colab_backend" / "temp"
WAN_ANIMATE_REPO_PATH = BASE_DIR / "Wan2.2"
CHECKPOINTS_PATH = BASE_DIR / "checkpoints" / "Wan2.2-Animate-14B"

TEMP_FOLDER.mkdir(exist_ok=True)

# --- Flask App Initialization ---
app = Flask(__name__, static_folder=str(STATIC_FOLDER))
CORS(app)

# --- Helper Function to Run Shell Commands ---
def run_command(command, cwd=None):
    print(f"\n[COMMAND] Running in '{cwd or os.getcwd()}':\n{' '.join(command)}\n")
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        print("[STDOUT]:")
        print(result.stdout)
        if result.stderr:
            print("[STDERR]:")
            print(result.stderr)
        return result.stdout
    except subprocess.CalledProcessError as e:
        error_message = (
            f"Command failed with exit code {e.returncode}.\n"
            f"--- STDOUT ---\n{e.stdout}\n"
            f"--- STDERR ---\n{e.stderr}"
        )
        print(error_message)
        raise RuntimeError(error_message)

# --- Gemini API Helper ---
def edit_image_with_gemini(api_key, original_image_path, edit_prompt):
    print("[GEMINI] Configuring Gemini API...")
    genai.configure(api_key=api_key)
    print(f"[GEMINI] Loading original image from: {original_image_path}")
    original_image_file = genai.upload_file(path=str(original_image_path))
    
    while original_image_file.state.name == "PROCESSING":
        print('.', end='')
        time.sleep(2)
        original_image_file = genai.get_file(original_image_file.name)

    if original_image_file.state.name == "FAILED":
        raise ValueError("Gemini API failed to process the uploaded image.")
    print("\n[GEMINI] Image uploaded successfully. Sending edit request...")
    
    model = genai.GenerativeModel(model_name="gemini-2.5-flash-image-preview")
    response = model.generate_content([edit_prompt, original_image_file])
    
    edited_image_data = response.candidates[0].content.parts[0].inline_data.data
    edited_image_mime_type = response.candidates[0].content.parts[0].inline_data.mime_type
    extension = edited_image_mime_type.split('/')[-1]
    edited_image_path = TEMP_FOLDER / f"edited_image_{uuid.uuid4()}.{extension}"
    
    print(f"[GEMINI] Received edited image. Saving to: {edited_image_path}")
    with open(edited_image_path, "wb") as f:
        f.write(base64.b64decode(edited_image_data))
        
    genai.delete_file(original_image_file.name)
    print("[GEMINI] Edit complete and Gemini server file cleaned up.")
    return edited_image_path

# --- Main API Endpoint ---
@app.route("/generate-video", methods=["POST"])
def generate_video():
    session_id = str(uuid.uuid4())
    temp_session_folder = TEMP_FOLDER / session_id
    temp_session_folder.mkdir()
    
    try:
        data = request.json
        print(f"[API] Received request for session {session_id}")

        original_image_path = temp_session_folder / f"original_image.{data['image_mime_type'].split('/')[1]}"
        with open(original_image_path, "wb") as f:
            f.write(base64.b64decode(data["original_image"]))
            
        motion_video_path = temp_session_folder / f"motion_video.{data['video_mime_type'].split('/')[1]}"
        with open(motion_video_path, "wb") as f:
            f.write(base64.b64decode(data["motion_video"]))
        
        print(f"[FILES] Saved original image to {original_image_path}")
        print(f"[FILES] Saved motion video to {motion_video_path}")
        
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set.")
        
        edited_image_path = edit_image_with_gemini(api_key, original_image_path, data["edit_prompt"])

        print("[WAN-ANIMATE] Starting preprocessing...")
        preprocess_output_path = temp_session_folder / "process_results"
        
        preprocess_command = [
            sys.executable, str(WAN_ANIMATE_REPO_PATH / "wan/modules/animate/preprocess/preprocess_data.py"),
            "--ckpt_path", str(CHECKPOINTS_PATH / "process_checkpoint"),
            "--video_path", str(motion_video_path),
            "--refer_path", str(edited_image_path),
            "--save_path", str(preprocess_output_path),
            "--resolution_area", "1280", "720",
        ]
        if data["mode"] == "animation":
            preprocess_command.extend(["--retarget_flag", "--use_flux"])
        else:
            preprocess_command.extend(["--iterations", "3", "--k", "7", "--w_len", "1", "--h_len", "1", "--replace_flag"])
            
        run_command(preprocess_command, cwd=str(WAN_ANIMATE_REPO_PATH))
        print("[WAN-ANIMATE] Preprocessing complete.")

        print("[WAN-ANIMATE] Starting video generation...")
        generation_command = [
            sys.executable, str(WAN_ANIMATE_REPO_PATH / "generate.py"),
            "--task", "animate-14B",
            "--ckpt_dir", str(CHECKPOINTS_PATH),
            "--src_root_path", str(preprocess_output_path),
            "--refert_num", "1",
            "--prompt", data["scene_prompt"],
        ]
        if data["mode"] == "replacement":
            generation_command.append("--replace_flag")
            
        run_command(generation_command, cwd=str(WAN_ANIMATE_REPO_PATH))
        print("[WAN-ANIMATE] Video generation complete.")

        result_folders = sorted([d for d in preprocess_output_path.iterdir() if d.is_dir()], key=os.path.getmtime, reverse=True)
        if not result_folders:
            raise FileNotFoundError("Could not find result folder from Wan-Animate generation.")
            
        final_video_path = result_folders[0] / "video.mp4"
        if not final_video_path.exists():
            raise FileNotFoundError(f"Could not find 'video.mp4' in the result folder: {result_folders[0]}")
            
        print(f"[RESULT] Final video found at: {final_video_path}")
        with open(final_video_path, "rb") as f:
            video_data_base64 = base64.b64encode(f.read()).decode("utf-8")

        return jsonify({"status": "success", "video_data": video_data_base64, "mime_type": "video/mp4"})

    except Exception as e:
        print(f"[ERROR] An error occurred: {str(e)}")
        return jsonify({"status": "error", "error": str(e)}), 500
    finally:
        try:
            import shutil
            shutil.rmtree(temp_session_folder)
            print(f"[CLEANUP] Removed temporary session folder: {temp_session_folder}")
        except Exception as cleanup_error:
            print(f"[CLEANUP ERROR] Failed to remove temp folder {temp_session_folder}: {cleanup_error}")


# --- Static File Serving for the Frontend (FIXED for MIME Types) ---
@app.route('/')
def index():
    print("[SERVER] Request for root path, serving index.html...")
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # This is the crucial fix. We manually set the MIME type for .tsx files.
    if path.endswith(".tsx"):
        print(f"[SERVER] Request for .tsx file: {path}. Serving with 'application/javascript' MIME type.")
        return send_from_directory(app.static_folder, path, mimetype='application/javascript')
    
    print(f"[SERVER] Request for static file: {path}")
    # Let Flask handle other file types automatically
    return send_from_directory(app.static_folder, path)
    
# --- Main Execution ---
if __name__ == "__main__":
    ngrok_auth_token = os.environ.get("NGROK_AUTH_TOKEN")
    if not ngrok_auth_token:
        print("[ERROR] NGROK_AUTH_TOKEN environment variable not set.")
    else:
        ngrok.set_auth_token(ngrok_auth_token)
        public_url = ngrok.connect(PORT).public_url
        print("=" * 80)
        print("Your all-in-one AI Video App is running!")
        print(f"\nClick this Public URL to open it: {public_url}")
        print("=" * 80)
    
    app.run(port=PORT)
