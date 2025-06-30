// src/utils/syncNodePositions.js

export function syncMovedNodePositions({ changes, prevNodes, edges }) {
  let updatedNodes = [...prevNodes];

  // 🔁 position 핸들로 연결된 노드 id 찾기
  const getPositionLinkedNodeIds = (nodeId) => {
    const connected = edges.filter(
      (e) => e.label === "position" && (e.source === nodeId || e.target === nodeId)
    );

    const relatedIds = new Set();
    connected.forEach((e) => {
      if (e.source !== nodeId) relatedIds.add(e.source);
      if (e.target !== nodeId) relatedIds.add(e.target);
    });

    return [...relatedIds];
  };

  // 🔁 특정 노드의 sharedId 그룹 id들 추출
  const getSharedIdGroup = (targetSharedId, excludeId) =>
    prevNodes
      .filter((n) => n.data?.sharedId === targetSharedId && n.id !== excludeId)
      .map((n) => n.id);

  changes.forEach((change) => {
    if (change.type === "position" && change.position) {
      const movedNode = prevNodes.find((n) => n.id === change.id);
      if (!movedNode) return;

      const delta = {
        x: change.position.x - movedNode.position.x,
        y: change.position.y - movedNode.position.y,
      };

      const sharedId = movedNode.data?.sharedId;
      const positionLinkedNodeIds = getPositionLinkedNodeIds(movedNode.id);

      // 1️⃣ 이동할 노드 ID들 초기화
      const idsToMove = new Set();

      // 2️⃣ sharedId로 연결된 그룹
      if (sharedId) {
        getSharedIdGroup(sharedId, movedNode.id).forEach((id) => idsToMove.add(id));
      }

      // 3️⃣ position edge로 연결된 노드 + 그들의 sharedId 그룹까지
      positionLinkedNodeIds.forEach((linkedId) => {
        idsToMove.add(linkedId);
        const linkedNode = prevNodes.find((n) => n.id === linkedId);
        if (linkedNode?.data?.sharedId) {
          getSharedIdGroup(linkedNode.data.sharedId, linkedId).forEach((id) =>
            idsToMove.add(id)
          );
        }
      });

      // 4️⃣ attribute 노드 처리도 포함
      const attributeTargetIds = edges
        .filter(
          (e) =>
            e.label === "property" &&
            e.source === movedNode.id
        )
        .map((e) => e.target);

      attributeTargetIds.forEach((id) => idsToMove.add(id));

      // 5️⃣ 실제 이동
      updatedNodes = updatedNodes.map((node) => {
        if (node.id === movedNode.id) return node; // 본인은 제외

        if (idsToMove.has(node.id)) {
          return {
            ...node,
            position: {
              x: node.position.x + delta.x,
              y: node.position.y + delta.y,
            },
          };
        }

        return node;
      });
    }
  });

  return updatedNodes;
}

export function syncParentChildNodePositions({ changes, prevNodes }) {
  let updatedNodes = [...prevNodes];

  // 재귀적으로 자식 노드 수집하는 헬퍼
  function collectDescendants(parentId, allNodes) {
    const directChildren = allNodes.filter((n) => n.parentNode === parentId);
    const allDescendants = [...directChildren];

    for (const child of directChildren) {
      allDescendants.push(...collectDescendants(child.id, allNodes));
    }

    return allDescendants;
  }

  changes.forEach((change) => {
    if (change.type === "position" && change.position) {
      const movedNode = prevNodes.find((n) => n.id === change.id);
      if (!movedNode) return;

      const delta = {
        x: change.position.x - movedNode.position.x,
        y: change.position.y - movedNode.position.y,
      };

      const descendants = collectDescendants(movedNode.id, updatedNodes);

      updatedNodes = updatedNodes.map((node) => {
        if (descendants.some((desc) => desc.id === node.id)) {
          return {
            ...node,
            position: {
              x: node.position.x + delta.x,
              y: node.position.y + delta.y,
            },
            positionAbsolute: {
              x: node.position.x + delta.x,
              y: node.position.y + delta.y,
            },
          };
        }
        return node;
      });
    }
  });

  return updatedNodes;
}
