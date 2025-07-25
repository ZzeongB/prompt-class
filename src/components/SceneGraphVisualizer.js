import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus, Trash2 } from "lucide-react";

// Scene Graph 스타일의 Object 컴포넌트
const ObjectNode = ({
  object,
  onEdit,
  onDelete,
  onAddAttribute,
  isHovered,
  setIsHovered,
  isEditing,
  setIsEditing,
}) => {
  const [editValue, setEditValue] = useState(object.name);
  const [newAttributeValue, setNewAttributeValue] = useState("");
  const [addingAttribute, setAddingAttribute] = useState(false);
  const [expanded, setExpanded] = useState(true); // 추가
  const [editingAttributeIndex, setEditingAttributeIndex] = useState(null);
  const [editingAttributeValue, setEditingAttributeValue] = useState("");

  const handleAttributeSave = () => {
    if (editingAttributeIndex !== null) {
      const updatedAttributes = [...object.attributes];
      updatedAttributes[editingAttributeIndex] = editingAttributeValue.trim();
      onEdit?.(object.id, object.name, updatedAttributes);
      setEditingAttributeIndex(null);
      setEditingAttributeValue("");
    }
  };

  const cancelAttributeEdit = () => {
    setEditingAttributeIndex(null);
    setEditingAttributeValue("");
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(object.name);
  };

  const handleSave = () => {
    onEdit?.(object.id, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(object.name);
    setIsEditing(false);
  };

  const handleAddAttribute = () => {
    if (newAttributeValue.trim()) {
      onAddAttribute?.(object.id, newAttributeValue.trim());
      setNewAttributeValue("");
      setAddingAttribute(false);
    }
  };

  const handleDeleteAttribute = (attrIndex) => {
    const updatedAttributes = object.attributes.filter(
      (_, index) => index !== attrIndex
    );
    onEdit?.(object.id, object.name, updatedAttributes);
  };

  return (
    <div
      style={{
        border: "1px solid #fca5a5",
        borderRadius: "6px",
        padding: "5px",
        backgroundColor: isHovered ? "#fecaca" : "#fed7d7",
        marginBottom: "0px",
        // minWidth: "120px"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Object Name */}
      <div
        className="flex items-center gap-1"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* 왼쪽: 토글 + 이름 */}
        <div className="flex items-center gap-1">
          {/* <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              padding: "0",
              cursor: "pointer",
              color: "#7f1d1d",
            }}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button> */}

          <div
            onDoubleClick={handleEdit}
            style={{ fontSize: "11px", fontWeight: "500", color: "#7f1d1d" }}
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
                  fontSize: "11px",
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
              object.name
            )}
            {/* Toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                padding: "0",
                cursor: "pointer",
                color: "#7f1d1d",
              }}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronDown size={10} />
              ) : (
                <ChevronRight size={10} />
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        {isHovered && (
          <div
            className="flex items-center gap-1"
            style={{ display: "flex", marginLeft: "auto" }}
          >
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
                cursor: "pointer",
                fontSize: "11px",
                color: "#1e40af",
              }}
              title="Add Attribute"
            >
              A+
            </button>

            <button
              onClick={() => onDelete?.(object.id)}
              style={{
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                borderRadius: "3px",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#dc2626",
              }}
              title="Delete"
            >
              <div>
                <Trash2 size={12} color="#dc2626" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Attributes */}
      {expanded && (
        <div style={{ marginTop: "8px" }}>
          {object.attributes &&
            object.attributes.map((attr, index) => (
              <div
                key={index}
                style={{ position: "relative", marginTop: 3, marginLeft: 5 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "6px",
                  }}
                >
                  {editingAttributeIndex === index ? (
                    <input
                      value={editingAttributeValue}
                      onChange={(e) => setEditingAttributeValue(e.target.value)}
                      onBlur={handleAttributeSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAttributeSave();
                        if (e.key === "Escape") cancelAttributeEdit();
                      }}
                      autoFocus
                      style={{
                        fontSize: "11px",
                        padding: "1px 3px",
                        border: "1px solid #3b82f6",
                        borderRadius: "4px",
                        backgroundColor: "#ffffff",
                        color: "#1f2937",
                        outline: "none",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontWeight: "500",
                        width: "60px",
                        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                        textAlign: "center",
                      }}
                    />
                  ) : (
                    <div
                      onDoubleClick={() => {
                        setEditingAttributeIndex(index);
                        setEditingAttributeValue(attr);
                      }}
                      style={{
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "11px",
                        height: "18px",
                        minWidth: "20px",
                        maxWidth: "80px",
                        textAlign: "center",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontWeight: "500",
                        border: "1px solid #93c5fd",
                        backgroundColor: "#dbeafe",
                        color: "#1e40af",
                        cursor: "text",
                      }}
                    >
                      {attr}
                    </div>
                  )}

                  {isHovered && (
                    <button
                      onClick={() => handleDeleteAttribute(index)}
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
                      }}
                      title="Delete Attribute"
                    >
                      <div>
                        <Trash2 size={10} color="#dc2626" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
            ))}

          {/* Add new attribute input */}
          {addingAttribute && (
            <div style={{ position: "relative", marginTop: 3, marginLeft: 5 }}>
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
                  outline: "none",
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
    </div>
  );
};

// Relationship 컴포넌트
const RelationshipNode = ({
  relationship,
  objects,
  onEdit,
  onDelete,
  isHovered,
  setIsHovered,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(relationship.relation);

  const sourceObject = objects.find((obj) => obj.id === relationship.source);
  const targetObject = objects.find((obj) => obj.id === relationship.target);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(relationship.relation);
  };

  const handleSave = () => {
    onEdit?.(relationship.source, relationship.target, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(relationship.relation);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "2px 0",
        position: "relative",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Relationship Label + Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "6px",
          zIndex: 2,
        }}
      >
        <div
          style={{
            borderRadius: "4px",
            padding: "2px 6px",
            fontSize: "11px", // ✅ 고침
            height: "18px",
            minWidth: "20px",
            maxWidth: "80px",
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: "500",
            border: "1px solid #86efac",
            backgroundColor: isHovered ? "#bbf7d0" : "#dcfce7",
            color: "#15803d",
            cursor: "text",
            width: "fit-content",
          }}
          onDoubleClick={handleEdit}
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
                fontSize: "11px", // ✅ 고침
                padding: "1px 3px",
                border: "1px solid #3b82f6",
                borderRadius: "4px",
                backgroundColor: "#ffffff",
                color: "#1f2937",
                outline: "none",
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontWeight: "500",
                width: `${Math.max(4, editValue.length + 1)}ch`,
                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                textAlign: "center",
              }}
            />
          ) : (
            relationship.relation
          )}
        </div>

        {isHovered && (
          <button
            onClick={() => onDelete?.(relationship.source, relationship.target)}
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "3px",
              width: "18px", // ✅ 넉넉한 크기
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            title="Delete Relationship"
          >
            <div>
              <Trash2 size={10} color="#dc2626" /> {/* ✅ 크기 & 색상 조정 */}
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

// 메인 Scene Graph Visualizer 컴포넌트
export default function SceneGraphVisualizer() {
  const [sceneGraph, setSceneGraph] = useState({
    objects: [
      { id: "object1", name: "tree", attributes: ["apple", "green"] },
      { id: "object2", name: "person", attributes: ["tall", "happy"] },
      { id: "object3", name: "ball", attributes: ["red", "round"] },
    ],
    relationships: [{ source: "object1", target: "object2", relation: "near" }],
  });

  const [hoveredObject, setHoveredObject] = useState(null);
  const [editingObject, setEditingObject] = useState(null);
  const [hoveredRelationship, setHoveredRelationship] = useState(null);

  const handleObjectEdit = (objectId, newName, newAttributes = null) => {
    setSceneGraph((prev) => ({
      ...prev,
      objects: prev.objects.map((obj) =>
        obj.id === objectId
          ? {
              ...obj,
              name: newName,
              attributes:
                newAttributes !== null ? newAttributes : obj.attributes,
            }
          : obj
      ),
    }));
  };

  const handleObjectDelete = (objectId) => {
    setSceneGraph((prev) => ({
      ...prev,
      objects: prev.objects.filter((obj) => obj.id !== objectId),
      relationships: prev.relationships.filter(
        (rel) => rel.source !== objectId && rel.target !== objectId
      ),
    }));
  };

  const handleAddAttribute = (objectId, newAttribute) => {
    setSceneGraph((prev) => ({
      ...prev,
      objects: prev.objects.map((obj) =>
        obj.id === objectId
          ? { ...obj, attributes: [...(obj.attributes || []), newAttribute] }
          : obj
      ),
    }));
  };

  const handleRelationshipEdit = (sourceId, targetId, newRelation) => {
    setSceneGraph((prev) => ({
      ...prev,
      relationships: prev.relationships.map((rel) =>
        rel.source === sourceId && rel.target === targetId
          ? { ...rel, relation: newRelation }
          : rel
      ),
    }));
  };

  const handleRelationshipDelete = (sourceId, targetId) => {
    setSceneGraph((prev) => ({
      ...prev,
      relationships: prev.relationships.filter(
        (rel) => !(rel.source === sourceId && rel.target === targetId)
      ),
    }));
  };

  const handleAddObject = () => {
    const newId = `object${sceneGraph.objects.length + 1}`;
    setSceneGraph((prev) => ({
      ...prev,
      objects: [
        ...prev.objects,
        { id: newId, name: "new object", attributes: [] },
      ],
    }));
  };

  // Group relationships by source-target pairs for rendering
  const groupedRelationships = sceneGraph.relationships.reduce((acc, rel) => {
    const key = `${rel.source}-${rel.target}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(rel);
    return acc;
  }, {});

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#f8fafc",
        //   minHeight: "100vh"
      }}
    >
      <div style={{ marginBottom: "5px" }}>
        <button
          onClick={handleAddObject}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            // padding: "6px 12px",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <Plus size={14} />
          Add Object
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          alignItems: "center",
        }}
      >
        {/* Objects */}
        {sceneGraph.objects.map((obj, index) => (
          <React.Fragment key={obj.id}>
            <ObjectNode
              object={obj}
              onEdit={handleObjectEdit}
              onDelete={handleObjectDelete}
              onAddAttribute={handleAddAttribute}
              isHovered={hoveredObject === obj.id}
              setIsHovered={(hovered) =>
                setHoveredObject(hovered ? obj.id : null)
              }
              isEditing={editingObject === obj.id}
              setIsEditing={(editing) =>
                setEditingObject(editing ? obj.id : null)
              }
            />

            {/* Relationships from this object */}
            {Object.entries(groupedRelationships)
              .filter(([key]) => key.startsWith(obj.id + "-"))
              .map(([key, relationships]) =>
                relationships.map((rel, relIndex) => (
                  <RelationshipNode
                    key={`${key}-${relIndex}`}
                    relationship={rel}
                    objects={sceneGraph.objects}
                    onEdit={handleRelationshipEdit}
                    onDelete={handleRelationshipDelete}
                    isHovered={
                      hoveredRelationship ===
                      `${rel.source}-${rel.target}-${relIndex}`
                    }
                    setIsHovered={(hovered) =>
                      setHoveredRelationship(
                        hovered
                          ? `${rel.source}-${rel.target}-${relIndex}`
                          : null
                      )
                    }
                  />
                ))
              )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
