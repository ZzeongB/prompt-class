import React, { useState, useEffect } from "react";
import {
  OBJ_COLOR,
  WHITE,
  OBJ_COLOR_TRANS,
  OBJ_COLOR_TRANS_DARK,
  ATTR_COLOR_TRANS_DARK,
  REL_COLOR_TRANS_DARK,
} from "../utils/constants";

// TreeNode 컴포넌트 (모던 버전)
export default function TreeNode({
  node,
  depth = 0,
  onLabelChange,
  highlight = null,
  isBaseline = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [label, setLabel] = useState(node.data?.label ?? "");

  const handleLabelEdit = () => {
    if (!isBaseline) {
      setIsEditing(true);
    }
  };

  const handleLabelSave = () => {
    setIsEditing(false);
    if (label !== node.data?.label) {
      onLabelChange?.(node.id, label);
    }
  };

  const handleLabelCancel = () => {
    setIsEditing(false);
    setLabel(node.data?.label ?? "");
  };

  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  const INDENT = 14;
  const BOX_HEIGHT = 18;
  const LINE_WIDTH = 1;

  const type = node.data?.type ?? node.type;

  // 타입별 스타일 정의
  const getTypeStyle = (nodeType) => {
    const baseStyle = {
      borderRadius: "4px",
      padding: "2px 6px",
      fontSize: "10px",
      height: BOX_HEIGHT,
      minWidth: "20px",
      maxWidth: "80px",
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "all 0.15s ease",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      width: "fit-content",
      cursor: isBaseline ? "default" : "text",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontWeight: "500",
      border: "1px solid transparent",
      position: "relative",
      zIndex: 100, // 연결선보다 위에!
    };

    switch (nodeType) {
      case "object":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
          color: "#7f1d1d",
          border: "1px solid #fca5a5",
        };
      case "attribute":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#bfdbfe" : "#dbeafe",
          color: "#1e40af",
          border: "1px solid #93c5fd",
        };
      case "relationship":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#bbf7d0" : "#dcfce7",
          color: "#15803d",
          border: "1px solid #86efac",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#f3f4f6" : "#ffffff",
          color: "#374151",
          border: "1px solid #d1d5db",
        };
    }
  };

  const boxStyle = getTypeStyle(type);

  return (
    <div style={{ position: "relative", marginTop: 3, marginLeft: depth === 0 ? 0 : INDENT }}>
      <div
        style={boxStyle}
        onDoubleClick={handleLabelEdit}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isEditing ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLabelSave();
              } else if (e.key === "Escape") {
                handleLabelCancel();
              }
            }}
            autoFocus
            style={{
              fontSize: "10px",
              padding: "1px 3px",
              border: "1px solid #3b82f6",
              borderRadius: "4px",
              backgroundColor: "#ffffff",
              color: "#1f2937",
              outline: "none",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: "500",
              maxWidth: "100%",
              minWidth: "30px",
              width: `${Math.max(4, label.length + 1)}ch`,
              boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
              textAlign: "center",
            }}
          />
        ) : (
          label
        )}
      </div>

      {hasChildren && (
        <div>
          {children.map((child, index) => (
            <div key={child.id} style={{ position: "relative" }}>
              {/* 수직선 */}
              <div
                style={{
                  position: "absolute",
                  top: -BOX_HEIGHT / 2,
                  left: 7,
                  width: "1px",
                  height: BOX_HEIGHT + 1,
                  backgroundColor: "#9ca3af",
                }}
              />
              {/* 수평선 */}
              <div
                style={{
                  position: "absolute",
                  top: BOX_HEIGHT / 2,
                  left: 7,
                  width: INDENT - 7,
                  height: "1px",
                  backgroundColor: "#9ca3af",
                }}
              />
              
              <TreeNode
                node={child}
                depth={depth + 1}
                onLabelChange={onLabelChange}
                highlight={highlight}
                isBaseline={isBaseline}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}