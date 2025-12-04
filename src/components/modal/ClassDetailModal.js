import SceneGraphVisualizer from "../SceneGraphVisualizer";
import { ToolbarButton } from "../nodeComponents/NodeToolbarMenu";
import { useClassContext } from "../../context/ClassContext";
import { suggestPlaceholderValues } from "../../api/generatePlaceholders";
import { logEvent } from "../../api/logEvent";
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
  initialEditMode = false,
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
  const [tempClassName, setTempClassName] = useState(classData?.name || "");

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
      setTempClassName(classData.name || "");
      // initialEditMode가 true이면 자동으로 편집 모드 활성화
      setIsEditing(initialEditMode);
    }
  }, [classData, initialEditMode]);

  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.(classData);

    logEvent("class.edit.started", {
      class_id: classData.id,
      class_name: classData.name,
      placeholder_count: Object.keys(classData.placeholders || {}).length,
      object_count: classData.template?.sceneGraph?.objects ? Object.keys(classData.template.sceneGraph.objects).length : 0
    });
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      // 저장하기 전에 빈 object들과 빈 relationship들 필터링
      const cleanedSceneGraph = {
        ...tempSceneData.sceneGraph,
        objects: (tempSceneData.sceneGraph.objects || []).filter(
          (obj) => obj.name && obj.name.trim() !== ""
        ),
        // 삭제된 object와 연결된 relationship들 + 빈 relation을 가진 relationship들 제거
        relationships: (tempSceneData.sceneGraph.relationships || []).filter(
          (rel) => {
            // relation이 비어있으면 제거
            if (!rel.relation || rel.relation.trim() === "") {
              return false;
            }
            // source나 target object가 빈 이름이면 제거
            const sourceExists = tempSceneData.sceneGraph.objects?.find(
              (obj) => obj.id === rel.source && obj.name && obj.name.trim() !== ""
            );
            const targetExists = tempSceneData.sceneGraph.objects?.find(
              (obj) => obj.id === rel.target && obj.name && obj.name.trim() !== ""
            );
            return sourceExists && targetExists;
          }
        ),
      };

      await updateClass(classData.id, {
        name: tempClassName,
        template: {
          ...classData.template,
          sceneGraph: cleanedSceneGraph,
        },
        placeholders: tempSceneData.placeholders,
      });

      logEvent("class.updated", {
        class_id: classData.id,
        class_name: classData.name,
        placeholder_count: Object.keys(tempSceneData.placeholders || {}).length,
        object_count: tempSceneData.sceneGraph?.objects ? Object.keys(tempSceneData.sceneGraph.objects).length : 0
      });

      setIsEditing(false);
      // Save 후 모달 닫기
      onClose();
    } catch (error) {
      console.error("Failed to update class:", error);

      logEvent("class.update.failed", {
        class_id: classData.id,
        class_name: classData.name,
        error_message: error.message
      });

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
    setTempClassName(classData?.name || "");
  };

  const handleSceneGraphChange = async (newSceneGraph, newPlaceHolders) => {
    const updatedPlaceholders = newPlaceHolders
      ? { ...tempSceneData.placeholders, ...newPlaceHolders }
      : tempSceneData.placeholders;

    setTempSceneData({
      sceneGraph: newSceneGraph,
      placeholders: updatedPlaceholders,
    });

    // 즉시 class 업데이트하여 관련된 instance들도 업데이트
    if (isEditing) {
      await updateClass(classData.id, {
        template: {
          ...classData.template,
          sceneGraph: newSceneGraph,
        },
        placeholders: updatedPlaceholders,
      });

      logEvent("class.auto_updated", {
        class_id: classData.id,
        class_name: classData.name,
      });
    }
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

  const handleDummyFunction = () => { };

  // 인스턴스 생성 로직 - + 버튼 클릭 시 즉시 "default" 값으로 생성
  const handleShowCreatePanel = async () => {
    logEvent("class.instance_creation.started", {
      class_id: classData.id,
      class_name: classData.name
    });

    // 즉시 default 값으로 instance 생성
    setIsCreatingInstance(true);
    try {
      // default 값으로 sceneGraph 생성 (placeholder 값 그대로 사용)
      const defaultSceneGraph = classData.template.sceneGraph;
      const newInstance = await createInstanceFromClass(classData, defaultSceneGraph);
      onCreateInstance?.(newInstance);

      logEvent("class.instance_created.default", {
        class_id: classData.id,
        instance_id: newInstance.id
      });
    } catch (error) {
      console.error("Failed to create instance:", error);
      alert("Failed to create instance. Please try again.");
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const initializeInstanceCreation = async () => {
    if (!classData?.placeholders) return;

    // 기본값 설정 - 간단한 구조 (값만 사용)
    const defaultValues = {};
    Object.entries(classData.placeholders).forEach(([objectId, objectData]) => {
      if (objectData.name) {
        defaultValues[`${objectId}_name`] = objectData.name;
      }
      if (objectData.attr) {
        objectData.attr.forEach((attr, index) => {
          defaultValues[`${objectId}_attr_${index}`] = attr;
        });
      }
    });
    setInstanceValues(defaultValues);
    setInstanceSuggestions({});
  };

  const handleCreateNewInstance = async () => {
    setIsCreatingInstance(true);
    try {
      const previewGraph = generatePreviewSceneGraph()
      const newInstance = await createInstanceFromClass(classData, previewGraph);
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
    logEvent("class.instance_creation.cancelled", {
      class_id: classData.id,
      class_name: classData.name
    });
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
              {isEditing ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Edit2 size={16} style={{ color: "#1d4ed8" }} />
                  <input
                    type="text"
                    value={tempClassName}
                    onChange={(e) => setTempClassName(e.target.value)}
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#1d4ed8",
                      border: "2px solid #3b82f6",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      outline: "none",
                      backgroundColor: "#eff6ff",
                    }}
                    placeholder="Class name"
                  />
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
                </div>
              ) : (
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1f2937",
                  }}
                >
                  {classData.name}
                </h3>
              )}
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
                onClick={() => {
                  if (isEditing) {
                    handleCancelEdit();
                  }
                  onClose();
                }}
                title={isEditing ? "Cancel & Close" : "Close"}
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

            {
              !showCreatePanel && (<div
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
              </div>)
            }


            {/* Instance Preview Section - 클래스 그래프 아래에 표시 */}
            {showCreatePanel && (
              <div style={{
                // marginTop: "16px",
                padding: "16px",
                backgroundColor: "#f8fafc",
                // border: "1px solid #e5e7eb",
                // borderRadius: "8px"
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
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  overflow: "hidden",
                  backgroundColor: "#ffffff",
                  height: "calc(90vh - 230px)",
                  // minHeight: "300px"
                }}>
                  {Object.keys(instanceValues).length > 0 && Object.values(instanceValues).some(v => v.trim()) ? (
                    <div style={{ height: "100%", overflow: "auto" }}>
                      <SceneGraphVisualizer
                        sceneGraph={generatePreviewSceneGraph()}
                        isEditable={false}
                        isClassMode={false}
                        compact={false}
                      />
                    </div>
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
                        Name
                      </label>
                      <input
                        type="text"
                        value={instanceValues[placeholderKey] || ""}
                        onChange={(e) => handleInstanceValueChange(placeholderKey, e.target.value)}
                        placeholder={objectData.name}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                          boxSizing: "border-box"
                        }}
                      />
                    </div>
                  );
                }

                // Add attribute fields
                if (objectData.attr) {
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
                          Attribute {index + 1}
                        </label>
                        <input
                          type="text"
                          value={instanceValues[placeholderKey] || ""}
                          onChange={(e) => handleInstanceValueChange(placeholderKey, e.target.value)}
                          placeholder={attr}
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            fontSize: "14px",
                            boxSizing: "border-box"
                          }}
                        />
                      </div>
                    );
                  });
                }

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