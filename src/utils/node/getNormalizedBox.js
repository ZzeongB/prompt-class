/**
 * 주어진 resizable 노드의 좌표 정보를 정규화된 박스로 반환합니다.
 *
 * @param node - React Flow 노드 객체 (position과 measured 포함)
 * @param transformFn - 좌표 변환 함수 (예: flowToScreenPosition)
 * @param offsetX - x축 오프셋 (필요 없으면 0)
 * @param offsetY - y축 오프셋 (필요 없으면 0)
 * @returns 정규화된 [x1, y1, x2, y2] bounding box
 */
export function getNormalizedBox(
  node,
  transformFn,
  offsetX = 0,
  offsetY = 0,
  normalize = false
) {
  if(node?.position == null) return [0, 0, 0, 0];
  const { x, y } = node.position;

  const width = node.measured?.width ?? 100;
  const height = node.measured?.height ?? 100;

  const topLeft = transformFn({ x, y });
  const bottomRight = transformFn({ x: x + width, y: y + height });

  const adjustedX1 = topLeft.x - offsetX;
  const adjustedY1 = topLeft.y - offsetY;
  const adjustedX2 = bottomRight.x - offsetX;
  const adjustedY2 = bottomRight.y - offsetY;

  if (normalize) {
    // Normalize to [0, 1] range
    const normalizedX1 = adjustedX1 / 512;
    const normalizedY1 = adjustedY1 / 512;
    const normalizedX2 = adjustedX2 / 512;
    const normalizedY2 = adjustedY2 / 512;

    return [normalizedX1, normalizedY1, normalizedX2, normalizedY2];
  }
  // Return absolute coordinates
  return [adjustedX1, adjustedY1, adjustedX2, adjustedY2];
}
