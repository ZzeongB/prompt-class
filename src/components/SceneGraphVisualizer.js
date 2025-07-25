import React, { useState } from "react";
import { Plus } from "lucide-react";
import RelationshipNode from "./nodes/RelationshipNode";
import ObjectNode from "./nodes/ObjectNode";

export default function SceneGraphVisualizer({
  sceneGraph,
  onSceneGraphChange,
}) {
  const [hoveredObject, setHoveredObject] = useState(null);
  const [editingObject, setEditingObject] = useState(null);
  const [hoveredRelationship, setHoveredRelationship] = useState(null);

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

  const groupedRelationships = sceneGraph.relationships.reduce((acc, rel) => {
    const key = `${rel.source}-${rel.target}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(rel);
    return acc;
  }, {});

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#f8fafc",
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
        {sceneGraph.objects.map((obj) => (
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
