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

  console.log("classDa", classData)

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
    
    // 기본값 설정 - 간단한 구조
    const defaultValues = {};
    Object.entries(classData.placeholders).forEach(([objectId, objectData]) => {
      if (objectData.name) {
        defaultValues[`${objectId}_name`] = objectData.name.defaultvalue;
      }
      objectData.attr.forEach((attr, index) => {
        defaultValues[`${objectId}_attr_${index}`] = attr.defaultvalue;
      });
    });
    setInstanceValues(defaultValues);

    // 제안값 가져오기
    try {
      // 카테고리별로 매핑된 placeholders 객체 생성
      const categoryMap = {};
      Object.entries(classData.placeholders).forEach(([objectId, objectData]) => {
        if (objectData.name) {
          categoryMap[`${objectId}_name`] = objectData.name.name;
        }
        objectData.attr.forEach((attr, index) => {
          categoryMap[`${objectId}_attr_${index}`] = attr.name;
        });
      });
      
      const suggestions = await suggestPlaceholderValues(categoryMap);
      // 각 placeholder에 해당하는 suggestion을 매핑
      const mappedSuggestions = {};
      Object.entries(categoryMap).forEach(([placeholderKey, category]) => {
        if (suggestions[category]) {
          mappedSuggestions[placeholderKey] = suggestions[category];
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
      console.log("Creating instance with values:", instanceValues);
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

  // Generate preview scene graph with filled placeholder values
  const generatePreviewSceneGraph = () => {
    if (!classData?.template?.sceneGraph || !classData?.placeholders) {
      return null;
    }

    const templateGraph = classData.template.sceneGraph;
    const placeholders = classData.placeholders;
    
    // Create a deep copy of the scene graph
    const previewGraph = JSON.parse(JSON.stringify(templateGraph));
    
    // Replace placeholders in objects
    if (previewGraph.objects) {
      previewGraph.objects = previewGraph.objects.map(obj => {
        const newObj = { ...obj };
        
        // Replace placeholder in object name
        if (newObj.name) {
          const objectId = newObj.id;
          const nameKey = `${objectId}_name`;
          if (instanceValues[nameKey]) {
            newObj.name = instanceValues[nameKey];
          }
        }
        
        // Replace placeholders in attributes
        if (newObj.attributes) {
          newObj.attributes = newObj.attributes.map((attr, index) => {
            if (typeof attr === 'string') {
              const objectId = newObj.id;
              const attrKey = `${objectId}_attr_${index}`;
              if (instanceValues[attrKey]) {
                return instanceValues[attrKey];
              }
            }
            return attr;
          });
        }
        
        return newObj;
      });
    }
    
    return previewGraph;
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
            position: "relative",
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

          {/* Toolbar - InstanceCard와 동일한 스타일 */}
          <div style={{ 
            position: "absolute", 
            top: "8px", 
            right: "8px",
            display: "flex",
            gap: "4px",
            alignItems: "center",
            zIndex: 1000,
            padding: "4px",
            borderRadius: "6px",
          }}>
            {isEditing ? (
              <>
                <ToolbarButton
                  onClick={handleSaveEdit}
                  title={isUpdating ? "Saving..." : "Save Changes"}
                  icon={<Check size={16} />}
                  disabled={isUpdating}
                  tooltipPosition="bottom"
                />
                <ToolbarButton
                  onClick={handleCancelEdit}
                  title="Cancel"
                  icon={<X size={16} />}
                  disabled={isUpdating}
                  tooltipPosition="bottom"
                />
              </>
            ) : (
              <>
                <ToolbarButton
                  onClick={handleShowCreatePanel}
                  title="Create Instance"
                  icon={<Plus size={16} />}
                  tooltipPosition="bottom"
                />
                <ToolbarButton
                  onClick={handleEdit}
                  title="Edit Template"
                  icon={<Edit2 size={16} />}
                  tooltipPosition="bottom"
                />
                <ToolbarButton
                  onClick={handleResetInstances}
                  title="Reset All Instances"
                  icon={<RotateCcw size={16} />}
                  tooltipPosition="bottom"
                />
                <ToolbarButton
                  onClick={() => onDelete(classData.id)}
                  title="Delete Class"
                  icon={<Trash2 size={16} />}
                  danger={true}
                  tooltipPosition="bottom"
                />
              </>
            )}
            
            <ToolbarButton
              onClick={onClose}
              title="Close"
              icon={<X size={16} />}
              tooltipPosition="bottom"
            />
          </div>
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
              height: showCreatePanel ? "300px" : "400px",
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

          {/* Instance Preview Section - 클래스 그래프 아래에 표시 */}
          {showCreatePanel && (
            <div style={{
              marginTop: "16px",
              padding: "16px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: "8px"
            }}>
              <h5 style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#10b981",
                  borderRadius: "50%"
                }}></span>
                Instance Preview
                <span style={{
                  fontSize: "12px",
                  color: "#64748b",
                  fontWeight: "400",
                  fontStyle: "italic"
                }}>
                  • Live preview of your instance
                </span>
              </h5>
              <div style={{
                height: "250px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                overflow: "hidden",
                backgroundColor: "#ffffff"
              }}>
                {Object.keys(instanceValues).length > 0 && Object.values(instanceValues).some(v => v.trim()) ? (
                  <SceneGraphVisualizer
                    sceneGraph={generatePreviewSceneGraph()}
                    isEditable={false}
                    isClassMode={false}
                    compact={false}
                  />
                ) : (
                  <div style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                    fontSize: "14px",
                    gap: "12px"
                  }}>
                    <div style={{
                      width: "60px",
                      height: "60px",
                      border: "2px dashed #d1d5db",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af"
                    }}>
                      <span style={{ fontSize: "24px" }}>👁️</span>
                    </div>
                    <div style={{ textAlign: "center", lineHeight: "1.4" }}>
                      <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                        Preview will appear here
                      </div>
                      <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                        Fill in placeholder values to see your instance
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

        {/* Footer - 빈 공간으로 남겨둠 */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#f9fafb",
            minHeight: "20px",
          }}
        >
          {/* 버튼들은 이제 헤더에 있음 */}
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
                {/* <Plus size={16} /> */}
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
              {/* Placeholder Input Fields */}
              {Object.entries(classData.placeholders || {}).flatMap(([objectId, objectData]) => {
                const fields = [];
                
                if (objectData.name) {
                  const placeholderKey = `${objectId}_name`;
                  fields.push(
                    <div key={placeholderKey} style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "4px"
                      }}>
                        {objectData.name.name} ({objectData.name.defaultvalue})
                      </label>
                      <input
                        type="text"
                        value={instanceValues[placeholderKey] || ""}
                        onChange={(e) => handleInstanceValueChange(placeholderKey, e.target.value)}
                        placeholder={Array.isArray(instanceSuggestions[placeholderKey]) && instanceSuggestions[placeholderKey].length > 0 ? instanceSuggestions[placeholderKey][0] : objectData.name.defaultvalue}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                          boxSizing: "border-box"
                        }}
                      />
                      {instanceSuggestions[placeholderKey] && Array.isArray(instanceSuggestions[placeholderKey]) && (
                      <div style={{ marginTop: "4px" }}>
                        <div style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap"
                        }}>
                          {instanceSuggestions[placeholderKey].slice(0, 3).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleInstanceValueChange(placeholderKey, suggestion)}
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
                }
                
                // Add attribute fields
                objectData.attr.forEach((attr, index) => {
                  const placeholderKey = `${objectId}_attr_${index}`;
                  fields.push(
                    <div key={placeholderKey} style={{ marginBottom: "16px" }}>
                      <label style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "4px"
                      }}>
                        {attr.name} ({attr.defaultvalue})
                      </label>
                      <input
                        type="text"
                        value={instanceValues[placeholderKey] || ""}
                        onChange={(e) => handleInstanceValueChange(placeholderKey, e.target.value)}
                        placeholder={Array.isArray(instanceSuggestions[placeholderKey]) && instanceSuggestions[placeholderKey].length > 0 ? instanceSuggestions[placeholderKey][0] : attr.defaultvalue}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                          boxSizing: "border-box"
                        }}
                      />
                      {instanceSuggestions[placeholderKey] && Array.isArray(instanceSuggestions[placeholderKey]) && (
                        <div style={{ marginTop: "4px" }}>
                          <div style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap"
                          }}>
                            {instanceSuggestions[placeholderKey].slice(0, 3).map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleInstanceValueChange(placeholderKey, suggestion)}
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
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
                
                return fields;
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
                  padding: "12px 24px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  cursor: isCreatingInstance ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: isCreatingInstance ? 0.7 : 1,
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  if (!isCreatingInstance) {
                    e.target.style.backgroundColor = "#e5e7eb";
                    e.target.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCreatingInstance) {
                    e.target.style.backgroundColor = "#f3f4f6";
                    e.target.style.borderColor = "#d1d5db";
                  }
                }}
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleCreateNewInstance}
                disabled={isCreatingInstance}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isCreatingInstance ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  opacity: isCreatingInstance ? 0.7 : 1,
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                }}
                onMouseEnter={(e) => {
                  if (!isCreatingInstance) {
                    e.target.style.backgroundColor = "#059669";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCreatingInstance) {
                    e.target.style.backgroundColor = "#10b981";
                  }
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