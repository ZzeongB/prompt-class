import React, { useState } from "react";
import {
  OBJ_COLOR,
  ATTR_COLOR,
  REL_COLOR,
  WHITE,
  OBJ_COLOR_TRANS_DARK,
  ATTR_COLOR_TRANS_DARK,
  REL_COLOR_TRANS_DARK,
} from "../utils/constants"; // ✅ 네가 쓰고 있는 상수들 그대로 사용

export default function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);

  const type = node.data?.type ?? node.type;
  const hasValue = node.data?.hasValue ?? false;

  const base = {
    borderRadius: 8,
    padding: "6px 10px",
    fontWeight: "bold",
    fontSize: "14px",
    minWidth: "100px",
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "1px 1px 3px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
  };

  let style = { ...base, background: WHITE };

  if (type === "instance-group" || type === "object-group") {
    style = {
      ...base,
      background: OBJ_COLOR_TRANS_DARK,
      border: `1.5px solid ${OBJ_COLOR}`,
    };
  }
  if (type === "object") {
    style = {
      ...base,
      background: OBJ_COLOR_TRANS_DARK,
      border: `1.5px solid ${OBJ_COLOR}`,
    };
  }
  if (type === "attribute") {
    style = {
      ...base,
      background: hasValue ? ATTR_COLOR_TRANS_DARK : WHITE,
      border: hasValue
        ? `1.5px solid ${ATTR_COLOR}`
        : `2px dashed ${ATTR_COLOR}`,
      fontStyle: hasValue ? "normal" : "italic",
    };
  }
  if (type === "relationship") {
    style = {
      ...base,
      background: REL_COLOR_TRANS_DARK,
      border: `1.5px solid ${REL_COLOR}`,
    };
  }
  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <div style={{ marginLeft: 20, marginTop: 5 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {hasChildren && (
          <div
            onClick={() => setExpanded(!expanded)}
            style={{
              width: 20,
              height: 20,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            {expanded ? "▼" : "▶"}
          </div>
        )}
        <div
          style={{ ...style, marginLeft: hasChildren ? 0 : 20 }}
        >
          {node.data?.type == "attribute"
            ? node.data?.hasValue
            : node.data?.label}
        </div>
      </div>

      {expanded && hasChildren &&
        node.children.map((child) => <TreeNode key={child.id} node={child} />)}
    </div>
  );
}
