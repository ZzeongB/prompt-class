// 1. LayoutBoard.js - 레이아웃과 관계만 담당
import { useCallback, useEffect, useState, useRef } from "react";
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
import { loadBaseImages, convertImageToBase64 } from "../utils/imageUtils";
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
import { exportSceneToPromptData, downloadSceneAsJSON, saveSceneToLocalStorage } from "../utils/sceneExporter";

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
  isTutorial
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
  const [showDetectedObjects, setShowDetectedObjects] = useState(true);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [relationshipInput, setRelationshipInput] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [generatedImageForRating, setGeneratedImageForRating] = useState(null);
  const [baseImages, setBaseImages] = useState({});
  // Always use FLUX model
  const currentModel = "flux";

  // Object merging state
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [selectedObjectsForMerge, setSelectedObjectsForMerge] = useState([]);

  // Tutorial state
  const [tutorialClickCount, setTutorialClickCount] = useState(0);

  const { instances, classes, setInstances, savedScenes, saveScene, loadScene, clearScene } = useClassContext();

  const syncFromReactFlow = useRef(false);
  const syncFromClassContext = useRef(false);
  const manualEdgesRef = useRef([]);

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
      isSelectedForMerge: selectedObjectsForMerge.includes(instance.id),
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
    setNodes((prev) => {
      // 선택 해제 or 대상 선택
      return prev.map((n) => {
        const isTarget = !!selectedInstanceId && n.id === selectedInstanceId;

        // React Flow에서 선택을 반영하려면 node.selected를 써야 함
        if (n.selected === isTarget) return n; // 불필요한 리렌더 방지
        return { ...n, selected: isTarget };
      });
    });
  }, [selectedInstanceId, setNodes]);

  // useEffect(() => {
  //   setNodes((nds) => {
  //     return nds.map((node) => {
  //       if (node.type === "simple") {
  //         const isHighlighted = node.data?.instanceId === selectedInstanceId;

  //         // 항상 새 객체를 반환하여 ReactFlow가 변경을 감지하도록 함
  //         return {
  //           ...node,
  //           data: {
  //             ...node.data,
  //             isHighlighted,
  //           },
  //         };
  //       }
  //       return node;
  //     });
  //   });
  // }, [selectedInstanceId]);

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
            (n) => n.id === instance.id
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
              zIndex: -1, // resizable node를 뒤쪽에 배치
            };

            updatedNodes.push(resizableNode, objNode);
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

  // 수동 edges 추적 및 업데이트
  useEffect(() => {
    setEdges((currentEdges) => {
      // 현재 수동 edges를 ref에 저장
      const currentManualEdges = currentEdges.filter(edge =>
        !edge.data?.isExtractedRelationship &&
        !edge.id.startsWith('extract-')
      );
      manualEdgesRef.current = currentManualEdges;
      return currentEdges;
    });
  }, [edges]);

  // Relationships → Edges 동기화
  useEffect(() => {
    setEdges((currentEdges) => {
      // 1. ref에서 수동 edges 가져오기 (더 안정적)
      const manualEdges = manualEdgesRef.current || [];

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
      const newEdges = [...manualEdges, ...extractEdges];

      // 기존 edges와 동일한지 확인하여 불필요한 업데이트 방지
      if (currentEdges.length === newEdges.length &&
        currentEdges.every(edge => newEdges.find(newEdge => newEdge.id === edge.id))) {
        return currentEdges;
      }

      return newEdges;
    });
  }, [instances]);

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
      zIndex: -1, // resizable node를 뒤쪽에 배치
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
        zIndex: -1, // resizable node를 뒤쪽에 배치
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

  const handleTutorialClick = async () => {
    if (tutorialClickCount >= 3) {
      // 3번째 클릭 후에는 더 이상 클릭되지 않음
      return;
    }

    const nextClickCount = tutorialClickCount + 1;
    setTutorialClickCount(nextClickCount);

    // 순서대로 이미지를 표시
    const tutorialImagePath = `/assets/tutorial/${nextClickCount}.png`;
    console.log("tutorialImagePath", tutorialImagePath)
    const tutorialImage = await Promise.resolve(convertImageToBase64(tutorialImagePath));
    console.log("tutorialImage", tutorialImage)
    setImageBoard(tutorialImage);
    onImageGenerated(tutorialImage);
    setGeneratedImageForRating(tutorialImage);
    setShowRatingModal(true);

    // count 1에서 detected object 추가
    if (nextClickCount === 1) {
      const tutorialDetectedObject = {
        label: "ball",
        confidence: 0.95,
        bbox: [39, 446, 83, 486] // x, y, x+width, y+height format
      };
      setDetectedObjects([tutorialDetectedObject]);
    }
    else {
      setDetectedObjects([]);
    }
  }

  const handleClick = async () => {
    setProgress(0);
    setIsGenerating(true);
    setErrorMessage("");
    setDetectedObjects([]); // Reset detected objects when starting new generation

    setTimeout(async () => {
      try {
        // Collect all node data with IDs for better tracking
        const nodeDataWithIds = nodes
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

            // Find corresponding resizable node for box dimensions
            const resizableNode = nodes.find(n2 => n2.id === `${n.id}-resizable`);
            const normalizedBox = resizableNode ? getNormalizedBox(
              resizableNode,
              flowToScreenPosition,
              LEFT_OFFSET,
              TOP_OFFSET,
              true
            ) : null;

            return {
              nodeId: n.id,
              instanceId: instance?.id,
              instanceLabel: instance?.instanceLabel,
              textDescription: description,
              sceneGraph: instance?.sceneGraph || { objects: [], relationships: [] },
              resizableBox: normalizedBox,
              nodePosition: n.position
            };
          });

        // Extract data for backend (maintaining original format)
        const sentences = nodeDataWithIds.map(d => d.textDescription);
        const boxes = nodeDataWithIds.map(d => d.resizableBox).filter(b => b !== null);

        // Collect edge information with full details
        const edgeData = edges.map((edge) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          const sourceInstance = instances.find(inst => inst.id === sourceNode?.data?.instanceId);
          const targetInstance = instances.find(inst => inst.id === targetNode?.data?.instanceId);

          return {
            edgeId: edge.id,
            sourceNodeId: edge.source,
            targetNodeId: edge.target,
            sourceInstanceId: sourceInstance?.id,
            targetInstanceId: targetInstance?.id,
            sourceLabel: sourceInstance?.instanceLabel || sourceNode?.data?.label,
            targetLabel: targetInstance?.instanceLabel || targetNode?.data?.label,
            relation: edge.data?.relation || edge.label || "related to",
            isExtractedRelationship: edge.data?.isExtractedRelationship || false
          };
        });

        // Log all the data before generation
        logEvent("layout_board.generate_clicked", {
          board_type: "advanced",
          timestamp: new Date().toISOString(),
          nodeData: nodeDataWithIds, // All data linked by IDs
          edges: edgeData, // Detailed edge information
          globalCaption: globalCaption,
          nodeCount: nodeDataWithIds.length,
          edgeCount: edges.length
        });

        const userId = sessionStorage.getItem("user_id") || "P1";
        const response = await generateImageFromInstanceData(
          sentences,
          boxes,
          globalCaption,
          null, // requiredKeywords
          userId
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
      const userId = sessionStorage.getItem("user_id") || "P1";
      const descriptionResult = await generateDescription(
        imageBoard,
        obj.bbox,
        globalCaption,
        userId
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
        if (isMergeMode) {
          // Merge mode: toggle object selection
          const instanceId = node.data?.instanceId;
          if (instanceId) {
            setSelectedObjectsForMerge(prev => {
              if (prev.includes(instanceId)) {
                return prev.filter(id => id !== instanceId);
              } else {
                return [...prev, instanceId];
              }
            });
          }
        } else {
          onNodeSelect?.(node.data?.instanceId);
        }
      }
    },
    [onNodeSelect, isMergeMode]
  );

  // 배경 클릭 시 선택 해제
  const handlePaneClick = useCallback(() => {
    if (isMergeMode) {
      setSelectedObjectsForMerge([]);
    } else {
      onNodeSelect?.(null);
    }
    // 인라인 프롬프트도 닫기
    if (inlinePrompt) {
      setInlinePrompt(null);
    }
    // 관계 입력창도 닫기
    if (relationshipInput) {
      setRelationshipInput(null);
    }
  }, [onNodeSelect, inlinePrompt, relationshipInput, isMergeMode]);

  // 엣지 연결 핸들러
  const onConnect = useCallback(
    (params) => {
      // UUID를 사용한 고유한 엣지 ID 생성 (같은 노드들 사이에도 여러 엣지 가능)
      const edgeId = `edge-${uuidv4()}`;

      // Get source and target instance information
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      const sourceInstance = instances.find(inst => inst.id === sourceNode?.data?.instanceId);
      const targetInstance = instances.find(inst => inst.id === targetNode?.data?.instanceId);

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
        label: "related", // 임시 label 표시
        labelStyle: {
          fontSize: "10px",
          fontWeight: "500",
          color: "#475569",
        },
      };

      // Log edge creation
      logEvent("layout_board.edge_created", {
        edgeId,
        sourceNodeId: params.source,
        targetNodeId: params.target,
        sourceInstanceId: sourceInstance?.id,
        targetInstanceId: targetInstance?.id,
        sourceLabel: sourceInstance?.instanceLabel || sourceNode?.data?.label,
        targetLabel: targetInstance?.instanceLabel || targetNode?.data?.label,
        isTemporary: true,
        timestamp: new Date().toISOString()
      });

      // 엣지를 먼저 추가 (addEdge 대신 직접 추가하여 중복 허용)
      setEdges((eds) => {
        const newEdges = [...eds, tempEdge];
        // 수동 edges ref 업데이트
        manualEdgesRef.current = newEdges.filter(edge =>
          !edge.data?.isExtractedRelationship &&
          !edge.id.startsWith('extract-')
        );
        return newEdges;
      });

      // 관계 입력창 표시
      setRelationshipInput({
        edgeId,
        sourceId: params.source,
        targetId: params.target,
        edgeParams: params,
      });
    },
    [setEdges, nodes, instances]
  );

  // 관계명 입력 완료 핸들러
  const handleRelationshipSubmit = useCallback((relationshipText) => {
    if (!relationshipText || !relationshipText.trim() || !relationshipInput) {
      // Get instance information for logging
      const sourceNode = nodes.find(n => n.id === relationshipInput?.sourceId);
      const targetNode = nodes.find(n => n.id === relationshipInput?.targetId);
      const sourceInstance = instances.find(inst => inst.id === sourceNode?.data?.instanceId);
      const targetInstance = instances.find(inst => inst.id === targetNode?.data?.instanceId);

      // Log edge cancellation
      logEvent("layout_board.edge_cancelled", {
        edgeId: relationshipInput?.edgeId,
        sourceNodeId: relationshipInput?.sourceId,
        targetNodeId: relationshipInput?.targetId,
        sourceInstanceId: sourceInstance?.id,
        targetInstanceId: targetInstance?.id,
        sourceLabel: sourceInstance?.instanceLabel || sourceNode?.data?.label,
        targetLabel: targetInstance?.instanceLabel || targetNode?.data?.label,
        timestamp: new Date().toISOString()
      });

      // 관계명이 없으면 엣지 삭제
      setEdges((eds) => {
        const filteredEdges = eds.filter((edge) => edge.id !== relationshipInput.edgeId);
        // 수동 edges ref 업데이트
        manualEdgesRef.current = filteredEdges.filter(edge =>
          !edge.data?.isExtractedRelationship &&
          !edge.id.startsWith('extract-')
        );
        return filteredEdges;
      });
      setRelationshipInput(null);
      return;
    }

    // Get instance information for logging
    const sourceNode = nodes.find(n => n.id === relationshipInput.sourceId);
    const targetNode = nodes.find(n => n.id === relationshipInput.targetId);
    const sourceInstance = instances.find(inst => inst.id === sourceNode?.data?.instanceId);
    const targetInstance = instances.find(inst => inst.id === targetNode?.data?.instanceId);

    // Log relationship confirmation
    logEvent("layout_board.edge_relationship_confirmed", {
      edgeId: relationshipInput.edgeId,
      sourceNodeId: relationshipInput.sourceId,
      targetNodeId: relationshipInput.targetId,
      sourceInstanceId: sourceInstance?.id,
      targetInstanceId: targetInstance?.id,
      sourceLabel: sourceInstance?.instanceLabel || sourceNode?.data?.label,
      targetLabel: targetInstance?.instanceLabel || targetNode?.data?.label,
      relation: relationshipText.trim(),
      timestamp: new Date().toISOString()
    });

    // 엣지 업데이트 (임시 상태 해제, 관계명 설정)
    setEdges((eds) => {
      const updatedEdges = eds.map((edge) =>
        edge.id === relationshipInput.edgeId
          ? {
            ...edge,
            data: {
              ...edge.data,
              relation: relationshipText.trim(),
              isTemporary: false,
            },
            style: UI_CONFIG.EDGE_STYLES.SOLID,
            label: relationshipText.trim(), // label도 업데이트
            labelStyle: {
              fontSize: "10px",
              fontWeight: "500",
              color: "#475569",
            },
          }
          : edge
      );

      // 수동 edges ref 업데이트
      manualEdgesRef.current = updatedEdges.filter(edge =>
        !edge.data?.isExtractedRelationship &&
        !edge.id.startsWith('extract-')
      );

      return updatedEdges;
    });

    setRelationshipInput(null);
  }, [relationshipInput, setEdges, nodes, instances]);

  const handleRatingSubmit = (rating) => {
    logEvent("image_quality_rated", {
      rating: rating,
      // image_url: generatedImageForRating,
      global_caption: globalCaption,
    });
  };

  const handleExportScene = useCallback(() => {
    try {
      const sceneData = exportSceneToPromptData(
        nodes,
        edges,
        instances,
        globalCaption,
        flowToScreenPosition
      );
      
      downloadSceneAsJSON(sceneData);
      
      logEvent("scene_exported", {
        sceneId: sceneData.id,
        nodeCount: sceneData.nodeCount,
        edgeCount: sceneData.edgeCount,
        exportedAt: sceneData.exportedAt
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Export failed: ${error.message}`);
    }
  }, [nodes, edges, instances, globalCaption, flowToScreenPosition]);

  const handleMergeObjects = async () => {
    console.log("handleMergeObjects", selectedObjectsForMerge);
    if (selectedObjectsForMerge.length < 2) {
      alert("최소 2개의 객체를 선택해야 합니다.");
      return;
    }

    try {
      const selectedInstances = instances.filter(inst =>
        selectedObjectsForMerge.includes(inst.id)
      );

      // Get current node positions for selected instances
      const instancesWithNodeInfo = selectedInstances.map(instance => {
        const node = nodes.find(n => n.data?.instanceId === instance.id && n.type === "resizable");
        const simpleNode = nodes.find(n => n.data?.instanceId === instance.id && n.type === "simple");

        return {
          ...instance,
          nodePosition: node?.position || simpleNode?.position,
          nodeSize: node?.style || { width: 50, height: 50 }
        };
      });

      console.log("selected with node info", instancesWithNodeInfo)

      // Import the merge function
      const { mergeInstancesIntoOne } = await import('../utils/InstanceOperations');
      const mergedInstance = await mergeInstancesIntoOne(instancesWithNodeInfo, nodes, edges, flowToScreenPosition, LEFT_OFFSET, TOP_OFFSET);
      console.log("mergedInstance", mergedInstance)

      // Add merged instance and remove original instances
      const remainingInstances = instances.filter(inst =>
        !selectedObjectsForMerge.includes(inst.id)
      );
      setInstances([...remainingInstances, mergedInstance]);

      // Clear merge mode
      setIsMergeMode(false);
      setSelectedObjectsForMerge([]);

      logEvent("objects_merged", {
        originalCount: selectedObjectsForMerge.length,
        mergedInstanceId: mergedInstance.id,
        originalInstanceIds: selectedObjectsForMerge
      });

    } catch (error) {
      console.error("Failed to merge objects:", error);
      alert(`객체 병합 실패: ${error.message}`);
    }
  };


  const handleSaveScene = (slotNumber) => {
    const sceneData = {
      image: imageBoard,
      globalCaption,
      instances: instances.map(instance => ({ ...instance })),
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        style: node.measured
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: edge.data,
        style: edge.style,
        label: edge.label,
        labelStyle: edge.labelStyle
      }))
    };
    setGlobalCaption("");

    saveScene(slotNumber, sceneData);

    logEvent("scene_saved", {
      slotNumber,
      instanceCount: instances.length,
      nodeCount: nodes.length,
      edgeCount: edges.length
    });
  };

  const handleLoadScene = (slotNumber) => {
    const sceneData = loadScene(slotNumber);
    if (!sceneData) return;

    // Clear existing data first
    setNodes([]);
    setInstances([]);
    setEdges([]);

    // Load scene data
    setImageBoard(sceneData.image);
    setGlobalCaption(sceneData.globalCaption || "");

    // Load instances first
    const loadedInstances = sceneData.instances || [];
    setInstances(loadedInstances);

    // Recreate nodes with proper positioning and sizing
    const newNodes = [];
    loadedInstances.forEach(instance => {
      const savedNode = sceneData.nodes?.find(n => n.id === instance.id);
      const savedResizableNode = sceneData.nodes?.find(n => n.id === `${instance.id}-resizable`);

      if (savedNode && savedResizableNode) {
        // Use saved position and size data
        const nodeData = createNodeDataFromInstance(instance, selectedInstanceId);

        const objNode = {
          id: instance.id,
          type: "simple",
          position: savedNode.position,
          data: nodeData,
          style: savedNode.style || { height: 40, width: 120 },
        };

        const resizableNode = {
          id: `${instance.id}-resizable`,
          type: "resizable",
          position: savedResizableNode.position,
          data: { ...nodeData },
          style: savedResizableNode.style || { width: 50, height: 50 },
          zIndex: -1, // resizable node를 뒤쪽에 배치
        };

        newNodes.push(resizableNode, objNode);
      }
    });

    setNodes(newNodes);
    setEdges(sceneData.edges || []);

    // Update image board in parent component
    if (sceneData.image) {
      onImageGenerated(sceneData.image);
    }

    logEvent("scene_loaded", {
      slotNumber,
      instanceCount: sceneData.instances?.length || 0,
      nodeCount: newNodes.length,
      edgeCount: sceneData.edges?.length || 0
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
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "nowrap",
        }}
      >
        {!isMergeMode &&
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
        }
        <CustomButton
          color={isMergeMode ? "orange" : "grey"}
          size="sm"
          onClick={() => {
            if (isMergeMode) {
              setIsMergeMode(false);
              setSelectedObjectsForMerge([]);
            } else {
              setIsMergeMode(true);
            }
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: "bold",
            }}
          >
            {isMergeMode ? "Cancel Merge" : "Merge Objects"}
          </span>
        </CustomButton>

        {isMergeMode && selectedObjectsForMerge.length >= 2 && (
          <CustomButton
            color="green"
            size="sm"
            onClick={handleMergeObjects}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: "bold",
              }}
            >
              Confirm Merge ({selectedObjectsForMerge.length})
            </span>
          </CustomButton>
        )}

        {!isMergeMode && (
          <>
            <CustomButton
              color={showImageOnly ? "grey" : "neutral"}
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
                {showImageOnly ? "Show Layout" : "Show Image"}
              </span>
            </CustomButton>

            <CustomButton
              color={showDetectedObjects ? "grey" : "neutral"}
              size="sm"
              onClick={() => setShowDetectedObjects(!showDetectedObjects)}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "bold",
                }}
              >
                {showDetectedObjects ? "Hide Detections" : "Show Detections"}
              </span>
            </CustomButton>

            {/* <CustomButton
              color="teal"
              size="sm"
              onClick={handleExportScene}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "bold",
                }}
              >
                Export Scene
              </span>
            </CustomButton> */}
          </>
        )}


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
            onClick={isTutorial ? handleTutorialClick : handleClick}
            color="purpleBlue"
            size="lg"
            disabled={isGenerating}
          >
            {isTutorial ? "GENERATE" : isGenerating ? "Generating" : "Generate"}
          </CustomButton>
        </div>


        <div style={{
          display: "flex",
          gap: "1px",
          marginTop: "8px",
          justifyContent: "center",
          position: "absolute",
          bottom: "-110px",
        }}>
          {[1, 2, 3, 4, 5, 6].map((slotNumber) => {
            const hasScene = savedScenes[slotNumber];
            return (
              <div key={slotNumber} style={{ display: "flex", flexDirection: "column", gap: "2px", minHeight: "60px" }}>
                <CustomButton
                  color={hasScene ? "green" : "neutral"}
                  size="sm"
                  onClick={() => handleSaveScene(slotNumber)}
                >
                  Save {slotNumber}
                </CustomButton>
                <CustomButton
                  color={hasScene ? "blue" : "grey"}
                  size="sm"
                  onClick={() => hasScene && handleLoadScene(slotNumber)}
                  disabled={!hasScene}
                >
                  Load {slotNumber}
                </CustomButton>
              </div>
            );
          })}
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
          setEdges((eds) => {
            const filteredEdges = eds.filter((edge) => edge.id !== relationshipInput?.edgeId);
            // 수동 edges ref 업데이트
            manualEdgesRef.current = filteredEdges.filter(edge =>
              !edge.data?.isExtractedRelationship &&
              !edge.id.startsWith('extract-')
            );
            return filteredEdges;
          });
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
      {!showImageOnly && showDetectedObjects && (<ObjectOverlay
        detectedObjects={detectedObjects}
        nodes={nodes}
        flowToScreenPosition={flowToScreenPosition}
        leftOffset={LEFT_OFFSET}
        topOffset={TOP_OFFSET}
        hoveredObject={hoveredObject}
        setHoveredObject={setHoveredObject}
        onObjectClick={handleObjectClick}
      />)}


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
  isTutorial,
}) {
  console.log("LayoutBoardWithProvider selectedInstanceId:", selectedInstanceId);
  return (
    <ReactFlowProvider debounce={200}>
      <LayoutBoard
        onImageGenerated={onImageGenerated}
        newInstanceToAdd={newInstanceToAdd}
        onInstanceAdded={onInstanceAdded}
        onNodeSelect={onNodeSelect}
        selectedInstanceId={selectedInstanceId}
        isTutorial={isTutorial}
      />
    </ReactFlowProvider>
  );
}
