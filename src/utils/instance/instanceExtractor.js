import { getNormalizedBox } from "../node/getNormalizedBox";
import { buildGroup } from "../group/buildGroup"; // 분리된 유틸 import

function getConnectedAttributes(groupNode, instanceEdges, instanceNodes) {
  return instanceEdges
    .filter((e) =>
      groupNode.id ? e.source === groupNode.id : e.source === groupNode
    )
    .map((e) => instanceNodes.find((n) => n.id === e.target))
    .filter((n) => n?.data?.type === "attribute")
    .map((n) => ({
      name: n.data.label,
      value: n.data.hasValue,
    }));
}

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
  const relationSentences = (classEntry.relations || []).map((rel) => {
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
  flowToScreenPosition,
  offset_left = 660,
  offset_top = 20,
  filledAttrMap = {}
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

  const emptyNodes = instanceNodes.filter(
    (n) => n.type === "instance" && n.data.type === "empty"
  );

  const emptyResizableNodes = instanceNodes.filter(
    (n) => n.type === "tmpResizable" && n.data.type === "empty"
  );

  const sentences = [];
  const boxes = [];
  const labels = [];

  if (emptyNodes.length > 0) {
    // 빈 노드가 있는 경우
    emptyNodes.forEach((emptyNode) => {
      sentences.push("no objects, only background");

      const resizableNode = emptyResizableNodes.find(
        (n) => n.data.sharedId === emptyNode.data.sharedId
      );

      if (!resizableNode) return;

      const box = getNormalizedBox(
        resizableNode,
        flowToScreenPosition,
        offset_left,
        offset_top,
        true
      );
      boxes.push(box);

      labels.push("empty");
    });
  }
  if (objectNodes.length > 0) {
    objectNodes.forEach((objNode) => {
      const groupId = objNode.data.classId;
      const groupAttributes = getConnectedAttributes(
        objNode,
        instanceEdges,
        instanceNodes
      );
      const groupAttributes_ = getConnectedAttributes(
        groupId,
        classGraphEdges,
        classGraphNodes
      );

      const structuredClass = buildGroup(
        groupId,
        classGraphNodes,
        classGraphEdges
      );

      structuredClass.attributes.push(...groupAttributes); // ✅ 주입
      structuredClass.attributes.push(...groupAttributes_); // ✅ 주입

      // filledAttrMap에서 해당 instanceId의 빈 attributeId를 받아와서 값을 주입
      // --- 여기 수정 ---
      const instanceId = objNode.id;
      if (filledAttrMap[instanceId]) {
        structuredClass.attributes.forEach((attr) => {
          if (!attr.value) {
            attr.value = filledAttrMap[instanceId][attr.id] || null;
          }
        });

        structuredClass.objects?.forEach((obj) => {
          obj.attributes?.forEach((attr) => {
            if (!attr.value) {
              attr.value = filledAttrMap[instanceId][attr.id] || null;
            }
          });
        });
      }

      if (!structuredClass) return;

      const sentence = buildCompositionalSentence(structuredClass);
      sentences.push(sentence);

      const resizableNode = resizableNodes.find(
        (n) => n.id.replace(/-resizable/g, "") === objNode.id
      );

      const box = getNormalizedBox(
        resizableNode,
        flowToScreenPosition,
        offset_left,
        offset_top,
        true
      );
      boxes.push(box);

      const rawLabel = objNode.data.label ?? "";
      const cleanLabel = rawLabel.replace(/\s*\d+$/, ""); // ✅ 숫자 제거
      labels.push(cleanLabel || "");
    });
  } else {
    const baselineNodes = instanceNodes.filter(
      (n) => n.type === "instance" && n.data?.classId
    );

    baselineNodes.forEach((node) => {
      const groupId = node.data.classId;
      const groupAttributes = getConnectedAttributes(
        node,
        instanceEdges,
        instanceNodes
      );

      const structuredClass = buildGroup(
        groupId,
        classGraphNodes,
        classGraphEdges
      );

      structuredClass.attributes.push(...groupAttributes); // ✅ 주입

      if (!structuredClass) return;

      const sentence = buildCompositionalSentence(structuredClass);
      sentences.push(sentence);

      const resizableNode = resizableNodes.find(
        (n) => n.id.replace(/-resizable/g, "") === node.id
      );

      const box = getNormalizedBox(
        resizableNode,
        flowToScreenPosition,
        offset_left,
        offset_top,
        true
      );
      boxes.push(box);
      labels.push("");
    });
  }

  return { sentences, boxes, labels };
}
