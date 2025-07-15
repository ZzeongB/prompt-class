import { v4 as uuidv4 } from "uuid";

// 공통 attribute value 입력 받기
function getAttributeValue(attrLabel, filledAttrMap, instanceId, attrId) {
  const existingValue = filledAttrMap?.[instanceId]?.[attrId];
  if (existingValue) return existingValue;

  const inputValue = prompt(`${attrLabel} 값을 입력하세요`);
  if (!inputValue) return null;

  filledAttrMap[instanceId] ??= {};
  filledAttrMap[instanceId][attrId] = inputValue;

  return inputValue;
}

// attribute instance 생성
export function createAttributeNode(
  attr,
  position,
  sharedId,
  instanceId,
  filledAttrMap,
  updatedAt
) {
  const inputValue = getAttributeValue(
    attr.data.label,
    filledAttrMap,
    instanceId,
    attr.id
  );
  if (!inputValue) return null;

  return {
    id: `${sharedId}-attr-${attr.data.label}`,
    type: "instance",
    position: { x: position.x + Math.random() * 10, y: position.y - 40 },
    data: {
      label: attr.data.label,
      type: "attribute",
      hasValue: inputValue,
      value: inputValue,
      instanceId,
    },
    updatedAt,
  };
}

// classNode에서 attribute 연결 찾기
function getConnectedAttributes(classNode, classNodes, classEdges) {
  if (!classNode) return [];

  return classEdges
    .filter((e) => e.source === classNode.id || e.target === classNode.id)
    .map((e) =>
      classNodes.find(
        (n) => n.id === (e.source === classNode.id ? e.target : e.source)
      )
    )
    .filter((n) => n?.data?.type === "attribute");
}

// 일반 object instance 생성
function createSimpleInstance(
  event,
  id,
  label,
  type,
  screenToFlowPosition,
  classNodes,
  classEdges,
  resizable,
  instanceId,
  updatedAt
) {
  const uniqueId = uuidv4();
  const sharedId = `instance-${id.split("-")[1]}-${uniqueId}`;
  const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

  const newNode = {
    id: sharedId,
    type: type === "class-group" ? "instance-group" : "instance",
    position,
    data: {
      label,
      type: type === "class-group" ? "object" : type,
      sharedId,
      classId: id,
      instanceId: sharedId,
    },
    updatedAt,
  };

  const classNode = classNodes.find(
    (n) => n.data.label === label && n.data.type === "object"
  );
  const connectedAttrNodes = getConnectedAttributes(
    classNode,
    classNodes,
    classEdges
  );

  const newAttrNodes = [];
  const newAttrEdges = [];

  for (const attr of connectedAttrNodes) {
    if (!attr.data.hasValue) {
      const attrNode = createAttributeNode(
        attr,
        position,
        sharedId,
        sharedId,
        {},
        updatedAt
      );
      if (attrNode) {
        newAttrNodes.push(attrNode);
        newAttrEdges.push({
          id: `${newNode.id}-${attrNode.id}`,
          source: newNode.id,
          target: attrNode.id,
          label: "property",
        });
      }
    }
  }

  const nodes = resizable
    ? [
        {
          id: `${sharedId}-resizable`,
          type: "resizable",
          position: { x: position.x, y: position.y },
          data: newNode.data,
          style: { height: 50, width: 50 },
        },
        newNode,
        ...newAttrNodes,
      ]
    : [newNode, ...newAttrNodes];

  return { newNodes: nodes, newEdges: newAttrEdges };
}

function collectAllDescendants(nodes, parentId) {
  const result = [];

  function dfs(currentId) {
    const children = nodes.filter((n) => n.parentNode === currentId);
    for (const child of children) {
      result.push(child);
      dfs(child.id); // 재귀적으로 탐색
    }
  }

  dfs(parentId);
  return result;
}

function getEdgeConnectedOutsideNodes(baseIds, edges, allNodes) {
  const baseIdSet = new Set(baseIds);
  const connectedIds = new Set();

  edges.forEach((e) => {
    if (baseIdSet.has(e.source) && !baseIdSet.has(e.target)) {
      connectedIds.add(e.target);
    }
    // if (baseIdSet.has(e.target) && !baseIdSet.has(e.source)) {
    //   connectedIds.add(e.source);
    // }
  });

  return Array.from(connectedIds)
    .map((id) => allNodes.find((n) => n.id === id))
    .filter(Boolean);
}

function cloneSubtreeInstance(
  event,
  id,
  classNodes,
  classEdges,
  instanceId,
  instanceLabel,
  updatedAt,
  collapsed,
  filledAttrMap,
  editedLabelMap,
  instanceNodes,
  instanceEdges
) {
  const uniqueId = uuidv4();

  // 1. 📦 classGraph 기반 핵심 노드 + 자식 노드 수집
  const groupNode = classNodes.find((n) => n.id === id);
  if (!groupNode) return { newNodes: [], newEdges: [] };

  // ✅ 모든 하위 노드까지 재귀 수집
  const allDescendants = collectAllDescendants(classNodes, id);
  const allClassNodeIds = [groupNode.id, ...allDescendants.map((n) => n.id)];

  // 2. 🔄 classGraph 외부 연결된 노드 수집 (attribute, relation 등)
  const classExternalNodes = getEdgeConnectedOutsideNodes(
    allClassNodeIds,
    classEdges,
    classNodes
  );

  // 3. 🔄 instanceGraph 외부 연결된 노드 수집 (attribute override 등)
  const instanceExternalNodes = getEdgeConnectedOutsideNodes(
    [instanceId],
    instanceEdges,
    instanceNodes
  );

  // 4. 🧠 전체 복제 대상 구성 (class 기준 전체 구조 + class 외부 + instance 외부)
  const basePosition = groupNode.position;
  const deltaX = event.x - basePosition.x;
  const deltaY = event.y - basePosition.y;

  const idMap = new Map();
  const groupInstanceId = `instance-${groupNode.id}-${uniqueId}`;
  idMap.set(groupNode.id, groupInstanceId);

  const label =
    editedLabelMap?.[instanceId]?.[groupNode.id] ??
    instanceLabel ??
    groupNode.data.label;

  // 최상위 group 복제
  const newGroupNode = {
    ...groupNode,
    id: groupInstanceId,
    type: "instance-group",
    position: event,
    data: {
      ...groupNode.data,
      label: label,
      type: groupNode.data.type,
      collapsed,
      instanceId,
      originalClassId: groupNode.id,
    },
    class: id,
    updatedAt,
    style: {
      ...groupNode.style,
      height: collapsed ? 50 : groupNode.style.height,
    },
  };

  const fullNodesToClone = [
    ...allDescendants,
    ...classExternalNodes,
    ...instanceExternalNodes,
  ];

  const newChildNodes = fullNodesToClone
    .map((n) => {
      const newId = `instance-${n.id}-${uniqueId}`;
      idMap.set(n.id, newId);

      const newParent = n.parentNode
        ? idMap.get(n.parentNode)
        : groupInstanceId;

      const newPosition = {
        x: n.position.x + deltaX,
        y: n.position.y + deltaY,
      };

      const baseData = {
        ...n.data,
        type: n.data.type,
        instanceId,
        label: editedLabelMap?.[instanceId]?.[n.id] ?? n.data.label,
        hasValue: n.data.type === "attribute" ? editedLabelMap?.[instanceId]?.[n.id] ?? n.data.label : null,
        originalClassId: n.id,
      };

      // 5. ⚙️ attribute일 경우 값 부여 (filledAttrMap 기반)
      if (n.data.type === "attribute" && !n.data.hasValue) {
        let value = getAttributeValue(
          n.data.label,
          filledAttrMap,
          instanceId,
          n.id
        );
        if (!value) return null;
        
        value = editedLabelMap?.[instanceId]?.[n.id] ?? value;

        return {
          ...n,
          id: newId,
          type: "instance",
          position: newPosition,
          parentNode: newParent,
          extent: n.extent,
          data: {
            ...baseData,
            value,
            hasValue: value,
          },
          updatedAt,
        };
      }

      return {
        ...n,
        id: newId,
        type: n.type === "class-group" ? "instance-group" : "instance",
        position: newPosition,
        parentNode: newParent,
        extent: n.extent,
        data: baseData,
        updatedAt,
      };
    })
    .filter(Boolean);

  // 6. 🔗 연결 엣지 재구성 (classGraph 기준 엣지만 재사용)
  const newEdges = classEdges
    .filter(
      (e) =>
        allClassNodeIds.includes(e.source) && allClassNodeIds.includes(e.target)
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
    newFilledAttrMap: filledAttrMap,
  };
}

// entry point
export function createInstance(
  event,
  id,
  label,
  type,
  screenToFlowPosition,
  nodes,
  classNodes,
  classEdges,
  instanceNodes = [],
  instanceEdges = [],
  resizable = true,
  instanceId = null,
  instanceLabel = null,
  updatedAt = new Date().toISOString(),
  collapsed = false,
  filledAttrMap = {},
  editedLabelMap = {}
) {
  if (!type || !label) return;

  if (type === "class-group" && resizable === false) {
    // from InstanceBoard
    return cloneSubtreeInstance(
      event,
      id,
      classNodes,
      classEdges,
      instanceId,
      instanceLabel,
      updatedAt,
      collapsed,
      filledAttrMap,
      editedLabelMap,
      instanceNodes,
      instanceEdges
    );
  } else {
    // from LayoutBoard
    return createSimpleInstance(
      event,
      id,
      label,
      type,
      screenToFlowPosition,
      classNodes,
      classEdges,
      resizable,
      instanceId,
      updatedAt
    );
  }
}
