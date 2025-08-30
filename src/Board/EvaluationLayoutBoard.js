import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  NodeToolbar,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DefaultEdge, defaultEdgeOptions } from "../components/DefaultEdge";
import SimpleLayoutNode from "../components/nodes/SimpleLayoutNode";
import ResizableNode from "../components/nodes/ResizableNode";
import { syncMovedNodePositions } from "../utils/node/syncNodePositions";
import { getNormalizedBox } from "../utils/node/getNormalizedBox";
import CustomButton from "../components/CustomButton";
import {
  LEFT_OFFSET_BASELINE as LEFT_OFFSET,
  TOP_OFFSET,
} from "../utils/constants";
import promptData from "../data/promptData.json";
import promptDataSystem2 from "../data/promptDataSystem2.json";
import { useClassContext } from "../context/ClassContext";

const edgeTypes = {
  main: DefaultEdge,
};
const nodeTypes = {
  simple: SimpleLayoutNode,
  resizable: ResizableNode,
};

function EvaluationLayoutBoard({ currentSceneId, selectedInstanceId, isBaseline = true, onInstanceSelect, onSceneLoad, allScenesCompleted, onMoveToNextSystem, systemLabel }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const { setInstances } = useClassContext();
  const [showImageOnly, setShowImageOnly] = useState(false);

  // Load scene when currentSceneId changes
  useEffect(() => {
    if (currentSceneId && currentSceneId !== 0) {
      handleLoadScene(currentSceneId);
    }
  }, [currentSceneId]);

  // // Highlight selected nodes
  // useEffect(() => {
  //   setNodes((nds) => {
  //     return nds.map((node) => {
  //       if (node.type === "simple") {
  //         const isHighlighted = node.data?.instanceId === selectedInstanceId;
  //         return {
  //           ...node,
  //           data: {
  //             ...node.data,
  //             isHighlighted,
  //           },
  //         };
  //       }
  //       return node;
  //     });
  //   });
  // }, [selectedInstanceId]);

  const handleNodesChange = useCallback(
    (changes) => {
      setNodes((prevNodes) =>
        syncMovedNodePositions({
          changes,
          prevNodes,
          edges,
        })
      );
      onNodesChange(changes);
    },
    [onNodesChange, edges, setNodes]
  );

  // Node click handler for instance selection
  const handleNodeClick = useCallback(
    (_, node) => {
      if (node.type !== "resizable" && onInstanceSelect) {
        onInstanceSelect(node.data?.instanceId);
      }
    },
    [onInstanceSelect]
  );

  // Load scene data from JSON (different data for different systems)
  const handleLoadScene = (sceneId) => {
    const dataSource = isBaseline ? promptData : promptDataSystem2;
    const sceneData = dataSource.find(p => p.id === sceneId);
    if (!sceneData) return;

    // Clear existing nodes and edges
    setNodes([]);
    setEdges([]);

    // Create nodes from scene data
    const newNodes = [];
    const instancesData = [];
    
    sceneData.instances.forEach((instance, index) => {
      const sharedId = instance.id;
      
      // Convert bounding box to screen position
      const position = screenToFlowPosition({
        x: instance.boundingBox.x + LEFT_OFFSET,
        y: instance.boundingBox.y + TOP_OFFSET
      });

      // Create instance data for ClassContext
      const instanceData = {
        id: sharedId,
        instanceLabel: instance.label,
        textDescription: instance.textDescription,
        isFromClass: instance.isFromClass,
        classId: instance.classId || null,
        createdAt: new Date().toISOString(),
        boundingBox: instance.boundingBox,
        sceneGraph: instance.sceneGraph || {
          objects: [{
            id: sharedId,
            name: instance.label,
            attributes: []
          }],
          relationships: []
        }
      };
      instancesData.push(instanceData);

      const objNode = {
        id: sharedId,
        type: "simple",
        position,
        data: {
          label: instance.label,
          sharedId,
          instanceId: sharedId,
          instanceLabel: instance.label,
          isFromClass: instance.isFromClass,
          parentClassName: instance.classId || null,
          hasOverrides: false,
          isHighlighted: false,
          isEvaluationMode: true, // Show handles in evaluation mode
        },
        style: {
          height: 40,
          width: Math.max(120, Math.min(instance.label.length * 8, 200)), // Dynamic width with max limit
          fontSize: "11px" // Smaller font to prevent overflow
        },
      };

      const resizableNode = {
        id: `${sharedId}-resizable`,
        type: "resizable",
        position,
        data: {
          ...objNode.data,
          textDescription: instance.textDescription,
        },
        style: {
          width: instance.boundingBox.width,
          height: instance.boundingBox.height
        },
      };

      newNodes.push(resizableNode, objNode);
    });

    // Create edges from sceneGraph relationships
    const newEdges = [];
    if (sceneData.sceneGraph && sceneData.sceneGraph.relationships) {
      sceneData.sceneGraph.relationships.forEach((rel, index) => {
        const sourceId = rel.from;
        const targetId = rel.to;
        
        // Only create edge if both nodes exist
        if (newNodes.find(n => n.id === sourceId) && newNodes.find(n => n.id === targetId)) {
          const edge = {
            id: `edge-${sourceId}-${targetId}-${index}`,
            source: sourceId,
            target: targetId,
            type: 'main',
            label: rel.relationship,
            data: {
              relation: rel.relationship,
            },
            animated: false,
            style: { stroke: '#64748b', strokeWidth: 2 },
            labelStyle: { 
              fill: '#374151',
              fontWeight: 500,
              fontSize: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '2px 4px',
              borderRadius: '4px',
            },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: 'rgba(255, 255, 255, 0.9)', fillOpacity: 0.9 },
          };
          newEdges.push(edge);
        }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges); // Set the edges

    // Update ClassContext with instances data
    setInstances(instancesData);

    // Call callback with scene data
    if (onSceneLoad) {
      onSceneLoad(sceneData);
    }
  };

  // Remove scene buttons - now controlled by parent component

  return (
    <div
      className="reactflow-wrapper"
      style={{ userSelect: "none", position: "relative" }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {/* Move to Next System Button - appears when all scenes completed */}
        {allScenesCompleted && (
          <CustomButton
            color="purpleBlue"
            size="lg"
            onClick={onMoveToNextSystem}
            style={{ marginLeft: "16px" }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: "bold",
              }}
            >
              {systemLabel || "Move to Next System"}
            </span>
          </CustomButton>
        )}
      </div>

      {/* Current scene indicator */}
      {!showImageOnly && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          panOnDrag={false}
          panOnScroll={false}
          selectNodesOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
          nodeDragBounds={{
            left: 0,
            top: 0,
            right: 512,
            bottom: 512,
          }}
          nodesDraggable={false} // Disable dragging for evaluation
          translateExtent={[
            [0, 0],
            [512, 512],
          ]}
          nodeExtent={[
            [0, 0],
            [512, 512],
          ]}
          proOptions={{ hideAttribution: true }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        />
      )}
    </div>
  );
}

function EvaluationLayoutBoardWithProvider({ currentSceneId, selectedInstanceId, isBaseline, onInstanceSelect, onSceneLoad, allScenesCompleted, onMoveToNextSystem, systemLabel }) {
  return (
    <ReactFlowProvider debounce={200}>
      <EvaluationLayoutBoard
        currentSceneId={currentSceneId}
        selectedInstanceId={selectedInstanceId}
        isBaseline={isBaseline}
        onInstanceSelect={onInstanceSelect}
        onSceneLoad={onSceneLoad}
        allScenesCompleted={allScenesCompleted}
        onMoveToNextSystem={onMoveToNextSystem}
        systemLabel={systemLabel}
      />
    </ReactFlowProvider>
  );
}

export default EvaluationLayoutBoardWithProvider;