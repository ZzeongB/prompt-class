// ObjectNode.js - 편집 상태 개선 버전
import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, X, Plus, ExternalLink } from "lucide-react";
import { ToolbarButton } from "../nodeComponents/NodeToolbarMenu";

const ObjectNode = ({
  object,
  onEdit,
  onDelete,
  onAddAttribute,
  onExtract,
  isHovered,
  setIsHovered,
  isEditing,
  setIsEditing,
  isEditable,
  isClassMode = false,
  placeHolders = null,
  onDragStart,
  onDragEnd,
  isDraggable = true,
  parentInstanceId,
  compact = false,
  dimensions,
  canExtract = false,
}) => {
  const [editValue, setEditValue] = useState(object.name);
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [expanded, setExpanded] = useState(true);

  // 🎯 편집 상태를 하나로 통합!
  const [editingMode, setEditingMode] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragStarted, setDragStarted] = useState(false);
  const dragRef = useRef(null);
  const ghostRef = useRef(null);
  const dragThreshold = 5;

  // 드래그 관련 함수들
  const handleMouseDown = (e) => {
    if (!isDraggable || editingMode !== null) {
      return;
    }

    const target = e.target;
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.closest("button") ||
      target.closest("input")
    ) {
      return;
    }

    const rect = dragRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setDragPosition({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    setDragStarted(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!dragOffset) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    if (!dragStarted) {
      const deltaX = Math.abs(e.clientX - (dragPosition.x + dragOffset.x));
      const deltaY = Math.abs(e.clientY - (dragPosition.y + dragOffset.y));

      if (deltaX > dragThreshold || deltaY > dragThreshold) {
        setDragStarted(true);
        setIsDragging(true);
        onDragStart?.(object, parentInstanceId);

        document.body.style.userSelect = "none";
        document.body.style.pointerEvents = "none";

        e.preventDefault();
        e.stopPropagation();
      }
    }

    if (dragStarted) {
      e.preventDefault();
      e.stopPropagation();
      setDragPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = (e) => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    if (dragStarted) {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);
      setDragStarted(false);

      const dropX = e.clientX;
      const dropY = e.clientY;

      onDragEnd?.(object, parentInstanceId, { x: dropX, y: dropY });

      document.body.style.userSelect = "";
      document.body.style.pointerEvents = "";
    } else {
      setDragStarted(false);
      setIsDragging(false);
    }

    setDragOffset(null);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.pointerEvents = "";
    };
  }, []);

  // 편집 관련 함수들
  const startEditing = (mode, initialValue = "") => {
    setEditingMode(mode);
    setEditingValue(initialValue);
  };

  const cancelEditing = () => {
    setEditingMode(null);
    setEditingValue("");
    setNewAttributeValue("");
  };

  const saveEditing = () => {
    if (!editingValue.trim()) {
      cancelEditing();
      return;
    }

    if (editingMode === "name") {
      if (isClassMode) {
        const { category, defaultValue } = parseClassInput(editingValue);
        console.log("🔧 Name editing:", { category, defaultValue, objectId: object.id });
        // 전체 placeHolders 구조를 유지하면서 해당 객체만 업데이트
        const updatedPlaceHolders = {
          ...placeHolders,
          [object.id]: {
            name: { name: category, defaultvalue: defaultValue },
            attr: placeHolders[object.id]?.attr || []
          }
        };
        onEdit?.(object.id, `{${object.id}_name}`, object.attributes, updatedPlaceHolders);
      } else {
        onEdit?.(object.id, editingValue);
      }
    } else if (editingMode === "adding") {
      if (isClassMode) {
        const { category, defaultValue } = parseClassInput(editingValue);
        console.log("🔧 Adding attribute:", { category, defaultValue, objectId: object.id });
        const currentAttrs = placeHolders[object.id]?.attr || [];
        const newAttrIndex = currentAttrs.length;
        const updatedAttributes = [
          ...(object.attributes || []),
          `{${object.id}_attr_${newAttrIndex}}`,
        ];
        const updatedPlaceHolders = {
          ...placeHolders,
          [object.id]: {
            name: placeHolders[object.id]?.name || null,
            attr: [...currentAttrs, { name: category, defaultvalue: defaultValue }]
          }
        };
        onEdit?.(object.id, object.name, updatedAttributes, updatedPlaceHolders);
      } else {
        onAddAttribute?.(object.id, editingValue);
      }
    } else if (editingMode?.startsWith("attribute-")) {
      const index = parseInt(editingMode.replace("attribute-", ""));
      if (isClassMode) {
        const { category, defaultValue } = parseClassInput(editingValue);
        console.log("🔧 Editing attribute:", { category, defaultValue, objectId: object.id, index });
        const updated = [...object.attributes];
        updated[index] = `{${object.id}_attr_${index}}`;
        const currentAttrs = [...(placeHolders[object.id]?.attr || [])];
        currentAttrs[index] = { name: category, defaultvalue: defaultValue };
        const updatedPlaceHolders = {
          ...placeHolders,
          [object.id]: {
            name: placeHolders[object.id]?.name || null,
            attr: currentAttrs
          }
        };
        onEdit?.(object.id, object.name, updated, updatedPlaceHolders);
      } else {
        const updated = [...object.attributes];
        updated[index] = editingValue;
        onEdit?.(object.id, object.name, updated);
      }
    }

    cancelEditing();
  };

  const handleDeleteAttribute = (index) => {
    const updated = object.attributes.filter((_, i) => i !== index);
    onEdit?.(object.id, object.name, updated);
  };

  const handleExtract = () => {
    if (
      window.confirm(
        `Extract "${object.name}" as a separate instance?\n\nThis will:\n• Create a new independent instance with this object\n• Connect it to the original instance via existing relationships`
      )
    ) {
      onExtract?.(object.id, parentInstanceId);
    }
  };

  const parseClassInput = (input) => {
    const trimmed = input.trim();
    const spaceIndex = trimmed.indexOf(" ");
    if (spaceIndex !== -1) {
      const category = trimmed.substring(0, spaceIndex).trim();
      const defaultValue = trimmed.substring(spaceIndex + 1).trim();
      return { category, defaultValue };
    }
    return { category: trimmed, defaultValue: "?" };
  };

  // 요소별 투명도 계산
  const getElementOpacity = (elementType, elementIndex = null) => {
    if (editingMode === null) return 1;

    if (elementType === "name" && editingMode === "name") return 1;
    if (
      elementType === "attribute" &&
      editingMode === `attribute-${elementIndex}`
    )
      return 1;
    if (elementType === "adding" && editingMode === "adding") return 1;
    if (elementType === "controls") return 1;

    return 0.3;
  };

  // 동적 스타일 계산
  const attributeCount = object.attributes?.length || 0;
  const hasMultipleAttributes = attributeCount > 5;

  const nodeStyle = {
    border: isClassMode ? "2px dashed #fca5a5" : "1px solid #fca5a5",
    borderRadius: "6px",
    padding: compact ? "4px" : "6px",
    backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    cursor:
      isDraggable && editingMode === null
        ? isDragging
          ? "grabbing"
          : "grab"
        : "default",
    userSelect: isDragging ? "none" : "auto",
    transform: isDragging ? "scale(1.05)" : "scale(1)",
    transition: isDragging ? "none" : "transform 0.2s ease",
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    boxShadow: isDragging
      ? "0 8px 25px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(59, 130, 246, 0.3)"
      : editingMode !== null
      ? "0 0 0 2px rgba(59, 130, 246, 0.5)"
      : "none",
    display: "flex",
    flexDirection: "column",
  };

  // 렌더링 함수들
  const renderAttribute = (attr, index) => {
    const isEditing = editingMode === `attribute-${index}`;
    const opacity = getElementOpacity("attribute", index);

    if (isEditing) {
      return (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            width: "100%",
          }}
        >
          <input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={saveEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEditing();
              if (e.key === "Escape") cancelEditing();
            }}
            autoFocus
            style={{
              border: "2px solid #3b82f6",
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              borderRadius: "4px",
              padding: "2px 4px",
              fontSize: compact ? "11px" : "11px",
              fontWeight: 500,
              flex: 1,
              width: "20px",
              textAlign: "center",
              boxSizing: "border-box",
              minHeight: compact ? "16px" : "18px",
            }}
            placeholder={isClassMode ? "label value" : "attribute"}
          />
          <ToolbarButton
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAttribute(index);
              cancelEditing();
            }}
            title="Delete Attribute"
            icon={<X size={8} />}
            danger={true}
            tooltipPosition="top"
            size="compact"
          />
        </div>
      );
    }

    // Class mode rendering
    if (isClassMode) {
      const cleanId = attr.replace(/[{}]/g, "");
      const objectId = object.id;
      
      let category = "unknown";
      let defaultValue = "?";
      
      if (objectId && placeHolders && placeHolders[objectId] && placeHolders[objectId].attr) {
        // Index를 사용해서 정확한 attribute 매핑
        const attrPlaceholder = placeHolders[objectId].attr[index];
        if (attrPlaceholder) {
          category = attrPlaceholder.name || "unknown";
          defaultValue = attrPlaceholder.defaultvalue || "?";
        }
        // fallback: defaultAttributes에서 직접 가져오기
        else if (object.defaultAttributes && object.defaultAttributes[index]) {
          defaultValue = object.defaultAttributes[index];
          category = "attribute";
        }
      }
      // 추가 fallback: 원본 값이 placeholder 형태가 아닌 경우
      else if (!attr.includes("{") && !attr.includes("}")) {
        category = "attribute";
        defaultValue = attr;
      }

      return (
        <div
          key={index}
          style={{
            width: "100%",
            opacity,
            transition: "opacity 0.2s ease",
            minHeight: compact ? "16px" : "18px",
          }}
        >
          <div
            style={{
              border: "2px dashed #93c5fd",
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              borderRadius: "4px",
              padding: compact ? "1px 3px" : "2px 4px",
              fontSize: compact ? "9px" : "10px",
              fontWeight: 500,
              textAlign: "center",
              cursor: isEditable ? "pointer" : "default",
              boxSizing: "border-box",
              minHeight: compact ? "14px" : "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
            onDoubleClick={() => {
              if (isEditable && editingMode === null) {
                startEditing(
                  `attribute-${index}`,
                  `${category} ${defaultValue}`
                );
              }
            }}
            title={`${category}: ${defaultValue} (Double-click to edit)`}
          >
            <div
              style={{
                fontWeight: "600",
                color: "#1d4ed8",
                fontSize: compact ? "9px" : "11px",
                lineHeight: "1.1",
              }}
            >
              {category}
            </div>
            <div
              style={{
                fontWeight: "400",
                color: "#1e40af",
                fontSize: compact ? "8px" : "10px",
                lineHeight: "1.1",
                opacity: 0.8,
              }}
            >
              {defaultValue}
            </div>
          </div>
        </div>
      );
    }

    // Instance mode rendering
    return (
      <div
        key={index}
        style={{
          width: "100%",
          opacity,
          transition: "opacity 0.2s ease",
          minHeight: compact ? "16px" : "18px",
          display: "flex",
          alignItems: "center",
          gap: "2px",
        }}
      >
        <div
          style={{
            border: "1px solid #93c5fd",
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            borderRadius: "4px",
            padding: compact ? "1px 3px" : "2px 4px",
            fontSize: compact ? "10px" : "11px",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            boxSizing: "border-box",
            cursor: isEditable ? "pointer" : "default",
            textAlign: "center",
            minHeight: compact ? "14px" : "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
          onDoubleClick={() => {
            if (isEditable && editingMode === null) {
              startEditing(`attribute-${index}`, attr);
            }
          }}
          title={`${attr} (Double-click to edit)`}
        >
          {attr}
        </div>
        {isEditable && (
          <ToolbarButton
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteAttribute(index);
            }}
            title="Delete Attribute"
            icon={<X size={compact ? 6 : 8} />}
            danger={true}
            tooltipPosition="top"
            size="compact"
          />
        )}
      </div>
    );
  };

  const renderObjectName = () => {
    const isEditing = editingMode === "name";
    const opacity = getElementOpacity("name");

    if (isEditing) {
      return (
        <input
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={saveEditing}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEditing();
            if (e.key === "Escape") cancelEditing();
          }}
          autoFocus
          style={{
            border: "2px solid #dc2626",
            backgroundColor: "#fed7d7",
            borderRadius: "4px",
            padding: compact ? "2px 4px" : "3px 6px",
            fontSize: compact ? "11px" : "12px",
            textAlign: "center",
            color: "#7f1d1d",
            fontWeight: "500",
            width: "100%",
            boxSizing: "border-box",
            minHeight: compact ? "18px" : "22px",
          }}
          placeholder={isClassMode ? "label value" : "object name"}
        />
      );
    }

    if (isClassMode) {
      let category = "unknown";
      let defaultValue = "?";
      const objectId = object.id;
      
      if (objectId && placeHolders && placeHolders[objectId] && placeHolders[objectId].name) {
        const namePlaceholder = placeHolders[objectId].name;
        category = namePlaceholder.name || "unknown";
        defaultValue = namePlaceholder.defaultvalue || "?";
      }
      // fallback: defaultName이나 원본 name 사용
      else if (object.defaultName) {
        category = "object";
        defaultValue = object.defaultName;
      }
      // 추가 fallback: 원본 값이 placeholder 형태가 아닌 경우
      else if (!object.name.includes("{") && !object.name.includes("}")) {
        category = "object";
        defaultValue = object.name;
      }

      return (
        <div
          style={{
            border: "2px dashed #fca5a5",
            backgroundColor: "#fed7d7",
            borderRadius: "4px",
            padding: compact ? "2px 4px" : "3px 6px",
            fontSize: compact ? "11px" : "12px",
            textAlign: "center",
            cursor: isEditable ? "pointer" : "default",
            boxSizing: "border-box",
            opacity,
            transition: "opacity 0.2s ease",
            minHeight: compact ? "18px" : "22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
          onDoubleClick={() => {
            if (isEditable && editingMode === null) {
              startEditing("name", `${category} ${defaultValue}`);
            }
          }}
          title={`${category}: ${defaultValue}`}
        >
          <div
            style={{
              fontWeight: "600",
              color: "#991b1b",
              fontSize: compact ? "10px" : "11px",
              lineHeight: "1.1",
            }}
          >
            {category}
          </div>
          <div
            style={{
              fontWeight: "400",
              color: "#7f1d1d",
              fontSize: compact ? "10px" : "11px",
              lineHeight: "1.1",
              opacity: 0.8,
            }}
          >
            {defaultValue}
          </div>
        </div>
      );
    }

    return (
      <div
        onDoubleClick={() => {
          if (isEditable && editingMode === null) {
            startEditing("name", object.name);
          }
        }}
        style={{
          cursor: isEditable ? "pointer" : "default",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity,
          transition: "opacity 0.2s ease",
          fontSize: compact ? "11px" : "12px",
          fontWeight: "500",
          color: "#7f1d1d",
          textAlign: "center",
          minHeight: compact ? "18px" : "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title={object.name}
      >
        {object.name}
      </div>
    );
  };

  return (
    <>
      <div
        ref={dragRef}
        style={nodeStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
      >
        {/* Attributes Section */}
        {expanded && attributeCount > 0 && (
          <div
            style={{
              flex: 1,
              marginBottom: compact ? "2px" : "4px",
              display: "flex",
              flexDirection: "column",
              gap: compact ? "1px" : "2px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: hasMultipleAttributes ? "1fr 1fr" : "1fr",
                gap: compact ? "1px" : "2px",
                width: "100%",
              }}
            >
              {object.attributes?.map((attr, index) =>
                renderAttribute(attr, index)
              )}
            </div>

            {/* Add Attribute Input */}
            {editingMode === "adding" && (
              <input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={saveEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEditing();
                  if (e.key === "Escape") cancelEditing();
                }}
                autoFocus
                placeholder={isClassMode ? "new label" : "new attribute"}
                style={{
                  fontSize: compact ? "10px" : "11px",
                  padding: compact ? "1px 2px" : "2px 3px",
                  border: "2px solid #3b82f6",
                  borderRadius: "4px",
                  backgroundColor: "#ffffff",
                  color: "#1f2937",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontWeight: "500",
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                  textAlign: "center",
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: compact ? "16px" : "18px",
                }}
              />
            )}
          </div>
        )}

        {/* Object Name and Controls Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: compact ? "2px" : "4px",
            minHeight: compact ? "20px" : "24px",
          }}
        >
          <div style={{ flex: 1 }}>{renderObjectName()}</div>

          {/* Controls */}
          {isEditable && editingMode === null && (
            <div
              style={{
                display: "flex",
                gap: "2px",
                opacity: getElementOpacity("controls"),
                flexShrink: 0,
              }}
            >
              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing("adding");
                }}
                title="Add Attribute"
                icon={<Plus size={compact ? 8 : 10} />}
                tooltipPosition="top"
                size="compact"
              />
              {canExtract && !isClassMode && (
                <ToolbarButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExtract();
                  }}
                  title="Extract as Separate Instance"
                  icon={<ExternalLink size={compact ? 8 : 10} />}
                  tooltipPosition="top"
                  size="compact"
                />
              )}
              <ToolbarButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(object.id);
                }}
                title="Delete Object"
                icon={<X size={compact ? 8 : 10} />}
                danger={true}
                tooltipPosition="top"
                size="compact"
              />
            </div>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7f1d1d",
              opacity: getElementOpacity("controls"),
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={compact ? 8 : 10} /> : <ChevronRight size={compact ? 8 : 10} />}
          </button>
        </div>
      </div>

      {/* Ghost Image */}
      {isDragging && (
        <div
          ref={ghostRef}
          style={{
            position: "fixed",
            top: dragPosition.y,
            left: dragPosition.x,
            width: dimensions?.width || "auto",
            height: dimensions?.height || "auto",
            opacity: 0.7,
            pointerEvents: "none",
            zIndex: 9999,
            transform: "scale(0.9)",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
            ...nodeStyle,
          }}
        >
          <div
            style={{
              fontSize: compact ? "11px" : "12px",
              fontWeight: "500",
              color: "#7f1d1d",
              textAlign: "center",
              padding: compact ? "4px" : "6px",
            }}
          >
            {object.name}
          </div>
        </div>
      )}
    </>
  );
};

export default ObjectNode;
