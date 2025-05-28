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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [id, , type, setType, , setGhostPos, label, setLabel] = useDnD();
  const { classNodes, classEdges, structuredClasses } = useClassGraph();
  const { setInstanceNodes, setInstanceEdges } = useInstanceGraph();
  const [dragState, setDragState] = useState(null);

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
      console.log("onMouseUp", event, id, type);
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

        const { newNodes, newEdges } = createInstance(
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

    // try {
    //   const response = await generateImageFromInstanceData(
    //     result.sentences,
    //     result.boxes
    //   );

    //   console.log("response", response);
    //   onImageGenerated(response.image); // 이미지 생성 후 부모 컴포넌트에 전달
    //   setImage(response.image); // 상태 업데이트
    //   setGlobalCaption(response.globalCaption); // 상태 업데이트
    // } catch (err) {
    //   console.error("Image generation failed", err);
    // }
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
            top: `${dragState.rect.y}px`,
            left: `${dragState.rect.x - 512}px`,
            width: `${dragState.rect.width}px`,
            height: `${dragState.rect.height}px`,
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
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        nodeDragBounds={{
          left: 0,
          top: 0,
          right: 512,
          bottom: 512,
        }}
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
