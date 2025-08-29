import React, { useState } from "react";
import SceneGraphVisualizer from "../components/SceneGraphVisualizer";
import { Eye, Grid, List } from "lucide-react";

const EvaluationInstanceBoard = ({ promptData }) => {
  const [viewMode, setViewMode] = useState("text"); // "text" | "graph" | "both"

  if (!promptData) {
    return (
      <div
        style={{
          backgroundColor: "#f8fafc",
          borderLeft: "1px solid #e2e8f0",
          padding: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        Select a prompt to view details
      </div>
    );
  }

  const sceneGraphData = {
    objects: promptData.instances.map(instance => ({
      id: instance.id,
      name: instance.label,
      attributes: [instance.textDescription],
    })),
    relationships: promptData.sceneGraph.relationships.map(rel => ({
      source: rel.from,
      target: rel.to,
      relation: rel.relationship,
    }))
  };

  const renderTextView = () => (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        padding: "16px",
        border: "1px solid #e2e8f0",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#1e293b",
          marginBottom: "12px",
        }}
      >
        Text Information
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#374151",
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: "#f8fafc",
          borderRadius: "6px",
          border: "1px solid #e5e7eb",
        }}
      >
        <strong>Global Caption:</strong> {promptData.globalCaption}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {promptData.instances.map((instance, index) => (
          <div
            key={instance.id}
            style={{
              padding: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                {index + 1}. {instance.label}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: instance.isFromClass ? "#059669" : "#6b7280",
                  backgroundColor: instance.isFromClass ? "#d1fae5" : "#f3f4f6",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                {instance.isFromClass ? "From Class" : "Standalone"}
              </div>
            </div>
            
            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                marginBottom: "8px",
                lineHeight: "1.4",
              }}
            >
              {instance.textDescription}
            </div>
            
            <div
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                Bounding Box: ({instance.boundingBox.x}, {instance.boundingBox.y}) 
                {instance.boundingBox.width}×{instance.boundingBox.height}
              </span>
              {instance.classId && (
                <span>Class ID: {instance.classId}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGraphView = () => (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        padding: "16px",
        border: "1px solid #e2e8f0",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: "600",
          color: "#1e293b",
          marginBottom: "12px",
        }}
      >
        Scene Graph
      </div>
      
      <div
        style={{
          minHeight: "200px",
          backgroundColor: "#f8fafc",
          borderRadius: "6px",
          padding: "12px",
          border: "1px solid #e5e7eb",
        }}
      >
        <SceneGraphVisualizer
          sceneGraph={sceneGraphData}
          isEditable={false}
          compact={false}
          instanceId={`eval-${promptData.id}`}
        />
      </div>
      
      {promptData.sceneGraph.relationships.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          <strong>Relationships:</strong>
          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
            {promptData.sceneGraph.relationships.map((rel, index) => (
              <li key={index} style={{ marginBottom: "2px" }}>
                {promptData.instances.find(i => i.id === rel.from)?.label || rel.from} 
                <span style={{ color: "#059669", fontWeight: "500" }}> {rel.relationship} </span>
                {promptData.instances.find(i => i.id === rel.to)?.label || rel.to}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        borderLeft: "1px solid #e2e8f0",
        padding: "16px",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Header with view mode toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#1e293b",
          }}
        >
          {promptData.title}
        </div>
        
        <div
          style={{
            display: "flex",
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setViewMode("text")}
            style={{
              padding: "6px 12px",
              border: "none",
              backgroundColor: viewMode === "text" ? "#3b82f6" : "transparent",
              color: viewMode === "text" ? "#ffffff" : "#64748b",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Text View"
          >
            <List size={14} />
            Text
          </button>
          <button
            onClick={() => setViewMode("graph")}
            style={{
              padding: "6px 12px",
              border: "none",
              backgroundColor: viewMode === "graph" ? "#3b82f6" : "transparent",
              color: viewMode === "graph" ? "#ffffff" : "#64748b",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Graph View"
          >
            <Grid size={14} />
            Graph
          </button>
          <button
            onClick={() => setViewMode("both")}
            style={{
              padding: "6px 12px",
              border: "none",
              backgroundColor: viewMode === "both" ? "#3b82f6" : "transparent",
              color: viewMode === "both" ? "#ffffff" : "#64748b",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Both Views"
          >
            <Eye size={14} />
            Both
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {viewMode === "text" && renderTextView()}
        {viewMode === "graph" && renderGraphView()}
        {viewMode === "both" && (
          <>
            {renderTextView()}
            {renderGraphView()}
          </>
        )}
      </div>
    </div>
  );
};

export default EvaluationInstanceBoard;