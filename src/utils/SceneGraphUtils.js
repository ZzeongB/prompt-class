import { v4 as uuidv4 } from "uuid";

export const deepCloneSceneGraph = (sceneGraph) => {
  if (!sceneGraph || !sceneGraph.objects) {
    return { objects: [], relationships: [] };
  }

  const newObjects = sceneGraph.objects.map((obj) => ({
    id: obj.id,
    name: obj.name,
    attributes: [...(obj.attributes || [])],
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

  return {
    objects: newObjects,
    relationships: newRelationships,
  };
};

export const deepCloneSceneGraphWithNewIds = (sceneGraph) => {
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

export const findSceneGraphDifferences = (original, current) => {
  const differences = {};

  if (!original.objects || !current.objects) {
    return differences;
  }

  if (original.objects.length !== current.objects.length) {
    differences["structure"] = "modified";
  }

  original.objects.forEach((originalObj, index) => {
    const currentObj = current.objects[index];

    if (!currentObj) {
      return;
    }

    if (originalObj.name !== currentObj.name) {
      differences[`objects.${index}.name`] = currentObj.name;
    }

    const originalAttrs = originalObj.attributes || [];
    const currentAttrs = currentObj.attributes || [];

    if (originalAttrs.length !== currentAttrs.length) {
      differences[`objects.${index}.attributes`] = currentAttrs;
    } else {
      originalAttrs.forEach((originalAttr, attrIndex) => {
        const currentAttr = currentAttrs[attrIndex];

        if (currentAttr !== undefined && originalAttr !== currentAttr) {
          differences[`objects.${index}.attributes.${attrIndex}`] = currentAttr;
        }
      });
    }
  });

  return differences;
};

export const applySceneGraphDifferences = (baseSceneGraph, differences) => {
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
      // 구조적 변경인 경우 특별한 처리가 필요할 수 있음
    }
  });

  return result;
};

export const generateSceneGraphTextDescription = async (sceneGraph) => {
  try {
    const { generateSceneGraphToText } = await import(
      "../api/generateTextToGraph"
    );
    return await generateSceneGraphToText({
      newSceneGraph: sceneGraph,
    });
  } catch (error) {
    console.error("Failed to generate text description from sceneGraph:", error);
    return "";
  }
};