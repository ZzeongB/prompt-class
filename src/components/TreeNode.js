import React, { useState, useEffect } from "react";
import { Plus, Trash2, Link, MoreHorizontal } from "lucide-react";
import {
  OBJ_COLOR,
  WHITE,
  OBJ_COLOR_TRANS,
  OBJ_COLOR_TRANS_DARK,
  ATTR_COLOR_TRANS_DARK,
  REL_COLOR_TRANS_DARK,
} from "../utils/constants";

// TreeNode 컴포넌트 (Scene Graph 규칙 적용)
export default function TreeNode({
  node,
  depth = 0,
  onLabelChange,
  onAddAttribute,
  onDeleteNode,
  onAddRelationship,
  highlight = null,
  isBaseline = false,
  allObjects = [], // 관계 연결 가능한 모든 object들
  sceneGraph = {},
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [label, setLabel] = useState(node.data?.label ?? "");

  const handleLabelEdit = () => {
    if (!isBaseline) {
      setIsEditing(true);
    }
  };

  const handleLabelSave = () => {
    setIsEditing(false);
    if (label !== node.data?.label) {
      onLabelChange?.(node.id, label);
    }
  };

  const handleLabelCancel = () => {
    setIsEditing(false);
    setLabel(node.data?.label ?? "");
  };

  const handleAddAttribute = () => {
    onAddAttribute?.(node.id);
  };

  const handleDelete = () => {
    onDeleteNode?.(node.id);
  };

  const handleAddRelationship = () => {
    setShowRelationModal(true);
  };

  const handleRelationshipSubmit = (targetObjectId, relationshipType) => {
    onAddRelationship?.(node.id, targetObjectId, relationshipType);
    setShowRelationModal(false);
  };

  const children = node.children ?? [];
  const hasChildren = children.length > 0;

  const INDENT = 14;
  const BOX_HEIGHT = 18;
  const type = node.data?.type ?? node.type;
  const isPlaceholder = node.data?.isPlaceholder || false;
  const defaultValue = node.data?.defaultValue;

  // 타입별 스타일 정의
  const getTypeStyle = (nodeType, isPlaceholder) => {
    const baseStyle = {
      borderRadius: "4px",
      padding: "2px 6px",
      fontSize: "10px",
      height: BOX_HEIGHT,
      minWidth: "20px",
      maxWidth: "120px",
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      transition: "all 0.15s ease",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      width: "fit-content",
      cursor: isBaseline ? "default" : "text",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontWeight: "500",
      position: "relative",
      zIndex: 100,
    };

    if (isPlaceholder) {
      switch (nodeType) {
        case "object":
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            color: "#7f1d1d",
            border: "2px dashed #fca5a5",
            fontStyle: "italic",
          };
        case "attribute":
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            color: "#1e40af",
            border: "2px dashed #93c5fd",
            fontStyle: "italic",
          };
        case "relationship":
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            color: "#15803d",
            border: "2px dashed #86efac",
            fontStyle: "italic",
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: "transparent",
            color: "#6b7280",
            border: "2px dashed #d1d5db",
            fontStyle: "italic",
          };
      }
    }

    // 일반 노드 스타일
    switch (nodeType) {
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

  const boxStyle = getTypeStyle(type, isPlaceholder);
  const displayText = isPlaceholder && defaultValue ? `${label} : ${defaultValue}` : label;

  // 현재 object와 연결 가능한 다른 object들 (자기 자신 제외)
  const availableObjects = allObjects.filter(obj => obj.id !== node.id);

  return (
    <div 
      style={{ 
        position: "relative", 
        marginTop: 3, 
        marginLeft: depth === 0 ? 0 : INDENT,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 메인 노드 */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <div
          style={boxStyle}
          onDoubleClick={handleLabelEdit}
          title={isPlaceholder ? `Placeholder for: ${defaultValue}` : undefined}
        >
          {isEditing ? (
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
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
                width: `${Math.max(4, label.length + 1)}ch`,
                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                textAlign: "center",
              }}
            />
          ) : (
            <span style={{ 
              fontSize: isPlaceholder ? "9px" : "10px",
              opacity: isPlaceholder ? 0.8 : 1 
            }}>
              {displayText}
            </span>
          )}
        </div>

        {/* Object 노드에 대한 액션 버튼들 */}
        {!isBaseline && isHovered && type === "object" && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "2px",
          }}>
            {/* Attribute 추가 버튼 */}
            <button
              onClick={handleAddAttribute}
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

            {/* Relationship 추가 버튼 */}
            {availableObjects.length > 0 && (
              <button
                onClick={handleAddRelationship}
                style={{
                  background: "#dcfce7",
                  border: "1px solid #86efac",
                  borderRadius: "3px",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "8px",
                  color: "#15803d",
                }}
                title="Add Relationship"
              >
                <Link size={8} />
              </button>
            )}

            {/* 삭제 버튼 */}
            <button
              onClick={handleDelete}
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
          </div>
        )}

        {/* Attribute나 Relationship 노드에 대한 삭제 버튼 */}
        {!isBaseline && isHovered && (type === "attribute" || type === "relationship") && (
          <button
            onClick={handleDelete}
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

      {/* Relationship 추가 모달 */}
      {showRelationModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowRelationModal(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "16px",
              width: "300px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
              Add Relationship
            </h3>
            
            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: "500" }}>
                Connect to:
              </label>
              <select
                id="targetObject"
                style={{
                  width: "100%",
                  padding: "4px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                <option value="">Select object...</option>
                {availableObjects.map(obj => (
                  <option key={obj.id} value={obj.id}>
                    {obj.data?.label || obj.label || 'Unnamed'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px", fontWeight: "500" }}>
                Relationship:
              </label>
              <input
                id="relationshipType"
                type="text"
                placeholder="e.g. on, near, contains..."
                style={{
                  width: "100%",
                  padding: "4px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowRelationModal(false)}
                style={{
                  padding: "4px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  backgroundColor: "#f9fafb",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetObjectId = document.getElementById('targetObject').value;
                  const relationshipType = document.getElementById('relationshipType').value;
                  if (targetObjectId && relationshipType) {
                    handleRelationshipSubmit(targetObjectId, relationshipType);
                  }
                }}
                style={{
                  padding: "4px 12px",
                  border: "1px solid #3b82f6",
                  borderRadius: "4px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 자식 노드들 (attributes만) */}
      {hasChildren && (
        <div>
          {children.map((child, index) => (
            <div key={child.id} style={{ position: "relative" }}>
              {/* 수직선 */}
              <div
                style={{
                  position: "absolute",
                  top: -BOX_HEIGHT / 2,
                  left: 7,
                  width: "1px",
                  height: BOX_HEIGHT + 1,
                  backgroundColor: "#9ca3af",
                }}
              />
              {/* 수평선 */}
              <div
                style={{
                  position: "absolute",
                  top: BOX_HEIGHT / 2,
                  left: 7,
                  width: INDENT - 7,
                  height: "1px",
                  backgroundColor: "#9ca3af",
                }}
              />
              
              <TreeNode
                node={child}
                depth={depth + 1}
                onLabelChange={onLabelChange}
                onAddAttribute={onAddAttribute}
                onDeleteNode={onDeleteNode}
                onAddRelationship={onAddRelationship}
                highlight={highlight}
                isBaseline={isBaseline}
                allObjects={allObjects}
                sceneGraph={sceneGraph}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}