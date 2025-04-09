export function extractSentencesAndBoxes(
  instanceNodes,
  instanceEdges,
  classGraph
) {
  const objectNodes = instanceNodes.filter(
    (n) => n.type === "instance" && n.data.type === "object"
  );
  console.log("objectNodes", objectNodes);
  console.log("classGraph", classGraph);
  const classGraphEdges = classGraph.edges;
  const classGraphNodes = classGraph.nodes;

  const sentences = [];
  const boxes = [];

  objectNodes.forEach((objNode) => {
    const objectSentences = [];

    // 1. 이 object에 연결된 class object 찾기
    const classObjectId = objNode.data.classId;

    // 2. class object에 연결된 attribute 노드들 찾기
    const classAttrEdges = classGraphEdges.filter(
      (e) => e.source === classObjectId && e.target.includes("attr")
    );
    const classAttrIds = classAttrEdges.map((e) => e.target);
    const classAttrs = classAttrIds.map((id) =>
      classGraphNodes.find((n) => n.id === id)
    );

    const instanceAttrEdges = instanceEdges.filter(
      (e) => e.source === objNode.id || e.target === objNode.id
    );

    const linkedAttrNodeIds = instanceAttrEdges
      .map((e) => (e.source === objNode.id ? e.target : e.source))
      .filter(
        (id) =>
          instanceNodes.find((n) => n.id === id)?.data.type === "attribute"
      );

    const linkedAttrNodes = linkedAttrNodeIds.map((id) =>
      instanceNodes.find((n) => n.id === id)
    );

    classAttrs.forEach((classAttr) => {
      const hasValue = classAttr.data.hasValue;
      const label = classAttr.data.label;

      if (hasValue) {
        objectSentences.push(`${label} ${objNode.data.label}`);
      } else {
        // instance에 연결된 attr 중 이 classAttr에 해당하는 것 찾기
        const matchedInstanceAttr = linkedAttrNodes.find(
          (n) => n.data.classId === classAttr.id
        );
        if (matchedInstanceAttr) {
          console.log("matchedInstanceAttr", matchedInstanceAttr);
          objectSentences.push(
            `${objNode.data.label} has ${matchedInstanceAttr.label}`
          );
        }
      }
    });

    // 3. instance에만 있는 attribute 처리
    linkedAttrNodes.forEach((attrNode) => {
      const isDefinedInClass = classAttrIds.includes(attrNode.data.classId);
      if (!isDefinedInClass) {
        console.log("attrNode", attrNode);
        objectSentences.push(
          `${objNode.data.label} has ${attrNode.data.label.split(":")[0]}${
            attrNode.data.label.split(":")[1]
          }`
        );
      }
    });

    sentences.push(objectSentences.join(", "));
    // 4. 좌표
    const { x, y } = objNode.position;
    const width = objNode.width || 100;
    const height = objNode.height || 100;

    boxes.push([x, y, x + width, y + height]);
  });

  return { sentences, boxes };
}
