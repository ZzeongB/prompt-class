import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
  Controls,
  useStore,
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
  const getId = useCallback(() => `randomnode_${uuidv4()}`, []);

  const onMouseUp = useCallback(
    (event) => {
      event.preventDefault();

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const sharedId = getId();
      const newNode_data = {
        id: `${sharedId}-data`,
        type: "instance", // 너가 사용하는 노드 타입
        position,
        data: { label, type, sharedId }, // 👈 여기에 type 정보도 포함!
      };
      const newNode_resizable = {
        id: `${sharedId}-resizable`,
        type: "resizable", // 너가 사용하는 노드 타입
        position: {
          x: position.x,
          y: position.y + 30,},  // Resizable 노드는 아래에 위치},
        data: { label, type, sharedId }, // 👈 여기에 type 정보도 포함!
      };

      setNodes((nds) => [...nds, newNode_data, newNode_resizable]);

      setType(null);
      setLabel(null);
      setGhostPos({ x: 0, y: 0 });
    },
    [screenToFlowPosition, type]
  );

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes); // 1️⃣ ReactFlow 내부 상태 반영
  
    setNodes((prevNodes) => {
      let updated = [...prevNodes];
  
      changes.forEach((change) => {
        if (change.type === "position" && change.position) {
          const movedNode = updated.find((n) => n.id === change.id);
          if (!movedNode?.data?.sharedId) return;
  
          const sharedId = movedNode.data.sharedId;
  
          updated = updated.map((node) => {
            if (node.data?.sharedId === sharedId && node.id !== movedNode.id) {
              const isResizable = node.id.endsWith("resizable");
              return {
                ...node,
                position: {
                  x: change.position.x,
                  y: change.position.y + (isResizable ? 30 : -30),
                },
              };
            }
            return node;
          });
        }
      });
  
      return updated;
    });
  }, [onNodesChange]);
  
  return (
    <div className="reactflow-wrapper" onMouseUp={onMouseUp}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
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
