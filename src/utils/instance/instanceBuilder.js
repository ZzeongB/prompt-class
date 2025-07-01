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
function createAttributeNode(attr, position, sharedId, instanceId, filledAttrMap, updatedAt) {
  const inputValue = getAttributeValue(attr.data.label, filledAttrMap, instanceId, attr.id);
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
    .filter(e => e.source === classNode.id || e.target === classNode.id)
    .map(e => classNodes.find(n => n.id === (e.source === classNode.id ? e.target : e.source)))
    .filter(n => n?.data?.type === "attribute");
}

// 일반 object instance 생성
function createSimpleInstance(event, id, label, type, screenToFlowPosition, classNodes, classEdges, resizable, instanceId, updatedAt) {
  const uniqueId = uuidv4();
  const sharedId = `instance-${id.split("-")[1]}-${uniqueId}`;
  const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

  const newNode = {
    id: sharedId,
    type: type === "object-group" ? "instance-group" : "instance",
    position,
    data: {
      label,
      type: type === "object-group" ? "object" : type,
      sharedId,
      classId: id,
      instanceId: sharedId,
    },
    updatedAt,
  };

  const classNode = classNodes.find(n => n.data.label === label && n.data.type === "object");
  const connectedAttrNodes = getConnectedAttributes(classNode, classNodes, classEdges);

  const newAttrNodes = [];
  const newAttrEdges = [];
  
  for (const attr of connectedAttrNodes) {
    if (!attr.data.hasValue) {
      const attrNode = createAttributeNode(attr, position, sharedId, sharedId, {}, updatedAt);
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
        { id: `${sharedId}-resizable`, type: "resizable", position: { x: position.x, y: position.y }, data: newNode.data, style: {height: 50, width: 50} },
        newNode,
        ...newAttrNodes,
      ]
    : [newNode, ...newAttrNodes];

  return { newNodes: nodes, newEdges: newAttrEdges };
}
function collectAllDescendants(nodes, parentId) {
  const result = [];

  function dfs(currentId) {
    const children = nodes.filter(n => n.parentNode === currentId);
    for (const child of children) {
      result.push(child);
      dfs(child.id);  // 재귀적으로 탐색
    }
  }

  dfs(parentId);
  return result;
}

function cloneSubtreeInstance(event, id, classNodes, classEdges, instanceId, instanceLabel, updatedAt, collapsed, filledAttrMap) {
  const uniqueId = uuidv4();
  const groupNode = classNodes.find(n => n.id === id);
  if (!groupNode) return { newNodes: [], newEdges: [] };

  // ✅ 모든 하위 노드까지 재귀 수집
  const allDescendants = collectAllDescendants(classNodes, id);

  const deltaX = event.x - groupNode.position.x;
  const deltaY = event.y - groupNode.position.y;

  const idMap = new Map();
  const groupInstanceId = `instance-${groupNode.id}-${uniqueId}`;
  idMap.set(groupNode.id, groupInstanceId);

  // 최상위 group 복제
  const newGroupNode = {
    ...groupNode,
    id: groupInstanceId,
    type: "instance-group",
    position: event,
    data: {
      ...groupNode.data,
      label: instanceLabel || groupNode.data.label,
      type: groupNode.data.type,
      collapsed,
      instanceId,
    },
    class: id,
    updatedAt,
    style: { ...groupNode.style, height: collapsed ? 50 : groupNode.style.height },
  };

  // 모든 하위 노드 복제 (object, attribute, object-group 포함)
  const newChildNodes = allDescendants.map(n => {
    const newId = `instance-${n.id}-${uniqueId}`;
    idMap.set(n.id, newId);

    const originalParent = n.parentNode;
    const newParent = originalParent ? idMap.get(originalParent) : groupInstanceId;

    const newPosition = {
      x: n.position.x + deltaX,
      y: n.position.y + deltaY,
    };

    const baseData = {
      ...n.data,
      type: n.data.type,
      instanceId,
      label: n.data.label,
    };

    if (n.data.type === "attribute" && !n.data.hasValue) {
      const inputValue = getAttributeValue(n.data.label, filledAttrMap, instanceId, n.id);
      if (!inputValue) return null;

      return {
        ...n,
        id: newId,
        type: "instance",
        position: newPosition,
        parentNode: newParent,
        extent: n.extent,
        data: { ...baseData, value: inputValue, hasValue: inputValue },
        updatedAt,
      };
    }

    return {
      ...n,
      id: newId,
      type: n.type === "object-group" ? "instance-group" : "instance",
      position: newPosition,
      parentNode: newParent,
      extent: n.extent,
      data: baseData,
      updatedAt,
    };
  }).filter(Boolean);

  // 엣지도 재구성 (모든 descendants 기반으로)
  const allNodeIds = [groupNode.id, ...allDescendants.map(n => n.id)];
  const newEdges = classEdges
    .filter(e => allNodeIds.includes(e.source) && allNodeIds.includes(e.target))
    .map(e => ({
      ...e,
      id: `instance-${e.id}-${uniqueId}`,
      source: idMap.get(e.source),
      target: idMap.get(e.target),
    }));

  return { newNodes: [newGroupNode, ...newChildNodes], newEdges, newFilledAttrMap: filledAttrMap };
}

// entry point
export function createInstance(
  event, id, label, type, screenToFlowPosition,
  nodes, classNodes, classEdges,
  resizable = true, instanceId = null, instanceLabel = null,
  updatedAt = new Date().toISOString(), collapsed = false, filledAttrMap = {}
) {
  if (!type || !label) return;

  if (type === "object-group" && resizable === false) { // from InstanceBoard
    return cloneSubtreeInstance(event, id, classNodes, classEdges, instanceId, instanceLabel, updatedAt, collapsed, filledAttrMap);
  } else { // from LayoutBoard
    return createSimpleInstance(event, id, label, type, screenToFlowPosition, classNodes, classEdges, resizable, instanceId, updatedAt);
  }
}
