import { createInstance } from "./instanceBuilder";
import { recalculateLayout } from "../layout/recalculateLayout";

function getConnectedAttributeNodes(
  instanceNode,
  instanceEdges,
  instanceNodes
) {
  return instanceEdges
    .filter((e) => e.source === instanceNode.id)
    .map((e) => instanceNodes.find((n) => n.id === e.target))
    .filter((n) => n?.data?.type === "attribute");
}

export function getRenderedInstanceBoard({
  instanceNodes,
  instanceEdges,
  classNodes,
  classEdges,
  screenToFlowPosition,
  collapsedClassMap = {},
  filledAttrMap = {},
}) {
  const allNodes = [];
  const allEdges = [];
  const nodePositionMap = new Map();
  const mergedFilledAttrMap = { ...filledAttrMap }; // ✅ 초기화

  const gapY = 120;

  const filtered = instanceNodes.filter((n) => n.type !== "resizable");

  filtered.forEach((node, index) => {
    const classNode = classNodes.find((c) => c.id === node.data?.classId);
    if (!classNode) return;
    const groupNode = instanceNodes.find(
      (n) => n.id === node.parentNode && n.type === "instance-group"
    );
    const baseY = groupNode?.position?.y ?? index * gapY;

    const position = {
      x: 0,
      y: baseY + 100 + index * 30, // 부모 기준 상대 배치
    };
    // const position = { x: 0, y: index * gapY };
    nodePositionMap.set(node.id, position);

    const isCollapsed = collapsedClassMap.hasOwnProperty(node.data.instanceId)
      ? collapsedClassMap[node.data.instanceId]
      : true;

    const { newNodes, newEdges, newFilledAttrMap } = createInstance(
      position,
      classNode.id,
      classNode.data.label || "Instance",
      classNode.type || "object",
      screenToFlowPosition,
      [],
      classNodes,
      classEdges,
      instanceNodes,
      instanceEdges,
      false,
      node.id,
      node.data.label || "Instance",
      node.updatedAt,
      isCollapsed,
      filledAttrMap,
    );

    allNodes.push(...newNodes);
    allEdges.push(...newEdges);

    for (const [instanceId, attrMap] of Object.entries(
      newFilledAttrMap || {}
    )) {
      if (!mergedFilledAttrMap[instanceId]) {
        mergedFilledAttrMap[instanceId] = {};
      }
      Object.assign(mergedFilledAttrMap[instanceId], attrMap);
    }
  });

  console.log("AllNodes", allNodes)
  return {
    nodes: recalculateLayout({ nodes: allNodes }),
    edges: allEdges,
    filledAttrMap: mergedFilledAttrMap,
  };
}
