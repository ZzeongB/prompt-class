import { OBJ_COLOR, ATTR_COLOR, REL_COLOR, BORDER_COLOR, EDGE_COLOR, BACKGROUND_COLOR } from "../constants";

// styleUtils.js
export function getClassNodeStyle(type, options = {}) {
  const base = {
    border: "2px solid",
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    padding: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  if (type === "attribute") {
    return {
      ...base,
      background: ATTR_COLOR,
      border: options.hasValue ? "2px solid" : "2px dashed",
      fontStyle: options.hasValue ? "normal" : "italic",
    };
  }

  if (type === "object") {
    return { ...base, background: OBJ_COLOR };
  }

  if (type === "relation") {
    return { ...base, background: REL_COLOR };
  }

  return base;
}

export function getInstanceNodeStyle(type, options = {}) {
  const base = {
    border: "2px solid",
    borderRadius: 4,
    padding: 5,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: BACKGROUND_COLOR,
    fontSize: 12,
  };

  if (type === "attribute") {
    return {
      ...base,
      borderColor: ATTR_COLOR,
      border: options.hasValue ? "2px solid" : "2px dashed",
      fontStyle: options.hasValue ? "normal" : "italic",
    };
  }

  if (type === "object") {
    return { ...base, borderColor: OBJ_COLOR };
  }

  if (type === "relation") {
    return { ...base, borderColor: REL_COLOR };
  }

  return base;
}

export function getPosition(type, classIndex, index = 0) {
  const baseX = classIndex * 200; // 클래스 간 좌우 간격
  const baseY = 50;

  switch (type) {
    case "object":
      return { x: baseX, y: baseY };
    case "attribute":
      return { x: baseX + 100, y: baseY + index * 50 };
    case "value":
      return { x: baseX + 200, y: baseY + index * 50 };
    case "relation":
      return { x: baseX + 50, y: baseY + 150 + index * 40 };
    default:
      return { x: baseX, y: baseY };
  }
}

// 두 노드의 중간 위치 계산
export function getMidPosition(nodeA, nodeB) {
    return {
      x: (nodeA.position.x + nodeB.position.x) / 2,
      y: (nodeA.position.y + nodeB.position.y) / 2,
    };
  }