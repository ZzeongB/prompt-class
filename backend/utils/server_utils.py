import os
import re

import openai
import torch
from dotenv import load_dotenv

from src.models.transformer_sd3_SiamLayout import SiamLayoutSD3Transformer2DModel
from src.pipeline.pipeline_sd3_CreatiLayout import CreatiLayoutSD3Pipeline
from src.pipeline.pipeline_sd3_CreatiLayout import CreatiLayoutSD3Pipeline

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")


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


def generate_global_caption_and_refinements(sentences):
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

    response = openai.ChatCompletion.create(
        model="gpt-4",  # 또는 gpt-3.5-turbo / gpt-4o 등 사용 가능
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = response["choices"][0]["message"]["content"]

    # 지역 설명 파싱
    region_matches = re.findall(r"^\d+\.\s(.+)", response_text, re.MULTILINE)

    # 글로벌 설명 파싱
    global_match = re.search(r"Global image description:\s*([\s\S]+)", response_text)
    global_caption = global_match.group(1).strip() if global_match else ""

    return {"refined_captions": region_matches, "global_caption": global_caption}
