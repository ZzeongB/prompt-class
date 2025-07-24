import { v4 as uuidv4 } from "uuid";

export const transformTreeToSceneGraph = (tree) => {
  const objects = [];
  const relationships = [];

  const buildSceneGraph = (
    node,
    parentObjectId = null,
    relationLabel = null
  ) => {
    if (!node || node.data.type !== "object") return null;

    const objectId = `object-${uuidv4()}`;
    const object = {
      id: objectId,
      name: node.data.label,
      attributes: [],
    };

    // attribute children
    node.children?.forEach((child) => {
      if (child.data.type === "attribute") {
        object.attributes.push(child.data.label);
      }
    });

    objects.push(object);

    // relationship children
    node.children?.forEach((child) => {
      if (child.data.type === "relationship") {
        const targetObjectNode = child.children?.find(
          (c) => c.data.type === "object"
        );
        if (targetObjectNode) {
          const targetObjId = buildSceneGraph(targetObjectNode); // 재귀로 하위 object도 탐색
          relationships.push({
            source: objectId,
            target: targetObjId,
            relation: child.data.label,
          });
        }
      }
    });

    return objectId;
  };

  const rootObjectId = buildSceneGraph(tree);

  return {
    root: rootObjectId,
    objects,
    relationships,
  };
};
