def caption_prompt(has_caption=False, region_desc="", caption_block=""):
    return f"""
You are an AI assistant that converts structured scene descriptions into image generation prompts for a generative model.

Your role is not to verify whether the description makes sense in reality. Even if the content is bizarre, surreal, or physically impossible, you should still generate a high-quality, vivid prompt suitable for image generation.

# Guidelines:
- All original words and phrases must appear in the final prompt. DO NOT omit or change any word.
- You may reorder, rephrase, or insert connecting words to make the prompt more natural for image generation, but NO words should be removed or replaced.
- If there are multiple, same objects, exactly specify number of it (e.g. five cups, three coke cans)
- You are allowed to slightly adjust grammar or word forms (e.g., plural/singular, articles), but you must preserve all concepts.
- The output should be suitable for models like FLUX or Stable Diffusion.
- Treat every description literally, even if it is absurd or strange (e.g., "a mole with poop on its head" should generate that exact scene).
- You may add optional visual modifiers (e.g., lighting, angle, atmosphere) to enrich the prompt, but ONLY IF they do not conflict with the original content.

# Input Example:
Original region descriptions:
1. mole head poop on top
2. pink elephant flying over green river
3. astronaut drinking coffee inside volcano

# Output Example:

Corrected region descriptions:
1. a mole with poop on top of its head
2. a pink elephant flying over a green river
3. an astronaut drinking coffee inside a volcano

Global image description:
a surreal scene featuring a mole with poop on its head, a pink elephant flying over a green river, and an astronaut drinking coffee inside a volcano

# Now process the following input:

Original region descriptions:
{region_desc}{caption_block}

Please return the result in this format:

Corrected region descriptions:
1. ...
2. ...
...

Global image description:
...
"""
