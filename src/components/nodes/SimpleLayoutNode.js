// 2. SimpleLayoutNode.js - 레이아웃 보드용 간단한 노드
import React, { useState, useEffect } from "react";
import { Handle, Position, useConnection } from "@xyflow/react";
import { Link } from "lucide-react";

function SimpleLayoutNode({ id, data, selected }) {
  const shouldHighlight = selected || data.isHighlighted;
  const isSelectedForMerge = data.isSelectedForMerge;

  const [isHovered, setIsHovered] = useState(false);
  const connection = useConnection();
  // target handles should be visible only when connecting (when another node is being dragged to connect)
  const showTargetHandles = connection.inProgress && connection.fromNode?.id !== id;

  // source handles should be visible on hover
  const showSourceHandles = isHovered;

  return (
    <div
      style={{
        padding: "8px 12px",
        background: isSelectedForMerge 
          ? "#fbbf24" // 노란색/오렌지색 - merge 선택된 상태
          : shouldHighlight
          ? "#3b82f6" // 더 강력한 파란색 배경
          : "#ffffff",
        color: (isSelectedForMerge || shouldHighlight) ? "white" : "#1f2937",
        border: isSelectedForMerge 
          ? "3px solid #f59e0b" // 오렌지색 테두리
          : shouldHighlight 
          ? "3px solid #1d4ed8" 
          : "1px solid #e5e7eb",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: isSelectedForMerge
          ? "0 8px 20px -4px rgba(251, 191, 36, 0.5)"
          : shouldHighlight
          ? "0 8px 20px -4px rgba(59, 130, 246, 0.5)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        minWidth: "100px",
        textAlign: "center",
        transform: (isSelectedForMerge || shouldHighlight) ? "scale(1.05)" : "scale(1)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Target handles - visible when connecting */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          backgroundColor: '#22c55e',
          border: '2px solid white',
          opacity: showTargetHandles ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Source handles - visible on hover */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 8,
          height: 8,
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          opacity: showSourceHandles ? 1 : 0,
          transition: 'opacity 0.2s ease'
        }}
      />
      <div
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: (isSelectedForMerge || shouldHighlight) ? "white" : "#1f2937",
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

      {isSelectedForMerge && (
        <div
          style={{
            fontSize: "8px",
            color: "#f59e0b",
            marginTop: "2px",
            fontWeight: "600",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)"
          }}
        >
          Selected for Merge
        </div>
      )}
    </div>
  );
}

// memo 제거 - highlight 실시간 업데이트를 위해
export default SimpleLayoutNode;