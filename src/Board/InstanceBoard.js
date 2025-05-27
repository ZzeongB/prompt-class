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
import InstanceGroupNode from "../components/InstanceGroupNode";
import { useDnD } from "../context/DragAndDropContext";
import {
  handleConnect,
  handleConnectEnd,
} from "../utils/node/nodeConnectHandlers";
import { useClassGraph } from "../context/ClassGraphContext";
import { useInstanceGraph } from "../context/InstanceGraphContext.js";
import { createNewObjectNode } from "../utils/node/nodeCreateUtils";
import { createInstance } from "../utils/instanceBuilder";
import InstanceNode from "../components/InstanceNode.js";
import {
  syncMovedNodePositions,
  syncParentChildNodePositions,
} from "../utils/node/syncNodePositions.js";
import { recalculateLayout } from "../utils/recalculateLayout.js";

const edgeTypes = {
  main: DefaultEdge,
};

const nodeTypes = {
  "object-group": ClassGroupNode,
  "instance-group": InstanceGroupNode,
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
      .filter((n) => n.type === "instance-group" && n.data?.collapsed)
      .map((n) => n.id)
  );

  return allNodes.filter((n) => {
    if (n.type === "instance-group") return true;
    return !collapsed.has(n.parentNode);
  });
}

function InstanceBoard() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { classNodes, classEdges } = useClassGraph();
  const { instanceNodes, instanceEdges } = useInstanceGraph();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const processedInstanceIds = useRef(new Set());
  const nodePositionMap = useRef(new Map()); // id -> {x, y}
  const gapY = 100; // Y 간격

  useEffect(() => {
    const newNodesToAdd = [];
    const newEdgesToAdd = [];

    const filteredInstanceNodes = instanceNodes.filter(
      (node) => node.type !== "resizable"
    );

    filteredInstanceNodes.forEach((node, index) => {
      if (processedInstanceIds.current.has(node.id)) return; // skip already handled
      console.log("Processeed Instance Node:", processedInstanceIds.current);

      const classNode = classNodes.find((c) => c.id === node.data?.classId);
      if (!classNode) return;

      if (!nodePositionMap.current.has(node.id)) {
        const position = {
          x: 200,
          y: 200 + index * gapY,
        };
        nodePositionMap.current.set(node.id, position);
      }
      const finalPosition = nodePositionMap.current.get(node.id);

      const { newNodes, newEdges } = createInstance(
        finalPosition,
        classNode.id,
        classNode.data.label || "New Instance",
        classNode.type || "object",
        screenToFlowPosition,
        nodes,
        classNodes,
        classEdges,
        false // resizable
      );

      newNodesToAdd.push(...newNodes);
      newEdgesToAdd.push(...newEdges);

      processedInstanceIds.current.add(node.id);
    });

    if (newNodesToAdd.length > 0) {
      setNodes((prev) => {
        console.log("Adding new nodes:", newNodesToAdd);
        const updated = [...prev, ...newNodesToAdd];

        // Recalculate layout after adding new nodes
        return recalculateLayout({ nodes: updated });
        // return updated;
      });
    }
    if (newEdgesToAdd.length > 0) {
      setEdges((prev) => [...prev, ...newEdgesToAdd]);
    }
  }, [instanceNodes, classNodes, classEdges]);

  // useEffect(() => {
  //   setNodes((prev) => {
  //     recalculateLayout({ nodes: prev });
  //   });
  // }, [nodes, edges]);

  // useEffect(() => {
  //   setClassNodes(nodes);
  //   setClassEdges(edges);
  // }, [nodes, edges, setClassNodes, setClassEdges]);

  // //--------- Handle drag and drop ---------
  // const [id, , type, setType, , setGhostPos, label, setLabel, dragSource, ] = useDnD();

  // const onMouseUp = (event) => {
  //   if (dragSource !== "class") return;
  //   if (id && type) {
  //     const { newNodes, newEdges } = createInstance(
  //       event,
  //       id,
  //       label,
  //       type,
  //       screenToFlowPosition,
  //       nodes,
  //       classNodes,
  //       classEdges,
  //       false, // resizable
  //     );

  //     setNodes((prevNodes) => [...prevNodes, ...newNodes]);
  //     setEdges((prevEdges) => [...prevEdges, ...newEdges]);

  //     setType(null);
  //     setLabel(null);
  //     setGhostPos({ x: 0, y: 0 });
  //   }
  // }\
  //  ---------------------------

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

  // const handleToggleCollapse = (id) => {
  //   setNodes(
  //     nodes.map((node) => {
  //       if (node.id === id) {
  //         const isCollapsed = !node.data?.collapsed;
  //         return {
  //           ...node,
  //           data: {
  //             ...node.data,
  //             collapsed: isCollapsed,
  //           },
  //           style: {
  //             ...node.style,
  //             height: isCollapsed ? 50 : node.data?.expandedHeight ?? 200,
  //           },
  //         };
  //       }
  //       return node;
  //     })
  //   );
  // };

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
      let syncedNodes = syncMovedNodePositions({
        changes,
        prevNodes: nodes,
        edges,
      });
      syncedNodes = syncParentChildNodePositions({
        changes,
        prevNodes: syncedNodes,
      });

      setNodes(syncedNodes);
      onNodesChange(changes);
    },
    [nodes, setNodes, onNodesChange, edges]
  );

  return (
    <div
      className="reactflow-wrapper"
      ref={reactFlowWrapper}
      // onMouseUp={onMouseUp}
    >
      <ReactFlow
        nodes={getVisibleNodes(nodes)}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        // onPaneClick={handlePaneClick}
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
