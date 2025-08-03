export const calculateIOU = (box1, box2) => {
  const [x1_1, y1_1, x2_1, y2_1] = box1;
  const [x1_2, y1_2, x2_2, y2_2] = box2;

  const x1_inter = Math.max(x1_1, x1_2);
  const y1_inter = Math.max(y1_1, y1_2);
  const x2_inter = Math.min(x2_1, x2_2);
  const y2_inter = Math.min(y2_1, y2_2);

  if (x2_inter <= x1_inter || y2_inter <= y1_inter) {
    return 0;
  }

  const intersectionArea = (x2_inter - x1_inter) * (y2_inter - y1_inter);
  const area1 = (x2_1 - x1_1) * (y2_1 - y1_1);
  const area2 = (x2_2 - x1_2) * (y2_2 - y1_2);
  const unionArea = area1 + area2 - intersectionArea;

  return intersectionArea / unionArea;
};

export const scaleDetectedObjectBbox = (bbox, scaleFactor = 1) => [
  bbox[0] * scaleFactor,
  bbox[1] * scaleFactor,
  bbox[2] * scaleFactor,
  bbox[3] * scaleFactor,
];

export const calculateBboxDimensions = (bbox) => {
  const width = bbox[2] - bbox[0];
  const height = bbox[3] - bbox[1];
  return { width, height };
};

export const getLayoutBoxesFromNodes = (nodes, flowToScreenPosition, leftOffset, topOffset) => {
  return nodes
    .filter((n) => n.type === "resizable")
    .map((n) => {
      const screenPos = flowToScreenPosition(n.position);
      const x1 = screenPos.x - leftOffset;
      const y1 = screenPos.y - topOffset;
      const x2 = x1 + (n.width || n.style?.width || 50);
      const y2 = y1 + (n.height || n.style?.height || 50);
      return [x1, y1, x2, y2];
    });
};

export const filterOverlappingObjects = (detectedObjects, nodes, flowToScreenPosition, leftOffset, topOffset, threshold = 0.3) => {
  const layoutBoxes = getLayoutBoxesFromNodes(nodes, flowToScreenPosition, leftOffset, topOffset);
  
  return detectedObjects.filter((obj) => {
    const scaledBbox = scaleDetectedObjectBbox(obj.bbox);
    const hasHighOverlap = layoutBoxes.some((layoutBox) => {
      const iou = calculateIOU(scaledBbox, layoutBox);
      return iou > threshold;
    });
    return !hasHighOverlap;
  });
};