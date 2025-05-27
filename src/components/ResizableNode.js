import React, { memo } from "react";
import { NodeResizer } from "@xyflow/react";
import { OBJ_COLOR, ATTR_COLOR, REL_COLOR } from "../utils/constants";

function ResizableNode({ data  }) {
  return (
    <div>
      <NodeResizer
        color={
          data.type === "object" || data.type === "object-group"
            ? OBJ_COLOR
            : data.type === "attribute" || data.type === "attribute-group"
            ? ATTR_COLOR
            : REL_COLOR
        }
        minWidth={30}
        minHeight={30}
      />
      <div style={{ visibility: "hidden", height: "1em" }}>
        {/* hidden but ensures node keeps height */}
        {data.label}
      </div>
    </div>
  );
}

export default memo(ResizableNode);
