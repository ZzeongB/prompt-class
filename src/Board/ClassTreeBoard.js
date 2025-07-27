import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, RotateCcw, Check, X } from "lucide-react";
import { useClassContext } from "../context/ClassContext";
import { ToolbarButton } from "../components/nodeComponents/NodeToolbarMenu";
import { CreateInstanceModal } from "../components/modal/CreateInstanceModal";
import SceneGraphVisualizer from "../components/SceneGraphVisualizer";

const ClassCardToolbar = ({
  isVisible,
  onCreateInstance,
  onDelete,
  onEdit,
  onResetInstances,
  isEditing,
  onSaveEdit,
  onCancelEdit,
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        alignItems: "center",
        // position: "absolute",
        // top: "-30px",
        right: "0px",
        zIndex: 1000, // z-index 증가
        backgroundColor: "rgba(255, 255, 255, 0.9)", // 배경 추가
        padding: "4px",
        borderRadius: "6px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // 그림자 추가
      }}
    >
      {isEditing ? (
        <>
          <ToolbarButton
            onClick={onSaveEdit}
            title="Save Changes"
            icon={<Check size={12} />}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          />

          <ToolbarButton
            onClick={onCancelEdit}
            title="Cancel Edit"
            icon={<X size={12} />}
            style={{
              backgroundColor: "#6b7280",
              color: "white",
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          />
        </>
      ) : (
        <>
          <ToolbarButton
            onClick={onCreateInstance}
            title="Create Instance"
            icon={<Plus size={12} />}
            style={{
              backgroundColor: "#3b82f6",
              color: "white",
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          />

          <ToolbarButton
            onClick={onEdit}
            title="Edit Class"
            icon={<Edit size={12} />}
            style={{
              backgroundColor: "#10b981",
              color: "white",
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          />

          <ToolbarButton
            onClick={onResetInstances}
            title="Reset All Instances"
            icon={<RotateCcw size={12} />}
            style={{
              backgroundColor: "#f59e0b",
              color: "white",
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
          />

          <ToolbarButton
            onClick={onDelete}
            title="Delete Class"
            icon={<Trash2 size={12} />}
            style={{
              backgroundColor: "#ef4444",
              color: "white",
              width: "24px",
              height: "24px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
            }}
            danger
          />
        </>
      )}
    </div>
  );
};

const ClassCard = ({
  classData,
  onCreateInstance,
  onDelete,
  onEdit,
  onResetInstances,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateClass, instances } = useClassContext();

  // 편집용 임시 상태
  const [tempSceneData, setTempSceneData] = useState({
    sceneGraph: classData.template?.sceneGraph || {},
  });

  // 실제 표시용 데이터
  const sceneData = isEditing
    ? tempSceneData
    : {
        sceneGraph: classData.template?.sceneGraph || {},
      };

  // 이 클래스의 인스턴스 개수 계산
  const instanceCount = instances.filter(
    (instance) => instance.classId === classData.id
  ).length;

  // 연결된 인스턴스들의 override 상태 계산
  const connectedInstances = instances.filter(
    (inst) => inst.classId === classData.id
  );
  const instancesWithOverrides = connectedInstances.filter(
    (inst) => inst.overrides && Object.keys(inst.overrides).length > 0
  ).length;

  const handleEdit = () => {
    setIsEditing(true);
    setTempSceneData({
      sceneGraph: classData.template?.sceneGraph || {},
    });
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
      sceneGraph: classData.template?.sceneGraph || {},
    });
  };

  const handleSceneGraphChange = (newSceneGraph) => {
    setTempSceneData({
      sceneGraph: newSceneGraph,
    });
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

  return (
    <div
      style={{
        marginBottom: "8px",
        position: "relative",
        border: isEditing ? "2px solid #3b82f6" : "1px solid #e2e8f0",
        borderRadius: "8px",
        backgroundColor: isEditing ? "#f8fafc" : "white",
        boxShadow: isEditing ? "0 4px 12px rgba(59, 130, 246, 0.15)" : "none",
        transition: "all 0.2s ease",
        minHeight: "200px",
      }}
    >
      {/* 클래스 정보 헤더 */}
      <div
        style={{
          padding: "8px 12px",
          backgroundColor: isEditing ? "#eff6ff" : "#f1f5f9",
          borderRadius: "6px 6px 0 0",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: isEditing ? "#1d4ed8" : "#1e293b",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isEditing && <Edit size={12} />}
            {classData.name}
            {isEditing && (
              <span
                style={{
                  fontSize: "10px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "10px",
                }}
              >
                Editing
              </span>
            )}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
            {instanceCount} instance{instanceCount !== 1 ? "s" : ""}
            {instancesWithOverrides > 0 && (
              <span
                style={{
                  marginLeft: "8px",
                  color: "#f59e0b",
                  fontWeight: "500",
                }}
              >
                • {instancesWithOverrides} with overrides
              </span>
            )}
          </div>
        </div>

        {isUpdating && (
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              fontStyle: "italic",
            }}
          >
            Updating instances...
          </div>
        )}
      </div>

      {/* SceneGraphVisualizer - 가운데 배치 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "12px",
          minHeight: "120px",
        }}
      >
        <SceneGraphVisualizer
          sceneGraph={sceneData.sceneGraph}
          onSceneGraphChange={
            isEditing ? handleSceneGraphChange : handleDummyFunction
          }
          isEditable={isEditing}
          isClassMode={!isEditing}
          placeholders={classData.placeholders}
          originalData={classData.originalData}
        />
      </div>

      {/* Toolbar - 우하단 배치 */}
      <div style={{ position: "absolute", bottom: "8px", right: "8px" }}>
        <div
          style={{
            display: "flex",
            gap: "4px",
            alignItems: "center",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "4px",
            borderRadius: "6px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          {isEditing ? (
            <>
              <ToolbarButton
                onClick={handleSaveEdit}
                title="Save Changes"
                icon={<Check size={12} />}
                backgroundColor="rgba(16, 185, 129, 0.1)"
                hoverColor="rgba(16, 185, 129, 0.2)"
              />

              <ToolbarButton
                onClick={handleCancelEdit}
                title="Cancel Edit"
                icon={<X size={12} />}
                backgroundColor="rgba(107, 114, 128, 0.1)"
                hoverColor="rgba(107, 114, 128, 0.2)"
              />
            </>
          ) : (
            <>
              <ToolbarButton
                onClick={() => onCreateInstance(classData)}
                title="Create Instance"
                icon={<Plus size={12} />}
                backgroundColor="rgba(59, 130, 246, 0.1)"
                hoverColor="rgba(59, 130, 246, 0.2)"
              />

              <ToolbarButton
                onClick={handleEdit}
                title="Edit Class"
                icon={<Edit size={12} />}
                backgroundColor="rgba(16, 185, 129, 0.1)"
                hoverColor="rgba(16, 185, 129, 0.2)"
              />

              <ToolbarButton
                onClick={handleResetInstances}
                title="Reset All Instances"
                icon={<RotateCcw size={12} />}
                backgroundColor="rgba(245, 158, 11, 0.1)"
                hoverColor="rgba(245, 158, 11, 0.2)"
              />

              <ToolbarButton
                onClick={() => onDelete(classData.id)}
                title="Delete Class"
                icon={<Trash2 size={12} />}
                danger={true}
              />
            </>
          )}
        </div>
      </div>

      {/* 편집 모드 표시 */}
      {isEditing && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "12px",
            fontSize: "10px",
            color: "#3b82f6",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              backgroundColor: "#3b82f6",
              borderRadius: "50%",
              animation: "pulse 2s infinite",
            }}
          />
          Changes will apply to {instanceCount} instance
          {instanceCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export const ClassTreeBoard = ({ onAddInstance }) => {
  const { classes, deleteClass, instances, resetInstanceToClass } =
    useClassContext();
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateInstance = (classData) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleInstanceCreated = (newInstance) => {
    onAddInstance?.(newInstance);
    setIsModalOpen(false);
    setSelectedClass(null);
    console.log("handleinstancecreated", newInstance);
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
  };

  const handleEditClass = (classData) => {
    console.log("Editing class:", classData);
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
      <div
        style={{
          height: "100vh",
          backgroundColor: "#f8fafc",
          borderLeft: "1px solid #e2e8f0",
          padding: "16px",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#1e293b",
            marginBottom: "20px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            paddingBottom: "12px",
            borderBottom: "2px solid #e2e8f0",
          }}
        >
          Class Library
        </div>

        <div style={{ flex: 1 }}>
          {classes.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#64748b",
                fontSize: "12px",
                padding: "40px 20px",
                fontStyle: "italic",
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px dashed #cbd5e1",
              }}
            >
              No classes yet.
              <br />
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                Create a class from an instance using the toolbar!
              </span>
            </div>
          ) : (
            classes.map((classData) => (
              <ClassCard
                key={classData.id}
                classData={classData}
                onCreateInstance={handleCreateInstance}
                onDelete={handleDeleteClass}
                onEdit={handleEditClass}
                onResetInstances={handleResetAllInstances}
              />
            ))
          )}
        </div>

        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#6b7280",
              textAlign: "center",
              lineHeight: "1.4",
            }}
          >
            {classes.length} class{classes.length !== 1 ? "es" : ""} available
            <br />
            {totalInstances} connected instance{totalInstances !== 1 ? "s" : ""}
            {totalOverrides > 0 && (
              <>
                <br />
                <span style={{ color: "#f59e0b", fontWeight: "500" }}>
                  {totalOverrides} with custom overrides
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CreateInstanceModal에 필요한 props가 모두 전달되는지 확인 */}
      {isModalOpen && selectedClass && (
        <CreateInstanceModal
          classData={selectedClass}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onCreateInstance={handleInstanceCreated}
        />
      )}

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
    </>
  );
};
