import SceneGraphVisualizer from "../SceneGraphVisualizer";
import { ToolbarButton } from "../nodeComponents/NodeToolbarMenu";
import { useClassContext } from "../../context/ClassContext";
import { suggestPlaceholderValues } from "../../api/generatePlaceholders";
import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Library,
} from "lucide-react";

// Class Detail Modal Component
const ClassDetailModal = ({
  classData,
  instances,
  isOpen,
  onClose,
  onCreateInstance,
  onEdit,
  onDelete,
  onResetInstances,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const { updateClass, createInstanceFromClass } = useClassContext();

  // 편집용 임시 상태
  const [tempSceneData, setTempSceneData] = useState({
    sceneGraph: classData?.template?.sceneGraph || {},
    placeholders: classData?.placeholders || {},
  });

  // 인스턴스 생성 패널 상태
  const [instanceValues, setInstanceValues] = useState({});
  const [instanceSuggestions, setInstanceSuggestions] = useState({});
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);

  const instanceCount = instances.filter(
    (inst) => inst.classId === classData?.id
  ).length;
  const instancesWithOverrides = instances.filter(
    (inst) =>
      inst.classId === classData?.id &&
      inst.overrides &&
      Object.keys(inst.overrides).length > 0
  );

  useEffect(() => {
    if (classData) {
      setTempSceneData({
        sceneGraph: classData.template?.sceneGraph || {},
        placeholders: classData.placeholders || {},
      });
      setIsEditing(false);
    }
  }, [classData]);

  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.(classData);
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      await updateClass(classData.id, {
        template: {
          ...classData.template,
          sceneGraph: tempSceneData.sceneGraph,
        },
        placeholders: tempSceneData.placeholders,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update class:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setTempSceneData({
      sceneGraph: classData?.template?.sceneGraph || {},
      placeholders: classData?.placeholders || {},
    });
  };

  const handleSceneGraphChange = (newSceneGraph, newPlaceHolders) => {
    setTempSceneData((prev) => ({
      sceneGraph: newSceneGraph,
      placeholders: newPlaceHolders
        ? { ...prev.placeholders, ...newPlaceHolders }
        : prev.placeholders,
    }));
  };

  const handleResetInstances = () => {
    if (
      window.confirm(
        `Reset all ${instanceCount} instances of this class to match the class template?`
      )
    ) {
      onResetInstances?.(classData.id);
    }
  };

  const handleDummyFunction = () => {};

  // 인스턴스 생성 패널 로직
  const handleShowCreatePanel = () => {
    setShowCreatePanel(true);
    initializeInstanceCreation();
  };

  const initializeInstanceCreation = async () => {
    if (!classData?.placeholders) return;
    
    // 기본값 설정
    const defaultValues = {};
    Object.keys(classData.placeholders).forEach(key => {
      defaultValues[classData.placeholders[key]] = key;
    });
    setInstanceValues(defaultValues);

    // 제안값 가져오기
    try {
      const suggestions = await suggestPlaceholderValues(classData.placeholders);
      // 각 placeholder에 해당하는 suggestion을 매핑
      const mappedSuggestions = {};
      Object.keys(classData.placeholders).forEach(key => {
        const category = classData.placeholders[key];
        if (suggestions[category]) {
          mappedSuggestions[category] = suggestions[category];
        }
      });
      setInstanceSuggestions(mappedSuggestions);
    } catch (error) {
      console.error("Failed to get suggestions:", error);
    }
  };

  const handleCreateNewInstance = async () => {
    setIsCreatingInstance(true);
    try {
      const newInstance = await createInstanceFromClass(classData, instanceValues);
      onCreateInstance?.(newInstance);
      setShowCreatePanel(false);
      setInstanceValues({});
    } catch (error) {
      console.error("Failed to create instance:", error);
      alert("Failed to create instance. Please try again.");
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreatePanel(false);
    setInstanceValues({});
  };

  const handleInstanceValueChange = (placeholder, value) => {
    setInstanceValues(prev => ({
      ...prev,
      [placeholder]: value
    }));
  };

  if (!isOpen || !classData) return null;

  const sceneData = isEditing
    ? tempSceneData
    : {
        sceneGraph: classData.template?.sceneGraph || {},
        placeholders: classData.placeholders || {},
      };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          width: showCreatePanel ? "95%" : "90%",
          maxWidth: showCreatePanel ? "1200px" : "900px",
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          display: "flex",
          flexDirection: showCreatePanel ? "row" : "column",
          transition: "all 0.3s ease-in-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content */}
        <div style={{ 
          flex: showCreatePanel ? "1" : "none",
          display: "flex",
          flexDirection: "column",
          minWidth: showCreatePanel ? "60%" : "100%"
        }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: isEditing ? "#eff6ff" : "white",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
                color: isEditing ? "#1d4ed8" : "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isEditing && <Edit2 size={16} />}
              {classData.name}
              {isEditing && (
                <span
                  style={{
                    fontSize: "12px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "12px",
                  }}
                >
                  Editing
                </span>
              )}
            </h3>
            <div
              style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}
            >
              {instanceCount} instance{instanceCount !== 1 ? "s" : ""}
              {instancesWithOverrides.length > 0 && (
                <span
                  style={{
                    marginLeft: "12px",
                    color: "#f59e0b",
                    fontWeight: "500",
                  }}
                >
                  • {instancesWithOverrides.length} with overrides
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: "4px",
            overflowY: "auto",
            maxHeight: "calc(90vh - 160px)",
            position: "relative",
          }}
        >
          

          <div
            style={{
              width: "100%",
              height: "400px",
              overflow: "hidden",
            }}
          >
            <SceneGraphVisualizer
              sceneGraph={sceneData.sceneGraph}
              onSceneGraphChange={
                isEditing ? handleSceneGraphChange : handleDummyFunction
              }
              isEditable={isEditing}
              isClassMode={true}
              placeHolders={
                isEditing ? tempSceneData.placeholders : classData.placeholders
              }
            />
          </div>

          {isEditing && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#92400e",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#f59e0b",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
              <strong>Note:</strong> Changes will automatically apply to all{" "}
              {instanceCount} connected instance{instanceCount !== 1 ? "s" : ""}
              .
            </div>
          )}

          {isUpdating && (
            <div
              style={{
                marginTop: "16px",
                textAlign: "center",
                fontSize: "14px",
                color: "#6b7280",
                fontStyle: "italic",
              }}
            >
              Updating instances...
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            backgroundColor: "#f9fafb",
          }}
        >
          {isEditing ? (
            <>
              <button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isUpdating ? 0.7 : 1,
                }}
              >
                <Check size={16} />
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isUpdating}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isUpdating ? 0.7 : 1,
                }}
              >
                <X size={16} />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleShowCreatePanel}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={16} />
                Create Instance
              </button>
              <button
                onClick={handleEdit}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Edit2 size={16} />
                Edit Template
              </button>
              <button
                onClick={handleResetInstances}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RotateCcw size={16} />
                Reset All
              </button>
              <button
                onClick={() => onDelete(classData.id)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Trash2 size={16} />
                Delete Class
              </button>
            </>
          )}
        </div>
        </div>

        {/* Instance Creation Side Panel */}
        {showCreatePanel && (
          <div style={{
            width: "30%",
            borderLeft: "1px solid #e5e7eb",
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            overflow: "hidden"
          }}>
            {/* Side Panel Header */}
            <div style={{
              padding: "20px",
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#ffffff"
            }}>
              <h4 style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "600",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <Plus size={16} />
                Create Instance
              </h4>
              <p style={{
                margin: "4px 0 0 0",
                fontSize: "14px",
                color: "#64748b"
              }}>
                Fill in the placeholder values
              </p>
            </div>

            {/* Side Panel Content */}
            <div style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto"
            }}>
              {Object.keys(classData.placeholders || {}).map(key => {
                const placeholder = classData.placeholders[key];
                return (
                  <div key={placeholder} style={{ marginBottom: "16px" }}>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#374151",
                      marginBottom: "4px"
                    }}>
                      {placeholder}
                    </label>
                    <input
                      type="text"
                      value={instanceValues[placeholder] || ""}
                      onChange={(e) => handleInstanceValueChange(placeholder, e.target.value)}
                      placeholder={Array.isArray(instanceSuggestions[placeholder]) && instanceSuggestions[placeholder].length > 0 ? instanceSuggestions[placeholder][0] : key}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        boxSizing: "border-box"
                      }}
                    />
                    {instanceSuggestions[placeholder] && Array.isArray(instanceSuggestions[placeholder]) && (
                      <div style={{ marginTop: "4px" }}>
                        <div style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap"
                        }}>
                          {instanceSuggestions[placeholder].slice(0, 3).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleInstanceValueChange(placeholder, suggestion)}
                              style={{
                                padding: "3px 6px",
                                fontSize: "10px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "3px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                textAlign: "center",
                                flex: "1",
                                color: "#64748b",
                                fontWeight: "400"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#f1f5f9";
                                e.target.style.borderColor = "#cbd5e1";
                                e.target.style.color = "#475569";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#f8fafc";
                                e.target.style.borderColor = "#e2e8f0";
                                e.target.style.color = "#64748b";
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Side Panel Footer */}
            <div style={{
              padding: "20px",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={handleCancelCreate}
                disabled={isCreatingInstance}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: isCreatingInstance ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: isCreatingInstance ? 0.7 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewInstance}
                disabled={isCreatingInstance}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: isCreatingInstance ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isCreatingInstance ? 0.7 : 1
                }}
              >
                <Plus size={16} />
                {isCreatingInstance ? "Creating..." : "Create Instance"}
              </button>
            </div>
          </div>
        )}

      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default ClassDetailModal;