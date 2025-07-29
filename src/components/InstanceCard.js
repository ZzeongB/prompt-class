import React, { useState, useEffect } from "react";
import { useClassContext } from "../context/ClassContext";
import SceneGraphVisualizer from "./SceneGraphVisualizer";
import {
  ChevronDown,
  ChevronRight,
  Link,
  Edit2,
  Package,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  generateTextToGraph,
  generateSceneGraphToText,
} from "../api/generateTextToGraph";
import { useInstanceActions } from "../utils/actions/useInstanceActions";
import { ToolbarButton } from "./nodeComponents/NodeToolbarMenu";

export default function InstanceCard({
  instance,
  classes,
  isSelected,
  onSelect,
}) {
  const { updateInstance, deleteInstance } = useClassContext();
  const { handleCreateClass } = useInstanceActions();

  const [isExpanded, setIsExpanded] = useState(isSelected);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isEditingGraph, setIsEditingGraph] = useState(false);
  const [tempDescription, setTempDescription] = useState(
    instance.textDescription
  );
  const [editedSceneGraph, setEditedSceneGraph] = useState(instance.sceneGraph);
  const [isUpdating, setIsUpdating] = useState(false);

  // tempDescription 동기화
  useEffect(() => {
    setTempDescription(instance.textDescription || "");
  }, [instance.textDescription]);

  useEffect(() => {
    if (instance.sceneGraph) setEditedSceneGraph(instance.sceneGraph);
  }, [instance]);

  useEffect(() => {
    if (isSelected) setIsExpanded(true);
  }, [isSelected]);

  const parentClass = instance.isFromClass
    ? classes.find((cls) => cls.id === instance.classId)
    : null;

  const isEditing = isEditingText || isEditingGraph;

  const handleSave = async () => {
    const textChanged =
      String(tempDescription || "").trim() !==
      String(instance.textDescription || "").trim();
    const graphChanged =
      JSON.stringify(editedSceneGraph) !== JSON.stringify(instance.sceneGraph);

    if (!textChanged && !graphChanged) {
      setIsEditingText(false);
      setIsEditingGraph(false);
      return;
    }

    setIsUpdating(true);
    try {
      let newSceneGraph = editedSceneGraph;
      let newLabel = instance.instanceLabel;
      let newTextDescription = tempDescription;

      if (textChanged) {
        const generated = await generateTextToGraph({
          newTextDescription: tempDescription,
          previousSceneGraph: instance.sceneGraph,
          previousTextDescription: instance.textDescription,
        });
        newSceneGraph = generated;
        newLabel = generated.objects?.[0]?.name || newLabel;
      }

      if (graphChanged) {
        const generated = await generateSceneGraphToText({
          newSceneGraph: newSceneGraph,
          previousSceneGraph: instance.sceneGraph,
          previousTextDescription: instance.textDescription,
        });
        newTextDescription = generated;
      }

      await updateInstance(instance.id, {
        textDescription: newTextDescription,
        sceneGraph: newSceneGraph,
        instanceLabel: newLabel,
      });

      setTempDescription(newTextDescription);
      setEditedSceneGraph(newSceneGraph);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update. Please try again.");
    } finally {
      setIsUpdating(false);
      setIsEditingText(false);
      setIsEditingGraph(false);
    }
  };

  const handleCancel = () => {
    setIsEditingText(false);
    setIsEditingGraph(false);
    setTempDescription(instance.textDescription);
    setEditedSceneGraph(instance.sceneGraph);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete "${instance.instanceLabel}"?`
      )
    ) {
      deleteInstance(instance.id);
    }
  };

  const handleEdit = () => {
    setIsEditingText(true);
    setIsExpanded(true); // 편집 시 자동으로 expand
    setTempDescription(instance.textDescription);
  };

  const handleEditGraph = () => {
    setIsEditingGraph(true);
    setIsExpanded(true); // 편집 시 자동으로 expand
    setEditedSceneGraph(instance.sceneGraph);
  };

  return (
    <div
      onClick={onSelect}
      style={{
        marginBottom: "8px",
        position: "relative",
        border: isEditing
          ? "2px solid #3b82f6"
          : isSelected
          ? "2px solid #3b82f6"
          : "1px solid #e2e8f0",
        borderRadius: "8px",
        backgroundColor: isEditing ? "#f8fafc" : "white",
        boxShadow:
          isEditing || isSelected
            ? "0 4px 12px rgba(59, 130, 246, 0.15)"
            : "0 1px 2px rgba(0,0,0,0.05)",
        transition: "all 0.2s ease",
        minHeight: isExpanded ? "200px" : "auto",
        cursor: "pointer",
      }}
    >
      {/* 인스턴스 정보 헤더 */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: isEditing ? "#eff6ff" : "rgba(241, 245, 249, 0.6)",
          borderRadius: "6px 6px 0 0",
          borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: isEditing ? "#1d4ed8" : "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isEditing && <Edit2 size={12} />}
            {instance.instanceLabel}
            {instance.isFromClass && parentClass && (
              <span
                style={{
                  fontSize: "10px",
                  backgroundColor: "#dbeafe",
                  color: "#3b82f6",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Link size={10} />
                {parentClass.name}
              </span>
            )}
            {isEditing && (
              <span
                style={{
                  fontSize: "10px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}
              >
                Editing
              </span>
            )}
          </div>

          {isEditingText ? (
            <textarea
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                width: "200px",
                fontSize: "11px",
                marginTop: "4px",
                padding: "6px",
                border: "1px solid #3b82f6",
                borderRadius: "6px",
                fontFamily: "inherit",
                // minHeight: "40px",
                resize: "vertical",
              }}
            />
          ) : (
            <div
              style={{
                fontSize: "10px",
                color: "#64748b",
                marginTop: "2px",
                lineHeight: "1.4",
                width: "215px",
              }}
            >
              {instance.textDescription}
            </div>
          )}
        </div>

        {/* Expand/Collapse 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: "#64748b",
            zIndex: 10,
          }}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {isUpdating && (
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              fontStyle: "italic",
              marginLeft: "8px",
            }}
          >
            Updating...
          </div>
        )}
      </div>

      {/* Expanded Section */}
      {isExpanded && (
        <div
          style={{
            width: "100%",
            height: "400px", // 고정 높이 설정
            maxHeight: "80vh", // 뷰포트 높이의 80%를 넘지 않도록
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "hidden", // 상위에서도 넘침 방지
          }}
        >
          <SceneGraphVisualizer
            sceneGraph={editedSceneGraph}
            onSceneGraphChange={(newGraph) => setEditedSceneGraph(newGraph)}
            instanceId={instance.id}
            isEditable={isEditingGraph}
            // compact
          />
        </div>
      )}

      {/* Toolbar - 우상단 배치 (ClassCard와 동일) */}
      <div style={{ position: "absolute", top: "5px", right: "8px" }}>
        <div
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            zIndex: 1000,
            padding: "4px",
            borderRadius: "6px",
            marginRight: "30px",
          }}
        >
          {isEditing ? (
            <>
              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                title="Save Changes"
                icon={<Check size={12} />}
              />

              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                title="Cancel Edit"
                icon={<X size={12} />}
              />
            </>
          ) : (
            <>
              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                title="Edit Description"
                icon={<Edit2 size={12} />}
              />

              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditGraph();
                }}
                title="Edit Graph"
                icon={<Edit2 size={12} />}
              />

              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateClass(instance, (msg) => alert(msg));
                }}
                title="Create Class"
                icon={<Package size={12} />}
              />

              <ToolbarButton
                onClick={handleDelete}
                title="Delete Instance"
                icon={<Trash2 size={12} />}
                danger={true}
              />
            </>
          )}
        </div>
      </div>

      {/* 편집 모드 표시 */}
      {isEditing && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "12px",
            fontSize: "10px",
            color: "#3b82f6",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              animation: "pulse 2s infinite",
            }}
          />
          {isEditingText ? "Editing description" : "Editing scene graph"}
        </div>
      )}

      {/* 업데이트 중 오버레이 */}
      {isUpdating && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              backgroundColor: "#3b82f6",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: "6px",
              fontSize: "12px",
            }}
          >
            Updating...
          </div>
        </div>
      )}
    </div>
  );
}
