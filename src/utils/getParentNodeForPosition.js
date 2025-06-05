export function getParentNodeForPosition(node, classNodes) {
  const nodeX = node.position.x;
  const nodeY = node.position.y;
  const nodeW = node.width || 0;
  const nodeH = node.height || 0;

  return classNodes.find((classNode) => {
    if (!classNode.style) return false;
    const { x, y } = classNode.position;
    const { width, height } = classNode.style;

    return (
      nodeX >= x &&
      nodeY >= y &&
      nodeX + nodeW <= x + width &&
      nodeY + nodeH <= y + height
    );
  })?.id;
}
