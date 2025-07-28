import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DefaultEdge, defaultEdgeOptions } from "../components/DefaultEdge";
import InstancePanelNode from "../components/nodes/InstancePanelNode";
import ResizableNode from "../components/nodes/ResizableNode";
import { generateImageFromInstanceData } from "../api/generateImage";
import ProgressBar from "../components/ProgressBar";
import CustomButton from "../components/CustomButton";
import { useImage } from "../context/ImageContext";
import { useClassContext } from "../context/ClassContext";
import { logEvent } from "../api/logEvent";
import { syncMovedNodePositions } from "../utils/node/syncNodePositions";
import {
  LEFT_OFFSET_BASELINE as LEFT_OFFSET,
  TOP_OFFSET,
} from "../utils/constants";
import { v4 as uuidv4 } from "uuid";
import { getNormalizedBox } from "../utils/node/getNormalizedBox";

const nodeTypes = {
  class: InstancePanelNode,
  instance: InstancePanelNode,
  resizable: ResizableNode,
  "instance-group": InstancePanelNode,
};

const edgeTypes = {
  main: DefaultEdge,
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
  const [ghostNode, setGhostNode] = useState(null);
  const [showImageOnly, setShowImageOnly] = useState(false);

  const { image, setImage } = useImage();
  const { instances, classes, setInstances, updateInstance, deleteInstance } =
    useClassContext();

  // 동기화 방향을 제어하는 플래그들
  const syncFromReactFlow = useRef(false);
  const syncFromClassContext = useRef(false);

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

  // ClassContext → ReactFlow 동기화
  useEffect(() => {
    if (syncFromReactFlow.current) {
      syncFromReactFlow.current = false;
      return; // ReactFlow에서 온 변경사항이면 스킵
    }

    syncFromClassContext.current = true;

    setNodes((prevNodes) => {
      const updatedNodes = [...prevNodes];

      // 기존 노드들 업데이트
      instances.forEach((instance) => {
        const nodeIndex = updatedNodes.findIndex(
          (n) => n.data?.instanceId === instance.id
        );
        const resizableIndex = updatedNodes.findIndex(
          (n) => n.id === `${instance.id}-resizable`
        );

        if (nodeIndex !== -1) {
          // 클래스 정보 조회
          const parentClass = instance.isFromClass
            ? classes.find((cls) => cls?.id === instance.classId)
            : null;

          const updatedData = {
            ...updatedNodes[nodeIndex].data,
            instanceLabel: instance.instanceLabel,
            textDescription: instance.textDescription,
            sceneGraph: instance.sceneGraph,
            isFromClass: instance.isFromClass,
            classId: instance.classId,
            overrides: instance.overrides,
            parentClassName: parentClass?.name,
            hasOverrides:
              instance.overrides && Object.keys(instance.overrides).length > 0,
          };

          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            data: updatedData,
          };

          // Resizable 노드도 동일하게 업데이트
          if (resizableIndex !== -1) {
            updatedNodes[resizableIndex] = {
              ...updatedNodes[resizableIndex],
              data: updatedData,
            };
          }
        }
      });

      // 삭제된 인스턴스의 노드들 제거
      const instanceIds = new Set(instances.map((inst) => inst.id));
      const filteredNodes = updatedNodes.filter((node) => {
        const instanceId = node.id.endsWith("-resizable")
          ? node.id.replace("-resizable", "")
          : node.data?.instanceId || node.id;
        return instanceIds.has(instanceId);
      });

      return filteredNodes;
    });

    syncFromClassContext.current = false;
  }, [instances, classes, setNodes]);

  // ReactFlow → ClassContext 동기화 (데이터 변경용)
  const syncToClassContext = useCallback(
    (nodeId, updates) => {
      syncFromReactFlow.current = true;
      updateInstance(nodeId, updates);
    },
    [updateInstance]
  );

  // 새 인스턴스 추가
  useEffect(() => {
    if (
      newInstanceToAdd &&
      !nodes.find((n) => n.data?.instanceId === newInstanceToAdd.id)
    ) {
      addInstanceToBoard(newInstanceToAdd);
      onInstanceAdded?.();
    }
  }, [newInstanceToAdd, onInstanceAdded, nodes]);

  const addInstanceToBoard = (instanceData) => {
    const position = findEmptyPosition();
    const sharedId = instanceData.id;

    // 클래스 정보 조회
    const parentClass = instanceData.isFromClass
      ? classes.find((cls) => cls?.id === instanceData.classId)
      : null;

    const objNode = {
      id: sharedId,
      type: "instance-group",
      position,
      data: {
        baseline: false,
        label: instanceData.instanceLabel || "New Instance",
        type: "object",
        sharedId,
        classId: instanceData.classId || "__baseline__",
        instanceId: sharedId,
        justCreated: false,
        instanceLabel: instanceData.instanceLabel || "New Instance",
        textDescription: instanceData.textDescription || "",
        sceneGraph: instanceData.sceneGraph || {},
        isFromClass: instanceData.isFromClass || false,
        overrides: instanceData.overrides || {},
        parentClassName: parentClass?.name || null,
        hasOverrides:
          instanceData.overrides &&
          Object.keys(instanceData.overrides).length > 0,
      },
      updatedAt: new Date().toISOString(),
      style: { height: 20 },
    };

    const resizableNode = {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position,
      data: objNode.data,
      style: { height: 50, width: 50 },
    };

    setNodes((prev) => [...prev, resizableNode, objNode]);
  };

  const findEmptyPosition = () => {
    const gridSize = 80;
    const maxCols = Math.floor(512 / gridSize);

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < maxCols; col++) {
        const x = col * gridSize + 20;
        const y = row * gridSize + 20;

        const hasConflict = nodes.some((node) => {
          if (!node?.position) return false;
          const distance = Math.sqrt(
            Math.pow(node.position.x - x, 2) + Math.pow(node.position.y - y, 2)
          );
          return distance < 60;
        });

        if (!hasConflict) return { x, y };
      }
    }

    return { x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 };
  };

  const handleAddNewNode = () => {
    setGhostNode({
      id: `ghost-${Date.now()}`,
      type: "instance-group",
      data: { label: "New Box", justCreated: true },
      position: { x: 0, y: 0 },
    });
  };

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

    if (nodes.filter((n) => n.type !== "resizable").length >= 10) {
      alert("최대 10개의 노드까지만 생성할 수 있습니다.");
      setGhostNode(null);
      return;
    }

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const uniqueId = uuidv4();
    const sharedId = `instance-${uniqueId}`;

    // ClassContext에 새 인스턴스 추가
    const newInstance = {
      id: sharedId,
      instanceLabel: "New Box",
      textDescription: "",
      sceneGraph: { objects: [], relationships: [] },
      createdAt: new Date().toISOString(),
      isFromClass: false,
      classId: null,
      overrides: {},
    };

    setInstances((prev) => [...prev, newInstance]);

    // ReactFlow에 노드 추가
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
        instanceLabel: "New Box",
        textDescription: "",
        sceneGraph: { objects: [], relationships: [] },
        isFromClass: false,
        overrides: {},
        parentClassName: null,
        hasOverrides: false,
        id: sharedId,
      },
      updatedAt: new Date().toISOString(),
      style: { height: 20 },
    };

    const resizableNode = {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position,
      data: objNode.data,
      style: { height: 50, width: 50 },
    };

    setNodes((prev) => [...prev, resizableNode, objNode]);
    setGhostNode(null);
  };

  const handleClick = async () => {
    setProgress(0);
    setIsGenerating(true);
    setErrorMessage("");

    setTimeout(async () => {
      try {
        const sentences = nodes
          .filter((n) => n.type !== "resizable")
          .map((n) => n.data?.textDescription || "No label");

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

  const onNodeDragStop = (event, node) => {
    logEvent("baselineboard.node.moved", {
      nodeId: node.id,
      newPos: node.position,
    });
  };

  const handleNodesChange = useCallback(
    (changes) => {
      // 먼저 기본 ReactFlow 변경 처리
      onNodesChange(changes);

      // position 변경이 있는 경우에만 페어 노드 동기화
      const positionChanges = changes.filter(
        (change) => change.type === "position" && change.position
      );

      if (positionChanges.length > 0) {
        // 각 position 변경에 대해 페어 노드도 같이 움직이도록 처리
        const additionalChanges = [];

        positionChanges.forEach((change) => {
          const nodeId = change.id;
          let pairedNodeId;

          // 페어 노드 ID 결정
          if (nodeId.endsWith("-resizable")) {
            pairedNodeId = nodeId.replace("-resizable", "");
          } else {
            pairedNodeId = `${nodeId}-resizable`;
          }

          // 페어 노드를 위한 position 변경 추가
          additionalChanges.push({
            id: pairedNodeId,
            type: "position",
            position: change.position,
            positionAbsolute: change.positionAbsolute,
          });
        });

        // 페어 노드들에 대한 추가 변경사항 적용
        if (additionalChanges.length > 0) {
          onNodesChange(additionalChanges);
        }
      }
    },
    [onNodesChange]
  );

  // edge 생성 함수
  const createRelationshipEdge = useCallback(
    (sourceInstanceId, targetInstanceId, relationshipData) => {
      const edgeId = `edge-${uuidv4()}`;
      const edge = {
        id: edgeId,
        source: sourceInstanceId,
        target: targetInstanceId,
        type: "main",
        data: {
          relation: relationshipData.relation || "related_to",
          originalRelationship: relationshipData,
          isFromObjectExtraction: true,
        },
        style: {
          stroke: "#cbd5e1",
          strokeWidth: 1.5,
        },
        label: relationshipData.relation || "related",
        labelStyle: {
          fontSize: "10px",
          fontWeight: "500",
        },
      };

      setEdges((prev) => [...prev, edge]);
      return edge;
    },
    [setEdges]
  );

  // 객체 추출 시 edge 생성을 위한 이벤트 리스너
  useEffect(() => {
    const handleObjectExtracted = (event) => {
      const { draggedObject, sourceInstanceId, newInstanceId, relationships } =
        event.detail;

      console.log("Object extracted event received:", event.detail);

      if (relationships && relationships.length > 0) {
        relationships.forEach((rel) => {
          createRelationshipEdge(sourceInstanceId, newInstanceId, rel);
        });
      }
    };

    window.addEventListener("objectExtracted", handleObjectExtracted);

    return () => {
      window.removeEventListener("objectExtracted", handleObjectExtracted);
    };
  }, [createRelationshipEdge]);

  // ReactFlow 노드 드래그 처리 - ObjectNode 드래그와 충돌 방지
  const handleNodeDrag = useCallback((event, node) => {
    // ObjectNode가 드래그 중이면 전체 노드 드래그 방지
    if (document.body.style.pointerEvents === "none") {
      return false;
    }
    return true;
  }, []);

  const onNodeDragStart = useCallback((event, node) => {
    // ObjectNode 드래그가 활성화되어 있으면 노드 드래그 방지
    if (document.body.style.pointerEvents === "none") {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    logEvent("baselineboard.node.moved", {
      nodeId: node.id,
      newPos: node.position,
    });
  }, []);

  // console.log("Edges", edges, "Nodes", nodes)

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
        <CustomButton color="grey" size="sm" onClick={handleAddNewNode}>
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
            position: "absolute",
            left: ghostNode.position.x,
            top: ghostNode.position.y,
            padding: "8px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            opacity: 0.9,
            pointerEvents: "none",
            zIndex: 999,
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          {ghostNode.data?.label}
        </div>
      )}

      {!showImageOnly && (
        <ReactFlow
          nodes={nodes}
          edges={edges} // edges 상태 전달
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange} // edge 변경 핸들러
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          panOnDrag={false}
          panOnScroll={false}
          selectNodesOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
          nodeDragBounds={{ left: 0, top: 0, right: 512, bottom: 512 }}
          onNodeDragStop={onNodeDragStop}
          onNodeDragStart={onNodeDragStart} // 추가
          nodesDraggable={true} // 명시적으로 설정
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
            alt="Generated"
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
