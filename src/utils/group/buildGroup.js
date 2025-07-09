export function buildGroup(groupId, nodes, edges, visited = new Set()) {
  if (visited.has(groupId)) return null;
  visited.add(groupId);

  const groupNode = nodes.find((n) => n.id === groupId);
  if (!groupNode) return null;

  const children = nodes.filter((n) => n.parentNode === groupId);
  const attributeNodes = children.filter((n) => n.data?.type === "attribute");
  const relationNodes = children.filter((n) => n.data?.type === "relationship");

  // ✅ object 후보: object-node + class-group-node 둘 다!
  const objectCandidates = children.filter(n =>
    (n.data?.type === "object" || n.type === "class-group")
  );

  const objectEntries = objectCandidates.map((objNode) => {
    const objectId = objNode.id;

    // ✅ attributes 연결 (edge 기반)
    const connectedAttrEdges = edges.filter(e => e.source === objectId);
    const connectedAttributes = connectedAttrEdges
      .map(e => {
        const attrNode = nodes.find(n => n.id === e.target && n.data?.type === "attribute");
        if (!attrNode) return null;
        return {
          name: attrNode.data?.label,
          value: attrNode.data?.hasValue ?? null,
          id: attrNode.id,
        };
      })
      .filter(Boolean);

    // ✅ nested class-group 재귀적 처리
    let nestedObjects = [];
    let nestedRelations = [];
    if (objNode.type === "class-group") {
      const nested = buildGroup(objNode.id, nodes, edges, visited);
      if (nested) {
        nestedObjects = nested.objects ?? [];
        nestedRelations = nested.relations ?? [];
      }
    }

    return {
      class: objNode.data?.label,
      label: objNode.data?.label,
      attributes: connectedAttributes,
      objects: nestedObjects,
      relations: nestedRelations,
    };
  });

  // ✅ group 자체 attribute (아무 object에도 연결되지 않은 것)
  const connectedAttrIds = edges.map(e => e.target);
  const groupAttributes = attributeNodes
    .filter(attrNode => !connectedAttrIds.includes(attrNode.id))
    .map(attrNode => ({
      name: attrNode.data?.label,
      value: attrNode.data?.hasValue ?? null,
      id: attrNode.id,
    }));

  // ✅ group scope의 relation 수집
  const relations = relationNodes.map((rel) => {
    const incoming = edges.find((e) => e.target === rel.id);
    const outgoing = edges.find((e) => e.source === rel.id);

    const sourceNode = nodes.find((n) => n.id === incoming?.source);
    const targetNode = nodes.find((n) => n.id === outgoing?.target);

    if (sourceNode?.data?.type && targetNode?.data?.type) {
      return {
        name: rel.data.label,
        source: sourceNode.data.label,
        target: targetNode.data.label,
      };
    }
    return null;
  }).filter(Boolean);

  return {
    class: groupNode.data?.label,
    attributes: groupAttributes,
    objects: objectEntries,
    relations,
  };
}
