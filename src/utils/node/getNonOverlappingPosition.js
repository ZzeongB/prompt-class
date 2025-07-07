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

  // 간단히 아래로 쌓기 (혹은 나선형으로 바꿀 수도 있음)
  let x = startX;
  let y = startY;

  while (isOverlapping(x, y)) {
    y += height + gap; // 수직 방향으로 아래로 내림
  }

  return { x, y };
}
