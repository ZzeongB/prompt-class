import React, { useState, useEffect, useRef } from "react";
import {
  Handle,
  Position,
  useConnection,
  useReactFlow,
  NodeToolbar,
} from "@xyflow/react";
import { useDnD } from "../context/DragAndDropContext";
import {
  getClassNodeStyle,
  getInstanceNodeStyle,
} from "../utils/node/nodeStyleUtils";
import HoverButton from "./HoverButton";
import { duplicateNodesWithMapping } from "../utils/node/duplicateUtils";

export default function BaseNode({ id, data, nodeType }) {
  const { getNodes, setNodes } = useReactFlow();
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;
  const label = data.hasValue ? data.hasValue : data.label;

  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [isHovered, setIsHovered] = useState(false);
  const [editMode, setEditMode] = useState("fixed"); // 'fixed' or 'blank'

  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  useEffect(() => {
    if (data.justCreated) {
      setIsEditing(true);
    }
  }, [data.justCreated]);
  const style =
    nodeType === "class"
      ? getClassNodeStyle(data.type, data)
      : getInstanceNodeStyle(data.type, data);

  // const [, setId, , setType, , setPosition, , setLabel, , setDragSource] =
  //   useDnD();
  const onDragStart = (e) => {
    // if (e.target.closest(".drag-handle") || e.target.closest(".classHandle"))
    //   return;
    // setType(data.type);
    // setLabel(data.label);
    // setId(id);
    // setDragSource(nodeType);
    // const onMouseMove = (e) => setPosition({ x: e.clientX, y: e.clientY });
    // const onMouseUp = () => {
    //   setType(null);
    //   document.removeEventListener("mousemove", onMouseMove);
    //   document.removeEventListener("mouseup", onMouseUp);
    // };
    // document.addEventListener("mousemove", onMouseMove);
    // document.addEventListener("mouseup", onMouseUp);
  };

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
      style={{ ...style, position: "relative" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeToolbar
        isVisible={isHovered || isEditing}
        position={Position.Top}
        style={{ top: "10px", display: "flex", gap: "2px" }}
      >
        {/* ✏️ or 💾 */}
        <HoverButton
          title={isEditing ? "Save as fixed value" : "Edit label"}
          icon={isEditing ? "💾" : "✏️"}
          onClick={
            isEditing ? handleLabelUpdateFixed : () => setIsEditing(true)
          }
        />

        {/* 🌀 Blank attribute로 전환 */}
        {data.type === "attribute" && isEditing && (
          <HoverButton
            title="Convert to blank attribute"
            icon="🌀"
            onClick={handleLabelUpdateBlank}
          />
        )}
        <HoverButton
          title="Duplicate node"
          icon="📄"
          onClick={handleDuplicateNode}
        />
        {/* 🗑 Delete */}
        <HoverButton
          title="Delete node"
          icon="🗑"
          onClick={handleDelete}
          danger
        />
      </NodeToolbar>

      <div
        className="drag-handle"
        style={{
          cursor: "move",
          position: "absolute",
          left: "-15px",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "0 3px 0 3px",
          zIndex: 10,
        }}
      >
        ⠿
      </div>

      <div
        className="nodrag"
        style={{ width: "100%", height: "100%" }}
        onMouseDown={onDragStart}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            style={{ width: "90%", fontSize: "14px" }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          label
        )}

        {!connection.inProgress && (
          <Handle
            className="classHandle"
            position={Position.Right}
            type="source"
            style={{ top: "50%", transform: "translateY(-50%)", right: "-8px" }}
          />
        )}
        {(!connection.inProgress || isTarget) && (
          <Handle
            className="classHandle"
            position={Position.Right}
            type="target"
            isConnectableStart={false}
            style={{ top: "50%", transform: "translateY(-50%)", right: "-8px" }}
          />
        )}
      </div>
    </div>
  );
}
