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
import InstancePanelNode from "../components/nodes/InstancePanelNode";
import ResizableNode from "../components/nodes/ResizableNode";
import { syncMovedNodePositions } from "../utils/node/syncNodePositions";
import { getNormalizedBox } from "../utils/node/getNormalizedBox";
import { generateImageFromInstanceData } from "../api/generateImage";
import { generateSceneGraphToText } from "../api/generateTextToGraph";
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
  padding: "8px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  backgroundColor: "#ffffff",
  opacity: 0.9,
  pointerEvents: "none",
  userSelect: "none",
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
  fontSize: "12px",
  fontWeight: "500",
  color: "#374151",
  fontFamily: "system-ui, -apple-system, sans-serif",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  minWidth: "60px",
  minHeight: "24px",
};

const ghostNodeStyles = {
  "instance-group": {
    ...baseGhostStyle,
  },
};

const edgeTypes = {
  main: DefaultEdge,
};

const nodeTypes = {
  class: InstancePanelNode,
  instance: InstancePanelNode,
  resizable: ResizableNode,
  "instance-group": InstancePanelNode,
};

function LayoutBoard({ onImageGenerated, newInstanceToAdd, onInstanceAdded }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [imageBoard, setImageBoard] = useState();
  const [globalCaption, setGlobalCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [ghostNode, setGhostNode] = useState(null);
  const [showImageOnly, setShowImageOnly] = useState(false);

  const { image, setImage } = useImage();

  // 새 인스턴스가 추가될 때 처리
  useEffect(() => {
    if (newInstanceToAdd) {
      addInstanceToBoard(newInstanceToAdd);
      onInstanceAdded?.();
    }
  }, [newInstanceToAdd, onInstanceAdded]);

  const addInstanceToBoard = async (instanceData) => {
    // 현재 resizable이 아닌 노드 개수 확인
    const nonResizableCount = nodes.filter(
      (n) => n.type !== "resizable"
    ).length;
    if (nonResizableCount >= 10) {
      alert("최대 10개의 노드까지만 생성할 수 있습니다.");
      return;
    }

    // 새 노드들이 겹치지 않는 위치 찾기
    const findEmptyPosition = () => {
      const gridSize = 80;
      const maxCols = Math.floor(512 / gridSize);

      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < maxCols; col++) {
          const x = col * gridSize + 20;
          const y = row * gridSize + 20;

          const hasConflict = nodes.some((node) => {
            const distance = Math.sqrt(
              Math.pow(node.position.x - x, 2) +
                Math.pow(node.position.y - y, 2)
            );
            return distance < 60;
          });

          if (!hasConflict) {
            return { x, y };
          }
        }
      }

      return {
        x: Math.random() * 400 + 50,
        y: Math.random() * 400 + 50,
      };
    };

    const position = findEmptyPosition();
    const uniqueId = uuidv4();
    const sharedId = `instance-${uniqueId}`;

    // 텍스트 설명 생성
    let textDescription = "";
    try {
      textDescription = await generateSceneGraphToText({
        newSceneGraph: instanceData.sceneGraph,
      });
    } catch (error) {
      console.error("Failed to generate text description:", error);
      textDescription = instanceData.instanceLabel || "New Instance";
    }

    const objNode = {
      id: sharedId,
      type: "instance-group",
      position,
      data: {
        baseline: false,
        label: instanceData.instanceLabel || "New Instance",
        type: "object",
        sharedId,
        classId: instanceData.isFromClass
          ? instanceData.createdFrom
          : "__baseline__",
        instanceId: sharedId,
        justCreated: false,
        // 단순화된 데이터 구조
        instanceLabel: instanceData.instanceLabel || "New Instance",
        textDescription: textDescription,
        sceneGraph: instanceData.sceneGraph,
      },
      updatedAt: new Date().toISOString(),
      style: { height: 20 },
    };

    const resizableNode = {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position: { x: position.x, y: position.y },
      data: objNode.data,
      style: { height: 50, width: 50 },
    };

    setNodes((prevNodes) => [...prevNodes, resizableNode, objNode]);
  };

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
        setIsGenerating(false);
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
        position: {
          x: e.clientX - LEFT_OFFSET - 30,
          y: e.clientY - TOP_OFFSET - 12,
        },
      }));
    },
    [ghostNode]
  );

  const handleGhostClick = async (e) => {
    if (!ghostNode) return;
    e.preventDefault();
    e.stopPropagation();

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

    const objNode = {
      id: sharedId,
      type: "instance-group",
      position,
      data: {
        baseline: false,
        label: "",
        type: "object",
        sharedId,
        classId: "__baseline__",
        instanceId: sharedId,
        justCreated: true,
        // 단순화된 데이터 구조
        instanceLabel: "New Box",
        textDescription: "",
        sceneGraph: {},
      },
      updatedAt: new Date().toISOString(),
      style: { height: 20 },
    };

    const resizableNode = {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position: { x: position.x, y: position.y },
      data: objNode.data,
      style: { height: 50, width: 50 },
    };

    setNodes((prevNodes) => [...prevNodes, resizableNode, objNode]);
    setGhostNode(null);
  };

  const handleClick = async () => {
    setProgress(0);
    setIsGenerating(true);
    setErrorMessage();

    const startTime = performance.now();

    setTimeout(async () => {
      const sentences = nodes
        .filter((n) => n.type !== "resizable")
        .map((n) => n.data.textDescription || "No label");
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

      try {
        const response = await generateImageFromInstanceData(
          sentences,
          boxes,
          globalCaption
        );

        onImageGenerated(response.image);
        setImage(response.image);
        setImageBoard(response.image);
        setGlobalCaption(response.globalCaption || "");
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "알 수 없는 오류가 발생했습니다.";
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
          onClick={handleAddNewNode}
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
          selectNodesOnDrag={false}
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
            [0, 0],
            [512, 512],
          ]}
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
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </div>
  );
}

function LayoutBoardWithProvider({
  onImageGenerated,
  newInstanceToAdd,
  onInstanceAdded,
}) {
  return (
    <ReactFlowProvider debounce={200}>
      <LayoutBoard
        onImageGenerated={onImageGenerated}
        newInstanceToAdd={newInstanceToAdd}
        onInstanceAdded={onInstanceAdded}
      />
    </ReactFlowProvider>
  );
}

export default LayoutBoardWithProvider;