// ClassContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { generatePlaceholders } from "../api/generatePlaceholders";
import { logEvent } from "../api/logEvent";

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
      const placeholderData = placeholderMap[obj.name];
      if (placeholderData && placeholderData.category && placeholderData.id) {
        obj.defaultName = obj.name; // 원본 이름 저장
        obj.name = `{${placeholderData.id}}`; // 고유 ID 사용
        obj.isPlaceholder = true;
        obj.placeholderId = placeholderData.id; // 고유 ID 저장
        obj.placeholderCategory = placeholderData.category; // 카테고리도 저장
      }
    }

    // attributes가 문자열 배열일 때 처리
    if (obj.attributes && Array.isArray(obj.attributes)) {
      // 원본 attributes 저장
      obj.defaultAttributes = [...obj.attributes];

      obj.attributes = obj.attributes.map((attr) => {
        if (typeof attr === "string" && placeholderMap[attr]) {
          const placeholderData = placeholderMap[attr];
          if (placeholderData && placeholderData.category && placeholderData.id) {
            return `{${placeholderData.id}}`; // 고유 ID 사용
          }
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
      logEvent("class.create.started", {
        instance_id: instanceData.id,
        instance_label: instanceData.instanceLabel,
        has_scene_graph: !!instanceData.sceneGraph,
        object_count: instanceData.sceneGraph?.objects?.length || 0
      });

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
      
      logEvent("class.created", {
        class_id: newClass.id,
        class_name: newClass.name,
        placeholder_count: Object.keys(placeholders || {}).length,
        created_from: instanceData.instanceLabel
      });

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
      logEvent("class.create.error", {
        instance_id: instanceData.id,
        error_message: error.message,
        using_fallback: true
      });

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
      
      logEvent("class.created.fallback", {
        class_id: fallbackClass.id,
        class_name: fallbackClass.name
      });

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
    logEvent("instance.create_from_class.started", {
      class_id: classData.id,
      class_name: classData.name,
      value_count: Object.keys(newValues).length
    });

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
    
    logEvent("instance.created_from_class", {
      instance_id: newInstance.id,
      class_id: classData.id,
      instance_label: newInstance.instanceLabel,
      has_text_description: !!textDescription
    });
    
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
        // defaultName이 있으면 사용, 없으면 originalSceneGraph에서 가져오기
        const originalValue = 
          obj.defaultName ||
          originalSceneGraph.objects?.[objIndex]?.name ||
          obj.name.replace(/[{}]/g, ""); // fallback

        obj.name = originalValue;

        // placeholder 관련 속성 정리
        delete obj.defaultName;
        delete obj.isPlaceholder;
        delete obj.placeholderId;
        delete obj.placeholderCategory;
      }

      // attributes 처리 (문자열 배열)
      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes = obj.attributes.map((attr, attrIndex) => {
          if (
            typeof attr === "string" &&
            attr.includes("{") &&
            attr.includes("}")
          ) {
            // defaultAttributes에서 원본 값 가져오기
            const originalValue =
              obj.defaultAttributes?.[attrIndex] ||
              originalSceneGraph.objects?.[objIndex]?.attributes?.[attrIndex] ||
              attr.replace(/[{}]/g, ""); // fallback

            return originalValue;
          }
          return attr;
        });

        // defaultAttributes 정리
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
        // defaultName이 있으면 사용, 없으면 originalInstanceSceneGraph에서 가져오기
        const resolvedName =
          obj.defaultName ||
          originalInstanceSceneGraph.objects?.[objIndex]?.name ||
          obj.name.replace(/[{}]/g, ""); // fallback

        obj.name = resolvedName;

        // placeholder 관련 속성 정리
        delete obj.defaultName;
        delete obj.isPlaceholder;
        delete obj.placeholderId;
        delete obj.placeholderCategory;
      }

      // attributes 복원
      if (obj.attributes && Array.isArray(obj.attributes)) {
        obj.attributes = obj.attributes.map((attr, attrIndex) => {
          if (
            typeof attr === "string" &&
            attr.includes("{") &&
            attr.includes("}")
          ) {
            // defaultAttributes에서 원본 값 가져오기
            const resolvedAttr =
              obj.defaultAttributes?.[attrIndex] ||
              originalInstanceSceneGraph.objects?.[objIndex]?.attributes?.[attrIndex] ||
              attr.replace(/[{}]/g, ""); // fallback

            return resolvedAttr;
          }
          return attr;
        });

        // defaultAttributes 정리
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
      ...(obj.placeholderId && { placeholderId: obj.placeholderId }),
      ...(obj.placeholderCategory && { placeholderCategory: obj.placeholderCategory }),
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

  const extractObjectFromInstance = (objectId, instanceId) => {
    const sourceInstance = instances.find(inst => inst.id === instanceId);
    if (!sourceInstance || !sourceInstance.sceneGraph || !sourceInstance.sceneGraph.objects) {
      console.error("Source instance or sceneGraph not found");
      return;
    }

    const objectToExtract = sourceInstance.sceneGraph.objects.find(obj => obj.id === objectId);
    if (!objectToExtract) {
      console.error("Object to extract not found");
      return;
    }

    // 1. 새 인스턴스 생성 (분리된 object만 포함)
    const newInstanceId = `instance-${uuidv4()}`;
    const extractedObjectWithNewId = {
      ...objectToExtract,
      id: `object-${uuidv4()}`
    };
    const newInstanceSceneGraph = {
      objects: [extractedObjectWithNewId],
      relationships: []
    };

    const newInstance = {
      id: newInstanceId,
      instanceLabel: `${objectToExtract.name}`,
      textDescription: `${objectToExtract.name}`,
      sceneGraph: newInstanceSceneGraph,
      isFromClass: false,
      classId: null,
      overrides: {},
      createdAt: new Date().toISOString(),
      originalSceneGraph: newInstanceSceneGraph,
    };

    // 2. 원본 인스턴스에서 해당 object 제거
    const updatedSourceSceneGraph = {
      ...sourceInstance.sceneGraph,
      objects: sourceInstance.sceneGraph.objects.filter(obj => obj.id !== objectId),
      relationships: sourceInstance.sceneGraph.relationships.filter(rel => 
        rel.source !== objectId && rel.target !== objectId
      )
    };

    // 3. 기존 relationship을 두 인스턴스 간 관계로 변환
    const extractedRelationships = sourceInstance.sceneGraph.relationships.filter(rel => 
      rel.source === objectId || rel.target === objectId
    );

    // 3-1. 분리된 object와 연결된 relationship이 있다면 인스턴스 간 관계로 변환
    const interInstanceRelationships = [];
    extractedRelationships.forEach(rel => {
      if (rel.source === objectId) {
        // 분리된 object가 source인 경우
        const targetObjectInSource = updatedSourceSceneGraph.objects.find(obj => obj.id === rel.target);
        if (targetObjectInSource) {
          // 새 인스턴스 -> 원본 인스턴스 관계 생성
          interInstanceRelationships.push({
            source: newInstanceId,
            target: instanceId,
            relation: rel.relation || "related_to"
          });
        }
      } else if (rel.target === objectId) {
        // 분리된 object가 target인 경우
        const sourceObjectInSource = updatedSourceSceneGraph.objects.find(obj => obj.id === rel.source);
        if (sourceObjectInSource) {
          // 원본 인스턴스 -> 새 인스턴스 관계 생성
          interInstanceRelationships.push({
            source: instanceId,
            target: newInstanceId,
            relation: rel.relation || "related_to"
          });
        }
      }
    });

    // 3-2. 새 인스턴스에 inter-instance relationship 정보 추가 (향후 edge 생성용)
    const newInstanceWithRelationships = {
      ...newInstance,
      interInstanceRelationships
    };

    // 4. 인스턴스들 업데이트
    setInstances((prev) => [
      ...prev.filter(inst => inst.id !== instanceId),
      {
        ...sourceInstance,
        sceneGraph: updatedSourceSceneGraph,
      },
      newInstanceWithRelationships
    ]);

    console.log(`Extracted object "${objectToExtract.name}" from instance "${sourceInstance.instanceLabel}"`);
    console.log(`Created new instance: "${newInstance.instanceLabel}"`);
    
    return newInstance;
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
    extractObjectFromInstance,
    deleteInstance,
    setInstances,
    onInstanceExtracted: null, // 콜백을 위한 플레이스홀더
  };

  return (
    <ClassContext.Provider value={contextValue}>
      {children}
    </ClassContext.Provider>
  );
};
