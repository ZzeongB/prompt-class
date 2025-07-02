import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { classToFlow } from "../utils/flowUtils";
import { classSample } from "../classSample.ts";
import { DefaultEdge, defaultEdgeOptions } from "../components/DefaultEdge";
import ClassNode from "../components/nodes/ClassNode";
import ClassGroupNode from "../components/nodes/ClassGroupNode";
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
import {
  OBJ_COLOR,
  OBJ_COLOR_TRANS,
  BACKGROUND_COLOR,
} from "../utils/constants.js";
import CustomButton from "../components/CustomButton.js";
import { Plus, Box, FolderPlus } from "lucide-react";

const edgeTypes = {
  main: DefaultEdge,
};

const baseGhostStyle = {
  padding: 4,
  border: "2px solid",
  borderRadius: 3,
  backgroundColor: BACKGROUND_COLOR,
  opacity: 0.6,
  pointerEvents: "none",
  userSelect: "none",
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
  fontSize: "8px",
};

const ghostNodeStyles = {
  class: {
    ...baseGhostStyle,
    borderColor: OBJ_COLOR, // 예: object용 붉은 계열
  },
  "object-group": {
    ...baseGhostStyle,
    borderColor: OBJ_COLOR_TRANS, // 기존 색상 유지
  },
};

const nodeTypes = {
  "object-group": ClassGroupNode,
  class: ClassNode,
  instance: ClassNode,
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
  const [ghostNode, setGhostNode] = useState(null); // ghostNode for Node Addition

  useEffect(() => {
    setClassNodes(nodes);
    setClassEdges(edges);
    const structuredClasses = convertClassGroup(nodes, edges);
    setStructuredClasses(structuredClasses);
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

  // //------- Deprecated Method: Add OBJ node when Pane Clicked -------//
  // const handlePaneClick = useCallback(
  //   (event) => {
  //     if (event.button !== 0) return;

  //     const position = screenToFlowPosition({
  //       x: event.clientX,
  //       y: event.clientY,
  //     });

  //     const newNode = createNewObjectNode({
  //       position,
  //       currentNodeCount: nodes.length,
  //     });

  //     if (newNode) {
  //       setNodes((nds) => [...nds, newNode]);
  //     }
  //   },
  //   [screenToFlowPosition, nodes.length, setNodes]
  // );

  const handleNodesChange = useCallback(
    (changes) => {
      // 1. 위치 이동 동기화
      let nextNodes = syncMovedNodePositions({
        changes,
        prevNodes: nodes,
        edges,
      });

      // 2. 자식 노드 위치 동기화
      nextNodes = syncParentChildNodePositions({
        changes,
        prevNodes: nextNodes,
      });

      // 3. 부모 할당 다시 계산
      const classGroupNodes = nextNodes.filter(
        (n) => n.type === "object-group"
      );

      nextNodes = nextNodes.map((node) => {
        const newParent = getParentNodeForPosition(node, classGroupNodes);
        const prevParent = node.parentNode;

        if (newParent === prevParent) return node;

        const prevParentNode = classGroupNodes.find((n) => n.id === prevParent);
        const newParentNode = classGroupNodes.find((n) => n.id === newParent);

        const wasCollapsed = prevParentNode?.data?.collapsed;
        const willCollapse = newParentNode?.data?.collapsed;

        // 이전 parent가 collapse 상태면 그대로 유지
        if (wasCollapsed) return node;

        // 새 parent가 collapsed면 무시 (선택사항)
        if (willCollapse) return node;

        return {
          ...node,
          parentNode: newParent || undefined,
          extent: newParent ? "parent" : undefined,
        };
      });

      // 4. 깊이순 정렬
      const sorted = sortNodesByDepth(nextNodes);

      // 5. 반영
      setNodes(sorted);
      onNodesChange(changes);
    },
    [nodes, edges, setNodes, onNodesChange]
  );

  const handleAddObjectNode = () => {
    setGhostNode({
      id: `ghost-${Date.now()}`,
      type: "class",
      data: {
        label: "New Object",
        collapsed: false,
        expandedHeight: 70,
        type: "object",
        justCreated: true,
      },
      position: { x: 0, y: 0 },
    });
  };

  const handleAddGroupNode = () => {
    setGhostNode({
      id: `ghost-${Date.now()}`,
      type: "object-group",
      data: {
        label: "New Group",
        collapsed: false,
        expandedHeight: 70,
        type: "object",
        justCreated: true,
      },
      position: { x: 0, y: 0 },
    });
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!ghostNode) return;

      setGhostNode((prev) => ({
        ...prev,
        position: { x: e.clientX, y: e.clientY },
      }));
    },
    [ghostNode, screenToFlowPosition]
  );

  const handleGhostClick = (e) => {
    if (!ghostNode) return;
    e.preventDefault();

    const newId = `class-${nodes.length + 1}`;
    const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode = {
      ...ghostNode,
      id: newId,
      position: flowPos,
    };

    setNodes((prev) => [...prev, newNode]);
    setGhostNode(null);
  };

  return (
    <div
      className="reactflow-wrapper"
      ref={reactFlowWrapper}
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      onMouseMove={handleMouseMove}
      onClick={ghostNode ? handleGhostClick : undefined}
    >
      <div style={{ padding: "5px" }}>
        <CustomButton onClick={handleAddObjectNode} color="object" size="md">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "bold",
            }}
          >
            <Plus size={14} strokeWidth={2.5} color="#1a1a1a" />
            Object
          </span>
        </CustomButton>

        <CustomButton onClick={handleAddGroupNode} color="group" size="md">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "bold",
            }}
          >
            <FolderPlus size={14} strokeWidth={2.5} color="#1a1a1a" />
            Group
          </span>
        </CustomButton>
      </div>
      {ghostNode && (
        <div
          style={{
            ...ghostNodeStyles[ghostNode.type],
            left: ghostNode.position.x,
            top: ghostNode.position.y,
          }}
        >
          {ghostNode.data?.label}
        </div>
      )}

      <ReactFlow
        nodes={getVisibleNodes(nodes)}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        // onPaneClick={ghostNode ? undefined : handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        // defaultNodeOptions={defaultNodeOptions}
        fitView
        connectionLineStyle={defaultEdgeOptions.style} // ✅ 이렇게 변경
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
