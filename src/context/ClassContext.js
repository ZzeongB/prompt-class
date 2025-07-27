// ClassContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { generatePlaceholders } from "../api/generatePlaceholders";

const ClassContext = createContext();

// sceneGraph 복사
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

  return {
    objects: newObjects,
    relationships: newRelationships,
  };
};

// placeholder 적용
const replaceWithSceneGraphPlaceholders = (sceneGraph, placeholderMap) => {
  const cloned = deepCloneSceneGraph(sceneGraph);

  if (!placeholderMap || Object.keys(placeholderMap).length === 0) {
    console.warn("placeholderMap is empty or invalid");
    return cloned;
  }

  cloned.objects?.forEach((obj) => {
    // 객체 이름 placeholder 처리
    if (obj.name && placeholderMap[obj.name]) {
      obj.defaultName = obj.name; // 원본 이름 저장
      obj.name = `{${placeholderMap[obj.name]}}`;
      obj.isPlaceholder = true;
    }

    // attributes가 문자열 배열일 때 처리
    if (obj.attributes && Array.isArray(obj.attributes)) {
      // 원본 attributes 저장
      obj.defaultAttributes = [...obj.attributes];

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

// 차이점을 sceneGraph에 적용하는 함수
const applySceneGraphDifferences = (baseSceneGraph, differences) => {
  const result = deepCloneSceneGraph(baseSceneGraph);

  Object.keys(differences).forEach((path) => {
    const value = differences[path];
    const pathParts = path.split(".");

    if (pathParts[0] === "objects") {
      const objectIndex = parseInt(pathParts[1]);
      const property = pathParts[2];

      if (result.objects && result.objects[objectIndex]) {
        if (property === "name") {
          result.objects[objectIndex].name = value;
        } else if (property === "attributes") {
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
        },
      };

      setClasses((prev) => [...prev, newClass]);

      // 원본 인스턴스를 클래스의 인스턴스로 변환
      setInstances((prev) =>
        prev.map((instance) => {
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
        },
      };

      setClasses((prev) => [...prev, fallbackClass]);

      // 원본 인스턴스를 클래스의 인스턴스로 변환
      setInstances((prev) =>
        prev.map((instance) => {
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

    sceneGraph.objects.forEach((obj, objIndex) => {
      // 객체 이름 처리
      if (obj.name && obj.name.includes("{") && obj.name.includes("}")) {
        const key = obj.name.replace(/[{}]/g, "");
        obj.name = newValues[key] || obj.defaultName || key;
        delete obj.defaultName;
        delete obj.isPlaceholder;
      }

      // attributes 처리 (문자열 배열)
      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes = obj.attributes.map((attr, attrIndex) => {
          if (
            typeof attr === "string" &&
            attr.includes("{") &&
            attr.includes("}")
          ) {
            const key = attr.replace(/[{}]/g, "");

            // newValues에서 찾거나 defaultAttributes에서 찾기
            let value = newValues[key];

            if (value === undefined && obj.defaultAttributes) {
              value = obj.defaultAttributes[attrIndex];
            }

            return value !== undefined ? value : key;
          }
          return attr;
        });

        // defaultAttributes 정리
        delete obj.defaultAttributes;
      }
    });

    // sceneGraph에서 textDescription 생성
    let textDescription = classData.template.textDescription || "";
    try {
      const { generateSceneGraphToText } = await import(
        "../api/generateTextToGraph"
      );
      textDescription = await generateSceneGraphToText({
        newSceneGraph: sceneGraph,
      });
    } catch (error) {
      console.error(
        "Failed to generate text description from sceneGraph:",
        error
      );
      // 폴백: 클래스 템플릿의 textDescription 사용
      textDescription =
        classData.template.textDescription || generateInstanceLabel(newValues);
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
      prev.map((cls) => {
        if (cls.id === classId) {
          const updatedClass = {
            ...cls,
            ...updates,
            template: {
              ...cls.template,
              ...updates.template,
            },
          };

          // 연결된 인스턴스들 업데이트
          updateInstancesFromClass(updatedClass);

          return updatedClass;
        }
        return cls;
      })
    );
  };

  // 클래스 업데이트를 인스턴스에 적용 (override 고려) - placeholders 활용
  const applyClassUpdatesToInstance = (
    classSceneGraph,
    overrides,
    originalSceneGraph,
    placeholders = {} // placeholders 매개변수 추가
  ) => {
    // 클래스의 sceneGraph를 기본으로 시작
    let result = deepCloneSceneGraph(classSceneGraph);

    // placeholder를 원본 값으로 복원
    result.objects.forEach((obj, objIndex) => {
      // 객체 이름 처리
      if (obj.name && obj.name.includes("{") && obj.name.includes("}")) {
        const placeholderKey = obj.name.replace(/[{}]/g, "");

        // placeholders에서 해당하는 원본 값을 찾기
        // placeholders: { "red": "color" } 형태에서
        // placeholderKey가 "color"일 때 "red"를 찾아야 함
        const originalValue =
          Object.keys(placeholders).find(
            (key) => placeholders[key] === placeholderKey
          ) ||
          originalSceneGraph.objects?.[objIndex]?.name ||
          placeholderKey;

        obj.name = originalValue;

        delete obj.defaultName;
        delete obj.isPlaceholder;
      }

      // attributes 처리 (문자열 배열)
      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes = obj.attributes.map((attr, attrIndex) => {
          if (
            typeof attr === "string" &&
            attr.includes("{") &&
            attr.includes("}")
          ) {
            const placeholderKey = attr.replace(/[{}]/g, "");

            // placeholders에서 해당하는 원본 값을 찾기
            const originalValue =
              Object.keys(placeholders).find(
                (key) => placeholders[key] === placeholderKey
              ) ||
              originalSceneGraph.objects?.[objIndex]?.attributes?.[attrIndex] ||
              placeholderKey;

            return originalValue;
          }
          return attr;
        });

        delete obj.defaultAttributes;
      }
    });

    // override된 부분 적용
    if (overrides && Object.keys(overrides).length > 0) {
      result = applySceneGraphDifferences(result, overrides);
    }

    return result;
  };

  // updateInstance 함수에서 createResolvedBaseSceneGraph 호출 부분도 수정
  const updateInstance = (instanceId, updates) => {
    setInstances((prev) =>
      prev.map((instance) => {
        if (instance.id === instanceId) {
          if (instance.isFromClass) {
            // 클래스에서 파생된 인스턴스인 경우 override 계산
            const classData = classes.find(
              (cls) => cls.id === instance.classId
            );
            if (classData) {
              // 업데이트된 sceneGraph
              const updatedSceneGraph =
                updates.sceneGraph || instance.sceneGraph;
              // 클래스 템플릿을 현재 인스턴스의 originalSceneGraph 값으로 복원한 "기본" sceneGraph 생성
              const baseSceneGraph = createResolvedBaseSceneGraph(
                classData.template.sceneGraph,
                instance.originalSceneGraph,
                classData.placeholders
              );
              // 기본값과 현재값 비교하여 override 계산
              const newOverrides = findSceneGraphDifferences(
                baseSceneGraph,
                updatedSceneGraph
              );

              const updatedInstance = {
                ...instance,
                ...updates,
                overrides: {
                  ...newOverrides,
                  // textDescription override 추적
                  ...(updates.textDescription &&
                  updates.textDescription !== classData.template.textDescription
                    ? { textDescription: true }
                    : {}),
                },
              };
              return updatedInstance;
            }
          }

          // 일반 인스턴스인 경우 그냥 업데이트
          return { ...instance, ...updates };
        }
        return instance;
      })
    );
  };

  // resetInstanceToClass 함수도 수정
  const resetInstanceToClass = (instanceId) => {
    setInstances((prev) =>
      prev.map((instance) => {
        if (instance.id === instanceId && instance.isFromClass) {
          const classData = classes.find((cls) => cls.id === instance.classId);
          if (classData) {
            return {
              ...instance,
              sceneGraph: applyClassUpdatesToInstance(
                classData.template.sceneGraph,
                {},
                instance.originalSceneGraph,
                classData.placeholders // placeholders 전달
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

  // updateInstancesFromClass 함수도 수정 필요
  const updateInstancesFromClass = async (updatedClass) => {
    const updatePromises = instances
      .filter((instance) => instance.classId === updatedClass.id)
      .map(async (instance) => {
        // override되지 않은 부분만 클래스에서 업데이트
        // placeholders 전달 추가
        const newSceneGraph = applyClassUpdatesToInstance(
          updatedClass.template.sceneGraph,
          instance.overrides,
          instance.originalSceneGraph,
          updatedClass.placeholders // placeholders 전달
        );

        // 나머지 로직은 동일...
        let newTextDescription = instance.textDescription;
        if (!instance.overrides.textDescription) {
          try {
            const { generateSceneGraphToText } = await import(
              "../api/generateTextToGraph"
            );
            newTextDescription = await generateSceneGraphToText({
              newSceneGraph: newSceneGraph,
              previousSceneGraph: instance.sceneGraph,
              previousTextDescription: instance.textDescription,
            });
          } catch (error) {
            console.error(
              "Failed to update text description for instance:",
              instance.id,
              error
            );
            newTextDescription =
              updatedClass.template.textDescription || instance.textDescription;
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
      prev.map((instance) => {
        const updated = updatedInstances.find((u) => u.id === instance.id);
        return updated || instance;
      })
    );
  };

  // createResolvedBaseSceneGraph 함수도 수정
  const createResolvedBaseSceneGraph = (
    classTemplateSceneGraph,
    originalInstanceSceneGraph,
    placeholders = {} // placeholders 매개변수 추가
  ) => {
    const resolved = deepCloneSceneGraph(classTemplateSceneGraph);

    resolved.objects.forEach((obj, objIndex) => {
      // 객체 이름 복원
      if (obj.name && obj.name.includes("{") && obj.name.includes("}")) {
        const placeholderKey = obj.name.replace(/[{}]/g, "");

        // placeholders에서 원본 값 찾기
        const resolvedName =
          Object.keys(placeholders).find(
            (key) => placeholders[key] === placeholderKey
          ) ||
          originalInstanceSceneGraph.objects?.[objIndex]?.name ||
          placeholderKey;

        obj.name = resolvedName;

        delete obj.defaultName;
        delete obj.isPlaceholder;
      }

      // attributes 복원
      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes = obj.attributes.map((attr, attrIndex) => {
          if (
            typeof attr === "string" &&
            attr.includes("{") &&
            attr.includes("}")
          ) {
            const placeholderKey = attr.replace(/[{}]/g, "");

            // placeholders에서 원본 값 찾기
            const resolvedAttr =
              Object.keys(placeholders).find(
                (key) => placeholders[key] === placeholderKey
              ) ||
              originalInstanceSceneGraph.objects?.[objIndex]?.attributes?.[
                attrIndex
              ] ||
              placeholderKey;

            return resolvedAttr;
          }
          return attr;
        });

        delete obj.defaultAttributes;
      }
    });

    return resolved;
  };
  // 1. findSceneGraphDifferences 함수 개선 (더 정확한 비교)
  const findSceneGraphDifferences = (original, current) => {
    const differences = {};

    // 객체 개수 체크
    if (!original.objects || !current.objects) {
      return differences;
    }

    if (original.objects.length !== current.objects.length) {
      // 객체 개수가 다르면 전체적인 변경으로 처리
      differences["structure"] = "modified";
    }

    // 각 객체 비교
    original.objects.forEach((originalObj, index) => {
      const currentObj = current.objects[index];

      if (!currentObj) {
        return;
      }
      // 이름 비교 (정확한 문자열 비교)
      if (originalObj.name !== currentObj.name) {
        differences[`objects.${index}.name`] = currentObj.name;
      }

      // attributes 비교 (배열 길이 및 각 요소 비교)
      const originalAttrs = originalObj.attributes || [];
      const currentAttrs = currentObj.attributes || [];

      // 배열 길이가 다른 경우
      if (originalAttrs.length !== currentAttrs.length) {
        differences[`objects.${index}.attributes`] = currentAttrs;
      } else {
        // 각 attribute 비교
        originalAttrs.forEach((originalAttr, attrIndex) => {
          const currentAttr = currentAttrs[attrIndex];

          if (currentAttr !== undefined && originalAttr !== currentAttr) {
            differences[`objects.${index}.attributes.${attrIndex}`] =
              currentAttr;
          }
        });
      }
    });

    return differences;
  };

  // 3. applySceneGraphDifferences 함수 개선 (override 적용)
  const applySceneGraphDifferences = (baseSceneGraph, differences) => {
    const result = deepCloneSceneGraph(baseSceneGraph);

    Object.keys(differences).forEach((path) => {
      const value = differences[path];
      const pathParts = path.split(".");

      if (pathParts[0] === "objects") {
        const objectIndex = parseInt(pathParts[1]);
        const property = pathParts[2];

        if (result.objects && result.objects[objectIndex]) {
          if (property === "name") {
            result.objects[objectIndex].name = value;
          } else if (property === "attributes") {
            if (pathParts[3] !== undefined) {
              // 개별 attribute 수정
              const attrIndex = parseInt(pathParts[3]);
              if (result.objects[objectIndex].attributes) {
                result.objects[objectIndex].attributes[attrIndex] = value;
              }
            } else {
              result.objects[objectIndex].attributes = [...value];
            }
          }
        }
      } else if (path === "structure") {
        // 구조적 변경인 경우 - 특별한 처리가 필요할 수 있음
        console.log("Structural change detected");
      }
    });

    return result;
  };

  // 4. deepCloneSceneGraph 함수에 ID 보존 로직 추가
  const deepCloneSceneGraph = (sceneGraph) => {
    if (!sceneGraph || !sceneGraph.objects) {
      return { objects: [], relationships: [] };
    }

    const newObjects = sceneGraph.objects.map((obj) => ({
      id: obj.id, // ID 보존 (새로 생성하지 않음)
      name: obj.name,
      attributes: [...(obj.attributes || [])],
      // 기타 속성들도 보존
      ...(obj.defaultName && { defaultName: obj.defaultName }),
      ...(obj.isPlaceholder && { isPlaceholder: obj.isPlaceholder }),
      ...(obj.defaultAttributes && {
        defaultAttributes: [...obj.defaultAttributes],
      }),
    }));

    const newRelationships = (sceneGraph.relationships || []).map((rel) => ({
      source: rel.source,
      target: rel.target,
      relation: rel.relation,
    }));

    const cloned = {
      objects: newObjects,
      relationships: newRelationships,
    };

    console.log("Cloned result:", cloned);
    return cloned;
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
      prev.map((instance) => {
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
