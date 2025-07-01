import React, { memo, useState } from "react";
import {
  Handle,
  Position,
  useConnection,
  useReactFlow,
} from "@xyflow/react";
import { getInstanceNodeStyle } from "../../utils/node/nodeStyleUtils";
import { duplicateNodesWithMapping } from "../../utils/node/duplicateUtils";
import NodeToolbarMenu from "../NodeToolbarMenu";

function LayoutNode({ id, data }) {
  const {
    deleteElements,
    getNode,
    getNodes,
    setNodes,
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

  const handleDelete = () => {
    const nodes = getNodes(); // 전체 노드 받아오기
    const sharedId = data.sharedId ?? id;

    const nodesToDelete = nodes.filter(
      (n) => n.id === id || n.data?.sharedId === sharedId
    );

    deleteElements({ nodes: nodesToDelete });
  };

  const handleDuplicateNode = () => {
    setNodes((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target) return prev;

      const sharedId = target.data?.sharedId ?? id;
      const group = prev.filter(
        (n) => n.data?.sharedId === sharedId || n.id === id
      );

      const { duplicated } = duplicateNodesWithMapping(group, {
        sharedIdBase: sharedId,
      });

      return [...prev, ...duplicated];
    });
  };

  return (
    <div
      onMouseEnter={(e) => {
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeToolbarMenu
        isVisible={isHovered || isEditing}
        isEditing={isEditing}
        position={Position.Top}
        style={{ top: "10px" }}
        onEditToggle={() => setIsEditing(true)}
        onSave={handleLabelUpdate}
        onDuplicate={handleDuplicateNode}
        onDelete={handleDelete}
      />
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
