import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDnD } from "../context/DragAndDropContext";
import DefaultEdge from "../components/DefaultEdge";
import InstanceNode from "../components/InstanceNode";
import ResizableNode from "../components/ResizableNode";
import TempResizableNode from "../components/TempResizableNode";
import {
  handleConnect,
  handleConnectEnd,
} from "../utils/node/nodeConnectHandlers";
import { useClassGraph } from "../context/ClassGraphContext";
import { useImage } from "../context/ImageContext";
import { createInstanceWithAttributes } from "../utils/instanceBuilder";
import { syncMovedNodePositions } from "../utils/node/syncNodePositions";
import { extractSentencesAndBoxes } from "../utils/instanceExtractor";
import { generateImageFromInstanceData } from "../api/generateImage";

const edgeTypes = {
  main: DefaultEdge,
};
const nodeTypes = {
  class: InstanceNode,
  instance: InstanceNode,
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

function InstanceBoard({ onImageGenerated }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [id, , type, setType, , setGhostPos, label, setLabel] = useDnD();
  const { classNodes, classEdges } = useClassGraph();
  const { image, setImage, globalCaption, setGlobalCaption } = useImage();

  const [isDraggingToCreate, setIsDraggingToCreate] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragRect, setDragRect] = useState(null);

  const onMouseDown = (e) => {
    // pan 막고, left click일 때만 실행
    if (e.button !== 0) return;
    if (isDraggingToCreate) {
      setIsDraggingToCreate(false);
      setDragStart(null);
      setDragRect(null);
      return;
    }

    const start = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setIsDraggingToCreate(true);
    setDragStart(start);
    setDragRect(null);
  };

  const onMouseMove = (e) => {
    if (!isDraggingToCreate || !dragStart) return;

    const current = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    const x = Math.min(dragStart.x, current.x);
    const y = Math.min(dragStart.y, current.y);
    const width = Math.abs(dragStart.x - current.x);
    const height = Math.abs(dragStart.y - current.y);

    setDragRect({ x, y, width, height });
  };

  const onMouseUp = useCallback(
    (event) => {
      // 1. 먼저 박스 드래그 로직 처리
      if (
        isDraggingToCreate &&
        dragRect &&
        dragRect.width > 10 &&
        dragRect.height > 10
      ) {
        const id = `resizable-${nodes.length + 1}`;
        const newNode = {
          id,
          type: "tmpResizable",
          position: { x: dragRect.x, y: dragRect.y },
          width: dragRect.width,
          height: dragRect.height,
          data: {
            type: "object",
            label: "New Object",
            showToolbar: true,
          },
        };
        setNodes((nds) => [...nds, newNode]);

        // cleanup
        setIsDraggingToCreate(false);
        setDragStart(null);
        setDragRect(null);
        return;
      }

      // 2. 아니면 DnD 드롭 처리
      if (!type || !label) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const { newNodes, newEdges } = createInstanceWithAttributes({
        id,
        label,
        type,
        position,
        classNodes,
        classEdges,
        currentNodeCount: nodes.length,
      });

      setNodes((nds) => [...nds, ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);

      setType(null);
      setLabel(null);
      setGhostPos({ x: 0, y: 0 });
    },
    [
      isDraggingToCreate,
      dragRect,
      dragStart,
      nodes,
      type,
      label,
      id,
      screenToFlowPosition,
      classNodes,
      classEdges,
    ]
  );

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
    [onNodesChange, edges]
  );

  const handleClick = async () => {
    const result = extractSentencesAndBoxes(
      nodes,
      edges,
      {
        nodes: classNodes,
        edges: classEdges,
      },
      flowToScreenPosition
    );

    try {
      const response = await generateImageFromInstanceData(
        result.sentences,
        result.boxes
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
      {dragRect && isDraggingToCreate && (
        <div
          style={{
            position: "absolute",
            top: `${dragRect.y}px`,
            left: `${dragRect.x}px`,
            width: `${dragRect.width}px`,
            height: `${dragRect.height}px`,
            border: "2px dashed #007bff",
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            zIndex: 1000,
          }}
        />
      )}
      <div>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClick}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#f0f0f0",
          }}
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
      />
    </div>
  );
}

function InstanceBoardWithProvider({ onImageGenerated }) {
  const [, , type, setType, ghostPos, setGhostPos, label, setLabel] = useDnD();

  return (
    <ReactFlowProvider debounce={200}>
      <InstanceBoard
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

export default InstanceBoardWithProvider;
