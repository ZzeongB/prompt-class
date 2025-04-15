export function getNodeLayout(resizableNode) {
  const x = resizableNode?.position?.x ?? 0;
  const y = resizableNode?.position?.y ?? 0;
  const width = resizableNode?.measured?.width ?? 100;
  const height = resizableNode?.measured?.height ?? 100;

  return { x, y, width, height };
}
