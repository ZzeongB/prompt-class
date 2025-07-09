export function convertClassGroup(nodes, edges, visited = new Set()) {
  function buildGroup(groupId) {
    if (visited.has(groupId)) return null;
    visited.add(groupId);

    const groupNode = nodes.find((n) => n.id === groupId);
    if (!groupNode) return null;

    const children = nodes.filter((n) => n.parentNode === groupId);

    // 1. 먼저 class-group 자식들 수집
    const groupChildren = children.filter((n) => n.type === "class-group");

    // 2. class-group ID로 만든 Set
    const excludedIds = new Set(groupChildren.map((n) => n.id));

    // 3. object 노드 중에서, group ID와 중복되지 않는 애들만 수집
    const objectNodes = children.filter(
      (n) => n.data?.type === "object" && !excludedIds.has(n.id) // ✅ 여기!
    );

    const objectEntries = objectNodes.map((n) => ({ label: n.data?.label }));

    const nestedGroupsAsObjects = groupChildren
      .map((childGroup) => {
        const nested = buildGroup(childGroup.id);
        return nested
          ? {
              label: nested.class,
              objects: nested.objects,
              relations: nested.relations,
            }
          : null;
      })
      .filter(Boolean);

    const allObjects = [...objectEntries, ...nestedGroupsAsObjects];
    const memberIds = new Set(children.map((n) => n.id));

    const relations = children
      .filter((n) => n.data?.type === "relationship")
      .map((rel) => {
        const incoming = edges.find((e) => e.target === rel.id);
        const outgoing = edges.find((e) => e.source === rel.id);

        const sourceNode = nodes.find((n) => n.id === incoming?.source);
        const targetNode = nodes.find((n) => n.id === outgoing?.target);

        if (
          sourceNode?.data?.type === "object" &&
          targetNode?.data?.type === "object"
        ) {
          return {
            name: rel.data.label,
            source: sourceNode.data.label,
            target: targetNode.data.label,
          };
        }
        return null;
      })
      .filter(Boolean);
    return {
      class: groupNode.data?.label,
      objects: allObjects,
      relations,
    };
  }

  // top-level class-group들만 시작점
  const topGroups = nodes.filter(
    (n) => n.type === "class-group" && !n.parentNode
  );

  return topGroups.map((g) => buildGroup(g.id)).filter(Boolean);
}
