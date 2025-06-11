import { getNormalizedBox } from "./node/getNormalizedBox";

function buildCompositionalSentence(classEntry) {
  const objectNameMap = {};

  classEntry.objects.forEach((obj) => {
    const modifiers = obj.attributes?.map((attr) => attr.name) || [];
    const fullName = [...modifiers, obj.name].join(" ");
    objectNameMap[obj.name] = fullName;
  });

  const objectsInRelations = new Set();
  const relationSentences = classEntry.relations?.map((rel) => {
    const source = objectNameMap[rel.source] || rel.source;
    const target = objectNameMap[rel.target] || rel.target;

    objectsInRelations.add(rel.source);
    objectsInRelations.add(rel.target);

    return `${source} ${rel.name} ${target}`;
  }) ?? [];

  const standaloneObjects = classEntry.objects
    .filter((obj) => !objectsInRelations.has(obj.name))
    .map((obj) => objectNameMap[obj.name]);

  const fullContent = [...relationSentences, ...standaloneObjects].join(", ");

  // Class 이름 삽입
  const classLabel = classEntry.class.toLowerCase();
  return `${classLabel}: ${fullContent}`;
}


export function extractSentencesAndBoxes(
  instanceNodes,
  instanceEdges,
  classGraph,
  flowToScreenPosition
) {
  const objectNodes = instanceNodes.filter(
    (n) => n.type === "instance" && (n.data.type === "object" || n.data.type === "object-group")
  );
  const resizableNodes = instanceNodes.filter(
    (n) => n.type === "resizable" && (n.data.type === "object" || n.data.type === "object-group")
  );

  const sentences = [];
  const boxes = [];
  // ✅ Case 1: objectNodes가 존재하는 경우 (일반 처리)
  if (objectNodes.length > 0) {
    objectNodes.forEach((objNode) => {
      const classId = objNode.data.classId; // e.g., "class__두더지"
      const classEntry = classGraph.find((c) => `class-${c.class}` === classId);
      if (!classEntry) return;
      const sentence = buildCompositionalSentence(classEntry);
      sentences.push(sentence);

      // 박스 추출
      const resizableNode = resizableNodes.find(
        (n) => n.id.split("-resizable")[0] === objNode.id
      );

      const box = getNormalizedBox(
        resizableNode,
        flowToScreenPosition,
        660,
        40,
        true
      );
      boxes.push(box);
    });
  }

  // ✅ Case 2: objectNodes가 없는 경우 (베이스라인)
  else {
    // classId 가진 instance node들만 추출
    const baselineNodes = instanceNodes.filter(
      (n) => n.type === "instance" && n.data?.classId
    );

    baselineNodes.forEach((node) => {
      const classId = node.data.classId;
      const classEntry = classGraph.find((c) => `class-${c.class}` === classId);
      if (!classEntry) return;

      const sentence = buildCompositionalSentence(classEntry);
      sentences.push(sentence);
    });

    // box는 없음
  }

  return { sentences, boxes };
}
