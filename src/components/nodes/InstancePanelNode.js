// 3. InstancePanelNode.js에 드래그 처리 및 새 인스턴스 생성 로직 추가
import React, { useState, useEffect, useRef } from "react";
import { useReactFlow, Handle, Position } from "@xyflow/react";
import { ChevronRight, ChevronDown, Plus, Trash2, Link } from "lucide-react";
import {
  generateSceneGraphToText,
  generateTextToGraph,
} from "../../api/generateTextToGraph";
import PromptModal from "../modal/PromptModal";
import NodeToolbarMenu from "../nodeComponents/NodeToolbarMenu";
import SceneGraphVisualizer from "../SceneGraphVisualizer";
import { useClassContext } from "../../context/ClassContext";
import { useInstanceActions } from "../../utils/actions/useInstanceActions";
import { v4 as uuidv4 } from "uuid";

export default function InstancePanelNode({ id, data, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(
    data?.justCreated === true
  );
  const [modal, setModal] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingGraph, setIsEditingGraph] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempLabelValue, setTempLabelValue] = useState("");
  const [tempDescriptionValue, setTempDescriptionValue] = useState("");

  // 드래그 관련 상태
  const [isDragTarget, setIsDragTarget] = useState(false);
  const [draggedObject, setDraggedObject] = useState(null);

  const { updateInstance, deleteInstance, classes, instances, setInstances } =
    useClassContext();
  const { handleCreateClass, handleDuplicateInstance } = useInstanceActions();
  const { getNodes, setNodes, deleteElements, screenToFlowPosition } =
    useReactFlow();

  // 로컬 sceneData 상태
  const [sceneData, setSceneData] = useState({
    instanceLabel: data?.instanceLabel || data?.label || "New Box",
    textDescription: data?.textDescription || "",
    sceneGraph: data?.sceneGraph || {},
  });

  const hasPromptedRef = useRef(false);
  const syncingRef = useRef(false);
  const panelRef = useRef(null);

  // ClassContext 데이터와 동기화
  useEffect(() => {
    if (syncingRef.current) return;

    const instanceData = instances.find((inst) => inst.id === id);
    if (instanceData) {
      const newSceneData = {
        instanceLabel: instanceData.instanceLabel || "New Box",
        textDescription: instanceData.textDescription || "",
        sceneGraph: instanceData.sceneGraph || {},
      };

      const sceneGraphChanged =
        JSON.stringify(newSceneData.sceneGraph) !==
        JSON.stringify(sceneData.sceneGraph);

      if (
        sceneGraphChanged &&
        Object.keys(newSceneData.sceneGraph).length > 0
      ) {
        const updateTextDescription = async () => {
          try {
            const newText = await generateSceneGraphToText({
              newSceneGraph: newSceneData.sceneGraph,
              previousSceneGraph: sceneData.sceneGraph,
              previousTextDescription: sceneData.textDescription,
            });

            setSceneData({
              ...newSceneData,
              textDescription: newText,
            });

            syncingRef.current = true;
            updateInstance(id, { textDescription: newText });
            setTimeout(() => {
              syncingRef.current = false;
            }, 100);
          } catch (error) {
            console.error("Failed to generate text description:", error);
            setSceneData(newSceneData);
          }
        };

        updateTextDescription();
      } else {
        setSceneData(newSceneData);
      }
    }
  }, [instances, id]);

  // 드래그 관련 이벤트 핸들러
  const handleObjectDragStart = (object, sourceInstanceId) => {
    console.log("Object drag started from instance:", sourceInstanceId);
    setDraggedObject({ object, sourceInstanceId });

    // 전역 드래그 상태 설정 (다른 인스턴스들이 드롭 존을 표시할 수 있도록)
    document.body.style.cursor = "grabbing";

    // 모든 인스턴스 패널에 드래그 상태 알림
    const event = new CustomEvent("objectDragStart", {
      detail: { object, sourceInstanceId },
    });
    window.dispatchEvent(event);
  };

  const handleObjectDragEnd = async (
    object,
    sourceInstanceId,
    dropPosition
  ) => {
    console.log("Object drag ended:", object, "at:", dropPosition);

    // 드래그 상태 초기화
    setDraggedObject(null);
    setIsDragTarget(false);
    document.body.style.cursor = "default";

    // 전역 드래그 종료 알림
    const event = new CustomEvent("objectDragEnd");
    window.dispatchEvent(event);

    // 현재 패널 영역 밖으로 드래그되었는지 확인
    if (panelRef.current && sourceInstanceId === id) {
      const rect = panelRef.current.getBoundingClientRect();
      const isOutsidePanel =
        dropPosition.x < rect.left ||
        dropPosition.x > rect.right ||
        dropPosition.y < rect.top ||
        dropPosition.y > rect.bottom;

      if (isOutsidePanel) {
        // 새로운 인스턴스 생성
        await createNewInstanceFromObject(
          object,
          sourceInstanceId,
          dropPosition
        );
      }
    }
  };

  // 새로운 인스턴스 생성 함수
  const createNewInstanceFromObject = async (
    draggedObject,
    sourceInstanceId,
    dropPosition
  ) => {
    try {
      console.log("Creating new instance from object:", draggedObject);

      // 1. 새로운 sceneGraph 생성 (드래그된 객체만 포함)
      const newSceneGraph = {
        objects: [{ ...draggedObject }],
        relationships: [],
      };

      // 2. 새로운 인스턴스 데이터 생성
      const newInstanceId = `instance-${uuidv4()}`;
      const newInstance = {
        id: newInstanceId,
        instanceLabel: draggedObject.name || "Extracted Object",
        textDescription: `Object extracted from instance`,
        sceneGraph: newSceneGraph,
        createdAt: new Date().toISOString(),
        isFromClass: false,
        classId: null,
        overrides: {},
      };

      // 3. ClassContext에 새 인스턴스 추가
      setInstances((prev) => [...prev, newInstance]);

      // 4. ReactFlow에 새 노드 추가 (드롭 위치 근처에)
      const flowPosition = screenToFlowPosition({
        x: dropPosition.x,
        y: dropPosition.y,
      });

      const objNode = {
        id: newInstanceId,
        type: "instance-group",
        position: {
          x: Math.max(0, Math.min(450, flowPosition.x - 25)),
          y: Math.max(0, Math.min(450, flowPosition.y - 25)),
        },
        data: {
          baseline: false,
          label: newInstance.instanceLabel,
          type: "object",
          sharedId: newInstanceId,
          classId: "__baseline__",
          instanceId: newInstanceId,
          justCreated: false,
          instanceLabel: newInstance.instanceLabel,
          textDescription: newInstance.textDescription,
          sceneGraph: newInstance.sceneGraph,
          isFromClass: false,
          overrides: {},
          parentClassName: null,
          hasOverrides: false,
        },
        updatedAt: new Date().toISOString(),
        style: { height: 20 },
      };

      const resizableNode = {
        id: `${newInstanceId}-resizable`,
        type: "resizable",
        position: objNode.position,
        data: objNode.data,
        style: { height: 50, width: 50 },
      };

      setNodes((prev) => [...prev, resizableNode, objNode]);

      // 5. 원본 인스턴스에서 객체 제거
      await removeObjectFromInstance(draggedObject.id, sourceInstanceId);

      // 6. relationship이 있었다면 edge 생성
      await createEdgeIfRelationshipExists(
        draggedObject,
        sourceInstanceId,
        newInstanceId
      );
    } catch (error) {
      console.error("Failed to create new instance from object:", error);
      alert("Failed to extract object. Please try again.");
    }
  };

  // 원본 인스턴스에서 객체 제거
  const removeObjectFromInstance = async (objectId, sourceInstanceId) => {
    const sourceInstance = instances.find(
      (inst) => inst.id === sourceInstanceId
    );
    if (!sourceInstance) return;

    const updatedSceneGraph = {
      ...sourceInstance.sceneGraph,
      objects: sourceInstance.sceneGraph.objects.filter(
        (obj) => obj.id !== objectId
      ),
      relationships: sourceInstance.sceneGraph.relationships.filter(
        (rel) => rel.source !== objectId && rel.target !== objectId
      ),
    };

    // 텍스트 설명도 업데이트
    try {
      const newText = await generateSceneGraphToText({
        newSceneGraph: updatedSceneGraph,
        previousSceneGraph: sourceInstance.sceneGraph,
        previousTextDescription: sourceInstance.textDescription,
      });

      updateInstance(sourceInstanceId, {
        sceneGraph: updatedSceneGraph,
        textDescription: newText,
        instanceLabel:
          updatedSceneGraph.objects?.[0]?.name || sourceInstance.instanceLabel,
      });
    } catch (error) {
      console.error("Failed to update source instance:", error);
      // 에러 시에도 sceneGraph는 업데이트
      updateInstance(sourceInstanceId, { sceneGraph: updatedSceneGraph });
    }
  };

  // relationship이 있었다면 edge 생성
  const createEdgeIfRelationshipExists = async (
    draggedObject,
    sourceInstanceId,
    newInstanceId
  ) => {
    const sourceInstance = instances.find(
      (inst) => inst.id === sourceInstanceId
    );
    if (!sourceInstance) return;

    // 드래그된 객체와 관련된 relationship 찾기
    const relatedRelationships = sourceInstance.sceneGraph.relationships.filter(
      (rel) =>
        rel.source === draggedObject.id || rel.target === draggedObject.id
    );

    console.log("Found related relationships:", relatedRelationships);

    if (relatedRelationships.length > 0) {
      // 전역 이벤트 발생 (LayoutBoard에서 edge 생성)
      const event = new CustomEvent("objectExtracted", {
        detail: {
          draggedObject,
          sourceInstanceId,
          newInstanceId,
          relationships: relatedRelationships,
        },
      });
      window.dispatchEvent(event);

      console.log("Object extraction event dispatched with relationships");
    }
  };

  // 전역 드래그 이벤트 리스너
  useEffect(() => {
    const handleGlobalDragStart = (e) => {
      const { object, sourceInstanceId } = e.detail;
      if (sourceInstanceId !== id) {
        setIsDragTarget(true); // 다른 인스턴스에서 드래그가 시작되면 드롭 타겟으로 설정
      }
    };

    const handleGlobalDragEnd = () => {
      setIsDragTarget(false);
      setDraggedObject(null);
    };

    window.addEventListener("objectDragStart", handleGlobalDragStart);
    window.addEventListener("objectDragEnd", handleGlobalDragEnd);

    return () => {
      window.removeEventListener("objectDragStart", handleGlobalDragStart);
      window.removeEventListener("objectDragEnd", handleGlobalDragEnd);
    };
  }, [id]);

  // 기존 인스턴스 정보
  const instanceData = instances.find((inst) => inst.id === id) || {};
  const isFromClass = instanceData.isFromClass || data?.isFromClass;
  const parentClass = isFromClass
    ? classes.find((cls) => cls.id === (instanceData.classId || data?.classId))
    : null;

  // 기존 함수들은 그대로 유지...
  const handleDelete = () => {
    deleteInstance(id);
  };

  const syncUpdate = (updates) => {
    syncingRef.current = true;
    setSceneData((prev) => ({ ...prev, ...updates }));
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id || node.data?.sharedId === data.sharedId) {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );
    updateInstance(id, updates);
    setTimeout(() => {
      syncingRef.current = false;
    }, 100);
  };

  // 기존 이벤트 핸들러들...
  useEffect(() => {
    if (data?.justCreated && isInitializing && !hasPromptedRef.current) {
      hasPromptedRef.current = true;
      setModal({
        title: "Enter description:",
        defaultValue: "",
        onSubmit: (description) => {
          setModal(null);
          if (description) {
            handleInitialDescriptionInput(description);
          } else {
            setIsInitializing(false);
            syncUpdate({ justCreated: false });
          }
        },
        onCancel: () => {
          setModal(null);
          setIsInitializing(false);
          syncUpdate({ justCreated: false });
        },
      });
    }
  }, [data?.justCreated, isInitializing]);

  const handleInitialDescriptionInput = async (description) => {
    setIsUpdating(true);
    try {
      const sceneGraph = await generateTextToGraph({
        newTextDescription: description,
      });
      const instanceLabel = sceneGraph.objects?.[0]?.name || "New Box";

      syncUpdate({
        instanceLabel,
        textDescription: description,
        sceneGraph,
        justCreated: false,
      });

      onUpdate?.({
        label: instanceLabel,
        textDescription: description,
        justCreated: false,
      });
    } catch (error) {
      console.error("Failed to generate initial scene graph:", error);
    } finally {
      setIsUpdating(false);
      setIsInitializing(false);
    }
  };

  const handleInstanceLabelChange = async (newLabel) => {
    syncUpdate({ instanceLabel: newLabel });
    onUpdate?.({ label: newLabel });
  };

  const handleDescriptionChange = async (newDescription) => {
    if (!newDescription || newDescription === sceneData.textDescription) return;

    setIsUpdating(true);
    const prevText = sceneData.textDescription;
    const prevGraph = sceneData.sceneGraph;
    const currLabel = sceneData.instanceLabel;

    try {
      const sceneGraph = await generateTextToGraph({
        newTextDescription: newDescription,
        previousSceneGraph: prevGraph,
        previousTextDescription: prevText,
      });
      const instanceLabel = sceneGraph.objects?.[0]?.name || currLabel;

      syncUpdate({
        instanceLabel,
        textDescription: newDescription,
        sceneGraph,
      });

      onUpdate?.({
        label: instanceLabel,
        textDescription: newDescription,
      });
    } catch (error) {
      console.error("Failed to update the scene:", error);
      alert("Failed to update the scene. Please try again.");
      setSceneData((prev) => ({ ...prev, textDescription: prevText }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSceneGraphChange = async (updatedSceneGraph, update = true) => {
    if (!update) {
      syncUpdate({ sceneGraph: updatedSceneGraph });
      return;
    }

    setIsUpdating(true);

    try {
      const newText = await generateSceneGraphToText({
        newSceneGraph: updatedSceneGraph,
        previousSceneGraph: sceneData.sceneGraph,
        previousTextDescription: sceneData.textDescription,
      });
      const newLabel =
        updatedSceneGraph.objects?.[0]?.name || sceneData.instanceLabel;

      syncUpdate({
        instanceLabel: newLabel,
        textDescription: newText,
        sceneGraph: updatedSceneGraph,
      });

      onUpdate?.({
        label: newLabel,
        textDescription: newText,
      });
    } catch (error) {
      console.error(
        "Failed to update from sceneGraph:",
        updatedSceneGraph,
        error
      );
      alert("Scene update failed. Try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const [descriptionTimeout, setDescriptionTimeout] = useState(null);
  const handleDescriptionChangeWithDebounce = (newDescription) => {
    setSceneData((prev) => ({ ...prev, textDescription: newDescription }));

    if (descriptionTimeout) clearTimeout(descriptionTimeout);

    const timeoutId = setTimeout(() => {
      handleDescriptionChange(newDescription);
    }, 1000);
    setDescriptionTimeout(timeoutId);
  };

  useEffect(() => {
    return () => {
      if (descriptionTimeout) clearTimeout(descriptionTimeout);
    };
  }, [descriptionTimeout]);

  // Label 편집 핸들러
  const handleInstanceLabelEdit = (e) => {
    e.stopPropagation();
    setIsEditingLabel(true);
    setTempLabelValue(sceneData.instanceLabel);
  };

  const handleLabelSave = () => {
    if (tempLabelValue && tempLabelValue !== sceneData.instanceLabel) {
      handleInstanceLabelChange(tempLabelValue);
    }
    setIsEditingLabel(false);
  };

  const handleLabelCancel = () => {
    setIsEditingLabel(false);
    setTempLabelValue("");
  };

  // Description 편집 핸들러
  const handleDescriptionEdit = (e) => {
    e.stopPropagation();
    setIsEditingDescription(true);
    setTempDescriptionValue(sceneData.textDescription);
  };

  const handleDescriptionSave = () => {
    if (tempDescriptionValue !== sceneData.textDescription) {
      handleDescriptionChangeWithDebounce(tempDescriptionValue);
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setIsEditingDescription(false);
    setTempDescriptionValue("");
  };

  return (
    <div
      className="nodrag"
      ref={panelRef}
      style={{
        margin: "0 auto",
        padding: "4px",
        background: isDragTarget
          ? "linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: isDragTarget ? "2px dashed #3b82f6" : "1px solid #e5e7eb",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        overflow: "visible",
        opacity: isUpdating ? 0.7 : 1,
        transition: "all 0.15s ease",
        boxShadow: isHovered
          ? "0 4px 12px -2px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        position: "relative",
        transform: isHovered ? "translateY(-1px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ReactFlow Handles - edge 연결을 위해 필요 */}
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      {/* 드래그 타겟 오버레이 */}
      {isDragTarget && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            color: "#3b82f6",
            fontWeight: "600",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          Drop object here to merge
        </div>
      )}

      {/* Instance Label Section */}
      <div
        style={{
          marginBottom: "0",
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {isEditingLabel ? (
          <input
            type="text"
            value={tempLabelValue}
            onChange={(e) => setTempLabelValue(e.target.value)}
            onBlur={handleLabelSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLabelSave();
              } else if (e.key === "Escape") {
                handleLabelCancel();
              }
            }}
            autoFocus
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#1f2937",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: "1.3",
              flex: 1,
              padding: "2px 4px",
              borderRadius: "4px",
              border: "1px solid #3b82f6",
              outline: "none",
              backgroundColor: "#ffffff",
              boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#1f2937",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: "1.3",
              flex: 1,
              padding: "2px 4px",
              borderRadius: "4px",
              transition: "all 0.15s ease",
              cursor: "default", // 더블클릭 제거, 툴바로만 편집
              backgroundColor: "transparent",
            }}
          >
            {sceneData.instanceLabel}
            {isFromClass && (
              <span
                style={{
                  marginLeft: "4px",
                  fontSize: "9px",
                  color: "#3b82f6",
                  fontWeight: "500",
                }}
              >
                <Link
                  size={8}
                  style={{ display: "inline", verticalAlign: "middle" }}
                />
                {parentClass?.name}
              </span>
            )}
          </div>
        )}

        {/* 상태 표시 */}
        {isUpdating ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#3b82f6",
              fontSize: "9px",
              fontWeight: "500",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#3b82f6",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            Updating...
          </div>
        ) : null}

        {/* 확장/축소 버튼 */}
        <button
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
            transition: "all 0.15s ease",
            fontSize: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#f3f4f6";
            e.target.style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "#6b7280";
          }}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* 확장된 콘텐츠 */}
      {isExpanded && (
        <div style={{ marginTop: "0px" }}>
          {/* Text Description Section */}
          {isEditingDescription ? (
            <textarea
              value={tempDescriptionValue}
              onChange={(e) => setTempDescriptionValue(e.target.value)}
              onBlur={handleDescriptionSave}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleDescriptionSave();
                } else if (e.key === "Escape") {
                  handleDescriptionCancel();
                }
              }}
              autoFocus
              style={{
                fontSize: "9px",
                color: "#1f2937",
                lineHeight: "1.4",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontStyle: "normal",
                cursor: "text",
                minHeight: "12px",
                width: "100%",
                border: "1px solid #3b82f6",
                borderRadius: "4px",
                padding: "2px 4px",
                outline: "none",
                backgroundColor: "#ffffff",
                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                resize: "none",
                overflow: "hidden",
                boxSizing: "border-box",
                wordWrap: "break-word",
                wordBreak: "break-word",
                marginBottom: "4px",
                maxWidth: "200px",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
          ) : (
            <div
              style={{
                fontSize: "9px",
                color: "#6b7280",
                lineHeight: "1.4",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontStyle: "italic",
                cursor: "default", // 더블클릭 제거
                minHeight: "12px",
                overflow: "hidden",
                wordWrap: "break-word",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
                marginBottom: "4px",
                padding: "2px 4px",
                borderRadius: "4px",
                transition: "all 0.15s ease",
                maxWidth: "200px",
              }}
            >
              {sceneData.textDescription ||
                "Click toolbar to edit description..."}
            </div>
          )}

          {/* SceneGraph Visualizer */}
          <div
            onMouseDown={(e) => {
              // SceneGraph 영역에서의 드래그는 ObjectNode 드래그가 우선되도록 함
              e.stopPropagation();
            }}
          >
            <SceneGraphVisualizer
              sceneGraph={sceneData.sceneGraph}
              onSceneGraphChange={handleSceneGraphChange}
              onObjectDragStart={handleObjectDragStart}
              onObjectDragEnd={handleObjectDragEnd}
              instanceId={id}
              isEditable={isExpanded && isEditingGraph} // 확장된 상태일 때만 편집 가능
            />
          </div>
        </div>
      )}

      {/* 모달 */}
      {modal && (
        <PromptModal
          title={modal.title}
          defaultValue={modal.defaultValue}
          placeholder={modal.placeholder}
          onSubmit={modal.onSubmit}
          onCancel={modal.onCancel}
        />
      )}

      {/* 툴바 */}
      {isExpanded && (
        <NodeToolbarMenu
          isVisible={isExpanded}
          onDelete={handleDelete}
          style={{
            top: "10px",
            left: "50px",
          }}
          onDuplicate={() =>
            handleCreateClass({ ...sceneData, id: id }, (msg) => alert(msg))
          }
          // Label 편집을 위한 props 추가
          isEditing={isEditingGraph}
          onEditToggle={() => setIsEditingGraph(!isEditingGraph)}
          onSave={() => setIsEditingGraph(false)}
        />
      )}

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}
