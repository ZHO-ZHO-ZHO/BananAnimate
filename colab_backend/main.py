import base64
import mimetypes
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from flask import Flask, abort, jsonify, request, send_from_directory
from flask_cors import CORS
from pyngrok import conf, ngrok

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT
ARTIFACTS_DIR = PROJECT_ROOT / 'colab_backend' / 'artifacts'
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('application/json', '.map')

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path='')
CORS(app)


def _decode_base64(data: str) -> bytes:
    padding = len(data) % 4
    if padding:
        data = f"{data}{'=' * (4 - padding)}"
    return base64.b64decode(data)


def _save_artifact(content: bytes, suffix: str) -> Path:
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
    path = ARTIFACTS_DIR / f"{timestamp}{suffix}"
    path.write_bytes(content)
    return path


@app.route('/')
def serve_index() -> str:
    return send_from_directory(str(FRONTEND_DIR), 'index.html')


@app.route('/<path:filename>')
def serve_static_file(filename: str):
    file_path = FRONTEND_DIR / filename
    if file_path.is_file():
        return send_from_directory(str(FRONTEND_DIR), filename)
    abort(404)


@app.route('/generate-video', methods=['POST'])
def generate_video():
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'status': 'error', 'error': 'Invalid JSON payload supplied.'}), 400

    required_fields = [
        'original_image',
        'image_mime_type',
        'edit_prompt',
        'motion_video',
        'video_mime_type',
        'scene_prompt',
        'mode',
    ]
    missing = [field for field in required_fields if not payload.get(field)]
    if missing:
        missing_list = ', '.join(missing)
        return jsonify({'status': 'error', 'error': f'Missing required fields: {missing_list}'}), 400

    try:
        original_image_bytes = _decode_base64(payload['original_image'])
        motion_video_bytes = _decode_base64(payload['motion_video'])
    except Exception as exc:  # pylint: disable=broad-except
        return (
            jsonify({'status': 'error', 'error': f'Failed to decode base64 payloads: {exc}'}),
            400,
        )

    image_suffix = mimetypes.guess_extension(payload['image_mime_type']) or '.bin'
    video_suffix = mimetypes.guess_extension(payload['video_mime_type']) or '.mp4'
    image_path = _save_artifact(original_image_bytes, image_suffix)
    video_path = _save_artifact(motion_video_bytes, video_suffix)

    print('Received generation request:')
    print(f" - Edit prompt: {payload['edit_prompt']}")
    print(f" - Scene prompt: {payload['scene_prompt']}")
    print(f" - Animation mode: {payload['mode']}")
    print(f" - Saved original image to: {image_path}")
    print(f" - Saved motion video to: {video_path}")
    print('Returning the uploaded motion video as a placeholder result.')

    return jsonify(
        {
            'status': 'success',
            'video_data': payload['motion_video'],
            'mime_type': payload['video_mime_type'] or 'video/mp4',
            'detail': 'Placeholder result: the returned clip is the uploaded motion video. Replace this logic with your model.',
        }
    )


@app.route('/healthz', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})


def _start_ngrok(port: int) -> Optional[str]:
    auth_token = os.environ.get('NGROK_AUTH_TOKEN')
    if not auth_token:
        print('⚠️  NGROK_AUTH_TOKEN environment variable not set. Serving on the local Colab URL only.')
        return None

    conf.get_default().auth_token = auth_token
    public_url = ngrok.connect(addr=port, proto='http', bind_tls=True)
    return public_url.public_url


def main() -> None:
    port = int(os.environ.get('PORT', 5000))

    if not os.environ.get('GEMINI_API_KEY'):
        print('⚠️  GEMINI_API_KEY environment variable not set. Image editing will fail until it is provided.')

    public_url: Optional[str] = None
    try:
        public_url = _start_ngrok(port)
    except Exception as exc:  # pylint: disable=broad-except
        print(f'⚠️  Failed to establish ngrok tunnel: {exc}')

    if public_url:
        print('=' * 78)
        print('Your all-in-one AI Video App is running!\n')
        print(f'Click this Public URL to open it: {public_url}')
        print('=' * 78)
    else:
        print(f'Open the app via the local URL: http://127.0.0.1:{port}')

    try:
        app.run(host='0.0.0.0', port=port, debug=False)
    finally:
        if public_url:
            ngrok.disconnect(public_url)
            ngrok.kill()


if __name__ == '__main__':
    main()
