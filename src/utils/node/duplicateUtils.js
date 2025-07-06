import groupBy from "lodash/groupBy"; // 또는 직접 구현 가능

export function generateId(originalId) {
  return `${originalId}-${Math.random().toString(36).slice(2, 7)}`;
}

function extractLabelBase(label) {
  const match = label.match(/^(.*?)(?:\s(\d+))?$/);
  return match ? match[1] : label;
}

function getNextLabel(base, existingLabels) {
  const usedNumbers = new Set();

  existingLabels.forEach((label) => {
    const match = label.match(new RegExp(`^${base}(?:\\s(\\d+))?$`));
    if (match) {
      const num = match[1] ? parseInt(match[1], 10) : 0;
      usedNumbers.add(num);
    }
  });

  let i = 0;
  while (usedNumbers.has(i)) {
    i++;
  }

  return i === 0 ? base : `${base} ${i}`;
}

export function duplicateNodesWithMapping(
  nodes,
  {
    offset = { x: 20, y: 20 },
    parentNodeMap = {},
    sharedIdBase = undefined,
    existingLabels = [],
  } = {}
) {
  const idMap = {};
  const randomId = Math.random().toString(36).slice(2, 7);
  const newSharedId = sharedIdBase ? `${sharedIdBase}-${randomId}` : null;
  const usedLabels = new Set(existingLabels);

  // ✅ sharedId로 그룹핑 (없는 경우 id 기준)
  const groupMap = groupBy(nodes, (n) => n.data?.sharedId ?? n.id);

  const duplicated = [];

  for (const groupKey in groupMap) {
    const group = groupMap[groupKey];
    const representative = group.find((n) => n.data?.label); // 보이는 노드 기준
    const baseLabel = extractLabelBase(
      representative?.data?.label ?? "Untitled"
    );
    let uniqueLabel;
    const hasExistingLabels = existingLabels && existingLabels.length > 0;

    if (hasExistingLabels) {
      uniqueLabel = getNextLabel(baseLabel, Array.from(usedLabels));
      usedLabels.add(uniqueLabel);
    } else {
      uniqueLabel = `${baseLabel} (Copy)`;
    }

    const groupNode = group.find((n) => !n.parentNode);

    group.forEach((node) => {
      const newId = `${node.id}-${randomId}`;
      idMap[node.id] = newId;

      const position = node.position ?? { x: 0, y: 0 };
      const isChild = node.parentNode === groupNode?.id;

      const newData = {
        ...node.data,
        label: uniqueLabel, // ✅ 같은 라벨 공유
      };

      if (sharedIdBase) {
        newData.sharedId = newSharedId;
      }

      const duplicatedNode = {
        ...node,
        id: newId,
        position: {
          x: position.x + offset.x,
          y: position.y + offset.y,
        },
        data: newData,
        style: {
          ...node.style,
        },
      };

      if (node.parentNode && isChild) {
        duplicatedNode.parentNode = idMap[node.parentNode];
        duplicatedNode.extent = "parent";
      }

      duplicated.push(duplicatedNode);
    });
  }

  return { duplicated, idMap, randomId };
}

export function duplicateEdges(edges, idMap, randomId) {
  return edges
    .filter((e) => idMap[e.source] && idMap[e.target])
    .map((edge) => ({
      ...edge,
      id: `${edge.id}-${randomId}`,
      source: idMap[edge.source],
      target: idMap[edge.target],
    }));
}
