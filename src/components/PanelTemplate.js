import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2, Link } from "lucide-react";
import PromptModal from "./modal/PromptModal";
import NodeToolbarMenu from "./nodeComponents/NodeToolbarMenu";
import { WHITE } from "../utils/constants";
import { useInstanceActions } from "../utils/actions/useInstanceActions";
import SceneGraphVisualizer from "./SceneGraphVisualizer";

// Scene Graph 스타일의 TreeNode 컴포넌트
const TreeNodeStyle = ({ node, onEdit, onDelete, onAddAttribute, onConnect, connecting, isConnectable, depth = 0 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(node.label);
  };

  const handleSave = () => {
    onEdit?.(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(node.label);
    setIsEditing(false);
  };

  // 타입별 스타일
  const getTypeStyle = (type) => {
    const baseStyle = {
      borderRadius: "4px",
      padding: "2px 6px",
      fontSize: "10px",
      height: "18px",
      minWidth: "20px",
      maxWidth: "80px",
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "all 0.15s ease",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      width: "fit-content",
      cursor: "text",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontWeight: "500",
      border: "1px solid transparent",
      position: "relative",
      zIndex: 100,
    };

    switch (type) {
      case "object":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
          color: "#7f1d1d",
          border: "1px solid #fca5a5",
        };
      case "attribute":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#bfdbfe" : "#dbeafe",
          color: "#1e40af",
          border: "1px solid #93c5fd",
        };
      case "relationship":
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#bbf7d0" : "#dcfce7",
          color: "#15803d",
          border: "1px solid #86efac",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: isHovered ? "#f3f4f6" : "#ffffff",
          color: "#374151",
          border: "1px solid #d1d5db",
        };
    }
  };

  const style = getTypeStyle(node.type);

  return (
    <div 
      style={{ position: "relative", marginTop: 3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2">
        <div
          style={{
            ...style,
            boxShadow: connecting && isConnectable ? "0 0 0 2px #3b82f6" : "none",
          }}
          onDoubleClick={handleEdit}
          onClick={() => connecting && isConnectable && onConnect?.()}
        >
          {isEditing ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              autoFocus
              style={{
                fontSize: "10px",
                padding: "1px 3px",
                border: "1px solid #3b82f6",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                color: "#1f2937",
                outline: "none",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: "500",
                maxWidth: "100%",
                minWidth: "30px",
                width: `${Math.max(4, editValue.length + 1)}ch`,
                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                textAlign: "center",
              }}
            />
          ) : (
            node.label
          )}
        </div>

        {/* 액션 버튼들 */}
        {isHovered && (
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            {node.type === "object" && onAddAttribute && (
              <button
                onClick={() => onAddAttribute()}
                style={{
                  background: "#dbeafe",
                  border: "1px solid #93c5fd",
                  borderRadius: "3px",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "8px",
                  color: "#1e40af",
                }}
                title="Add Attribute"
              >
                A+
              </button>
            )}
            
            {node.type === "object" && onConnect && (
              <button
                onClick={() => onConnect()}
                style={{
                  background: connecting === node.id ? "#3b82f6" : "#dcfce7",
                  border: `1px solid ${connecting === node.id ? "#3b82f6" : "#86efac"}`,
                  borderRadius: "3px",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "8px",
                  color: connecting === node.id ? "#ffffff" : "#15803d",
                }}
                title="Connect to another object"
              >
                <Link size={8} />
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete()}
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  borderRadius: "3px",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#dc2626",
                }}
                title="Delete"
              >
                <Trash2 size={8} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced TreeNode with Scene Graph styling
const EnhancedTreeNode = ({ node, onLabelChange, depth = 0, isBaseline = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleNodeEdit = (newLabel) => {
    if (onLabelChange) {
      onLabelChange(node.id, newLabel);
    }
  };

  const handleAttributeEdit = (attrIndex, newValue) => {
    if (onLabelChange && node.children) {
      // 속성 수정 로직
      const updatedNode = {
        ...node,
        children: node.children.map((child, index) => 
          index === attrIndex ? { ...child, label: newValue } : child
        )
      };
      onLabelChange(node.id, updatedNode);
    }
  };

  const handleAddAttribute = () => {
    if (onLabelChange) {
      const newAttribute = {
        id: `${node.id}_attr_${Date.now()}`,
        label: "new",
        type: "attribute",
        children: []
      };
      const updatedNode = {
        ...node,
        children: [...(node.children || []), newAttribute]
      };
      onLabelChange(node.id, updatedNode);
    }
  };

  const handleDeleteAttribute = (attrIndex) => {
    if (onLabelChange && node.children) {
      const updatedNode = {
        ...node,
        children: node.children.filter((_, index) => index !== attrIndex)
      };
      onLabelChange(node.id, updatedNode);
    }
  };

  // Object를 attributes와 함께 렌더링
  const renderObjectWithAttributes = () => (
    <div 
      style={{
        border: "1px solid #fca5a5",
        borderRadius: "6px",
        padding: "8px",
        background: "linear-gradient(135deg, #fef7f7 0%, #fef2f2 100%)",
        marginBottom: "4px"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Object Node */}
      <TreeNodeStyle
        node={{ 
          id: node.id, 
          label: node.data.label, 
          type: node.type || "object" 
        }}
        onEdit={(newLabel) => handleNodeEdit(newLabel)}
        onDelete={!isBaseline ? () => {/* 삭제 로직 */} : undefined}
        onAddAttribute={!isBaseline ? handleAddAttribute : undefined}
        isBaseline={isBaseline}
      />
      
      {/* Attributes with tree-like connections */}
      {node.children && node.children.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          {node.children.map((child, index) => (
            <div key={child.id || index} style={{ position: "relative", marginTop: 3, marginLeft: 14 }}>
              {/* Vertical line */}
              <div style={{
                position: "absolute",
                top: -9,
                left: 7,
                width: "1px",
                height: index === node.children.length - 1 ? 9 : 18,
                backgroundColor: "#d1d5db",
              }} />
              {/* Horizontal line */}
              <div style={{
                position: "absolute",
                top: 9,
                left: 7,
                width: 7,
                height: "1px",
                backgroundColor: "#d1d5db",
              }} />
              
              <TreeNodeStyle
                node={{ 
                  id: child.id || `${node.id}-attr-${index}`, 
                  label: child.data.label, 
                  type: "attribute" 
                }}
                onEdit={(newValue) => handleAttributeEdit(index, newValue)}
                onDelete={!isBaseline ? () => handleDeleteAttribute(index) : undefined}
                isBaseline={isBaseline}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 다른 타입의 노드들 (relationship 등)
  const renderOtherNode = () => (
    <div style={{ marginBottom: "4px" }}>
      <TreeNodeStyle
        node={{ 
          id: node.id, 
          label: node.data.label, 
          type: node.type || "default" 
        }}
        onEdit={(newLabel) => handleNodeEdit(newLabel)}
        onDelete={!isBaseline ? () => {/* 삭제 로직 */} : undefined}
        isBaseline={isBaseline}
      />
      
      {/* Render children recursively */}
      {node.children && node.children.length > 0 && (
        <div style={{ marginLeft: "20px", marginTop: "4px" }}>
          {node.children.map((child, index) => (
            <EnhancedTreeNode
              key={child.id || index}
              node={child}
              onLabelChange={onLabelChange}
              depth={depth + 1}
              isBaseline={isBaseline}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Object 타입이면 특별한 렌더링, 아니면 일반 렌더링
  if (node.type === "object" || (!node.type && depth === 0)) {
    return renderObjectWithAttributes();
  } else {
    return renderOtherNode();
  }
};

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
  customToolbar = null,
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
              cursor: isClassMode ? "default" : "text",
              backgroundColor: "transparent",
            }}
            onDoubleClick={!isClassMode ? handleInstanceLabelEdit : undefined}
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

      {/* 확장된 콘텐츠 */}
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
        <SceneGraphVisualizer/>
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