export function buildGroup(groupId, nodes, edges, visited = new Set()) {
  if (visited.has(groupId)) return null;
  visited.add(groupId);

  const groupNode = nodes.find((n) => n.id === groupId);
  if (!groupNode) return null;

  const children = nodes.filter((n) => n.parentNode === groupId);

  const groupChildren = children.filter((n) => n.type === "object-group");
  const excludedIds = new Set(groupChildren.map((n) => n.id));

  const objectNodes = children.filter(
    (n) => n.data?.type === "object" && !excludedIds.has(n.id)
  );

  const objectEntries = objectNodes.map((n) => ({ label: n.data?.label }));

  const nestedGroupsAsObjects = groupChildren
    .map((childGroup) => {
      const nested = buildGroup(childGroup.id, nodes, edges, visited);
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
