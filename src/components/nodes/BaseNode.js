import React, { useState, useEffect, useRef } from "react";
import { Handle, Position, useConnection, useReactFlow } from "@xyflow/react";
import {
  getClassNodeStyle,
  getInstanceNodeStyle,
} from "../../utils/node/nodeStyleUtils";
import { duplicateNodesWithMapping } from "../../utils/node/duplicateUtils";
import NodeToolbarMenu from "../nodeComponents/NodeToolbarMenu";
import DragHandle from "../nodeComponents/DragHandle";
import NodeHandles from "../nodeComponents/NodeHandles";
import LabelEditor from "../nodeComponents/LabelEditor";

export default function BaseNode({ id, data, nodeType }) {
  const { getNodes, setNodes } = useReactFlow();
  const label = data.hasValue ? data.hasValue : data.label;

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const inputRef = useRef(null);
  const nodeRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        nodeRef.current &&
        !nodeRef.current.contains(event.target) &&
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target)
      ) {
        setIsSelected(false);
        setIsEditing(false);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside, true);
    return () =>
      document.removeEventListener("pointerdown", handleClickOutside, true);
  }, []);

  useEffect(() => {
    if (isEditing) {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      });
    }
  }, [isEditing]);

  useEffect(() => {
    if (data.justCreated) {
      setTimeout(() => {
        setIsEditing(true);
      }, 0);
    }
  }, [data.justCreated]);

  const style =
    nodeType === "class"
      ? getClassNodeStyle(data.type, data)
      : getInstanceNodeStyle(data.type, data);

  const onDragStart = (e) => {};

  const handleLabelUpdateFixed = () => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                label: editLabel,
                hasValue: editLabel,
                justCreated: false,
              },
            }
          : node
      )
    );
    setIsEditing(false);
  };

  const handleLabelUpdateBlank = () => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                label: editLabel,
                hasValue: false,
              },
            }
          : node
      )
    );
    setIsEditing(false);
  };

  const handleDelete = () => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));
  };

  const handleDuplicateNode = () => {
    setNodes((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target) return prev;

      const { duplicated } = duplicateNodesWithMapping([target]);
      return [...prev, ...duplicated];
    });
  };

  return (
    <div
      ref={nodeRef}
      style={{ ...style, position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        setIsSelected(true);
        e.stopPropagation(); // ✅ prevents parent from hijacking the drag
        e.preventDefault(); // ✅ optional but helps prevent text selection, etc.
      }}
    >
      <NodeToolbarMenu
        ref={toolbarRef}
        isVisible={isSelected || isEditing}
        isEditing={isEditing}
        data={data} // 중요!
        position={Position.Top}
        style={{ top: "10px" }}
        onEditToggle={() => setIsEditing(true)}
        onSave={handleLabelUpdateFixed}
        onConvertBlank={handleLabelUpdateBlank}
        onDuplicate={handleDuplicateNode}
        onDelete={handleDelete}
      />
      <DragHandle
        position={{ left: "-15px", top: "5px" }}
        isVisible={isHovered}
      />

      <div
        className="nodrag"
        style={{
          width: "100%",
          height: "100%",
          overflow: "hidden", // ✅ 내부 넘침 방지
          display: "flex", // ✅ 수평 배치 및 자식 크기 제한
          alignItems: "center",
          // maxWidth: "100px",
        }}
        onMouseDown={onDragStart}
      >
        {isEditing ? (
          <LabelEditor
            ref={inputRef}
            type={data.type}
            label={editLabel}
            onChange={setEditLabel}
          />
        ) : (
          label
        )}
        <NodeHandles id={id} isSelected={isSelected} nodeType={data.type} />
      </div>
    </div>
  );
}
