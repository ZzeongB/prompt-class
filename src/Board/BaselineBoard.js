import React, { useEffect, useCallback, useRef } from "react";
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
import {
  handleConnect,
  handleConnectEnd,
} from "../utils/node/nodeConnectHandlers.js";
import { useClassGraph } from "../context/ClassGraphContext.js";
import { createNewObjectNode } from "../utils/node/nodeCreateUtils.js";
import {
  syncMovedNodePositions,
  syncParentChildNodePositions,
} from "../utils/node/syncNodePositions.js";
import { convertClassGroup } from "../utils/group/convertClassGroup.js";
import { getParentNodeForPosition } from "../utils/node/getParentNodeForPosition.js";
import CustomButton from "../components/CustomButton.js";

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
  return (
    <div className="reactflow-wrapper" ref={reactFlowWrapper}>
      <div style={{ padding: "10px" }}>
        <CustomButton onClick={handleAddNode} color="purpleBlue" size="md">
          새 노드 추가
        </CustomButton>
      </div>

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
