import { getNormalizedBox } from "../node/getNormalizedBox";
import { buildGroup } from "../group/buildGroup"; // 분리된 유틸 import

function buildCompositionalSentence(classEntry) {
  const objectNameMap = {};

  classEntry.objects.forEach((obj) => {
    if (obj.objects) {
      // nested group인 경우 → 재귀 호출로 먼저 문장 생성
      const nestedSentence = buildCompositionalSentence(obj);
      objectNameMap[obj.label] = nestedSentence;
    } else {
      // 일반 object
      const modifiers = (obj.attributes || []).map((attr) => {
        if (attr.value) {
          return `${attr.value}`;
        } else {
          return attr.name; // 값 없을 경우 이름만
        }
      });

      const fullName = [...modifiers, obj.label].join(" ");
      objectNameMap[obj.label] = fullName;
    }
  });

  const objectsInRelations = new Set();

  const relationSentences = (classEntry.relations || []).map((rel) => {
    const source = objectNameMap[rel.source] || rel.source;
    const target = objectNameMap[rel.target] || rel.target;

    objectsInRelations.add(rel.source);
    objectsInRelations.add(rel.target);

    return `${source} ${rel.name} ${target}`;
  });

  const standaloneObjects = classEntry.objects
    .filter((obj) => !objectsInRelations.has(obj.label))
    .map((obj) => objectNameMap[obj.label]);

  const fullContent = [...relationSentences, ...standaloneObjects].join(", ");

  return `${classEntry.class}: ${fullContent}`;
}

export function extractSentencesAndBoxes(
  instanceNodes,
  instanceEdges,
  classGraphNodes,
  classGraphEdges,
  flowToScreenPosition
) {
  const objectNodes = instanceNodes.filter(
    (n) =>
      (n.type === "instance" || n.type === "instance-group") &&
      (n.data.type === "object" || n.data.type === "object-group")
  );

  const resizableNodes = instanceNodes.filter(
    (n) =>
      n.type === "resizable" &&
      (n.data.type === "object" || n.data.type === "object-group")
  );

  const sentences = [];
  const boxes = [];

  if (objectNodes.length > 0) {
    objectNodes.forEach((objNode) => {
      const groupId = objNode.data.classId;
      const structuredClass = buildGroup(
        groupId,
        classGraphNodes,
        classGraphEdges
      );
      console.log("structuredClass", structuredClass);
      if (!structuredClass) return;

      const sentence = buildCompositionalSentence(structuredClass);
      sentences.push(sentence);

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
  } else {
    const baselineNodes = instanceNodes.filter(
      (n) => n.type === "instance" && n.data?.classId
    );

    baselineNodes.forEach((node) => {
      const groupId = node.data.classId;
      const structuredClass = buildGroup(
        groupId,
        classGraphNodes,
        classGraphEdges
      );
      if (!structuredClass) return;

      const sentence = buildCompositionalSentence(structuredClass);
      sentences.push(sentence);
    });
  }

  return { sentences, boxes };
}
