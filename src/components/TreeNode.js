import React, { useState } from "react";
import {
  OBJ_COLOR,
  ATTR_COLOR,
  REL_COLOR,
  WHITE,
  OBJ_COLOR_TRANS,
  OBJ_COLOR_TRANS_DARK,
  ATTR_COLOR_TRANS_DARK,
  REL_COLOR_TRANS_DARK,
} from "../utils/constants";

export default function TreeNode({ node }) {
  const [expanded, setExpanded] = useState(true);

  const type =
    node.type === "instance-group" || node.type === "object-group"
      ? node.type
      : node.data?.type ?? node.type;
  const hasValue = node.data?.hasValue ?? false;

  const base = {
    borderRadius: 8,
    padding: "6px 10px",
    fontWeight: "bold",
    fontSize: "14px",
    minWidth: "50px",
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
      background: OBJ_COLOR_TRANS,
      border: `3px solid ${OBJ_COLOR}`,
    };
  }
  if (type === "object") {
    style = {
      ...base,
      background: OBJ_COLOR_TRANS_DARK,
    };
  }
  if (type === "attribute") {
    style = {
      ...base,
      background: hasValue ? ATTR_COLOR_TRANS_DARK : WHITE,
      fontStyle: hasValue ? "normal" : "italic",
    };
  }
  if (type === "relationship") {
    style = {
      ...base,
      background: REL_COLOR_TRANS_DARK,
    };
  }

  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <div style={{ marginTop: 15 }}>
      {/* 그룹 아닐 때 */}
      {!(type === "instance-group" || type === "object-group") && (
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
          <div style={{ ...style, marginLeft: hasChildren ? 0 : 20 }}>
            {type === "attribute" ? node.data?.hasValue : node.data?.label}
          </div>
        </div>
      )}

      {/* 그룹일 때 */}
      {(type === "instance-group" || type === "object-group") && (
        <div
          style={{
            // border: `2px solid ${OBJ_COLOR}`,
            borderRadius: 10,
            padding: 10,
            background: OBJ_COLOR_TRANS,
            boxShadow: "1px 1px 5px rgba(0,0,0,0.1)",
            marginLeft: 10,
            marginRight: 10,
            marginTop: 5,
            flexGrow: 1,
          }}
        >
          {/* 라벨 + 토글 한줄에 */}
          <div
            style={{
              // ...base,
              // background: OBJ_COLOR_TRANS_DARK,
              marginBottom: 10,
              display: "flex",
              fontWeight: "bold",
              fontSize: "14px",
              // justifyContent: "space-between",
            }}
          >
            <div>{node.data?.label}</div>
            {hasChildren && (
              <div
                onClick={() => setExpanded(!expanded)}
                style={{
                  marginLeft: 10,
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
          </div>

          {/* children */}
          {expanded && hasChildren && (
            <div style={{ marginLeft: 10 }}>
              {children.map((child) => (
                <TreeNode key={child.id} node={child} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 일반 노드 children */}
      {expanded &&
        hasChildren &&
        !(type === "instance-group" || type === "object-group") && (
          <div style={{ marginLeft: 30 }}>
            {children.map((child) => (
              <TreeNode key={child.id} node={child} />
            ))}
          </div>
        )}
    </div>
  );
}
