import { getNodeLayout } from "../node/getNodeLayout";

function getNodeEdges(nodeId, allNodes) {
  const node = allNodes.find((n) => n.id === nodeId);
  if (!node) return [];
  return node.incomingEdges ?? [];
}

export const handleObjectLayoutSave = (
  id,
  getNode,
  setNodes,
  addEdges,
) => {
  const resizableNode = getNode(`${id}-resizable`);

  if (!resizableNode) {
    console.error("Resizable node not found");
    return;
  }
  const layout = getNodeLayout(resizableNode); // 아래에서 정의
  const attrNodeId = `${id}-layout`;

  const layoutLabel = `layout: (${layout.x.toFixed(1)}, ${layout.y.toFixed(
    1
  )}, ${layout.width}, ${layout.height})`;

  setNodes((prev) => {
    const exists = prev.find((n) => n.id === attrNodeId);
    const others = prev.filter((n) => n.id !== attrNodeId);

    const layoutNode = {
      id: attrNodeId,
      type: "instance",
      position: { x: layout.x + 100, y: layout.y },
      data: {
        label: layoutLabel,
        type: "attribute",
        hasValue: true,
        isLayout: true,
      },
    };

    return exists ? [...others, layoutNode] : [...prev, layoutNode];
  });

  addEdges([
    {
      id: `${id}-${attrNodeId}`,
      source: id,
      target: attrNodeId,
      label: "layout",
    },
  ]);
};

export const handleRelationshipLayoutSave = (
  id,
  data,
  getNode,
  setNodes,
) => {
  const sourceObj = getNode(data.source);
  const targetObj = getNode(data.target);

  if (!sourceObj || !targetObj) {
    console.warn("❗ 연결된 object 노드를 찾을 수 없습니다.");
    return;
  }

  const sourceBox = [
    sourceObj.position.x,
    sourceObj.position.y,
    sourceObj.position.x + 100,
    sourceObj.position.y + 100,
  ];
  const targetBox = [
    targetObj.position.x,
    targetObj.position.y,
    targetObj.position.x + 100,
    targetObj.position.y + 100,
  ];

  const vector = [
    targetObj.position.x - sourceObj.position.x,
    targetObj.position.y - sourceObj.position.y,
  ];

  const predicate =
    Math.abs(vector[0]) > Math.abs(vector[1])
      ? vector[0] > 0
        ? "left of"
        : "right of"
      : vector[1] > 0
      ? "above"
      : "below";

  // ✅ 기존 관계 노드 업데이트
  setNodes((prev) =>
    prev.map((n) =>
      n.id === id
        ? {
            ...n,
            data: {
              ...n.data,
              sourceBox,
              targetBox,
              vector,
              predicate,
              isLayoutReady: true, // 시각화에 쓰기 좋음
              type: "relationship-layout",
            },
          }
        : n
    )
  );
};
