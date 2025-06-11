export function buildTree(flatNodes, edges) {
  const nodeMap = {};
  flatNodes.forEach(node => {
    nodeMap[node.id] = { ...node, children: [] };
  });

  const parentMap = {};
  const roots = [];

  // STEP 1 — parentNode 기반 트리 생성
  flatNodes.forEach(node => {
    if (node.parentNode && nodeMap[node.parentNode]) {
      const parent = nodeMap[node.parentNode];
      parent.children.push(nodeMap[node.id]);
      parentMap[node.id] = parent;
    } else {
      roots.push(nodeMap[node.id]);
      parentMap[node.id] = null;
    }
  });

  // STEP 2 — edge 기반 hierarchy 보강 (reparenting)
  edges.forEach(edge => {
    const sourceNode = nodeMap[edge.source];
    const targetNode = nodeMap[edge.target];
    if (!sourceNode || !targetNode) return;

    const sourceType = sourceNode.data?.type;
    const targetType = targetNode.data?.type;

    const isHierarchyEdge =
      (sourceType === "object" && targetType === "attribute") ||
      (sourceType === "object" && targetType === "relationship") ||
      (sourceType === "relationship" && targetType === "object");

    if (!isHierarchyEdge) return;

    // 이미 parent 있으면 hierarchy 재조정
    const currentParent = parentMap[targetNode.id];
    if (currentParent) {
      currentParent.children = currentParent.children.filter(c => c.id !== targetNode.id);
    } else {
      const rootIndex = roots.findIndex(r => r.id === targetNode.id);
      if (rootIndex >= 0) roots.splice(rootIndex, 1);
    }

    sourceNode.children.push(targetNode);
    parentMap[targetNode.id] = sourceNode;
  });

  return roots;
}
