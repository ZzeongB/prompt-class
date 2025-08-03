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

  // 기본값을 originalSceneGraph에서 복원 (오버라이드되지 않은 경우만)
  result.objects.forEach((obj, objIndex) => {
    // 객체 이름 처리 - ID 기반으로 오버라이드 확인
    if (obj.name) {
      const hasNameOverride = overrides?.objects?.[obj.id]?.name !== undefined;

      let resolvedValue;
      if (hasNameOverride) {
        // 오버라이드가 있으면 오버라이드 값 사용
        resolvedValue = overrides.objects[obj.id].name;
      } else {
        // 오버라이드가 없으면 originalSceneGraph의 값 사용 (기본값)
        const originalObj = originalSceneGraph?.objects?.find(o => o.id === obj.id) ||
          originalSceneGraph?.objects?.[objIndex];
        resolvedValue = originalObj?.name || obj.defaultName || obj.name;
      }

      obj.name = resolvedValue;

      // 메타데이터 정리
      delete obj.defaultName;
      delete obj.isPlaceholder;
      delete obj.placeholderId;
      delete obj.placeholderCategory;
    }

    // attributes 처리 - ID 기반으로 오버라이드 확인
    if (obj.attributes && Array.isArray(obj.attributes)) {
      const originalObj = originalSceneGraph?.objects?.find(o => o.id === obj.id) ||
        originalSceneGraph?.objects?.[objIndex];

      obj.attributes = obj.attributes.map((attr, attrIndex) => {
        if (typeof attr === "string") {
          const hasAttrOverride = overrides?.objects?.[obj.id]?.attributes?.[attrIndex] !== undefined;

          let resolvedValue;
          if (hasAttrOverride) {
            // 오버라이드가 있으면 오버라이드 값 사용
            resolvedValue = overrides.objects[obj.id].attributes[attrIndex];
          } else {
            // 오버라이드가 없으면 originalSceneGraph의 값 사용 (기본값)
            resolvedValue = originalObj?.attributes?.[attrIndex] ||
              obj.defaultAttributes?.[attrIndex] ||
              attr;
          }

          return resolvedValue;
        }
        return attr;
      });

      delete obj.defaultAttributes;
    }
  });

  // override된 부분 적용 (추가 오버라이드가 있을 수 있음)
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