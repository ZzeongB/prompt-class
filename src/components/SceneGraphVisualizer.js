// 2. SceneGraphVisualizer.js에 드래그 처리 추가
import React, { useMemo, useState } from "react";
import ObjectNode from "./nodes/ObjectNode";
import RelationshipNode from "./nodes/RelationshipNode";

export default function SceneGraphVisualizer({
  sceneGraph,
  onSceneGraphChange,
  isEditable = true,
  isClassMode = false,
  placeHolders = null,
  // 새로운 드래그 관련 props
  onObjectDragStart,
  onObjectDragEnd,
  instanceId, // 현재 인스턴스 ID
}) {
  const [hoveredObject, setHoveredObject] = useState(null);
  const [hoveredRelationship, setHoveredRelationship] = useState(null);
  const [editingObject, setEditingObject] = useState(null);
  const [draggingObject, setDraggingObject] = useState(null);

  // 편집 함수들
  const handleObjectEdit = (objectId, newName, newAttributes = null, newPlaceHolders = null) => {    
    const updatedGraph = {
      ...sceneGraph,
      objects: sceneGraph.objects.map((obj) =>
        obj.id === objectId
          ? {
              ...obj,
              name: newName,
              attributes: newAttributes ?? obj.attributes,
            }
          : obj
      ),
    };
        
    if (newPlaceHolders) {
      onSceneGraphChange(updatedGraph, newPlaceHolders);
    } else {
      onSceneGraphChange(updatedGraph);
    }
  };

  const handleObjectDelete = (objectId) => {
    const updatedGraph = {
      ...sceneGraph,
      objects: sceneGraph.objects.filter((obj) => obj.id !== objectId),
      relationships: sceneGraph.relationships.filter(
        (rel) => rel.source !== objectId && rel.target !== objectId
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleAddAttribute = (objectId, newAttribute) => {
    const updatedGraph = {
      ...sceneGraph,
      objects: sceneGraph.objects.map((obj) =>
        obj.id === objectId
          ? { ...obj, attributes: [...(obj.attributes || []), newAttribute] }
          : obj
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  // 드래그 이벤트 핸들러
  const handleObjectDragStart = (object, sourceInstanceId) => {
    console.log("Object drag started:", object, "from instance:", sourceInstanceId);
    setDraggingObject(object);
    onObjectDragStart?.(object, sourceInstanceId);
  };

  const handleObjectDragEnd = (object, sourceInstanceId, dropPosition) => {
    console.log("Object drag ended:", object, "at position:", dropPosition);
    setDraggingObject(null);
    
    // 부모 컴포넌트(InstancePanelNode)에 드래그 완료 알림
    onObjectDragEnd?.(object, sourceInstanceId, dropPosition);
  };
 
  // DAG 기반 레벨 계산
  const getNodeLevels = (objects, relationships) => {
    const inDegree = {},
      levels = {},
      graph = {};
    objects.forEach((o) => {
      inDegree[o.id] = 0;
      graph[o.id] = [];
    });
    relationships.forEach((r) => {
      graph[r.source].push(r.target);
      inDegree[r.target]++;
    });

    const queue = [];
    objects.forEach((o) => {
      if (inDegree[o.id] === 0) {
        levels[o.id] = 0;
        queue.push(o.id);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift();
      const currentLevel = levels[current];
      for (const next of graph[current]) {
        inDegree[next]--;
        if (inDegree[next] === 0) {
          levels[next] = currentLevel + 1;
          queue.push(next);
        }
      }
    }

    return levels;
  };

  const objectPositions = useMemo(() => {
    const levels = getNodeLevels(sceneGraph.objects, sceneGraph.relationships);
    const grouped = {};
    for (const [id, level] of Object.entries(levels)) {
      if (!grouped[level]) grouped[level] = [];
      grouped[level].push(id);
    }

    const positions = {};
    const gapX = 160;
    const gapY = 80;

    Object.entries(grouped).forEach(([levelStr, ids], colIndex) => {
      ids.forEach((id, rowIndex) => {
        positions[id] = {
          x: colIndex * gapX,
          y: rowIndex * gapY,
        };
      });
    });

    return positions;
  }, [sceneGraph]);

  const nodeWidth = isClassMode ? 90 : 75;
  const nodeHeight = 60;

  const boundingSize = useMemo(() => {
    let maxX = 0,
      maxY = 0;

    for (const pos of Object.values(objectPositions)) {
      if (!pos) continue;
      maxX = Math.max(maxX, pos.x + nodeWidth);
      maxY = Math.max(maxY, pos.y + nodeHeight);
    }

    return {
      width: Math.max(maxX, 200), // 최소 너비 보장
      height: Math.max(maxY, 100), // 최소 높이 보장
    };
  }, [objectPositions, nodeWidth]);

  return (
    <div
      style={{
        position: "relative",
        width: boundingSize.width,
        height: boundingSize.height,
        background: "#f8fafc",
        borderRadius: "6px",
        border: draggingObject ? "2px dashed #3b82f6" : "1px solid transparent",
        transition: "border 0.2s ease",
      }}
    >
      {/* 드래그 중일 때 드롭 존 표시 */}
      {draggingObject && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(59, 130, 246, 0.05)",
            border: "2px dashed #3b82f6",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: "#3b82f6",
            fontWeight: "500",
            pointerEvents: "none",
            zIndex: 100,
          }}
        >
          Drop here to extract object
        </div>
      )}

      {/* 선 그리기 */}
      <svg
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
          </marker>
        </defs>
        {sceneGraph.relationships.map((rel, i) => {
          const src = objectPositions[rel.source];
          const tgt = objectPositions[rel.target];
          if (!src || !tgt) return null;

          const x1 = src.x + nodeWidth;
          const y1 = src.y + nodeHeight / 2;
          const x2 = tgt.x;
          const y2 = tgt.y + nodeHeight / 2;

          return (
            <line
              key={`line-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#cbd5e1"
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
              strokeDasharray="4"
            />
          );
        })}
      </svg>

      {/* ObjectNode 렌더링 */}
      {sceneGraph.objects.map((obj) => {
        const pos = objectPositions[obj.id];
        if (!pos) return null;
        
        // 드래그 중인 객체는 반투명하게 표시
        const isDraggingThis = draggingObject?.id === obj.id;
        
        return (
          <div
            key={obj.id}
            style={{
              position: "absolute",
              top: pos.y,
              left: pos.x,
              width: nodeWidth,
              height: nodeHeight,
              opacity: isDraggingThis ? 0.3 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            <ObjectNode
              object={obj}
              onEdit={handleObjectEdit}
              onDelete={handleObjectDelete}
              onAddAttribute={handleAddAttribute}
              isHovered={hoveredObject === obj.id}
              setIsHovered={(hovered) =>
                setHoveredObject(hovered ? obj.id : null)
              }
              isEditing={editingObject === obj.id}
              setIsEditing={(editing) =>
                setEditingObject(editing ? obj.id : null)
              }
              isEditable={isEditable}
              isClassMode={isClassMode}
              placeHolders={placeHolders}
              // 드래그 관련 props 전달
              onDragStart={handleObjectDragStart}
              onDragEnd={handleObjectDragEnd}
              isDraggable={!isClassMode} // 클래스 모드에서는 드래그 비활성화
              parentInstanceId={instanceId}
            />
          </div>
        );
      })}

      {/* RelationshipNode 중간에 배치 */}
      {sceneGraph.relationships.map((rel, i) => {
        const src = objectPositions[rel.source];
        const tgt = objectPositions[rel.target];
        if (!src || !tgt) return null;
        const midX = (src.x + nodeWidth + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2 + nodeHeight / 2;
        return (
          <div
            key={`rel-${i}`}
            style={{
              position: "absolute",
              top: midY,
              left: midX,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
            }}
          >
            <RelationshipNode
              relationship={rel}
              objects={sceneGraph.objects}
              isEditable={isEditable}
              isHovered={
                hoveredRelationship === `${rel.source}-${rel.target}-${i}`
              }
              setIsHovered={(hovered) =>
                setHoveredRelationship(
                  hovered ? `${rel.source}-${rel.target}-${i}` : null
                )
              }
            />
          </div>
        );
      })}
    </div>
  );
}