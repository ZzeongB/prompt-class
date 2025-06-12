import { getNormalizedBox } from "../node/getNormalizedBox";
import { buildGroup } from "../group/buildGroup"; // 분리된 유틸 import

function buildCompositionalSentence(classEntry) {
  const objectNameMap = {};

  // ✅ object-level sentence 먼저 준비
  classEntry.objects.forEach((obj) => {
    let nestedSentence = null;

    // nested object인 경우 → 재귀 호출
    if (obj.objects && obj.objects.length > 0) {
      nestedSentence = buildCompositionalSentence({
        class: obj.label,
        attributes: obj.attributes,
        objects: obj.objects,
        relations: obj.relations,
      });
      objectNameMap[obj.label] = nestedSentence;
    } else {
      // leaf object
      const modifiers = (obj.attributes || []).map((attr) => {
        return attr.value ? `${attr.value}` : attr.name;
      });
      const fullName = [...modifiers, obj.label].join(" ");
      objectNameMap[obj.label] = fullName;
    }
  });

  // ✅ relation sentence
  const objectsInRelations = new Set();
  const relationSentences =
    (classEntry.relations || []).map((rel) => {
      const source = objectNameMap[rel.source] || rel.source;
      const target = objectNameMap[rel.target] || rel.target;

      objectsInRelations.add(rel.source);
      objectsInRelations.add(rel.target);

      return `${source} ${rel.name} ${target}`;
    });

  // ✅ standalone objects (관계에 등장하지 않은 object)
  const standaloneObjects = classEntry.objects
    .filter((obj) => !objectsInRelations.has(obj.label))
    .map((obj) => objectNameMap[obj.label]);

  // ✅ group-level attributes → 가장 앞에 modifier로 붙이기
  const groupModifiers = (classEntry.attributes || []).map((attr) => {
    return attr.value ? `${attr.value}` : attr.name;
  });

  const content = [...relationSentences, ...standaloneObjects].join(", ");
  const fullSentence = [...groupModifiers, classEntry.class.toLowerCase()]
    .filter((s) => s && s.length > 0)
    .join(" ");

  return `${fullSentence}: ${content}`;
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
