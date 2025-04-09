export function promptForNodeLabel(defaultLabel) {
  const label = prompt("노드 이름을 입력하세요:", defaultLabel);
  return label ?? defaultLabel;
}

export function createRelationshipNode({
  sourceNode,
  targetNode,
  position,
  nodeCount,
}) {
  const id = `rel-${nodeCount}`;
  const label = promptForNodeLabel(id);

  const newNode = {
    id,
    type: "class",
    position,
    data: { label, type: "relationship" },
    origin: [0.5, 0.5],
  };

  const newEdges = [
    {
      id: `${sourceNode.id}-${id}`,
      source: sourceNode.id,
      target: id,
      label: "from",
    },
    {
      id: `${id}-${targetNode.id}`,
      source: id,
      target: targetNode.id,
      label: "to",
    },
  ];

  return { newNode, newEdges };
}
