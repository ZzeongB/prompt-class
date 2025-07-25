// ClassContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { generatePlaceholders } from "../api/generatePlaceholders";

const ClassContext = createContext();

// sceneGraph 복사
const deepCloneSceneGraph = (sceneGraph) => {
  console.log("deep cloning", sceneGraph);
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

  const newRelationships = sceneGraph.relationships.map((rel) => ({
    source: idMapping[rel.source] || rel.source,
    target: idMapping[rel.target] || rel.target,
    relation: rel.relation,
  }));

  return {
    objects: newObjects,
    relationships: newRelationships,
  };
};

// placeholder 적용
const replaceWithSceneGraphPlaceholders = (sceneGraph, placeholderMap) => {
  const cloned = deepCloneSceneGraph(sceneGraph);
  console.log("cloned", cloned);

  if (!placeholderMap || Object.keys(placeholderMap).length === 0) {
    console.warn("placeholderMap is empty or invalid");
    return cloned;
  }

  cloned.objects?.forEach((obj) => {
    // 객체 이름 placeholder 처리
    if (obj.name && placeholderMap[obj.name]) {
      obj.defaultName = obj.name;
      obj.name = `{${placeholderMap[obj.name]}}`;
      obj.isPlaceholder = true;
    }

    // attributes가 문자열 배열일 때 처리
    if (obj.attributes && Array.isArray(obj.attributes)) {
      obj.attributes = obj.attributes.map((attr) => {
        if (typeof attr === "string" && placeholderMap[attr]) {
          return `{${placeholderMap[attr]}}`;
        }
        return attr;
      });
    }
  });

  return cloned;
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
  const [instances, setInstances] = useState([]);

  const generateInstanceLabel = (values) => {
    const mainValue = Object.values(values)[0] || "New";
    return mainValue.charAt(0).toUpperCase() + mainValue.slice(1);
  };

  const createClass = async (instanceData) => {
    try {
      const placeholders = await generatePlaceholders(instanceData.sceneGraph);
      console.log(placeholders);
      const processedSceneGraph = replaceWithSceneGraphPlaceholders(
        instanceData.sceneGraph,
        placeholders
      );

      const newClass = {
        id: `class-${uuidv4()}`,
        name: instanceData.instanceLabel + " Class",
        template: {
          sceneGraph: processedSceneGraph,
        },
        createdAt: new Date().toISOString(),
        createdFrom: instanceData.instanceLabel,
        placeholders,
      };

      setClasses((prev) => [...prev, newClass]);

      return newClass;
    } catch (error) {
      // 폴백 클래스 생성
      const fallbackClass = {
        id: `class-${uuidv4()}`,
        name: instanceData.instanceLabel + " Class",
        template: {
          sceneGraph: deepCloneSceneGraph(instanceData.sceneGraph),
        },
        createdAt: new Date().toISOString(),
        createdFrom: instanceData.instanceLabel,
      };

      setClasses((prev) => {
        const updated = [...prev, fallbackClass];
        return updated;
      });

      return fallbackClass;
    }
  };

  const createInstanceFromClass = (classData, newValues = {}) => {
    const sceneGraph = deepCloneSceneGraph(classData.template.sceneGraph);

    sceneGraph.objects.forEach((obj) => {
      // 객체 이름 처리
      if (obj.name && obj.name.includes("{") && obj.name.includes("}")) {
        const key = obj.name.replace(/[{}]/g, "");
        obj.name = newValues[key] || obj.defaultName || key;
        delete obj.defaultName;
        delete obj.isPlaceholder;
      }

      // attributes 처리 (문자열 배열)
      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes = obj.attributes.map((attr) => {
          if (
            typeof attr === "string" &&
            attr.includes("{") &&
            attr.includes("}")
          ) {
            const key = attr.replace(/[{}]/g, "");
            return newValues[key] || attr; // placeholder를 값으로 교체
          }
          return attr;
        });
      }
    });

    const newInstance = {
      id: `instance-${uuidv4()}`,
      instanceLabel: generateInstanceLabel(newValues),
      sceneGraph, // 업데이트된 sceneGraph
      createdAt: new Date().toISOString(),
      createdFrom: classData.name,
      isFromClass: true,
    };

    setInstances((prev) => [...prev, newInstance]);
    return newInstance;
  };
  
  const duplicateInstance = (instanceData) => {
    const newId = `instance-${uuidv4()}`;
    const duplicated = {
      id: newId,
      instanceLabel: instanceData.instanceLabel + " Copy",
      sceneGraph: deepCloneSceneGraph(instanceData.sceneGraph),
      createdAt: new Date().toISOString(),
      createdFrom: instanceData.instanceLabel,
      isFromClass: instanceData.isFromClass || false,
    };

    setInstances((prev) => [...prev, duplicated]);
    return duplicated;
  };

  const deleteClass = (classId) => {
    setClasses((prev) => {
      prev.filter((c) => c.id !== classId);
    });
  };

  const deleteInstance = (instanceId) => {
    setInstances((prev) => prev.filter((i) => i.id !== instanceId));
  };

  const contextValue = {
    classes,
    instances,
    createClass,
    deleteClass,
    createInstanceFromClass,
    duplicateInstance,
    deleteInstance,
    setInstances,
  };

  return (
    <ClassContext.Provider value={contextValue}>
      {children}
    </ClassContext.Provider>
  );
};
