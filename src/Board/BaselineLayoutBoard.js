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
import { DefaultEdge, defaultEdgeOptions } from "../components/DefaultEdge";
import LayoutNode from "../components/nodes/LayoutNode";
import ResizableNode from "../components/nodes/ResizableNode";
import TempResizableNode from "../components/nodes/TempResizableNode";
import { useClassGraph } from "../context/ClassGraphContext";
import { useInstanceGraph } from "../context/InstanceGraphContext";
import { syncMovedNodePositions } from "../utils/node/syncNodePositions";
import { getNormalizedBox } from "../utils/node/getNormalizedBox";
import { generateImageFromInstanceData } from "../api/generateImage";
import ProgressBar from "../components/ProgressBar";
import CustomButton from "../components/CustomButton";
import { useImage } from "../context/ImageContext";
import { logEvent } from "../api/logEvent";
import {
  LEFT_OFFSET_BASELINE as LEFT_OFFSET,
  TOP_OFFSET,
  BACKGROUND_COLOR,
  OBJ_COLOR,
} from "../utils/constants";
import { v4 as uuidv4 } from "uuid";

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
  "instance-group": {
    ...baseGhostStyle,
    borderColor: OBJ_COLOR, // 예: object용 붉은 계열
  },
  // "instance-group": {
  //   ...baseGhostStyle,
  //   borderColor: OBJ_COLOR_TRANS, // 기존 색상 유지
  // },
};

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

function BaselineLayoutBoard({ onImageGenerated }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const { setInstanceNodes } = useInstanceGraph();
  const [imageBoard, setImageBoard] = useState();
  const [globalCaption, setGlobalCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [ghostNode, setGhostNode] = useState(null); // ghostNode for Node Addition
  const [showImageOnly, setShowImageOnly] = useState(false);

  const { image, setImage } = useImage();

  useEffect(() => {
    if (!isGenerating) {
      setProgress(100);
      return;
    }

    const interval = setInterval(async () => {
      const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/progress`);
      const data = await res.json();
      setProgress(data.progress);

      if (data.progress >= 100) {
        clearInterval(interval);
        setIsGenerating(false); // ✅ 100% 완료 시 자동 종료
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleAddNewNode = () => {
    setGhostNode({
      id: `ghost-${Date.now()}`,
      type: "instance-group",
      data: {
        label: "New Box",
        expandedHeight: 70,
        type: "object",
        justCreated: true,
      },
      position: { x: 0, y: 0 },
    });
  };

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

  const handleMouseMove = useCallback(
    (e) => {
      if (!ghostNode) return;

      setGhostNode((prev) => ({
        ...prev,
        position: { x: e.clientX - LEFT_OFFSET, y: e.clientY - TOP_OFFSET },
      }));
    },
    [ghostNode, screenToFlowPosition]
  );

  const handleGhostClick = (e) => {
    if (!ghostNode) return;
    e.preventDefault();
    e.stopPropagation();

    // ✅ 1. 현재 resizable이 아닌 노드 개수 확인
    const nonResizableCount = nodes.filter(
      (n) => n.type !== "resizable"
    ).length;
    if (nonResizableCount >= 10) {
      alert("최대 10개의 노드까지만 생성할 수 있습니다.");
      setGhostNode(null);
      return;
    }

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const uniqueId = uuidv4();
    const sharedId = `instance-${uniqueId}`;
    const updatedAt = new Date().toISOString();

    const objNode = {
      id: sharedId,
      type: "instance-group",
      position,
      data: {
        label: "New Box",
        type: "object",
        sharedId,
        classId: "__baseline__",
        originalClassId: "__baseline__",
        instanceId: sharedId,
        baseline: true,
        justCreated: true,
      },
      updatedAt,
      style: { height: 20 },
    };

    const resizableNode = {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position: { x: position.x, y: position.y },
      data: objNode.data,
      style: { height: 50, width: 50 },
    };

    const newNodes = [resizableNode, objNode];

    logEvent("baselineboard.node.add.instance", {
      classId: sharedId,
      instanceLabel: "New Box",
      createdNodeIds: newNodes.map((n) => n.id),
    });

    setNodes((prevNodes) => [...prevNodes, ...newNodes]);
    setInstanceNodes((prevNodes) => [...prevNodes, ...newNodes]);
    setGhostNode(null);
  };

  const handleClick = async () => {
    setProgress(0);
    setIsGenerating(true);
    setErrorMessage();

    const startTime = performance.now();

    // ✅ 입력 정보 저장
    const inputSnapshot = {
      nodes,
      edges,
    };

    logEvent("baselineboard.imagegen.started", {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      inputs: inputSnapshot,
    });

    setTimeout(async () => {
      const sentences = nodes
        .filter((n) => n.type !== "resizable")
        .map((n) => n.data.label || "No label");
      const boxes = nodes
        .filter((n) => n.type === "resizable")
        .map((n) => {
          return getNormalizedBox(
            n,
            flowToScreenPosition,
            LEFT_OFFSET,
            TOP_OFFSET,
            true
          );
        });

      logEvent("baselineboard.imagegen.extracted", {
        sentences: sentences,
        boxes: boxes,
      });

      try {
        const response = await generateImageFromInstanceData(
          sentences,
          boxes,
          globalCaption // global caption placeholder
        );

        const durationMs = performance.now() - startTime;

        logEvent("baselineboard.imagegen.succeeded", {
          durationMs,
          image_size: response.image.length,
          global_caption: response.globalCaption,
          refined_caption: response.refinedCaptions,
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

        logEvent("baselineboard.imagegen.failed", {
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
    logEvent("baselineboard.node.moved", {
      nodeId: node.id,
      newPos: node.position,
    });
  };

  return (
    <div
      className="reactflow-wrapper"
      style={{ userSelect: "none" }}
      onMouseMove={handleMouseMove}
      onClick={ghostNode ? handleGhostClick : undefined}
    >
      <div
        style={{
          position: "absolute",
          bottom: "-40px",
          width: "100%",
          display: "column",
        }}
      >
        <CustomButton
          color={isSelectingRegion ? "neutral" : "grey"}
          size="sm"
          onClick={(e) => handleAddNewNode(e)}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "bold",
            }}
          >
            Create New Box
          </span>
        </CustomButton>

        <CustomButton
          color="grey"
          size="sm"
          onClick={() => setShowImageOnly(!showImageOnly)}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "bold",
            }}
          >
            {showImageOnly ? "Show Layout" : "Show Image Only"}
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

      {!showImageOnly && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
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
      )}
      {showImageOnly && imageBoard && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "512px",
          }}
        >
          <img
            src={imageBoard}
            alt="No Image"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 0,
              objectFit: "contain", // ✅ 비율 유지 + 잘리지 않음 (빈 여백 생길 수 있음)
            }}
          />
        </div>
      )}
    </div>
  );
}

function BaselineLayoutBoardWithProvider({ onImageGenerated }) {
  return (
    <ReactFlowProvider debounce={200}>
      <BaselineLayoutBoard onImageGenerated={onImageGenerated} />
    </ReactFlowProvider>
  );
}

export default BaselineLayoutBoardWithProvider;
