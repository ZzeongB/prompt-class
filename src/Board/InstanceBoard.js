import React, {
  useEffect,
  useCallback,
  useRef,
  useState,
  useMemo,
} from "react";
import isEqual from "lodash.isequal";

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
import ClassNode from "../components/nodes/ClassNode";
import ClassGroupNode from "../components/nodes/ClassGroupNode";
import InstanceGroupNode from "../components/nodes/InstanceGroupNode";
import { useDnD } from "../context/DragAndDropContext";
import {
  handleConnect,
  handleConnectEnd,
} from "../utils/node/nodeConnectHandlers";
import { useClassGraph } from "../context/ClassGraphContext";
import { useInstanceGraph } from "../context/InstanceGraphContext.js";
import InstanceNode from "../components/nodes/InstanceNode.js";
import {
  syncMovedNodePositions,
  syncParentChildNodePositions,
} from "../utils/node/syncNodePositions.js";
import { getRenderedInstanceBoard } from "../utils/instance/getRenderedInstanceBoard.js";

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

function markHiddenNodes(allNodes) {
  const collapsed = new Set(
    allNodes
      .filter((n) => n.type === "instance-group" && n.data?.collapsed)
      .map((n) => n.id)
  );

  return allNodes.map((n) => {
    const isHidden = collapsed.has(n.parentNode);
    return {
      ...n,
      hidden: isHidden,
      style: {
        ...n.style,
        opacity: isHidden ? 0 : 1,
        pointerEvents: isHidden ? "none" : "auto",
      },
    };
  });
}

function extractNodeSummary(nodes) {
  return nodes.map((n) => ({
    id: n.id,
    label: n.data.label,
    type: n.data.type,
    hasValue: n.data.hasValue ?? null,
    parentNode: n.parentNode ?? null,
  }));
}

function InstanceBoard() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { classNodes, classEdges } = useClassGraph();
  const { instanceNodes, instanceEdges } = useInstanceGraph();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [collapsedClassMap, setCollapsedClassMap] = useState({});
  const [filledAttrMap, setFilledAttrMap] = useState({});
  const prevClassRef = useRef({
    nodeSummary: [],
    edgeSummary: [],
  });

  // useEffect(() => {
  //   console.log("InstanceBoard mounted", nodes);
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
  // classGraph 변경 감지 (중요 필드만)
  useEffect(() => {
    const nodeSummary = extractNodeSummary(classNodes);
    const edgeSummary = classEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label ?? null,
    }));

    const classChanged =
      !isEqual(prevClassRef.current.nodeSummary, nodeSummary) ||
      !isEqual(prevClassRef.current.edgeSummary, edgeSummary);

    if (!classChanged) return;

    prevClassRef.current = {
      nodeSummary,
      edgeSummary,
    };

    const {
      nodes: newNodes,
      edges: newEdges,
      filledAttrMap: newFilledAttrMap,
    } = getRenderedInstanceBoard({
      instanceNodes,
      classNodes,
      classEdges,
      screenToFlowPosition,
      collapsedClassMap,
      filledAttrMap,
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setFilledAttrMap(newFilledAttrMap);
  }, [classNodes, classEdges]);

  // instanceNodes 바뀔 때는 무조건 반영
  useEffect(() => {
    const {
      nodes: newNodes,
      edges: newEdges,
      filledAttrMap: newFilledAttrMap,
    } = getRenderedInstanceBoard({
      instanceNodes,
      classNodes,
      classEdges,
      screenToFlowPosition,
      collapsedClassMap,
      filledAttrMap,
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setFilledAttrMap(newFilledAttrMap);
  }, [instanceNodes]);

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
    <div className="reactflow-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={markHiddenNodes(nodes)}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={{ stroke: "#000" }}
        connectionLineType="bezier"
        nodeOrigin={[0, 0]}
        proOptions={{ hideAttribution: true }}
        fitView={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnScroll={true} // ✅ 스크롤로 pan 허용
        panOnScrollMode="vertical" // ✅ 세로 방향만 허용
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
