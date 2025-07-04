export const generateTextToGraph = async (
  prompt,
  parentId = null,
  parentPosition = { x: 0, y: 0 },
  isInstance = false
) => {
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
  
  Example:
  {
    "objects": [
      { "id": "object1", "name": "cat", "attributes": ["white"] },
      { "id": "object2", "name": "table", "attributes": ["wooden", "brown"] }
    ],
    "relationships": [
      { "source": "object1", "target": "object2", "relation": "on" }
    ]
  }

  Prompt: "${prompt}"
  `;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // 또는 gpt-4o-mini
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0,
        max_tokens: 512,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI Error:", data);
      alert("Scene Graph 생성 실패. 콘솔을 확인하세요.");
      return { nodes: [], edges: [] };
    }
    let content = data.choices[0].message.content;

    // 백틱이 포함된 경우 제거하기 (예: ```json\n ... \n``` 제거)
    if (content.startsWith("```")) {
      content = content.replace(/```(?:json)?\n?/g, "").replace(/```$/, "");
    }

    const sceneGraph = JSON.parse(content);

    return transformSceneGraphToReactFlow(
      sceneGraph,
      parentId,
      parentPosition,
      isInstance
    );
  } catch (error) {
    console.error("Fetch Error:", error);
    alert("Scene Graph 생성 중 오류 발생");
    return { nodes: [], edges: [] };
  }
};

const transformSceneGraphToReactFlow = (
  sceneGraph,
  parentId = null,
  parentPosition = { x: 0, y: 0 },
  isInstance = false
) => {
  parentPosition = {
    x: parentPosition.x + 15,
    y: parentPosition.y + 30,
  }

  const nodes = [];
  const edges = [];

  const idPrefix = parentId ? `${parentId}__` : `scene__`;
  const objectMap = new Map();

  const NODE_HEIGHT = 30;
  const GAP_Y = 10;

  const xObj = parentPosition.x + 10;
  const xAttr = parentPosition.x + 120;
  const baseY = parentPosition.y + 10;

  let currentY = baseY;

  sceneGraph.objects.forEach((obj) => {
    const objNodeId = `${idPrefix}obj-${obj.id}`;
    objectMap.set(obj.id, objNodeId);

    nodes.push({
      id: objNodeId,
      type: isInstance ? "instance" : "class",
      data: {
        label: obj.name,
        type: "object",
      },
      parentNode: parentId,
      extent: "parent",
      position: { x: xObj, y: currentY },
    });

    (obj.attributes || []).forEach((attr, j) => {
      const attrNodeId = `${objNodeId}-attr-${attr}`;

      nodes.push({
        id: attrNodeId,
        type: isInstance ? "instance" : "class",
        data: {
          label: attr,
          type: "attribute",
          hasValue: attr,
        },
        parentNode: parentId,
        extent: "parent",
        position: {
          x: xAttr,
          y: currentY + j * (NODE_HEIGHT + 4),
        },
      });

      edges.push({
        id: `e-${objNodeId}-${attrNodeId}`,
        source: objNodeId,
        target: attrNodeId,
      });
    });

    // 다음 object는 attr 개수만큼 아래로 밀어줌
    const attrCount = obj.attributes?.length || 0;
    const objectBlockHeight =
      Math.max(1, attrCount) * (NODE_HEIGHT + 4) + GAP_Y;

    currentY += objectBlockHeight;
  });

  // relationship nodes (아래 따로 배치)
  const relX = parentPosition.x + 70;
  let relY = currentY + 20;

  sceneGraph.relationships?.forEach((rel, i) => {
    const relNodeId = `${idPrefix}rel-${i}`;

    nodes.push({
      id: relNodeId,
      type: isInstance ? "instance" : "class",
      data: {
        label: rel.relation,
        type: "relationship",
      },
      parentNode: parentId,
      extent: "parent",
      position: {
        x: relX,
        y: relY,
      },
    });

    const sourceId = objectMap.get(rel.source);
    const targetId = objectMap.get(rel.target);

    if (sourceId && targetId) {
      edges.push(
        {
          id: `e-${sourceId}-${relNodeId}`,
          source: sourceId,
          target: relNodeId,
        },
        {
          id: `e-${relNodeId}-${targetId}`,
          source: relNodeId,
          target: targetId,
        }
      );
    }

    relY += NODE_HEIGHT + GAP_Y;
  });

  return { nodes, edges };
};
