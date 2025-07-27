import React, { useState } from "react";
import { Plus } from "lucide-react";
import RelationshipNode from "./nodes/RelationshipNode";
import ObjectNode from "./nodes/ObjectNode";

export default function SceneGraphVisualizer({
  sceneGraph,
  onSceneGraphChange,
  isEditable = true,
}) {
  const [hoveredObject, setHoveredObject] = useState(null);
  const [editingObject, setEditingObject] = useState(null);
  const [hoveredRelationship, setHoveredRelationship] = useState(null);
  const [connectingMode, setConnectingMode] = useState(false);
  const [selectedSourceObject, setSelectedSourceObject] = useState(null);

  const handleObjectEdit = (objectId, newName, newAttributes = null) => {
    const updatedGraph = {
      ...sceneGraph,
      objects: sceneGraph.objects.map((obj) =>
        obj.id === objectId
          ? {
              ...obj,
              name: newName,
              attributes: newAttributes ?? obj.attributes,
            }
          : obj
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleObjectDelete = (objectId) => {
    const updatedGraph = {
      ...sceneGraph,
      objects: sceneGraph.objects.filter((obj) => obj.id !== objectId),
      relationships: sceneGraph.relationships.filter(
        (rel) => rel.source !== objectId && rel.target !== objectId
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleAddAttribute = (objectId, newAttribute) => {
    const updatedGraph = {
      ...sceneGraph,
      objects: sceneGraph.objects.map((obj) =>
        obj.id === objectId
          ? { ...obj, attributes: [...(obj.attributes || []), newAttribute] }
          : obj
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleRelationshipEdit = (sourceId, targetId, newRelation) => {
    const updatedGraph = {
      ...sceneGraph,
      relationships: sceneGraph.relationships.map((rel) =>
        rel.source === sourceId && rel.target === targetId
          ? { ...rel, relation: newRelation }
          : rel
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleRelationshipDelete = (sourceId, targetId) => {
    const updatedGraph = {
      ...sceneGraph,
      relationships: sceneGraph.relationships.filter(
        (rel) => !(rel.source === sourceId && rel.target === targetId)
      ),
    };
    onSceneGraphChange(updatedGraph);
  };

  const handleAddObject = () => {
    const newId = `object${sceneGraph.objects.length + 1}`;
    const updatedGraph = {
      ...sceneGraph,
      objects: [
        ...sceneGraph.objects,
        { id: newId, name: "new object", attributes: [] },
      ],
    };
    onSceneGraphChange(updatedGraph, false);
  };

  const handleObjectClick = (objectId) => {
    if (connectingMode) {
      if (!selectedSourceObject) {
        // First object selected as source
        setSelectedSourceObject(objectId);
      } else if (selectedSourceObject !== objectId) {
        // Second object selected as target - create relationship
        const relationshipExists = sceneGraph.relationships.some(
          (rel) =>
            rel.source === selectedSourceObject && rel.target === objectId
        );

        if (!relationshipExists) {
          const updatedGraph = {
            ...sceneGraph,
            relationships: [
              ...sceneGraph.relationships,
              {
                source: selectedSourceObject,
                target: objectId,
                relation: "related to",
              },
            ],
          };
          onSceneGraphChange(updatedGraph);
        }

        // Reset connecting mode
        setConnectingMode(false);
        setSelectedSourceObject(null);
      }
    }
  };

  const handleToggleConnectMode = () => {
    setConnectingMode(!connectingMode);
    setSelectedSourceObject(null);
  };

  const groupedRelationships = sceneGraph.relationships.reduce((acc, rel) => {
    const key = `${rel.source}-${rel.target}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rel);
    return acc;
  }, {});

  return (
    <div
      style={{
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "#f8fafc",
        padding: "8px",
        borderRadius: "6px",
        position: "relative",
      }}
    >
      {isEditable && (
        <button
          onClick={handleAddObject}
          style={{
            position: "absolute",
            top: "4px",
            right: "28px",
            background: "#e2e8f0",
            color: "#64748b",
            border: "none",
            borderRadius: "4px",
            padding: "2px 4px",
            fontSize: "9px",
            fontWeight: "400",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            opacity: "0.6",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = "0.6";
          }}
        >
          <Plus size={10} />
          Add
        </button>
      )}

      {isEditable && (
        <button
          onClick={handleToggleConnectMode}
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            background: connectingMode ? "#dcfce7" : "#e2e8f0",
            color: connectingMode ? "#15803d" : "#64748b",
            border: connectingMode ? "1px solid #86efac" : "none",
            borderRadius: "4px",
            padding: "2px 4px",
            fontSize: "9px",
            fontWeight: "400",
            cursor: "pointer",
            opacity: connectingMode ? "1" : "0.6",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            if (!connectingMode) e.target.style.opacity = "0.6";
          }}
          title={connectingMode ? "Cancel connecting" : "Connect objects"}
        >
          ⟷
        </button>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          alignItems: "flex-start",
          paddingTop: "16px",
        }}
      >
        {connectingMode && (
          <div
            style={{
              fontSize: "10px",
              color: "#15803d",
              backgroundColor: "#dcfce7",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid #86efac",
              marginBottom: "4px",
            }}
          >
            {selectedSourceObject
              ? "Click target object"
              : "Click source object"}
          </div>
        )}

        {sceneGraph.objects.map((obj) => (
          <React.Fragment key={obj.id}>
            <div
              onClick={() => handleObjectClick(obj.id)}
              style={{
                cursor: connectingMode ? "pointer" : "default",
                border:
                  selectedSourceObject === obj.id
                    ? "2px solid #15803d"
                    : "none",
                borderRadius: "8px",
                padding: selectedSourceObject === obj.id ? "2px" : "0",
              }}
            >
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
                isEditable={isEditable}
              />
            </div>

            {Object.entries(groupedRelationships)
              .filter(([key]) => key.startsWith(obj.id + "-"))
              .flatMap(([key, relationships]) =>
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
