function getNodeDepth(node, nodes, memo = new Map()) {
  if (!node.parentNode) return 0;
  if (memo.has(node.id)) return memo.get(node.id);

  const parent = nodes.find((n) => n.id === node.parentNode);
  const depth = parent ? getNodeDepth(parent, nodes, memo) + 1 : 0;
  memo.set(node.id, depth);
  return depth;
}

export function sortNodesByDepth(nodes) {
  const memo = new Map();
  const withDepth = nodes.map((n) => {
    const depth = getNodeDepth(n, nodes, memo);
    return { ...n, style: { ...(n.style || {}), zIndex: depth } }; // ✅ zIndex 부여
  });

  return withDepth.sort((a, b) => {
    const depthA = getNodeDepth(a, nodes, memo);
    const depthB = getNodeDepth(b, nodes, memo);
    return depthA - depthB;
  });
}
