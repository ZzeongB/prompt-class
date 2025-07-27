import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit, RotateCcw, Check, X } from "lucide-react";
import { useClassContext } from "../context/ClassContext";
import PanelTemplate from "../components/PanelTemplate";
import { ToolbarButton } from "../components/nodeComponents/NodeToolbarMenu";
import { CreateInstanceModal } from "../components/modal/CreateInstanceModal";

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
        position: "absolute",
        top: "8px",
        right: "8px",
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
  const [editingData, setEditingData] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  const { updateClass, instances } = useClassContext();

  // 편집용 임시 상태
  const [tempSceneData, setTempSceneData] = useState({
    instanceLabel: classData.template?.instanceLabel || classData.name,
    sceneGraph: classData.template?.sceneGraph || {},
    textDescription: classData.template?.textDescription || "",
  });

  // 실제 표시용 데이터
  const sceneData = isEditing
    ? tempSceneData
    : {
        instanceLabel: classData.template?.instanceLabel || classData.name,
        sceneGraph: classData.template?.sceneGraph || {},
        textDescription: classData.template?.textDescription || "",
      };

  // 이 클래스의 인스턴스 개수 계산
  const instanceCount = instances.filter(
    (instance) => instance.classId === classData.id
  ).length;

  // 클래스 데이터가 변경될 때 tempSceneData 업데이트
  useEffect(() => {
    if (!isEditing) {
      setTempSceneData({
        instanceLabel: classData.template?.instanceLabel || classData.name,
        sceneGraph: classData.template?.sceneGraph || {},
        textDescription: classData.template?.textDescription || "",
      });
    }
  }, [classData, isEditing]);

  // 인스턴스 변경 감지를 위한 실시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdateTime(Date.now());
    }, 1000); // 1초마다 업데이트 시간 갱신

    return () => clearInterval(interval);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditingData({ ...classData });
    setTempSceneData({
      instanceLabel: classData.template?.instanceLabel || classData.name,
      sceneGraph: classData.template?.sceneGraph || {},
      textDescription: classData.template?.textDescription || "",
    });
    onEdit?.(classData);
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      await updateClass(classData.id, {
        template: {
          ...classData.template,
          instanceLabel: tempSceneData.instanceLabel,
          textDescription: tempSceneData.textDescription,
          sceneGraph: tempSceneData.sceneGraph,
        },
        name: tempSceneData.instanceLabel + " Class",
      });
      setIsEditing(false);
      setEditingData(null);
    } catch (error) {
      console.error("Failed to update class:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingData(null);
    // 원본 데이터로 되돌리기
    setTempSceneData({
      instanceLabel: classData.template?.instanceLabel || classData.name,
      sceneGraph: classData.template?.sceneGraph || {},
      textDescription: classData.template?.textDescription || "",
    });
  };

  const handleInstanceLabelChange = (newLabel) => {
    setTempSceneData((prev) => ({
      ...prev,
      instanceLabel: newLabel,
    }));
  };

  const handleDescriptionChange = (newDescription) => {
    setTempSceneData((prev) => ({
      ...prev,
      textDescription: newDescription,
    }));
  };

  const handleSceneGraphChange = (newSceneGraph) => {
    setTempSceneData((prev) => ({
      ...prev,
      sceneGraph: newSceneGraph,
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

  // 편집 모드가 아닐 때는 빈 함수들을 사용
  const handleDummyFunction = () => {};
  const handleDummySetState = () => {};

  // 연결된 인스턴스들의 override 상태 계산
  const connectedInstances = instances.filter(
    (inst) => inst.classId === classData.id
  );
  const instancesWithOverrides = connectedInstances.filter(
    (inst) => inst.overrides && Object.keys(inst.overrides).length > 0
  ).length;

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

      <PanelTemplate
        id={classData.id}
        data={{
          label: classData.name,
          isFromClass: false,
          parentClassName: null,
          hasOverrides: false,
        }}
        isExpanded={true}
        setIsExpanded={handleDummySetState}
        sceneData={sceneData}
        isUpdating={isUpdating}
        onInstanceLabelChange={
          isEditing ? handleInstanceLabelChange : handleDummyFunction
        }
        onDescriptionChangeDebounced={
          isEditing ? handleDescriptionChange : handleDummyFunction
        }
        onSceneGraphChange={
          isEditing ? handleSceneGraphChange : handleDummyFunction
        }
        onDelete={() => onDelete(classData.id)}
        modal={null}
        setModal={handleDummySetState}
        isClassMode={true}
        isReadOnly={!isEditing}
        customToolbar={
          <ClassCardToolbar
            isVisible={true}
            onCreateInstance={() => onCreateInstance(classData)}
            onDelete={() => onDelete(classData.id)}
            onEdit={handleEdit}
            onResetInstances={() => handleResetInstances()}
            isEditing={isEditing}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
          />
        }
      />

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

      {/* 실시간 인스턴스 업데이트 표시 */}
      {connectedInstances.length > 0 && !isEditing && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "12px",
            fontSize: "9px",
            color: "#9ca3af",
            fontStyle: "italic",
          }}
        >
          Last sync: {new Date(lastUpdateTime).toLocaleTimeString()}
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
