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
  
  useEffect(() => {
    setEditValue(object.name);
  }, [object.name]);

  const handleSaveName = (val) => {
    onEdit?.(object.id, val);
    setIsEditing(false);
  };

  const handleAddAttribute = () => {
    if (newAttributeValue.trim()) {
      onAddAttribute?.(object.id, newAttributeValue.trim());
      setNewAttributeValue("");
      setAddingAttribute(false);
    }
  };

  const handleEditAttribute = (index, val) => {
    if (!isEditable) return;
    const updated = [...object.attributes];
    updated[index] = val;
    onEdit?.(object.id, object.name, updated);
    setEditingAttributeIndex(null);
  };

  const handleDeleteAttribute = (index) => {
    const updated = object.attributes.filter((_, i) => i !== index);
    onEdit?.(object.id, object.name, updated);
  };

  // Class mode에서 attribute를 {label} : default value 형태로 렌더링
  const renderClassAttribute = (attr, index) => {
    // placeHolders에서 attr에서 {}를 제거한 string을 value로 갖는 Key를 찾기
    const cleanAttr = attr.replace(/[{}]/g, ''); // {gender} → gender
    const defaultValue = Object.keys(placeHolders || {}).find(key => placeHolders[key] === cleanAttr) || "?";
    const label = cleanAttr;
    
    return (
      <div
        key={index}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          marginBottom: 2,
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          flex: 1,
        }}>
          {/* Label part - instance와 같은 색상, 다른 테두리 */}
          <div style={{
            border: "2px dashed #93c5fd", // 점선 테두리로 구분
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            borderRadius: "4px",
            padding: "2px 4px",
            fontSize: "11px",
            fontWeight: "600",
            minWidth: "20px",
            textAlign: "center",
          }}>
            {label}
          </div>
          
          {/* Colon separator */}
          <span style={{
            fontSize: "10px",
            color: "#6b7280",
            fontWeight: "bold",
          }}>:</span>
          
          {/* Default value part - instance와 같은 색상, 다른 테두리 */}
          <div style={{
            border: "2px dotted #93c5fd", // 점점선 테두리로 구분
            backgroundColor: "#dbeafe",
            color: "#1e40af",
            borderRadius: "4px",
            padding: "2px 4px",
            fontSize: "11px",
            fontWeight: "500",
            minWidth: "15px",
            textAlign: "center",
          }}>
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

  // Instance mode에서 기존대로 attribute 렌더링
  const renderInstanceAttribute = (attr, index) => (
    <div
      key={index}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
      }}
    >
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
          width: "60px",
        }}
        isEditable={isEditable}
      />
      {isHovered && isEditable && (
        <DeleteButton
          onClick={() => handleDeleteAttribute(index)}
          size={10}
          title="Delete Attribute"
        />
      )}
    </div>
  );

  // Class mode에서는 다른 색상 스키마 사용
  const nodeStyle = isClassMode ? {
    border: "2px dashed #fca5a5", // 점선 테두리로 구분
    borderRadius: "6px",
    padding: "5px",
    backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
    marginBottom: "0px",
    maxWidth: "90px", // Class mode에서는 조금 더 넓게
  } : {
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    padding: "5px",
    backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
    marginBottom: "0px",
    maxWidth: "80px",
  };

  const headerColor = "#7f1d1d"; // instance와 동일한 색상

  return (
    <div
      style={nodeStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {isHovered && isEditable && (
          <div className="flex items-center gap-1" style={{ display: "flex" }}>
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
      </div>

      {/* Attributes */}
      {expanded && (
        <div style={{ marginTop: "2px" }}>
          {object.attributes?.map((attr, index) => 
            isClassMode 
              ? renderClassAttribute(attr, index)
              : renderInstanceAttribute(attr, index)
          )}

          {addingAttribute && (
            <div style={{ marginTop: 3 }}>
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
                  border: isClassMode ? "2px dashed #3b82f6" : "1px solid #3b82f6",
                  borderRadius: "4px",
                  backgroundColor: "#ffffff",
                  color: "#1f2937",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  fontWeight: "500",
                  width: "60px",
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                  textAlign: "center",
                }}
              />
            </div>
          )}
        </div>
      )}

      <div
        className="flex items-center gap-1"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: "500", color: headerColor }}>
          {isEditing ? (
            <EditableLabel
              value={editValue}
              onSave={handleSaveName}
              autoFocus
            />
          ) : (
            <div
              onDoubleClick={() => {
                if (isEditable) setIsEditing(true);
              }}
            >
              {isClassMode ? (
                // Class mode에서는 {label} : default value 형태로 렌더링
                (() => {
                  const cleanName = object.name.replace(/[{}]/g, ''); // {person} → person
                  const defaultValue = Object.keys(placeHolders || {}).find(key => placeHolders[key] === cleanName) || "?";
                  return (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                      justifyContent: "center",
                    }}>
                      <span style={{
                        border: "2px dashed #fca5a5",
                        backgroundColor: "#fed7d7",
                        color: "#7f1d1d",
                        borderRadius: "3px",
                        padding: "1px 3px",
                        fontSize: "10px",
                        fontWeight: "600",
                      }}>
                        {cleanName}
                      </span>
                      <span style={{ fontSize: "9px", fontWeight: "bold" }}>:</span>
                      <span style={{
                        border: "2px dotted #fca5a5",
                        backgroundColor: "#fed7d7",
                        color: "#7f1d1d",
                        borderRadius: "3px",
                        padding: "1px 3px",
                        fontSize: "10px",
                        fontWeight: "500",
                      }}>
                        {defaultValue}
                      </span>
                    </div>
                  );
                })()
              ) : (
                object.name
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: headerColor,
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