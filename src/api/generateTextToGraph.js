import { API_CONFIG, callOpenAI } from "./utils";

// JSON 응답 파싱 함수
const parseJSONResponse = (content, fallback = null) => {
  try {
    // 코드 블록 제거
    let cleanContent = content;
    if (cleanContent.includes('```')) {
      cleanContent = cleanContent.replace(/```(?:json)?\n?/g, "").replace(/```$/g, "").trim();
    }

    const parsed = JSON.parse(cleanContent);
    
    // 기본 구조 검증
    if (!parsed.objects || !Array.isArray(parsed.objects)) {
      throw new Error("Invalid scene graph structure: missing objects array");
    }
    
    if (!parsed.relationships || !Array.isArray(parsed.relationships)) {
      throw new Error("Invalid scene graph structure: missing relationships array");
    }

    // root 검증
    if (parsed.objects.length > 0 && !parsed.root) {
      console.warn("No root specified, using first object as root");
      parsed.root = parsed.objects[0].id;
    }

    return parsed;
  } catch (error) {
    console.error("JSON parsing error:", error.message);
    console.error("Raw content:", content);
    
    if (fallback) {
      console.warn("Using fallback scene graph");
      return fallback;
    }
    
    throw new Error(`Failed to parse scene graph: ${error.message}`);
  }
};

export const generateTextToGraph = async ({
  newTextDescription,
  previousSceneGraph = null,
  previousTextDescription = null,
}) => {
  if (!newTextDescription || typeof newTextDescription !== 'string') {
    throw new Error("Valid text description is required");
  }

  const hasPrevious = previousSceneGraph && previousTextDescription;

  const basePrompt = `
Given a new text prompt${hasPrevious ? " and the previous Scene Graph + its description" : ""}, generate an updated Scene Graph in strict JSON format.

Include:
1. objects (each with id, name, attributes[])
2. relationships (source, target, relation)  
3. root (the id of the main object)

Constraints:
- Avoid unnecessary words like "a", "the", "is", "its", etc.
- Each word must belong to only ONE of: object, attribute, relationship
- Do not miss any word nor add new words
- Output must be strict JSON only
- Do not make self-connected relationships
- Make the main object the first in the objects array
- The "root" field should exactly match the id of the main object

Example:
"white, fluffy cat on wooden, brown table" ->
{
  "objects": [
    { "id": "object1", "name": "cat", "attributes": ["white", "fluffy"] },
    { "id": "object2", "name": "table", "attributes": ["wooden", "brown"] }
  ],
  "relationships": [
    { "source": "object1", "target": "object2", "relation": "on" }
  ],
  "root": "object1"
}`;

  const additionalRequirements = hasPrevious
    ? `
Requirements:
- Reflect changes from the new prompt
- Preserve unchanged objects, attributes, relationships from the previous graph
- Try to maintain same object ids and structure unless semantic change is needed
- Keep "root" as the main object
- Do NOT invent new elements. Only use words that exist in the new prompt
- Output strict JSON only`
    : "";

  const previousContext = hasPrevious
    ? `
Previous description: "${previousTextDescription}"

Previous Scene Graph:
${JSON.stringify(previousSceneGraph, null, 2)}`
    : "";

  const fullPrompt = `${basePrompt}${additionalRequirements}${previousContext}

New description: "${newTextDescription}"

Respond with JSON only:`;

  try {
    const content = await callOpenAI([{ role: "user", content: fullPrompt }], 1024);
    
    // fallback 생성
    const fallback = {
      objects: [{ id: "object1", name: "scene", attributes: [] }],
      relationships: [],
      root: "object1"
    };
    
    return parseJSONResponse(content, fallback);
  } catch (error) {
    console.error("generateTextToGraph Error:", error);
    throw new Error(`Failed to generate scene graph: ${error.message}`);
  }
};

export const generateSceneGraphToText = async (
  newSceneGraph,
  previousSceneGraph = null,
  previousTextDescription = null
) => {
  if (!newSceneGraph || !newSceneGraph.objects) {
    throw new Error("Valid scene graph is required");
  }

  const hasPrevious = previousSceneGraph && previousTextDescription;

  const systemPrompt = `
You are given:
1. ${hasPrevious ? "A previous Scene Graph and its description" : "A Scene Graph"}
2. ${hasPrevious ? "A new Scene Graph after edits" : ""}

Task:
- Generate a ${hasPrevious ? "revised" : "natural language"} description of the scene
${hasPrevious ? "- Reuse the previous description as much as possible" : ""}
${hasPrevious ? "- Only modify parts that changed in the new Scene Graph" : ""}
- Keep it short and natural, describing the main object, its attributes, and relationships
- Use simple, clear language

${hasPrevious ? `Previous description: "${previousTextDescription}"

Previous Scene Graph:
${JSON.stringify(previousSceneGraph, null, 2)}` : ""}

${hasPrevious ? "New" : ""} Scene Graph:
${JSON.stringify(newSceneGraph, null, 2)}

Generate a natural description:`;

  try {
    const content = await callOpenAI([{ role: "user", content: systemPrompt }], 512);
    return content.trim();
  } catch (error) {
    console.error("generateSceneGraphToText Error:", error);
    throw new Error(`Failed to generate text description: ${error.message}`);
  }
};

export const generateInstanceLabelFromDescription = async (textDescription) => {
  if (!textDescription || typeof textDescription !== 'string') {
    throw new Error("Valid text description is required");
  }

  const systemPrompt = `
Extract the main object/subject from the given description and return it as a simple label (1-2 words max).

Examples:
- "A red car driving on the road" -> "Car"
- "Smiling cactus in flower pot" -> "Cactus" 
- "Beautiful sunset over mountains" -> "Sunset"

Description: "${textDescription}"

Main object:`;

  try {
    const content = await callOpenAI([{ role: "user", content: systemPrompt }], 50);
    return content.trim().replace(/['"]/g, ''); // 따옴표 제거
  } catch (error) {
    console.error("generateInstanceLabelFromDescription Error:", error);
    // fallback으로 description의 첫 번째 단어 사용
    const firstWord = textDescription.split(' ')[0];
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }
};