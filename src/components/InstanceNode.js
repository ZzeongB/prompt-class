import React, { memo } from "react";
import { Handle, Position, useConnection } from "@xyflow/react";
import { getInstanceNodeStyle } from "../utils/node/nodeStyleUtils";

function InstanceNode({ id, data, selected }) {
  const connection = useConnection();
  const style = getInstanceNodeStyle(data.type, data); // 💡 type 기반 스타일 적용
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  const label = data.label;

  return (
    <div>
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
