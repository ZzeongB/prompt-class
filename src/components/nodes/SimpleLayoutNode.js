// 2. SimpleLayoutNode.js - 레이아웃 보드용 간단한 노드
import { Handle, Position } from "@xyflow/react";
import { Link } from "lucide-react";

function SimpleLayoutNode({ id, data, selected }) {
  // 하이라이트 디버깅
  console.log(`SimpleLayoutNode ${data.instanceLabel || 'unknown'}: selected=${selected}, isHighlighted=${data.isHighlighted}, instanceId=${data.instanceId}`);
  
  const shouldHighlight = selected || data.isHighlighted;
  console.log(`Should highlight: ${shouldHighlight} (selected: ${selected}, isHighlighted: ${data.isHighlighted})`);
  
  return (
    <div
      style={{
        padding: "8px 12px",
        background: shouldHighlight
          ? "#3b82f6" // 더 강력한 파란색 배경
          : "#ffffff",
        color: shouldHighlight ? "white" : "#1f2937", // 하이라이트시 흰색 텍스트
        border: shouldHighlight ? "3px solid #1d4ed8" : "1px solid #e5e7eb",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: shouldHighlight
          ? "0 8px 20px -4px rgba(59, 130, 246, 0.5)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        minWidth: "100px",
        textAlign: "center",
        transform: shouldHighlight ? "scale(1.05)" : "scale(1)", // 약간의 크기 변화
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      
      <div
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: shouldHighlight ? "white" : "#1f2937",
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: "1.3",
        }}
      >
        {data.instanceLabel}
        {data.isFromClass && data.parentClassName && (
          <span
            style={{
              marginLeft: "4px",
              fontSize: "9px",
              color: "#3b82f6",
              fontWeight: "500",
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
            }}
            title={`Linked to class: ${data.parentClassName}`}
          >
            <Link
              size={8}
              style={{ display: "inline" }}
            />
            {data.parentClassName}
          </span>
        )}
        {data.isFromClass && !data.parentClassName && (
          <span style={{ color: "red", fontSize: "8px" }}>
            [No parent class name]
          </span>
        )}
      </div>
      
      {data.hasOverrides && (
        <div
          style={{
            fontSize: "8px",
            color: "#f59e0b",
            marginTop: "2px",
            fontWeight: "500",
          }}
          title="This instance has custom modifications"
        >
          Modified
        </div>
      )}
    </div>
  );
}

// memo 제거 - highlight 실시간 업데이트를 위해
export default SimpleLayoutNode;