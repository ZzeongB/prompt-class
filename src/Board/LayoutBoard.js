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
import { DefaultEdge, defaultEdgeOptions } from "../components/DefaultEdge";
import LayoutNode from "../components/nodes/LayoutNode";
import ResizableNode from "../components/nodes/ResizableNode";
import TempResizableNode from "../components/nodes/TempResizableNode";
import {
  handleConnect,
  handleConnectEnd,
} from "../utils/node/nodeConnectHandlers";
import { useClassGraph } from "../context/ClassGraphContext";
import { useInstanceGraph } from "../context/InstanceGraphContext";
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
import CustomButton from "../components/CustomButton";
import { useImage } from "../context/ImageContext";
import { logEvent } from "../api/logEvent";
import { LEFT_OFFSET, TOP_OFFSET } from "../utils/constants";

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

function LayoutBoard({ onImageGenerated }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [id, , type, setType, , setGhostPos, label, setLabel] = useDnD();
  const { classNodes, classEdges, structuredClasses } = useClassGraph();
  const { setInstanceNodes, setInstanceEdges, instanceAttrMap } = useInstanceGraph();
  const [dragState, setDragState] = useState(null);
  const [imageBoard, setImageBoard] = useState();
  const [globalCaption, setGlobalCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);

  const { image, setImage } = useImage();

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(async () => {
      const res = await fetch("http://127.0.0.1:5000/progress");
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
    if (isSelectingRegion) {
      handleMouseDown(e, setDragState);
    }
  };

  const onMouseMove = (e) => {
    handleMouseMove(e, dragState, setDragState);
  };

  const onMouseUp = (event) => {
    if (dragState?.rect && dragState?.start) {
      handleMouseUp(
        dragState,
        setDragState,
        screenToFlowPosition,
        nodes,
        setNodes
      );

      setIsSelectingRegion(false);

      // 드래그로 임시 노드 생성 로그
      logEvent("layoutboard.tmp_node.created", {
        x: dragState.start.x,
        y: dragState.start.y,
        width: dragState.rect.width,
        height: dragState.rect.height,
      });
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
          uniqueLabel = `${baseLabel} ${count}`;
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

        logEvent("layoutboard.node.add.instantance", {
          classId: id,
          instanceLabel: uniqueLabel,
          createdNodeIds: newNodes.map((n) => n.id),
        });

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
    (event, connectionState) => {
      const result = handleConnectEnd({
        event,
        connectionState,
        type: "instance",
        nodes,
        setNodes,
        setEdges,
        screenToFlowPosition,
      });

      // result.newNodes를 반환받는다고 가정
      if (result?.newNodes) {
        setInstanceNodes((prev) => [...prev, ...result.newNodes]);
        setInstanceEdges((prev) => [...prev, ...(result.newEdges || [])]);
      }
    },
    [
      nodes,
      setNodes,
      setEdges,
      screenToFlowPosition,
      setInstanceNodes,
      setInstanceEdges,
    ]
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
    setProgress(0);
    setIsGenerating(true);
    setErrorMessage();

    const startTime = performance.now();

    // ✅ 입력 정보 저장
    const inputSnapshot = {
      nodes,
      edges,
      classNodes,
      classEdges,
    };

    logEvent("imagegen.started", {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      inputs: inputSnapshot,
    });

    setTimeout(async () => {
      const result = extractSentencesAndBoxes(
        nodes,
        edges,
        classNodes,
        classEdges,
        flowToScreenPosition,
        LEFT_OFFSET,
        TOP_OFFSET,
        instanceAttrMap
      );

      logEvent("imagegen.extracted", {
        sentences: result.sentences,
        boxes: result.boxes,
        required_keywords: result.labels,
      });

      try {
        const response = await generateImageFromInstanceData(
          result.sentences,
          result.boxes,
          globalCaption, // global caption placeholder
          result.labels
        );

        const durationMs = performance.now() - startTime;

        logEvent("imagegen.succeeded", {
          durationMs,
          image_size: response.image.length,
          global_caption: response.globalCaption,
          refined_caption: response.refinedCaptions,
          // output_preview: {
          //   sentences: result.sentences.slice(0, 3),
          //   boxes: result.boxes.slice(0, 3),
          // },
        });

        onImageGenerated(response.image);
        setImage(response.image);
        setImageBoard(response.image);
        setGlobalCaption(response.globalCaption || "");
      } catch (err) {
        const durationMs = performance.now() - startTime;
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "알 수 없는 오류가 발생했습니다.";

        logEvent("imagegen.failed", {
          durationMs,
          errorMessage: message,
        });

        console.error("Image generation failed", err);
        setErrorMessage(message);
      } finally {
        setIsGenerating(false);
      }
    }, 200);
  };

  const onNodeDragStop = (_event, node) => {
    logEvent("layoutboard.node.moved", {
      nodeId: node.id,
      newPos: node.position,
    });
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
            top: `${dragState.rect.y - TOP_OFFSET}px`,
            left: `${dragState.rect.x - LEFT_OFFSET}px`,
            width: `${dragState.rect.width}px`,
            height: `${dragState.rect.height}px`,
            border: "1px dashed #007bff",
            backgroundColor: "rgba(0, 123, 255, 0.05)",
            zIndex: 1000,
          }}
        />
      )}
      {/* 진행 바 + 버튼: 나란히 정렬 */}
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          width: "100%",
          display: "column",
          // alignItems: "center",
          // gap: "8px",
          // padding: "0 16px",
          // boxSizing: "border-box",
        }}
      >
        <CustomButton
          color={isSelectingRegion ? "neutral" : "grey"}
          size="sm"
          onClick={() => setIsSelectingRegion(!isSelectingRegion)}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "bold",
            }}
          >
            {isSelectingRegion ? "Cancel Selection" : "Select Region"}
          </span>
        </CustomButton>
        <div
          style={{
            position: "absolute",
            bottom: "-35px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxSizing: "border-box",
          }}
        >
          <ProgressBar now={progress} errorMessage={errorMessage} />

          <CustomButton
            onClick={handleClick}
            color="purpleBlue"
            size="lg"
            disabled={isGenerating}
          >
            {isGenerating ? "Generating" : "Generate"}
          </CustomButton>
        </div>
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
        onNodeDragStop={onNodeDragStop}
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
