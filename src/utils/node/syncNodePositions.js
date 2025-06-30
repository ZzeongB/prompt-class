// src/utils/syncNodePositions.js

export function syncMovedNodePositions({ changes, prevNodes, edges }) {
  let updatedNodes = [...prevNodes];

  changes.forEach((change) => {
    if (change.type === "position" && change.position) {
      const movedNode = prevNodes.find((n) => n.id === change.id);
      if (!movedNode) return;

      const delta = {
        x: change.position.x - movedNode.position.x,
        y: change.position.y - movedNode.position.y,
      };

      const sharedId = movedNode.data?.sharedId;

      // 💡 1. position 연결된 노드들 (단방향)
      const positionLinkedEdges = edges.filter(
        (e) =>
          e.label === "position" &&
          (e.source === movedNode.id || e.target === movedNode.id)
      );

      // 💡 2. 연결된 노드들의 sharedId 수집
      const linkedSharedIds = positionLinkedEdges
        .map((e) => {
          const otherNodeId =
            e.source === movedNode.id ? e.target : e.source;
          const otherNode = prevNodes.find((n) => n.id === otherNodeId);
          return otherNode?.data?.sharedId;
        })
        .filter((id) => !!id); // null 제거

      updatedNodes = updatedNodes.map((node) => {
        const isSameSharedId = node.data?.sharedId === sharedId && node.id !== movedNode.id;

        const isLinkedBySharedId =
          linkedSharedIds.includes(node.data?.sharedId);

        const isAttributeLinked =
          node.data?.type === "attribute" &&
          edges.some(
            (e) =>
              e.source === movedNode.id &&
              e.target === node.id &&
              e.label === "property"
          );

        if (isSameSharedId || isLinkedBySharedId || isAttributeLinked) {
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

// export function syncParentChildNodePositions({ changes, prevNodes }) {
//   let updatedNodes = [...prevNodes];

//   changes.forEach((change) => {
//     if (change.type === "position" && change.position) {
//       const movedNode = prevNodes.find((n) => n.id === change.id);
//       if (!movedNode) return;

//       const delta = {
//         x: change.position.x - movedNode.position.x,
//         y: change.position.y - movedNode.position.y,
//       };

//       updatedNodes = updatedNodes.map((node) => {
//         // 🎯 parentNode 기준으로 동기화
//         if (node.parentNode === movedNode.id) {
//           return {
//             ...node,
//             position: {
//               x: node.position.x + delta.x,
//               y: node.position.y + delta.y,
//             },
//           };
//         }

//         return node;
//       });
//     }
//   });

//   return updatedNodes;
// }

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
