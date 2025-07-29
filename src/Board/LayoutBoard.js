// 1. LayoutBoard.js - 레이아웃과 관계만 담당
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
import SimpleLayoutNode from "../components/nodes/SimpleLayoutNode";
import ResizableNode from "../components/nodes/ResizableNode";
import { generateImageFromInstanceData } from "../api/generateImage";
import ProgressBar from "../components/ProgressBar";
import CustomButton from "../components/CustomButton";
import { useImage } from "../context/ImageContext";
import { useClassContext } from "../context/ClassContext";
import { logEvent } from "../api/logEvent";
import {
  LEFT_OFFSET_BASELINE as LEFT_OFFSET,
  TOP_OFFSET,
} from "../utils/constants";
import { v4 as uuidv4 } from "uuid";
import { getNormalizedBox } from "../utils/node/getNormalizedBox";

const nodeTypes = {
  simple: SimpleLayoutNode,
  resizable: ResizableNode,
};

const edgeTypes = {
  main: DefaultEdge,
};

function LayoutBoard({ onImageGenerated, newInstanceToAdd, onInstanceAdded, onNodeSelect }) {
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
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const { image, setImage } = useImage();
  const { instances, classes, setInstances, updateInstance, deleteInstance } =
    useClassContext();

  const syncFromReactFlow = useRef(false);
  const syncFromClassContext = useRef(false);

  // 진행률 모니터링
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

  // ClassContext → ReactFlow 동기화 (간단한 정보만)
  useEffect(() => {
    if (syncFromReactFlow.current) {
      syncFromReactFlow.current = false;
      return;
    }

    syncFromClassContext.current = true;

    setNodes((prevNodes) => {
      const updatedNodes = [...prevNodes];

      instances.forEach((instance) => {
        const nodeIndex = updatedNodes.findIndex(
          (n) => n.data?.instanceId === instance.id
        );
        const resizableIndex = updatedNodes.findIndex(
          (n) => n.id === `${instance.id}-resizable`
        );

        if (nodeIndex !== -1) {
          const parentClass = instance.isFromClass
            ? classes.find((cls) => cls?.id === instance.classId)
            : null;

          const updatedData = {
            ...updatedNodes[nodeIndex].data,
            instanceLabel: instance.instanceLabel,
            isFromClass: instance.isFromClass,
            classId: instance.classId,
            parentClassName: parentClass?.name,
            hasOverrides:
              instance.overrides && Object.keys(instance.overrides).length > 0,
          };

          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            data: updatedData,
          };

          if (resizableIndex !== -1) {
            updatedNodes[resizableIndex] = {
              ...updatedNodes[resizableIndex],
              data: updatedData,
            };
          }
        }
      });

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

  // Relationships → Edges 동기화
  useEffect(() => {
    const newEdges = [];
    
    instances.forEach((instance) => {
      if (instance.sceneGraph?.relationships) {
        instance.sceneGraph.relationships.forEach((rel) => {
          // 관계의 대상이 다른 인스턴스인지 확인
          const targetInstance = instances.find(inst => 
            inst.sceneGraph?.objects?.some(obj => obj.id === rel.target)
          );
          
          if (targetInstance && targetInstance.id !== instance.id) {
            const edgeId = `${instance.id}-${targetInstance.id}-${rel.relation}`;
            newEdges.push({
              id: edgeId,
              source: instance.id,
              target: targetInstance.id,
              type: "main",
              data: {
                relation: rel.relation || "related_to",
                originalRelationship: rel,
              },
              style: {
                stroke: "#cbd5e1",
                strokeWidth: 1.5,
              },
              label: rel.relation || "related",
              labelStyle: {
                fontSize: "10px",
                fontWeight: "500",
              },
            });
          }
        });
      }
    });

    setEdges(newEdges);
  }, [instances, setEdges]);

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

    const parentClass = instanceData.isFromClass
      ? classes.find((cls) => cls?.id === instanceData.classId)
      : null;

    const objNode = {
      id: sharedId,
      type: "simple",
      position,
      data: {
        label: instanceData.instanceLabel || "New Instance",
        sharedId,
        instanceId: sharedId,
        instanceLabel: instanceData.instanceLabel || "New Instance",
        isFromClass: instanceData.isFromClass || false,
        parentClassName: parentClass?.name || null,
        hasOverrides:
          instanceData.overrides &&
          Object.keys(instanceData.overrides).length > 0,
      },
      style: { height: 40, width: 120 },
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
      type: "simple",
      data: { label: "New Box" },
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
    
    // 설명 입력 받기
    const description = prompt("Describe what you want to create:");
    if (!description || !description.trim()) {
      setGhostNode(null);
      return;
    }

    const uniqueId = uuidv4();
    const sharedId = `instance-${uniqueId}`;

    try {
      // 임시 인스턴스를 먼저 생성 (로딩 상태)
      const tempInstance = {
        id: sharedId,
        instanceLabel: "Generating...",
        textDescription: description.trim(),
        sceneGraph: { objects: [], relationships: [] },
        createdAt: new Date().toISOString(),
        isFromClass: false,
        classId: null,
        overrides: {},
        isGenerating: true, // 생성 중 표시
      };

      setInstances((prev) => [...prev, tempInstance]);

      // 임시 노드도 먼저 생성
      const objNode = {
        id: sharedId,
        type: "simple",
        position,
        data: {
          label: "Generating...",
          sharedId,
          instanceId: sharedId,
          instanceLabel: "Generating...",
          isFromClass: false,
          parentClassName: null,
          hasOverrides: false,
          isGenerating: true,
        },
        style: { height: 40, width: 120 },
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

      // AI 처리 (비동기)
      const { generateTextToGraph } = await import("../api/generateTextToGraph");
      const sceneGraph = await generateTextToGraph({
        newTextDescription: description.trim(),
      });

      const instanceLabel = sceneGraph.objects?.[0]?.name || "New Box";

      // 실제 데이터로 업데이트
      const finalInstance = {
        ...tempInstance,
        instanceLabel,
        sceneGraph,
        isGenerating: false,
      };

      setInstances((prev) => 
        prev.map(inst => inst.id === sharedId ? finalInstance : inst)
      );

      // 노드도 업데이트
      setNodes((prev) => 
        prev.map(node => {
          if (node.id === sharedId || node.id === `${sharedId}-resizable`) {
            return {
              ...node,
              data: {
                ...node.data,
                label: instanceLabel,
                instanceLabel,
                isGenerating: false,
              }
            };
          }
          return node;
        })
      );

    } catch (error) {
      console.error("Failed to generate scene graph:", error);
      
      // 에러 시 기본값으로 설정
      const fallbackInstance = {
        id: sharedId,
        instanceLabel: "New Box",
        textDescription: description.trim(),
        sceneGraph: { objects: [], relationships: [] },
        createdAt: new Date().toISOString(),
        isFromClass: false,
        classId: null,
        overrides: {},
        isGenerating: false,
      };

      setInstances((prev) => 
        prev.map(inst => inst.id === sharedId ? fallbackInstance : inst)
      );

      setNodes((prev) => 
        prev.map(node => {
          if (node.id === sharedId || node.id === `${sharedId}-resizable`) {
            return {
              ...node,
              data: {
                ...node.data,
                label: "New Box",
                instanceLabel: "New Box",
                isGenerating: false,
              }
            };
          }
          return node;
        })
      );

      alert("Failed to generate scene graph. Created basic instance instead.");
    }
  };

  const handleClick = async () => {
    setProgress(0);
    setIsGenerating(true);
    setErrorMessage("");

    setTimeout(async () => {
      try {
        const sentences = nodes
          .filter((n) => n.type !== "resizable")
          .map((n) => {
            const instance = instances.find(inst => inst.id === n.data?.instanceId);
            return instance?.textDescription || "No description";
          });

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
    logEvent("layout.node.moved", {
      nodeId: node.id,
      newPos: node.position,
    });
  };

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);

      const positionChanges = changes.filter(
        (change) => change.type === "position" && change.position
      );

      if (positionChanges.length > 0) {
        const additionalChanges = [];

        positionChanges.forEach((change) => {
          const nodeId = change.id;
          let pairedNodeId;

          if (nodeId.endsWith("-resizable")) {
            pairedNodeId = nodeId.replace("-resizable", "");
          } else {
            pairedNodeId = `${nodeId}-resizable`;
          }

          additionalChanges.push({
            id: pairedNodeId,
            type: "position",
            position: change.position,
            positionAbsolute: change.positionAbsolute,
          });
        });

        if (additionalChanges.length > 0) {
          onNodesChange(additionalChanges);
        }
      }
    },
    [onNodesChange]
  );

  // 노드 선택 핸들러
  const handleNodeClick = useCallback((event, node) => {
    if (node.type !== "resizable") {
      setSelectedNodeId(node.data?.instanceId);
      onNodeSelect?.(node.data?.instanceId);
    }
  }, [onNodeSelect]);

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
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
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
          nodesDraggable={true}
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

export default function LayoutBoardWithProvider({
  onImageGenerated,
  newInstanceToAdd,
  onInstanceAdded,
  onNodeSelect,
}) {
  return (
    <ReactFlowProvider debounce={200}>
      <LayoutBoard
        onImageGenerated={onImageGenerated}
        newInstanceToAdd={newInstanceToAdd}
        onInstanceAdded={onInstanceAdded}
        onNodeSelect={onNodeSelect}
      />
    </ReactFlowProvider>
  );
}