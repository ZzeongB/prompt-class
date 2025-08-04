import { API_CONFIG, callOpenAI } from "./utils";
import { logEvent } from "./logEvent";

// JSON 응답 파싱 함수
const parseJSONResponse = (content, fallback = null) => {
  try {
    // 코드 블록 제거
    let cleanContent = content;
    if (cleanContent.includes("```")) {
      cleanContent = cleanContent
        .replace(/```(?:json)?\n?/g, "")
        .replace(/```$/g, "")
        .trim();
    }

    const parsed = JSON.parse(cleanContent);

    // 기본 구조 검증
    if (!parsed.objects || !Array.isArray(parsed.objects)) {
      throw new Error("Invalid scene graph structure: missing objects array");
    }

    if (!parsed.relationships || !Array.isArray(parsed.relationships)) {
      throw new Error(
        "Invalid scene graph structure: missing relationships array"
      );
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
  if (!newTextDescription || typeof newTextDescription !== "string") {
    throw new Error("Valid text description is required");
  }

  const hasPrevious = previousSceneGraph && previousTextDescription;

  logEvent("api.generate_text_to_graph.started", {
    has_previous: hasPrevious,
    text_length: newTextDescription.length,
    previous_objects_count: previousSceneGraph?.objects?.length || 0
  });

  const basePrompt = `
You are a precise scene graph generator. Convert the given text description into a structured scene graph in strict JSON format.

PARSING RULES:
1. OBJECTS: Identify concrete nouns (person, cat, table, car, tree, house, arms, legs, eyes, mouth, etc.)
2. ATTRIBUTES: Adjectives and descriptive words that modify objects (red, large, wooden, happy, etc.)
3. RELATIONSHIPS: Spatial and semantic connections between objects (on, in, near, holding, wearing, etc.)

STRUCTURAL REQUIREMENTS:
- objects: Array of {id, name, attributes[]} where:
  * id: "object1", "object2", etc. (sequential numbering)
  * name: single noun in singular form
  * attributes: array of adjectives/descriptors for this object
- relationships: Array of {source, target, relation} where:
  * source/target: object ids that exist in objects array
  * relation: preposition or verb describing the connection
- root: id of the most prominent/central object

ACCURACY CONSTRAINTS:
- Use ONLY words present in the input text
- Each content word must appear exactly once in the scene graph
- Skip articles (a, an, the), conjunctions (and, or), and filler words
- Do not create self-referential relationships (source ≠ target)
- Main subject should be object1 and set as root

EXAMPLES:

Input: "A red car driving on the highway"
Output:
{
  "objects": [
    { "id": "object1", "name": "car", "attributes": ["red"] },
    { "id": "object2", "name": "highway", "attributes": [] }
  ],
  "relationships": [
    { "source": "object1", "target": "object2", "relation": "driving on" }
  ],
  "root": "object1"
}

Input: "Large brown dog sitting in small green park"
Output:
{
  "objects": [
    { "id": "object1", "name": "dog", "attributes": ["large", "brown"] },
    { "id": "object2", "name": "park", "attributes": ["small", "green"] }
  ],
  "relationships": [
    { "source": "object1", "target": "object2", "relation": "sitting in" }
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
    const content = await callOpenAI(
      [{ role: "user", content: fullPrompt }],
      1024
    );

    // fallback 생성
    const fallback = {
      objects: [{ id: "object1", name: "scene", attributes: [] }],
      relationships: [],
      root: "object1",
    };

    const result = parseJSONResponse(content, fallback);
    
    logEvent("api.generate_text_to_graph.succeeded", {
      objects_count: result.objects?.length || 0,
      relationships_count: result.relationships?.length || 0,
      root_object: result.root
    });

    return result;
  } catch (error) {
    console.error("generateTextToGraph Error:", error);
    
    logEvent("api.generate_text_to_graph.error", {
      error_message: error.message,
      text_description: newTextDescription
    });
    
    throw new Error(`Failed to generate scene graph: ${error.message}`);
  }
};

export const generateSceneGraphToText = async ({
  newSceneGraph,
  previousSceneGraph = null,
  previousTextDescription = null,
}) => {
  if (!newSceneGraph || !newSceneGraph.objects) {
    throw new Error("Valid scene graph is required");
  }

  const hasPrevious = previousSceneGraph && previousTextDescription;

  logEvent("api.generate_scene_graph_to_text.started", {
    has_previous: hasPrevious,
    objects_count: newSceneGraph.objects?.length || 0,
    relationships_count: newSceneGraph.relationships?.length || 0
  });

  const systemPrompt = `
You are given:
1. ${
    hasPrevious ? "A previous Scene Graph and its description" : "A Scene Graph"
  }
2. ${hasPrevious ? "A new Scene Graph after edits" : ""}

Task:
- Generate a ${
    hasPrevious ? "revised" : "natural language"
  } description of the scene
${hasPrevious ? "- Reuse the previous description as much as possible" : ""}
${hasPrevious ? "- Only modify parts that changed in the new Scene Graph" : ""}
- Keep it short and natural, describing the main object, its attributes, and relationships
- Use simple, clear language. Avoid redundant like "A scene describing apple tree", or "The scene features an apple tree". Answer like "Apple Tree".

${
  hasPrevious
    ? `Previous description: "${previousTextDescription}"

Previous Scene Graph:
${JSON.stringify(previousSceneGraph, null, 2)}`
    : ""
}

${hasPrevious ? "New" : ""} Scene Graph:
${JSON.stringify(newSceneGraph, null, 2)}

Generate a natural description:`;

  try {
    const content = await callOpenAI(
      [{ role: "user", content: systemPrompt }],
      512
    );
    
    const result = content.trim();
    
    logEvent("api.generate_scene_graph_to_text.succeeded", {
      text_length: result.length,
      generated_text: result.substring(0, 100) // Log first 100 chars for debugging
    });
    
    return result;
  } catch (error) {
    console.error("generateSceneGraphToText Error:", error);
    
    logEvent("api.generate_scene_graph_to_text.error", {
      error_message: error.message,
      objects_count: newSceneGraph.objects?.length || 0
    });
    
    throw new Error(`Failed to generate text description: ${error.message}`);
  }
};

export const generateInstanceLabelFromDescription = async (textDescription) => {
  if (!textDescription || typeof textDescription !== "string") {
    throw new Error("Valid text description is required");
  }

  logEvent("api.generate_instance_label_from_description.started", {
    text_length: textDescription.length
  });

  const systemPrompt = `
Extract the main object/subject from the given description and return it as a simple label (1-2 words max).

Examples:
- "A red car driving on the road" -> "Car"
- "Smiling cactus in flower pot" -> "Cactus" 
- "Beautiful sunset over mountains" -> "Sunset"

Description: "${textDescription}"

Main object:`;

  try {
    const content = await callOpenAI(
      [{ role: "user", content: systemPrompt }],
      50
    );
    
    const result = content.trim().replace(/['"]/g, ""); // 따옴표 제거
    
    logEvent("api.generate_instance_label_from_description.succeeded", {
      generated_label: result,
      original_text: textDescription.substring(0, 50) // Log first 50 chars for context
    });
    
    return result;
  } catch (error) {
    console.error("generateInstanceLabelFromDescription Error:", error);
    
    // fallback으로 description의 첫 번째 단어 사용
    const firstWord = textDescription.split(" ")[0];
    const fallbackLabel = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    
    logEvent("api.generate_instance_label_from_description.fallback", {
      error_message: error.message,
      fallback_label: fallbackLabel,
      original_text: textDescription.substring(0, 50)
    });
    
    return fallbackLabel;
  }
};
