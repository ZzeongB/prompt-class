import React, { memo } from "react";
import {
  Handle,
  Position,
  useConnection,
  NodeToolbar,
  useReactFlow,
  useNodesState,
} from "@xyflow/react";
import { getInstanceNodeStyle } from "../utils/node/nodeStyleUtils";
import {handleObjectLayoutSave, handleRelationshipLayoutSave} from "../utils/layout/handleLayoutSave";

function InstanceNode({ id, data }) {
  const {
    deleteElements,
    getNode,
    getNodes,
    setNodes,
    addEdges,
    flowToScreenPosition,
  } = useReactFlow();

  const connection = useConnection();
  const style = getInstanceNodeStyle(data.type, data); // 💡 type 기반 스타일 적용
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  const label = data.label;

  return (
    <div>
      <NodeToolbar isVisible={"enabled"}>
        {data.type !== "attribute" && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (data.type === "object") {
                handleObjectLayoutSave(id, getNode, setNodes, addEdges);
              } else if (data.type === "relationship") {
                handleRelationshipLayoutSave(id, data, getNode, setNodes);
              }
            }}
          >
            Save layout
          </button>
        )}

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => deleteElements({ nodes: [{ id }] })}
        >
          Delete node
        </button>
      </NodeToolbar>

      <div style={style}>{label}</div>
      {!connection.inProgress && (
        <Handle
          className="classHandle"
          position={Position.Right}
          type="source"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation(); // 선택적으로 이벤트 버블링도 차단
          }}
        />
      )}
      {(!connection.inProgress || isTarget) && (
        <Handle
          className="classHandle"
          position={Position.Right}
          type="target"
          isConnectableStart={false}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation(); // 선택적으로 이벤트 버블링도 차단
          }}
        />
      )}
    </div>
  );
}

export default memo(InstanceNode);
