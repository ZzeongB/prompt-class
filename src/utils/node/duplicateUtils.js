export function generateId(originalId) {
  return `${originalId}-copy-${Math.random().toString(36).slice(2, 7)}`;
}

export function duplicateNodesWithMapping(
  nodes,
  { offset = { x: 30, y: 0 }, sharedIdBase = null, parentNodeMap = {} } = {}
) {
  const idMap = {};
  const newSharedId = sharedIdBase
    ? `${sharedIdBase}-copy-${Math.random().toString(36).slice(2, 7)}`
    : null;

  const groupNode = nodes.find((n) => !n.parentNode); // 최상위 group
  const groupPosition = groupNode?.position ?? { x: 0, y: 0 };

  const duplicated = nodes.map((node, idx) => {
    const newId = generateId(node.id);
    idMap[node.id] = newId;

    const position = node.position ?? { x: 0, y: 0 };

    // 🟡 자식이면 부모 기준 상대 좌표 계산
    const isChild = node.parentNode === groupNode?.id;
    
    return {
      ...node,
      id: newId,
      parentNode: isChild ? idMap[node.parentNode] : undefined,
      extent: isChild ? "parent" : undefined,
      position: {
        x: position.x + offset.x,
        y: position.y + offset.y,
      },
      data: {
        ...node.data,
        label: `${node.data.label} (copy)`,
        ...(newSharedId ? { sharedId: newSharedId } : {}),
      },
    };
  });

  console.log("duplicated: ", duplicated);
  console.log("idMap", idMap);

  return { duplicated, idMap, newSharedId };
}

export function duplicateEdges(edges, idMap) {
  return edges
    .filter((e) => idMap[e.source] && idMap[e.target])
    .map((edge) => ({
      ...edge,
      id: generateId(edge.id),
      source: idMap[edge.source],
      target: idMap[edge.target],
    }));
}
