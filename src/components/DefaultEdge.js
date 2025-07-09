// DefaultEdge.js 또는 DefaultEdge.tsx
import { useState } from "react";
import {
  getBezierPath,
  useInternalNode,
  BaseEdge,
  MarkerType,
  useReactFlow,
  EdgeLabelRenderer,
} from "@xyflow/react";
import { getEdgeParams } from "../utils/node/nodePositionUtils";
import { EDGE_COLOR } from "../utils/constants";
import HoverButton from "./nodeComponents/HoverButton";
import { Trash2 } from "lucide-react";

export function DefaultEdge({ id, data, source, target, markerEnd, style }) {
  const { deleteElements } = useReactFlow();
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  const onDelete = () => {
    deleteElements({ edges: [{ id }] });
  };

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: EDGE_COLOR,
        strokeWidth: 1.5,
        opacity: 0.6,
        ...style,
      }}
    >
      {data?.isHovered && (
        <EdgeLabelRenderer>
          <div
            className="button-edge__label nodrag nopan"
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#2B2B2B",
              borderRadius: "10px",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(4px)",
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            <HoverButton
              title="Delete edge"
              icon={<Trash2 size={16} />}
              danger
              onClick={onDelete}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </BaseEdge>
  );
}

// ✅ 함께 export할 기본 옵션
export const defaultEdgeOptions = {
  type: "main",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: EDGE_COLOR,
    opacity: 0.5,
  },
  style: {
    stroke: EDGE_COLOR,
    strokeWidth: 1.5,
    opacity: 0.5,
  },
};
