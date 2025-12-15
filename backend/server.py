import os
import sys

sys.path.append("./CreatiLayout")

import base64
from io import BytesIO

import torch
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image
from utils.bbox_visualization import bbox_visualization, scale_boxes
from utils.server_utils import (
    encode_image,
    generate_description,
    generate_global_caption_and_refinements,
    load_model,
)
import logging
from datetime import datetime
from typing import Optional, Callable, Dict
from threading import Lock

def fix_base64_padding(base64_string):
    """Fix base64 padding by adding missing padding characters"""
    # Remove data URL prefix if present (e.g., "data:image/png;base64,")
    if ',' in base64_string:
        base64_string = base64_string.split(',', 1)[1]
    
    # Add padding if necessary
    missing_padding = len(base64_string) % 4
    if missing_padding:
        base64_string += '=' * (4 - missing_padding)
    
    return base64_string

# Object detection imports
try:
    from ultralytics import YOLOWorld
    import cv2
    import numpy as np
    OBJECT_DETECTION_AVAILABLE = True
    print("Object detection module loaded successfully")
except ImportError:
    OBJECT_DETECTION_AVAILABLE = False
    print("Warning: ultralytics not installed. Object detection features will be disabled.")

now = datetime.now()
timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
filename = timestamp

# 로그 디렉토리 생성
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# 사용자별 로거 딕셔너리
user_loggers = {}

def get_user_logger(user_id: str):
    """사용자 ID에 따른 로거 반환"""
    if user_id not in user_loggers:
        user_log_filename = os.path.join(log_dir, f"{user_id}_{timestamp}.log")
        user_logger = logging.getLogger(f"user_{user_id}")
        user_logger.setLevel(logging.INFO)
        
        # 핸들러가 이미 있는지 확인 (중복 방지)
        if not user_logger.handlers:
            handler = logging.FileHandler(user_log_filename)
            handler.setLevel(logging.INFO)
            formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
            handler.setFormatter(formatter)
            user_logger.addHandler(handler)
            user_logger.propagate = False  # 중복 로그 방지
        
        user_loggers[user_id] = user_logger
        print(f"Created logger for user: {user_id}, log file: {user_log_filename}")
    
    return user_loggers[user_id]

# 기본 로거 설정 (백워드 호환성을 위해)
log_filename = os.path.join(log_dir, f"server_log_{timestamp}.log")
logging.basicConfig(
    filename=log_filename,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder=None)
CORS(app, origins="*")

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
seed = 42
batch_size = 1
num_inference_steps = 50
guidance_scale = 3.5
# Default resolution - will be adjusted based on model type
height = 512
width = 512

save_root = "output"

# Model configuration
current_model_type = "flux"  # Default to FLUX
pipe = load_model(device, current_model_type)

# Set resolution based on model type
height = 512
width = 512

# Load YOLO model for object detection
yolo_model = None
if OBJECT_DETECTION_AVAILABLE:
    try:
        yolo_model = YOLOWorld("yolov8s-world.pt")  # or yolov8s.pt
        print("YOLO model loaded successfully")
    except Exception as e:
        print(f"Failed to load YOLO model: {e}")
        OBJECT_DETECTION_AVAILABLE = False

progress_status = {
    "progress": 0
}
progress_lock = Lock()

def log_event(event: str, details: dict, level: str = "INFO", user_id: str = "default"):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "event": event,
        "details": details,
        "platform": "backend",
        "user_id": user_id,
    }
    
    # 사용자별 로거 사용
    user_logger = get_user_logger(user_id)
    
    if level == "INFO":
        user_logger.info(json.dumps(log_entry))
    elif level == "ERROR":
        user_logger.error(json.dumps(log_entry))
    else:
        user_logger.debug(json.dumps(log_entry))

def update_progress(self, step: int, timestep: int, callback_kwargs: dict):
    with progress_lock:
        step += 1
        progress = int((step / num_inference_steps) * 100) 
        progress_status["progress"] = progress
        # print(f"[progress callback] step={step}, progress={progress}")
    return callback_kwargs


@app.route("/generate-caption", methods=["POST"])
def generate_caption_route():
    with progress_lock:
        progress_status["progress"] = 0

    data = request.get_json()
    sentences = data.get("sentences", [])
    global_caption = data.get("globalCaption", "")
    required_keywords = data.get("requiredKeywords", None)
    user_id = data.get("user_id", "unknown")

    log_event("generate_caption_requested", {
        "sentences": sentences,
        "global_caption": global_caption,
        "required_keywords": required_keywords
    }, user_id=user_id)

    result = generate_global_caption_and_refinements(sentences, global_caption, required_keywords)

    log_event("generate_caption_completed", {
        "refinements": result
    }, user_id=user_id)

    return jsonify(result)


@app.route("/generate", methods=["POST"])
def generate():
    with progress_lock:
        progress_status["progress"] = 2

    data = request.get_json()
    global_caption = data.get("global_caption")
    region_caption_list = data.get("region_caption_list")
    region_bboxes_list = data.get("region_bboxes_list")
    user_id = data.get("user_id", "unknown")

    log_event("image_generation_requested", {
        "global_caption": global_caption,
        "region_captions": region_caption_list,
        "region_bboxes": region_bboxes_list,
        # "timestamp_dir": timestamp_dir,
    }, user_id=user_id)

    try:
        with torch.no_grad():
            images = pipe(
                prompt=global_caption * batch_size,
                generator=torch.Generator(device=device).manual_seed(seed),
                num_inference_steps=num_inference_steps,
                guidance_scale=guidance_scale,
                bbox_phrases=region_caption_list,
                bbox_raw=region_bboxes_list,
                height=height,
                width=width,
                callback_on_step_end=update_progress,
            )
    except Exception as e:
        log_event("image_generation_failed", {
            "error": str(e)
        }, level="ERROR", user_id=user_id)
        raise

    with progress_lock:
        progress_status["progress"] = 100

    images = images.images
    img_base64 = encode_image(images[0])

    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    
    # ✅ 사용자별 디렉토리 생성
    user_dir = os.path.join(save_root, user_id)
    timestamp_dir = os.path.join(user_dir, timestamp)
    os.makedirs(timestamp_dir, exist_ok=True)

    # ✅ Prompt 저장
    prompt_path = os.path.join(timestamp_dir, "prompt.json")
    with open(prompt_path, "w") as f:
        json.dump({
            "global_caption": global_caption,
            "region_captions": region_caption_list,
            "region_bboxes": region_bboxes_list
        }, f, indent=2)

    log_event("prompt_saved", {
        "path": prompt_path
    }, user_id=user_id)

    for j, image in enumerate(images):
        image_path = os.path.join(timestamp_dir, "image.png")
        image.save(image_path)

        log_event("image_saved", {
            "path": image_path
        }, user_id=user_id)

        img_with_layout_save_name = os.path.join(timestamp_dir,"image_with_layout.png")

        white_image = Image.new("RGB", (width, height), color="rgb(256,256,256)")
        show_input = {
            "boxes": scale_boxes(region_bboxes_list, width, height),
            "labels": region_caption_list,
        }

        bbox_visualization_img = bbox_visualization(white_image, show_input, font_size = 15)
        image_with_bbox = bbox_visualization(image, show_input, font_size = 15)

        new_image = Image.new("RGB", (width * 2, height))
        new_image.paste(bbox_visualization_img, (0, 0))
        new_image.paste(image_with_bbox, (width, 0))
        new_image.save(img_with_layout_save_name)

        log_event("image_with_layout_saved", {
            "path": img_with_layout_save_name
        }, user_id=user_id)

    # Perform object detection on generated image
    detected_objects = []
    if OBJECT_DETECTION_AVAILABLE and yolo_model is not None:
        try:
            # Convert PIL to OpenCV format
            image_cv = cv2.cvtColor(np.array(images[0]), cv2.COLOR_RGB2BGR)
            
            # Ensure image dimensions are compatible with YOLO
            img_height, img_width = image_cv.shape[:2]
            if img_height % 32 != 0 or img_width % 32 != 0:
                # Resize to nearest multiple of 32
                new_height = ((img_height + 31) // 32) * 32
                new_width = ((img_width + 31) // 32) * 32
                image_cv = cv2.resize(image_cv, (new_width, new_height))
            
            # Run object detection
            results = yolo_model(image_cv)
            boxes = results[0].boxes
            names = yolo_model.names
            
            # Extract bounding boxes and labels
            for box in boxes:
                cls_id = int(box.cls)
                label = names[cls_id]
                conf = box.conf.item()
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                
                # Scale back to original image size if resized
                if img_height % 32 != 0 or img_width % 32 != 0:
                    scale_x = width / new_width
                    scale_y = height / new_height
                    x1 = int(x1 * scale_x)
                    y1 = int(y1 * scale_y)
                    x2 = int(x2 * scale_x)
                    y2 = int(y2 * scale_y)
                
                detected_objects.append({
                    "label": label,
                    "confidence": conf,
                    "bbox": [x1, y1, x2, y2]
                })
            
            log_event("object_detection_integrated", {
                "objects_count": len(detected_objects)
            }, user_id=user_id)
            
        except Exception as e:
            log_event("object_detection_failed", {
                "error": str(e)
            }, level="ERROR", user_id=user_id)

    # Log final image generation completion with all paths
    log_event("image_generation_completed", {
        "image_path": image_path,
        "image_with_layout_path": img_with_layout_save_name,
        "timestamp_dir": timestamp_dir,
        "global_caption": global_caption,
        "detected_objects_count": len(detected_objects)
    }, user_id=user_id)

    return jsonify({
        "image": img_base64, 
        "globalCaption": global_caption,
        "detectedObjects": detected_objects,
        "imagePath": image_path,
        "imageWithLayoutPath": img_with_layout_save_name,
        "timestampDir": timestamp_dir
    })

@app.route("/progress", methods=["GET"])
def get_progress():
    with progress_lock:
        return jsonify(progress_status)

@app.route("/describe", methods=["POST"])
def describe_region():
    data = request.get_json()
    base64_image = data.get("image", "")
    crop_box = data.get("crop_box", [])
    detected_label = data.get("detected_label", "")
    user_id = data.get("user_id", "unknown")

    log_event("describe_requested", {
        "crop_box": crop_box,
        "detected_label": detected_label
    }, user_id=user_id)

    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")

    # ✅ 사용자별 디렉토리 생성
    user_dir = os.path.join(save_root, user_id)
    timestamp_dir = os.path.join(user_dir, timestamp)
    os.makedirs(timestamp_dir, exist_ok=True)

    # ✅ Prompt 저장
    prompt_path = os.path.join(timestamp_dir, "prompt.json")
    with open(prompt_path, "w") as f:
        json.dump({
            "detected_label": detected_label,
            "crop_box": crop_box
        }, f, indent=2)

    image_bytes = base64.b64decode(fix_base64_padding(base64_image))
    full_image = Image.open(BytesIO(image_bytes)).convert("RGB")

    region = full_image.crop(crop_box)
    region_path = os.path.join(timestamp_dir, "region.png")
    region.save(region_path)

    log_event("describe_region_saved", {
        "region_path": region_path
    }, user_id=user_id)

    classification, noun_phrase, description = generate_description(region, detected_label)

    log_event("describe_result", {
        "classification": classification,
        "noun_phrase": noun_phrase,
        "description": description
    }, user_id=user_id)

    return jsonify({
        "classification": classification,
        "label": noun_phrase,
        "description": description
    })

@app.route("/detect-objects", methods=["POST"])
def detect_objects():
    if not OBJECT_DETECTION_AVAILABLE or yolo_model is None:
        return jsonify({"error": "Object detection not available"}), 500
    
    data = request.get_json()
    base64_image = data.get("image", "")
    user_id = data.get("user_id", "unknown")
    
    if not base64_image:
        return jsonify({"error": "No image provided"}), 400
    
    log_event("object_detection_requested", {}, user_id=user_id)
    
    try:
        # Convert base64 to image
        image_bytes = base64.b64decode(fix_base64_padding(base64_image))
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        
        # Convert PIL to OpenCV format
        image_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Ensure image dimensions are compatible with YOLO
        height, width = image_cv.shape[:2]
        if height % 32 != 0 or width % 32 != 0:
            # Resize to nearest multiple of 32
            new_height = ((height + 31) // 32) * 32
            new_width = ((width + 31) // 32) * 32
            image_cv = cv2.resize(image_cv, (new_width, new_height))
        
        # Run object detection
        results = yolo_model(image_cv)
        boxes = results[0].boxes
        names = yolo_model.names
        
        # Extract bounding boxes and labels
        detected_objects = []
        for box in boxes:
            cls_id = int(box.cls)
            label = names[cls_id]
            conf = box.conf.item()
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            
            detected_objects.append({
                "label": label,
                "confidence": conf,
                "bbox": [x1, y1, x2, y2]
            })
        
        log_event("object_detection_completed", {
            "objects_count": len(detected_objects)
        }, user_id=user_id)
        
        return jsonify({"objects": detected_objects})
        
    except Exception as e:
        log_event("object_detection_failed", {
            "error": str(e)
        }, level="ERROR", user_id=user_id)
        return jsonify({"error": str(e)}), 500

@app.route("/switch-model", methods=["POST"])
def switch_model():
    # Always return FLUX as the current model, ignore any switch requests
    return jsonify({
        "message": "Using FLUX model",
        "current_model": "flux",
        "resolution": "512x512"
    })

@app.route("/current-model", methods=["GET"])
def get_current_model():
    return jsonify({
        "current_model": "flux",
        "available_models": ["flux"]
    })

@app.route("/api/log", methods=["POST"])
def log_from_frontend():
    data = request.get_json()
    event = data.get("event")
    details = data.get("details", {})
    session_id = data.get("session_id", "unknown")
    user_id = data.get("user_id", "unknown")

    log_event(event, {
        **details,
        "session_id": session_id,
        "user_id": user_id
    }, user_id=user_id)

    return jsonify({"status": "ok"})

from flask import send_from_directory

REACT_BUILD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "build"))

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react_app(path):
    target_path = os.path.join(REACT_BUILD_DIR, path)
    print("Serving from:", target_path)

    if path != "" and os.path.exists(target_path):
        return send_from_directory(REACT_BUILD_DIR, path)
    else:
        return send_from_directory(REACT_BUILD_DIR, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
