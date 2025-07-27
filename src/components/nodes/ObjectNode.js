// 1. ObjectNode.js에 드래그 기능 추가
import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import EditableLabel from "../nodeComponents/EditableLabel";
import DeleteButton from "../nodeComponents/DeleteButton";

const ObjectNode = ({
  object,
  onEdit,
  onDelete,
  onAddAttribute,
  isHovered,
  setIsHovered,
  isEditing,
  setIsEditing,
  isEditable,
  isClassMode = false,
  placeHolders = null,
  // 새로운 드래그 관련 props
  onDragStart,
  onDragEnd,
  isDraggable = true,
  parentInstanceId, // 어떤 instance에서 왔는지 추적
}) => {
  // 기존 상태들...
  const [editValue, setEditValue] = useState(object.name);
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [addingAttribute, setAddingAttribute] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [editingAttributeIndex, setEditingAttributeIndex] = useState(null);
  const [editingObjectValue, setEditingObjectValue] = useState("");
  const [editingAttributeValue, setEditingAttributeValue] = useState("");
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const ghostRef = useRef(null);

  // 드래그 시작
  const handleMouseDown = (e) => {
    if (!isDraggable || isEditing || editingAttributeIndex !== null || addingAttribute) {
      return; // 편집 중일 때는 드래그 비활성화
    }

    // ReactFlow 노드 드래그 방지를 위해 이벤트 전파 차단
    e.preventDefault();
    e.stopPropagation();

    const rect = dragRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    setIsDragging(true);
    
    onDragStart?.(object, parentInstanceId);
    
    // 전역 마우스 이벤트 리스너 추가
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // ReactFlow 드래그 방지
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setDragPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    
    // 드롭 위치 계산
    const dropX = e.clientX;
    const dropY = e.clientY;
    
    onDragEnd?.(object, parentInstanceId, { x: dropX, y: dropY });
    
    // 이벤트 리스너 제거 및 스타일 복원
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = '';
    document.body.style.pointerEvents = '';
  };

  // 컴포넌트 언마운트 시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 기존 함수들은 그대로 유지...
  const parseClassInput = (input) => {
    const trimmed = input.trim();
    const spaceIndex = trimmed.indexOf(" ");
    if (spaceIndex !== -1) {
      const placeholderLabel = trimmed.substring(0, spaceIndex).trim();
      const defaultValue = trimmed.substring(spaceIndex + 1).trim();
      return { placeholderLabel, defaultValue };
    }
    return { placeholderLabel: trimmed, defaultValue: "?" };
  };

  const handleSaveName = (val) => {
    if (!val || !val.trim()) {
      setIsEditing(false);
      setEditingObjectValue("");
      return;
    }

    if (isClassMode) {
      const { placeholderLabel, defaultValue } = parseClassInput(val);
      onEdit?.(object.id, `{${placeholderLabel}}`, object.attributes, {
        [defaultValue]: placeholderLabel,
      });
    } else {
      onEdit?.(object.id, val);
    }
    setIsEditing(false);
    setEditingObjectValue("");
  };

  const handleEditAttribute = (index, val) => {
    if (!isEditable) return;

    if (isClassMode) {
      const { placeholderLabel, defaultValue } = parseClassInput(val);
      const updated = [...object.attributes];
      updated[index] = `{${placeholderLabel}}`;
      onEdit?.(object.id, object.name, updated, {
        [defaultValue]: placeholderLabel,
      });
    } else {
      const updated = [...object.attributes];
      updated[index] = val;
      onEdit?.(object.id, object.name, updated);
    }
    setEditingAttributeIndex(null);
    setEditingAttributeValue("");
  };

  const handleAddAttribute = () => {
    if (newAttributeValue.trim()) {
      if (isClassMode) {
        const { placeholderLabel, defaultValue } = parseClassInput(
          newAttributeValue.trim()
        );
        const updatedAttributes = [
          ...(object.attributes || []),
          `{${placeholderLabel}}`,
        ];
        onEdit?.(object.id, object.name, updatedAttributes, {
          [defaultValue]: placeholderLabel,
        });
      } else {
        onAddAttribute?.(object.id, newAttributeValue.trim());
      }

      setNewAttributeValue("");
      setAddingAttribute(false);
    }
  };

  const handleDeleteAttribute = (index) => {
    const updated = object.attributes.filter((_, i) => i !== index);
    onEdit?.(object.id, object.name, updated);
  };

  const handleSaveObjectName = () => {
    handleSaveName(editingObjectValue);
  };

  const handleSaveAttribute = (index) => {
    handleEditAttribute(index, editingAttributeValue);
  };

  // 렌더링 함수들은 기존과 동일...
  const renderClassAttribute = (attr, index) => {
    const cleanAttr = attr.replace(/[{}]/g, "");
    const defaultValue = Object.keys(placeHolders || {}).find(
      (key) => placeHolders[key] === cleanAttr
    ) || "?";

    if (editingAttributeIndex === index) {
      return (
        <input
          key={index}
          value={editingAttributeValue}
          onChange={(e) => setEditingAttributeValue(e.target.value)}
          onBlur={() => handleSaveAttribute(index)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSaveAttribute(index);
            if (e.key === "Escape") {
              setEditingAttributeIndex(null);
              setEditingAttributeValue("");
            }
          }}
          autoFocus
          style={{
            border: "2px solid #3b82f6",
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            borderRadius: "4px",
            padding: "2px 6px",
            fontSize: "11px",
            fontWeight: 500,
            width: "100%",
            maxWidth: "85px",
            textAlign: "center",
            marginBottom: "2px",
            boxSizing: "border-box",
          }}
          placeholder="label value"
        />
      );
    }

    return (
      <div
        key={index}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          marginBottom: "2px",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px dashed #93c5fd",
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            borderRadius: "4px",
            padding: "3px 6px",
            fontSize: "11px",
            fontWeight: 500,
            minWidth: 0,
            flex: 1,
            maxWidth: "85px",
            textAlign: "center",
            cursor: isEditable ? "pointer" : "default",
            boxSizing: "border-box",
          }}
          onDoubleClick={() => {
            if (isEditable) {
              setEditingAttributeIndex(index);
              setEditingAttributeValue(`${cleanAttr} ${defaultValue}`);
            }
          }}
          title={`${cleanAttr}: ${defaultValue}`}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#1d4ed8",
              fontSize: "10px",
              lineHeight: "1.1",
              marginBottom: "1px",
            }}
          >
            {cleanAttr}
          </div>
          <div
            style={{
              fontWeight: "400",
              color: "#1e40af",
              fontSize: "9px",
              lineHeight: "1.1",
              opacity: 0.8,
            }}
          >
            {defaultValue}
          </div>
        </div>
        {isHovered && isEditable && (
          <DeleteButton
            onClick={() => handleDeleteAttribute(index)}
            size={10}
            title="Delete Attribute"
          />
        )}
      </div>
    );
  };

  const renderInstanceAttribute = (attr, index) => (
    <div
      key={index}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        marginBottom: "2px",
        width: "100%",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <EditableLabel
          value={attr}
          onSave={(val) => handleEditAttribute(index, val)}
          textStyle={{
            border: "1px solid #93c5fd",
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            borderRadius: "4px",
            padding: "2px 6px",
            fontSize: "11px",
            fontWeight: 500,
            width: "100%",
            maxWidth: "85px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            boxSizing: "border-box",
          }}
          isEditable={isEditable}
        />
      </div>
      {isHovered && isEditable && (
        <DeleteButton
          onClick={() => handleDeleteAttribute(index)}
          size={10}
          title="Delete Attribute"
        />
      )}
    </div>
  );

  const renderObjectName = () => {
    if (isEditing) {
      if (isClassMode) {
        return (
          <input
            value={editingObjectValue}
            onChange={(e) => setEditingObjectValue(e.target.value)}
            onBlur={() => handleSaveObjectName()}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveObjectName();
              if (e.key === "Escape") {
                setIsEditing(false);
                setEditingObjectValue("");
              }
            }}
            autoFocus
            style={{
              border: "2px solid #dc2626",
              backgroundColor: "#fed7d7",
              borderRadius: "4px",
              padding: "3px 6px",
              fontSize: "11px",
              textAlign: "center",
              color: "#7f1d1d",
              fontWeight: "500",
              width: "100%",
              maxWidth: "85px",
              boxSizing: "border-box",
            }}
            placeholder="label value"
          />
        );
      } else {
        return (
          <EditableLabel value={editValue} onSave={handleSaveName} autoFocus />
        );
      }
    }

    if (isClassMode) {
      const cleanName = object.name.replace(/[{}]/g, "");
      const defaultValue =
        Object.keys(placeHolders || {}).find(
          (key) => placeHolders[key] === cleanName
        ) || "?";

      return (
        <div
          style={{
            border: "2px dashed #fca5a5",
            backgroundColor: "#fed7d7",
            borderRadius: "4px",
            padding: "3px 6px",
            fontSize: "11px",
            textAlign: "center",
            cursor: isEditable ? "pointer" : "default",
            boxSizing: "border-box",
          }}
          onDoubleClick={() => {
            if (isEditable) {
              setEditingObjectValue(`${cleanName} ${defaultValue}`);
              setIsEditing(true);
            }
          }}
          title={`${cleanName}: ${defaultValue}`}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#991b1b",
              fontSize: "10px",
              lineHeight: "1.1",
              marginBottom: "1px",
            }}
          >
            {cleanName}
          </div>
          <div
            style={{
              fontWeight: "400",
              color: "#7f1d1d",
              fontSize: "9px",
              lineHeight: "1.1",
              opacity: 0.8,
            }}
          >
            {defaultValue}
          </div>
        </div>
      );
    } else {
      return (
        <div
          onDoubleClick={() => {
            if (isEditable) setIsEditing(true);
          }}
          style={{
            cursor: isEditable ? "pointer" : "default",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={object.name}
        >
          {object.name}
        </div>
      );
    }
  };

  const nodeStyle = {
    border: isClassMode ? "2px dashed #fca5a5" : "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "5px",
    backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
    marginBottom: "0px",
    maxWidth: isClassMode ? "100px" : "90px",
    minWidth: "80px",
    boxSizing: "border-box",
    overflow: "hidden",
    cursor: isDraggable && !isEditing && !addingAttribute && editingAttributeIndex === null 
      ? (isDragging ? "grabbing" : "grab") 
      : "default",
    userSelect: "none",
    transform: isDragging ? "scale(1.05)" : "scale(1)",
    transition: isDragging ? "none" : "transform 0.2s ease",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    // 드래그 중일 때 강조 표시
    boxShadow: isDragging 
      ? "0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(59, 130, 246, 0.3)" 
      : "none",
  };

  return (
    <>
      {/* 메인 노드 */}
      <div
        ref={dragRef}
        style={nodeStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        {/* Attributes */}
        {expanded && (
          <div style={{ marginBottom: "3px" }}>
            {object.attributes?.map((attr, index) =>
              isClassMode
                ? renderClassAttribute(attr, index)
                : renderInstanceAttribute(attr, index)
            )}

            {addingAttribute && (
              <input
                value={newAttributeValue}
                onChange={(e) => setNewAttributeValue(e.target.value)}
                onBlur={() => {
                  if (newAttributeValue.trim()) {
                    handleAddAttribute();
                  } else {
                    setAddingAttribute(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddAttribute();
                  if (e.key === "Escape") {
                    setAddingAttribute(false);
                    setNewAttributeValue("");
                  }
                }}
                autoFocus
                placeholder={isClassMode ? "new label" : "new attribute"}
                style={{
                  fontSize: "11px",
                  padding: "1px 3px",
                  border: isClassMode
                    ? "2px dashed #3b82f6"
                    : "1px solid #3b82f6",
                  borderRadius: "4px",
                  backgroundColor: "#ffffff",
                  color: "#1f2937",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontWeight: "500",
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                  textAlign: "center",
                  marginBottom: "2px",
                }}
              />
            )}
          </div>
        )}

        {/* Header */}
        {isHovered && isEditable && (
          <div style={{ display: "flex", gap: "2px", marginBottom: "3px" }}>
            <button
              onClick={() => setAddingAttribute(true)}
              style={{
                background: "#dbeafe",
                border: isClassMode ? "2px dashed #93c5fd" : "1px solid #93c5fd",
                borderRadius: "3px",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                color: "#1e40af",
              }}
              title="Add Attribute"
            >
              A+
            </button>
            <DeleteButton
              onClick={() => onDelete?.(object.id)}
              title="Delete Object"
            />
          </div>
        )}

        {/* Object Name */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "500", color: "#7f1d1d" }}>
            {renderObjectName()}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7f1d1d",
            }}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        </div>
      </div>

      {/* 드래그 중일 때 보여줄 고스트 이미지 */}
      {isDragging && (
        <div
          ref={ghostRef}
          style={{
            position: "fixed",
            top: dragPosition.y,
            left: dragPosition.x,
            ...nodeStyle,
            opacity: 0.7,
            pointerEvents: "none",
            zIndex: 9999,
            transform: "scale(0.9)",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: "500", color: "#7f1d1d" }}>
            {object.name}
          </div>
        </div>
      )}
    </>
  );
};

export default ObjectNode;