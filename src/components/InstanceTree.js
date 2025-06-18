// components/InstanceTree.jsx

import React, { useState } from 'react';
import { buildTree } from '../utils/tree/buildTree';
import TreeNode from './TreeNode';

// 전체 트리 렌더링
export default function InstanceTree({ nodes, edges }) {
  const treeData = buildTree(nodes, edges);

  return (
    <div style={{margin: 10}}>
      {treeData.map(rootNode => (
        <TreeNode key={rootNode.id} node={rootNode} />
      ))}
    </div>
  );
}
