import { 
  deepCloneSceneGraph, 
  findSceneGraphDifferences, 
  applySceneGraphDifferences 
} from './SceneGraphUtils';
import { restorePlaceholdersFromTemplate } from './PlaceholderUtils';

export const createResolvedBaseSceneGraph = (
  classTemplateSceneGraph,
  originalInstanceSceneGraph,
  placeholders = {}
) => {
  return restorePlaceholdersFromTemplate(
    classTemplateSceneGraph,
    originalInstanceSceneGraph,
    placeholders
  );
};

export const calculateInstanceOverrides = (
  classTemplateSceneGraph,
  currentInstanceSceneGraph,
  originalInstanceSceneGraph,
  placeholders = {}
) => {
  const baseSceneGraph = createResolvedBaseSceneGraph(
    classTemplateSceneGraph,
    originalInstanceSceneGraph,
    placeholders
  );

  return findSceneGraphDifferences(baseSceneGraph, currentInstanceSceneGraph);
};

export const applyClassUpdatesToInstance = (
  classSceneGraph,
  overrides,
  originalSceneGraph,
  placeholders = {}
) => {
  let result = deepCloneSceneGraph(classSceneGraph);

  // placeholder를 원본 값으로 복원
  result.objects.forEach((obj, objIndex) => {
    // 객체 이름 처리
    if (obj.name && obj.name.includes("{") && obj.name.includes("}")) {
      const originalValue = 
        obj.defaultName ||
        originalSceneGraph.objects?.[objIndex]?.name ||
        obj.name.replace(/[{}]/g, "");

      obj.name = originalValue;

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
          const originalValue =
            obj.defaultAttributes?.[attrIndex] ||
            originalSceneGraph.objects?.[objIndex]?.attributes?.[attrIndex] ||
            attr.replace(/[{}]/g, "");

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

export const resetInstanceOverrides = (
  classTemplateSceneGraph,
  originalSceneGraph,
  placeholders = {}
) => {
  return applyClassUpdatesToInstance(
    classTemplateSceneGraph,
    {},
    originalSceneGraph,
    placeholders
  );
};