// 4. InstanceDetailPanel.js - 개별 인스턴스 상세 패널
import React, { useState, useEffect } from "react";
import { 
  generateTextToGraph, 
  generateSceneGraphToText 
} from "../../api/generateTextToGraph";
import { Edit2, Save, X, Link, Trash2, Copy } from "lucide-react";
import CustomButton from "../CustomButton";
import { useClassContext } from "../../context/ClassContext";
import SceneGraphVisualizer
 from "../SceneGraphVisualizer";

export default function InstanceDetailPanel({ instanceId }) {
  const { instances, updateInstance, deleteInstance, classes } = useClassContext();
  const [instance, setInstance] = useState(null);
  const [isEditing, setIsEditing] = useState({
    label: false,
    description: false,
    graph: false,
  });
  const [tempValues, setTempValues] = useState({
    label: "",
    description: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const foundInstance = instances.find(inst => inst.id === instanceId);
    setInstance(foundInstance);
    if (foundInstance) {
      setTempValues({
        label: foundInstance.instanceLabel,
        description: foundInstance.textDescription,
      });
    }
  }, [instanceId, instances]);

  if (!instance) {
    return (
      <div style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6b7280",
        fontSize: "14px",
      }}>
        Instance not found
      </div>
    );
  }

  const parentClass = instance.isFromClass
    ? classes.find((cls) => cls.id === instance.classId)
    : null;

  const handleLabelEdit = () => {
    setIsEditing(prev => ({ ...prev, label: true }));
  };

  const handleLabelSave = async () => {
    if (tempValues.label !== instance.instanceLabel) {
      setIsUpdating(true);
      try {
        await updateInstance(instanceId, { instanceLabel: tempValues.label });
      } catch (error) {
        console.error("Failed to update label:", error);
      } finally {
        setIsUpdating(false);
      }
    }
    setIsEditing(prev => ({ ...prev, label: false }));
  };

  const handleLabelCancel = () => {
    setTempValues(prev => ({ ...prev, label: instance.instanceLabel }));
    setIsEditing(prev => ({ ...prev, label: false }));
  };

  const handleDescriptionEdit = () => {
    setIsEditing(prev => ({ ...prev, description: true }));
  };

  const handleDescriptionSave = async () => {
    if (tempValues.description !== instance.textDescription) {
      setIsUpdating(true);
      try {
        const sceneGraph = await generateTextToGraph({
          newTextDescription: tempValues.description,
          previousSceneGraph: instance.sceneGraph,
          previousTextDescription: instance.textDescription,
        });
        
        const newLabel = sceneGraph.objects?.[0]?.name || instance.instanceLabel;
        
        await updateInstance(instanceId, {
          textDescription: tempValues.description,
          sceneGraph,
          instanceLabel: newLabel,
        });

        setTempValues(prev => ({ ...prev, label: newLabel }));
      } catch (error) {
        console.error("Failed to update description:", error);
        alert("Failed to update description. Please try again.");
      } finally {
        setIsUpdating(false);
      }
    }
    setIsEditing(prev => ({ ...prev, description: false }));
  };

  const handleDescriptionCancel = () => {
    setTempValues(prev => ({ ...prev, description: instance.textDescription }));
    setIsEditing(prev => ({ ...prev, description: false }));
  };

  const handleSceneGraphChange = async (updatedSceneGraph) => {
    setIsUpdating(true);
    try {
      const newText = await generateSceneGraphToText({
        newSceneGraph: updatedSceneGraph,
        previousSceneGraph: instance.sceneGraph,
        previousTextDescription: instance.textDescription,
      });
      
      const newLabel = updatedSceneGraph.objects?.[0]?.name || instance.instanceLabel;
      
      await updateInstance(instanceId, {
        sceneGraph: updatedSceneGraph,
        textDescription: newText,
        instanceLabel: newLabel,
      });

      setTempValues(prev => ({ 
        ...prev, 
        label: newLabel,
        description: newText 
      }));
    } catch (error) {
      console.error("Failed to update scene graph:", error);
      alert("Failed to update scene graph. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${instance.instanceLabel}"?`)) {
      deleteInstance(instanceId);
    }
  };

  const handleDuplicate = () => {
    // 복제 로직 구현
    console.log("Duplicate instance:", instanceId);
  };

  return (
    <div style={{ 
      height: "100%", 
      padding: "20px",
      overflowY: "auto"
    }}>
      {/* 헤더 */}
      <div style={{ 
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: "1px solid #e5e7eb"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "12px"
        }}>
          <h2 style={{ 
            fontSize: "20px", 
            fontWeight: "600", 
            color: "#1f2937",
            margin: 0,
          }}>
            Instance Details
          </h2>
          
          <div style={{ display: "flex", gap: "8px" }}>
            <CustomButton size="sm" color="grey" onClick={handleDuplicate}>
              <Copy size={14} />
              Duplicate
            </CustomButton>
            <CustomButton size="sm" color="red" onClick={handleDelete}>
              <Trash2 size={14} />
              Delete
            </CustomButton>
          </div>
        </div>

        {/* 클래스 정보 */}
        {instance.isFromClass && parentClass && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            backgroundColor: "#dbeafe",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#1e40af",
          }}>
            <Link size={14} />
            <span>Instance of class: <strong>{parentClass.name}</strong></span>
            {instance.overrides && Object.keys(instance.overrides).length > 0 && (
              <span style={{ 
                backgroundColor: "#f59e0b", 
                color: "#ffffff",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "10px",
              }}>
                {Object.keys(instance.overrides).length} overrides
              </span>
            )}
          </div>
        )}
      </div>

      {/* 인스턴스 라벨 */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "8px"
        }}>
          <label style={{ 
            fontSize: "14px", 
            fontWeight: "500", 
            color: "#374151" 
          }}>
            Instance Label
          </label>
          {!isEditing.label && (
            <button
              onClick={handleLabelEdit}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                padding: "4px",
              }}
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
        
        {isEditing.label ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              value={tempValues.label}
              onChange={(e) => setTempValues(prev => ({ ...prev, label: e.target.value }))}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #3b82f6",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
              }}
              autoFocus
            />
            <button onClick={handleLabelSave} style={{ 
              padding: "8px", 
              background: "#10b981", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              <Save size={14} />
            </button>
            <button onClick={handleLabelCancel} style={{ 
              padding: "8px", 
              background: "#ef4444", 
              color: "white", 
              border: "none", 
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <div style={{
            padding: "8px 12px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#1f2937",
          }}>
            {instance.instanceLabel}
          </div>
        )}
      </div>

      {/* 텍스트 설명 */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "8px"
        }}>
          <label style={{ 
            fontSize: "14px", 
            fontWeight: "500", 
            color: "#374151" 
          }}>
            Description
          </label>
          {!isEditing.description && (
            <button
              onClick={handleDescriptionEdit}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6b7280",
                padding: "4px",
              }}
            >
              <Edit2 size={14} />
            </button>
          )}
        </div>
        
        {isEditing.description ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <textarea
              value={tempValues.description}
              onChange={(e) => setTempValues(prev => ({ ...prev, description: e.target.value }))}
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "8px 12px",
                border: "1px solid #3b82f6",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                resize: "vertical",
                fontFamily: "inherit",
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <CustomButton size="sm" color="green" onClick={handleDescriptionSave}>
                <Save size={14} />
                Save Changes
              </CustomButton>
              <CustomButton size="sm" color="grey" onClick={handleDescriptionCancel}>
                <X size={14} />
                Cancel
              </CustomButton>
            </div>
          </div>
        ) : (
          <div style={{
            padding: "12px",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "14px",
            lineHeight: "1.5",
            color: "#1f2937",
            minHeight: "60px",
            whiteSpace: "pre-wrap",
          }}>
            {instance.textDescription || "No description provided"}
          </div>
        )}
      </div>

      {/* 씬 그래프 */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          marginBottom: "12px"
        }}>
          <label style={{ 
            fontSize: "14px", 
            fontWeight: "500", 
            color: "#374151" 
          }}>
            Scene Graph
          </label>
          <CustomButton 
            size="sm" 
            color={isEditing.graph ? "green" : "grey"}
            onClick={() => setIsEditing(prev => ({ ...prev, graph: !prev.graph }))}
          >
            {isEditing.graph ? "Done Editing" : "Edit Graph"}
          </CustomButton>
        </div>
        
        <div style={{
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
          padding: "12px",
          backgroundColor: "#ffffff",
          minHeight: "200px",
        }}>
          <SceneGraphVisualizer
            sceneGraph={instance.sceneGraph}
            onSceneGraphChange={handleSceneGraphChange}
            instanceId={instanceId}
            isEditable={isEditing.graph}
            showDetailedView={true}
          />
        </div>
      </div>

      {/* 메타데이터 */}
      <div style={{ 
        padding: "16px",
        backgroundColor: "#f9fafb",
        borderRadius: "6px",
        border: "1px solid #e5e7eb",
      }}>
        <h4 style={{ 
          fontSize: "12px", 
          fontWeight: "600", 
          color: "#6b7280",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}>
          Metadata
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <div>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>Created:</span>
            <div style={{ fontSize: "12px", color: "#1f2937" }}>
              {new Date(instance.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>Objects:</span>
            <div style={{ fontSize: "12px", color: "#1f2937" }}>
              {instance.sceneGraph?.objects?.length || 0}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>Relationships:</span>
            <div style={{ fontSize: "12px", color: "#1f2937" }}>
              {instance.sceneGraph?.relationships?.length || 0}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>ID:</span>
            <div style={{ fontSize: "10px", color: "#6b7280", fontFamily: "monospace" }}>
              {instance.id}
            </div>
          </div>
        </div>
      </div>

      {/* 업데이트 상태 표시 */}
      {isUpdating && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#3b82f6",
          color: "white",
          padding: "12px 20px",
          borderRadius: "6px",
          fontSize: "14px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
        }}>
          Updating instance...
        </div>
      )}
    </div>
  );
}
