import React, { useState, useEffect, useRef } from "react";
import { useReactFlow } from "@xyflow/react";
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

export default function InstancePanelNode({ id, data, onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(
    data?.justCreated === true
  );
  const [modal, setModal] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempLabelValue, setTempLabelValue] = useState("");
  const [tempDescriptionValue, setTempDescriptionValue] = useState("");

  const { updateInstance, deleteInstance, classes, instances } =
    useClassContext();
  const { handleCreateClass, handleDuplicateInstance } = useInstanceActions();
  const { getNodes, setNodes, deleteElements } = useReactFlow();

  // 로컬 sceneData 상태 (빠른 UI 반응용)
  const [sceneData, setSceneData] = useState({
    instanceLabel: data?.instanceLabel || data?.label || "New Box",
    textDescription: data?.textDescription || "",
    sceneGraph: data?.sceneGraph || {},
  });

  const hasPromptedRef = useRef(false);
  const syncingRef = useRef(false);

  // ClassContext 데이터와 동기화 (sceneGraph 변경 시 textDescription도 업데이트)
  useEffect(() => {
    if (syncingRef.current) return; // 자신이 업데이트한 경우 스킵

    const instanceData = instances.find((inst) => inst.id === id);
    if (instanceData) {
      const newSceneData = {
        instanceLabel: instanceData.instanceLabel || "New Box",
        textDescription: instanceData.textDescription || "",
        sceneGraph: instanceData.sceneGraph || {},
      };

      // sceneGraph가 변경되었는지 확인
      const sceneGraphChanged =
        JSON.stringify(newSceneData.sceneGraph) !==
        JSON.stringify(sceneData.sceneGraph);

      if (
        sceneGraphChanged &&
        Object.keys(newSceneData.sceneGraph).length > 0
      ) {
        // sceneGraph가 변경되었다면 textDescription 자동 생성
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

            // ClassContext도 업데이트
            syncingRef.current = true;
            updateInstance(id, { textDescription: newText });
            setTimeout(() => {
              syncingRef.current = false;
            }, 100);
          } catch (error) {
            console.error("Failed to generate text description:", error);
            // 에러 시 기본 업데이트만 수행
            setSceneData(newSceneData);
          }
        };

        updateTextDescription();
      } else {
        // sceneGraph 변경이 없으면 일반 동기화
        setSceneData(newSceneData);
      }
    }
  }, [instances, id]);

  // 현재 인스턴스가 클래스에서 파생되었는지 확인
  const instanceData = instances.find((inst) => inst.id === id) || {};
  const isFromClass = instanceData.isFromClass || data?.isFromClass;
  const parentClass = isFromClass
    ? classes.find((cls) => cls.id === (instanceData.classId || data?.classId))
    : null;

  const handleDelete = () => {
    deleteInstance(id);
  };

  // 양방향 동기화 헬퍼 함수
  const syncUpdate = (updates) => {
    syncingRef.current = true;

    // 1. 로컬 상태 즉시 업데이트 (빠른 UI 반응)
    setSceneData((prev) => ({ ...prev, ...updates }));

    // 2. ReactFlow 노드 업데이트
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

    // 3. ClassContext 업데이트
    updateInstance(id, updates);

    setTimeout(() => {
      syncingRef.current = false;
    }, 100);
  };

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
      // 에러 시 이전 상태로 복원
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
    // 즉시 로컬 상태 업데이트
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
      style={{
        // maxWidth: "150px",
        margin: "0 auto",
        padding: "4px",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e5e7eb",
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
              cursor: "text",
              backgroundColor: "transparent",
            }}
            onDoubleClick={handleInstanceLabelEdit}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            {sceneData.instanceLabel}
            {/* 클래스 연결 표시 */}
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
                cursor: "text",
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
              onDoubleClick={handleDescriptionEdit}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f3f4f6";
                e.target.style.color = "#374151";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = "#6b7280";
              }}
            >
              {sceneData.textDescription ||
                "Double-click to add description..."}
            </div>
          )}

          {/* SceneGraph Visualizer */}
          <SceneGraphVisualizer
            sceneGraph={sceneData.sceneGraph}
            onSceneGraphChange={handleSceneGraphChange}
          />
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
