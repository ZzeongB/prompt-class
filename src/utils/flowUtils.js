import { getPosition } from "./node/nodeStyleUtils";

export function classToFlow(classDefs) {
  const nodes = [];
  const edges = [];

  classDefs.forEach((cls, classIndex) => {
    const classId = `class-${cls.name}`;

    // 1. layout 계산
    const layoutRows = [];
    const objectIndexMap = {};

    cls.objects.forEach((obj) => {
      layoutRows.push({ type: "object", name: obj.name });
      objectIndexMap[obj.name] = layoutRows.length - 1;
    });

    cls.relations?.forEach((rel) => {
      const s = objectIndexMap[rel.source];
      const t = objectIndexMap[rel.target];
      const insertIndex = Math.min(s, t) + 1;

      layoutRows.splice(insertIndex, 0, {
        type: "relationship",
        source: rel.source,
        target: rel.target,
        rel,
      });

      Object.keys(objectIndexMap).forEach((key) => {
        if (objectIndexMap[key] >= insertIndex) {
          objectIndexMap[key]++;
        }
      });
    });

    const objectGapY = 80;
    const totalHeight = layoutRows.length * objectGapY + 60;

    // 2. 클래스 박스
    nodes.push({
      id: classId,
      type: "class-group",
      data: {
        label: cls.name,
        collapsed: false,
        expandedHeight: totalHeight,
        type: "object",
      },
      position: getPosition("class", classIndex, 0, 0, 0, totalHeight),
      style: {
        width: 220,
        height: totalHeight,
        backgroundColor: "transparent",
        zIndex: -1,
      },
    });

    // 3. 노드 생성
    layoutRows.forEach((row, rowIndex) => {
      const y = rowIndex; // objectIndex로 바로 사용
      const isCollapsed = nodes.find((n) => n.id === classId)?.data?.collapsed;
      if (isCollapsed) {
        return; // 클래스가 접혀있으면 노드 생성 안 함
      }

      if (row.type === "object") {
        const obj = cls.objects.find((o) => o.name === row.name);
        const objectId = `${classId}-obj-${obj.name}`;

        nodes.push({
          id: objectId,
          data: { label: obj.name, type: "object" },
          type: "class",
          parentNode: classId,
          extent: "parent",
          position: getPosition("object", classIndex, y),
        });

        obj.attributes?.forEach((attr, attrIndex) => {
          const attrId = `${objectId}-attr-${attr.name}`;
          nodes.push({
            id: attrId,
            data: {
              label: attr.name,
              type: "attribute",
              hasValue: attr.value,
            },
            type: "class",
            parentNode: classId,
            extent: "parent",
            position: getPosition("attribute", classIndex, y, attrIndex),
          });

          edges.push({
            id: `e-${objectId}-${attrId}`,
            source: objectId,
            target: attrId,
          });
        });
      }

      if (row.type === "relationship") {
        const { rel } = row;
        const sourceId = `${classId}-obj-${rel.source}`;
        const targetId = `${classId}-obj-${rel.target}`;
        const relationId = `${classId}-rel-${rel.type}-${rowIndex}`;

        const sourceIdx = objectIndexMap[rel.source];
        const targetIdx = objectIndexMap[rel.target];

        nodes.push({
          id: relationId,
          data: { label: rel.type, type: "relationship" },
          type: "class",
          parentNode: classId,
          extent: "parent",
          position: getPosition(
            "relationship",
            classIndex,
            sourceIdx,
            0,
            targetIdx
          ),
        });

        edges.push(
          {
            id: `e-${sourceId}-${relationId}`,
            source: sourceId,
            target: relationId,
          },
          {
            id: `e-${relationId}-${targetId}`,
            source: relationId,
            target: targetId,
          }
        );
      }
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
