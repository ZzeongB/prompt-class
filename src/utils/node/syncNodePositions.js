// src/utils/syncNodePositions.js

export function syncMovedNodePositions({ changes, prevNodes, edges }) {
    let updatedNodes = [...prevNodes];
  
    changes.forEach((change) => {
      if (change.type === "position" && change.position) {
        const movedNode = prevNodes.find((n) => n.id === change.id);
        if (!movedNode?.data?.sharedId) return;
  
        const sharedId = movedNode.data.sharedId;
  
        const delta = {
          x: change.position.x - movedNode.position.x,
          y: change.position.y - movedNode.position.y,
        };
  
        updatedNodes = updatedNodes.map((node) => {
          // 👉 sharedId 기준 resizable 이동
          if (
            node.data?.sharedId === sharedId &&
            node.id !== movedNode.id
          ) {
            const isResizable = node.id.endsWith("resizable");
            return {
              ...node,
              position: {
                x: change.position.x,
                y: change.position.y + (isResizable ? 30 : -30),
              },
            };
          }
  
          // 👉 연결된 attribute 이동
          if (
            node.data?.type === "attribute" &&
            edges.some(
              (e) =>
                e.source === movedNode.id &&
                e.target === node.id &&
                e.label === "property"
            )
          ) {
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
  