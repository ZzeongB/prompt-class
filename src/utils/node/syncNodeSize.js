export const getSizeLinkedNodeIds = (nodeId, edges) => {
  const connected = edges.filter(
    (e) => e.label === "size" && (e.source === nodeId || e.target === nodeId)
  );
  const related = new Set();
  connected.forEach((e) => {
    if (e.source !== nodeId) related.add(e.source);
    if (e.target !== nodeId) related.add(e.target);
  });

  return [...related];
};

export function syncResizedNodeSizes({ changedId, newSize, prevNodes, edges }) {
  const updatedNodes = [...prevNodes];
  const resizedNode = updatedNodes.find((n) => n.id === changedId);
  if (!resizedNode) return prevNodes;

  const prevWidth = resizedNode.style?.width ?? resizedNode.data?.expandedWidth ?? 200;
  const prevHeight = resizedNode.style?.height ?? resizedNode.data?.expandedHeight ?? 200;

  const delta = {
    width: newSize.width - prevWidth,
    height: newSize.height - prevHeight,
  };

  const sizeLinkedNodeIds = getSizeLinkedNodeIds(changedId, edges);

  return updatedNodes.map((node) => {
    if (node.id === changedId) return node; // 본인은 제외

    if (sizeLinkedNodeIds.includes(node.id)) {
      const newWidth = (node.style?.width ?? node.data?.expandedWidth ?? 200) + delta.width;
      const newHeight = (node.style?.height ?? node.data?.expandedHeight ?? 200) + delta.height;

      return {
        ...node,
        data: {
          ...node.data,
          expandedWidth: newWidth,
          expandedHeight: newHeight,
        },
        style: {
          ...node.style,
          width: newWidth,
          height: newHeight,
        },
      };
    }

    return node;
  });
}
