import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useClassContext } from '../context/ClassContext';
import PanelTemplate from '../components/PanelTemplate';
import HoverButton from '../components/nodeComponents/HoverButton';
import { CreateInstanceModal } from '../components/modal/CreateInstanceModal';

const ClassNodeToolbar = ({ isVisible, onCreateInstance, onDelete, style = {} }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "-30px",
        right: "4px",
        display: "flex",
        gap: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        padding: "4px",
        borderRadius: "6px",
        border: "1px solid #ddd",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? "visible" : "hidden",
        transition: "all 0.2s ease",
        zIndex: 200,
        ...style,
      }}
    >
      <HoverButton
        title="Create Instance"
        icon={<Plus size={12} />}
        onClick={onCreateInstance}
      />
      <HoverButton
        title="Delete Class"
        icon={<Trash2 size={12} />}
        danger
        onClick={onDelete}
      />
    </div>
  );
};

const ClassCard = ({ classData, onCreateInstance, onDelete }) => {
  const sceneData = {
    instanceLabel: classData.name,
    sceneGraph: classData.template?.sceneGraph || {},
    textDescription: classData.template?.textDescription || "",
  };

  // 빈 함수들을 제대로 정의
  const handleDummyFunction = () => {};
  const handleDummySetState = () => {};

  // console.log("sceneData", sceneData)

  return (
    <div style={{ marginBottom: '8px' }}>
      <PanelTemplate
        id={classData.id}
        data={{ label: classData.name }}
        isExpanded={true}
        setIsExpanded={handleDummySetState}
        sceneData={sceneData}
        isUpdating={false}
        onInstanceLabelChange={handleDummyFunction}
        onDescriptionChangeDebounced={handleDummyFunction}
        onSceneGraphChange={handleDummyFunction}
        onDelete={() => onDelete(classData.id)}
        modal={null}
        setModal={handleDummySetState}
        isClassMode={true}
        customToolbar={
          <ClassNodeToolbar
            isVisible={true}
            onCreateInstance={() => onCreateInstance(classData)}
            onDelete={() => onDelete(classData.id)}
          />
        }
      />
    </div>
  );
};

export const ClassTreeBoard = ({ onAddInstance }) => {
  const { classes, deleteClass } = useClassContext();
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
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleDeleteClass = (classId) => {
    deleteClass(classId);
  };

  return (
    <>
      <div style={{
        height: '100vh',
        backgroundColor: '#f8fafc',
        borderLeft: '1px solid #e2e8f0',
        padding: '16px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          paddingBottom: '12px',
          borderBottom: '2px solid #e2e8f0',
        }}>
          Class Library
        </div>

        <div style={{ flex: 1 }}>
          {classes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12px',
              padding: '40px 20px',
              fontStyle: 'italic',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
            }}>
              No classes yet.<br />
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Create a class from an instance using the toolbar!
              </span>
            </div>
          ) : (
            classes.map(classData => (
              <ClassCard
                key={classData.id}
                classData={classData}
                onCreateInstance={handleCreateInstance}
                onDelete={handleDeleteClass}
              />
            ))
          )}
        </div>

        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#ffffff',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#6b7280',
            textAlign: 'center',
            lineHeight: '1.4',
          }}>
            {classes.length} class{classes.length !== 1 ? 'es' : ''} available
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
    </>
  );
};