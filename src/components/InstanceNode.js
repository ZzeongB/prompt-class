import React, { memo } from "react";
import {
  Handle,
  Position,
  useConnection,
  NodeResizer,
  NodeToolbar,
} from "@xyflow/react";
import { getInstanceNodeStyle } from "../utils/nodeStyleUtil";
import { OBJ_COLOR, ATTR_COLOR, REL_COLOR } from "../utils/constants";

function InstanceNode({ id, data, selected }) {
  const connection = useConnection();
  const style = getInstanceNodeStyle(data.type, data); // 💡 type 기반 스타일 적용
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  const label = data.label;

  return (
    <div>
      {/* <NodeToolbar isVisible={selected} position={data.toolbarPosition}>
        <div style={style}>{label}</div>
      </NodeToolbar> */}
      {/* {(
        <NodeResizer
          color={
            data.type === "object"
              ? OBJ_COLOR
              : data.type === "attribute"
              ? ATTR_COLOR
              : REL_COLOR
          }
          // isVisible={selected}
          minWidth={30}
          minHeight={30}
        />
      )} */}
      <div style={style}>{label}</div>

      {!connection.inProgress && (
        <Handle
          className="classHandle"
          position={Position.Right}
          type="source"
        />
      )}
      {(!connection.inProgress || isTarget) && (
        <Handle
          className="classHandle"
          position={Position.Right}
          type="target"
          isConnectableStart={false}
        />
      )}
    </div>
  );
}

export default memo(InstanceNode);
