export function getParentNodeForPosition(node, classNodes) {
  const nodeX = node.position.x;
  const nodeY = node.position.y;
  const nodeW = node.width || 0;
  const nodeH = node.height || 0;

  const containingParents = classNodes.filter((classNode) => {
    if (classNode.id === node.id) return false;
    if (!classNode.style) return false;

    const { x, y } = classNode.position;
    const { width, height } = classNode.style;

    return (
      nodeX >= x &&
      nodeY >= y &&
      nodeX + nodeW <= x + width &&
      nodeY + nodeH <= y + height
    );
  });

  // 🔽 면적 작은 순으로 정렬 → 가장 안쪽 그룹이 위로
  const sortedByArea = containingParents.sort((a, b) => {
    const areaA = (a.style?.width || 0) * (a.style?.height || 0);
    const areaB = (b.style?.width || 0) * (b.style?.height || 0);
    return areaA - areaB; // 면적 작은 것 우선
  });

  return sortedByArea[0]?.id;
}
