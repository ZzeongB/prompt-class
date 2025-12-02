// ObjectNode.js - 편집 상태 개선 버전
import React, { useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, X, Plus, ExternalLink, Circle } from "lucide-react";
import { ToolbarButton } from "../nodeComponents/NodeToolbarMenu";
import { logEvent } from "../../api/logEvent";

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
  onConnectionDragStart,
  onConnectionDragEnd,
  isConnectionTarget = false,
  showConnectionHandles = false,
  isDraggingConnectionFromThis = false,
  objectOverrides = null,
  isPending = false,
  onEditComplete = () => {},
  onEditCancel = () => {},
}) => {
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [expanded, setExpanded] = useState(true);

  // 🎯 편집 상태를 하나로 통합!
  const [editingMode, setEditingMode] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  // 연결 드래그 관련 상태
  const [isConnectionDragging, setIsConnectionDragging] = useState(false);
  const connectionHandleRef = useRef(null);
  const dropTargetRef = useRef(null);

  // isEditing이 true가 되면 자동으로 name 편집 시작
  useEffect(() => {
    if (isEditing && editingMode === null && isPending) {
      startEditing("name", ""); // 빈 문자열로 시작
    }
  }, [isEditing, isPending]);

  // 편집 관련 함수들
  const startEditing = (mode, initialValue = "") => {
    logEvent("object_node.edit.started", {
      object_id: object.id,
      object_name: object.name,
      edit_mode: mode,
      is_class_mode: isClassMode,
      parent_instance_id: parentInstanceId,
    });
    setEditingMode(mode);
    setEditingValue(initialValue);
  };

  const cancelEditing = () => {
    logEvent("object_node.edit.cancelled", {
      object_id: object.id,
      object_name: object.name,
      edit_mode: editingMode,
      is_class_mode: isClassMode,
      is_pending: isPending,
      has_value: editingValue.trim() !== "",
    });

    // 임시 object이고 이름이 입력되지 않은 경우에만 삭제
    if (isPending && editingMode === "name" && !editingValue.trim()) {
      onEditCancel();
      return;
    }

    // 임시 object이지만 이름이 입력된 경우 확정
    if (isPending && editingMode === "name" && editingValue.trim()) {
      // 입력된 값으로 저장하고 확정
      if (isClassMode) {
        const updatedPlaceHolders = {
          ...placeHolders,
          [object.id]: {
            name: editingValue,
            attr: placeHolders[object.id]?.attr || []
          }
        };
        onEdit?.(object.id, editingValue, object.attributes, updatedPlaceHolders);
      } else {
        onEdit?.(object.id, editingValue);
      }
      onEditComplete();
      setEditingMode(null);
      setEditingValue("");
      return;
    }

    setEditingMode(null);
    setEditingValue("");
    setNewAttributeValue("");
  };

  const saveEditing = () => {
    if (!editingValue.trim()) {
      cancelEditing();
      return;
    }

    logEvent("object_node.edit.saved", {
      object_id: object.id,
      object_name: object.name,
      edit_mode: editingMode,
      new_value: editingValue,
      is_class_mode: isClassMode,
      parent_instance_id: parentInstanceId,
      is_pending: isPending,
    });

    if (editingMode === "name") {
      if (isClassMode) {
        // 간단한 구조: 값만 저장
        const updatedPlaceHolders = {
          ...placeHolders,
          [object.id]: {
            name: editingValue,
            attr: placeHolders[object.id]?.attr || []
          }
        };
        onEdit?.(object.id, editingValue, object.attributes, updatedPlaceHolders);
      } else {
        onEdit?.(object.id, editingValue);
      }

      // 임시 object 확정
      if (isPending) {
        onEditComplete();
      }
    } else if (editingMode === "adding") {
      if (isClassMode) {
        // 간단한 구조: 값만 저장
        const currentAttrs = placeHolders[object.id]?.attr || [];
        const updatedAttributes = [
          ...(object.attributes || []),
          editingValue,
        ];
        const updatedPlaceHolders = {
          ...placeHolders,
          [object.id]: {
            name: placeHolders[object.id]?.name || null,
            attr: [...currentAttrs, editingValue]
          }
        };
        onEdit?.(object.id, object.name, updatedAttributes, updatedPlaceHolders);
      } else {
        onAddAttribute?.(object.id, editingValue);
      }
    } else if (editingMode?.startsWith("attribute-")) {
      const index = parseInt(editingMode.replace("attribute-", ""));
      if (isClassMode) {
        // 간단한 구조: 값만 저장
        const updated = [...object.attributes];
        updated[index] = editingValue;
        const currentAttrs = [...(placeHolders[object.id]?.attr || [])];

        currentAttrs[index] = editingValue;
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
    logEvent("object_node.attribute.deleted", {
      object_id: object.id,
      object_name: object.name,
      attribute_index: index,
      attribute_value: object.attributes[index],
      is_class_mode: isClassMode,
      parent_instance_id: parentInstanceId,
    });

    // 배열에서 제거하는 대신 "DELETE" 마커로 표시
    const updated = [...object.attributes];
    updated[index] = "DELETE";

    if (isClassMode) {
      // class mode에서는 placeHolders도 함께 업데이트 (간단한 구조)
      const currentAttrs = [...(placeHolders[object.id]?.attr || [])];
      currentAttrs[index] = "DELETE";
      const updatedPlaceHolders = {
        ...placeHolders,
        [object.id]: {
          name: placeHolders[object.id]?.name || null,
          attr: currentAttrs
        }
      };
      onEdit?.(object.id, object.name, updated, updatedPlaceHolders);
    } else {
      onEdit?.(object.id, object.name, updated);
    }
  };

  const handleExtract = () => {
    logEvent("object_node.extract.initiated", {
      object_id: object.id,
      object_name: object.name,
      parent_instance_id: parentInstanceId,
    });

    if (true
      // window.confirm(
      //   `Extract "${object.name}" as a separate instance?\n\nThis will:\n• Create a new independent instance with this object\n• Connect it to the original instance via existing relationships`
      // )
    ) {
      logEvent("object_node.extract.confirmed", {
        object_id: object.id,
        object_name: object.name,
        parent_instance_id: parentInstanceId,
      });
      onExtract?.(object.id, parentInstanceId);
    } else {
      logEvent("object_node.extract.cancelled", {
        object_id: object.id,
        object_name: object.name,
        parent_instance_id: parentInstanceId,
      });
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

  // 연결 드래그 핸들러들
  const handleConnectionDragStart = (e) => {
    e.stopPropagation();
    setIsConnectionDragging(true);
    
    logEvent("object_node.connection_drag.started", {
      object_id: object.id,
      object_name: object.name,
      parent_instance_id: parentInstanceId,
      is_class_mode: isClassMode,
    });

    // 드래그 핸들의 화면상 위치 계산
    const handleRect = connectionHandleRef.current?.getBoundingClientRect();
    const startPosition = handleRect ? {
      x: handleRect.left + handleRect.width / 2,
      y: handleRect.top + handleRect.height / 2
    } : { x: e.clientX, y: e.clientY };

    onConnectionDragStart?.(object.id, parentInstanceId, startPosition);

    document.addEventListener("mousemove", handleConnectionDragMove);
    document.addEventListener("mouseup", handleConnectionDragEnd);
    document.body.style.userSelect = "none";
  };

  const handleConnectionDragMove = (e) => {
    // 연결선을 마우스 따라 그리기 위한 로직은 부모 컴포넌트에서 처리
  };

  const handleConnectionDragEnd = (e) => {
    document.removeEventListener("mousemove", handleConnectionDragMove);
    document.removeEventListener("mouseup", handleConnectionDragEnd);
    document.body.style.userSelect = "";

    // 드롭 대상 찾기
    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    const targetObjectNode = dropTarget?.closest('[data-connection-target]');
    
    let targetObjectId = null;
    let targetParentId = null;
    
    if (targetObjectNode) {
      targetObjectId = targetObjectNode.dataset.objectId;
      targetParentId = targetObjectNode.dataset.parentInstanceId;
      
      if (targetObjectId && targetObjectId !== object.id) {
        logEvent("object_node.connection_drag.completed", {
          source_object_id: object.id,
          target_object_id: targetObjectId,
          source_parent_id: parentInstanceId,
          target_parent_id: targetParentId,
        });
      } else {
        logEvent("object_node.connection_drag.cancelled", {
          reason: "same_object",
          object_id: object.id,
        });
        targetObjectId = null; // 같은 객체인 경우 취소
      }
    } else {
      logEvent("object_node.connection_drag.cancelled", {
        reason: "no_target",
        object_id: object.id,
      });
    }

    // 성공/실패 관계없이 항상 호출 (부모에서 상태 리셋)
    onConnectionDragEnd?.(object.id, targetObjectId, parentInstanceId, targetParentId);
    setIsConnectionDragging(false);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleConnectionDragMove);
      document.removeEventListener("mouseup", handleConnectionDragEnd);
      document.body.style.userSelect = "";
    };
  }, []);

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
    border: isPending
      ? "2px dashed #fca5a5" // 임시 object는 점선 border
      : isClassMode
        ? "2px solid #fca5a5"
        : "1px solid #fca5a5",
    borderRadius: "6px",
    padding: compact ? "4px" : "6px",
    backgroundColor: isClassMode ? (isHovered ? "#f9fafb" : "#ffffff") : (isHovered ? "#fecaca" : "#fed7d7"),
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    position: "relative", // toolbar 위치 계산을 위해 추가
    cursor:
      isDraggable && editingMode === null
        ? isDragging
          ? "grabbing"
          : "grab"
        : "default",
    userSelect: isDragging ? "none" : "auto",
    transform: isDragging ? "scale(1.05)" : "scale(1)",
    transition: isDragging ? "none" : "transform 0.2s ease",
    opacity: isPending ? 0.7 : (isDragging ? 0.8 : 1), // 임시 object는 약간 투명
    zIndex: isDragging ? 1000 : 0,
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
    // DELETE 마커는 렌더링하지 않음
    if (attr === "DELETE") {
      return null;
    }

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
      const objectId = object.id;

      let category = "unknown";
      let defaultValue = "?";

      if (objectId && placeHolders && placeHolders[objectId] && placeHolders[objectId].attr) {
        // Index를 사용해서 정확한 attribute 매핑 (간단한 구조: attr은 문자열 배열)
        const attrValue = placeHolders[objectId].attr[index];
        if (attrValue) {
          category = "attribute";
          defaultValue = attrValue;
        }
        // fallback: defaultAttributes에서 직접 가져오기
        else if (object.defaultAttributes && object.defaultAttributes[index]) {
          defaultValue = object.defaultAttributes[index];
          category = "attribute";
        }
      }
      // 원본 값 사용 (더 이상 {} 체크하지 않음)
      else {
        category = "attribute";
        defaultValue = attr || "?";
      }

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
          {(() => {
            // Check if this attribute is overridden
            const hasAttrOverride = objectOverrides?.attributes?.[index] !== undefined;

            return (
              <div
                style={{
                  border: hasAttrOverride ? "2px solid #f59e0b" : "2px solid #93c5fd",
                  backgroundColor: hasAttrOverride ? "#fef3c7" : "#ffffff",
                  color: hasAttrOverride ? "#92400e" : "#1e40af",
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
                  flex: 1,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditable && editingMode === null) {
                    startEditing(
                      `attribute-${index}`,
                      defaultValue
                    );
                  }
                }}
                title={hasAttrOverride ? `${defaultValue} (Modified)` : `${defaultValue} (Click to edit)`}
              >
                <div
                  style={{
                    fontWeight: "500",
                    color: hasAttrOverride ? "#92400e" : "#1e40af",
                    fontSize: compact ? "9px" : "11px",
                    lineHeight: "1.1",
                  }}
                >
                  {defaultValue}
                </div>
              </div>
            );
          })()}
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
            boxSizing: "border-box",
            cursor: isEditable ? "pointer" : "default",
            textAlign: "center",
            minHeight: compact ? "14px" : "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            whiteSpace: "normal",
            wordWrap: "break-word",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isEditable && editingMode === null) {
              startEditing(`attribute-${index}`, attr);
            }
          }}
          title={`${attr} (Click to edit)`}
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
        // 간단한 구조: name은 문자열 값
        category = "name";
        defaultValue = placeHolders[objectId].name;
      }
      // fallback: defaultName이나 원본 name 사용
      else if (object.defaultName) {
        category = "object";
        defaultValue = object.defaultName;
      }
      // 원본 값 사용 (더 이상 {} 체크하지 않음)
      else {
        category = "object";
        defaultValue = object.name || "?";
      }

      // Check if name is overridden
      const hasNameOverride = objectOverrides?.name !== undefined;

      return (
        <div
          style={{
            border: hasNameOverride ? "2px solid #f59e0b" : "2px solid #fca5a5",
            backgroundColor: hasNameOverride ? "#fef3c7" : "#ffffff",
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
          onClick={(e) => {
            e.stopPropagation();
            if (isEditable && editingMode === null) {
              startEditing("name", defaultValue);
            }
          }}
          title={hasNameOverride ? `${defaultValue} (Modified)` : `${defaultValue}`}
        >
          <div
            style={{
              fontWeight: "500",
              color: hasNameOverride ? "#92400e" : "#991b1b",
              fontSize: compact ? "10px" : "11px",
              lineHeight: "1.1",
            }}
          >
            {defaultValue}
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (isEditable && editingMode === null) {
            startEditing("name", object.name);
          }
        }}
        style={{
          cursor: isEditable ? "pointer" : "default",
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
          whiteSpace: "normal",
          wordWrap: "break-word",
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
        onMouseEnter={() => {
          setIsHovered(true);
          logEvent("object_node.hovered", {
            object_id: object.id,
            object_name: object.name,
            parent_instance_id: parentInstanceId,
            is_class_mode: isClassMode,
          });
        }}
        onMouseLeave={() => setIsHovered(false)}
        data-connection-target={isConnectionTarget ? "true" : undefined}
        data-object-id={object.id}
        data-parent-instance-id={parentInstanceId}
      // onMouseDown={handleMouseDown}
      >
        {/* Content wrapper with overflow control */}
        <div style={{
          width: "100%",
          height: "100%",
          overflow: "hidden", // 내용은 숨기되
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Attributes Section */}
          {(expanded || editingMode !== null) && (attributeCount > 0 || editingMode === "adding" || (isEditable && editingMode === null)) && (
            <div
              style={{
                flex: 1,
                marginBottom: compact ? "2px" : "4px",
                display: "flex",
                flexDirection: "column",
                gap: compact ? "1px" : "2px",
              }}
            >
              {/* Existing Attributes and Add Button */}
              {(attributeCount > 0 || (isEditable && editingMode === null)) && (
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
                  ).filter(Boolean)}

                  {/* Add Attribute Button styled as attribute node */}
                  {isEditable && editingMode === null && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing("adding");
                      }}
                      style={{
                        border: isClassMode ? "2px dashed #93c5fd" : "1px dashed #93c5fd",
                        backgroundColor: isClassMode ? "#f0f9ff" : "#eff6ff",
                        color: "#3b82f6",
                        borderRadius: "4px",
                        padding: compact ? "1px 3px" : "2px 4px",
                        fontSize: compact ? "10px" : "11px",
                        fontWeight: 500,
                        boxSizing: "border-box",
                        cursor: "pointer",
                        textAlign: "center",
                        minHeight: compact ? "14px" : "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: 1,
                        transition: "all 0.2s ease",
                        opacity: 0.6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.backgroundColor = isClassMode ? "#dbeafe" : "#dbeafe";
                        e.currentTarget.style.borderStyle = "solid";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.6";
                        e.currentTarget.style.backgroundColor = isClassMode ? "#f0f9ff" : "#eff6ff";
                        e.currentTarget.style.borderStyle = "dashed";
                      }}
                      title="Add new attribute"
                    >
                      <Plus size={compact ? 8 : 10} strokeWidth={2} />
                    </div>
                  )}
                </div>
              )}

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

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (editingMode === null) {
                  logEvent("object_node.expand_collapse", {
                    object_id: object.id,
                    object_name: object.name,
                    action: expanded ? "collapse" : "expand",
                    parent_instance_id: parentInstanceId,
                    is_class_mode: isClassMode,
                  });
                  setExpanded(!expanded);
                }
              }}
              style={{
                background: "none",
                border: "none",
                cursor: editingMode === null ? "pointer" : "default",
                color: "#7f1d1d",
                opacity: editingMode === null ? getElementOpacity("controls") : 0.3,
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              title={editingMode === null ? (expanded ? "Collapse" : "Expand") : "Cannot collapse while editing"}
              disabled={editingMode !== null}
            >
              {(expanded || editingMode !== null) ? <ChevronDown size={compact ? 8 : 10} /> : <ChevronRight size={compact ? 8 : 10} />}
            </button>
          </div>
        </div> {/* Content wrapper 닫기 */}

        {/* Toolbar buttons positioned outside content flow */}
        {isEditable && editingMode === null && (
          <div
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              display: "flex",
              gap: "2px",
              opacity: getElementOpacity("controls"),
              flexShrink: 0,
              zIndex: 10,
            }}
          >
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
        {!isEditable && canExtract && isHovered && !isClassMode && (
          <div
            style={{
              position: "absolute",
              top: "-6px",
              right: "-6px",
              display: "flex",
              gap: "2px",
              opacity: getElementOpacity("controls"),
              flexShrink: 0,
              zIndex: 10,
            }}
          >
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
          </div>
        )}

        {/* Connection Drag Handle - 오른쪽 중앙, 편집 모드 + 호버 시만 표시 (이 객체가 드래그 중이 아닐 때만) */}
        {isEditable && editingMode === null && isHovered && showConnectionHandles && !isDraggingConnectionFromThis && (
          <div
            ref={connectionHandleRef}
            onMouseDown={handleConnectionDragStart}
            style={{
              position: "absolute",
              right: "-6px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "8px",
              height: "8px",
              backgroundColor: "#3b82f6",
              border: "2px solid white",
              borderRadius: "50%",
              cursor: "crosshair",
              zIndex: 15,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
            title="Drag to connect to another object"
          >
            <Circle size={8} color="#3b82f6" fill="#3b82f6" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        )}

        {/* Connection Drop Target - 왼쪽 중앙, 다른 객체가 연결 드래그 중일 때만 표시 */}
        {isConnectionTarget && showConnectionHandles && (
          <div
            ref={dropTargetRef}
            style={{
              position: "absolute",
              left: "-6px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "8px",
              height: "8px",
              backgroundColor: "#10b981",
              border: "2px solid white",
              borderRadius: "50%",
              zIndex: 15,
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              animation: "pulse 1.5s ease-in-out infinite alternate",
            }}
            title="Drop connection here"
          >
            <Circle size={8} color="#10b981" fill="#10b981" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </div>
        )}
      </div>      
    </>
  );
};

export default ObjectNode;
