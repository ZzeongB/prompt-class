import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  X,
  ChevronUp,
  Library,
} from "lucide-react";
import { useClassContext } from "../context/ClassContext";
import ClassDetailModal from "../components/modal/ClassDetailModal";

// Compact Floating Class Library
export const ClassTreeBoard = ({ onAddInstance, onExpandChange }) => {
  const { classes, deleteClass, instances, resetInstanceToClass } =
    useClassContext();
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // expansion 상태 변경 시 부모에게 알림
  const handleToggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  };

  const handleCreateInstance = (newInstance) => {
    onAddInstance?.(newInstance);
  };

  const handleClassClick = (classData) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleDeleteClass = (classId) => {
    const instanceCount = instances.filter(
      (instance) => instance.classId === classId
    ).length;
    const className =
      classes.find((cls) => cls.id === classId)?.name || "Unknown";

    if (instanceCount > 0) {
      const confirm = window.confirm(
        `Delete "${className}" class? This will disconnect ${instanceCount} instance${
          instanceCount !== 1 ? "s" : ""
        } but won't delete them.`
      );
      if (!confirm) return;
    }

    deleteClass(classId);
    handleCloseModal();
  };

  const handleEditClass = (classData) => {
    // console.log("Editing class:", classData);
  };

  const handleResetAllInstances = (classId) => {
    const classInstances = instances.filter(
      (instance) => instance.classId === classId
    );
    classInstances.forEach((instance) => {
      resetInstanceToClass(instance.id);
    });
  };

  // 전체 통계 계산
  const totalInstances = instances.filter((i) => i.isFromClass).length;
  const totalOverrides = instances.filter(
    (i) => i.isFromClass && i.overrides && Object.keys(i.overrides).length > 0
  ).length;

  return (
    <>
      {/* Compact Floating Class Library */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: isExpanded ? "0px" : "0px",
          zIndex: 100,
          backgroundColor: "white",
          borderTopLeftRadius: "12px",
          borderBottomLeftRadius: "12px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "1px solid #e5e7eb",
          minWidth: isExpanded ? "300px" : "50px",
          maxWidth: isExpanded ? "350px" : "50px",
          height: "fit-content",
          transition: "all 0.3s ease-in-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isExpanded ? "16px" : "12px",
            borderBottom: isExpanded ? "1px solid #e5e7eb" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: isExpanded ? "space-between" : "center",
          }}
          onClick={handleToggleExpanded}
        >
          {isExpanded ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Library size={18} style={{ color: "#3b82f6" }} />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#1e293b",
                  }}
                >
                  Class Library
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    backgroundColor: "#f1f5f9",
                    padding: "2px 8px",
                    borderRadius: "10px",
                  }}
                >
                  {classes.length}
                </span>
                <ChevronUp size={16} />
              </div>
            </>
          ) : (
            <div style={{ position: "relative" }}>
              <Library size={20} style={{ color: "#3b82f6" }} />
              {classes.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-8px",
                    fontSize: "10px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                  }}
                >
                  {classes.length}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div
            style={{
              maxHeight: "500px",
              overflowY: "auto",
            }}
          >
            {classes.length === 0 ? (
              <div
                style={{
                  padding: "32px 24px",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: "16px",
                  }}
                >
                  No classes yet
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    lineHeight: "1.4",
                  }}
                >
                  Create a class from an instance using the toolbar!
                </div>
              </div>
            ) : (
              <>
                {classes.map((classData) => {
                  const instanceCount = instances.filter(
                    (inst) => inst.classId === classData.id
                  ).length;
                  const overrideCount = instances.filter(
                    (inst) =>
                      inst.classId === classData.id &&
                      inst.overrides &&
                      Object.keys(inst.overrides).length > 0
                  ).length;

                  return (
                    <div
                      key={classData.id}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f8fafc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                      onClick={() => handleClassClick(classData)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#1e293b",
                          }}
                        >
                          {classData.name}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClassClick(classData);
                          }}
                          style={{
                            background: "none",
                            border: "1px solid #3b82f6",
                            borderRadius: "4px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            color: "#3b82f6",
                            fontSize: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#3b82f6";
                            e.target.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#3b82f6";
                          }}
                        >
                          <Plus size={12} />
                          Open
                        </button>
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          lineHeight: "1.3",
                        }}
                      >
                        {instanceCount} instance{instanceCount !== 1 ? "s" : ""}
                        {overrideCount > 0 && (
                          <span style={{ color: "#f59e0b", marginLeft: "8px" }}>
                            • {overrideCount} custom
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Summary Footer */}
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f8fafc",
                    fontSize: "12px",
                    color: "#64748b",
                    textAlign: "center",
                    lineHeight: "1.4",
                    borderTop: "1px solid #f1f5f9",
                    borderBottomLeftRadius: "8px"
                  }}
                >
                  {totalInstances} total instance
                  {totalInstances !== 1 ? "s" : ""}
                  {totalOverrides > 0 && (
                    <>
                      <br />
                      <span style={{ color: "#f59e0b", fontWeight: "500" }}>
                        {totalOverrides} with overrides
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Class Detail Modal */}
      <ClassDetailModal
        classData={selectedClass}
        instances={instances}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreateInstance={handleCreateInstance}
        onEdit={handleEditClass}
        onDelete={handleDeleteClass}
        onResetInstances={handleResetAllInstances}
      />

    </>
  );
};
