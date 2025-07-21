import {processEmptyNodes, processObjectNodes, processFallbackNodes} from "./extractorHelpers"

export function extractSentencesAndBoxes(
  instanceNodes,
  instanceEdges,
  classGraphNodes,
  classGraphEdges,
  flowToScreenPosition,
  offset_left = 660,
  offset_top = 20,
  filledAttrMap = {},
  editedLabelMap = {}
) {
  const objectNodes = instanceNodes.filter(
    (n) =>
      (n.type === "instance" || n.type === "instance-group") &&
      (n.data.type === "object" || n.data.type === "class-group")
  );

  const resizableNodes = instanceNodes.filter(
    (n) =>
      n.type === "resizable" &&
      (n.data.type === "object" || n.data.type === "class-group")
  );

  const emptyNodes = instanceNodes.filter(
    (n) => n.type === "instance" && n.data.type === "empty"
  );

  const emptyResizableNodes = instanceNodes.filter(
    (n) => n.type === "tmpResizable" && n.data.type === "empty"
  );

  const allSentences = [];
  const allBoxes = [];
  const allLabels = [];

  if (emptyNodes.length > 0) {
    const { sentences, boxes, labels } = processEmptyNodes(
      emptyNodes,
      emptyResizableNodes,
      flowToScreenPosition,
      offset_left,
      offset_top
    );
    allSentences.push(...sentences);
    allBoxes.push(...boxes);
    allLabels.push(...labels);
  }

  if (objectNodes.length > 0) {
    const { sentences, boxes, labels } = processObjectNodes(
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
    );
    allSentences.push(...sentences);
    allBoxes.push(...boxes);
    allLabels.push(...labels);
  } else {
    const baselineNodes = instanceNodes.filter(
      (n) => n.type === "instance" && n.data?.classId
    );
    const { sentences, boxes, labels } = processFallbackNodes(
      baselineNodes,
      resizableNodes,
      instanceEdges,
      instanceNodes,
      classGraphEdges,
      classGraphNodes,
      flowToScreenPosition,
      offset_left,
      offset_top
    );
    allSentences.push(...sentences);
    allBoxes.push(...boxes);
    allLabels.push(...labels);
  }

  return { sentences: allSentences, boxes: allBoxes, labels: allLabels };
}
