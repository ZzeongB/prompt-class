// InstanceBoard.js - 모든 인스턴스 상세 정보 표시
import React, { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import ObjectNode from "./nodes/ObjectNode";
import RelationshipNode from "./nodes/RelationshipNode";

// 수정된 SceneGraphVisualizer - extract UI 제거
export default function SceneGraphVisualizer({
  sceneGraph,
  onSceneGraphChange = () => {},
  isEditable = true,
  isClassMode = false,
  placeHolders = null,
  onObjectDragStart,
  onObjectDragEnd,
  onObjectExtract,
  instanceId,
  compact = false,
  highlightedTerm = null,
  onNodeHover = () => {},
  onNodeLeave = () => {},
}) {
  const [hoveredObject, setHoveredObject] = useState(null);
  const [hoveredRelationship, setHoveredRelationship] = useState(null);
  const [editingObject, setEditingObject] = useState(null);
  const [draggingObject, setDraggingObject] = useState(null);
  const [connectingMode, setConnectingMode] = useState(false);
  const [selectedSourceObject, setSelectedSourceObject] = useState(null);

  // 안전한 데이터 확인 - 하지만 sceneGraph가 있으면 우선 사용
  const safeSceneGraph = sceneGraph || {
    objects: [],
    relationships: [],
  };

  // 편집 함수들
  const handleObjectEdit = (
    objectId,
    newName,
    newAttributes = null,
    newPlaceHolders = null
  ) => {
    const updatedGraph = {
      ...safeSceneGraph,
      objects: safeSceneGraph.objects.map((obj) =>
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
      ...safeSceneGraph,
      objects: safeSceneGraph.objects.filter((obj) => obj.id !== objectId),
      relationships: safeSceneGraph.relationships.filter(
        (rel) => rel.source !== objectId && rel.target !== objectId
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleAddAttribute = (objectId, newAttribute) => {
    const updatedGraph = {
      ...safeSceneGraph,
      objects: safeSceneGraph.objects.map((obj) =>
        obj.id === objectId
          ? { ...obj, attributes: [...(obj.attributes || []), newAttribute] }
          : obj
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  // Object 추가 기능
  const handleAddObject = () => {
    const newId = `object${safeSceneGraph.objects.length + 1}`;
    const updatedGraph = {
      ...safeSceneGraph,
      objects: [
        ...safeSceneGraph.objects,
        { id: newId, name: "new object", attributes: [] },
      ],
    };
    onSceneGraphChange(updatedGraph);
  };

  // Relationship 관련 기능들
  const handleRelationshipEdit = (sourceId, targetId, newRelation) => {
    const updatedGraph = {
      ...safeSceneGraph,
      relationships: safeSceneGraph.relationships.map((rel) =>
        rel.source === sourceId && rel.target === targetId
          ? { ...rel, relation: newRelation }
          : rel
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleRelationshipDelete = (sourceId, targetId) => {
    const updatedGraph = {
      ...safeSceneGraph,
      relationships: safeSceneGraph.relationships.filter(
        (rel) => !(rel.source === sourceId && rel.target === targetId)
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleObjectClick = (objectId) => {
    if (connectingMode) {
      if (!selectedSourceObject) {
        // First object selected as source
        setSelectedSourceObject(objectId);
      } else if (selectedSourceObject !== objectId) {
        // Second object selected as target - create relationship
        const relationshipExists = safeSceneGraph.relationships.some(
          (rel) =>
            rel.source === selectedSourceObject && rel.target === objectId
        );

        if (!relationshipExists) {
          const updatedGraph = {
            ...safeSceneGraph,
            relationships: [
              ...safeSceneGraph.relationships,
              {
                source: selectedSourceObject,
                target: objectId,
                relation: "related to",
              },
            ],
          };
          onSceneGraphChange(updatedGraph);
        }

        // Reset connecting mode
        setConnectingMode(false);
        setSelectedSourceObject(null);
      }
    }
  };

  const handleToggleConnectMode = () => {
    setConnectingMode(!connectingMode);
    setSelectedSourceObject(null);
  };

  // 드래그 이벤트 핸들러
  const handleObjectDragStart = (object, sourceInstanceId) => {
    setDraggingObject(object);
    onObjectDragStart?.(object, sourceInstanceId);
  };

  const handleObjectDragEnd = (object, sourceInstanceId, dropPosition) => {
    setDraggingObject(null);
    onObjectDragEnd?.(object, sourceInstanceId, dropPosition);
  };

  // 노드 크기 계산 함수
  const getNodeDimensions = (obj) => {
    const attributeCount = obj.attributes?.length || 0;
    const hasMultipleAttributes = attributeCount > 5;

    let width, height;

    if (compact) {
      width = hasMultipleAttributes ? 160 : 100;
      height =
        50 +
        Math.min(attributeCount, 5) * 12 +
        (hasMultipleAttributes ? Math.ceil((attributeCount - 5) / 2) * 12 : 0);
    } else if (isClassMode) {
      width = hasMultipleAttributes ? 180 : 120;
      height =
        70 +
        Math.min(attributeCount, 5) * 16 +
        (hasMultipleAttributes ? Math.ceil((attributeCount - 5) / 2) * 16 : 0);
    } else {
      width = hasMultipleAttributes ? 160 : 110;
      height =
        65 +
        Math.min(attributeCount, 5) * 14 +
        (hasMultipleAttributes ? Math.ceil((attributeCount - 5) / 2) * 14 : 0);
    }

    return { width, height };
  };

  // 간단하고 안정적인 위치 계산
  const getObjectPositions = (objects, relationships) => {
    const positions = {};

    if (objects.length === 0) return positions;

    // 노드 크기를 고려한 간격 계산
    const maxNodeWidth = Math.max(
      ...objects.map((obj) => getNodeDimensions(obj).width)
    );
    const maxNodeHeight = Math.max(
      ...objects.map((obj) => getNodeDimensions(obj).height)
    );

    const gapX = maxNodeWidth + (compact ? 40 : 100);
    const gapY = maxNodeHeight + (compact ? 20 : 30);

    // 관계가 없거나 간단한 경우 그리드 레이아웃
    if (relationships.length === 0 || compact) {
      const cols = Math.ceil(Math.sqrt(objects.length));
      objects.forEach((obj, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        positions[obj.id] = {
          x: col * gapX,
          y: row * gapY,
        };
      });
      return positions;
    }

    // 관계가 있는 경우 간단한 레벨링
    try {
      const inDegree = {};
      const graph = {};
      const levels = {};

      // 초기화
      objects.forEach((obj) => {
        inDegree[obj.id] = 0;
        graph[obj.id] = [];
        levels[obj.id] = 0;
      });

      // 관계 그래프 구성
      relationships.forEach((rel) => {
        if (graph[rel.source] && inDegree[rel.target] !== undefined) {
          graph[rel.source].push(rel.target);
          inDegree[rel.target]++;
        }
      });

      // 레벨 계산
      const queue = [];
      objects.forEach((obj) => {
        if (inDegree[obj.id] === 0) {
          levels[obj.id] = 0;
          queue.push(obj.id);
        }
      });

      while (queue.length > 0) {
        const current = queue.shift();
        const currentLevel = levels[current];

        if (graph[current]) {
          graph[current].forEach((next) => {
            inDegree[next]--;
            if (inDegree[next] === 0) {
              levels[next] = currentLevel + 1;
              queue.push(next);
            }
          });
        }
      }

      // 레벨별로 그룹화
      const grouped = {};
      Object.entries(levels).forEach(([id, level]) => {
        if (!grouped[level]) grouped[level] = [];
        grouped[level].push(id);
      });

      // 위치 할당 - 레벨별로 중앙 정렬
      Object.entries(grouped).forEach(([levelStr, ids], levelIndex) => {
        const level = parseInt(levelStr);
        const levelNodeCount = ids.length;
        const startY = (-(levelNodeCount - 1) * gapY) / 2;

        ids.forEach((id, index) => {
          positions[id] = {
            x: level * gapX,
            y: startY + index * gapY,
          };
        });
      });
    } catch (error) {
      console.warn(
        "Failed to calculate DAG layout, falling back to grid:",
        error
      );
      // 에러 시 그리드 레이아웃으로 폴백
      const cols = Math.ceil(Math.sqrt(objects.length));
      objects.forEach((obj, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        positions[obj.id] = {
          x: col * gapX,
          y: row * gapY,
        };
      });
    }

    return positions;
  };

  const objectPositions = useMemo(() => {
    return getObjectPositions(
      safeSceneGraph.objects,
      safeSceneGraph.relationships
    );
  }, [safeSceneGraph.objects, safeSceneGraph.relationships, compact]);

  const boundingSize = useMemo(() => {
    if (Object.keys(objectPositions).length === 0) {
      return { width: 200, height: 100, offsetX: 0, offsetY: 0 };
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    Object.entries(objectPositions).forEach(([objId, pos]) => {
      if (pos) {
        const obj = safeSceneGraph.objects.find((o) => o.id === objId);
        const { width, height } = getNodeDimensions(obj);

        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + width);
        maxY = Math.max(maxY, pos.y + height);
      }
    });

    // 패딩을 크게 줄임 (30 -> 15)
    const padding = compact ? 10 : 15;
    return {
      width: Math.max(maxX - minX + padding * 2, 200),
      height: Math.max(maxY - minY + padding * 2, 200),
      offsetX: Math.max(-minX + padding, 0),
      offsetY: Math.max(-minY + padding, 0),
    };
  }, [objectPositions, safeSceneGraph.objects, compact]);

  // 빈 Scene Graph 처리
  if (safeSceneGraph.objects.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          fontSize: "12px",
          backgroundColor: "#fffffff",
          // borderRadius: "6px",
          // border: "1px solid #e5e7eb",
        }}
      >
        No objects in scene graph
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        overflow: "auto", // 스크롤바 추가
        // background: "#ffffff",
        // borderRadius: "6px",
        // border: "1px solid",
      }}
    >
      {/* Add Object 버튼 */}
      {isEditable && (
        <button
          onClick={handleAddObject}
          style={{
            position: "absolute",
            top: "8px",
            right: "36px",
            background: "#e2e8f0",
            color: "#64748b",
            border: "none",
            borderRadius: "4px",
            padding: "4px 6px",
            fontSize: "11px",
            fontWeight: "400",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            opacity: "0.7",
            transition: "opacity 0.2s ease",
            zIndex: 20,
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = "0.7";
          }}
        >
          <Plus size={12} />
          Add
        </button>
      )}

      {/* Connect 모드 토글 버튼 */}
      {isEditable && (
        <button
          onClick={handleToggleConnectMode}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: connectingMode ? "#dcfce7" : "#e2e8f0",
            color: connectingMode ? "#15803d" : "#64748b",
            border: connectingMode ? "1px solid #86efac" : "none",
            borderRadius: "4px",
            padding: "4px 6px",
            fontSize: "11px",
            fontWeight: "400",
            cursor: "pointer",
            opacity: connectingMode ? "1" : "0.7",
            transition: "all 0.2s ease",
            zIndex: 20,
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            if (!connectingMode) e.target.style.opacity = "0.7";
          }}
          title={connectingMode ? "Cancel connecting" : "Connect objects"}
        >
          ⟷
        </button>
      )}

      {/* 연결 모드 안내 메시지 */}
      {connectingMode && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "12px",
            color: "#15803d",
            backgroundColor: "#dcfce7",
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid #86efac",
            zIndex: 20,
            whiteSpace: "nowrap",
          }}
        >
          {selectedSourceObject
            ? "Click target object to create relationship"
            : "Click source object to start connecting"}
        </div>
      )}
      {/* 실제 그래프 컨테이너 */}
      <div
        style={{
          position: "relative",
          width: boundingSize.width,
          height: boundingSize.height,
          minWidth: boundingSize.width,
          minHeight: boundingSize.height,
        }}
      >
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
              id={`arrowhead-${instanceId}`}
              markerWidth="5"
              markerHeight="5"
              refX="4"
              refY="2.5"
              orient="auto"
            >
              <polygon points="0 0, 5 2.5, 0 5" fill="#94a3b8" />
            </marker>
          </defs>
          {safeSceneGraph.relationships.map((rel, i) => {
            const srcPos = objectPositions[rel.source];
            const tgtPos = objectPositions[rel.target];
            if (!srcPos || !tgtPos) return null;

            const srcObj = safeSceneGraph.objects.find(
              (o) => o.id === rel.source
            );
            const tgtObj = safeSceneGraph.objects.find(
              (o) => o.id === rel.target
            );
            const srcDim = getNodeDimensions(srcObj);
            const tgtDim = getNodeDimensions(tgtObj);

            const x1 = srcPos.x + boundingSize.offsetX + srcDim.width;
            const y1 = srcPos.y + boundingSize.offsetY + srcDim.height / 2;
            const x2 = tgtPos.x + boundingSize.offsetX;
            const y2 = tgtPos.y + boundingSize.offsetY + tgtDim.height / 2;

            return (
              <line
                key={`line-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#cbd5e1"
                strokeWidth={2}
                markerEnd={`url(#arrowhead-${instanceId})`}
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>

        {/* ObjectNode 렌더링 */}
        {safeSceneGraph.objects.map((obj) => {
          const pos = objectPositions[obj.id];
          if (!pos) return null;

          const { width, height } = getNodeDimensions(obj);
          const isSelected = selectedSourceObject === obj.id;

          return (
            <div
              key={obj.id}
              style={{
                position: "absolute",
                top: pos.y + boundingSize.offsetY,
                left: pos.x + boundingSize.offsetX,
                width: width,
                height: height,
              }}
              onClick={() => handleObjectClick(obj.id)}
            >
              <div
                style={{
                  border: isSelected
                    ? "2px solid #15803d"
                    : highlightedTerm === obj.id
                    ? "2px solid #f59e0b"
                    : "none",
                  borderRadius: "8px",
                  // padding:
                  // isSelected || highlightedTerm === obj.id ? "2px" : "0",
                  cursor: connectingMode ? "pointer" : "default",
                  backgroundColor:
                    highlightedTerm === obj.id ? "#fef3c7" : "transparent",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={() => {
                  setHoveredObject(obj.id);
                  onNodeHover(obj.id);
                }}
                onMouseLeave={() => {
                  setHoveredObject(null);
                  onNodeLeave();
                }}
              >
                <ObjectNode
                  object={obj}
                  onEdit={handleObjectEdit}
                  onDelete={handleObjectDelete}
                  onAddAttribute={handleAddAttribute}
                  onExtract={onObjectExtract}
                  isHovered={
                    hoveredObject === obj.id || highlightedTerm === obj.id
                  }
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
                  onDragStart={handleObjectDragStart}
                  onDragEnd={handleObjectDragEnd}
                  isDraggable={!isClassMode && isEditable && !connectingMode}
                  parentInstanceId={instanceId}
                  compact={compact}
                  dimensions={getNodeDimensions(obj)}
                  canExtract={!isClassMode && safeSceneGraph.objects.length > 1}
                />
              </div>
            </div>
          );
        })}

        {/* RelationshipNode 중간에 배치 */}
        {safeSceneGraph.relationships.map((rel, i) => {
          const srcPos = objectPositions[rel.source];
          const tgtPos = objectPositions[rel.target];
          if (!srcPos || !tgtPos) return null;

          const srcObj = safeSceneGraph.objects.find(
            (o) => o.id === rel.source
          );
          const tgtObj = safeSceneGraph.objects.find(
            (o) => o.id === rel.target
          );
          const srcDim = getNodeDimensions(srcObj);
          const tgtDim = getNodeDimensions(tgtObj);

          const srcCenterX = srcPos.x + boundingSize.offsetX + srcDim.width;
          const srcCenterY =
            srcPos.y + boundingSize.offsetY + srcDim.height / 2;
          const tgtCenterX = tgtPos.x + boundingSize.offsetX;
          const tgtCenterY =
            tgtPos.y + boundingSize.offsetY + tgtDim.height / 2;

          const midX = (srcCenterX + tgtCenterX) / 2;
          const midY = (srcCenterY + tgtCenterY) / 2;

          return (
            <div
              key={`rel-${i}`}
              style={{
                position: "absolute",
                top: midY,
                left: midX,
                transform: "translate(-50%, -50%)",
                pointerEvents: "auto",
                zIndex: 10,
                border:
                  highlightedTerm === `rel_${i}` ? "2px solid #f59e0b" : "none",
                backgroundColor:
                  highlightedTerm === `rel_${i}` ? "#fef3c7" : "transparent",
                transition: "all 0.2s ease",
                borderRadius: "6px"
              }}
              onMouseEnter={() => {
                  setHoveredObject(`rel_${i}`);
                  onNodeHover(`rel_${i}`);
                }}
                onMouseLeave={() => {
                  setHoveredObject(null);
                  onNodeLeave();
                }}
            >
              <RelationshipNode
                relationship={rel}
                objects={safeSceneGraph.objects}
                onEdit={handleRelationshipEdit}
                onDelete={handleRelationshipDelete}
                isEditable={isEditable}
                isHovered={
                  hoveredRelationship === `${rel.source}-${rel.target}-${i}` ||
                  highlightedTerm === `rel_${i}`
                }
                setIsHovered={(hovered) =>
                  setHoveredRelationship(
                    hovered ? `${rel.source}-${rel.target}-${i}` : null
                  )
                }
                compact={compact}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
