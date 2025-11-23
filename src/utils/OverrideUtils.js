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

  // override가 있으면 override 값 사용, 없으면 class template의 현재 값 사용
  result.objects.forEach((obj, objIndex) => {
    // 객체 이름 처리 - ID 기반으로 오버라이드 확인
    if (obj.name) {
      const hasNameOverride = overrides?.objects?.[obj.id]?.name !== undefined;

      let resolvedValue;
      if (hasNameOverride) {
        // 오버라이드가 있으면 오버라이드 값 사용
        resolvedValue = overrides.objects[obj.id].name;
      } else {
        // 오버라이드가 없으면 class template의 현재 값 사용
        resolvedValue = obj.name;
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
      obj.attributes = obj.attributes.map((attr, attrIndex) => {
        if (typeof attr === "string") {
          const hasAttrOverride = overrides?.objects?.[obj.id]?.attributes?.[attrIndex] !== undefined;

          let resolvedValue;
          if (hasAttrOverride) {
            // 오버라이드가 있으면 오버라이드 값 사용
            const overrideValue = overrides.objects[obj.id].attributes[attrIndex];
            if (overrideValue === "DELETE") {
              // DELETE 마커는 null로 처리하여 렌더링에서 제외
              return null;
            }
            resolvedValue = overrideValue;
          } else {
            // 오버라이드가 없으면 class template의 현재 값 사용
            resolvedValue = attr;
          }

          return resolvedValue;
        }
        return attr;
      }).filter(attr => attr !== null); // DELETE로 표시된 것들(null) 제거

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