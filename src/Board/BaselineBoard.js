import React, { useEffect, useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DefaultEdge, defaultEdgeOptions } from "../components/DefaultEdge";
import ClassNode from "../components/nodes/ClassNode.js";
import ClassGroupNode from "../components/nodes/ClassGroupNode.js";
import { useDnD } from "../context/DragAndDropContext.js";
import { useClassGraph } from "../context/ClassGraphContext.js";
import {
  syncMovedNodePositions,
  syncParentChildNodePositions,
} from "../utils/node/syncNodePositions.js";
import { convertClassGroup } from "../utils/group/convertClassGroup.js";
import { getParentNodeForPosition } from "../utils/node/getParentNodeForPosition.js";
import CustomButton from "../components/CustomButton.js";
import { Plus } from "lucide-react";
import { logEvent } from "../api/logEvent.js";
import { OBJ_COLOR_TRANS, BACKGROUND_COLOR } from "../utils/constants.js";

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
  "object-group": {
    ...baseGhostStyle,
    borderColor: OBJ_COLOR_TRANS, // 기존 색상 유지
  },
};

const edgeTypes = {
  main: DefaultEdge,
};

const nodeTypes = {
  "object-group": ClassGroupNode,
  class: ClassNode,
  instance: ClassNode,
};

function getVisibleNodes(allNodes) {
  const collapsed = new Set(
    allNodes
      .filter((n) => n.type === "object-group" && n.data?.collapsed)
      .map((n) => n.id)
  );

  return allNodes.filter((n) => {
    if (n.type === "object-group") return true;

    return !collapsed.has(n.parentNode);
  });
}

function BaselineBoard() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

  const { setClassNodes, setClassEdges, setStructuredClasses } =
    useClassGraph();
  // const { nodes: initialNodes, edges: initialEdges } = classToFlow(classSample);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [ghostNode, setGhostNode] = useState(null); // ghostNode for Node Addition

  useEffect(() => {
    setClassNodes(nodes);
    setClassEdges(edges);
    const structuredClasses = convertClassGroup(nodes, edges);
    setStructuredClasses(structuredClasses);
  }, [nodes, edges, setClassNodes, setClassEdges, setStructuredClasses]);

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
        if (node.type === "object-group") return node; // class 노드 자체는 대상 아님

        const classNodes = nodes.filter((n) => n.type === "object-group");
        const newParent = getParentNodeForPosition(node, classNodes);

        // parentNode가 변경된 경우만 반영
        if (newParent !== node.parentNode) {
          return {
            ...node,
            parentNode: newParent || undefined,
            extent: newParent ? "parent" : undefined,
          };
        }
        return node;
      });

      setNodes(syncedNodes);
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
        y: 0, // 아래로 계속 쌓이게
      },
      data: {
        label: `New Node ${nodes.length + 1}`,
        collapsed: false,
        expandedHeight: 70,
        type: "object",
      },
    };

    setNodes((prev) => [...prev, newNode]);
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
      measured: { width: 200, height: 150 },
      style: { width: 200, height: 150 },
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

    logEvent("baselineboard.node.add", {
      nodeId: newId,
      type: ghostNode.type,
      label: ghostNode.data.label,
      position: flowPos,
    });
  };

  return (
    <div
      className="reactflow-wrapper"
      ref={reactFlowWrapper}
      onMouseMove={handleMouseMove}
      onClick={ghostNode ? handleGhostClick : undefined}
    >
      <div style={{ padding: "10px" }}>
        <CustomButton onClick={handleAddGroupNode} color="group" size="md">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "bold",
            }}
          >
            <Plus size={14} strokeWidth={2.5} color="#1a1a1a" />
            Node
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
        // onConnect={onConnect}
        // onConnectEnd={onConnectEnd}
        // onPaneClick={handlePaneClick}
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

function BaselineBoardWithProvider() {
  const [, , type, , ghostPos, setGhostPos, label, setLabel] = useDnD();

  return (
    <ReactFlowProvider>
      <BaselineBoard
        type={type}
        ghostPos={ghostPos}
        setGhostPos={setGhostPos}
        label={label}
        setLabel={setLabel}
      />
    </ReactFlowProvider>
  );
}

export default BaselineBoardWithProvider;
