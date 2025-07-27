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

  const newRelationships = (sceneGraph.relationships || []).map((rel) => ({
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

// 두 sceneGraph를 비교하여 차이점을 찾는 함수
const findSceneGraphDifferences = (original, current) => {
  const differences = {};
  
  // 객체 이름 변경 확인
  if (original.objects && current.objects) {
    original.objects.forEach((originalObj, index) => {
      const currentObj = current.objects[index];
      if (currentObj && originalObj.name !== currentObj.name) {
        differences[`objects.${index}.name`] = currentObj.name;
      }
      
      // attributes 변경 확인
      if (originalObj.attributes && currentObj.attributes) {
        originalObj.attributes.forEach((originalAttr, attrIndex) => {
          const currentAttr = currentObj.attributes[attrIndex];
          if (currentAttr && originalAttr !== currentAttr) {
            differences[`objects.${index}.attributes.${attrIndex}`] = currentAttr;
          }
        });
      }
    });
  }
  
  return differences;
};

// 차이점을 sceneGraph에 적용하는 함수
const applySceneGraphDifferences = (baseSceneGraph, differences) => {
  const result = deepCloneSceneGraph(baseSceneGraph);
  
  Object.keys(differences).forEach(path => {
    const value = differences[path];
    const pathParts = path.split('.');
    
    if (pathParts[0] === 'objects') {
      const objectIndex = parseInt(pathParts[1]);
      const property = pathParts[2];
      
      if (result.objects && result.objects[objectIndex]) {
        if (property === 'name') {
          result.objects[objectIndex].name = value;
        } else if (property === 'attributes') {
          const attrIndex = parseInt(pathParts[3]);
          if (result.objects[objectIndex].attributes) {
            result.objects[objectIndex].attributes[attrIndex] = value;
          }
        }
      }
    }
  });
  
  return result;
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
          textDescription: instanceData.textDescription,
          instanceLabel: instanceData.instanceLabel,
        },
        createdAt: new Date().toISOString(),
        createdFrom: instanceData.instanceLabel,
        placeholders,
        // 원본 데이터 저장 (기본값으로 사용)
        originalData: {
          sceneGraph: instanceData.sceneGraph,
          textDescription: instanceData.textDescription,
          instanceLabel: instanceData.instanceLabel,
        }
      };

      setClasses((prev) => [...prev, newClass]);

      // 원본 인스턴스를 클래스의 인스턴스로 변환
      setInstances((prev) => 
        prev.map(instance => {
          if (instance.id === instanceData.id) {
            return {
              ...instance,
              classId: newClass.id,
              isFromClass: true,
              createdFrom: newClass.name,
              overrides: {}, // 초기에는 override 없음
              originalSceneGraph: instanceData.sceneGraph, // 현재 상태를 원본으로 저장
            };
          }
          return instance;
        })
      );

      return newClass;
    } catch (error) {
      // 폴백 클래스 생성
      const fallbackClass = {
        id: `class-${uuidv4()}`,
        name: instanceData.instanceLabel + " Class",
        template: {
          sceneGraph: deepCloneSceneGraph(instanceData.sceneGraph),
          textDescription: instanceData.textDescription,
          instanceLabel: instanceData.instanceLabel,
        },
        createdAt: new Date().toISOString(),
        createdFrom: instanceData.instanceLabel,
        originalData: {
          sceneGraph: instanceData.sceneGraph,
          textDescription: instanceData.textDescription,
          instanceLabel: instanceData.instanceLabel,
        }
      };

      setClasses((prev) => [...prev, fallbackClass]);
      
      // 원본 인스턴스를 클래스의 인스턴스로 변환
      setInstances((prev) => 
        prev.map(instance => {
          if (instance.id === instanceData.id) {
            return {
              ...instance,
              classId: fallbackClass.id,
              isFromClass: true,
              createdFrom: fallbackClass.name,
              overrides: {},
              originalSceneGraph: instanceData.sceneGraph,
            };
          }
          return instance;
        })
      );

      return fallbackClass;
    }
  };

  const createInstanceFromClass = async (classData, newValues = {}) => {
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

    // sceneGraph에서 textDescription 생성
    let textDescription = classData.template.textDescription || "";
    try {
      const { generateSceneGraphToText } = await import("../api/generateTextToGraph");
      textDescription = await generateSceneGraphToText({
        newSceneGraph: sceneGraph,
      });
    } catch (error) {
      console.error("Failed to generate text description from sceneGraph:", error);
      // 폴백: 클래스 템플릿의 textDescription 사용
      textDescription = classData.template.textDescription || generateInstanceLabel(newValues);
    }

    const newInstance = {
      id: `instance-${uuidv4()}`,
      instanceLabel: generateInstanceLabel(newValues),
      sceneGraph, // 업데이트된 sceneGraph
      textDescription, // 생성된 textDescription
      createdAt: new Date().toISOString(),
      createdFrom: classData.name,
      classId: classData.id,
      isFromClass: true,
      overrides: {}, // 초기에는 override 없음
      originalSceneGraph: sceneGraph, // 초기 상태를 원본으로 저장
    };

    setInstances((prev) => [...prev, newInstance]);
    return newInstance;
  };

  // 클래스 업데이트 시 연결된 인스턴스들도 업데이트
  const updateClass = (classId, updates) => {
    setClasses((prev) => 
      prev.map(cls => {
        if (cls.id === classId) {
          const updatedClass = {
            ...cls,
            ...updates,
            template: {
              ...cls.template,
              ...updates.template
            }
          };
          
          // 연결된 인스턴스들 업데이트
          updateInstancesFromClass(updatedClass);
          
          return updatedClass;
        }
        return cls;
      })
    );
  };

  // 클래스 변경에 따른 인스턴스 업데이트
  const updateInstancesFromClass = async (updatedClass) => {
    const updatePromises = instances
      .filter(instance => instance.classId === updatedClass.id)
      .map(async (instance) => {
        // override되지 않은 부분만 클래스에서 업데이트
        const newSceneGraph = applyClassUpdatesToInstance(
          updatedClass.template.sceneGraph,
          instance.overrides,
          instance.originalSceneGraph
        );
        
        // sceneGraph가 변경되었다면 textDescription도 업데이트
        let newTextDescription = instance.textDescription;
        if (!instance.overrides.textDescription) {
          try {
            const { generateSceneGraphToText } = await import("../api/generateTextToGraph");
            newTextDescription = await generateSceneGraphToText({
              newSceneGraph: newSceneGraph,
              previousSceneGraph: instance.sceneGraph,
              previousTextDescription: instance.textDescription,
            });
          } catch (error) {
            console.error("Failed to update text description for instance:", instance.id, error);
            // 폴백: 클래스 템플릿의 textDescription 사용
            newTextDescription = updatedClass.template.textDescription || instance.textDescription;
          }
        }
        
        return {
          ...instance,
          sceneGraph: newSceneGraph,
          textDescription: newTextDescription,
        };
      });

    const updatedInstances = await Promise.all(updatePromises);
    
    setInstances((prev) => 
      prev.map(instance => {
        const updated = updatedInstances.find(u => u.id === instance.id);
        return updated || instance;
      })
    );
  };

  // 클래스 업데이트를 인스턴스에 적용 (override 고려)
  const applyClassUpdatesToInstance = (classSceneGraph, overrides, originalSceneGraph) => {
    // 클래스의 sceneGraph를 기본으로 시작
    let result = deepCloneSceneGraph(classSceneGraph);
    
    // placeholder를 원본 값으로 복원
    result.objects.forEach((obj) => {
      if (obj.name && obj.name.includes("{") && obj.name.includes("}")) {
        const key = obj.name.replace(/[{}]/g, "");
        // 원본에서 해당하는 값 찾기
        const originalObj = originalSceneGraph.objects?.find(orig => 
          orig.defaultName === key || orig.name === key
        );
        if (originalObj) {
          obj.name = originalObj.name;
        }
        delete obj.defaultName;
        delete obj.isPlaceholder;
      }

      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes = obj.attributes.map((attr, index) => {
          if (typeof attr === "string" && attr.includes("{") && attr.includes("}")) {
            const key = attr.replace(/[{}]/g, "");
            // 원본에서 해당하는 값 찾기
            const originalObj = originalSceneGraph.objects?.find(orig => 
              orig.attributes && orig.attributes[index]
            );
            return originalObj?.attributes[index] || attr;
          }
          return attr;
        });
      }
    });
    
    // override된 부분 적용
    result = applySceneGraphDifferences(result, overrides);
    
    return result;
  };

  // 인스턴스 업데이트 (override 추적)
  const updateInstance = (instanceId, updates) => {
    setInstances((prev) => 
      prev.map(instance => {
        if (instance.id === instanceId && instance.isFromClass) {
          // 클래스와 비교하여 override 계산
          const classData = classes.find(cls => cls.id === instance.classId);
          if (classData) {
            // 새로운 override 계산
            const newOverrides = calculateOverrides(
              classData.originalData.sceneGraph,
              updates.sceneGraph || instance.sceneGraph,
              instance.overrides
            );
            
            return {
              ...instance,
              ...updates,
              overrides: {
                ...instance.overrides,
                ...newOverrides,
                // textDescription override 추적
                ...(updates.textDescription !== classData.template.textDescription ? 
                    { textDescription: true } : {}),
              }
            };
          }
        }
        return instance.id === instanceId ? { ...instance, ...updates } : instance;
      })
    );
  };

  // override 계산
  const calculateOverrides = (originalSceneGraph, currentSceneGraph, existingOverrides) => {
    const differences = findSceneGraphDifferences(originalSceneGraph, currentSceneGraph);
    return { ...existingOverrides, ...differences };
  };

  // 인스턴스의 override 초기화 (클래스로 되돌리기)
  const resetInstanceToClass = (instanceId) => {
    setInstances((prev) => 
      prev.map(instance => {
        if (instance.id === instanceId && instance.isFromClass) {
          const classData = classes.find(cls => cls.id === instance.classId);
          if (classData) {
            return {
              ...instance,
              sceneGraph: applyClassUpdatesToInstance(
                classData.template.sceneGraph,
                {},
                instance.originalSceneGraph
              ),
              textDescription: classData.template.textDescription,
              overrides: {},
            };
          }
        }
        return instance;
      })
    );
  };
  
  const duplicateInstance = (instanceData) => {
    const newId = `instance-${uuidv4()}`;
    const duplicated = {
      id: newId,
      instanceLabel: instanceData.instanceLabel + " Copy",
      sceneGraph: deepCloneSceneGraph(instanceData.sceneGraph),
      textDescription: instanceData.textDescription,
      createdAt: new Date().toISOString(),
      createdFrom: instanceData.instanceLabel,
      isFromClass: instanceData.isFromClass || false,
      classId: instanceData.classId,
      overrides: instanceData.overrides ? { ...instanceData.overrides } : {},
      originalSceneGraph: instanceData.originalSceneGraph,
    };

    setInstances((prev) => [...prev, duplicated]);
    return duplicated;
  };

  const deleteClass = (classId) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
    
    // 해당 클래스의 인스턴스들을 standalone으로 변경
    setInstances((prev) => 
      prev.map(instance => {
        if (instance.classId === classId) {
          return {
            ...instance,
            isFromClass: false,
            classId: null,
            overrides: {},
          };
        }
        return instance;
      })
    );
  };

  const deleteInstance = (instanceId) => {
    setInstances((prev) => prev.filter((i) => i.id !== instanceId));
  };

  const contextValue = {
    classes,
    instances,
    createClass,
    updateClass,
    deleteClass,
    createInstanceFromClass,
    updateInstance,
    resetInstanceToClass,
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