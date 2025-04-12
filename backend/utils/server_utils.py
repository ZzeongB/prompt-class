import os
import re

from openai import OpenAI
import torch
from dotenv import load_dotenv

import base64
from io import BytesIO

from src.models.transformer_sd3_SiamLayout import SiamLayoutSD3Transformer2DModel
from src.pipeline.pipeline_sd3_CreatiLayout import CreatiLayoutSD3Pipeline
from src.pipeline.pipeline_sd3_CreatiLayout import CreatiLayoutSD3Pipeline

load_dotenv()
client = OpenAI(
  api_key=os.environ['OPENAI_API_KEY'],  # this is also the default, it can be omitted
)

def load_model(device):
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
    return pipe


def encode_image(image):
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def safe_split_refined_captions(text, expected_count):
    # 먼저 1. ... 형태로 나누기
    matches = re.findall(r"^\d+\.\s(.+)", text, re.MULTILINE)

    # 정확히 기대 개수만큼이면 바로 리턴
    if len(matches) == expected_count:
        return matches

    # fallback: 숫자 라벨 없이 줄 단위로 대체
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    fallback_lines = [
        line for line in lines
        if not line.lower().startswith("global image description")
    ]

    # 만약 여전히 길이 다르면, 자르거나 채우기
    while len(fallback_lines) < expected_count:
        fallback_lines.append("")  # 비어 있는 문장으로 패딩
    return fallback_lines[:expected_count]

def generate_global_caption_and_refinements(sentences):
    # 프롬프트 구성
    prompt = f"""The following are region-level descriptions of objects in an image. 

1. Please correct each sentence to be grammatically correct and natural, without adding extra details.
2. Then, write one sentence that summarizes the overall image based on the corrected descriptions.

Original region descriptions:
{chr(10).join([f"{i+1}. {s}" for i, s in enumerate(sentences)])}

Please return the result in this format:

Corrected region descriptions:
1. ...
2. ...
...

Global image description:
..."""

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )

    response_text = response.choices[0].message.content

    # 파싱
    region_matches = re.findall(r"^\d+\.\s(.+)", response_text, re.MULTILINE)
    global_match = re.search(r"Global image description:\s*([\s\S]+)", response_text)
    global_caption = global_match.group(1).strip() if global_match else ""

    # 안전 처리
    if len(region_matches) != len(sentences):
        print("⚠️ Warning: refined captions count mismatch! Trying fallback parsing.")
        region_matches = safe_split_refined_captions(response_text, len(sentences))

    return {
        "refined_captions": region_matches,
        "global_caption": global_caption
    }

def generate_description(region, global_caption):
    # OpenAI Vision API 호출 (gpt-4-vision)
    response = client.responses.create(
        model="gpt-4o-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": f"Describe this part of the image. {global_caption}"},
                    {
                        "type": "input_image",
                        "image_url": "data:image/png;base64," + encode_image(region),
                    },
                ],
            }
        ],
    )
    
    # 응답 텍스트 추출
    response_text = response.output_text
    # 응답에서 설명 추출
    print("Response from OpenAI:", response_text)
    return response_text
