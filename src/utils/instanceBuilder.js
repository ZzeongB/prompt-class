import { v4 as uuidv4 } from "uuid";

// 공통 attribute value 입력 받기
function getAttributeValue(attrLabel, filledAttrMap, instanceId, attrId) {
  const existingValue = filledAttrMap?.[instanceId]?.[attrId];
  if (existingValue) return existingValue;

  const inputValue = prompt(`${attrLabel} 값을 입력하세요`);
  if (!inputValue) return null;

  if (!filledAttrMap[instanceId]) filledAttrMap[instanceId] = {};
  filledAttrMap[instanceId][attrId] = inputValue;

  return inputValue;
}

// attribute node 생성
function createAttributeInstance(attr, position, sharedId, instanceId, filledAttrMap, updatedAt) {
  const inputValue = getAttributeValue(attr.data.label, filledAttrMap, instanceId, attr.id);
  if (!inputValue) return null;

  const attrNodeId = `${sharedId}-attr-${attr.data.label}`;

  return {
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
      instanceId,
    },
    updatedAt,
  };
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

  const originalClassNode = classNodes.find(n => n.data.label === label && n.data.type === "object");
  const connectedAttrNodes = originalClassNode
    ? classEdges
        .filter(e => e.source === originalClassNode.id || e.target === originalClassNode.id)
        .map(e => classNodes.find(n => n.id === (e.source === originalClassNode.id ? e.target : e.source)))
        .filter(n => n && n.data.type === "attribute")
    : [];

  const newAttrNodes = [];
  const newAttrEdges = [];

  for (const attr of connectedAttrNodes) {
    if (!attr.data.hasValue) {
      const attrNode = createAttributeInstance(attr, position, sharedId, sharedId, {}, updatedAt);
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
    ? [{ id: `${sharedId}-resizable`, type: "resizable", position: { x: position.x, y: position.y + 30 }, data: newNode.data }, newNode, ...newAttrNodes]
    : [newNode, ...newAttrNodes];

  return { newNodes: nodes, newEdges: newAttrEdges };
}

// object-group + resizable = false 일 때 복제
function cloneSubtreeInstance(event, id, classNodes, classEdges, instanceId, instanceLabel, updatedAt, collapsed, filledAttrMap) {
  const uniqueId = uuidv4();
  const groupNode = classNodes.find(n => n.id === id);
  const childNodes = classNodes.filter(n => n.parentNode === id);
  if (!groupNode) return { newNodes: [], newEdges: [] };

  const basePosition = event;
  const deltaX = basePosition.x - groupNode.position.x;
  const deltaY = basePosition.y - groupNode.position.y;
  const idMap = new Map();

  const groupInstanceId = `instance-${groupNode.id}-${uniqueId}`;
  idMap.set(groupNode.id, groupInstanceId);

  const newGroupNode = {
    ...groupNode,
    id: groupInstanceId,
    type: "instance-group",
    position: basePosition,
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

  const newChildNodes = childNodes
    .map(n => {
      const newId = `instance-${n.id}-${uniqueId}`;
      idMap.set(n.id, newId);

      const newPosition = { x: n.position.x + deltaX, y: n.position.y + deltaY };

      if (n.data.type === "attribute" && !n.data.hasValue) {
        const inputValue = getAttributeValue(n.data.label, filledAttrMap, instanceId, n.id);
        if (!inputValue) return null;

        return {
          ...n,
          id: newId,
          type: "instance",
          position: newPosition,
          parentNode: n.parentNode ? `instance-${n.parentNode}-${uniqueId}` : undefined,
          extent: n.extent,
          data: {
            ...n.data,
            value: inputValue,
            hasValue: inputValue,
            label: n.data.label,
            type: "attribute",
            instanceId,
          },
          updatedAt,
        };
      }

      return {
        ...n,
        id: newId,
        type: "instance",
        position: newPosition,
        parentNode: n.parentNode ? `instance-${n.parentNode}-${uniqueId}` : undefined,
        extent: n.extent,
        data: { ...n.data, type: n.data.type, instanceId },
        updatedAt,
      };
    })
    .filter(Boolean);

  const allNodeIds = [groupNode.id, ...childNodes.map(n => n.id)];
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

// 최종 entry point
export function createInstance(
  event, id, label, type, screenToFlowPosition,
  nodes, classNodes, classEdges,
  resizable = true, instanceId = null, instanceLabel = null,
  updatedAt = new Date().toISOString(), collapsed = false, filledAttrMap = {}
) {
  if (!type || !label) return;

  if (type === "object-group" && resizable === false) {
    return cloneSubtreeInstance(event, id, classNodes, classEdges, instanceId, instanceLabel, updatedAt, collapsed, filledAttrMap);
  } else {
    return createSimpleInstance(event, id, label, type, screenToFlowPosition, classNodes, classEdges, resizable, instanceId, updatedAt);
  }
}
