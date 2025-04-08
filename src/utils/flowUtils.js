import { getPosition } from "./nodeStyleUtils";

export function classToFlow(classDefs) {
  const nodes = [];
  const edges = [];

  classDefs.forEach((cls, classIndex) => {
    const classId = `class-${cls.name}`;
    nodes.push({
      id: classId,
      data: { label: cls.name, type: 'object' },
      position: getPosition('object', classIndex),
      type: 'class',
    });

    cls.attributes.forEach((attr, attrIndex) => {
      const attrId = `${classId}-attr-${attrIndex}`;
      nodes.push({
        id: attrId,
        data: { label: attr.name, type: 'attribute', hasValue: attr.value },
        position: getPosition('attribute', classIndex, attrIndex),
        type: 'class',
      });

      edges.push({
        id: `e-${classId}-${attrId}`,
        source: classId,
        target: attrId,
      });
    });

    cls.relations?.forEach((rel, relIndex) => {
      const relationId = `${classId}-rel-${relIndex}`;
      const targetId = `class-${rel.target}`;
      nodes.push({
        id: relationId,
        data: { label: rel.type, type: 'relation' },
        position: getPosition('relation', classIndex, relIndex),
        type: 'class',
      });

      edges.push({
        id: `e-${classId}-${relationId}`,
        source: classId,
        target: relationId,
      });

      edges.push({
        id: `e-${relationId}-${targetId}`,
        source: relationId,
        target: targetId,
      });
    });
  });

  return { nodes, edges };
}


export function flowToClass(nodes, edges) {
  const classNodes = nodes.filter((n) => n.id.startsWith("class-"));

  return classNodes.map((clsNode) => {
    const classId = clsNode.id;
    const className = clsNode.data.label;

    const propertyEdges = edges.filter(
      (e) => e.source === classId && e.label === "property"
    );

    const attributes = propertyEdges.map((e) => {
      const attrNode = nodes.find((n) => n.id === e.target);
      const valueEdge = edges.find(
        (ve) => ve.source === attrNode.id && ve.label === "value"
      );
      const valueNode = valueEdge
        ? nodes.find((n) => n.id === valueEdge.target)
        : null;

      return {
        name: attrNode.data.label,
        value: valueNode?.data.label ?? null,
      };
    });

    const relations = edges
      .filter((e) => e.source === classId && e.label === "has")
      .map((e) => {
        const targetNode = nodes.find((n) => n.id === e.target);
        return {
          type: "has",
          target: targetNode?.data.label || "Unknown",
        };
      });

    return {
      name: className,
      attributes,
      relations: relations.length > 0 ? relations : [], // ❗ 보정
    };
  });
}
