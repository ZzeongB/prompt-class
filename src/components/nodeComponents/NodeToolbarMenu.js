import React, { forwardRef } from "react";
import { NodeToolbar, Position } from "@xyflow/react";
import { Edit2, Check, Copy, Trash2, Repeat, Network } from "lucide-react";

// 스타일이 적용된 버튼 컴포넌트
export const ToolbarButton = ({ 
  title, 
  icon, 
  onClick, 
  backgroundColor = "rgba(107, 114, 128, 0.1)",
  hoverColor = "rgba(107, 114, 128, 0.2)",
  danger = false 
}) => {
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

  return (
    <button
      title={title}
      onClick={onClick}
      style={buttonStyle}
      onMouseEnter={(e) => {
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
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)",
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
          backgroundColor={isEditing ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)"}
          hoverColor={isEditing ? "rgba(16, 185, 129, 0.15)" : "rgba(107, 114, 128, 0.2)"}
        />
      )}
      
      {data?.type === "attribute" && isEditing && (
        <ToolbarButton
          title="Convert to blank attribute"
          icon={<Repeat size={12} />}
          onClick={onConvertBlank}
          backgroundColor="rgba(245, 158, 11, 0.1)"
          hoverColor="rgba(245, 158, 11, 0.15)"
        />
      )}

      {onDuplicate && (
        <ToolbarButton
          title="Duplicate node"
          icon={<Copy size={12} />}
          onClick={onDuplicate}
          backgroundColor="rgba(59, 130, 246, 0.1)"
          hoverColor="rgba(59, 130, 246, 0.15)"
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
        title="Delete node"
        icon={<Trash2 size={12} />}
        onClick={onDelete}
        danger={true}
      />
    </NodeToolbar>
  );
});

export default NodeToolbarMenu;