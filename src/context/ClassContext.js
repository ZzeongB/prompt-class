import React, { createContext, useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { generatePlaceholders } from "../api/generatePlaceholders";

const ClassContext = createContext();

// 유틸리티 함수들을 상단으로 이동
const deepCloneTree = (tree) => {
  if (!tree) return null;
  return {
    id: `node-${uuidv4()}`,
    data: { ...tree.data },
    children: tree.children
      ? tree.children.map((child) => deepCloneTree(child))
      : [],
  };
};

const deepCloneSceneGraph = (sceneGraph) => {
  if (!sceneGraph || !sceneGraph.objects) return {};

  const idMapping = {};

  const newObjects = sceneGraph.objects.map((obj) => {
    const newId = `object-${uuidv4()}`;
    idMapping[obj.id] = newId;
    return {
      id: newId,
      name: obj.name,
      attributes: [...(obj.attributes || [])],
    };
  });

  const newRelationships = (sceneGraph.relationships || []).map((rel) => ({
    source: idMapping[rel.source] || rel.source,
    target: idMapping[rel.target] || rel.target,
    relation: rel.relation,
  }));

  const newRoot = idMapping[sceneGraph.root] || sceneGraph.root;

  return {
    root: newRoot,
    objects: newObjects,
    relationships: newRelationships,
  };
};

// 트리의 값들을 placeholder로 교체하는 함수 (깊은 복사 후 수정)
const replaceWithPlaceholders = (tree, placeholderMap) => {
  // 먼저 깊은 복사!
  const clonedTree = deepCloneTree(tree);

  const processNode = (node) => {
    if (!node) return node;

    // data 객체가 없으면 생성
    if (!node.data) {
      node.data = {};
    }

    // 노드의 텍스트를 placeholder로 교체
    if (node.data.label && placeholderMap[node.data.label]) {
      const originalValue = node.data.label;
      node.data.label = `{${placeholderMap[originalValue]}}`;
      node.data.isPlaceholder = true;
      node.data.defaultValue = originalValue;
    }

    // children이 있으면 재귀적으로 처리
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => processNode(child));
    }

    return node;
  };

  return processNode(clonedTree);
};

export const useClassContext = () => {
  const context = useContext(ClassContext);
  if (!context) {
    throw new Error("useClassContext must be used within a ClassProvider");
  }
  return context;
};

export const ClassProvider = ({ children }) => {
  const [classes, setClasses] = useState([]);
  const [instances, setInstances] = useState([]); // instances state 추가

  // 새로운 값들로 인스턴스 라벨 생성
  const generateInstanceLabel = (values) => {
    const mainValue = Object.values(values)[0] || "New";
    return mainValue.charAt(0).toUpperCase() + mainValue.slice(1);
  };

  // 업데이트된 createClass 함수
  const createClass = async (instanceData) => {
    try {
      console.log("Generating placeholders for:", instanceData.instanceLabel);

      // GPT로 placeholder 생성
      const placeholders = await generatePlaceholders(instanceData.tree);
      console.log("Generated placeholders:", placeholders);

      // 원본을 복사한 후 placeholder로 교체
      const processedTree = replaceWithPlaceholders(
        instanceData.tree,
        placeholders
      );

      const newClass = {
        id: `class-${uuidv4()}`,
        name: instanceData.instanceLabel + " Class",
        template: {
          tree: processedTree, // 이미 복사된 트리
        },
        createdAt: new Date().toISOString(),
        createdFrom: instanceData.instanceLabel,
        placeholders: placeholders,
      };

      setClasses((prev) => [...prev, newClass]);
      return newClass;
    } catch (error) {
      console.error("클래스 생성 실패:", error);

      // 실패시 기존 방식으로 폴백 (deepCloneTree 사용)
      const newClass = {
        id: `class-${uuidv4()}`,
        name: instanceData.instanceLabel + " Class",
        template: {
          tree: deepCloneTree(instanceData.tree), // 여기서도 복사
        },
        createdAt: new Date().toISOString(),
        createdFrom: instanceData.instanceLabel,
      };

      setClasses((prev) => [...prev, newClass]);
      return newClass;
    }
  };

  // 클래스 삭제
  const deleteClass = (classId) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
  };

  // 클래스에서 새 인스턴스 생성하는 함수
  const createInstanceFromClass = async (classData, newValues = {}) => {
    try {
      // 클래스의 템플릿 트리를 복사
      const instanceTree = deepCloneTree(classData.template.tree);

      // placeholder를 실제 값으로 채우기
      const fillPlaceholders = (node) => {
        if (!node) return node;

        if (node.data?.isPlaceholder) {
          // placeholder에서 카테고리 추출 (예: "{fruit}" → "fruit")
          const category = node.data.label.replace(/[{}]/g, "");

          // 새로운 값이 제공되면 사용, 아니면 기본값 사용
          if (newValues[category]) {
            node.data.label = newValues[category];
            node.data.isPlaceholder = false;
            delete node.data.defaultValue;
          } else {
            // 기본값으로 복원
            node.data.label = node.data.defaultValue || category;
            node.data.isPlaceholder = false;
            delete node.data.defaultValue;
          }
        }

        // children 처리
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child) => fillPlaceholders(child));
        }

        return node;
      };

      fillPlaceholders(instanceTree);

      // 새 인스턴스 생성 - instanceLabel만 사용
      const newInstance = {
        id: `instance-${uuidv4()}`,
        instanceLabel: generateInstanceLabel(newValues), // 새로운 값들로 라벨 생성
        tree: instanceTree,
        createdAt: new Date().toISOString(),
        createdFrom: `${classData.name}`,
        isFromClass: true,
      };

      setInstances((prev) => [...prev, newInstance]);
      return newInstance;
    } catch (error) {
      console.error("인스턴스 생성 실패:", error);
      throw error;
    }
  };

  // 인스턴스 복제
  const duplicateInstance = (instanceData) => {
    const newId = `instance-${uuidv4()}`;

    const duplicatedInstance = {
      id: newId,
      instanceLabel: instanceData.instanceLabel + " Copy",
      tree: deepCloneTree(instanceData.tree),
      createdAt: new Date().toISOString(),
      createdFrom: instanceData.instanceLabel,
      isFromClass: instanceData.isFromClass || false,
    };

    setInstances((prev) => [...prev, duplicatedInstance]);
    return duplicatedInstance;
  };

  // 인스턴스 삭제
  const deleteInstance = (instanceId) => {
    setInstances((prev) => prev.filter((instance) => instance.id !== instanceId));
  };

  return (
    <ClassContext.Provider
      value={{
        classes,
        instances,
        createClass,
        deleteClass,
        createInstanceFromClass,
        duplicateInstance,
        deleteInstance,
        setInstances, // 외부에서 instances를 업데이트할 수 있도록
      }}
    >
      {children}
    </ClassContext.Provider>
  );
};