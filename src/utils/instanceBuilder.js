// src/utils/instanceBuilder.js

export function createInstance(
  event,
  id,
  label,
  type,
  screenToFlowPosition,
  nodes,
  classNodes,
  classEdges,
  resizable = true
) {
  if (!type || !label) return;

  let newNodes = [];
  let newEdges = [];
  if (type === "class-group") {
    const uniqueId = Date.now(); // 고유 ID 생성
    const groupNode = classNodes.find((n) => n.id === id);
    const childNodes = classNodes.filter((n) => n.parentNode === id);

    if (!groupNode) return { newNodes: [], newEdges: [] };

    // 1. 기준 위치 계산
    const basePosition = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const deltaX = basePosition.x - groupNode.position.x;
    const deltaY = basePosition.y - groupNode.position.y;

    // 2. ID 매핑용 Map
    const idMap = new Map();

    // 3. 그룹 노드 먼저 변환
    // 고유 ID 생성을 위해 시간 또는 UUID 등 사용 가능
    // 시간 기반: 겹칠 확률이 낮음
    const groupInstanceId = `instance-${groupNode.id}-${uniqueId}`;
    idMap.set(groupNode.id, groupInstanceId);

    const newGroupNode = {
      ...groupNode,
      id: groupInstanceId,
      type: "instance-group",
      position: basePosition,
      data: {
        ...groupNode.data,
        type: groupNode.data.type, // object 등 그대로
      },
      class: id,
    };

    // // 4. 자식 노드 변환
    // const newChildNodes = childNodes.map((n) => {
    //   const newId = `instance-${n.id}`;
    //   idMap.set(n.id, newId);

    //   return {
    //     ...n,
    //     id: newId,
    //     type: "instance",
    //     position: {
    //       x: n.position.x + deltaX,
    //       y: n.position.y + deltaY,
    //     },
    //     parentNode: n.parentNode ? `instance-${n.parentNode}` : undefined,
    //     extent: n.extent,
    //     data: {
    //       ...n.data,
    //       type: n.data.type,
    //     },
    //   };
    // });

    const newChildNodes = childNodes
      .map((n) => {
        const newId = `instance-${n.id}-${uniqueId}`;
        idMap.set(n.id, newId);

        // 💡 위치 보정
        const newPosition = {
          x: n.position.x + deltaX,
          y: n.position.y + deltaY,
        };

        // 💬 hasValue가 없는 attribute인 경우: 사용자 입력 받기
        if (n.data.type === "attribute" && !n.data.hasValue) {
          const inputValue = prompt(`${n.data.label} 값을 입력하세요`);
          if (!inputValue) return null;

          return {
            ...n,
            id: newId,
            type: "instance",
            position: newPosition,
            parentNode: n.parentNode ? `instance-${n.parentNode}` : undefined,
            extent: n.extent,
            data: {
              ...n.data,
              value: inputValue,
              hasValue: inputValue,
              label: n.data.label,
              type: "attribute",
            },
          };
        }

        // 그 외 일반 처리
        return {
          ...n,
          id: newId,
          type: "instance",
          position: newPosition,
          parentNode: n.parentNode ? `instance-${n.parentNode}-${uniqueId}` : undefined,
          extent: n.extent,
          data: {
            ...n.data,
            type: n.data.type,
          },
        };
      })
      .filter(Boolean); // ❌ 입력 안 한 경우 null이 생기지 않도록

    // 5. 관련된 edge들도 가져오기
    const allNodeIds = [groupNode.id, ...childNodes.map((n) => n.id)];
    const newEdges = classEdges
      .filter(
        (e) => allNodeIds.includes(e.source) && allNodeIds.includes(e.target)
      )
      .map((e) => ({
        ...e,
        id: `instance-${e.id}-${uniqueId}`,
        source: idMap.get(e.source),
        target: idMap.get(e.target),
      }));

    return {
      newNodes: [newGroupNode, ...newChildNodes],
      newEdges,
    };
  }

  const position = screenToFlowPosition({
    x: event.clientX,
    y: event.clientY,
  });

  ({ newNodes, newEdges } = createInstanceWithAttributes(
    id,
    label,
    type,
    position,
    classNodes,
    classEdges,
    nodes.length,
    resizable
  ));

  console.log("newNodes", newNodes);
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
  currentNodeCount,
  resizable = true
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
              label: attr.data.label,
              type: "attribute",
              hasValue: inputValue,
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

  if (resizable) {
    return {
      newNodes: [newNode_data, newNode_resizable, ...newAttrNodes],
      newEdges: newAttrEdges,
    };
  } else {
    return {
      newNodes: [newNode_data, ...newAttrNodes],
      newEdges: newAttrEdges,
    };
  }
}
