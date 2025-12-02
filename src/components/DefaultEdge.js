// DefaultEdge.js - RelationshipNode를 사용하도록 개선
import { useRef, useEffect, useState } from "react";
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
import RelationshipNode from "./nodes/RelationshipNode";

export function DefaultEdge({ id, data, source, target, markerEnd, style }) {
  const { deleteElements, setEdges, getEdges } = useReactFlow();
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsHovered(false);
        setEdges((prev) =>
          prev.map((e) =>
            e.data?.isHovered
              ? { ...e, data: { ...e.data, isHovered: false } }
              : e
          )
        );
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setEdges]);

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

  // Calculate offset for multiple edges between same nodes
  const allEdges = getEdges();
  const parallelEdges = allEdges.filter(
    (edge) =>
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)
  );

  const edgeIndex = parallelEdges.findIndex((edge) => edge.id === id);
  const totalParallelEdges = parallelEdges.length;

  // Calculate offset based on position in parallel edges
  let offsetX = 0;
  let offsetY = 0;

  if (totalParallelEdges > 1) {
    const offsetAmount = 60; // Base offset in pixels (increased for better visibility)
    const spreadFactor = Math.floor(totalParallelEdges / 2);
    const centerIndex = (totalParallelEdges - 1) / 2;
    const relativeIndex = edgeIndex - centerIndex;

    // Calculate perpendicular offset
    const dx = tx - sx;
    const dy = ty - sy;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      // Perpendicular vector
      const perpX = -dy / length;
      const perpY = dx / length;

      offsetX = perpX * relativeIndex * offsetAmount;
      offsetY = perpY * relativeIndex * offsetAmount;
    }
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
    curvature: totalParallelEdges > 1 ? 0.25 + Math.abs(edgeIndex - (totalParallelEdges - 1) / 2) * 0.1 : 0.25,
  });

  // Apply offset to control points for curved path
  const pathWithOffset = totalParallelEdges > 1
    ? edgePath.replace(
        /C ([\d.]+) ([\d.]+), ([\d.]+) ([\d.]+)/,
        (match, cx1, cy1, cx2, cy2) => {
          const newCx1 = parseFloat(cx1) + offsetX;
          const newCy1 = parseFloat(cy1) + offsetY;
          const newCx2 = parseFloat(cx2) + offsetX;
          const newCy2 = parseFloat(cy2) + offsetY;
          return `C ${newCx1} ${newCy1}, ${newCx2} ${newCy2}`;
        }
      )
    : edgePath;

  const onDelete = () => {
    deleteElements({ edges: [{ id }] });
  };

  // RelationshipNode에서 사용할 relationship 객체 생성
  const relationship = {
    source: source,
    target: target,
    relation:
      data?.relation || data?.originalRelationship?.relation || "related",
    ...data?.originalRelationship,
  };

  // RelationshipNode에서 사용할 가상 objects (실제로는 사용되지 않지만 인터페이스 맞춤)
  const virtualObjects = [
    {
      id: source,
      name:
        sourceNode.data?.instanceLabel || sourceNode.data?.label || "Instance",
    },
    {
      id: target,
      name:
        targetNode.data?.instanceLabel || targetNode.data?.label || "Instance",
    },
  ];

  // Adjust label position for offset
  const adjustedLabelX = labelX + (totalParallelEdges > 1 ? offsetX * 0.5 : 0);
  const adjustedLabelY = labelY + (totalParallelEdges > 1 ? offsetY * 0.5 : 0);

  return (
    <>
      <BaseEdge
        id={id}
        path={pathWithOffset}
        markerEnd={markerEnd}
        style={{
          stroke: "#64748b",
          strokeWidth: 1.5,
          strokeDasharray: "none",
          opacity: 1,
          ...style,
        }}
      />

      {/* RelationshipNode를 라벨로 사용 */}
      <EdgeLabelRenderer>
        <div
          ref={ref}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${adjustedLabelX}px, ${adjustedLabelY}px)`,
            pointerEvents: "all",
            zIndex: 1000,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* RelationshipNode */}
            <RelationshipNode
              relationship={relationship}
              objects={virtualObjects}
              isEditable={isHovered}
              isHovered={isHovered}
              setIsHovered={setIsHovered}
              onEdit={(sourceId, targetId, updatedRelation) => {
                // Edge의 relationship 업데이트
                setEdges((prev) =>
                  prev.map((edge) =>
                    edge.id === id
                      ? {
                          ...edge,
                          data: {
                            ...edge.data,
                            relation: updatedRelation,
                            originalRelationship: {
                              ...edge.data?.originalRelationship,
                              relation: updatedRelation,
                            },
                          },
                        }
                      : edge
                  )
                );
              }}
              onDelete={() => {
                // RelationshipNode에서 삭제 버튼을 눌렀을 때
                onDelete();
              }}
            />
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// ✅ 함께 export할 기본 옵션 (수정됨)
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
  // 기본 데이터 추가
  data: {
    relation: "related",
    isFromObjectExtraction: false,
  },
};
