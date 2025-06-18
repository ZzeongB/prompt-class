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
  const newSharedId = sharedIdBase ? `${sharedIdBase}-${randomId}` : null;

  const duplicated = nodes.map((node) => {
    const newId = `${node.id}-${randomId}`;
    idMap[node.id] = newId;

    const position = node.position ?? { x: 0, y: 0 };
    const isChild = node.parentNode === groupNode?.id;

    const newData = {
      ...node.data,
      label:
        node === groupNode
          ? `${node.data.label} (Copy)`
          : node.data.label,
    };

    if (sharedIdBase) {
      newData.sharedId = newSharedId;
    }

    const duplicatedNode = {
      ...node,
      id: newId,
      position: {
        x: position.x + offset.x,
        y: position.y + offset.y,
      },
      data: newData,
    };

    // parentNode와 extent는 원래 있던 경우에만 복사
    if (node.parentNode && isChild) {
      duplicatedNode.parentNode = idMap[node.parentNode];
      duplicatedNode.extent = "parent";
    }

    return duplicatedNode;
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
