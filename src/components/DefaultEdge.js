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
  const { deleteElements, setEdges } = useReactFlow();
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

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

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

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
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
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* RelationshipNode */}
            <RelationshipNode
              relationship={relationship}
              objects={virtualObjects}
              isEditable={true}
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
