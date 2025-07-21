// ✅ Attribute 관련 함수 분리
export function getAttributeValue(attrLabel, filledAttrMap, instanceId, attrId) {
  const existingValue = filledAttrMap?.[instanceId]?.[attrId];
  if (existingValue) return existingValue;

  const inputValue = prompt(`${attrLabel} 값을 입력하세요`);
  if (!inputValue) return null;

  filledAttrMap[instanceId] ??= {};
  filledAttrMap[instanceId][attrId] = inputValue;

  return inputValue;
}

export function createAttributeNode(attr, position, sharedId, instanceId, filledAttrMap, updatedAt) {
  const inputValue = getAttributeValue(attr.data.label, filledAttrMap, instanceId, attr.id);
  if (!inputValue) return null;

  return {
    id: `${sharedId}-attr-${attr.data.label}`,
    type: "instance",
    position: { x: position.x + Math.random() * 10, y: position.y - 40 },
    data: {
      label: attr.data.label,
      type: "attribute",
      hasValue: inputValue,
      value: inputValue,
      instanceId,
    },
    updatedAt,
  };
}

export function getConnectedAttributes(classNode, classNodes, classEdges) {
  if (!classNode) return [];
  return classEdges
    .filter((e) => e.source === classNode.id || e.target === classNode.id)
    .map((e) => classNodes.find((n) => n.id === (e.source === classNode.id ? e.target : e.source)))
    .filter((n) => n?.data?.type === "attribute");
}
