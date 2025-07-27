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

  return (
    <div
      style={{
        border: "1px solid #fca5a5",
        borderRadius: "6px",
        padding: "5px",
        backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
        marginBottom: "0px",
        maxWidth: "80px",
      }}
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
                border: "1px solid #93c5fd",
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
          {object.attributes?.map((attr, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
                // marginLeft: 3,
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
              {isHovered && isEditable &&  (
                <DeleteButton
                  onClick={() => handleDeleteAttribute(index)}
                  size={10}
                  title="Delete Attribute"
                />
              )}
            </div>
          ))}

          {addingAttribute && (
            <div style={{ marginTop: 3,}}>
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
                placeholder="new attribute"
                style={{
                  fontSize: "11px",
                  padding: "1px 3px",
                  border: "1px solid #3b82f6",
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
        <div style={{ fontSize: "11px", fontWeight: "500", color: "#7f1d1d" }}>
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
              {object.name}
            </div>
          )}
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
