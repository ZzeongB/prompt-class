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
import ImageQualityRatingModal from "../components/modal/ImageQualityRatingModal";
import { useClassContext } from "../context/ClassContext";
import { logEvent } from "../api/logEvent";
import {
  LEFT_OFFSET_BASELINE as LEFT_OFFSET,
  TOP_OFFSET,
} from "../utils/constants";
import { v4 as uuidv4 } from "uuid";
import { loadBaseImages } from "../utils/imageUtils";
import { getNormalizedBox } from "../utils/node/getNormalizedBox";
import {
  calculateBboxDimensions,
  scaleDetectedObjectBbox
} from "../utils/boundingBox";
import { LAYOUT_CONFIG, UI_CONFIG } from "../utils/layoutConstants";
import GhostNode from "../components/layout/GhostNode";
import InlinePrompt from "../components/layout/InlinePrompt";
import RelationshipInput from "../components/layout/RelationshipInput";
import ObjectOverlay from "../components/layout/ObjectOverlay";
import ImageDisplay from "../components/layout/ImageDisplay";

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
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [generatedImageForRating, setGeneratedImageForRating] = useState(null);
  const [baseImages, setBaseImages] = useState({});
  // Always use FLUX model
  const currentModel = "flux";

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

  // Load base images on component mount
  useEffect(() => {
    const loadImages = async () => {
      const images = await loadBaseImages();
      setBaseImages(images);
    };
    loadImages();
  }, []);

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
    setEdges((currentEdges) => {
      // 1. 기존 수동 연결 edges 보존 (extract가 아닌 것들)
      const manualEdges = currentEdges.filter(edge => 
        !edge.data?.isExtractedRelationship && 
        !edge.id.startsWith('extract-')
      );

      // 2. Extract로 생성된 inter-instance relationships 처리
      const extractEdges = [];
      instances.forEach((instance) => {
        if (instance.interInstanceRelationships) {
          instance.interInstanceRelationships.forEach((rel) => {
            const edgeId = `extract-${rel.source}-${rel.target}-${rel.relation}`;
            // 중복 edge 방지
            if (!extractEdges.find((edge) => edge.id === edgeId)) {
              extractEdges.push({
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

      // 3. 수동 edges + extract edges 합치기
      return [...manualEdges, ...extractEdges];
    });
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
    logEvent("layout_board.new_box_initiated", {
      board_type: "advanced",
      timestamp: new Date().toISOString(),
    });
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
      logEvent("layout_board.new_box_max_reached", {
        max_nodes: LAYOUT_CONFIG.MAX_NODES,
        current_nodes: nodes.filter((n) => n.type !== "resizable").length,
      });
      alert(`최대 ${LAYOUT_CONFIG.MAX_NODES}개의 노드까지만 생성할 수 있습니다.`);
      setGhostNode(null);
      return;
    }

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    logEvent("layout_board.new_box_positioned", {
      position: position,
      screen_position: { x: e.clientX, y: e.clientY },
      board_type: "advanced",
    });

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
        setImageBoard(response.image);
        setGeneratedImageForRating(response.image);
        setShowRatingModal(true);
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
      // UUID를 사용한 고유한 엣지 ID 생성 (같은 노드들 사이에도 여러 엣지 가능)
      const edgeId = `edge-${uuidv4()}`;

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

  const handleRatingSubmit = (rating) => {
    logEvent("image_quality_rated", {
      rating: rating,
      // image_url: generatedImageForRating,
      global_caption: globalCaption,
    });
  };

  const getBaseScenarios = () => [
    {
      id: 1,
      caption: "A red tomato character",
      baseImage: baseImages.tomato,
      instances: [
        {
          id: "tomato-1",
          label: "Tomato",
          description: "A red tomato character",
          position: { x: 83, y: 163 },
          size: { width: 270, height: 348 }
        }
      ]
    },
    {
      id: 2,
      caption: "An animation-style racing car",
      baseImage: baseImages.car,
      instances: [
        {
          id: "car-1",
          label: "Car",
          description: "An animation-style racing car",
          position: { x: 72, y: 261 },
          size: { width: 280, height: 165 }
        }
      ]
    },
    {
      id: 3,
      caption: "Soccer player",
      baseImage: baseImages.player,
      instances: [
        {
          id: "player-1",
          label: "Player",
          description: "Soccer player",
          position: { x: 100, y: 208 },
          size: { width: 120, height: 328 }
        }
      ]
    }
  ];

  const handleLoadBaseScenario = (scenarioId) => {
    const baseScenarios = getBaseScenarios();
    const scenario = baseScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    // Clear existing nodes and instances
    setNodes([]);
    setInstances([]);
    setGlobalCaption(scenario.caption);

    // Create instances and nodes from scenario data
    const newInstances = [];
    const newNodes = [];

    scenario.instances.forEach(instanceData => {
      const sharedId = instanceData.id;
      const position = screenToFlowPosition({
        x: instanceData.position.x + LEFT_OFFSET,
        y: instanceData.position.y + TOP_OFFSET
      });

      // Create instance for ClassContext
      const instance = {
        id: sharedId,
        instanceLabel: instanceData.label,
        textDescription: instanceData.description,
        sceneGraph: { objects: [], relationships: [] },
        createdAt: new Date().toISOString(),
        isFromClass: false,
        classId: null,
        overrides: {},
        isGenerating: false,
      };

      newInstances.push(instance);

      // Create nodes for ReactFlow
      const objNode = {
        id: sharedId,
        type: "simple",
        position,
        data: createNodeDataFromInstance(instance, selectedInstanceId),
        style: { height: 40, width: 120 },
      };

      const resizableNode = {
        id: `${sharedId}-resizable`,
        type: "resizable",
        position,
        data: { ...objNode.data },
        style: instanceData.size,
      };

      newNodes.push(resizableNode, objNode);
    });

    setInstances(newInstances);
    setNodes(newNodes);

    // Load base image if available
    if (scenario.baseImage) {
      setImageBoard(scenario.baseImage);
      onImageGenerated(scenario.baseImage);
    }

    logEvent("base_scenario_loaded", {
      scenarioId,
      instanceCount: scenario.instances.length,
      caption: scenario.caption,
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


        <div style={{
          display: "flex",
          gap: "8px",
          marginTop: "8px",
          justifyContent: "center",
          position: "absolute",
          bottom: "-80px",
        }}>
          <CustomButton
            color="neutral"
            size="sm"
            onClick={() => handleLoadBaseScenario(1)}
          >
            Scenario 1
          </CustomButton>
          <CustomButton
            color="neutral"
            size="sm"
            onClick={() => handleLoadBaseScenario(2)}
          >
            Scenario 2
          </CustomButton>
          <CustomButton
            color="neutral"
            size="sm"
            onClick={() => handleLoadBaseScenario(3)}
          >
            Scenario 3
          </CustomButton>
        </div>
      </div>

      <GhostNode ghostNode={ghostNode} />

      <InlinePrompt
        inlinePrompt={inlinePrompt}
        onSubmit={handlePromptSubmit}
        onCancel={() => setInlinePrompt(null)}
      />

      <RelationshipInput
        relationshipInput={relationshipInput}
        onSubmit={handleRelationshipSubmit}
        onCancel={() => {
          setRelationshipInput(null);
          setEdges((eds) => eds.filter((edge) => edge.id !== relationshipInput?.edgeId));
        }}
      />

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

      <ObjectOverlay
        detectedObjects={detectedObjects}
        nodes={nodes}
        flowToScreenPosition={flowToScreenPosition}
        leftOffset={LEFT_OFFSET}
        topOffset={TOP_OFFSET}
        hoveredObject={hoveredObject}
        setHoveredObject={setHoveredObject}
        onObjectClick={handleObjectClick}
      />

      {showImageOnly && <ImageDisplay imageBoard={imageBoard} currentModel={currentModel} />}

      <ImageQualityRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        imageUrl={generatedImageForRating}
        onRatingSubmit={handleRatingSubmit}
      />
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
