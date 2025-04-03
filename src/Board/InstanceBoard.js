import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { useDnD } from "../hooks/useDnD";
import DefaultEdge from "../components/DefaultEdge";
import InstanceNode from "../components/InstanceNode";
import ResizableNode from "../components/ResizableNode";

const edgeTypes = {
  main: DefaultEdge,
};
const nodeTypes = {
  class: InstanceNode,
  instance: InstanceNode,
  ResizableNode: ResizableNode,
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
  const getId = useCallback(() => `randomnode_${uuidv4()}`, []);

  useEffect(() => {
    console.log("nodes", nodes);
    console.log("edges", edges);
  }, [nodes, edges]);

  const onMouseUp = useCallback(
    (event) => {
      event.preventDefault();

      console.log("onMouseUp", type, ghostPos);

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type: "instance", // 너가 사용하는 노드 타입
        position,
        data: { label, type }, // 👈 여기에 type 정보도 포함!
      };

      setNodes((nds) => nds.concat(newNode));

      setType(null);
      setLabel(null);
      setGhostPos({ x: 0, y: 0 });
    },
    [screenToFlowPosition, type]
  );

  return (
    <div className="reactflow-wrapper" onMouseUp={onMouseUp}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
