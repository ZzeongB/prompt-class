import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
  Controls,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { useDnD } from "../context/DragAndDropContext";
import DefaultEdge from "../components/DefaultEdge";
import InstanceNode from "../components/InstanceNode";
import ResizableNode from "../components/ResizableNode";
import {
  handleConnect,
  handleConnectEnd,
} from "../utils/node/nodeConnectHandlers";
import { useClassGraph } from "../context/ClassGraphContext";
import { createInstanceWithAttributes } from "../utils/instanceBuilder";
import { syncMovedNodePositions } from "../utils/node/syncNodePositions";
import { extractSentencesAndBoxes } from "../utils/instanceExtractor";
import { generateImageFromInstanceData } from "../api/generateImage";

const edgeTypes = {
  main: DefaultEdge,
};
const nodeTypes = {
  class: InstanceNode,
  instance: InstanceNode,
  resizable: ResizableNode,
};

const defaultEdgeOptions = {
  type: "main",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#000",
  },
};

function InstanceBoard() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [id, setId, type, setType, ghostPos, setGhostPos, label, setLabel] = useDnD();
  const { classNodes, classEdges } = useClassGraph();

  const onMouseUp = useCallback(
    (event) => {
      event.preventDefault();
      if (!type || !label) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const { newNodes, newEdges } = createInstanceWithAttributes({
        id,
        label,
        type,
        position,
        classNodes,
        classEdges,
        currentNodeCount: nodes.length,
      });

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);

      setType(null);
      setLabel(null);
      setGhostPos({ x: 0, y: 0 });
    },
    [screenToFlowPosition, type, label, classNodes, classEdges, nodes]
  );

  const onConnect = useCallback(
    (params) => handleConnect({ params, nodes, setNodes, setEdges }),
    [nodes, setNodes, setEdges]
  );

  const onConnectEnd = useCallback(
    (event, connectionState) =>
      handleConnectEnd({
        event,
        connectionState,
        type: "instance",
        nodes,
        setNodes,
        setEdges,
        screenToFlowPosition,
      }),
    [nodes, setNodes, setEdges, screenToFlowPosition]
  );

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
    [onNodesChange, edges]
  );

  const handleClick = () => {
    const result = extractSentencesAndBoxes(nodes, edges, {nodes: classNodes, edges: classEdges});
    console.log(result.sentences);
    console.log(result.boxes);

    const imageData = generateImageFromInstanceData(result.sentences, result.boxes);
    console.log(imageData);
    
  };

  return (
    <div className="reactflow-wrapper" onMouseUp={onMouseUp}>
      <div>
        <button
          onClick={handleClick}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#f0f0f0",
          }}
        >
          이미지 만들기
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}

function InstanceBoardWithProvider() {
  const [id, setId, type, setType, ghostPos, setGhostPos, label, setLabel] = useDnD();

  return (
    <ReactFlowProvider debounce={200}>
      <InstanceBoard
        type={type}
        ghostPos={ghostPos}
        setGhostPos={setGhostPos}
        setType={setType}
        label={label}
        setLabel={setLabel}
      />
    </ReactFlowProvider>
  );
}

export default InstanceBoardWithProvider;
