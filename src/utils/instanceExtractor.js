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
  return `Illustration of ${classLabel}: ${fullContent}`;
}


export function extractSentencesAndBoxes(
  instanceNodes,
  instanceEdges,
  classGraph,
  flowToScreenPosition
) {
  const objectNodes = instanceNodes.filter(
    (n) => n.type === "instance" && n.data.type === "object"
  );
  const resizableNodes = instanceNodes.filter(
    (n) => n.type === "resizable" && n.data.type === "object"
  );

  const sentences = [];
  const boxes = [];

  objectNodes.forEach((objNode) => {

    const classId = objNode.data.classId; // e.g., "class__두더지"
    const classEntry = classGraph.find((c) => `class-${c.class}` === classId);
    console.log("classEntry", classEntry);
    if (!classEntry) return;
    const sentence = buildCompositionalSentence(classEntry);
    sentences.push(sentence);

    // 3. 박스 추출
    const resizableNode = resizableNodes.find(
      (n) => n.id.split("-resizable")[0] === objNode.id
    );

    const box = getNormalizedBox(
      resizableNode,
      flowToScreenPosition,
      500,
      0,
      true
    );
    boxes.push(box);
  });

  return { sentences, boxes };
}
