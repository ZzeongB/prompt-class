import React, { useEffect, useCallback, useRef } from "react";
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
import { syncMovedNodePositions, syncParentChildNodePositions } from "../utils/node/syncNodePositions.js";

const edgeTypes = {
  main: DefaultEdge,
};

const nodeTypes = {
  'class-group': ClassGroupNode,
  class: ClassNode,
  instance: ClassNode,
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

  console.log(allNodes.filter((n) => {
    if (n.type === "class-group") return true;

    return !collapsed.has(n.parentNode);
  }))

  return allNodes.filter((n) => {
    if (n.type === "class-group") return true;

    return !collapsed.has(n.parentNode);
  });
}


function ClassBoard() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { setClassNodes, setClassEdges } = useClassGraph();

  const { nodes: initialNodes, edges: initialEdges } = classToFlow(classSample);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setClassNodes(nodes);
    setClassEdges(edges);
  }, [nodes, edges, setClassNodes, setClassEdges]);

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

  const handleNodesChange = useCallback(
  (changes) => {
    let syncedNodes = syncMovedNodePositions({ changes, prevNodes: nodes, edges });
    syncedNodes = syncParentChildNodePositions({ changes, prevNodes: syncedNodes });

    setNodes(syncedNodes);
    onNodesChange(changes);
  },
  [nodes, setNodes, onNodesChange, edges]
);


  return (
    <div className="reactflow-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={getVisibleNodes(nodes)}
        edges={edges}
        onNodesChange={handleNodesChange}
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

function ClassBoardWithProvider() {
  const [, , type, , ghostPos, setGhostPos, label, setLabel] = useDnD();

  return (
    <ReactFlowProvider>
      <ClassBoard
        type={type}
        ghostPos={ghostPos}
        setGhostPos={setGhostPos}
        label={label}
        setLabel={setLabel}
      />
    </ReactFlowProvider>
  );
}

export default ClassBoardWithProvider;
