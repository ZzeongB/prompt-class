import { v4 as uuidv4 } from "uuid";

export const transformSceneGraphToTree = (sceneGraph, instanceLabel) => {
  const { root: rootId, objects, relationships } = sceneGraph;

  // 방어 코드 추가
  if (!objects || objects.length === 0) {
    return {
      id: "root",
      data: {
        label: instanceLabel || "Scene",
        type: "object",
      },
      children: [],
    };
  }

  const objectMap = new Map(objects.map((o) => [o.id, o]));

  const relationshipMap = relationships.reduce((map, rel) => {
    if (!map.has(rel.source)) map.set(rel.source, []);
    map.get(rel.source).push(rel);
    return map;
  }, new Map());

  const builtTrees = new Map();

  const buildTree = (objectId, visited = new Set()) => {
    if (!objectMap.has(objectId)) return null;
    if (visited.has(objectId)) return null; // 순환 방지
    if (builtTrees.has(objectId)) return builtTrees.get(objectId);

    // 방문 표시를 복사본으로 만들어서 각 재귀 경로마다 독립적으로 관리
    const newVisited = new Set(visited);
    newVisited.add(objectId);

    const object = objectMap.get(objectId);

    const attrChildren = (object.attributes || []).map((attr) => ({
      id: uuidv4(),
      data: { label: attr, type: "attribute" },
      children: [],
    }));

    const relationshipChildren = (relationshipMap.get(objectId) || []).map(
      (rel) => {
        const targetTree = buildTree(rel.target, newVisited);
        return {
          id: uuidv4(),
          data: { label: rel.relation, type: "relationship" },
          children: targetTree ? [targetTree] : [],
        };
      }
    );

    const treeNode = {
      id: uuidv4(),
      data: { label: object.name, type: "object" },
      children: [...attrChildren, ...relationshipChildren],
    };

    builtTrees.set(objectId, treeNode);
    return treeNode;
  };

  // root가 있으면 root부터 시작, 없으면 첫 번째 object부터 시작
  const actualRootId = rootId || objects[0]?.id;
  const rootTree = buildTree(actualRootId);

  if (!rootTree) {
    return {
      id: "root",
      data: {
        label: instanceLabel || "Scene",
        type: "object",
      },
      children: [],
    };
  }

  // 최종 루트 노드 생성 - 기존 로직 간소화
  return {
    id: "root",
    data: {
      label: rootTree.data.label,
      type: "object",
    },
    children: rootTree.children,
  };
};
