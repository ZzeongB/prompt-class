import React, { useState, useEffect } from "react";
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
}) => {
  const [editValue, setEditValue] = useState(object.name);
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [addingAttribute, setAddingAttribute] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [editingAttributeIndex, setEditingAttributeIndex] = useState(null);

  // 편집 중인 값들을 위한 상태
  const [editingObjectValue, setEditingObjectValue] = useState("");
  const [editingAttributeValue, setEditingAttributeValue] = useState("");

  useEffect(() => {
    setEditValue(object.name);
  }, [object.name]);

  const handleSaveObjectName = () => {
    handleSaveName(editingObjectValue);
  };

  const handleSaveAttribute = (index) => {
    handleEditAttribute(index, editingAttributeValue);
  };

  const handleDeleteAttribute = (index) => {
    const updated = object.attributes.filter((_, i) => i !== index);
    onEdit?.(object.id, object.name, updated);
  };
  // // ObjectNode 컴포넌트에서 스타일 수정
  // // 파싱 함수들을 엔터로 구분하도록 수정
  // const parseClassInput = (input) => {
  //   const trimmed = input.trim();

  //   // 첫 번째 공백을 기준으로 분리
  //   const spaceIndex = trimmed.indexOf(" ");

  //   if (spaceIndex !== -1) {
  //     const placeholderLabel = trimmed.substring(0, spaceIndex).trim();
  //     const defaultValue = trimmed.substring(spaceIndex + 1).trim();

  //     return { placeholderLabel, defaultValue };
  //   }

  //   // 공백이 없으면 기본값으로 처리
  //   return { placeholderLabel: trimmed, defaultValue: "?" };
  // };

  // handleSaveName 수정
  const handleSaveName = (val) => {
    console.log("handleSaveName called with:", val);

    if (!val || !val.trim()) {
      setIsEditing(false);
      setEditingObjectValue("");
      return;
    }

    if (isClassMode) {
      const { placeholderLabel, defaultValue } = parseClassInput(val);
      console.log("Parsed:", { placeholderLabel, defaultValue });
      onEdit?.(object.id, `{${placeholderLabel}}`, object.attributes, {
        [defaultValue]: placeholderLabel,
      });
    } else {
      onEdit?.(object.id, val);
    }
    setIsEditing(false);
    setEditingObjectValue("");
  };

  // handleEditAttribute 수정
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

  // handleAddAttribute 수정
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

  // 수정된 parseClassInput 함수
  const parseClassInput = (input) => {
    const trimmed = input.trim();

    // 공백을 기준으로 분리 (기존 동작 유지)
    const spaceIndex = trimmed.indexOf(" ");

    if (spaceIndex !== -1) {
      const placeholderLabel = trimmed.substring(0, spaceIndex).trim();
      const defaultValue = trimmed.substring(spaceIndex + 1).trim();

      return { placeholderLabel, defaultValue };
    }

    // 공백이 없으면 기본값으로 처리
    return { placeholderLabel: trimmed, defaultValue: "?" };
  };

  // ObjectNode.js의 renderClassAttribute 함수 수정
  const renderClassAttribute = (attr, index) => {
    const cleanAttr = attr.replace(/[{}]/g, "");

    // placeHolders에서 올바른 defaultValue 찾기
    // placeHolders는 { "defaultValue": "label" } 형태로 저장됨
    const defaultValue =
      Object.keys(placeHolders || {}).find(
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
              // 편집할 때는 "label value" 형태로
              setEditingAttributeValue(`${cleanAttr} ${defaultValue}`);
            }
          }}
          title={`${cleanAttr}: ${defaultValue}`}
        >
          {/* 라벨 */}
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
          {/* 값 (개행 문자 처리) */}
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
  // renderInstanceAttribute 함수도 수정
  const renderInstanceAttribute = (attr, index) => (
    <div
      key={index}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        marginBottom: "2px",
        width: "100%", // 추가
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {" "}
        {/* 추가: wrapper div */}
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
            width: "100%", // 수정
            maxWidth: "85px", // 추가
            overflow: "hidden", // 추가
            textOverflow: "ellipsis", // 추가
            whiteSpace: "nowrap", // 추가
            boxSizing: "border-box", // 추가
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

  // renderObjectName 함수의 클래스 모드 부분 최종 수정
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
              padding: "3px 6px", // 패딩 증가
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

    // 편집 모드가 아닐 때
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
            padding: "3px 6px", // 패딩 증가
            fontSize: "11px",
            textAlign: "center",
            cursor: isEditable ? "pointer" : "default",
            boxSizing: "border-box",
          }}
          onDoubleClick={() => {
            if (isEditable) {
              // 수정: 공백으로 구분된 형태로 편집값 설정
              setEditingObjectValue(`${cleanName} ${defaultValue}`);
              setIsEditing(true);
            }
          }}
          title={`${cleanName}: ${defaultValue}`}
        >
          {/* 두 줄로 깔끔하게 표시 */}
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

  // 노드 전체 스타일도 수정
  const nodeStyle = {
    border: isClassMode ? "2px dashed #fca5a5" : "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "5px",
    backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
    marginBottom: "0px",
    maxWidth: isClassMode ? "100px" : "90px", // 수정: 약간 늘림
    minWidth: "80px", // 추가: 최소 너비
    boxSizing: "border-box", // 추가
    overflow: "hidden", // 추가
  };

  return (
    <div
      style={nodeStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
                // width: "70px",
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
  );
};

export default ObjectNode;
