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
import {
  syncMovedNodePositions,
  syncParentChildNodePositions,
} from "../utils/node/syncNodePositions.js";
import { convertClassGroup } from "../utils/group/convertClassGroup.js";
import { getParentNodeForPosition } from "../utils/node/getParentNodeForPosition.js";

import { sortNodesByDepth } from "../utils/node/sortNodeByDepth.js";
const edgeTypes = {
  main: DefaultEdge,
};

const nodeTypes = {
  "object-group": ClassGroupNode,
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

export function getVisibleNodes(allNodes) {
  // 모든 collapsed 노드 ID를 미리 수집
  const collapsedSet = new Set(
    allNodes
      .filter((n) => n.type === "object-group" && n.data?.collapsed)
      .map((n) => n.id)
  );

  // 재귀적으로 조상을 따라 올라가면서 하나라도 collapsed면 false 반환
  const isVisible = (node) => {
    let current = node;

    while (current?.parentNode) {
      if (collapsedSet.has(current.parentNode)) return false;
      current = allNodes.find((n) => n.id === current.parentNode);
    }

    return true;
  };

  return allNodes.filter(isVisible);
}

function ClassBoard() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { setClassNodes, setClassEdges, setStructuredClasses } =
    useClassGraph();

  const { nodes: initialNodes, edges: initialEdges } = classToFlow(classSample);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setClassNodes(nodes);
    setClassEdges(edges);
    const structuredClasses = convertClassGroup(nodes, edges);
    setStructuredClasses(structuredClasses);

    // console.log("nodes: ", nodes);
    // console.log("edges: ", edges);
    console.log("structured", structuredClasses);
  }, [nodes, edges, setClassNodes, setClassEdges, setStructuredClasses]);

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
      let syncedNodes = syncMovedNodePositions({
        changes,
        prevNodes: nodes,
        edges,
      });
      syncedNodes = syncParentChildNodePositions({
        changes,
        prevNodes: syncedNodes,
      });

      syncedNodes = syncedNodes.map((node) => {
        // if (node.type === "object-group") return node;
        const classNodes = syncedNodes.filter((n) => n.type === "object-group");
        const newParent = getParentNodeForPosition(node, classNodes);
        const newParentNode = classNodes.find((c) => c.id === newParent);

        const prevParent = node.parentNode;
        const prevParentNode = classNodes.find((c) => c.id === prevParent);

        const isPrevCollapsed = prevParentNode?.data?.collapsed;
        const isNewCollapsed = newParentNode?.data?.collapsed;

        // ✅ 이전에 속한 parent가 collapse 중이면 무조건 유지
        if (isPrevCollapsed) return node;

        // ✅ 새로 들어갈 parent가 collapsed 상태면 막음 (선택사항)
        if (isNewCollapsed) return node;

        // ✅ parent가 달라졌을 때만 변경
        if (newParent !== prevParent) {
          return {
            ...node,
            parentNode: newParent || undefined,
            extent: newParent ? "parent" : undefined,
          };
        }

        return node;
      });

      // console.log("Final synced", syncedNodes);
      const sorted = sortNodesByDepth(syncedNodes); // ✅ 깊이순 정렬
      console.log("sorted", sorted);
      setNodes(sorted);
      onNodesChange(changes);
    },
    [nodes, setNodes, onNodesChange, edges]
  );

  const handleAddNode = () => {
    const newId = `class-${nodes.length + 1}`;
    const newNode = {
      id: newId,
      type: "object-group",
      position: {
        x: 0,
        y: -150, // 아래로 계속 쌓이게
      },
      data: {
        label: `New Node ${nodes.length + 1}`,
        collapsed: false,
        expandedHeight: 20,
        type: "object",
      },
    };

    setNodes((prev) => [...prev, newNode]);
  };
  return (
    <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px" }}>
        <button onClick={handleAddNode}>➕ 새 노드 추가</button>
      </div>
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
          nodeOrigin={[0, 0]} // 노드 중앙 기준
          proOptions={{ hideAttribution: true }}
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
