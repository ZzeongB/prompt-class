import { getNormalizedBox } from "../node/getNormalizedBox";
import { buildGroup } from "../group/buildGroup"; // 분리된 유틸 import

export function getConnectedAttributes(groupNode, instanceEdges, instanceNodes) {
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

function getConnectedRelationships(objNodeId, instanceEdges, instanceNodes) {
  return instanceEdges
    .filter((edge) => edge.source === objNodeId)
    .map((edge) => instanceNodes.find((node) => node.id === edge.target))
    .filter((node) => node?.data?.type === "relationship");
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

function applyEditedLabels(structuredClass, instanceId, editedLabelMap) {
  const edited = editedLabelMap?.[instanceId] ?? {};

  // group label
  if (edited[structuredClass.id]) {
    structuredClass.class = edited[structuredClass.id];
  }

  structuredClass.attributes?.forEach((attr) => {
    if (!attr.value && edited[attr.id]) {
      attr.value = edited[attr.id];
    }
    if (edited[attr.id]) {
      attr.value = edited[attr.id];
    }
  });

  structuredClass.objects?.forEach((obj) => {
    if (edited[obj.id]) {
      obj.label = edited[obj.id];
    }

    obj.attributes?.forEach((attr) => {
      if (!attr.value && edited[attr.id]) {
        attr.value = edited[attr.id];
      }
      if (edited[attr.id]) {
        attr.value = edited[attr.id];
      }
    });
  });
}

export function processEmptyNodes(
  emptyNodes,
  emptyResizableNodes,
  flowToScreenPosition,
  offset_left,
  offset_top
) {
  const sentences = [];
  const boxes = [];
  const labels = [];

  emptyNodes.forEach((emptyNode) => {
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
    sentences.push("no objects, only background");
    boxes.push(box);
    labels.push("empty");
  });

  return { sentences, boxes, labels };
}

export function processObjectNodes(
  objectNodes,
  resizableNodes,
  instanceEdges,
  instanceNodes,
  classGraphEdges,
  classGraphNodes,
  flowToScreenPosition,
  offset_left,
  offset_top,
  filledAttrMap,
  editedLabelMap
) {
  const sentences = [];
  const boxes = [];
  const labels = [];

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
    structuredClass.attributes.push(...groupAttributes);
    structuredClass.attributes.push(...groupAttributes_);

    const instanceId = objNode.id;
    if (filledAttrMap[instanceId]) {
      structuredClass.attributes.forEach((attr) => {
        if (!attr.value)
          attr.value = filledAttrMap[instanceId][attr.id] || null;
      });
      structuredClass.objects?.forEach((obj) => {
        obj.attributes?.forEach((attr) => {
          if (!attr.value)
            attr.value = filledAttrMap[instanceId][attr.id] || null;
        });
      });
    }

    if (!structuredClass) return;

    applyEditedLabels(structuredClass, instanceId, editedLabelMap);

    const connectedRelationships = getConnectedRelationships(
      objNode.id,
      instanceEdges,
      instanceNodes
    );
    const instanceRelations = connectedRelationships.map((relNode) => ({
      source: objNode.data.label,
      target: instanceNodes.find((n) => n.id === relNode.data.target)?.data
        ?.label,
      relation: relNode.data.label,
    }));
    const relationshipSentences = instanceRelations.map(
      (rel) => `${rel.source} is ${rel.relation} ${rel.target}`
    );
    const sentence = buildCompositionalSentence(structuredClass);
    sentences.push([sentence, ...relationshipSentences].join(". "));

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
    const cleanLabel = rawLabel.replace(/\s*\d+$/, "");
    labels.push(cleanLabel || "");
  });

  return { sentences, boxes, labels };
}

export function processFallbackNodes(
  baselineNodes,
  resizableNodes,
  instanceEdges,
  instanceNodes,
  classGraphEdges,
  classGraphNodes,
  flowToScreenPosition,
  offset_left,
  offset_top
) {
  const sentences = [];
  const boxes = [];
  const labels = [];

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
    structuredClass.attributes.push(...groupAttributes);

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

  return { sentences, boxes, labels };
}
