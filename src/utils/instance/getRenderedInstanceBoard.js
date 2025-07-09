import { createInstance } from "./instanceBuilder";
import { recalculateLayout } from "../layout/recalculateLayout";

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

  if(classNodes.length === 0 && classEdges.length === 0) {
    allNodes.push(...filtered);
  }

  filtered.forEach((node, index) => {
    const classNode = classNodes.find((c) => c.id === node.data?.classId);
    // 해당 노드가 참조하는 classNode가 없으면 건너뛰기
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

  return {
    nodes: recalculateLayout({ nodes: allNodes }),
    edges: allEdges,
    filledAttrMap: mergedFilledAttrMap,
  };
}
