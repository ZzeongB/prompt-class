import os
import sys

sys.path.append("./CreatiLayout")

import base64
from io import BytesIO

import torch
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

now = datetime.now()
timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
filename = timestamp

# 로그 디렉토리 생성
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# 로거 설정
log_filename = os.path.join(log_dir, f"server_log_{timestamp}.log")
logging.basicConfig(
    filename=log_filename,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
seed = 42
batch_size = 1
num_inference_steps = 50
guidance_scale = 3.5
height = 512
width = 512

save_root = "output"
img_save_root = os.path.join(save_root, "images")
os.makedirs(img_save_root, exist_ok=True)
img_with_layout_save_root = os.path.join(save_root, "images_with_layout")
os.makedirs(img_with_layout_save_root, exist_ok=True)

pipe = load_model(device)

progress_status = {
    "progress": 0
}
progress_lock = Lock()

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

    logger.info(f"Received generate-caption request: {data}")

    result = generate_global_caption_and_refinements(sentences, global_caption)

    logger.info(f"Generated captions: {result}")
    return jsonify(result)


@app.route("/generate", methods=["POST"])
def generate():
    with progress_lock:
        progress_status["progress"] = 2
        
    data = request.get_json()
    global_caption = data.get("global_caption")
    region_caption_list = data.get("region_caption_list")
    region_bboxes_list = data.get("region_bboxes_list")

    logger.info(f"Received generate request: global_caption={global_caption}, regions={region_caption_list}, boxes={region_bboxes_list}")
    
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
    
    with progress_lock:
        progress_status["progress"] = 100
        
    images = images.images

    logger.info("Successfully generated images.")

    img_base64 = encode_image(images[0])

    now = datetime.now()
    timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")
    filename = timestamp

    for j, image in enumerate(images):
        image_path = os.path.join(img_save_root, f"{filename}_{j}.png")
        image.save(image_path)
        logger.info(f"Saved image: {image_path}")

        img_with_layout_save_name = os.path.join(img_with_layout_save_root, f"{filename}_{j}.png")

        white_image = Image.new("RGB", (width, height), color="rgb(256,256,256)")
        show_input = {
            "boxes": scale_boxes(region_bboxes_list, width, height),
            "labels": region_caption_list,
        }

        bbox_visualization_img = bbox_visualization(white_image, show_input)
        image_with_bbox = bbox_visualization(image, show_input)

        total_width = width * 2
        total_height = height

        new_image = Image.new("RGB", (total_width, total_height))
        new_image.paste(bbox_visualization_img, (0, 0))
        new_image.paste(image_with_bbox, (width, 0))
        new_image.save(img_with_layout_save_name)
        logger.info(f"Saved image with layout: {img_with_layout_save_name}")

    return jsonify({"image": img_base64, "globalCaption": global_caption})

@app.route("/progress", methods=["GET"])
def get_progress():
    with progress_lock:
        return jsonify(progress_status)

@app.route("/describe", methods=["POST"])
def describe_region():
    data = request.get_json()
    base64_image = data.get("image", "")
    crop_box = data.get("crop_box", [])
    global_caption = data.get("global_caption", "")

    logger.info(f"Received describe request: crop_box={crop_box}, global_caption={global_caption}")

    # decode base64 image
    image_bytes = base64.b64decode(base64_image)
    full_image = Image.open(BytesIO(image_bytes)).convert("RGB")

    # crop region
    region = full_image.crop(crop_box)
    region_path = os.path.join(img_save_root, "_region.png")
    region.save(region_path)
    logger.info(f"Saved region image: {region_path}")

    response_text = generate_description(region, global_caption)
    logger.info(f"Response from OpenAI: {response_text}")

    return jsonify({"description": response_text})


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
