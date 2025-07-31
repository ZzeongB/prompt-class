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
import { generateDescription } from "../api/generateDescription";
import {
  generateTextToGraph,
  generateInstanceLabelFromDescription,
} from "../api/generateTextToGraph";
import { switchModel, getCurrentModel } from "../api/modelSwitch";
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
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [inlinePrompt, setInlinePrompt] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  // const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [hoveredObject, setHoveredObject] = useState(null);
  const [currentModel, setCurrentModel] = useState("sd3");
  const [isSwitchingModel, setIsSwitchingModel] = useState(false);

  const { image, setImage } = useImage();
  const { instances, classes, setInstances, updateInstance, deleteInstance } =
    useClassContext();

  const syncFromReactFlow = useRef(false);
  const syncFromClassContext = useRef(false);

  // Calculate Intersection over Union (IOU) between two bounding boxes
  const calculateIOU = (box1, box2) => {
    const [x1_1, y1_1, x2_1, y2_1] = box1;
    const [x1_2, y1_2, x2_2, y2_2] = box2;

    // Calculate intersection area
    const x1_inter = Math.max(x1_1, x1_2);
    const y1_inter = Math.max(y1_1, y1_2);
    const x2_inter = Math.min(x2_1, x2_2);
    const y2_inter = Math.min(y2_1, y2_2);

    if (x2_inter <= x1_inter || y2_inter <= y1_inter) {
      return 0; // No intersection
    }

    const intersectionArea = (x2_inter - x1_inter) * (y2_inter - y1_inter);

    // Calculate union area
    const area1 = (x2_1 - x1_1) * (y2_1 - y1_1);
    const area2 = (x2_2 - x1_2) * (y2_2 - y1_2);
    const unionArea = area1 + area2 - intersectionArea;

    return intersectionArea / unionArea;
  };

  // useEffect(() => {
  //   setNodes((prevNodes) =>
  //     prevNodes.map((node) => {
  //       if (node.type === "simple") {
  //         const isHighlighted = node.data?.instanceId === selectedInstanceId;
  //         return {
  //           ...node,
  //           data: {
  //             ...node.data,
  //             isHighlighted,
  //           },
  //         };
  //       }
  //       return node;
  //     })
  //   );
  // }, [selectedInstanceId, setNodes]);

  // Load current model on component mount
  useEffect(() => {
    const loadCurrentModel = async () => {
      try {
        const modelInfo = await getCurrentModel();
        setCurrentModel(modelInfo.current_model);
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
            const parentClass = instance.isFromClass
              ? classes.find((cls) => cls?.id === instance.classId)
              : null;

            const isHighlighted = selectedInstanceId === instance.id;
            console.log(`Updating node for instance ${instance.instanceLabel}: selectedInstanceId=${selectedInstanceId}, instance.id=${instance.id}, isHighlighted=${isHighlighted}`);
            
            const updatedData = {
              ...updatedNodes[nodeIndex].data,
              label: instance.instanceLabel, // ReactFlow 기본 label 필드도 업데이트
              instanceLabel: instance.instanceLabel,
              isFromClass: instance.isFromClass,
              classId: instance.classId,
              parentClassName: parentClass?.name,
              hasOverrides:
                instance.overrides &&
                Object.keys(instance.overrides).length > 0,
              isHighlighted,
            };

            // 클래스 연결 상태 로깅
            if (instance.isFromClass) {
              console.log(
                `Instance ${instance.instanceLabel} is linked to class: ${parentClass?.name}`
              );
            }

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

            const parentClass = instance.isFromClass
              ? classes.find((cls) => cls?.id === instance.classId)
              : null;

            // Calculate position and size from detected object bounding box
            let position, resizableSize;
            if (instance.detectedObject && instance.detectedObject.bbox) {
              const scaleFactor = currentModel === "sd3" ? 0.5 : 1;
              const scaledBbox = [
                instance.detectedObject.bbox[0] * scaleFactor,
                instance.detectedObject.bbox[1] * scaleFactor,
                instance.detectedObject.bbox[2] * scaleFactor,
                instance.detectedObject.bbox[3] * scaleFactor,
              ];

              const bboxPosition = {
                x: scaledBbox[0] + LEFT_OFFSET,
                y: scaledBbox[1] + TOP_OFFSET,
              };
              position = screenToFlowPosition(bboxPosition);

              // Calculate size from bounding box
              const width = scaledBbox[2] - scaledBbox[0];
              const height = scaledBbox[3] - scaledBbox[1];
              resizableSize = { width, height };
            } else {
              // Fallback for non-detected objects
              position = instance.nodePosition || { x: 50, y: 50 };
              resizableSize = { width: 50, height: 50 };
            }

            const objNode = {
              id: sharedId,
              type: "simple",
              position,
              data: {
                label: instance.instanceLabel || "New Instance",
                sharedId,
                instanceId: sharedId,
                instanceLabel: instance.instanceLabel || "New Instance",
                isFromClass: instance.isFromClass || false,
                parentClassName: parentClass?.name || null,
                hasOverrides:
                  instance.overrides &&
                  Object.keys(instance.overrides).length > 0,
                isHighlighted: selectedInstanceId === instance.id,
              },
            };

            const resizableNode = {
              id: `${sharedId}-resizable`,
              type: "resizable",
              position,
              data: {
                label: instance.instanceLabel || "New Instance",
                sharedId,
                instanceId: sharedId,
                instanceLabel: instance.instanceLabel || "New Instance",
                isFromClass: instance.isFromClass || false,
                parentClassName: parentClass?.name || null,
                textDescription: instance.textDescription || "",
                hasOverrides:
                  instance.overrides &&
                  Object.keys(instance.overrides).length > 0,
              },
              style: resizableSize,
            };

            // 새 인스턴스의 클래스 연결 상태 로깅
            if (instance.isFromClass) {
              console.log(
                `New instance ${instance.instanceLabel} created from class: ${parentClass?.name}`
              );
            }

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
      // 1. 기존 intra-instance relationships 처리
      if (instance.sceneGraph?.relationships) {
        instance.sceneGraph.relationships.forEach((rel) => {
          // 관계의 대상이 다른 인스턴스인지 확인
          const targetInstance = instances.find((inst) =>
            inst.sceneGraph?.objects?.some((obj) => obj.id === rel.target)
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
              style: {
                stroke: "#cbd5e1", // SceneGraphVisualizer와 동일한 색상
                strokeWidth: 1.5,
                strokeDasharray: "5,5", // 점선으로 표시
              },
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

    const parentClass = instanceData.isFromClass
      ? classes.find((cls) => cls?.id === instanceData.classId)
      : null;

    // Calculate position and size from detected object bounding box
    let position, resizableSize;
    if (instanceData.detectedObject && instanceData.detectedObject.bbox) {
      const scaleFactor = currentModel === "sd3" ? 0.5 : 1;
      const scaledBbox = [
        instanceData.detectedObject.bbox[0] * scaleFactor,
        instanceData.detectedObject.bbox[1] * scaleFactor,
        instanceData.detectedObject.bbox[2] * scaleFactor,
        instanceData.detectedObject.bbox[3] * scaleFactor,
      ];

      const bboxPosition = {
        x: scaledBbox[0] + LEFT_OFFSET,
        y: scaledBbox[1] + TOP_OFFSET,
      };
      position = screenToFlowPosition(bboxPosition);

      // Calculate size from bounding box
      const width = scaledBbox[2] - scaledBbox[0];
      const height = scaledBbox[3] - scaledBbox[1];
      resizableSize = { width, height };
    } else {
      // Fallback for non-detected objects
      position = instanceData.nodePosition || { x: 50, y: 50 };
      resizableSize = { width: 50, height: 50 };
    }

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
        isHighlighted: selectedInstanceId === instanceData.id,
      },
      style: { height: 40, width: 120 },
    };

    const { isHighlighted, ...objNodeDataWithoutHighlight } = objNode.data;
    const resizableNode = {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position,
      data: {
        ...objNodeDataWithoutHighlight,
        textDescription: instanceData.textDescription || "",
      },
      style: resizableSize,
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

    // 인라인 프롬프트 입력창 표시
    setInlinePrompt({
      position: { x: e.clientX - LEFT_OFFSET, y: e.clientY - TOP_OFFSET },
      flowPosition: position,
    });
    setGhostNode(null);
  };

  const handlePromptSubmit = async (description) => {
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

        console.log("Generated sentences with relationships:", sentences);

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
        console.log("response", response);

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
      console.log("Generating description for object:", obj.label);
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
      console.log(
        "Converting description to scene graph:",
        descriptionResult.description
      );
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

      // 4. Calculate position from bounding box
      const scaleFactor = currentModel === "sd3" ? 0.5 : 1;
      const scaledBbox = [
        obj.bbox[0] * scaleFactor,
        obj.bbox[1] * scaleFactor,
        obj.bbox[2] * scaleFactor,
        obj.bbox[3] * scaleFactor,
      ];

      // Convert screen coordinates to flow coordinates (add LEFT_OFFSET and TOP_OFFSET for proper screen positioning)
      const bboxPosition = {
        x: scaledBbox[0] + LEFT_OFFSET,
        y: scaledBbox[1] + TOP_OFFSET,
      };
      const flowPosition = screenToFlowPosition(bboxPosition);

      // 5. Create new instance with proper structure
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
        // Add position information for node placement
        nodePosition: flowPosition,
      };

      // 6. Add instance to context
      setInstances((prev) => [...prev, newInstance]);

      logEvent("instance_created_from_detection", {
        instanceId: newInstance.id,
        label: instanceLabel,
        originalObjectLabel: obj.label,
      });

      console.log(
        "Successfully created instance from detected object:",
        newInstance
      );
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

  const handleModelSwitch = async (newModelType) => {
    try {
      setIsSwitchingModel(true);

      logEvent("model_switch_requested", {
        from_model: currentModel,
        to_model: newModelType,
      });

      const result = await switchModel(newModelType);
      setCurrentModel(newModelType);

      logEvent("model_switch_completed", {
        new_model: newModelType,
        message: result.message,
      });

      console.log("Model switched successfully:", result.message);
    } catch (error) {
      console.error("Failed to switch model:", error);
      logEvent("model_switch_failed", {
        error: error.message,
        attempted_model: newModelType,
      });
      alert(`Failed to switch model: ${error.message}`);
    } finally {
      setIsSwitchingModel(false);
    }
  };

  const onNodeDragStop = (_, node) => {
    logEvent("layout.node.moved", {
      nodeId: node.id,
      newPos: node.position,
    });
  };

  const handleNodesChange = useCallback(
    (changes) => {
      console.log("chages", changes)
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
        setSelectedNodeId(node.data?.instanceId);
        onNodeSelect?.(node.data?.instanceId);
      }
    },
    [onNodeSelect]
  );

  // 배경 클릭 시 선택 해제
  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    onNodeSelect?.(null);
    // 인라인 프롬프트도 닫기
    if (inlinePrompt) {
      setInlinePrompt(null);
    }
  }, [onNodeSelect, inlinePrompt]);

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
        <CustomButton
          color={currentModel === "sd3" ? "purpleBlue" : "grey"}
          size="sm"
          onClick={() => handleModelSwitch("sd3")}
          disabled={isSwitchingModel}
        >
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>
            SD3 {currentModel === "sd3" ? "✓" : ""}
          </span>
        </CustomButton>
        <CustomButton
          color={currentModel === "flux" ? "purpleBlue" : "grey"}
          size="sm"
          onClick={() => handleModelSwitch("flux")}
          disabled={isSwitchingModel}
        >
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>
            FLUX {currentModel === "flux" ? "✓" : ""}
          </span>
        </CustomButton>

        {/* Model Selection Buttons
        <div style={{ display: "flex", gap: "4px" }}>
          
        </div> */}

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
              placeholder="Describe what you want to create..."
              autoFocus
              style={{
                width: "100%",
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

      {!showImageOnly && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
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

      {/* Bounding boxes overlay - filter out overlapping ones */}
      {detectedObjects
        .filter((obj, index) => {
          // Scale bounding boxes for StableDiffusion models (SD3) - reduce by half since image is 1024x1024 but display is 512x512
          const scaleFactor = currentModel === "sd3" ? 0.5 : 1;
          const scaledBbox = [
            obj.bbox[0] * scaleFactor,
            obj.bbox[1] * scaleFactor,
            obj.bbox[2] * scaleFactor,
            obj.bbox[3] * scaleFactor,
          ];

          // Get existing layout boxes from resizable nodes
          const layoutBoxes = nodes
            .filter((n) => n.type === "resizable")
            .map((n) => {
              const screenPos = flowToScreenPosition(n.position);
              const x1 = screenPos.x - LEFT_OFFSET;
              const y1 = screenPos.y - TOP_OFFSET;
              const x2 = x1 + (n.width || n.style?.width || 50);
              const y2 = y1 + (n.height || n.style?.height || 50);
              return [x1, y1, x2, y2];
            });

          // Check if detected object overlaps significantly with any layout box
          const hasHighOverlap = layoutBoxes.some((layoutBox) => {
            const iou = calculateIOU(scaledBbox, layoutBox);
            return iou > 0.3; // Threshold for overlap (30%)
          });

          return !hasHighOverlap; // Only show if no high overlap
        })
        .map((obj, index) => {
          console.log("obj, ids", obj, index);
          // Scale bounding boxes for StableDiffusion models (SD3) - reduce by half since image is 1024x1024 but display is 512x512
          const scaleFactor = currentModel === "sd3" ? 0.5 : 1;
          const scaledBbox = [
            obj.bbox[0] * scaleFactor,
            obj.bbox[1] * scaleFactor,
            obj.bbox[2] * scaleFactor,
            obj.bbox[3] * scaleFactor,
          ];

          console.log("scaledBbox", scaledBbox);

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${(scaledBbox[0] / 512) * 100}%`,
                top: `${(scaledBbox[1] / 512) * 100}%`,
                width: `${((scaledBbox[2] - scaledBbox[0]) / 512) * 100}%`,
                height: `${((scaledBbox[3] - scaledBbox[1]) / 512) * 100}%`,
                border: "3px solid #ff0000",
                backgroundColor: "rgba(255, 0, 0, 0.2)",
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

          {/* Model switching indicator */}
          {isSwitchingModel && (
            <div
              styge={{
                position: "absolute",
                top: "40px",
                right: "10px",
                backgroundColor: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "5px 10px",
                borderRadius: "15px",
                fontSize: "12px",
                zIndex: 15,
              }}
            >
              Switching model...
            </div>
          )}

          {/* Current model indicator */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
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
