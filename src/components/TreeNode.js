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
import { ChevronRight, ChevronDown, MoveDiagonal } from "lucide-react";
import { logEvent } from "../api/logEvent";

export default function TreeNode({
  node,
  depth = 0,
  onLabelChange,
  highlight = null,
  setHighlight = null,
}) {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(node.data?.label ?? "");

  const handleLabelSave = () => {
    setIsEditing(false);
    if (label !== node.data?.label) {
      onLabelChange?.(node.id, label); // ✅ 외부 전달
    }
  };

  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  const INDENT = 20;
  const NODE_WIDTH = 70;
  const BOX_HEIGHT = 10;
  const LINE_WIDTH = 2;

  const type =
    node.type === "instance-group" || node.type === "class-group"
      ? node.type
      : node.data?.type ?? node.type;
  const hasValue = node.data?.hasValue ?? false;

  const MAX_NODE_WIDTH = 300; // 최대 폭 제한

  const baseBoxStyle = {
    borderRadius: 4,
    padding: "6px 10px",
    // fontWeight: "bold",
    fontSize: "15px",
    height: BOX_HEIGHT,
    maxWidth: MAX_NODE_WIDTH,
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "1px 1px 3px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "fit-content", // ✅ 바로 핵심
  };

  let boxStyle = { ...baseBoxStyle, background: WHITE };

  if (type === "instance-group" || type === "class-group") {
    boxStyle = {
      ...baseBoxStyle,
      background: OBJ_COLOR_TRANS,
      border: `3px solid ${OBJ_COLOR}`,
    };
  }
  if (type === "object") {
    boxStyle = {
      ...baseBoxStyle,
      background: OBJ_COLOR_TRANS_DARK,
    };
  }
  if (type === "attribute") {
    boxStyle = {
      ...baseBoxStyle,
      background: hasValue ? ATTR_COLOR_TRANS_DARK : WHITE,
      fontStyle: hasValue ? "normal" : "italic",
    };
  }
  if (type === "relationship") {
    boxStyle = {
      ...baseBoxStyle,
      background: REL_COLOR_TRANS_DARK,
    };
  }

  console.log("Highlight", highlight, node.data);

  if (node.data.instanceId === highlight) {
    console.log("Highlight!!");
    boxStyle = {
      ...boxStyle,
      outline: "2px solid #007bff",
      outlineOffset: "2px",
      fontWeight: "bold",
      backgroundColor: "#e6f0ff", // 약간 파란 배경 (선택사항)
    };
  }

  // 그룹 노드 렌더링 (margin 제거)
  if (type === "instance-group" || type === "class-group") {
    return (
      <div style={{ marginTop: 10, marginLeft: depth * INDENT }}>
        <div
          style={{
            padding: 10,
            borderRadius: 10,
            background: OBJ_COLOR_TRANS,
            boxShadow: "1px 1px 5px rgba(0,0,0,0.1)",
            position: "relative",
            border: "none",
            boxShadow:
              node.data.instanceId === highlight
                ? "0 0 10px 4px rgba(0, 0, 0, 0.3)" // ✅ blur=10, spread=4
                : "1px 1px 5px rgba(0, 0, 0, 0.1)",
            transition: "box-shadow 0.2s ease",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 10 }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                cursor: "pointer",
              }}
              onDoubleClick={() => setIsEditing(true)}
            >
              {isEditing ? (
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onBlur={handleLabelSave}
                  onKeyDown={(e) => e.key === "Enter" && handleLabelSave()}
                  autoFocus
                  style={{
                    fontSize: "13px",
                    padding: "4px 6px",
                    border: "1px solid transparent",
                    borderRadius: "4px",
                    backgroundColor: "transparent",
                    color: "#333",
                    outline: "none",
                    maxWidth: "100%",
                    minWidth: "60px",
                    width: `${Math.max(8, label.length)}ch`, // ✅ label 길이에 따라 너비 조절
                  }}
                />
              ) : (
                label
              )}
            </div>

            {hasChildren && (
              <div
                onClick={() => {
                  setExpanded(!expanded);
                  logEvent("instanceboard.node.toggle_collapsed", {
                    nodeId: node.id,
                    label: node.data?.label,
                    expanded: !expanded,
                  });
                }}
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
                {!expanded ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>
            )}
          </div>

          {expanded && hasChildren && (
            <div>
              {children.map((child) => (
                <TreeNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  onLabelChange={onLabelChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 일반 노드 렌더링 (연결선 포함)
  return (
    <div style={{ position: "relative", marginTop: 10, marginLeft: INDENT }}>
      <div style={boxStyle} onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={(e) => e.key === "Enter" && handleLabelSave()}
            autoFocus
            style={{
              fontSize: "13px",
              padding: "4px 6px",
              border: "1px solid transparent",
              borderRadius: "4px",
              backgroundColor: "transparent",
              color: "#333",
              outline: "none",
              maxWidth: "100%",
              minWidth: "60px",
              width: `${Math.max(8, label.length)}ch`, // ✅ label 길이에 따라 너비 조절
            }}
          />
        ) : type === "attribute" ? (
          node.data?.hasValue
        ) : (
          label
        )}
      </div>

      {hasChildren && (
        <div>
          {children.map((child) => (
            <div key={child.id} style={{ position: "relative" }}>
              {/* 수직선 */}
              <div
                style={{
                  position: "absolute",
                  top: -BOX_HEIGHT,
                  left: 10,
                  width: LINE_WIDTH,
                  height: BOX_HEIGHT * 2 + 1,
                  background: "#999",
                  // zIndex: 0,
                }}
              />
              {/* 수평선 */}
              <div
                style={{
                  position: "absolute",
                  top: BOX_HEIGHT,
                  left: 10,
                  width: INDENT - 10,
                  height: LINE_WIDTH,
                  background: "#999",
                }}
              />
              <TreeNode
                node={child}
                depth={depth}
                onLabelChange={onLabelChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
