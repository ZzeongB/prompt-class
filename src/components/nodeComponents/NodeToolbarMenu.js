import React, { forwardRef } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import {
  Edit2,
  Check,
  Copy,
  Trash2,
  Repeat,
  Network,
  Layers,
} from "lucide-react";

import { useState } from "react";

// 스타일이 적용된 버튼 컴포넌트
export const ToolbarButton = ({
  title,
  icon,
  onClick,
  backgroundColor = "rgba(107, 114, 128, 0.1)",
  hoverColor = "rgba(107, 114, 128, 0.2)",
  danger = false,
}) => {
  const [hovered, setHovered] = useState(false);

  const buttonStyle = {
    backgroundColor: danger ? "rgba(239, 68, 68, 0.1)" : backgroundColor,
    color: danger ? "#ef4444" : "#6b7280",
    padding: "4px",
    borderRadius: "6px",
    border: "1px solid rgba(107, 114, 128, 0.1)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "24px",
    minHeight: "24px",
    position: "relative",
  };

  const tooltipStyle = {
    position: "absolute",
    bottom: "110%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "9px",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    opacity: hovered && title ? 1 : 0,
    transition: "opacity 0.2s ease",
    zIndex: 1000,
    fontWeight: "500",
    // 화살표 효과를 위한 pseudo-element 대신 border 사용
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  };

  // 화살표를 위한 별도 div
  const arrowStyle = {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "4px solid transparent",
    borderRight: "4px solid transparent",
    borderTop: "4px solid rgba(0, 0, 0, 0.85)",
    opacity: hovered && title ? 1 : 0,
    transition: "opacity 0.2s ease",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      style={buttonStyle}
      onMouseEnter={(e) => {
        setHovered(true);
        if (danger) {
          e.target.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
          e.target.style.color = "#dc2626";
          e.target.style.borderColor = "rgba(239, 68, 68, 0.2)";
        } else {
          e.target.style.backgroundColor = hoverColor;
          e.target.style.color = "#374151";
          e.target.style.borderColor = "rgba(107, 114, 128, 0.2)";
        }
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        if (danger) {
          e.target.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
          e.target.style.color = "#ef4444";
          e.target.style.borderColor = "rgba(107, 114, 128, 0.1)";
        } else {
          e.target.style.backgroundColor = backgroundColor;
          e.target.style.color = "#6b7280";
          e.target.style.borderColor = "rgba(107, 114, 128, 0.1)";
        }
      }}
    >
      {/* 툴팁 */}
      {title && (
        <>
          <div style={tooltipStyle}>{title}</div>
        </>
      )}

      {/* 아이콘 */}
      {icon}
    </button>
  );
};

const NodeToolbarMenu = forwardRef((props, ref) => {
  const {
    isVisible,
    isEditing,
    position = Position.Top,
    style = {},
    data,
    onEditToggle,
    onSave = null,
    onConvertBlank = null,
    onDuplicate = null,
    onDelete,
    onConvertFromText = null,
  } = props;

  return (
    <NodeToolbar
      isVisible={isVisible}
      position={position}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        padding: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        borderRadius: "8px",
        boxShadow:
          "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
        ...style,
      }}
      ref={ref}
    >
      {onSave && (
        <ToolbarButton
          title={isEditing ? "Save label" : "Edit label"}
          icon={isEditing ? <Check size={12} /> : <Edit2 size={12} />}
          onClick={isEditing ? onSave : onEditToggle}
          backgroundColor={
            isEditing ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)"
          }
          hoverColor={
            isEditing ? "rgba(16, 185, 129, 0.15)" : "rgba(107, 114, 128, 0.2)"
          }
        />
      )}

      {data?.type === "attribute" && isEditing && (
        <ToolbarButton
          title="Convert to blank attribute"
          icon={<Repeat size={12} />}
          onClick={onConvertBlank}
          // backgroundColor="rgba(245, 158, 11, 0.1)"
          // hoverColor="rgba(245, 158, 11, 0.15)"
        />
      )}

      {onDuplicate && (
        <ToolbarButton
          title="Create Class"
          icon={<Layers size={12} />}
          onClick={onDuplicate}
          backgroundColor={"rgba(107, 114, 128, 0.1)"}
          hoverColor={"rgba(107, 114, 128, 0.2)"}
        />
      )}

      {onConvertFromText && (
        <ToolbarButton
          title="Text to Graph"
          icon={<Network size={12} />}
          onClick={onConvertFromText}
          backgroundColor="rgba(139, 92, 246, 0.1)"
          hoverColor="rgba(139, 92, 246, 0.15)"
        />
      )}

      <ToolbarButton
        title="Delete Instance"
        icon={<Trash2 size={12} />}
        onClick={onDelete}
        danger={true}
      />
    </NodeToolbar>
  );
});

export default NodeToolbarMenu;
