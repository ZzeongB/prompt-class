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


function InstanceBoard() {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const { classNodes, classEdges } = useClassGraph();
  const { instanceNodes, instanceEdges } = useInstanceGraph();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [collapsedClassMap, setCollapsedClassMap] = useState({});
  const [filledAttrMap, setFilledAttrMap] = useState({});

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
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges, filledAttrMap: newFilledAttrMap } = getRenderedInstanceBoard({
      instanceNodes,
      classNodes,
      classEdges,
      screenToFlowPosition,
      collapsedClassMap,
      filledAttrMap,
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setFilledAttrMap(newFilledAttrMap)
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
>
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
  panOnScroll={true}             // ✅ 스크롤로 pan 허용
  panOnScrollMode="vertical"    // ✅ 세로 방향만 허용
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
