export function generateId(originalId) {
  return `${originalId}-${Math.random().toString(36).slice(2, 7)}`;
}

export function duplicateNodesWithMapping(
  nodes,
  {
    offset = { x: 0, y: 300 },
    parentNodeMap = {},
    sharedIdBase = undefined,
  } = {}
) {
  const idMap = {};
  const randomId = Math.random().toString(36).slice(2, 7);

  const groupNode = nodes.find((n) => !n.parentNode); // 최상위 group

  // sharedId가 있을 경우에만 새 sharedId 생성
  const newSharedId = sharedIdBase ? `${sharedIdBase}-${randomId}` : null;

  const duplicated = nodes.map((node) => {
    const newId = `${node.id}-${randomId}`;
    idMap[node.id] = newId;

    const position = node.position ?? { x: 0, y: 0 };
    const isChild = node.parentNode === groupNode?.id;

    const newData = {
      ...node.data,
      label:
        node.id === groupNode.id
          ? `${node.data.label} (Copy)`
          : node.data.label,
    };

    // sharedId는 존재할 경우에만 부여
    if (sharedIdBase) {
      newData.sharedId = newSharedId;
    }

    return {
      ...node,
      id: newId,
      parentNode: isChild ? idMap[node.parentNode] : undefined,
      extent: isChild ? "parent" : undefined,
      position: {
        x: position.x + offset.x,
        y: position.y + offset.y,
      },
      data: newData,
    };
  });

  return { duplicated, idMap, randomId };
}

export function duplicateEdges(edges, idMap, randomId) {
  return edges
    .filter((e) => idMap[e.source] && idMap[e.target])
    .map((edge) => ({
      ...edge,
      id: `${edge.id}-${randomId}`,
      source: idMap[edge.source],
      target: idMap[edge.target],
    }));
}
