export const generateTextToGraph = async (textDescription) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const endpoint = "https://api.openai.com/v1/chat/completions";

  const systemPrompt = `
  For the provided text prompt, generate a Scene Graph in JSON format.
  Include:
  1. Objects (id, name, attributes[])
  2. Relationships (source, target, relation)

  Constraints:
  - You can avoid unnecessary words like "a", "the", "is", "its", etc.
  - Each word must belong to only ONE of: object, attribute, relationship.
  - Output must be strict JSON.
  - Do not make self-connected relationships, like { "source": "object1", "target": "object1", "relation": "motion blur" }
  - Make the main object the first in the objects array
  
  Example:
  {
    "objects": [
      { "id": "object1", "name": "cat", "attributes": ["white", "fluffy"] },
      { "id": "object2", "name": "table", "attributes": ["wooden", "brown"] }
    ],
    "relationships": [
      { "source": "object1", "target": "object2", "relation": "on" }
    ]
  }

  Prompt: "${textDescription}"
  `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0,
        max_tokens: 512,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Error:", data);
      throw new Error("Scene Graph 생성 실패");
    }

    let content = data.choices[0].message.content;

    // 백틱 제거
    if (content.startsWith("```")) {
      content = content.replace(/```(?:json)?\n?/g, "").replace(/```$/, "");
    }

    const sceneGraph = JSON.parse(content);
    return sceneGraph;

  } catch (error) {
    console.error("generateTextToSceneGraph Error:", error);
    throw error;
  }
};

export const generateSceneGraphToText = async (sceneGraph) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const endpoint = "https://api.openai.com/v1/chat/completions";

  const systemPrompt = `
  Convert the provided Scene Graph JSON back to a natural language description.
  Make it concise and natural, describing the main object, its attributes, and relationships.

  Scene Graph: ${JSON.stringify(sceneGraph)}
  `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0,
        max_tokens: 256,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Error:", data);
      throw new Error("Text 생성 실패");
    }

    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error("generateSceneGraphToText Error:", error);
    throw error;
  }
};

export const generateInstanceLabelFromDescription = async (textDescription) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const endpoint = "https://api.openai.com/v1/chat/completions";

  const systemPrompt = `
  Extract the main object/subject from the given description and return it as a simple label (1-2 words max).
  
  Examples:
  - "A red car driving on the road" -> "Car"
  - "Smiling cactus in flower pot" -> "Cactus"
  - "Beautiful sunset over mountains" -> "Sunset"
  
  Description: "${textDescription}"
  `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0,
        max_tokens: 50,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Error:", data);
      throw new Error("Label 생성 실패");
    }

    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error("generateInstanceLabelFromDescription Error:", error);
    throw error;
  }
};