import React, { memo } from "react";
import {
  NodeResizer,
  NodeToolbar,
  useReactFlow,
} from "@xyflow/react";
import { EDGE_COLOR } from "../utils/constants";
import { generateDescription } from "../api/generateDescription";
import { useImage } from "../context/ImageContext";
import { getNormalizedBox } from "../utils/node/getNormalizedBox";

function TempResizableNode({ id, data, width, height }) {
  const { deleteElements, getNode, flowToScreenPosition } = useReactFlow();
  const node = getNode(id);

  const crop_box = getNormalizedBox(
    node,
    flowToScreenPosition,
    500,
    0, 
    false
  );

  const { image, globalCaption } = useImage();
  return (
    <div>
      <NodeToolbar isVisible={true}>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => {
            generateDescription(image, crop_box, globalCaption);
          }}
        >
          Describe
        </button>
        <button onMouseDown={(e) => e.stopPropagation()}>
          Remove from image
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => deleteElements({ nodes: [{ id }] })}
        >
          Delete
        </button>
      </NodeToolbar>
      <NodeResizer color={EDGE_COLOR} minWidth={30} minHeight={30} />
      <div style={{ visibility: "hidden", height: "1em" }}>{data.label}</div>
    </div>
  );
}

export default memo(TempResizableNode);
