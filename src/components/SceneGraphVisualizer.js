import React, { useMemo, useState } from "react";
import ObjectNode from "./nodes/ObjectNode";
import RelationshipNode from "./nodes/RelationshipNode";

export default function SceneGraphVisualizer({
  sceneGraph,
  onSceneGraphChange,
  isEditable = true,
  isClassMode = false,
  placeHolders = null,
}) {
  const [hoveredObject, setHoveredObject] = useState(null);
  const [hoveredRelationship, setHoveredRelationship] = useState(null)
 
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

  const nodeWidth = isClassMode ? 90 : 75; // Class mode에서는 조금 더 넓게
  const nodeHeight = 60;

  const boundingSize = useMemo(() => {
    let maxX = 0,
      maxY = 0;

    // ObjectNode 기준
    for (const pos of Object.values(objectPositions)) {
      if (!pos) continue;
      maxX = Math.max(maxX, pos.x + nodeWidth);
      maxY = Math.max(maxY, pos.y + nodeHeight);
    }

    return {
      width: maxX, // 여유 padding
      height: maxY,
    };
  }, [objectPositions, nodeWidth]);

  return (
    <div
      style={{
        position: "relative",
        width: boundingSize.width,
        height: boundingSize.height,
        background: "#f8fafc",
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
        return (
          <div
            key={obj.id}
            style={{
              position: "absolute",
              top: pos.y,
              left: pos.x,
              width: nodeWidth,
              height: nodeHeight,
            }}
          >
            <ObjectNode
              object={obj}
              isHovered={hoveredObject === obj.id}
              setIsHovered={(hovered) =>
                setHoveredObject(hovered ? obj.id : null)
              }
              isEditable={isEditable}
              isClassMode={isClassMode}
              placeHolders={placeHolders}
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