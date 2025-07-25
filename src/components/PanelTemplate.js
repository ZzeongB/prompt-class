import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import TreeNode from "./TreeNode";
import PromptModal from "./PromptModal";
import NodeToolbarMenu from "./nodeComponents/NodeToolbarMenu";
import { WHITE } from "../utils/constants";
import { useInstanceActions } from "../utils/actions/useInstanceActions";

export default function PanelTemplate({
  id,
  data,
  isExpanded,
  setIsExpanded,
  sceneData,
  setSceneData,
  isUpdating,
  onInstanceLabelChange,
  onDescriptionChangeDebounced,
  onLabelChange,
  onDelete,
  modal,
  setModal,
  isClassMode = false,
  customToolbar = null, // 추가된 prop
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempLabelValue, setTempLabelValue] = useState("");
  const [tempDescriptionValue, setTempDescriptionValue] = useState("");
  const { handleCreateClass, handleDuplicateInstance } = useInstanceActions();

  const handleInstanceLabelEdit = (e) => {
    e.stopPropagation();
    setIsEditingLabel(true);
    setTempLabelValue(sceneData.instanceLabel);
  };

  const handleLabelSave = () => {
    if (tempLabelValue && tempLabelValue !== sceneData.instanceLabel) {
      onInstanceLabelChange(tempLabelValue);
    }
    setIsEditingLabel(false);
  };

  const handleLabelCancel = () => {
    setIsEditingLabel(false);
    setTempLabelValue("");
  };

  const handleDescriptionEdit = (e) => {
    e.stopPropagation();
    setIsEditingDescription(true);
    setTempDescriptionValue(sceneData.textDescription);
  };

  const handleDescriptionSave = () => {
    if (tempDescriptionValue !== sceneData.textDescription) {
      onDescriptionChangeDebounced(tempDescriptionValue);
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
          //   padding: "2px 0",
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
              cursor: isClassMode ? "default" : "text", // 클래스 모드에서는 편집 불가
              backgroundColor: "transparent",
            }}
            onDoubleClick={!isClassMode ? handleInstanceLabelEdit : undefined} // 클래스 모드에서는 편집 불가
            onMouseEnter={(e) => {
              if (!isClassMode) {
                e.target.style.backgroundColor = "#f3f4f6";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
            }}
          >
            {sceneData.instanceLabel}
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
        {!isClassMode && (
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
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
        )}
      </div>

      {/* 확장된 콘텐츠 (클래스 모드에서는 항상 표시) */}
      {(isExpanded || isClassMode) && (
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
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />
          ) : !isClassMode ? (
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
          ) : (
            <></>
          )}

          {/* Tree Section */}
          <TreeNode
            node={sceneData.tree}
            onLabelChange={onLabelChange}
            depth={0}
            isBaseline={isClassMode} // 클래스 모드에서는 트리 편집 불가
          />
        </div>
      )}

      {/* 모달 - 혹시 다른 곳에서 필요할 수도 있으니 남겨둠 */}
      {modal && (
        <PromptModal
          title={modal.title}
          defaultValue={modal.defaultValue}
          placeholder={modal.placeholder}
          onSubmit={modal.onSubmit}
          onCancel={modal.onCancel}
        />
      )}

      {/* 툴바 - 클래스 모드에서는 customToolbar 사용, 아니면 기본 툴바 */}
      {isClassMode && customToolbar ? (
        customToolbar
      ) : !isClassMode && isExpanded ? (
        <NodeToolbarMenu
          isVisible={isExpanded}
          onDelete={onDelete}
          style={{
            top: "10px",
          }}
          onDuplicate={() => handleCreateClass(sceneData, (msg) => alert(msg))}
        />
      ) : null}

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