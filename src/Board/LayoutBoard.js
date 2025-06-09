import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDnD } from "../context/DragAndDropContext";
import DefaultEdge from "../components/DefaultEdge";
import LayoutNode from "../components/LayoutNode";
import ResizableNode from "../components/ResizableNode";
import TempResizableNode from "../components/TempResizableNode";
import {
  handleConnect,
  handleConnectEnd,
} from "../utils/node/nodeConnectHandlers";
import { useClassGraph } from "../context/ClassGraphContext";
import { useInstanceGraph } from "../context/InstanceGraphContext";
import { useImage } from "../context/ImageContext";
import { syncMovedNodePositions } from "../utils/node/syncNodePositions";
import { extractSentencesAndBoxes } from "../utils/instanceExtractor";
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "../utils/layout/handleTempLayout";
import { createInstance } from "../utils/instanceBuilder";
import { generateImageFromInstanceData } from "../api/generateImage";

const edgeTypes = {
  main: DefaultEdge,
};
const nodeTypes = {
  class: LayoutNode,
  instance: LayoutNode,
  resizable: ResizableNode,
  tmpResizable: TempResizableNode,
};

const defaultEdgeOptions = {
  type: "main",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#000",
  },
};

function LayoutBoard({ onImageGenerated }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([
    //     {
    // data: {label: "resizable", type: "object-group", sharedId: "global", classId: "none", instanceId: "global"},
    // id: "global-resizable",
    // measured: {width: 500, height: 500},
    // position: {x: 5, y: 5},
    // type: "resizable"
    //     },{
    // data: {label: "Write global caption here!", type: "object-group", sharedId: "global", classId: "none", instanceId: "global"},
    // id: "global",
    // measured: {width: 62, height: 38},
    // position: {x: 0, y: 0},
    // type: "instance",
    // updatedAt: "2025-05-30T04:43:02.682Z"}
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [id, , type, setType, , setGhostPos, label, setLabel] = useDnD();
  const { classNodes, classEdges, structuredClasses } = useClassGraph();
  const { setInstanceNodes, setInstanceEdges } = useInstanceGraph();
  const [dragState, setDragState] = useState(null);
  const [image, setImage] = useState();
  const [globalCaption, setGlobalCaption] = useState("");

  const onMouseDown = (e) => {
    handleMouseDown(e, setDragState);
  };

  const onMouseMove = (e) => {
    handleMouseMove(e, dragState, setDragState);
  };

  const onMouseUp = (event) => {
    if (dragState?.rect && dragState?.start) {
      console.log("dragState", dragState);
      handleMouseUp(
        dragState,
        setDragState,
        screenToFlowPosition,
        nodes,
        setNodes
      );
      return;
    } else {
      if (id && type) {
        // 기존 노드들의 라벨 모음
        const existingLabels = nodes.map((n) => n.data?.label).filter(Boolean);

        // 중복 라벨 처리
        let baseLabel = label;
        let uniqueLabel = baseLabel;
        let count = 1;

        while (existingLabels.includes(uniqueLabel)) {
          uniqueLabel = `${baseLabel}${count}`;
          count++;
        }

        const { newNodes, newEdges, _ } = createInstance(
          event,
          id,
          uniqueLabel,
          type,
          screenToFlowPosition,
          nodes,
          classNodes,
          classEdges
        );

        setNodes((prevNodes) => [...prevNodes, ...newNodes]);
        setEdges((prevEdges) => [...prevEdges, ...newEdges]);

        setInstanceNodes((prevNodes) => [...prevNodes, ...newNodes]);
        setInstanceEdges((prevEdges) => [...prevEdges, ...newEdges]);

        setType(null);
        setLabel(null);
        setGhostPos({ x: 0, y: 0 });
      }
    }
  };

  const onConnect = useCallback(
    (params) => handleConnect({ params, nodes, setNodes, setEdges }),
    [nodes, setNodes, setEdges]
  );

  const onConnectEnd = useCallback(
    (event, connectionState) =>
      handleConnectEnd({
        event,
        connectionState,
        type: "instance",
        nodes,
        setNodes,
        setEdges,
        screenToFlowPosition,
      }),
    [nodes, setNodes, setEdges, screenToFlowPosition]
  );

  const handleNodesChange = useCallback(
    (changes) => {
      setNodes((prevNodes) =>
        syncMovedNodePositions({
          changes,
          prevNodes,
          edges,
        })
      );

      onNodesChange(changes);
    },
    [onNodesChange, edges, setNodes]
  );

  const handleClick = async () => {
    const result = extractSentencesAndBoxes(
      nodes,
      edges,
      structuredClasses,
      flowToScreenPosition
    );

    console.log("result", result);

    try {
      const response = await generateImageFromInstanceData(
        result.sentences,
        result.boxes,
        globalCaption
      );

      console.log("response", response);
      onImageGenerated(response.image); // 이미지 생성 후 부모 컴포넌트에 전달
      setImage(response.image); // 상태 업데이트
      setGlobalCaption(response.globalCaption); // 상태 업데이트
    } catch (err) {
      console.error("Image generation failed", err);
    }
  };

  return (
    <div
      className="reactflow-wrapper"
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      style={{ userSelect: "none" }}
    >
      {dragState?.rect && (
        <div
          style={{
            position: "absolute",
            top: `${dragState.rect.y - 40}px`,
            left: `${dragState.rect.x - 660}px`,
            width: `${dragState.rect.width}px`,
            height: `${dragState.rect.height}px`,
            border: "1px dashed #007bff",
            backgroundColor: "rgba(0, 123, 255, 0.05)",
            zIndex: 1000,
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          bottom: "-30px",
          width: "100%",
          display: "flex",
        }}
      >
        <input
          type="text"
          value={globalCaption}
          onChange={(e) => setGlobalCaption(e.target.value)}
          placeholder="Write global caption here!"
          style={{
            width: "100%",
            padding: "5px",
            // marginBottom: "10px",
            fontSize: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
          onMouseDown={(e) => e.stopPropagation()} // 드래그 방지
        />

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClick}
          style={{
            padding: "10px 24px",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#fff",
            background: "linear-gradient(135deg, #9A90FF, #63B4FF)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            position: "absolute",
            bottom: "-40px",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "translateY(-3px)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          이미지 만들기
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        panOnDrag={false}
        panOnScroll={false}
        selectNodesOnDrag={false} // ✅ 선택 드래그 방지
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        nodeDragBounds={{
          left: 0,
          top: 0,
          right: 512,
          bottom: 512,
        }}
        translateExtent={[
          [0, 0],
          [512, 512],
        ]}
        nodeExtent={[
          [-50, -50],
          [540, 540],
        ]} // 노드 배치 가능한 범위 제한
        proOptions={{ hideAttribution: true }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      />
    </div>
  );
}

function LayoutBoardWithProvider({ onImageGenerated }) {
  const [, , type, setType, ghostPos, setGhostPos, label, setLabel] = useDnD();

  return (
    <ReactFlowProvider debounce={200}>
      <LayoutBoard
        type={type}
        ghostPos={ghostPos}
        setGhostPos={setGhostPos}
        setType={setType}
        label={label}
        setLabel={setLabel}
        onImageGenerated={onImageGenerated}
      />
    </ReactFlowProvider>
  );
}

export default LayoutBoardWithProvider;
