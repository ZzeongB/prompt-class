def caption_prompt(has_caption=False, region_desc="", caption_block="", required_keywords=None):
    keyword_block = ""
    if required_keywords:
        keyword_list = ", ".join(required_keywords)
        keyword_block = f"\n\nRequired keywords:\n{keyword_list}"

    return f"""
You are an AI assistant that converts structured scene descriptions into a single cohesive image generation prompt for a generative model.

Your role is not to verify whether the description makes sense in reality. Even if the content is bizarre, surreal, or physically impossible, you should still generate a high-quality, vivid prompt suitable for image generation.

# Guidelines:
- All original words and phrases must appear in the final prompt. DO NOT omit or change any word.
- All **required keywords** must also appear somewhere in the output. These keywords are essential and must not be skipped or altered.
- You may reorder, rephrase, or insert connecting words to make the prompt more natural for image generation, but NO words should be removed or replaced.
- If there are multiple, same objects, exactly specify number of it (e.g. five cups, three coke cans)
- You are allowed to slightly adjust grammar or word forms (e.g., plural/singular, articles), but you must preserve all concepts.
- The output should be suitable for models like FLUX or Stable Diffusion.
- Treat every description literally, even if it is absurd or strange (e.g., "a mole with poop on its head" should generate that exact scene).
- You may add optional visual modifiers (e.g., lighting, angle, atmosphere) to enrich the prompt, but ONLY IF they do not conflict with the original content.

# Input Example:
Region descriptions:
1. mole head poop on top
2. pink elephant flying over green river
3. astronaut drinking coffee inside volcano

# Output Example:

Global image description:
a scene featuring a mole with poop on its head, a pink elephant flying over a green river, and an astronaut drinking coffee inside a volcano

# Now process the following input:

Region descriptions:
{region_desc}{caption_block}{keyword_block}

Please return ONLY the global image description in this format:

Global image description:
...
"""


def description_prompt(detected_label=""):
    detected_info = f"\n\nDetected object type: {detected_label}" if detected_label else ""

    return f"""Your task is to:
1. Classify the object into a **single-word category** (e.g., "animal", "plant", "person", "vehicle", "food", "object")
2. Provide a clear **noun phrase** that represents the object (e.g., "a red balloon", "a plate of sushi")
3. Write a **short, vivid phrase** (not a full sentence) describing the object's most prominent visual features

# Guidelines:
- Classification should be a **single word** representing the broad category
- The noun phrase should be concise and specific
- The description should be a **brief phrase** (e.g., "with glowing blue wings", "wearing a red hat") — **not a full sentence**
- Focus on color, shape, texture, pose, or material — the most visually distinctive features
- Do **not** mention background elements unless essential
- If a detected object type is provided, use it as a starting point but refine based on what you see in the image

# Output format:
- [classification] | [noun phrase] | [short descriptive phrase]

# Example Outputs:
animal | mole | a mole with poop on its head
animal | pink elephant | a pink elephant flying over a green river
plant | bouquet of flowers | a bouquet of white flowers in a glass vase
person | astronaut | an astronaut in a white spacesuit
vehicle | red car | a red sports car with shiny chrome wheels
food | pizza | a large pepperoni pizza with melted cheese{detected_info}

Please describe the object shown in the image region below:
"""
