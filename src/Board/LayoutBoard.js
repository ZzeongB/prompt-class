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
import { extractSentencesAndBoxes } from "../utils/instance/instanceExtractor";
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
} from "../utils/layout/handleTempLayout";
import { createInstance } from "../utils/instance/instanceBuilder";
import { generateImageFromInstanceData } from "../api/generateImage";
import ProgressBar from "../components/ProgressBar";

const edgeTypes = {
  main: DefaultEdge,
};
const nodeTypes = {
  class: LayoutNode,
  instance: LayoutNode,
  resizable: ResizableNode,
  tmpResizable: TempResizableNode,
  "instance-group": LayoutNode,
};

const defaultEdgeOptions = {
  type: "main",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#000",
  },
};

function LayoutBoard({ onImageGenerated }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [id, , type, setType, , setGhostPos, label, setLabel] = useDnD();
  const { classNodes, classEdges, structuredClasses } = useClassGraph();
  const { setInstanceNodes, setInstanceEdges } = useInstanceGraph();
  const [dragState, setDragState] = useState(null);
  const [image, setImage] = useState();
  const [globalCaption, setGlobalCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isGenerating) return;
    console.log("isGenerating True");

    const interval = setInterval(async () => {
      const res = await fetch("http://localhost:5000/progress");
      const data = await res.json();
      setProgress(data.progress);

      if (data.progress >= 100) {
        clearInterval(interval);
        setIsGenerating(false); // ✅ 100% 완료 시 자동 종료
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

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

        console.log("Layout newNodes", newNodes);

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
    console.log("input", nodes, structuredClasses, classNodes);

    setProgress(0); // 진행률 초기화
    setIsGenerating(true); // ✅ 진행 시작

    setTimeout(async () => {
      const result = extractSentencesAndBoxes(
        nodes,
        edges,
        classNodes,
        classEdges,
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
      } finally {
        setIsGenerating(false); // ✅ 완료 or 실패 후 종료
      }
    }, 200);
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

      {/* input 필드: 전체 너비 차지 */}
      <div
        style={{
          position: "absolute",
          bottom: "-30px", // 진행 바 + 버튼 위쪽에 위치하도록
          width: "100%",
          // padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        <input
          type="text"
          value={globalCaption}
          onChange={(e) => setGlobalCaption(e.target.value)}
          placeholder="Write global caption here!"
          style={{
            width: "100%",
            // padding: "8px",
            fontSize: "14px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
          onMouseDown={(e) => e.stopPropagation()} // 드래그 방지
        />
      </div>

      {/* 진행 바 + 버튼: 나란히 정렬 */}
      <div
        style={{
          position: "absolute",
          bottom: "-70px",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          // padding: "0 16px",
          boxSizing: "border-box",
        }}
      >
        <ProgressBar
          now={progress}
          // style={{ flex: 1, height: "24px", borderRadius: "12px" }}
        />

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClick}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#fff",
            background: "linear-gradient(135deg, #9A90FF, #63B4FF)",
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
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
