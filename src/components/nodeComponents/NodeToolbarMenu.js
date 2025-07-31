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


// ToolbarButton 컴포넌트 - Tooltip 기능 추가
export const ToolbarButton = ({ 
  onClick, 
  title, 
  icon, 
  danger = false,
  tooltipPosition = "bottom", // "top" 또는 "bottom"
  size = "normal", // "compact" 또는 "normal"
  disabled = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        title="" // 기본 title 제거 (커스텀 tooltip 사용)
        style={{
          padding: size === "compact" ? "3px" : "6px",
          borderRadius: size === "compact" ? "3px" : "4px",
          border: "1px solid #e2e8f0",
          backgroundColor: disabled ? "#f9fafb" : (danger ? "#fef2f2" : "white"),
          color: disabled ? "#9ca3af" : (danger ? "#dc2626" : "#64748b"),
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          width: size === "compact" ? "16px" : "auto",
          height: size === "compact" ? "16px" : "auto",
          minWidth: size === "compact" ? "16px" : "auto",
          minHeight: size === "compact" ? "16px" : "auto",
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.target.style.backgroundColor = danger ? "#fee2e2" : "#f8fafc";
            e.target.style.borderColor = danger ? "#fca5a5" : "#cbd5e1";
          }
          setShowTooltip(true);
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.target.style.backgroundColor = danger ? "#fef2f2" : "white";
            e.target.style.borderColor = "#e2e8f0";
          }
          setShowTooltip(false);
        }}
      >
        {icon}
      </button>

      {/* Custom Tooltip */}
      {showTooltip && title && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            ...(tooltipPosition === "top" 
              ? { bottom: "100%", marginBottom: "8px" }
              : { top: "100%", marginTop: "8px" }
            ),
            backgroundColor: "#7b7d7eff",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            // 화살표 효과
            "&::before": tooltipPosition === "top" 
              ? {
                  content: "''",
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: "4px solid #7b7d7eff",
                }
              : {
                  content: "''",
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderBottom: "4px solid #7b7d7eff",
                },
            // 애니메이션
            animation: "tooltipFadeIn 0.2s ease-out",
          }}
        >
          {title}
          
          {/* 화살표 - CSS로 구현하기 어려우니 별도 div로 */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              ...(tooltipPosition === "top"
                ? {
                    top: "100%",
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderTop: "4px solid #7b7d7eff",
                  }
                : {
                    bottom: "100%",
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderBottom: "4px solid #7b7d7eff",
                  }
              ),
              width: 0,
              height: 0,
            }}
          />
        </div>
      )}
    </div>
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
          // backgroundColor={
          //   isEditing ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)"
          // }
          // hoverColor={
          //   isEditing ? "rgba(16, 185, 129, 0.15)" : "rgba(107, 114, 128, 0.2)"
          // }
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
