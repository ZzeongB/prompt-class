// DefaultEdge.js 또는 DefaultEdge.tsx

import {
  getBezierPath,
  useInternalNode,
  BaseEdge,
  MarkerType,
} from "@xyflow/react";
import { getEdgeParams } from "../utils/node/nodePositionUtils";
import { EDGE_COLOR } from "../utils/constants";

export function DefaultEdge({ id, source, target, markerEnd, style }) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

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
    />
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
