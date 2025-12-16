import base64
import os
import re
from io import BytesIO

import torch
from dotenv import load_dotenv
from openai import OpenAI
from src.models.transformer_flux_SiamLayout import FluxTransformer2DModel
from src.pipeline.pipeline_flux_CreatiLayout import CreatiLayoutFluxPipeline
from src.models.transformer_sd3_SiamLayout import SiamLayoutSD3Transformer2DModel
from src.pipeline.pipeline_sd3_CreatiLayout import CreatiLayoutSD3Pipeline

from utils.prompt import caption_prompt, description_prompt

load_dotenv()
client = OpenAI(
    api_key=os.environ["OPENAI_API_KEY"],  # this is also the default, it can be omitted
)
from datetime import datetime
now = datetime.now()
timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")


def load_model(device, model_type="flux"):
    """
    Load CreatiLayout model based on model_type
    Args:
        device: torch device
        model_type: "flux" or "sd3"
    """
    if model_type.lower() == "sd3":
        # STABLE DIFFUSION 3
        model_path = "stabilityai/stable-diffusion-3-medium-diffusers"
        ckpt_path = "HuiZhang0812/CreatiLayout"
        transformer_additional_kwargs = dict(attention_type="layout", strict=True)
        transformer = SiamLayoutSD3Transformer2DModel.from_pretrained(
            ckpt_path,
            subfolder="SiamLayout_SD3",
            torch_dtype=torch.float16,
            **transformer_additional_kwargs,
        )
        pipe = CreatiLayoutSD3Pipeline.from_pretrained(
            model_path, transformer=transformer, torch_dtype=torch.float16
        )
        pipe = pipe.to(device)
        print(f"✅ Loaded Stable Diffusion 3 model")
        return pipe
    
    elif model_type.lower() == "flux":
        # FLUX
        model_path = "/data/FLUX.1-dev"  # "black-forest-labs/FLUX.1-dev"
        ckpt_path = "/data/CreatiLayout"  # "HuiZhang0812/CreatiLayout"
        transformer_additional_kwargs = dict(
            attention_type="layout",
            double_blocks_index=[i for i in range(0, 19, 1)],
            single_blocks_index=[i for i in range(0, 38, 1)],
            is_add=True,
            max_boxes_token_length=30,
            fix_bbox_ids=True,
            strict=True,
        )
        transformer = FluxTransformer2DModel.from_pretrained(
            ckpt_path,
            subfolder="SiamLayout_FLUX",
            torch_dtype=torch.bfloat16,
            **transformer_additional_kwargs,
        )
        pipe = CreatiLayoutFluxPipeline.from_pretrained(
            model_path, transformer=transformer, torch_dtype=torch.bfloat16
        )
        pipe = pipe.to(device)
        print(f"✅ Loaded FLUX model")
        return pipe
    
    else:
        raise ValueError(f"Unsupported model type: {model_type}. Use 'flux' or 'sd3'")


def encode_image(image):
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


# No longer needed - user's original sentences are used directly
# def safe_split_refined_captions(text, expected_count):
#     # 먼저 1. ... 형태로 나누기
#     matches = re.findall(r"^\d+\.\s(.+)", text, re.MULTILINE)
#
#     # 정확히 기대 개수만큼이면 바로 리턴
#     if len(matches) == expected_count:
#         return matches
#
#     # fallback: 숫자 라벨 없이 줄 단위로 대체
#     lines = [line.strip() for line in text.splitlines() if line.strip()]
#     fallback_lines = [
#         line
#         for line in lines
#         if not line.lower().startswith("global image description")
#     ]
#
#     # 만약 여전히 길이 다르면, 자르거나 채우기
#     while len(fallback_lines) < expected_count:
#         fallback_lines.append("")  # 비어 있는 문장으로 패딩
#     return fallback_lines[:expected_count]


def generate_global_caption_and_refinements(
    sentences,
    global_caption="",
    required_keywords=None,
    max_retries=2
):
    """
    Generate global image description from region descriptions.
    Note: Returns user's original sentences unchanged, only generates global caption.
    """
    required_keywords = required_keywords or []

    def contains_all_required(text, keywords):
        text_lower = text.lower()
        return all(k.lower() in text_lower for k in keywords)

    for attempt in range(max_retries):
        has_caption = bool(global_caption)
        region_desc = "\n".join([f"{i+1}. {s}" for i, s in enumerate(sentences)])
        caption_block = f"\nPreliminary global description:\n{global_caption}" if has_caption else ""
        prompt = caption_prompt(has_caption, region_desc, caption_block, required_keywords)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = response.choices[0].message.content

        # Only parse global caption (no region refinements needed)
        global_match = re.search(r"Global image description:\s*([\s\S]+)", response_text)
        global_caption = global_match.group(1).strip() if global_match else ""

        # Check if all required keywords are in the global caption
        if contains_all_required(global_caption, required_keywords):
            return {
                "global_caption": global_caption
            }

        print(f"🔁 Retry #{attempt + 1} due to missing required keywords: {required_keywords}")

    # Return even if keywords missing after retries
    return {
        "global_caption": global_caption
    }


def generate_description(region, detected_label=""):
    """
    Generate image classification label, noun phrase, and description for a cropped region.
    Args:
        region: PIL Image of the cropped region
        detected_label: YOLO detected object label (e.g., "person", "car", "dog")
    Returns: (classification, noun_phrase, description)
    """
    # OpenAI Vision API 호출 (올바른 형식)
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": description_prompt(detected_label)
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": "data:image/png;base64," + encode_image(region)
                        }
                    },
                ],
            }
        ],
        max_tokens=300,
    )

    # 응답 텍스트 추출
    response_text = response.choices[0].message.content.strip()

    # 새로운 형식 파싱: classification | noun_phrase | description
    try:
        parts = [p.strip() for p in response_text.split("|")]
        if len(parts) >= 3:
            classification = parts[0].lower()
            noun_phrase = parts[1].lower()
            description = parts[2]
        else:
            # Fallback: 이전 형식 (noun_phrase: description)
            print("⚠️ Warning: Response not in expected format, using fallback parsing")
            if ":" in response_text:
                noun_phrase, description = map(str.strip, response_text.split(":", 1))
                noun_phrase = noun_phrase.lower()
                classification = "object"  # Default classification
            else:
                classification = "object"
                noun_phrase = response_text.lower()
                description = response_text
    except Exception as e:
        print(f"⚠️ Error parsing response: {e}")
        classification = "object"
        noun_phrase = "unknown"
        description = response_text

    print(f"📊 Description result - Class: {classification}, Noun: {noun_phrase}, Desc: {description}")
    return classification, noun_phrase, description
