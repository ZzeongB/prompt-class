import {
  OBJ_COLOR,
  ATTR_COLOR,
  REL_COLOR,
  WHITE,
  OBJ_COLOR_TRANS_DARK,
  ATTR_COLOR_TRANS_DARK,
  REL_COLOR_TRANS_DARK,
} from "../constants";

// styleUtils.js
export function getInstanceNodeStyle(type, options = {}) {
  const base = {
    // border: "2px solid",
    // borderColor: BORDER_COLOR,
    borderRadius: 8,
    padding: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: WHITE,
  };

  if (type === "object-group") {
    return { ...base, background: OBJ_COLOR_TRANS_DARK };
  }
  if (type === "attribute") {
    return {
      ...base,
      background: options.hasValue ? ATTR_COLOR_TRANS_DARK : WHITE,
      border: options.hasValue ? "0px solid" : "3px dashed",
      // borderColor: options.hasValue ? null : ATTR_COLOR,
      fontStyle: options.hasValue ? "normal" : "italic",
    };
  }

  if (type === "object") {
    return { ...base, background: OBJ_COLOR_TRANS_DARK };
  }

  if (type === "relationship") {
    return { ...base, background: REL_COLOR_TRANS_DARK };
  }

  if (type === "relationship-layout") {
    return {
      ...base,
      background:
        "repeating-linear-gradient(135deg, #CFF4D2, #CFF4D2 4px, #B2EECB 4px, #B2EECB 8px)",
      borderColor: REL_COLOR,
    };
  }

  return base;
}

export function getClassNodeStyle(type, options = {}) {
  const base = {
    border: "3px solid",
    borderRadius: 4,
    padding: 5,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: WHITE,
    fontSize: 15,
  };

  if (type === "attribute") {
    return {
      ...base,
      borderColor: ATTR_COLOR,
      border: options.hasValue ? "3px solid" : "3px dashed",
      fontStyle: options.hasValue ? "normal" : "italic",
    };
  }

  if (type === "object") {
    return { ...base, borderColor: OBJ_COLOR };
  }

  if (type === "relationship") {
    return { ...base, borderColor: REL_COLOR };
  }

  return base;
}

export function getPosition(
  type,
  classIndex,
  objectIndex = 0,
  attrIndex = 0,
  targetIndex = 0,
  height = 0
) {
  const classGapX = 300;
  const objectGapY = 80;
  const attrGapY = 30;

  const classX = classIndex * classGapX;
  const objectBaseY = objectIndex * objectGapY;

  switch (type) {
    case "class":
      return {
        x: classX,
        y: height / 2 - 90,
      };
    case "object":
      return {
        x: classX - 50,
        y: objectBaseY,
      };
    case "attribute":
      return {
        x: classX + 50,
        y: objectBaseY + attrIndex * attrGapY,
      };
    case "relationship": {
      const sourceY = objectIndex * objectGapY;
      const targetY = targetIndex * objectGapY;
      const centerY = (sourceY + targetY) / 2;

      return {
        x: classX,
        y: centerY,
      };
    }
    default:
      return { x: 0, y: 0 };
  }
}

// 두 노드의 중간 위치 계산
export function getMidPosition(nodeA, nodeB) {
  return {
    x: (nodeA.position.x + nodeB.position.x) / 2,
    y: (nodeA.position.y + nodeB.position.y) / 2,
  };
}
