import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
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
import InstanceNode from "../components/InstanceNode.js";
import {
  syncMovedNodePositions,
  syncParentChildNodePositions,
} from "../utils/node/syncNodePositions.js";
import { getRenderedInstanceBoard } from "../utils/getRenderedInstanceBoard.js";

const edgeTypes = {
  main: DefaultEdge,
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

  const [collapsedClassMap, setCollapsedClassMap] = useState({});

  // useEffect(() => {
  //   console.log("InstanceBoard mounted", nodes.filter((n) => n.type === "instance-group"));
  // }, [nodes]);

  const nodeTypes = useMemo(
    () => ({
      "object-group": ClassGroupNode,
      "instance-group": (props) => (
        <InstanceGroupNode
          {...props}
          setCollapsedClassMap={setCollapsedClassMap}
        />
      ),
      class: ClassNode,
      instance: InstanceNode,
    }),
    [setCollapsedClassMap]
  );
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getRenderedInstanceBoard({
      instanceNodes,
      classNodes,
      classEdges,
      screenToFlowPosition,
      collapsedClassMap,
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [instanceNodes, classNodes, classEdges]);

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
        nodeOrigin={[0, 0]} // 노드 중앙 기준
        proOptions={{ hideAttribution: true }}

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
