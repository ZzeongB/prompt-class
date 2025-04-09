import sys
import os
sys.path.append("./CreatiLayout")

from flask import Flask, jsonify, request
from flask_cors import CORS
import torch
import os 
from utils.bbox_visualization import bbox_visualization,scale_boxes
from PIL import Image
from src.models.transformer_sd3_SiamLayout import SiamLayoutSD3Transformer2DModel
from src.pipeline.pipeline_sd3_CreatiLayout import CreatiLayoutSD3Pipeline
import base64
from io import BytesIO

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
seed = 42
batch_size = 1
num_inference_steps = 50
guidance_scale = 7.5
height = 1024
width = 1024

save_root = "output"
img_save_root = os.path.join(save_root,"images")
os.makedirs(img_save_root,exist_ok=True)
img_with_layout_save_root = os.path.join(save_root,"images_with_layout")
os.makedirs(img_with_layout_save_root,exist_ok=True)

def load_model():
    model_path = "stabilityai/stable-diffusion-3-medium-diffusers"
    ckpt_path = "HuiZhang0812/CreatiLayout"
    transformer_additional_kwargs = dict(attention_type="layout",strict=True)
    transformer = SiamLayoutSD3Transformer2DModel.from_pretrained(
         ckpt_path, subfolder="SiamLayout_SD3", torch_dtype=torch.float16,**transformer_additional_kwargs)
    pipe = CreatiLayoutSD3Pipeline.from_pretrained(model_path, transformer=transformer, torch_dtype=torch.float16)
    pipe = pipe.to(device)
    return pipe

pipe = load_model()

@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    global_caption = ["red car on the road with metal wheels"]
    region_caption_list = data.get("region_caption_list")
    region_bboxes_list = data.get("region_bboxes_list")
    print("Sucessfully received data", region_caption_list, region_bboxes_list)

    filename = "Car"

    with torch.no_grad():
        images = pipe(prompt = global_caption*batch_size,
                    generator = torch.Generator(device=device).manual_seed(seed),
                    num_inference_steps = num_inference_steps,
                    guidance_scale = guidance_scale,
                    bbox_phrases = region_caption_list, 
                    bbox_raw = region_bboxes_list,
                    height = height,
                    width = width
                )
    images=images.images
    
    print("Sucessfully generated images")
    
    for j, image in enumerate(images):   

        image.save(os.path.join(img_save_root,f"{filename}_{j}.png")) 

        img_with_layout_save_name=os.path.join(img_with_layout_save_root,f"{filename}_{j}.png")

        white_image = Image.new('RGB', (width, height), color='rgb(256,256,256)')
        show_input = {"boxes":scale_boxes(region_bboxes_list,width,height),"labels":region_caption_list}

        bbox_visualization_img = bbox_visualization(white_image,show_input)
        image_with_bbox = bbox_visualization(image ,show_input)

        total_width = width*2
        total_height = height

        new_image = Image.new('RGB', (total_width, total_height))
        new_image.paste(bbox_visualization_img, (0, 0))
        new_image.paste(image_with_bbox, (width, 0))
        new_image.save(img_with_layout_save_name)
        
    print("Sucessfully saved images")
    # generate 함수 안 마지막 부분
    img_io = BytesIO()
    new_image.save(img_io, format="PNG")
    img_io.seek(0)
    img_base64 = base64.b64encode(img_io.read()).decode("utf-8")

    return jsonify({"image": img_base64})

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
