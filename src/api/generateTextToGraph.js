export const generateTextToGraph = async (
  prompt,
  parentId = null,
  parentPosition = { x: 0, y: 0 }
) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const endpoint = "https://api.openai.com/v1/chat/completions";

  const systemPrompt = `
  For the provided text prompt, generate a Scene Graph in JSON format.
  Include:
  1. Objects (id, name, attributes[])
  2. Relationships (source, target, relation)

  Constraints:
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

    return transformSceneGraphToReactFlow(sceneGraph, parentId, parentPosition);
  } catch (error) {
    console.error("Fetch Error:", error);
    alert("Scene Graph 생성 중 오류 발생");
    return { nodes: [], edges: [] };
  }
};

const transformSceneGraphToReactFlow = (
  sceneGraph,
  parentId = null,
  parentPosition = { x: 0, y: 0 }
) => {
  const nodes = [];
  const edges = [];

  const objectMap = new Map(); // id → object node id

  // 기본 위치 설정
  const baseX = parentPosition?.x || 0;
  const baseY = parentPosition?.y || 0;

  const objOffsetX = 10; // 객체 간 좌우 간격
  const attrOffsetX = 10;
  const attrOffsetY = 10;
  const relOffsetY = 10;

  let x = baseX + objOffsetX;

  sceneGraph.objects.forEach((obj, i) => {
    const objNodeId = `obj-${obj.id}`;
    objectMap.set(obj.id, objNodeId);

    nodes.push({
      id: objNodeId,
      type: "class",
      data: {
        label: obj.name,
        type: "object",
        parentNode: parentId,
        extent: "parent",
      },
      position: { x, y: baseY + 10 }, // 🎯 부모 기준으로 조금 아래에 배치
    });

    (obj.attributes || []).forEach((attr, j) => {
      const attrNodeId = `${objNodeId}-attr-${attr}`;
      nodes.push({
        id: attrNodeId,
        type: "class",
        data: {
          label: attr,
          type: "attribute",
          hasValue: attr,
          parentNode: parentId,
          extent: "parent",
        },
        position: {
          x: x + attrOffsetX,
          y: baseY + 10 + j * attrOffsetY,
        },
      });

      edges.push({
        id: `e-${objNodeId}-${attrNodeId}`,
        source: objNodeId,
        target: attrNodeId,
      });
    });

    x += 10; // 객체 간 간격
  });

  sceneGraph.relationships?.forEach((rel, i) => {
    const relNodeId = `rel-${i}`;

    nodes.push({
      id: relNodeId,
      type: "class",
      data: {
        label: rel.relation,
        type: "relationship",
        parentNode: parentId,
        extent: "parent",
      },
      position: {
        x: baseX + 10 + i * 10,
        y: baseY + relOffsetY + 10,
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
  });

  return { nodes, edges };
};
