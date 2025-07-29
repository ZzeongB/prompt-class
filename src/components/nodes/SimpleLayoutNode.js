// 2. SimpleLayoutNode.js - 레이아웃 보드용 간단한 노드
import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Link } from "lucide-react";

export default function SimpleLayoutNode({ id, data, selected }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        background: selected 
          ? "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: selected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        boxShadow: selected
          ? "0 4px 12px -2px rgba(59, 130, 246, 0.25)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        minWidth: "100px",
        textAlign: "center",
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
          color: "#1f2937",
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: "1.3",
        }}
      >
        {data.instanceLabel}
        {data.isFromClass && (
          <span
            style={{
              marginLeft: "4px",
              fontSize: "9px",
              color: "#3b82f6",
              fontWeight: "500",
            }}
          >
            <Link
              size={8}
              style={{ display: "inline", verticalAlign: "middle" }}
            />
            {data.parentClassName}
          </span>
        )}
      </div>
      
      {data.hasOverrides && (
        <div
          style={{
            fontSize: "8px",
            color: "#f59e0b",
            marginTop: "2px",
          }}
        >
          Modified
        </div>
      )}
    </div>
  );
}
