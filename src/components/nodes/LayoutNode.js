import React, { memo, useState } from "react";
import { Handle, Position, useConnection, useReactFlow } from "@xyflow/react";
import { getInstanceNodeStyle } from "../../utils/node/nodeStyleUtils";
import { duplicateNodesWithMapping } from "../../utils/node/duplicateUtils";
import { useInstanceGraph } from "../../context/InstanceGraphContext";
import NodeToolbarMenu from "../nodeComponents/NodeToolbarMenu";
import NodeHandles from "../nodeComponents/NodeHandles";

function LayoutNode({ id, data }) {
  const { deleteElements, getNodes, setNodes } = useReactFlow();

  const style = getInstanceNodeStyle(data.type, data); // 💡 type 기반 스타일 적용

  const label = data.label;

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const { setInstanceNodes, setInstanceEdges } = useInstanceGraph();

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

      const updated = [...prev, ...duplicated];
      setInstanceNodes(updated);
      return updated;
    });
  };

  return (
    <div
      onMouseEnter={(e) => {
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        setIsSelected((prev) => !prev);
        e.stopPropagation(); // ✅ prevents parent from hijacking the drag
        e.preventDefault(); // ✅ optional but helps prevent text selection, etc.
      }}
    >
      <NodeToolbarMenu
        isVisible={isSelected || isEditing}
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
      <NodeHandles id={id} isSelected={isSelected} nodeType={data.type} />
    </div>
  );
}

export default memo(LayoutNode);
