import React, { memo, useState } from "react";
import {
  Handle,
  Position,
  useConnection,
  NodeToolbar,
  useReactFlow,
  useNodesState,
} from "@xyflow/react";
import { getInstanceNodeStyle } from "../utils/node/nodeStyleUtils";
import {
  handleObjectLayoutSave,
  handleRelationshipLayoutSave,
} from "../utils/layout/handleLayoutSave";

function LayoutNode({ id, data }) {
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

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [isHovered, setIsHovered] = useState(false);

  const handleLabelUpdate = () => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: { ...node.data, label: editLabel, hasValue: editLabel },
            }
          : node
      )
    );
    setIsEditing(false);
  };
  return (
    <div
      onMouseEnter={(e) => {
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeToolbar
        isVisible={isHovered || isEditing}
        position={Position.Top}
        style={{ top: "10px" }}
      >
        {!isEditing ? (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit
          </button>
        ) : (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleLabelUpdate}
          >
            💾 Save
          </button>
        )}
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

      <div style={style}>
        {isEditing ? (
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            style={{ width: "90%", fontSize: "14px" }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          label
        )}
      </div>
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

export default memo(LayoutNode);
