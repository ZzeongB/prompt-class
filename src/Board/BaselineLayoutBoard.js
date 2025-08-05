import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  NodeToolbar,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DefaultEdge, defaultEdgeOptions } from "../components/DefaultEdge";
import SimpleLayoutNode from "../components/nodes/SimpleLayoutNode";
import ResizableNode from "../components/nodes/ResizableNode";
import { syncMovedNodePositions } from "../utils/node/syncNodePositions";
import { getNormalizedBox } from "../utils/node/getNormalizedBox";
import { generateImageFromInstanceData } from "../api/generateImage";
import ProgressBar from "../components/ProgressBar";
import CustomButton from "../components/CustomButton";
import ImageQualityRatingModal from "../components/modal/ImageQualityRatingModal";
import { logEvent } from "../api/logEvent";
import { ToolbarButton } from "../components/nodeComponents/NodeToolbarMenu";
import { Edit2, Trash2 } from "lucide-react";
import {
  LEFT_OFFSET_BASELINE as LEFT_OFFSET,
  TOP_OFFSET,
} from "../utils/constants";
import { v4 as uuidv4 } from "uuid";
import { loadBaseImages } from "../utils/imageUtils";


const edgeTypes = {
  main: DefaultEdge,
};
const nodeTypes = {
  simple: SimpleLayoutNode,
  resizable: ResizableNode,
};

function BaselineLayoutBoard({ onImageGenerated, onNodeSelect, selectedInstanceId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, , onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [imageBoard, setImageBoard] = useState();
  const [globalCaption, setGlobalCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ghostNode, setGhostNode] = useState(null);
  const [showImageOnly, setShowImageOnly] = useState(false);
  const [inlinePrompt, setInlinePrompt] = useState(null);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [toolbarVisible, setToolbarVisible] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [generatedImageForRating, setGeneratedImageForRating] = useState(null);
  const [baseImages, setBaseImages] = useState({});
  const toolbarTimeoutRef = useRef(null);

  // Load base images on component mount
  useEffect(() => {
    const loadImages = async () => {
      const images = await loadBaseImages();
      setBaseImages(images);
    };
    loadImages();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toolbarTimeoutRef.current) {
        clearTimeout(toolbarTimeoutRef.current);
      }
    };
  }, []);

  // Highlight selected nodes
  useEffect(() => {
    setNodes((nds) => {
      return nds.map((node) => {
        if (node.type === "simple") {
          const isHighlighted = node.data?.instanceId === selectedInstanceId;

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
    logEvent("layout_board.new_box_initiated", {
      board_type: "baseline",
      timestamp: new Date().toISOString(),
    });
    setGhostNode({
      id: `ghost-${Date.now()}`,
      type: "simple",
      data: { label: "New Box" },
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

    // Show inline prompt input
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

    const objNode = {
      id: sharedId,
      type: "simple",
      position,
      data: {
        label: description.trim(),
        sharedId,
        instanceId: sharedId,
        instanceLabel: description.trim(),
        isFromClass: false,
        parentClassName: null,
        hasOverrides: false,
        isHighlighted: selectedInstanceId === sharedId,
      },
      style: { height: 40, width: 120 },
    };

    const resizableNode = {
      id: `${sharedId}-resizable`,
      type: "resizable",
      position,
      data: {
        ...objNode.data,
        textDescription: description.trim(),
      },
      style: { height: 50, width: 50 },
    };

    setNodes((prev) => [...prev, resizableNode, objNode]);
    setInlinePrompt(null);

    logEvent("baselineboard.node.add.instance", {
      instanceId: sharedId,
      instanceLabel: description.trim(),
      createdNodeIds: [objNode.id, resizableNode.id],
    });
  };

  // Node selection handler
  const handleNodeClick = useCallback(
    (_, node) => {
      if (node.type !== "resizable") {
        onNodeSelect?.(node.data?.instanceId);
      }
    },
    [onNodeSelect]
  );

  // Mouse enter handler for showing toolbar
  const handleNodeMouseEnter = useCallback(
    (_, node) => {
      if (node.type === "simple") {
        if (toolbarTimeoutRef.current) {
          clearTimeout(toolbarTimeoutRef.current);
        }
        setHoveredNodeId(node.id);
        setToolbarVisible(node.id);
      }
    },
    []
  );

  // Mouse leave handler for hiding toolbar with delay
  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
    // Add delay before hiding toolbar to allow clicking
    toolbarTimeoutRef.current = setTimeout(() => {
      setToolbarVisible(null);
    }, 300); // 300ms delay
  }, []);

  // Keep toolbar visible when hovering over it
  const handleToolbarMouseEnter = useCallback((nodeId) => {
    if (toolbarTimeoutRef.current) {
      clearTimeout(toolbarTimeoutRef.current);
    }
    setToolbarVisible(nodeId);
  }, []);

  // Hide toolbar when leaving toolbar area
  const handleToolbarMouseLeave = useCallback(() => {
    toolbarTimeoutRef.current = setTimeout(() => {
      setToolbarVisible(null);
    }, 100); // Shorter delay when leaving toolbar
  }, []);

  // Deselect on background click
  const handlePaneClick = useCallback(() => {
    onNodeSelect?.(null);
    if (inlinePrompt) {
      setInlinePrompt(null);
    }
  }, [onNodeSelect, inlinePrompt]);

  // Delete node functionality
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((prevNodes) => {
      const nodeToDelete = prevNodes.find(n => n.id === nodeId);
      if (!nodeToDelete) return prevNodes;

      const sharedId = nodeToDelete.data?.sharedId || nodeId;
      const nodesToDelete = prevNodes.filter(
        n => n.id === nodeId || n.data?.sharedId === sharedId || n.id === `${sharedId}-resizable`
      );

      logEvent("baselineboard.node.delete", {
        nodeId,
        sharedId,
        deletedNodeIds: nodesToDelete.map(n => n.id)
      });

      return prevNodes.filter(n => !nodesToDelete.includes(n));
    });
  }, [setNodes]);

  // Edit node functionality
  const handleEditNode = useCallback((nodeId) => {
    setEditingNodeId(nodeId);
  }, []);

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
      nodes: [
        {
          id: "tomato-1", label: "Tomato", position: { x: 83, y: 163 },
          size: { width: 270, height: 348 }
        }
      ]
    },
    {
      id: 2,
      caption: "An animation-style racing car",
      baseImage: baseImages.car,
      nodes: [
        {
          id: "car-1", label: "Car", position: { x: 72, y: 261 },
          size: { width: 280, height: 165 }
        }
      ]
    },
    {
      id: 3,
      caption: "Soccer player",
      baseImage: baseImages.player,
      nodes: [
        {
          id: "player-1", label: "Player",
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

    // Clear existing nodes
    setNodes([]);
    setGlobalCaption(scenario.caption);

    // Create nodes from scenario data
    const newNodes = [];
    scenario.nodes.forEach(nodeData => {
      const sharedId = nodeData.id;
      const position = screenToFlowPosition({
        x: nodeData.position.x + LEFT_OFFSET,
        y: nodeData.position.y + TOP_OFFSET
      });

      const objNode = {
        id: sharedId,
        type: "simple",
        position,
        data: {
          label: nodeData.label,
          sharedId,
          instanceId: sharedId,
          instanceLabel: nodeData.label,
          isFromClass: false,
          parentClassName: null,
          hasOverrides: false,
          isHighlighted: false,
        },
        style: { height: 40, width: 120 },
      };

      const resizableNode = {
        id: `${sharedId}-resizable`,
        type: "resizable",
        position,
        data: {
          ...objNode.data,
          textDescription: nodeData.label,
        },
        style: nodeData.size,
      };

      newNodes.push(resizableNode, objNode);
    });

    setNodes(newNodes);

    // Load base image if available
    if (scenario.baseImage) {
      setImageBoard(scenario.baseImage);
      onImageGenerated(scenario.baseImage);
    }

    logEvent("base_scenario_loaded", {
      scenarioId,
      nodeCount: scenario.nodes.length,
      caption: scenario.caption,
    });
  };

  const handleSaveEdit = useCallback((nodeId, newLabel) => {
    setNodes((prevNodes) => {
      return prevNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
              instanceLabel: newLabel,
            }
          };
        }
        // Also update the paired resizable node
        const sharedId = node.data?.sharedId || node.id;
        if (node.id === `${sharedId}-resizable` && nodeId === sharedId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
              instanceLabel: newLabel,
            }
          };
        }
        return node;
      });
    });

    setEditingNodeId(null);

    logEvent("baselineboard.node.edit", {
      nodeId,
      newLabel
    });
  }, [setNodes]);

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
        setImageBoard(response.image);
        setGeneratedImageForRating(response.image);
        setShowRatingModal(true);
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
          color={"grey"}
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

      {!showImageOnly && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
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
          nodeDragBounds={{
            left: 0,
            top: 0,
            right: 512,
            bottom: 512,
          }}
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
        >
          {/* Node Toolbars */}
          {nodes
            .filter(node => node.type === "simple")
            .map(node => (
              <NodeToolbar
                key={`toolbar-${node.id}`}
                nodeId={node.id}
                isVisible={toolbarVisible === node.id || selectedInstanceId === node.data?.instanceId}
                position={Position.Top}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  padding: "4px",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  zIndex: 1000,
                  top: 10,
                }}
                onMouseEnter={() => handleToolbarMouseEnter(node.id)}
                onMouseLeave={handleToolbarMouseLeave}
              >
                <ToolbarButton
                  title="Edit label"
                  icon={<Edit2 size={12} />}
                  onClick={() => {
                    const currentLabel = node.data?.label || node.data?.instanceLabel || "";
                    const newLabel = prompt("Edit label:", currentLabel);
                    if (newLabel !== null && newLabel.trim() !== "" && newLabel !== currentLabel) {
                      handleSaveEdit(node.id, newLabel.trim());
                    }
                  }}
                />
                <ToolbarButton
                  title="Delete"
                  icon={<Trash2 size={12} />}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this node?")) {
                      handleDeleteNode(node.id);
                    }
                  }}
                  danger={true}
                />
              </NodeToolbar>
            ))}
        </ReactFlow>
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

      <ImageQualityRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        imageUrl={generatedImageForRating}
        onRatingSubmit={handleRatingSubmit}
      />
    </div>
  );
}

function BaselineLayoutBoardWithProvider({ onImageGenerated, onNodeSelect, selectedInstanceId }) {
  return (
    <ReactFlowProvider debounce={200}>
      <BaselineLayoutBoard
        onImageGenerated={onImageGenerated}
        onNodeSelect={onNodeSelect}
        selectedInstanceId={selectedInstanceId}
      />
    </ReactFlowProvider>
  );
}

export default BaselineLayoutBoardWithProvider;
