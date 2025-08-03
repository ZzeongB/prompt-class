import { deepCloneSceneGraph } from './SceneGraphUtils';

export const replaceWithSceneGraphPlaceholders = (sceneGraph, placeholderMap) => {
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
        obj.defaultName = obj.name;
        obj.name = `{${placeholderData.id}}`;
        obj.isPlaceholder = true;
        obj.placeholderId = placeholderData.id;
        obj.placeholderCategory = placeholderData.category;
      }
    }

    // attributes가 문자열 배열일 때 처리
    if (obj.attributes && Array.isArray(obj.attributes)) {
      obj.defaultAttributes = [...obj.attributes];

      obj.attributes = obj.attributes.map((attr) => {
        if (typeof attr === "string" && placeholderMap[attr]) {
          const placeholderData = placeholderMap[attr];
          if (placeholderData && placeholderData.category && placeholderData.id) {
            return `{${placeholderData.id}}`;
          }
        }
        return attr;
      });
    }
  });

  return cloned;
};

export const resolvePlaceholdersInSceneGraph = (sceneGraph, values, originalSceneGraph) => {
  const resolved = deepCloneSceneGraph(sceneGraph);
  const overrides = {};
  let hasOverrides = false;

  console.log("Resolving placeholders in sceneGraph:", resolved, values);

  // values가 sceneGraph 구조를 가진 경우 처리
  const isValuesSceneGraph = values && values.objects && Array.isArray(values.objects);
  
  // 객체를 ID로 매칭하는 헬퍼 함수
  const findMatchingObjectById = (targetId, sourceObjects) => {
    return sourceObjects.find(obj => obj.id === targetId);
  };

  // values에서 값을 가져오는 헬퍼 함수 (개선된 매칭 로직)
  const getValueFromValues = (key, currentObj, objIndex) => {
    if (isValuesSceneGraph) {
      // 1. ID로 정확한 매칭 시도
      const matchedObj = findMatchingObjectById(currentObj.id, values.objects);
      if (matchedObj) {
        // 객체 이름 매칭
        if (matchedObj.name && (matchedObj.name === key || matchedObj.name.replace(/[{}]/g, "") === key)) {
          return matchedObj.name;
        }
        // attributes에서 매칭
        if (matchedObj.attributes && Array.isArray(matchedObj.attributes)) {
          const foundAttr = matchedObj.attributes.find(attr => 
            typeof attr === "string" && (attr === key || attr.replace(/[{}]/g, "") === key)
          );
          if (foundAttr) return foundAttr;
        }
      }
      
      // 2. ID 매칭이 실패한 경우 인덱스로 fallback
      const valuesObj = values.objects[objIndex];
      if (valuesObj) {
        if (valuesObj.name && (valuesObj.name === key || valuesObj.name.replace(/[{}]/g, "") === key)) {
          return valuesObj.name;
        }
        if (valuesObj.attributes && Array.isArray(valuesObj.attributes)) {
          const foundAttr = valuesObj.attributes.find(attr => 
            typeof attr === "string" && (attr === key || attr.replace(/[{}]/g, "") === key)
          );
          if (foundAttr) return foundAttr;
        }
      }
      return undefined;
    } else {
      // values가 단순 키-값 객체일 때
      return values[key];
    }
  };

  resolved.objects.forEach((obj, objIndex) => {
    // 객체 이름 처리 - 직접 비교와 placeholder 방식 둘 다 지원
    if (obj.name) {
      let newValue = obj.name;
      let valueFromValues = null;

      // 1. values가 sceneGraph 구조일 때: ID로 매칭해서 직접 비교
      if (isValuesSceneGraph) {
        const matchedValuesObj = findMatchingObjectById(obj.id, values.objects);
        if (matchedValuesObj && matchedValuesObj.name && matchedValuesObj.name !== obj.name) {
          // 같은 ID인데 name이 다르면 values의 name으로 override
          valueFromValues = matchedValuesObj.name;
          newValue = matchedValuesObj.name;
        }
      }
      
      // 2. placeholder 방식 처리 (기존 로직)
      if (!valueFromValues && obj.name.includes("{") && obj.name.includes("}")) {
        const key = obj.name.replace(/[{}]/g, "");
        valueFromValues = getValueFromValues(key, obj, objIndex);
        newValue = valueFromValues || obj.defaultName || key;
      }

      // override 기록
      if (valueFromValues && valueFromValues !== obj.name && valueFromValues !== (obj.defaultName || obj.name)) {
        if (!overrides.objects) overrides.objects = {};
        if (!overrides.objects[obj.id]) overrides.objects[obj.id] = {};
        overrides.objects[obj.id].name = valueFromValues;
        hasOverrides = true;
      }

      obj.name = newValue;
      delete obj.defaultName;
      delete obj.isPlaceholder;
      delete obj.placeholderId;
      delete obj.placeholderCategory;
    }

    // attributes 처리 (개선된 매칭 로직)
    if (obj.attributes && Array.isArray(obj.attributes)) {
      // values에서 매칭되는 객체를 찾아서 attributes 전체를 비교
      const matchedValuesObj = isValuesSceneGraph ? 
        findMatchingObjectById(obj.id, values.objects) || values.objects[objIndex] : 
        null;

      obj.attributes = obj.attributes.map((attr, attrIndex) => {
        if (typeof attr === "string") {
          const key = attr.replace(/[{}]/g, "");
          let value;

          // 매칭된 객체의 동일한 인덱스 위치에서 값 가져오기
          if (matchedValuesObj && matchedValuesObj.attributes && 
              Array.isArray(matchedValuesObj.attributes) && 
              matchedValuesObj.attributes[attrIndex]) {
            value = matchedValuesObj.attributes[attrIndex];
          } else {
            // fallback: key로 검색
            value = getValueFromValues(key, obj, objIndex);
          }

          if (value === undefined && obj.defaultAttributes) {
            value = obj.defaultAttributes[attrIndex];
          }

          const finalValue = value !== undefined ? value : key;

          if (value && value !== (obj.defaultAttributes?.[attrIndex] || key)) {
            if (!overrides.objects) overrides.objects = {};
            if (!overrides.objects[obj.id]) overrides.objects[obj.id] = {};
            if (!overrides.objects[obj.id].attributes) overrides.objects[obj.id].attributes = {};
            overrides.objects[obj.id].attributes[attrIndex] = value;
            hasOverrides = true;
          }

          return finalValue;
        }
        return attr;
      });

      delete obj.defaultAttributes;
    }
  });

  // relationships 처리 (추가된 부분)
  if (resolved.relationships && Array.isArray(resolved.relationships) && 
      isValuesSceneGraph && values.relationships && Array.isArray(values.relationships)) {
    
    resolved.relationships.forEach((rel, relIndex) => {
      // ID나 인덱스로 매칭되는 relationship 찾기
      const matchedRel = values.relationships.find(vRel => 
        vRel.source === rel.source && vRel.target === rel.target
      ) || values.relationships[relIndex];

      if (matchedRel && matchedRel.relation && rel.relation !== matchedRel.relation) {
        // relationship의 relation 값이 다른 경우 override 기록
        if (!overrides.relationships) overrides.relationships = [];
        overrides.relationships[relIndex] = {
          source: rel.source,
          target: rel.target,
          relation: matchedRel.relation
        };
        hasOverrides = true;
        
        // 실제 값도 업데이트
        rel.relation = matchedRel.relation;
      }
    });
  }

  return { sceneGraph: resolved, overrides: hasOverrides ? overrides : {} };
};

export const restorePlaceholdersFromTemplate = (
  classSceneGraph,
  originalSceneGraph,
  placeholders = {}
) => {
  const result = deepCloneSceneGraph(classSceneGraph);

  result.objects.forEach((obj, objIndex) => {
    // 객체 이름 복원
    if (obj.name && obj.name.includes("{") && obj.name.includes("}")) {
      const resolvedName =
        obj.defaultName ||
        originalSceneGraph.objects?.[objIndex]?.name ||
        obj.name.replace(/[{}]/g, "");

      obj.name = resolvedName;

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
          const resolvedAttr =
            obj.defaultAttributes?.[attrIndex] ||
            originalSceneGraph.objects?.[objIndex]?.attributes?.[attrIndex] ||
            attr.replace(/[{}]/g, "");

          return resolvedAttr;
        }
        return attr;
      });

      delete obj.defaultAttributes;
    }
  });

  return result;
};