// ✅ UUID import
import { v4 as uuidv4 } from "uuid";
import { getAttributeValue } from "./handleAttribute";

// ✅ Group 복제 관련 유틸
function collectAllDescendants(nodes, parentId) {
  const result = [];
  function dfs(currentId) {
    const children = nodes.filter((n) => n.parentNode === currentId);
    for (const child of children) {
      result.push(child);
      dfs(child.id);
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
  });

  return Array.from(connectedIds)
    .map((id) => allNodes.find((n) => n.id === id))
    .filter(Boolean);
}

// ✅ 복잡한 그룹 인스턴스 복제
export function createInstanceFromGroupNode(
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
  const groupNode = classNodes.find((n) => n.id === id);
  if (!groupNode) return { newNodes: [], newEdges: [] };

  const allDescendants = collectAllDescendants(classNodes, id);
  const allClassNodeIds = [groupNode.id, ...allDescendants.map((n) => n.id)];

  const classExternalNodes = getEdgeConnectedOutsideNodes(
    allClassNodeIds,
    classEdges,
    classNodes
  );
  const instanceExternalNodes = getEdgeConnectedOutsideNodes(
    [instanceId],
    instanceEdges,
    instanceNodes
  );

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

  const newGroupNode = {
    ...groupNode,
    id: groupInstanceId,
    type: "instance-group",
    position: event,
    data: {
      ...groupNode.data,
      label,
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
        instanceId,
        label: editedLabelMap?.[instanceId]?.[n.id] ?? n.data.label,
        hasValue:
          n.data.type === "attribute"
            ? editedLabelMap?.[instanceId]?.[n.id] ?? n.data.label
            : null,
        originalClassId: n.id,
      };

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
          data: { ...baseData, value, hasValue: value },
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
