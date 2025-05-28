import { createInstance } from "./instanceBuilder";
import { recalculateLayout } from "./recalculateLayout";

export function getRenderedInstanceBoard({
  instanceNodes,
  classNodes,
  classEdges,
  screenToFlowPosition,
}) {
  const allNodes = [];
  const allEdges = [];
  const nodePositionMap = new Map();

  const gapY = 120;

  const filtered = instanceNodes.filter((n) => n.type !== "resizable");

  filtered.forEach((node, index) => {
    const classNode = classNodes.find((c) => c.id === node.data?.classId);
    if (!classNode) return;

    const position = { x: 0, y: index * gapY };
    nodePositionMap.set(node.id, position);

    const { newNodes, newEdges } = createInstance(
      position,
      classNode.id,
      classNode.data.label || "Instance",
      classNode.type || "object",
      screenToFlowPosition,
      [],
      classNodes,
      classEdges,
      false
    );

    allNodes.push(...newNodes);
    allEdges.push(...newEdges);
  });

  return {nodes: recalculateLayout({ nodes: allNodes }), edges: allEdges};
}
