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
import { handleConnect, handleConnectEnd } from "../utils/nodeConnectHandlers";
import { useClassGraph } from "../context/ClassGraphContext";
import { createInstanceWithAttributes } from "../utils/instanceBuilder";
import { syncMovedNodePositions } from "../utils/syncNodePositions";

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
  const [type, setType, ghostPos, setGhostPos, label, setLabel] = useDnD();
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

  console.log("nodes", nodes);
  console.log("edges", edges);

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

  return (
    <div className="reactflow-wrapper" onMouseUp={onMouseUp}>
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
  const [type, setType, ghostPos, setGhostPos, label, setLabel] = useDnD();

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
