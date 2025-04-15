// src/utils/instanceBuilder.js

export function createInstance(
  event,
  id,
  label,
  type,
  screenToFlowPosition,
  nodes,
  classNodes,
  classEdges
) {
  if (!type || !label) return;

  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });

  const { newNodes, newEdges } = createInstanceWithAttributes(
    id,
    label,
    type,
    position,
    classNodes,
    classEdges,
    nodes.length
  );

  return {
    newNodes,
    newEdges,
  };
}

export function createInstanceWithAttributes(
  id,
  label,
  type,
  position,
  classNodes,
  classEdges,
  currentNodeCount
) {
  const sharedId = `instance-${id.split("-")[1]}-${currentNodeCount}`;

  const newNode_data = {
    id: `${sharedId}`,
    type: "instance",
    position,
    data: { label, type, sharedId, classId: id },
    //   origin: [0.5, 0.5],
  };

  const newNode_resizable = {
    id: `${sharedId}-resizable`,
    type: "resizable",
    position: { x: position.x, y: position.y + 30 },
    data: { label, type, sharedId, classId: id },
    //   origin: [0.5, 0.5],
  };

  const newAttrNodes = [];
  const newAttrEdges = [];

  const originalClassNode = classNodes.find(
    (n) => n.data.label === label && n.data.type === "object"
  );

  if (originalClassNode) {
    const connectedAttrEdges = classEdges.filter(
      (e) =>
        e.source === originalClassNode.id || e.target === originalClassNode.id
    );

    const connectedAttrNodes = connectedAttrEdges
      .map((e) =>
        classNodes.find(
          (n) =>
            n.id === (e.source === originalClassNode.id ? e.target : e.source)
        )
      )
      .filter((n) => n && n.data.type === "attribute");

    for (const attr of connectedAttrNodes) {
      if (!attr.data.hasValue) {
        const inputValue = prompt(`${attr.data.label} 값을 입력하세요`);
        if (inputValue) {
          const attrNodeId = `${sharedId}-attr-${attr.data.label}`;

          newAttrNodes.push({
            id: attrNodeId,
            type: "instance",
            position: {
              x: position.x + Math.random() * 10,
              y: position.y - 40,
            },
            data: {
              label: `${attr.data.label}: ${inputValue}`,
              type: "attribute",
              hasValue: true,
              value: inputValue,
            },
          });

          newAttrEdges.push({
            id: `${newNode_data.id}-${attrNodeId}`,
            source: newNode_data.id,
            target: attrNodeId,
            label: "property",
          });
        }
      }
    }
  }

  return {
    newNodes: [newNode_data, newNode_resizable, ...newAttrNodes],
    newEdges: newAttrEdges,
  };
}
