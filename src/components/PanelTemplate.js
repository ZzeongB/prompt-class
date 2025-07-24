import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import TreeNode from "./TreeNode";
import PromptModal from "./PromptModal";
import NodeToolbarMenu from "./nodeComponents/NodeToolbarMenu";
import { WHITE } from "../utils/constants";

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
  showToolbar = true,
}) {
  return (
    <div
      style={{
        margin: "0 auto",
        padding: "5px",
        border: "2px solid #000",
        borderRadius: "0",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        overflow: "hidden",
        opacity: isUpdating ? 0.7 : 1,
        transition: "opacity 0.3s",
      }}
    >
      {/* Instance Label Section */}
      <div
        style={{
          marginBottom: isExpanded ? "4px" : "0",
          flex: "0 0 auto",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: "900",
            color: "#000",
            fontFamily: "Arial, sans-serif",
            lineHeight: "1.2",
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            const newLabel = prompt(
              "Enter new label:",
              sceneData.instanceLabel
            );
            if (newLabel && newLabel !== sceneData.instanceLabel) {
              onInstanceLabelChange(newLabel);
            }
          }}
        >
          {sceneData.instanceLabel}
        </div>
        <span
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            padding: "2px",
            fontSize: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
        >
          {isExpanded ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </span>
        {isUpdating && (
          <span style={{ color: "#007bff", fontSize: "9px" }}>
            {" "}
            Updating...
          </span>
        )}
      </div>

      {/* 확장된 콘텐츠 */}
      {isExpanded && (
        <>
          {/* Text Description Section */}
          <div
            style={{
              marginBottom: "4px",
              flex: "0 0 auto",
              background: WHITE,
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: "#888",
                lineHeight: "1.2",
                fontFamily: "Arial, sans-serif",
                fontStyle: "italic",
                cursor: "text",
                minHeight: "12px",
                padding: "2px",
                border: "1px solid transparent",
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                const newDescription = prompt(
                  "Enter new description:",
                  sceneData.textDescription
                );
                if (
                  newDescription &&
                  newDescription !== sceneData.textDescription
                ) {
                  onDescriptionChangeDebounced(newDescription);
                }
              }}
            >
              {sceneData.textDescription}
            </div>
          </div>

          <TreeNode
            node={sceneData.tree}
            onLabelChange={onLabelChange}
            depth={0}
          />
        </>
      )}

      {modal && (
        <PromptModal
          title={modal.title}
          defaultValue={modal.defaultValue}
          onSubmit={modal.onSubmit}
          onCancel={modal.onCancel}
        />
      )}

      {showToolbar && (
        <NodeToolbarMenu
          isVisible={isExpanded}
          onDelete={onDelete}
          style={{ top: "10px" }}
        />
      )}
    </div>
  );
}
