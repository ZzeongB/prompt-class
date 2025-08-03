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

  resolved.objects.forEach((obj, objIndex) => {
    // 객체 이름 처리
    if (obj.name && obj.name.includes("{") && obj.name.includes("}")) {
      const key = obj.name.replace(/[{}]/g, "");
      const newValue = values[key] || obj.defaultName || key;
      
      if (values[key] && values[key] !== (obj.defaultName || key)) {
        if (!overrides.objects) overrides.objects = {};
        if (!overrides.objects[obj.id]) overrides.objects[obj.id] = {};
        overrides.objects[obj.id].name = values[key];
        hasOverrides = true;
      }
      
      obj.name = newValue;
      delete obj.defaultName;
      delete obj.isPlaceholder;
      delete obj.placeholderId;
      delete obj.placeholderCategory;
    }

    // attributes 처리
    if (obj.attributes && Array.isArray(obj.attributes)) {
      obj.attributes = obj.attributes.map((attr, attrIndex) => {
        if (
          typeof attr === "string" &&
          attr.includes("{") &&
          attr.includes("}")
        ) {
          const key = attr.replace(/[{}]/g, "");

          let value = values[key];

          if (value === undefined && obj.defaultAttributes) {
            value = obj.defaultAttributes[attrIndex];
          }

          const finalValue = value !== undefined ? value : key;
          
          if (values[key] && values[key] !== (obj.defaultAttributes?.[attrIndex] || key)) {
            if (!overrides.objects) overrides.objects = {};
            if (!overrides.objects[obj.id]) overrides.objects[obj.id] = {};
            if (!overrides.objects[obj.id].attributes) overrides.objects[obj.id].attributes = {};
            overrides.objects[obj.id].attributes[attrIndex] = values[key];
            hasOverrides = true;
          }

          return finalValue;
        }
        return attr;
      });

      delete obj.defaultAttributes;
    }
  });

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