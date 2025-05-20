import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { classToFlow } from "../utils/flowUtils";
import { classSample } from "../classSample.ts";
import DefaultEdge from "../components/DefaultEdge";
import ClassNode from "../components/ClassNode";
import ClassGroupNode from "../components/ClassGroupNode";
import { useDnD } from "../context/DragAndDropContext";
import {
  handleConnect,
  handleConnectEnd,
} from "../utils/node/nodeConnectHandlers";
import { useClassGraph } from "../context/ClassGraphContext";
import { createNewObjectNode } from "../utils/node/nodeCreateUtils";
import { createInstance } from "../utils/instanceBuilder";
import InstanceNode from "../components/InstanceNode.js";

const edgeTypes = {
  main: DefaultEdge,
};

const nodeTypes = {
  "class-group": ClassGroupNode,
  class: ClassNode,
  instance: InstanceNode,
};

const defaultEdgeOptions = {
  type: "main",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#000",
  },
};

function getVisibleNodes(allNodes) {
  const collapsed = new Set(
    allNodes
      .filter((n) => n.type === "class-group" && n.data?.collapsed)
      .map((n) => n.id)
  );

  return allNodes.filter((n) => {
    if (n.type === "class-group") return true;
    return !collapsed.has(n.parentNode);
  });
}

function InstanceBoard() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { classNodes, classEdges, setClassNodes, setClassEdges } =
    useClassGraph();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    setClassNodes(nodes);
    setClassEdges(edges);
  }, [nodes, edges, setClassNodes, setClassEdges]);

  // Handle drag and drop
  const [id, , type, setType, , setGhostPos, label, setLabel] = useDnD();

  const onMouseUp = (event) => {
    if (id && type) {
      const { newNodes, newEdges } = createInstance(
        event,
        id,
        label,
        type,
        screenToFlowPosition,
        nodes,
        classNodes,
        classEdges,
        false, // resizable
      );

      setNodes((prevNodes) => [...prevNodes, ...newNodes]);
      setEdges((prevEdges) => [...prevEdges, ...newEdges]);

      setType(null);
      setLabel(null);
      setGhostPos({ x: 0, y: 0 });
    }
  };
  const onConnect = useCallback(
    (params) => handleConnect({ params, nodes, setNodes, setEdges }),
    [nodes, setNodes, setEdges]
  );

  const onConnectEnd = useCallback(
    (event, connectionState) =>
      handleConnectEnd({
        event,
        connectionState,
        type: "class",
        nodes,
        setNodes,
        setEdges,
        screenToFlowPosition,
      }),
    [nodes, setNodes, setEdges, screenToFlowPosition]
  );

  const handlePaneClick = useCallback(
    (event) => {
      if (event.button !== 0) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = createNewObjectNode({
        position,
        currentNodeCount: nodes.length,
      });

      if (newNode) {
        setNodes((nds) => [...nds, newNode]);
      }
    },
    [screenToFlowPosition, nodes.length, setNodes]
  );

  return (
    <div
      className="reactflow-wrapper"
      ref={reactFlowWrapper}
      onMouseUp={onMouseUp}
    >
      <ReactFlow
        nodes={getVisibleNodes(nodes)}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        // defaultNodeOptions={defaultNodeOptions}
        fitView
        connectionLineStyle={{ stroke: "#000" }}
        connectionLineType="bezier"
        nodeOrigin={[0.5, 0.5]} // 노드 중앙 기준
      />
    </div>
  );
}

function InstanceBoardWithProvider() {
  const [, , type, , ghostPos, setGhostPos, label, setLabel] = useDnD();

  return (
    <ReactFlowProvider>
      <InstanceBoard
        type={type}
        ghostPos={ghostPos}
        setGhostPos={setGhostPos}
        label={label}
        setLabel={setLabel}
      />
    </ReactFlowProvider>
  );
}

export default InstanceBoardWithProvider;
