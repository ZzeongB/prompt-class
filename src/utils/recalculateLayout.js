export function recalculateLayout({ nodes }) {
  if (!nodes || nodes?.length === 0) return [];
  console.log("Recalculating layout for nodes:", nodes);
  const gapY = 50;
  let currentY = 200;

  const groupTypes = new Set([
    "object-group",
    "attribute-group",
    "instance-group",
  ]);

  // 1. Group 노드만 필터 + 생성순 정렬
  const groupNodes = nodes
    .filter((n) => groupTypes.has(n.type))
    .sort((a, b) => {
      const aTime =
        a.data?.createdAt || parseInt(a.id.match(/\d+/)?.[0] || "0");
      const bTime =
        b.data?.createdAt || parseInt(b.id.match(/\d+/)?.[0] || "0");
      return aTime - bTime;
    });

  const allOtherNodes = nodes.filter((n) => !groupTypes.has(n.type));
  const updatedNodes = [];

  for (const group of groupNodes) {
    const groupHeight = group.style.height || 100;

    // 2. 그룹 위치
    const basePosition = {
      x: group.position.x,
      y: currentY,
    };
    const deltaY = currentY - group.position.y;
    updatedNodes.push({
      ...group,
      position: basePosition,
    });

    currentY += groupHeight + gapY;

    // 3. 자식 노드 정렬
    const children = allOtherNodes.filter(
      (n) => n.data?.classId === group.id || n.parentNode === group.id
    );

    for (const child of children) {
      const newChild = {
        ...child,
        position: {
          ...child.position,
          y: child.position.y + deltaY,
        },
      };
      updatedNodes.push(newChild);
    }
  }

  // 4. 그 외의 독립 노드들도 아래에 나열
  const ungrouped = allOtherNodes.filter(
    (n) =>
      !groupNodes.find((g) => n.data?.classId === g.id || n.parentNode === g.id)
  );

  for (const node of ungrouped) {
    const height = node.__rf?.height || 80;
    updatedNodes.push({
      ...node,
      position: {
        ...node.position,
        y: currentY,
      },
    });
    currentY += height + gapY;
  }

  return updatedNodes;
}
