// src/utils/nodeCreateUtils.js

import { promptForNodeLabel } from "./nodeConnectUtils";

export function createNewObjectNode({ position, currentNodeCount }) {
  const defaultId = `object-${currentNodeCount}`;
  const label = promptForNodeLabel(defaultId);
  if (!label) return null;

  return {
    id: defaultId,
    type: "class",
    position,
    origin: [0.5, 0.5],
    data: {
      label,
      type: "object",
    },
  };
}
