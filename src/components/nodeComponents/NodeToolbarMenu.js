import React, { forwardRef, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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


// Tooltip 컴포넌트 - Portal을 사용해서 body에 렌더링
const Tooltip = ({ show, text, position, buttonRect, tooltipPosition = "bottom" }) => {
  if (!show || !text || !buttonRect) return null;

  const tooltipStyle = {
    position: "fixed",
    left: buttonRect.left + buttonRect.width / 2,
    transform: "translateX(-50%)",
    ...(tooltipPosition === "top" 
      ? { bottom: window.innerHeight - buttonRect.top + 8 }
      : { top: buttonRect.bottom + 8 }
    ),
    backgroundColor: "#1f2937",
    color: "white",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    whiteSpace: "nowrap",
    zIndex: 10000, // 매우 높은 z-index
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
    pointerEvents: "none", // 마우스 이벤트 무시
    opacity: 1,
  };

  return createPortal(
    <div style={tooltipStyle}>
      {text}
      {/* 화살표 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          ...(tooltipPosition === "top"
            ? {
                top: "100%",
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid #1f2937",
              }
            : {
                bottom: "100%",
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderBottom: "5px solid #1f2937",
              }
          ),
          width: 0,
          height: 0,
        }}
      />
    </div>,
    document.body
  );
};

// ToolbarButton 컴포넌트 - 개선된 버전
export const ToolbarButton = ({ 
  onClick, 
  title, 
  icon, 
  danger = false,
  tooltipPosition = "bottom",
  size = "normal",
  disabled = false
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);
  const buttonRef = useRef(null);
  const timeoutRef = useRef(null);

  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  const clearTooltipTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = (e) => {
    clearTooltipTimeout();
    if (!disabled) {
      e.target.style.backgroundColor = danger ? "#fee2e2" : "#f8fafc";
      e.target.style.borderColor = danger ? "#fca5a5" : "#cbd5e1";
    }
    updateButtonRect();
    setShowTooltip(true);
  };

  const handleMouseLeave = (e) => {
    clearTooltipTimeout();
    if (!disabled) {
      e.target.style.backgroundColor = danger ? "#fef2f2" : "white";
      e.target.style.borderColor = "#e2e8f0";
    }
    // 약간의 지연을 두고 툴팁 숨기기
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 100);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => clearTooltipTimeout();
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        disabled={disabled}
        style={{
          padding: size === "compact" ? "4px" : "8px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          backgroundColor: disabled ? "#f9fafb" : (danger ? "#fef2f2" : "white"),
          color: disabled ? "#9ca3af" : (danger ? "#dc2626" : "#64748b"),
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          minWidth: size === "compact" ? "18px" : "28px",
          minHeight: size === "compact" ? "18px" : "28px",
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => {
          clearTooltipTimeout();
          updateButtonRect();
          setShowTooltip(true);
        }}
        onBlur={() => {
          clearTooltipTimeout();
          setShowTooltip(false);
        }}
        onClick={(e) => {
          clearTooltipTimeout();
          setShowTooltip(false);
          if (!disabled && onClick) {
            onClick(e);
          }
        }}
      >
        {icon}
      </button>
      
      <Tooltip 
        show={showTooltip} 
        text={title} 
        buttonRect={buttonRect}
        tooltipPosition={tooltipPosition}
      />
    </>
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
        gap: "4px",
        padding: "6px 8px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: "10px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 1000,
        minHeight: "40px", // 최소 높이 보장
        overflow: "visible", // 중요: 오버플로우 허용
        whiteSpace: "nowrap", // 버튼들이 줄바꿈되지 않도록
        ...style,
      }}
      ref={ref}
    >
      {onSave && (
        <ToolbarButton
          title={isEditing ? "Save label" : "Edit label"}
          icon={isEditing ? <Check size={14} /> : <Edit2 size={14} />}
          onClick={isEditing ? onSave : onEditToggle}
          tooltipPosition={position === Position.Bottom ? "top" : "bottom"}
        />
      )}

      {data?.type === "attribute" && isEditing && (
        <ToolbarButton
          title="Convert to blank attribute"
          icon={<Repeat size={14} />}
          onClick={onConvertBlank}
          tooltipPosition={position === Position.Bottom ? "top" : "bottom"}
        />
      )}

      {onDuplicate && (
        <ToolbarButton
          title="Create Class"
          icon={<Layers size={14} />}
          onClick={onDuplicate}
          tooltipPosition={position === Position.Bottom ? "top" : "bottom"}
        />
      )}

      {onConvertFromText && (
        <ToolbarButton
          title="Text to Graph"
          icon={<Network size={14} />}
          onClick={onConvertFromText}
          tooltipPosition={position === Position.Bottom ? "top" : "bottom"}
        />
      )}

      <ToolbarButton
        title="Delete Instance"
        icon={<Trash2 size={14} />}
        onClick={onDelete}
        danger={true}
        tooltipPosition={position === Position.Bottom ? "top" : "bottom"}
      />
    </NodeToolbar>
  );
});

export default NodeToolbarMenu;
