import React, { useState, useEffect } from "react";
import {
  OBJ_COLOR,
  WHITE,
  OBJ_COLOR_TRANS,
  OBJ_COLOR_TRANS_DARK,
  ATTR_COLOR_TRANS_DARK,
  REL_COLOR_TRANS_DARK,
} from "../utils/constants";

// TreeNode 컴포넌트 (제공된 코드 기반)
export default function TreeNode({
  node,
  depth = 0,
  onLabelChange,
  highlight = null,
  isBaseline = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(
    node.data?.type === "attribute" && node.data?.hasValue
      ? node.data.hasValue
      : node.data?.label ?? ""
  );

  const handleLabelSave = () => {
    setIsEditing(false);
    if (label !== node.data?.label) {
      onLabelChange?.(node.id, label);
    }
  };

  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  const INDENT = 12;
  const BOX_HEIGHT = 20;
  const LINE_WIDTH = 1;

  const type = node.data?.type ?? node.type;
  const hasValue = node.data?.hasValue ?? false;

  const MAX_NODE_WIDTH = 300;

  const baseBoxStyle = {
    borderRadius: 2,
    padding: "1px 3px",
    fontSize: "13px",
    height: BOX_HEIGHT,
    maxWidth: 80,
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "1px 1px 1px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "fit-content",
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

  return (
    <div style={{ position: "relative", marginTop: 4, marginLeft: INDENT }}>
      <div
        style={boxStyle}
        onDoubleClick={() => {
          if (!isBaseline) setIsEditing(true);
        }}
      >
        {isEditing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={(e) => e.key === "Enter" && handleLabelSave()}
            autoFocus
            style={{
              fontSize: "7px",
              padding: "1px 2px",
              border: "1px solid transparent",
              borderRadius: "2px",
              backgroundColor: "transparent",
              color: "#333",
              outline: "none",
              maxWidth: "100%",
              minWidth: "30px",
              width: `${Math.max(4, label.length)}ch`,
            }}
          />
        ) : type === "attribute" ? (
          node.data?.hasValue || label
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
                  top: -BOX_HEIGHT / 2,
                  left: 8,
                  width: LINE_WIDTH,
                  height: BOX_HEIGHT + 1,
                  background: "#999",
                }}
              />
              {/* 수평선 */}
              <div
                style={{
                  position: "absolute",
                  top: BOX_HEIGHT / 2,
                  left: 8,
                  width: INDENT - 8,
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
