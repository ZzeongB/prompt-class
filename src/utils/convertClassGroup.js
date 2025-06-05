export function convertClassGroup(nodes, edges) {
  const classGroups = nodes.filter((n) => n.type === "object-group");

  return classGroups.map((classNode) => {
    const classId = classNode.id;
    const children = nodes.filter((n) => n.parentNode === classId);

    const objects = children
      .filter((n) => n.data.type === "object")
      .map((obj) => {
        // 이 object에 연결된 attribute 찾기
        const attrEdges = edges.filter((e) => e.source === obj.id);
        const attributes = attrEdges
          .map((e) => nodes.find((n) => n.id === e.target))
          .filter((n) => n?.data.type === "attribute")
          .map((attr) => ({
            name: attr.data.hasValue ? attr.data.hasValue : attr.data.value? attr.data.value : attr.data.label,
            // value: attr.data.hasValue,
          }));

        return {
          name: obj.data.label,
          attributes,
        };
      });

    const relations = children
      .filter((n) => n.data.type === "relationship")
      .map((rel) => {
        const incoming = edges.find((e) => e.target === rel.id);
        const outgoing = edges.find((e) => e.source === rel.id);

        const sourceNode = nodes.find((n) => n.id === incoming?.source);
        const targetNode = nodes.find((n) => n.id === outgoing?.target);

        return {
          name: rel.data.label,
          source: sourceNode?.data.label,
          target: targetNode?.data.label,
        };
      });

    return {
      class: classNode.data.label,
      objects,
      relations,
    };
  });
}
