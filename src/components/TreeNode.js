import React, { useState, useEffect } from "react";
import {
  OBJ_COLOR,
  WHITE,
  OBJ_COLOR_TRANS,
  OBJ_COLOR_TRANS_DARK,
  ATTR_COLOR_TRANS_DARK,
  REL_COLOR_TRANS_DARK,
} from "../utils/constants";

// TreeNode 컴포넌트 (플레이스홀더 지원 버전)
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
  const isPlaceholder = node.data?.isPlaceholder || false;
  const defaultValue = node.data?.defaultValue;

  // 타입별 스타일 정의 (플레이스홀더 지원)
  const getTypeStyle = (nodeType, isPlaceholder) => {
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
      position: "relative",
      zIndex: 100,
    };

    if (isPlaceholder) {
      // 플레이스홀더는 투명 배경에 점선 테두리
      switch (nodeType) {
        case "object":
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            color: "#7f1d1d",
            border: "2px dashed #fca5a5",
            fontStyle: "italic",
          };
        case "attribute":
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            color: "#1e40af",
            border: "2px dashed #93c5fd",
            fontStyle: "italic",
          };
        case "relationship":
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            color: "#15803d",
            border: "2px dashed #86efac",
            fontStyle: "italic",
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            color: "#6b7280",
            border: "2px dashed #d1d5db",
            fontStyle: "italic",
          };
      }
    }

    // 일반 노드 스타일
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

  const boxStyle = getTypeStyle(type, isPlaceholder);

  // 표시할 텍스트 결정
  const displayText = isPlaceholder && defaultValue ? `${label} : ${defaultValue}` : label;

  return (
    <div style={{ position: "relative", marginTop: 3, marginLeft: depth === 0 ? 0 : INDENT }}>
      <div
        style={boxStyle}
        onDoubleClick={handleLabelEdit}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={isPlaceholder ? `Placeholder for: ${defaultValue}` : undefined}
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
          <span style={{ 
            fontSize: isPlaceholder ? "9px" : "10px",
            opacity: isPlaceholder ? 0.8 : 1 
          }}>
            {displayText}
          </span>
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