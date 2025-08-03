// 1. LayoutBoard.js - 레이아웃과 관계만 담당
import { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DefaultEdge, defaultEdgeOptions } from "../components/DefaultEdge";
import SimpleLayoutNode from "../components/nodes/SimpleLayoutNode";
import ResizableNode from "../components/nodes/ResizableNode";
import { generateImageFromInstanceData } from "../api/generateImage";
import { generateDescription } from "../api/generateDescription";
import {
  generateTextToGraph,
  generateInstanceLabelFromDescription,
} from "../api/generateTextToGraph";
// Model switching removed - always using FLUX
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
import { 
  calculateIOU, 
  scaleDetectedObjectBbox, 
  calculateBboxDimensions,
  filterOverlappingObjects 
} from "../utils/boundingBox";
import { LAYOUT_CONFIG, UI_CONFIG } from "../utils/layoutConstants";

const nodeTypes = {
  simple: SimpleLayoutNode,
  resizable: ResizableNode,
};

const edgeTypes = {
  main: DefaultEdge,
};

function LayoutBoard({
  onImageGenerated,
  newInstanceToAdd,
  onInstanceAdded,
  onNodeSelect,
  selectedInstanceId,
}) {
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
  const [inlinePrompt, setInlinePrompt] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  // const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [relationshipInput, setRelationshipInput] = useState(null);
  // Always use FLUX model
  const currentModel = "flux";

  const { setImage } = useImage();
  const { instances, classes, setInstances } = useClassContext();

  const syncFromReactFlow = useRef(false);
  const syncFromClassContext = useRef(false);

  // Helper function to create node data from instance
  const createNodeDataFromInstance = (instance, selectedInstanceId) => {
    const parentClass = instance.isFromClass
      ? classes.find((cls) => cls?.id === instance.classId)
      : null;

    return {
      label: instance.instanceLabel || "New Instance",
      sharedId: instance.id,
      instanceId: instance.id,
      instanceLabel: instance.instanceLabel || "New Instance",
      isFromClass: instance.isFromClass || false,
      classId: instance.classId,
      parentClassName: parentClass?.name || null,
      textDescription: instance.textDescription || "",
      hasOverrides:
        instance.overrides && Object.keys(instance.overrides).length > 0,
      isHighlighted: selectedInstanceId === instance.id,
      isGenerating: instance.isGenerating || false,
    };
  };

  // Helper function to calculate position and size from detected object or fallback
  const calculateNodePositionAndSize = (instance) => {
    let position, resizableSize;
    
    if (instance.detectedObject && instance.detectedObject.bbox) {
      const scaledBbox = scaleDetectedObjectBbox(instance.detectedObject.bbox, LAYOUT_CONFIG.SCALE_FACTOR);

      const bboxPosition = {
        x: scaledBbox[0] + LEFT_OFFSET,
        y: scaledBbox[1] + TOP_OFFSET,
      };
      position = screenToFlowPosition(bboxPosition);

      // Calculate size from bounding box
      const { width, height } = calculateBboxDimensions(scaledBbox);
      resizableSize = { width, height };
    } else {
      // Fallback for non-detected objects
      position = instance.nodePosition || LAYOUT_CONFIG.DEFAULT_POSITION;
      resizableSize = LAYOUT_CONFIG.DEFAULT_NODE_SIZE;
    }

    return { position, resizableSize };
  };



  useEffect(() => {
    setNodes((nds) => {
      return nds.map((node) => {
        if (node.type === "simple") {
          const isHighlighted = node.data?.instanceId === selectedInstanceId;

          // 항상 새 객체를 반환하여 ReactFlow가 변경을 감지하도록 함
          return {
            ...node,
            data: {
              ...node.data,
              isHighlighted,
            },
          };
        }
        return node;
      });
    });
  }, [selectedInstanceId]);

  // Load current model on component mount
  useEffect(() => {
    const loadCurrentModel = async () => {
      try {
        // Always use FLUX model - no need to fetch
      } catch (error) {
        console.error("Failed to get current model:", error);
      }
    };
    loadCurrentModel();
  }, []);

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

    // 타이머를 사용해서 다음 틱에 업데이트 (React 렌더링 사이클 보장)
    setTimeout(() => {
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
            // 기존 노드 업데이트
            const updatedData = {
              ...updatedNodes[nodeIndex].data,
              ...createNodeDataFromInstance(instance, selectedInstanceId),
            };

            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              data: { ...updatedData },
              _updated: Date.now(), // 강제 리렌더링을 위한 키
            };

            if (resizableIndex !== -1) {
              const { isHighlighted, ...resizableData } = updatedData;
              updatedNodes[resizableIndex] = {
                ...updatedNodes[resizableIndex],
                data: { ...resizableData },
                _updated: Date.now(), // 강제 리렌더링을 위한 키
              };
            }
          } else {
            // 새로운 instance인 경우 자동으로 보드에 추가
            const sharedId = instance.id;
            const { position, resizableSize } = calculateNodePositionAndSize(instance);
            const nodeData = createNodeDataFromInstance(instance, selectedInstanceId);

            const objNode = {
              id: sharedId,
              type: "simple",
              position,
              data: nodeData,
            };

            const { isHighlighted, ...resizableData } = nodeData;
            const resizableNode = {
              id: `${sharedId}-resizable`,
              type: "resizable",
              position,
              data: resizableData,
              style: resizableSize,
            };

            updatedNodes.push(objNode, resizableNode);
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
    }, 0);

    syncFromClassContext.current = false;
  }, [instances, classes, setNodes, selectedInstanceId]);

  // Relationships → Edges 동기화
  useEffect(() => {
    const newEdges = [];

    instances.forEach((instance) => {
      // 1. 기존 intra-instance relationships는 inter-instance edge를 생성하지 않음
      // (inter-instance relationships는 extract로 생성된 것만 처리)

      // 2. Extract로 생성된 inter-instance relationships 처리
      if (instance.interInstanceRelationships) {
        instance.interInstanceRelationships.forEach((rel) => {
          const edgeId = `extract-${rel.source}-${rel.target}-${rel.relation}`;
          // 중복 edge 방지
          if (!newEdges.find((edge) => edge.id === edgeId)) {
            newEdges.push({
              id: edgeId,
              source: rel.source,
              target: rel.target,
              type: "main",
              data: {
                relation: rel.relation,
                isExtractedRelationship: true,
              },
              style: UI_CONFIG.EDGE_STYLES.DEFAULT,
              label: rel.relation,
              labelStyle: {
                fontSize: "10px",
                fontWeight: "500",
                color: "#475569",
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
    const sharedId = instanceData.id;
    const { position, resizableSize } = calculateNodePositionAndSize(instanceData);
    const nodeData = createNodeDataFromInstance(instanceData, selectedInstanceId);

    const objNode = {
      id: sharedId,
      type: "simple",
      position,
      data: nodeData,
      style: { height: 40, width: 120 },
    };

    const { isHighlighted, ...resizableData } = nodeData;
    const resizableNode = {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position,
      data: resizableData,
      style: resizableSize,
    };

    setNodes((prev) => [...prev, resizableNode, objNode]);
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

    if (nodes.filter((n) => n.type !== "resizable").length >= LAYOUT_CONFIG.MAX_NODES) {
      alert(`최대 ${LAYOUT_CONFIG.MAX_NODES}개의 노드까지만 생성할 수 있습니다.`);
      setGhostNode(null);
      return;
    }

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    // 인라인 프롬프트 입력창 표시
    setInlinePrompt({
      position: { x: e.clientX - LEFT_OFFSET, y: e.clientY - TOP_OFFSET },
      flowPosition: position,
    });
    setGhostNode(null);
  };

  const handlePromptSubmit = useCallback(async (description) => {
    if (!description || !description.trim() || !inlinePrompt) {
      setInlinePrompt(null);
      return;
    }

    const uniqueId = uuidv4();
    const sharedId = `instance-${uniqueId}`;
    const position = inlinePrompt.flowPosition;

    try {
      // 임시 인스턴스를 먼저 생성 (로딩 상태)
      const tempInstance = {
        id: sharedId,
        instanceLabel: "Processing...",
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
          label: "Processing...",
          sharedId,
          instanceId: sharedId,
          instanceLabel: "Processing...",
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
      setInlinePrompt(null);

      // AI 처리 (비동기)
      const { generateTextToGraph } = await import(
        "../api/generateTextToGraph"
      );
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
        prev.map((inst) => (inst.id === sharedId ? finalInstance : inst))
      );

      // 노드도 업데이트
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === sharedId || node.id === `${sharedId}-resizable`) {
            return {
              ...node,
              data: {
                ...node.data,
                label: instanceLabel,
                instanceLabel,
                isGenerating: false,
              },
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
        prev.map((inst) => (inst.id === sharedId ? fallbackInstance : inst))
      );

      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === sharedId || node.id === `${sharedId}-resizable`) {
            return {
              ...node,
              data: {
                ...node.data,
                label: "New Box",
                instanceLabel: "New Box",
                isGenerating: false,
              },
            };
          }
          return node;
        })
      );

      alert("Failed to generate scene graph. Created basic instance instead.");
    }
  }, [inlinePrompt, setInstances, setNodes]);

  const handleClick = async () => {
    setProgress(0);
    setIsGenerating(true);
    setErrorMessage("");

    setTimeout(async () => {
      try {
        const sentences = nodes
          .filter((n) => n.type !== "resizable")
          .map((n) => {
            const instance = instances.find(
              (inst) => inst.id === n.data?.instanceId
            );
            let description = instance?.textDescription || "No description";

            // edge를 통한 relationship 정보 추가
            const outgoingEdges = edges.filter((edge) => edge.source === n.id);
            if (outgoingEdges.length > 0) {
              const relationshipDescriptions = outgoingEdges.map((edge) => {
                const targetNode = nodes.find(
                  (node) => node.id === edge.target
                );
                const targetInstance = instances.find(
                  (inst) => inst.id === targetNode?.data?.instanceId
                );
                const relationLabel =
                  edge.data?.relation || edge.label || "related to";
                const targetName =
                  targetInstance?.instanceLabel ||
                  targetNode?.data?.label ||
                  "unknown";
                const sourceName =
                  instance?.instanceLabel || instance?.data?.label || "unknown";

                return `${sourceName} ${relationLabel} ${targetName}`;
              });

              description = `${description} ${relationshipDescriptions.join(
                ". "
              )}`;
            }

            return description;
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

        // Use integrated object detection results from backend
        if (response.detectedObjects) {
          setDetectedObjects(response.detectedObjects);
          logEvent("object_detection_integrated", {
            objectsCount: response.detectedObjects.length,
            objects: response.detectedObjects.map((obj) => ({
              label: obj.label,
              confidence: obj.confidence,
            })),
          });
        }
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

  const handleObjectClick = async (obj) => {
    logEvent("object_clicked", {
      label: obj.label,
      confidence: obj.confidence,
      bbox: obj.bbox,
    });

    try {
      // 1. Generate description for the clicked object
      const descriptionResult = await generateDescription(
        imageBoard,
        obj.bbox,
        globalCaption
      );

      logEvent("object_description_generated", {
        label: descriptionResult.label,
        description: descriptionResult.description,
      });

      // 2. Convert description to scene graph
      const sceneGraph = await generateTextToGraph({
        newTextDescription: descriptionResult.description,
      });

      logEvent("scene_graph_generated", {
        objects_count: sceneGraph.objects?.length || 0,
        relationships_count: sceneGraph.relationships?.length || 0,
      });

      // 3. Generate instance label
      const instanceLabel = await generateInstanceLabelFromDescription(
        descriptionResult.description
      );

      // 4. Create new instance with proper structure
      const newInstance = {
        id: uuidv4(),
        instanceLabel: instanceLabel,
        textDescription: descriptionResult.description,
        sceneGraph: sceneGraph,
        detectedObject: obj,
        isFromObjectDetection: true,
        isFromClass: false,
        classId: null,
        overrides: {},
        createdAt: new Date().toISOString(),
      };

      // 6. Add instance to context
      setInstances((prev) => [...prev, newInstance]);

      logEvent("instance_created_from_detection", {
        instanceId: newInstance.id,
        label: instanceLabel,
        originalObjectLabel: obj.label,
      });
    } catch (error) {
      console.error("Failed to process object click:", error);
      logEvent("object_click_processing_failed", {
        error: error.message,
        objectLabel: obj.label,
      });

      // Show user-friendly error message
      alert(`Failed to process object: ${error.message}`);
    }
  };

  // Model switching removed - always using FLUX

  const onNodeDragStop = (_, node) => {
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
  const handleNodeClick = useCallback(
    (_, node) => {
      if (node.type !== "resizable") {
        onNodeSelect?.(node.data?.instanceId);
      }
    },
    [onNodeSelect]
  );

  // 배경 클릭 시 선택 해제
  const handlePaneClick = useCallback(() => {
    onNodeSelect?.(null);
    // 인라인 프롬프트도 닫기
    if (inlinePrompt) {
      setInlinePrompt(null);
    }
    // 관계 입력창도 닫기
    if (relationshipInput) {
      setRelationshipInput(null);
    }
  }, [onNodeSelect, inlinePrompt, relationshipInput]);

  // 엣지 연결 핸들러
  const onConnect = useCallback(
    (params) => {
      // 엣지 ID 생성
      const edgeId = `${params.source}-${params.target}`;

      // 임시 엣지 생성 (관계명이 입력될 때까지)
      const tempEdge = {
        ...params,
        id: edgeId,
        type: "main",
        data: {
          relation: "related", // 임시 기본값
          isTemporary: true,
        },
        style: UI_CONFIG.EDGE_STYLES.DEFAULT,
      };

      // 엣지를 먼저 추가
      setEdges((eds) => addEdge(tempEdge, eds));

      // 관계 입력창 표시
      setRelationshipInput({
        edgeId,
        sourceId: params.source,
        targetId: params.target,
        edgeParams: params,
      });
    },
    [setEdges]
  );

  // 관계명 입력 완료 핸들러
  const handleRelationshipSubmit = useCallback((relationshipText) => {
    if (!relationshipText || !relationshipText.trim() || !relationshipInput) {
      // 관계명이 없으면 엣지 삭제
      setEdges((eds) => eds.filter((edge) => edge.id !== relationshipInput.edgeId));
      setRelationshipInput(null);
      return;
    }

    // 엣지 업데이트 (임시 상태 해제, 관계명 설정)
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === relationshipInput.edgeId
          ? {
            ...edge,
            data: {
              ...edge.data,
              relation: relationshipText.trim(),
              isTemporary: false,
            },
            style: UI_CONFIG.EDGE_STYLES.SOLID,
          }
          : edge
      )
    );

    setRelationshipInput(null);
  }, [relationshipInput, setEdges]);

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
            opacity: UI_CONFIG.GHOST_NODE_OPACITY,
            pointerEvents: "none",
            zIndex: 999,
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          {ghostNode.data?.label}
        </div>
      )}

      {inlinePrompt && (
        <div
          style={{
            position: "absolute",
            left: inlinePrompt.position.x,
            top: inlinePrompt.position.y,
            zIndex: 1000,
            backgroundColor: "#ffffff",
            border: "2px solid #3b82f6",
            borderRadius: "8px",
            padding: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            minWidth: "200px",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.elements.prompt;
              handlePromptSubmit(input.value);
            }}
          >
            <input
              name="prompt"
              type="text"
              placeholder="Describe what you want..."
              autoFocus
              style={{
                width: "204px",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                marginBottom: "8px",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setInlinePrompt(null);
                }
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setInlinePrompt(null)}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {relationshipInput && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
            backgroundColor: "#ffffff",
            border: "2px solid #3b82f6",
            borderRadius: "8px",
            padding: "16px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            minWidth: "250px",
          }}
        >
          <div style={{ marginBottom: "12px", fontSize: "14px", fontWeight: "500" }}>
            Define Relationship
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.elements.relationship;
              handleRelationshipSubmit(input.value);
            }}
          >
            <input
              name="relationship"
              type="text"
              placeholder="Enter relationship (e.g., 'next to', 'above', 'contains')"
              autoFocus
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                marginBottom: "12px",
                outline: "none",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setRelationshipInput(null);
                  setEdges((eds) => eds.filter((edge) => edge.id !== relationshipInput.edgeId));
                }
              }}
            />
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setRelationshipInput(null);
                  setEdges((eds) => eds.filter((edge) => edge.id !== relationshipInput.edgeId));
                }}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {!showImageOnly && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          panOnDrag={false}
          panOnScroll={false}
          selectNodesOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
          nodeDragBounds={LAYOUT_CONFIG.NODE_BOUNDS}
          onNodeDragStop={onNodeDragStop}
          nodesDraggable={true}
          translateExtent={[
            [0, 0],
            [LAYOUT_CONFIG.CANVAS_SIZE, LAYOUT_CONFIG.CANVAS_SIZE],
          ]}
          nodeExtent={[
            [0, 0],
            [LAYOUT_CONFIG.CANVAS_SIZE, LAYOUT_CONFIG.CANVAS_SIZE],
          ]}
          proOptions={{ hideAttribution: true }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        />
      )}

      {/* Bounding boxes overlay - filter out overlapping ones */}
      {filterOverlappingObjects(
        detectedObjects, 
        nodes, 
        flowToScreenPosition, 
        LEFT_OFFSET, 
        TOP_OFFSET, 
        LAYOUT_CONFIG.OVERLAP_THRESHOLD
      )
        .map((obj, index) => {
          // Scale bounding boxes for StableDiffusion models (SD3) - reduce by half since image is 1024x1024 but display is 512x512
          const scaledBbox = scaleDetectedObjectBbox(obj.bbox, LAYOUT_CONFIG.SCALE_FACTOR);

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${(scaledBbox[0] / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
                top: `${(scaledBbox[1] / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
                width: `${((scaledBbox[2] - scaledBbox[0]) / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
                height: `${((scaledBbox[3] - scaledBbox[1]) / LAYOUT_CONFIG.CANVAS_SIZE) * 100}%`,
                border: UI_CONFIG.BOUNDING_BOX_BORDER,
                backgroundColor: UI_CONFIG.BOUNDING_BOX_BACKGROUND,
                cursor: "pointer",
                zIndex: 10,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={() => setHoveredObject(index)}
              onMouseLeave={() => setHoveredObject(null)}
              onClick={() => handleObjectClick(obj)}
              title={`${obj.label} (${(obj.confidence * 100).toFixed(1)}%)`}
            >
              {hoveredObject === index && (
                <div
                  style={{
                    position: "absolute",
                    top: "-25px",
                    left: "0",
                    backgroundColor: "#333",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    zIndex: 20,
                  }}
                >
                  {obj.label} ({(obj.confidence * 100).toFixed(1)}%)
                </div>
              )}
            </div>
          );
        })}

      {showImageOnly && imageBoard && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "512px",
            position: "relative",
          }}
        // onMouseEnter={() => !showImageOnly && setShowBoundingBoxes(true)}
        // onMouseLeave={() => {
        //   setShowBoundingBoxes(false);
        //   setHoveredObject(null);
        // }}
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

          {/* Detection status indicator */}
          {/* {isDetecting && (
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "5px 10px",
                borderRadius: "15px",
                fontSize: "12px",
                zIndex: 15
              }}
            >
              Detecting objects...
            </div>
          )} */}

          {/* Current model indicator - centered */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "white",
              padding: "3px 8px",
              borderRadius: "10px",
              fontSize: "11px",
              zIndex: 15,
            }}
          >
            {currentModel.toUpperCase()}
          </div>
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
  selectedInstanceId,
}) {
  return (
    <ReactFlowProvider debounce={200}>
      <LayoutBoard
        onImageGenerated={onImageGenerated}
        newInstanceToAdd={newInstanceToAdd}
        onInstanceAdded={onInstanceAdded}
        onNodeSelect={onNodeSelect}
        selectedInstanceId={selectedInstanceId}
      />
    </ReactFlowProvider>
  );
}
