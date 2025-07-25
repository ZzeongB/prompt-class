import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useClassContext } from '../context/ClassContext';
import PanelTemplate from '../components/PanelTemplate';
import HoverButton from '../components/nodeComponents/HoverButton';
import { CreateInstanceModal } from '../components/modal/CreateInstanceModal';

// 클래스용 NodeToolbar
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
  // PanelTemplate에서 사용할 sceneData 형태로 변환
  const sceneData = {
    instanceLabel: classData.name,
    tree: classData.template?.tree || {
      id: "root",
      data: { label: "Empty", type: "object" },
      children: [],
    },
    sceneGraph: classData.template?.sceneGraph || {},
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      <PanelTemplate
        id={classData.id}
        data={{ label: classData.name }}
        isExpanded={true}
        setIsExpanded={() => {}} // 클래스는 확장/축소 제어 안 함
        sceneData={sceneData}
        setSceneData={() => {}} // 클래스는 편집 안 함
        isUpdating={false}
        onInstanceLabelChange={() => {}} // 클래스는 라벨 편집 안 함
        onDescriptionChangeDebounced={() => {}} // 클래스는 설명 편집 안 함
        onLabelChange={() => {}} // 트리 노드 편집 안 함
        onDelete={() => onDelete(classData.id)}
        modal={null}
        setModal={() => {}}
        showToolbar={true}
        // 클래스 전용 스타일링
        isClassMode={true}
        // 클래스 전용 툴바 추가
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
  
  // 모달 상태 관리
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateInstance = (classData) => {
    setSelectedClass(classData);
    setIsModalOpen(true);
  };

  const handleInstanceCreated = (newInstance) => {
    console.log('새 인스턴스가 생성되었습니다:', newInstance);
    // 생성된 인스턴스를 부모 컴포넌트에 전달
    onAddInstance?.(newInstance);
    
    // 모달 닫기
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleDeleteClass = (classId) => {
    // if (confirm('Are you sure you want to delete this class?')) {
      deleteClass(classId);
    // }
  };

  return (
    <>
      <div style={{
        // width: '320px',
        height: '100vh',
        backgroundColor: '#f8fafc',
        borderLeft: '1px solid #e2e8f0',
        padding: '16px',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* 헤더 */}
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

        {/* 클래스 목록 */}
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
              No classes yet.<br/>
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

        {/* 하단 정보 */}
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

      {/* CreateInstanceModal */}
      <CreateInstanceModal
        classData={selectedClass}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreateInstance={handleInstanceCreated}
      />
    </>
  );
};