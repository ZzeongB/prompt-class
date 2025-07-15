// components/InstanceTree.jsx

import React, { useState } from "react";
import { buildTree } from "../utils/tree/buildTree";
import TreeNode from "./TreeNode";

// 전체 트리 렌더링
export default function InstanceTree({
  nodes,
  edges,
  editedLabelMap,
  setEditedLabelMap,
  setNodes,
  highlight,
  setHighlight,
}) {
  const treeData = buildTree(nodes, edges);

  const handleLabelChange = (nodeId, newLabel) => {
    const newEditedLabelMap = { ...editedLabelMap };
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      const instanceId = node.data.instanceId;
      const originalClassId = node.data.originalClassId;
      newEditedLabelMap[instanceId] ??= {};
      newEditedLabelMap[instanceId][originalClassId] = newLabel;
    }

    setEditedLabelMap(newEditedLabelMap);
  };

  return (
    <div style={{ margin: 10 }}>
      {treeData.map((rootNode) => (
        <TreeNode
          key={rootNode.id}
          node={rootNode}
          onLabelChange={handleLabelChange}
          highlight={highlight}
          setHighlight={setHighlight}
        />
      ))}
    </div>
  );
}
