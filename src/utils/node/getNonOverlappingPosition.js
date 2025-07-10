export function getNonOverlappingPosition(existingNodes, width, height, startX = 0, startY = 0, gap = 50) {
  const isOverlapping = (x, y) => {
    return existingNodes.some((node) => {
      const nodeWidth = node.style?.width || 0;
      const nodeHeight = node.style?.height || 0;

      return !(
        x + width + gap < node.position.x ||
        x > node.position.x + nodeWidth + gap ||
        y + height + gap < node.position.y ||
        y > node.position.y + nodeHeight + gap
      );
    });
  };

  let x = startX;
  let y = startY;

  while (isOverlapping(x, y)) {
    y += gap; // 수직 방향으로 아래로 내림
  }

  return { x, y };
}

export function getSmartStartPosition(existingNodes, defaultX = 0, gap = 0) {
  if (existingNodes.length === 0) return { x: defaultX, y: 0 };

  const maxBottom = Math.max(
    ...existingNodes.map(
      (n) => n.position.y + (n.style?.height || 0)
    )
  );

  const minX = Math.min(...existingNodes.map((n) => n.position.x));
  const maxX = Math.max(...existingNodes.map((n) => n.position.x));
  const centerX = (minX + maxX) / 2;

  return {
    x: centerX,
    y: maxBottom + gap,
  };
}
