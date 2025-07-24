import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ClassContext = createContext();

export const useClassContext = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error('useClassContext must be used within a ClassProvider');
  }
  return context;
};

export const ClassProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);

  // 클래스 생성
  const createClass = (instanceData) => {
    const newClass = {
      id: `class-${uuidv4()}`,
      name: instanceData.instanceLabel + " Class",
      description: instanceData.textDescription || "No description",
      template: {
        sceneGraph: { ...instanceData.sceneGraph },
        tree: deepCloneTree(instanceData.tree),
      },
      createdAt: new Date().toISOString(),
      createdFrom: instanceData.instanceLabel,
    };

    setClasses(prev => [...prev, newClass]);
    return newClass;
  };

  // 클래스 삭제
  const deleteClass = (classId) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
  };

  // 클래스에서 인스턴스 생성
  const createInstanceFromClass = (classData) => {
    const instanceId = `instance-${uuidv4()}`;
    
    return {
      id: instanceId,
      type: "instance-group",
      data: {
        baseline: false,
        label: classData.name.replace(" Class", "") + " Instance",
        type: "object",
        sharedId: instanceId,
        classId: classData.id,
        instanceId: instanceId,
        justCreated: false, // 클래스에서 생성한 건 초기화 모달 안 띄움
        textDescription: classData.description,
        sceneGraph: { ...classData.template.sceneGraph },
        tree: deepCloneTree(classData.template.tree),
      },
      position: { x: 50, y: 50 }, // 기본 위치
      updatedAt: new Date().toISOString(),
      style: { height: 20 },
    };
  };

  // 인스턴스 복제
  const duplicateInstance = (instanceData) => {
    const newId = `instance-${uuidv4()}`;
    
    return {
      id: newId,
      type: "instance-group",
      data: {
        baseline: false,
        label: instanceData.instanceLabel + " Copy",
        type: "object",
        sharedId: newId,
        classId: instanceData.classId || "__duplicated__",
        instanceId: newId,
        justCreated: false,
        textDescription: instanceData.textDescription,
        sceneGraph: deepCloneSceneGraph(instanceData.sceneGraph),
        tree: deepCloneTree(instanceData.tree),
      },
      position: { x: 70, y: 70 }, // 약간 offset
      updatedAt: new Date().toISOString(),
      style: { height: 20 },
    };
  };

  return (
    <ClassContext.Provider value={{
      classes,
      createClass,
      deleteClass,
      createInstanceFromClass,
      duplicateInstance,
    }}>
      {children}
    </ClassContext.Provider>
  );
};

// 유틸리티 함수들
const deepCloneTree = (tree) => {
  if (!tree) return null;
  return {
    id: `node-${uuidv4()}`,
    data: { ...tree.data },
    children: tree.children ? tree.children.map(child => deepCloneTree(child)) : []
  };
};

const deepCloneSceneGraph = (sceneGraph) => {
  if (!sceneGraph || !sceneGraph.objects) return {};

  const idMapping = {};
  
  const newObjects = sceneGraph.objects.map(obj => {
    const newId = `object-${uuidv4()}`;
    idMapping[obj.id] = newId;
    return {
      id: newId,
      name: obj.name,
      attributes: [...(obj.attributes || [])]
    };
  });

  const newRelationships = (sceneGraph.relationships || []).map(rel => ({
    source: idMapping[rel.source] || rel.source,
    target: idMapping[rel.target] || rel.target,
    relation: rel.relation
  }));

  const newRoot = idMapping[sceneGraph.root] || sceneGraph.root;

  return {
    root: newRoot,
    objects: newObjects,
    relationships: newRelationships
  };
};